/**
 * Simple logger implementation to replace @context-action/logger
 * This is a minimal replacement for the removed logger package
 */

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  LOG = 3,
  WARN = 4,
  ERROR = 5,
  CRITICAL = 6,
  NONE = 7
}

export interface Logger {
  trace: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  log: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  critical: (message: string, ...args: any[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  setLevel: (level: LogLevel) => void;
  getLevel: () => LogLevel;
}

// Function overloads
export function createLogger(level: LogLevel): Logger;
export function createLogger(prefix: string, level?: LogLevel): Logger;
export function createLogger(prefixOrLevel: string | LogLevel = '[App]', level?: LogLevel): Logger {
  let actualPrefix: string;
  let actualLevel: LogLevel;
  
  if (typeof prefixOrLevel === 'string') {
    actualPrefix = prefixOrLevel;
    actualLevel = level ?? LogLevel.INFO;
  } else {
    actualPrefix = '[App]';
    actualLevel = prefixOrLevel;
  }
  let currentLevel = actualLevel;

  const shouldLog = (level: LogLevel) => level >= currentLevel;

  const log = (level: LogLevel, method: keyof Console, message: string, ...args: any[]) => {
    if (shouldLog(level)) {
      const prefixedMessage = `${actualPrefix} ${message}`;
      (console[method] as any)(prefixedMessage, ...args);
    }
  };

  return {
    trace: (message: string, ...args: any[]) => log(LogLevel.TRACE, 'debug', message, ...args),
    debug: (message: string, ...args: any[]) => log(LogLevel.DEBUG, 'debug', message, ...args),
    info: (message: string, ...args: any[]) => log(LogLevel.INFO, 'info', message, ...args),
    log: (message: string, ...args: any[]) => log(LogLevel.LOG, 'log', message, ...args),
    warn: (message: string, ...args: any[]) => log(LogLevel.WARN, 'warn', message, ...args),
    error: (message: string, ...args: any[]) => log(LogLevel.ERROR, 'error', message, ...args),
    critical: (message: string, ...args: any[]) => log(LogLevel.CRITICAL, 'error', `[CRITICAL] ${message}`, ...args),
    group: (label: string) => console.group(`${actualPrefix} ${label}`),
    groupEnd: () => console.groupEnd(),
    setLevel: (level: LogLevel) => { currentLevel = level; },
    getLevel: () => currentLevel
  };
}

// Helper functions for styled console output
const createStyleHelpers = (theme: { primary: string; secondary: string; accent: string }) => ({
  title: (text: string) => {
    const styledText = `%c${text}`;
    console.log(styledText, `font-size: 18px; font-weight: bold; color: ${theme.primary}`);
    return text;
  },
  subtitle: (text: string) => {
    const styledText = `%c${text}`;
    console.log(styledText, `font-size: 14px; font-weight: bold; color: ${theme.secondary}`);
    return text;
  },
  info: (text: string) => {
    const styledText = `%c${text}`;
    console.log(styledText, 'color: #666');
    return text;
  },
  success: (text: string) => {
    const styledText = `%c✓ ${text}`;
    console.log(styledText, 'color: #4CAF50');
    return `✓ ${text}`;
  },
  warning: (text: string) => {
    const styledText = `%c⚠ ${text}`;
    console.log(styledText, 'color: #FF9800');
    return `⚠ ${text}`;
  },
  error: (text: string) => {
    const styledText = `%c✗ ${text}`;
    console.log(styledText, 'color: #F44336');
    return `✗ ${text}`;
  },
  code: (text: string) => {
    const styledText = `%c${text}`;
    console.log(styledText, 'font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px');
    return text;
  },
  divider: () => {
    const divider = '━'.repeat(50);
    console.log(divider);
    return divider;
  },
  section: (title: string) => {
    const sectionText = `━━━ ${title} ━━━`;
    console.log('');
    console.log(`%c${sectionText}`, `font-weight: bold; color: ${theme.accent}`);
    return sectionText;
  },
  separator: (label?: string) => {
    if (label) {
      return `━━━ ${label} ━━━`;
    }
    return '━'.repeat(50);
  }
});

export const LogArtHelpers = {
  ...createStyleHelpers({ primary: '#4CAF50', secondary: '#2196F3', accent: '#673AB7' }),
  
  // React theme
  react: createStyleHelpers({ primary: '#61DAFB', secondary: '#282C34', accent: '#61DAFB' }),
  
  // Node theme
  node: createStyleHelpers({ primary: '#68A063', secondary: '#333333', accent: '#68A063' }),
  
  // Default theme methods for backward compatibility
  title: (text: string) => {
    console.log(`%c${text}`, 'font-size: 18px; font-weight: bold; color: #4CAF50');
    return text;
  },
  subtitle: (text: string) => {
    console.log(`%c${text}`, 'font-size: 14px; font-weight: bold; color: #2196F3');
    return text;
  },
  info: (text: string) => {
    console.log(`%c${text}`, 'color: #666');
    return text;
  },
  success: (text: string) => {
    console.log(`%c✓ ${text}`, 'color: #4CAF50');
    return `✓ ${text}`;
  },
  warning: (text: string) => {
    console.log(`%c⚠ ${text}`, 'color: #FF9800');
    return `⚠ ${text}`;
  },
  error: (text: string) => {
    console.log(`%c✗ ${text}`, 'color: #F44336');
    return `✗ ${text}`;
  },
  code: (text: string) => {
    console.log(`%c${text}`, 'font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px');
    return text;
  },
  divider: () => {
    const divider = '━'.repeat(50);
    console.log(divider);
    return divider;
  },
  section: (title: string) => {
    const sectionText = `━━━ ${title} ━━━`;
    console.log('');
    console.log(`%c${sectionText}`, 'font-weight: bold; color: #673AB7');
    return sectionText;
  }
};

// Default logger instance
export const defaultLogger = createLogger('[App]');

// Console Logger class for compatibility
export class ConsoleLogger {
  private logger: Logger;
  
  constructor(prefixOrLevel: string | LogLevel = '[Console]', level: LogLevel = LogLevel.INFO) {
    if (typeof prefixOrLevel === 'string') {
      this.logger = createLogger(prefixOrLevel, level);
    } else {
      this.logger = createLogger(prefixOrLevel);
    }
  }

  trace(message: string, ...args: any[]) { this.logger.trace(message, ...args); }
  debug(message: string, ...args: any[]) { this.logger.debug(message, ...args); }
  info(message: string, ...args: any[]) { this.logger.info(message, ...args); }
  log(message: string, ...args: any[]) { this.logger.log(message, ...args); }
  warn(message: string, ...args: any[]) { this.logger.warn(message, ...args); }
  error(message: string, ...args: any[]) { this.logger.error(message, ...args); }
  critical(message: string, ...args: any[]) { this.logger.critical(message, ...args); }
  group(label: string) { this.logger.group(label); }
  groupEnd() { this.logger.groupEnd(); }
  setLevel(level: LogLevel) { this.logger.setLevel(level); }
  getLevel() { return this.logger.getLevel(); }
}

// Get log level from environment
export function getLogLevelFromEnv(): LogLevel {
  if (typeof process !== 'undefined' && process.env) {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'TRACE': return LogLevel.TRACE;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'LOG': return LogLevel.LOG;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'CRITICAL': return LogLevel.CRITICAL;
      case 'NONE': return LogLevel.NONE;
      default: return LogLevel.INFO;
    }
  }
  return LogLevel.INFO;
}