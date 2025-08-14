/**
 * Mock for @context-action/logger package to avoid import.meta issues in Jest
 */

export const createLogger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  trace: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn(),
  child: jest.fn(() => createLogger()),
});

export const logger = createLogger();

export default {
  createLogger,
  logger,
};