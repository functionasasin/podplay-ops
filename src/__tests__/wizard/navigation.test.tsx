// Tests: WizardNavigation renders steps with correct labels/status,
// handles completed/locked/current step interactions,
// shows/hides Previous button, and fires callbacks correctly.

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';

const STEPS = [
  { id: 'step-1', label: 'Step One', status: 'completed' as const },
  { id: 'step-2', label: 'Step Two', status: 'current' as const },
  { id: 'step-3', label: 'Step Three', status: 'locked' as const },
];

function renderNav(overrides: Partial<React.ComponentProps<typeof WizardNavigation>> = {}) {
  const props = {
    steps: STEPS,
    onStepClick: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    isFirstStep: false,
    isLastStep: false,
    ...overrides,
  };
  return { ...render(React.createElement(WizardNavigation, props)), props };
}

// 1. Renders all steps with correct labels
test('renders all steps with correct labels', () => {
  renderNav();
  expect(screen.getByText('Step One')).toBeInTheDocument();
  expect(screen.getByText('Step Two')).toBeInTheDocument();
  expect(screen.getByText('Step Three')).toBeInTheDocument();
});

// 2. Completed steps are clickable (not disabled)
test('completed steps are not disabled', () => {
  renderNav();
  const buttons = screen.getAllByRole('button');
  // First nav button is the completed step
  const completedBtn = buttons.find((b) => b.textContent?.includes('Step One'));
  expect(completedBtn).not.toBeDisabled();
});

// 3. Locked steps are disabled and greyed out
test('locked steps are disabled', () => {
  renderNav();
  const buttons = screen.getAllByRole('button');
  const lockedBtn = buttons.find((b) => b.textContent?.includes('Step Three'));
  expect(lockedBtn).toBeDisabled();
});

// 4. Current step has aria-current="step"
test('current step has aria-current="step"', () => {
  renderNav();
  const buttons = screen.getAllByRole('button');
  const currentBtn = buttons.find((b) => b.textContent?.includes('Step Two'));
  expect(currentBtn).toHaveAttribute('aria-current', 'step');
});

// 5. Previous button hidden on first step
test('Previous button is hidden when isFirstStep=true', () => {
  renderNav({ isFirstStep: true });
  expect(screen.queryByText('Previous')).not.toBeInTheDocument();
});

// 6. Previous button visible when not on first step
test('Previous button is visible when isFirstStep=false', () => {
  renderNav({ isFirstStep: false });
  expect(screen.getByText('Previous')).toBeInTheDocument();
});

// 7. Next button shows "Complete" on last step (no nextLabel override)
test('Next button shows "Complete" on last step', () => {
  renderNav({ isLastStep: true });
  expect(screen.getByText('Complete')).toBeInTheDocument();
});

// 8. Next button shows "Next" when not on last step
test('Next button shows "Next" when not on last step', () => {
  renderNav({ isLastStep: false });
  expect(screen.getByText('Next')).toBeInTheDocument();
});

// 9. nextLabel override takes precedence
test('nextLabel prop overrides default label', () => {
  renderNav({ nextLabel: 'Advance to Deployment', isLastStep: true });
  expect(screen.getByText('Advance to Deployment')).toBeInTheDocument();
  expect(screen.queryByText('Complete')).not.toBeInTheDocument();
});

// 10. onPrevious fires when Previous button clicked
test('onPrevious fires when Previous button clicked', () => {
  const { props } = renderNav({ isFirstStep: false });
  fireEvent.click(screen.getByText('Previous'));
  expect(props.onPrevious).toHaveBeenCalledTimes(1);
});

// 11. onNext fires when Next button clicked
test('onNext fires when Next button clicked', () => {
  const { props } = renderNav();
  fireEvent.click(screen.getByText('Next'));
  expect(props.onNext).toHaveBeenCalledTimes(1);
});

// 12. onStepClick fires with step id when completed step clicked
test('onStepClick fires with step id for completed steps', () => {
  const { props } = renderNav();
  const buttons = screen.getAllByRole('button');
  const completedBtn = buttons.find((b) => b.textContent?.includes('Step One'))!;
  fireEvent.click(completedBtn);
  expect(props.onStepClick).toHaveBeenCalledWith('step-1');
});

// 13. onStepClick does not fire for locked steps
test('onStepClick does not fire for locked steps', () => {
  const { props } = renderNav();
  const buttons = screen.getAllByRole('button');
  const lockedBtn = buttons.find((b) => b.textContent?.includes('Step Three'))!;
  fireEvent.click(lockedBtn);
  expect(props.onStepClick).not.toHaveBeenCalled();
});
