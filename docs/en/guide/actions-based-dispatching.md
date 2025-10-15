# Actions-based Dispatching

Action-based dispatching provides a more intuitive and function-like approach to dispatching actions in Context-Action. Instead of using the traditional `registry.dispatch()` method, you can call actions directly as functions through the `registry.actions` property.

## Overview

The `actions` property provides a function-based interface where each registered action becomes a callable function. This approach offers better developer experience with improved type safety and more intuitive syntax.

```typescript
// Traditional approach
await registry.dispatch('userLogin', { userId: '123', email: 'user@example.com' });

// Actions-based approach
await registry.actions.userLogin({ userId: '123', email: 'user@example.com' });
```

## Basic Usage

### 1. Define Action Types

First, define your action types using the `ActionPayloadMap` interface:

```typescript
interface AppActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
  userLogout: void;
  processData: { data: any; type: string };
  sendNotification: { message: string; userId: string };
  resetApp: void;
}
```

### 2. Create ActionRegister

Create an ActionRegister instance with your action types:

```typescript
const registry = new ActionRegister<AppActions>({
  name: 'MyApp',
  registry: { debug: true }
});
```

### 3. Register Handlers

Register handlers for your actions:

```typescript
registry.register('userLogin', (payload) => {
  console.log('User logged in:', payload.userId, payload.email);
  return { success: true };
}, { id: 'login-handler', priority: 100 });

registry.register('userLogout', () => {
  console.log('User logged out');
  return { success: true };
}, { id: 'logout-handler', priority: 100 });
```

### 4. Dispatch Actions

Use the actions-based approach to dispatch actions:

```typescript
// Actions with payload
await registry.actions.userLogin({ userId: '123', email: 'user@example.com' });
await registry.actions.processData({ data: { name: 'test' }, type: 'json' });
await registry.actions.sendNotification({ message: 'Hello!', userId: '123' });

// Actions without payload
await registry.actions.userLogout();
await registry.actions.resetApp();
```

## Advanced Features

### Options Support

Actions-based dispatching supports all the same options as traditional dispatching:

```typescript
// With execution options
await registry.actions.processData(
  { data: { name: 'test2' }, type: 'json' },
  { executionMode: 'parallel' }
);

// With debounce
await registry.actions.sendNotification(
  { message: 'Debounced message', userId: '456' },
  { debounce: 100 }
);

// With throttle
await registry.actions.userLogin(
  { userId: '789', email: 'throttled@example.com' },
  { throttle: 1000 }
);
```

### Type Safety

The actions-based approach provides excellent type safety:

```typescript
// ✅ Correct usage - TypeScript will provide autocomplete
await registry.actions.userLogin({ userId: '123', email: 'user@example.com' });

// ❌ TypeScript error - wrong payload structure
// await registry.actions.userLogin({ wrongField: 'value' });

// ❌ TypeScript error - payload not allowed for void actions
// await registry.actions.userLogout({ payload: 'should not exist' });
```

### Filtering and Advanced Options

You can use all the advanced filtering and execution options:

```typescript
// With filtering
await registry.actions.processData(
  { data: { name: 'test' }, type: 'json' },
  {
    filter: {
      handlerIds: ['data-processor'],
      priority: { min: 80 }
    }
  }
);

// With result collection
const result = await registry.actions.processData(
  { data: { name: 'test' }, type: 'json' },
  {
    result: { collect: true, strategy: 'all' }
  }
);
```

## Benefits

### 1. **Intuitive Syntax**
Actions-based dispatching feels more natural and function-like:

```typescript
// More intuitive
await registry.actions.userLogin(credentials);

// vs traditional
await registry.dispatch('userLogin', credentials);
```

### 2. **Better Type Safety**
Full TypeScript support with autocomplete and compile-time error checking:

```typescript
// IDE will show autocomplete for action names
registry.actions. // ← Shows: userLogin, userLogout, processData, etc.

// IDE will show autocomplete for payload structure
registry.actions.userLogin({ // ← Shows: userId, email properties
```

### 3. **Consistent API**
All actions follow the same pattern regardless of whether they have payloads:

```typescript
// Actions with payload
await registry.actions.userLogin(payload);
await registry.actions.processData(payload);

// Actions without payload
await registry.actions.userLogout();
await registry.actions.resetApp();
```

### 4. **Full Feature Support**
All traditional dispatch features are available:

- Execution modes (sequential, parallel, race)
- Filtering (by handler ID, priority, custom filters)
- Throttling and debouncing
- Result collection
- Abort signals
- Error handling

## Migration from Traditional Dispatch

If you're currently using traditional dispatch, migration is straightforward:

```typescript
// Before
await registry.dispatch('userLogin', { userId: '123', email: 'user@example.com' });
await registry.dispatch('userLogout', undefined);
await registry.dispatch('processData', { data: {} }, { executionMode: 'parallel' });

// After
await registry.actions.userLogin({ userId: '123', email: 'user@example.com' });
await registry.actions.userLogout();
await registry.actions.processData({ data: {} }, { executionMode: 'parallel' });
```

## Best Practices

### 1. **Use Descriptive Action Names**
Choose action names that clearly describe what they do:

```typescript
// Good
userLogin, processPayment, sendNotification

// Avoid
action1, doSomething, handle
```

### 2. **Define Clear Payload Types**
Use specific types for your payloads:

```typescript
interface AppActions extends ActionPayloadMap {
  userLogin: { 
    userId: string; 
    email: string; 
    rememberMe?: boolean;
  };
  processPayment: {
    amount: number;
    currency: string;
    paymentMethod: 'card' | 'bank' | 'paypal';
  };
}
```

### 3. **Handle Errors Appropriately**
Use proper error handling in your handlers:

```typescript
registry.register('processPayment', async (payload) => {
  try {
    const result = await paymentService.process(payload);
    return { success: true, transactionId: result.id };
  } catch (error) {
    console.error('Payment failed:', error);
    throw error; // Re-throw to let the framework handle it
  }
});
```

### 4. **Use Options Wisely**
Apply execution options based on your use case:

```typescript
// For user interactions that might be repeated
await registry.actions.saveDraft(
  { content: draftContent },
  { debounce: 500 }
);

// For expensive operations
await registry.actions.generateReport(
  { reportType: 'monthly' },
  { executionMode: 'parallel' }
);
```

## Examples

### Complete Example

```typescript
import { ActionRegister, ActionPayloadMap } from '@context-action/core';

interface ECommerceActions extends ActionPayloadMap {
  addToCart: { productId: string; quantity: number };
  removeFromCart: { productId: string };
  checkout: { paymentMethod: string };
  clearCart: void;
}

async function ecommerceExample() {
  const registry = new ActionRegister<ECommerceActions>({
    name: 'ECommerce',
    registry: { debug: true }
  });

  // Register handlers
  registry.register('addToCart', (payload) => {
    console.log(`Added ${payload.quantity} of product ${payload.productId} to cart`);
    return { success: true };
  });

  registry.register('removeFromCart', (payload) => {
    console.log(`Removed product ${payload.productId} from cart`);
    return { success: true };
  });

  registry.register('checkout', async (payload) => {
    console.log(`Processing checkout with ${payload.paymentMethod}`);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, orderId: 'order-123' };
  });

  registry.register('clearCart', () => {
    console.log('Cart cleared');
    return { success: true };
  });

  // Use actions-based dispatching
  await registry.actions.addToCart({ productId: 'prod-1', quantity: 2 });
  await registry.actions.addToCart({ productId: 'prod-2', quantity: 1 });
  
  // Checkout with options
  const result = await registry.actions.checkout(
    { paymentMethod: 'card' },
    { executionMode: 'parallel' }
  );
  
  console.log('Checkout result:', result);
  
  // Clear cart
  await registry.actions.clearCart();
}

ecommerceExample().catch(console.error);
```

Actions-based dispatching provides a more intuitive and developer-friendly way to work with Context-Action, while maintaining all the power and flexibility of the traditional approach.
