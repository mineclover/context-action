# Pipeline Flow Control

Advanced flow control mechanisms for Context-Action pipeline execution, enabling dynamic pipeline management and conditional execution paths.

## Overview

Pipeline flow control provides sophisticated mechanisms to alter the normal sequential execution of handlers. These features enable complex business logic patterns, conditional processing, and early termination scenarios.

## 🔀 Priority Jumping

Dynamically redirect pipeline execution to specific priority levels based on runtime conditions.

### Basic Priority Jumping

```typescript
interface SecurityActions extends ActionPayloadMap {
  processRequest: { 
    userId: string; 
    action: string; 
    requiresElevation?: boolean;
  };
}

const securityRegister = new ActionRegister<SecurityActions>();

// Normal processing handler (priority 50)
securityRegister.register('processRequest', async (payload, controller) => {
  console.log('🔍 Initial security check...');
  
  if (payload.requiresElevation) {
    // Jump to high-priority security handlers
    controller.jumpToPriority(1000);
    console.log('⚡ Jumping to elevated security pipeline');
    return;
  }
  
  // Continue normal processing
  return { level: 'standard', processed: true };
}, { priority: 50, id: 'standard-security' });

// Elevated security handler (priority 1000)
securityRegister.register('processRequest', async (payload, controller) => {
  console.log('🛡️ Elevated security processing...');
  
  // Perform additional security checks
  const securityResult = await performElevatedSecurityCheck(payload.userId);
  
  if (!securityResult.authorized) {
    controller.abort('Elevated security check failed');
    return;
  }
  
  return { level: 'elevated', authorized: true, securityToken: securityResult.token };
}, { priority: 1000, id: 'elevated-security' });
```

### Priority Jumping Use Cases

**Security Escalation**
- Standard authentication → Elevated security checks
- Basic validation → Comprehensive validation
- Regular processing → Administrative approval

**Error Handling**
- Normal flow → Error recovery handlers
- Retry logic → Fallback mechanisms
- Data validation → Error reporting

**Business Logic Branching**
- Standard workflow → Premium user flow
- Basic features → Advanced features
- Default processing → Custom processing

## 🚪 Early Return with Results

Terminate pipeline execution early while providing results to subsequent processes.

### Cache-First Pattern

```typescript
interface CacheActions extends ActionPayloadMap {
  fetchData: { key: string; fallbackUrl?: string };
}

const cacheRegister = new ActionRegister<CacheActions>();

// Cache check handler (priority 100)
cacheRegister.register('fetchData', async (payload, controller) => {
  console.log(`🔍 Checking cache for key: ${payload.key}`);
  
  const cached = await checkCache(payload.key);
  
  if (cached) {
    console.log('✅ Cache hit! Returning early.');
    // Return early and skip remaining handlers
    controller.return({ 
      source: 'cache', 
      data: cached, 
      timestamp: Date.now() 
    });
    return;
  }
  
  console.log('❌ Cache miss, continuing to fetch...');
}, { priority: 100, id: 'cache-checker' });

// API fetch handler (priority 80) - only runs on cache miss
cacheRegister.register('fetchData', async (payload, controller) => {
  console.log(`🌐 Fetching from API: ${payload.fallbackUrl}`);
  
  const apiData = await fetchFromAPI(payload.fallbackUrl || `/api/data/${payload.key}`);
  
  // Cache the result for future requests
  await setCache(payload.key, apiData, { ttl: 3600 });
  
  return { 
    source: 'api', 
    data: apiData, 
    timestamp: Date.now() 
  };
}, { priority: 80, id: 'api-fetcher' });
```

### Early Return Patterns

**Performance Optimization**
- Cache hits bypass expensive operations
- Quick validation failures prevent unnecessary processing
- Short-circuit evaluation for boolean operations

**Security Gating**
- Authentication failures stop further processing
- Permission checks prevent unauthorized access
- Rate limiting blocks excessive requests

**Business Rules**
- Feature flags disable functionality
- User preferences override defaults
- Configuration settings control behavior

## 🔄 Pipeline Control Methods

### Available Controller Methods

```typescript
interface PipelineController<TPayload, TResult> {
  // Flow Control
  jumpToPriority(priority: number): void;
  return(result: TResult): void;
  abort(reason?: string): void;
  
  // Payload Management
  modifyPayload(modifier: (payload: TPayload) => TPayload): void;
  getPayload(): TPayload;
  
  // Result Management
  setResult(result: TResult): void;
  getResults(): TResult[];
  mergeResult(merger: (previousResults: TResult[], currentResult: TResult) => TResult): void;
}
```

### Method Combinations

**Conditional Processing**
```typescript
register('processOrder', async (payload, controller) => {
  if (payload.priority === 'urgent') {
    controller.jumpToPriority(1000); // Skip to urgent handlers
    return;
  }
  
  if (payload.amount > 10000) {
    controller.return({ requiresApproval: true }); // Early return for approval
    return;
  }
  
  // Continue normal processing
  return processStandardOrder(payload);
});
```

**Error Recovery**
```typescript
register('apiCall', async (payload, controller) => {
  try {
    const result = await makeApiCall(payload);
    controller.setResult(result);
  } catch (error) {
    if (error.code === 'RATE_LIMIT') {
      controller.jumpToPriority(10); // Jump to retry handlers
    } else {
      controller.abort(`API call failed: ${error.message}`);
    }
  }
});
```

## 🧪 Live Examples

### Priority Performance Demo

See a comprehensive priority jumping implementation in action:

**[→ Priority Performance Demo](https://mineclover.github.io/context-action/example/actionguard/priority-performance)**

This demo showcases:
- Priority-based handler execution with multiple test instances
- Real-time performance monitoring of priority changes
- Dynamic priority adjustment based on system conditions
- Complex pipeline scenarios with priority interruption

### Advanced Core Features

Explore error handling and pipeline interruption:

**[→ Core Advanced Demo](https://mineclover.github.io/context-action/example/core/advanced)**

Features demonstrated:
- `controller.abort()` usage for early termination
- Error handling patterns
- Pipeline interruption scenarios

### Interactive Flow Control Playground

Experience advanced flow control patterns with real-time visualization:

**[→ Flow Control Playground](https://mineclover.github.io/context-action/example/pipeline/flow-control)**

This comprehensive playground demonstrates:

#### 🔒 Security Escalation Scenarios
- Standard security checks with automatic elevation detection
- Priority jumping from standard (priority 50) to elevated (priority 1000) security
- Authorization failures with pipeline abort mechanisms
- Real-time security token generation and validation

#### 🗄️ Cache Optimization Patterns  
- Multi-tier caching system (Memory → Redis → Database)
- Early return optimization when cache hits occur
- Cache busting scenarios for testing database fallback
- Performance monitoring of cache hit rates

#### 🏢 Business Hour Routing Logic
- Dynamic priority adjustment based on business hours
- Customer tier processing (standard → premium → enterprise)
- Order value thresholds triggering high-value processing paths
- International vs. domestic order routing

#### 🔄 Error Recovery Mechanisms
- API failure simulation with automatic retry logic
- Progressive backoff strategies with priority jumping
- Maximum retry limit handling with fallback activation
- Real-time execution path visualization

#### 🎛️ Interactive Controls
- System load simulation affecting handler performance
- Business hours toggle for testing time-sensitive routing
- Cache clearing for testing cold-start scenarios
- Real-time metrics display for handler execution counts

#### 📊 Execution Visualization
- Live execution path tracking showing handler sequence
- Performance metrics with execution timing
- Result aggregation from multiple pipeline stages
- Error states and recovery pathway visualization

The playground features a modular architecture with:
- **Scenario-based testing** - Pre-configured test cases for each pattern
- **Handler isolation** - Separate modules for different business domains  
- **Real-time feedback** - Live updates showing pipeline flow
- **Interactive debugging** - Step-by-step execution analysis

## 🧪 Testing Flow Control

### Test Priority Jumping

```typescript
async function testPriorityJumping() {
  console.log('=== Priority Jumping Test ===');
  
  // Standard request (no jumping)
  const standardResult = await securityRegister.dispatchWithResult('processRequest', {
    userId: 'user-123',
    action: 'read-profile'
  });
  console.log('Standard result:', standardResult);
  
  // Elevated request (triggers priority jumping)
  const elevatedResult = await securityRegister.dispatchWithResult('processRequest', {
    userId: 'admin-456',
    action: 'delete-user',
    requiresElevation: true
  });
  console.log('Elevated result:', elevatedResult);
}
```

### Test Early Return

```typescript
async function testEarlyReturn() {
  console.log('=== Early Return Test ===');
  
  // First call (cache miss, full pipeline)
  console.log('--- First call (should fetch from API) ---');
  const firstResult = await cacheRegister.dispatchWithResult('fetchData', {
    key: 'user-profile-123',
    fallbackUrl: '/api/users/123'
  });
  console.log('First result:', firstResult);
  
  // Second call (cache hit, early return)
  console.log('--- Second call (should return from cache) ---');
  const secondResult = await cacheRegister.dispatchWithResult('fetchData', {
    key: 'user-profile-123'
  });
  console.log('Second result:', secondResult);
}
```

Complete test suites and advanced patterns are available in the [Flow Control Playground](https://mineclover.github.io/context-action/example/pipeline/flow-control).

## 📚 Best Practices

### When to Use Priority Jumping

✅ **Good Use Cases**
- Security escalation workflows
- Error recovery mechanisms
- Business rule branching
- Feature flag implementations

❌ **Avoid When**
- Simple conditional logic (use normal priority)
- One-time exceptions (use early return)
- Complex state management (use separate actions)

### When to Use Early Return

✅ **Good Use Cases**
- Performance optimizations (caching)
- Validation failures
- Security gates
- Configuration-based skipping

❌ **Avoid When**
- Need to aggregate results from multiple handlers
- Debugging and need full pipeline execution
- Error recovery is required

### Performance Considerations

- **Priority jumping** skips intermediate handlers but processes from target priority
- **Early return** stops all remaining execution immediately
- Use **handler filtering** for consistent handler selection
- Consider **execution modes** for different performance characteristics

## 🚧 Future Implementation Plans

The Context-Action framework continues to evolve with sophisticated flow control capabilities:

### Planned Features

#### 🎯 Dynamic Priority Adjustment
Runtime priority modification based on system conditions and business rules

#### 🔀 Handler Category Management  
Group handlers by categories and control execution at the category level

#### 🚏 Pipeline Routing
Advanced routing capabilities for complex business workflows

#### 🔄 Conditional Loop Control
Advanced looping and iteration control within pipelines

See the [Flow Control Playground](https://mineclover.github.io/context-action/example/pipeline/flow-control) for experimental implementations and prototype testing.

## Related

- **[Basic Pipeline Features](./index.md)** - Foundation pipeline concepts
- **[Priority System](./priority.md)** - Handler execution order
- **[Result Handling](./result-handling.md)** - Result collection patterns
- **[Action Patterns](../patterns/action/)** - Action implementation patterns