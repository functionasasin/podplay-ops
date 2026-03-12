import { Outlet, Link } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Plus,
  Package,
  DollarSign,
  Tag,
  BookOpen,
  Users,
  LogOut,
  Menu,
  Wrench,
  Store,
  BookMarked,
} from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { SkipLink } from '@/components/layout/SkipLink';
import { Sheet, SheetContent } from '@/components/ui/sheet';

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
    section: 'Resources',
    links: [
      { to: '/guide', label: 'Guide', icon: BookMarked },
    ],
  },
  {
    section: 'Settings',
    links: [
      { to: '/settings/pricing', label: 'Pricing', icon: Tag },
      { to: '/settings/catalog', label: 'Catalog', icon: BookOpen },
      { to: '/settings/team', label: 'Team', icon: Users },
      { to: '/settings/installers', label: 'Installers', icon: Wrench },
      { to: '/settings/vendors', label: 'Vendors', icon: Store },
    ],
  },
];

function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Site navigation">
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
                onClick={onNavClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
                )}
                activeProps={{
                  className: 'bg-accent text-accent-foreground font-medium',
                  'aria-current': 'page',
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
  );
}

export function AppLayout() {
  const { user, signOut } = useAuth();
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex h-svh overflow-hidden">
      <SkipLink />

      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-60 shrink-0 border-r bg-background flex-col" aria-label="Main navigation">
        <div className="flex h-14 items-center border-b px-4 shrink-0">
          <span className="text-base font-semibold tracking-tight">PodPlay Ops</span>
        </div>
        <SidebarNav />
      </aside>

      {/* Mobile Sheet — visible only below md */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent>
          <div className="flex h-14 items-center border-b px-4 shrink-0">
            <span className="text-base font-semibold tracking-tight">PodPlay Ops</span>
          </div>
          <SidebarNav onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b px-4 shrink-0 bg-background" aria-label="App header">
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold md:hidden">PodPlay Ops</span>
          </div>
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
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
