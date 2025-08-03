# @context-action/logger

Lightweight, configurable logging system for the Context-Action framework with comprehensive trace collection and cross-platform environment support.

## Features

### Core Logging
- **Hierarchical log levels** with configurable filtering (TRACE, DEBUG, INFO, WARN, ERROR, NONE)
- **Cross-platform environment** variable support (Node.js + Vite)
- **Console-based and no-op** logger implementations
- **Automatic level detection** from NODE_ENV
- **Runtime level adjustment** capability

### Comprehensive Trace Collection
- **Centralized trace collection** from all framework components
- **Performance correlation** and timing analysis
- **Session-based operation** grouping
- **Memory-efficient circular buffer** storage
- **Real-time trace streaming** and analysis
- **Custom trace processors** for external systems

### Universal Trace Collection (NEW! 🚀)
- **All log levels collect traces internally** - INFO, DEBUG, WARN, ERROR automatically generate trace data
- **Perfect distinction** between direct trace() calls and internal collections
- **Configurable per log level** - choose which levels to collect from
- **Stack trace support** for debugging internal collections
- **Zero breaking changes** - works with existing code

### Framework Integration
- **Automatic trace integration** with ActionRegister, Stores, Registry
- **React component lifecycle** tracing
- **Performance monitoring** with configurable thresholds
- **Multi-format export** (JSON, CSV, Chrome Tracing)

## Installation

```bash
npm install @context-action/logger
```

## Quick Start

### Basic Logging

```typescript
import { createLogger, LogLevel } from '@context-action/logger';

// Create logger with environment-based configuration
const logger = createLogger();

// Or with explicit level
const debugLogger = createLogger(LogLevel.DEBUG);

// Use structured logging
logger.trace('Pipeline execution started', { action: 'updateUser', payload });
logger.debug('Handler registration', { handlerId: 'user-validator', priority: 10 });
logger.info('Store updated successfully', { storeName: 'user', newValue });
logger.warn('Performance threshold exceeded', { executionTime: 1500 });
logger.error('Action pipeline failed', error);

// Runtime level adjustment
logger.setLevel(LogLevel.WARN);
```

### Comprehensive Trace Collection

```typescript
import { 
  initializeFrameworkTracing, 
  TraceCategory,
  getFrameworkTraceAnalysis,
  FrameworkLoggers 
} from '@context-action/logger';

// Initialize comprehensive tracing
initializeFrameworkTracing({
  maxEntries: 50000,
  enablePerformanceMonitoring: true,
  performanceThreshold: 100, // 100ms warning threshold
  categories: [
    TraceCategory.ACTION_PIPELINE,
    TraceCategory.STORE_OPERATION,
    TraceCategory.PERFORMANCE
  ]
});

// Create specialized loggers
const actionLogger = FrameworkLoggers.createActionLogger('UserActions');
const storeLogger = FrameworkLoggers.createStoreLogger('UserStore');
const performanceLogger = FrameworkLoggers.createPerformanceLogger();

// Analyze framework performance
const analysis = getFrameworkTraceAnalysis();
console.log('Framework Performance:', analysis);
```

### Universal Trace Collection (All Log Levels → Trace)

```typescript
import { 
  UniversalTraceLogger,
  UniversalTraceCollector,
  TraceSource,
  createUniversalTraceLogger
} from '@context-action/logger';

// Create universal trace logger
const baseLogger = createLogger(LogLevel.DEBUG);
const traceCollector = new UniversalTraceCollector();

const logger = new UniversalTraceLogger(
  baseLogger,
  traceCollector,
  'UserStore',
  TraceCategory.STORE_OPERATION,
  {
    collectFromInfo: true,     // ✅ INFO calls → internal trace
    collectFromWarn: true,     // ✅ WARN calls → internal trace  
    collectFromError: true,    // ✅ ERROR calls → internal trace
    collectFromDebug: false,   // ❌ DEBUG calls → no internal trace
    includeStackTrace: true,   // Add stack trace for debugging
    minTraceLevel: LogLevel.INFO
  }
);

// Usage - ALL of these generate trace data!
logger.trace('Direct trace call');           // → DIRECT trace
logger.info('User updated successfully');    // → INFO log + FROM_INFO trace
logger.warn('Performance threshold hit');    // → WARN log + FROM_WARN trace
logger.error('Database connection failed');  // → ERROR log + FROM_ERROR trace

// Analyze collected traces with perfect distinction
const report = traceCollector.generateSourceReport();
console.log('Direct traces:', report.summary.directTraces);       // Direct trace() calls
console.log('Internal traces:', report.summary.internalTraces);   // INFO/WARN/ERROR traces

// Get traces by source type
const directTraces = traceCollector.getDirectTraces();                    // Only direct trace()
const infoTraces = traceCollector.getTracesBySource(TraceSource.FROM_INFO);  // Only from info()
const warnTraces = traceCollector.getTracesBySource(TraceSource.FROM_WARN);  // Only from warn()
```

### React Component Tracing

```tsx
import { useComponentTracing } from '@context-action/logger';

function UserProfile() {
  const trace = useComponentTracing('UserProfile');
  
  useEffect(() => {
    trace.traceMount();
    return () => trace.traceUnmount();
  }, []);
  
  const handleSubmit = (data) => {
    trace.traceAction('submit', { data });
    // Handle submission
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Component content */}
    </form>
  );
}
```

## Environment Configuration

### Environment Variables

```bash
# Log level configuration
CONTEXT_ACTION_LOG_LEVEL=DEBUG    # TRACE|DEBUG|INFO|WARN|ERROR|NONE
CONTEXT_ACTION_DEBUG=true         # Enables DEBUG level
CONTEXT_ACTION_TRACE=true         # Enables TRACE level
CONTEXT_ACTION_LOGGER_NAME=MyApp  # Custom logger name

# Auto-configuration from NODE_ENV
NODE_ENV=development              # → DEBUG level
NODE_ENV=production              # → ERROR level
```

### Vite Environment Support

```bash
# .env file for Vite projects
VITE_CONTEXT_ACTION_LOG_LEVEL=DEBUG
VITE_CONTEXT_ACTION_TRACE=true
```

## Advanced Usage

### Custom Trace Processors

```typescript
import { 
  TraceCollector, 
  TraceProcessor, 
  FileTraceProcessor 
} from '@context-action/logger';

// Custom processor for external monitoring
class MonitoringTraceProcessor implements TraceProcessor {
  async process(entries: TraceEntry[]): Promise<void> {
    // Send to external monitoring service
    await fetch('/api/traces', {
      method: 'POST',
      body: JSON.stringify(entries)
    });
  }
}

// Initialize with custom processor
const traceCollector = new TraceCollector({
  processor: new MonitoringTraceProcessor()
});
```

### Performance Analysis

```typescript
import { getFrameworkTraceAnalysis, TraceCategory } from '@context-action/logger';

// Get comprehensive analysis
const analysis = getFrameworkTraceAnalysis();

console.log('Overview:', analysis.overview);
console.log('Action Performance:', analysis.performance.actions);
console.log('Store Performance:', analysis.performance.stores);
console.log('Recent Issues:', analysis.issues);

// Category-specific analysis
const collector = getGlobalTraceCollector();
const actionMetrics = collector.analyzePerformance(TraceCategory.ACTION_PIPELINE);

console.log('Action Metrics:', {
  average: actionMetrics.averageTime,
  p95: actionMetrics.percentiles.p95,
  count: actionMetrics.count
});
```

### Export and Debug

```typescript
import { TraceDebugUtils } from '@context-action/logger';

// Enable real-time debugging
TraceDebugUtils.enableDebugMode();

// Export traces for analysis
const jsonTraces = TraceDebugUtils.exportTraces('json');
const csvTraces = TraceDebugUtils.exportTraces('csv');
const chromeTraces = TraceDebugUtils.exportTraces('chrome-tracing');

// Real-time trace streaming
const stopStreaming = TraceDebugUtils.createTraceStream((trace) => {
  console.log('Real-time trace:', trace);
});

// Stop streaming when done
stopStreaming();
```

## Universal Trace Sources

The universal trace system distinguishes between different collection sources:

### TraceSource Enum
- **DIRECT**: Direct trace() method calls
- **FROM_INFO**: Internal trace collection from info() calls  
- **FROM_DEBUG**: Internal trace collection from debug() calls
- **FROM_WARN**: Internal trace collection from warn() calls
- **FROM_ERROR**: Internal trace collection from error() calls

### Usage Examples
```typescript
// All generate different trace sources
logger.trace('Direct trace');    // → TraceSource.DIRECT
logger.info('Info message');     // → TraceSource.FROM_INFO
logger.warn('Warning message');  // → TraceSource.FROM_WARN
logger.error('Error message');   // → TraceSource.FROM_ERROR

// Perfect distinction in analysis
const stats = traceCollector.getTraceStatsBySource();
console.log('Direct traces:', stats[TraceSource.DIRECT].count);
console.log('Internal INFO traces:', stats[TraceSource.FROM_INFO].count);
console.log('Internal WARN traces:', stats[TraceSource.FROM_WARN].count);
```

## Trace Categories

The system organizes traces into categories for better filtering and analysis:

- **ACTION_PIPELINE**: Action registration, dispatch, and execution
- **STORE_OPERATION**: Store state changes, subscriptions, and access
- **REGISTRY_OPERATION**: Store registry operations and lookups
- **EXECUTION_MODE**: Sequential, parallel, and race execution modes
- **ACTION_GUARD**: Debouncing and throttling operations
- **COMPONENT_LIFECYCLE**: React component mount, unmount, updates
- **PERFORMANCE**: Performance monitoring and threshold violations
- **ERROR_HANDLING**: Error processing and recovery
- **USER_INTERACTION**: User-initiated actions and events
- **SYSTEM_EVENT**: General system operations and events

## Performance Monitoring

The trace system automatically monitors performance and identifies issues:

```typescript
// Automatic performance threshold monitoring
initializeFrameworkTracing({
  enablePerformanceMonitoring: true,
  performanceThreshold: 50, // 50ms threshold
});

// Performance analysis
const analysis = getFrameworkTraceAnalysis();
console.log('Performance Issues:', analysis.issues.filter(i => i.type === 'performance'));

// Real-time performance alerts
const stopStreaming = TraceDebugUtils.createTraceStream((trace) => {
  if (trace.category === TraceCategory.PERFORMANCE) {
    console.warn('Performance Issue:', trace);
  }
});
```

## Integration with Framework Components

The logger automatically integrates with all Context-Action framework components:

### ActionRegister Integration

```typescript
import { ActionRegister } from '@context-action/core';
import { FrameworkLoggers } from '@context-action/logger';

// ActionRegister automatically uses trace-enabled logging
const actionRegister = new ActionRegister({
  logger: FrameworkLoggers.createActionLogger('UserActions'),
  logLevel: LogLevel.TRACE
});
```

### Store Integration

```typescript
import { Store } from '@context-action/react';
import { FrameworkLoggers } from '@context-action/logger';

// Store operations are automatically traced
const userStore = new Store('defaultUser', {
  logger: FrameworkLoggers.createStoreLogger('UserStore')
});
```

## API Reference

### Core Functions

- `createLogger(level?: LogLevel): Logger` - Create basic logger
- `getLogLevelFromEnv(): LogLevel` - Get level from environment
- `createFrameworkLogger(component: string, level?: LogLevel): Logger` - Create trace-enabled logger

### Universal Trace Collection

- `UniversalTraceLogger` - Logger that collects traces from all log levels
- `UniversalTraceCollector` - Enhanced collector with source distinction
- `createUniversalTraceLogger(baseLogger, traceCollector, component, category, config): UniversalTraceLogger`
- `createFrameworkUniversalLogger(component, category, config): { logger, traceCollector }`

### Traditional Trace Collection

- `TraceCollector` - Main trace collection class
- `initializeFrameworkTracing(config?: FrameworkTraceConfig): TraceCollector` - Initialize framework tracing
- `getGlobalTraceCollector(): TraceCollector | null` - Get global collector
- `getFrameworkTraceAnalysis()` - Get comprehensive analysis

### Specialized Loggers

- `FrameworkLoggers.createActionLogger(name?: string): Logger`
- `FrameworkLoggers.createStoreLogger(storeName: string): Logger`
- `FrameworkLoggers.createRegistryLogger(name?: string): Logger`
- `FrameworkLoggers.createComponentLogger(name: string): Logger`
- `FrameworkLoggers.createPerformanceLogger(): Logger`

### Debug Utilities

- `TraceDebugUtils.enableDebugMode(): void`
- `TraceDebugUtils.exportTraces(format?: string): string`
- `TraceDebugUtils.clearTraces(): void`
- `TraceDebugUtils.createTraceStream(callback: Function): Function`

## License

MIT License - see LICENSE file for details.