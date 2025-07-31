# Store Integration Patterns

## Overview

Store integration in the Context-Action framework enables seamless coordination between **Actions** (business logic) and **Stores** (state management). This guide covers advanced patterns for integrating actions with single and multiple stores, managing complex state transitions, and implementing robust error handling.

### Core Integration Principles

- **🔄 Lazy Evaluation**: Store values are fetched at execution time, ensuring fresh state
- **🎯 Atomic Operations**: Related state changes are coordinated together
- **🛡️ Error Recovery**: Rollback strategies for failed operations
- **⚡ Performance**: Optimized store updates and subscriptions
- **🧪 Testability**: Mock-friendly architecture for isolated testing

## Basic Store Integration

### 1. Single Store Operations

The simplest form of store integration involves actions that read from and write to a single store.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  updatedAt: number;
}

const userStore = createStore<User>({
  id: '',
  name: '',
  email: '',
  updatedAt: 0
});

// Simple single-store action
actionRegister.register('updateUserName', async (payload: { name: string }, controller) => {
  // Read current state
  const currentUser = userStore.getValue();
  
  // Validation (business logic)
  if (!payload.name.trim()) {
    controller.abort('Name cannot be empty');
    return;
  }
  
  // Update store with new state
  userStore.setValue({
    ...currentUser,
    name: payload.name,
    updatedAt: Date.now()
  });
});
```

### 2. Store Update Patterns

#### setValue() - Complete Replacement
```typescript
// Replace entire store value
userStore.setValue({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  updatedAt: Date.now()
});
```

#### update() - Partial Updates
```typescript
// Update specific fields while preserving others
userStore.update(user => ({
  ...user,
  name: 'Jane Doe',
  updatedAt: Date.now()
}));

// Array updates
todoStore.update(todos => [
  ...todos.filter(todo => todo.id !== payload.id),
  { ...payload, updatedAt: Date.now() }
]);
```

## Multi-Store Coordination

### 1. Cross-Store Read Operations

Actions often need to read from multiple stores to make informed decisions.

```typescript
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

const cartStore = createStore<{ items: CartItem[] }>({ items: [] });
const inventoryStore = createStore<Record<string, Product>>({});
const userStore = createStore<User>({ id: '', name: '', email: '', updatedAt: 0 });

actionRegister.register('addToCart', async (payload: { productId: string; quantity: number }, controller) => {
  // Read from multiple stores
  const cart = cartStore.getValue();
  const inventory = inventoryStore.getValue();
  const user = userStore.getValue();
  
  // Business logic using multiple store values
  const product = inventory[payload.productId];
  if (!product) {
    controller.abort('Product not found');
    return;
  }
  
  if (product.stock < payload.quantity) {
    controller.abort(`Only ${product.stock} items available`);
    return;
  }
  
  // Check user permissions
  if (!user.id) {
    controller.abort('User must be logged in');
    return;
  }
  
  // Update cart with validated data
  const existingItem = cart.items.find(item => item.productId === payload.productId);
  
  if (existingItem) {
    cartStore.update(cart => ({
      items: cart.items.map(item =>
        item.productId === payload.productId
          ? { ...item, quantity: item.quantity + payload.quantity }
          : item
      )
    }));
  } else {
    cartStore.update(cart => ({
      items: [...cart.items, {
        id: generateId(),
        productId: payload.productId,
        quantity: payload.quantity,
        price: product.price
      }]
    }));
  }
});
```

### 2. Coordinated Store Updates

Complex operations often require updating multiple stores in coordination.

```typescript
actionRegister.register('processCheckout', async (payload: { paymentMethod: string }, controller) => {
  // Read current state from multiple stores
  const cart = cartStore.getValue();
  const user = userStore.getValue();
  const inventory = inventoryStore.getValue();
  
  // Validation phase
  if (cart.items.length === 0) {
    controller.abort('Cart is empty');
    return;
  }
  
  // Check inventory availability for all items
  const unavailableItems = cart.items.filter(item => 
    inventory[item.productId]?.stock < item.quantity
  );
  
  if (unavailableItems.length > 0) {
    controller.abort('Some items are no longer available');
    return;
  }
  
  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = calculateTax(subtotal, user.location);
  const total = subtotal + tax;
  
  // Create order object
  const order = {
    id: generateOrderId(),
    userId: user.id,
    items: cart.items,
    subtotal,
    tax,
    total,
    paymentMethod: payload.paymentMethod,
    status: 'processing' as const,
    createdAt: Date.now()
  };
  
  try {
    // Update multiple stores atomically
    orderStore.setValue(order);
    cartStore.setValue({ items: [] });
    
    // Update inventory
    inventoryStore.update(inventory => {
      const updatedInventory = { ...inventory };
      cart.items.forEach(item => {
        if (updatedInventory[item.productId]) {
          updatedInventory[item.productId] = {
            ...updatedInventory[item.productId],
            stock: updatedInventory[item.productId].stock - item.quantity
          };
        }
      });
      return updatedInventory;
    });
    
    // Process payment (async operation)
    await processPayment(order);
    
    // Update order status on successful payment
    orderStore.update(order => ({ ...order, status: 'confirmed' }));
    
  } catch (error) {
    // Rollback on failure
    orderStore.setValue(null);
    cartStore.setValue(cart); // Restore original cart
    
    // Restore inventory
    inventoryStore.update(inventory => {
      const restoredInventory = { ...inventory };
      cart.items.forEach(item => {
        if (restoredInventory[item.productId]) {
          restoredInventory[item.productId] = {
            ...restoredInventory[item.productId],
            stock: restoredInventory[item.productId].stock + item.quantity
          };
        }
      });
      return restoredInventory;
    });
    
    controller.abort('Payment processing failed');
  }
});
```

## Advanced Integration Patterns

### 1. Computed Store Integration

Computed stores automatically derive values from other stores, and actions can both read from and trigger recomputation.

```typescript
// Computed store for cart summary
const cartSummaryStore = createComputedStore(
  [cartStore, inventoryStore, userStore],
  (cart, inventory, user) => {
    const validItems = cart.items.filter(item => 
      inventory[item.productId] && inventory[item.productId].stock >= item.quantity
    );
    
    const subtotal = validItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    const discount = calculateDiscount(user.membershipLevel, subtotal);
    const tax = calculateTax(subtotal - discount, user.location);
    
    return {
      itemCount: validItems.length,
      invalidItemCount: cart.items.length - validItems.length,
      subtotal,
      discount,
      tax,
      total: subtotal - discount + tax,
      hasInvalidItems: validItems.length < cart.items.length
    };
  }
);

// Action that reads from computed store
actionRegister.register('validateCartBeforeCheckout', async (payload, controller) => {
  const summary = cartSummaryStore.getValue();
  
  if (summary.hasInvalidItems) {
    controller.abort(`${summary.invalidItemCount} items are no longer available`);
    return;
  }
  
  if (summary.total <= 0) {
    controller.abort('Cart total must be greater than zero');
    return;
  }
  
  // Proceed with checkout validation
  return { valid: true, summary };
});
```

### 2. State Synchronization Patterns

#### Master-Detail Synchronization
```typescript
const userListStore = createStore<User[]>([]);
const selectedUserStore = createStore<User | null>(null);

actionRegister.register('selectUser', async (payload: { userId: string }, controller) => {
  const users = userListStore.getValue();
  const selectedUser = users.find(user => user.id === payload.userId);
  
  if (!selectedUser) {
    controller.abort('User not found');
    return;
  }
  
  selectedUserStore.setValue(selectedUser);
});

actionRegister.register('updateSelectedUser', async (payload: Partial<User>, controller) => {
  const currentUser = selectedUserStore.getValue();
  if (!currentUser) {
    controller.abort('No user selected');
    return;
  }
  
  const updatedUser = { ...currentUser, ...payload, updatedAt: Date.now() };
  
  // Update both selected user and user list
  selectedUserStore.setValue(updatedUser);
  userListStore.update(users => 
    users.map(user => user.id === updatedUser.id ? updatedUser : user)
  );
});
```

#### Cache Synchronization
```typescript
const userCacheStore = createStore<Record<string, User>>({});
const currentUserStore = createStore<User | null>(null);

actionRegister.register('loadUser', async (payload: { userId: string }, controller) => {
  const cache = userCacheStore.getValue();
  
  // Check cache first
  if (cache[payload.userId]) {
    currentUserStore.setValue(cache[payload.userId]);
    return;
  }
  
  try {
    // Fetch from API
    const user = await api.getUser(payload.userId);
    
    // Update both cache and current user
    userCacheStore.update(cache => ({ ...cache, [user.id]: user }));
    currentUserStore.setValue(user);
  } catch (error) {
    controller.abort('Failed to load user');
  }
});
```

### 3. Transaction-like Operations

For operations that need to update multiple stores atomically, you can implement transaction-like patterns.

```typescript
interface Transaction {
  id: string;
  operations: Array<{
    store: string;
    oldValue: any;
    newValue: any;
  }>;
  committed: boolean;
}

const transactionStore = createStore<Transaction | null>(null);

actionRegister.register('beginTransaction', async (payload, controller) => {
  const transaction: Transaction = {
    id: generateTransactionId(),
    operations: [],
    committed: false
  };
  
  transactionStore.setValue(transaction);
});

actionRegister.register('transferFunds', async (payload: { fromAccount: string; toAccount: string; amount: number }, controller) => {
  const accounts = accountStore.getValue();
  const transaction = transactionStore.getValue();
  
  if (!transaction) {
    controller.abort('No active transaction');
    return;
  }
  
  const fromAccount = accounts[payload.fromAccount];
  const toAccount = accounts[payload.toAccount];
  
  if (!fromAccount || !toAccount) {
    controller.abort('Account not found');
    return;
  }
  
  if (fromAccount.balance < payload.amount) {
    controller.abort('Insufficient funds');
    return;
  }
  
  try {
    // Record operations for rollback
    const updatedTransaction = {
      ...transaction,
      operations: [
        ...transaction.operations,
        {
          store: 'accounts',
          oldValue: accounts,
          newValue: {
            ...accounts,
            [payload.fromAccount]: {
              ...fromAccount,
              balance: fromAccount.balance - payload.amount
            },
            [payload.toAccount]: {
              ...toAccount,
              balance: toAccount.balance + payload.amount
            }
          }
        }
      ]
    };
    
    transactionStore.setValue(updatedTransaction);
    
    // Apply changes
    accountStore.setValue(updatedTransaction.operations[0].newValue);
    
    // Commit transaction
    await api.recordTransaction({
      from: payload.fromAccount,
      to: payload.toAccount,
      amount: payload.amount
    });
    
    transactionStore.update(tx => tx ? { ...tx, committed: true } : null);
    
  } catch (error) {
    // Rollback on failure
    const operations = transaction.operations;
    if (operations.length > 0) {
      accountStore.setValue(operations[0].oldValue);
    }
    
    transactionStore.setValue(null);
    controller.abort('Transaction failed');
  }
});
```

## Error Handling and Recovery

### 1. Rollback Strategies

```typescript
actionRegister.register('complexUpdate', async (payload, controller) => {
  // Capture original state for rollback
  const originalUser = userStore.getValue();
  const originalSettings = settingsStore.getValue();
  const originalPreferences = preferencesStore.getValue();
  
  try {
    // Step 1: Update user
    userStore.setValue({
      ...originalUser,
      ...payload.user,
      updatedAt: Date.now()
    });
    
    // Step 2: Update settings
    settingsStore.setValue({
      ...originalSettings,
      ...payload.settings
    });
    
    // Step 3: Async operation that might fail
    await api.syncUserData({
      user: userStore.getValue(),
      settings: settingsStore.getValue()
    });
    
    // Step 4: Update preferences
    preferencesStore.setValue({
      ...originalPreferences,
      ...payload.preferences
    });
    
  } catch (error) {
    // Rollback all changes
    userStore.setValue(originalUser);
    settingsStore.setValue(originalSettings);
    preferencesStore.setValue(originalPreferences);
    
    controller.abort(`Update failed: ${error.message}`);
  }
});
```

### 2. Compensation Actions

```typescript
actionRegister.register('processOrder', async (payload, controller) => {
  const compensationActions: Array<() => Promise<void>> = [];
  
  try {
    // Step 1: Reserve inventory
    await reserveInventory(payload.items);
    compensationActions.push(() => releaseInventory(payload.items));
    
    // Step 2: Process payment
    const paymentResult = await processPayment(payload.payment);
    compensationActions.push(() => refundPayment(paymentResult.transactionId));
    
    // Step 3: Create order
    const order = await createOrder(payload);
    orderStore.setValue(order);
    
    // Step 4: Send confirmation
    await sendOrderConfirmation(order);
    
  } catch (error) {
    // Execute compensation actions in reverse order
    for (const compensate of compensationActions.reverse()) {
      try {
        await compensate();
      } catch (compensationError) {
        console.error('Compensation failed:', compensationError);
      }
    }
    
    controller.abort(`Order processing failed: ${error.message}`);
  }
});
```

## Performance Optimization

### 1. Batching Store Updates

```typescript
// ❌ Inefficient: Multiple individual updates
actionRegister.register('updateUserProfile', async (payload, controller) => {
  userStore.update(user => ({ ...user, name: payload.name }));
  userStore.update(user => ({ ...user, email: payload.email }));
  userStore.update(user => ({ ...user, phone: payload.phone }));
  userStore.update(user => ({ ...user, updatedAt: Date.now() }));
});

// ✅ Efficient: Single batched update
actionRegister.register('updateUserProfile', async (payload, controller) => {
  userStore.update(user => ({
    ...user,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    updatedAt: Date.now()
  }));
});
```

### 2. Conditional Updates

```typescript
actionRegister.register('updateUserIfChanged', async (payload, controller) => {
  const currentUser = userStore.getValue();
  
  // Check if update is actually needed
  const hasChanges = 
    currentUser.name !== payload.name ||
    currentUser.email !== payload.email ||
    currentUser.phone !== payload.phone;
  
  if (!hasChanges) {
    return; // No update needed
  }
  
  userStore.setValue({
    ...currentUser,
    ...payload,
    updatedAt: Date.now()
  });
});
```

### 3. Selective Store Notifications

```typescript
// Use store selectors to minimize re-renders
const userName = useStoreValue(userStore, user => user.name);
const userEmail = useStoreValue(userStore, user => user.email);

// Component only re-renders when name changes, not on other user properties
function UserNameDisplay() {
  const name = useStoreValue(userStore, user => user.name);
  return <div>{name}</div>;
}
```

## Testing Store Integration

### 1. Unit Testing Actions with Mock Stores

```typescript
describe('updateUser action', () => {
  let mockUserStore: jest.Mocked<Store<User>>;
  let mockSettingsStore: jest.Mocked<Store<Settings>>;
  
  beforeEach(() => {
    mockUserStore = {
      getValue: jest.fn(),
      setValue: jest.fn(),
      update: jest.fn(),
      subscribe: jest.fn()
    };
    
    mockSettingsStore = {
      getValue: jest.fn(),
      setValue: jest.fn(),
      update: jest.fn(),
      subscribe: jest.fn()
    };
  });
  
  it('should update user with valid data', async () => {
    // Arrange
    const currentUser = { id: '1', name: 'John', email: 'john@example.com', updatedAt: 0 };
    const settings = { validateNames: true };
    
    mockUserStore.getValue.mockReturnValue(currentUser);
    mockSettingsStore.getValue.mockReturnValue(settings);
    
    const payload = { name: 'Jane Doe' };
    const controller = { abort: jest.fn() };
    
    // Act
    await updateUserHandler(payload, controller);
    
    // Assert
    expect(mockUserStore.setValue).toHaveBeenCalledWith({
      ...currentUser,
      name: 'Jane Doe',
      updatedAt: expect.any(Number)
    });
    expect(controller.abort).not.toHaveBeenCalled();
  });
  
  it('should abort with invalid name when validation is enabled', async () => {
    // Arrange
    const currentUser = { id: '1', name: 'John', email: 'john@example.com', updatedAt: 0 };
    const settings = { validateNames: true };
    
    mockUserStore.getValue.mockReturnValue(currentUser);
    mockSettingsStore.getValue.mockReturnValue(settings);
    
    const payload = { name: '' };
    const controller = { abort: jest.fn() };
    
    // Act
    await updateUserHandler(payload, controller);
    
    // Assert
    expect(controller.abort).toHaveBeenCalledWith('Name cannot be empty');
    expect(mockUserStore.setValue).not.toHaveBeenCalled();
  });
});
```

### 2. Integration Testing with Real Stores

```typescript
describe('Cart Operations Integration', () => {
  let cartStore: Store<{ items: CartItem[] }>;
  let inventoryStore: Store<Record<string, Product>>;
  
  beforeEach(() => {
    cartStore = createStore({ items: [] });
    inventoryStore = createStore({
      'product1': { id: 'product1', name: 'Product 1', stock: 10, price: 99.99 },
      'product2': { id: 'product2', name: 'Product 2', stock: 5, price: 149.99 }
    });
  });
  
  it('should add item to cart when inventory is available', async () => {
    // Arrange
    const payload = { productId: 'product1', quantity: 2 };
    const controller = { abort: jest.fn() };
    
    // Act
    await addToCartHandler(payload, controller);
    
    // Assert
    const cart = cartStore.getValue();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      productId: 'product1',
      quantity: 2,
      price: 99.99
    });
    expect(controller.abort).not.toHaveBeenCalled();
  });
  
  it('should abort when insufficient inventory', async () => {
    // Arrange
    const payload = { productId: 'product2', quantity: 10 }; // Only 5 in stock
    const controller = { abort: jest.fn() };
    
    // Act
    await addToCartHandler(payload, controller);
    
    // Assert
    expect(controller.abort).toHaveBeenCalledWith('Only 5 items available');
    
    const cart = cartStore.getValue();
    expect(cart.items).toHaveLength(0);
  });
});
```

## Best Practices

### ✅ Store Integration Do's

1. **Always Read Fresh State**: Use `getValue()` at execution time, not in closures
2. **Validate Before Updating**: Check business rules before making changes
3. **Handle Errors Gracefully**: Implement rollback strategies for complex operations
4. **Use Atomic Updates**: Coordinate related changes together
5. **Test Integration Points**: Write tests for multi-store operations
6. **Document Business Logic**: Comment complex coordination patterns
7. **Use TypeScript**: Leverage type safety for store operations

### ❌ Store Integration Don'ts

1. **Don't Store References**: Don't cache store values across async operations
2. **Don't Skip Validation**: Always validate data before store updates
3. **Don't Ignore Failures**: Handle errors and provide meaningful feedback
4. **Don't Update Stores Directly**: Always go through action handlers
5. **Don't Forget Cleanup**: Handle cleanup in error scenarios
6. **Don't Overcomplicate**: Start simple and add complexity gradually
7. **Don't Skip Testing**: Test both success and failure scenarios

## Common Patterns Summary

| Pattern | Use Case | Complexity | Benefits |
|---------|----------|------------|----------|
| Single Store Update | Simple CRUD operations | Low | Easy to understand and test |
| Multi-Store Read | Validation with multiple data sources | Medium | Comprehensive validation |
| Coordinated Updates | Transaction-like operations | High | Data consistency |
| Computed Store Integration | Derived state calculations | Medium | Automatic recomputation |
| Rollback Strategy | Error recovery | High | Data integrity |
| State Synchronization | Master-detail relationships | Medium | Consistency across views |

## Related Resources

- [Architecture Overview](./architecture.md) - Comprehensive architecture guide with implementation patterns
- [Architecture Diagrams](./architecture-diagrams.md) - Visual diagrams of store integration flows
- [MVVM Architecture Guide](./mvvm-architecture.md) - Overall architecture patterns
- [Data Flow Patterns](./data-flow-patterns.md) - Advanced data flow techniques
- [Best Practices](./best-practices.md) - Development best practices
- [API Reference - Stores](/api/stores/) - Store API documentation
- [Examples - MVVM Patterns](/examples/mvvm-patterns/) - Practical examples