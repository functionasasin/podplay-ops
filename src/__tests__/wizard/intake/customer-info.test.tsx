// Tests: CustomerInfoStep renders, validates required fields with exact spec error messages,
// allows optional contact_phone, and calls onNext with form data on valid submission.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CustomerInfoStep } from '@/components/wizard/intake/CustomerInfoStep';

function renderStep(onNext = vi.fn()) {
  return render(React.createElement(CustomerInfoStep, { onNext }));
}

// 1. Empty customer_name shows required error
test('empty customer_name shows "Customer name is required"', async () => {
  renderStep();
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('Customer name is required')).toBeInTheDocument();
  });
});

// 2. Empty contact_email shows required/email error
test('empty contact_email shows "Enter a valid email address"', async () => {
  renderStep();
  // fill customer_name to isolate email error
  fireEvent.change(screen.getByLabelText(/customer name/i), {
    target: { value: 'Acme Corp' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });
});

// 3. Invalid email format shows "Enter a valid email address"
test('invalid email format shows "Enter a valid email address"', async () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/customer name/i), {
    target: { value: 'Acme Corp' },
  });
  fireEvent.change(screen.getByLabelText(/contact email/i), {
    target: { value: 'notanemail' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });
});

// 4. contact_phone is optional — no error when left empty
test('contact_phone is optional — no error without it', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.change(screen.getByLabelText(/customer name/i), {
    target: { value: 'Acme Corp' },
  });
  fireEvent.change(screen.getByLabelText(/contact email/i), {
    target: { value: 'test@example.com' },
  });
  // leave contact_phone empty
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalled();
  });
  expect(screen.queryByText(/phone/i)).not.toHaveClass?.('text-destructive');
});

// 5. Valid submission calls onNext with correct form data
test('valid submission calls onNext with customer_name, contact_email, contact_phone', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  fireEvent.change(screen.getByLabelText(/customer name/i), {
    target: { value: 'Acme Corp' },
  });
  fireEvent.change(screen.getByLabelText(/contact email/i), {
    target: { value: 'alice@acme.com' },
  });
  fireEvent.change(screen.getByLabelText(/contact phone/i), {
    target: { value: '555-1234' },
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalled();
  });
  expect(onNext.mock.calls[0][0]).toEqual({
    customer_name: 'Acme Corp',
    contact_email: 'alice@acme.com',
    contact_phone: '555-1234',
  });
});
