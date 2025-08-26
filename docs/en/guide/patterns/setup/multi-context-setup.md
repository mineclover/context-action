# Multi-Context Setup

Complex architecture setup patterns combining multiple contexts for large-scale applications.

## Import
```typescript
import { 
  createActionContext, 
  createStoreContext, 
  createRefContext,
  composeProviders
} from '@context-action/react';
```

## MVVM Architecture Setup

### Complete Type Definitions
```typescript
// Domain: User Management
export interface UserStores {
  profile: { 
    id: string; 
    name: string; 
    email: string; 
    role: 'admin' | 'user' | 'guest' 
  };
  session: { 
    isAuthenticated: boolean; 
    permissions: string[]; 
    lastActivity: number 
  };
  preferences: { 
    theme: 'light' | 'dark'; 
    language: string; 
    notifications: boolean 
  };
}

export interface UserActions {
  login: { email: string; password: string };
  logout: void;
  updateProfile: { name: string; email?: string };
  changePassword: { currentPassword: string; newPassword: string };
  updatePreferences: { preferences: Partial<UserStores['preferences']> };
}

export interface UserPerformanceRefs {
  profileForm: HTMLFormElement;
  avatarImage: HTMLImageElement;
  passwordField: HTMLInputElement;
  themeToggle: HTMLButtonElement;
}

// Domain: Product Management
export interface ProductStores {
  catalog: Product[];
  categories: Category[];
  filters: ProductFilters;
  cart: { items: CartItem[]; total: number };
  wishlist: Product[];
}

export interface ProductActions {
  loadProducts: { categoryId?: string; page?: number };
  addToCart: { productId: string; quantity: number };
  removeFromCart: { productId: string };
  addToWishlist: { productId: string };
  updateFilters: { filters: Partial<ProductFilters> };
  clearCart: void;
}

export interface ProductPerformanceRefs {
  productGrid: HTMLDivElement;
  filterPanel: HTMLDivElement;
  cartDrawer: HTMLDivElement;
  searchInput: HTMLInputElement;
}

// Domain: UI State Management
export interface UIStores {
  modal: { isOpen: boolean; type?: string; data?: any };
  sidebar: { isOpen: boolean; activePanel?: string };
  loading: { global: boolean; operations: Record<string, boolean> };
  notifications: { items: UINotification[]; maxVisible: number };
  navigation: { currentRoute: string; breadcrumbs: Breadcrumb[] };
}

export interface UIActions {
  showModal: { type: string; data?: any };
  hideModal: { type?: string };
  toggleSidebar: { panel?: string };
  setLoading: { operation: string; loading: boolean };
  showNotification: { message: string; type: 'success' | 'error' | 'info' };
  navigate: { route: string; replace?: boolean };
}
```

### MVVM Context Creation
```typescript
// User Domain - Model Layer (Store Only Pattern)
export const UserModelContext = createStoreContext('User', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' as const },
    strategy: 'shallow' as const
  },
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'shallow' as const
  },
  preferences: {
    initialValue: { theme: 'light' as const, language: 'en', notifications: true },
    strategy: 'shallow' as const
  }
});

// User Domain - ViewModel Layer (Action Only Pattern)
export const UserViewModelContext = createActionContext<UserActions>('User');

// User Domain - Performance Layer (RefContext Pattern)
export const UserPerformanceContext = createRefContext<UserPerformanceRefs>('UserPerformance');

// Product Domain - Complete Setup
export const ProductModelContext = createStoreContext('Product', {
  catalog: [] as Product[],
  categories: [] as Category[],
  filters: { initialValue: {}, strategy: 'shallow' as const },
  cart: { 
    initialValue: { items: [], total: 0 },
    strategy: 'shallow' as const
  },
  wishlist: [] as Product[]
});

export const ProductViewModelContext = createActionContext<ProductActions>('Product');
export const ProductPerformanceContext = createRefContext<ProductPerformanceRefs>('ProductPerformance');

// UI Domain - Complete Setup
export const UIModelContext = createStoreContext('UI', {
  modal: { isOpen: false, type: undefined, data: undefined },
  sidebar: { isOpen: false, activePanel: undefined },
  loading: { 
    initialValue: { global: false, operations: {} },
    strategy: 'shallow' as const
  },
  notifications: {
    initialValue: { items: [], maxVisible: 5 },
    strategy: 'shallow' as const
  },
  navigation: {
    initialValue: { currentRoute: '/', breadcrumbs: [] },
    strategy: 'shallow' as const
  }
});

export const UIViewModelContext = createActionContext<UIActions>('UI');
```

### Extract All Providers and Hooks
```typescript
// User Domain
export const {
  Provider: UserModelProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = UserModelContext;

export const {
  Provider: UserViewModelProvider,
  useActionDispatch: useUserActionDispatch,
  useActionHandler: useUserActionHandler
} = UserViewModelContext;

export const {
  Provider: UserPerformanceProvider,
  useRefHandler: useUserPerformanceRef
} = UserPerformanceContext;

// Product Domain
export const {
  Provider: ProductModelProvider,
  useStore: useProductStore,
  useStoreManager: useProductStoreManager
} = ProductModelContext;

export const {
  Provider: ProductViewModelProvider,
  useActionDispatch: useProductActionDispatch,
  useActionHandler: useProductActionHandler
} = ProductViewModelContext;

export const {
  Provider: ProductPerformanceProvider,
  useRefHandler: useProductPerformanceRef
} = ProductPerformanceContext;

// UI Domain
export const {
  Provider: UIModelProvider,
  useStore: useUIStore,
  useStoreManager: useUIStoreManager
} = UIModelContext;

export const {
  Provider: UIViewModelProvider,
  useActionDispatch: useUIActionDispatch,
  useActionHandler: useUIActionHandler
} = UIViewModelContext;
```

## Domain Context Architecture Setup

### Business Domain Setup
```typescript
// Business Context (Core Domain)
export interface BusinessStores {
  orders: Order[];
  inventory: InventoryItem[];
  customers: Customer[];
  analytics: AnalyticsData;
}

export interface BusinessActions {
  processOrder: { customerId: string; items: OrderItem[] };
  updateInventory: { itemId: string; quantity: number };
  validateCustomer: { customerId: string };
  generateReport: { type: string; dateRange: DateRange };
}

export const BusinessModelContext = createStoreContext('Business', {
  orders: [] as Order[],
  inventory: [] as InventoryItem[],
  customers: [] as Customer[],
  analytics: {
    initialValue: { revenue: 0, orders: 0, customers: 0 },
    strategy: 'shallow' as const
  }
});

export const BusinessViewModelContext = createActionContext<BusinessActions>('Business');
```

### Validation Domain Setup
```typescript
// Validation Context (Cross-cutting Concern)
export interface ValidationStores {
  validationRules: ValidationRule[];
  validationResults: ValidationResult[];
  formErrors: Record<string, string[]>;
  fieldStatuses: Record<string, 'valid' | 'invalid' | 'pending'>;
}

export interface ValidationActions {
  validateField: { 
    fieldName: string; 
    value: any; 
    rules: ValidationRule[] 
  };
  validateForm: { 
    formId: string; 
    data: Record<string, any>; 
    schema: ValidationSchema 
  };
  clearValidationErrors: { formId?: string; fieldName?: string };
  setFieldStatus: { fieldName: string; status: 'valid' | 'invalid' | 'pending' };
}

export const ValidationModelContext = createStoreContext('Validation', {
  validationRules: [] as ValidationRule[],
  validationResults: [] as ValidationResult[],
  formErrors: {} as Record<string, string[]>,
  fieldStatuses: {} as Record<string, 'valid' | 'invalid' | 'pending'>
});

export const ValidationViewModelContext = createActionContext<ValidationActions>('Validation');
```

### Design System Context Setup
```typescript
// Design Context (Theme and Visual State)
export interface DesignStores {
  theme: ThemeConfig;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  colorScheme: 'light' | 'dark' | 'auto';
  animations: { enabled: boolean; duration: number };
  layouts: Record<string, LayoutConfig>;
}

export interface DesignActions {
  setTheme: { theme: Partial<ThemeConfig> };
  changeColorScheme: { scheme: 'light' | 'dark' | 'auto' };
  updateBreakpoint: { breakpoint: 'mobile' | 'tablet' | 'desktop' };
  toggleAnimations: { enabled?: boolean };
  setLayout: { layoutId: string; config: LayoutConfig };
}

export const DesignModelContext = createStoreContext('Design', {
  theme: {
    initialValue: defaultTheme,
    strategy: 'deep' as const
  },
  breakpoint: 'desktop' as const,
  colorScheme: 'light' as const,
  animations: {
    initialValue: { enabled: true, duration: 300 },
    strategy: 'shallow' as const
  },
  layouts: {} as Record<string, LayoutConfig>
});

export const DesignViewModelContext = createActionContext<DesignActions>('Design');
```

## Provider Composition Patterns

### Layer-Based Composition (MVVM)
```typescript
// MVVM Layer-based provider composition
const MVVMProviders = composeProviders([
  // Model Layer (State Management)
  UserModelProvider,
  ProductModelProvider,
  UIModelProvider,
  
  // ViewModel Layer (Business Logic)
  UserViewModelProvider,
  ProductViewModelProvider,
  UIViewModelProvider,
  
  // Performance Layer (DOM Operations)
  UserPerformanceProvider,
  ProductPerformanceProvider
]);

function MVVMApp() {
  return (
    <MVVMProviders>
      <ApplicationComponents />
    </MVVMProviders>
  );
}
```

### Domain-Based Composition
```typescript
// Domain-driven provider composition
const DomainProviders = composeProviders([
  // Core Business Domain
  BusinessModelProvider,
  BusinessViewModelProvider,
  
  // User Interface Domain
  UIModelProvider,
  UIViewModelProvider,
  
  // Validation Domain
  ValidationModelProvider,
  ValidationViewModelProvider,
  
  // Design System Domain
  DesignModelProvider,
  DesignViewModelProvider
]);

function DomainApp() {
  return (
    <DomainProviders>
      <DomainComponents />
    </DomainProviders>
  );
}
```

### Conditional Multi-Context Setup
```typescript
// Enterprise configuration with feature flags
interface EnterpriseConfig {
  features: {
    userManagement: boolean;
    productCatalog: boolean;
    analytics: boolean;
    validation: boolean;
    designSystem: boolean;
  };
  performance: {
    enableRefContext: boolean;
    enableCaching: boolean;
  };
}

function createEnterpriseProviders(config: EnterpriseConfig) {
  const providers = [];
  
  // Always include UI management
  providers.push(UIModelProvider, UIViewModelProvider);
  
  if (config.features.userManagement) {
    providers.push(UserModelProvider, UserViewModelProvider);
    if (config.performance.enableRefContext) {
      providers.push(UserPerformanceProvider);
    }
  }
  
  if (config.features.productCatalog) {
    providers.push(ProductModelProvider, ProductViewModelProvider);
    if (config.performance.enableRefContext) {
      providers.push(ProductPerformanceProvider);
    }
  }
  
  if (config.features.analytics) {
    providers.push(BusinessModelProvider, BusinessViewModelProvider);
  }
  
  if (config.features.validation) {
    providers.push(ValidationModelProvider, ValidationViewModelProvider);
  }
  
  if (config.features.designSystem) {
    providers.push(DesignModelProvider, DesignViewModelProvider);
  }
  
  return composeProviders(providers);
}

function EnterpriseApp({ config }: { config: EnterpriseConfig }) {
  const EnterpriseProviders = createEnterpriseProviders(config);
  
  return (
    <EnterpriseProviders>
      <EnterpriseComponents />
    </EnterpriseProviders>
  );
}
```

### Nested Domain Composition
```typescript
// Complex nested domain structure
function createNestedDomainProviders() {
  // Core Infrastructure Layer
  const CoreProviders = composeProviders([
    UIModelProvider,
    UIViewModelProvider,
    ValidationModelProvider,
    ValidationViewModelProvider
  ]);
  
  // Business Logic Layer
  const BusinessProviders = composeProviders([
    BusinessModelProvider,
    BusinessViewModelProvider,
    UserModelProvider,
    UserViewModelProvider
  ]);
  
  // Feature Layer
  const FeatureProviders = composeProviders([
    ProductModelProvider,
    ProductViewModelProvider,
    DesignModelProvider,
    DesignViewModelProvider
  ]);
  
  // Performance Layer
  const PerformanceProviders = composeProviders([
    UserPerformanceProvider,
    ProductPerformanceProvider
  ]);
  
  return { 
    CoreProviders, 
    BusinessProviders, 
    FeatureProviders, 
    PerformanceProviders 
  };
}

function LayeredApp() {
  const { 
    CoreProviders, 
    BusinessProviders, 
    FeatureProviders, 
    PerformanceProviders 
  } = createNestedDomainProviders();
  
  return (
    <CoreProviders>
      <BusinessProviders>
        <FeatureProviders>
          <PerformanceProviders>
            <LayeredComponents />
          </PerformanceProviders>
        </FeatureProviders>
      </BusinessProviders>
    </CoreProviders>
  );
}
```

## Cross-Context Communication Setup

### Event Bus Pattern
```typescript
// Cross-context communication events
export interface CrossContextEvents {
  userLoggedIn: { userId: string; timestamp: number };
  userLoggedOut: { userId: string };
  orderCompleted: { orderId: string; userId: string; total: number };
  productAddedToCart: { productId: string; userId: string; quantity: number };
  themeChanged: { theme: string; userId?: string };
  validationCompleted: { formId: string; isValid: boolean; errors: string[] };
}

export const {
  Provider: EventBusProvider,
  useActionDispatch: useEventBus,
  useActionHandler: useEventHandler
} = createActionContext<CrossContextEvents>('EventBus');

// Add to multi-context setup
const MultiContextWithEvents = composeProviders([
  EventBusProvider,  // Communication layer
  ...otherProviders
]);
```

### Context Bridge Setup
```typescript
// Bridge utilities for cross-context integration
export interface ContextBridge {
  user: {
    store: ReturnType<typeof useUserStoreManager>;
    actions: ReturnType<typeof useUserActionDispatch>;
  };
  product: {
    store: ReturnType<typeof useProductStoreManager>;
    actions: ReturnType<typeof useProductActionDispatch>;
  };
  ui: {
    store: ReturnType<typeof useUIStoreManager>;
    actions: ReturnType<typeof useUIActionDispatch>;
  };
  eventBus: ReturnType<typeof useEventBus>;
}

// Bridge hook for complex cross-context operations
export function useContextBridge(): ContextBridge {
  return {
    user: {
      store: useUserStoreManager(),
      actions: useUserActionDispatch()
    },
    product: {
      store: useProductStoreManager(),
      actions: useProductActionDispatch()
    },
    ui: {
      store: useUIStoreManager(),
      actions: useUIActionDispatch()
    },
    eventBus: useEventBus()
  };
}
```

## Export Patterns for Multi-Context

### Domain Bundle Exports
```typescript
// contexts/UserDomain.ts
export * from './UserTypes';
export { 
  UserModelProvider, 
  UserViewModelProvider, 
  UserPerformanceProvider,
  useUserStore,
  useUserStoreManager,
  useUserActionDispatch,
  useUserActionHandler,
  useUserPerformanceRef
} from './UserContexts';

// contexts/ProductDomain.ts
export * from './ProductTypes';
export { 
  ProductModelProvider, 
  ProductViewModelProvider, 
  ProductPerformanceProvider,
  useProductStore,
  useProductStoreManager,
  useProductActionDispatch,
  useProductActionHandler,
  useProductPerformanceRef
} from './ProductContexts';

// contexts/index.ts - Main export
export * from './UserDomain';
export * from './ProductDomain';
export * from './UIDomain';
export * from './ValidationDomain';
export * from './DesignDomain';
export { useContextBridge } from './ContextBridge';
```

### Provider Composition Exports
```typescript
// providers/index.ts
export { 
  createMVVMProviders,
  createDomainProviders,
  createEnterpriseProviders,
  createNestedDomainProviders
} from './ProviderFactories';

export {
  MVVMProviders,
  DomainProviders,
  EnterpriseProviders
} from './ComposedProviders';
```

## Best Practices for Multi-Context Setup

### Architecture Planning
1. **Domain Boundaries**: Clearly define business domain boundaries
2. **Layer Separation**: Separate Model, ViewModel, and Performance layers
3. **Communication Patterns**: Plan cross-context communication early
4. **Performance Considerations**: Consider provider tree depth and re-render impact

### Provider Organization
1. **Logical Grouping**: Group providers by architectural layer or business domain
2. **Composition Utilities**: Always use `composeProviders` for multiple providers
3. **Conditional Loading**: Use feature flags for optional context providers
4. **Provider Ordering**: Order providers by dependency requirements

### Type Management
1. **Domain Types**: Keep domain types in separate files
2. **Shared Types**: Create shared type libraries for common interfaces
3. **Export Strategy**: Use barrel exports for clean import statements
4. **Type Safety**: Maintain strict TypeScript configuration

## Common Architecture Reference

This setup file provides reusable patterns for:

- **[MVVM Architecture](../architecture/mvvm.md)** - Uses complete MVVM setup
- **[Domain Context Architecture](../architecture/domain-context.md)** - Uses domain separation
- **[Context Splitting Patterns](../architecture/context-splitting.md)** - Uses provider composition
- **[Performance Patterns](../performance/optimization-techniques.md)** - Uses RefContext patterns

## Related Setup Guides

- **[Basic Action Setup](./basic-action-setup.md)** - Single action context patterns
- **[Basic Store Setup](./basic-store-setup.md)** - Single store context patterns
- **[Provider Composition](../store/withProvider-pattern.md)** - Advanced composition techniques