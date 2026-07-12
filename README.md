# Context-Action Framework

[![npm version](https://img.shields.io/npm/v/@context-action/react.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/@context-action/react)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue?style=flat-square)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mineclover/context-action/ci.yml?branch=main&style=flat-square)](https://github.com/mineclover/context-action/actions)

**Revolutionary TypeScript state management with document-centric context separation and MVVM architecture.**

**🎯 Perfect separation of concerns** • **🔒 Full type safety** • **⚡ Zero boilerplate** • **🏗️ Scalable architecture** • **🌐 Vanilla JS Support**

[📚 Documentation](https://mineclover.github.io/context-action/) • [🇰🇷 한국어 문서](README.ko.md) • [🎮 Live Demo](https://mineclover.github.io/context-action/example/) • [🚀 Quick Start](#-quick-start) • [🌟 Vanilla JS](#-vanilla-javascript)

---

## ⚡ Quick Start

### Installation
```bash
# React applications
npm install @context-action/react

# Vanilla JavaScript/TypeScript (framework-agnostic)
npm install @context-action/core

# CDN (quick prototyping)
# <script type="module">
#   import { ActionRegister } from 'https://esm.sh/@context-action/core@latest';
# </script>
```

### 30-Second Example (React)
```typescript
import { createStoreContext, useStoreValue } from '@context-action/react';
import { useCallback } from 'react';

// 1. Create context
const { Provider, useStore } = createStoreContext('User', {
  profile: { name: 'John', email: 'john@example.com' }
});

// 2. Use in component  
function UserProfile() {
  const profileStore = useStore('profile');
  const profile = useStoreValue(profileStore);
  
  return <h1>Welcome, {profile.name}!</h1>;
}

// 3. Wrap with provider
function App() {
  return (
    <Provider>
      <UserProfile />
    </Provider>
  );
}
```

**That's it!** 🎉 Full type safety, reactive updates, and clean architecture.

### 30-Second Example (Vanilla JS)

```html
<!DOCTYPE html>
<html>
<body>
  <div id="counter">0</div>
  <button id="increment">Increment</button>

  <script type="module">
    import { ActionRegister } from 'https://esm.sh/@context-action/core@latest';

    // Simple store
    class Store {
      constructor(initialState) {
        this.state = initialState;
        this.listeners = new Set();
      }
      getValue() { return this.state; }
      setValue(newState) {
        this.state = newState;
        this.listeners.forEach(fn => fn(this.state));
      }
      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      }
    }

    // Create store and actions
    const store = new Store({ count: 0 });
    const actions = new ActionRegister({ name: 'Counter' });

    // Register handler
    actions.register('increment', () => {
      const current = store.getValue();
      store.setValue({ count: current.count + 1 });
    });

    // Subscribe and wire up
    store.subscribe(state => {
      document.getElementById('counter').textContent = state.count;
    });
    document.getElementById('increment').onclick = () => {
      actions.dispatch('increment');
    };
  </script>
</body>
</html>
```

**📚 [Complete Vanilla JS Guide](./docs/en/guide/vanilla-js-guide.md)** • **[Interactive Examples](./examples/vanilla-js/)**

---

## 🧭 Recommended First Path

If you want to understand Context-Action through the repository's current standard, start with the **Implementation Playbook path** instead of isolated APIs.

- **Standard convention**: [Implementation Convention](https://mineclover.github.io/context-action/en/context-layered/implementation-convention)
- **Canonical example**: [Canonical Order Form](https://mineclover.github.io/context-action/en/examples/canonical-order-form)
- **Scenario library**: [Playbook Scenario Library](https://mineclover.github.io/context-action/en/examples/implementation-playbook-scenarios)
- **Live demos**:
  - [Canonical Order](https://mineclover.github.io/context-action/example/patterns/implementation-playbook)
  - [Access Request](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/access-request)
  - [Incident Escalation](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/incident-escalation)
  - [Renewal Risk Review](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/renewal-risk-review)
- **Repo-local skill**: `skills/context-action-implementation-playbook/SKILL.md`
- **Verification**:
  - `pnpm test:canonical-example`
  - `pnpm --dir packages/react test -- --runInBand __tests__/patterns/access-request-playbook.integration.test.tsx`
  - `pnpm --dir packages/react test -- --runInBand __tests__/patterns/incident-escalation-playbook.integration.test.tsx`
  - `pnpm --dir packages/react test -- --runInBand __tests__/patterns/renewal-risk-review-playbook.integration.test.tsx`

This path now shows the full pattern as a reusable standard: convention, skill, canonical example, and three domain-specific demos.

---

## 🎯 Why Context-Action?

### ❌ Problems with Existing Libraries
- **High React Coupling** → Difficult component modularization
- **Binary State Approach** → Poor scope-based separation  
- **Complex Boilerplate** → Verbose setup and maintenance

### ✅ Context-Action's Solution
- **🎯 Document-Centric Design** → Context separation based on domain boundaries
- **🏗️ MVVM Architecture** → Perfect separation: Model, ViewModel, View layers
- **🔒 Type-First Approach** → Zero runtime errors with full TypeScript support
- **⚡ Zero Boilerplate** → Minimal code, maximum functionality

### 🚀 Key Benefits
```typescript
// Before: Complex setup with multiple libraries
const store = createStore(reducer);
const dispatch = useDispatch();
const selector = useSelector(state => state.user);
const actions = bindActionCreators(userActions, dispatch);

// After: One line with Context-Action
const { profile, updateProfile } = useUserPage(); // All logic in hook
```

---

## 🏗️ Core Patterns

### 🏪 Store Pattern
**Pure state management with reactive subscriptions**

```typescript
const { Provider: UserStoreProvider, useStore: useUserStore } = createStoreContext('User', {
  profile: { name: '', email: '' },
  settings: { theme: 'light' }
});

function UserComponent() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);

  return <div>{profile.name}</div>;
}
```

### 🎯 Action Pattern  
**Pure action dispatching with business logic separation**

```typescript
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string };
  logout: void;
}

const { Provider, useActionDispatch, useActionHandler } =
  createActionContext<UserActions>('UserActions');

function UserLogic() {
  const updateProfileHandler = useCallback(async (payload) => {
    // Business logic here
    await updateUserAPI(payload);
  }, []);

  useActionHandler('updateProfile', updateProfileHandler);
  
  return null; // Logic component
}
```

### 🔗 Pattern Composition
**Combine patterns for complex applications**

```typescript
// MVVM Architecture
function App() {
  return (
    <UserActionProvider>     {/* ViewModel */}
      <UserStoreProvider>    {/* Model */}
        <UserLogic>          {/* Business Logic */}
          <UserProfile />    {/* View */}
        </UserLogic>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

### 📚 Advanced Store Features

**TimeTravelStore** - Undo/redo + High-performance mode

```typescript
// Full undo/redo for editors
const editorStore = createTimeTravelStore('editor', { content: '' }, {
  maxHistory: 50,  // Keep 50 undo levels
  mutable: true
});

editorStore.undo();
editorStore.redo();

// High-performance mode (no undo/redo overhead)
const dashboardStore = createTimeTravelStore('dashboard', data, {
  maxHistory: 0,   // ⚡ Disable undo/redo for performance
  mutable: true,   // ✅ Structural sharing for selective re-rendering
  notificationMode: 'batched'  // RAF batching
});
```

**📖 [Complete Store Guide](docs/STORE_GUIDE.md)** - Learn about:
- TimeTravelStore usage patterns
- Disabling undo/redo for performance
- Notification modes (batched vs immediate)
- Best practices and migration guides

### 🏗️ 5-Layer Hooks Architecture

**Context-Action implements a sophisticated 5-layer hooks architecture that provides perfect separation of concerns and optimal performance through delayed evaluation.**

```mermaid
graph TD
    %% Context Share Layer
    subgraph ContextShare["Context Share Layer Provider"]
        Store[Store]
        subgraph ActionsContainer["Actions"]
            Actions[Actions]
            Pipeline[Pipeline<br/>- Business logic registration<br/>- Execution order management<br/>- Middleware processing]
        end
        Ref[Ref<br/>- Singleton instance management]
    end

    %% 6-Layer Hooks Structure
    subgraph Hooks["6-Layer Hooks Consumer"]
        ContextDef[contexts<br/>Resource type definitions]
        Business[business<br/>Pure business logic<br/>functions]
        Handlers[handlers<br/>Handler injection pattern<br/>implementation]
        Actions[actions<br/>Action dispatch<br/>callback functions]
        Subscriptions[hooks<br/>Store subscriptions<br/>computed values]
        Views[views<br/>Pure UI components]
    end

    %% UI Layer
    subgraph UI["UI Layer - views"]
        Page[Page - route]
        Layout[Layout - device Layer]
        Widget[Widget - design system]
    end

    %% Data Flow
    Store -->|State management| ContextDef
    ContextDef -->|Type definitions| Business
    Business -->|Pure functions| Handlers
    Handlers -->|Handler injection| Actions
    Actions -->|Action execution| Pipeline
    Pipeline -->|Pipeline execution| Store
    Store -->|Subscription| Subscriptions
    Subscriptions -->|Data transfer| Views
    Views -->|UI rendering| UI
    Actions -->|Action dispatch| Pipeline

    %% UI Mount Order
    Page -->|Mount| Layout
    Layout -->|Mount| Widget
```

#### 🔄 Data Flow Principles

1. **Context Share Layer (Provider)**
   - **Store**: Centralized state management with reactive subscriptions
   - **Actions/Pipeline**: Business logic registration and execution order management
   - **Ref**: Singleton instance management for performance optimization

2. **6-Layer Hooks Structure (Consumer)**
   - **contexts**: Resource type definitions and context access
   - **business**: Pure business logic functions separated from side effects
   - **handlers**: Handler injection pattern implementation with latest value access
   - **actions**: Action dispatch functions and callback management
   - **hooks**: Store subscriptions and computed values for reactive data
   - **views**: Pure UI components with minimal coupling

3. **UI Layer (Views)**
   - **Page**: Route-level components
   - **Layout**: Device-specific layout components
   - **Widget**: Design system components

#### ⚡ Performance Benefits

- **Delayed Evaluation**: Handlers access latest state via `store.getValue()`
- **Selective Subscriptions**: Components subscribe only to needed state slices
- **Minimal Re-renders**: Optimized dependency tracking prevents unnecessary updates
- **Singleton Management**: Ref layer ensures efficient resource sharing

```typescript
// 6-Layer Implementation Example
function UserPage() {
  // Layer 1: contexts - Resource type definitions
  const userStore = useUserStore('profile');

  // Layer 2: handlers - Internal function definitions
  const updateUserHandler = useCallback(async (payload) => {
    const currentUser = userStore.getValue(); // Delayed evaluation
    const updatedUser = { ...currentUser, ...payload };
    userStore.setValue(updatedUser);
  }, [userStore]);

  // Layer 3: subscriptions - Selective state subscriptions
  const user = useStoreValue(userStore);

  // Layer 4: registries - Handler registration
  useActionHandler('updateUser', updateUserHandler);

  // Layer 5: dispatchers - View-oriented action dispatchers
  const onUpdateUser = useActionDispatch('updateUser');

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => onUpdateUser({ name: 'New Name' })}>
        Update User
      </button>
    </div>
  );
}
```

---

## 🔗 Type System Guidelines

**Context-Action implements a sophisticated type system that provides full TypeScript safety across Action, Store, and Ref connections with zero runtime overhead.**

### 🎯 Type Declaration Architecture

```mermaid
graph TB
    %% Type Declaration Layer
    subgraph TypeDeclarations["🔤 Type Declaration Layer"]
        PayloadMap[ActionPayloadMap<br/>Action payload type map]
        StoreTypes[StoreDefinitions<br/>Store type definitions]
        RefTypes[Ref Types<br/>Singleton reference types]
    end

    %% Context Creation Layer
    subgraph ContextCreation["⚙️ Context Creation Layer"]
        ActionContext[createActionContext&lt;T&gt;<br/>Action context creation]
        StoreContext[createStoreContext&lt;T&gt;<br/>Store context creation]
        RefManager[RefManager&lt;T&gt;<br/>Reference manager]
    end

    %% Hook Layer
    subgraph HookLayer["🪝 Hook Layer"]
        ActionHooks[useActionDispatch<br/>useActionHandler]
        StoreHooks[useStore<br/>useStoreValue]
        RefHooks[useRef<br/>useCallback]
    end

    %% Type Flow Connections
    PayloadMap -->|extends| ActionContext
    StoreTypes -->|initialStores| StoreContext
    RefTypes -->|singleton| RefManager

    ActionContext -->|typed hooks| ActionHooks
    StoreContext -->|typed hooks| StoreHooks
    RefManager -->|stable refs| RefHooks

    %% Type Safety Flow
    ActionHooks -->|type-safe dispatch| PayloadMap
    StoreHooks -->|reactive types| StoreTypes
    RefHooks -->|stable references| RefTypes
```

### ⚡ Type Connection Patterns

#### 1. **Action Type Declaration & Connection**
```typescript
// 1️⃣ Define Action Payload Types
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string; avatar?: File };
  deleteAccount: { confirmPassword: string };
  logout: void; // No payload
}

// 2️⃣ Create Typed Action Context
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// 3️⃣ Type-Safe Handler Registration
function UserLogic() {
  // ✅ Payload automatically typed as { name: string; email: string; avatar?: File }
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // payload.name ✅ string
    // payload.email ✅ string
    // payload.avatar ✅ File | undefined
    await updateUserAPI(payload);
  }, []));

  // ✅ Payload automatically typed as void
  useUserActionHandler('logout', useCallback(async () => {
    await clearSession();
  }, []));
}

// 4️⃣ Type-Safe Action Dispatching
function UserComponent() {
  const dispatch = useUserAction();

  return (
    <button onClick={() =>
      dispatch('updateProfile', {
        name: 'John',
        email: 'john@example.com'
        // ✅ TypeScript enforces correct payload shape
      })
    }>
      Update Profile
    </button>
  );
}
```

#### 2. **Store Type Declaration & Connection**
```typescript
// 1️⃣ Define Store Types (Two Approaches)

// Approach A: Simple Object Types
const { Provider, useStore } = createStoreContext('User', {
  profile: { name: '', email: '', isOnline: false }, // ✅ Type inferred
  settings: { theme: 'light' as const, notifications: true }, // ✅ const assertions
  preferences: { language: 'en', timezone: 'UTC' }
});

// Approach B: Explicit Store Configuration
interface UserStoreConfig {
  profile: StoreConfig<UserProfile>;
  settings: StoreConfig<UserSettings>;
  cache: StoreConfig<CacheData>; // ✅ With strategy configuration
}

const { Provider, useStore } = createStoreContext('User', {
  profile: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' }, strategy: 'shallow' },
  cache: { initialValue: new Map(), strategy: 'reference' }
} satisfies UserStoreConfig);

// 2️⃣ Type-Safe Store Access & Subscription
function UserProfile() {
  const profileStore = useStore('profile'); // ✅ Store<UserProfile>
  const profile = useStoreValue(profileStore); // ✅ UserProfile type

  // ✅ Type-safe store operations
  profileStore.setValue({ name: 'John', email: 'john@example.com', isOnline: true });
  profileStore.update(prev => ({ ...prev, isOnline: !prev.isOnline }));

  return <div>{profile.name}</div>; // ✅ profile.name is string
}
```

#### 3. **Ref Type Declaration & Singleton Management**
```typescript
// 1️⃣ Ref Type Declarations for Singleton Resources
interface AppRefs {
  apiClient: ApiClient;
  eventBus: EventBus;
  cache: LRUCache<string, any>;
}

// 2️⃣ Context with Ref Management
const {
  Provider: AppProvider,
  useStore,
  useRef: useAppRef
} = createStoreContext('App', {
  user: { name: '', email: '' },
  // ✅ Ref types managed alongside stores
}, {
  refs: {
    apiClient: () => new ApiClient(),
    eventBus: () => new EventBus(),
    cache: () => new LRUCache(1000)
  } as AppRefs
});

// 3️⃣ Type-Safe Ref Access
function ApiComponent() {
  const apiClient = useAppRef('apiClient'); // ✅ ApiClient type
  const userStore = useStore('user');

  const fetchUser = useCallback(async (id: string) => {
    // ✅ apiClient.get is typed method
    const userData = await apiClient.get(`/users/${id}`);
    userStore.setValue(userData);
  }, [apiClient, userStore]);

  return <button onClick={() => fetchUser('123')}>Fetch User</button>;
}
```

### 🛡️ Type Safety Benefits

#### **Compile-Time Validation**
- ✅ **Action Payload Validation**: Incorrect payload shapes caught at compile time
- ✅ **Store Type Consistency**: Store value types enforced across components
- ✅ **Ref Type Stability**: Singleton reference types maintained across re-renders
- ✅ **Hook Return Types**: All hooks return properly typed values and functions

#### **IntelliSense & Developer Experience**
- 🔍 **Auto-completion**: Full IntelliSense for action names, payload properties, store keys
- 🏷️ **Type Hints**: Hover information shows exact payload and store types
- ⚠️ **Error Prevention**: TypeScript prevents runtime errors before they happen
- 🔄 **Refactoring Safety**: Type-safe refactoring across the entire codebase

#### **Zero Runtime Overhead**
- ⚡ **Compile-Time Only**: All type information removed in production builds
- 📦 **No Type Libraries**: No runtime type checking dependencies
- 🎯 **Direct Performance**: Types guide optimization without runtime cost

### 📚 **Detailed Type System Documentation**

For comprehensive type system coverage, see our dedicated guides:

#### **English Documentation**
- **[📖 TypeScript Type Inference Guide](https://mineclover.github.io/context-action/en/guide/type-inference)** - Complete type inference overview
- **[🎯 Action Type System](https://mineclover.github.io/context-action/en/guide/patterns/action/type-system)** - ActionPayloadMap, pipeline controllers, and handler types
- **[🔧 Advanced Type Features](https://mineclover.github.io/context-action/en/guide/type-inference/advanced)** - Branded types, conditional processing, and utilities
- **[🛡️ Type Safety Best Practices](https://mineclover.github.io/context-action/en/guide/type-inference/best-practices)** - Essential recommendations and patterns

#### **Korean Documentation**
- **[🎯 Action Type System](https://mineclover.github.io/context-action/en/guide/patterns/action/type-system)** - ActionPayloadMap, type safety, TypeScript integration

#### **Core Type System Features**
- **Action Type Safety**: Complete `ActionPayloadMap` interface with pipeline controller types
- **Store Type Inference**: Automatic type inference from initial values with strategy support
- **Handler Configuration**: Type-safe handler registration with comprehensive options
- **Integration Patterns**: Store integration, async handling, and error management
- **Advanced Features**: Conditional types, branded types, and generic utilities

---

## 📋 API Reference

### Core Functions

#### `createStoreContext(name, stores)`
Create typed store context with reactive subscriptions.
```typescript
const { Provider, useStore } = createStoreContext('App', {
  user: { name: '', email: '' },
  settings: { theme: 'light' }
});
```

#### `createActionContext<T>(name)`  
Create typed action context with pipeline processing.
```typescript
interface Actions extends ActionPayloadMap {
  update: { id: string };
}
const { Provider, useActionDispatch } = createActionContext<Actions>('App');
```

### Essential Hooks

#### `useStoreValue(store)`
Subscribe to store changes with automatic re-renders.
```typescript
const userStore = useStore('user');
const user = useStoreValue(userStore); // Reactive subscription
```

#### `useActionHandler(action, handler)`
Register business logic handlers for actions.
```typescript
const updateProfileHandler = useCallback(async (payload) => {
  // Business logic here
}, []);

useActionHandler('updateProfile', updateProfileHandler);
```

#### `useActionDispatch()`
Dispatch actions to the pipeline.
```typescript
const dispatch = useActionDispatch();
dispatch('updateProfile', { name: 'John', email: 'john@example.com' });
```

---

## 🎮 Examples & Demos

### 🌟 Vanilla JavaScript

**[📁 Interactive Vanilla JS Examples](./examples/vanilla-js/)** - No build tools required!

- **[Basic Counter](./examples/vanilla-js/basic-counter.html)** - Simple counter with async operations
- **[Todo App](./examples/vanilla-js/todo-app.html)** - Full-featured todo application
- **[Complete Guide](./docs/en/guide/vanilla-js-guide.md)** - 5 real-world patterns and examples

Just open the HTML files in your browser or run:
```bash
npx serve examples/vanilla-js
# Then visit: http://localhost:3000/basic-counter.html
```

### 🚀 React Live Examples
**[Explore 20+ working examples →](https://mineclover.github.io/context-action/example/)**

#### 🏪 **Store System**
- [Store Basics](https://mineclover.github.io/context-action/example/#/store-basic) - Fundamental operations
- [Store Full Demo](https://mineclover.github.io/context-action/example/#/store-full-demo) - Complex state management
- [Declarative Pattern](https://mineclover.github.io/context-action/example/#/store-declarative-pattern) - Type-safe patterns

#### 🎯 **Action System** 
- [Core Features](https://mineclover.github.io/context-action/example/#/action-core-features) - Pipeline fundamentals
- [Action Guards](https://mineclover.github.io/context-action/example/#/action-guard-search) - Advanced filtering
- [Priority System](https://mineclover.github.io/context-action/example/#/action-priority-performance) - Performance optimization

#### 🔗 **MVVM Architecture**
- [Unified Pattern](https://mineclover.github.io/context-action/example/#/unified-pattern-demo) - Complete MVVM demo
- [Enhanced Context](https://mineclover.github.io/context-action/example/#/enhanced-context-store) - Advanced patterns

### 📖 Real-World Examples
```typescript
// E-commerce Cart System
const CartStores = createStoreContext('Cart', {
  items: [] as CartItem[],
  total: 0,
  shipping: { method: 'standard', cost: 0 }
});

// User Management System  
interface UserActions extends ActionPayloadMap {
  login: { email: string; password: string };
  updateProfile: Partial<UserProfile>;
  logout: void;
}
```

### 🔍 **New in v0.7.0: Enhanced LogMonitor Documentation**
- **[📊 Logger System Demo](https://mineclover.github.io/context-action/example/#/logger-demo)** - Interactive LogMonitor showcase
- **Real-time log collection** - Live demo with practical examples
- **Integration patterns** - Parent/Child handler implementations
- **Dependency warnings** - Avoid infinite loops with best practices

---

## 🏗️ Architecture

Context-Action Framework implements multiple architectural approaches for different application needs:

### 📐 **Context-Driven Architecture**

**[Context-Driven Architecture](https://mineclover.github.io/context-action/en/architecture/context-driven-architecture)** - Core frontend architecture for clear document-based separation

**Philosophy**: *"The document is the architecture"* - Each context exists as a unit for managing documents and deliverables of its domain.

**Key Features:**
- **Document-Centric Context Separation**: Clear boundaries between domain contexts
- **6-Layer Hooks Architecture**: Provider/Consumer pattern with delayed evaluation
- **Domain Context Isolation**: Business, UI, Validation, Design, Architecture contexts
- **Effective Artifact Management**: State management supporting document-deliverable relationships

### 🔧 **Implementation Guides**

- **[Context-Layered Architecture](https://mineclover.github.io/context-action/en/context-layered/context-layered-guide)** - Practical 6-layer implementation guide
- **[Folder Structure Guide](https://mineclover.github.io/context-action/en/context-layered/architecture/folder-structure)** - Organized project structure
- **[Handler Registry Management](https://mineclover.github.io/context-action/en/context-layered/architecture/handler-registry)** - ID and priority management

---

## 📚 Documentation

### 📖 Complete Guides
- **[📚 Official Documentation](https://mineclover.github.io/context-action/)** - Complete API reference
- **[🚀 Getting Started Guide](https://mineclover.github.io/context-action/en/guide/getting-started)** - 5-minute setup
- **[🏗️ MVVM Core Architecture](https://mineclover.github.io/context-action/en/concept/mvvm-core-architecture)** - Practical MVVM implementation guide
- **[📋 Architecture Overview](https://mineclover.github.io/context-action/en/concept/architecture-guide)** - Framework concepts
- **[⚡ Best Practices](https://mineclover.github.io/context-action/en/guide/best-practices)** - Production patterns

### 🌏 Multi-Language Support
- **[🇺🇸 English Documentation](https://mineclover.github.io/context-action/en/)** - Complete English guides
- **[🇰🇷 Korean Documentation](https://mineclover.github.io/context-action/ko/)** - Complete Korean guide

---

## 📦 Packages

### [@context-action/core](./packages/core)
**Pure TypeScript action pipeline** - ⭐ **Framework-agnostic** (Vanilla JS, React, Vue, Svelte, etc.)
```bash
npm install @context-action/core
# or use CDN
# https://esm.sh/@context-action/core@latest
```
- 🌐 **Vanilla JavaScript support** - No framework required!
- 🔒 Full TypeScript support
- ⚡ Action pipeline system with priority-based execution
- 🛡️ Advanced action guards (debounce, throttle, filtering)
- 🚫 Zero dependencies
- 📚 **[Vanilla JS Guide](./docs/en/guide/vanilla-js-guide.md)** | **[Interactive Examples](./examples/vanilla-js/)**

### [@context-action/react](./packages/react)
**React integration** - Complete MVVM architecture
```bash
npm install @context-action/react
```
- 🏪 Declarative store patterns
- 🎯 Action context integration
- 🪝 Advanced React hooks
- 🏗️ HOC support

---

## 🛠️ Development

### Quick Development Setup
```bash
git clone https://github.com/mineclover/context-action.git
cd context-action
pnpm install
pnpm dev  # Start example app
```

### Project Resources
- **[🤝 Contributing Guide](./CONTRIBUTING.md)** - How to contribute
- **[🌐 Ecosystem](./ECOSYSTEM.md)** - Tools and generators  
- **[🛠️ Development Guide](./DEVELOPMENT.md)** - Detailed development setup

---

## 📄 License

Apache-2.0 © [mineclover](https://github.com/mineclover)

---

<div align="center">

**Built with ❤️ for modern TypeScript applications**

[⭐ Star on GitHub](https://github.com/mineclover/context-action) • [🐛 Report Bug](https://github.com/mineclover/context-action/issues) • [💡 Request Feature](https://github.com/mineclover/context-action/discussions)

</div>
