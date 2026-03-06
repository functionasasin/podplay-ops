import { Link, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, Calculator, Users, Calendar, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../lib/auth';

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Computations', to: '/computations', icon: Calculator },
  { label: 'Clients', to: '/clients', icon: Users },
  { label: 'Deadlines', to: '/deadlines', icon: Calendar },
  { label: 'Settings', to: '/settings', icon: Settings },
] as const;

export function SidebarContent() {
  const { user } = useAuth();
  const { location } = useRouterState();
  const pathname = location.pathname;

  return (
    <div className="flex h-full flex-col" data-testid="sidebar-content">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold">TaxKlaro</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-4" data-testid="nav-items">
        {navItems.map(({ label, to, icon: Icon }) => {
          const isActive = pathname === to || (to !== '/' && pathname.startsWith(to + '/'));
          return (
            <Link
              key={to}
              to={to}
              className={[
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')}
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t px-3 py-4 space-y-2" data-testid="sidebar-user">
        {user && (
          <p className="truncate px-3 text-sm text-muted-foreground" data-testid="user-email">
            {user.email}
          </p>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-sm"
          onClick={() => signOut()}
          data-testid="sign-out-button"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
