# Context-Action MVVM Architecture

## Overview

Context-Action framework implements a modern MVVM (Model-View-ViewModel) pattern optimized for React applications with clear separation of concerns and type-safe action dispatch.

## Architecture Layers

### View Layer (React Components)
- UI rendering and user interaction
- Dispatches actions with typed payloads
- Subscribes to store changes via hooks

### ViewModel Layer (Action Handlers)
- Business logic and orchestration
- Processes user actions and system events
- Coordinates between View and Model layers

### Model Layer (Stores)
- State management and data persistence
- Reactive updates trigger View re-renders
- Independent of business logic

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                  VIEW LAYER                              │
│                             (React Components)                           │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │
│  │  Component A │    │  Component B │    │  Component C │               │
│  │             │    │             │    │             │               │
│  │  dispatch() │    │  dispatch() │    │  dispatch() │               │
│  │  useStore() │    │  useStore() │    │  useStore() │               │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘               │
│         │ dispatch          │ dispatch          │ dispatch              │
│         │ subscribe         │ subscribe         │ subscribe             │
└─────────┼───────────────────┼───────────────────┼──────────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            VIEWMODEL LAYER                               │
│                          (Action Pipeline)                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      ActionRegister<T>                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐               │  │
│  │  │  Handler 1 │  │  Handler 2 │  │  Handler 3 │               │  │
│  │  │ priority:10│  │ priority:5 │  │ priority:0 │               │  │
│  │  └────────────┘  └────────────┘  └────────────┘               │  │
│  │                                                                 │  │
│  │  Pipeline Execution: payload → handler → store updates         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                            │                                            │
│                            │ get/set at execution time                  │
│                            ▼                                            │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              MODEL LAYER                                 │
│                               (Stores)                                   │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │
│  │   Store A   │    │   Store B   │    │   Store C   │               │
│  │             │    │             │    │             │               │
│  │  getValue() │    │  getValue() │    │  getValue() │               │
│  │  setValue() │    │  setValue() │    │  setValue() │               │
│  │  update()   │    │  update()   │    │  update()   │               │
│  │  subscribe()│    │  subscribe()│    │  subscribe()│               │
│  └─────────────┘    └─────────────┘    └─────────────┘               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                        StoreRegistry                             │  │
│  │                 Centralized store management                     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
User Interaction
       │
       ▼
Component.dispatch('action', payload)
       │
       ▼
ActionPipeline.execute(payload)
       │
       ▼
Handler.process(payload, controller)
       │
       ├─→ Store.getValue() [Read current state]
       │
       ├─→ Business Logic [Process with payload + state]
       │
       ├─→ Store.setValue() [Update state]
       │
       ▼
Store.notifySubscribers()
       │
       ▼
Component.reRender() [Via React hooks]
```

## Key Concepts

### 1. Lazy Evaluation Pattern
```typescript
// Handler gets fresh store values at execution time
actionRegister.register('updateCart', (payload, controller) => {
  // getValue() called when handler executes, not when registered
  const currentCart = cartStore.getValue();  // Always fresh
  const userPrefs = prefsStore.getValue();   // Always current
  
  // Process with latest values
  const updatedCart = processCart(currentCart, payload, userPrefs);
  cartStore.setValue(updatedCart);
});
```

### 2. Action Context Registration
```typescript
// Actions are registered to pipeline context at component mount
function CartFeature() {
  const registry = useStoreRegistry();
  const dispatch = useActionDispatch();
  
  useEffect(() => {
    // Get stores from registry
    const cartStore = registry.getStore('cart');
    const inventoryStore = registry.getStore('inventory');
    
    // Register action handlers with store access
    const unregister = actionRegister.register('addToCart', 
      (payload, controller) => {
        // Business logic with store access
        const cart = cartStore.getValue();
        const inventory = inventoryStore.getValue();
        
        if (inventory[payload.productId] < payload.quantity) {
          controller.abort('Insufficient inventory');
          return;
        }
        
        cartStore.update(cart => ({
          ...cart,
          items: [...cart.items, payload]
        }));
        
        inventoryStore.update(inv => ({
          ...inv,
          [payload.productId]: inv[payload.productId] - payload.quantity
        }));
      },
      { priority: 10, blocking: true }
    );
    
    return unregister; // Cleanup on unmount
  }, [registry]);
  
  return <CartUI onAddItem={(item) => dispatch('addToCart', item)} />;
}
```

### 3. Pipeline Execution Control
```typescript
// Pipeline controller enables flow control
actionRegister.register('processOrder', async (payload, controller) => {
  // Validation phase
  if (!validateOrder(payload)) {
    controller.abort('Invalid order data');
    return;
  }
  
  // Modify payload for next handlers
  controller.modifyPayload(order => ({
    ...order,
    processedAt: Date.now(),
    status: 'processing'
  }));
  
  // Continue to next handler
  controller.next();
});
```

## MVVM Benefits in Context-Action

### 1. Separation of Concerns
- **View**: Pure UI logic, no business rules
- **ViewModel**: All business logic centralized in actions
- **Model**: Pure data management, no UI awareness

### 2. Testability
```typescript
// Test actions independently
it('should update user profile', async () => {
  const mockUserStore = createMockStore({ id: 1, name: 'John' });
  const mockActivityStore = createMockStore([]);
  
  // Register handler with mocks
  actionRegister.register('updateProfile', (payload) => {
    const user = mockUserStore.getValue();
    mockUserStore.setValue({ ...user, ...payload });
    mockActivityStore.update(acts => [...acts, 'profile_updated']);
  });
  
  // Test dispatch
  await actionRegister.dispatch('updateProfile', { name: 'Jane' });
  
  expect(mockUserStore.getValue()).toEqual({ id: 1, name: 'Jane' });
  expect(mockActivityStore.getValue()).toContain('profile_updated');
});
```

### 3. Reusability
```typescript
// Same action can be triggered from multiple components
function ProfileCard() {
  const dispatch = useActionDispatch();
  return <button onClick={() => dispatch('updateProfile', data)}>Update</button>;
}

function SettingsPage() {
  const dispatch = useActionDispatch();
  return <form onSubmit={(data) => dispatch('updateProfile', data)} />;
}
```

### 4. Type Safety
```typescript
// Full type inference throughout the stack
interface AppActions extends ActionPayloadMap {
  updateProfile: { name?: string; email?: string };
  deleteUser: { userId: string; reason: string };
}

const dispatch = useActionDispatch<AppActions>();

// TypeScript ensures correct payload
dispatch('updateProfile', { name: 'John' }); // ✓ Valid
dispatch('updateProfile', { age: 30 });      // ✗ Type error
dispatch('unknownAction');                    // ✗ Type error
```

## Implementation Guidelines

### 1. Action Design
- Keep actions focused on single responsibilities
- Use descriptive action names (verb + noun)
- Define clear payload interfaces

### 2. Store Design
- Normalize data structure
- Keep stores focused on domain entities
- Avoid derived state in stores

### 3. Component Design
- Use hooks for store subscriptions
- Dispatch actions for all state changes
- Keep components pure and focused on rendering

### 4. Handler Design
- Validate inputs early with controller.abort()
- Use blocking: true for critical operations
- Handle errors gracefully
- Keep side effects minimal and traceable

## Comparison with Traditional MVVM

| Aspect | Traditional MVVM | Context-Action MVVM |
|--------|-----------------|-------------------|
| Data Binding | Two-way binding | One-way flow via actions |
| ViewModel | Class instances | Functional handlers |
| Commands | Command objects | Action dispatch |
| State Updates | Property setters | Store setters |
| Type Safety | Runtime checking | Compile-time types |
| Testing | Mock dependencies | Mock stores |
| Debugging | Complex binding chains | Linear action flow |

## Summary

Context-Action's MVVM implementation provides:
- **Clear separation** between UI, business logic, and state
- **Type-safe** action dispatch and state management
- **Lazy evaluation** ensuring fresh state values
- **Testable** architecture with mockable dependencies
- **Scalable** pattern for complex applications

The framework combines the best of MVVM architectural principles with modern React patterns and TypeScript capabilities.