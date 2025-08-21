# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript monorepo for the **Context-Action framework** - a revolutionary state management system designed to overcome the fundamental limitations of existing libraries through document-centric context separation and effective artifact management.

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

The framework implements an MVVM-inspired architecture with clear separation between View (React components), ViewModel (Action pipeline), and Model (Store system) layers, all organized around **context-driven domain isolation**.

## Architecture

### Core Philosophy
The Context-Action framework follows these principles:
- **Document-Centric Context Separation**: Each context represents a specific document domain (design, architecture, business, validation)
- **Type Safety**: Full TypeScript support with strict type checking throughout
- **Action Pipeline**: Centralized action processing with priority-based handler execution
- **Store Integration**: Decoupled state management with reactive store subscriptions
- **MVVM Pattern**: Clear separation of concerns with business logic in action handlers

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

### Package Structure
- `@context-action/core` - Core action pipeline management (no React dependency)
- `@context-action/react` - React integration with Context API and hooks

### Key Architectural Patterns

**Action Pipeline System**: All user interactions dispatch actions to a central `ActionRegister` which processes handlers by priority. Business logic resides in action handlers, not components.

**Store Integration Pattern**: Action handlers follow a three-step pattern:
1. Read current state from stores using `store.getValue()`
2. Execute business logic using payload and current state
3. Update stores using `store.setValue()` or `store.update()`

**React Integration**: Components use `useActionDispatch()` to dispatch actions and `useStoreValue()` to subscribe to store changes, maintaining clean separation of concerns.

## Development Commands

### Root Level Commands
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm build:core        # @context-action/core
pnpm build:react       # @context-action/react
pnpm build:llms-generator  # @context-action/llms-generator

# Run tests
pnpm test              # All packages
pnpm test:core         # Specific package

# Linting and type checking
pnpm lint              # ESLint for all packages
pnpm type-check        # TypeScript compilation check

# Clean build artifacts
pnpm clean

# Development server (example app)
pnpm dev               # Runs example application
```

### Package Management (Lerna)
```bash
# Check which packages have changed
pnpm changed

# See diff of changes
pnpm diff

# Version management
pnpm version           # Interactive version bump
pnpm version:patch     # Patch version bump
pnpm version:minor     # Minor version bump
pnpm version:major     # Major version bump

# Publishing
pnpm release           # Publish changed packages
pnpm release:patch     # Version patch + publish
```

### Documentation
```bash
# Documentation development
pnpm docs:dev          # VitePress dev server
pnpm docs:build        # Build documentation
pnpm docs:api          # Generate API docs with TypeDoc
pnpm docs:sync         # Sync API docs to documentation (with smart caching)
pnpm docs:full         # Full documentation build pipeline
```

### LLMS Generator Commands

The project includes a sophisticated **LLMS Generator** system for advanced documentation management and priority-driven development workflows:

```bash
# Priority Management System
pnpm llms:priority-stats    # Statistical analysis of documentation priorities
pnpm llms:priority-health   # Health check with consistency validation (0-100 score)
pnpm llms:priority-suggest  # Actionable recommendations for improvement
pnpm llms:priority-auto     # Auto-recalculate priorities based on configurable criteria

# Multilingual Document Processing
pnpm llms:sync-docs         # Process all changed documentation with language detection
pnpm llms:sync-docs:ko      # Korean documents only 🇰🇷
pnpm llms:sync-docs:en      # English documents only 🇺🇸
pnpm llms:sync-docs:dry     # Preview mode without making changes

# Template Generation & Management
pnpm llms:generate-templates  # Generate character-limited templates (100-5000 chars)
pnpm llms:init              # Initialize LLMS system in new projects

# Work Management
pnpm llms:work-next         # Find next documentation work based on priorities
```

#### LLMS Advanced Usage

```bash
# Advanced language filtering
node packages/llms-generator/dist/cli/index.js sync-docs --languages ko,en --changed-files files...
node packages/llms-generator/dist/cli/index.js sync-docs --only-korean --changed-files files...
node packages/llms-generator/dist/cli/index.js sync-docs --no-korean --changed-files files...

# Custom priority criteria
node packages/llms-generator/dist/cli/index.js priority-auto --criteria ./custom-criteria.json --force

# Language-specific work management
node packages/llms-generator/dist/cli/index.js work-next --language ko --verbose
node packages/llms-generator/dist/cli/index.js work-next --language en --verbose

# Dry run and testing
node packages/llms-generator/dist/cli/index.js sync-docs --dry-run --changed-files files...
```

#### Automated Workflow (Post-commit Hook)

The LLMS Generator system automatically processes documentation changes via a post-commit hook:

1. **Detection**: Automatically detects changes in `docs/(en|ko)/**/*.md` files
2. **Processing**: Generates 7 character-limited templates (100, 200, 300, 500, 1000, 2000, 5000 chars)
3. **Metadata**: Creates `priority.json` with title extraction, language detection, and tag generation
4. **Commit**: Creates separate commits for LLMS files to maintain clean history
5. **Language Support**: Full English and Korean processing with intelligent language detection

**Generated Structure:**
```
llmsData/
├── en/guide/
│   ├── example-100.md          # 100 character summary
│   ├── example-500.md          # 500 character summary
│   ├── example-5000.md         # 5000 character summary
│   └── example-priority.json   # Priority metadata
└── ko/guide/
    ├── example-100.md          # 100자 요약
    ├── example-500.md          # 500자 요약
    ├── example-5000.md         # 5000자 요약
    └── example-priority.json   # 우선순위 메타데이터
```

### Example Application
```bash
# Example app (in example/ directory)
pnpm example:dev       # Development server
pnpm example:build     # Build example app

# Or from example directory:
cd example
pnpm dev           # Vite dev server
pnpm build         # Production build
pnpm lint          # Biome linting
pnpm type-check    # TypeScript check
```


## Testing Strategy

- **Unit Tests**: Jest with TypeScript support (`ts-jest`)
- **Type Checking**: TypeScript strict mode enabled
- **Code Quality**: ESLint with TypeScript rules
- **Example App**: Biome for linting and formatting

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
- `packages/react/src/store/` - Store system implementation
- `packages/react/src/actions/ActionContext.tsx` - React action context integration
- `packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx` - Declarative Store Pattern implementation
- `docs/en/concept/pattern-guide.md` - Complete pattern guide with two main approaches
- `docs/en/concept/architecture-guide.md` - Complete MVVM architecture guide with Context Store Pattern
- `docs/en/concept/conventions.md` - Comprehensive coding conventions and best practices
- `docs/en/concept/hooks-reference.md` - Complete hooks reference documentation
- `example/src/` - Comprehensive example application
- `docs/` - VitePress documentation source
- `scripts/` - Build and utility scripts

## Framework Architecture Patterns

### Two Main Patterns (Current Implementation)

#### 🎯 Action Only Pattern
**Import**: `createActionContext` from `@context-action/react`
- **Use Case**: Pure action dispatching without state management (event systems, command patterns)
- **Features**: Type-safe action dispatching, action handler registration, abort support, result handling, lightweight (no store overhead)

#### 🏪 Store Only Pattern (Recommended)
**Import**: `createDeclarativeStorePattern` from `@context-action/react`
- **Use Case**: Pure state management without action dispatching (data layers, simple state)
- **Features**: Excellent type inference without manual type annotations, simplified API focused on store management, direct value or configuration object support

### MVVM Architecture Integration

#### Declarative Store Pattern (Primary)
**Type-safe state management** with domain isolation:
- **Actions** handle business logic (ViewModel layer) via `createActionContext`
- **Declarative Store Pattern** manages state with type safety (Model layer)
- **Components** render UI (View layer)
- **Pattern Composition** allows flexible architecture
- **Type-Safe Integration** through pattern-specific hooks

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
- **Declarative Store Pattern**: `createDeclarativeStorePattern()` for type-safe state management
- **Store Integration Pattern**: 3-step process for handler implementation
- **HOC Pattern**: `withProvider()` for automatic component wrapping (Store Pattern)
- **Pattern Composition**: Combine Action Only + Store Only patterns for complex applications
- **Provider Isolation**: Independent context management per pattern