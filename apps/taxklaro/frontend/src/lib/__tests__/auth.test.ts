import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mock functions are available inside the vi.mock factory
const {
  mockSignInWithPassword,
  mockSignInWithOtp,
  mockSignUp,
  mockSignOut,
  mockResetPasswordForEmail,
} = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockSignInWithOtp: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignOut: vi.fn(),
  mockResetPasswordForEmail: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOtp: mockSignInWithOtp,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  },
}));

import {
  signInWithPassword,
  signInWithOtp,
  signUp,
  signOut,
  resetPassword,
} from '../auth';

describe('signInWithPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  });

  it('calls supabase.auth.signInWithPassword with email and password', async () => {
    await signInWithPassword('user@example.com', 'secret123');
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  it('returns the supabase response', async () => {
    const result = await signInWithPassword('user@example.com', 'secret123');
    expect(result).toEqual({ data: { user: { id: 'u1' } }, error: null });
  });

  it('propagates error from supabase', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } });
    const result = await signInWithPassword('bad@example.com', 'wrong');
    expect(result.error).toMatchObject({ message: 'Invalid credentials' });
  });
});

describe('signInWithOtp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
  });

  it('calls supabase.auth.signInWithOtp with email and redirect URL containing /auth/callback', async () => {
    await signInWithOtp('user@example.com');
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: expect.objectContaining({
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      }),
    });
  });

  it('returns the supabase response', async () => {
    const result = await signInWithOtp('user@example.com');
    expect(result.error).toBeNull();
  });

  it('propagates OTP error', async () => {
    mockSignInWithOtp.mockResolvedValue({ data: null, error: { message: 'Rate limit exceeded' } });
    const result = await signInWithOtp('user@example.com');
    expect(result.error).toMatchObject({ message: 'Rate limit exceeded' });
  });
});

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  });

  it('calls supabase.auth.signUp with email, password, and redirect URL containing /auth/callback', async () => {
    await signUp('newuser@example.com', 'password123');
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      options: expect.objectContaining({
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      }),
    });
  });

  it('returns the supabase response', async () => {
    const result = await signUp('newuser@example.com', 'password123');
    expect(result).toEqual({ data: { user: { id: 'u1' } }, error: null });
  });

  it('propagates sign-up error', async () => {
    mockSignUp.mockResolvedValue({ data: null, error: { message: 'Email already registered' } });
    const result = await signUp('existing@example.com', 'password123');
    expect(result.error).toMatchObject({ message: 'Email already registered' });
  });
});

describe('signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('calls supabase.auth.signOut', async () => {
    await signOut();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('returns the supabase response', async () => {
    const result = await signOut();
    expect(result).toEqual({ error: null });
  });

  it('propagates signOut error', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Network error' } });
    const result = await signOut();
    expect(result.error).toMatchObject({ message: 'Network error' });
  });
});

describe('resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  });

  it('calls supabase.auth.resetPasswordForEmail with email and /auth/reset-confirm redirect', async () => {
    await resetPassword('user@example.com');
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({
        redirectTo: expect.stringContaining('/auth/reset-confirm'),
      }),
    );
  });

  it('returns the supabase response', async () => {
    const result = await resetPassword('user@example.com');
    expect(result.error).toBeNull();
  });

  it('propagates reset password error', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: null, error: { message: 'User not found' } });
    const result = await resetPassword('nobody@example.com');
    expect(result.error).toMatchObject({ message: 'User not found' });
  });
});

describe('supabaseConfigured guard', () => {
  it('is a boolean', async () => {
    const { supabaseConfigured } = await import('../supabase');
    expect(typeof supabaseConfigured).toBe('boolean');
  });

  it('is true in the mocked context', async () => {
    const { supabaseConfigured } = await import('../supabase');
    expect(supabaseConfigured).toBe(true);
  });
});
