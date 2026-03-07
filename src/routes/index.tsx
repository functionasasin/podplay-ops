import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: () => (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground">PodPlay Ops</p>
    </div>
  ),
});
