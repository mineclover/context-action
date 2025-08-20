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