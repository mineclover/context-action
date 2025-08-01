/**
 * @fileoverview Core type definitions for the Context-Action logger
 */

/**
 * Logger interface for customizable logging
 * @implements logger-interface
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Provides structured logging capability for monitoring and debugging
 * the Context-Action framework operations with configurable log levels
 * and cross-platform environment support.
 * 
 * @example
 * ```typescript
 * const logger: Logger = createLogger(LogLevel.DEBUG);
 * 
 * logger.trace('Detailed execution flow', { step: 1, data: payload });
 * logger.debug('Development info', { userId: '123' });
 * logger.info('General information', { status: 'ready' });
 * logger.warn('Potential issues', { performance: 'slow' });
 * logger.error('Critical errors', error);
 * 
 * logger.setLevel(LogLevel.WARN); // Only WARN and ERROR will be logged
 * ```
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
 * @implements log-level
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Hierarchical log levels for controlling verbosity of debug output.
 * Lower numeric values represent more verbose logging levels.
 * 
 * Environment variable mapping:
 * - CONTEXT_ACTION_LOG_LEVEL: 'TRACE'|'DEBUG'|'INFO'|'WARN'|'ERROR'|'NONE'
 * - CONTEXT_ACTION_DEBUG: 'true' sets DEBUG level
 * - CONTEXT_ACTION_TRACE: 'true' sets TRACE level
 * 
 * @example
 * ```typescript
 * // Manual level setting
 * const logger = createLogger(LogLevel.DEBUG);
 * 
 * // Environment-based level (NODE_ENV=development -> DEBUG)
 * const envLogger = createLogger(); // Auto-detects from environment
 * 
 * // Runtime level change
 * logger.setLevel(LogLevel.WARN); // Only warnings and errors
 * ```
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 5
}
