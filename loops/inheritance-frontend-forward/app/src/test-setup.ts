import '@testing-library/jest-dom/vitest'

// Make navigator.clipboard writable for tests that mock it via Object.assign
// jsdom defines clipboard as a getter-only accessor, so we shadow it with
// a getter/setter on the navigator instance to allow test reassignment.
let _clipboard: Record<string, unknown> = {
  writeText: async () => {},
  readText: async () => '',
};
Object.defineProperty(navigator, 'clipboard', {
  get() { return _clipboard; },
  set(val) { _clipboard = val; },
  configurable: true,
  enumerable: true,
});
