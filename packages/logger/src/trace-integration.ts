/**
 * @fileoverview Trace Integration for Context-Action Framework
 * 프레임워크의 모든 컴포넌트에서 자동으로 trace를 수집하는 통합 시스템
 */

import { Logger, createLogger, LogLevel } from './index.js';
import { 
  TraceCollector, 
  TraceCategory, 
  TraceCollectorConfig,
  createTraceEnabledLogger 
} from './trace-collector.js';

/**
 * Global trace collector instance
 */
let globalTraceCollector: TraceCollector | null = null;

/**
 * Framework trace integration configuration
 */
export interface FrameworkTraceConfig extends TraceCollectorConfig {
  /** Enable automatic trace collection for ActionRegister */
  enableActionTracing?: boolean;
  /** Enable automatic trace collection for Store operations */
  enableStoreTracing?: boolean;
  /** Enable automatic trace collection for Registry operations */
  enableRegistryTracing?: boolean;
  /** Enable performance monitoring with automatic thresholds */
  enablePerformanceMonitoring?: boolean;
  /** Performance threshold in milliseconds for warnings */
  performanceThreshold?: number;
  /** Enable React component lifecycle tracing */
  enableComponentTracing?: boolean;
}

/**
 * Initialize global trace collection for the entire framework
 * @implements comprehensive-tracing
 * @implements framework-integration
 * @memberof api-terms
 * 
 * Sets up centralized trace collection that automatically captures
 * all framework operations across ActionRegister, Stores, Registry,
 * and React components.
 * 
 * @example
 * ```typescript
 * // Initialize comprehensive tracing
 * initializeFrameworkTracing({
 *   maxEntries: 50000,
 *   enablePerformanceMonitoring: true,
 *   performanceThreshold: 100, // 100ms warning threshold
 *   categories: [
 *     TraceCategory.ACTION_PIPELINE,
 *     TraceCategory.STORE_OPERATION,
 *     TraceCategory.PERFORMANCE
 *   ]
 * });
 * 
 * // All subsequent logger creation will be trace-enabled
 * const actionLogger = createFrameworkLogger('ActionRegister');
 * const storeLogger = createFrameworkLogger('UserStore');
 * 
 * // Analyze performance after operations
 * const analysis = getFrameworkTraceAnalysis();
 * console.log('Framework Performance:', analysis);
 * ```
 */
export function initializeFrameworkTracing(config: FrameworkTraceConfig = {}): TraceCollector {
  const traceConfig: FrameworkTraceConfig = {
    maxEntries: 25000,
    flushInterval: 60000, // 1 minute
    enablePerformanceTracking: true,
    enableSessionCorrelation: true,
    enableActionTracing: true,
    enableStoreTracing: true,
    enableRegistryTracing: true,
    enablePerformanceMonitoring: true,
    performanceThreshold: 50, // 50ms default threshold
    enableComponentTracing: false, // Opt-in for React components
    categories: [], // Collect all by default
    ...config
  };

  globalTraceCollector = new TraceCollector(traceConfig);
  
  // Set up performance monitoring if enabled
  if (traceConfig.enablePerformanceMonitoring) {
    setupPerformanceMonitoring(traceConfig.performanceThreshold!);
  }

  return globalTraceCollector;
}

/**
 * Create a framework logger with automatic trace integration
 */
export function createFrameworkLogger(
  component: string,
  level?: LogLevel,
  category?: TraceCategory
): Logger {
  const baseLogger = createLogger(level);
  
  if (!globalTraceCollector) {
    return baseLogger;
  }

  // Determine category based on component name if not specified
  const traceCategory = category || inferCategoryFromComponent(component);
  
  return createTraceEnabledLogger(globalTraceCollector, baseLogger, component);
}

/**
 * Get the global trace collector instance
 */
export function getGlobalTraceCollector(): TraceCollector | null {
  return globalTraceCollector;
}

/**
 * Get comprehensive framework trace analysis
 */
export function getFrameworkTraceAnalysis(): {
  overview: {
    totalTraces: number;
    sessionsActive: number;
    categoriesActive: TraceCategory[];
    performanceIssues: number;
  };
  performance: {
    actions: ReturnType<TraceCollector['analyzePerformance']>;
    stores: ReturnType<TraceCollector['analyzePerformance']>;
    registry: ReturnType<TraceCollector['analyzePerformance']>;
  };
  recent: Array<{
    timestamp: number;
    category: TraceCategory;
    component: string;
    message: string;
    duration?: number;
  }>;
  issues: Array<{
    type: 'performance' | 'error' | 'warning';
    component: string;
    message: string;
    timestamp: number;
    data?: any;
  }>;
} {
  if (!globalTraceCollector) {
    throw new Error('Framework tracing not initialized. Call initializeFrameworkTracing() first.');
  }

  const allTraces = globalTraceCollector.getTraces();
  const correlationReport = globalTraceCollector.generateCorrelationReport();
  
  // Analyze performance by category
  const actionPerformance = globalTraceCollector.analyzePerformance(TraceCategory.ACTION_PIPELINE);
  const storePerformance = globalTraceCollector.analyzePerformance(TraceCategory.STORE_OPERATION);
  const registryPerformance = globalTraceCollector.analyzePerformance(TraceCategory.REGISTRY_OPERATION);

  // Find recent traces
  const recentTraces = allTraces
    .slice(-50)
    .map(trace => ({
      timestamp: trace.timestamp,
      category: trace.category,
      component: trace.component,
      message: trace.message,
      duration: trace.duration
    }));

  // Identify performance issues and errors
  const issues: Array<{
    type: 'performance' | 'error' | 'warning';
    component: string;
    message: string;
    timestamp: number;
    data?: any;
  }> = [];

  // Performance issues
  allTraces.forEach(trace => {
    if (trace.duration && trace.duration > 50) { // Configurable threshold
      issues.push({
        type: 'performance',
        component: trace.component,
        message: `Slow operation: ${trace.message} (${trace.duration}ms)`,
        timestamp: trace.timestamp,
        data: trace.data
      });
    }
    
    if (trace.message.toLowerCase().includes('error')) {
      issues.push({
        type: 'error',
        component: trace.component,
        message: trace.message,
        timestamp: trace.timestamp,
        data: trace.data
      });
    }

    if (trace.message.toLowerCase().includes('warn')) {
      issues.push({
        type: 'warning',
        component: trace.component,
        message: trace.message,
        timestamp: trace.timestamp,
        data: trace.data
      });
    }
  });

  return {
    overview: {
      totalTraces: allTraces.length,
      sessionsActive: correlationReport.sessions,
      categoriesActive: correlationReport.topCategories.map(c => c.category),
      performanceIssues: issues.filter(i => i.type === 'performance').length
    },
    performance: {
      actions: actionPerformance,
      stores: storePerformance,
      registry: registryPerformance
    },
    recent: recentTraces,
    issues: issues.slice(-20) // Most recent issues
  };
}

/**
 * Create specialized loggers for different framework components
 */
export const FrameworkLoggers = {
  /**
   * Create logger for ActionRegister with action-specific tracing
   */
  createActionLogger(name: string = 'ActionRegister'): Logger {
    return createFrameworkLogger(name, undefined, TraceCategory.ACTION_PIPELINE);
  },

  /**
   * Create logger for Store operations with store-specific tracing
   */
  createStoreLogger(storeName: string): Logger {
    return createFrameworkLogger(`Store:${storeName}`, undefined, TraceCategory.STORE_OPERATION);
  },

  /**
   * Create logger for Registry operations
   */
  createRegistryLogger(registryName: string = 'StoreRegistry'): Logger {
    return createFrameworkLogger(`Registry:${registryName}`, undefined, TraceCategory.REGISTRY_OPERATION);
  },

  /**
   * Create logger for React components with lifecycle tracing
   */
  createComponentLogger(componentName: string): Logger {
    return createFrameworkLogger(`Component:${componentName}`, undefined, TraceCategory.COMPONENT_LIFECYCLE);
  },

  /**
   * Create logger for performance monitoring
   */
  createPerformanceLogger(): Logger {
    return createFrameworkLogger('Performance', undefined, TraceCategory.PERFORMANCE);
  }
};

/**
 * Set up automatic performance monitoring
 */
function setupPerformanceMonitoring(threshold: number): void {
  if (!globalTraceCollector) return;

  // Monitor long-running operations
  const originalAddTrace = globalTraceCollector.addTrace.bind(globalTraceCollector);
  
  globalTraceCollector.addTrace = function(category, component, message, data, context, parentId) {
    const traceId = originalAddTrace(category, component, message, data, context, parentId);
    
    // Check for performance issues
    if (data && typeof data.duration === 'number' && data.duration > threshold) {
      this.addTrace(
        TraceCategory.PERFORMANCE,
        'PerformanceMonitor',
        `Performance threshold exceeded: ${message}`,
        {
          originalDuration: data.duration,
          threshold,
          component,
          category
        },
        context,
        parentId
      );
    }
    
    return traceId;
  };
}

/**
 * Infer trace category from component name
 */
function inferCategoryFromComponent(component: string): TraceCategory {
  const lowerComponent = component.toLowerCase();
  
  if (lowerComponent.includes('action') || lowerComponent.includes('register')) {
    return TraceCategory.ACTION_PIPELINE;
  }
  
  if (lowerComponent.includes('store')) {
    return TraceCategory.STORE_OPERATION;
  }
  
  if (lowerComponent.includes('registry')) {
    return TraceCategory.REGISTRY_OPERATION;
  }
  
  if (lowerComponent.includes('component') || lowerComponent.includes('hook')) {
    return TraceCategory.COMPONENT_LIFECYCLE;
  }
  
  if (lowerComponent.includes('performance')) {
    return TraceCategory.PERFORMANCE;
  }
  
  return TraceCategory.SYSTEM_EVENT;
}

/**
 * Utility functions for trace debugging
 */
export const TraceDebugUtils = {
  /**
   * Enable trace debugging in development
   */
  enableDebugMode(): void {
    if (globalTraceCollector) {
      const originalAddTrace = globalTraceCollector.addTrace.bind(globalTraceCollector);
      globalTraceCollector.addTrace = function(category, component, message, data, context, parentId) {
        console.debug(`[TRACE] ${category}:${component} - ${message}`, data);
        return originalAddTrace(category, component, message, data, context, parentId);
      };
    }
  },

  /**
   * Export traces for external analysis
   */
  exportTraces(format: 'json' | 'csv' | 'chrome-tracing' = 'json'): string {
    if (!globalTraceCollector) {
      throw new Error('Framework tracing not initialized');
    }
    return globalTraceCollector.export(format);
  },

  /**
   * Clear all traces (useful for testing)
   */
  clearTraces(): void {
    if (globalTraceCollector) {
      globalTraceCollector.clear();
    }
  },

  /**
   * Get real-time trace stream
   */
  createTraceStream(callback: (trace: any) => void): () => void {
    if (!globalTraceCollector) {
      throw new Error('Framework tracing not initialized');
    }

    const originalAddTrace = globalTraceCollector.addTrace.bind(globalTraceCollector);
    globalTraceCollector.addTrace = function(category, component, message, data, context, parentId) {
      const traceId = originalAddTrace(category, component, message, data, context, parentId);
      
      // Stream the trace to callback
      callback({
        id: traceId,
        category,
        component,
        message,
        data,
        context,
        parentId,
        timestamp: performance.now()
      });
      
      return traceId;
    };

    // Return cleanup function
    return () => {
      globalTraceCollector!.addTrace = originalAddTrace;
    };
  }
};

/**
 * React Hook for component-level tracing
 */
export function useComponentTracing(componentName: string) {
  const logger = FrameworkLoggers.createComponentLogger(componentName);
  
  return {
    traceMount() {
      logger.trace(`Component mounted: ${componentName}`);
    },
    
    traceUnmount() {
      logger.trace(`Component unmounting: ${componentName}`);
    },
    
    traceUpdate(props?: any, state?: any) {
      logger.trace(`Component updated: ${componentName}`, { props, state });
    },
    
    traceAction(actionName: string, data?: any) {
      logger.trace(`Component action: ${actionName}`, { component: componentName, data });
    },
    
    traceError(error: Error, context?: any) {
      logger.error(`Component error: ${componentName}`, { error: error.message, stack: error.stack, context });
    }
  };
}