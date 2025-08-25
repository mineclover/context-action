# useStoreValue Patterns

Core `useStoreValue` patterns for subscribing to store changes with selective updates, conditional subscriptions, and comparison strategies.

## Prerequisites

This guide uses store contexts from the [Basic Store Setup](../setup/basic-store-setup.md) guide.

### Required Store Setup

```typescript
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';

// User Domain Stores
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' as const },
    strategy: 'shallow' as const
  },
  preferences: {
    initialValue: { theme: 'light' as const, language: 'en', notifications: true },
    strategy: 'shallow' as const
  },
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'shallow' as const
  }
});

// Product Domain Stores
const {
  Provider: ProductStoreProvider,
  useStore: useProductStore,
  useStoreManager: useProductStoreManager
} = createDeclarativeStorePattern('Product', {
  catalog: [] as Product[],
  cart: {
    initialValue: { items: [], total: 0, discounts: [] },
    strategy: 'shallow' as const
  },
  filters: {
    initialValue: { category: '', priceRange: null, searchTerm: '' },
    strategy: 'shallow' as const
  }
});
```

## Import
```typescript
import { useStoreValue } from '@context-action/react';
```

## Basic Store Subscription

```tsx
function UserProfile() {
  // Get store instance from context
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // Simple subscription to entire store value
  const profile = useStoreValue(profileStore);
  
  // Subscribe to specific field only
  const userName = useStoreValue(profileStore, user => user.name);
  const userTheme = useStoreValue(preferencesStore, prefs => prefs.theme);
  
  return (
    <div>
      <h1>{userName}</h1>
      <p>Email: {profile.email}</p>
      <p>Theme: {userTheme}</p>
    </div>
  );
}
```

## Selective Subscriptions

### Field Selection

```tsx
function UserBasicInfo() {
  const profileStore = useUserStore('profile');
  
  // Only re-renders when name changes, ignores email/id/role changes
  const userName = useStoreValue(profileStore, user => user.name);
  
  // Multiple field selection
  const userBasicInfo = useStoreValue(profileStore, user => ({
    name: user.name,
    email: user.email
  }));
  
  return (
    <div>
      <h2>{userName}</h2>
      <p>{userBasicInfo.email}</p>
    </div>
  );
}
```

### Deep Property Access

```tsx
function ProductFilters() {
  const filtersStore = useProductStore('filters');
  const cartStore = useProductStore('cart');
  
  // Access nested properties from Product stores
  const currentCategory = useStoreValue(filtersStore, filters => filters.category);
  const priceRange = useStoreValue(filtersStore, filters => filters.priceRange);
  const cartTotal = useStoreValue(cartStore, cart => cart.total);
  const itemCount = useStoreValue(cartStore, cart => cart.items.length);
  
  return (
    <div>
      <p>Category: {currentCategory}</p>
      <p>Price Range: {priceRange ? `$${priceRange.min} - $${priceRange.max}` : 'All'}</p>
      <p>Cart: {itemCount} items, Total: ${cartTotal}</p>
    </div>
  );
}
```

## Conditional Subscriptions

### Dynamic Subscription Control

```tsx
function ConditionalSubscriptions() {
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  
  const [subscribeToUpdates, setSubscribeToUpdates] = useState(true);
  
  // Only subscribe when enabled
  const lastActivity = useStoreValue(
    subscribeToUpdates ? sessionStore : null,
    session => session?.lastActivity
  );
  
  // Toggle subscription based on user preferences  
  const notificationsEnabled = useStoreValue(preferencesStore, prefs => prefs.notifications);
  const sessionData = useStoreValue(
    notificationsEnabled ? sessionStore : null,
    session => session?.permissions
  );
  
  return (
    <div>
      <label>
        <input 
          type="checkbox" 
          checked={subscribeToUpdates}
          onChange={e => setSubscribeToUpdates(e.target.checked)}
        />
        Subscribe to updates
      </label>
      {lastActivity && <p>Last activity: {new Date(lastActivity).toLocaleString()}</p>}
      {sessionData && <p>Permissions: {sessionData.length}</p>}
    </div>
  );
}
```

### Permission-Based Subscriptions

```tsx
function useProtectedStoreValue<T>(store: any, selector: any, requiredRole: string) {
  const profileStore = useUserStore('profile');
  const userRole = useStoreValue(profileStore, user => user.role);
  const hasPermission = userRole === requiredRole || userRole === 'admin';
  
  return useStoreValue(
    hasPermission ? store : null,
    selector
  );
}

function AdminPanel() {
  const cartStore = useProductStore('cart');
  
  // Only admin and users with admin permissions can see sensitive cart data
  const cartDiscounts = useProtectedStoreValue(
    cartStore,
    cart => cart.discounts,
    'admin'
  );
  
  return (
    <div>
      {cartDiscounts ? (
        <div>
          <h3>Admin: Cart Discounts</h3>
          <pre>{JSON.stringify(cartDiscounts, null, 2)}</pre>
        </div>
      ) : (
        <p>Access denied</p>
      )}
    </div>
  );
}
```

## Comparison Strategies

### Reference Comparison (Default)

```tsx
function ReferenceComparison() {
  const profileStore = useUserStore('profile');
  
  // Fast reference comparison - only updates when reference changes
  const profile = useStoreValue(profileStore, undefined, {
    comparison: 'reference'
  });
  
  return <div>User: {profile.name}</div>;
}
```

### Shallow Comparison

```tsx
function ShallowComparison() {
  const preferencesStore = useUserStore('preferences');
  
  // Re-renders only when top-level properties change
  const preferences = useStoreValue(preferencesStore, undefined, { 
    comparison: 'shallow' 
  });
  
  return (
    <div>
      <p>Theme: {preferences.theme}</p>
      <p>Language: {preferences.language}</p>
      <p>Notifications: {preferences.notifications ? 'On' : 'Off'}</p>
    </div>
  );
}
```

### Deep Comparison

```tsx
function DeepComparison() {
  const cartStore = useProductStore('cart');
  
  // Most thorough but expensive - use sparingly
  const cart = useStoreValue(cartStore, undefined, {
    comparison: 'deep'
  });
  
  return (
    <div>
      <p>Items: {cart.items.length}</p>
      <p>Total: ${cart.total}</p>
    </div>
  );
}
```

### Custom Comparison

```tsx
function CustomComparison() {
  const profileStore = useUserStore('profile');
  
  const userData = useStoreValue(profileStore, user => user, {
    customComparator: (prev, next) => {
      // Only update if name or email changed, ignore other fields
      return prev.name === next.name && prev.email === next.email;
    }
  });
  
  return (
    <div>
      <h2>{userData.name}</h2>
      <p>{userData.email}</p>
    </div>
  );
}
```

## Transformation Patterns

### Data Formatting

```tsx
function FormattedUserDisplay() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  
  const formattedUser = useStoreValue(profileStore, user => ({
    displayName: user.name || 'Unknown User',
    initials: user.name ? user.name.split(' ').map(n => n[0]).join('') : '??',
    roleDisplay: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    status: user.id ? 'Active' : 'Inactive'
  }));
  
  const lastActivity = useStoreValue(sessionStore, session => 
    session.lastActivity ? new Date(session.lastActivity).toLocaleDateString() : 'Never'
  );
  
  return (
    <div>
      <h2>{formattedUser.displayName} ({formattedUser.initials})</h2>
      <p>Role: {formattedUser.roleDisplay}</p>
      <p>Status: {formattedUser.status}</p>
      <p>Last active: {lastActivity}</p>
    </div>
  );
}
```

### Computed Properties

```tsx
function UserStats() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  
  const userStats = useStoreValue(profileStore, user => {
    const hasPermissions = user.role === 'admin' || user.role === 'user';
    
    return {
      ...user,
      hasFullAccess: hasPermissions,
      isGuestUser: user.role === 'guest',
      canModifyData: user.role === 'admin'
    };
  });
  
  const sessionStats = useStoreValue(sessionStore, session => ({
    isAuthenticated: session.isAuthenticated,
    permissionCount: session.permissions.length,
    hasRecentActivity: Date.now() - session.lastActivity < 30 * 60 * 1000 // 30 minutes
  }));
  
  return (
    <div>
      <h3>User Statistics</h3>
      <p>Full Access: {userStats.hasFullAccess ? 'Yes' : 'No'}</p>
      <p>Can Modify: {userStats.canModifyData ? 'Yes' : 'No'}</p>
      <p>Permissions: {sessionStats.permissionCount}</p>
      <p>Recent Activity: {sessionStats.hasRecentActivity ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Array Filtering and Mapping

```tsx
function ProductCatalogSummary() {
  const catalogStore = useProductStore('catalog');
  const cartStore = useProductStore('cart');
  
  const availableProducts = useStoreValue(catalogStore, products => 
    products.filter(product => product.inStock)
  );
  
  const productNames = useStoreValue(catalogStore, products =>
    products.map(product => product.name)
  );
  
  const cartItemsByCategory = useStoreValue(cartStore, cart =>
    cart.items.reduce((acc, item) => {
      const category = item.category || 'uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, any[]>)
  );
  
  return (
    <div>
      <h3>Catalog Summary</h3>
      <p>Available Products: {availableProducts.length}</p>
      <p>Total Products: {productNames.length}</p>
      <div>
        <h4>Cart by Category:</h4>
        {Object.entries(cartItemsByCategory).map(([category, items]) => (
          <p key={category}>{category}: {items.length} items</p>
        ))}
      </div>
    </div>
  );
}
```

## Performance Optimizations

### Debounced Updates

```tsx
import { useState } from 'react';

function DebouncedSearch() {
  const filtersStore = useProductStore('filters');
  
  // Debounce rapid search term changes
  const debouncedSearchTerm = useStoreValue(filtersStore, filters => filters.searchTerm, {
    debounce: 300  // Wait 300ms after last change
  });
  
  // Immediate access for input value (no debounce)
  const currentSearchTerm = useStoreValue(filtersStore, filters => filters.searchTerm);
  
  return (
    <div>
      <input 
        value={currentSearchTerm}
        onChange={e => filtersStore.update(prev => ({ ...prev, searchTerm: e.target.value }))}
        placeholder="Search products..."
      />
      <p>Searching for: "{debouncedSearchTerm}"</p>
    </div>
  );
}
```

### Memoized Selectors

```tsx
import { useCallback } from 'react';

function OptimizedUserDisplay() {
  const profileStore = useUserStore('profile');
  const cartStore = useProductStore('cart');
  
  // Stable selector prevents unnecessary re-renders
  const userName = useStoreValue(profileStore, useCallback(
    user => user.name,
    [] // No dependencies
  ));
  
  // Complex selector with stable reference
  const cartSummary = useStoreValue(cartStore, useCallback(
    cart => ({
      total: cart.items.length,
      totalPrice: cart.total,
      hasItems: cart.items.length > 0,
      averageItemPrice: cart.items.length > 0 
        ? cart.total / cart.items.length
        : 0
    }),
    []
  ));
  
  return (
    <div>
      <h2>Welcome, {userName}</h2>
      <div>
        <p>Cart Items: {cartSummary.total}</p>
        <p>Total Price: ${cartSummary.totalPrice}</p>
        <p>Average Price: ${cartSummary.averageItemPrice.toFixed(2)}</p>
      </div>
    </div>
  );
}
```

## Error Handling

### Safe Property Access

```tsx
function SafeUserDisplay() {
  const profileStore = useUserStore('profile');
  
  const safeUserData = useStoreValue(profileStore, user => {
    try {
      return {
        name: user?.name || 'Unknown User',
        email: user?.email || 'No email provided',
        role: user?.role || 'guest',
        hasValidData: Boolean(user?.id)
      };
    } catch (error) {
      console.error('Error accessing user data:', error);
      return { 
        name: 'Error', 
        email: 'Error loading', 
        role: 'guest',
        hasValidData: false 
      };
    }
  });
  
  return (
    <div>
      <h2>{safeUserData.name}</h2>
      <p>Email: {safeUserData.email}</p>
      <p>Role: {safeUserData.role}</p>
      {!safeUserData.hasValidData && <p>⚠️ User data not fully loaded</p>}
    </div>
  );
}
```

### Fallback Values

```tsx
function UserDisplayWithFallbacks() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const userDisplayName = useStoreValue(
    profileStore, 
    user => user?.name || user?.email || 'Guest User'
  );
  
  const userSettings = useStoreValue(preferencesStore, preferences => ({
    theme: preferences?.theme || 'light',
    language: preferences?.language || 'en',
    notifications: preferences?.notifications ?? true
  }));
  
  return (
    <div>
      <h2>{userDisplayName}</h2>
      <p>Theme: {userSettings.theme}</p>
      <p>Language: {userSettings.language}</p>
      <p>Notifications: {userSettings.notifications ? 'On' : 'Off'}</p>
    </div>
  );
}
```

### Null Store Handling

```tsx
function ConditionalStoreAccess() {
  const [shouldLoadCart, setShouldLoadCart] = useState(false);
  const cartStore = useProductStore('cart');
  
  const conditionalCartData = useStoreValue(
    shouldLoadCart ? cartStore : null,
    cart => cart ? {
      itemCount: cart.items.length,
      total: cart.total,
      hasDiscounts: cart.discounts.length > 0
    } : null
  );
  
  return (
    <div>
      <label>
        <input 
          type="checkbox"
          checked={shouldLoadCart}
          onChange={e => setShouldLoadCart(e.target.checked)}
        />
        Load cart data
      </label>
      
      {conditionalCartData ? (
        <div>
          <p>Items: {conditionalCartData.itemCount}</p>
          <p>Total: ${conditionalCartData.total}</p>
          <p>Has Discounts: {conditionalCartData.hasDiscounts ? 'Yes' : 'No'}</p>
        </div>
      ) : (
        <p>Cart data not loaded</p>
      )}
    </div>
  );
}
```

## Real-World Examples

### User Profile Display

```tsx
function UserProfile() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  
  const userInfo = useStoreValue(profileStore, user => ({
    name: user.name || 'Anonymous User',
    email: user.email,
    role: user.role,
    hasProfile: Boolean(user.id)
  }));
  
  const sessionInfo = useStoreValue(sessionStore, session => ({
    isOnline: Date.now() - session.lastActivity < 5 * 60 * 1000, // 5 minutes
    isAuthenticated: session.isAuthenticated,
    lastActivity: new Date(session.lastActivity).toLocaleDateString()
  }));
  
  const theme = useStoreValue(preferencesStore, prefs => prefs.theme);
  
  return (
    <div className={`user-profile theme-${theme}`}>
      <div className="avatar-placeholder">
        {userInfo.name.charAt(0).toUpperCase()}
      </div>
      <h2>{userInfo.name}</h2>
      <p>{userInfo.email}</p>
      <div className={`status ${sessionInfo.isOnline ? 'online' : 'offline'}`}>
        {sessionInfo.isOnline ? 'Online' : 'Offline'}
      </div>
      <p>Role: {userInfo.role}</p>
      <small>Last active: {sessionInfo.lastActivity}</small>
    </div>
  );
}
```

### Shopping Cart Badge

```tsx
function CartBadge() {
  const cartStore = useProductStore('cart');
  
  const cartInfo = useStoreValue(cartStore, cart => ({
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    hasItems: cart.items.length > 0,
    total: cart.total,
    discountCount: cart.discounts.length
  }));
  
  if (!cartInfo.hasItems) {
    return (
      <div className="cart-badge empty">
        <span className="cart-icon">🛒</span>
      </div>
    );
  }
  
  return (
    <div className="cart-badge">
      <span className="cart-icon">🛒</span>
      <span className="badge">{cartInfo.itemCount}</span>
      <span className="total">${cartInfo.total.toFixed(2)}</span>
      {cartInfo.discountCount > 0 && (
        <span className="discount">-{cartInfo.discountCount}</span>
      )}
    </div>
  );
}
```

### Product Search Results

```tsx
function ProductSearchResults() {
  const catalogStore = useProductStore('catalog');
  const filtersStore = useProductStore('filters');
  
  const searchState = useStoreValue(filtersStore, filters => ({
    query: filters.searchTerm,
    category: filters.category,
    priceRange: filters.priceRange
  }));
  
  const searchResults = useStoreValue(catalogStore, products => 
    products.filter(product => {
      const matchesSearch = !searchState.query || 
        product.name.toLowerCase().includes(searchState.query.toLowerCase());
      const matchesCategory = !searchState.category || 
        product.category === searchState.category;
      const matchesPrice = !searchState.priceRange || 
        (product.price >= searchState.priceRange.min && product.price <= searchState.priceRange.max);
      
      return matchesSearch && matchesCategory && matchesPrice;
    })
  );
  
  // Debounce search query updates for better performance
  const debouncedQuery = useStoreValue(filtersStore, filters => filters.searchTerm, {
    debounce: 300
  });
  
  if (!searchState.query && !searchState.category && !searchState.priceRange) {
    return <div>Enter search criteria to find products</div>;
  }
  
  return (
    <div>
      <h3>
        Search Results
        {debouncedQuery && ` for "${debouncedQuery}"`}
        ({searchResults.length} found)
      </h3>
      
      {searchState.category && <p>Category: {searchState.category}</p>}
      {searchState.priceRange && (
        <p>Price: ${searchState.priceRange.min} - ${searchState.priceRange.max}</p>
      )}
      
      {searchResults.length === 0 ? (
        <p>No products found matching your criteria</p>
      ) : (
        <div className="results">
          {searchResults.map(product => (
            <div key={product.id} className="product-item">
              <h4>{product.name}</h4>
              <p>${product.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Best Practices

### 1. Use Specific Selectors

```tsx
function UserDisplay() {
  const profileStore = useUserStore('profile');
  
  // ✅ Good: Select only what you need
  const userName = useStoreValue(profileStore, user => user.name);
  
  // ❌ Avoid: Subscribing to entire store when only name is needed
  // const user = useStoreValue(profileStore);
  // return <div>{user.name}</div>;
  
  return <div>{userName}</div>;
}
```

### 2. Memoize Complex Selectors

```tsx
function OptimizedCartSummary() {
  const cartStore = useProductStore('cart');
  
  // ✅ Good: Memoized selector
  const processedCart = useStoreValue(cartStore, useCallback(
    cart => ({
      total: cart.items.length,
      totalValue: cart.total,
      hasExpensiveItems: cart.items.some(item => item.price > 100),
      categoryBreakdown: cart.items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {})
    }),
    []
  ));
  
  // ❌ Avoid: New function on every render
  // const processedCart = useStoreValue(cartStore, cart => expensiveProcessing(cart));
  
  return (
    <div>
      <p>Items: {processedCart.total}</p>
      <p>Value: ${processedCart.totalValue}</p>
      <p>Has expensive items: {processedCart.hasExpensiveItems ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 3. Handle Edge Cases

```tsx
function SafeUserDisplay() {
  const profileStore = useUserStore('profile');
  
  // ✅ Good: Safe property access
  const userName = useStoreValue(profileStore, user => user?.name || 'Guest');
  
  // ❌ Avoid: Assuming properties exist
  // const userName = useStoreValue(profileStore, user => user.name);
  
  return <div>Welcome, {userName}</div>;
}
```

### 4. Choose Appropriate Comparison Strategy

```tsx
function ComparisonExamples() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  const cartStore = useProductStore('cart');
  
  // For simple objects - use reference (default)
  const userId = useStoreValue(profileStore, user => user.id);
  
  // For objects with shallow changes - use shallow
  const preferences = useStoreValue(preferencesStore, undefined, { comparison: 'shallow' });
  
  // For deep nested objects - use deep sparingly
  const cartData = useStoreValue(cartStore, undefined, { comparison: 'deep' });
  
  return (
    <div>
      <p>User ID: {userId}</p>
      <p>Theme: {preferences.theme}</p>
      <p>Cart Items: {cartData.items.length}</p>
    </div>
  );
}
```

## Provider Setup

To use these patterns, wrap your components with the required store providers:

```tsx
import { 
  UserStoreProvider,
  ProductStoreProvider 
} from '../stores';

function App() {
  return (
    <UserStoreProvider>
      <ProductStoreProvider>
        <UserProfile />
        <CartBadge />
        <ProductSearchResults />
      </ProductStoreProvider>
    </UserStoreProvider>
  );
}
```

## Related Patterns

- **[Basic Store Setup](../setup/basic-store-setup.md)** - Store context setup patterns
- **[useStoreSelector Patterns](./useStoreSelector-patterns.md)** - Multiple store selection patterns
- **[useComputedStore Patterns](./useComputedStore-patterns.md)** - Computed value patterns
- **[Performance Patterns](./performance-patterns.md)** - Performance optimization techniques
- **[useStoreManager API](./useStoreManager-api.md)** - Low-level store management