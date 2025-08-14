/**
 * Jest setup file for Core testing environment
 */

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
};

// Mock performance.now() for timing-related tests
global.performance = {
  ...performance,
  now: jest.fn(() => Date.now()),
};

// Mock setTimeout and clearTimeout for debounce/throttle tests
jest.useFakeTimers();

// Setup test utilities
beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.useFakeTimers();
});