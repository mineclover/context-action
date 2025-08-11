# Error Handling Patterns

Robust error handling is crucial for reliable Context-Action applications. Learn effective patterns for handling errors in handlers, stores, and components.

## Error Handling Philosophy

Context-Action error handling follows these principles:

1. **Fail Fast**: Detect and report errors immediately
2. **Contextual Information**: Provide meaningful error details
3. **Graceful Degradation**: Maintain application stability
4. **Recovery Options**: Allow users to recover from errors
5. **Monitoring Integration**: Enable error tracking and analysis

## Handler Error Handling

### 1. Controller-Based Error Management

```typescript
// Use controller.abort() for graceful error handling
function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  const updateProfileHandler = useCallback(async (payload, controller) => {
    try {
      const profileStore = stores.getStore('profile');
      const currentProfile = profileStore.getValue();
      
      // Validation errors
      if (payload.validate && !isValidEmail(payload.data.email)) {
        controller.abort('Invalid email format', {
          field: 'email',
          value: payload.data.email,
          code: 'VALIDATION_ERROR'
        });
        return { success: false, error: 'INVALID_EMAIL' };
      }
      
      // Business logic
      const updatedProfile = {
        ...currentProfile,
        ...payload.data,
        updatedAt: Date.now()
      };
      
      // API call with error handling
      const response = await updateUserProfileAPI(updatedProfile);
      
      if (!response.success) {
        controller.abort('API update failed', {
          apiError: response.error,
          statusCode: response.status,
          retryable: response.retryable
        });
        return { success: false, error: 'API_ERROR', retryable: response.retryable };
      }
      
      // Update store on success
      profileStore.setValue(updatedProfile);
      
      return { success: true, profile: updatedProfile };
      
    } catch (error) {
      // Unexpected errors
      controller.abort(`Profile update failed: ${error.message}`, {
        operation: 'updateProfile',
        payload,
        timestamp: Date.now(),
        error: error.stack,
        recoverable: false
      });
      
      return { success: false, error: 'UNEXPECTED_ERROR' };
    }
  }, [stores]);
  
  useEffect(() => {
    if (!addHandler) return;
    return addHandler('updateProfile', updateProfileHandler, {
      priority: 100,
      blocking: true,
      id: 'profile-updater'
    });
  }, [register, updateProfileHandler]);
}
```

### 2. Layered Error Handling

```typescript
// Create error handling layers for different concerns
function useLayeredErrorHandling() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  useEffect(() => {
    if (!addHandler) return;
    
    const unregisterFunctions = [];
    
    // Layer 1: Input validation (highest priority)
    unregisterFunctions.push(
      register('updateProfile', validationHandler, {
        priority: 100,
        blocking: true,
        id: 'validation-layer'
      })
    );
    
    // Layer 2: Business logic
    unregisterFunctions.push(
      register('updateProfile', businessHandler, {
        priority: 90,
        blocking: true,
        id: 'business-layer'
      })
    );
    
    // Layer 3: Persistence
    unregisterFunctions.push(
      register('updateProfile', persistenceHandler, {
        priority: 80,
        blocking: true,
        id: 'persistence-layer'
      })
    );
    
    // Layer 4: Error logging (lowest priority, non-blocking)
    unregisterFunctions.push(
      register('updateProfile', errorLoggingHandler, {
        priority: 70,
        blocking: false,
        id: 'error-logging'
      })
    );
    
    return () => unregisterFunctions.forEach(fn => fn());
  }, [register, registry]);
}

// Validation layer handler
const validationHandler = useCallback(async (payload, controller) => {
  const errors = validateUpdateProfilePayload(payload);
  
  if (errors.length > 0) {
    controller.abort('Validation failed', {
      code: 'VALIDATION_ERROR',
      errors,
      field: errors[0].field
    });
    return { success: false, errors };
  }
}, []);

// Business logic layer handler
const businessHandler = useCallback(async (payload, controller) => {
  try {
    // Business rules validation
    const businessValidation = await validateBusinessRules(payload);
    
    if (!businessValidation.valid) {
      controller.abort('Business rule violation', {
        code: 'BUSINESS_ERROR',
        rule: businessValidation.violatedRule,
        message: businessValidation.message
      });
      return { success: false, error: 'BUSINESS_RULE_VIOLATION' };
    }
    
    // Continue processing...
  } catch (error) {
    controller.abort('Business logic error', {
      code: 'BUSINESS_ERROR',
      error: error.message
    });
    return { success: false, error: 'BUSINESS_ERROR' };
  }
}, []);
```

### 3. Error Recovery Patterns

```typescript
// Implement retry and fallback mechanisms
function useRetryableHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  const createRetryableHandler = useCallback((
    handlerFn: Function,
    maxRetries = 3,
    backoffMs = 1000
  ) => {
    return async (payload, controller) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await handlerFn(payload, controller);
          
          // Success - return result
          if (result.success) {
            return result;
          }
          
          // Check if error is retryable
          if (!result.retryable || attempt === maxRetries) {
            controller.abort(`Operation failed after ${attempt} attempts`, {
              finalError: result.error,
              attempts: attempt
            });
            return result;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
          
        } catch (error) {
          lastError = error;
          
          if (attempt === maxRetries) {
            controller.abort(`Handler failed after ${maxRetries} attempts`, {
              finalError: error.message,
              attempts: maxRetries
            });
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
        }
      }
    };
  }, []);
  
  const apiHandler = useCallback(async (payload, controller) => {
    try {
      const response = await apiCall(payload);
      return { success: true, data: response, retryable: false };
    } catch (error) {
      // Determine if error is retryable
      const isRetryable = error.status >= 500 || error.code === 'NETWORK_ERROR';
      
      return { 
        success: false, 
        error: error.message, 
        retryable: isRetryable 
      };
    }
  }, []);
  
  useEffect(() => {
    if (!addHandler) return;
    
    const retryableApiHandler = createRetryableHandler(apiHandler, 3, 1000);
    
    return addHandler('updateProfile', retryableApiHandler, {
      priority: 80,
      blocking: true,
      id: 'retryable-api-handler'
    });
  }, [register, createRetryableHandler, apiHandler]);
}
```

## Store Error Handling

### 1. Store Operation Error Handling

```typescript
// Handle store operation errors
export function useStoreWithErrorHandling<T>(
  store: Store<T>,
  onError?: (error: Error) => void
) {
  const safeSetValue = useCallback((newValue: T) => {
    try {
      store.setValue(newValue);
    } catch (error) {
      console.error('Store setValue failed:', error);
      onError?.(error);
      
      // Optionally, revert to previous value or handle recovery
      throw new Error(`Failed to update store: ${error.message}`);
    }
  }, [store, onError]);
  
  const safeGetValue = useCallback(() => {
    try {
      return store.getValue();
    } catch (error) {
      console.error('Store getValue failed:', error);
      onError?.(error);
      
      // Return safe default
      return null;
    }
  }, [store, onError]);
  
  return {
    setValue: safeSetValue,
    getValue: safeGetValue,
    subscribe: store.subscribe
  };
}
```

### 2. Store Validation

```typescript
// Validate store updates before applying
export function createValidatedStore<T>(
  initialValue: T,
  validator: (value: T) => { valid: boolean; errors: string[] }
) {
  const baseStore = createStore(initialValue);
  
  const validatedSetValue = (newValue: T) => {
    const validation = validator(newValue);
    
    if (!validation.valid) {
      throw new Error(`Store validation failed: ${validation.errors.join(', ')}`);
    }
    
    return baseStore.setValue(newValue);
  };
  
  return {
    ...baseStore,
    setValue: validatedSetValue
  };
}

// Usage
const profileStore = createValidatedStore(
  { name: '', email: '' },
  (profile) => {
    const errors = [];
    
    if (!profile.name.trim()) errors.push('Name is required');
    if (!profile.email.includes('@')) errors.push('Invalid email format');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
);
```

## Component Error Handling

### 1. Error Boundaries for Action Handling

```typescript
// Error boundary for action dispatching
class ActionErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, errorInfo: any) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Action error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
    
    // Report to error tracking service
    reportError('ACTION_ERROR', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ActionErrorBoundary'
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ActionErrorBoundary onError={(error) => reportError('APP_ERROR', error)}>
      <UserProvider>
        <UserActionProvider>
          <UserProfile />
        </UserActionProvider>
      </UserProvider>
    </ActionErrorBoundary>
  );
}
```

### 2. Hook-Level Error Handling

```typescript
// Custom hook with built-in error handling
export function useUserProfileWithErrorHandling() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  const dispatch = useUserAction();
  
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    
    try {
      await dispatch('updateProfile', { data });
    } catch (actionError) {
      console.error('Profile update failed:', actionError);
      setError(actionError.message || 'Update failed');
      
      // Report error
      reportError('PROFILE_UPDATE_ERROR', actionError, {
        profileData: data,
        currentProfile: profile
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch, profile]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    profile,
    updateProfile,
    loading,
    error,
    clearError
  };
}
```

### 3. Component Error Recovery

```typescript
// Component with error recovery options
function UserProfileWithRecovery() {
  const {
    profile,
    updateProfile,
    loading,
    error,
    clearError
  } = useUserProfileWithErrorHandling();
  
  const [retryCount, setRetryCount] = useState(0);
  
  const handleRetry = useCallback(() => {
    clearError();
    setRetryCount(prev => prev + 1);
    
    // Retry with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    setTimeout(() => {
      updateProfile(profile);
    }, delay);
  }, [clearError, retryCount, updateProfile, profile]);
  
  const handleReset = useCallback(() => {
    clearError();
    setRetryCount(0);
    
    // Reset to last known good state
    window.location.reload();
  }, [clearError]);
  
  if (error) {
    return (
      <div className="error-state">
        <h3>Profile Update Failed</h3>
        <p>{error}</p>
        
        <div className="error-actions">
          {retryCount < 3 && (
            <button onClick={handleRetry} disabled={loading}>
              Retry ({retryCount + 1}/3)
            </button>
          )}
          
          <button onClick={handleReset}>
            Reset
          </button>
          
          <button onClick={clearError}>
            Dismiss
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Normal profile UI */}
      <UserProfileForm
        profile={profile}
        onUpdate={updateProfile}
        loading={loading}
      />
    </div>
  );
}
```

## Error Monitoring and Logging

### 1. Centralized Error Reporting

```typescript
// Centralized error reporting service
class ErrorReporter {
  private static instance: ErrorReporter;
  
  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }
  
  reportError(
    category: string,
    error: Error,
    context?: Record<string, any>
  ) {
    const errorReport = {
      category,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', errorReport);
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorReport);
    }
  }
  
  private sendToMonitoringService(errorReport: any) {
    // Send to services like Sentry, LogRocket, etc.
    // Example with fetch:
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    }).catch(sendError => {
      console.error('Failed to send error report:', sendError);
    });
  }
}

// Global error reporting utility
export const reportError = (
  category: string,
  error: Error,
  context?: Record<string, any>
) => {
  ErrorReporter.getInstance().reportError(category, error, context);
};
```

### 2. Handler Error Monitoring

```typescript
// Monitor handler execution and errors
export function createMonitoredHandler<T extends any[], R>(
  handlerId: string,
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();
    
    try {
      const result = await handler(...args);
      
      const duration = performance.now() - startTime;
      
      // Report success metrics
      reportMetric('HANDLER_SUCCESS', {
        handlerId,
        duration,
        args: args.length
      });
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Report error with context
      reportError('HANDLER_ERROR', error, {
        handlerId,
        duration,
        args,
        timestamp: Date.now()
      });
      
      throw error;
    }
  };
}

// Usage
const monitoredUpdateHandler = createMonitoredHandler(
  'updateProfile',
  async (payload, controller) => {
    // Handler logic
  }
);
```

## Error Handling Best Practices

### ✅ Do

- **Use controller.abort() for graceful error handling**
- **Provide contextual error information**
- **Implement retry mechanisms for transient errors**
- **Use error boundaries to catch unexpected errors**
- **Log errors with sufficient context for debugging**
- **Provide user-friendly error messages**
- **Implement error recovery options**

### ❌ Don't

- **Silently swallow errors without handling**
- **Show technical error messages to users**
- **Retry operations indefinitely**
- **Log sensitive information in error reports**
- **Ignore error cleanup and resource disposal**
- **Use generic error handling for all error types**

---

## Summary

Effective error handling in Context-Action applications includes:

- **Controller-Based Handling**: Use `controller.abort()` for graceful error propagation
- **Layered Error Management**: Handle errors at appropriate layers (validation, business, persistence)
- **Recovery Mechanisms**: Implement retry logic and fallback options
- **Error Boundaries**: Catch and handle React component errors
- **Monitoring Integration**: Report errors for analysis and improvement
- **User Experience**: Provide helpful error messages and recovery options

Robust error handling ensures your applications remain stable and user-friendly even when things go wrong.

---

::: tip Next Steps
- Learn [Testing Strategies](./testing) for testing error scenarios
- Explore [Performance Optimization](./performance) for error handling performance
- See [Troubleshooting Guide](./troubleshooting) for common error resolution patterns
:::