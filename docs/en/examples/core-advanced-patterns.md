# Core Advanced Patterns

This document showcases advanced ActionRegister patterns demonstrated in the Core Advanced example page.

## Overview

The Core Advanced page demonstrates sophisticated ActionRegister capabilities including:

- **Priority-based Pipeline Control**: Higher numbers execute first
- **Action Interception Patterns**: Security and validation interceptors
- **Pipeline Flow Control**: Conditional execution, chaining, and abort mechanisms
- **Error Handling**: Graceful failure and recovery patterns

## Priority System

ActionRegister sorts handlers by priority using `b.config.priority - a.config.priority`, meaning **higher numbers execute first**.

```typescript
// Execution order: priority 10 → priority 5 → priority 1
actionRegister.register('action', handler1, { priority: 10 }); // Executes 1st
actionRegister.register('action', handler2, { priority: 5 });  // Executes 2nd
actionRegister.register('action', handler3, { priority: 1 });  // Executes 3rd
```

## Interceptor Pattern Implementation

### Security Interceptor

A real-world example of action interception for security purposes:

```typescript
interface SecurityActions {
  interceptorTest: { data: string };
}

function SecurityInterceptorDemo() {
  const [enableInterceptor, setEnableInterceptor] = useState(true);
  const [interceptedActions, setInterceptedActions] = useState<string[]>([]);
  const interceptorEnabledRef = useRef(enableInterceptor);
  
  // Keep ref synchronized with state
  useEffect(() => {
    interceptorEnabledRef.current = enableInterceptor;
  }, [enableInterceptor]);

  useEffect(() => {
    // High priority interceptor (executes first)
    const unsubscribeInterceptor = actionRegister.register(
      'interceptorTest',
      ({ data }, controller) => {
        const isInterceptorEnabled = interceptorEnabledRef.current;
        
        if (isInterceptorEnabled) {
          // Security check failed - block the action
          setInterceptedActions(prev => [...prev, 
            `🛡️ INTERCEPTED: ${data} at ${new Date().toLocaleTimeString()}`
          ]);
          
          // Abort the entire pipeline
          controller.abort('Action intercepted and blocked by security interceptor');
          return; // Critical: prevent execution of business logic
        }
        
        // Security check passed - continue to business logic
        console.log('✅ Interceptor disabled - action proceeding');
        controller.next();
      },
      { priority: 10 } // High priority ensures first execution
    );

    // Low priority business logic (only runs if interceptor allows)
    const unsubscribeBusinessLogic = actionRegister.register(
      'interceptorTest',
      ({ data }, controller) => {
        console.log('🎯 Business logic executing:', data);
        
        // Perform actual business operation
        setCount(prev => prev + 5);
        
        controller.next();
      },
      { priority: 1 } // Low priority ensures execution after interceptor
    );

    return () => {
      unsubscribeInterceptor();
      unsubscribeBusinessLogic();
    };
  }, []);
}
```

### Key Implementation Details

1. **useRef for State Tracking**: Required to avoid stale closure issues
2. **Priority Ordering**: Interceptor (10) → Business Logic (1)  
3. **Pipeline Control**: `controller.abort()` stops all subsequent handlers
4. **State Management**: Intercepted actions are tracked separately

## Pipeline Flow Control Patterns

### Validation and Processing Chain

```typescript
interface ProcessingActions {
  processData: { data: any; skipValidation?: boolean };
}

function ValidationChainDemo() {
  useEffect(() => {
    // Step 1: Input validation (highest priority)
    actionRegister.register('processData', ({ data, skipValidation }, controller) => {
      if (!skipValidation && !isValidData(data)) {
        console.log('❌ Validation failed');
        controller.abort('Data validation failed');
        return;
      }
      
      console.log('✅ Validation passed');
      controller.next();
    }, { priority: 10 });

    // Step 2: Data transformation (medium priority) 
    actionRegister.register('processData', ({ data }, controller) => {
      console.log('🔄 Transforming data...');
      
      // Modify payload for subsequent handlers
      controller.modifyPayload((payload) => ({
        ...payload,
        data: transformData(payload.data),
        processedAt: new Date().toISOString()
      }));
      
      controller.next();
    }, { priority: 5 });

    // Step 3: Persistence (lowest priority)
    actionRegister.register('processData', ({ data }, controller) => {
      console.log('💾 Saving processed data');
      
      // Save to database/store
      saveProcessedData(data);
      
      controller.next();
    }, { priority: 1 });

  }, []);
}
```

### Chained Actions

```typescript
interface ChainActions {
  chainedAction: { step: number; data: string };
}

function ChainedActionDemo() {
  useEffect(() => {
    actionRegister.register('chainedAction', ({ step, data }, controller) => {
      console.log(`📋 Step ${step}: ${data}`);
      
      // Update UI state
      setChainStep(step);
      
      // Auto-trigger next step with delay
      if (step < 3) {
        setTimeout(() => {
          actionRegister.dispatch('chainedAction', { 
            step: step + 1, 
            data: `Chain step ${step + 1}` 
          });
        }, 1000);
      } else {
        console.log('🎉 Chain completed - all steps finished');
      }
      
      controller.next();
    });
  }, []);
}
```

## Error Handling Patterns

### Graceful Error Recovery

```typescript
interface ErrorActions {
  riskyOperation: { data: any };
  divide: number;
}

function ErrorHandlingDemo() {
  useEffect(() => {
    // Risky operation with comprehensive error handling
    actionRegister.register('riskyOperation', async ({ data }, controller) => {
      try {
        const result = await performRiskyOperation(data);
        console.log('✅ Operation succeeded:', result);
        controller.next();
      } catch (error) {
        console.error('❌ Operation failed:', error);
        
        // Log error for monitoring
        errorLogger.capture(error, { context: 'riskyOperation', data });
        
        // Abort pipeline with detailed reason
        controller.abort(`Operation failed: ${error.message}`);
      }
    });

    // Division with zero-check
    actionRegister.register('divide', (divisor, controller) => {
      if (divisor === 0) {
        console.error('❌ Cannot divide by zero');
        controller.abort('Division by zero is not allowed');
        return;
      }
      
      const result = Math.floor(currentValue / divisor);
      setCount(result);
      console.log(`✅ Division result: ${result}`);
      
      controller.next();
    });

  }, []);
}
```

## Conditional Execution Patterns

### Environment-Based Handlers

```typescript
interface ConditionalActions {
  debugAction: { message: string };
  analyticsAction: { event: string; data: any };
}

function ConditionalExecutionDemo() {
  useEffect(() => {
    // Development-only debugging
    actionRegister.register('debugAction', 
      ({ message }, controller) => {
        console.log('🔍 Debug:', message);
        debugLogger.log(message);
        controller.next();
      }, 
      { 
        priority: 10,
        condition: () => process.env.NODE_ENV === 'development'
      }
    );

    // Production analytics
    actionRegister.register('analyticsAction', 
      ({ event, data }, controller) => {
        analytics.track(event, data);
        controller.next();
      }, 
      { 
        priority: 5,
        condition: () => process.env.NODE_ENV === 'production'
      }
    );

  }, []);
}
```

## Real-World Use Cases

### 1. API Request Pipeline

```typescript
// Request → Authentication → Rate Limiting → Execution → Logging
actionRegister.register('apiRequest', authHandler, { priority: 100 });
actionRegister.register('apiRequest', rateLimitHandler, { priority: 90 });
actionRegister.register('apiRequest', requestHandler, { priority: 50 });
actionRegister.register('apiRequest', loggingHandler, { priority: 10 });
```

### 2. User Action Auditing

```typescript
// Action → Permission Check → Audit Log → Business Logic → Notification
actionRegister.register('userAction', permissionHandler, { priority: 100 });
actionRegister.register('userAction', auditHandler, { priority: 90 });
actionRegister.register('userAction', businessHandler, { priority: 50 });
actionRegister.register('userAction', notificationHandler, { priority: 10 });
```

### 3. Data Processing Pipeline

```typescript
// Data → Validation → Transformation → Storage → Cache Update
actionRegister.register('processData', validationHandler, { priority: 100 });
actionRegister.register('processData', transformHandler, { priority: 90 });
actionRegister.register('processData', storageHandler, { priority: 50 });
actionRegister.register('processData', cacheHandler, { priority: 10 });
```

## Best Practices

### 1. Priority Design

- **100+ range**: Security, authentication, authorization
- **90-99 range**: Validation, rate limiting, preprocessing  
- **50-89 range**: Core business logic
- **10-49 range**: Logging, caching, notifications
- **1-9 range**: Cleanup, analytics, non-critical operations

### 2. Error Handling

- Always provide meaningful abort reasons
- Log errors with sufficient context for debugging
- Consider fallback mechanisms for non-critical operations
- Use try-catch for async operations

### 3. State Management

- Use `useRef` for state tracking in interceptors
- Keep interceptor state synchronized with React state
- Avoid direct state mutations in handlers
- Prefer immutable updates

### 4. Performance Considerations

- Minimize handler count per action
- Use conditional execution for environment-specific logic
- Consider debouncing for high-frequency actions
- Profile pipeline execution in development

## Testing Strategies

### Unit Testing Interceptors

```typescript
describe('Security Interceptor', () => {
  it('should block unauthorized actions', async () => {
    const actionRegister = new ActionRegister();
    const interceptedActions = [];
    
    // Setup interceptor
    actionRegister.register('sensitiveOperation', 
      ({ userId }, controller) => {
        if (!hasPermission(userId)) {
          interceptedActions.push('BLOCKED');
          controller.abort('Unauthorized');
          return;
        }
        controller.next();
      }, 
      { priority: 10 }
    );
    
    // Test unauthorized access
    await actionRegister.dispatch('sensitiveOperation', { userId: 'unauthorized' });
    
    expect(interceptedActions).toContain('BLOCKED');
  });
});
```

### Integration Testing Pipeline

```typescript
describe('Data Processing Pipeline', () => {
  it('should process data through complete pipeline', async () => {
    const results = [];
    
    // Setup pipeline
    actionRegister.register('process', validationHandler(results), { priority: 10 });
    actionRegister.register('process', transformHandler(results), { priority: 5 });
    actionRegister.register('process', storageHandler(results), { priority: 1 });
    
    // Execute pipeline
    await actionRegister.dispatch('process', { data: 'test' });
    
    expect(results).toEqual(['validated', 'transformed', 'stored']);
  });
});
```

This comprehensive guide demonstrates how ActionRegister's priority-based pipeline system enables sophisticated action orchestration patterns suitable for complex enterprise applications.