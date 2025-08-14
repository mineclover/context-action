# Context-Action Framework

A revolutionary TypeScript state management system designed to overcome the fundamental limitations of existing libraries through **document-centric context separation** and **effective artifact management**.

## 🎯 Core Philosophy

The Context-Action framework addresses critical issues in modern state management:

### Problems with Existing Libraries
- **High React Coupling**: Tight integration makes component modularization and props handling difficult
- **Binary State Approach**: Simple global/local state dichotomy fails to handle specific scope-based separation  
- **Inadequate Handler/Trigger Management**: Poor support for complex interactions and business logic processing

### Context-Action's Solution
- **Document-Artifact Centered Design**: Context separation based on document themes and deliverable management
- **Perfect Separation of Concerns**: 
  - View design in isolation → Design Context
  - Development architecture in isolation → Architecture Context  
  - Business logic in isolation → Business Context
  - Data validation in isolation → Validation Context
- **Clear Boundaries**: Implementation results maintain distinct, well-defined domain boundaries
- **Effective Document-Artifact Management**: State management library that actively supports the relationship between documentation and deliverables

The framework implements an **MVVM-inspired architecture** with clear separation between View (React components), ViewModel (Action pipeline), and Model (Store system) layers, all organized around **context-driven domain isolation**.

## 📦 Packages

### [@context-action/core](./packages/core)

Core action pipeline management with no React dependencies.

```bash
npm install @context-action/core
```

**Features:**
- 🔒 **Type-safe**: Full TypeScript support with strict type checking
- ⚡ **Action Pipeline System**: Centralized action processing with priority-based handler execution
- 🔄 **Async Support**: Handle both sync and async operations seamlessly
- 🛡️ **Error Handling**: Built-in error handling and abort mechanisms with pipeline controller
- 📊 **Trace Logging**: Advanced debugging with configurable trace logging

### [@context-action/react](./packages/react)

React integration with Context API, hooks, and advanced store system for complete MVVM architecture.

```bash
npm install @context-action/react
```

**Features:**
- 🏪 **Store Only Pattern**: Pure state management with reactive subscriptions
- 🎯 **Action Only Pattern**: Pure action dispatching with pipeline management
- 🔗 **Pattern Composition**: Combine Store Only + Action Only patterns for complex applications
- 🪝 **Type-Safe Hooks**: Domain-specific hook exports with excellent type inference
- 🏗️ **HOC Pattern**: `withProvider()` for automatic component wrapping
- 🔄 **Provider Isolation**: Independent context management per pattern

### [@context-action/logger](./packages/logger)

Lightweight logging utilities with trace capabilities for debugging and monitoring.

### [@context-action/jotai](./packages/jotai)

Jotai integration for atom-based state management with action pipeline coordination.

### [@context-action/glossary](./packages/glossary)

Documentation tools for TypeScript glossary management and term organization.

## 🏗️ Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm globally if you haven't
npm install -g pnpm

# Install dependencies
pnpm install
```

### Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm build:core    # Build @context-action/core
pnpm build:react   # Build @context-action/react

# Run tests for all packages
pnpm test

# Run tests for specific package
pnpm test:core     # Test @context-action/core

# Run linting
pnpm lint

# Type checking
pnpm type-check

# Clean build artifacts
pnpm clean

# Check what packages have changed
pnpm changed

# See diff of changes
pnpm diff
```

### Version Management

```bash
# Version all changed packages
pnpm version

# Version with specific bump
pnpm version:patch  # Patch release (0.0.x)
pnpm version:minor  # Minor release (0.x.0)
pnpm version:major  # Major release (x.0.0)
```

### Publishing

```bash
# Publish all changed packages
pnpm release

# Publish with version bump
pnpm release:patch  # Bump patch version and publish
pnpm release:minor  # Bump minor version and publish
pnpm release:major  # Bump major version and publish
```

## 🚀 Quick Start

### 🏪 Store Only Pattern (Core Pattern)

For pure state management without action dispatching:

```typescript
import { createDeclarativeStorePattern } from '@context-action/react';

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' } }
});

function App() {
  return (
    <AppStoreProvider>
      <UserComponent />
    </AppStoreProvider>
  );
}

function UserComponent() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  
  return <div>User: {user.name}</div>;
}
```

### 🎯 Action Only Pattern (Core Pattern)

For pure action dispatching without state management:

```typescript
import { createActionContext } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';

interface EventActions extends ActionPayloadMap {
  trackEvent: { event: string; data: any };
}

const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

function App() {
  return (
    <EventActionProvider>
      <EventComponent />
    </EventActionProvider>
  );
}

function EventComponent() {
  const dispatch = useEventAction();
  
  useEventActionHandler('trackEvent', async (payload) => {
    await analytics.track(payload.event, payload.data);
  });
  
  return <button onClick={() => dispatch('trackEvent', { event: 'click', data: {} })}>
    Track Event
  </button>;
}
```

### 🔗 Pattern Composition

For complex applications needing both actions and state management, compose the patterns:

```typescript
import { createActionContext, createDeclarativeStorePattern } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';

// Define separate contexts
interface UserActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
  resetUser: void;
}

const { 
  Provider: UserActionProvider, 
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

const UserStores = createDeclarativeStorePattern('UserStores', {
  profile: { id: '', name: '', email: '' },
  preferences: { theme: 'light' as const }
});

// Compose providers and use both patterns
function App() {
  return (
    <UserActionProvider>
      <UserStores.Provider>
        <UserProfile />
      </UserStores.Provider>
    </UserActionProvider>
  );
}

function UserProfile() {
  const profileStore = UserStores.useStore('profile');
  const profile = useStoreValue(profileStore);
  const dispatch = useUserAction();
  
  useUserActionHandler('updateUser', useCallback(async (payload) => {
    profileStore.setValue({ ...profile, ...payload });
  }, [profile, profileStore]));
  
  return <div>Welcome, {profile.name}!</div>;
}
```

## 🏗️ Architecture

### Context Separation Strategy

#### Domain-Based Context Architecture
- **Business Context**: Business logic, data processing, and domain rules
- **UI Context**: Screen state, user interactions, and component behavior
- **Validation Context**: Data validation, form processing, and error handling
- **Design Context**: Theme management, styling, layout, and visual states
- **Architecture Context**: System configuration, infrastructure, and technical decisions

#### Document-Based Context Design
Each context manages its corresponding documentation and deliverables:
- **Design Documentation** → Design Context (themes, component specifications, style guides)
- **Business Requirements** → Business Context (workflows, rules, domain logic)
- **Architecture Documents** → Architecture Context (system design, technical decisions)
- **Validation Specifications** → Validation Context (rules, schemas, error handling)
- **UI Specifications** → UI Context (interactions, state management, user flows)

### Key Architectural Patterns

- **Store Only Pattern**: Pure state management with reactive subscriptions and domain isolation
- **Action Only Pattern**: Pure action dispatching with centralized pipeline processing
- **Action Pipeline System**: All user interactions dispatch actions to a central `ActionRegister` which processes handlers by priority
- **Store Integration Pattern**: 3-step process (read current state → execute business logic → update stores)
- **MVVM Architecture**: Clear separation between View (React components), ViewModel (Action pipeline), and Model (Store system)
- **Domain Isolation**: Complete context boundaries with controlled cross-context communication

## 📁 Project Structure

```
context-action/
├── packages/
│   ├── core/                   # Core action pipeline management
│   │   └── src/
│   │       ├── ActionRegister.ts    # Central action processing
│   │       ├── types.ts             # Type definitions
│   │       └── index.ts
│   ├── react/                  # React integration with MVVM architecture
│   │   └── src/
│   │       ├── ActionProvider.tsx               # React context integration
│   │       ├── store/                           # Advanced store system
│   │       │   ├── context-store-pattern.tsx   # Context Store Pattern with HOC
│   │       │   ├── hooks/                       # Store management hooks
│   │       │   └── Store.ts                     # Store implementation
│   │       └── index.ts
│   ├── logger/                 # Logging utilities with trace capabilities
│   ├── jotai/                  # Jotai integration for atom-based state management
│   └── glossary/               # Documentation tools for TypeScript glossary
├── example/                    # Comprehensive example application
├── docs/                       # VitePress documentation site
├── .github/workflows/          # CI/CD and GitHub Pages deployment
└── scripts/                    # Build and utility scripts
```

## 🛠️ Technology Stack

- **Package Manager**: pnpm with workspaces + Lerna
- **Monorepo Tool**: Lerna 8.x for versioning and publishing
- **Language**: TypeScript 5.3+
- **Bundler**: tsdown (powered by rolldown)
- **Documentation**: VitePress
- **Code Quality**: ESLint + TypeScript strict mode
- **Testing**: Jest + TypeScript

## 📝 Contributing

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Make your changes
4. Build all packages: `pnpm build`
5. Run tests: `pnpm test`
6. Lint your code: `pnpm lint`
7. Check for changes: `pnpm changed`
8. Submit a pull request

## 📄 License

Apache-2.0 © [mineclover](https://github.com/mineclover)

## 🔗 Links

- [📚 Documentation](https://mineclover.github.io/context-action/) - Complete documentation and API reference
- [🎮 Live Example](https://mineclover.github.io/context-action-example/) - Interactive example application
- [Core Package](./packages/core) - @context-action/core (Pure TypeScript)
- [React Package](./packages/react) - @context-action/react (React integration)
- [Logger Package](./packages/logger) - @context-action/logger (Logging utilities)
- [Jotai Package](./packages/jotai) - @context-action/jotai (Jotai integration)
- [Glossary Package](./packages/glossary) - @context-action/glossary (Documentation tools)
- [Release Guide](./RELEASE.md) - Publishing documentation
- [Issues](https://github.com/mineclover/context-action/issues) - Bug reports and feature requests
- [한국어 README](./README.ko.md) - Korean version