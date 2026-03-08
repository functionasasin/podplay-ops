import { Outlet, Link } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Plus,
  Package,
  DollarSign,
  Tag,
  FileText,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

interface NavLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  section: string;
  links: NavLink[];
}

const navSections: NavSection[] = [
  {
    section: 'Projects',
    links: [
      { to: '/projects', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/projects/new', label: 'New Project', icon: Plus },
    ],
  },
  {
    section: 'Inventory',
    links: [
      { to: '/inventory', label: 'Inventory', icon: Package },
    ],
  },
  {
    section: 'Financials',
    links: [
      { to: '/financials', label: 'Financials', icon: DollarSign },
    ],
  },
  {
    section: 'Settings',
    links: [
      { to: '/settings/pricing', label: 'Pricing', icon: Tag },
      { to: '/settings/templates', label: 'Templates', icon: FileText },
    ],
  },
];

export function AppLayout() {
  const { user, signOut } = useAuth();
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="flex h-svh overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 border-r bg-background flex-col">
        <div className="flex h-14 items-center border-b px-4 shrink-0">
          <span className="text-base font-semibold tracking-tight">PodPlay Ops</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map(({ section, links }) => (
            <div key={section}>
              <p className="px-2 mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {section}
              </p>
              <div className="space-y-0.5">
                {links.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
                    )}
                    activeProps={{
                      className: 'bg-accent text-accent-foreground font-medium',
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b px-4 shrink-0 bg-background">
          <span className="font-semibold md:hidden">PodPlay Ops</span>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium"
              title={user?.email}
            >
              {initials}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
