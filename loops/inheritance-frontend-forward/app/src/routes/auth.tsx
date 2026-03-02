import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-serif">Sign In</CardTitle>
          <CardDescription>
            Sign in to save cases and access premium features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Authentication will be implemented in Stage 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
