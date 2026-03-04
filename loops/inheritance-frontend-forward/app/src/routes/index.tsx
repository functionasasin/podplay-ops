import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { LayoutDashboard, LogIn, UserPlus, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight font-serif mb-2">
          Inheritance Calculator
        </h1>
        <p className="text-muted-foreground mb-8">
          Philippine Succession Law Engine. Sign in to save cases, track
          deadlines, and manage clients.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/auth">
            <Button className="w-full gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" className="w-full gap-2">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight font-serif">
          Dashboard
        </h1>
      </div>
      <p className="text-muted-foreground mb-4">
        Welcome back. Use "New Case" to start an inheritance computation.
      </p>
      <Link to="/cases/new">
        <Button className="gap-2">
          <FilePlus className="h-4 w-4" />
          New Case
        </Button>
      </Link>
    </div>
  );
}
