import { MockFileSystem } from './helpers/mock-filesystem';

// Global test setup
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Setup mock file system
  MockFileSystem.reset();
});

afterEach(() => {
  // Cleanup any test artifacts
});

// Global test configuration
jest.setTimeout(10000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to suppress logs during testing
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};