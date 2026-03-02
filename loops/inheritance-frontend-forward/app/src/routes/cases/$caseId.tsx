import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';

export const caseIdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cases/$caseId',
  component: CaseEditorPage,
});

function CaseEditorPage() {
  const { caseId } = caseIdRoute.useParams();

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <h1 className="text-xl font-bold tracking-tight font-serif mb-4">
        Case Editor
      </h1>
      <p className="text-muted-foreground">
        Case <code className="text-xs">{caseId}</code> — editor coming in Stage
        3.
      </p>
    </div>
  );
}
