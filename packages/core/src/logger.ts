/**
 * Log levels in order of severity (lowest to highest)
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

/**
 * Logger interface for custom logger implementations
 */
export interface Logger {
  trace(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  fatal(message: string, ...args: any[]): void;
}

/**
 * Default console logger implementation
 */
export class ConsoleLogger implements Logger {
  constructor(private level: LogLevel = LogLevel.ERROR) {}

  protected shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string): string {
    return `[${level.toUpperCase()}] ${message}`;
  }

  trace(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.trace(this.formatMessage('trace', message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  fatal(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      console.error(this.formatMessage('fatal', message), ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

/**
 * Parse log level from string
 */
export function parseLogLevel(level: string): LogLevel {
  const upperLevel = level.toUpperCase();
  switch (upperLevel) {
    case 'TRACE':
      return LogLevel.TRACE;
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    case 'FATAL':
      return LogLevel.FATAL;
    default:
      return LogLevel.ERROR;
  }
}

/**
 * Get log level from environment variable or default to ERROR
 */
export function getLogLevelFromEnv(): LogLevel {
  if (typeof process !== 'undefined' && process.env) {
    const envLevel = process.env.LOG_LEVEL || process.env.ACTION_LOG_LEVEL;
    if (envLevel) {
      return parseLogLevel(envLevel);
    }
  }
  return LogLevel.ERROR;
}

/**
 * Extract trace ID from payload if it exists
 */
export function extractTraceIdFromPayload(payload: any): string | undefined {
  if (payload && typeof payload === 'object') {
    return payload._traceId || payload.traceId || payload.trace_id;
  }
  return undefined;
}

/**
 * Extract session ID from payload if it exists
 */
export function extractSessionIdFromPayload(payload: any): string | undefined {
  if (payload && typeof payload === 'object') {
    return payload._sessionId || payload.sessionId || payload.session_id;
  }
  return undefined;
}

/**
 * Create OTEL context from payload
 */
export function createOtelContextFromPayload(payload: any): OtelContext {
  return {
    traceId: extractTraceIdFromPayload(payload),
    sessionId: extractSessionIdFromPayload(payload),
    metadata: payload
  };
}

/**
 * OpenTelemetry context interface for tracing
 */
export interface OtelContext {
  /** Session ID for tracking user sessions */
  sessionId?: string;
  /** Trace ID for distributed tracing */
  traceId?: string;
  /** Span ID for current operation */
  spanId?: string;
  /** Parent span ID for operation hierarchy */
  parentSpanId?: string;
  /** Additional context metadata */
  metadata?: Record<string, any>;
}

/**
 * Extended logger interface with OpenTelemetry support
 */
export interface OtelLogger extends Logger {
  /** Set OpenTelemetry context */
  setContext(context: OtelContext): void;
  /** Get current OpenTelemetry context */
  getContext(): OtelContext;
  /** Clear OpenTelemetry context */
  clearContext(): void;
  /** Log with OpenTelemetry context */
  logWithContext(level: LogLevel, message: string, ...args: any[]): void;
}

/**
 * OpenTelemetry-aware console logger implementation
 */
export class OtelConsoleLogger extends ConsoleLogger implements OtelLogger {
  private context: OtelContext = {};

  constructor(level: LogLevel = LogLevel.ERROR) {
    super(level);
  }

  setContext(context: OtelContext): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): OtelContext {
    return { ...this.context };
  }

  clearContext(): void {
    this.context = {};
  }

  private formatWithContext(level: string, message: string): string {
    const contextParts: string[] = [];
    
    if (this.context.sessionId) {
      contextParts.push(`session=${this.context.sessionId}`);
    }
    if (this.context.traceId) {
      contextParts.push(`trace=${this.context.traceId}`);
    }
    if (this.context.spanId) {
      contextParts.push(`span=${this.context.spanId}`);
    }
    
    const contextStr = contextParts.length > 0 ? ` [${contextParts.join(', ')}]` : '';
    return `[${level.toUpperCase()}]${contextStr} ${message}`;
  }

  logWithContext(level: LogLevel, message: string, ...args: any[]): void {
    const levelName = LogLevel[level].toLowerCase();
    const formattedMessage = this.formatWithContext(levelName, message);
    
    switch (level) {
      case LogLevel.TRACE:
        if (this.shouldLog(LogLevel.TRACE)) {
          console.trace(formattedMessage, ...args);
        }
        break;
      case LogLevel.DEBUG:
        if (this.shouldLog(LogLevel.DEBUG)) {
          console.debug(formattedMessage, ...args);
        }
        break;
      case LogLevel.INFO:
        if (this.shouldLog(LogLevel.INFO)) {
          console.info(formattedMessage, ...args);
        }
        break;
      case LogLevel.WARN:
        if (this.shouldLog(LogLevel.WARN)) {
          console.warn(formattedMessage, ...args);
        }
        break;
      case LogLevel.ERROR:
        if (this.shouldLog(LogLevel.ERROR)) {
          console.error(formattedMessage, ...args);
        }
        break;
      case LogLevel.FATAL:
        if (this.shouldLog(LogLevel.FATAL)) {
          console.error(formattedMessage, ...args);
        }
        break;
    }
  }

  // Override base methods to include context
  trace(message: string, ...args: any[]): void {
    this.logWithContext(LogLevel.TRACE, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.logWithContext(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.logWithContext(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logWithContext(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.logWithContext(LogLevel.ERROR, message, ...args);
  }

  fatal(message: string, ...args: any[]): void {
    this.logWithContext(LogLevel.FATAL, message, ...args);
  }
}
