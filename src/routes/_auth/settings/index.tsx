import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/settings/')({
  component: () => <Navigate to="/settings/pricing" replace />,
});
