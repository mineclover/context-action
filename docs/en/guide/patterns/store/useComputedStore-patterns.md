# useComputedStore Patterns

Computed value patterns using `useComputedStore` for derived state, performance optimization, and reactive calculations.

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

## Basic Computed Values

### Simple Derived State

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

### Multi-Store Computations

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

## Advanced Computed Patterns

### Conditional Computations

```tsx
import { useUserStore, useUIStore } from '../setup/stores';

function UserStatusIndicator() {
  const sessionStore = useUserStore('session');
  const profileStore = useUserStore('profile');
  const navigationStore = useUIStore('navigation');
  
  const userStatus = useComputedStore(
    [sessionStore, profileStore, navigationStore],
    ([session, profile, navigation]) => {
      if (!session.isAuthenticated) return 'guest';
      
      const lastActivity = Date.now() - session.lastActivity;
      const isOnline = lastActivity < 300000; // 5 minutes
      
      if (profile.role === 'admin') {
        return isOnline ? 'admin-online' : 'admin-away';
      }
      
      // Check if user is actively navigating
      const isActiveUser = navigation.history.length > 1 && isOnline;
      
      return isActiveUser ? 'active' : isOnline ? 'online' : 'away';
    }
  );
  
  const statusColor = {
    'guest': 'gray',
    'admin-online': 'red',
    'admin-away': 'orange',  
    'active': 'green',
    'online': 'blue',
    'away': 'yellow'
  }[userStatus] || 'gray';
  
  return <div className={`status-indicator ${statusColor}`}>{userStatus}</div>;
}
```

### Complex Object Transformations

```tsx
import { useUserStore, useProductStore, useUIStore } from '../setup/stores';

function DashboardStats() {
  const sessionStore = useUserStore('session');
  const catalogStore = useProductStore('catalog');
  const cartStore = useProductStore('cart');
  const filtersStore = useProductStore('filters');
  const loadingStore = useUIStore('loading');
  
  const dashboardData = useComputedStore(
    [sessionStore, catalogStore, cartStore, filtersStore, loadingStore],
    ([session, catalog, cart, filters, loading]) => {
      const userPermissions = session.permissions || [];
      const canViewStats = userPermissions.includes('view_dashboard');
      
      if (!canViewStats) {
        return { error: 'Access denied', stats: null };
      }
      
      // Filter products based on current filters
      const filteredProducts = catalog.filter(product => {
        const matchesCategory = !filters.category || product.category === filters.category;
        const matchesPrice = !filters.priceRange || 
          (product.price >= filters.priceRange.min && product.price <= filters.priceRange.max);
        const matchesSearch = !filters.searchTerm || 
          product.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        return matchesCategory && matchesPrice && matchesSearch;
      });
      
      return {
        products: {
          total: catalog.length,
          filtered: filteredProducts.length,
          inCart: cart.items.length,
          categories: [...new Set(catalog.map(p => p.category))].length
        },
        cart: {
          items: cart.items.length,
          total: cart.total,
          discounts: cart.discounts.length,
          avgItemPrice: cart.items.length > 0 ? cart.total / cart.items.length : 0
        },
        filters: {
          activeFilters: Object.values(filters).filter(f => f != null).length,
          searchActive: Boolean(filters.searchTerm),
          categorySelected: Boolean(filters.category)
        },
        system: {
          isLoading: loading.global,
          activeOperations: Object.keys(loading.operations).filter(
            op => loading.operations[op]
          ).length
        }
      };
    }
  );
  
  if (dashboardData.error) {
    return <div className="error">{dashboardData.error}</div>;
  }
  
  const stats = dashboardData;
  
  return (
    <div className="dashboard">
      <div className="stat-card">
        <h3>Products</h3>
        <div>Total: {stats.products.total}</div>
        <div>Filtered: {stats.products.filtered}</div>
        <div>In Cart: {stats.products.inCart}</div>
        <div>Categories: {stats.products.categories}</div>
      </div>
      
      <div className="stat-card">
        <h3>Cart</h3>
        <div>Items: {stats.cart.items}</div>
        <div>Total: ${stats.cart.total.toFixed(2)}</div>
        <div>Avg Price: ${stats.cart.avgItemPrice.toFixed(2)}</div>
        <div>Discounts: {stats.cart.discounts}</div>
      </div>
      
      <div className="stat-card">
        <h3>System</h3>
        <div>Loading: {stats.system.isLoading ? 'Yes' : 'No'}</div>
        <div>Operations: {stats.system.activeOperations}</div>
        <div>Filters: {stats.filters.activeFilters}</div>
      </div>
    </div>
  );
}
```

## Performance Optimization

### Caching with Custom Keys

```tsx
import { useProductStore, useUserStore } from '../setup/stores';

function OptimizedProductSearch() {
  const catalogStore = useProductStore('catalog');
  const filtersStore = useProductStore('filters');
  const preferencesStore = useUserStore('preferences');
  
  // Expensive search computation with caching
  const searchResults = useComputedStore(
    [catalogStore, filtersStore, preferencesStore],
    ([catalog, filters, preferences]) => {
      // Heavy processing for search algorithm
      return performAdvancedSearch(catalog, filters, preferences.language);
    },
    {
      comparison: 'deep',
      cacheKey: 'product-search',
      debug: process.env.NODE_ENV === 'development'
    }
  );
  
  return (
    <div>
      {searchResults.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}

function performAdvancedSearch(catalog, filters, language) {
  // Simulate expensive computation
  console.log('Computing search results...');
  return catalog
    .filter(product => {
      // Complex filtering logic
      return filters.searchTerm ? 
        product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) : 
        true;
    })
    .sort((a, b) => {
      // Complex sorting based on language preference
      return language === 'ko' ? 
        a.name.localeCompare(b.name, 'ko') : 
        a.name.localeCompare(b.name);
    });
}
```

### Memoized Dependencies

```tsx
import { useMemo } from 'react';
import { useUserStore } from '../setup/stores';

function OptimizedUserProcessor() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  
  // Memoized computation function for better performance
  const computationFn = useMemo(() => 
    ([profile, session, preferences]) => {
      // Expensive user data processing
      return processComplexUserData(profile, session, preferences);
    }, []
  );
  
  const processedUserData = useComputedStore(
    [profileStore, sessionStore, preferencesStore],
    computationFn,
    {
      comparison: 'shallow'
    }
  );
  
  return (
    <div>
      <div>Processed Name: {processedUserData.displayName}</div>
      <div>User Level: {processedUserData.level}</div>
      <div>Permissions: {processedUserData.permissions.join(', ')}</div>
    </div>
  );
}

function processComplexUserData(profile, session, preferences) {
  console.log('Processing user data...');
  return {
    displayName: `${profile.name} (${profile.role})`,
    level: session.permissions.length > 5 ? 'advanced' : 'basic',
    permissions: session.permissions,
    theme: preferences.theme,
    language: preferences.language
  };
}
```

### Selective Updates

```tsx
import { useUserStore, useUIStore } from '../setup/stores';

function SelectiveUserProfile() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const navigationStore = useUIStore('navigation');
  
  // Only recompute when specific fields change
  const userDisplayData = useComputedStore(
    [profileStore, sessionStore, navigationStore],
    ([profile, session, navigation]) => ({
      // Core display data - recompute only when these change
      displayName: `${profile.name} (${profile.role})`,
      isAuthenticated: session.isAuthenticated,
      currentPage: navigation.currentRoute,
      // Ignore session.lastActivity changes for performance
      // Ignore navigation.history changes for performance
    }),
    {
      // Custom comparison to ignore frequently changing fields
      comparison: (prev, next) => {
        const [prevProfile, prevSession, prevNav] = prev;
        const [nextProfile, nextSession, nextNav] = next;
        
        // Only care about specific fields
        return (
          prevProfile.name === nextProfile.name &&
          prevProfile.role === nextProfile.role &&
          prevSession.isAuthenticated === nextSession.isAuthenticated &&
          prevNav.currentRoute === nextNav.currentRoute
        );
      }
    }
  );
  
  return (
    <div className="user-profile">
      <h2>{userDisplayData.displayName}</h2>
      <div>Status: {userDisplayData.isAuthenticated ? 'Logged in' : 'Guest'}</div>
      <div>Page: {userDisplayData.currentPage}</div>
    </div>
  );
}
```

## Computed Store Instances

### Creating Reusable Computed Stores

```tsx
import { useComputedStoreInstance, useStoreValue } from '@context-action/react';
import { useUserStore, useUIStore } from '../setup/stores';

function UserBadgeProvider({ children }) {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // Create a computed store instance for user badge
  const userBadgeStore = useComputedStoreInstance(
    [profileStore, preferencesStore],
    ([profile, preferences]) => {
      if (preferences.theme === 'minimal') return null;
      
      const scoreFromRole = profile.role === 'admin' ? 100 : profile.role === 'user' ? 50 : 25;
      
      return {
        displayName: profile.name,
        roleLevel: profile.role,
        badgeIcon: scoreFromRole >= 80 ? '🏆' : scoreFromRole >= 50 ? '🥉' : '📖',
        canShowBadge: preferences.notifications // Use notifications as badge visibility
      };
    },
    { name: 'userBadge' }
  );
  
  return children;
}

// Use the computed store in other components
function BadgeDisplay() {
  const userBadgeStore = useComputedStoreInstance.getStore('userBadge');
  const badge = useStoreValue(userBadgeStore);
  
  if (!badge?.canShowBadge) return null;
  
  return (
    <div className="user-badge">
      <span>{badge.badgeIcon}</span>
      <span>{badge.displayName}</span>
      <small>({badge.roleLevel})</small>
    </div>
  );
}
```

### Chained Computations

```tsx
import { useUserStore, useProductStore, useUIStore } from '../setup/stores';

function ChainedComputationExample() {
  const sessionStore = useUserStore('session');
  const catalogStore = useProductStore('catalog');
  const filtersStore = useProductStore('filters');
  const loadingStore = useUIStore('loading');
  
  // First level: Filter products based on user permissions and filters
  const filteredProductsStore = useComputedStoreInstance(
    [sessionStore, catalogStore, filtersStore],
    ([session, catalog, filters]) => {
      const canViewAllProducts = session.permissions.includes('view_all_products');
      const baseProducts = canViewAllProducts ? catalog : catalog.filter(p => p.isPublic);
      
      return baseProducts.filter(product => {
        const matchesCategory = !filters.category || product.category === filters.category;
        const matchesPrice = !filters.priceRange || 
          (product.price >= filters.priceRange.min && product.price <= filters.priceRange.max);
        const matchesSearch = !filters.searchTerm || 
          product.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        return matchesCategory && matchesPrice && matchesSearch;
      });
    },
    { name: 'filteredProducts' }
  );
  
  // Second level: Analyze filtered products for insights
  const productAnalysisStore = useComputedStoreInstance(
    [filteredProductsStore, loadingStore],
    ([filteredProducts, loading]) => {
      if (loading.global) {
        return { isAnalyzing: true, insights: null };
      }
      
      const categories = [...new Set(filteredProducts.map(p => p.category))];
      const avgPrice = filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length;
      const priceRanges = {
        budget: filteredProducts.filter(p => p.price < avgPrice * 0.7).length,
        mid: filteredProducts.filter(p => p.price >= avgPrice * 0.7 && p.price <= avgPrice * 1.3).length,
        premium: filteredProducts.filter(p => p.price > avgPrice * 1.3).length
      };
      
      return {
        isAnalyzing: false,
        insights: {
          totalProducts: filteredProducts.length,
          categoriesCount: categories.length,
          averagePrice: avgPrice,
          priceDistribution: priceRanges,
          recommendations: avgPrice > 100 ? ['Consider budget options'] : ['Premium products available']
        }
      };
    },
    { name: 'productAnalysis' }
  );
  
  return { filteredProductsStore, productAnalysisStore };
}

// Using the chained computations
function ProductInsightsDashboard() {
  const { productAnalysisStore } = ChainedComputationExample();
  const analysis = useStoreValue(productAnalysisStore);
  
  if (analysis.isAnalyzing) {
    return <div>Analyzing products...</div>;
  }
  
  const { insights } = analysis;
  
  return (
    <div className="product-insights">
      <h3>Product Analysis</h3>
      <div>Total Products: {insights.totalProducts}</div>
      <div>Categories: {insights.categoriesCount}</div>
      <div>Average Price: ${insights.averagePrice.toFixed(2)}</div>
      <div>Price Distribution:</div>
      <ul>
        <li>Budget: {insights.priceDistribution.budget}</li>
        <li>Mid-range: {insights.priceDistribution.mid}</li>
        <li>Premium: {insights.priceDistribution.premium}</li>
      </ul>
      <div>Recommendations: {insights.recommendations.join(', ')}</div>
    </div>
  );
}
```

## Async Computed Patterns

### Basic Async Computation

```tsx
import { useAsyncComputedStore } from '@context-action/react';
import { useUserStore, useUIStore } from '../setup/stores';

function AsyncUserProfileLoader() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const loadingStore = useUIStore('loading');
  
  const userProfileData = useAsyncComputedStore(
    [profileStore, sessionStore],
    async ([profile, session]) => {
      if (!profile.id || !session.isAuthenticated) return null;
      
      const response = await fetch(`/api/users/${profile.id}/detailed`);
      if (!response.ok) {
        throw new Error(`Failed to load user data: ${response.statusText}`);
      }
      
      const detailedData = await response.json();
      
      return {
        ...profile,
        ...detailedData,
        fullProfile: true,
        loadedAt: new Date().toISOString()
      };
    },
    {
      initialValue: null,
      name: 'userProfileData'
    }
  );
  
  return userProfileData;
}

// Using the async computed store
function UserProfileDisplay() {
  const { value: user, loading, error, reload } = AsyncUserProfileLoader();
  
  if (loading) return <div className="loading">Loading user profile...</div>;
  if (error) return (
    <div className="error">
      Error: {error.message}
      <button onClick={reload} className="retry-btn">Retry</button>
    </div>
  );
  if (!user) return <div>No user profile available</div>;
  
  return (
    <div className="user-profile-detailed">
      <h2>Welcome, {user.name}!</h2>
      <div>Role: {user.role}</div>
      <div>Email: {user.email}</div>
      {user.fullProfile && (
        <div className="detailed-info">
          <div>Last Login: {user.lastLogin}</div>
          <div>Profile Loaded: {user.loadedAt}</div>
          <div>Settings: {JSON.stringify(user.additionalSettings)}</div>
        </div>
      )}
    </div>
  );
}
```

### Complex Async Dependencies

```tsx
import { useProductStore, useUserStore, useUIStore } from '../setup/stores';

function AsyncSearchResults() {
  const filtersStore = useProductStore('filters');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  const loadingStore = useUIStore('loading');
  
  const searchResults = useAsyncComputedStore(
    [filtersStore, sessionStore, preferencesStore],
    async ([filters, session, preferences]) => {
      if (!filters.searchTerm?.trim()) return [];
      
      // Build search parameters based on user context
      const params = new URLSearchParams({
        q: filters.searchTerm,
        category: filters.category || '',
        minPrice: filters.priceRange?.min?.toString() || '0',
        maxPrice: filters.priceRange?.max?.toString() || '10000',
        sortBy: filters.sortBy || 'relevance',
        language: preferences.language,
        userId: session.isAuthenticated ? session.userId : 'anonymous'
      });
      
      // Add user permission-based parameters
      if (session.permissions.includes('view_premium_products')) {
        params.append('includePremium', 'true');
      }
      
      const response = await fetch(`/api/products/search?${params}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Apply client-side post-processing based on preferences
      const processedResults = data.results.map(product => ({
        ...product,
        displayPrice: preferences.language === 'ko' ? 
          `₩${product.price.toLocaleString('ko-KR')}` : 
          `$${product.price.toFixed(2)}`,
        isAccessible: session.permissions.includes('view_all_products') || product.isPublic
      }));
      
      return {
        results: processedResults,
        total: data.total,
        searchQuery: filters.searchTerm,
        searchedAt: new Date().toISOString(),
        userContext: {
          language: preferences.language,
          isAuthenticated: session.isAuthenticated,
          hasPermissions: session.permissions.length > 0
        }
      };
    },
    {
      initialValue: { results: [], total: 0, searchQuery: '', searchedAt: null, userContext: null },
      debounce: 300, // Debounce search requests
      name: 'searchResults'
    }
  );
  
  return searchResults;
}

// Using the complex async search
function ProductSearchResults() {
  const { value: searchData, loading, error, reload } = AsyncSearchResults();
  const filtersStore = useProductStore('filters');
  const currentFilters = useStoreValue(filtersStore);
  
  if (loading) {
    return <div className="search-loading">Searching for "{currentFilters.searchTerm}"...</div>;
  }
  
  if (error) {
    return (
      <div className="search-error">
        Search error: {error.message}
        <button onClick={reload}>Try Again</button>
      </div>
    );
  }
  
  const { results, total, searchQuery, searchedAt, userContext } = searchData;
  
  if (results.length === 0 && searchQuery) {
    return <div className="no-results">No results found for "{searchQuery}"</div>;
  }
  
  return (
    <div className="search-results">
      <div className="search-meta">
        <div>Found {total} results for "{searchQuery}"</div>
        <div className="search-context">
          Language: {userContext?.language}, 
          User: {userContext?.isAuthenticated ? 'Authenticated' : 'Guest'}
        </div>
        <small>Searched at: {searchedAt}</small>
      </div>
      
      <div className="results-list">
        {results.map(product => (
          <div key={product.id} className="product-item">
            <h3>{product.name}</h3>
            <div className="price">{product.displayPrice}</div>
            <div className="category">{product.category}</div>
            {!product.isAccessible && <span className="restricted">Premium</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Real-World Examples

### E-commerce Cart Calculator

```tsx
import { useComputedStore } from '@context-action/react';
import { useProductStore, useUserStore } from '../setup/stores';

function useAdvancedCartCalculator() {
  const cartStore = useProductStore('cart');
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  
  const cartCalculation = useComputedStore(
    [cartStore, profileStore, sessionStore, preferencesStore],
    ([cart, profile, session, preferences]) => {
      if (!cart.items || cart.items.length === 0) {
        return {
          subtotal: 0,
          discounts: [],
          totalDiscount: 0,
          shipping: 0,
          tax: 0,
          total: 0,
          savings: 0,
          currency: preferences.language === 'ko' ? '₩' : '$',
          breakdown: {
            items: [],
            summary: 'Empty cart'
          }
        };
      }
      
      // Calculate subtotal
      const subtotal = cart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      // Apply role-based discounts
      const discounts = [];
      let totalDiscount = 0;
      
      // Admin discount
      if (profile.role === 'admin') {
        const adminDiscount = subtotal * 0.15; // 15% admin discount
        discounts.push({ type: 'admin', amount: adminDiscount, description: 'Admin Discount (15%)' });
        totalDiscount += adminDiscount;
      }
      
      // Session-based discounts (loyalty points)
      if (session.permissions.includes('loyalty_member') && subtotal > 100) {
        const loyaltyDiscount = Math.min(subtotal * 0.05, 50); // 5% up to $50
        discounts.push({ type: 'loyalty', amount: loyaltyDiscount, description: 'Loyalty Member (5%)' });
        totalDiscount += loyaltyDiscount;
      }
      
      // Apply cart-level discounts
      cart.discounts.forEach(discount => {
        const discountAmount = discount.type === 'percentage'
          ? subtotal * (discount.value / 100)
          : discount.value;
        discounts.push({ 
          type: 'promo', 
          amount: discountAmount, 
          description: `Promo: ${discount.code}` 
        });
        totalDiscount += discountAmount;
      });
      
      const afterDiscount = Math.max(0, subtotal - totalDiscount);
      
      // Calculate shipping based on user role and cart value
      const isEligibleForFreeShipping = 
        profile.role === 'admin' || 
        (session.permissions.includes('premium_member') && afterDiscount > 75) ||
        afterDiscount > 150;
      
      const shippingCost = isEligibleForFreeShipping ? 0 : 15;
      
      // Calculate tax (simplified)
      const taxRate = preferences.language === 'ko' ? 0.1 : 0.08; // 10% KR, 8% US
      const taxAmount = (afterDiscount + shippingCost) * taxRate;
      
      const total = afterDiscount + shippingCost + taxAmount;
      
      // Currency formatting
      const currency = preferences.language === 'ko' ? '₩' : '$';
      const formatMoney = (amount) => 
        preferences.language === 'ko' 
          ? `${currency}${Math.round(amount).toLocaleString('ko-KR')}`
          : `${currency}${amount.toFixed(2)}`;
      
      return {
        subtotal: formatMoney(subtotal),
        discounts,
        totalDiscount: formatMoney(totalDiscount),
        shipping: formatMoney(shippingCost),
        tax: formatMoney(taxAmount),
        total: formatMoney(total),
        savings: formatMoney(totalDiscount + (shippingCost > 0 ? 0 : 15)),
        currency,
        breakdown: {
          items: cart.items.map(item => ({
            ...item,
            totalPrice: formatMoney(item.price * item.quantity)
          })),
          summary: `${cart.items.length} items, ${discounts.length} discounts applied`
        },
        eligibleForFreeShipping: isEligibleForFreeShipping,
        userBenefits: {
          roleDiscount: profile.role === 'admin' ? '15% Admin Discount' : null,
          loyaltyDiscount: session.permissions.includes('loyalty_member') ? 'Loyalty Member Benefits' : null,
          freeShipping: isEligibleForFreeShipping ? 'Free Shipping Applied' : null
        }
      };
    }
  );
  
  return cartCalculation;
}

// Usage component
function CartSummary() {
  const cartData = useAdvancedCartCalculator();
  
  return (
    <div className="cart-summary">
      <h3>Cart Summary</h3>
      
      <div className="cart-line">
        <span>Subtotal:</span>
        <span>{cartData.subtotal}</span>
      </div>
      
      {cartData.discounts.map((discount, index) => (
        <div key={index} className="cart-line discount">
          <span>{discount.description}:</span>
          <span>-{cartData.currency}{discount.amount.toFixed(2)}</span>
        </div>
      ))}
      
      <div className="cart-line">
        <span>Shipping:</span>
        <span>{cartData.shipping}</span>
        {cartData.eligibleForFreeShipping && <small>(Free!)</small>}
      </div>
      
      <div className="cart-line">
        <span>Tax:</span>
        <span>{cartData.tax}</span>
      </div>
      
      <div className="cart-line total">
        <strong>
          <span>Total:</span>
          <span>{cartData.total}</span>
        </strong>
      </div>
      
      {cartData.userBenefits && (
        <div className="user-benefits">
          <h4>Your Benefits:</h4>
          {cartData.userBenefits.roleDiscount && <div>✓ {cartData.userBenefits.roleDiscount}</div>}
          {cartData.userBenefits.loyaltyDiscount && <div>✓ {cartData.userBenefits.loyaltyDiscount}</div>}
          {cartData.userBenefits.freeShipping && <div>✓ {cartData.userBenefits.freeShipping}</div>}
        </div>
      )}
      
      <div className="cart-breakdown">
        <small>{cartData.breakdown.summary}</small>
        <div>Total Savings: {cartData.savings}</div>
      </div>
    </div>
  );
}
```

### User Permission Calculator

```tsx
import { useUserStore, useUIStore } from '../setup/stores';

function useUserPermissionCalculator() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  const navigationStore = useUIStore('navigation');
  
  const userPermissions = useComputedStore(
    [profileStore, sessionStore, preferencesStore, navigationStore],
    ([profile, session, preferences, navigation]) => {
      if (!session.isAuthenticated) {
        return {
          level: 'guest',
          canRead: false,
          canWrite: false,
          canDelete: false,
          canAdmin: false,
          canModerate: false,
          features: [],
          restrictions: ['Must be authenticated'],
          contextualPermissions: {
            currentPage: navigation.currentRoute,
            allowedActions: ['view_public']
          }
        };
      }
      
      // Role-based permissions
      const rolePermissions = {
        admin: ['read', 'write', 'delete', 'admin', 'moderate', 'view_all', 'manage_users'],
        user: ['read', 'write', 'view_own'],
        guest: ['read']
      };
      
      const basePermissions = rolePermissions[profile.role] || rolePermissions.guest;
      const sessionPermissions = session.permissions || [];
      
      // Merge base permissions with session permissions
      const allPermissions = [...new Set([...basePermissions, ...sessionPermissions])];
      
      // Feature flags based on user preferences and role
      const enabledFeatures = [];
      
      // Language-specific features
      if (preferences.language === 'ko') {
        enabledFeatures.push('korean_content', 'local_payment');
      }
      
      // Role-specific features
      if (profile.role === 'admin') {
        enabledFeatures.push('advanced_analytics', 'user_management', 'system_settings');
      } else if (allPermissions.includes('moderate')) {
        enabledFeatures.push('content_moderation', 'user_reports');
      }
      
      // Theme-specific features
      if (preferences.theme === 'dark') {
        enabledFeatures.push('dark_mode_exclusive');
      }
      
      // Context-aware permissions based on current page
      const contextualPermissions = {
        currentPage: navigation.currentRoute,
        allowedActions: []
      };
      
      // Page-specific permissions
      if (navigation.currentRoute.startsWith('/admin')) {
        if (allPermissions.includes('admin')) {
          contextualPermissions.allowedActions.push('access_admin', 'manage_system');
        }
      } else if (navigation.currentRoute.startsWith('/user')) {
        if (allPermissions.includes('read')) {
          contextualPermissions.allowedActions.push('view_profile', 'edit_profile');
        }
      }
      
      // Activity-based restrictions
      const restrictions = [];
      const timeSinceLastActivity = Date.now() - session.lastActivity;
      
      if (timeSinceLastActivity > 1800000) { // 30 minutes
        restrictions.push('Session timeout warning');
      }
      
      if (sessionPermissions.length === 0) {
        restrictions.push('Limited permissions - contact admin');
      }
      
      return {
        level: profile.role,
        canRead: allPermissions.includes('read'),
        canWrite: allPermissions.includes('write'),
        canDelete: allPermissions.includes('delete') && profile.role === 'admin',
        canAdmin: allPermissions.includes('admin'),
        canModerate: allPermissions.includes('moderate'),
        features: enabledFeatures,
        restrictions,
        contextualPermissions,
        permissionSummary: {
          totalPermissions: allPermissions.length,
          rolePermissions: basePermissions.length,
          sessionPermissions: sessionPermissions.length,
          enabledFeatures: enabledFeatures.length
        },
        securityContext: {
          isElevated: profile.role === 'admin',
          requiresReauth: timeSinceLastActivity > 3600000, // 1 hour
          sessionValid: session.isAuthenticated && timeSinceLastActivity < 7200000 // 2 hours
        }
      };
    }
  );
  
  return userPermissions;
}

// Usage component
function UserPermissionDisplay() {
  const permissions = useUserPermissionCalculator();
  
  return (
    <div className="user-permissions">
      <h3>User Permissions ({permissions.level})</h3>
      
      <div className="permission-grid">
        <div className="permission-item">
          <label>Read:</label>
          <span className={permissions.canRead ? 'allowed' : 'denied'}>
            {permissions.canRead ? '✓' : '✗'}
          </span>
        </div>
        
        <div className="permission-item">
          <label>Write:</label>
          <span className={permissions.canWrite ? 'allowed' : 'denied'}>
            {permissions.canWrite ? '✓' : '✗'}
          </span>
        </div>
        
        <div className="permission-item">
          <label>Delete:</label>
          <span className={permissions.canDelete ? 'allowed' : 'denied'}>
            {permissions.canDelete ? '✓' : '✗'}
          </span>
        </div>
        
        <div className="permission-item">
          <label>Admin:</label>
          <span className={permissions.canAdmin ? 'allowed' : 'denied'}>
            {permissions.canAdmin ? '✓' : '✗'}
          </span>
        </div>
      </div>
      
      {permissions.features.length > 0 && (
        <div className="enabled-features">
          <h4>Enabled Features:</h4>
          <ul>
            {permissions.features.map(feature => (
              <li key={feature}>{feature.replace('_', ' ')}</li>
            ))}
          </ul>
        </div>
      )}
      
      {permissions.restrictions.length > 0 && (
        <div className="restrictions">
          <h4>Restrictions:</h4>
          <ul>
            {permissions.restrictions.map((restriction, index) => (
              <li key={index} className="restriction">{restriction}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="permission-summary">
        <h4>Summary:</h4>
        <div>Total Permissions: {permissions.permissionSummary.totalPermissions}</div>
        <div>Role Permissions: {permissions.permissionSummary.rolePermissions}</div>
        <div>Session Permissions: {permissions.permissionSummary.sessionPermissions}</div>
        <div>Features: {permissions.permissionSummary.enabledFeatures}</div>
      </div>
      
      <div className="contextual-info">
        <h4>Current Context:</h4>
        <div>Page: {permissions.contextualPermissions.currentPage}</div>
        <div>Allowed Actions: {permissions.contextualPermissions.allowedActions.join(', ')}</div>
        <div>Session Valid: {permissions.securityContext.sessionValid ? 'Yes' : 'No'}</div>
        {permissions.securityContext.requiresReauth && (
          <div className="warning">⚠️ Re-authentication required</div>
        )}
      </div>
    </div>
  );
}
```

## Error Handling

### Safe Computations

```tsx
import { useUserStore, useProductStore } from '../setup/stores';

function useSafeProductProcessing() {
  const catalogStore = useProductStore('catalog');
  const filtersStore = useProductStore('filters');
  const sessionStore = useUserStore('session');
  
  const safeProcessedProducts = useComputedStore(
    [catalogStore, filtersStore, sessionStore],
    ([catalog, filters, session]) => {
      try {
        // Potentially risky computation
        const processedProducts = catalog.map(product => {
          if (!product || typeof product.price !== 'number') {
            throw new Error(`Invalid product data: ${product?.id}`);
          }
          
          return {
            ...product,
            formattedPrice: product.price.toFixed(2),
            canAccess: session.permissions.includes('view_all_products') || product.isPublic,
            matchesFilter: filters.category ? product.category === filters.category : true
          };
        });
        
        return {
          success: true,
          data: processedProducts,
          error: null,
          processedCount: processedProducts.length
        };
      } catch (error) {
        console.error('Product processing error:', error);
        
        return {
          success: false,
          data: [],
          error: error.message,
          fallbackData: catalog.filter(p => p && typeof p.price === 'number')
        };
      }
    }
  );
  
  return safeProcessedProducts;
}

// Usage with error handling
function SafeProductList() {
  const processing = useSafeProductProcessing();
  
  if (!processing.success) {
    return (
      <div className="error-container">
        <div className="error-message">
          Processing Error: {processing.error}
        </div>
        {processing.fallbackData?.length > 0 && (
          <div className="fallback-notice">
            Showing {processing.fallbackData.length} basic products
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div>
      <div>Successfully processed {processing.processedCount} products</div>
      {processing.data.map(product => (
        <div key={product.id}>
          {product.name} - ${product.formattedPrice}
          {!product.canAccess && <span> (Restricted)</span>}
        </div>
      ))}
    </div>
  );
}
```

### Fallback Values

```tsx
import { useUserStore, useUIStore } from '../setup/stores';

function useRobustUserDisplay() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  const navigationStore = useUIStore('navigation');
  
  const userDisplayData = useComputedStore(
    [profileStore, sessionStore, preferencesStore, navigationStore],
    ([profile, session, preferences, navigation]) => {
      // Provide comprehensive fallbacks for all user data
      const displayName = profile?.name || 
                         profile?.email?.split('@')[0] || 
                         (session?.isAuthenticated ? 'Authenticated User' : null) ||
                         'Anonymous';
      
      const theme = preferences?.theme || 
                   (navigation?.currentRoute?.includes('admin') ? 'dark' : 'light');
      
      const language = preferences?.language || 
                      (navigator?.language?.startsWith('ko') ? 'ko' : 'en');
      
      const userLevel = profile?.role || 
                       (session?.permissions?.length > 0 ? 'user' : 'guest');
      
      // Compute completeness score
      const completenessFactors = [
        Boolean(profile?.name),
        Boolean(profile?.email),
        Boolean(profile?.role && profile?.role !== 'guest'),
        Boolean(session?.isAuthenticated),
        Boolean(preferences?.theme),
        Boolean(preferences?.language)
      ];
      
      const completenessScore = (completenessFactors.filter(Boolean).length / completenessFactors.length) * 100;
      
      return {
        displayName,
        theme,
        language,
        userLevel,
        isComplete: completenessScore >= 80,
        completenessScore: Math.round(completenessScore),
        hasBasicInfo: Boolean(profile?.name && profile?.email),
        hasPreferences: Boolean(preferences?.theme && preferences?.language),
        isAuthenticated: Boolean(session?.isAuthenticated),
        warnings: [
          ...(!profile?.name ? ['Name not set'] : []),
          ...(!profile?.email ? ['Email not set'] : []),
          ...(!session?.isAuthenticated ? ['Not authenticated'] : []),
          ...(completenessScore < 50 ? ['Profile mostly incomplete'] : [])
        ],
        suggestions: [
          ...(completenessScore < 100 && session?.isAuthenticated ? ['Complete your profile'] : []),
          ...(!preferences?.theme ? ['Set theme preference'] : []),
          ...(!preferences?.language ? ['Set language preference'] : [])
        ]
      };
    }
  );
  
  return userDisplayData;
}

// Usage component with comprehensive fallbacks
function RobustUserProfile() {
  const userData = useRobustUserDisplay();
  
  return (
    <div className="user-profile-robust" data-theme={userData.theme}>
      <div className="user-header">
        <h2>{userData.displayName}</h2>
        <span className={`user-level ${userData.userLevel}`}>{userData.userLevel}</span>
        {userData.isAuthenticated && <span className="auth-badge">✓</span>}
      </div>
      
      <div className="user-stats">
        <div>Profile Completeness: {userData.completenessScore}%</div>
        <div className={`progress-bar ${userData.isComplete ? 'complete' : 'incomplete'}`}>
          <div 
            className="progress-fill" 
            style={{ width: `${userData.completenessScore}%` }}
          />
        </div>
      </div>
      
      {userData.warnings.length > 0 && (
        <div className="warnings">
          <h4>⚠️ Warnings:</h4>
          <ul>
            {userData.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {userData.suggestions.length > 0 && (
        <div className="suggestions">
          <h4>💡 Suggestions:</h4>
          <ul>
            {userData.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="user-info">
        <div>Theme: {userData.theme}</div>
        <div>Language: {userData.language}</div>
        <div>Status: {userData.isComplete ? 'Complete' : 'Needs attention'}</div>
      </div>
    </div>
  );
}
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