// Tests: WizardStepper renders 7 intake steps with correct labels,
// fires onStepClick with the correct index, highlights the current step,
// and visually distinguishes completed from upcoming steps.

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WizardStepper } from '@/components/wizard/WizardStepper';

const INTAKE_STEPS = [
  'Customer Info',
  'Venue Config',
  'Service Tier',
  'ISP Info',
  'Installer',
  'Financial Setup',
  'Review & Submit',
];

function renderStepper(currentStep = 0, onStepClick = vi.fn()) {
  return render(
    React.createElement(WizardStepper, {
      steps: INTAKE_STEPS,
      currentStep,
      onStepClick,
    }),
  );
}

// 1. All 7 step labels render
test('renders all 7 intake step labels', () => {
  renderStepper(0);
  for (const label of INTAKE_STEPS) {
    expect(screen.getByText(label)).toBeInTheDocument();
  }
});

// 2. Step labels are exactly the spec values
test('step labels match spec: Customer Info, Venue Config, Service Tier, ISP Info, Installer, Financial Setup, Review & Submit', () => {
  renderStepper(0);
  const buttons = screen.getAllByRole('button');
  const labels = buttons.map((btn) => btn.textContent?.replace(/^\d+/, '').trim());
  expect(labels).toContain('Customer Info');
  expect(labels).toContain('Venue Config');
  expect(labels).toContain('Service Tier');
  expect(labels).toContain('ISP Info');
  expect(labels).toContain('Installer');
  expect(labels).toContain('Financial Setup');
  expect(labels).toContain('Review & Submit');
});

// 3. Clicking each step fires onStepClick with the correct index
test('clicking step 0 fires onStepClick with index 0', () => {
  const onStepClick = vi.fn();
  renderStepper(0, onStepClick);
  fireEvent.click(screen.getByText('Customer Info'));
  expect(onStepClick).toHaveBeenCalledWith(0);
});

test('clicking step 3 fires onStepClick with index 3', () => {
  const onStepClick = vi.fn();
  // Step 3 is completed (accessible) when currentStep > 3
  renderStepper(4, onStepClick);
  fireEvent.click(screen.getByText('ISP Info'));
  expect(onStepClick).toHaveBeenCalledWith(3);
});

test('clicking step 6 fires onStepClick with index 6', () => {
  const onStepClick = vi.fn();
  // Step 6 is the current step when currentStep = 6
  renderStepper(6, onStepClick);
  fireEvent.click(screen.getByText('Review & Submit'));
  expect(onStepClick).toHaveBeenCalledWith(6);
});

// 4. Current step has aria-current="step"
test('current step button has aria-current="step"', () => {
  renderStepper(2);
  const currentBtn = screen.getByText('Service Tier').closest('button');
  expect(currentBtn).toHaveAttribute('aria-current', 'step');
});

test('non-current steps do not have aria-current', () => {
  renderStepper(2);
  const otherBtn = screen.getByText('Customer Info').closest('button');
  expect(otherBtn).not.toHaveAttribute('aria-current');
});

// 5. Completed steps are visually distinguished — indicator uses bg-primary/20 class
test('completed step indicator has completed CSS class', () => {
  // currentStep=3 means steps 0,1,2 are completed
  renderStepper(3);
  const customerInfoBtn = screen.getByText('Customer Info').closest('button');
  // the span inside the button is the indicator circle
  const indicator = customerInfoBtn?.querySelector('span');
  expect(indicator?.className).toContain('bg-primary/20');
});

// 6. Upcoming steps have bg-muted indicator
test('upcoming step indicator has muted CSS class', () => {
  renderStepper(2);
  // Step index 5 (Financial Setup) is upcoming when currentStep=2
  const financialBtn = screen.getByText('Financial Setup').closest('button');
  const indicator = financialBtn?.querySelector('span');
  expect(indicator?.className).toContain('bg-muted');
});

// 7. Current step indicator has bg-primary class
test('current step indicator has primary CSS class', () => {
  renderStepper(1);
  const venueBtn = screen.getByText('Venue Config').closest('button');
  const indicator = venueBtn?.querySelector('span');
  expect(indicator?.className).toContain('bg-primary');
  // ensure it's not bg-primary/20 (completed) but bg-primary (current)
  expect(indicator?.className).not.toContain('bg-primary/20');
});
