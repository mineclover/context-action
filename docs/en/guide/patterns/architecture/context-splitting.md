# Context Splitting Patterns

Strategies for splitting and managing large contexts when applications grow complex and context providers become unwieldy.

## When to Split Contexts

### Signs You Need Context Splitting

1. **Provider Hierarchy Depth** - More than 5-7 nested providers
2. **Store Complexity** - Single context managing 10+ different store types
3. **Action Overload** - 15+ different action types in one context
4. **Team Boundaries** - Different teams working on the same context
5. **Performance Issues** - Unnecessary re-renders due to large context scope
6. **Maintenance Overhead** - Difficulty finding and managing related code

### Context Growth Example

```typescript
// ❌ Problematic: Overly large single context
interface MassiveAppStores {
  // User related
  userProfile: UserProfile;
  userPreferences: UserPreferences;
  userNotifications: Notification[];
  
  // Product related  
  productCatalog: Product[];
  productCategories: Category[];
  productFilters: ProductFilters;
  productCart: CartItem[];
  
  // Order related
  orderHistory: Order[];
  orderTracking: TrackingInfo[];
  orderPayments: Payment[];
  
  // Admin related
  adminUsers: AdminUser[];
  adminSettings: AdminSettings;
  adminAnalytics: AnalyticsData;
  
  // UI related
  modals: ModalState;
  notifications: UINotification[];
  loading: LoadingState;
  errors: ErrorState;
}

interface MassiveAppActions {
  // 20+ action types mixed together
  updateUserProfile: { userId: string; data: Partial<UserProfile> };
  addToCart: { productId: string; quantity: number };
  processOrder: { orderData: OrderData };
  showModal: { modalType: string; data: any };
  // ... many more actions
}
```

## Splitting Strategies

### Strategy 1: Domain-Based Split

Split contexts based on business domains or logical boundaries.

**Prerequisites**: This pattern uses type definitions and setup patterns from [Multi-Context Setup Guide](../setup/multi-context-setup.md).

```typescript
// ✅ Good: Split by business domains
// Use domain type definitions from Multi-Context Setup
import {
  UserStores, UserActions, UserPerformanceRefs,
  ProductStores, ProductActions, ProductPerformanceRefs,
  UIStores, UIActions
} from '../setup/multi-context-setup';

// Create domain contexts using setup specifications
export const UserDomainContexts = {
  model: createDeclarativeStorePattern<UserStores>('User', {
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
  }),
  viewModel: createActionContext<UserActions>('User'),
  performance: createRefContext<UserPerformanceRefs>('UserPerformance')
};

export const ProductDomainContexts = {
  model: createDeclarativeStorePattern<ProductStores>('Product', {
    catalog: [] as Product[],
    categories: [] as Category[],
    filters: { initialValue: {}, strategy: 'shallow' as const },
    cart: { 
      initialValue: { items: [], total: 0 },
      strategy: 'shallow' as const
    },
    wishlist: [] as Product[]
  }),
  viewModel: createActionContext<ProductActions>('Product'),
  performance: createRefContext<ProductPerformanceRefs>('ProductPerformance')
};

export const UIDomainContexts = {
  model: createDeclarativeStorePattern<UIStores>('UI', {
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
  }),
  viewModel: createActionContext<UIActions>('UI')
};
```

### Strategy 2: Layer-Based Split

Split contexts based on architectural layers or technical concerns.

**Prerequisites**: This pattern uses setup patterns from [Multi-Context Setup Guide](../setup/multi-context-setup.md).

```typescript
// Layer-based context splitting using Multi-Context Setup specifications
import {
  BusinessStores, BusinessActions,
  ValidationStores, ValidationActions,
  DesignStores, DesignActions
} from '../setup/multi-context-setup';

// Data Layer Context (using Business domain setup)
export const DataLayerContexts = {
  model: createDeclarativeStorePattern<BusinessStores>('Data', {
    orders: [] as Order[],
    inventory: [] as InventoryItem[],
    customers: [] as Customer[],
    analytics: {
      initialValue: { revenue: 0, orders: 0, customers: 0 },
      strategy: 'shallow' as const
    }
  }),
  viewModel: createActionContext<BusinessActions>('Data')
};

// Validation Layer Context (using Validation domain setup)
export const ValidationLayerContexts = {
  model: createDeclarativeStorePattern<ValidationStores>('Validation', {
    validationRules: [] as ValidationRule[],
    validationResults: [] as ValidationResult[],
    formErrors: {} as Record<string, string[]>,
    fieldStatuses: {} as Record<string, 'valid' | 'invalid' | 'pending'>
  }),
  viewModel: createActionContext<ValidationActions>('Validation')
};

// Design Layer Context (using Design domain setup)
export const DesignLayerContexts = {
  model: createDeclarativeStorePattern<DesignStores>('Design', {
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
  }),
  viewModel: createActionContext<DesignActions>('Design')
};
```

### Strategy 3: Feature-Based Split

Split contexts based on application features or modules.

### Strategy 4: Resource-Based Split (RefContext Pattern)

Split contexts based on external resources and singleton objects that need lazy evaluation and lifecycle management.

```typescript
// Database Resource Context
export interface DatabaseRefs {
  connection: DatabaseConnection;
  queryBuilder: QueryBuilder;
  migrationManager: MigrationManager;
}

export const {
  Provider: DatabaseRefProvider,
  useRefHandler: useDatabaseRef
} = createRefContext<DatabaseRefs>('Database');

// External Services Context  
export interface ServiceRefs {
  analytics: AnalyticsSDK;
  logger: LoggerService;
  eventTracker: EventTracker;
  notificationService: NotificationAPI;
}

export const {
  Provider: ServiceRefProvider,
  useRefHandler: useServiceRef
} = createRefContext<ServiceRefs>('Services');

// Third-Party Libraries Context
export interface LibraryRefs {
  chartEngine: ChartEngineInstance;
  mapService: MapSDK;
  videoPlayer: VideoPlayerAPI;
  audioContext: AudioContext;
}

export const {
  Provider: LibraryRefProvider,
  useRefHandler: useLibraryRef
} = createRefContext<LibraryRefs>('Libraries');

// Resource initialization with lazy evaluation
function useResourceInitialization() {
  const connection = useDatabaseRef('connection');
  const analytics = useServiceRef('analytics');
  const chartEngine = useLibraryRef('chartEngine');
  
  useEffect(() => {
    // Lazy initialization of database connection
    if (!connection.target) {
      const dbConnection = new DatabaseConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      });
      connection.setRef({ current: dbConnection });
    }
    
    // Lazy initialization of analytics service
    if (!analytics.target) {
      AnalyticsSDK.initialize({
        apiKey: process.env.ANALYTICS_KEY
      }).then(sdk => {
        analytics.setRef({ current: sdk });
      });
    }
    
    // Conditional chart engine loading
    if (!chartEngine.target && shouldLoadCharts()) {
      import('expensive-chart-library').then(ChartEngine => {
        const engine = new ChartEngine.default();
        chartEngine.setRef({ current: engine });
      });
    }
    
    // Cleanup on unmount
    return () => {
      connection.target?.close();
      analytics.target?.dispose();
      chartEngine.target?.destroy();
    };
  }, [connection, analytics, chartEngine]);
}
```

```typescript
// Authentication Feature
export interface AuthStores {
  session: SessionData;
  tokens: TokenData;
  permissions: Permission[];
}

export interface AuthActions {
  login: { credentials: LoginCredentials };
  logout: void;
  refreshToken: void;
  checkPermission: { permission: string };
}

// Shopping Feature  
export interface ShoppingStores {
  cart: CartState;
  wishlist: WishlistState;
  checkout: CheckoutState;
}

export interface ShoppingActions {
  addToCart: { productId: string; quantity: number };
  addToWishlist: { productId: string };
  proceedToCheckout: { cartItems: CartItem[] };
}

// Analytics Feature
export interface AnalyticsStores {
  events: AnalyticsEvent[];
  metrics: MetricsData;
  reports: ReportData[];
}

export interface AnalyticsActions {
  trackEvent: { event: string; properties: Record<string, any> };
  generateReport: { reportType: string; dateRange: DateRange };
  exportData: { format: 'csv' | 'json'; data: any[] };
}
```

## Migration Patterns

### Gradual Migration Strategy

```typescript
// Step 1: Create new split contexts while keeping old one
// Keep existing MassiveAppContext for backward compatibility
const {
  Provider: LegacyAppProvider,
  useStore: useLegacyAppStore,
  useStoreManager: useLegacyAppStoreManager
} = createDeclarativeStorePattern<MassiveAppStores>('LegacyApp', {
  // ... existing configuration
});

// Step 2: Create new domain-specific contexts
const {
  Provider: UserModelProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern<UserStores>('User', {
  profile: { initialValue: defaultUserProfile },
  preferences: { initialValue: defaultPreferences },
  notifications: { initialValue: [] }
});

// Step 3: Create bridge hooks for migration
export function useMigratedUserData() {
  const legacyManager = useLegacyAppStoreManager();
  const newManager = useUserStoreManager();
  
  useEffect(() => {
    // Sync data from legacy to new context
    const legacyProfile = legacyManager.getStore('userProfile').getValue();
    const newProfileStore = newManager.getStore('profile');
    
    if (legacyProfile && !newProfileStore.getValue().id) {
      newProfileStore.setValue(legacyProfile);
    }
  }, [legacyManager, newManager]);
  
  // Return new context hooks
  return {
    useStore: useUserStore,
    useStoreManager: useUserStoreManager
  };
}

// Step 4: Update components gradually
function UserProfile() {
  // Old way (still works during migration)
  // const legacyProfileStore = useLegacyAppStore('userProfile');
  
  // New way (migrate to this)
  const { useStore } = useMigratedUserData();
  const profileStore = useStore('profile');
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}
```

### Context Composition Patterns

#### Manual Provider Composition (Verbose)

```typescript
// ❌ Problematic: Too many nested providers - hard to read and maintain
function App() {
  return (
    {/* Core Infrastructure Contexts */}
    <DataModelProvider>
      <DataActionProvider>
        
        {/* Business Domain Contexts */}
        <UserModelProvider>
          <UserActionProvider>
            
            <ProductModelProvider>
              <ProductActionProvider>
                
                <OrderModelProvider>
                  <OrderActionProvider>
                    
                    {/* UI Layer Context */}
                    <UIModelProvider>
                      <UIActionProvider>
                        
                        {/* Feature-Specific Contexts */}
                        <AuthModelProvider>
                          <AuthActionProvider>
                            
                            <ShoppingModelProvider>
                              <ShoppingActionProvider>
                                
                                <AppContent />
                                
                              </ShoppingActionProvider>
                            </ShoppingModelProvider>
                          </AuthActionProvider>
                        </AuthModelProvider>
                      </UIActionProvider>
                    </UIModelProvider>
                  </OrderActionProvider>
                </OrderModelProvider>
              </ProductActionProvider>
            </ProductModelProvider>
          </UserActionProvider>
        </UserModelProvider>
      </DataActionProvider>
    </DataModelProvider>
  );
}
```

#### Provider Composition Utilities (Recommended)

The Context-Action framework provides the `composeProviders` utility to eliminate Provider nesting hell. Instead of manually nesting multiple providers, you can compose them into a single JSX-compatible component.

For detailed implementation examples and advanced patterns, see the [`composeProviders` documentation](../../../packages/react/src/stores/utils/provider-composition.ts).

#### Advanced Provider Composition Patterns

The `composeProviders` utility supports advanced composition patterns including:

- **Domain-grouped composition**: Group providers by business domain or technical layer
- **Conditional composition**: Include providers based on feature flags or configuration  
- **Environment-specific composition**: Different provider sets for development/production
- **Nested composition**: Compose multiple composed providers together

For complete examples of these advanced patterns, see the [`composeProviders` source code](../../../packages/react/src/stores/utils/provider-composition.ts).

#### Provider Tree Visualization Utility

```typescript
// Development utility to visualize provider composition
function createProviderTree(providerNames: string[]) {
  console.log('Provider Tree:');
  providerNames.forEach((name, index) => {
    const indent = '  '.repeat(index);
    console.log(`${indent}├─ ${name}Provider`);
  });
  console.log(`${'  '.repeat(providerNames.length)}└─ AppContent`);
}

// Usage in development
if (process.env.NODE_ENV === 'development') {
  createProviderTree([
    'Data', 'User', 'Product', 'Order', 
    'UI', 'Auth', 'Shopping', 'Analytics'
  ]);
}
```

### Selective Provider Pattern

```typescript
// Only include contexts that are actually needed
interface AppConfig {
  features: {
    auth: boolean;
    shopping: boolean;
    analytics: boolean;
    admin: boolean;
  };
  domains: {
    user: boolean;
    product: boolean;
    order: boolean;
  };
}

function ConfigurableApp({ config }: { config: AppConfig }) {
  let app = <AppCore />;
  
  // Wrap only needed domain contexts
  if (config.domains.user) {
    app = (
      <UserModelProvider>
        <UserActionProvider>
          {app}
        </UserActionProvider>
      </UserModelProvider>
    );
  }
  
  if (config.domains.product) {
    app = (
      <ProductModelProvider>
        <ProductActionProvider>
          {app}
        </ProductActionProvider>
      </ProductModelProvider>
    );
  }
  
  // Wrap only needed feature contexts
  if (config.features.auth) {
    app = (
      <AuthModelProvider>
        <AuthActionProvider>
          {app}
        </AuthActionProvider>
      </AuthModelProvider>
    );
  }
  
  if (config.features.shopping) {
    app = (
      <ShoppingModelProvider>
        <ShoppingActionProvider>
          {app}
        </ShoppingActionProvider>
      </ShoppingModelProvider>
    );
  }
  
  return app;
}

// Usage with different configurations
function ProductionApp() {
  return (
    <ConfigurableApp 
      config={{
        features: { auth: true, shopping: true, analytics: true, admin: false },
        domains: { user: true, product: true, order: true }
      }}
    />
  );
}

function DevelopmentApp() {
  return (
    <ConfigurableApp 
      config={{
        features: { auth: true, shopping: true, analytics: false, admin: true },
        domains: { user: true, product: true, order: false }
      }}
    />
  );
}
```

## Cross-Context Communication

### Event-Driven Communication

```typescript
// Create a communication bus for cross-context messaging
export interface CrossContextEvents {
  userLoggedIn: { userId: string; timestamp: number };
  orderCompleted: { orderId: string; userId: string };
  productAddedToCart: { productId: string; userId: string };
  paymentProcessed: { paymentId: string; orderId: string };
}

export const {
  Provider: EventBusProvider,
  useActionDispatch: useEventBus,
  useActionHandler: useEventHandler
} = createActionContext<CrossContextEvents>('EventBus');

// In User context - emit events
export function useUserActions() {
  const eventBus = useEventBus();
  const userManager = useUserStoreManager();
  
  const loginHandler = useCallback(async (payload, controller) => {
    try {
      const user = await authAPI.login(payload.credentials);
      
      // Update user context
      const profileStore = userManager.getStore('profile');
      profileStore.setValue(user);
      
      // Emit cross-context event
      eventBus('userLoggedIn', { 
        userId: user.id, 
        timestamp: Date.now() 
      });
      
    } catch (error) {
      controller.abort('Login failed', error);
    }
  }, [userManager, eventBus]);
  
  useUserActionHandler('login', loginHandler);
}

// In Shopping context - listen to events
export function useShoppingEventHandlers() {
  const shoppingManager = useShoppingStoreManager();
  
  const userLoggedInHandler = useCallback(async (payload, controller) => {
    // Reset cart for new user
    const cartStore = shoppingManager.getStore('cart');
    const savedCart = await loadUserCart(payload.userId);
    cartStore.setValue(savedCart);
  }, [shoppingManager]);
  
  useEventHandler('userLoggedIn', userLoggedInHandler);
}

// In Analytics context - track events
export function useAnalyticsEventHandlers() {
  const analyticsManager = useAnalyticsStoreManager();
  
  const trackUserLogin = useCallback(async (payload, controller) => {
    const eventsStore = analyticsManager.getStore('events');
    eventsStore.update(events => [...events, {
      type: 'user_login',
      userId: payload.userId,
      timestamp: payload.timestamp
    }]);
  }, [analyticsManager]);
  
  const trackOrderCompletion = useCallback(async (payload, controller) => {
    const eventsStore = analyticsManager.getStore('events');
    eventsStore.update(events => [...events, {
      type: 'order_completed',
      orderId: payload.orderId,
      userId: payload.userId,
      timestamp: Date.now()
    }]);
  }, [analyticsManager]);
  
  useEventHandler('userLoggedIn', trackUserLogin);
  useEventHandler('orderCompleted', trackOrderCompletion);
}
```

### Direct Context Bridge Pattern

```typescript
// Create explicit bridges between contexts
export function useUserOrderBridge() {
  const userManager = useUserStoreManager();
  const orderManager = useOrderStoreManager();
  const eventBus = useEventBus();
  
  // Bridge user actions to order context
  const createOrderHandler = useCallback(async (payload, controller) => {
    const userStore = userManager.getStore('profile');
    const currentUser = userStore.getValue();
    
    if (!currentUser.id) {
      controller.abort('User not logged in');
      return;
    }
    
    // Create order with user context
    const order = await orderAPI.create({
      ...payload.orderData,
      userId: currentUser.id,
      userEmail: currentUser.email
    });
    
    // Update order context
    const historyStore = orderManager.getStore('history');
    historyStore.update(orders => [...orders, order]);
    
    // Emit event for other contexts
    eventBus('orderCompleted', {
      orderId: order.id,
      userId: currentUser.id
    });
    
    return order;
  }, [userManager, orderManager, eventBus]);
  
  useOrderActionHandler('createOrder', createOrderHandler);
}
```

## Performance Considerations

### Context-Specific Optimization

```typescript
// Optimize each context independently
export function useOptimizedUserContext() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // Use different optimization strategies per store
  const profile = useStoreValue(profileStore, undefined, {
    comparison: 'shallow',  // Profile objects change frequently
    debounce: 100          // Debounce rapid profile updates
  });
  
  const preferences = useStoreValue(preferencesStore, undefined, {
    comparison: 'deep',     // Preferences are nested and change rarely
    debounce: 500          // Higher debounce for settings
  });
  
  return { profile, preferences };
}

// Selective context loading
export function useContextLoader(requiredContexts: string[]) {
  const [loadedContexts, setLoadedContexts] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const loadContexts = async () => {
      for (const contextName of requiredContexts) {
        if (!loadedContexts.has(contextName)) {
          // Lazy load context data
          await loadContextData(contextName);
          setLoadedContexts(prev => new Set([...prev, contextName]));
        }
      }
    };
    
    loadContexts();
  }, [requiredContexts, loadedContexts]);
  
  return loadedContexts;
}
```

## Best Practices for Context Splitting

### ✅ Do's

1. **Follow Setup Specifications**
   - Use type definitions from [Multi-Context Setup Guide](../setup/multi-context-setup.md) for consistency
   - Follow established patterns for domain and layer separation
   - Reuse setup specifications for 90%+ pattern compliance

2. **Plan Domain Boundaries**
   - Identify clear business or technical boundaries
   - Consider team ownership and responsibilities  
   - Plan for future growth and changes

3. **Provider Composition**
   - Use patterns from [Multi-Context Setup Guide](../setup/multi-context-setup.md)
   - Create reusable provider composition with JSX-compatible components  
   - Group providers by domain or functionality for maintainability
   - Use conditional composition for feature flags and environment differences

4. **Gradual Migration**
   - Split contexts incrementally
   - Maintain backward compatibility during transition
   - Test thoroughly at each migration step

5. **Clear Communication Patterns**
   - Use explicit event systems for cross-context communication
   - Document context relationships and dependencies
   - Create clear bridges between related contexts

6. **Optimize Per Context**
   - Use appropriate comparison strategies for each context
   - Implement context-specific performance optimizations
   - Monitor context-specific performance metrics

### ❌ Don'ts

1. **Over-Splitting**
   - Don't create too many tiny contexts
   - Avoid splitting contexts that have tight coupling
   - Don't split prematurely before complexity justifies it

2. **Tight Coupling**
   - Don't create direct dependencies between split contexts
   - Avoid sharing store instances across contexts
   - Don't bypass the communication patterns

3. **Inconsistent Patterns**
   - Don't mix different splitting strategies inconsistently
   - Avoid different naming conventions across contexts
   - Don't create asymmetric communication patterns

## Migration Checklist

- [ ] Identify splitting criteria (domain, layer, feature)
- [ ] Plan new context structure and boundaries
- [ ] Create new context definitions and providers  
- [ ] Set up cross-context communication patterns
- [ ] Create migration bridge hooks
- [ ] Update components incrementally
- [ ] Test context isolation and communication
- [ ] Optimize performance per context
- [ ] Document new architecture and patterns
- [ ] Remove legacy context code

## Prerequisites and Related Patterns

### Prerequisites
- **[Multi-Context Setup Guide](../setup/multi-context-setup.md)** - Complete type definitions and setup patterns used in this guide
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Foundation action context patterns
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Foundation store context patterns

### Related Architecture Patterns
- **[Domain Context Architecture](./domain-context.md)** - Business domain separation strategies
- **[MVVM Architecture](./mvvm.md)** - Layer-based context organization
- **[Pattern Composition](./composition.md)** - Combining multiple contexts effectively
- **[withProvider HOC Pattern](../store/withProvider-pattern.md)** - Provider composition utilities and HOC patterns
- **[Performance Patterns](../store/performance-patterns.md)** - Context-specific performance optimization