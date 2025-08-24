# useStoreSelector Patterns

Multiple store selection patterns with `useStoreSelector` for combining and transforming data from multiple stores.

## Basic Multi-Store Selection

```tsx
import { useStoreSelector } from '@context-action/react';

// Select from multiple stores
const { user, settings, theme } = useStoreSelector({
  user: userStore,
  settings: settingsStore,  
  theme: themeStore
}, {
  user: user => ({ name: user.name, email: user.email }),
  settings: settings => settings.language,
  theme: theme => theme
});
```

## Advanced Selection Patterns

### Complex Data Transformation

```tsx
const profileData = useStoreSelector({
  user: userStore,
  profile: profileStore,
  permissions: permissionsStore
}, {
  user: user => user.id,
  profile: profile => ({ avatar: profile.avatar, bio: profile.bio }),
  permissions: perms => perms.canEdit
}, {
  comparison: 'deep'
});
```

### Conditional Store Selection

```tsx
const conditionalData = useStoreSelector(
  shouldLoad ? { data: dataStore } : {},
  shouldLoad ? { data: data => data.processed } : {}
);
```

### Nested Store Access

```tsx
const nestedSelection = useStoreSelector({
  app: appStore,
  user: userStore
}, {
  app: app => app.ui.modal.isOpen,
  user: user => user.profile.preferences.notifications
});
```

## Performance Optimization

### Memoized Selectors

```tsx
const memoizedSelector = useCallback((stores) => ({
  user: stores.user.name,
  settings: stores.settings.theme,
  computed: stores.user.score * stores.settings.multiplier
}), []);

const data = useStoreSelector({
  user: userStore,
  settings: settingsStore
}, memoizedSelector);
```

### Selective Re-rendering

```tsx
// Only re-renders when specific fields change
const criticalData = useStoreSelector({
  user: userStore,
  cart: cartStore,
  orders: ordersStore
}, {
  user: user => user.id, // Only ID changes trigger re-render
  cart: cart => cart.itemCount,
  orders: orders => orders.pending.length
}, {
  comparison: 'shallow'
});
```

## Real-World Examples

### Dashboard Data Aggregation

```tsx
function DashboardData() {
  const dashboardData = useStoreSelector({
    user: userStore,
    analytics: analyticsStore,
    notifications: notificationStore,
    settings: settingsStore
  }, {
    user: user => ({
      name: user.name,
      role: user.role,
      lastLogin: user.lastLogin
    }),
    analytics: analytics => ({
      totalViews: analytics.views.total,
      todayViews: analytics.views.today,
      conversion: analytics.conversion.rate
    }),
    notifications: notifications => ({
      unread: notifications.unread.length,
      urgent: notifications.urgent.length
    }),
    settings: settings => ({
      darkMode: settings.theme === 'dark',
      language: settings.language
    })
  });

  return (
    <div>
      <h1>Welcome, {dashboardData.user.name}</h1>
      <div>Views Today: {dashboardData.analytics.todayViews}</div>
      <div>Unread: {dashboardData.notifications.unread}</div>
    </div>
  );
}
```

### Shopping Cart Summary

```tsx
function CartSummary() {
  const cartSummary = useStoreSelector({
    cart: cartStore,
    user: userStore,
    discount: discountStore,
    shipping: shippingStore
  }, {
    cart: cart => ({
      items: cart.items,
      subtotal: cart.items.reduce((sum, item) => sum + item.price, 0)
    }),
    user: user => ({
      isPremium: user.membership === 'premium',
      shippingAddress: user.addresses.shipping
    }),
    discount: discount => ({
      code: discount.active?.code,
      amount: discount.active?.amount || 0
    }),
    shipping: shipping => ({
      method: shipping.selected,
      cost: shipping.cost
    })
  });

  const total = cartSummary.cart.subtotal - 
                cartSummary.discount.amount + 
                cartSummary.shipping.cost;

  return (
    <div>
      <div>Subtotal: ${cartSummary.cart.subtotal}</div>
      <div>Discount: ${cartSummary.discount.amount}</div>
      <div>Shipping: ${cartSummary.shipping.cost}</div>
      <div>Total: ${total}</div>
    </div>
  );
}
```

## Error Handling

### Safe Store Access

```tsx
const safeData = useStoreSelector({
  user: userStore,
  profile: profileStore
}, {
  user: user => {
    try {
      return user ? { name: user.name, id: user.id } : null;
    } catch (error) {
      console.error('Error accessing user data:', error);
      return null;
    }
  },
  profile: profile => {
    try {
      return profile?.avatar ? { avatar: profile.avatar } : { avatar: '/default.png' };
    } catch (error) {
      return { avatar: '/default.png' };
    }
  }
});
```

### Fallback Values

```tsx
const dataWithFallbacks = useStoreSelector({
  user: userStore,
  settings: settingsStore
}, {
  user: user => ({
    name: user?.name || 'Guest',
    email: user?.email || 'no-email',
    role: user?.role || 'user'
  }),
  settings: settings => ({
    theme: settings?.theme || 'light',
    language: settings?.language || 'en'
  })
});
```

## TypeScript Support

```tsx
interface UserData {
  name: string;
  email: string;
}

interface SettingsData {
  theme: 'light' | 'dark';
  language: string;
}

// Type-safe selector
const typedData = useStoreSelector({
  user: userStore as Store<UserData>,
  settings: settingsStore as Store<SettingsData>
}, {
  user: (user: UserData) => ({ displayName: user.name }),
  settings: (settings: SettingsData) => ({ isDark: settings.theme === 'dark' })
});
```

## Best Practices

### 1. Keep Selectors Pure

```tsx
// ✅ Good: Pure selector
const userData = useStoreSelector({
  user: userStore
}, {
  user: user => ({ name: user.name, email: user.email })
});

// ❌ Avoid: Side effects in selector
const userData = useStoreSelector({
  user: userStore
}, {
  user: user => {
    console.log('User accessed'); // Side effect
    return { name: user.name };
  }
});
```

### 2. Minimize Selected Data

```tsx
// ✅ Good: Select only what you need
const userName = useStoreSelector({
  user: userStore
}, {
  user: user => user.name
});

// ❌ Avoid: Selecting entire objects unnecessarily
const user = useStoreSelector({
  user: userStore
}, {
  user: user => user // Returns entire user object
});
```

### 3. Use Memoization for Expensive Selectors

```tsx
const expensiveSelector = useMemo(() => ({
  user: userStore,
  data: dataStore
}), [userStore, dataStore]);

const processedData = useStoreSelector(expensiveSelector, {
  user: user => user.id,
  data: data => expensiveDataProcessing(data)
});
```

## Related Patterns

- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic store subscription patterns
- [useComputedStore Patterns](./useComputedStore-patterns.md) - Computed value patterns
- [Performance Patterns](./performance-patterns.md) - Performance optimization techniques