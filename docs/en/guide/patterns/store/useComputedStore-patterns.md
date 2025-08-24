# useComputedStore Patterns

Computed value patterns using `useComputedStore` for derived state, performance optimization, and reactive calculations.

## Basic Computed Values

### Simple Derived State

```tsx
import { useComputedStore } from '@context-action/react';

const userStore = createStore('user', { firstName: 'John', lastName: 'Doe' });

// Computed full name
const fullName = useComputedStore(
  [userStore],
  ([user]) => `${user.firstName} ${user.lastName}`
);
```

### Multi-Store Computations

```tsx
const totalPrice = useComputedStore(
  [cartStore, discountStore, taxStore],
  ([cart, discount, tax]) => {
    const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0);
    const discountAmount = subtotal * (discount.percentage / 100);
    const taxAmount = (subtotal - discountAmount) * (tax.rate / 100);
    
    return {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: subtotal - discountAmount + taxAmount
    };
  }
);
```

## Advanced Computed Patterns

### Conditional Computations

```tsx
const userStatus = useComputedStore(
  [userStore, activityStore, settingsStore],
  ([user, activity, settings]) => {
    if (!user.isActive) return 'inactive';
    
    const lastActivity = Date.now() - activity.lastSeen;
    const threshold = settings.activityTimeout * 1000;
    
    if (lastActivity < threshold) {
      return 'online';
    } else if (lastActivity < threshold * 2) {
      return 'away';
    } else {
      return 'offline';
    }
  }
);
```

### Complex Object Transformations

```tsx
const dashboardStats = useComputedStore(
  [usersStore, ordersStore, productsStore, settingsStore],
  ([users, orders, products, settings]) => {
    const activeUsers = users.filter(u => u.isActive).length;
    const todayOrders = orders.filter(o => 
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    );
    
    return {
      users: {
        active: activeUsers,
        total: users.length,
        growthRate: ((activeUsers / users.length) * 100).toFixed(2)
      },
      orders: {
        today: todayOrders.length,
        revenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
        averageValue: todayOrders.length > 0 
          ? (todayOrders.reduce((sum, o) => sum + o.total, 0) / todayOrders.length)
          : 0
      },
      products: {
        total: products.length,
        inStock: products.filter(p => p.stock > 0).length,
        lowStock: products.filter(p => p.stock < settings.lowStockThreshold).length
      }
    };
  }
);
```

## Performance Optimization

### Caching with Custom Keys

```tsx
const expensiveComputation = useComputedStore(
  [dataStore, configStore],
  ([data, config]) => heavyProcessing(data, config),
  {
    comparison: 'deep',
    cacheKey: 'expensive-calc',
    debug: true
  }
);
```

### Memoized Dependencies

```tsx
const optimizedComputation = useComputedStore(
  [userStore, settingsStore],
  useMemo(() => ([user, settings]) => {
    // Expensive computation here
    return processUserData(user, settings);
  }, []),
  {
    comparison: 'shallow'
  }
);
```

### Selective Updates

```tsx
const userProfile = useComputedStore(
  [userStore, preferencesStore],
  ([user, preferences]) => ({
    // Only recompute when specific fields change
    displayName: user.firstName + ' ' + user.lastName,
    theme: preferences.darkMode ? 'dark' : 'light',
    // Ignore other user/preference changes
  }),
  {
    ignoreKeys: ['lastLoginAt', 'sessionToken'] // Ignore these user fields
  }
);
```

## Computed Store Instances

### Creating Reusable Computed Stores

```tsx
const userStore = createStore('user', { name: 'John', score: 85 });
const settingsStore = createStore('settings', { showBadges: true });

// Create a computed store instance
const userBadgeStore = useComputedStoreInstance(
  [userStore, settingsStore],
  ([user, settings]) => {
    if (!settings.showBadges) return null;
    
    return {
      name: user.name,
      level: user.score >= 80 ? 'expert' : 'beginner',
      badge: user.score >= 90 ? '🏆' : user.score >= 70 ? '🥉' : '📖'
    };
  },
  { name: 'userBadge' }
);

// Use in other components
function BadgeDisplay() {
  const badge = useStoreValue(userBadgeStore);
  return badge ? <div>{badge.badge} {badge.name}</div> : null;
}
```

### Chained Computations

```tsx
// First level computation
const processedDataStore = useComputedStoreInstance(
  [rawDataStore],
  ([rawData]) => processRawData(rawData),
  { name: 'processedData' }
);

// Second level computation using first result
const analysisResultStore = useComputedStoreInstance(
  [processedDataStore, configStore],
  ([processedData, config]) => analyzeData(processedData, config),
  { name: 'analysisResult' }
);
```

## Async Computed Patterns

### Basic Async Computation

```tsx
const userIdStore = createStore('userId', '123');

const userProfile = useAsyncComputedStore(
  [userIdStore],
  async ([userId]) => {
    if (!userId) return null;
    
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  {
    initialValue: null,
    name: 'userProfile'
  }
);

// Returns: { value, loading, error, reload }
function UserProfile() {
  const { value: user, loading, error, reload } = userProfile;
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message} <button onClick={reload}>Retry</button></div>;
  if (!user) return <div>No user found</div>;
  
  return <div>Hello, {user.name}!</div>;
}
```

### Complex Async Dependencies

```tsx
const searchResults = useAsyncComputedStore(
  [searchQueryStore, filtersStore, sortStore],
  async ([query, filters, sort]) => {
    if (!query.trim()) return [];
    
    const params = new URLSearchParams({
      q: query,
      filters: JSON.stringify(filters),
      sort: sort.field,
      order: sort.direction
    });
    
    const response = await fetch(`/api/search?${params}`);
    const data = await response.json();
    
    return data.results;
  },
  {
    initialValue: [],
    debounce: 300, // Debounce requests
    name: 'searchResults'
  }
);
```

## Real-World Examples

### E-commerce Cart Calculator

```tsx
function useCartCalculator() {
  const cartTotal = useComputedStore(
    [cartStore, userStore, discountStore, shippingStore, taxStore],
    ([cart, user, discount, shipping, tax]) => {
      const subtotal = cart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      // Apply user-specific discounts
      let discountAmount = 0;
      if (user.isPremium) {
        discountAmount += subtotal * 0.1; // 10% premium discount
      }
      if (discount.code && discount.isValid) {
        discountAmount += discount.type === 'percentage' 
          ? subtotal * (discount.value / 100)
          : discount.value;
      }
      
      const afterDiscount = Math.max(0, subtotal - discountAmount);
      
      // Calculate shipping
      const shippingCost = user.isPremium && afterDiscount > 50 
        ? 0 // Free shipping for premium users over $50
        : shipping.cost;
      
      // Calculate tax
      const taxAmount = (afterDiscount + shippingCost) * (tax.rate / 100);
      
      const total = afterDiscount + shippingCost + taxAmount;
      
      return {
        subtotal,
        discount: discountAmount,
        shipping: shippingCost,
        tax: taxAmount,
        total,
        savings: discountAmount + (user.isPremium ? shipping.cost : 0)
      };
    }
  );
  
  return cartTotal;
}
```

### User Permission Calculator

```tsx
const userPermissions = useComputedStore(
  [userStore, roleStore, organizationStore, featureFlagsStore],
  ([user, roles, organization, features]) => {
    const userRoles = roles.filter(role => 
      user.roleIds.includes(role.id)
    );
    
    const basePermissions = userRoles.reduce((perms, role) => 
      [...perms, ...role.permissions], []
    );
    
    // Organization-specific permissions
    const orgPermissions = organization.permissions || [];
    
    // Feature flag overrides
    const enabledFeatures = Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);
    
    return {
      canRead: basePermissions.includes('read') || orgPermissions.includes('read'),
      canWrite: basePermissions.includes('write') && enabledFeatures.includes('write'),
      canDelete: basePermissions.includes('delete') && user.isAdmin,
      canAdmin: user.isAdmin && organization.allowAdmin,
      features: enabledFeatures,
      level: user.isAdmin ? 'admin' : userRoles.some(r => r.name === 'moderator') ? 'moderator' : 'user'
    };
  }
);
```

## Error Handling

### Safe Computations

```tsx
const safeComputation = useComputedStore(
  [dataStore, configStore],
  ([data, config]) => {
    try {
      return processData(data, config);
    } catch (error) {
      console.error('Computation error:', error);
      return { error: error.message, data: null };
    }
  }
);
```

### Fallback Values

```tsx
const withFallbacks = useComputedStore(
  [userStore, settingsStore],
  ([user, settings]) => {
    const displayName = user?.name || user?.email || 'Anonymous';
    const theme = settings?.theme || 'light';
    const language = settings?.language || 'en';
    
    return {
      displayName,
      theme,
      language,
      isComplete: !!(user?.name && user?.email)
    };
  }
);
```

## Best Practices

### 1. Keep Computations Pure

```tsx
// ✅ Good: Pure computation
const userStatus = useComputedStore(
  [userStore, activityStore],
  ([user, activity]) => {
    const timeSinceActive = Date.now() - activity.lastSeen;
    return timeSinceActive < 5000 ? 'online' : 'offline';
  }
);

// ❌ Avoid: Side effects in computation
const userStatus = useComputedStore(
  [userStore],
  ([user]) => {
    updateAnalytics(user); // Side effect!
    return user.status;
  }
);
```

### 2. Use Appropriate Comparison Strategies

```tsx
// For primitive values
const simpleComputation = useComputedStore([store], compute, {
  comparison: 'reference' // Default, fastest
});

// For objects with shallow changes
const objectComputation = useComputedStore([store], compute, {
  comparison: 'shallow'
});

// For complex nested objects
const deepComputation = useComputedStore([store], compute, {
  comparison: 'deep' // Most thorough, slower
});
```

### 3. Optimize Expensive Computations

```tsx
// Use caching for expensive operations
const expensiveResult = useComputedStore(
  [largeDataStore],
  ([data]) => heavyProcessing(data),
  {
    cacheKey: 'heavy-processing',
    comparison: 'shallow'
  }
);
```

## Related Patterns

- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic store subscription patterns
- [useStoreSelector Patterns](./useStoreSelector-patterns.md) - Multiple store selection
- [Performance Patterns](./performance-patterns.md) - Performance optimization techniques