/**
 * @fileoverview Simple logging system for Context-Action framework
 * Provides configurable logging with level filtering and .env support
 */

import { Logger, LogLevel } from './types.js';

// Export types and values
export type { Logger };
export { LogLevel };

// Note: .env loading should be done by the application
// Import dotenv in your application entry point:
// import 'dotenv/config';

/**
 * Safely get environment variable with support for both Node.js and Vite environments
 * @param name - Environment variable name (without VITE_ prefix)
 * @param vitePrefix - Prefix for Vite environment variables (default: 'VITE_')
 * @returns Environment variable value or undefined
 */
function getEnvVar(name: string, vitePrefix: string = 'VITE_'): string | undefined {
  // 브라우저(Vite) 환경에서 안전하게 import.meta.env 접근 (타입 가드 사용)
  if (
    typeof import.meta !== 'undefined' &&
    typeof (import.meta as any).env !== 'undefined'
  ) {
    const viteVar = (import.meta as any).env[`${vitePrefix}${name}`];
    if (viteVar !== undefined) return viteVar;
  }

  // Node.js 환경 - process.env 안전 체크
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  
  return undefined;
}

/**
 * Simple console-based logger implementation
 * 
 * Provides configurable logging with level filtering for debugging and monitoring
 * action pipeline execution and store operations
 * 
 * @since 0.0.1
 */
export class ConsoleLogger implements Logger {
  constructor(private level: LogLevel = LogLevel.ERROR) {}

  trace(message: string, data?: any): void {
    if (this.level <= LogLevel.TRACE) {
      console.debug(`[TRACE] ${message}`, data || '');
    }
  }

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
 * 
 * Used for production environments or when logging is disabled
 */
export class NoopLogger implements Logger {
  private level: LogLevel = LogLevel.NONE;
  
  trace(): void {}
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
  
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  getLevel(): LogLevel {
    return this.level;
  }
}

/**
 * Get log level from environment variable with .env support
 * Supports both CONTEXT_ACTION_LOG_LEVEL and CONTEXT_ACTION_TRACE for backward compatibility
 * Note: Load .env in your application with 'import "dotenv/config"'
 */
export function getLogLevelFromEnv(): LogLevel {
  // Use safe environment variable access
  const envLevel = getEnvVar('CONTEXT_ACTION_LOG_LEVEL');
  const envTrace = getEnvVar('CONTEXT_ACTION_TRACE');
  const envDebug = getEnvVar('CONTEXT_ACTION_DEBUG');
  const nodeEnv = getEnvVar('NODE_ENV');
  
  // If CONTEXT_ACTION_TRACE is set to 'true' or '1', enable trace mode
  if (envTrace === 'true' || envTrace === '1') {
    return LogLevel.TRACE;
  }
  
  // If CONTEXT_ACTION_DEBUG is set to 'true' or '1', enable debug mode
  if (envDebug === 'true' || envDebug === '1') {
    return LogLevel.DEBUG;
  }
  
  // Auto-configure based on NODE_ENV
  if (nodeEnv === 'development' && !envLevel) {
    return LogLevel.DEBUG;
  }
  
  if (nodeEnv === 'production' && !envLevel) {
    return LogLevel.ERROR;
  }
  
  // Parse explicit log level
  switch (envLevel?.toUpperCase()) {
    case 'TRACE': return LogLevel.TRACE;
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'NONE': return LogLevel.NONE;
    default: return LogLevel.ERROR;
  }
}

/**
 * Get logger name from environment variable
 */
export function getLoggerNameFromEnv(): string {
  const envName = getEnvVar('CONTEXT_ACTION_LOGGER_NAME');
  return envName || 'ActionRegister';
}

/**
 * Get debug flag from environment variable
 */
export function getDebugFromEnv(): boolean {
  // Use safe environment variable access
  const envDebug = getEnvVar('CONTEXT_ACTION_DEBUG');
  const nodeEnv = getEnvVar('NODE_ENV');
  
  // If explicitly set
  if (envDebug === 'true' || envDebug === '1') return true;
  if (envDebug === 'false' || envDebug === '0') return false;
  
  // Auto-configure based on NODE_ENV
  return nodeEnv === 'development';
}

/**
 * Create a logger instance with the specified level
 * 
 * Factory function for creating configured logger instances
 */
export function createLogger(level?: LogLevel): Logger {
  const logLevel = level ?? getLogLevelFromEnv();
  
  if (logLevel === LogLevel.NONE) {
    return new NoopLogger();
  }
  
  return new ConsoleLogger(logLevel);
}