# Basic Store Setup

Shared store context setup patterns for the Context-Action framework.

## Import
```typescript
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';
```

## Type Definitions

### Common Store Patterns
```typescript
// User Domain Stores
interface UserStores {
  profile: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
  };
  preferences: {
    theme: 'light' | 'dark';
    language: 'en' | 'ko' | 'ja' | 'zh';
    notifications: boolean;
  };
  session: {
    isAuthenticated: boolean;
    permissions: string[];
    lastActivity: number;
  };
}

// Product Domain Stores
interface ProductStores {
  catalog: Product[];
  categories: Category[];
  filters: {
    category?: string;
    priceRange?: { min: number; max: number };
    searchTerm?: string;
    sortBy?: 'name' | 'price' | 'rating';
  };
  cart: {
    items: CartItem[];
    total: number;
    discounts: Discount[];
  };
}

// UI State Stores
interface UIStores {
  modal: {
    isOpen: boolean;
    type?: string;
    data?: any;
  };
  loading: {
    global: boolean;
    operations: Record<string, boolean>;
  };
  notifications: {
    items: Notification[];
    maxVisible: number;
  };
  navigation: {
    currentRoute: string;
    history: string[];
    params: Record<string, any>;
  };
}

// Form State Stores
interface FormStores {
  contactForm: {
    name: string;
    email: string;
    message: string;
    errors: Record<string, string>;
    isSubmitting: boolean;
  };
  searchForm: {
    query: string;
    filters: SearchFilters;
    results: SearchResult[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
}
```

### Type Inference Configurations
```typescript
// Simple value configurations (automatic type inference)
const simpleStoreConfig = {
  counter: 0,
  userName: '',
  isLoggedIn: false,
  items: [] as string[],
  settings: { theme: 'light' as const, language: 'en' as const }
};

// Configuration with store options
const advancedStoreConfig = {
  // Simple direct values
  counter: 0,
  userName: '',
  
  // Complex objects with configuration
  user: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow' as const,
    description: 'User profile data'
  },
  
  // Arrays with proper typing
  todos: {
    initialValue: [] as Todo[],
    strategy: 'shallow' as const,
    description: 'Todo list items'
  },
  
  // Nested objects with deep comparison
  preferences: {
    initialValue: {
      theme: 'light' as 'light' | 'dark',
      notifications: true,
      language: 'en'
    },
    strategy: 'deep' as const,
    description: 'User preferences'
  }
};
```

## Context Creation Patterns

### Single Domain Store Context
```typescript
// Basic store context for a specific domain
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
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
```

### Multi-Domain Store Setup
```typescript
// User Domain
const UserStoreContext = createDeclarativeStorePattern('User', {
  profile: { id: '', name: '', email: '', role: 'guest' as const },
  preferences: { theme: 'light' as const, language: 'en', notifications: true },
  session: { isAuthenticated: false, permissions: [], lastActivity: 0 }
});

// Product Domain
const ProductStoreContext = createDeclarativeStorePattern('Product', {
  catalog: [] as Product[],
  categories: [] as Category[],
  filters: {
    initialValue: {},
    strategy: 'shallow' as const
  },
  cart: {
    initialValue: { items: [], total: 0, discounts: [] },
    strategy: 'shallow' as const
  }
});

// UI Domain
const UIStoreContext = createDeclarativeStorePattern('UI', {
  modal: { isOpen: false, type: undefined, data: undefined },
  loading: { 
    initialValue: { global: false, operations: {} },
    strategy: 'shallow' as const
  },
  notifications: {
    initialValue: { items: [], maxVisible: 5 },
    strategy: 'shallow' as const
  }
});

// Extract providers and hooks
export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = UserStoreContext;

export const {
  Provider: ProductStoreProvider,
  useStore: useProductStore,
  useStoreManager: useProductStoreManager
} = ProductStoreContext;

export const {
  Provider: UIStoreProvider,
  useStore: useUIStore,
  useStoreManager: useUIStoreManager
} = UIStoreContext;
```

### Explicit Generic Types Pattern
```typescript
// When you need explicit type control
interface ExplicitUserStores {
  profile: UserProfile;
  preferences: UserPreferences;
  session: UserSession;
}

const {
  Provider: ExplicitUserStoreProvider,
  useStore: useExplicitUserStore,
  useStoreManager: useExplicitUserStoreManager
} = createDeclarativeStorePattern<ExplicitUserStores>('ExplicitUser', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' },
    strategy: 'shallow'
  },
  preferences: {
    initialValue: { theme: 'light', language: 'en', notifications: true },
    strategy: 'shallow'  
  },
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'shallow'
  }
});
```

## Provider Setup Patterns

### Single Provider Setup
```typescript
// Basic single store provider
function App() {
  return (
    <UserStoreProvider>
      <AppContent />
    </UserStoreProvider>
  );
}
```

### Multiple Provider Setup
```typescript
// Manual nesting approach
function App() {
  return (
    <UserStoreProvider>
      <ProductStoreProvider>
        <UIStoreProvider>
          <AppContent />
        </UIStoreProvider>
      </ProductStoreProvider>
    </UserStoreProvider>
  );
}

// Using composeProviders utility (recommended)
import { composeProviders } from '@context-action/react';

const StoreProviders = composeProviders([
  UserStoreProvider,
  ProductStoreProvider,
  UIStoreProvider
]);

function App() {
  return (
    <StoreProviders>
      <AppContent />
    </StoreProviders>
  );
}
```

### HOC Pattern Setup
```typescript
// Using withProvider HOC for automatic wrapping
const AppWithStores = withUserStoreProvider(
  withProductStoreProvider(
    withUIStoreProvider(AppContent)
  )
);

function App() {
  return <AppWithStores />;
}

// Or with compose utility
import { compose } from '@context-action/react';

const AppWithAllStores = compose(
  withUserStoreProvider,
  withProductStoreProvider,
  withUIStoreProvider
)(AppContent);

function App() {
  return <AppWithAllStores />;
}
```

### Conditional Store Setup
```typescript
// Conditional store providers based on features
interface StoreConfig {
  features: {
    userManagement: boolean;
    shopping: boolean;
    analytics: boolean;
  };
}

function AppWithStoreConfig({ config }: { config: StoreConfig }) {
  const providers = [];
  
  // Always include UI stores
  providers.push(UIStoreProvider);
  
  if (config.features.userManagement) {
    providers.push(UserStoreProvider);
  }
  
  if (config.features.shopping) {
    providers.push(ProductStoreProvider);
  }
  
  const ConditionalStoreProviders = composeProviders(providers);
  
  return (
    <ConditionalStoreProviders>
      <AppContent />
    </ConditionalStoreProviders>
  );
}
```

## Export Patterns

### Named Exports (Recommended)
```typescript
// stores/UserStores.ts
export interface UserStores {
  profile: UserProfile;
  preferences: UserPreferences;
  session: UserSession;
}

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', {
  profile: { id: '', name: '', email: '', role: 'guest' as const },
  preferences: { theme: 'light' as const, language: 'en', notifications: true },
  session: { isAuthenticated: false, permissions: [], lastActivity: 0 }
});

// Re-export for easy import
export {
  UserStoreProvider,
  useUserStore,
  useUserStoreManager,
  withUserStoreProvider
};
```

### Barrel Exports
```typescript
// stores/index.ts - Barrel export file
export * from './UserStores';
export * from './ProductStores';
export * from './UIStores';
export * from './FormStores';

// Usage in components
import {
  useUserStore,
  useProductStore,
  useUIStore
} from '../stores';
```

### Store Bundle Exports
```typescript
// stores/StoreContexts.ts - All store contexts in one file
export const UserStoreContext = createDeclarativeStorePattern('User', userConfig);
export const ProductStoreContext = createDeclarativeStorePattern('Product', productConfig);
export const UIStoreContext = createDeclarativeStorePattern('UI', uiConfig);

// Usage
import { UserStoreContext, ProductStoreContext } from '../stores/StoreContexts';

const useUser = UserStoreContext.useStore;
const useProduct = ProductStoreContext.useStore;
```

## Best Practices

### Type Organization
1. **Domain-Driven Types**: Group stores by business domain
2. **Consistent Structure**: Use consistent property naming and structure
3. **Type Safety**: Use `as const` for literal types and proper array typing
4. **Initial Values**: Provide sensible default values for all stores

### Context Configuration
1. **Strategy Selection**: Use 'shallow' for objects, 'deep' for nested structures
2. **Performance**: Consider comparison strategy impact on re-renders
3. **Initial Values**: Match initial values with expected data types
4. **Descriptions**: Add descriptions for complex store configurations

### Provider Organization
1. **Logical Grouping**: Group related store providers together
2. **Provider Order**: Order providers by dependency (independent → dependent)
3. **Composition**: Prefer `composeProviders` over manual nesting
4. **HOC Usage**: Use HOC pattern for component-level provider wrapping

## Store Access Patterns

### Basic Store Access
```typescript
// Component using configured stores
function UserProfile() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferences Store);
  
  const updateProfile = (newData: Partial<UserProfile>) => {
    profileStore.update(current => ({ ...current, ...newData }));
  };
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>Theme: {preferences.theme}</p>
      <button onClick={() => updateProfile({ name: 'New Name' })}>
        Update
      </button>
    </div>
  );
}
```

### Manager-Based Access
```typescript
// Using store manager for complex operations
function UserManagement() {
  const userManager = useUserStoreManager();
  
  const resetAllUserData = () => {
    const profileStore = userManager.getStore('profile');
    const preferencesStore = userManager.getStore('preferences');
    const sessionStore = userManager.getStore('session');
    
    profileStore.setValue({ id: '', name: '', email: '', role: 'guest' });
    preferencesStore.setValue({ theme: 'light', language: 'en', notifications: true });
    sessionStore.setValue({ isAuthenticated: false, permissions: [], lastActivity: 0 });
  };
  
  return (
    <button onClick={resetAllUserData}>
      Reset All Data
    </button>
  );
}
```

## Common Patterns Reference

This setup file provides reusable patterns for:

- **[Store Basic Usage](../store/basic-usage.md)** - Uses UserStores pattern
- **[Store Performance Patterns](../store/performance-patterns.md)** - Uses optimized configurations
- **[useStoreValue Patterns](../store/useStoreValue-patterns.md)** - Uses access patterns
- **[MVVM Architecture](../architecture/mvvm.md)** - Uses domain store separation
- **[Domain Context Architecture](../architecture/domain-context.md)** - Uses multi-domain stores

## Related Setup Guides

- **[Basic Action Setup](./basic-action-setup.md)** - Action context setup patterns
- **[Multi-Context Setup](./multi-context-setup.md)** - Complex architecture setup
- **[Provider Composition](../store/withProvider-pattern.md)** - Advanced provider patterns