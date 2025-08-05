/**
 * @fileoverview Comprehensive Trace Collection System
 * 프레임워크 전반의 모든 trace 로그를 수집하고 중앙화된 분석을 제공하는 시스템
 */

import { Logger, LogLevel } from './types.js';

/**
 * Trace entry interface for structured trace data collection
 */
export interface TraceEntry {
  /** Unique trace ID for correlation */
  id: string;
  /** High-resolution timestamp */
  timestamp: number;
  /** Trace category (action, store, registry, etc.) */
  category: TraceCategory;
  /** Component that generated the trace */
  component: string;
  /** Trace level message */
  message: string;
  /** Additional structured data */
  data?: any;
  /** Operation context (action name, store name, etc.) */
  context?: string;
  /** Execution duration in milliseconds (for completed operations) */
  duration?: number;
  /** Parent trace ID for nested operations */
  parentId?: string;
  /** Session identifier for grouping related operations */
  sessionId?: string;
}

/**
 * Trace categories for better organization and filtering
 */
export enum TraceCategory {
  ACTION_PIPELINE = 'action_pipeline',
  STORE_OPERATION = 'store_operation',
  REGISTRY_OPERATION = 'registry_operation',
  EXECUTION_MODE = 'execution_mode',
  ACTION_GUARD = 'action_guard',
  COMPONENT_LIFECYCLE = 'component_lifecycle',
  PERFORMANCE = 'performance',
  ERROR_HANDLING = 'error_handling',
  USER_INTERACTION = 'user_interaction',
  SYSTEM_EVENT = 'system_event'
}

/**
 * Trace collection configuration
 */
export interface TraceCollectorConfig {
  /** Maximum number of trace entries to keep in memory */
  maxEntries?: number;
  /** Auto-flush interval in milliseconds */
  flushInterval?: number;
  /** Categories to collect (empty = all) */
  categories?: TraceCategory[];
  /** Enable performance tracking */
  enablePerformanceTracking?: boolean;
  /** Enable session correlation */
  enableSessionCorrelation?: boolean;
  /** Custom trace processor */
  processor?: TraceProcessor;
}

/**
 * Trace processor for custom handling of collected traces
 */
export interface TraceProcessor {
  process(entries: TraceEntry[]): void | Promise<void>;
}

/**
 * Trace correlation context for nested operations
 */
export interface TraceContext {
  /** Parent trace ID */
  parentId?: string;
  /** Session ID */
  sessionId?: string;
  /** Operation start time */
  startTime?: number;
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Comprehensive trace collection system that captures all framework operations
 * @memberof api-terms
 * 
 * Features:
 * - Centralized trace collection from all framework components
 * - Performance correlation and timing analysis
 * - Session-based operation grouping
 * - Memory-efficient circular buffer storage
 * - Real-time trace streaming and analysis
 * - Custom trace processors for external systems
 * 
 * @example
 * ```typescript
 * // Initialize comprehensive trace collection
 * const traceCollector = new TraceCollector({
 *   maxEntries: 10000,
 *   flushInterval: 5000,
 *   enablePerformanceTracking: true,
 *   processor: new ExternalTraceProcessor()
 * });
 * 
 * // Enable for all framework loggers
 * const logger = createTraceEnabledLogger(traceCollector);
 * 
 * // Collect traces with context
 * const context = traceCollector.startTrace('user_action');
 * logger.trace('User clicked button', { buttonId: 'submit' });
 * traceCollector.endTrace(context, { success: true });
 * 
 * // Analyze collected traces
 * const analysis = traceCollector.analyzePerformance('action_pipeline');
 * console.log('Average execution time:', analysis.averageTime);
 * ```
 */
export class TraceCollector {
  private entries: TraceEntry[] = [];
  private config: Required<TraceCollectorConfig>;
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;
  private activeContexts = new Map<string, TraceContext>();

  constructor(config: TraceCollectorConfig = {}) {
    this.config = {
      maxEntries: 10000,
      flushInterval: 30000, // 30 seconds
      categories: [],
      enablePerformanceTracking: true,
      enableSessionCorrelation: true,
      processor: new DefaultTraceProcessor(),
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
  }

  /**
   * Add a trace entry to the collection
   */
  addTrace(
    category: TraceCategory,
    component: string,
    message: string,
    data?: any,
    context?: string,
    parentId?: string
  ): string {
    // Filter by category if specified
    if (this.config.categories.length > 0 && !this.config.categories.includes(category)) {
      return '';
    }

    const traceId = this.generateTraceId();
    const entry: TraceEntry = {
      id: traceId,
      timestamp: performance.now(),
      category,
      component,
      message,
      data,
      context,
      parentId,
      sessionId: this.config.enableSessionCorrelation ? this.sessionId : undefined
    };

    this.entries.push(entry);

    // Maintain circular buffer
    if (this.entries.length > this.config.maxEntries) {
      this.entries.shift();
    }

    return traceId;
  }

  /**
   * Start a traced operation with context
   */
  startTrace(operationName: string, parentId?: string, context?: Record<string, any>): string {
    const traceId = this.generateTraceId();
    const traceContext: TraceContext = {
      parentId,
      sessionId: this.sessionId,
      startTime: performance.now(),
      context
    };

    this.activeContexts.set(traceId, traceContext);
    
    this.addTrace(
      TraceCategory.SYSTEM_EVENT,
      'TraceCollector',
      `Operation started: ${operationName}`,
      { operationName, context },
      operationName,
      parentId
    );

    return traceId;
  }

  /**
   * End a traced operation and calculate duration
   */
  endTrace(traceId: string, result?: any): void {
    const traceContext = this.activeContexts.get(traceId);
    if (!traceContext) return;

    const duration = traceContext.startTime ? performance.now() - traceContext.startTime : undefined;
    
    this.addTrace(
      TraceCategory.SYSTEM_EVENT,
      'TraceCollector',
      `Operation completed`,
      { result, duration },
      undefined,
      traceContext.parentId
    );

    this.activeContexts.delete(traceId);
  }

  /**
   * Get all collected traces
   */
  getTraces(): TraceEntry[] {
    return [...this.entries];
  }

  /**
   * Get traces filtered by category
   */
  getTracesByCategory(category: TraceCategory): TraceEntry[] {
    return this.entries.filter(entry => entry.category === category);
  }

  /**
   * Get traces for a specific session
   */
  getTracesBySession(sessionId: string): TraceEntry[] {
    return this.entries.filter(entry => entry.sessionId === sessionId);
  }

  /**
   * Get traces within a time range
   */
  getTracesByTimeRange(startTime: number, endTime: number): TraceEntry[] {
    return this.entries.filter(entry => 
      entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * Analyze performance metrics for a category
   */
  analyzePerformance(category: TraceCategory): {
    count: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    percentiles: { p50: number; p90: number; p95: number; p99: number };
  } {
    const traces = this.getTracesByCategory(category)
      .filter(entry => entry.duration !== undefined)
      .map(entry => entry.duration!)
      .sort((a, b) => a - b);

    if (traces.length === 0) {
      return {
        count: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        percentiles: { p50: 0, p90: 0, p95: 0, p99: 0 }
      };
    }

    const sum = traces.reduce((acc, time) => acc + time, 0);
    const count = traces.length;

    return {
      count,
      averageTime: sum / count,
      minTime: traces[0],
      maxTime: traces[count - 1],
      percentiles: {
        p50: traces[Math.floor(count * 0.5)],
        p90: traces[Math.floor(count * 0.9)],
        p95: traces[Math.floor(count * 0.95)],
        p99: traces[Math.floor(count * 0.99)]
      }
    };
  }

  /**
   * Generate trace correlation report
   */
  generateCorrelationReport(): {
    sessions: number;
    averageTracesPerSession: number;
    topCategories: Array<{ category: TraceCategory; count: number }>;
    recentActivity: TraceEntry[];
  } {
    const sessions = new Set(this.entries.map(e => e.sessionId).filter(Boolean)).size;
    const categoryCounts = new Map<TraceCategory, number>();

    this.entries.forEach(entry => {
      const current = categoryCounts.get(entry.category) || 0;
      categoryCounts.set(entry.category, current + 1);
    });

    const topCategories = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentActivity = this.entries
      .slice(-20)
      .sort((a, b) => b.timestamp - a.timestamp);

    return {
      sessions,
      averageTracesPerSession: sessions > 0 ? this.entries.length / sessions : 0,
      topCategories,
      recentActivity
    };
  }

  /**
   * Clear all collected traces
   */
  clear(): void {
    this.entries = [];
    this.activeContexts.clear();
  }

  /**
   * Export traces in various formats
   */
  export(format: 'json' | 'csv' | 'chrome-tracing'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.entries, null, 2);
      
      case 'csv':
        return this.exportToCsv();
      
      case 'chrome-tracing':
        return this.exportToChromeTracing();
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Flush traces to processor
   */
  flush(): Promise<void> {
    if (this.entries.length === 0) return Promise.resolve();
    
    const entriesToProcess = [...this.entries];
    this.entries = [];
    
    return Promise.resolve(this.config.processor.process(entriesToProcess));
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush().catch(console.error);
      }, this.config.flushInterval);
    }
  }

  /**
   * Stop automatic flush timer
   */
  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    this.flush();
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private exportToCsv(): string {
    const headers = ['id', 'timestamp', 'category', 'component', 'message', 'context', 'duration', 'sessionId'];
    const rows = this.entries.map(entry => [
      entry.id,
      entry.timestamp.toString(),
      entry.category,
      entry.component,
      `"${entry.message.replace(/"/g, '""')}"`,
      entry.context || '',
      entry.duration?.toString() || '',
      entry.sessionId || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private exportToChromeTracing(): string {
    const events = this.entries.map(entry => ({
      name: entry.message,
      cat: entry.category,
      ph: 'B', // Begin event
      ts: entry.timestamp * 1000, // Convert to microseconds for Chrome tracing
      pid: 1,
      tid: 1,
      args: {
        component: entry.component,
        context: entry.context,
        data: entry.data
      }
    }));
    
    return JSON.stringify({ traceEvents: events });
  }
}

/**
 * Default trace processor that logs to console
 */
export class DefaultTraceProcessor implements TraceProcessor {
  process(entries: TraceEntry[]): void {
    console.log(`Processed ${entries.length} trace entries`);
  }
}

/**
 * File-based trace processor that saves to local storage or file system
 */
export class FileTraceProcessor implements TraceProcessor {
  constructor(private filename: string = 'traces.json') {}

  async process(entries: TraceEntry[]): Promise<void> {
    try {
      // Browser environment - use localStorage
      if (typeof localStorage !== 'undefined') {
        const existing = localStorage.getItem(this.filename);
        const existingTraces = existing ? JSON.parse(existing) : [];
        const allTraces = [...existingTraces, ...entries];
        localStorage.setItem(this.filename, JSON.stringify(allTraces));
        return;
      }

      // Node.js environment - write to file
      if (typeof require !== 'undefined') {
        const fs = require('fs').promises;
        const path = require('path');
        
        const filePath = path.resolve(this.filename);
        let existingTraces: TraceEntry[] = [];
        
        try {
          const existing = await fs.readFile(filePath, 'utf8');
          existingTraces = JSON.parse(existing);
        } catch {
          // File doesn't exist, start fresh
        }
        
        const allTraces = [...existingTraces, ...entries];
        await fs.writeFile(filePath, JSON.stringify(allTraces, null, 2));
      }
    } catch (error) {
      console.error('Failed to process traces:', error);
    }
  }
}

/**
 * Create a trace-enabled logger that automatically feeds into trace collector
 */
export function createTraceEnabledLogger(
  traceCollector: TraceCollector,
  baseLogger: Logger,
  component: string
): Logger {
  return {
    trace(message: string, data?: any): void {
      traceCollector.addTrace(
        TraceCategory.SYSTEM_EVENT,
        component,
        message,
        data
      );
      baseLogger.trace(message, data);
    },

    debug(message: string, data?: any): void {
      baseLogger.debug(message, data);
    },

    info(message: string, data?: any): void {
      baseLogger.info(message, data);
    },

    warn(message: string, data?: any): void {
      baseLogger.warn(message, data);
    },

    error(message: string, error?: any): void {
      baseLogger.error(message, error);
    },

    setLevel(level: LogLevel): void {
      baseLogger.setLevel(level);
    },

    getLevel(): LogLevel {
      return baseLogger.getLevel();
    }
  };
}