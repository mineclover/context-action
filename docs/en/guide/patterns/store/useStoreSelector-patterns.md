# useStoreSelector Patterns

Advanced store selection patterns with `useStoreSelector` for selective subscription and performance optimization.

## Prerequisites

This guide builds upon the Setup specification. Ensure you have:
- Basic understanding of [Store Setup Patterns](../setup/store-setup.md)
- Familiarity with `UserStores` and `ProductStores` naming patterns
- Knowledge of [Store Provider Setup](../setup/provider-setup.md)

## Core Features

The `useStoreSelector` hook provides:
- **Selective Subscription**: Subscribe to specific parts of store data only
- **Automatic Selector Stabilization**: Internal `useRef` ensures selectors work without memoization
- **Performance Optimization**: Prevents unnecessary re-renders through intelligent equality checking
- **Type Safety**: Full TypeScript support with generic type parameters

## Internal Selector Stabilization

**Key Feature**: `useStoreSelector` internally uses `useRef` to stabilize selector functions, meaning **you can pass inline selectors without performance issues**:

```tsx
import { useStoreSelector, useMultiStoreSelector } from '@context-action/react';

// Using Setup-based UserStores pattern
const { useUserStore } = UserStores();
const { useProductStore } = ProductStores();

function UserProfile() {
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');
  const productStore = useProductStore('cart');

  // ✅ This works efficiently without useCallback!
  const userName = useStoreSelector(userStore, user => user.name);

  // ✅ Inline selectors are automatically stabilized
  const userDisplay = useStoreSelector(userStore, user => 
    `${user.firstName} ${user.lastName} (${user.role})`
  );

  // ✅ Multi-store selectors also work without memoization
  const dashboardData = useMultiStoreSelector(
    [userStore, settingsStore, productStore],
    ([user, settings, cart]) => ({
      user: { name: user.name, role: user.role },
      theme: settings.theme,
      cartItems: cart.items.length
    })
  );

  return <div>{userDisplay} - Cart: {dashboardData.cartItems}</div>;
}
```

**How it works internally**:
- Selector functions are stored in `useRef` to maintain stable references
- Even if you pass new inline functions on each render, they work efficiently
- Development mode shows helpful warnings but doesn't break functionality
- No need for `useCallback` unless you want to optimize further

## Basic Single Store Selection

Using Setup-based UserStores pattern:

```tsx
function UserProfile() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');

  // Select specific field
  const userName = useStoreSelector(userStore, user => user.name);

  // Select computed value
  const userDisplayName = useStoreSelector(
    userStore, 
    user => `${user.firstName} ${user.lastName}`
  );

  // Select nested properties
  const userTheme = useStoreSelector(
    settingsStore, 
    settings => settings.preferences.theme
  );

  return (
    <div>
      <h2>{userDisplayName}</h2>
      <p>Theme: {userTheme}</p>
    </div>
  );
}
```

## Multi-Store Selection with useMultiStoreSelector

Combining UserStores and ProductStores patterns:

```tsx
function Dashboard() {
  const { useUserStore } = UserStores();
  const { useProductStore } = ProductStores();
  
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');
  const notificationStore = useUserStore('notifications');
  const cartStore = useProductStore('cart');

  // Combine data from multiple stores
  const dashboardData = useMultiStoreSelector(
    [userStore, settingsStore, notificationStore],
    ([user, settings, notifications]) => ({
      userName: user.name,
      theme: settings.theme,
      unreadCount: notifications.filter(n => !n.read).length
    })
  );

  // Cart with user context
  const cartSummary = useMultiStoreSelector(
    [cartStore, userStore],
    ([cart, user]) => ({
      itemCount: cart.items.length,
      total: cart.total,
      isPremium: user.membership === 'premium'
    })
  );

  return (
    <div>
      <h1>Welcome {dashboardData.userName}</h1>
      <p>Theme: {dashboardData.theme}</p>
      <p>Notifications: {dashboardData.unreadCount}</p>
      <p>Cart: {cartSummary.itemCount} items (${cartSummary.total})</p>
      {cartSummary.isPremium && <span>Premium Member</span>}
    </div>
  );
}
```

## Advanced Selection Patterns

### Path-based Selection with useStorePathSelector

Using Setup-based store access:

```tsx
function UserSettings() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');

  // Access nested properties by path
  const userTheme = useStorePathSelector(userStore, ['profile', 'preferences', 'theme']);
  const emailEnabled = useStorePathSelector(settingsStore, ['notifications', 'email']);

  return (
    <div>
      <p>Current theme: {userTheme}</p>
      <p>Email notifications: {emailEnabled ? 'On' : 'Off'}</p>
    </div>
  );
}
```

### Conditional Store Selection

Using Setup-based conditional access:

```tsx
function ConditionalUserData({ shouldLoad }) {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');

  // Conditional subscription
  const userData = useStoreSelector(
    shouldLoad ? userStore : null,
    user => user?.name || 'Not loaded'
  );

  return <div>{userData}</div>;
}
```

## Performance Optimization

### Equality Functions

```tsx
import { shallowEqual, deepEqual } from '@context-action/react';

function PerformanceOptimizedUser() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');

  // Reference equality (default) - fastest
  const userName = useStoreSelector(userStore, user => user.name);

  // Shallow equality for objects
  const userInfo = useStoreSelector(
    userStore,
    user => ({ name: user.name, email: user.email }),
    shallowEqual
  );

  // Deep equality (use sparingly)
  const nestedData = useStoreSelector(userStore, user => user.profile, deepEqual);

  return (
    <div>
      <h2>{userName}</h2>
      <p>Email: {userInfo.email}</p>
      <div>Profile: {JSON.stringify(nestedData)}</div>
    </div>
  );
}
```

### External Selectors (Best Performance)

```tsx
// Define selectors outside components
const userNameSelector = (user) => user.name;
const userStatsSelector = (user) => ({ posts: user.posts.length, followers: user.followers.length });
const dashboardSelector = ([user, notifications]) => ({
  name: user.name,
  unreadCount: notifications.filter(n => !n.read).length
});

function UserDashboard() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  const notificationStore = useUserStore('notifications');
  
  const userName = useStoreSelector(userStore, userNameSelector);
  const userStats = useStoreSelector(userStore, userStatsSelector);
  const dashboard = useMultiStoreSelector([userStore, notificationStore], dashboardSelector);
  
  return (
    <div>
      <h2>{userName}</h2>
      <p>Posts: {userStats.posts}, Followers: {userStats.followers}</p>
      <p>{dashboard.unreadCount} unread notifications</p>
    </div>
  );
}
```

### Dynamic Selectors with useCallback

```tsx
function UserProfile({ userId }) {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  // useCallback for prop-dependent selectors
  const userSelector = useCallback(
    user => user.id === userId ? user : null,
    [userId]
  );
  
  const userData = useStoreSelector(userStore, userSelector);
  return userData ? <div>{userData.name}</div> : null;
}
```

## Quick Reference

```tsx
function QuickReferenceExample() {
  const { useUserStore } = UserStores();
  const { useProductStore } = ProductStores();
  
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');
  const cartStore = useProductStore('cart');

  // Single store selection
  const userName = useStoreSelector(userStore, user => user.name);

  // Multi-store selection
  const summary = useMultiStoreSelector(
    [userStore, cartStore], 
    ([user, cart]) => ({ name: user.name, items: cart.items.length })
  );

  // Path selection
  const theme = useStorePathSelector(settingsStore, ['preferences', 'theme']);

  // External selectors (best performance)
  const nameSelector = (user) => user.name;
  const displayName = useStoreSelector(userStore, nameSelector);

  // Equality control
  const userInfo = useStoreSelector(
    userStore,
    user => ({ name: user.name, email: user.email }),
    shallowEqual
  );

  return (
    <div>
      <p>User: {userName}</p>
      <p>Cart: {summary.items} items</p>
      <p>Theme: {theme}</p>
    </div>
  );
}
```

## Best Practices

### 1. Keep Selectors Pure

```tsx
function PureSelectorExample() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');

  // ✅ Good: Pure selector
  const userData = useStoreSelector(
    userStore,
    user => ({ name: user.name, email: user.email })
  );

  // ❌ Avoid: Side effects in selector
  const badUserData = useStoreSelector(userStore, user => {
    console.log('User accessed'); // Side effect
    return { name: user.name };
  });

  return <div>{userData.name}</div>;
}
```

### 2. Minimize Selected Data

```tsx
function MinimalSelectionExample() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');

  // ✅ Good: Select only what you need
  const userName = useStoreSelector(userStore, user => user.name);

  // ❌ Avoid: Selecting entire objects unnecessarily
  const user = useStoreSelector(userStore, user => user); // Returns entire user object

  return <div>{userName}</div>;
}
```

### 3. Choose the Right Pattern

```tsx
function PatternSelectionExample() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');

  // Single store, simple selector
  const userName = useStoreSelector(userStore, user => user.name);

  // Multiple stores, combined data
  const dashboard = useMultiStoreSelector(
    [userStore, settingsStore], 
    ([user, settings]) => ({ user: user.name, theme: settings.theme })
  );

  // Deep nested access
  const userTheme = useStorePathSelector(settingsStore, ['preferences', 'theme']);

  return <div>{userName} - {dashboard.theme}</div>;
}
```

### 4. Prefer External Selectors When Possible

```tsx
// ✅ BEST: External selectors (recommended)
const userNameSelector = (user) => user.name;
const userEmailSelector = (user) => user.email;

function UserComponent() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  const userName = useStoreSelector(userStore, userNameSelector);
  const userEmail = useStoreSelector(userStore, userEmailSelector);
  
  return <div>{userName} ({userEmail})</div>;
}

// ✅ GOOD: Inline selectors (works with internal stabilization)
function UserComponentInline() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  const userName = useStoreSelector(userStore, user => user.name);
  const userEmail = useStoreSelector(userStore, user => user.email);
  
  return <div>{userName} ({userEmail})</div>;
}

// ✅ Use inline for prop-dependent selectors
function UserProfile({ showEmail }) {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  const displayInfo = useStoreSelector(userStore, user => ({
    name: user.name,
    email: showEmail ? user.email : null
  }));
  
  return <div>{displayInfo.name}</div>;
}
```

### 5. Organize Selectors

```tsx
// selectors/userSelectors.ts
export const userSelectors = {
  name: (user) => user.name,
  email: (user) => user.email,
  isAdmin: (user) => user.role === 'admin'
};

// Use in components with Setup pattern
function UserProfile() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  const userName = useStoreSelector(userStore, userSelectors.name);
  const isAdmin = useStoreSelector(userStore, userSelectors.isAdmin);
  
  return <div>{userName} {isAdmin && '(Admin)'}</div>;
}
```

## Related Patterns

- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic store subscription patterns
- [useComputedStore Patterns](./useComputedStore-patterns.md) - Computed value patterns
- [Performance Patterns](./performance-patterns.md) - Performance optimization techniques