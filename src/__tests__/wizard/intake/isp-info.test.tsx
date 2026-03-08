// Tests: IspInfoStep — Starlink banner, speed threshold warnings, isp_provider required.
// Spec: business-logic/isp-validation.md, ui-spec/validation-messages.md

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { IspInfoStep } from '@/components/wizard/intake/IspInfoStep';

function renderStep(courtCount = 4, onNext = vi.fn()) {
  return render(React.createElement(IspInfoStep, { courtCount, onNext }));
}

// 1. "Starlink" (capital S) shows hard error banner
test('"Starlink" in ISP provider shows Starlink incompatibility banner', () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/ISP Provider/i), { target: { value: 'Starlink' } });
  expect(
    screen.getByText(/Starlink is not compatible with PodPlay Replay/i)
  ).toBeInTheDocument();
});

// 2. "starlink" (all lowercase) also triggers banner
test('"starlink" (lowercase) shows Starlink incompatibility banner', () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/ISP Provider/i), { target: { value: 'starlink' } });
  expect(
    screen.getByText(/Starlink is not compatible with PodPlay Replay/i)
  ).toBeInTheDocument();
});

// 3. Non-Starlink provider does NOT show banner
test('Non-Starlink provider does not show Starlink banner', () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/ISP Provider/i), { target: { value: 'Verizon Fios' } });
  expect(screen.queryByText(/Starlink is not compatible/i)).not.toBeInTheDocument();
});

// 4. Continue button is disabled when Starlink is detected (hard block)
test('Continue button is disabled when Starlink is detected', () => {
  renderStep();
  fireEvent.change(screen.getByLabelText(/ISP Provider/i), { target: { value: 'Starlink' } });
  const button = screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
});

// 5. Upload speed below fiber minimum for 4 courts (min=50 Mbps) shows warning
test('upload speed below 50 Mbps for 4 courts shows upload warning with exact spec message', () => {
  renderStep(4);
  fireEvent.change(screen.getByLabelText(/ISP Provider/i), { target: { value: 'Spectrum' } });
  fireEvent.change(screen.getByLabelText(/Upload Speed/i), { target: { value: '30' } });
  expect(
    screen.getByText('Upload speed may be insufficient. Recommended: 50 Mbps for 4 courts on fiber.')
  ).toBeInTheDocument();
});

// 6. Upload speed at fiber minimum (50 Mbps) for 4 courts shows NO warning
test('upload speed of 50 Mbps for 4 courts shows no upload warning', () => {
  renderStep(4);
  fireEvent.change(screen.getByLabelText(/ISP Provider/i), { target: { value: 'Spectrum' } });
  fireEvent.change(screen.getByLabelText(/Upload Speed/i), { target: { value: '50' } });
  expect(screen.queryByText(/Upload speed may be insufficient/i)).not.toBeInTheDocument();
});

// 7. Download speed below fiber minimum for 4 courts (min=100 Mbps) shows warning
test('download speed below 100 Mbps for 4 courts shows download warning with exact spec message', () => {
  renderStep(4);
  fireEvent.change(screen.getByLabelText(/ISP Provider/i), { target: { value: 'Spectrum' } });
  fireEvent.change(screen.getByLabelText(/Download Speed/i), { target: { value: '80' } });
  expect(
    screen.getByText('Download speed 80 Mbps is below the 100 Mbps minimum for fiber with 4 courts.')
  ).toBeInTheDocument();
});

// 8. Download speed at fiber minimum (100 Mbps) for 4 courts shows NO warning
test('download speed of 100 Mbps for 4 courts shows no download warning', () => {
  renderStep(4);
  fireEvent.change(screen.getByLabelText(/ISP Provider/i), { target: { value: 'Spectrum' } });
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
  fireEvent.change(screen.getByLabelText(/ISP Provider/i), { target: { value: 'Spectrum' } });
  fireEvent.change(screen.getByLabelText(/Upload Speed/i), { target: { value: '100' } });
  expect(
    screen.getByText('Upload speed may be insufficient. Recommended: 150 Mbps for 8 courts on fiber.')
  ).toBeInTheDocument();
});
