// Tests: TierSelectionStep renders 4 tier cards, selecting updates state,
// only one tier selected at a time, Next button disabled until selection made.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { TierSelectionStep } from '@/components/wizard/intake/TierSelectionStep';

function renderStep(onNext = vi.fn()) {
  return render(React.createElement(TierSelectionStep, { onNext }));
}

// 1. Exactly 3 tier cards render with full labels from enum-labels spec
test('renders exactly 3 tier cards', () => {
  renderStep();
  const radios = screen.getAllByRole('radio');
  expect(radios).toHaveLength(3);
});

test('tier card labels match spec: Pro, Autonomous, Autonomous+', () => {
  renderStep();
  expect(screen.getByRole('radio', { name: 'Pro' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Autonomous' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Autonomous+' })).toBeInTheDocument();
});

// 2. Selecting a tier updates form state with correct service_tier value
test('selecting Pro calls onNext with service_tier "pro"', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalledWith({ service_tier: 'pro' });
  });
});

test('selecting Autonomous calls onNext with service_tier "autonomous"', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.click(screen.getByRole('radio', { name: 'Autonomous' }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalledWith({ service_tier: 'autonomous' });
  });
});

test('selecting Autonomous+ calls onNext with service_tier "autonomous_plus"', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.click(screen.getByRole('radio', { name: 'Autonomous+' }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalledWith({ service_tier: 'autonomous_plus' });
  });
});

// 3. Only one tier can be selected at a time — selecting a new tier deselects previous
test('selecting a new tier deselects the previous one', () => {
  renderStep();
  const proRadio = screen.getByRole('radio', { name: 'Pro' }) as HTMLInputElement;
  const autoRadio = screen.getByRole('radio', { name: 'Autonomous' }) as HTMLInputElement;

  fireEvent.click(proRadio);
  expect(proRadio.checked).toBe(true);
  expect(autoRadio.checked).toBe(false);

  fireEvent.click(autoRadio);
  expect(autoRadio.checked).toBe(true);
  expect(proRadio.checked).toBe(false);
});

// 4. Next button disabled when no tier selected; enabled once one is chosen
test('Continue button is disabled when no tier is selected', () => {
  renderStep();
  const button = screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
});

test('Continue button is enabled after selecting a tier', () => {
  renderStep();
  fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));
  const button = screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;
  expect(button.disabled).toBe(false);
});
