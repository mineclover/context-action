# useStoreValue Patterns

Core `useStoreValue` patterns for subscribing to store changes with selective updates, conditional subscriptions, and comparison strategies.

## Basic Store Subscription

```tsx
import { useStoreValue } from '@context-action/react';

// Simple subscription to entire store value
const user = useStoreValue(userStore);

// Subscribe to specific field only
const userName = useStoreValue(userStore, user => user.name);
```

## Selective Subscriptions

### Field Selection

```tsx
const userStore = createStore('user', { 
  id: '1', 
  name: 'John', 
  email: 'john@example.com',
  lastLoginAt: Date.now()
});

// Only re-renders when name changes, ignores email/id/lastLoginAt changes
const userName = useStoreValue(userStore, user => user.name);

// Multiple field selection
const userBasicInfo = useStoreValue(userStore, user => ({
  name: user.name,
  email: user.email
}));
```

### Deep Property Access

```tsx
const appStore = createStore('app', {
  user: {
    profile: { name: 'John', avatar: '/avatar.jpg' },
    settings: { theme: 'dark', notifications: true }
  },
  ui: { 
    modal: { isOpen: false, type: null },
    sidebar: { collapsed: true }
  }
});

// Access nested properties
const userName = useStoreValue(appStore, app => app.user.profile.name);
const isModalOpen = useStoreValue(appStore, app => app.ui.modal.isOpen);
const userTheme = useStoreValue(appStore, app => app.user.settings.theme);
```

## Conditional Subscriptions

### Dynamic Subscription Control

```tsx
const [subscribeToUpdates, setSubscribeToUpdates] = useState(true);

// Only subscribe when enabled
const liveData = useStoreValue(
  subscribeToUpdates ? dataStore : null,
  data => data?.liveMetrics
);

// Toggle subscription based on user preferences  
const notificationsEnabled = useStoreValue(settingsStore, s => s.notifications);
const notifications = useStoreValue(
  notificationsEnabled ? notificationStore : null,
  n => n?.unread
);
```

### Permission-Based Subscriptions

```tsx
function useProtectedStoreValue(store, selector, requiredRole) {
  const userRole = useStoreValue(userStore, user => user.role);
  const hasPermission = userRole === requiredRole || userRole === 'admin';
  
  return useStoreValue(
    hasPermission ? store : null,
    selector
  );
}

// Usage
const adminData = useProtectedStoreValue(
  adminStore,
  admin => admin.sensitiveData,
  'admin'
);
```

## Comparison Strategies

### Reference Comparison (Default)

```tsx
// Fast reference comparison - only updates when reference changes
const user = useStoreValue(userStore, undefined, {
  comparison: 'reference'
});
```

### Shallow Comparison

```tsx
const settingsStore = createStore('settings', {
  theme: 'light',
  language: 'en',
  notifications: { email: true, push: false }
});

// Re-renders only when top-level properties change
const settings = useStoreValue(settingsStore, undefined, { 
  comparison: 'shallow' 
});
```

### Deep Comparison

```tsx
// Most thorough but expensive - use sparingly
const complexData = useStoreValue(complexStore, undefined, {
  comparison: 'deep'
});
```

### Custom Comparison

```tsx
const userData = useStoreValue(userStore, user => user.profile, {
  customComparator: (prev, next) => {
    // Only update if name or avatar changed, ignore other fields
    return prev.name === next.name && prev.avatar === next.avatar;
  }
});
```

## Transformation Patterns

### Data Formatting

```tsx
const formattedUser = useStoreValue(userStore, user => ({
  displayName: `${user.firstName} ${user.lastName}`,
  initials: `${user.firstName[0]}${user.lastName[0]}`,
  memberSince: new Date(user.createdAt).toLocaleDateString(),
  status: user.isActive ? 'Active' : 'Inactive'
}));
```

### Computed Properties

```tsx
const userStats = useStoreValue(userStore, user => {
  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
  );
  
  return {
    ...user,
    daysSinceJoined,
    isNewUser: daysSinceJoined < 30,
    orderFrequency: user.totalOrders / Math.max(1, daysSinceJoined / 30)
  };
});
```

### Array Filtering and Mapping

```tsx
const activeUsers = useStoreValue(usersStore, users => 
  users.filter(user => user.isActive)
);

const userNames = useStoreValue(usersStore, users =>
  users.map(user => user.name)
);

const usersByRole = useStoreValue(usersStore, users =>
  users.reduce((acc, user) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {})
);
```

## Performance Optimizations

### Debounced Updates

```tsx
// Debounce rapid store changes
const debouncedValue = useStoreValue(fastChangingStore, undefined, {
  debounce: 300  // Wait 300ms after last change
});

// Useful for search inputs
const searchQuery = useStoreValue(searchStore, search => search.query, {
  debounce: 500
});
```

### Memoized Selectors

```tsx
import { useCallback } from 'react';

// Stable selector prevents unnecessary re-renders
const userName = useStoreValue(userStore, useCallback(
  user => user.name,
  [] // No dependencies
));

// Complex selector with stable reference
const processedData = useStoreValue(dataStore, useCallback(
  data => ({
    total: data.items.length,
    completed: data.items.filter(item => item.completed).length,
    progress: data.items.length > 0 
      ? data.items.filter(item => item.completed).length / data.items.length
      : 0
  }),
  []
));
```

## Error Handling

### Safe Property Access

```tsx
const safeUserData = useStoreValue(userStore, user => {
  try {
    return {
      name: user?.name || 'Unknown',
      email: user?.email || '',
      avatar: user?.profile?.avatar || '/default-avatar.png'
    };
  } catch (error) {
    console.error('Error accessing user data:', error);
    return { name: 'Error', email: '', avatar: '/default-avatar.png' };
  }
});
```

### Fallback Values

```tsx
const userDisplayName = useStoreValue(
  userStore, 
  user => user?.name || user?.email || 'Guest'
);

const themeSettings = useStoreValue(settingsStore, settings => ({
  theme: settings?.theme || 'light',
  fontSize: settings?.fontSize || 'medium',
  language: settings?.language || 'en'
}));
```

### Null Store Handling

```tsx
const conditionalData = useStoreValue(
  shouldLoad ? dataStore : null,
  data => data ? processData(data) : null
);
```

## Real-World Examples

### User Profile Display

```tsx
function UserProfile() {
  const userInfo = useStoreValue(userStore, user => ({
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    joinDate: new Date(user.createdAt).toLocaleDateString(),
    isOnline: Date.now() - user.lastSeenAt < 5 * 60 * 1000, // 5 minutes
    avatar: user.avatar || '/default-avatar.png'
  }));
  
  return (
    <div className="user-profile">
      <img src={userInfo.avatar} alt={userInfo.name} />
      <h2>{userInfo.name}</h2>
      <p>{userInfo.email}</p>
      <div className={`status ${userInfo.isOnline ? 'online' : 'offline'}`}>
        {userInfo.isOnline ? 'Online' : 'Offline'}
      </div>
      <small>Member since {userInfo.joinDate}</small>
    </div>
  );
}
```

### Shopping Cart Badge

```tsx
function CartBadge() {
  const cartInfo = useStoreValue(cartStore, cart => ({
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    hasItems: cart.items.length > 0,
    total: cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }));
  
  if (!cartInfo.hasItems) {
    return <CartIcon />;
  }
  
  return (
    <div className="cart-badge">
      <CartIcon />
      <span className="badge">{cartInfo.itemCount}</span>
      <span className="total">${cartInfo.total.toFixed(2)}</span>
    </div>
  );
}
```

### Search Results

```tsx
function SearchResults() {
  const searchState = useStoreValue(searchStore, search => ({
    query: search.query,
    results: search.results,
    isLoading: search.isLoading,
    hasError: search.error !== null
  }));
  
  // Debounce search query updates
  const debouncedQuery = useStoreValue(searchStore, s => s.query, {
    debounce: 300
  });
  
  if (!searchState.query) {
    return <div>Enter a search term</div>;
  }
  
  if (searchState.isLoading) {
    return <div>Searching for "{debouncedQuery}"...</div>;
  }
  
  if (searchState.hasError) {
    return <div>Error searching for "{searchState.query}"</div>;
  }
  
  return (
    <div>
      <h3>Results for "{searchState.query}" ({searchState.results.length})</h3>
      {searchState.results.map(result => (
        <div key={result.id}>{result.title}</div>
      ))}
    </div>
  );
}
```

## Best Practices

### 1. Use Specific Selectors

```tsx
// ✅ Good: Select only what you need
const userName = useStoreValue(userStore, user => user.name);

// ❌ Avoid: Subscribing to entire store when only name is needed
const user = useStoreValue(userStore);
return <div>{user.name}</div>;
```

### 2. Memoize Complex Selectors

```tsx
// ✅ Good: Memoized selector
const processedData = useStoreValue(dataStore, useCallback(
  data => expensiveProcessing(data),
  []
));

// ❌ Avoid: New function on every render
const processedData = useStoreValue(dataStore, data => expensiveProcessing(data));
```

### 3. Handle Edge Cases

```tsx
// ✅ Good: Safe property access
const userName = useStoreValue(userStore, user => user?.name || 'Guest');

// ❌ Avoid: Assuming properties exist
const userName = useStoreValue(userStore, user => user.name);
```

### 4. Choose Appropriate Comparison Strategy

```tsx
// For primitives - use reference (default)
const count = useStoreValue(countStore);

// For objects with shallow changes - use shallow
const settings = useStoreValue(settingsStore, undefined, { comparison: 'shallow' });

// For deep nested objects - use deep sparingly
const complexData = useStoreValue(complexStore, undefined, { comparison: 'deep' });
```

## Related Patterns

- [useStoreSelector Patterns](./useStoreSelector-patterns.md) - Multiple store selection patterns
- [useComputedStore Patterns](./useComputedStore-patterns.md) - Computed value patterns
- [Performance Patterns](./performance-patterns.md) - Performance optimization techniques
- [useStoreManager API](./useStoreManager-api.md) - Low-level store management