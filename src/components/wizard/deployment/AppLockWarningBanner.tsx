/**
 * AppLockWarningBanner — Phase 12, Step 108 (Flic button pairing).
 * Hardcoded static banner per spec: wizard-deployment.md § Phase 12, Step 108a
 */
export function AppLockWarningBanner() {
  return (
    <div
      className="flex items-start gap-2 border-l-4 border-red-600 bg-red-50 px-4 py-3 rounded-r-lg mb-4"
      role="alert"
      data-testid="app-lock-warning"
    >
      <span className="text-red-600 text-base leading-none mt-0.5">🔴</span>
      <div className="text-sm text-red-900 space-y-1">
        <p className="font-semibold">CRITICAL: App Lock must be OFF before pairing Flic buttons.</p>
        <p>Go to Mosyle → select the location → turn off App Lock.</p>
        <p>Exit Guided Access on the iPad first.</p>
        <p>Re-enable App Lock when pairing is complete.</p>
      </div>
    </div>
  );
}
