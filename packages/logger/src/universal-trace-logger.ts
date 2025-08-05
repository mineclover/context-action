/**
 * @fileoverview Universal Trace Logger - All log levels internally collect trace data
 * 모든 로그 레벨에서 내부적으로 trace를 수집하되, 직접 호출과 구분 가능한 시스템
 */

import { Logger, LogLevel } from './types.js';
import { TraceCollector, TraceCategory, TraceEntry } from './trace-collector.js';
import { ConsoleLogger } from './index.js';

/**
 * Trace source type for distinguishing collection methods
 */
export enum TraceSource {
  /** Direct trace() method call */
  DIRECT = 'direct',
  /** Internal trace collection from info() method */
  FROM_INFO = 'from_info',
  /** Internal trace collection from debug() method */
  FROM_DEBUG = 'from_debug',
  /** Internal trace collection from warn() method */
  FROM_WARN = 'from_warn',
  /** Internal trace collection from error() method */
  FROM_ERROR = 'from_error'
}

/**
 * Enhanced trace entry with source distinction
 */
export interface UniversalTraceEntry extends TraceEntry {
  /** How this trace was collected */
  traceSource: TraceSource;
  /** Original log level that triggered this trace */
  originalLevel: LogLevel;
  /** Whether this was a direct trace call or internal collection */
  isDirect: boolean;
}

/**
 * Configuration for universal trace collection
 */
export interface UniversalTraceConfig {
  /** Enable internal trace collection from info() calls */
  collectFromInfo?: boolean;
  /** Enable internal trace collection from debug() calls */
  collectFromDebug?: boolean;
  /** Enable internal trace collection from warn() calls */
  collectFromWarn?: boolean;
  /** Enable internal trace collection from error() calls */
  collectFromError?: boolean;
  /** Minimum log level for internal trace collection */
  minTraceLevel?: LogLevel;
  /** Add stack trace information for internal collections */
  includeStackTrace?: boolean;
  /** Custom trace processor */
  traceProcessor?: (entry: UniversalTraceEntry) => void;
}

/**
 * Universal Trace Logger that collects trace data from all log levels
 * @memberof api-terms
 * 
 * Features:
 * - All log levels (INFO, DEBUG, WARN, ERROR) internally collect trace data
 * - Distinguishes between direct trace calls and internal collections
 * - Configurable trace collection per log level
 * - Stack trace information for debugging
 * - Performance-optimized with minimal overhead
 * 
 * @example
 * ```typescript
 * const baseLogger = createLogger(LogLevel.DEBUG);
 * const traceCollector = new TraceCollector();
 * 
 * const universalLogger = new UniversalTraceLogger(baseLogger, traceCollector, 'UserStore', {
 *   collectFromInfo: true,
 *   collectFromWarn: true,
 *   collectFromError: true,
 *   includeStackTrace: true
 * });
 * 
 * // Direct trace call
 * universalLogger.trace('Direct trace call', { data: 'test' });
 * 
 * // Internal trace collection from info()
 * universalLogger.info('User updated', { userId: '123' });
 * 
 * // Check collected traces
 * const traces = traceCollector.getTraces();
 * traces.forEach(trace => {
 *   if (trace.traceSource === TraceSource.DIRECT) {
 *     console.log('Direct trace:', trace.message);
 *   } else {
 *     console.log('Internal trace from', trace.traceSource, ':', trace.message);
 *   }
 * });
 * ```
 */
export class UniversalTraceLogger implements Logger {
  private config: Required<UniversalTraceConfig>;

  constructor(
    private baseLogger: Logger,
    private traceCollector: TraceCollector,
    private component: string,
    private category: TraceCategory = TraceCategory.SYSTEM_EVENT,
    config: UniversalTraceConfig = {}
  ) {
    this.config = {
      collectFromInfo: true,
      collectFromDebug: true,
      collectFromWarn: true,
      collectFromError: true,
      minTraceLevel: LogLevel.TRACE,
      includeStackTrace: false,
      traceProcessor: () => {},
      ...config
    };
  }

  /**
   * Direct trace method - always collected as direct trace
   */
  trace(message: string, data?: any): void {
    // Direct trace collection
    this.collectTrace(message, data, TraceSource.DIRECT, LogLevel.TRACE, true);
    
    // Call base logger
    this.baseLogger.trace(message, data);
  }

  /**
   * Debug method with internal trace collection
   */
  debug(message: string, data?: any): void {
    // Internal trace collection if enabled
    if (this.config.collectFromDebug && this.shouldCollectTrace(LogLevel.DEBUG)) {
      this.collectTrace(message, data, TraceSource.FROM_DEBUG, LogLevel.DEBUG, false);
    }
    
    // Call base logger
    this.baseLogger.debug(message, data);
  }

  /**
   * Info method with internal trace collection
   */
  info(message: string, data?: any): void {
    // Internal trace collection if enabled
    if (this.config.collectFromInfo && this.shouldCollectTrace(LogLevel.INFO)) {
      this.collectTrace(message, data, TraceSource.FROM_INFO, LogLevel.INFO, false);
    }
    
    // Call base logger
    this.baseLogger.info(message, data);
  }

  /**
   * Warn method with internal trace collection
   */
  warn(message: string, data?: any): void {
    // Internal trace collection if enabled
    if (this.config.collectFromWarn && this.shouldCollectTrace(LogLevel.WARN)) {
      this.collectTrace(message, data, TraceSource.FROM_WARN, LogLevel.WARN, false);
    }
    
    // Call base logger
    this.baseLogger.warn(message, data);
  }

  /**
   * Error method with internal trace collection
   */
  error(message: string, error?: any): void {
    // Internal trace collection if enabled
    if (this.config.collectFromError && this.shouldCollectTrace(LogLevel.ERROR)) {
      this.collectTrace(message, error, TraceSource.FROM_ERROR, LogLevel.ERROR, false);
    }
    
    // Call base logger
    this.baseLogger.error(message, error);
  }

  /**
   * Set log level (delegates to base logger)
   */
  setLevel(level: LogLevel): void {
    this.baseLogger.setLevel(level);
  }

  /**
   * Get log level (delegates to base logger)
   */
  getLevel(): LogLevel {
    return this.baseLogger.getLevel();
  }

  /**
   * Update universal trace configuration
   */
  updateTraceConfig(config: Partial<UniversalTraceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current trace configuration
   */
  getTraceConfig(): UniversalTraceConfig {
    return { ...this.config };
  }

  /**
   * Internal method to collect trace data
   */
  private collectTrace(
    message: string,
    data: any,
    traceSource: TraceSource,
    originalLevel: LogLevel,
    isDirect: boolean
  ): void {
    try {
      // Create enhanced trace entry
      const traceId = this.traceCollector.addTrace(
        this.category,
        this.component,
        message,
        this.enhanceTraceData(data, traceSource, originalLevel, isDirect),
        undefined, // context
        undefined  // parentId
      );

      // Call custom processor if provided
      if (this.config.traceProcessor) {
        const entry: UniversalTraceEntry = {
          id: traceId,
          timestamp: performance.now(),
          category: this.category,
          component: this.component,
          message,
          data: this.enhanceTraceData(data, traceSource, originalLevel, isDirect),
          traceSource,
          originalLevel,
          isDirect
        };
        
        this.config.traceProcessor(entry);
      }
    } catch (error) {
      // Silently fail trace collection to avoid affecting main logging
      console.debug('Trace collection failed:', error);
    }
  }

  /**
   * Check if trace should be collected based on configuration
   */
  private shouldCollectTrace(logLevel: LogLevel): boolean {
    return logLevel >= this.config.minTraceLevel;
  }

  /**
   * Enhance trace data with additional metadata
   */
  private enhanceTraceData(
    originalData: any,
    traceSource: TraceSource,
    originalLevel: LogLevel,
    isDirect: boolean
  ): any {
    const traceMetadata: any = {
      traceSource,
      originalLevel: LogLevel[originalLevel],
      isDirect,
      timestamp: Date.now(),
      component: this.component,
      category: this.category
    };

    // Add stack trace if enabled
    if (this.config.includeStackTrace && !isDirect) {
      traceMetadata.stackTrace = this.captureStackTrace();
    }

    return {
      originalData,
      traceMetadata
    };
  }

  /**
   * Capture stack trace for debugging
   */
  private captureStackTrace(): string[] {
    try {
      const stack = new Error().stack;
      if (!stack) return [];
      
      return stack
        .split('\n')
        .slice(3) // Remove first 3 lines (Error, captureStackTrace, collectTrace)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5); // Keep only top 5 stack frames
    } catch {
      return [];
    }
  }
}

/**
 * Enhanced trace collector with universal trace support
 */
export class UniversalTraceCollector extends TraceCollector {
  /**
   * Get traces by source type
   */
  getTracesBySource(source: TraceSource): UniversalTraceEntry[] {
    return this.getTraces().filter(trace => 
      trace.data?.traceMetadata?.traceSource === source
    ) as UniversalTraceEntry[];
  }

  /**
   * Get direct trace calls only
   */
  getDirectTraces(): UniversalTraceEntry[] {
    return this.getTracesBySource(TraceSource.DIRECT);
  }

  /**
   * Get internal trace collections only
   */
  getInternalTraces(): UniversalTraceEntry[] {
    const internalSources = [
      TraceSource.FROM_INFO,
      TraceSource.FROM_DEBUG,
      TraceSource.FROM_WARN,
      TraceSource.FROM_ERROR
    ];
    
    return this.getTraces().filter(trace =>
      internalSources.includes(trace.data?.traceMetadata?.traceSource)
    ) as UniversalTraceEntry[];
  }

  /**
   * Get trace statistics by source
   */
  getTraceStatsBySource(): {
    [key in TraceSource]: {
      count: number;
      percentage: number;
      latestTimestamp: number;
    }
  } {
    const allTraces = this.getTraces();
    const totalCount = allTraces.length;
    
    const stats = {} as any;
    
    Object.values(TraceSource).forEach(source => {
      const sourceTraces = this.getTracesBySource(source);
      stats[source] = {
        count: sourceTraces.length,
        percentage: totalCount > 0 ? (sourceTraces.length / totalCount) * 100 : 0,
        latestTimestamp: sourceTraces.length > 0 
          ? Math.max(...sourceTraces.map(t => t.timestamp)) 
          : 0
      };
    });
    
    return stats;
  }

  /**
   * Generate comprehensive trace source report
   */
  generateSourceReport(): {
    summary: {
      totalTraces: number;
      directTraces: number;
      internalTraces: number;
      directPercentage: number;
      internalPercentage: number;
    };
    breakdown: {
      [key in TraceSource]: {
        count: number;
        percentage: number;
        examples: Array<{ message: string; timestamp: number; component: string }>;
      }
    };
  } {
    const allTraces = this.getTraces();
    const directTraces = this.getDirectTraces();
    const internalTraces = this.getInternalTraces();
    const totalCount = allTraces.length;

    const breakdown = {} as any;
    
    Object.values(TraceSource).forEach(source => {
      const sourceTraces = this.getTracesBySource(source);
      breakdown[source] = {
        count: sourceTraces.length,
        percentage: totalCount > 0 ? (sourceTraces.length / totalCount) * 100 : 0,
        examples: sourceTraces.slice(-3).map(trace => ({
          message: trace.message,
          timestamp: trace.timestamp,
          component: trace.component
        }))
      };
    });

    return {
      summary: {
        totalTraces: totalCount,
        directTraces: directTraces.length,
        internalTraces: internalTraces.length,
        directPercentage: totalCount > 0 ? (directTraces.length / totalCount) * 100 : 0,
        internalPercentage: totalCount > 0 ? (internalTraces.length / totalCount) * 100 : 0
      },
      breakdown
    };
  }
}

/**
 * Factory function to create universal trace logger
 */
export function createUniversalTraceLogger(
  baseLogger: Logger,
  traceCollector: TraceCollector,
  component: string,
  category: TraceCategory = TraceCategory.SYSTEM_EVENT,
  config: UniversalTraceConfig = {}
): UniversalTraceLogger {
  return new UniversalTraceLogger(baseLogger, traceCollector, component, category, config);
}

/**
 * Convenience function for framework integration
 */
export function createFrameworkUniversalLogger(
  component: string,
  category: TraceCategory,
  config: UniversalTraceConfig & { logLevel?: LogLevel } = {}
): { logger: UniversalTraceLogger; traceCollector: UniversalTraceCollector } {
  const { logLevel, ...traceConfig } = config;
  
  // Create components (avoid circular dependency)
  const baseLogger = new ConsoleLogger(logLevel || LogLevel.ERROR);
  const traceCollector = new UniversalTraceCollector();
  const logger = new UniversalTraceLogger(baseLogger, traceCollector, component, category, traceConfig);
  
  return { logger, traceCollector };
}