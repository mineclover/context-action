# Implementation Guide - Domain-Driven Architecture

This guide provides practical steps for implementing the Context-Action framework's modular architecture.

## Quick Start Checklist

### 1. Domain Structure Setup
```bash
src/domains/
├── shared/           # ✅ Common utilities and types
├── store/           # ✅ State management domain
├── action/          # ✅ Business logic domain
└── async/           # ✅ Async operations domain
```

### 2. Domain Implementation Pattern

#### Store Domain
```typescript
// domains/store/contexts/index.ts
export const { Provider, useStore, useStoreManager } = 
  createDeclarativeStorePattern('YourDomain', {
    data: { initialValue: initialData }
  });

// domains/store/hooks/index.ts
export function useStorePerformanceTracking(/* ... */) {
  // Performance monitoring hooks
}

// domains/store/components/index.tsx
export function StorePatternDemo(/* ... */) {
  // Reusable store demonstration components
}
```

#### Action Domain
```typescript
// domains/action/contexts/index.ts
interface DomainActions extends ActionPayloadMap {
  actionName: PayloadType;
}

export const { Provider, useActionDispatch, useActionHandler } = 
  createActionContext<DomainActions>('DomainActions');

// domains/action/handlers/index.ts
export function useDomainActionHandlers() {
  return {
    actionName: useCallback(async (payload, controller) => {
      // Business logic implementation
    }, [])
  };
}
```

## Integration Patterns

### MVVM Implementation

#### Model Layer (Store Domain)
- **Responsibility**: State management and data persistence
- **Pattern**: Declarative Store Pattern with reactive subscriptions
- **Example**: `useStoreValue(store, selector)`

#### ViewModel Layer (Action Domain)
- **Responsibility**: Business logic processing and coordination
- **Pattern**: Action Pipeline with handler registration
- **Example**: `useActionHandler('actionType', businessLogicHandler)`

#### View Layer (React Components)
- **Responsibility**: UI rendering and user interaction
- **Pattern**: Pure components with reactive data subscriptions
- **Example**: Components dispatch actions and subscribe to store changes

### Cross-Domain Communication

```typescript
// Example: Integrated component using all domains
function IntegratedComponent() {
  // Store Domain - Reactive data access
  const dataStore = useStore('data');
  const data = useStoreValue(dataStore);
  
  // Action Domain - Business logic
  const dispatch = useActionDispatch();
  
  // Async Domain - Async operations
  const { execute } = useAsyncOperation(async () => {
    return await apiService.processData(data);
  });
  
  const handleAction = async () => {
    // ViewModel processes the business logic
    await dispatch('processData', { data });
    
    // Async domain handles the API coordination
    await execute();
  };
  
  return (
    <div>
      <div>Current Data: {JSON.stringify(data)}</div>
      <button onClick={handleAction}>Process Data</button>
    </div>
  );
}
```

## Best Practices

### 1. Domain Separation
- ✅ Keep domains isolated with clear boundaries
- ✅ Use shared domain for cross-cutting concerns
- ❌ Avoid direct imports between non-shared domains

### 2. Context Management
- ✅ One context per specific responsibility
- ✅ Compose contexts at the application level
- ❌ Avoid deeply nested provider hierarchies

### 3. Type Safety
- ✅ Define domain-specific types in shared/types
- ✅ Use ActionPayloadMap for all action definitions
- ✅ Leverage TypeScript inference in store patterns

### 4. Performance Optimization
- ✅ Use selective subscriptions with useStoreValue
- ✅ Memoize expensive selectors and handlers
- ✅ Implement performance monitoring for critical paths

## Migration Strategy

### Phase 1: Foundation
1. Create domain directory structure
2. Move shared utilities to shared domain
3. Set up basic type definitions

### Phase 2: Domain Extraction
1. Extract store contexts to store domain
2. Move action handlers to action domain
3. Organize async patterns in async domain

### Phase 3: Component Refactoring
1. Update existing components to use domain imports
2. Implement MVVM patterns consistently
3. Add performance monitoring and debugging tools

### Phase 4: Optimization
1. Add domain-specific performance optimizations
2. Implement comprehensive error handling
3. Add architectural documentation and examples

## Common Patterns

### Store Management Pattern
```typescript
// domains/store/patterns/UserManagement.ts
export function createUserStorePattern(initialUser: User) {
  return createDeclarativeStorePattern('User', {
    profile: { initialValue: initialUser },
    preferences: { initialValue: { theme: 'light' } },
    activity: { initialValue: { lastLogin: Date.now() } }
  });
}
```

### Action Handler Pattern
```typescript
// domains/action/patterns/CrudHandlers.ts
export function createCrudHandlers<T>(
  store: StoreInstance<T>,
  apiService: ApiService<T>
) {
  return {
    create: useCallback(async (payload: CreatePayload<T>, controller) => {
      const result = await apiService.create(payload.data);
      store.update(prev => [...prev, result]);
    }, [store, apiService]),
    
    update: useCallback(async (payload: UpdatePayload<T>, controller) => {
      const result = await apiService.update(payload.id, payload.data);
      store.update(prev => prev.map(item => 
        item.id === payload.id ? result : item
      ));
    }, [store, apiService])
  };
}
```

### Async Coordination Pattern
```typescript
// domains/async/patterns/ApiCoordination.ts
export function createApiCoordination<T>(
  store: StoreInstance<T[]>,
  apiEndpoint: string
) {
  const performanceMonitor = new AsyncPerformanceMonitor();
  
  return {
    fetchWithRetry: async () => {
      return await performanceMonitor.monitor('fetchData', async () => {
        return await AsyncUtilsService.retry(
          () => apiService.fetch<T[]>(apiEndpoint),
          3,
          1000
        );
      });
    },
    
    batchUpdate: async (items: T[]) => {
      const circuitBreaker = new CircuitBreakerService();
      
      return await circuitBreaker.execute(async () => {
        const results = await Promise.all(
          items.map(item => apiService.update(item.id, item))
        );
        store.setValue(results);
        return results;
      });
    }
  };
}
```

## Testing Strategy

### Domain-Level Testing
```typescript
// domains/store/__tests__/StorePatterns.test.ts
describe('Store Domain', () => {
  it('should manage state correctly', () => {
    // Test store patterns in isolation
  });
});

// domains/action/__tests__/ActionHandlers.test.ts
describe('Action Domain', () => {
  it('should process business logic correctly', () => {
    // Test action handlers in isolation
  });
});
```

### Integration Testing
```typescript
// __tests__/integration/DomainIntegration.test.ts
describe('Cross-Domain Integration', () => {
  it('should coordinate between domains correctly', () => {
    // Test domain interactions
  });
});
```

## Troubleshooting

### Common Issues

1. **Context Provider Missing**
   - Ensure all required providers are composed at the app level
   - Check provider hierarchy and nesting

2. **Type Errors**
   - Verify ActionPayloadMap interface definitions
   - Check shared type imports and exports

3. **Performance Issues**
   - Use performance monitoring hooks
   - Implement selective subscriptions
   - Check for unnecessary re-renders

### Debug Tools

- Store debugger components in store domain
- Performance monitoring in async domain
- Action logging in action domain
- Cross-domain integration monitoring