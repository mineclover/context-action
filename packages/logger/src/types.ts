/**
 * @fileoverview Core type definitions for the Context-Action logger
 */

/**
 * Logger interface for customizable logging
 * 
 * Provides structured logging capability for monitoring and debugging
 * the Context-Action framework operations
 */
export interface Logger {
  trace(message: string, data?: any): void;
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: any): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

/**
 * Log levels for filtering log output
 * 
 * Hierarchical log levels for controlling verbosity of debug output
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 5
}
