/**
 * @fileoverview Comprehensive functionality tests for logger package
 * 모든 기능과 하위 호환성을 테스트하는 스크립트
 */

import {
  // Basic logger functionality
  createLogger,
  LogLevel,
  ConsoleLogger,
  NoopLogger,
  getLogLevelFromEnv,
  
  // Traditional trace collection
  TraceCollector,
  TraceCategory,
  initializeFrameworkTracing,
  getFrameworkTraceAnalysis,
  FrameworkLoggers,
  
  // Universal trace collection (NEW)
  UniversalTraceLogger,
  UniversalTraceCollector,
  TraceSource,
  createUniversalTraceLogger,
  createFrameworkUniversalLogger,
  
  // Types
  Logger
} from './index.js';

/**
 * Test results tracker
 */
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class TestRunner {
  private results: TestResult[] = [];
  
  test(name: string, testFn: () => void | Promise<void>): void {
    try {
      const result = testFn();
      if (result instanceof Promise) {
        result
          .then(() => this.addResult(name, true))
          .catch(error => this.addResult(name, false, error.message));
      } else {
        this.addResult(name, true);
      }
    } catch (error) {
      this.addResult(name, false, (error as Error).message);
    }
  }
  
  private addResult(name: string, passed: boolean, error?: string, details?: any): void {
    this.results.push({ name, passed, error, details });
  }
  
  getResults(): TestResult[] {
    return this.results;
  }
  
  printResults(): void {
    console.log('\n🧪 Test Results:');
    console.log('================');
    
    let passed = 0;
    let failed = 0;
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details)}`);
      }
      
      result.passed ? passed++ : failed++;
    });
    
    console.log(`\nTotal: ${this.results.length}, Passed: ${passed}, Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
  }
}

/**
 * Test basic logger functionality
 */
function testBasicLogger(runner: TestRunner): void {
  runner.test('Create basic logger', () => {
    const logger = createLogger();
    if (!(logger instanceof ConsoleLogger)) {
      throw new Error('Expected ConsoleLogger instance');
    }
  });

  runner.test('Create logger with specific level', () => {
    const logger = createLogger(LogLevel.WARN);
    if (logger.getLevel() !== LogLevel.WARN) {
      throw new Error('Logger level not set correctly');
    }
  });

  runner.test('NoopLogger functionality', () => {
    const logger = new NoopLogger();
    logger.info(); // Should not throw - NoopLogger info() takes no parameters
    if (logger.getLevel() !== LogLevel.NONE) {
      throw new Error('NoopLogger level should be NONE');
    }
  });

  runner.test('Environment variable detection', () => {
    const level = getLogLevelFromEnv();
    if (typeof level !== 'number' || level < 0 || level > 5) {
      throw new Error('Invalid log level from environment');
    }
  });
}

/**
 * Test traditional trace collection
 */
function testTraditionalTraceCollection(runner: TestRunner): void {
  runner.test('Basic TraceCollector', () => {
    const collector = new TraceCollector();
    const traceId = collector.addTrace(
      TraceCategory.SYSTEM_EVENT,
      'TestComponent',
      'Test message',
      { test: true }
    );
    
    if (!traceId || typeof traceId !== 'string') {
      throw new Error('TraceCollector should return trace ID');
    }
    
    const traces = collector.getTraces();
    if (traces.length !== 1) {
      throw new Error('Expected 1 trace');
    }
  });

  runner.test('Framework trace integration', () => {
    const collector = initializeFrameworkTracing({
      maxEntries: 1000,
      enablePerformanceMonitoring: true
    });
    
    if (!(collector instanceof TraceCollector)) {
      throw new Error('Expected TraceCollector instance');
    }
  });

  runner.test('Framework loggers', () => {
    const actionLogger = FrameworkLoggers.createActionLogger('TestAction');
    const storeLogger = FrameworkLoggers.createStoreLogger('TestStore');
    
    if (!actionLogger || !storeLogger) {
      throw new Error('Framework loggers should be created');
    }
    
    // Test basic functionality
    actionLogger.info('Test action log');
    storeLogger.debug('Test store log');
  });
}

/**
 * Test universal trace collection (NEW FEATURE)
 */
function testUniversalTraceCollection(runner: TestRunner): void {
  runner.test('UniversalTraceLogger creation', () => {
    const baseLogger = createLogger(LogLevel.DEBUG);
    const traceCollector = new UniversalTraceCollector();
    
    const universalLogger = new UniversalTraceLogger(
      baseLogger,
      traceCollector,
      'TestComponent',
      TraceCategory.SYSTEM_EVENT,
      {
        collectFromInfo: true,
        collectFromWarn: true,
        collectFromError: true
      }
    );
    
    if (!universalLogger) {
      throw new Error('UniversalTraceLogger should be created');
    }
  });

  runner.test('Universal trace collection from all log levels', () => {
    const baseLogger = createLogger(LogLevel.TRACE);
    const traceCollector = new UniversalTraceCollector();
    
    const logger = new UniversalTraceLogger(
      baseLogger,
      traceCollector,
      'TestComponent',
      TraceCategory.SYSTEM_EVENT,
      {
        collectFromInfo: true,
        collectFromDebug: true,  
        collectFromWarn: true,
        collectFromError: true
      }
    );

    // Test all log levels
    logger.trace('Direct trace');
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');

    const traces = traceCollector.getTraces();
    if (traces.length !== 5) {
      throw new Error(`Expected 5 traces, got ${traces.length}`);
    }
  });

  runner.test('Trace source distinction', () => {
    const baseLogger = createLogger(LogLevel.TRACE);
    const traceCollector = new UniversalTraceCollector();
    
    const logger = new UniversalTraceLogger(
      baseLogger,
      traceCollector,
      'TestComponent',
      TraceCategory.SYSTEM_EVENT,
      {
        collectFromInfo: true,
        collectFromWarn: true,
        collectFromError: true
      }
    );

    logger.trace('Direct trace');
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');

    const directTraces = traceCollector.getDirectTraces();
    const internalTraces = traceCollector.getInternalTraces();
    const infoTraces = traceCollector.getTracesBySource(TraceSource.FROM_INFO);
    const warnTraces = traceCollector.getTracesBySource(TraceSource.FROM_WARN);
    const errorTraces = traceCollector.getTracesBySource(TraceSource.FROM_ERROR);

    if (directTraces.length !== 1) {
      throw new Error(`Expected 1 direct trace, got ${directTraces.length}`);
    }
    
    if (internalTraces.length !== 3) {
      throw new Error(`Expected 3 internal traces, got ${internalTraces.length}`);
    }
    
    if (infoTraces.length !== 1 || warnTraces.length !== 1 || errorTraces.length !== 1) {
      throw new Error('Source-specific trace counts incorrect');
    }
  });

  runner.test('Universal trace configuration', () => {
    const baseLogger = createLogger(LogLevel.DEBUG);
    const traceCollector = new UniversalTraceCollector();
    
    const logger = new UniversalTraceLogger(
      baseLogger,
      traceCollector,
      'TestComponent',
      TraceCategory.SYSTEM_EVENT,
      {
        collectFromInfo: false,  // Disabled
        collectFromWarn: true,   // Enabled
        collectFromError: true   // Enabled
      }
    );

    logger.info('Info message');   // Should NOT be traced
    logger.warn('Warn message');   // Should be traced
    logger.error('Error message'); // Should be traced

    const traces = traceCollector.getTraces();
    if (traces.length !== 2) {
      throw new Error(`Expected 2 traces (warn+error), got ${traces.length}`);
    }
    
    const infoTraces = traceCollector.getTracesBySource(TraceSource.FROM_INFO);
    if (infoTraces.length !== 0) {
      throw new Error('Info traces should be disabled');
    }
  });

  runner.test('Framework universal logger factory', () => {
    const { logger, traceCollector } = createFrameworkUniversalLogger(
      'TestComponent',
      TraceCategory.SYSTEM_EVENT,
      {
        logLevel: LogLevel.DEBUG,
        collectFromInfo: true,
        collectFromWarn: true
      }
    );

    if (!logger || !traceCollector) {
      throw new Error('Framework universal logger factory should return logger and collector');
    }

    logger.info('Test message');
    const traces = traceCollector.getTraces();
    
    if (traces.length !== 1) {
      throw new Error('Framework universal logger should collect traces');
    }
  });

  runner.test('Trace statistics and reporting', () => {
    const { logger, traceCollector } = createFrameworkUniversalLogger(
      'TestComponent',
      TraceCategory.SYSTEM_EVENT,
      {
        collectFromInfo: true,
        collectFromWarn: true,
        collectFromError: true
      }
    );

    logger.trace('Direct');
    logger.info('Info 1');
    logger.info('Info 2'); 
    logger.warn('Warn');
    logger.error('Error');

    const stats = traceCollector.getTraceStatsBySource();
    const report = traceCollector.generateSourceReport();

    if (stats[TraceSource.DIRECT].count !== 1) {
      throw new Error('Direct trace count incorrect');
    }
    
    if (stats[TraceSource.FROM_INFO].count !== 2) {
      throw new Error('Info trace count incorrect');
    }
    
    if (report.summary.totalTraces !== 5) {
      throw new Error('Total trace count incorrect');
    }
    
    if (report.summary.directTraces !== 1) {
      throw new Error('Direct trace summary incorrect');
    }
    
    if (report.summary.internalTraces !== 4) {
      throw new Error('Internal trace summary incorrect');
    }
  });
}

/**
 * Test backward compatibility
 */
function testBackwardCompatibility(runner: TestRunner): void {
  runner.test('Existing Logger interface compatibility', () => {
    const logger: Logger = createLogger(LogLevel.DEBUG);
    
    // These should all work exactly as before
    logger.trace('trace message');
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');
    logger.setLevel(LogLevel.WARN);
    
    const level = logger.getLevel();
    if (level !== LogLevel.WARN) {
      throw new Error('Logger interface compatibility broken');
    }
  });

  runner.test('Traditional trace collection still works', () => {
    const collector = new TraceCollector();
    
    // Old usage should still work
    const traceId = collector.addTrace(
      TraceCategory.ACTION_PIPELINE,
      'ActionRegister',
      'Handler registered',
      { handlerId: 'test' }
    );
    
    const traces = collector.getTraces();
    const actionTraces = collector.getTracesByCategory(TraceCategory.ACTION_PIPELINE);
    
    if (traces.length !== 1 || actionTraces.length !== 1) {
      throw new Error('Traditional trace collection broken');
    }
  });

  runner.test('Framework integration still works', () => {
    // This should work exactly as before
    initializeFrameworkTracing({
      enablePerformanceMonitoring: true,
      performanceThreshold: 100
    });

    const actionLogger = FrameworkLoggers.createActionLogger();
    const storeLogger = FrameworkLoggers.createStoreLogger('TestStore');
    
    // These should work without any changes
    actionLogger.debug('Action handler registered');
    storeLogger.info('Store value updated');
  });
}

/**
 * Test performance and edge cases
 */
function testPerformanceAndEdgeCases(runner: TestRunner): void {
  runner.test('Large number of traces performance', () => {
    const baseLogger = createLogger(LogLevel.INFO);
    const traceCollector = new UniversalTraceCollector({
      maxEntries: 10000
    });
    
    const logger = new UniversalTraceLogger(
      baseLogger,
      traceCollector,
      'PerformanceTest',
      TraceCategory.PERFORMANCE,
      {
        collectFromInfo: true
      }
    );

    const start = performance.now();
    
    // Generate many traces
    for (let i = 0; i < 1000; i++) {
      logger.info(`Message ${i}`);
    }
    
    const end = performance.now();
    const duration = end - start;
    
    if (duration > 1000) { // Should complete within 1 second
      throw new Error(`Performance test took too long: ${duration}ms`);
    }
    
    const traces = traceCollector.getTraces();
    if (traces.length !== 1000) {
      throw new Error(`Expected 1000 traces, got ${traces.length}`);
    }
  });

  runner.test('Circular buffer functionality', () => {
    const collector = new UniversalTraceCollector({
      maxEntries: 5 // Small buffer
    });
    
    const baseLogger = createLogger(LogLevel.INFO);
    const logger = new UniversalTraceLogger(
      baseLogger,
      collector,
      'CircularTest',
      TraceCategory.SYSTEM_EVENT,
      { collectFromInfo: true }
    );

    // Add more traces than buffer size
    for (let i = 0; i < 10; i++) {
      logger.info(`Message ${i}`);
    }

    const traces = collector.getTraces();
    if (traces.length !== 5) {
      throw new Error(`Expected 5 traces (circular buffer), got ${traces.length}`);
    }
    
    // Should have the last 5 messages
    const lastTrace = traces[traces.length - 1];
    if (!lastTrace.message.includes('Message 9')) {
      throw new Error('Circular buffer should contain latest traces');
    }
  });

  runner.test('Error handling in trace collection', () => {
    const baseLogger = createLogger(LogLevel.ERROR);
    const traceCollector = new UniversalTraceCollector();
    
    const logger = new UniversalTraceLogger(
      baseLogger,
      traceCollector,
      'ErrorTest',
      TraceCategory.SYSTEM_EVENT,
      {
        collectFromError: true,
        traceProcessor: () => {
          throw new Error('Processor error'); // Should not break logging
        }
      }
    );

    // This should not throw even though processor fails
    logger.error('Test error message');
    
    // Basic logging should still work
    const traces = traceCollector.getTraces();
    if (traces.length !== 1) {
      throw new Error('Error in trace processor should not prevent trace collection');
    }
  });
}

/**
 * Run all tests
 */
export function runComprehensiveTests(): void {
  console.log('🚀 Starting Comprehensive Logger Tests');
  console.log('=====================================\n');

  const runner = new TestRunner();

  console.log('Testing basic logger functionality...');
  testBasicLogger(runner);

  console.log('Testing traditional trace collection...');
  testTraditionalTraceCollection(runner);

  console.log('Testing universal trace collection...');
  testUniversalTraceCollection(runner);

  console.log('Testing backward compatibility...');
  testBackwardCompatibility(runner);

  console.log('Testing performance and edge cases...');
  testPerformanceAndEdgeCases(runner);

  // Print results
  runner.printResults();
  
  const results = runner.getResults();
  const failed = results.filter(r => !r.passed);
  
  if (failed.length === 0) {
    console.log('\n🎉 All tests passed! System is ready for production.');
  } else {
    console.log(`\n⚠️  ${failed.length} tests failed. Review issues before deployment.`);
    failed.forEach(failure => {
      console.log(`   - ${failure.name}: ${failure.error}`);
    });
  }
}

// Run tests if this file is executed directly (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests();
}