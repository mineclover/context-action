/**
 * @fileoverview Example usage of Universal Trace Logger
 * 모든 로그 레벨에서 내부적으로 trace를 수집하는 시스템 사용 예시
 */

import { 
  createLogger, 
  LogLevel,
  UniversalTraceLogger,
  UniversalTraceCollector,
  TraceSource,
  TraceCategory,
  createUniversalTraceLogger,
  createFrameworkUniversalLogger
} from './index.js';

/**
 * Example 1: Basic Universal Trace Logger Setup
 */
export function basicUniversalTraceExample() {
  console.log('\n=== Basic Universal Trace Example ===');
  
  // Create base logger and trace collector
  const baseLogger = createLogger(LogLevel.DEBUG);
  const traceCollector = new UniversalTraceCollector();
  
  // Create universal trace logger
  const logger = new UniversalTraceLogger(
    baseLogger,
    traceCollector,
    'ExampleComponent',
    TraceCategory.SYSTEM_EVENT,
    {
      collectFromInfo: true,
      collectFromWarn: true,
      collectFromError: true,
      includeStackTrace: true
    }
  );

  // Usage examples
  logger.trace('Direct trace call', { action: 'user_click', button: 'submit' });
  logger.info('User login successful', { userId: '123', timestamp: Date.now() });
  logger.warn('Performance threshold exceeded', { duration: 1500, threshold: 1000 });
  logger.error('Database connection failed', new Error('Connection timeout'));

  // Analyze collected traces
  const report = traceCollector.generateSourceReport();
  console.log('Trace Source Report:', JSON.stringify(report, null, 2));
  
  // Get traces by source
  const directTraces = traceCollector.getDirectTraces();
  const internalTraces = traceCollector.getInternalTraces();
  
  console.log('\nDirect traces:', directTraces.length);
  console.log('Internal traces:', internalTraces.length);
  
  // Show distinction
  traceCollector.getTraces().forEach(trace => {
    const source = trace.data?.traceMetadata?.traceSource;
    const isDirect = trace.data?.traceMetadata?.isDirect;
    
    console.log(`${isDirect ? '🎯 DIRECT' : '🔄 INTERNAL'} [${source}]: ${trace.message}`);
  });
}

/**
 * Example 2: Framework Integration
 */
export function frameworkIntegrationExample() {
  console.log('\n=== Framework Integration Example ===');
  
  // Create framework-integrated logger
  const { logger, traceCollector } = createFrameworkUniversalLogger(
    'UserActionHandler',
    TraceCategory.ACTION_PIPELINE,
    {
      logLevel: LogLevel.DEBUG,
      collectFromInfo: true,
      collectFromDebug: true,
      collectFromWarn: true,
      collectFromError: true,
      minTraceLevel: LogLevel.DEBUG
    }
  );

  // Simulate action handler execution
  logger.debug('Action handler registered', { actionName: 'updateUser', priority: 10 });
  logger.info('Processing user update', { userId: '456', changes: { name: 'John' } });
  logger.trace('Validation passed', { rules: ['required', 'format'] });
  logger.info('User updated successfully', { userId: '456', duration: 45 });

  // Analysis
  const stats = traceCollector.getTraceStatsBySource();
  console.log('\nTrace Statistics by Source:');
  Object.entries(stats).forEach(([source, stat]) => {
    console.log(`  ${source}: ${stat.count} traces (${stat.percentage.toFixed(1)}%)`);
  });
}

/**
 * Example 3: Store Operation Tracing
 */
export function storeOperationTracingExample() {
  console.log('\n=== Store Operation Tracing Example ===');
  
  const baseLogger = createLogger(LogLevel.INFO);
  const traceCollector = new UniversalTraceCollector();
  
  const storeLogger = createUniversalTraceLogger(
    baseLogger,
    traceCollector,
    'UserStore',
    TraceCategory.STORE_OPERATION,
    {
      collectFromInfo: true,
      collectFromWarn: true,
      includeStackTrace: false, // Disable for performance
      traceProcessor: (entry) => {
        // Custom processing for store operations
        if (entry.originalLevel === LogLevel.WARN) {
          console.log(`⚠️  Store Warning Trace: ${entry.message}`);
        }
      }
    }
  );

  // Simulate store operations
  storeLogger.info('Store value updated', { 
    storeName: 'user', 
    oldValue: { name: 'Jane' }, 
    newValue: { name: 'John' } 
  });
  
  storeLogger.warn('Store update frequency high', { 
    updateCount: 15, 
    timeWindow: 1000 
  });
  
  storeLogger.trace('Store listener notified', { 
    listenerCount: 3, 
    notificationTime: 2.5 
  });

  // Show internal vs direct traces
  console.log('\nStore Traces Analysis:');
  const internalInfoTraces = traceCollector.getTracesBySource(TraceSource.FROM_INFO);
  const internalWarnTraces = traceCollector.getTracesBySource(TraceSource.FROM_WARN);
  const directTraces = traceCollector.getDirectTraces();

  console.log(`Internal INFO traces: ${internalInfoTraces.length}`);
  console.log(`Internal WARN traces: ${internalWarnTraces.length}`);
  console.log(`Direct TRACE traces: ${directTraces.length}`);
}

/**
 * Example 4: Performance Monitoring with Universal Traces
 */
export function performanceMonitoringExample() {
  console.log('\n=== Performance Monitoring Example ===');
  
  const { logger, traceCollector } = createFrameworkUniversalLogger(
    'PerformanceMonitor',
    TraceCategory.PERFORMANCE,
    {
      logLevel: LogLevel.INFO,
      collectFromInfo: true,
      collectFromWarn: true,
      collectFromError: true,
      traceProcessor: (entry) => {
        // Real-time performance analysis
        if (entry.traceSource === TraceSource.FROM_WARN) {
          console.log(`🚨 Performance Issue Detected: ${entry.message}`);
        }
      }
    }
  );

  // Simulate performance monitoring
  logger.info('Operation started', { operationId: 'op_001', startTime: Date.now() });
  
  setTimeout(() => {
    logger.warn('Operation slow', { 
      operationId: 'op_001', 
      duration: 150, 
      threshold: 100 
    });
  }, 50);

  setTimeout(() => {
    logger.info('Operation completed', { 
      operationId: 'op_001', 
      duration: 200, 
      success: true 
    });
    
    // Analyze performance traces
    const report = traceCollector.generateSourceReport();
    console.log('\nPerformance Trace Summary:');
    console.log(`Total traces: ${report.summary.totalTraces}`);
    console.log(`Direct traces: ${report.summary.directTraces} (${report.summary.directPercentage.toFixed(1)}%)`);
    console.log(`Internal traces: ${report.summary.internalTraces} (${report.summary.internalPercentage.toFixed(1)}%)`);
    
  }, 100);
}

/**
 * Example 5: Configurable Trace Collection
 */
export function configurableTraceExample() {
  console.log('\n=== Configurable Trace Collection Example ===');
  
  const baseLogger = createLogger(LogLevel.DEBUG);
  const traceCollector = new UniversalTraceCollector();
  
  const logger = new UniversalTraceLogger(
    baseLogger,
    traceCollector,
    'ConfigurableComponent',
    TraceCategory.SYSTEM_EVENT,
    {
      collectFromInfo: false,   // Don't collect from INFO
      collectFromDebug: true,   // Collect from DEBUG
      collectFromWarn: true,    // Collect from WARN
      collectFromError: true,   // Collect from ERROR
      minTraceLevel: LogLevel.DEBUG,
      includeStackTrace: true
    }
  );

  // Test different log levels
  logger.trace('Direct trace - always collected');
  logger.debug('Debug message - should be collected internally');
  logger.info('Info message - should NOT be collected internally');
  logger.warn('Warning message - should be collected internally');
  logger.error('Error message - should be collected internally');
  
  // Analyze configuration effects
  console.log('\nConfiguration Analysis:');
  const traces = traceCollector.getTraces();
  traces.forEach(trace => {
    const metadata = trace.data?.traceMetadata;
    console.log(`${metadata?.isDirect ? 'DIRECT' : 'INTERNAL'} (${metadata?.traceSource}): ${trace.message}`);
  });
  
  // Update configuration dynamically
  logger.updateTraceConfig({
    collectFromInfo: true,  // Now enable INFO collection
    includeStackTrace: false
  });
  
  console.log('\nAfter configuration update:');
  logger.info('Info message - now should be collected');
  
  const newTraces = traceCollector.getTraces();
  const latestTrace = newTraces[newTraces.length - 1];
  const latestMetadata = latestTrace.data?.traceMetadata;
  
  console.log(`Latest trace: ${latestMetadata?.isDirect ? 'DIRECT' : 'INTERNAL'} (${latestMetadata?.traceSource}): ${latestTrace.message}`);
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🚀 Universal Trace Logger Examples\n');
  
  basicUniversalTraceExample();
  frameworkIntegrationExample();
  storeOperationTracingExample();
  performanceMonitoringExample();
  configurableTraceExample();
  
  console.log('\n✅ All examples completed!');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}