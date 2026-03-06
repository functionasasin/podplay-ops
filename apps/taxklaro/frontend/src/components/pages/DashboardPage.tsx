import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Button onClick={() => navigate({ to: '/computations/new' })}>New Computation</Button>
    </div>
  );
}

export default DashboardPage;
