/**
 * @fileoverview Simple logging system for Context-Action framework
 * Provides configurable logging with level filtering
 */

import { Logger, LogLevel } from './types.js';

/**
 * Simple console-based logger implementation
 */
export class ConsoleLogger implements Logger {
  constructor(private level: LogLevel = LogLevel.ERROR) {}

  debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }

  info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  error(message: string, error?: any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error || '');
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

/**
 * No-op logger that discards all log messages
 */
export class NoopLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Get log level from environment variable
 */
export function getLogLevelFromEnv(): LogLevel {
  const envLevel = typeof process !== 'undefined' ? process.env?.CONTEXT_ACTION_LOG_LEVEL : undefined;
  
  switch (envLevel?.toUpperCase()) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'NONE': return LogLevel.NONE;
    default: return LogLevel.ERROR;
  }
}

/**
 * Create a logger instance with the specified level
 */
export function createLogger(level?: LogLevel): Logger {
  const logLevel = level ?? getLogLevelFromEnv();
  
  if (logLevel === LogLevel.NONE) {
    return new NoopLogger();
  }
  
  return new ConsoleLogger(logLevel);
}