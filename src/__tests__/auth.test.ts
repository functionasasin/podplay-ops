// Tests: useAuth hook — auth context behavior
// Mocks the Supabase client to control auth state events

import { renderHook, act } from '@testing-library/react';
import type { Session, User } from '@supabase/supabase-js';
import React from 'react';

// --- Hoisted mocks so vi.mock factory can reference them ---
const {
  mockUnsubscribe,
  mockGetSession,
  mockOnAuthStateChange,
  mockSignInWithPassword,
  mockSignUp,
  mockSignOut,
  getAuthStateCallback,
} = vi.hoisted(() => {
  type AuthStateCallback = (event: string, session: Session | null) => void;
  let authStateCallback: AuthStateCallback | null = null;

  const mockUnsubscribe = vi.fn();
  const mockGetSession = vi.fn();
  const mockOnAuthStateChange = vi.fn((cb: AuthStateCallback) => {
    authStateCallback = cb;
    return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
  });
  const mockSignInWithPassword = vi.fn();
  const mockSignUp = vi.fn();
  const mockSignOut = vi.fn();

  return {
    mockUnsubscribe,
    mockGetSession,
    mockOnAuthStateChange,
    mockSignInWithPassword,
    mockSignUp,
    mockSignOut,
    getAuthStateCallback: () => authStateCallback,
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  },
}));

// Import after mock is registered
import { AuthProvider, useAuth } from '@/lib/auth';

// Helper: wrap in AuthProvider
function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: getSession resolves with no session
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockSignOut.mockResolvedValue({ error: null });
  mockSignInWithPassword.mockResolvedValue({ error: null });
  mockSignUp.mockResolvedValue({ error: null });
  // Reset the callback captured by onAuthStateChange
  mockOnAuthStateChange.mockImplementation((cb) => {
    (getAuthStateCallback as unknown as { _cb: typeof cb })._cb = cb;
    return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
  });
});

// 1. loading=true initially before auth state resolves
test('useAuth returns loading=true initially before auth state resolves', async () => {
  let resolveSession!: (v: unknown) => void;
  mockGetSession.mockReturnValue(new Promise((r) => { resolveSession = r; }));

  const { result } = renderHook(() => useAuth(), { wrapper });

  expect(result.current.loading).toBe(true);
  expect(result.current.user).toBeNull();
  expect(result.current.session).toBeNull();

  // Resolve to avoid leak
  resolveSession({ data: { session: null } });
});

// 2. When mock emits a session, user is populated and loading becomes false
test('useAuth populates user and sets loading=false when auth state emits a session', async () => {
  const mockUser: User = { id: 'user-123', email: 'test@example.com' } as User;
  const mockSession: Session = { user: mockUser, access_token: 'tok' } as Session;

  let capturedCb: ((event: string, session: Session | null) => void) | null = null;
  mockOnAuthStateChange.mockImplementation((cb) => {
    capturedCb = cb;
    return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
  });

  const { result } = renderHook(() => useAuth(), { wrapper });

  // Let getSession resolve
  await act(async () => {
    await Promise.resolve();
  });

  // Emit session via onAuthStateChange callback
  await act(async () => {
    capturedCb?.('SIGNED_IN', mockSession);
  });

  expect(result.current.user).toEqual(mockUser);
  expect(result.current.session).toEqual(mockSession);
  expect(result.current.loading).toBe(false);
});

// 3. signOut clears user and session to null
test('useAuth signOut clears user and session to null', async () => {
  const mockUser: User = { id: 'user-456', email: 'other@example.com' } as User;
  const mockSession: Session = { user: mockUser, access_token: 'tok2' } as Session;

  // Populate user via getSession so it's set before onAuthStateChange fires
  mockGetSession.mockResolvedValue({ data: { session: mockSession } });

  const { result } = renderHook(() => useAuth(), { wrapper });

  // Wait for getSession to resolve and state to update
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

  expect(result.current.user).toEqual(mockUser);

  await act(async () => {
    await result.current.signOut();
  });

  expect(result.current.user).toBeNull();
  expect(result.current.session).toBeNull();
  expect(mockSignOut).toHaveBeenCalledOnce();
});

// 4. signIn delegates to supabase.auth.signInWithPassword with correct args
test('useAuth signIn calls signInWithPassword with correct args', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper });

  await act(async () => {
    await result.current.signIn('user@example.com', 'password123');
  });

  expect(mockSignInWithPassword).toHaveBeenCalledOnce();
  expect(mockSignInWithPassword).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'password123',
  });
});

// 5. signUp delegates to supabase.auth.signUp with correct args
test('useAuth signUp calls signUp with correct args', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper });

  await act(async () => {
    await result.current.signUp('newuser@example.com', 'securepass');
  });

  expect(mockSignUp).toHaveBeenCalledOnce();
  expect(mockSignUp).toHaveBeenCalledWith({
    email: 'newuser@example.com',
    password: 'securepass',
  });
});
