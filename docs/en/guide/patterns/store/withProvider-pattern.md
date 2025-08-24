# withProvider Pattern

Higher-Order Component pattern using `withProvider` for automatic Provider wrapping in Store Only pattern.

## Overview

The HOC (Higher-Order Component) pattern provides automatic Provider wrapping, eliminating the need for manual Provider composition in your component tree.

## Basic HOC Usage

```tsx
// Get withProvider from the renamed context
const { withProvider: withAppStoreProvider } = createDeclarativeStorePattern('App', {
  user: { id: '', name: '', email: '' },
  settings: { theme: 'light' as const, notifications: true }
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
    // Initialize stores on mount
    storeManager.updateStore('user', { id: 'default', name: 'Guest' });
    storeManager.updateStore('settings', { theme: 'dark' });
  }
});
```

## Multiple HOC Composition

```tsx
// Create multiple store contexts
const {
  withProvider: withUserStores
} = createDeclarativeStorePattern('User', {
  profile: { id: '', name: '' },
  preferences: { theme: 'light' }
});

const {
  withProvider: withAppStores  
} = createDeclarativeStorePattern('App', {
  navigation: { currentPage: 'home' },
  modal: { isOpen: false }
});

// Compose multiple HOCs
const AppWithAllStores = withUserStores(
  withAppStores(App)
);

// Or use a composition helper
function composeProviders(...withProviders: any[]) {
  return (Component: React.ComponentType) => {
    return withProviders.reduce((WrappedComponent, withProvider) => {
      return withProvider(WrappedComponent);
    }, Component);
  };
}

const AppWithComposedStores = composeProviders(
  withUserStores,
  withAppStores
)(App);
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
      const { updateStore } = useAppStoreManager();
      
      useEffect(() => {
        // Initialize stores based on props
        if ('userId' in props) {
          updateStore('user', { id: props.userId });
        }
        if ('theme' in props) {
          updateStore('settings', prev => ({ ...prev, theme: props.theme }));
        }
      }, [props, updateStore]);
      
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
```

## Best Practices

1. **Single Responsibility**: Each HOC should handle one concern
2. **Props Preservation**: Ensure props are properly passed through
3. **Type Safety**: Maintain type safety through HOC composition
4. **Performance**: Use HOCs to avoid Provider hell and improve performance
5. **Composition**: Compose multiple HOCs for complex scenarios
6. **Lazy Loading**: Use with code splitting for large applications
7. **Configuration**: Use configuration objects for complex setups

## When to Use HOC Pattern

- **Clean Component Trees**: Avoid deep Provider nesting
- **Reusable Components**: Components that need consistent store setup
- **Testing**: Easier to test components with automatic Provider wrapping
- **Large Applications**: Simplify complex Provider hierarchies
- **Team Development**: Standardize store setup across teams