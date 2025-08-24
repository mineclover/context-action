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

```typescript
// ✅ Good: Split by business domains
// User Domain Context
export interface UserStores {
  profile: UserProfile;
  preferences: UserPreferences;
  notifications: Notification[];
}

export interface UserActions {
  updateProfile: { data: Partial<UserProfile> };
  updatePreferences: { preferences: Partial<UserPreferences> };
  markNotificationRead: { notificationId: string };
}

// Product Domain Context
export interface ProductStores {
  catalog: Product[];
  categories: Category[];
  filters: ProductFilters;
  cart: CartItem[];
}

export interface ProductActions {
  loadProducts: { categoryId?: string };
  addToCart: { productId: string; quantity: number };
  updateFilters: { filters: Partial<ProductFilters> };
  clearCart: void;
}

// Order Domain Context
export interface OrderStores {
  history: Order[];
  tracking: TrackingInfo[];
  payments: Payment[];
}

export interface OrderActions {
  processOrder: { orderData: OrderData };
  trackOrder: { orderId: string };
  refundOrder: { orderId: string; reason: string };
}

// UI Domain Context (Cross-cutting concerns)
export interface UIStores {
  modals: ModalState;
  notifications: UINotification[];
  loading: LoadingState;
  errors: ErrorState;
}

export interface UIActions {
  showModal: { modalType: string; data: any };
  hideModal: { modalType: string };
  setLoading: { key: string; loading: boolean };
  showError: { error: string; context?: string };
}
```

### Strategy 2: Layer-Based Split

Split contexts based on architectural layers or technical concerns.

```typescript
// Data Layer Context
export interface DataStores {
  entities: {
    users: Record<string, User>;
    products: Record<string, Product>;
    orders: Record<string, Order>;
  };
  collections: {
    usersList: string[];
    productsList: string[];
    ordersList: string[];
  };
  cache: {
    lastFetch: Record<string, number>;
    expiry: Record<string, number>;
  };
}

export interface DataActions {
  fetchEntity: { type: string; id: string };
  updateEntity: { type: string; id: string; data: any };
  deleteEntity: { type: string; id: string };
  invalidateCache: { keys: string[] };
}

// Business Logic Layer Context
export interface BusinessStores {
  workflows: {
    orderProcessing: WorkflowState;
    userOnboarding: WorkflowState;
    paymentProcessing: WorkflowState;
  };
  rules: {
    validationRules: ValidationRule[];
    businessRules: BusinessRule[];
    permissionRules: PermissionRule[];
  };
}

export interface BusinessActions {
  startWorkflow: { workflowType: string; data: any };
  validateData: { data: any; rules: string[] };
  checkPermissions: { userId: string; resource: string; action: string };
}

// UI State Layer Context
export interface UIStateStores {
  navigation: NavigationState;
  forms: Record<string, FormState>;
  interactions: InteractionState;
  preferences: UIPreferences;
}

export interface UIStateActions {
  navigate: { route: string; params?: any };
  updateForm: { formId: string; field: string; value: any };
  setInteraction: { type: string; active: boolean };
  updatePreferences: { preferences: Partial<UIPreferences> };
}
```

### Strategy 3: Feature-Based Split

Split contexts based on application features or modules.

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

```typescript
// Compose split contexts back together for full app
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

1. **Plan Domain Boundaries**
   - Identify clear business or technical boundaries
   - Consider team ownership and responsibilities  
   - Plan for future growth and changes

2. **Gradual Migration**
   - Split contexts incrementally
   - Maintain backward compatibility during transition
   - Test thoroughly at each migration step

3. **Clear Communication Patterns**
   - Use explicit event systems for cross-context communication
   - Document context relationships and dependencies
   - Create clear bridges between related contexts

4. **Optimize Per Context**
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

## Related Patterns

- **[Domain Context Architecture](./domain-context.md)** - Business domain separation strategies
- **[MVVM Architecture](./mvvm.md)** - Layer-based context organization
- **[Pattern Composition](./composition.md)** - Combining multiple contexts effectively
- **[Performance Patterns](../store/performance-patterns.md)** - Context-specific performance optimization