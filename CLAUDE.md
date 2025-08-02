# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript monorepo for the **Context-Action framework** - a type-safe action pipeline management system with React integration and enhanced state management. The framework implements an MVVM-inspired architecture with clear separation between View (React components), ViewModel (Action pipeline), and Model (Store system) layers.

## Architecture

### Core Philosophy
The Context-Action framework follows these principles:
- **Type Safety**: Full TypeScript support with strict type checking throughout
- **Action Pipeline**: Centralized action processing with priority-based handler execution
- **Store Integration**: Decoupled state management with reactive store subscriptions
- **MVVM Pattern**: Clear separation of concerns with business logic in action handlers

### Package Structure
- `@context-action/core` - Core action pipeline management (no React dependency)
- `@context-action/react` - React integration with Context API and hooks
- `@context-action/logger` - Lightweight logging utilities with trace capabilities
- `@context-action/jotai` - Jotai integration for atom-based state management
- `@context-action/glossary` - Documentation tools for TypeScript glossary management

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
pnpm build:jotai       # @context-action/jotai
pnpm build:logger      # @context-action/logger

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
pnpm docs:sync         # Sync API docs to documentation
pnpm docs:full         # Full documentation build pipeline
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

### Glossary System
```bash
# Glossary management tools
pnpm glossary:scan          # Scan codebase for terms
pnpm glossary:validate      # Validate glossary definitions
pnpm glossary:missing       # Analyze missing terms
pnpm glossary:dashboard     # Generate implementation dashboard
pnpm glossary:update        # Full glossary update pipeline
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
Action handlers must be registered before components mount. Use the provider pattern:

```typescript
// Correct: Register handlers in provider setup
function ActionSetup({ children }) {
  const register = useActionRegister();
  
  useEffect(() => {
    register('updateUser', userUpdateHandler);
  }, []);
  
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
register('riskyAction', async (payload, controller) => {
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

### Monorepo Dependencies
- Workspace packages use `workspace:*` for internal dependencies
- External dependencies are managed at package level
- Lerna handles inter-package dependency resolution

## Key Files and Directories

- `packages/core/src/ActionRegister.ts` - Core action pipeline implementation
- `packages/react/src/store/` - Store system implementation
- `packages/react/src/ActionProvider.tsx` - React context integration
- `example/src/` - Comprehensive example application
- `docs/` - VitePress documentation source
- `glossary/` - Term management and documentation tools
- `scripts/` - Build and utility scripts