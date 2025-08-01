# Architecture Terms

MVVM architecture and design patterns used throughout the Context-Action framework.

## MVVM Pattern

**Definition**: Model-View-ViewModel architectural pattern adapted for React applications with centralized state management and action-based business logic.

**Code Reference**: Framework-wide implementation across all packages

**Usage Context**:
- Application architecture design
- Separation of concerns implementation
- Scalable application structure
- Clean code organization

**Key Characteristics**:
- **View**: React components handling presentation
- **ViewModel**: Action handlers containing business logic
- **Model**: Stores managing application state
- Unidirectional data flow via actions
- Type-safe communication between layers

**Example**:
```typescript
// View Layer (React Component)
function UserProfile() {
  const user = useStoreValue(userStore);  // Model layer
  const dispatch = useActionDispatch();   // ViewModel layer
  
  const updateName = (name: string) => {
    dispatch('updateUser', { id: user.id, name });  // Dispatch to ViewModel
  };
  
  return <div>{user.name}</div>;  // View presentation
}

// ViewModel Layer (Action Handler)
actionRegister.register('updateUser', async (payload, controller) => {
  const currentUser = userStore.getValue();  // Model layer access
  userStore.setValue({ ...currentUser, ...payload });  // Model update
});
```

**Related Terms**: [View Layer](#view-layer), [ViewModel Layer](#viewmodel-layer), [Model Layer](#model-layer), [Unidirectional Data Flow](#unidirectional-data-flow)

---

## View Layer

**Definition**: The presentation layer consisting of React components responsible for rendering UI and capturing user interactions.

**Code Reference**: React components using Context-Action hooks

**Usage Context**:
- User interface rendering
- User interaction handling
- Store subscription for reactive updates
- Action dispatch for business logic

**Responsibilities**:
- ✅ **DO**: Handle presentation and user interaction
- ✅ **DO**: Subscribe to relevant stores
- ✅ **DO**: Dispatch actions with payloads
- ❌ **DON'T**: Contain business logic
- ❌ **DON'T**: Directly manipulate store state
- ❌ **DON'T**: Make API calls or side effects

**Example**:
```typescript
function ShoppingCart() {
  // Store subscriptions (Model layer)
  const cart = useStoreValue(cartStore);
  const user = useStoreValue(userStore);
  
  // Action dispatcher (ViewModel layer)
  const dispatch = useActionDispatch();
  
  // User interaction handlers
  const handleAddItem = (item: CartItem) => {
    dispatch('addToCart', { userId: user.id, item });
  };
  
  const handleCheckout = () => {
    dispatch('checkout', { cartId: cart.id });
  };
  
  // Presentation
  return (
    <div>
      <h2>Shopping Cart ({cart.items.length})</h2>
      {cart.items.map(item => (
        <CartItem key={item.id} item={item} />
      ))}
      <button onClick={handleCheckout}>Checkout</button>
    </div>
  );
}
```

**Related Terms**: [ViewModel Layer](#viewmodel-layer), [Model Layer](#model-layer), [Store Hooks](./api-terms.md#store-hooks), [Action Dispatcher](./api-terms.md#action-dispatcher)

---

## ViewModel Layer

**Definition**: The business logic layer implemented through action handlers that process user actions and coordinate between View and Model layers.

**Code Reference**: Action handlers registered via `ActionRegister`

**Usage Context**:
- Business logic implementation
- State transformation and validation
- Cross-store coordination
- Side effect management

**Responsibilities**:
- ✅ **DO**: Implement business logic and validation
- ✅ **DO**: Coordinate multiple stores
- ✅ **DO**: Handle async operations and side effects
- ✅ **DO**: Provide error handling and rollback
- ❌ **DON'T**: Directly manipulate DOM
- ❌ **DON'T**: Handle presentation logic
- ❌ **DON'T**: Maintain local state

**Example**:
```typescript
// Business logic in ViewModel layer
actionRegister.register('processPayment', async (payload, controller) => {
  // Read current state (Model layer)
  const order = orderStore.getValue();
  const user = userStore.getValue();
  const payment = paymentStore.getValue();
  
  // Business validation
  if (!payment.isValid) {
    controller.abort('Invalid payment method');
    return;
  }
  
  if (order.total > user.creditLimit) {
    controller.abort('Insufficient credit limit');
    return;
  }
  
  // Update state (Model layer)
  orderStore.update(o => ({ ...o, status: 'processing' }));
  
  // Side effects (external API calls)
  try {
    const result = await paymentService.processPayment({
      amount: order.total,
      paymentMethod: payment.method
    });
    
    orderStore.update(o => ({ ...o, status: 'completed', transactionId: result.id }));
  } catch (error) {
    orderStore.update(o => ({ ...o, status: 'failed' }));
    controller.abort('Payment processing failed');
  }
});
```

**Related Terms**: [View Layer](#view-layer), [Model Layer](#model-layer), [Action Handler](./core-concepts.md#action-handler), [Business Logic](#business-logic)

---

## Model Layer

**Definition**: The data management layer consisting of stores that handle application state, persistence, and change notifications.

**Code Reference**: Store implementations and `StoreRegistry`

**Usage Context**:
- Application state management
- Data persistence and retrieval
- Change notification to subscribers
- Computed value derivation

**Responsibilities**:
- ✅ **DO**: Manage application state
- ✅ **DO**: Provide controlled access to data
- ✅ **DO**: Notify subscribers of changes
- ✅ **DO**: Integrate with persistence layers
- ❌ **DON'T**: Contain business logic
- ❌ **DON'T**: Handle UI concerns
- ❌ **DON'T**: Make direct API calls

**Example**:
```typescript
// Store definition (Model layer)
interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

const userStore = createStore<User>({
  id: '',
  name: '',
  email: '',
  preferences: defaultPreferences
});

// Computed store (derived state)
const userDisplayStore = createComputedStore(
  [userStore, settingsStore], 
  (user, settings) => ({
    displayName: settings.showFullName ? user.name : user.name.split(' ')[0],
    avatar: generateAvatar(user.id, settings.theme),
    isOnline: user.lastActivity > Date.now() - 300000
  })
);

// Store usage in components (reactive)
function UserHeader() {
  const userDisplay = useStoreValue(userDisplayStore);
  return <div>{userDisplay.displayName}</div>;
}
```

**Related Terms**: [View Layer](#view-layer), [ViewModel Layer](#viewmodel-layer), [Store Registry](./core-concepts.md#store-registry), [Computed Store](./api-terms.md#computed-store)

---

## Lazy Evaluation

**Definition**: A design pattern where store values are retrieved at execution time rather than at registration time, ensuring handlers always receive fresh state.

**Code Reference**: Store getter pattern in action handlers

**Usage Context**:
- Action handler implementation
- State consistency guarantee
- Avoiding stale closure issues
- Dynamic state access

**Key Benefits**:
- Eliminates stale closure problems
- Guarantees fresh state values
- Supports dynamic store content
- Enables flexible handler composition

**Example**:
```typescript
// Lazy evaluation in action handlers
actionRegister.register('updateCart', (payload, controller) => {
  // getValue() called at execution time, not registration time
  const currentCart = cartStore.getValue();    // Always fresh
  const userPrefs = preferencesStore.getValue(); // Always current
  const inventory = inventoryStore.getValue();   // Always up-to-date
  
  // Process with guaranteed fresh values
  const updatedCart = processCartUpdate(currentCart, payload, userPrefs, inventory);
  cartStore.setValue(updatedCart);
});

// Contrast with problematic closure pattern
const badPattern = () => {
  const cart = cartStore.getValue(); // Captured at closure creation
  
  return actionRegister.register('updateCart', (payload, controller) => {
    // 'cart' might be stale here!
    const updatedCart = { ...cart, ...payload };
    cartStore.setValue(updatedCart);
  });
};
```

**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Fresh State Access](#fresh-state-access)

---

## Decoupled Architecture

**Definition**: An architectural approach where components, actions, and stores are loosely coupled, communicating through well-defined interfaces rather than direct dependencies.

**Code Reference**: Framework-wide separation of concerns

**Usage Context**:
- System design and organization
- Module independence
- Testing and maintenance
- Scalability planning

**Key Principles**:
- Actions don't know about components
- Stores don't know about actions  
- Components only know action names and payloads
- Communication through standardized interfaces

**Benefits**:
- Independent testing of each layer
- Easy refactoring and maintenance
- Reusable business logic
- Clear separation of concerns

**Example**:
```typescript
// Decoupled component (View layer)
function ProductCard({ productId }: { productId: string }) {
  const product = useStoreValue(productStore, store => store[productId]);
  const dispatch = useActionDispatch();
  
  // Component only knows action name and payload structure
  const handleAddToCart = () => {
    dispatch('addToCart', { productId, quantity: 1 });
  };
  
  return <button onClick={handleAddToCart}>Add to Cart</button>;
}

// Decoupled action handler (ViewModel layer)  
actionRegister.register('addToCart', async (payload, controller) => {
  // Handler doesn't know about components
  const cart = cartStore.getValue();
  const product = productStore.getValue()[payload.productId];
  
  // Business logic independent of UI
  cartStore.update(cart => ({
    ...cart,
    items: [...cart.items, { ...product, quantity: payload.quantity }]
  }));
});

// Decoupled store (Model layer)
const cartStore = createStore<Cart>({
  items: [],
  total: 0
});
// Store doesn't know about actions or components
```

**Related Terms**: [MVVM Pattern](#mvvm-pattern), [Separation of Concerns](#separation-of-concerns), [Loose Coupling](#loose-coupling)

---

## Unidirectional Data Flow

**Definition**: A data flow pattern where information moves in a single direction: from user interactions through actions to state updates and back to UI rendering.

**Code Reference**: Action dispatch and store subscription pattern

**Usage Context**:
- Data flow design
- State management predictability
- Debugging and traceability
- Performance optimization

**Flow Sequence**:
1. **User Interaction** → Component captures event
2. **Action Dispatch** → Component dispatches action with payload
3. **Handler Execution** → ViewModel processes business logic
4. **State Update** → Model layer updates stores
5. **Component Re-render** → View layer reflects changes

**Example**:
```typescript
// Complete unidirectional flow example
function Counter() {
  // 5. Component receives updated state
  const count = useStoreValue(counterStore);
  const dispatch = useActionDispatch();
  
  // 1. User interaction
  const handleIncrement = () => {
    // 2. Action dispatch
    dispatch('increment', { amount: 1 });
  };
  
  return <button onClick={handleIncrement}>Count: {count}</button>;
}

// 3. Handler execution (ViewModel)
actionRegister.register('increment', (payload, controller) => {
  const current = counterStore.getValue();
  // 4. State update (Model)
  counterStore.setValue(current + payload.amount);
});
```

**Related Terms**: [MVVM Pattern](#mvvm-pattern), [Action Pipeline System](./core-concepts.md#action-pipeline-system), [Predictable State Updates](#predictable-state-updates)

---

## Type Safety

**Definition**: Compile-time type checking that ensures type correctness across all layers of the architecture, from action payloads to store values.

**Code Reference**: TypeScript interfaces and generic types throughout the framework

**Usage Context**:
- Development-time error prevention
- API contract enforcement
- Refactoring safety
- Developer experience enhancement

**Key Features**:
- Strongly typed action payloads
- Type-safe store access
- Compile-time interface validation
- Generic type propagation

**Example**:
```typescript
// Type-safe action definition
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email?: string };
  deleteUser: { id: string };
  incrementCounter: void;
}

const actionRegister = new ActionRegister<AppActions>();

// Compile-time type checking
await actionRegister.dispatch('updateUser', { 
  id: '123', 
  name: 'John',
  email: 'john@example.com' 
}); // ✓ Valid

await actionRegister.dispatch('updateUser', { 
  id: '123' 
}); // ✗ Type error: missing 'name'

await actionRegister.dispatch('incrementCounter'); // ✓ Valid

await actionRegister.dispatch('incrementCounter', { count: 1 }); // ✗ Type error: unexpected payload

// Type-safe handler registration
actionRegister.register('updateUser', (payload, controller) => {
  // payload is correctly typed as { id: string; name: string; email?: string }
  console.log(payload.name); // ✓ Valid
  console.log(payload.age);  // ✗ Type error: property doesn't exist
});
```

**Related Terms**: [Action Payload Map](./core-concepts.md#action-payload-map), [Action Handler](./core-concepts.md#action-handler), [Compile-time Validation](#compile-time-validation)

---

## Business Logic

**Definition**: The core application rules, processes, and workflows that define how data is processed and business requirements are implemented.

**Code Reference**: Logic implemented within action handlers

**Usage Context**:
- Action handler implementation
- Validation and processing rules
- Workflow orchestration
- Domain-specific operations

**Characteristics**:
- Centralized in ViewModel layer (action handlers)
- Independent of UI presentation
- Testable in isolation
- Reusable across different interfaces

**Example**:
```typescript
// Business logic for order processing
actionRegister.register('processOrder', async (payload, controller) => {
  // Business rules and validation
  const order = orderStore.getValue();
  const customer = customerStore.getValue();
  const inventory = inventoryStore.getValue();
  
  // Rule: Customer must have valid payment method
  if (!customer.paymentMethods.some(pm => pm.isValid)) {
    controller.abort('No valid payment method');
    return;
  }
  
  // Rule: All items must be in stock
  const unavailableItems = order.items.filter(item => 
    inventory[item.productId].quantity < item.quantity
  );
  
  if (unavailableItems.length > 0) {
    controller.abort('Some items are out of stock');
    return;
  }
  
  // Business process: Calculate totals with tax and discounts
  const subtotal = order.items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  
  const discount = calculateCustomerDiscount(customer, subtotal);
  const tax = calculateTax(customer.location, subtotal - discount);
  const total = subtotal - discount + tax;
  
  // Rule: Order total must not exceed customer credit limit
  if (total > customer.creditLimit) {
    controller.abort('Order exceeds credit limit');
    return;
  }
  
  // Business process: Update order and inventory
  orderStore.update(o => ({
    ...o,
    subtotal,
    discount,
    tax,
    total,
    status: 'confirmed'
  }));
  
  // Update inventory
  inventoryStore.update(inv => {
    const newInv = { ...inv };
    order.items.forEach(item => {
      newInv[item.productId].quantity -= item.quantity;
    });
    return newInv;
  });
});
```

**Related Terms**: [ViewModel Layer](#viewmodel-layer), [Action Handler](./core-concepts.md#action-handler), [Domain Rules](#domain-rules)