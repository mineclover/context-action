# Core Concepts

Fundamental framework concepts and systems that form the foundation of the Context-Action framework.

## Action Pipeline System

**Definition**: The central orchestration system that processes dispatched actions through a series of registered handlers in priority order.

**Code Reference**: `ActionRegister<T>` class in `packages/core/src/ActionRegister.ts`

**Usage Context**: 
- Core framework functionality
- Business logic execution
- Event-driven architecture implementation

**Key Characteristics**:
- Priority-based handler execution (higher priority runs first)
- Type-safe action dispatch with payload validation
- Pipeline flow control (abort, continue, modify)
- Support for both synchronous and asynchronous handlers

**Example**:
```typescript
// Action definition
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  calculateTotal: { items: CartItem[] };
}

// Register handlers to the pipeline
actionRegister.register('updateUser', async (payload, controller) => {
  // Business logic execution
  const user = userStore.getValue();
  userStore.setValue({ ...user, ...payload });
}, { priority: 10, blocking: true });
```

**Related Terms**: [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller), [Store Integration Pattern](#store-integration-pattern)

---

## Store Integration Pattern

**Definition**: The architectural pattern that enables action handlers to read and update stores while maintaining loose coupling between components.

**Code Reference**: Store getter/setter pattern in action handlers

**Usage Context**:
- State management in action handlers
- Cross-store coordination
- Data flow implementation

**Key Characteristics**:
- Lazy evaluation of store values at execution time
- No direct component-to-store coupling
- Atomic-like updates across multiple stores
- Fresh state values guaranteed in handlers

**Example**:
```typescript
actionRegister.register('checkout', async (payload, controller) => {
  // Read from multiple stores
  const cart = cartStore.getValue();
  const user = userStore.getValue();
  const inventory = inventoryStore.getValue();
  
  // Business logic with cross-store coordination
  if (cart.items.some(item => inventory[item.id] < item.quantity)) {
    controller.abort('Insufficient inventory');
    return;
  }
  
  // Update multiple stores
  orderStore.setValue({ ...payload, status: 'processing' });
  cartStore.setValue({ items: [] });
  inventoryStore.update(inv => updateInventory(inv, cart.items));
});
```

**Related Terms**: [Action Handler](#action-handler), [Cross-Store Coordination](./api-terms.md#cross-store-coordination), [Lazy Evaluation](./architecture-terms.md#lazy-evaluation)

---

## Action Handler

**Definition**: A function that processes a specific action within the pipeline, containing business logic and store interactions.

**Code Reference**: `ActionHandler<T>` type in `packages/core/src/types.ts`

**Usage Context**:
- Business logic implementation
- State transformation
- Side effect management
- Validation and error handling

**Key Characteristics**:
- Receives typed payload and pipeline controller
- Can be synchronous or asynchronous
- Configurable with priority, blocking, and condition options
- Has access to all registered stores via store registry

**Function Signature**:
```typescript
type ActionHandler<T = any> = (
  payload: T,
  controller: PipelineController<T>
) => void | Promise<void>;
```

**Example**:
```typescript
// User update handler with validation
actionRegister.register('updateUser', async (payload, controller) => {
  // Input validation
  if (!payload.id || !payload.name) {
    controller.abort('Invalid user data');
    return;
  }
  
  // Business logic
  const currentUser = userStore.getValue();
  const updatedUser = {
    ...currentUser,
    ...payload,
    lastModified: Date.now()
  };
  
  // Store update
  userStore.setValue(updatedUser);
  
  // Side effects
  activityStore.update(activities => [...activities, {
    type: 'user_updated',
    userId: payload.id,
    timestamp: Date.now()
  }]);
}, { priority: 10, blocking: true });
```

**Related Terms**: [Pipeline Controller](#pipeline-controller), [Action Pipeline System](#action-pipeline-system), [Handler Configuration](./api-terms.md#handler-configuration)

---

## Pipeline Controller

**Definition**: An interface provided to action handlers for managing pipeline execution flow and payload modification.

**Code Reference**: `PipelineController<T>` interface in `packages/core/src/types.ts`

**Usage Context**:
- Flow control within action handlers
- Pipeline abortion on errors
- Payload modification for subsequent handlers
- Handler coordination

**Key Methods**:
- `next()`: Continue to the next handler (called automatically)
- `abort(reason?)`: Stop pipeline execution with optional reason
- `modifyPayload(modifier)`: Transform payload for subsequent handlers
- `getPayload()`: Retrieve current payload

**Example**:
```typescript
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
  
  // Continue execution (automatic)
});
```

**Related Terms**: [Action Handler](#action-handler), [Action Pipeline System](#action-pipeline-system), [Pipeline Context](./api-terms.md#pipeline-context)

---

## Store Registry

**Definition**: A centralized registry that manages store instances and provides access to stores within the application context.

**Code Reference**: `StoreRegistry` class and `useStoreRegistry` hook

**Usage Context**:
- Store lifecycle management
- Dependency injection for action handlers
- Store discovery and access
- Provider pattern implementation

**Key Characteristics**:
- Centralized store management
- Type-safe store access by key
- Integration with React context system
- Lazy store initialization support

**Example**:
```typescript
// Store registration
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        <Application />
      </ActionProvider>
    </StoreProvider>
  );
}

// Store access in action handlers
function useUserActions() {
  const registry = useStoreRegistry();
  
  useEffect(() => {
    const userStore = registry.getStore('user');
    const settingsStore = registry.getStore('settings');
    
    const unregister = actionRegister.register('updateUser', 
      async (payload, controller) => {
        const user = userStore.getValue();
        const settings = settingsStore.getValue();
        
        // Business logic with store access
        userStore.setValue({ ...user, ...payload });
      }
    );
    
    return unregister;
  }, [registry]);
}
```

**Related Terms**: [Store Provider](./api-terms.md#storeprovider), [Action Provider](./api-terms.md#actionprovider), [Store Integration Pattern](#store-integration-pattern)

---

## Action Payload Map

**Definition**: A TypeScript interface that defines the mapping between action names and their corresponding payload types.

**Code Reference**: `ActionPayloadMap` interface in `packages/core/src/types.ts`

**Usage Context**:
- Type safety for action dispatch
- Action handler registration
- Compile-time validation
- API contract definition

**Key Characteristics**:
- Extends base ActionPayloadMap interface
- Maps action names to payload types
- Supports void payloads for parameter-less actions
- Enables compile-time type checking

**Example**:
```typescript
// Define application actions
interface AppActions extends ActionPayloadMap {
  increment: void;                    // No payload
  setCount: number;                   // Number payload
  updateUser: { id: string; name: string };  // Object payload
  deleteUser: { id: string };        // Object payload
}

// Type-safe action registration
const actionRegister = new ActionRegister<AppActions>();

// Type-safe dispatch
await actionRegister.dispatch('increment');     // ✓ Valid
await actionRegister.dispatch('setCount', 42);   // ✓ Valid
await actionRegister.dispatch('setCount');       // ✗ Type error
```

**Related Terms**: [Action Handler](#action-handler), [Action Dispatcher](./api-terms.md#action-dispatcher), [Type Safety](./architecture-terms.md#type-safety)

---

## Handler Configuration

**Definition**: Configuration options that control the behavior of action handlers within the pipeline.

**Code Reference**: `HandlerConfig` interface in `packages/core/src/types.ts`

**Usage Context**:
- Handler behavior customization
- Execution order control
- Conditional execution
- Performance optimization

**Configuration Options**:
- `priority`: Execution order (higher numbers run first)
- `id`: Unique identifier for the handler
- `blocking`: Whether to wait for async completion
- `once`: Remove handler after first execution
- `condition`: Function to determine if handler should run

**Example**:
```typescript
// High-priority blocking handler
actionRegister.register('criticalUpdate', handler, {
  priority: 100,
  blocking: true,
  id: 'critical-update-validator'
});

// One-time initialization handler
actionRegister.register('initialize', handler, {
  once: true,
  priority: 1000
});

// Conditional handler
actionRegister.register('premiumFeature', handler, {
  condition: () => user.isPremium,
  priority: 50
});
```

**Related Terms**: [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller), [Priority-based Execution](./api-terms.md#priority-based-execution)