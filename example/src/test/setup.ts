import { afterEach, beforeEach, vi } from 'vitest';

if (!globalThis.CSS) {
  Object.defineProperty(globalThis, 'CSS', { value: {} });
}

if (!globalThis.CSS.escape) {
  globalThis.CSS.escape = (value: string) =>
    value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

// React requires this flag when tests call act() directly. Testing Library sets
// it for its own helpers, but declaring it here keeps imperative store and
// action tests on the same contract.
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const reactActDiagnostic = /not wrapped in act/i;

let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  const actErrors = consoleErrorSpy?.mock.calls
    .map((args: unknown[]) => args.map(String).join(' '))
    .filter((message: string) => reactActDiagnostic.test(message));

  consoleErrorSpy?.mockRestore();

  if (actErrors?.length) {
    throw new Error(
      `React act() diagnostic detected:\n${actErrors.join('\n')}`
    );
  }
});
