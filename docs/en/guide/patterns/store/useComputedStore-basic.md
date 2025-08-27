# Basic useComputedStore Patterns

Basic patterns for computed values using `useComputedStore` to derive state from one or more stores.

## Import
```typescript
import { useComputedStore, useStoreValue } from '@context-action/react';
import { useUserStore, useProductStore, useUIStore } from '../setup/stores'; // From setup guide
```

## Prerequisites

For complete setup instructions including store definitions, context creation, and provider configuration, see **[Basic Store Setup](../setup/basic-store-setup.md)**.

This document demonstrates computed store patterns using the store setup:
- Store type definitions → [Type Definitions](../setup/basic-store-setup.md#type-definitions)  
- Context creation → [Store Context Creation](../setup/basic-store-setup.md#store-context-creation)
- Provider setup → [Provider Configuration](../setup/basic-store-setup.md#provider-configuration)

## Simple Derived State

Compute values from a single store:

```tsx
import { useComputedStore } from '@context-action/react';
import { useUserStore } from '../setup/stores';

function UserDisplayName() {
  const profileStore = useUserStore('profile');
  
  // Computed full name from profile store
  const fullName = useComputedStore(
    [profileStore],
    ([profile]) => `${profile.name} (${profile.role})`
  );
  
  return <div>Welcome, {fullName}</div>;
}
```

## Multi-Store Computations

Combine data from multiple stores:

```tsx
import { useProductStore, useUserStore } from '../setup/stores';

function CartCalculator() {
  const cartStore = useProductStore('cart');
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const cartSummary = useComputedStore(
    [cartStore, profileStore, preferencesStore],
    ([cart, profile, preferences]) => {
      const subtotal = cart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      // Apply user role discount
      const roleDiscount = profile.role === 'admin' ? 0.2 : 0;
      const discountAmount = subtotal * roleDiscount;
      
      // Apply currency preference
      const currency = preferences.language === 'ko' ? '₩' : '$';
      const total = subtotal - discountAmount;
      
      return {
        subtotal: `${currency}${subtotal.toFixed(2)}`,
        discount: `${currency}${discountAmount.toFixed(2)}`,
        total: `${currency}${total.toFixed(2)}`,
        itemCount: cart.items.length
      };
    }
  );
  
  return (
    <div>
      <div>Subtotal: {cartSummary.subtotal}</div>
      <div>Discount: -{cartSummary.discount}</div>
      <div>Total: {cartSummary.total}</div>
      <div>Items: {cartSummary.itemCount}</div>
    </div>
  );
}
```

## When to Use Basic Computed Patterns

### Simple Derived State
- **Data Formatting**: Converting raw data to display format
- **String Concatenation**: Combining multiple fields
- **Simple Calculations**: Basic arithmetic operations
- **Status Derivation**: Computing status from state values

### Multi-Store Computations
- **Cross-Domain Calculations**: Combining data from different domains
- **User-Specific Customization**: Personalizing data based on user preferences
- **Complex Business Logic**: Implementing rules that span multiple stores
- **Aggregated Views**: Creating summary data from multiple sources

## Best Practices

### ✅ Do
- Keep computation functions pure (no side effects)
- Use descriptive variable names for computed values
- Group related stores together in dependency arrays
- Consider performance impact of complex computations

### ❌ Avoid
- Performing side effects in computation functions
- Creating unnecessary computations for simple data access
- Omitting dependencies that affect the computation
- Complex nested computations (split into smaller computed values)

## Related Patterns

- [Advanced useComputedStore Patterns](./useComputedStore-advanced.md) - Complex computation patterns
- [Async Computed Patterns](./useComputedStore-async.md) - Asynchronous computations
- [Computed Store Performance](./useComputedStore-performance.md) - Optimization techniques
- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns