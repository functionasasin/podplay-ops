import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks before vi.mock hoisting
const { mockAuth, mockFrom } = vi.hoisted(() => ({
  mockAuth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithOtp: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: mockAuth,
    from: mockFrom,
  },
}));

import { signIn, signUp, signOut, signInWithGoogle, signInWithMagicLink, onAuthStateChange, getProfile } from '../auth';

describe('auth helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('calls supabase signInWithPassword with email and password', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' }, session: {} },
        error: null,
      });

      const result = await signIn('test@example.com', 'password123');
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.user.id).toBe('user-1');
    });

    it('throws on signIn error', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: null,
        error: new Error('Invalid credentials'),
      });

      await expect(signIn('bad@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('calls supabase signUp with email, password, and optional full name', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: 'user-2' }, session: {} },
        error: null,
      });

      const result = await signUp('new@example.com', 'pass123', 'Maria Santos');
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'pass123',
        options: { data: { full_name: 'Maria Santos' } },
      });
      expect(result.user.id).toBe('user-2');
    });

    it('throws on signUp error', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: null,
        error: new Error('Email already registered'),
      });

      await expect(signUp('dup@example.com', 'pass')).rejects.toThrow('Email already registered');
    });
  });

  describe('signOut', () => {
    it('calls supabase signOut', async () => {
      mockAuth.signOut.mockResolvedValue({ error: null });
      await signOut();
      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('throws on signOut error', async () => {
      mockAuth.signOut.mockResolvedValue({ error: new Error('Network error') });
      await expect(signOut()).rejects.toThrow('Network error');
    });
  });

  describe('signInWithGoogle', () => {
    it('calls supabase signInWithOAuth with google provider', async () => {
      mockAuth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://google.com/oauth' },
        error: null,
      });

      const result = await signInWithGoogle();
      expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google' });
      expect(result.url).toBeDefined();
    });
  });

  describe('signInWithMagicLink', () => {
    it('calls supabase signInWithOtp with email', async () => {
      mockAuth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      });

      await signInWithMagicLink('user@example.com');
      expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({ email: 'user@example.com' });
    });
  });

  describe('onAuthStateChange', () => {
    it('registers a listener and calls callback with user on auth change', () => {
      const unsubscribe = vi.fn();
      mockAuth.onAuthStateChange.mockImplementation((cb: Function) => {
        cb('SIGNED_IN', { user: { id: 'user-1' } });
        return { data: { subscription: { unsubscribe } } };
      });

      const callback = vi.fn();
      const result = onAuthStateChange(callback);

      expect(mockAuth.onAuthStateChange).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith({ id: 'user-1' });
      expect(result.data.subscription.unsubscribe).toBeDefined();
    });

    it('calls callback with null when user signs out', () => {
      mockAuth.onAuthStateChange.mockImplementation((cb: Function) => {
        cb('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const callback = vi.fn();
      onAuthStateChange(callback);
      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('getProfile', () => {
    it('returns UserProfile for valid user id', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Maria Santos',
        firm_name: 'Santos Law',
        letterhead_color: '#1E3A5F',
        secondary_color: '#C9A84C',
      };

      const singleFn = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
      const eqFn = vi.fn().mockReturnValue({ single: singleFn });
      const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
      mockFrom.mockReturnValue({ select: selectFn });

      const result = await getProfile('user-1');
      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(result).toEqual(mockProfile);
    });

    it('returns null when profile not found', async () => {
      const singleFn = vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') });
      const eqFn = vi.fn().mockReturnValue({ single: singleFn });
      const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
      mockFrom.mockReturnValue({ select: selectFn });

      const result = await getProfile('nonexistent');
      expect(result).toBeNull();
    });
  });
});
