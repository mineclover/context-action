# Handler Introspection & Metadata

Runtime discovery and analysis of registered handlers with comprehensive metadata support for debugging, monitoring, and system analysis.

## Overview

Handler introspection provides powerful capabilities to examine registered handlers at runtime, analyze their configuration, and gather detailed statistics about handler execution and performance.

## 🔍 Handler Discovery

### Registry Information

Get basic registry information and overview:

```typescript
interface SystemActions extends ActionPayloadMap {
  systemHealth: void;
  auditHandlers: { action?: string };
}

const systemRegister = new ActionRegister<SystemActions>({
  name: 'SystemRegister',
  registry: { debug: true }
});

// Basic registry information
const registryInfo = systemRegister.getRegistryInfo();
console.log(`Registry: ${registryInfo.name}`);
console.log(`Total Actions: ${registryInfo.totalActions}`);
console.log(`Total Handlers: ${registryInfo.totalHandlers}`);
console.log(`Registered Actions:`, registryInfo.registeredActions);
console.log(`Default Execution Mode: ${registryInfo.defaultExecutionMode}`);
```

### Detailed Handler Analysis

```typescript
// Handler discovery and introspection
systemRegister.register('auditHandlers', async (payload, controller) => {
  const registryInfo = systemRegister.getRegistryInfo();
  
  console.log('🔍 Registry Information:');
  console.log(`Total Actions: ${registryInfo.totalActions}`);
  console.log(`Total Handlers: ${registryInfo.totalHandlers}`);
  console.log(`Registry Name: ${registryInfo.name}`);
  console.log(`Default Execution Mode: ${registryInfo.defaultExecutionMode}`);
  
  // Get detailed handler information for each action
  const allActionStats = systemRegister.getAllActionStats();
  
  for (const actionStats of allActionStats) {
    const actionName = String(actionStats.action);
    if (payload.action && actionName !== payload.action) continue;
    
    console.log(`\n📋 Action: ${actionName}`);
    console.log(`  Handlers: ${actionStats.handlerCount}`);
    console.log(`  Execution Mode: ${registryInfo.actionExecutionModes.get(actionStats.action) || registryInfo.defaultExecutionMode}`);
    
    // Show execution statistics if available
    if (actionStats.executionStats) {
      console.log(`  Executions: ${actionStats.executionStats.totalExecutions}`);
      console.log(`  Success Rate: ${actionStats.executionStats.successRate.toFixed(1)}%`);
      console.log(`  Avg Duration: ${actionStats.executionStats.averageDuration.toFixed(1)}ms`);
    }
    
    // Show handlers grouped by priority
    for (const priorityGroup of actionStats.handlersByPriority) {
      console.log(`\n  📊 Priority ${priorityGroup.priority} (${priorityGroup.handlers.length} handlers):`);
      
      for (const handler of priorityGroup.handlers) {
        console.log(`\n    🔧 Handler: ${handler.id}`);
        console.log(`       Tags: [${handler.tags.join(', ')}]`);
        console.log(`       Category: ${handler.category || 'uncategorized'}`);
        console.log(`       Description: ${handler.description || 'No description'}`);
        console.log(`       Version: ${handler.version || 'unknown'}`);
      }
    }
  }
  
  return { auditComplete: true, registryInfo, actionStats: allActionStats };
}, {
  priority: 100,
  id: 'handler-auditor',
  tags: ['system', 'introspection'],
  category: 'administration'
});
```

## ⚙️ Handler Metadata

### Rich Handler Registration

Register handlers with comprehensive metadata:

```typescript
// Register handlers with rich metadata
systemRegister.register('systemHealth', async (payload, controller) => {
  const health = await checkSystemHealth();
  return { status: 'healthy', checks: health };
}, {
  priority: 100,
  id: 'health-checker',
  tags: ['system', 'monitoring', 'health'],
  category: 'diagnostics',
  description: 'Performs comprehensive system health checks',
  version: '1.2.0',
  environment: ['production', 'staging'],
  metrics: {
    collectTiming: true,
    collectErrors: true,
    customMetrics: { healthCheckType: 'full' }
  },
  metadata: {
    author: 'system-team',
    lastUpdated: '2024-01-15',
    criticality: 'high'
  }
});

systemRegister.register('systemHealth', async (payload, controller) => {
  const dbHealth = await checkDatabaseHealth();
  return { database: dbHealth };
}, {
  priority: 90,
  id: 'db-health-checker',
  tags: ['database', 'monitoring'],
  category: 'diagnostics',
  description: 'Checks database connectivity and performance',
  dependencies: ['database-connection'],
  timeout: 5000
});
```

### Metadata Fields

Available metadata fields for handler configuration:

```typescript
interface HandlerConfig {
  // Core Configuration
  priority?: number;           // Execution priority (higher = earlier)
  id?: string;                // Unique handler identifier
  blocking?: boolean;          // Whether handler blocks pipeline
  once?: boolean;             // Remove handler after first execution
  
  // Filtering & Conditions
  condition?: (payload: any) => boolean;  // Execution condition
  validation?: (payload: any) => boolean; // Payload validation
  
  // Performance Control
  debounce?: number;          // Debounce delay in milliseconds
  throttle?: number;          // Throttle delay in milliseconds
  timeout?: number;           // Handler timeout in milliseconds
  retries?: number;           // Number of retry attempts
  
  // Organization & Discovery
  tags?: string[];            // Handler tags for filtering
  category?: string;          // Handler category
  description?: string;       // Human-readable description
  version?: string;           // Handler version
  
  // Environment & Dependencies
  environment?: string[];     // Target environments
  dependencies?: string[];    // Required dependencies
  conflicts?: string[];       // Conflicting handlers
  feature?: string;           // Feature flag identifier
  
  // Metrics & Monitoring
  metrics?: {
    collectTiming?: boolean;
    collectErrors?: boolean;
    customMetrics?: Record<string, any>;
  };
  
  // Custom Metadata
  metadata?: Record<string, any>;
}
```

## 📊 Handler Analysis

### Query Handlers by Attributes

```typescript
// Find handlers by tag
const monitoringHandlers = systemRegister.getHandlersByTag('monitoring');
console.log('Monitoring handlers found in actions:', Array.from(monitoringHandlers.keys()));

// Find handlers by category
const diagnosticHandlers = systemRegister.getHandlersByCategory('diagnostics');
console.log('Diagnostic handlers found in actions:', Array.from(diagnosticHandlers.keys()));

// Get specific action statistics
const healthStats = systemRegister.getActionStats('systemHealth');
if (healthStats) {
  console.log(`Health check has ${healthStats.handlerCount} handlers`);
  console.log('Handlers by priority:', healthStats.handlersByPriority);
  
  if (healthStats.executionStats) {
    console.log(`Average execution time: ${healthStats.executionStats.averageDuration}ms`);
    console.log(`Success rate: ${healthStats.executionStats.successRate}%`);
  }
}
```

### Handler Statistics

```typescript
// Get comprehensive statistics for all actions
const allStats = systemRegister.getAllActionStats();

console.log('📈 Handler Statistics Summary:');
allStats.forEach(stats => {
  console.log(`\n${String(stats.action)}:`);
  console.log(`  Handlers: ${stats.handlerCount}`);
  console.log(`  Priorities: ${stats.handlersByPriority.map(p => p.priority).join(', ')}`);
  
  if (stats.executionStats) {
    console.log(`  Executions: ${stats.executionStats.totalExecutions}`);
    console.log(`  Success Rate: ${stats.executionStats.successRate.toFixed(1)}%`);
    console.log(`  Avg Duration: ${stats.executionStats.averageDuration.toFixed(2)}ms`);
    console.log(`  Errors: ${stats.executionStats.errorCount}`);
  }
});
```

## 🔄 Dynamic Handler Management

### Runtime Handler Registration

```typescript
// Dynamically register handlers based on conditions
function registerConditionalHandlers(register: ActionRegister<any>) {
  const currentEnvironment = process.env.NODE_ENV;
  const featureFlags = getFeatureFlags();
  
  // Register development-only handlers
  if (currentEnvironment === 'development') {
    register.register('debugAction', async (payload, controller) => {
      console.log('🐛 Debug handler executed:', payload);
      return { debug: true, timestamp: Date.now() };
    }, {
      id: 'debug-handler',
      tags: ['debug', 'development'],
      category: 'debugging',
      description: 'Development debugging handler',
      environment: ['development']
    });
  }
  
  // Register feature-gated handlers
  if (featureFlags.advancedAnalytics) {
    register.register('dataAnalysis', async (payload, controller) => {
      const analytics = await performAdvancedAnalytics(payload.data);
      return { analytics, enhanced: true };
    }, {
      id: 'advanced-analytics',
      tags: ['analytics', 'advanced'],
      category: 'analysis',
      description: 'Advanced analytics processing',
      feature: 'advancedAnalytics',
      version: '2.0.0'
    });
  }
}
```

### Handler Lifecycle Management

```typescript
// Track handler registration and removal
function setupHandlerLifecycleTracking(register: ActionRegister<any>) {
  // Store original register method
  const originalRegister = register.register.bind(register);
  
  // Override with lifecycle tracking
  register.register = function<K extends keyof any, R = void>(
    action: K,
    handler: any,
    config: any = {}
  ) {
    console.log(`🔄 Registering handler: ${config.id || 'anonymous'} for action: ${String(action)}`);
    
    // Call original register method
    const unregisterFn = originalRegister(action, handler, config);
    
    // Return enhanced unregister function with logging
    return () => {
      console.log(`🗑️ Unregistering handler: ${config.id || 'anonymous'} for action: ${String(action)}`);
      return unregisterFn();
    };
  };
}
```

## 🧪 Live Examples

### Real-world Handler Introspection

See handler introspection in action with comprehensive metadata:

**[→ UseActionWithResult Demo](https://mineclover.github.io/context-action/example/react/use-action-with-result)**

This demo demonstrates:
- **Handler Registration with Rich Metadata**: Complete handler configuration
- **Tag-based Organization**: Handler categorization and discovery
- **Category-based Filtering**: Handler selection by category
- **Priority-based Execution**: Handler order and execution flow
- **Execution Statistics**: Real-time handler performance tracking

### Handler Metadata Example

From the live demo, see how handlers are registered with comprehensive metadata:

```typescript
useCartHandler('validateCart', validateCartHandler, {
  priority: 100,
  tags: ['validation', 'business-logic'],
  category: 'cart-validation',
  description: 'Validates cart items and pricing',
  returnType: 'value',
  version: '1.0.0'
});

useCartHandler('calculateCart', calculateCartHandler, {
  priority: 90,
  tags: ['calculation', 'business-logic'],
  category: 'cart-calculation',
  description: 'Calculates cart totals and taxes',
  returnType: 'value',
  dependencies: ['cart-validation']
});
```

## 🧪 Testing Introspection

### Test Handler Discovery

```typescript
async function testHandlerIntrospection() {
  console.log('=== Handler Introspection Test ===');
  
  // Audit all handlers
  await systemRegister.dispatch('auditHandlers', {});
  
  // Audit specific action
  console.log('\n--- Auditing specific action ---');
  await systemRegister.dispatch('auditHandlers', { action: 'systemHealth' });
}

async function testHandlerQueries() {
  console.log('=== Handler Query Test ===');
  
  // Query by tags
  const monitoringHandlers = systemRegister.getHandlersByTag('monitoring');
  console.log('Monitoring handlers:', monitoringHandlers.size);
  
  // Query by category  
  const diagnosticHandlers = systemRegister.getHandlersByCategory('diagnostics');
  console.log('Diagnostic handlers:', diagnosticHandlers.size);
  
  // Get action statistics
  const healthStats = systemRegister.getActionStats('systemHealth');
  console.log('Health action stats:', healthStats);
}
```

## 🛠️ Utility Functions

```typescript
// Helper functions for introspection examples
async function checkSystemHealth(): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 'healthy'
  };
}

async function checkDatabaseHealth(): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    connected: true,
    responseTime: 15,
    activeConnections: 8
  };
}

function getFeatureFlags(): Record<string, boolean> {
  return {
    advancedAnalytics: true,
    experimentalFeatures: false,
    debugMode: process.env.NODE_ENV === 'development'
  };
}

async function performAdvancedAnalytics(data: any): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    insights: ['trend1', 'pattern2'],
    confidence: 0.85,
    recommendations: ['action1', 'action2']
  };
}
```

## 📚 Best Practices

### Metadata Guidelines

✅ **Good Practices**
- Use descriptive handler IDs and descriptions
- Tag handlers consistently across the application
- Include version information for tracking changes
- Document dependencies and conflicts
- Set appropriate environment constraints

❌ **Avoid**
- Generic or meaningless tags
- Missing descriptions for complex handlers
- Inconsistent categorization
- Undocumented dependencies

### Performance Considerations

- **Introspection overhead**: Handler queries are fast but avoid frequent calls in hot paths
- **Metadata size**: Keep metadata reasonable sized to avoid memory issues
- **Debug mode**: Enable debug mode only in development environments
- **Statistics collection**: Monitor execution statistics to identify performance bottlenecks

### Debugging Strategies

- Use handler introspection to understand execution order
- Analyze handler statistics to identify slow or failing handlers
- Use tags and categories to group related functionality
- Monitor handler lifecycle for dynamic registration patterns

## Related

- **[Basic Pipeline Features](./index.md)** - Foundation pipeline concepts
- **[Flow Control](./flow-control.md)** - Pipeline flow control
- **[Result Handling](./result-handling.md)** - Result collection patterns  
- **[Performance Monitoring](./performance.md)** - Performance analysis
- **[Action Patterns](../patterns/action/)** - Action implementation patterns