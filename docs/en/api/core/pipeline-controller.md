# PipelineController API

The `PipelineController` class provides advanced pipeline control methods for action handlers, enabling sophisticated workflow management, payload modification, and result collection.

## Overview

Each action handler receives a `PipelineController` instance as the second parameter, allowing fine-grained control over the execution pipeline:

```typescript
type ActionHandler<TPayload> = (
  payload: TPayload,
  controller: PipelineController
) => any | Promise<any>;
```

## Pipeline Control Methods

### `abort(reason?)`

Immediately stop pipeline execution with optional abort reason.

**Parameters:**
- `reason?: string` - Optional reason for aborting

**Returns:** `void`

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (!payload.username) {
    controller.abort('Username is required');
    return; // No subsequent handlers will execute
  }
});
```

**Use Cases:**
- Input validation failures
- Security checks that fail
- Early termination conditions
- Error state handling

### `return(value)`

Terminate pipeline execution early with a specific return value.

**Parameters:**
- `value: any` - Return value for the pipeline

**Returns:** `void`

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (isAlreadyAuthenticated(payload.username)) {
    controller.return({ alreadyAuthenticated: true, user: getCurrentUser() });
    return; // Pipeline terminates here with success
  }
});
```

**Difference from `abort()`:**
- `return()` marks pipeline as successful with a result
- `abort()` marks pipeline as failed/aborted

## Payload Management

### `modifyPayload(modifier)`

Transform the payload for subsequent handlers in the pipeline.

**Parameters:**
- `modifier: (current: TPayload) => TPayload` - Payload transformation function

**Returns:** `void`

```typescript
actionRegister.register('processData', (payload, controller) => {
  // Add metadata to payload
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    processed: true,
    version: '2.0'
  }));
  
  return { step: 'enrichment', completed: true };
}, { priority: 100 });

actionRegister.register('processData', (payload) => {
  // payload now includes: timestamp, processed, version
  console.log(payload.timestamp); // Current timestamp
  console.log(payload.processed); // true
}, { priority: 50 });
```

**Best Practices:**
- Use for adding metadata (timestamps, user context, processing flags)
- Enrich payload with computed values
- Normalize or validate data format
- Add context information for downstream handlers

### `getPayload()`

Get the current payload including any modifications made by previous handlers.

**Returns:** `TPayload` - Current payload state

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  // Previous handler may have modified payload
  const currentPayload = controller.getPayload();
  
  if (currentPayload.processed) {
    // Handle already-processed file
  }
  
  return { step: 'upload', fileId: generateId() };
});
```

## Result Management

### `setResult(result)`

Set an intermediate result that can be accessed by subsequent handlers.

**Parameters:**
- `result: any` - Result value to store

**Returns:** `void`

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  // Validate file
  const validation = validateFile(payload.filename, payload.content);
  
  // Store validation result for other handlers
  controller.setResult({ 
    step: 'validation', 
    isValid: validation.isValid,
    fileSize: validation.size 
  });
  
  return validation;
}, { priority: 100, id: 'validator' });
```

### `getResults()`

Get all results from previously executed handlers.

**Returns:** `any[]` - Array of results from previous handlers

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  const previousResults = controller.getResults();
  
  // Find validation result
  const validationResult = previousResults.find(r => r.step === 'validation');
  
  if (validationResult?.isValid) {
    // Proceed with upload
    return { step: 'upload', success: true };
  }
  
  controller.abort('File validation failed');
}, { priority: 50, id: 'uploader' });
```

## Advanced Patterns

### Multi-Step Validation Pipeline

```typescript
interface ValidationActions extends ActionPayloadMap {
  validateUser: { id: string; name: string; email: string };
}

const validationRegister = new ActionRegister<ValidationActions>();

// Step 1: Basic validation
validationRegister.register('validateUser', (payload, controller) => {
  const errors: string[] = [];
  
  if (!payload.name) errors.push('Name is required');
  if (!payload.email) errors.push('Email is required');
  
  if (errors.length > 0) {
    controller.abort(`Validation failed: ${errors.join(', ')}`);
    return;
  }
  
  controller.setResult({ step: 'basic', valid: true });
  return { basicValidation: true };
}, { priority: 100, id: 'basic-validator' });

// Step 2: Email format validation  
validationRegister.register('validateUser', (payload, controller) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(payload.email)) {
    controller.abort('Invalid email format');
    return;
  }
  
  controller.setResult({ step: 'email', valid: true });
  return { emailValidation: true };
}, { priority: 90, id: 'email-validator' });

// Step 3: Database uniqueness check
validationRegister.register('validateUser', async (payload, controller) => {
  const existingUser = await checkUserExists(payload.email);
  
  if (existingUser) {
    controller.abort('Email already exists');
    return;
  }
  
  controller.setResult({ step: 'uniqueness', valid: true });
  return { uniquenessValidation: true };
}, { priority: 80, id: 'uniqueness-validator' });
```

### Result Aggregation Pattern

```typescript
actionRegister.register('processOrder', async (payload, controller) => {
  const results = controller.getResults();
  
  // Aggregate all validation results
  const validationSteps = results.filter(r => r.step);
  const allValid = validationSteps.every(step => step.valid);
  
  if (!allValid) {
    controller.abort('Order validation failed');
    return;
  }
  
  // Combine all processing results
  const processingResults = {
    validations: validationSteps,
    processed: true,
    orderId: generateOrderId(),
    timestamp: Date.now()
  };
  
  controller.setResult(processingResults);
  return processingResults;
}, { priority: 10, id: 'aggregator' });
```

### Conditional Handler Execution

```typescript
actionRegister.register('processPayment', async (payload, controller) => {
  // Only process if previous validation passed
  const results = controller.getResults();
  const validationPassed = results.some(r => r.step === 'validation' && r.valid);
  
  if (!validationPassed) {
    // Skip this handler
    return { step: 'payment', skipped: true };
  }
  
  // Process payment
  const paymentResult = await paymentProcessor.charge({
    amount: payload.amount,
    card: payload.cardToken
  });
  
  return { 
    step: 'payment', 
    success: paymentResult.success,
    transactionId: paymentResult.id 
  };
}, { 
  priority: 70, 
  id: 'payment-processor',
  condition: (payload) => payload.amount > 0 // Additional condition check
});
```

## Error Handling

The PipelineController provides several mechanisms for error handling:

### Graceful Error Handling

```typescript
actionRegister.register('uploadFile', async (payload, controller) => {
  try {
    // Risky operation
    const result = await uploadToCloud(payload.file);
    
    controller.setResult({ step: 'upload', success: true, url: result.url });
    return result;
    
  } catch (error) {
    // Log error but don't abort - let other handlers try
    controller.setResult({ 
      step: 'upload', 
      success: false, 
      error: (error as Error).message 
    });
    
    // Continue pipeline - maybe a fallback handler can succeed
    return { uploadFailed: true, error: (error as Error).message };
  }
}, { priority: 80, id: 'primary-uploader' });

// Fallback handler
actionRegister.register('uploadFile', async (payload, controller) => {
  const results = controller.getResults();
  const uploadFailed = results.some(r => r.uploadFailed);
  
  if (uploadFailed) {
    // Try alternative upload method
    const fallbackResult = await uploadToFallbackService(payload.file);
    return { step: 'fallback-upload', success: true, url: fallbackResult.url };
  }
  
  // Primary upload succeeded, skip fallback
  return { step: 'fallback-upload', skipped: true };
}, { priority: 50, id: 'fallback-uploader' });
```

## Integration with ActionRegister

PipelineController is automatically provided by ActionRegister during handler execution:

```typescript
const register = new ActionRegister<MyActions>();

// Handler automatically receives controller
register.register('myAction', (payload, controller) => {
  // controller is automatically provided
  // Full access to all PipelineController methods
});

// Dispatch triggers handler with controller
await register.dispatch('myAction', { data: 'test' });
```

## Related

- **[ActionRegister API](./action-register)** - Core action pipeline system
- **[Action Context](../react/action-context)** - React integration
- **[Action Pipeline Guide](../../guide/action-pipeline)** - Usage guide and examples