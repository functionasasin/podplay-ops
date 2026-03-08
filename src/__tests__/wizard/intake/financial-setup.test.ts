// Tests: FinancialSetupStep — target_go_live_date (future date) and deposit_amount (> 0) validation.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { FinancialSetupStep } from '@/components/wizard/intake/FinancialSetupStep';

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

const todayStr = toDateString(new Date());
const pastStr = toDateString(new Date(Date.now() - 86400000));
const futureStr = toDateString(new Date(Date.now() + 86400000));

function renderStep(onNext = vi.fn()) {
  return render(React.createElement(FinancialSetupStep, { onNext }));
}

// 1. Past date triggers error
test('past target_go_live_date triggers "Go-live date must be in the future"', async () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/target go-live date/i), { target: { value: pastStr } });
  fireEvent.change(screen.getByLabelText(/deposit amount/i), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('Go-live date must be in the future')).toBeInTheDocument();
  });
});

// 2. Today's date is rejected (must be strictly in the future)
test("today's date for target_go_live_date is rejected", async () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/target go-live date/i), { target: { value: todayStr } });
  fireEvent.change(screen.getByLabelText(/deposit amount/i), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('Go-live date must be in the future')).toBeInTheDocument();
  });
});

// 3. Future date passes validation and calls onNext
test('future target_go_live_date passes validation and calls onNext', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.change(screen.getByLabelText(/target go-live date/i), { target: { value: futureStr } });
  fireEvent.change(screen.getByLabelText(/deposit amount/i), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalledWith({ target_go_live_date: futureStr, deposit_amount: 500 });
  });
});

// 4. deposit_amount of 0 triggers exact error message
test('deposit_amount of 0 triggers "Deposit amount must be greater than $0"', async () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/target go-live date/i), { target: { value: futureStr } });
  fireEvent.change(screen.getByLabelText(/deposit amount/i), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('Deposit amount must be greater than $0')).toBeInTheDocument();
  });
});

// 5. Negative deposit_amount triggers error
test('negative deposit_amount triggers "Deposit amount must be greater than $0"', async () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/target go-live date/i), { target: { value: futureStr } });
  fireEvent.change(screen.getByLabelText(/deposit amount/i), { target: { value: '-100' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('Deposit amount must be greater than $0')).toBeInTheDocument();
  });
});

// 6. Positive deposit_amount (500.00) passes validation
test('positive deposit_amount 500.00 passes validation and calls onNext', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.change(screen.getByLabelText(/target go-live date/i), { target: { value: futureStr } });
  fireEvent.change(screen.getByLabelText(/deposit amount/i), { target: { value: '500.00' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalledWith({ target_go_live_date: futureStr, deposit_amount: 500 });
  });
});
