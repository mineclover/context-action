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

This comprehensive demo includes:

#### 🎯 Dynamic Priority Jumping
Real-time priority adjustment based on system conditions:
- **Load-Based Priority**: Automatic priority escalation when system load exceeds thresholds
- **Business Hour Routing**: Priority changes based on time-of-day and business rules
- **User Role Escalation**: Security-based priority jumping for different user permissions
- **Emergency Override**: Critical situation handling with maximum priority assignment

#### 🚪 Smart Early Return Patterns
Intelligent pipeline termination with performance optimization:
- **Multi-Level Cache**: Memory cache → Redis cache → Database fallback with early returns
- **Permission Gates**: Role-based access control with immediate rejection
- **Feature Flags**: Configuration-driven feature enablement with bypass logic
- **Rate Limiting**: Request throttling with early termination for quota violations

#### 🔄 Complex Branching Logic
Business rule-driven pipeline routing:
- **Approval Workflows**: Document processing with conditional approval requirements
- **Payment Processing**: Multi-gateway routing based on amount, region, and payment method
- **Content Moderation**: AI-powered content filtering with escalation paths
- **Order Fulfillment**: Inventory-based routing to warehouses and shipping providers

#### 📊 Real-Time Monitoring
Live visualization of flow control decisions:
- **Pipeline Execution Graph**: Visual representation of handler execution paths
- **Priority Timeline**: Real-time tracking of priority changes and jumps
- **Decision Tree Visualization**: Business rule evaluation and branching paths
- **Performance Metrics**: Execution time, skip rates, and optimization effectiveness

#### 🧪 Interactive Test Scenarios
Hands-on experimentation with different flow control patterns:

```typescript
// Example scenarios available in the playground
const scenarios = {
  // Security escalation scenario
  securityEscalation: {
    description: "Standard user tries to access admin function",
    payload: { userId: "user-123", action: "delete-user", role: "standard" },
    expectedFlow: "standard-auth → role-check → priority-jump(1000) → admin-auth"
  },
  
  // Cache optimization scenario
  cacheOptimization: {
    description: "Data fetching with multi-level cache hierarchy",
    payload: { key: "user-profile-456", includePreferences: true },
    expectedFlow: "memory-cache → redis-cache → database → early-return"
  },
  
  // Business hour routing scenario
  businessHourRouting: {
    description: "Order processing during/outside business hours",
    payload: { orderId: "order-789", amount: 5000, priority: "standard" },
    expectedFlow: "time-check → business-rules → priority-adjust → processing"
  },
  
  // Error recovery scenario
  errorRecovery: {
    description: "API failure with automatic retry and fallback",
    payload: { endpoint: "/api/payments", retryCount: 0, fallbackEnabled: true },
    expectedFlow: "primary-api → error → retry-jump → fallback → recovery"
  }
};
```

#### 🎮 Interactive Controls
- **Scenario Selector**: Choose from predefined flow control scenarios
- **Parameter Tuning**: Adjust payload values and system conditions in real-time
- **Step-by-Step Execution**: Control pipeline execution speed and observe each decision
- **Performance Comparison**: Compare different flow control strategies side-by-side
- **Custom Payload Editor**: Create and test your own flow control scenarios

#### 📈 Analytics Dashboard
Track and analyze flow control effectiveness:
- **Skip Rate Analytics**: Percentage of handlers skipped via early returns
- **Priority Distribution**: Frequency analysis of priority jumping patterns
- **Performance Impact**: Execution time savings from flow control optimizations
- **Error Recovery Success**: Success rates of different error recovery strategies

### Workshop Scenarios

#### Scenario 1: E-commerce Order Processing
**Objective**: Implement flow control for order validation and fulfillment

```typescript
interface OrderActions extends ActionPayloadMap {
  processOrder: {
    orderId: string;
    customerId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    paymentMethod: 'credit' | 'debit' | 'paypal' | 'apple_pay';
    shippingAddress: Address;
    expedited?: boolean;
  };
}

// Implementation includes:
// - Inventory check with early return for out-of-stock items
// - Payment method routing with priority jumping
// - Fraud detection with security escalation
// - Shipping optimization with warehouse selection
```

#### Scenario 2: Content Management System
**Objective**: Dynamic content processing with moderation and approval workflows

```typescript
interface ContentActions extends ActionPayloadMap {
  publishContent: {
    contentId: string;
    authorId: string;
    contentType: 'article' | 'video' | 'image' | 'comment';
    content: string;
    tags: string[];
    scheduledDate?: Date;
    requiresReview?: boolean;
  };
}

// Features demonstrated:
// - AI content analysis with early rejection for policy violations
// - Author permission levels with priority jumping to approval workflows
// - Content type specific validation with conditional processing
// - Publishing schedule optimization with time-based routing
```

#### Scenario 3: Financial Transaction Processing
**Objective**: Multi-layered security and compliance with dynamic routing

```typescript
interface TransactionActions extends ActionPayloadMap {
  processTransaction: {
    transactionId: string;
    fromAccount: string;
    toAccount: string;
    amount: number;
    currency: string;
    transactionType: 'transfer' | 'payment' | 'withdrawal' | 'deposit';
    metadata?: Record<string, any>;
  };
}

// Advanced patterns include:
// - Amount-based compliance routing (small → fast, large → compliance)
// - Real-time fraud detection with immediate blocking
// - Regulatory compliance checks with jurisdiction-specific rules
// - Multi-signature requirements with approval workflows
```

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

### Advanced Flow Control Demo
**Planned**: `/actionguard/flow-control` demo page

**Features to implement**:
- **Dynamic Priority Adjustment**: Runtime priority changes based on system load
- **Handler Chain Interruption**: Conditional pipeline redirection 
- **Complex Branching**: Business rule-based pipeline routing
- **Conditional Skipping**: Smart handler bypassing with context awareness

```typescript
// Planned implementation examples
const flowControlHandler = useCallback(async (payload, controller) => {
  // Dynamic priority based on system load
  if (getSystemLoad() > 0.8) {
    controller.jumpToPriority(1000); // Emergency priority
  }
  
  // Conditional category skipping
  if (payload.skipValidation) {
    controller.skipCategory('validation');
  }
  
  // Smart routing based on business rules
  if (isBusinessHours() && payload.requiresApproval) {
    controller.routeTo('approval-pipeline');
  }
}, []);
```

### Handler Chain Interruption Demo
**Planned**: Advanced interruption patterns with recovery mechanisms

```typescript
// Handler chain with interruption and recovery
const chainHandler = useCallback(async (payload, controller) => {
  try {
    const result = await processWithRetry(payload);
    return result;
  } catch (error) {
    if (error.type === 'RECOVERABLE') {
      controller.jumpToPriority(10); // Jump to recovery handlers
    } else {
      controller.abort(`Unrecoverable error: ${error.message}`);
    }
  }
}, []);
```

## Related

- **[Basic Pipeline Features](./index.md)** - Foundation pipeline concepts
- **[Priority System](./priority.md)** - Handler execution order
- **[Result Handling](./result-handling.md)** - Result collection patterns
- **[Action Patterns](../patterns/action/)** - Action implementation patterns