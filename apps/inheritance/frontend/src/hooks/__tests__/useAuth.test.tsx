import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock auth library
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/auth', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signUp: (...args: unknown[]) => mockSignUp(...args),
  signOut: () => mockSignOut(),
  onAuthStateChange: (cb: Function) => mockOnAuthStateChange(cb),
}));

import { useAuth } from '../useAuth';

describe('useAuth hook', () => {
  let authChangeCallback: Function;

  beforeEach(() => {
    vi.clearAllMocks();

    // Capture the auth state change callback
    mockOnAuthStateChange.mockImplementation((cb: Function) => {
      authChangeCallback = cb;
      return {
        data: {
          subscription: { unsubscribe: vi.fn() },
        },
      };
    });
  });

  it('starts with loading=true and user=null', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('returns user after sign in event', async () => {
    const { result } = renderHook(() => useAuth());

    // Simulate auth state change
    act(() => {
      authChangeCallback({ id: 'user-1', email: 'test@example.com' });
    });

    expect(result.current.user).toEqual({ id: 'user-1', email: 'test@example.com' });
    expect(result.current.loading).toBe(false);
  });

  it('returns null after sign out', async () => {
    const { result } = renderHook(() => useAuth());

    // Simulate sign in
    act(() => {
      authChangeCallback({ id: 'user-1', email: 'test@example.com' });
    });
    expect(result.current.user).not.toBeNull();

    // Call signOut
    mockSignOut.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('calls auth.signIn when signIn is invoked', async () => {
    mockSignIn.mockResolvedValue({ user: { id: 'user-1' } });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('calls auth.signUp when signUp is invoked', async () => {
    mockSignUp.mockResolvedValue({ user: { id: 'user-2' } });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp('new@example.com', 'pass123', 'Maria Santos');
    });

    expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'pass123', 'Maria Santos');
  });

  it('unsubscribes from auth state changes on unmount', () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockImplementation((cb: Function) => {
      authChangeCallback = cb;
      return { data: { subscription: { unsubscribe } } };
    });

    const { unmount } = renderHook(() => useAuth());
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('exposes signIn, signUp, signOut functions', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });
});
