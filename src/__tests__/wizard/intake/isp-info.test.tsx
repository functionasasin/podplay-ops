// Tests: IspInfoStep — ISP dropdown with 7 PH options, Other reveals custom input, Starlink still blocked.
// Spec: business-logic/isp-validation.md, ui-spec/validation-messages.md

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeAll, vi } from 'vitest';
import { IspInfoStep } from '@/components/wizard/intake/IspInfoStep';

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

function renderStep(courtCount = 4, onNext = vi.fn()) {
  return render(React.createElement(IspInfoStep, { courtCount, onNext }));
}

/** Open the ISP SearchableSelect dropdown and return the input element. */
function openIspDropdown() {
  const input = screen.getByPlaceholderText(/Select ISP provider/i);
  fireEvent.focus(input);
  return input;
}

/** Open the ISP dropdown and select an option by label text. */
function selectIspOption(label: string) {
  openIspDropdown();
  fireEvent.mouseDown(screen.getByText(label));
}

// ISP-01: SearchableSelect renders with 7 PH ISP options
test('ISP-01: renders SearchableSelect with 7 ISP options', () => {
  renderStep();
  openIspDropdown();
  const options = screen.getAllByRole('option');
  expect(options).toHaveLength(7);
});

// ISP-02: Selecting "PLDT Fiber" sets isp_provider value (displayed in the select input)
test('ISP-02: selecting "PLDT Fiber" sets isp_provider value', () => {
  renderStep(4);
  selectIspOption('PLDT Fiber');
  const input = screen.getByRole('textbox') as HTMLInputElement;
  expect(input.value).toBe('PLDT Fiber');
});

// ISP-03: Selecting "Other" reveals a custom text input
test('ISP-03: selecting "Other" reveals custom text input', () => {
  renderStep();
  selectIspOption('Other');
  expect(screen.getByPlaceholderText(/Enter custom ISP name/i)).toBeInTheDocument();
});

// ISP-04: Entering a custom ISP name stores it in the form (no "required" error on submit)
test('ISP-04: entering custom ISP name stores correctly', async () => {
  renderStep(4);
  selectIspOption('Other');
  fireEvent.change(screen.getByPlaceholderText(/Enter custom ISP name/i), {
    target: { value: 'MyLocalISP' },
  });
  const customInput = screen.getByPlaceholderText(/Enter custom ISP name/i) as HTMLInputElement;
  expect(customInput.value).toBe('MyLocalISP');
  // Submitting should not show "required" error since value is set
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.queryByText('ISP provider name is required')).not.toBeInTheDocument();
  });
});

// 1. "Starlink" via custom input shows hard error banner
test('"Starlink" in ISP provider shows Starlink incompatibility banner', () => {
  renderStep();
  selectIspOption('Other');
  fireEvent.change(screen.getByPlaceholderText(/Enter custom ISP name/i), {
    target: { value: 'Starlink' },
  });
  expect(
    screen.getByText(/Starlink is not compatible with PodPlay Replay/i),
  ).toBeInTheDocument();
});

// 2. "starlink" (lowercase) also triggers banner
test('"starlink" (lowercase) shows Starlink incompatibility banner', () => {
  renderStep();
  selectIspOption('Other');
  fireEvent.change(screen.getByPlaceholderText(/Enter custom ISP name/i), {
    target: { value: 'starlink' },
  });
  expect(
    screen.getByText(/Starlink is not compatible with PodPlay Replay/i),
  ).toBeInTheDocument();
});

// 3. Non-Starlink provider does NOT show banner
test('Non-Starlink provider does not show Starlink banner', () => {
  renderStep();
  selectIspOption('PLDT Fiber');
  expect(screen.queryByText(/Starlink is not compatible/i)).not.toBeInTheDocument();
});

// 4. Continue button is disabled when Starlink is detected (hard block)
test('Continue button is disabled when Starlink is detected', () => {
  renderStep();
  selectIspOption('Other');
  fireEvent.change(screen.getByPlaceholderText(/Enter custom ISP name/i), {
    target: { value: 'Starlink' },
  });
  const button = screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
});

// 5. Upload speed below fiber minimum for 4 courts (min=50 Mbps) shows warning
test('upload speed below 50 Mbps for 4 courts shows upload warning with exact spec message', () => {
  renderStep(4);
  fireEvent.change(screen.getByLabelText(/Upload Speed/i), { target: { value: '30' } });
  expect(
    screen.getByText('Upload speed may be insufficient. Recommended: 50 Mbps for 4 courts on fiber.'),
  ).toBeInTheDocument();
});

// 6. Upload speed at fiber minimum (50 Mbps) for 4 courts shows NO warning
test('upload speed of 50 Mbps for 4 courts shows no upload warning', () => {
  renderStep(4);
  fireEvent.change(screen.getByLabelText(/Upload Speed/i), { target: { value: '50' } });
  expect(screen.queryByText(/Upload speed may be insufficient/i)).not.toBeInTheDocument();
});

// 7. Download speed below fiber minimum for 4 courts (min=100 Mbps) shows warning
test('download speed below 100 Mbps for 4 courts shows download warning with exact spec message', () => {
  renderStep(4);
  fireEvent.change(screen.getByLabelText(/Download Speed/i), { target: { value: '80' } });
  expect(
    screen.getByText('Download speed 80 Mbps is below the 100 Mbps minimum for fiber with 4 courts.'),
  ).toBeInTheDocument();
});

// 8. Download speed at fiber minimum (100 Mbps) for 4 courts shows NO warning
test('download speed of 100 Mbps for 4 courts shows no download warning', () => {
  renderStep(4);
  fireEvent.change(screen.getByLabelText(/Download Speed/i), { target: { value: '100' } });
  expect(screen.queryByText(/is below the.*minimum for fiber/i)).not.toBeInTheDocument();
});

// 9. isp_provider is required — empty value shows validation error on submit
test('empty isp_provider shows "ISP provider name is required" on submit', async () => {
  renderStep();
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByText('ISP provider name is required')).toBeInTheDocument();
  });
});

// 10. Speed thresholds scale with court count — 8 courts (5–11 band) need 150 Mbps upload
test('upload speed below 150 Mbps for 8 courts shows upload warning for 5–11 court band', () => {
  renderStep(8);
  fireEvent.change(screen.getByLabelText(/Upload Speed/i), { target: { value: '100' } });
  expect(
    screen.getByText('Upload speed may be insufficient. Recommended: 150 Mbps for 8 courts on fiber.'),
  ).toBeInTheDocument();
});
