import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @supabase/supabase-js before importing the module under test
const mockSupabaseClient = {
  auth: { getUser: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(), onAuthStateChange: vi.fn() },
  from: vi.fn().mockReturnValue({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() }),
  storage: { from: vi.fn() },
  rpc: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('supabase client', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('exports a supabase client object', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    // Dynamic import to pick up stubbed env vars
    const mod = await import('../supabase');
    expect(mod.supabase).toBeDefined();
  });

  it('client has auth method', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    const mod = await import('../supabase');
    expect(mod.supabase.auth).toBeDefined();
  });

  it('client has from method for table queries', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    const mod = await import('../supabase');
    expect(typeof mod.supabase.from).toBe('function');
  });

  it('client has storage method', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    const mod = await import('../supabase');
    expect(mod.supabase.storage).toBeDefined();
  });

  it('client has rpc method', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    const mod = await import('../supabase');
    expect(typeof mod.supabase.rpc).toBe('function');
  });

  it('throws if VITE_SUPABASE_URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    // Reset module cache so it re-evaluates
    vi.resetModules();

    await expect(import('../supabase')).rejects.toThrow(
      'Missing VITE_SUPABASE_URL environment variable'
    );
  });

  it('throws if VITE_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    vi.resetModules();

    await expect(import('../supabase')).rejects.toThrow(
      'Missing VITE_SUPABASE_ANON_KEY environment variable'
    );
  });
});
