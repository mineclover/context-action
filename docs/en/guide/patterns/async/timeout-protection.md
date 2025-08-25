# Timeout Protection Pattern

Pattern for protecting against infinite waits with timeout mechanisms in RefContext operations.

## Prerequisites

Before implementing timeout protection patterns, ensure you have a proper RefContext setup:

### Import
```typescript
import { createRefContext } from '@context-action/react';
import { createActionContext, ActionPayloadMap } from '@context-action/react';
```

### Required RefContext Setup
```typescript
// Basic element refs for timeout protection
interface UIRefs {
  criticalElement: HTMLElement;
  primaryElement: HTMLElement;
  secondaryElement: HTMLElement;
  modalDialog: HTMLDialogElement;
  loadingSpinner: HTMLElement;
}

const {
  Provider: UIRefProvider,
  useRefHandler: useUIRef,
  useWaitForRefs: useWaitForRefs
} = createRefContext<UIRefs>('UI');
```

### Action Context for Timeout Operations
```typescript
// Actions for timeout-protected operations
interface TimeoutActions extends ActionPayloadMap {
  criticalAction: { message: string; timeout?: number };
  retryableAction: { data: any; maxRetries?: number };
  progressiveAction: { elementKey: string; complexity: 'simple' | 'complex' | 'heavy' };
  adaptiveAction: { operation: string; timeout?: number };
}

const {
  Provider: TimeoutActionProvider,
  useActionDispatch: useTimeoutDispatch,
  useActionHandler: useTimeoutHandler
} = createActionContext<TimeoutActions>('Timeout');
```

### Provider Setup
```typescript
function App() {
  return (
    <UIRefProvider>
      <TimeoutActionProvider>
        <AppContent />
      </TimeoutActionProvider>
    </UIRefProvider>
  );
}
```

## Basic Timeout Pattern

```typescript
const waitWithTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
  try {
    await Promise.race([
      waitForRefs(elementKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
    return true;
  } catch (error) {
    console.warn('Element not available, using fallback');
    return false;
  }
}, [waitForRefs]);
```

## Advanced Timeout with Retry

```typescript
const waitWithRetry = useCallback(async (
  elementKey: string, 
  maxRetries = 3, 
  timeout = 2000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout on attempt ${attempt}`)), timeout)
        )
      ]);
      return true;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All attempts failed, using fallback');
        return false;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return false;
}, [waitForRefs]);
```

## Usage in Action Handlers

```typescript
// Component with timeout-protected action handlers
function TimeoutComponent() {
  const waitForRefs = useWaitForRefs();
  const criticalElementRef = useUIRef('criticalElement');
  
  // Custom timeout wrapper using waitForRefs
  const waitWithTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      return true;
    } catch (error) {
      console.warn('Element not available, using fallback');
      return false;
    }
  }, [waitForRefs]);

  // Action handler with timeout protection
  useTimeoutHandler('criticalAction', useCallback(async (payload) => {
    const success = await waitWithTimeout('criticalElement', payload.timeout || 3000);
    
    if (!success) {
      // Fallback strategy
      console.warn('Using fallback for critical action');
      return { success: false, error: 'Element not available' };
    }
    
    // Proceed with normal operation
    const element = criticalElementRef.target;
    if (element) {
      element.textContent = payload.message;
    }
    
    return { success: true };
  }, [waitWithTimeout, criticalElementRef]));

  return (
    <div>
      <div ref={(el) => el && criticalElementRef.setRef(el)}>
        Critical Element
      </div>
    </div>
  );
}
```

## Error Recovery Pattern

```typescript
// Component with robust error recovery
function ErrorRecoveryComponent() {
  const waitForRefs = useWaitForRefs();
  const primaryElementRef = useUIRef('primaryElement');
  const secondaryElementRef = useUIRef('secondaryElement');

  const waitWithTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      return true;
    } catch (error) {
      console.warn('Element not available, using fallback');
      return false;
    }
  }, [waitForRefs]);

  const performPrimaryOperation = useCallback(() => {
    const element = primaryElementRef.target;
    if (element) {
      element.style.backgroundColor = 'green';
      return { success: true, method: 'primary' };
    }
    return { success: false };
  }, [primaryElementRef]);

  const performSecondaryOperation = useCallback(() => {
    const element = secondaryElementRef.target;
    if (element) {
      element.style.backgroundColor = 'yellow';
      return { success: true, method: 'secondary' };
    }
    return { success: false };
  }, [secondaryElementRef]);

  const performFallbackOperation = useCallback(() => {
    console.log('Using fallback operation');
    return { success: true, method: 'fallback' };
  }, []);

  const robustOperation = useCallback(async () => {
    try {
      // Try primary element
      const primarySuccess = await waitWithTimeout('primaryElement', 2000);
      
      if (primarySuccess) {
        return performPrimaryOperation();
      }
      
      // Fallback to secondary element
      const secondarySuccess = await waitWithTimeout('secondaryElement', 2000);
      
      if (secondarySuccess) {
        return performSecondaryOperation();
      }
      
      // Final fallback
      return performFallbackOperation();
      
    } catch (error) {
      console.error('All operations failed:', error);
      return null;
    }
  }, [waitWithTimeout, performPrimaryOperation, performSecondaryOperation, performFallbackOperation]);

  return (
    <div>
      <div ref={(el) => el && primaryElementRef.setRef(el)}>
        Primary Element
      </div>
      <div ref={(el) => el && secondaryElementRef.setRef(el)}>
        Secondary Element
      </div>
      <button onClick={robustOperation}>
        Execute Robust Operation
      </button>
    </div>
  );
}
```

## Configurable Timeout Strategies

### Progressive Timeout Strategy

```typescript
const progressiveTimeout = useCallback(async (elementKey: string) => {
  const timeouts = [1000, 3000, 5000]; // Progressive timeouts
  
  for (let i = 0; i < timeouts.length; i++) {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout ${i + 1}`)), timeouts[i])
        )
      ]);
      return true; // Success
    } catch (error) {
      console.warn(`Progressive timeout ${i + 1} failed:`, error.message);
      
      if (i === timeouts.length - 1) {
        return false; // Final failure
      }
      
      // Brief pause before next attempt
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  return false;
}, [waitForRefs]);
```

### Adaptive Timeout Strategy

```typescript
const adaptiveTimeout = useCallback(async (elementKey: string, complexity: 'simple' | 'complex' | 'heavy') => {
  const timeoutMap = {
    simple: 2000,
    complex: 5000,
    heavy: 10000
  };
  
  const timeout = timeoutMap[complexity];
  
  try {
    await Promise.race([
      waitForRefs(elementKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Adaptive timeout for ${complexity} operation`)), timeout)
      )
    ]);
    return true;
  } catch (error) {
    console.warn(`Adaptive timeout failed for ${complexity} operation:`, error.message);
    return false;
  }
}, [waitForRefs]);
```

## Production Timeout Patterns

### Circuit Breaker Pattern

```typescript
// Component with circuit breaker implementation
function CircuitBreakerComponent() {
  const waitForRefs = useWaitForRefs();
  
  const createCircuitBreaker = useCallback((threshold = 3, resetTimeout = 30000) => {
    let failures = 0;
    let lastFailTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';
    
    return async (elementKey: string, timeout = 5000) => {
      const now = Date.now();
      
      // Reset circuit breaker if enough time has passed
      if (state === 'open' && now - lastFailTime > resetTimeout) {
        state = 'half-open';
        failures = 0;
      }
      
      // Fast fail if circuit is open
      if (state === 'open') {
        throw new Error('Circuit breaker is open');
      }
      
      try {
        await Promise.race([
          waitForRefs(elementKey),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Circuit breaker timeout')), timeout)
          )
        ]);
        
        // Success - reset circuit breaker
        failures = 0;
        state = 'closed';
        return true;
        
      } catch (error) {
        failures++;
        lastFailTime = now;
        
        if (failures >= threshold) {
          state = 'open';
          console.warn(`Circuit breaker opened after ${failures} failures`);
        }
        
        throw error;
      }
    };
  }, [waitForRefs]);

  const circuitBreakerWait = useMemo(() => createCircuitBreaker(3, 30000), [createCircuitBreaker]);

  const testCircuitBreaker = useCallback(async () => {
    try {
      const result = await circuitBreakerWait('criticalElement', 2000);
      console.log('Circuit breaker success:', result);
    } catch (error) {
      console.error('Circuit breaker failed:', error.message);
    }
  }, [circuitBreakerWait]);

  return (
    <div>
      <button onClick={testCircuitBreaker}>
        Test Circuit Breaker
      </button>
    </div>
  );
}
```

### Timeout with Performance Monitoring

```typescript
const monitoredTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
  const startTime = performance.now();
  
  try {
    await Promise.race([
      waitForRefs(elementKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Performance timeout')), timeout)
      )
    ]);
    
    const duration = performance.now() - startTime;
    console.log(`Element ${elementKey} loaded in ${duration.toFixed(2)}ms`);
    
    // Log slow operations
    if (duration > timeout * 0.8) {
      console.warn(`Slow element loading: ${elementKey} took ${duration.toFixed(2)}ms`);
    }
    
    return true;
    
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`Element ${elementKey} failed after ${duration.toFixed(2)}ms:`, error.message);
    return false;
  }
}, [waitForRefs]);
```

## Best Practices

1. **Set Reasonable Timeouts**: Based on expected loading times
2. **Implement Fallbacks**: Always have a backup strategy
3. **Log Timeout Events**: For debugging and monitoring
4. **Use Progressive Strategies**: Start with short timeouts, increase gradually
5. **Monitor Performance**: Track timeout frequency and duration
6. **Handle Gracefully**: Don't let timeouts crash the application

## Common Use Cases

- **Network-dependent Elements**: Elements loaded via API
- **Complex Animations**: Heavy rendering operations
- **Third-party Widgets**: External components with variable load times
- **Dynamic Content**: User-generated or CMS content
- **Progressive Web Apps**: Service worker dependent features