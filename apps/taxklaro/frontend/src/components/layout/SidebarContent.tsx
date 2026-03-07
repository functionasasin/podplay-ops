import { Link, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, Calculator, Users, Calendar, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../lib/auth';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Computations', to: '/computations', icon: Calculator },
  { label: 'Clients', to: '/clients', icon: Users },
  { label: 'Deadlines', to: '/deadlines', icon: Calendar },
  { label: 'Settings', to: '/settings', icon: Settings },
] as const;

interface SidebarContentProps {
  onClose?: () => void;
}

export function SidebarContent({ onClose }: SidebarContentProps = {}) {
  const { user } = useAuth();
  const { location } = useRouterState();
  const pathname = location.pathname;

  return (
    <div className="flex h-full flex-col" data-testid="sidebar-content">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/60 px-6">
        <span className="font-display text-xl tracking-tight text-foreground">
          <span className="text-primary">₱</span>TaxKlaro
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-3 py-4" data-testid="nav-items">
        {navItems.map(({ label, to, icon: Icon }) => {
          const isActive = pathname === to || (to !== '/' && pathname.startsWith(to + '/'));
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={[
                'flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-[0.9375rem] font-medium transition-colors duration-150',
                isActive
                  ? 'border-l-primary bg-primary/5 text-primary'
                  : 'border-l-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground',
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
      <div className="space-y-1 border-t border-border/60 px-3 py-4" data-testid="sidebar-user">
        {user && (
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground" data-testid="user-email">
            {user.email}
          </p>
        )}
        <button
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/70 hover:text-foreground"
          onClick={() => signOut()}
          data-testid="sign-out-button"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}
