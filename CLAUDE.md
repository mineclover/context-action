# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript monorepo for the **Context-Action framework** - a revolutionary state management system designed to overcome the fundamental limitations of existing libraries through document-centric context separation and effective artifact management.

## 🎯 Current Status (November 2026)

**Framework Stability: Multi-package monorepo with promoted stable/preview cohorts**

Do not rely on historical suite counts or a static “production ready” label.
The source of truth is the current protected validation pipeline (`pnpm verify`, `pnpm verify:quick`, `pnpm release:check`):

- `pnpm verify` / `pnpm verify:quick` + `pnpm verify:receipt` (Local-First RFC 8785 verification receipts)
- full strict source and test type checking across all 20 workspace packages
- React 18/19 compatibility and SSR/hydration verification
- packed ESM/CJS consumer and package-export verification
- durable-operation Redis/PostgreSQL/backend smoke evidence
- example (`72` canonical routes), surface catalog (`CA-SURFACE-CATALOG-001`), and workspace-only tool verification

Publishing still requires an approved version/cohort decision and a protected workflow (see `releases/RELEASE.md`).

### Project Philosophy

The Context-Action framework addresses critical issues in modern state management:

#### Problems with Existing Libraries
- **High React Coupling**: Tight integration makes component modularization and props handling difficult
- **Binary State Approach**: Simple global/local state dichotomy fails to handle specific scope-based separation
- **Inadequate Handler/Trigger Management**: Poor support for complex interactions and business logic processing

#### Context-Action's Solution
- **Document-Artifact Centered Design**: Context separation based on document themes and deliverable management
- **Perfect Separation of Concerns**: 
  - View design in isolation → Design Context
  - Development architecture in isolation → Architecture Context
  - Business logic in isolation → Business Context  
  - Data validation in isolation → Validation Context
- **Clear Boundaries**: Implementation results maintain distinct, well-defined domain boundaries
- **Effective Document-Artifact Management**: State management library that actively supports the relationship between documentation and deliverables

The framework implements a **Context-Layered Architecture** (see [Context-Layered Architecture Guide](docs/en/context-layered/context-layered-guide.md)) with clear separation between View (React components), Action/Handler layers (business logic), and Store system (state management) layers, all organized around **context-driven domain isolation**.

## Architecture

### Core Philosophy
The Context-Action framework follows these principles:
- **Document-Centric Context Separation**: Each context represents a specific document domain (design, architecture, business, validation)
- **Type Safety**: Full TypeScript support with strict type checking throughout
- **Action Pipeline**: Centralized action processing with priority-based handler execution
- **Store Integration**: Decoupled state management with reactive store subscriptions
- **Context-Layered Architecture**: Clear separation of concerns with pure business logic functions and orchestration handlers following [6-layer structure](docs/en/context-layered/architecture/folder-structure.md)

### Context Separation Strategy

#### Domain-Based Context Architecture
- **Business Context**: Business logic, data processing, and domain rules
- **UI Context**: Screen state, user interactions, and component behavior  
- **Validation Context**: Data validation, form processing, and error handling
- **Design Context**: Theme management, styling, layout, and visual states
- **Architecture Context**: System configuration, infrastructure, and technical decisions

#### Document-Based Context Design
Each context is designed to manage its corresponding documentation and deliverables:
- **Design Documentation** → Design Context (themes, component specifications, style guides)
- **Business Requirements** → Business Context (workflows, rules, domain logic)  
- **Architecture Documents** → Architecture Context (system design, technical decisions)
- **Validation Specifications** → Validation Context (rules, schemas, error handling)
- **UI Specifications** → UI Context (interactions, state management, user flows)

### Advanced Handler & Trigger Management

Context-Action provides sophisticated handler and trigger management that existing libraries lack:

#### Priority-Based Handler Execution
- **Sequential Processing**: Handlers execute in priority order with proper async handling
- **Domain Isolation**: Each context maintains its own handler registry
- **Cross-Context Coordination**: Controlled communication between domain contexts
- **Result Collection**: Aggregate results from multiple handlers for complex workflows

#### Intelligent Trigger System
- **State-Change Triggers**: Automatic triggers based on store value changes
- **Cross-Context Triggers**: Domain boundaries can trigger actions in other contexts
- **Conditional Triggers**: Smart triggers based on business rules and conditions
- **Trigger Cleanup**: Automatic cleanup prevents memory leaks and stale references

### Package Structure (20 Workspace Packages Across 6 Layers)

See [Repository Surface Catalog](docs/en/context-layered/repository-surface-catalog.md) (`catalog/repository-surface/api-surface.v1.json`, `CA-SURFACE-CATALOG-001`), [Package Boundary Convention](docs/en/context-layered/package-boundary-convention.md), and [Store Selection and Usage Guide](docs/en/context-layered/store-selection-and-usage-guide.md) for the complete inventory, exports, and Store usage rules:

- **Foundation (`5`)**: `@context-action/core`, `@context-action/store-core`, `@context-action/mutative-core`, `@context-action/tool-protocol`, `@context-action/tool-durable-operations`
- **Framework Adapters (`4`)**: `@context-action/react`, `@context-action/mutative`, `@context-action/lit`, `@context-action/preact`
- **UI Runtimes (`2`)**: `@context-action/lit-ui`, `@context-action/preact-ui`
- **Integration Adapters (`3`)**: `@context-action/xstate`, `@context-action/ai-sdk`, `@context-action/webmcp`
- **Tooling (`3`)**: `@context-action/llms-generator`, `@context-action/typedoc-vitepress-sync`, `@context-action/style-testing`
- **Private Host Support (`3`)**: `@context-action/live-code-editor`, `@context-action/openrouter-browser-storage`, `@context-action/template-react`

### Key Architectural Patterns

**Action Pipeline System**: All user interactions dispatch actions to a central `ActionRegister` which processes handlers by priority. Business logic resides in action handlers, not components.

**Store Integration Pattern**: Action handlers follow a three-step pattern:
1. Read current state from stores using `store.getValue()`
2. Execute business logic using payload and current state
3. Update stores using `store.setValue()` or `store.update()`

**React Integration**: Components use `useActionDispatch()` to dispatch actions and `useStoreValue()` to subscribe to store changes, maintaining clean separation of concerns.

## 🎯 Context-Action Quick Example

Here's a practical example showing the core Context-Action pattern:

```tsx
// 1. Define Actions (Business Logic)
interface UserActions {
  updateProfile: { name: string; email: string };
  logout: void;
}

// 2. Create Action Context (Business Logic Layer)
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// 3. Create Store Context (Data Layer)
const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createStoreContext('UserStores', {
  profile: { name: '', email: '', isLoggedIn: false },
  preferences: { theme: 'light' as const }
});

// 4. Business Logic Component
function UserLogic({ children }) {
  const profileStore = useUserStore('profile');
  
  // Action Handler: Business logic separated from UI
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // Step 1: Read current state
    const currentProfile = profileStore.getValue();
    
    // Step 2: Execute business logic
    const updatedProfile = {
      ...currentProfile,
      name: payload.name,
      email: payload.email,
      isLoggedIn: true
    };
    
    // Step 3: Update store
    profileStore.setValue(updatedProfile);
    
    // Additional business logic (API calls, validation, etc.)
    await saveToAPI(updatedProfile);
  }, [profileStore]));
  
  useUserActionHandler('logout', useCallback(async () => {
    profileStore.setValue({ name: '', email: '', isLoggedIn: false });
    await clearSession();
  }, [profileStore]));
  
  return children;
}

// 5. UI Component (Pure Presentation)
function UserProfile() {
  const dispatch = useUserAction();
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  return (
    <div>
      <h1>User: {profile.name}</h1>
      <p>Email: {profile.email}</p>
      <button onClick={() => dispatch('updateProfile', {
        name: 'John Doe',
        email: 'john@example.com'
      })}>
        Update Profile
      </button>
      <button onClick={() => dispatch('logout')}>
        Logout
      </button>
    </div>
  );
}

// 6. App Structure (Context-Layered Architecture)
function App() {
  return (
    <UserActionProvider>      {/* ViewModel Layer */}
      <UserStoreProvider>     {/* Model Layer */}
        <UserLogic>           {/* Business Logic */}
          <UserProfile />     {/* View Layer */}
        </UserLogic>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

**Key Benefits Shown:**
- **Separation of Concerns**: UI, Business Logic, and Data are completely separate
- **Type Safety**: Full TypeScript support throughout the pipeline
- **Testability**: Business logic in handlers can be tested independently
- **Scalability**: Easy to add new actions and stores without touching UI
- **Clean Architecture**: Clear Context-Layered pattern with distinct responsibilities

## Development Commands

### Root Level Commands
```bash
# Local-First Verification System (Issue #50, #53)
pnpm verify            # Full 17-step repository verification suite
pnpm verify:quick      # Fast smoke verification suite
pnpm verify:receipt    # Cryptographic receipt audit (<0.1s, fail-closed)

# Install dependencies
pnpm install

# Build all library packages (example is built separately)
pnpm build

# Build specific package
pnpm build:core        # @context-action/core
pnpm build:react       # @context-action/react
pnpm build:llms-generator  # @context-action/llms-generator

# Run tests
pnpm test              # All packages
pnpm test:core         # Specific package

# Linting, type checking, boundaries, and surface catalogs
pnpm lint              # Biome linting across workspace
pnpm type-check        # TypeScript compilation check
pnpm convention:check  # Context-Layered boundaries + CA-SURFACE-CATALOG-001 gate
pnpm verify:surface-catalog # Machine-verifiable API / Example / Document catalog check
pnpm package-boundary:check # Cross-package import & export boundary gate
pnpm change:traceability    # PR traceability check (issue # or CA-* ID)

# Clean build artifacts
pnpm clean

# Development server (example app)
pnpm dev               # Runs example application

# Example application builds
pnpm example:build     # Build example with TypeScript strict checking (default)
pnpm example:build:fast # Fast build without TypeScript checking
```

### Workspace Build Order (Important)

The example consumes `@context-action/core` and `@context-action/react` through
their workspace package declarations and `dist` outputs. Always rebuild workspace
dependencies before type-checking or building consumers:

```bash
# Build library packages; Lerna resolves package dependencies
pnpm build
pnpm example:build

# Focused build after core/react source changes
pnpm build:core
pnpm build:react
pnpm --filter example type-check
pnpm --filter example check
pnpm example:build
```

### Package Management (Lerna)
```bash
# Check which packages have changed
pnpm changed

# See diff of changes
pnpm diff

# Complete release preflight
pnpm release:check

# Read-only release inventory
pnpm release:inventory
```

Packages are versioned independently. Lerna `version:*` commands can mutate
manifests, the lockfile, commits, and tags, so use them only inside an approved
release plan. Direct local publishing is disabled; `pnpm release` and
`pnpm release:patch` intentionally fail closed. Follow
[`releases/RELEASE.md`](releases/RELEASE.md) and the protected workflows.

### Documentation
```bash
# Documentation development and verification
pnpm docs:dev          # VitePress dev server
pnpm docs:llms         # Generate docs/{en,ko}/llms/llms-{minimal,500chars,origin}.txt from docs/{en,ko}/**
pnpm docs:management   # Paired docs, issue templates, convention discovery & ADR checks
pnpm llms:check        # Verify docs/{en,ko}/llms/llms-*.txt bundle freshness
pnpm docs:build        # Build VitePress documentation
pnpm docs:check        # Canonical unified gate (docs:management + verify:surface-catalog + llms:check + docs:build)
pnpm verify:doc-snippets # Compile-check <!-- @context-action-compile --> TypeScript snippets (runs after pnpm build)
```

- **Direct LLMS Bundle Pipeline**: `pnpm docs:llms` (`node scripts/sync-llms-bundles.mjs --write`) compiles `docs/{en,ko}/llms/llms-minimal.txt`, `llms-500chars.txt`, and `llms-origin.txt` directly from handwritten `docs/{en,ko}/**` (excluding `docs/{en,ko}/llms/**`), with no `llmsData/` template directory or `.husky/post-commit` hook.
- **Standalone Tooling Packages**: `@context-action/llms-generator` (`packages/llms-generator`) and `@context-action/typedoc-vitepress-sync` (`packages/typedoc-vitepress-sync`) remain independent public workspace tooling packages with their own package tests and standalone CLIs, while repository docs rely directly on VitePress + `sync-llms-bundles.mjs` + `catalog/repository-surface/*.v1.json`.

### Example Application
```bash
# Example app (in example/ directory)
pnpm dev               # Development server for example app
pnpm example:build     # Build with TypeScript strict checking (default)
pnpm example:build:fast # Fast build without TypeScript checking

# Or from example directory:
cd example
pnpm dev           # Vite dev server
pnpm build         # TypeScript strict + production build (default)
pnpm build:fast    # Fast production build without TypeScript checking
pnpm build:strict  # Explicit TypeScript strict + production build
pnpm lint          # Biome linting
pnpm type-check    # TypeScript check
```


## Testing Strategy

- **Local-First Verification**: Centralized single local entrypoints (`pnpm verify`,
  `pnpm verify:quick`, `pnpm verify:receipt`) backed by cryptographic RFC 8785
  local execution receipts (`.verification/local-receipt.json`). See
  [`docs/LOCAL_FIRST_VERIFICATION_POLICY.md`](docs/LOCAL_FIRST_VERIFICATION_POLICY.md).
- **Unit and integration tests**: Jest, Vitest, and Node test suites according to each package contract
- **Type checking**: Strict TypeScript compilation across packages, tests, and example
- **Code quality**: Biome (`pnpm lint` / `example` `check`) plus Context-Layered, surface catalog (`CA-SURFACE-CATALOG-001`), and package-boundary gates
- **Current verification rule**: Do not copy historical test counts into release evidence. Run `pnpm verify`, `pnpm verify:quick`, and `pnpm release:check` against the current immutable commit.

**Scenario Validation:**
- **High-frequency Updates**: Mouse events at 120fps, performance <200ms ✅
- **Memory Management**: 600+ updates without memory leaks ✅  
- **Cross-Strategy Testing**: Mixed shallow/deep/reference store strategies ✅
- **Action Integration**: Dispatch + store updates with efficiency validation ✅
- **Real-world Scenarios**: Complex async operations, multiple stores ✅

### Running Tests
```bash
# Run single test file
pnpm test:core -- --testNamePattern="ActionRegister"

# Watch mode for development
cd packages/core && pnpm test:watch

# Type check specific package
cd packages/react && pnpm type-check
```

## Build System

- **Bundler**: `tsdown` (powered by rolldown) for all packages
- **Output**: Dual ESM/CJS builds with proper TypeScript declarations
- **Bundle Analysis**: Bundle size checking with reports in `reports/bundle-size.json`

### Build Configuration
Each package uses `tsdown.config.ts` for build configuration. The build outputs:
- `dist/index.js` - ESM build
- `dist/index.cjs` - CommonJS build  
- `dist/index.d.ts` - TypeScript declarations

## Important Implementation Details

### Action Handler Registration
Action handlers must be registered before components mount. Use the `useActionHandler` hook pattern:

```tsx
// Correct: Register handlers using useActionHandler hook
function ActionSetup({ children }) {
  const userUpdateHandler = useCallback(async (payload, controller) => {
    // Handler logic here
  }, []);
  
  useActionHandler('updateUser', userUpdateHandler);
  
  return children;
}
```

### Store Subscription Pattern
Always use `useStoreValue()` for reactive subscriptions, not direct store access:

```typescript
// Correct: Reactive subscription
const userValue = useStoreValue(userStore);

// Incorrect: Direct access (not reactive)
const userValue = userStore.getValue();
```

### Type Safety Requirements
All action payload maps must extend `ActionPayloadMap`:

```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
  resetUser: void; // For actions without payload
}
```

### Error Handling
Action handlers should use the pipeline controller for error handling:

```typescript
useActionHandler('riskyAction', async (payload, controller) => {
  try {
    // Business logic
  } catch (error) {
    controller.abort('Action failed', error);
  }
});
```

## Development Workflow

1. **Setup**: `pnpm install` from root
2. **Development**: Use `pnpm dev` for live example app
3. **Changes**: Make changes in respective `packages/*/src/` directories  
4. **Testing**: Run `pnpm test` and `pnpm type-check`
5. **Building**: Run `pnpm build` before committing
6. **Documentation**: Update docs if changing public APIs

### Recommended Development Patterns

#### For Store-Only Components (Declarative Store Pattern)
```tsx
// For pure state management without actions using renaming convention
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createStoreContext('App', {
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

#### For Action-Only Components (Action Context)
```tsx
// For pure action dispatching without state using renaming convention
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

### Monorepo Dependencies
- Workspace packages use `workspace:*` for internal dependencies
- External dependencies are managed at package level
- Lerna handles inter-package dependency resolution

## Key Files and Directories

- `packages/core/src/ActionRegister.ts` - Core action pipeline implementation
- `packages/react/src/stores/` - Store system implementation
- `packages/react/src/actions/ActionContext.tsx` - React action context integration
- `packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx` - Declarative Store Pattern implementation
- `catalog/repository-surface/*.v1.json` - Machine-verifiable API, Example, and Document surface catalogs (`CA-SURFACE-CATALOG-001`)
- `docs/en/context-layered/convention-index.md` - Central convention entry index
- `docs/en/context-layered/repository-surface-catalog.md` - Complete 20-package, 72-route, and document inventory
- `docs/en/context-layered/store-selection-and-usage-guide.md` - Package-wide Store selection matrix & usage patterns
- `docs/en/context-layered/change-management-convention.md` - Spec, issue, ADR, and review traceability rules
- `docs/en/concept/documentation-development-conventions.md` - Authoritative doc production and verification rules
- `docs/en/concept/pattern-guide.md` - Complete pattern guide with two main approaches
- `docs/en/concept/architecture-guide.md` - Complete architecture guide with Context Store Pattern
- `docs/en/context-layered/context-layered-guide.md` - Context-Layered Architecture guide with 6-layer structure
- `docs/en/concept/conventions.md` - Comprehensive coding conventions and best practices
- `docs/en/concept/hooks-reference.md` - Complete hooks reference documentation
- `example/src/` - Comprehensive example application
- `docs/` - VitePress documentation source
- `scripts/` - Build and verification scripts

## Framework Architecture Patterns

### Two Main Patterns (Current Implementation)

#### 🎯 Action Only Pattern
**Import**: `createActionContext` from `@context-action/react`
- **Use Case**: Pure action dispatching without state management (event systems, command patterns)
- **Features**: Type-safe action dispatching, action handler registration, abort support, result handling, lightweight (no store overhead)

#### 🏪 Store Only Pattern (Recommended)
**Import**: `createStoreContext` from `@context-action/react`
- **Use Case**: Pure state management without action dispatching (data layers, simple state)
- **Features**: Excellent type inference without manual type annotations, simplified API focused on store management, direct value or configuration object support

### Context-Layered Architecture Integration

#### Context-Layered 6-Layer Structure
**Systematic layer separation** with clear responsibilities (see [Folder Structure Guide](docs/en/context-layered/architecture/folder-structure.md)):

```
├── contexts/     # 🗄️ Context Definitions (Type definitions & context creation)
├── business/     # 🏢 Pure Business Logic (Side-effect-free functions)
├── handlers/     # ⚙️ Handler Logic (Orchestration with props-based DI)
├── actions/      # 🚀 Dispatch + Callbacks (Action dispatching & callbacks)
├── hooks/        # 🔗 Store Subscriptions (Store value subscriptions)
├── views/        # 🖼️ Pure UI Components (Event handling & rendering)
└── MainPage.tsx  # 🎯 Integration Point (Handler registration & composition)
```

**Layer Integration Benefits:**
- **Business Logic** isolated in pure functions for maximum testability
- **Handlers** orchestrate business logic via [Handler Registry dependency injection](docs/en/context-layered/architecture/handler-registry.md)
- **Declarative Store Pattern** manages state with type safety
- **Components** render UI with clear data flow
- **Pattern Composition** allows flexible architecture
- **Type-Safe Integration** through pattern-specific hooks

**Key Resources:**
- [Context-Layered Architecture Guide](docs/en/context-layered/context-layered-guide.md) - Complete architectural overview
- [Handler Registry Management](docs/en/context-layered/architecture/handler-registry.md) - ID, priority, and dependency management
- [Migration Guide](docs/en/context-layered/migration-guide.md) - Migrate from traditional patterns

#### Store Integration 3-Step Process
1. **Read current state** from stores using `store.getValue()`
2. **Execute business logic** using payload and current state  
3. **Update stores** using `store.setValue()` or `store.update()`

#### Handler Registration Best Practice
Use `useActionHandler` + `useEffect` pattern for optimal performance and proper cleanup:
- Wrap handler with `useCallback` to prevent re-registration
- Use lazy evaluation with `stores.getStore()` for current state
- Register handlers with cleanup using unregister function

### Architecture Patterns

- **Action Only Pattern**: `createActionContext()` for pure action dispatching
- **Declarative Store Pattern**: `createStoreContext()` for type-safe state management
- **Store Integration Pattern**: 3-step process for handler implementation
- **HOC Pattern**: `withProvider()` for automatic component wrapping (Store Pattern)
- **Pattern Composition**: Combine Action Only + Store Only patterns for complex applications
- **Provider Isolation**: Independent context management per pattern