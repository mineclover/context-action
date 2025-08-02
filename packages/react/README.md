# @context-action/react

React integration for the Context-Action framework - providing React hooks, components, and patterns for type-safe action management and state isolation.

## Features

- 🏗️ **Context Store Pattern**: Automatic store isolation per component tree
- ⚡ **HOC Pattern**: Zero-configuration component wrapping 
- 🎯 **Action Provider**: Centralized action dispatch with type safety
- 🔒 **Complete Isolation**: Components get their own store namespaces
- 📦 **Self-Contained Modules**: No manual Provider wrapping required
- 🧪 **Testing Friendly**: Each component is fully isolated
- 📝 **TypeScript First**: Full type safety throughout

## Quick Start

### Installation

```bash
npm install @context-action/react @context-action/core @context-action/logger
# or
pnpm add @context-action/react @context-action/core @context-action/logger
```

### Basic Usage

```typescript
import { 
  createContextStorePattern, 
  useStoreValue, 
  ActionProvider,
  useActionDispatch,
  ActionPayloadMap 
} from '@context-action/react';

// 1. Define your actions
interface AppActions extends ActionPayloadMap {
  updateUser: { name: string; email: string };
  resetUser: void;
}

// 2. Create Context Store Pattern
const AppStores = createContextStorePattern('App');

// 3. Create self-contained component with HOC
const withAppProviders = AppStores.withCustomProvider(
  ({ children }) => (
    <ActionProvider config={{ logLevel: 'DEBUG' }}>
      {children}
    </ActionProvider>
  ),
  'app-module'
);

const UserProfile = withAppProviders(() => {
  const dispatch = useActionDispatch<AppActions>();
  const userStore = AppStores.useStore('user', { 
    name: 'John Doe', 
    email: 'john@example.com' 
  });
  const user = useStoreValue(userStore);
  
  const handleUpdate = () => {
    dispatch('updateUser', { 
      name: 'Updated User', 
      email: 'updated@example.com' 
    });
  };
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <button onClick={handleUpdate}>Update Profile</button>
    </div>
  );
});

// 4. Use anywhere - completely self-contained!
function App() {
  return <UserProfile />;
}
```

## Core Patterns

### 1. Context Store Pattern

Create isolated store environments for component trees:

```typescript
// Create pattern
const UserStores = createContextStorePattern('User');

// Manual Provider usage
function App() {
  return (
    <UserStores.Provider registryId="user-section">
      <UserComponent />
    </UserStores.Provider>
  );
}

// Component usage
function UserComponent() {
  const userStore = UserStores.useStore('profile', { name: '', email: '' });
  const user = useStoreValue(userStore);
  
  return <div>User: {user.name}</div>;
}
```

### 2. HOC Pattern (Recommended)

Automatically wrap components with providers:

```typescript
// Basic HOC - Store isolation only
const withUserStores = UserStores.withProvider('user-profile');

const UserProfile = withUserStores(() => {
  const userStore = UserStores.useStore('profile', { name: 'John' });
  const user = useStoreValue(userStore);
  
  return <div>{user.name}</div>;
});

// Advanced HOC - Store + Action isolation
const withFullProviders = UserStores.withCustomProvider(
  ({ children }) => (
    <ActionProvider config={{ logLevel: 'DEBUG' }}>
      {children}
    </ActionProvider>
  ),
  'user-with-actions'
);

const FullUserModule = withFullProviders(UserComponent);
```

### 3. Action Provider Pattern

Centralized action management:

```typescript
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string };
  deleteProfile: { id: string };
}

function UserComponent() {
  const dispatch = useActionDispatch<UserActions>();
  
  const handleUpdate = () => {
    dispatch('updateProfile', { name: 'New Name', email: 'new@email.com' });
  };
  
  return <button onClick={handleUpdate}>Update</button>;
}
```

## Advanced Features

### Store Isolation

Each component gets its own store namespace:

```typescript
const FeatureStores = createContextStorePattern('Feature');

// Component A and B will have separate store instances
const ComponentA = FeatureStores.withProvider('feature-a')(MyComponent);
const ComponentB = FeatureStores.withProvider('feature-b')(MyComponent);

function App() {
  return (
    <div>
      <ComponentA /> {/* Independent stores */}
      <ComponentB /> {/* Independent stores */}
    </div>
  );
}
```

### Component-Level Isolation

For even finer isolation:

```typescript
function UserCard({ userId }: { userId: string }) {
  // Each UserCard instance gets its own isolated store
  const userStore = UserStores.useIsolatedStore('user-data', { 
    id: userId, 
    name: '', 
    email: '' 
  });
  const user = useStoreValue(userStore);
  
  return <div>User {userId}: {user.name}</div>;
}
```

### Registry Operations

Access the underlying registry for advanced operations:

```typescript
function DebugComponent() {
  const registry = UserStores.useRegistry();
  const { storeCount, storeNames } = UserStores.useRegistryInfo();
  
  console.log(`Active stores: ${storeCount}`);
  console.log(`Store names: ${storeNames.join(', ')}`);
  
  return <div>Registry Debug Info</div>;
}
```

## Migration Guide

### From Direct Store Usage

```typescript
// Before
const userStore = createStore('user', { name: '', email: '' });

function UserComponent() {
  const user = useStoreValue(userStore);
  return <div>{user.name}</div>;
}

// After (Context Store Pattern)
const UserStores = createContextStorePattern('User');

const UserComponent = UserStores.withProvider()(() => {
  const userStore = UserStores.useStore('user', { name: '', email: '' });
  const user = useStoreValue(userStore);
  return <div>{user.name}</div>;
});
```

### From Manual Providers

```typescript
// Before
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        <UserComponent />
      </ActionProvider>
    </StoreProvider>
  );
}

// After (HOC Pattern)
const UserStores = createContextStorePattern('User');

const UserComponent = UserStores.withCustomProvider(
  ({ children }) => (
    <ActionProvider>
      {children}
    </ActionProvider>
  )
)(UserComponentImpl);

function App() {
  return <UserComponent />;
}
```

## API Reference

### `createContextStorePattern(contextName)`

Creates a Context Store Pattern with isolated store management.

**Returns:**
- `Provider` - Manual Provider component
- `useStore(name, initialValue, options?)` - Create/access store in current context
- `useIsolatedStore(domain, initialValue, options?)` - Create component-isolated store
- `useRegistry()` - Access underlying store registry
- `withProvider(registryId?)` - HOC for automatic Provider wrapping
- `withCustomProvider(wrapperComponent, registryId?)` - HOC for custom Provider composition

### Store Options

```typescript
interface StoreOptions {
  strategy?: 'reference' | 'shallow' | 'deep';  // Comparison strategy
  debug?: boolean;                              // Enable debug logging
  comparisonOptions?: ComparisonOptions;        // Custom comparison options
}
```

## Best Practices

### ✅ Do

- **Use HOC pattern for new components** - Automatic isolation and cleaner code
- **Prefer Context Store Pattern** - Better isolation than global stores  
- **Use descriptive registry IDs** - Helps with debugging and testing
- **Keep components simple** - Only UI logic, no business logic
- **Test HOC components as units** - Each component is self-contained

### ❌ Don't

- **Mix business logic in components** - Use action handlers instead
- **Manually wrap with providers** - Use HOC pattern for cleaner code
- **Share stores across unrelated features** - Use isolated patterns
- **Skip error handling in actions** - Always handle errors properly

## Examples

See `/examples/hoc-pattern-example.tsx` for comprehensive usage examples.

## Documentation

- [Context Store Pattern Guide](src/store/README-context-store-pattern.md)
- [Architecture Overview](src/store/ARCHITECTURE.md)
- [Framework Documentation](../../CLAUDE.md)

## TypeScript Support

This package is built with TypeScript and provides full type safety:

```typescript
interface MyActions extends ActionPayloadMap {
  updateData: { id: string; data: any };
  deleteData: { id: string };
  resetData: void;
}

// Full type checking throughout
const dispatch = useActionDispatch<MyActions>();
dispatch('updateData', { id: '1', data: { name: 'test' } }); // ✅ Type safe
dispatch('updateData', { wrongProp: 'value' });              // ❌ Type error
```

## License

Apache-2.0 - see [LICENSE](../../LICENSE) for details.