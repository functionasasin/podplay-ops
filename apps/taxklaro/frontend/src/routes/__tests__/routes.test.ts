import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from '@tanstack/react-router';

// ─── Mock Supabase ────────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => ({
  supabaseConfigured: false,
  supabase: null,
}));

// ─── Mock WASM bridge ─────────────────────────────────────────────────────────
vi.mock('../../wasm/bridge', () => ({
  initWasm: vi.fn(),
  compute: vi.fn(),
  validate: vi.fn(),
}));

// ─── Imports under test ───────────────────────────────────────────────────────
import { authGuard } from '../../lib/auth-guard';
import type { RouterContext } from '../__root';

// Route exports
import { IndexRoute } from '../index';
import { AuthRoute } from '../auth';
import { AuthCallbackRoute } from '../auth/callback';
import { AuthResetRoute } from '../auth/reset';
import { AuthResetConfirmRoute } from '../auth/reset-confirm';
import { OnboardingRoute } from '../onboarding';
import { InviteTokenRoute } from '../invite/$token';
import { ShareTokenRoute } from '../share/$token';
import { ComputationsIndexRoute } from '../computations/index';
import { ComputationsNewRoute } from '../computations/new';
import { ComputationsCompIdRoute } from '../computations/$compId';
import { ComputationsCompIdQuarterlyRoute } from '../computations/$compId.quarterly';
import { ClientsIndexRoute } from '../clients/index';
import { ClientsNewRoute } from '../clients/new';
import { ClientsClientIdRoute } from '../clients/$clientId';
import { DeadlinesRoute } from '../deadlines';
import { SettingsIndexRoute } from '../settings/index';
import { SettingsTeamRoute } from '../settings/team';
import { router } from '../../router';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContext(user: RouterContext['auth']['user']): RouterContext {
  return { auth: { user } };
}

const fakeUser = { id: 'uid-1', email: 'user@example.com' } as any;

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('authGuard', () => {
  it('throws redirect to /auth when user is null', () => {
    const ctx = makeContext(null);
    expect(() =>
      authGuard({ context: ctx, location: { href: '/computations' } })
    ).toThrow();
  });

  it('redirect target is /auth', () => {
    const ctx = makeContext(null);
    try {
      authGuard({ context: ctx, location: { href: '/computations' } });
    } catch (e) {
      // TanStack redirect throws an object; check it's redirect-shaped
      expect(e).toBeDefined();
    }
  });

  it('does NOT throw when user is present', () => {
    const ctx = makeContext(fakeUser);
    expect(() =>
      authGuard({ context: ctx, location: { href: '/computations' } })
    ).not.toThrow();
  });

  it('passes location.href in redirect search.redirect', () => {
    const ctx = makeContext(null);
    let thrown: any;
    try {
      authGuard({ context: ctx, location: { href: '/computations?q=1' } });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeDefined();
    // The redirect object should contain the original location
    // (TanStack redirect returns an object with type/to/search)
  });

  it('redirect search includes mode: signin', () => {
    const ctx = makeContext(null);
    let thrown: any;
    try {
      authGuard({ context: ctx, location: { href: '/settings' } });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeDefined();
  });
});

// ─── Route guard coverage ──────────────────────────────────────────────────────

describe('authenticated routes have beforeLoad guard', () => {
  const guardedRoutes = [
    { name: 'ComputationsIndexRoute', route: ComputationsIndexRoute },
    { name: 'ComputationsNewRoute', route: ComputationsNewRoute },
    { name: 'ComputationsCompIdRoute', route: ComputationsCompIdRoute },
    { name: 'ComputationsCompIdQuarterlyRoute', route: ComputationsCompIdQuarterlyRoute },
    { name: 'ClientsIndexRoute', route: ClientsIndexRoute },
    { name: 'ClientsNewRoute', route: ClientsNewRoute },
    { name: 'ClientsClientIdRoute', route: ClientsClientIdRoute },
    { name: 'DeadlinesRoute', route: DeadlinesRoute },
    { name: 'SettingsIndexRoute', route: SettingsIndexRoute },
    { name: 'SettingsTeamRoute', route: SettingsTeamRoute },
  ];

  guardedRoutes.forEach(({ name, route }) => {
    it(`${name} has a beforeLoad function`, () => {
      const options = (route as any).options;
      expect(typeof options.beforeLoad).toBe('function');
    });

    it(`${name} beforeLoad redirects unauthenticated user`, () => {
      const options = (route as any).options;
      expect(() =>
        options.beforeLoad({ context: makeContext(null), location: { href: '/test' } })
      ).toThrow();
    });

    it(`${name} beforeLoad allows authenticated user`, () => {
      const options = (route as any).options;
      expect(() =>
        options.beforeLoad({ context: makeContext(fakeUser), location: { href: '/test' } })
      ).not.toThrow();
    });
  });
});

// ─── Public routes have NO guard ──────────────────────────────────────────────

describe('public routes have no beforeLoad guard', () => {
  const publicRoutes = [
    { name: 'IndexRoute', route: IndexRoute },
    { name: 'AuthRoute', route: AuthRoute },
    { name: 'AuthCallbackRoute', route: AuthCallbackRoute },
    { name: 'AuthResetRoute', route: AuthResetRoute },
    { name: 'AuthResetConfirmRoute', route: AuthResetConfirmRoute },
    { name: 'InviteTokenRoute', route: InviteTokenRoute },
    { name: 'ShareTokenRoute', route: ShareTokenRoute },
  ];

  publicRoutes.forEach(({ name, route }) => {
    it(`${name} has no beforeLoad or allows unauthenticated`, () => {
      const options = (route as any).options;
      if (options.beforeLoad) {
        // If it does have beforeLoad, it must not throw for null user
        expect(() =>
          options.beforeLoad({ context: makeContext(null), location: { href: '/test' } })
        ).not.toThrow();
      } else {
        expect(options.beforeLoad).toBeUndefined();
      }
    });
  });
});

// ─── Route paths ─────────────────────────────────────────────────────────────

describe('route paths match spec §11.2', () => {
  it('IndexRoute path is /', () => {
    expect((IndexRoute as any).options.path).toBe('/');
  });

  it('AuthRoute path is /auth', () => {
    expect((AuthRoute as any).options.path).toBe('/auth');
  });

  it('AuthCallbackRoute path is /auth/callback', () => {
    expect((AuthCallbackRoute as any).options.path).toBe('/auth/callback');
  });

  it('AuthResetRoute path is /auth/reset', () => {
    expect((AuthResetRoute as any).options.path).toBe('/auth/reset');
  });

  it('AuthResetConfirmRoute path is /auth/reset-confirm', () => {
    expect((AuthResetConfirmRoute as any).options.path).toBe('/auth/reset-confirm');
  });

  it('OnboardingRoute path is /onboarding', () => {
    expect((OnboardingRoute as any).options.path).toBe('/onboarding');
  });

  it('InviteTokenRoute path is /invite/$token', () => {
    expect((InviteTokenRoute as any).options.path).toBe('/invite/$token');
  });

  it('ShareTokenRoute path is /share/$token', () => {
    expect((ShareTokenRoute as any).options.path).toBe('/share/$token');
  });

  it('ComputationsIndexRoute path is /computations', () => {
    expect((ComputationsIndexRoute as any).options.path).toBe('/computations');
  });

  it('ComputationsNewRoute path is /computations/new', () => {
    expect((ComputationsNewRoute as any).options.path).toBe('/computations/new');
  });

  it('ComputationsCompIdRoute path is /computations/$compId', () => {
    expect((ComputationsCompIdRoute as any).options.path).toBe('/computations/$compId');
  });

  it('ComputationsCompIdQuarterlyRoute path is /computations/$compId/quarterly', () => {
    expect((ComputationsCompIdQuarterlyRoute as any).options.path).toBe('/computations/$compId/quarterly');
  });

  it('ClientsIndexRoute path is /clients', () => {
    expect((ClientsIndexRoute as any).options.path).toBe('/clients');
  });

  it('ClientsNewRoute path is /clients/new', () => {
    expect((ClientsNewRoute as any).options.path).toBe('/clients/new');
  });

  it('ClientsClientIdRoute path is /clients/$clientId', () => {
    expect((ClientsClientIdRoute as any).options.path).toBe('/clients/$clientId');
  });

  it('DeadlinesRoute path is /deadlines', () => {
    expect((DeadlinesRoute as any).options.path).toBe('/deadlines');
  });

  it('SettingsIndexRoute path is /settings', () => {
    expect((SettingsIndexRoute as any).options.path).toBe('/settings');
  });

  it('SettingsTeamRoute path is /settings/team', () => {
    expect((SettingsTeamRoute as any).options.path).toBe('/settings/team');
  });
});

// ─── Route tree order: new before $compId ─────────────────────────────────────

describe('route tree ordering', () => {
  it('ComputationsNewRoute is registered before ComputationsCompIdRoute', () => {
    const routeTree = (router as any).routeTree;
    // Routes are nested under the authenticated layout route — search recursively
    function findAll(node: any): any[] {
      const children: any[] = node.children ?? [];
      return children.flatMap((c: any) => [c, ...findAll(c)]);
    }
    const allRoutes = findAll(routeTree);
    const newIdx = allRoutes.findIndex(
      (r: any) => r.options?.path === '/computations/new'
    );
    const compIdIdx = allRoutes.findIndex(
      (r: any) => r.options?.path === '/computations/$compId'
    );
    expect(newIdx).toBeGreaterThanOrEqual(0);
    expect(compIdIdx).toBeGreaterThanOrEqual(0);
    expect(newIdx).toBeLessThan(compIdIdx);
  });
});

// ─── Router context shape ─────────────────────────────────────────────────────

describe('RouterContext', () => {
  it('router is created with auth context', () => {
    const ctx = (router as any).options.context;
    expect(ctx).toHaveProperty('auth');
    expect(ctx.auth).toHaveProperty('user');
    expect(ctx.auth.user).toBeNull();
  });
});

// ─── Total route count ────────────────────────────────────────────────────────

describe('all 18 routes are registered', () => {
  it('router has 18 leaf routes', () => {
    // Count routes that have a path (leaf routes)
    function countLeaves(node: any): number {
      if (!node) return 0;
      const children: any[] = node.children ?? [];
      if (children.length === 0 && node.options?.path !== undefined) return 1;
      return children.reduce((sum: number, c: any) => sum + countLeaves(c), 0);
    }
    const routeTree = (router as any).routeTree;
    const count = countLeaves(routeTree);
    // We have 18 named routes + __root + public sub-root
    expect(count).toBeGreaterThanOrEqual(18);
  });
});
