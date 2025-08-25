# Async Patterns Setup & Configuration

Complete setup guide for handling asynchronous operations, element waiting, and DOM safety patterns in the Context-Action framework.

## Prerequisites

### Required Setup Guides
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Action context setup for async handlers
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Store context for async state management  
- **[RefContext Setup](../setup/ref-context-setup.md)** - Ref context for DOM element tracking
- **[Multi-Context Setup](../setup/multi-context-setup.md)** - Complex async architectures with multiple contexts

### Core Dependencies
```typescript
import { 
  createActionContext, 
  createDeclarativeStorePattern,
  createRefContext,
  useWaitForRefs
} from '@context-action/react';
```

## Setup Overview

Async patterns require coordinated setup across three main contexts for optimal safety and performance:

### 1. Action Context Setup
For handling async operations and business logic:

```typescript
interface AsyncActions {
  processData: { data: any; timeout?: number };
  retryOperation: { operationId: string; maxRetries: number };
  cancelOperation: { operationId: string };
}

const { useActionHandler, useActionDispatch } = createActionContext<AsyncActions>('AsyncOps');
```

### 2. Store Context Setup  
For managing async operation state:

```typescript
const { useStore } = createDeclarativeStorePattern('AsyncState', {
  isProcessing: { initialValue: false },
  retryCount: { initialValue: 0 },
  operationResults: { initialValue: {} as Record<string, any> },
  timeoutConfig: { initialValue: { default: 5000, max: 30000 } }
});
```

### 3. RefContext Setup
For DOM element availability tracking:

```typescript
interface AsyncElementRefs {
  targetElement: HTMLElement;
  progressIndicator: HTMLElement;  
  resultDisplay: HTMLElement;
}

const { useAppRef, useWaitForRefs } = createRefContext<AsyncElementRefs>('AsyncRefs');
```

## Async Pattern Specifications

### Core Async Patterns

#### 1. Real-time State Access Pattern
**Setup Spec**: Action Context + Store Context
- **Purpose**: Avoiding closure traps with `store.getValue()`  
- **Required Setup**: [Basic Action Setup](../setup/basic-action-setup.md) + [Basic Store Setup](../setup/basic-store-setup.md)
- **Key Implementation**: Real-time state access in async handlers
- **Documentation**: [Real-time State Access](./real-time-state-access.md)

#### 2. Wait-Then-Execute Pattern
**Setup Spec**: RefContext + Action Context
- **Purpose**: Safe DOM operations after element availability
- **Required Setup**: [RefContext Setup](../setup/ref-context-setup.md) + [Basic Action Setup](../setup/basic-action-setup.md)
- **Key Implementation**: `await waitForRefs()` before DOM manipulation
- **Documentation**: [Wait-Then-Execute](./wait-then-execute.md)

#### 3. Conditional Await Pattern  
**Setup Spec**: Store Context + RefContext + Action Context
- **Purpose**: Smart waiting based on runtime conditions
- **Required Setup**: All three context setups for state-driven waiting decisions
- **Key Implementation**: Conditional `waitForRefs()` based on store state
- **Documentation**: [Conditional Await](./conditional-await.md)

#### 4. Timeout Protection Pattern
**Setup Spec**: Action Context + Store Context (optional RefContext)
- **Purpose**: Preventing infinite waits with fallback strategies
- **Required Setup**: [Basic Action Setup](../setup/basic-action-setup.md) for timeout logic
- **Key Implementation**: `Promise.race()` with configurable timeouts  
- **Documentation**: [Timeout Protection](./timeout-protection.md)

## Setup-Based Quick Reference

| Pattern | Setup Requirements | Key Setup Components | Configuration Focus |
|---------|-------------------|---------------------|-------------------|
| **Real-time State Access** | Action + Store | `useActionHandler`, `store.getValue()` | Async state access |
| **Wait-Then-Execute** | Ref + Action | `useWaitForRefs`, `useAppRef` | DOM safety setup |
| **Conditional Await** | All contexts | State-driven waiting logic | Conditional patterns |
| **Timeout Protection** | Action + Store | Timeout configuration, fallback handlers | Error recovery setup |

## Complete Setup Integration Example

### Full Multi-Context Setup for Async Operations

```typescript
// 1. Action Context Setup
interface AsyncActions {
  processData: { data: any; timeout?: number };
  retryOperation: { operationId: string; maxRetries: number };
  cancelOperation: { operationId: string };
}

const { 
  Provider: AsyncActionProvider,
  useActionHandler: useAsyncActionHandler,
  useActionDispatch: useAsyncAction 
} = createActionContext<AsyncActions>('AsyncOps');

// 2. Store Context Setup
const { 
  Provider: AsyncStateProvider,
  useStore: useAsyncStore 
} = createDeclarativeStorePattern('AsyncState', {
  isProcessing: { initialValue: false },
  retryCount: { initialValue: 0 },
  operationResults: { initialValue: {} as Record<string, any> },
  timeoutConfig: { initialValue: { default: 5000, max: 30000 } }
});

// 3. RefContext Setup
interface AsyncElementRefs {
  targetElement: HTMLElement;
  progressIndicator: HTMLElement;
  resultDisplay: HTMLElement;
}

const { 
  Provider: AsyncRefProvider,
  useAppRef: useAsyncRef,
  useWaitForRefs: useAsyncWaitForRefs 
} = createRefContext<AsyncElementRefs>('AsyncRefs');

// 4. Combined Provider Setup
function AsyncPatternProvider({ children }: { children: React.ReactNode }) {
  return (
    <AsyncActionProvider>
      <AsyncStateProvider>
        <AsyncRefProvider>
          {children}
        </AsyncRefProvider>
      </AsyncStateProvider>
    </AsyncActionProvider>
  );
}

// 5. Implementation Component with All Patterns
function CompleteAsyncComponent() {
  // Setup hooks
  const isProcessingStore = useAsyncStore('isProcessing');
  const retryCountStore = useAsyncStore('retryCount');
  const timeoutConfigStore = useAsyncStore('timeoutConfig');
  
  const elementRef = useAsyncRef('targetElement');
  const waitForRefs = useAsyncWaitForRefs();
  
  // Setup async handler with all patterns
  useAsyncActionHandler('processData', async (payload, controller) => {
    // Real-time State Access Pattern - avoid closure traps
    const isProcessing = isProcessingStore.getValue();
    if (isProcessing) {
      controller.abort('Already processing');
      return;
    }
    
    isProcessingStore.setValue(true);
    
    try {
      // Conditional Await Pattern - state-driven waiting
      const retryCount = retryCountStore.getValue();
      if (retryCount > 0) {
        // Wait-Then-Execute Pattern - safe DOM operations
        await waitForRefs('targetElement');
      }
      
      // Timeout Protection Pattern - prevent infinite waits
      const timeoutConfig = timeoutConfigStore.getValue();
      const timeout = payload.timeout || timeoutConfig.default;
      
      const result = await Promise.race([
        processAsyncData(payload.data),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      
      // Safe DOM manipulation after waiting
      const element = elementRef.target;
      if (element) {
        element.textContent = `Processed: ${result}`;
      }
      
    } catch (error) {
      console.error('Async operation failed:', error);
      const currentRetries = retryCountStore.getValue();
      retryCountStore.setValue(currentRetries + 1);
      controller.abort('Processing failed', error);
    } finally {
      isProcessingStore.setValue(false);
    }
  });
  
  return (
    <div>
      <div ref={elementRef.setRef}>Target Element</div>
      {/* Component implementation */}
    </div>
  );
}
```

## Setup Configuration Best Practices

### 1. Context Organization
- **Separate Concerns**: Use distinct contexts for actions, state, and refs
- **Clear Naming**: Use descriptive context names with domain prefixes
- **Provider Composition**: Combine providers in logical order (Action → State → Ref)

### 2. Type Safety Setup
- **Interface Definition**: Define clear interfaces for each context type
- **Generic Constraints**: Use proper generic constraints for type safety
- **Export Patterns**: Export setup functions for reuse across components

### 3. Performance Configuration
- **Lazy Loading**: Use lazy evaluation for expensive async operations
- **Cleanup Management**: Implement proper cleanup for timeouts and promises
- **Memory Optimization**: Avoid closure traps with real-time state access

### 4. Error Handling Setup
- **Timeout Configuration**: Set up configurable timeout values
- **Retry Logic**: Implement exponential backoff for retry operations  
- **Fallback Strategies**: Configure fallback behavior for failed operations

## Pattern Selection Matrix

| Use Case | Required Setup | Key Configuration | Performance Impact |
|----------|---------------|-------------------|-------------------|
| **Simple async handler** | Action only | Basic action handlers | Low |
| **State-dependent async** | Action + Store | Real-time state access | Medium |
| **DOM-dependent async** | Action + Ref | Element availability waiting | Medium |
| **Complex async workflow** | All contexts | Full pattern integration | High |
| **Performance-critical async** | All + optimization | Memory/cleanup management | Variable |

## Setup Integration Guidelines

### For Simple Applications
Start with **[Basic Action Setup](../setup/basic-action-setup.md)** and add contexts as needed:
1. Begin with Action Context for async handlers
2. Add Store Context when state management is needed
3. Add RefContext when DOM safety is required

### For Complex Applications  
Use **[Multi-Context Setup](../setup/multi-context-setup.md)** with full integration:
1. Plan context architecture based on async requirements
2. Set up provider composition for optimal performance
3. Configure error handling and timeout strategies
4. Implement cleanup and memory management patterns

## Next Steps

1. **Review Setup Guides**: Study the prerequisite setup guides for your use case
2. **Choose Patterns**: Select async patterns based on your application requirements
3. **Implement Setup**: Follow the setup specifications for each chosen pattern
4. **Study Examples**: Review individual pattern documentation for detailed examples
5. **Optimize**: Apply performance and error handling best practices

For detailed implementation examples and advanced use cases, see the individual pattern documentation.