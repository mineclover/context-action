# Provider Composition Setup

Advanced provider composition utilities and patterns for managing multiple contexts in the Context-Action framework.

## Import
```typescript
import { composeProviders } from '@context-action/react';
```

## Overview

The `composeProviders` utility solves "Provider hell" by composing multiple Provider components into a single, clean component. This is essential for applications using multiple contexts (Store, Action, and RefContext).

### Before vs After
```typescript
// ❌ Provider Hell - Hard to read and maintain
function App() {
  return (
    <UserStoreProvider>
      <UserActionProvider>
        <ProductStoreProvider>
          <ProductActionProvider>
            <UIStoreProvider>
              <UIActionProvider>
                <CanvasRefProvider>
                  <ServiceRefProvider>
                    <AppContent />
                  </ServiceRefProvider>
                </CanvasRefProvider>
              </UIActionProvider>
            </UIStoreProvider>
          </ProductActionProvider>
        </ProductStoreProvider>
      </UserActionProvider>
    </UserStoreProvider>
  );
}

// ✅ Clean Composition - Maintainable and readable
const AllProviders = composeProviders([
  UserStoreProvider,
  UserActionProvider,
  ProductStoreProvider,
  ProductActionProvider,
  UIStoreProvider,
  UIActionProvider,
  CanvasRefProvider,
  ServiceRefProvider
]);

function App() {
  return (
    <AllProviders>
      <AppContent />
    </AllProviders>
  );
}
```

## Basic Composition Patterns

### Simple Provider Composition
```typescript
// Basic composition for single domain
const UserProviders = composeProviders([
  UserStoreProvider,
  UserActionProvider
]);

function UserFeature() {
  return (
    <UserProviders>
      <UserComponents />
    </UserProviders>
  );
}
```

### Multi-Domain Composition
```typescript
// Compose providers from multiple domains
const ApplicationProviders = composeProviders([
  // Store Layer
  UserStoreProvider,
  ProductStoreProvider,
  OrderStoreProvider,
  UIStoreProvider,
  
  // Action Layer
  UserActionProvider,
  ProductActionProvider,
  OrderActionProvider,
  UIActionProvider,
  
  // Performance Layer
  CanvasRefProvider,
  MediaRefProvider,
  ServiceRefProvider
]);

function Application() {
  return (
    <ApplicationProviders>
      <ApplicationContent />
    </ApplicationProviders>
  );
}
```

### MVVM Layer Composition
```typescript
// Organize providers by MVVM architectural layers
const ModelProviders = composeProviders([
  UserStoreProvider,
  ProductStoreProvider,
  OrderStoreProvider
]);

const ViewModelProviders = composeProviders([
  UserActionProvider,
  ProductActionProvider,
  OrderActionProvider
]);

const PerformanceProviders = composeProviders([
  CanvasRefProvider,
  MediaRefProvider,
  WorkerRefProvider
]);

// Compose layers together
const MVVMProviders = composeProviders([
  ModelProviders,
  ViewModelProviders,
  PerformanceProviders
]);

function MVVMApplication() {
  return (
    <MVVMProviders>
      <MVVMContent />
    </MVVMProviders>
  );
}
```

## Advanced Composition Patterns

### Conditional Provider Composition
```typescript
// Dynamic provider composition based on feature flags
interface AppConfig {
  features: {
    userManagement: boolean;
    productCatalog: boolean;
    orderProcessing: boolean;
    analytics: boolean;
    payments: boolean;
  };
  performance: {
    enableCanvas: boolean;
    enableWorkers: boolean;
    enableWASM: boolean;
  };
}

function createAppProviders(config: AppConfig) {
  const providers: any[] = [];
  
  // Always include UI providers
  providers.push(UIStoreProvider, UIActionProvider);
  
  // Conditional feature providers
  if (config.features.userManagement) {
    providers.push(UserStoreProvider, UserActionProvider);
  }
  
  if (config.features.productCatalog) {
    providers.push(ProductStoreProvider, ProductActionProvider);
  }
  
  if (config.features.orderProcessing) {
    providers.push(OrderStoreProvider, OrderActionProvider);
  }
  
  if (config.features.analytics) {
    providers.push(AnalyticsStoreProvider, AnalyticsActionProvider);
  }
  
  if (config.features.payments) {
    providers.push(PaymentStoreProvider, PaymentActionProvider);
  }
  
  // Conditional performance providers
  if (config.performance.enableCanvas) {
    providers.push(CanvasRefProvider);
  }
  
  if (config.performance.enableWorkers) {
    providers.push(WorkerRefProvider);
  }
  
  if (config.performance.enableWASM) {
    providers.push(WASMRefProvider);
  }
  
  return composeProviders(providers);
}

function ConfigurableApp({ config }: { config: AppConfig }) {
  const AppProviders = createAppProviders(config);
  
  return (
    <AppProviders>
      <ConfigurableContent />
    </AppProviders>
  );
}

// Usage with different configurations
const developmentConfig: AppConfig = {
  features: {
    userManagement: true,
    productCatalog: true,
    orderProcessing: true,
    analytics: false, // Disabled in development
    payments: false   // Disabled in development
  },
  performance: {
    enableCanvas: true,
    enableWorkers: true,
    enableWASM: false // Heavy, disabled in development
  }
};

const productionConfig: AppConfig = {
  features: {
    userManagement: true,
    productCatalog: true,
    orderProcessing: true,
    analytics: true,
    payments: true
  },
  performance: {
    enableCanvas: true,
    enableWorkers: true,
    enableWASM: true
  }
};
```

### Environment-Specific Composition
```typescript
// Environment-based provider selection
function createEnvironmentProviders() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  const isTesting = process.env.NODE_ENV === 'test';
  
  const providers = [
    // Core providers (always included)
    UIStoreProvider,
    UIActionProvider,
    UserStoreProvider,
    UserActionProvider
  ];
  
  if (isDevelopment) {
    providers.push(
      DebugStoreProvider,
      DebugActionProvider,
      DevToolsRefProvider,
      MockServiceRefProvider
    );
  }
  
  if (isProduction) {
    providers.push(
      AnalyticsStoreProvider,
      AnalyticsActionProvider,
      ErrorTrackingRefProvider,
      PerformanceMonitoringRefProvider
    );
  }
  
  if (isTesting) {
    providers.push(
      TestStoreProvider,
      TestActionProvider,
      MockRefProvider
    );
  }
  
  return composeProviders(providers);
}

function EnvironmentApp() {
  const EnvironmentProviders = createEnvironmentProviders();
  
  return (
    <EnvironmentProviders>
      <EnvironmentContent />
    </EnvironmentProviders>
  );
}
```

### Nested Domain Composition
```typescript
// Hierarchical provider composition for complex applications
function createNestedProviders() {
  // Infrastructure Layer - Core system providers
  const InfrastructureProviders = composeProviders([
    DatabaseStoreProvider,
    CacheStoreProvider,
    LoggerStoreProvider,
    ConfigurationStoreProvider
  ]);
  
  // Business Logic Layer - Domain-specific providers
  const BusinessProviders = composeProviders([
    UserStoreProvider,
    UserActionProvider,
    ProductStoreProvider,
    ProductActionProvider,
    OrderStoreProvider,
    OrderActionProvider
  ]);
  
  // Presentation Layer - UI and interaction providers
  const PresentationProviders = composeProviders([
    UIStoreProvider,
    UIActionProvider,
    ThemeStoreProvider,
    ThemeActionProvider,
    NavigationStoreProvider,
    NavigationActionProvider
  ]);
  
  // Performance Layer - Optimization providers
  const PerformanceProviders = composeProviders([
    CanvasRefProvider,
    MediaRefProvider,
    WorkerRefProvider,
    WASMRefProvider
  ]);
  
  // External Integration Layer - Third-party services
  const IntegrationProviders = composeProviders([
    AnalyticsRefProvider,
    PaymentRefProvider,
    MapsRefProvider,
    NotificationRefProvider
  ]);
  
  return {
    InfrastructureProviders,
    BusinessProviders,
    PresentationProviders,
    PerformanceProviders,
    IntegrationProviders
  };
}

function LayeredApp() {
  const {
    InfrastructureProviders,
    BusinessProviders,
    PresentationProviders,
    PerformanceProviders,
    IntegrationProviders
  } = createNestedProviders();
  
  return (
    <InfrastructureProviders>
      <BusinessProviders>
        <PresentationProviders>
          <PerformanceProviders>
            <IntegrationProviders>
              <LayeredContent />
            </IntegrationProviders>
          </PerformanceProviders>
        </PresentationProviders>
      </BusinessProviders>
    </InfrastructureProviders>
  );
}

// Alternative: Single composed provider for the entire stack
function createFullStackProviders() {
  const {
    InfrastructureProviders,
    BusinessProviders,
    PresentationProviders,
    PerformanceProviders,
    IntegrationProviders
  } = createNestedProviders();
  
  return composeProviders([
    InfrastructureProviders,
    BusinessProviders,
    PresentationProviders,
    PerformanceProviders,
    IntegrationProviders
  ]);
}

function FullStackApp() {
  const FullStackProviders = createFullStackProviders();
  
  return (
    <FullStackProviders>
      <FullStackContent />
    </FullStackProviders>
  );
}
```

### Micro-Frontend Composition
```typescript
// Provider composition for micro-frontend architecture
interface MicroFrontendConfig {
  apps: {
    dashboard: boolean;
    userManagement: boolean;
    productCatalog: boolean;
    orderManagement: boolean;
    analytics: boolean;
  };
  shared: {
    authentication: boolean;
    notifications: boolean;
    theming: boolean;
  };
}

function createMicroFrontendProviders(config: MicroFrontendConfig) {
  const providers = [];
  
  // Shared providers (always included)
  if (config.shared.authentication) {
    providers.push(AuthStoreProvider, AuthActionProvider);
  }
  
  if (config.shared.notifications) {
    providers.push(NotificationStoreProvider, NotificationActionProvider);
  }
  
  if (config.shared.theming) {
    providers.push(ThemeStoreProvider, ThemeActionProvider);
  }
  
  // App-specific providers
  if (config.apps.dashboard) {
    providers.push(DashboardStoreProvider, DashboardActionProvider);
  }
  
  if (config.apps.userManagement) {
    providers.push(UserStoreProvider, UserActionProvider);
  }
  
  if (config.apps.productCatalog) {
    providers.push(ProductStoreProvider, ProductActionProvider);
  }
  
  if (config.apps.orderManagement) {
    providers.push(OrderStoreProvider, OrderActionProvider);
  }
  
  if (config.apps.analytics) {
    providers.push(AnalyticsStoreProvider, AnalyticsActionProvider);
  }
  
  return composeProviders(providers);
}

// Different micro-frontend configurations
const dashboardConfig: MicroFrontendConfig = {
  apps: {
    dashboard: true,
    userManagement: false,
    productCatalog: false,
    orderManagement: false,
    analytics: true
  },
  shared: {
    authentication: true,
    notifications: true,
    theming: true
  }
};

const userMgmtConfig: MicroFrontendConfig = {
  apps: {
    dashboard: false,
    userManagement: true,
    productCatalog: false,
    orderManagement: false,
    analytics: false
  },
  shared: {
    authentication: true,
    notifications: true,
    theming: true
  }
};

function MicroFrontendApp({ config }: { config: MicroFrontendConfig }) {
  const MicroFrontendProviders = createMicroFrontendProviders(config);
  
  return (
    <MicroFrontendProviders>
      <MicroFrontendContent />
    </MicroFrontendProviders>
  );
}
```

## Provider Composition with Filtering

### Array-Based Composition
```typescript
// Filter providers based on runtime conditions
function createFilteredProviders(userRole: 'admin' | 'user' | 'guest') {
  const baseProviders = [
    UIStoreProvider,
    UIActionProvider,
    PublicStoreProvider,
    PublicActionProvider
  ];
  
  const userProviders = [
    UserStoreProvider,
    UserActionProvider,
    UserPreferencesStoreProvider
  ];
  
  const adminProviders = [
    AdminStoreProvider,
    AdminActionProvider,
    AdminToolsRefProvider,
    AuditLogStoreProvider
  ];
  
  const providers = [...baseProviders];
  
  if (userRole === 'user' || userRole === 'admin') {
    providers.push(...userProviders);
  }
  
  if (userRole === 'admin') {
    providers.push(...adminProviders);
  }
  
  return composeProviders(providers);
}

function RoleBasedApp({ userRole }: { userRole: 'admin' | 'user' | 'guest' }) {
  const RoleProviders = createFilteredProviders(userRole);
  
  return (
    <RoleProviders>
      <RoleBasedContent />
    </RoleProviders>
  );
}
```

### Conditional Array Filtering
```typescript
// Advanced filtering with boolean conditions
function createAdvancedProviders(conditions: {
  hasPermissions: boolean;
  isOnline: boolean;
  supportsWebGL: boolean;
  hasPremiumFeatures: boolean;
}) {
  const providers = [
    // Core providers
    UIStoreProvider,
    UIActionProvider,
    
    // Conditional providers with filter
    conditions.hasPermissions && AuthStoreProvider,
    conditions.hasPermissions && AuthActionProvider,
    conditions.isOnline && SyncStoreProvider,
    conditions.isOnline && SyncActionProvider,
    conditions.supportsWebGL && CanvasRefProvider,
    conditions.supportsWebGL && WebGLRefProvider,
    conditions.hasPremiumFeatures && PremiumStoreProvider,
    conditions.hasPremiumFeatures && PremiumActionProvider,
  ].filter(Boolean) as React.ComponentType<{ children: React.ReactNode }>[];
  
  return composeProviders(providers);
}

function ConditionalApp() {
  const [conditions, setConditions] = useState({
    hasPermissions: false,
    isOnline: navigator.onLine,
    supportsWebGL: !!document.createElement('canvas').getContext('webgl'),
    hasPremiumFeatures: false
  });
  
  useEffect(() => {
    // Update conditions based on runtime state
    checkUserPermissions().then(hasPermissions => {
      setConditions(prev => ({ ...prev, hasPermissions }));
    });
    
    checkPremiumStatus().then(hasPremiumFeatures => {
      setConditions(prev => ({ ...prev, hasPremiumFeatures }));
    });
  }, []);
  
  const ConditionalProviders = createAdvancedProviders(conditions);
  
  return (
    <ConditionalProviders>
      <ConditionalContent />
    </ConditionalProviders>
  );
}
```

## Performance Optimization

### Provider Memoization
```typescript
// Memoize provider composition for performance
function useOptimizedProviders(
  config: AppConfig,
  userRole: string,
  features: string[]
) {
  return useMemo(() => {
    const providers = [];
    
    // Add providers based on config
    if (config.features.userManagement) {
      providers.push(UserStoreProvider, UserActionProvider);
    }
    
    // Add providers based on user role
    if (userRole === 'admin') {
      providers.push(AdminStoreProvider, AdminActionProvider);
    }
    
    // Add providers based on enabled features
    features.forEach(feature => {
      switch (feature) {
        case 'analytics':
          providers.push(AnalyticsStoreProvider);
          break;
        case 'payments':
          providers.push(PaymentStoreProvider);
          break;
      }
    });
    
    return composeProviders(providers);
  }, [config, userRole, features]);
}

function OptimizedApp({ config, userRole, features }: {
  config: AppConfig;
  userRole: string;
  features: string[];
}) {
  const OptimizedProviders = useOptimizedProviders(config, userRole, features);
  
  return (
    <OptimizedProviders>
      <OptimizedContent />
    </OptimizedProviders>
  );
}
```

### Lazy Provider Loading
```typescript
// Lazy load providers for better initial performance
const LazyAdminProviders = lazy(() => 
  import('./providers/AdminProviders').then(module => ({
    default: module.AdminProviders
  }))
);

const LazyPremiumProviders = lazy(() =>
  import('./providers/PremiumProviders').then(module => ({
    default: module.PremiumProviders
  }))
);

function LazyApp({ userRole, hasPremium }: {
  userRole: string;
  hasPremium: boolean;
}) {
  const CoreProviders = composeProviders([
    UIStoreProvider,
    UIActionProvider,
    UserStoreProvider,
    UserActionProvider
  ]);
  
  return (
    <CoreProviders>
      <Suspense fallback={<Loading />}>
        {userRole === 'admin' && (
          <LazyAdminProviders>
            <AdminContent />
          </LazyAdminProviders>
        )}
        
        {hasPremium && (
          <LazyPremiumProviders>
            <PremiumContent />
          </LazyPremiumProviders>
        )}
        
        <RegularContent />
      </Suspense>
    </CoreProviders>
  );
}
```

## Export Patterns

### Composed Provider Exports
```typescript
// providers/ComposedProviders.ts
export const CoreProviders = composeProviders([
  UIStoreProvider,
  UIActionProvider
]);

export const BusinessProviders = composeProviders([
  UserStoreProvider,
  UserActionProvider,
  ProductStoreProvider,
  ProductActionProvider
]);

export const PerformanceProviders = composeProviders([
  CanvasRefProvider,
  MediaRefProvider,
  WorkerRefProvider
]);

export const AllProviders = composeProviders([
  CoreProviders,
  BusinessProviders,
  PerformanceProviders
]);

// Individual provider factories
export { createAppProviders } from './factories/AppProviderFactory';
export { createMVVMProviders } from './factories/MVVMProviderFactory';
export { createMicroFrontendProviders } from './factories/MicroFrontendProviderFactory';
```

### Factory Pattern Exports
```typescript
// providers/factories/index.ts
export * from './AppProviderFactory';
export * from './MVVMProviderFactory';
export * from './MicroFrontendProviderFactory';
export * from './ConditionalProviderFactory';

// providers/index.ts - Main export
export * from './ComposedProviders';
export * from './factories';
export { composeProviders } from '@context-action/react';
```

## Best Practices

### Composition Organization
1. **Logical Grouping**: Group providers by domain, layer, or feature
2. **Provider Ordering**: Order providers by dependency (independent → dependent)
3. **Conditional Logic**: Use feature flags and runtime conditions for flexibility
4. **Performance**: Memoize composed providers to prevent unnecessary re-renders

### Configuration Management
1. **Type Safety**: Use TypeScript interfaces for configuration objects
2. **Environment Separation**: Separate configurations for different environments
3. **Feature Flags**: Implement feature flag system for gradual rollouts
4. **Runtime Adaptation**: Adapt provider composition based on runtime conditions

### Error Handling
1. **Provider Validation**: Validate providers before composition
2. **Graceful Degradation**: Handle missing providers gracefully
3. **Error Boundaries**: Wrap composed providers with error boundaries
4. **Logging**: Log provider composition for debugging

## Common Patterns Reference

This setup file provides reusable patterns for:

- **[Context Splitting Patterns](../architecture/context-splitting.md)** - Uses provider composition
- **[MVVM Architecture](../architecture/mvvm.md)** - Uses layer-based composition
- **[Domain Context Architecture](../architecture/domain-context.md)** - Uses domain composition
- **[withProvider Pattern](../store/withProvider-pattern.md)** - Uses HOC with composition

## Related Setup Guides

- **[Basic Action Setup](./basic-action-setup.md)** - Action context patterns
- **[Basic Store Setup](./basic-store-setup.md)** - Store context patterns
- **[RefContext Setup](./ref-context-setup.md)** - RefContext patterns
- **[Multi-Context Setup](./multi-context-setup.md)** - Complex architecture integration