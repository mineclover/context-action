# @context-action/react

React integration for the Context-Action framework - providing React hooks, components, and patterns for type-safe action management and state isolation.

## Features

- 🏭 **Factory Functions**: Type-safe context and store creation
- ⚡ **Performance Optimized**: Selective subscriptions and computed values
- 🎯 **Action System**: Centralized action dispatch with priority-based handlers
- 🏪 **Store Management**: Declarative stores with excellent type inference
- 📦 **Self-Contained**: No manual Provider wrapping required with HOCs
- 🧪 **Testing Friendly**: Full test coverage with 40+ passing tests
- 📝 **TypeScript First**: Complete type safety throughout

## Quick Start

### Installation

```bash
npm install @context-action/react
# or
pnpm add @context-action/react
```

### Basic Usage

```tsx
import { 
  createStoreContext,
  createActionContext,
  useStoreValue,
  ActionPayloadMap 
} from '@context-action/react';

// 1. Define your actions
interface AppActions extends ActionPayloadMap {
  updateUser: { name: string; email: string };
  resetUser: void;
}

// 2. Create Action Context
const {
  Provider: UserActionProvider,
  useActionDispatch,
  useActionHandler
} = createActionContext<AppActions>('UserActions');

// 3. Create Store Pattern
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  withProvider
} = createStoreContext('User', {
  profile: { initialValue: { name: 'John Doe', email: 'john@example.com' } }
});

// 4. Create component with automatic providers
const UserProfile = withProvider(() => {
  const dispatch = useActionDispatch();
  const profileStore = useUserStore('profile');
  const user = useStoreValue(profileStore);
  
  // Register action handler
  useActionHandler('updateUser', async (payload) => {
    profileStore.setValue(payload);
  });
  
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

// 5. Use with combined providers
function App() {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserProfile />
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

## ToolContext: MCP and function-calling usecase

`createToolContext()` is the React management surface for the canonical
protocol defined by `@context-action/tool-protocol`:

```text
tools/list → model tool call → tools/call → tool result
```

Register handlers once, expose the registry to the provider adapter, and keep
approval and schema validation inside the ToolContext boundary.

```tsx
import { useCallback, useMemo } from 'react';
import {
  createToolContext,
} from '@context-action/react/tools';
import {
  isToolCallResult,
  listAllTools,
} from '@context-action/tool-protocol';
import { studioToolSchema } from './studio-tool-schema';

const StudioTools = createToolContext('StudioTools', {
  schema: studioToolSchema,
  toolPolicy: ({ context }) =>
    context?.mode === 'direct' ? 'allow' : 'ask',
});

function ToolRuntime({ children }: { children: React.ReactNode }) {
  const registry = StudioTools.useToolRegistry();

  StudioTools.useToolHandler(
    'workspace.readFile',
    useCallback(async ({ path }) => readWorkspaceFile(path), [])
  );

  const definitions = useMemo(() => listAllTools(registry), [registry]);
  const runModelCall = useCallback(
    async (call: {
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }) => {
      const result = await registry.executeModelToolCall(call, {
        context: { source: 'model', mode: 'agent' },
      });
      if (!isToolCallResult(result)) {
        throw new Error('The tool adapter returned an invalid tool result.');
      }
      return result;
    },
    [registry]
  );

  // Pass definitions to the provider and runModelCall to its response
  // adapter. Views only receive these commands as props.
  void definitions;
  void runModelCall;
  return children;
}

function RefreshButton() {
  const callTool = StudioTools.useToolCall();

  return (
    <button onClick={() => void callTool('workspace.readFile', { path: 'README.md' })}>
      Refresh preview
    </button>
  );
}
```

Use `useToolCall()` for a direct UI action such as a palette or button. It
constructs a canonical `tools/call` request with
`{ source: 'local', mode: 'direct' }`; pass `context` only when the caller has
more specific provenance. Model and MCP calls should use `mode: 'agent'` so the
same policy, revision checks, lifecycle trace, and structured error result
apply to every mutation path. `useToolDispatch()` remains a raw ActionRegister
compatibility hook and intentionally bypasses those tool boundaries. The
reusable browser convention and complete usecases are documented in
[`Tool-Calling Web Studio Convention`](../../docs/en/context-layered/usecase-tool-calling-web-studio.md).

Tool calling is an opt-in entry point at `@context-action/react/tools`; the
default `@context-action/react` entry still does not load its runtime. The
tools subpath declares its protocol and durable-operation packages directly so
its published CJS entry always resolves. Add `@context-action/ai-sdk` only
when an application chooses Vercel AI SDK as its model adapter.

`useToolCall()` (and the lower-level `registry.callTool()`) and
`executeModelToolCall()` accept a wall-clock `timeout`; `createToolContext()`
can also receive a durable operation store from
`@context-action/tool-durable-operations`. The precise timeout,
cancellation, idempotency, and recovery outcomes are defined by the linked
semantic guide rather than repeated in this package quick start.

The complete timeout, retry, abort-drain, idempotency, and durable-operation
contract is maintained in the [Tool-calling editor architecture
guide](../../docs/en/concept/tool-calling-editor-architecture.md). This README
only documents the package API entry point; durable behavior across reloads or
processes remains application-owned. Pass the already-resolved durable package
implementation as `durableOperationStore` when that behavior is needed.

## Core Patterns

### 1. Declarative Store Pattern (Recommended)

Create type-safe stores with excellent inference:

```tsx
const AppStores = createStoreContext('App', {
  user: { initialValue: { id: '', name: '' } },
  settings: { initialValue: { theme: 'light' } },
  data: { initialValue: [] }
});

function MyComponent() {
  const userStore = AppStores.useStore('user');    // Fully typed
  const settingsStore = AppStores.useStore('settings');
  
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  return <div>User: {user.name}, Theme: {settings.theme}</div>;
}

// Automatic provider wrapping
const MyComponentWithProvider = AppStores.withProvider(MyComponent);
```

### 2. Action Context Pattern

Centralized action management with type safety:

```tsx
interface UserActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
  updateProfile: { name: string; email: string };
}

const UserActions = createActionContext<UserActions>('UserActions');

function LoginComponent() {
  const dispatch = UserActions.useActionDispatch();
  
  // Register handlers with priorities
  UserActions.useActionHandler('login', async (payload) => {
    const response = await api.login(payload);
    // Handle login logic
  }, { priority: 10 });
  
  UserActions.useActionHandler('login', async (payload) => {
    analytics.track('login_attempt');
  }, { priority: 5 });
  
  const handleLogin = () => {
    dispatch('login', { username: 'user', password: 'pass' });
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

### 3. Performance Optimized Patterns

Selective subscriptions and computed values:

```tsx
function OptimizedComponent() {
  const userStore = useUserStore('profile');
  
  // Subscribe to specific field only
  const userName = useStoreSelector(userStore, user => user.name);
  
  // Computed values that auto-update
  const displayName = useComputedStore(
    userStore, 
    user => user.nickname || user.name || 'Anonymous'
  );
  
  // Component-local store
  const { value: localCount, setValue } = useLocalStore(0);
  
  return (
    <div>
      <p>Name: {userName}</p>
      <p>Display: {displayName}</p>
      <p>Local: {localCount}</p>
      <button onClick={() => setValue(prev => prev + 1)}>
        Increment Local
      </button>
    </div>
  );
}
```

## Essential Hooks (Must Learn)

### Factory Functions
- `createActionContext<T>(contextName, config?)` - Creates a named, type-safe action system
- `createStoreContext(contextName, initialStores)` - Creates named, type-safe store management

### Core Hooks
- `useStoreValue(store)` - Subscribe to store changes
- `useActionDispatch()` - Dispatch actions to handlers
- `useActionHandler()` - Register action handlers
- `useStore()` - Access stores by name (from pattern)

## Utility Hooks (Learn As Needed)

### Performance
- `useStoreSelector(store, selector)` - Selective subscriptions
- `useComputedStore(store, compute)` - Derived state

### Convenience
- `useLocalStore(initialValue)` - Component-local store

### Advanced
- `useActionDispatchWithResult()` - Collect handler results

## Helper Functions

- `assertStoreValue(value, storeName)` - Runtime type assertion
- `shallowEqual(a, b)` - Shallow object comparison
- `deepEqual(a, b)` - Deep object comparison

## Advanced Features

### Component Isolation

Each pattern instance provides complete isolation:

```tsx
// Independent store contexts
const FeatureAStores = createStoreContext('FeatureA', {
  data: { initialValue: [] }
});

const FeatureBStores = createStoreContext('FeatureB', {
  data: { initialValue: [] }
});

// Components operate independently
const FeatureA = FeatureAStores.withProvider(MyComponent);
const FeatureB = FeatureBStores.withProvider(MyComponent);
```

### HOC Pattern for Clean Components

```tsx
// Automatic provider wrapping
const UserComponent = UserStores.withProvider(() => {
  const userStore = UserStores.useStore('profile');
  const user = useStoreValue(userStore);
  
  return <div>{user.name}</div>;
});

// No manual provider wrapping needed!
function App() {
  return <UserComponent />;
}
```

### Priority-Based Action Handlers

```tsx
function DataComponent() {
  const dispatch = useActionDispatch();
  
  // Validation (highest priority)
  useActionHandler('saveData', async (payload) => {
    if (!payload.id) throw new Error('ID required');
  }, { priority: 10 });
  
  // Main logic
  useActionHandler('saveData', async (payload) => {
    await api.saveData(payload);
  }, { priority: 5 });
  
  // Analytics (lowest priority)
  useActionHandler('saveData', async (payload) => {
    analytics.track('data_saved');
  }, { priority: 1 });
  
  return <button onClick={() => dispatch('saveData', { id: '1' })}>
    Save
  </button>;
}
```

## Migration Guide

### From Direct Store Usage

```typescript
// Before
const userStore = createStore('user', { name: '' });

function UserComponent() {
  const user = useStoreValue(userStore);
  return <div>{user.name}</div>;
}

// After (Declarative Store Pattern)
const UserStores = createStoreContext('User', {
  profile: { initialValue: { name: '' } }
});

const UserComponent = UserStores.withProvider(() => {
  const profileStore = UserStores.useStore('profile');
  const user = useStoreValue(profileStore);
  return <div>{user.name}</div>;
});
```

## Best Practices

### ✅ Do

- **Use factory functions** - Type-safe and organized
- **Prefer Declarative Store Pattern** - Excellent type inference
- **Use HOC pattern** - Automatic provider management
- **Register handlers early** - Use `useActionHandler` with `useCallback`
- **Keep components simple** - Business logic in action handlers

### ❌ Don't

- **Mix business logic in components** - Use action handlers instead
- **Skip error handling** - Always handle action errors
- **Use deprecated hooks** - Stick to essential and utility hooks
- **Manually manage providers** - Use factory patterns and HOCs

## Testing

All essential hooks are thoroughly tested with 40+ passing tests:

```bash
# Run tests
pnpm test

# Core hooks tested:
# - useStoreValue (4 tests)
# - useLocalStore (4 tests) 
# - createActionContext (8 tests)
# - useActionDispatch (6 tests)
# - useComputedStore (5 tests)
# - Comparison utilities (13 tests)
```

## Bundle Size

Optimized bundle size after cleanup:
- **87.13 kB** (20.83 kB gzipped)
- **25+ focused hooks** (down from 40+)
- **No unnecessary dependencies**

## Framework Integration

The Context-Action framework follows MVVM principles:
- **View**: React components (pure UI)
- **ViewModel**: Action handlers (business logic)
- **Model**: Store system (state management)

## Documentation

- [Hooks Reference](docs/HOOKS_REFERENCE.md) - Complete hook documentation
- [Framework Guide](../../CLAUDE.md) - Overall architecture

## TypeScript Support

Full type safety with excellent inference:

```typescript
// Excellent type inference
const UserStores = createStoreContext('User', {
  profile: { initialValue: { id: '', name: '' } }
});

// userStore is fully typed as Store<{id: string, name: string}>
const userStore = UserStores.useStore('profile');

// Actions are type-checked
interface MyActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
}

const dispatch = useActionDispatch<MyActions>();
dispatch('updateUser', { id: '1', name: 'John' }); // ✅ Type safe
dispatch('updateUser', { wrong: 'data' });         // ❌ Type error
```

## License

Apache-2.0 - see [LICENSE](./LICENSE) for details.
