/**
 * @fileoverview Context-Action Logger Package Entry Point
 * @implements logger-system
 * @implements cross-platform-logging
 * @implements environment-configuration
 * @memberof packages
 * 
 * Lightweight, configurable logging system for the Context-Action framework
 * with cross-platform environment variable support and level-based filtering.
 * 
 * This package provides structured logging capabilities for monitoring and debugging
 * action pipeline execution, store operations, and general application flow.
 * 
 * Key Features:
 * - Hierarchical log levels with configurable filtering
 * - Cross-platform environment variable support (Node.js + Vite)
 * - Console-based and no-op logger implementations
 * - Automatic level detection from NODE_ENV
 * - Runtime level adjustment capability
 * - TypeScript interface for custom logger implementations
 * 
 * Environment Variables:
 * - CONTEXT_ACTION_LOG_LEVEL: 'TRACE'|'DEBUG'|'INFO'|'WARN'|'ERROR'|'NONE'
 * - CONTEXT_ACTION_DEBUG: 'true'|'1' enables DEBUG level
 * - CONTEXT_ACTION_TRACE: 'true'|'1' enables TRACE level  
 * - CONTEXT_ACTION_LOGGER_NAME: Custom logger name
 * - NODE_ENV: Auto-configures level ('development' -> DEBUG, 'production' -> ERROR)
 * 
 * @example
 * ```typescript
 * import { createLogger, LogLevel } from '@context-action/logger';
 * 
 * // Create logger with environment-based configuration
 * const logger = createLogger();
 * 
 * // Or with explicit level
 * const debugLogger = createLogger(LogLevel.DEBUG);
 * 
 * // Use structured logging
 * logger.trace('Pipeline execution started', { action: 'updateUser', payload });
 * logger.debug('Handler registration', { handlerId: 'user-validator', priority: 10 });
 * logger.info('Store updated successfully', { storeName: 'user', newValue });
 * logger.warn('Performance threshold exceeded', { executionTime: 1500 });
 * logger.error('Action pipeline failed', error);
 * 
 * // Runtime level adjustment
 * logger.setLevel(LogLevel.WARN);
 * ```
 */

import { Logger, LogLevel } from './types.js';

// Export types and values
export type { Logger };
export { LogLevel };

// Export trace collection system
export {
  TraceCollector,
  TraceCategory,
  DefaultTraceProcessor,
  FileTraceProcessor,
  createTraceEnabledLogger
} from './trace-collector.js';

export type {
  TraceEntry,
  TraceCollectorConfig,
  TraceProcessor,
  TraceContext
} from './trace-collector.js';

// Export framework trace integration
export {
  initializeFrameworkTracing,
  createFrameworkLogger,
  getGlobalTraceCollector,
  getFrameworkTraceAnalysis,
  FrameworkLoggers,
  TraceDebugUtils,
  useComponentTracing
} from './trace-integration.js';

export type { FrameworkTraceConfig } from './trace-integration.js';

// Export universal trace logging system
export {
  UniversalTraceLogger,
  UniversalTraceCollector,
  TraceSource,
  createUniversalTraceLogger,
  createFrameworkUniversalLogger
} from './universal-trace-logger.js';

export type {
  UniversalTraceEntry,
  UniversalTraceConfig
} from './universal-trace-logger.js';

// Export log art utilities with console-log-colors
export {
  AreaColors,
  AreaIcons,
  AsciiArt,
  createColoredHeader,
  createColoredSeparator,
  createStartMarker,
  createEndMarker,
  createErrorMarker,
  createInfoMarker,
  createDebugMarker,
  createWarningMarker,
  createColoredLogger,
  LogArtHelpers
} from './log-art.js';

export type {
  ExecutionArea,
  ColoredLogger
} from './log-art.js';

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
 * @implements logger-implementation
 * @implements console-logger
 * @memberof core-concepts
 * @since 0.0.1
 * 
 * Provides configurable logging with level filtering for debugging and monitoring
 * action pipeline execution and store operations. Uses browser console methods
 * with proper level filtering and formatting.
 * 
 * @example
 * ```typescript
 * // Create logger with specific level
 * const logger = new ConsoleLogger(LogLevel.DEBUG);
 * 
 * // Use logger methods
 * logger.trace('Execution step', { step: 1, data: payload });
 * logger.debug('Debug info', { state: 'processing' });
 * logger.info('Operation complete');
 * logger.warn('Performance issue detected');
 * logger.error('Critical error', error);
 * 
 * // Change level at runtime
 * logger.setLevel(LogLevel.WARN);
 * ```
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
 * Get log level from environment variables with cross-platform support
 * @implements environment-configuration
 * @implements cross-platform-support
 * @memberof api-terms  
 * @since 1.0.0
 * 
 * Automatically detects appropriate log level from multiple environment sources
 * with intelligent fallbacks and NODE_ENV-based configuration.
 * 
 * Priority order:
 * 1. CONTEXT_ACTION_TRACE='true' -> TRACE level
 * 2. CONTEXT_ACTION_DEBUG='true' -> DEBUG level  
 * 3. CONTEXT_ACTION_LOG_LEVEL explicit value
 * 4. NODE_ENV-based auto-configuration
 * 5. Default ERROR level
 * 
 * @returns Detected LogLevel based on environment configuration
 * 
 * @example
 * ```typescript
 * // Environment examples:
 * // NODE_ENV=development -> LogLevel.DEBUG
 * // NODE_ENV=production -> LogLevel.ERROR
 * // CONTEXT_ACTION_LOG_LEVEL=INFO -> LogLevel.INFO
 * // CONTEXT_ACTION_DEBUG=true -> LogLevel.DEBUG
 * // CONTEXT_ACTION_TRACE=1 -> LogLevel.TRACE
 * 
 * const level = getLogLevelFromEnv();
 * const logger = createLogger(level);
 * ```
 * 
 * @note Load .env files in your application with 'import "dotenv/config"'
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
 * Create a logger instance with specified or environment-based level
 * @implements logger-factory
 * @implements smart-logger-creation
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Factory function for creating appropriately configured logger instances
 * with automatic environment detection and optimal logger selection.
 * 
 * @param level - Optional explicit log level. If not provided, uses getLogLevelFromEnv()
 * @returns Logger instance (ConsoleLogger or NoopLogger based on level)
 * 
 * @example
 * ```typescript
 * // Environment-based logger creation
 * const logger = createLogger(); // Uses NODE_ENV and environment variables
 * 
 * // Explicit level logger creation
 * const debugLogger = createLogger(LogLevel.DEBUG);
 * const productionLogger = createLogger(LogLevel.ERROR);
 * const silentLogger = createLogger(LogLevel.NONE); // Returns NoopLogger
 * 
 * // Usage in ActionRegister
 * const actionRegister = new ActionRegister({ 
 *   logger: createLogger(LogLevel.DEBUG),
 *   name: 'UserActions' 
 * });
 * ```
 */
export function createLogger(level?: LogLevel): Logger {
  const logLevel = level ?? getLogLevelFromEnv();
  
  if (logLevel === LogLevel.NONE) {
    return new NoopLogger();
  }
  
  return new ConsoleLogger(logLevel);
}