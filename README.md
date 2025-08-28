# Context-Action Framework

[![npm version](https://img.shields.io/npm/v/@context-action/react?logo=npm)](https://www.npmjs.com/package/@context-action/react)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mineclover/context-action/ci.yml?branch=main)](https://github.com/mineclover/context-action/actions)

**Revolutionary TypeScript state management with document-centric context separation and MVVM architecture.**

**🎯 Perfect separation of concerns** • **🔒 Full type safety** • **⚡ Zero boilerplate** • **🏗️ Scalable architecture**

[📚 Documentation](https://mineclover.github.io/context-action/) • [🎮 Live Demo](https://mineclover.github.io/context-action/example/) • [🚀 Quick Start](#-quick-start)

---

## ⚡ Quick Start

### Installation
```bash
npm install @context-action/react
# or
npm install @context-action/core  # Pure TypeScript
```

### 30-Second Example
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
const UserStores = createStoreContext('User', {
  profile: { name: '', email: '' },
  settings: { theme: 'light' }
});

function UserComponent() {
  const profileStore = UserStores.useStore('profile');
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}
```

### 🎯 Action Pattern  
**Pure action dispatching with business logic separation**

```typescript
interface UserActions extends ActionPayloadMap {
  updateUser: { name: string; email: string };
  logout: void;
}

const { Provider, useActionDispatch, useActionHandler } = 
  createActionContext<UserActions>('UserActions');

function UserLogic() {
  const updateUserHandler = useCallback(async (payload) => {
    // Business logic here
    await updateAPI(payload);
  }, []);
  
  useActionHandler('updateUser', updateUserHandler);
  
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
const updateUserHandler = useCallback(async (payload) => {
  // Business logic here
}, []);

useActionHandler('updateUser', updateUserHandler);
```

#### `useActionDispatch()`
Dispatch actions to the pipeline.
```typescript
const dispatch = useActionDispatch();
dispatch('updateUser', { name: 'John' });
```

---

## 🎮 Examples & Demos

### 🚀 Live Interactive Examples
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

---

## 📚 Documentation

### 📖 Complete Guides
- **[📚 Official Documentation](https://mineclover.github.io/context-action/)** - Complete API reference
- **[🚀 Quick Start Guide](https://mineclover.github.io/context-action/en/guide/quick-start)** - 5-minute setup
- **[🏗️ MVVM Architecture](https://mineclover.github.io/context-action/en/guide/full)** - Complete architecture guide
- **[⚡ Best Practices](https://mineclover.github.io/context-action/en/guide/best-practices)** - Production patterns

### 🌏 Multi-Language Support
- **[🇺🇸 English Documentation](https://mineclover.github.io/context-action/en/)** - Complete English guides
- **[🇰🇷 한국어 문서](https://mineclover.github.io/context-action/ko/)** - 완전한 한국어 가이드

---

## 📦 Packages

### [@context-action/core](./packages/core)
**Pure TypeScript action pipeline** - Framework agnostic core
```bash
npm install @context-action/core
```
- 🔒 Full TypeScript support
- ⚡ Action pipeline system  
- 🛡️ Advanced action guards
- 🚫 Zero dependencies

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