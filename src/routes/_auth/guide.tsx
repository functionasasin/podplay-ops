import { createFileRoute } from '@tanstack/react-router';
import { OperationsGuide } from '@/components/guide/OperationsGuide';

function GuidePage() {
  return <OperationsGuide />;
}

export const Route = createFileRoute('/_auth/guide')({
  component: GuidePage,
});
