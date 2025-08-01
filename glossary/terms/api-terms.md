# API Terms

Technical implementation and API concepts for the Context-Action framework.

## ActionRegister

**Definition**: The core class that manages action pipelines, handler registration, and provides type-safe action dispatch functionality.

**Code Reference**: `ActionRegister<T>` class in `packages/core/src/ActionRegister.ts`

**Usage Context**:
- Central action management system
- Business logic orchestration
- Type-safe action dispatch
- Handler lifecycle management

**Key Features**:
- Generic type support for action payload maps
- Priority-based handler execution
- Event emission for monitoring
- Configurable logging and debugging
- Pipeline flow control

**Example**:
```typescript
// Create typed ActionRegister instance
interface AppActions extends ActionPayloadMap {
  increment: void;
  setCount: number;
  updateUser: { id: string; name: string };
}

const actionRegister = new ActionRegister<AppActions>({
  name: 'MyApp',
  debug: true,
  logLevel: LogLevel.INFO
});

// Register handlers
actionRegister.register('updateUser', async (payload, controller) => {
  const user = userStore.getValue();
  userStore.setValue({ ...user, ...payload });
}, { priority: 10, blocking: true });

// Dispatch actions with type safety
await actionRegister.dispatch('updateUser', { id: '123', name: 'John' });
```

**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Pipeline Controller](./core-concepts.md#pipeline-controller), [Action Payload Map](./core-concepts.md#action-payload-map)

---

## StoreProvider

**Definition**: A React context provider that manages store instances and provides them to child components through the React context system.

**Code Reference**: `StoreProvider` component in React package

**Usage Context**:
- Application root setup
- Store dependency injection
- React context pattern implementation
- Store lifecycle management

**Key Features**:
- Centralized store management
- Context-based dependency injection
- Store instance lifecycle control
- Integration with React component tree

**Example**:
```typescript
// Application setup with StoreProvider
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        {/* Store registry available to child components */}
        <UserManagement />
        <ShoppingCart />
        <OrderHistory />
      </ActionProvider>
    </StoreProvider>
  );
}

// Store access in child components
function UserProfile() {
  const registry = useStoreRegistry();
  const userStore = registry.getStore('user');
  const user = useStoreValue(userStore);
  
  return <div>{user.name}</div>;
}
```

**Related Terms**: [ActionProvider](#actionprovider), [Store Registry](./core-concepts.md#store-registry), [Store Hooks](#store-hooks)

---

## ActionProvider

**Definition**: A React context provider that manages action registration and dispatch functionality within the React component tree.

**Code Reference**: `ActionProvider` component in React package

**Usage Context**:
- Action handler registration context
- Action dispatch accessibility
- Component lifecycle integration
- Handler cleanup management

**Key Features**:
- Action dispatch context provision
- Handler registration lifecycle
- Automatic cleanup on unmount
- Integration with store providers

**Example**:
```typescript
// ActionProvider setup
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        <Application />
      </ActionProvider>
    </StoreProvider>
  );
}

// Action registration in components
function UserActions() {
  const dispatch = useActionDispatch();
  const registry = useStoreRegistry();
  
  useEffect(() => {
    const userStore = registry.getStore('user');
    
    const unregister = actionRegister.register('updateUser', 
      async (payload, controller) => {
        const user = userStore.getValue();
        userStore.setValue({ ...user, ...payload });
      }
    );
    
    return unregister; // Cleanup on unmount
  }, [registry]);
  
  return null; // Action registration component
}
```

**Related Terms**: [StoreProvider](#storeprovider), [Action Dispatcher](#action-dispatcher), [useActionDispatch](#useactiondispatch)

---

## Store Hooks

**Definition**: React hooks that provide reactive access to store values and enable components to subscribe to store changes.

**Code Reference**: Various hooks in `packages/react/src/store/hooks/`

**Usage Context**:
- Component-store integration
- Reactive UI updates
- Store value subscription
- Performance optimization

**Available Hooks**:
- `useStoreValue`: Subscribe to store value with optional selector
- `useStore`: Full store access with value and setter
- `useComputedStore`: Subscribe to computed/derived values
- `usePersistedStore`: Store with persistence integration
- `useDynamicStore`: Dynamic store creation and management

**Example**:
```typescript
// Basic store subscription
function UserName() {
  const user = useStoreValue(userStore);
  return <span>{user.name}</span>;
}

// Selective subscription (performance optimization)
function UserEmail() {
  const email = useStoreValue(userStore, user => user.email);
  return <span>{email}</span>; // Only re-renders when email changes
}

// Computed store usage
const userDisplayStore = createComputedStore([userStore, settingsStore], 
  (user, settings) => ({
    displayName: settings.showFullName ? user.name : user.name.split(' ')[0],
    theme: settings.theme
  })
);

function UserDisplay() {
  const display = useStoreValue(userDisplayStore);
  return <div className={display.theme}>{display.displayName}</div>;
}
```

**Related Terms**: [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Computed Store](#computed-store), [Selective Subscription](#selective-subscription)

---

## Cross-Store Coordination

**Definition**: A pattern for coordinating actions across multiple stores within a single action handler, enabling complex business logic that spans multiple data domains.

**Code Reference**: Action handlers that access multiple stores

**Usage Context**:
- Complex business operations
- Multi-domain data updates
- Transaction-like behavior
- Data consistency maintenance

**Key Patterns**:
- Read from multiple stores before processing
- Validate constraints across stores
- Update multiple stores atomically
- Rollback on failures

**Example**:
```typescript
// Complex checkout process spanning multiple stores
actionRegister.register('checkout', async (payload, controller) => {
  // Read from multiple stores
  const cart = cartStore.getValue();
  const user = userStore.getValue();
  const inventory = inventoryStore.getValue();
  const payment = paymentStore.getValue();
  
  // Cross-store validation
  const unavailableItems = cart.items.filter(item => 
    inventory[item.id].quantity < item.quantity
  );
  
  if (unavailableItems.length > 0) {
    controller.abort('Some items are no longer available');
    return;
  }
  
  if (cart.total > user.creditLimit) {
    controller.abort('Exceeds credit limit');
    return;
  }
  
  // Coordinated updates across multiple stores
  try {
    // Create order
    const order = {
      id: generateOrderId(),
      userId: user.id,
      items: cart.items,
      total: cart.total,
      status: 'processing'
    };
    
    // Atomic-like updates
    orderStore.setValue(order);
    cartStore.setValue({ items: [], total: 0 });
    inventoryStore.update(inv => updateInventory(inv, cart.items));
    
    // External API call
    await paymentService.processPayment(order);
    
    orderStore.update(o => ({ ...o, status: 'confirmed' }));
    
  } catch (error) {
    // Rollback on failure
    orderStore.setValue(null);
    cartStore.setValue(cart);
    inventoryStore.update(inv => restoreInventory(inv, cart.items));
    controller.abort('Payment processing failed');
  }
});
```

**Related Terms**: [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Action Handler](./core-concepts.md#action-handler), [Atomic Updates](#atomic-updates)

---

## Async Operations

**Definition**: Asynchronous operations within action handlers that handle external API calls, database operations, and other non-blocking tasks while maintaining proper error handling and state management.

**Code Reference**: Async action handlers with `async/await` pattern

**Usage Context**:
- External API integration
- Database operations
- File system operations
- Time-delayed operations

**Key Features**:
- Proper error handling and rollback
- Loading state management
- Timeout and cancellation support
- Progress tracking capabilities

**Example**:
```typescript
// Async operation with loading states and error handling
actionRegister.register('fetchUserData', async (payload, controller) => {
  // Set loading state
  uiStore.update(ui => ({ ...ui, loading: true, error: null }));
  
  try {
    // External API call
    const userData = await api.getUserProfile(payload.userId);
    const preferences = await api.getUserPreferences(payload.userId);
    
    // Update multiple stores with API response
    userStore.setValue(userData);
    preferencesStore.setValue(preferences);
    
    // Log activity
    activityStore.update(activities => [...activities, {
      type: 'user_data_fetched',
      userId: payload.userId,
      timestamp: Date.now()
    }]);
    
  } catch (error) {
    // Error handling
    uiStore.update(ui => ({ 
      ...ui, 
      error: 'Failed to fetch user data',
      errorDetails: error.message 
    }));
    
    controller.abort('API request failed');
    
  } finally {
    // Always clear loading state
    uiStore.update(ui => ({ ...ui, loading: false }));
  }
});

// Usage with loading states in components
function UserProfile({ userId }: { userId: string }) {
  const user = useStoreValue(userStore);
  const ui = useStoreValue(uiStore);
  const dispatch = useActionDispatch();
  
  useEffect(() => {
    dispatch('fetchUserData', { userId });
  }, [userId, dispatch]);
  
  if (ui.loading) return <div>Loading...</div>;
  if (ui.error) return <div>Error: {ui.error}</div>;
  
  return <div>{user.name}</div>;
}
```

**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Error Handling](#error-handling), [Loading States](#loading-states)

---

## Action Dispatcher

**Definition**: A type-safe function interface that enables dispatching actions with proper payload validation and type checking.

**Code Reference**: `ActionDispatcher<T>` interface in `packages/core/src/types.ts`

**Usage Context**:
- Component action dispatch
- Type-safe action invocation
- Business logic triggering
- User interaction handling

**Key Features**:
- Overloaded for actions with and without payloads
- Compile-time type checking
- Async operation support
- Error propagation

**Example**:
```typescript
// Type-safe action dispatcher usage
interface AppActions extends ActionPayloadMap {
  increment: void;
  setCount: number;
  updateUser: { id: string; name: string };
}

function Counter() {
  const count = useStoreValue(counterStore);
  const dispatch = useActionDispatch<AppActions>();
  
  const handleIncrement = () => {
    dispatch('increment');  // ✓ Valid - no payload required
  };
  
  const handleSetCount = (value: number) => {
    dispatch('setCount', value);  // ✓ Valid - correct payload type
  };
  
  const handleUpdateUser = () => {
    dispatch('updateUser', { id: '123', name: 'John' });  // ✓ Valid
    // dispatch('updateUser');  // ✗ Type error - payload required
    // dispatch('setCount');    // ✗ Type error - payload required
  };
  
  return (
    <div>
      <span>Count: {count}</span>
      <button onClick={handleIncrement}>+</button>
      <button onClick={() => handleSetCount(0)}>Reset</button>
    </div>
  );
}
```

**Related Terms**: [Action Payload Map](./core-concepts.md#action-payload-map), [Type Safety](./architecture-terms.md#type-safety), [useActionDispatch](#useactiondispatch)

---

## Priority-based Execution

**Definition**: A handler execution strategy where action handlers are executed in order of their assigned priority values, with higher priorities running first.

**Code Reference**: Handler sorting logic in `ActionRegister.register()`

**Usage Context**:
- Handler execution order control
- Dependency management between handlers
- Critical operation prioritization
- Validation and preprocessing

**Key Features**:
- Numeric priority values (higher = first)
- Automatic sorting on registration
- Support for negative priorities
- Consistent execution order

**Example**:
```typescript
// Priority-based handler registration
actionRegister.register('processOrder', validateOrder, { 
  priority: 100,  // Runs first - validation
  id: 'order-validator'
});

actionRegister.register('processOrder', enrichOrderData, { 
  priority: 50,   // Runs second - data enrichment
  id: 'order-enricher'
});

actionRegister.register('processOrder', saveOrderToDatabase, { 
  priority: 10,   // Runs third - persistence
  id: 'order-persister'
});

actionRegister.register('processOrder', sendConfirmationEmail, { 
  priority: 0,    // Runs last - notifications
  id: 'order-notifier'
});

// When 'processOrder' is dispatched, handlers execute in priority order:
// 1. validateOrder (priority: 100)
// 2. enrichOrderData (priority: 50)  
// 3. saveOrderToDatabase (priority: 10)
// 4. sendConfirmationEmail (priority: 0)

// Critical error handler with highest priority
actionRegister.register('processOrder', emergencyOrderValidation, { 
  priority: 1000, // Always runs first
  blocking: true, // Blocks execution if it fails
  id: 'emergency-validator'
});
```

**Related Terms**: [Handler Configuration](./core-concepts.md#handler-configuration), [Action Handler](./core-concepts.md#action-handler), [Pipeline Execution](#pipeline-execution)

---

## Computed Store

**Definition**: A reactive store that derives its value from one or more source stores, automatically updating when dependencies change.

**Code Reference**: `createComputedStore` function and related hooks

**Usage Context**:
- Derived state calculation
- Performance optimization
- Complex data transformations
- Reactive computations

**Key Features**:
- Automatic dependency tracking
- Lazy computation
- Memoization for performance
- Multiple source store support

**Example**:
```typescript
// Simple computed store
const fullNameStore = createComputedStore([userStore], 
  (user) => `${user.firstName} ${user.lastName}`
);

// Complex computed store with multiple dependencies
const shoppingCartSummary = createComputedStore(
  [cartStore, inventoryStore, userStore, promoStore], 
  (cart, inventory, user, promos) => {
    // Filter available items
    const availableItems = cart.items.filter(item => 
      inventory[item.id]?.quantity >= item.quantity
    );
    
    // Calculate subtotal
    const subtotal = availableItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    // Apply user-specific discounts
    const discount = calculateDiscount(user.membershipLevel, subtotal, promos);
    
    // Calculate tax based on user location
    const tax = calculateTax(user.location, subtotal - discount);
    
    return {
      itemCount: availableItems.length,
      unavailableCount: cart.items.length - availableItems.length,
      subtotal,
      discount,
      tax,
      total: subtotal - discount + tax,
      isValid: availableItems.length > 0
    };
  }
);

// Usage in components
function CartSummary() {
  const summary = useStoreValue(shoppingCartSummary);
  
  return (
    <div>
      <div>Items: {summary.itemCount}</div>
      {summary.unavailableCount > 0 && (
        <div>Unavailable: {summary.unavailableCount}</div>
      )}
      <div>Subtotal: ${summary.subtotal}</div>
      <div>Discount: -${summary.discount}</div>
      <div>Tax: ${summary.tax}</div>
      <div>Total: ${summary.total}</div>
    </div>
  );
}
```

**Related Terms**: [Store Hooks](#store-hooks), [Reactive Updates](#reactive-updates), [Performance Optimization](#performance-optimization)

---

## Pipeline Context

**Definition**: Internal execution context that maintains state during action pipeline processing, including current payload, handler queue, and execution status.

**Code Reference**: `PipelineContext<T>` interface in `packages/core/src/types.ts`

**Usage Context**:
- Internal pipeline execution
- Handler coordination
- Execution state tracking
- Error handling and recovery

**Key Properties**:
- `action`: The action name being executed
- `payload`: Current payload (may be modified during execution)
- `handlers`: Array of registered handlers for the action
- `aborted`: Whether pipeline execution was aborted
- `abortReason`: Reason for abortion if applicable
- `currentIndex`: Current handler being executed

**Example**:
```typescript
// Pipeline context is used internally by ActionRegister
// Users typically don't interact with it directly, but understanding it helps
// with debugging and advanced usage

// Internal pipeline execution (simplified)
async function executePipeline<T>(context: PipelineContext<T>) {
  for (let i = 0; i < context.handlers.length; i++) {
    if (context.aborted) break;
    
    const handler = context.handlers[i];
    context.currentIndex = i;
    
    const controller = {
      abort: (reason?: string) => {
        context.aborted = true;
        context.abortReason = reason;
      },
      modifyPayload: (modifier: (payload: T) => T) => {
        context.payload = modifier(context.payload);
      },
      getPayload: () => context.payload
    };
    
    await handler.handler(context.payload, controller);
  }
}
```

**Related Terms**: [Pipeline Controller](./core-concepts.md#pipeline-controller), [Action Pipeline System](./core-concepts.md#action-pipeline-system), [Handler Execution](#handler-execution)