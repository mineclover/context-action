/**
 * Mock for @context-action/logger package to avoid import.meta issues in Jest
 */

export interface MockLogger {
  debug: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  trace: jest.Mock;
  setLevel: jest.Mock;
  getLevel: jest.Mock;
  child: jest.Mock;
}

export const createLogger = (): MockLogger => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  trace: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn(),
  child: jest.fn(() => createLogger()),
});

export const logger: MockLogger = createLogger();

export default {
  createLogger,
  logger,
};