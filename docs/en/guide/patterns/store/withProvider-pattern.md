# withProvider Pattern

Higher-Order Component pattern using `withProvider` for automatic Provider wrapping in Store Only pattern.

## Prerequisites

Before using this pattern, you need to set up your store contexts. See the following guides for complete setup:

- **[Basic Store Setup](../setup/basic-store-setup.md)** - Store context creation patterns
- **[Provider Composition Setup](../setup/provider-composition-setup.md)** - Advanced provider composition utilities

## Overview

The HOC (Higher-Order Component) pattern provides automatic Provider wrapping, eliminating the need for manual Provider composition in your component tree.

## Basic HOC Usage

```tsx
// Complete store context setup
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager,
  withProvider: withAppStoreProvider
} = createDeclarativeStorePattern('App', {
  user: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow' as const
  },
  settings: {
    initialValue: { theme: 'light' as const, notifications: true },
    strategy: 'shallow' as const
  }
});

// Automatic Provider wrapping with HOC
const AppWithStores = withAppStoreProvider(App);

// Use anywhere without manual Provider wrapping
function Root() {
  return <AppWithStores />;
}
```

## Advanced HOC Configuration

```tsx
// With custom registry ID
const AppWithCustomStores = withAppStoreProvider(App, {
  registryId: 'custom-app-stores'
});

// With initialization callback
const AppWithInitializedStores = withAppStoreProvider(App, {
  registryId: 'initialized-stores',
  onMount: (storeManager) => {
    // Initialize stores on mount using store manager methods
    const userStore = storeManager.getStore('user');
    const settingsStore = storeManager.getStore('settings');
    
    userStore.setValue({ id: 'default', name: 'Guest', email: 'guest@example.com' });
    settingsStore.update(prev => ({ ...prev, theme: 'dark' }));
  }
});
```

## Multiple HOC Composition

```tsx
// Create multiple store contexts with complete setup
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', {
  profile: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow' as const
  },
  preferences: {
    initialValue: { theme: 'light' as const, notifications: true },
    strategy: 'shallow' as const
  }
});

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager,
  withProvider: withAppStoreProvider  
} = createDeclarativeStorePattern('App', {
  navigation: {
    initialValue: { currentPage: 'home', history: [] },
    strategy: 'shallow' as const
  },
  modal: {
    initialValue: { isOpen: false, type: undefined, data: undefined },
    strategy: 'shallow' as const
  }
});

// Compose multiple HOCs
const AppWithAllStores = withUserStoreProvider(
  withAppStoreProvider(App)
);

// Or use the built-in composeProviders utility (recommended)
import { composeProviders } from '@context-action/react';

// First compose the providers
const AllStoreProviders = composeProviders([
  UserStoreProvider,
  AppStoreProvider
]);

// Then use HOC with composed providers or use provider composition directly
function AppRoot() {
  return (
    <AllStoreProviders>
      <App />
    </AllStoreProviders>
  );
}
```

## Conditional HOC Pattern

```tsx
// Conditional Provider wrapping based on feature flags
function createConditionalHOC(condition: boolean) {
  return condition 
    ? withAppStoreProvider
    : (Component: React.ComponentType) => Component; // Pass-through
}

// Use conditional HOC
const featureEnabled = process.env.FEATURE_STORES === 'true';
const ConditionalApp = createConditionalHOC(featureEnabled)(App);

// Advanced conditional composition with multiple conditions
function createAdvancedConditionalProviders(features: {
  userManagement: boolean;
  appFeatures: boolean;
}) {
  const providers = [];
  
  if (features.userManagement) {
    providers.push(UserStoreProvider);
  }
  
  if (features.appFeatures) {
    providers.push(AppStoreProvider);
  }
  
  return providers.length > 0 
    ? composeProviders(providers)
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;
}
```

## Lazy HOC Pattern

```tsx
// Lazy load store providers for code splitting
const LazyStoreProvider = lazy(() => 
  import('./stores/AppStores').then(module => ({
    default: module.withAppStoreProvider(App)
  }))
);

function LazyApp() {
  return (
    <Suspense fallback={<div>Loading stores...</div>}>
      <LazyStoreProvider />
    </Suspense>
  );
}

// Alternative: Lazy load with provider composition
const LazyComposedStores = lazy(() =>
  import('./stores').then(module => {
    const { UserStoreProvider, AppStoreProvider } = module;
    const ComposedProviders = composeProviders([UserStoreProvider, AppStoreProvider]);
    
    return {
      default: ({ children }: { children: React.ReactNode }) => (
        <ComposedProviders>{children}</ComposedProviders>
      )
    };
  })
);

function LazyComposedApp() {
  return (
    <Suspense fallback={<div>Loading store contexts...</div>}>
      <LazyComposedStores>
        <App />
      </LazyComposedStores>
    </Suspense>
  );
}
```

## HOC with Props Passing

```tsx
interface AppProps {
  userId: string;
  theme: 'light' | 'dark';
}

// HOC that initializes stores based on props
function createPropsInitializedHOC<T extends Record<string, any>>(
  withProvider: (component: React.ComponentType<T>, config?: any) => React.ComponentType<T>
) {
  return (Component: React.ComponentType<T>) => {
    return withProvider((props: T) => {
      const appStoreManager = useAppStoreManager();
      
      useEffect(() => {
        // Initialize stores based on props using store manager
        if ('userId' in props) {
          const userStore = appStoreManager.getStore('user');
          userStore.update(prev => ({ ...prev, id: props.userId }));
        }
        if ('theme' in props) {
          const settingsStore = appStoreManager.getStore('settings');
          settingsStore.update(prev => ({ ...prev, theme: props.theme }));
        }
      }, [props, appStoreManager]);
      
      return <Component {...props} />;
    });
  };
}

const AppWithPropsInit = createPropsInitializedHOC(withAppStoreProvider)(App);

// Usage with props
function Root() {
  return (
    <AppWithPropsInit 
      userId="user123" 
      theme="dark" 
    />
  );
}

// Alternative: Direct props integration with provider composition
function AppWithDirectProps({ userId, theme }: AppProps) {
  return (
    <AllStoreProviders>
      <PropsInitializer userId={userId} theme={theme} />
      <App userId={userId} theme={theme} />
    </AllStoreProviders>
  );
}

function PropsInitializer({ userId, theme }: AppProps) {
  const appStoreManager = useAppStoreManager();
  
  useEffect(() => {
    const userStore = appStoreManager.getStore('user');
    const settingsStore = appStoreManager.getStore('settings');
    
    userStore.update(prev => ({ ...prev, id: userId }));
    settingsStore.update(prev => ({ ...prev, theme }));
  }, [userId, theme, appStoreManager]);
  
  return null; // This component only handles initialization
}
```

## Best Practices

1. **Single Responsibility**: Each HOC should handle one concern
2. **Props Preservation**: Ensure props are properly passed through
3. **Type Safety**: Maintain type safety through HOC composition
4. **Performance**: Use HOCs to avoid Provider hell and improve performance
5. **Composition**: Compose multiple HOCs for complex scenarios
6. **Lazy Loading**: Use with code splitting for large applications
7. **Configuration**: Use configuration objects for complex setups

## Integration with Provider Composition

The withProvider pattern works seamlessly with the provider composition utilities from the **[Provider Composition Setup](../setup/provider-composition-setup.md)**:

### HOC + Composition Hybrid Pattern

```tsx
// Use provider composition for complex multi-domain setups
const BusinessProviders = composeProviders([
  UserStoreProvider,
  ProductStoreProvider,
  OrderStoreProvider
]);

const UIProviders = composeProviders([
  ThemeStoreProvider,
  ModalStoreProvider,
  NotificationStoreProvider
]);

// Then use HOC for component-level integration
const AppWithBusinessLogic = withBusinessProviders(BusinessApp);
const AppWithUIFeatures = withUIProviders(UIApp);

// Or compose both approaches
function CompleteApp() {
  return (
    <BusinessProviders>
      <UIProviders>
        <App />
      </UIProviders>
    </BusinessProviders>
  );
}
```

### Environment-Based HOC with Composition

```tsx
// Leverage provider composition patterns for environment-specific HOCs
import { createEnvironmentProviders } from '../setup/provider-composition-setup';

function createEnvironmentHOC(environment: 'development' | 'production' | 'test') {
  const EnvironmentProviders = createEnvironmentProviders(environment);
  
  return (Component: React.ComponentType) => {
    return (props: any) => (
      <EnvironmentProviders>
        <Component {...props} />
      </EnvironmentProviders>
    );
  };
}

const DevelopmentApp = createEnvironmentHOC('development')(App);
const ProductionApp = createEnvironmentHOC('production')(App);
```

## When to Use HOC Pattern

- **Clean Component Trees**: Avoid deep Provider nesting
- **Reusable Components**: Components that need consistent store setup  
- **Testing**: Easier to test components with automatic Provider wrapping
- **Large Applications**: Simplify complex Provider hierarchies
- **Team Development**: Standardize store setup across teams
- **Component Libraries**: Package components with their required providers
- **Micro-frontends**: Encapsulate provider setup within component boundaries

## Related Patterns

This withProvider pattern integrates with:

- **[Provider Composition Setup](../setup/provider-composition-setup.md)** - Advanced composition utilities and patterns
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Store context creation patterns  
- **[Multi-Context Setup](../setup/multi-context-setup.md)** - Complex multi-domain architecture
- **[MVVM Architecture](../architecture/mvvm.md)** - Layer-based provider organization
- **[Domain Context Architecture](../architecture/domain-context.md)** - Domain-specific provider grouping