import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { CalendarClock } from 'lucide-react';

export const deadlinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deadlines',
  component: DeadlinesPage,
});

function DeadlinesPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight font-serif">
          Deadlines
        </h1>
      </div>
      <p className="text-muted-foreground">
        Deadline tracker coming in Stage 20.
      </p>
    </div>
  );
}
