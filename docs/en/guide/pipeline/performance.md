# Performance Monitoring & Metrics

Comprehensive performance monitoring and metrics collection for Context-Action pipelines, enabling performance analysis, bottleneck identification, and optimization.

## Overview

Performance monitoring provides built-in metrics collection, execution statistics, and performance analysis tools to help identify bottlenecks, track system health, and optimize pipeline execution.

## 📊 Built-in Metrics Collection

### Automatic Execution Statistics

The ActionRegister automatically collects execution statistics for all actions:

```typescript
interface MetricsActions extends ActionPayloadMap {
  processWithMetrics: { data: any; trackPerformance: boolean };
}

const metricsRegister = new ActionRegister<MetricsActions>({
  name: 'MetricsRegister',
  registry: { debug: true }
});

// Handler with performance metrics
metricsRegister.register('processWithMetrics', async (payload, controller) => {
  const startTime = performance.now();
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (payload.trackPerformance) {
    controller.setResult({
      step: 'processing',
      duration,
      timestamp: Date.now(),
      performanceData: {
        startTime,
        endTime,
        memoryUsage: process.memoryUsage ? process.memoryUsage() : null
      }
    });
  }
  
  return { processed: true, duration };
}, {
  priority: 100,
  id: 'performance-processor',
  metrics: {
    collectTiming: true,
    collectErrors: true,
    customMetrics: {
      processingType: 'heavy-computation',
      memoryTracking: true
    }
  }
});
```

### Accessing Performance Statistics

```typescript
// Get performance statistics for a specific action
const actionStats = metricsRegister.getActionStats('processWithMetrics');
if (actionStats?.executionStats) {
  console.log('📊 Performance Statistics:', {
    totalExecutions: actionStats.executionStats.totalExecutions,
    averageDuration: actionStats.executionStats.averageDuration,
    successRate: actionStats.executionStats.successRate,
    errorCount: actionStats.executionStats.errorCount
  });
}

// Get statistics for all actions
const allStats = metricsRegister.getAllActionStats();
allStats.forEach(stats => {
  if (stats.executionStats) {
    console.log(`${String(stats.action)}: ${stats.executionStats.averageDuration.toFixed(2)}ms avg`);
  }
});
```

## 🧪 Live Examples

### Priority Performance Demo

See comprehensive performance monitoring in action:

**[→ Priority Performance Demo](https://mineclover.github.io/context-action/example/actionguard/priority-performance)**

This demo showcases:
- **Real-time Performance Monitoring**: Live performance metrics with detailed formulas
- **Execution Time Tracking**: Individual handler timing analysis
- **Performance Score Calculation**: Complex performance scoring algorithms
- **Priority-based Performance Analysis**: Performance impact of priority changes
- **Advanced Metrics Panel**: Professional performance dashboard

### Context Store Pattern Performance

Monitor store-level performance with real-time metrics:

**[→ Context Store Pattern Demo](https://mineclover.github.io/context-action/example/mouse-events/context-store-pattern)**

Features demonstrated:
- **Store Performance Monitoring**: Real-time store operation tracking
- **Memory Usage Analysis**: Store memory consumption monitoring
- **Update Frequency Tracking**: Store update rate analysis
- **Performance Impact Assessment**: Store pattern performance comparison

## ⚡ Performance Testing

### Benchmark Testing

```typescript
async function testPerformanceMonitoring() {
  console.log('=== Performance Monitoring Test ===');
  
  const results = [];
  
  for (let i = 0; i < 5; i++) {
    const result = await metricsRegister.dispatchWithResult('processWithMetrics', {
      data: { iteration: i },
      trackPerformance: true
    });
    
    results.push(result);
    console.log(`Iteration ${i + 1} completed in ${result.execution.duration}ms`);
  }
  
  // Analyze performance statistics
  const actionStats = metricsRegister.getActionStats('processWithMetrics');
  if (actionStats?.executionStats) {
    console.log('\n📊 Execution Statistics:', {
      totalExecutions: actionStats.executionStats.totalExecutions,
      averageDuration: actionStats.executionStats.averageDuration,
      successRate: actionStats.executionStats.successRate,
      errorCount: actionStats.executionStats.errorCount
    });
  }
  
  return results;
}
```

### Load Testing

```typescript
async function performLoadTest() {
  console.log('=== Load Testing ===');
  
  const concurrentRequests = 10;
  const iterations = 5;
  
  console.log(`Running ${concurrentRequests} concurrent requests for ${iterations} iterations`);
  
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const promises = Array.from({ length: concurrentRequests }, (_, index) =>
      metricsRegister.dispatchWithResult('processWithMetrics', {
        data: { iteration: i, request: index },
        trackPerformance: true
      })
    );
    
    const results = await Promise.all(promises);
    
    const avgDuration = results.reduce((sum, r) => sum + r.execution.duration, 0) / results.length;
    console.log(`Iteration ${i + 1}: Avg duration ${avgDuration.toFixed(2)}ms`);
  }
  
  const totalTime = Date.now() - startTime;
  const totalRequests = concurrentRequests * iterations;
  
  console.log(`\n📈 Load Test Results:`);
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Requests per second: ${(totalRequests / (totalTime / 1000)).toFixed(2)}`);
  
  // Get final statistics
  const finalStats = metricsRegister.getActionStats('processWithMetrics');
  if (finalStats?.executionStats) {
    console.log(`\n📊 Final Statistics:`);
    console.log(`Average duration: ${finalStats.executionStats.averageDuration.toFixed(2)}ms`);
    console.log(`Success rate: ${finalStats.executionStats.successRate.toFixed(1)}%`);
    console.log(`Total executions: ${finalStats.executionStats.totalExecutions}`);
  }
}
```

## 🔍 Performance Analysis

### Handler Performance Profiling

```typescript
interface ProfilingActions extends ActionPayloadMap {
  complexWorkflow: { steps: string[]; data: any };
}

const profilingRegister = new ActionRegister<ProfilingActions>();

// Fast handler
profilingRegister.register('complexWorkflow', async (payload, controller) => {
  const start = performance.now();
  
  // Quick validation
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const duration = performance.now() - start;
  
  controller.setResult({
    step: 'validation',
    duration,
    handlerId: 'fast-validator',
    complexity: 'low'
  });
  
  return { validated: true, duration };
}, {
  priority: 100,
  id: 'fast-validator',
  tags: ['validation', 'fast']
});

// Medium handler  
profilingRegister.register('complexWorkflow', async (payload, controller) => {
  const start = performance.now();
  
  // Medium processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const duration = performance.now() - start;
  
  controller.setResult({
    step: 'processing',
    duration,
    handlerId: 'medium-processor',
    complexity: 'medium'
  });
  
  return { processed: true, duration };
}, {
  priority: 90,
  id: 'medium-processor',
  tags: ['processing', 'medium']
});

// Slow handler
profilingRegister.register('complexWorkflow', async (payload, controller) => {
  const start = performance.now();
  
  // Heavy computation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const duration = performance.now() - start;
  
  controller.setResult({
    step: 'analysis',
    duration,
    handlerId: 'slow-analyzer',
    complexity: 'high'
  });
  
  return { analyzed: true, duration };
}, {
  priority: 80,
  id: 'slow-analyzer',
  tags: ['analysis', 'slow']
});
```

### Performance Bottleneck Detection

```typescript
async function analyzePerformanceBottlenecks() {
  console.log('=== Performance Bottleneck Analysis ===');
  
  const result = await profilingRegister.dispatchWithResult('complexWorkflow', {
    steps: ['validate', 'process', 'analyze'],
    data: { complexity: 'high' }
  }, {
    result: { collect: true }
  });
  
  if (result.success && result.results) {
    console.log('\n🔍 Handler Performance Breakdown:');
    
    const sortedResults = result.results
      .filter(r => r.duration !== undefined)
      .sort((a, b) => b.duration - a.duration);
    
    const totalDuration = sortedResults.reduce((sum, r) => sum + r.duration, 0);
    
    sortedResults.forEach((r, index) => {
      const percentage = ((r.duration / totalDuration) * 100).toFixed(1);
      const indicator = index === 0 ? '🐌' : index === 1 ? '⚠️' : '✅';
      
      console.log(`${indicator} ${r.step}: ${r.duration.toFixed(2)}ms (${percentage}%) - ${r.handlerId}`);
    });
    
    // Identify bottlenecks
    const bottleneck = sortedResults[0];
    if (bottleneck.duration > totalDuration * 0.5) {
      console.log(`\n🚨 Bottleneck detected: ${bottleneck.handlerId} taking ${((bottleneck.duration / totalDuration) * 100).toFixed(1)}% of total time`);
    }
  }
  
  return result;
}
```

## 📈 Memory Usage Monitoring

### Memory Tracking

```typescript
interface MemoryActions extends ActionPayloadMap {
  processLargeData: { size: 'small' | 'medium' | 'large'; data?: any };
}

const memoryRegister = new ActionRegister<MemoryActions>();

memoryRegister.register('processLargeData', async (payload, controller) => {
  const initialMemory = process.memoryUsage();
  
  // Simulate different data sizes
  let data;
  switch (payload.size) {
    case 'small':
      data = new Array(1000).fill(0).map((_, i) => ({ id: i, value: Math.random() }));
      break;
    case 'medium':
      data = new Array(100000).fill(0).map((_, i) => ({ id: i, value: Math.random() }));
      break;
    case 'large':
      data = new Array(1000000).fill(0).map((_, i) => ({ id: i, value: Math.random() }));
      break;
  }
  
  // Process data
  const processed = data.map(item => ({ ...item, processed: true }));
  
  const finalMemory = process.memoryUsage();
  
  const memoryDiff = {
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
    rss: finalMemory.rss - initialMemory.rss
  };
  
  controller.setResult({
    step: 'memory-analysis',
    dataSize: payload.size,
    recordCount: data.length,
    initialMemory,
    finalMemory,
    memoryDiff,
    memoryEfficiency: memoryDiff.heapUsed / data.length // bytes per record
  });
  
  // Clean up large data
  data = null;
  
  return {
    processed: true,
    recordCount: processed.length,
    memoryUsed: memoryDiff.heapUsed
  };
}, {
  priority: 100,
  id: 'memory-processor',
  tags: ['memory', 'performance']
});

async function testMemoryUsage() {
  console.log('=== Memory Usage Test ===');
  
  const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
  
  for (const size of sizes) {
    console.log(`\n--- Testing ${size} data size ---`);
    
    const result = await memoryRegister.dispatchWithResult('processLargeData', {
      size
    });
    
    if (result.success && result.results.length > 0) {
      const memoryResult = result.results[0];
      console.log(`Records processed: ${memoryResult.recordCount.toLocaleString()}`);
      console.log(`Memory used: ${(memoryResult.memoryDiff.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Memory per record: ${memoryResult.memoryEfficiency.toFixed(2)} bytes`);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}
```

## ⏱️ Custom Performance Metrics

### Custom Timing Metrics

```typescript
interface CustomMetricsActions extends ActionPayloadMap {
  customProcess: { operation: string; data: any };
}

const customMetricsRegister = new ActionRegister<CustomMetricsActions>();

customMetricsRegister.register('customProcess', async (payload, controller) => {
  const metrics = {
    startTime: Date.now(),
    checkpoints: [] as Array<{ name: string; timestamp: number; duration: number }>
  };
  
  // Checkpoint 1: Setup
  const setupStart = performance.now();
  await setupOperation(payload.operation);
  const setupDuration = performance.now() - setupStart;
  metrics.checkpoints.push({
    name: 'setup',
    timestamp: Date.now(),
    duration: setupDuration
  });
  
  // Checkpoint 2: Main processing
  const processStart = performance.now();
  const result = await performMainOperation(payload.data);
  const processDuration = performance.now() - processStart;
  metrics.checkpoints.push({
    name: 'main-processing',
    timestamp: Date.now(),
    duration: processDuration
  });
  
  // Checkpoint 3: Cleanup
  const cleanupStart = performance.now();
  await cleanupOperation();
  const cleanupDuration = performance.now() - cleanupStart;
  metrics.checkpoints.push({
    name: 'cleanup',
    timestamp: Date.now(),
    duration: cleanupDuration
  });
  
  const totalDuration = metrics.checkpoints.reduce((sum, cp) => sum + cp.duration, 0);
  
  controller.setResult({
    step: 'custom-metrics',
    operation: payload.operation,
    metrics: {
      ...metrics,
      totalDuration,
      endTime: Date.now(),
      breakdown: metrics.checkpoints.map(cp => ({
        phase: cp.name,
        duration: cp.duration,
        percentage: ((cp.duration / totalDuration) * 100).toFixed(1)
      }))
    }
  });
  
  return {
    operation: payload.operation,
    success: true,
    totalDuration,
    result
  };
}, {
  priority: 100,
  id: 'custom-metrics-processor',
  metrics: {
    collectTiming: true,
    customMetrics: {
      detailedTiming: true,
      phaseBreakdown: true
    }
  }
});
```

## 📊 Performance Dashboard

### Real-time Performance Monitoring

```typescript
class PerformanceDashboard {
  private registers: Map<string, ActionRegister<any>> = new Map();
  
  addRegister(name: string, register: ActionRegister<any>) {
    this.registers.set(name, register);
  }
  
  generatePerformanceReport(): any {
    const report = {
      timestamp: new Date().toISOString(),
      registers: [] as any[]
    };
    
    for (const [name, register] of this.registers) {
      const registryInfo = register.getRegistryInfo();
      const allStats = register.getAllActionStats();
      
      const registerReport = {
        name,
        totalActions: registryInfo.totalActions,
        totalHandlers: registryInfo.totalHandlers,
        actions: [] as any[]
      };
      
      for (const actionStats of allStats) {
        if (actionStats.executionStats) {
          registerReport.actions.push({
            action: String(actionStats.action),
            handlerCount: actionStats.handlerCount,
            statistics: {
              executions: actionStats.executionStats.totalExecutions,
              averageDuration: Math.round(actionStats.executionStats.averageDuration * 100) / 100,
              successRate: Math.round(actionStats.executionStats.successRate * 10) / 10,
              errorCount: actionStats.executionStats.errorCount
            }
          });
        }
      }
      
      report.registers.push(registerReport);
    }
    
    return report;
  }
  
  printPerformanceReport() {
    const report = this.generatePerformanceReport();
    
    console.log('\n📊 Performance Dashboard Report');
    console.log('================================');
    console.log(`Generated: ${report.timestamp}\n`);
    
    for (const register of report.registers) {
      console.log(`🏭 Registry: ${register.name}`);
      console.log(`   Actions: ${register.totalActions}, Handlers: ${register.totalHandlers}\n`);
      
      if (register.actions.length > 0) {
        console.log('   📈 Action Performance:');
        register.actions.forEach((action: any) => {
          const stats = action.statistics;
          console.log(`   • ${action.action}:`);
          console.log(`     Executions: ${stats.executions}, Avg: ${stats.averageDuration}ms`);
          console.log(`     Success: ${stats.successRate}%, Errors: ${stats.errorCount}`);
        });
      }
      
      console.log('');
    }
  }
}

// Usage example
async function setupPerformanceDashboard() {
  const dashboard = new PerformanceDashboard();
  
  dashboard.addRegister('Metrics', metricsRegister);
  dashboard.addRegister('Profiling', profilingRegister);
  dashboard.addRegister('Memory', memoryRegister);
  dashboard.addRegister('CustomMetrics', customMetricsRegister);
  
  // Run some operations to generate data
  await testPerformanceMonitoring();
  await analyzePerformanceBottlenecks();
  
  // Generate and display report
  dashboard.printPerformanceReport();
  
  return dashboard;
}
```

## 🛠️ Helper Functions

```typescript
// Helper functions for performance examples
async function setupOperation(operation: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function performMainOperation(data: any): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return { processed: true, data };
}

async function cleanupOperation(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 30));
}
```

## 📚 Best Practices

### Performance Monitoring Guidelines

✅ **Good Practices**
- Enable metrics collection for critical handlers
- Set up regular performance baselines
- Monitor memory usage for data-intensive operations
- Use custom metrics for business-specific measurements
- Implement performance alerts for degradation

❌ **Avoid**
- Collecting metrics for every handler (overhead)
- Ignoring memory leaks in long-running processes
- Making performance decisions without data
- Over-optimizing non-critical paths

### Performance Optimization Strategies

- **Identify bottlenecks** using execution statistics
- **Optimize critical paths** with highest impact
- **Use handler filtering** to reduce unnecessary processing
- **Implement caching** for expensive operations
- **Monitor memory usage** and prevent leaks

### Monitoring Thresholds

Set up alerts for:
- Average execution time > baseline + 50%
- Success rate < 95%
- Error count > 10% of executions
- Memory usage growth > 20% per hour

## Related

- **[Basic Pipeline Features](./index.md)** - Foundation pipeline concepts
- **[Handler Introspection](./introspection.md)** - Handler metadata and discovery
- **[Flow Control](./flow-control.md)** - Pipeline flow control
- **[Priority System](./priority.md)** - Handler execution order
- **[Action Patterns](../patterns/action/)** - Action implementation patterns