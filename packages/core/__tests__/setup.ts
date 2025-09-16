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

// 🔧 Fix: Use real timers by default to prevent hanging tests
// Individual tests can opt into fake timers when needed

// Setup test utilities
beforeEach(() => {
  jest.clearAllMocks();
  // 🔧 Fix: Only clear timers if we're using fake timers
  if (jest.isMockFunction(setTimeout)) {
    jest.clearAllTimers();
  }
});

afterEach(() => {
  // 🔧 Fix: Clean up any pending operations and restore real timers
  if (jest.isMockFunction(setTimeout)) {
    jest.runAllTimers();
    jest.useRealTimers();
  }
});