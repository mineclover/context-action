/**
 * Jest setup file for React testing environment
 */

import '@testing-library/jest-dom';

// Direct act() calls in hook and provider lifecycle tests must use React's
// explicit test environment contract, not rely only on Testing Library helpers.
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

const reactActDiagnostic = /not wrapped in act/i;

afterEach(() => {
  const errorMock = global.console.error;
  if (jest.isMockFunction(errorMock)) {
    const actErrors = errorMock.mock.calls
      .map((args: unknown[]) => args.map(String).join(' '))
      .filter((message: string) => reactActDiagnostic.test(message));
    if (actErrors.length) {
      throw new Error(
        `React act() diagnostic detected:\n${actErrors.join('\n')}`
      );
    }
  }
  jest.clearAllMocks();
});

// Mock ResizeObserver if needed
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
global.sessionStorage = localStorageMock as any;
