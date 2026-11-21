[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / composeProviders

# Function: composeProviders()

> **composeProviders**(...`providers`): [`ProviderComponent`](../type-aliases/ProviderComponent.md)

Defined in: [packages/react/src/stores/utils/provider-composition.ts:142](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/provider-composition.ts#L142)

Composes multiple Provider components into a single Provider component that accepts children.
Uses React.createElement for direct provider nesting without HOC overhead.

## Parameters

### providers

...[`ProviderComponent`](../type-aliases/ProviderComponent.md)[]

Array of Provider components to compose

## Returns

[`ProviderComponent`](../type-aliases/ProviderComponent.md)

A single Provider component that wraps children with all providers

## Examples

```tsx
// Without composition - nested Provider hell
function App() {
  return (
    <UserProvider>
      <ProductProvider>
        <OrderProvider>
          <UIProvider>
            <AppContent />
          </UIProvider>
        </OrderProvider>
      </ProductProvider>
    </UserProvider>
  );
}

// With composition - clean and maintainable
const AllProviders = composeProviders(
  UserProvider,
  ProductProvider,
  OrderProvider,
  UIProvider
);

function App() {
  return (
    <AllProviders>
      <AppContent />
    </AllProviders>
  );
}
```

```tsx
// Conditional composition based on features
const providers = [
  CoreProvider,
  featureFlags.auth && AuthProvider,
  featureFlags.analytics && AnalyticsProvider
].filter(Boolean) as ProviderComponent[];

const AppProviders = composeProviders(...providers);

function App() {
  return (
    <AppProviders>
      <Routes />
    </AppProviders>
  );
}
```

```tsx
// Domain-grouped composition
const BusinessProviders = composeProviders(
  UserModelProvider,
  ProductModelProvider,
  OrderModelProvider
);

const InfrastructureProviders = composeProviders(
  DataModelProvider,
  CacheModelProvider,
  LoggerModelProvider
);

const AllProviders = composeProviders(
  InfrastructureProviders,
  BusinessProviders
);

function App() {
  return (
    <AllProviders>
      <AppContent />
    </AllProviders>
  );
}
```

```tsx
// Environment-specific composition
function createEnvironmentProviders() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  const providers = [
    UserModelProvider,
    ProductModelProvider,
    OrderModelProvider
  ];
  
  if (isDevelopment) {
    providers.push(DebugModelProvider, DevToolsModelProvider);
  }
  
  if (isProduction) {
    providers.push(AnalyticsModelProvider, ErrorTrackingModelProvider);
  }
  
  return composeProviders(...providers);
}

function App() {
  const EnvironmentProviders = createEnvironmentProviders();
  
  return (
    <EnvironmentProviders>
      <AppContent />
    </EnvironmentProviders>
  );
}
```
