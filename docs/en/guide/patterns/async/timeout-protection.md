# Timeout Protection Pattern

Pattern for protecting against infinite waits with timeout mechanisms.

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
useActionHandler('criticalAction', useCallback(async (payload) => {
  const success = await waitWithTimeout('criticalElement', 3000);
  
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
```

## Error Recovery Pattern

```typescript
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
}, [waitWithTimeout]);
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
const createCircuitBreaker = (threshold = 3, resetTimeout = 30000) => {
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
};

const circuitBreakerWait = createCircuitBreaker(3, 30000);
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