import React, { useState } from 'react';
import { LayoutDashboard, FilePlus, FolderOpen, Users, CalendarClock, Settings, Scale, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useMatchRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { to: '/' as const,          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases' as const,     label: 'Cases',     icon: FolderOpen      },
  { to: '/cases/new' as const, label: 'New Case',  icon: FilePlus        },
  { to: '/clients' as const,   label: 'Clients',   icon: Users           },
  { to: '/deadlines' as const, label: 'Deadlines', icon: CalendarClock   },
] as const;

const settingsNavItems = [
  { to: '/settings' as const,  label: 'Settings',  icon: Settings        },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const matchRoute = useMatchRoute();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const renderNavItem = (to: string, label: string, Icon: React.ElementType) => {
    const isActive = !!matchRoute({ to, fuzzy: false });
    return (
      <Link key={to} to={to} className={cn(
        'group flex items-center gap-3 h-9 px-3 rounded-md text-sm transition-colors duration-100 ease-out border-l-[3px]',
        isActive
          ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
          : 'border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground'
      )}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground no-print shadow-[2px_0_8px_rgba(30,58,95,0.15)]">
        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
          <Scale className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
          <div>
            <span className="text-sm font-bold tracking-tight font-serif text-sidebar-foreground">Inheritance</span>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Philippine Succession Law</p>
          </div>
        </div>
        {/* Nav — authenticated only */}
        {user ? (
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {mainNavItems.map(({ to, label, icon: Icon }) => renderNavItem(to, label, Icon))}
            <div className="h-px bg-sidebar-border my-2" />
            {settingsNavItems.map(({ to, label, icon: Icon }) => renderNavItem(to, label, Icon))}
          </nav>
        ) : (
          <nav className="flex-1 px-3 py-3">
            <Link to="/auth" search={{ mode: 'signin' as const, redirect: '' }} className="group flex items-center gap-3 h-9 px-3 rounded-md text-sm transition-colors duration-100 ease-out border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground">
              <LogIn className="h-4 w-4 flex-shrink-0" />
              <span>Sign In</span>
            </Link>
          </nav>
        )}
        {/* Footer — authenticated only */}
        {user && (
          <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
            <div className="px-3 py-1">
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="group flex items-center gap-3 h-9 px-3 w-full rounded-md text-sm border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground transition-colors duration-100 ease-out"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />Sign Out
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-sidebar text-sidebar-foreground no-print">
          <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-sidebar-primary" />
              <span className="text-sm font-bold tracking-tight font-serif">Inheritance</span>
            </div>
            <button onClick={() => setDrawerOpen(true)} aria-label="Open navigation"
              className="p-2 rounded-md text-sidebar-foreground/75 hover:bg-white/[0.08] transition-colors duration-100">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <div className="relative w-72 bg-sidebar text-sidebar-foreground flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
              {/* Header */}
              <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-sidebar-primary" />
                  <span className="text-sm font-bold tracking-tight font-serif">Inheritance</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="p-2 rounded-md text-sidebar-foreground/75 hover:bg-white/[0.08] transition-colors duration-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Nav — h-11 = 44px touch target per WCAG 2.5.5 */}
              {user ? (
                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                  {mainNavItems.map(({ to, label, icon: Icon }) => {
                    const isActive = !!matchRoute({ to, fuzzy: false });
                    return (
                      <Link
                        key={to} to={to}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center gap-3 h-11 px-3 rounded-md text-sm transition-colors duration-100 ease-out border-l-[3px]',
                          isActive
                            ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
                            : 'border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                  <div className="h-px bg-sidebar-border my-2" />
                  {settingsNavItems.map(({ to, label, icon: Icon }) => {
                    const isActive = !!matchRoute({ to, fuzzy: false });
                    return (
                      <Link
                        key={to} to={to}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center gap-3 h-11 px-3 rounded-md text-sm transition-colors duration-100 ease-out border-l-[3px]',
                          isActive
                            ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
                            : 'border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              ) : (
                <nav className="flex-1 px-3 py-3">
                  <Link
                    to="/auth"
                    search={{ mode: 'signin' as const, redirect: '' }}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 h-11 px-3 rounded-md text-sm border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground transition-colors duration-100"
                  >
                    <LogIn className="h-4 w-4 flex-shrink-0" />
                    <span>Sign In</span>
                  </Link>
                </nav>
              )}
              {/* Footer */}
              {user && (
                <div className="border-t border-sidebar-border px-3 py-3 space-y-1 flex-shrink-0">
                  <div className="px-3 py-1">
                    <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { signOut(); setDrawerOpen(false); }}
                    className="flex items-center gap-3 h-11 px-3 w-full rounded-md text-sm border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground transition-colors duration-100 ease-out"
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
