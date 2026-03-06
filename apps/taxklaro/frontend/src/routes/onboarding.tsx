import { createRoute } from '@tanstack/react-router';
import { publicRootRoute } from './__root';
import { authGuard } from '../lib/auth-guard';

export const OnboardingRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/onboarding',
  beforeLoad: authGuard,
  component: OnboardingPage,
});

function OnboardingPage() {
  return <div data-testid="onboarding-page">Welcome! Set up your organization.</div>;
}
