# Provider Composition

Learn how to compose providers effectively for clean architecture, proper context boundaries, and optimal performance in Context-Action applications.

## Provider Architecture Overview

Provider composition creates isolated context boundaries for different domains:

```typescript
// Basic provider structure
<StoreProvider>          {/* State context */}
  <ActionProvider>       {/* Action context */}
    <HandlerSetup />     {/* Handler registration */}
    <Components />       {/* Application components */}
  </ActionProvider>
</StoreProvider>
```

## Single Domain Provider Pattern

### Basic Domain Provider

```typescript
// providers/CounterProvider.tsx
import React from 'react';
import { 
  CounterProvider,
  CounterActionProvider
} from '../stores/counter.store';
import { useCounterHandlers } from '../hooks/useCounterHandlers';

function CounterHandlersSetup() {
  useCounterHandlers();
  return null;
}

export function CounterDomainProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <CounterProvider>
      <CounterActionProvider>
        <CounterHandlersSetup />
        {children}
      </CounterActionProvider>
    </CounterProvider>
  );
}

// Usage
function App() {
  return (
    <CounterDomainProvider>
      <CounterApp />
    </CounterDomainProvider>
  );
}
```

## Multi-Domain Provider Composition

### Nested Provider Pattern

```typescript
// providers/AppProvider.tsx
import React from 'react';
import { 
  UserBusinessProvider,
  UserBusinessActionProvider,
  UserUIProvider,
  UserUIActionProvider
} from '../stores/user';
import {
  CartProvider,
  CartActionProvider
} from '../stores/cart';
import {
  OrderProvider,
  OrderActionProvider
} from '../stores/order';

// Individual domain provider
function UserDomainProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserBusinessProvider>
      <UserUIProvider>
        <UserBusinessActionProvider>
          <UserUIActionProvider>
            <UserHandlersSetup />
            {children}
          </UserUIActionProvider>
        </UserBusinessActionProvider>
      </UserUIProvider>
    </UserBusinessProvider>
  );
}

function CartDomainProvider({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CartActionProvider>
        <CartHandlersSetup />
        {children}
      </CartActionProvider>
    </CartProvider>
  );
}

function OrderDomainProvider({ children }: { children: React.ReactNode }) {
  return (
    <OrderProvider>
      <OrderActionProvider>
        <OrderHandlersSetup />
        {children}
      </OrderActionProvider>
    </OrderProvider>
  );
}

// Application-wide provider composition
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserDomainProvider>
      <CartDomainProvider>
        <OrderDomainProvider>
          {children}
        </OrderDomainProvider>
      </CartDomainProvider>
    </UserDomainProvider>
  );
}
```

### Handler Setup Components

```typescript
// handlers/index.tsx
import { useUserBusinessHandlers } from './useUserBusinessHandlers';
import { useUserUIHandlers } from './useUserUIHandlers';
import { useCartHandlers } from './useCartHandlers';
import { useOrderHandlers } from './useOrderHandlers';

function UserHandlersSetup() {
  useUserBusinessHandlers();
  useUserUIHandlers();
  return null;
}

function CartHandlersSetup() {
  useCartHandlers();
  return null;
}

function OrderHandlersSetup() {
  useOrderHandlers();
  return null;
}

export {
  UserHandlersSetup,
  CartHandlersSetup,
  OrderHandlersSetup
};
```

## HOC Pattern for Self-Contained Components

### Context Store Pattern with HOC

```typescript
// patterns/withUserDomain.tsx
import React from 'react';
import { createContextStorePattern } from '@context-action/react';
import { UserActionProvider } from '../stores/user.store';
import { useUserHandlers } from '../hooks/useUserHandlers';

// Create isolated store pattern
const UserStores = createContextStorePattern('User');

// HOC for complete domain encapsulation
export const withUserDomain = UserStores.withCustomProvider(
  ({ children }) => (
    <UserActionProvider>
      <UserHandlerSetup />
      {children}
    </UserActionProvider>
  ),
  'user-domain'
);

function UserHandlerSetup() {
  useUserHandlers();
  return null;
}

// Usage - completely self-contained
const UserModule = withUserDomain(() => {
  const userStore = UserStores.useStore('profile', {
    id: '',
    name: '',
    email: ''
  });
  
  const profile = useStoreValue(userStore);
  const dispatch = useUserAction();
  
  return (
    <div>
      <h1>User: {profile.name}</h1>
      <button onClick={() => dispatch('updateProfile', { data: { name: 'New Name' } })}>
        Update
      </button>
    </div>
  );
});

// No provider setup needed - completely isolated
function App() {
  return (
    <div>
      <UserModule /> {/* Self-contained with all providers */}
    </div>
  );
}
```

### Multi-Provider HOC

```typescript
// patterns/withMultiDomains.tsx
export function withMultipleDomains<P extends object>(
  Component: React.ComponentType<P>,
  domains: string[]
) {
  return function WrappedComponent(props: P) {
    const providers = domains.map(domain => {
      switch (domain) {
        case 'user':
          return UserDomainProvider;
        case 'cart':
          return CartDomainProvider;
        case 'order':
          return OrderDomainProvider;
        default:
          return React.Fragment;
      }
    });
    
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      <Component {...props} />
    );
  };
}

// Usage
const ECommerceApp = withMultipleDomains(
  ECommerceContent,
  ['user', 'cart', 'order']
);
```

## Provider Scope and Isolation

### Multiple Provider Instances

```typescript
// Different provider scopes = different store instances
function MultiUserApp() {
  return (
    <div>
      <UserProvider> {/* Scope 1 - Admin User */}
        <h2>Admin Section</h2>
        <AdminUserComponent />
      </UserProvider>
      
      <UserProvider> {/* Scope 2 - Regular User */}
        <h2>User Section</h2>
        <RegularUserComponent />
      </UserProvider>
    </div>
  );
}

function AdminUserComponent() {
  const store = useUserStore('profile'); // Instance A
  // Admin-specific logic
  return null;
}

function RegularUserComponent() {
  const store = useUserStore('profile'); // Instance B (different from A)
  // User-specific logic  
  return null;
}
```

### Context Store Pattern for Complete Isolation

```typescript
// Complete isolation with Context Store Pattern
const AdminStores = createContextStorePattern('Admin');
const UserStores = createContextStorePattern('User');

function IsolatedMultiUserApp() {
  return (
    <div>
      <AdminStores.Provider registryId="admin-section">
        <AdminSection />
      </AdminStores.Provider>
      
      <UserStores.Provider registryId="user-section">
        <UserSection />
      </UserStores.Provider>
    </div>
  );
}

function AdminSection() {
  const adminStore = AdminStores.useStore('profile', adminDefaults);
  // Completely isolated admin logic
  return <div>Admin Interface</div>;
}

function UserSection() {
  const userStore = UserStores.useStore('profile', userDefaults);
  // Completely isolated user logic
  return <div>User Interface</div>;
}
```

## Performance Optimizations

### Lazy Provider Loading

```typescript
// Lazy load providers based on conditions
function ConditionalProviders({ children, userRole }: { 
  children: React.ReactNode;
  userRole: string;
}) {
  // Only load admin provider for admin users
  if (userRole === 'admin') {
    return (
      <AdminProvider>
        <UserProvider>
          {children}
        </UserProvider>
      </AdminProvider>
    );
  }
  
  // Regular user only gets user provider
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}
```

### Provider Memoization

```typescript
// Memoize expensive provider setups
const MemoizedUserProvider = React.memo(function UserProvider({ 
  children,
  userId 
}: { 
  children: React.ReactNode;
  userId: string;
}) {
  return (
    <UserBusinessProvider key={userId}>
      <UserUIProvider>
        <UserBusinessActionProvider>
          <UserUIActionProvider>
            <UserHandlersSetup />
            {children}
          </UserUIActionProvider>
        </UserBusinessActionProvider>
      </UserUIProvider>
    </UserBusinessProvider>
  );
});
```

## Testing Provider Compositions

### Test Provider Utilities

```typescript
// test-utils/createTestProvider.tsx
import React from 'react';
import {
  UserProvider,
  UserActionProvider
} from '../stores/user.store';

interface TestProviderProps {
  children: React.ReactNode;
  initialStores?: Record<string, any>;
  enableHandlers?: boolean;
}

export function createTestProvider({
  initialStores = {},
  enableHandlers = false
}: Partial<TestProviderProps> = {}) {
  return function TestProvider({ children }: { children: React.ReactNode }) {
    return (
      <UserProvider>
        <UserActionProvider>
          {enableHandlers && <UserHandlersSetup />}
          <StoreInitializer initialStores={initialStores} />
          {children}
        </UserActionProvider>
      </UserProvider>
    );
  };
}

function StoreInitializer({ initialStores }: { initialStores: Record<string, any> }) {
  const registry = useUserRegistry();
  
  React.useEffect(() => {
    Object.entries(initialStores).forEach(([storeName, initialValue]) => {
      const store = registry.getStore(storeName);
      store.setValue(initialValue);
    });
  }, [registry, initialStores]);
  
  return null;
}

// Usage in tests
const TestProvider = createTestProvider({
  initialStores: {
    profile: { id: '1', name: 'Test User' }
  },
  enableHandlers: true
});

render(
  <TestProvider>
    <ComponentToTest />
  </TestProvider>
);
```

## Common Provider Patterns

### Environment-Based Providers

```typescript
// Different providers for different environments
function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'test') {
    return <MockProvider>{children}</MockProvider>;
  }
  
  if (process.env.NODE_ENV === 'development') {
    return (
      <DevToolsProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </DevToolsProvider>
    );
  }
  
  return <AppProvider>{children}</AppProvider>;
}
```

### Error Boundary Integration

```typescript
// Provider with error boundaries
function RobustProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<ProviderError />}>
      <UserProvider>
        <ErrorBoundary fallback={<ActionError />}>
          <UserActionProvider>
            <ErrorBoundary fallback={<HandlerError />}>
              <UserHandlersSetup />
              {children}
            </ErrorBoundary>
          </UserActionProvider>
        </ErrorBoundary>
      </UserProvider>
    </ErrorBoundary>
  );
}
```

## Best Practices

### ✅ Do

- **Store providers wrap action providers**
- **Include handler setup components**
- **Use domain-specific provider composition**
- **Isolate unrelated domains**
- **Test provider compositions**

### ❌ Don't

- **Action providers outside store providers**
- **Forget handler setup components**
- **Mix unrelated domains in single provider**
- **Create deeply nested provider trees unnecessarily**
- **Skip cleanup in test providers**

## Troubleshooting

### Common Issues

1. **Actions dispatch but no handlers respond**
   - Missing handler setup component
   - Handler registration after action dispatch

2. **Context not found errors**
   - Wrong provider order (action before store)
   - Component outside provider boundary

3. **Stale store data**
   - Multiple provider instances with different scopes
   - Store accessed outside provider boundary

### Debug Provider Trees

```typescript
// Debug provider tree structure
function ProviderDebugger({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }
  
  return (
    <div>
      <div style={{ background: 'yellow', padding: '2px', fontSize: '10px' }}>
        Provider Boundary: User Domain
      </div>
      {children}
    </div>
  );
}
```

---

## Summary

Provider composition in Context-Action framework enables:

- **Clean Domain Boundaries**: Isolated contexts for different domains
- **Flexible Architecture**: HOCs, nested providers, and context patterns
- **Performance Optimization**: Lazy loading and memoization
- **Testability**: Easy provider mocking and testing utilities
- **Error Resilience**: Error boundaries and graceful degradation

Proper provider composition is essential for scalable, maintainable Context-Action applications.

---

::: tip Next Steps
- Learn [Cross-Domain Integration](./cross-domain-integration) for multi-domain provider coordination
- Explore [Testing Guide](./testing) for comprehensive provider testing strategies
- See [Performance Optimization](./performance) for advanced provider optimization techniques
:::