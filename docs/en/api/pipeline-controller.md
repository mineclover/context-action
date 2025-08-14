# Pipeline Controller API

Complete API reference for the Pipeline Controller object passed to action handlers for advanced pipeline control.

## Overview

The Pipeline Controller provides advanced control flow capabilities within action handlers. It allows handlers to modify payloads, share results, control execution flow, and coordinate with other handlers in the pipeline.

## Core Control Methods

### `controller.abort(reason, error?)`

Aborts the entire action pipeline execution.

**Parameters:**
- `reason`: Human-readable reason for aborting
- `error?`: Optional error object

**Behavior:** Stops all remaining handlers and throws PipelineAbortError

```typescript
useActionHandler('validateInput', (payload, controller) => {
  if (!payload.email || !payload.email.includes('@')) {
    controller.abort('Valid email is required');
    return;
  }
  
  if (payload.age < 18) {
    controller.abort('User must be 18 or older', new ValidationError('Age requirement'));
    return;
  }
  
  return { valid: true };
});
```

### `controller.skip(reason?)`

Skips the current handler without affecting other handlers.

**Parameters:**
- `reason?`: Optional reason for skipping

**Returns:** Special skip result

```typescript
useActionHandler('premiumFeature', (payload, controller) => {
  if (!payload.user.isPremium) {
    return controller.skip('User is not premium');
  }
  
  // Premium feature logic
  return { featureExecuted: true };
});
```

## Payload Management

### `controller.getPayload()`

Gets the current (possibly modified) payload.

**Returns:** Current payload object

```typescript
useActionHandler('logAction', (_, controller) => {
  const currentPayload = controller.getPayload();
  
  console.log('Final payload used:', currentPayload);
  auditLogger.log('action_payload', currentPayload);
  
  return { logged: true };
}, { priority: 1 }); // Low priority to run last
```

### `controller.modifyPayload(modifier)`

Modifies the payload for subsequent handlers.

**Parameters:**
- `modifier`: Function that receives current payload and returns modified payload

```typescript
useActionHandler('enrichPayload', (payload, controller) => {
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId: getCurrentUserId(),
    userAgent: navigator.userAgent,
    source: 'web-app'
  }));
  
  return { enriched: true };
}, { priority: 95 }); // High priority to run early
```

### `controller.setPayloadProperty(key, value)`

Sets a specific property on the payload.

**Parameters:**
- `key`: Property key to set
- `value`: Value to assign

```typescript
useActionHandler('addMetadata', (payload, controller) => {
  controller.setPayloadProperty('requestId', generateRequestId());
  controller.setPayloadProperty('timestamp', Date.now());
  
  return { metadataAdded: true };
});
```

## Result Management

### `controller.setResult(result)`

Sets a result that can be accessed by later handlers.

**Parameters:**
- `result`: Result object to store

```typescript
useActionHandler('processPayment', async (payload, controller) => {
  try {
    const transaction = await paymentService.charge({
      amount: payload.amount,
      source: payload.paymentMethod
    });
    
    controller.setResult({
      step: 'payment',
      transactionId: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      success: true,
      provider: 'stripe'
    });
    
    return { success: true, transactionId: transaction.id };
    
  } catch (error) {
    controller.setResult({
      step: 'payment',
      success: false,
      error: error.message,
      provider: 'stripe'
    });
    
    controller.abort(`Payment failed: ${error.message}`);
  }
}, { priority: 90, id: 'payment-processor' });
```

### `controller.getResults()`

Gets all results set by previous handlers.

**Returns:** Array of result objects

```typescript
useActionHandler('sendConfirmation', async (payload, controller) => {
  const results = controller.getResults();
  const paymentResult = results.find(r => r.step === 'payment');
  const userResult = results.find(r => r.step === 'user-update');
  
  if (paymentResult?.success && userResult?.success) {
    await emailService.sendConfirmation({
      email: payload.email,
      transactionId: paymentResult.transactionId,
      userId: userResult.userId
    });
    
    return { confirmationSent: true };
  }
  
  return { confirmationSent: false, reason: 'Prerequisites not met' };
}, { priority: 70, id: 'confirmation-sender' });
```

### `controller.getResult(predicate)`

Gets a specific result using a predicate function.

**Parameters:**
- `predicate`: Function to find the desired result

**Returns:** Matching result or undefined

```typescript
useActionHandler('processRefund', async (payload, controller) => {
  const paymentResult = controller.getResult(r => 
    r.step === 'payment' && r.provider === 'stripe'
  );
  
  if (paymentResult?.transactionId) {
    const refund = await stripeService.refund(paymentResult.transactionId);
    return { refunded: true, refundId: refund.id };
  }
  
  controller.abort('No valid payment found for refund');
}, { priority: 80 });
```

## Pipeline State Management

### `controller.setPipelineState(key, value)`

Sets pipeline-level state that persists across handlers.

**Parameters:**
- `key`: State key
- `value`: State value

```typescript
useActionHandler('initializeSession', (payload, controller) => {
  const sessionId = generateSessionId();
  const userId = payload.userId;
  
  controller.setPipelineState('sessionId', sessionId);
  controller.setPipelineState('userId', userId);
  controller.setPipelineState('startTime', Date.now());
  
  return { sessionInitialized: true, sessionId };
}, { priority: 100 });
```

### `controller.getPipelineState(key)`

Gets pipeline-level state.

**Parameters:**
- `key`: State key to retrieve

**Returns:** State value or undefined

```typescript
useActionHandler('trackDuration', (payload, controller) => {
  const startTime = controller.getPipelineState('startTime');
  const duration = Date.now() - (startTime || Date.now());
  
  controller.setResult({
    step: 'duration-tracking',
    duration,
    startTime
  });
  
  return { durationTracked: true, duration };
}, { priority: 10 }); // Low priority to run last
```

### `controller.getAllPipelineState()`

Gets all pipeline state.

**Returns:** Object with all pipeline state

```typescript
useActionHandler('pipelineSummary', (payload, controller) => {
  const allState = controller.getAllPipelineState();
  const allResults = controller.getResults();
  
  const summary = {
    pipelineState: allState,
    handlerResults: allResults,
    finalPayload: controller.getPayload(),
    executionSummary: {
      totalHandlers: allResults.length,
      successfulHandlers: allResults.filter(r => !r.error).length,
      duration: Date.now() - (allState.startTime || Date.now())
    }
  };
  
  console.log('Pipeline execution summary:', summary);
  return summary;
}, { priority: 5 }); // Very low priority to run at the end
```

## Advanced Pipeline Patterns

### Multi-Stage Processing

```typescript
function MultiStageProcessor() {
  // Stage 1: Input Processing
  useActionHandler('processOrder', (payload, controller) => {
    const processedPayload = {
      ...payload,
      orderId: generateOrderId(),
      processedAt: Date.now()
    };
    
    controller.modifyPayload(() => processedPayload);
    controller.setPipelineState('stage', 'input-processed');
    
    return { stage: 'input', success: true };
  }, { priority: 100, id: 'input-processor' });
  
  // Stage 2: Validation
  useActionHandler('processOrder', (payload, controller) => {
    const validationResult = validateOrder(payload);
    
    if (!validationResult.valid) {
      controller.abort(`Validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    controller.setPipelineState('stage', 'validated');
    controller.setResult({
      step: 'validation',
      valid: true,
      checks: validationResult.checks
    });
    
    return { stage: 'validation', success: true };
  }, { priority: 90, id: 'validator' });
  
  // Stage 3: Business Logic
  useActionHandler('processOrder', async (payload, controller) => {
    const stage = controller.getPipelineState('stage');
    
    if (stage !== 'validated') {
      controller.abort('Order not properly validated');
    }
    
    const orderResult = await orderService.createOrder(payload);
    
    controller.setResult({
      step: 'order-creation',
      orderId: orderResult.id,
      amount: orderResult.amount,
      success: true
    });
    
    controller.setPipelineState('stage', 'completed');
    return orderResult;
  }, { priority: 80, id: 'order-processor' });
  
  return null;
}
```

### Conditional Pipeline Branching

```typescript
function ConditionalBranching() {
  // Route to different handlers based on payload
  useActionHandler('processPayment', (payload, controller) => {
    controller.setPipelineState('paymentMethod', payload.method);
    
    if (payload.method === 'credit_card') {
      controller.setPipelineState('processor', 'stripe');
    } else if (payload.method === 'paypal') {
      controller.setPipelineState('processor', 'paypal');
    } else {
      controller.abort(`Unsupported payment method: ${payload.method}`);
    }
    
    return { routed: true, processor: controller.getPipelineState('processor') };
  }, { priority: 100, id: 'payment-router' });
  
  // Stripe handler (conditional)
  useActionHandler('processPayment', async (payload, controller) => {
    const processor = controller.getPipelineState('processor');
    
    if (processor !== 'stripe') {
      return controller.skip('Not a Stripe payment');
    }
    
    const result = await stripeService.charge(payload);
    controller.setResult({ processor: 'stripe', ...result });
    
    return result;
  }, { priority: 80, id: 'stripe-processor' });
  
  // PayPal handler (conditional)
  useActionHandler('processPayment', async (payload, controller) => {
    const processor = controller.getPipelineState('processor');
    
    if (processor !== 'paypal') {
      return controller.skip('Not a PayPal payment');
    }
    
    const result = await paypalService.charge(payload);
    controller.setResult({ processor: 'paypal', ...result });
    
    return result;
  }, { priority: 80, id: 'paypal-processor' });
  
  return null;
}
```

## Controller State Inspection

### `controller.getExecutionContext()`

Gets information about the current execution context.

**Returns:** Execution context object

```typescript
useActionHandler('debugHandler', (payload, controller) => {
  const context = controller.getExecutionContext();
  
  console.log('Execution context:', {
    actionName: context.actionName,
    handlerId: context.currentHandlerId,
    executionId: context.executionId,
    startTime: context.startTime,
    remainingHandlers: context.remainingHandlers
  });
  
  return { debugInfo: context };
});
```

### `controller.getHandlerInfo()`

Gets information about the current handler.

**Returns:** Handler information object

```typescript
useActionHandler('selfAwareHandler', (payload, controller) => {
  const handlerInfo = controller.getHandlerInfo();
  
  console.log('Current handler:', {
    id: handlerInfo.id,
    priority: handlerInfo.priority,
    registeredAt: handlerInfo.registeredAt,
    executionCount: handlerInfo.executionCount
  });
  
  return handlerInfo;
}, { id: 'self-aware', priority: 50 });
```

## Error Handling

### Pipeline Error Recovery

```typescript
function ErrorRecoveryHandler() {
  useActionHandler('riskyOperation', async (payload, controller) => {
    try {
      const result = await riskyService.performOperation(payload);
      
      controller.setResult({
        step: 'risky-operation',
        success: true,
        data: result
      });
      
      return result;
      
    } catch (error) {
      // Log error but don't abort - let recovery handler try
      controller.setResult({
        step: 'risky-operation',
        success: false,
        error: error.message,
        needsRecovery: true
      });
      
      return { error: error.message, recovered: false };
    }
  }, { priority: 90, id: 'risky-handler' });
  
  // Recovery handler
  useActionHandler('riskyOperation', async (payload, controller) => {
    const results = controller.getResults();
    const needsRecovery = results.some(r => r.needsRecovery);
    
    if (needsRecovery) {
      try {
        const result = await fallbackService.performOperation(payload);
        
        controller.setResult({
          step: 'recovery',
          success: true,
          data: result,
          recoveredFrom: 'risky-operation'
        });
        
        return { recovered: true, data: result };
        
      } catch (error) {
        controller.abort(`Recovery failed: ${error.message}`);
      }
    }
    
    return controller.skip('No recovery needed');
  }, { priority: 80, id: 'recovery-handler' });
  
  return null;
}
```

## Advanced Pipeline Control

### Dynamic Handler Execution

```typescript
function DynamicHandler() {
  useActionHandler('dynamicAction', async (payload, controller) => {
    // Modify execution based on results
    const results = controller.getResults();
    const hasValidation = results.some(r => r.step === 'validation');
    
    if (!hasValidation) {
      // Trigger validation dynamically
      controller.modifyPayload(current => ({
        ...current,
        needsValidation: true
      }));
      
      // Set state to trigger validation in next handler
      controller.setPipelineState('requireValidation', true);
    }
    
    return { dynamicExecutionApplied: true };
  }, { priority: 85 });
  
  // Conditional validation handler
  useActionHandler('dynamicAction', (payload, controller) => {
    const needsValidation = controller.getPipelineState('requireValidation');
    
    if (needsValidation) {
      const isValid = performValidation(payload);
      
      if (!isValid) {
        controller.abort('Dynamic validation failed');
      }
      
      controller.setResult({ step: 'validation', success: true });
      return { validated: true };
    }
    
    return controller.skip('Validation not required');
  }, { priority: 80, id: 'dynamic-validator' });
  
  return null;
}
```

### Pipeline Coordination

```typescript
function PipelineCoordinator() {
  // Coordinator handler
  useActionHandler('complexWorkflow', async (payload, controller) => {
    // Check if all prerequisites are met
    const results = controller.getResults();
    const hasAuth = results.some(r => r.step === 'authentication' && r.success);
    const hasValidation = results.some(r => r.step === 'validation' && r.success);
    const hasPermission = results.some(r => r.step === 'permission' && r.success);
    
    if (!hasAuth || !hasValidation || !hasPermission) {
      const missing = [];
      if (!hasAuth) missing.push('authentication');
      if (!hasValidation) missing.push('validation');
      if (!hasPermission) missing.push('permission');
      
      controller.abort(`Missing prerequisites: ${missing.join(', ')}`);
      return;
    }
    
    // All prerequisites met, proceed with main operation
    const mainResult = await performMainOperation(payload);
    
    controller.setResult({
      step: 'main-operation',
      success: true,
      data: mainResult,
      prerequisites: { hasAuth, hasValidation, hasPermission }
    });
    
    return mainResult;
    
  }, { priority: 50, id: 'workflow-coordinator' });
  
  return null;
}
```

## Controller Configuration

### `controller.setTimeout(timeout)`

Sets a timeout for the current handler execution.

**Parameters:**
- `timeout`: Timeout in milliseconds

```typescript
useActionHandler('longRunningTask', async (payload, controller) => {
  controller.setTimeout(30000); // 30 second timeout
  
  try {
    const result = await longRunningService.process(payload);
    return { success: true, data: result };
  } catch (error) {
    if (error.name === 'TimeoutError') {
      controller.abort('Operation timed out after 30 seconds');
    } else {
      controller.abort(`Operation failed: ${error.message}`);
    }
  }
});
```

### `controller.setMetadata(metadata)`

Sets metadata for the current execution.

**Parameters:**
- `metadata`: Metadata object

```typescript
useActionHandler('trackedAction', (payload, controller) => {
  controller.setMetadata({
    handlerVersion: '1.2.0',
    environment: process.env.NODE_ENV,
    component: 'UserManager',
    feature: 'profile-update'
  });
  
  // Business logic
  return { success: true };
}, { id: 'tracked-handler' });
```

## Pipeline Debugging

### `controller.enableDebug()`

Enables debug logging for the current pipeline.

```typescript
useActionHandler('debuggableAction', (payload, controller) => {
  if (process.env.NODE_ENV === 'development') {
    controller.enableDebug();
  }
  
  controller.setResult({ step: 'debug-setup', enabled: true });
  return { debugEnabled: true };
}, { priority: 100 });
```

### `controller.log(message, data?)`

Logs debug information during pipeline execution.

**Parameters:**
- `message`: Log message
- `data?`: Optional data to log

```typescript
useActionHandler('verboseHandler', async (payload, controller) => {
  controller.log('Starting user validation');
  
  const user = await userService.getUser(payload.userId);
  controller.log('User retrieved', { userId: user.id, name: user.name });
  
  const isValid = validateUser(user);
  controller.log('Validation completed', { isValid });
  
  if (!isValid) {
    controller.log('Validation failed - aborting');
    controller.abort('User validation failed');
  }
  
  return { user, validated: true };
});
```

## Pipeline Metrics

### `controller.recordMetric(name, value)`

Records a custom metric for the current execution.

**Parameters:**
- `name`: Metric name
- `value`: Metric value

```typescript
useActionHandler('performanceTrackedAction', async (payload, controller) => {
  const startTime = performance.now();
  
  try {
    const result = await expensiveOperation(payload);
    
    const duration = performance.now() - startTime;
    controller.recordMetric('execution_time', duration);
    controller.recordMetric('payload_size', JSON.stringify(payload).length);
    controller.recordMetric('result_size', JSON.stringify(result).length);
    
    return result;
    
  } catch (error) {
    const duration = performance.now() - startTime;
    controller.recordMetric('error_time', duration);
    controller.recordMetric('error_type', error.constructor.name);
    
    controller.abort(`Operation failed after ${duration}ms: ${error.message}`);
  }
});
```

## Best Practices

### 1. Error Handling
- Use `abort()` for critical failures that should stop execution
- Use result sharing for non-critical errors
- Implement proper error recovery strategies

### 2. Payload Management
- Modify payloads early in the pipeline (high priority)
- Validate payload modifications for type safety
- Document payload structure changes

### 3. Result Coordination
- Use meaningful result structures for inter-handler communication
- Include step identifiers and success flags
- Share results that other handlers might need

### 4. Performance
- Set appropriate timeouts for long-running handlers
- Record metrics for performance monitoring
- Use pipeline state for expensive computations

### 5. Debugging
- Enable debug mode in development
- Use descriptive log messages
- Include relevant context in logs

## Related

- **[Action Only Methods](./action-only)** - Action dispatching and handler registration
- **[Action Registry API](./action-registry)** - Registry management methods
- **[Action Only Example](../examples/action-only)** - Complete usage examples