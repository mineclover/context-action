# Error Handling System

Comprehensive error handling and debugging system for the Context-Action framework.

## 🚨 Centralized Error System

### ContextActionError Class (v0.4.1+)

**NEW**: Standardized error handling across all modules:

```typescript
import { ContextActionError, ContextActionErrorType } from '@context-action/react';

// Standardized error creation
throw new ContextActionError(
  ContextActionErrorType.STORE_ERROR,
  'Failed to update store value',
  { 
    storeId: 'userStore',
    operation: 'setValue',
    payload: userData 
  },
  originalError // Optional: chain original error
);
```

### Error Type Classification

**Built-in Error Types**:

```typescript
enum ContextActionErrorType {
  STORE_ERROR = 'STORE_ERROR',                    // Store operations
  ACTION_ERROR = 'ACTION_ERROR',                  // Action dispatch/handler
  REF_ERROR = 'REF_ERROR',                        // Ref mounting/timeout
  VALIDATION_ERROR = 'VALIDATION_ERROR',          // Input validation
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',  // Setup/config
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',                // Operation timeout
  CIRCULAR_REFERENCE_ERROR = 'CIRCULAR_REFERENCE_ERROR' // Circular refs
}
```

## 🔧 Error Handlers System

### Centralized Error Processing

**NEW**: Unified error handling across all framework modules:

```typescript
import { ErrorHandlers } from '@context-action/react';

// Framework automatically uses centralized error handling
// Instead of: console.error('Store error:', error)
// Now uses: ErrorHandlers.store('Store operation failed', context, error)

// Custom error handling configuration
ErrorHandlers.configure({
  enableConsoleLogging: true,
  enableErrorCollection: true,
  maxErrorHistory: 100,
  errorHandler: (error, type, context) => {
    // Send to monitoring service
    monitoringService.captureException(error, {
      type,
      context,
      timestamp: Date.now()
    });
  }
});
```

### Error Context Enrichment

```typescript
// Rich error context for debugging
const processUserData = async (userData) => {
  try {
    const result = await complexOperation(userData);
    return result;
  } catch (error) {
    // Throw with rich context
    throw new ContextActionError(
      ContextActionErrorType.VALIDATION_ERROR,
      'User data processing failed',
      {
        operation: 'processUserData',
        userData: { 
          id: userData.id,
          type: userData.type 
          // Don't include sensitive data
        },
        timestamp: Date.now(),
        stackDepth: new Error().stack?.split('\n').length
      },
      error
    );
  }
};
```

## 🎯 Action Error Handling

### Enhanced Handler Error Management

```typescript
// Advanced error handling in action handlers
useActionHandler('riskyOperation', async (payload, controller) => {
  try {
    // Validation phase
    if (!payload.required) {
      controller.abort('Missing required field', { 
        field: 'required',
        provided: Object.keys(payload)
      });
      return;
    }
    
    // Business logic phase
    const result = await riskyAPI(payload);
    
    // Success handling
    controller.setResult({ success: true, data: result });
    
  } catch (error) {
    // Determine error severity and response
    if (error instanceof ValidationError) {
      // Validation errors - abort with context
      controller.abort('Validation failed', {
        errors: error.validationErrors,
        payload: payload
      });
    } else if (error instanceof NetworkError) {
      // Network errors - might be retryable
      console.warn('Network error - operation may be retried:', error);
      throw error; // Let retry mechanism handle
    } else {
      // Unknown errors - abort with full context
      controller.abort('Unexpected error during operation', {
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack
      });
    }
  }
});
```

### Global Error Handler Configuration

```typescript
// Configure global error handling
const registry = new ActionRegister<AppActions>({
  name: 'MyApp',
  registry: {
    errorHandler: (error, context) => {
      // Categorize and handle different error types
      const errorInfo = {
        action: context.action,
        handlerId: context.handlerId,
        payload: context.payload,
        timestamp: Date.now()
      };
      
      if (error instanceof ContextActionError) {
        // Framework errors - structured handling
        switch (error.type) {
          case ContextActionErrorType.TIMEOUT_ERROR:
            console.warn('Action timeout:', errorInfo);
            // Maybe retry with longer timeout
            break;
            
          case ContextActionErrorType.VALIDATION_ERROR:
            console.error('Validation failure:', errorInfo);
            // Show user-friendly validation errors
            break;
            
          default:
            console.error('Framework error:', errorInfo);
            // General framework error handling
        }
      } else {
        // Application errors
        console.error('Application error:', errorInfo);
        
        // Send to error tracking service
        errorTracker.captureException(error, {
          tags: {
            component: 'ActionRegister',
            action: context.action
          },
          extra: errorInfo
        });
      }
    }
  }
});
```

## 🔍 Error Debugging Tools

### Error Statistics and Analysis

```typescript
// Comprehensive error tracking
class ActionErrorTracker {
  private errors: Map<string, ContextActionError[]> = new Map();
  private errorCounts: Map<ContextActionErrorType, number> = new Map();
  
  trackError(error: ContextActionError, action: string) {
    // Track by action
    if (!this.errors.has(action)) {
      this.errors.set(action, []);
    }
    this.errors.get(action)!.push(error);
    
    // Track by type
    const currentCount = this.errorCounts.get(error.type) || 0;
    this.errorCounts.set(error.type, currentCount + 1);
  }
  
  getErrorSummary() {
    return {
      totalErrors: Array.from(this.errors.values()).flat().length,
      errorsByType: Object.fromEntries(this.errorCounts),
      errorsByAction: Object.fromEntries(
        Array.from(this.errors.entries()).map(([action, errors]) => [
          action, 
          { count: errors.length, recent: errors.slice(-5) }
        ])
      ),
      recentErrors: Array.from(this.errors.values())
        .flat()
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
    };
  }
  
  clearErrors(action?: string) {
    if (action) {
      this.errors.delete(action);
    } else {
      this.errors.clear();
      this.errorCounts.clear();
    }
  }
}

// Global error tracker
const globalErrorTracker = new ActionErrorTracker();

// Integration with registry
const registry = new ActionRegister({
  registry: {
    errorHandler: (error, context) => {
      if (error instanceof ContextActionError) {
        globalErrorTracker.trackError(error, context.action);
      }
    }
  }
});

// Access error statistics
export function getErrorStatistics() {
  return globalErrorTracker.getErrorSummary();
}
```

### Development Error Dashboard

```typescript
// React component for error monitoring
function ErrorDashboard() {
  const [errorStats, setErrorStats] = useState(null);
  
  useEffect(() => {
    const updateStats = () => {
      setErrorStats(getErrorStatistics());
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!errorStats) return null;
  
  return (
    <div className="error-dashboard">
      <h3>Error Statistics</h3>
      <p>Total Errors: {errorStats.totalErrors}</p>
      
      <h4>By Type</h4>
      <ul>
        {Object.entries(errorStats.errorsByType).map(([type, count]) => (
          <li key={type}>{type}: {count}</li>
        ))}
      </ul>
      
      <h4>By Action</h4>
      <ul>
        {Object.entries(errorStats.errorsByAction).map(([action, info]) => (
          <li key={action}>
            {action}: {info.count} errors
            <details>
              <summary>Recent Errors</summary>
              <ul>
                {info.recent.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
      
      <button onClick={() => globalErrorTracker.clearErrors()}>
        Clear Error History
      </button>
    </div>
  );
}
```

## 🛡️ Error Recovery Patterns

### Graceful Degradation

```typescript
// Graceful error recovery in action handlers
useActionHandler('criticalOperation', async (payload, controller) => {
  try {
    // Primary operation
    const result = await primaryService.process(payload);
    controller.setResult(result);
    
  } catch (error) {
    console.warn('Primary service failed, trying fallback:', error);
    
    try {
      // Fallback operation
      const fallbackResult = await fallbackService.process(payload);
      controller.setResult({ 
        ...fallbackResult, 
        source: 'fallback',
        originalError: error.message 
      });
      
    } catch (fallbackError) {
      // Both failed - graceful degradation
      controller.abort('All services failed', {
        primaryError: error.message,
        fallbackError: fallbackError.message,
        degradedMode: true
      });
      
      // Set minimal safe state
      controller.setResult({ 
        success: false, 
        degraded: true,
        message: 'Operating in degraded mode'
      });
    }
  }
});
```

### Error Boundary Integration

```typescript
// Specialized error boundaries for different error types
class StoreErrorBoundary extends React.Component {
  state = { hasError: false, errorType: null };
  
  static getDerivedStateFromError(error) {
    if (error instanceof ContextActionError) {
      return {
        hasError: true,
        errorType: error.type,
        errorContext: error.context
      };
    }
    
    return { hasError: true, errorType: 'UNKNOWN' };
  }
  
  componentDidCatch(error, errorInfo) {
    // Report to error tracking
    errorService.captureException(error, {
      component: 'StoreErrorBoundary',
      errorInfo,
      contextActionError: error instanceof ContextActionError
    });
  }
  
  render() {
    if (this.state.hasError) {
      switch (this.state.errorType) {
        case ContextActionErrorType.STORE_ERROR:
          return <div>Store operation failed. Please refresh the page.</div>;
          
        case ContextActionErrorType.ACTION_ERROR:
          return <div>Action failed. Please try again.</div>;
          
        case ContextActionErrorType.TIMEOUT_ERROR:
          return <div>Operation timed out. Please try again.</div>;
          
        default:
          return <div>An unexpected error occurred.</div>;
      }
    }
    
    return this.props.children;
  }
}
```

## 📊 Error Monitoring Integration

### Production Error Monitoring

```typescript
// Production error monitoring setup
const setupProductionErrorMonitoring = () => {
  // Configure framework error handling
  ErrorHandlers.configure({
    enableConsoleLogging: false,  // Disable console in production
    enableErrorCollection: true,
    maxErrorHistory: 50,
    errorHandler: (error, type, context) => {
      // Send to monitoring service
      const errorData = {
        type,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // Different handling for different error types
      switch (type) {
        case ContextActionErrorType.STORE_ERROR:
          monitoringService.captureStoreError(errorData);
          break;
          
        case ContextActionErrorType.ACTION_ERROR:
          monitoringService.captureActionError(errorData);
          break;
          
        case ContextActionErrorType.TIMEOUT_ERROR:
          monitoringService.captureTimeoutError(errorData);
          break;
          
        default:
          monitoringService.captureGenericError(errorData);
      }
    }
  });
  
  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof ContextActionError) {
      console.error('Unhandled Context-Action error:', event.reason);
      
      // Prevent default browser behavior for framework errors
      event.preventDefault();
    }
  });
};
```

### Real-time Error Alerts

```typescript
// Real-time error monitoring for development
function useErrorMonitoring() {
  const [recentErrors, setRecentErrors] = useState<ContextActionError[]>([]);
  
  useEffect(() => {
    const originalErrorHandler = ErrorHandlers.getErrorHandler();
    
    // Wrap original error handler
    ErrorHandlers.configure({
      errorHandler: (error, type, context) => {
        // Call original handler
        originalErrorHandler?.(error, type, context);
        
        // Update component state
        if (error instanceof ContextActionError) {
          setRecentErrors(prev => [error, ...prev.slice(0, 9)]); // Keep last 10
        }
      }
    });
    
    return () => {
      // Restore original handler
      ErrorHandlers.configure({ errorHandler: originalErrorHandler });
    };
  }, []);
  
  return recentErrors;
}

// Error monitoring component
function ErrorMonitor() {
  const recentErrors = useErrorMonitoring();
  
  return (
    <div className="error-monitor">
      <h4>Recent Errors ({recentErrors.length})</h4>
      {recentErrors.map((error, index) => (
        <div key={index} className="error-item">
          <span className="error-type">{error.type}</span>
          <span className="error-message">{error.message}</span>
          <span className="error-time">
            {new Date(error.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## 🔄 Error Recovery Strategies

### Automatic Error Recovery

```typescript
// Self-healing action handlers
useActionHandler('resilientOperation', async (payload, controller) => {
  let attempts = 0;
  const maxAttempts = 3;
  const baseDelay = 1000;
  
  while (attempts < maxAttempts) {
    try {
      const result = await unreliableService.process(payload);
      
      // Success - return result
      controller.setResult({
        success: true,
        data: result,
        attempts: attempts + 1
      });
      return;
      
    } catch (error) {
      attempts++;
      
      if (attempts < maxAttempts) {
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempts - 1);
        console.warn(`Attempt ${attempts} failed, retrying in ${delay}ms:`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Final failure - structured error
        controller.abort('All retry attempts failed', {
          totalAttempts: attempts,
          lastError: error.message,
          payload: payload
        });
      }
    }
  }
});
```

### Store Error Recovery

```typescript
// Store operation with error recovery
const safeStoreUpdate = async (store, newValue, fallbackValue = null) => {
  try {
    // Primary update attempt
    store.setValue(newValue);
    
  } catch (error) {
    console.error('Store update failed:', error);
    
    if (error instanceof ContextActionError) {
      switch (error.type) {
        case ContextActionErrorType.CIRCULAR_REFERENCE_ERROR:
          // Try with simplified value
          console.warn('Circular reference detected, using fallback');
          store.setValue(fallbackValue || store.getInitialValue());
          break;
          
        case ContextActionErrorType.VALIDATION_ERROR:
          // Validation failed - use safe default
          console.warn('Validation failed, reverting to safe state');
          store.setValue(store.getInitialValue());
          break;
          
        default:
          // Unknown store error - reset to initial
          console.error('Unknown store error, resetting');
          store.setValue(store.getInitialValue());
      }
    } else {
      // Non-framework error - reset store
      store.setValue(store.getInitialValue());
    }
  }
};
```

## 📋 Error Prevention Strategies

### Input Validation Patterns

```typescript
// Comprehensive input validation
const createValidatingActionHandler = <T>(
  validator: (payload: T) => ValidationResult,
  handler: ActionHandler<T>
) => {
  return async (payload: T, controller) => {
    // Validation phase
    const validation = validator(payload);
    
    if (!validation.isValid) {
      throw new ContextActionError(
        ContextActionErrorType.VALIDATION_ERROR,
        'Payload validation failed',
        {
          errors: validation.errors,
          payload: payload
        }
      );
    }
    
    // Execute handler with validated payload
    return handler(validation.sanitizedPayload || payload, controller);
  };
};

// Usage
interface UserUpdatePayload {
  name?: string;
  email?: string;
}

const validateUserUpdate = (payload: UserUpdatePayload) => {
  const errors: string[] = [];
  
  if (payload.email && !payload.email.includes('@')) {
    errors.push('Invalid email format');
  }
  
  if (payload.name && payload.name.length < 2) {
    errors.push('Name too short');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedPayload: payload
  };
};

// Register validated handler
const validatedHandler = createValidatingActionHandler(
  validateUserUpdate,
  async (payload, controller) => {
    // Handler runs with validated payload
    const user = await updateUserAPI(payload);
    controller.setResult(user);
  }
);

useActionHandler('updateUser', validatedHandler);
```

### Defensive Programming Patterns

```typescript
// Defensive error handling in stores
const createDefensiveStore = <T>(initialValue: T, storeName: string) => {
  const store = createStore({ initialValue });
  
  // Wrap setValue with error protection
  const originalSetValue = store.setValue;
  store.setValue = (newValue: T) => {
    try {
      originalSetValue(newValue);
    } catch (error) {
      console.error(`Store ${storeName} setValue failed:`, error);
      
      // Try to recover with safe value
      try {
        originalSetValue(initialValue); // Reset to initial
      } catch (recoveryError) {
        console.error(`Store ${storeName} recovery failed:`, recoveryError);
        // Store is in unknown state - might need app restart
      }
    }
  };
  
  return store;
};
```

## 🧪 Error Testing Strategies

### Error Scenario Testing

```typescript
// Test error handling thoroughly
describe('Error Handling', () => {
  test('should handle validation errors gracefully', async () => {
    const registry = new ActionRegister<TestActions>();
    const errors: ContextActionError[] = [];
    
    // Capture errors
    registry.configure({
      errorHandler: (error) => {
        if (error instanceof ContextActionError) {
          errors.push(error);
        }
      }
    });
    
    // Register handler that validates
    registry.register('validateAction', (payload, controller) => {
      if (!payload.required) {
        throw new ContextActionError(
          ContextActionErrorType.VALIDATION_ERROR,
          'Missing required field'
        );
      }
    });
    
    // Test invalid payload
    await registry.dispatch('validateAction', { invalid: true });
    
    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe(ContextActionErrorType.VALIDATION_ERROR);
  });
  
  test('should recover from store errors', async () => {
    const store = createStore({ initialValue: { count: 0 } });
    
    // Force error by setting invalid value
    try {
      store.setValue(null as any); // Type error
      fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(ContextActionError);
      expect(error.type).toBe(ContextActionErrorType.STORE_ERROR);
    }
    
    // Store should still be functional
    expect(store.getValue()).toEqual({ count: 0 });
  });
});
```

## 📚 Error Documentation Patterns

### Error Code Documentation

```typescript
// Document error codes for team reference
const ERROR_CODES = {
  // Store Errors (ST_xxx)
  ST_001: {
    type: ContextActionErrorType.STORE_ERROR,
    description: 'Event object detected in store setValue',
    solution: 'Extract event data before storing',
    example: 'store.setValue({ x: event.clientX, y: event.clientY })'
  },
  
  ST_002: {
    type: ContextActionErrorType.STORE_ERROR,
    description: 'Circular reference detected in store value',
    solution: 'Use JSON.parse(JSON.stringify()) or remove circular refs',
    example: 'const safe = JSON.parse(JSON.stringify(objectWithCircular))'
  },
  
  // Action Errors (AC_xxx)
  AC_001: {
    type: ContextActionErrorType.ACTION_ERROR,
    description: 'Action handler execution timeout',
    solution: 'Increase timeout or optimize handler performance',
    example: 'dispatch("action", payload, { timeout: 10000 })'
  },
  
  // Ref Errors (RF_xxx)  
  RF_001: {
    type: ContextActionErrorType.REF_ERROR,
    description: 'Ref mount timeout exceeded',
    solution: 'Check if ref element is rendered or increase timeout',
    example: 'useRefHandler("myRef", { timeout: 10000 })'
  }
} as const;

// Error code lookup utility
export function getErrorCodeInfo(error: ContextActionError) {
  const errorCode = Object.entries(ERROR_CODES).find(([_, info]) =>
    info.type === error.type && 
    info.description.toLowerCase().includes(error.message.toLowerCase().slice(0, 20))
  );
  
  return errorCode ? { code: errorCode[0], info: errorCode[1] } : null;
}
```

The enhanced error handling system provides comprehensive error management, debugging tools, and recovery strategies for building robust Context-Action applications.