// Tests: VenueConfigStep renders, validates court_count min, venue_address required,
// numeric inputs accept valid numbers and reject non-numeric, booleans default false and toggle.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { VenueConfigStep } from '@/components/wizard/intake/VenueConfigStep';

function renderStep(onNext = vi.fn()) {
  return render(React.createElement(VenueConfigStep, { onNext }));
}

// 1. court_count = 0 triggers min error "At least 1 court required"
test('court_count value 0 shows "At least 1 court required"', async () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/venue address/i), {
    target: { value: '123 Main St' },
  });
  fireEvent.change(screen.getByLabelText(/court count/i), {
    target: { value: '0' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('At least 1 court required')).toBeInTheDocument();
  });
});

// 2. court_count = 4 passes validation (onNext called)
test('court_count value 4 passes validation', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.change(screen.getByLabelText(/venue address/i), {
    target: { value: '456 Park Ave' },
  });
  fireEvent.change(screen.getByLabelText(/court count/i), {
    target: { value: '4' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalled();
  });
  expect(screen.queryByText('At least 1 court required')).not.toBeInTheDocument();
});

// 3. Empty venue_address shows required error
test('empty venue_address shows "Venue address is required"', async () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/court count/i), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('Venue address is required')).toBeInTheDocument();
  });
});

// 4a. door_count accepts a valid number (onNext called with correct value)
test('door_count accepts valid number 3', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.change(screen.getByLabelText(/venue address/i), {
    target: { value: '789 Elm St' },
  });
  fireEvent.change(screen.getByLabelText(/court count/i), {
    target: { value: '2' },
  });
  fireEvent.change(screen.getByLabelText(/door count/i), {
    target: { value: '3' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalled();
  });
  expect(onNext.mock.calls[0][0]).toMatchObject({ door_count: 3 });
});

// 4b. Non-numeric input for door_count triggers a validation error (NaN is rejected)
test('non-numeric door_count triggers validation error', async () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/venue address/i), {
    target: { value: '789 Elm St' },
  });
  fireEvent.change(screen.getByLabelText(/court count/i), {
    target: { value: '2' },
  });
  fireEvent.change(screen.getByLabelText(/door count/i), {
    target: { value: 'abc' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    // Zod rejects NaN with a type error; any validation message in the door_count error slot
    const doorSection = screen.getByLabelText(/door count/i).closest('div');
    expect(doorSection?.querySelector('.text-destructive')).toBeTruthy();
  });
});

// 4c. camera_count accepts valid number (onNext called with correct value)
test('camera_count accepts valid number 5', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.change(screen.getByLabelText(/venue address/i), {
    target: { value: '789 Elm St' },
  });
  fireEvent.change(screen.getByLabelText(/court count/i), {
    target: { value: '2' },
  });
  fireEvent.change(screen.getByLabelText(/camera count/i), {
    target: { value: '5' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalled();
  });
  expect(onNext.mock.calls[0][0]).toMatchObject({ camera_count: 5 });
});

// 5a. has_front_desk defaults to false
test('has_front_desk checkbox defaults to unchecked (false)', () => {
  renderStep();
  const checkbox = screen.getByRole('checkbox', { name: /has front desk/i }) as HTMLInputElement;
  expect(checkbox.checked).toBe(false);
});

// 5b. has_pingpod_wifi defaults to false
test('has_pingpod_wifi checkbox defaults to unchecked (false)', () => {
  renderStep();
  const checkbox = screen.getByRole('checkbox', {
    name: /has pingpod wifi/i,
  }) as HTMLInputElement;
  expect(checkbox.checked).toBe(false);
});

// 5c. has_front_desk can be toggled on
test('has_front_desk can be toggled on', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  const checkbox = screen.getByRole('checkbox', { name: /has front desk/i }) as HTMLInputElement;
  fireEvent.click(checkbox);
  expect(checkbox.checked).toBe(true);
  // Also submit to confirm value passed to onNext
  fireEvent.change(screen.getByLabelText(/venue address/i), {
    target: { value: '10 Court Rd' },
  });
  fireEvent.change(screen.getByLabelText(/court count/i), {
    target: { value: '1' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalled();
  });
  expect(onNext.mock.calls[0][0]).toMatchObject({ has_front_desk: true });
});

// 5d. has_pingpod_wifi can be toggled on
test('has_pingpod_wifi can be toggled on', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  const checkbox = screen.getByRole('checkbox', {
    name: /has pingpod wifi/i,
  }) as HTMLInputElement;
  fireEvent.click(checkbox);
  expect(checkbox.checked).toBe(true);
  fireEvent.change(screen.getByLabelText(/venue address/i), {
    target: { value: '10 Court Rd' },
  });
  fireEvent.change(screen.getByLabelText(/court count/i), {
    target: { value: '1' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalled();
  });
  expect(onNext.mock.calls[0][0]).toMatchObject({ has_pingpod_wifi: true });
});
