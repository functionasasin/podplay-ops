import { Link, useMatchRoute } from '@tanstack/react-router';
import {
  LayoutDashboard,
  FilePlus,
  Users,
  CalendarClock,
  Settings,
  Scale,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/' as const, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases/new' as const, label: 'New Case', icon: FilePlus },
  { to: '/clients' as const, label: 'Clients', icon: Users },
  { to: '/deadlines' as const, label: 'Deadlines', icon: CalendarClock },
  { to: '/settings' as const, label: 'Settings', icon: Settings },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const matchRoute = useMatchRoute();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-card no-print">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold tracking-tight font-serif text-primary">
              Inheritance
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Philippine Succession Law
          </p>
        </div>
        <Separator />
        <nav className="flex-1 px-2 py-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = matchRoute({ to, fuzzy: true });
            return (
              <Link key={to} to={to}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2 text-sm"
                  size="sm"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-primary text-primary-foreground shadow-md no-print">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight font-serif">
                Inheritance Calculator
              </h1>
              <p className="text-xs text-primary-foreground/70">
                Philippine Succession Law Engine
              </p>
            </div>
          </div>
          <Separator className="bg-accent h-0.5" />
          <nav className="flex gap-1 px-2 py-1.5 overflow-x-auto">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = matchRoute({ to, fuzzy: true });
              return (
                <Link key={to} to={to}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="text-xs gap-1 shrink-0"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
