# Naming Conventions

Coding standards and naming rules for consistent terminology throughout the Context-Action framework.

## Overview

These conventions ensure consistency across all framework components, making code more readable, maintainable, and professional. All naming should follow these patterns to maintain alignment between code implementations and documentation.

## General Principles

1. **Descriptive Names**: Names should clearly indicate purpose and functionality
2. **Consistency**: Use the same naming pattern for similar concepts
3. **No Abbreviations**: Avoid abbreviations unless they are widely understood
4. **Contextual Clarity**: Names should be unambiguous within their scope
5. **Framework Alignment**: Follow established patterns from the codebase

---

## Class Naming

**Convention**: PascalCase with descriptive nouns

**Pattern**: `[Descriptor][Core]Class`

**Examples**:
```typescript
// ✅ Correct - Clear, descriptive, follows pattern
class ActionRegister<T extends ActionPayloadMap> { }
class StoreRegistry { }
class PipelineController<T> { }
class EventEmitter<T> { }

// ✅ Correct - Component classes
class StoreProvider extends React.Component { }
class ActionProvider extends React.Component { }

// ❌ Incorrect - Abbreviations, unclear purpose
class ActReg { }
class StoreReg { }
class PC { }
class EE { }
```

**Framework-Specific Patterns**:
- **Core Classes**: `ActionRegister`, `StoreRegistry`, `PipelineController`
- **React Components**: `StoreProvider`, `ActionProvider` 
- **Utility Classes**: `EventEmitter`, `SimpleEventEmitter`
- **Error Classes**: `ActionError`, `PipelineError`, `StoreError`

**Related Terms**: [ActionRegister](./api-terms.md#actionregister), [StoreProvider](./api-terms.md#storeprovider)

---

## Interface Naming

**Convention**: PascalCase with descriptive suffixes

**Common Suffixes**:
- `Map`: Type mappings (e.g., `ActionPayloadMap`)
- `Config`: Configuration objects (e.g., `ActionRegisterConfig`, `HandlerConfig`)
- `Context`: Execution contexts (e.g., `PipelineContext`)
- `Events`: Event type definitions (e.g., `ActionRegisterEvents`)
- `Handler`: Function type definitions (e.g., `ActionHandler`, `EventHandler`)

**Examples**:
```typescript
// ✅ Correct - Clear purpose with appropriate suffix
interface ActionPayloadMap {
  [actionName: string]: any;
}

interface HandlerConfig {
  priority?: number;
  blocking?: boolean;
}

interface PipelineController<T> {
  next(): void;
  abort(reason?: string): void;
}

interface ActionRegisterEvents<T> {
  'action:start': { action: keyof T; payload: any };
  'action:complete': { action: keyof T; metrics: ActionMetrics };
}

// ❌ Incorrect - Unclear purpose, inconsistent naming
interface ActionMap { }  // Should be ActionPayloadMap
interface Config { }     // Should be HandlerConfig or ActionRegisterConfig
interface Controller { } // Should be PipelineController
```

**Framework-Specific Patterns**:
- **Type Maps**: `ActionPayloadMap`, `StoreValueMap`
- **Configuration**: `ActionRegisterConfig`, `HandlerConfig`, `StoreConfig`
- **Function Types**: `ActionHandler`, `EventHandler`, `UnregisterFunction`
- **Data Structures**: `HandlerRegistration`, `ActionMetrics`, `PipelineContext`

**Related Terms**: [Action Payload Map](./core-concepts.md#action-payload-map), [Handler Configuration](./core-concepts.md#handler-configuration)

---

## Function Naming

**Convention**: camelCase with verb-based names for actions, noun-based for getters

**Patterns**:
- **Actions**: `verb` + `Object` (e.g., `updateUser`, `fetchData`)
- **Getters**: `get` + `Object` (e.g., `getValue`, `getConfig`)
- **Setters**: `set` + `Object` (e.g., `setValue`, `setConfig`)
- **Checkers**: `is` + `State` or `has` + `Object` (e.g., `isValid`, `hasHandlers`)
- **Creators**: `create` + `Object` (e.g., `createStore`, `createLogger`)

**Examples**:
```typescript
// ✅ Correct - Clear action-based naming
function register<K extends keyof T>(action: K, handler: ActionHandler<T[K]>) { }
function dispatch<K extends keyof T>(action: K, payload?: T[K]) { }
function unregister(handlerId: string) { }

// ✅ Correct - Clear getter/setter naming
function getValue(): T { }
function setValue(value: T): void { }
function getConfig(): ActionRegisterConfig { }
function getHandlerCount(action: string): number { }

// ✅ Correct - Clear checker naming
function hasHandlers(action: string): boolean { }
function isValid(payload: unknown): boolean { }
function canExecute(): boolean { }

// ✅ Correct - Clear creator naming
function createStore<T>(initialValue: T): Store<T> { }
function createLogger(level: LogLevel): Logger { }
function createComputedStore<T>(dependencies: Store[], compute: ComputeFunction<T>): ComputedStore<T> { }

// ❌ Incorrect - Unclear purpose, inconsistent patterns
function reg() { }         // Should be register()
function exec() { }        // Should be execute() or dispatch()
function check() { }       // Should be hasHandlers() or isValid()
function make() { }        // Should be create() + specific object
```

**Hook Naming** (React-specific):
```typescript
// ✅ Correct - Follows React hook conventions
function useStoreValue<T>(store: Store<T>): T { }
function useActionDispatch<T>(): ActionDispatcher<T> { }
function useStoreRegistry(): StoreRegistry { }
function useComputedStore<T>(dependencies: Store[], compute: ComputeFunction<T>): T { }

// ❌ Incorrect - Doesn't follow hook conventions
function getStoreValue() { }  // Should be useStoreValue()
function storeValue() { }     // Should be useStoreValue()
function actionDispatch() { } // Should be useActionDispatch()
```

**Related Terms**: [Store Hooks](./api-terms.md#store-hooks), [Action Handler](./core-concepts.md#action-handler)

---

## Constant Naming

**Convention**: UPPER_SNAKE_CASE for constants, SCREAMING_SNAKE_CASE for enums

**Examples**:
```typescript
// ✅ Correct - Configuration constants
const DEFAULT_PRIORITY = 0;
const MAX_HANDLERS_PER_ACTION = 100;
const DEFAULT_LOG_LEVEL = LogLevel.ERROR;
const ACTION_TIMEOUT_MS = 5000;

// ✅ Correct - Enum values
enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 5
}

enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABORTED = 'aborted'
}

// ✅ Correct - String constants for action names
const USER_ACTIONS = {
  UPDATE_USER: 'updateUser',
  DELETE_USER: 'deleteUser',
  FETCH_USER: 'fetchUser'
} as const;

// ❌ Incorrect - Inconsistent casing
const defaultPriority = 0;           // Should be DEFAULT_PRIORITY
const MaxHandlers = 100;             // Should be MAX_HANDLERS_PER_ACTION
const actionTimeout = 5000;          // Should be ACTION_TIMEOUT_MS
```

**Framework-Specific Constants**:
```typescript
// Core framework constants
const DEFAULT_ACTION_REGISTER_NAME = 'ActionRegister';
const DEFAULT_HANDLER_PRIORITY = 0;
const MAX_PIPELINE_DEPTH = 1000;
const HANDLER_EXECUTION_TIMEOUT_MS = 30000;

// Event name constants
const ACTION_EVENTS = {
  START: 'action:start',
  COMPLETE: 'action:complete',
  ABORT: 'action:abort',
  ERROR: 'action:error'
} as const;

const HANDLER_EVENTS = {
  REGISTER: 'handler:register',
  UNREGISTER: 'handler:unregister'
} as const;
```

**Related Terms**: [ActionRegister](./api-terms.md#actionregister), [Handler Configuration](./core-concepts.md#handler-configuration)

---

## File Naming

**Convention**: kebab-case for files, PascalCase for main export files

**Patterns**:
- **Main Classes**: `ClassName.ts` (e.g., `ActionRegister.ts`, `StoreRegistry.ts`)
- **Utility Files**: `descriptive-name.ts` (e.g., `store-sync.ts`, `event-emitter.ts`)
- **Type Definitions**: `types.ts`, `interfaces.ts`
- **Hook Files**: `use-hook-name.ts` (e.g., `use-store-value.ts`, `use-action-dispatch.ts`)
- **Test Files**: `ClassName.test.ts` or `utility-name.test.ts`

**Examples**:
```
✅ Correct file structure:
packages/core/src/
├── ActionRegister.ts          # Main class file
├── types.ts                   # Type definitions
├── logger.ts                  # Utility functions
├── index.ts                   # Package exports

packages/react/src/store/
├── StoreRegistry.ts           # Main class file
├── store-sync.ts              # Utility functions
├── registry-sync.ts           # Utility functions
├── types.ts                   # Type definitions
├── hooks/
│   ├── use-store-value.ts     # Hook implementation
│   ├── use-action-dispatch.ts # Hook implementation
│   └── index.ts               # Hook exports

❌ Incorrect file naming:
├── actionRegister.ts          # Should be ActionRegister.ts
├── store_sync.ts              # Should be store-sync.ts
├── useStoreValue.ts           # Should be use-store-value.ts
├── Types.ts                   # Should be types.ts
```

**Directory Structure Conventions**:
```
packages/
├── core/                      # Core framework logic
│   ├── src/
│   │   ├── ActionRegister.ts  # Main action system
│   │   ├── types.ts           # Core type definitions
│   │   ├── logger.ts          # Logging utilities
│   │   └── index.ts           # Package exports
│   └── dist/                  # Compiled output
├── react/                     # React integration
│   ├── src/
│   │   ├── ActionProvider.tsx # React provider component
│   │   ├── StoreProvider.tsx  # React provider component
│   │   ├── store/             # Store-related utilities
│   │   │   ├── hooks/         # React hooks
│   │   │   ├── types.ts       # Store type definitions
│   │   │   └── index.ts       # Store exports
│   │   └── index.ts           # Package exports
└── jotai/                     # Jotai integration
    ├── src/
    └── dist/
```

**Related Terms**: [Project Structure](#project-structure), [Module Organization](#module-organization)

---

## Variable Naming

**Convention**: camelCase with descriptive names

**Patterns**:
- **Local Variables**: `descriptiveName` (e.g., `currentUser`, `actionResult`)
- **Function Parameters**: `parameterName` (e.g., `payload`, `controller`, `action`)
- **Component Props**: `propName` (e.g., `userId`, `onSubmit`, `isLoading`)
- **State Variables**: `stateName` (e.g., `isVisible`, `currentStep`, `userPreferences`)

**Examples**:
```typescript
// ✅ Correct - Clear, descriptive variable names
function processUserAction(payload: UserActionPayload, controller: PipelineController) {
  const currentUser = userStore.getValue();
  const userPreferences = preferencesStore.getValue();
  const validationResult = validateUserAction(payload, currentUser);
  
  if (!validationResult.isValid) {
    controller.abort(validationResult.errorMessage);
    return;
  }
  
  const updatedUser = {
    ...currentUser,
    ...payload,
    lastModified: Date.now()
  };
  
  userStore.setValue(updatedUser);
}

// ✅ Correct - React component with clear prop names
interface UserProfileProps {
  userId: string;
  isEditable: boolean;
  onUserUpdate: (user: User) => void;
  showAvatar: boolean;
}

function UserProfile({ userId, isEditable, onUserUpdate, showAvatar }: UserProfileProps) {
  const currentUser = useStoreValue(userStore);
  const isLoading = useStoreValue(uiStore, ui => ui.loading);
  
  return <div>{/* Component implementation */}</div>;
}

// ❌ Incorrect - Unclear, abbreviated, or misleading names
function processUserAction(p: UserActionPayload, c: PipelineController) {
  const u = userStore.getValue();           // Should be currentUser
  const prefs = preferencesStore.getValue(); // Should be userPreferences
  const result = validateUserAction(p, u);   // Should be validationResult
  
  if (!result.ok) {                         // Should be validationResult.isValid
    c.abort(result.msg);                    // Should be validationResult.errorMessage
    return;
  }
}
```

**Boolean Variables**:
```typescript
// ✅ Correct - Clear boolean naming with is/has/can/should prefixes
const isLoading = true;
const isValid = validateInput(input);
const hasPermission = checkUserPermission(user);
const canExecute = hasPermission && isValid;
const shouldRetry = attemptCount < MAX_ATTEMPTS;

// ❌ Incorrect - Unclear boolean purpose
const loading = true;        // Should be isLoading
const valid = true;          // Should be isValid
const permission = true;     // Should be hasPermission
const execute = true;        // Should be canExecute
```

**Related Terms**: [Type Safety](./architecture-terms.md#type-safety), [Code Clarity](#code-clarity)

---

## Generic Type Parameters

**Convention**: Single uppercase letters with descriptive meaning

**Common Patterns**:
- `T`: Generic type parameter
- `K`: Key type (often `keyof T`)
- `V`: Value type
- `P`: Payload type
- `R`: Return type
- `E`: Event type
- `S`: State type

**Examples**:
```typescript
// ✅ Correct - Clear generic type usage
class ActionRegister<T extends ActionPayloadMap> { }
interface ActionHandler<P> {
  (payload: P, controller: PipelineController<P>): void | Promise<void>;
}
interface Store<V> {
  getValue(): V;
  setValue(value: V): void;
}
interface ComputedStore<T, D extends readonly Store<any>[]> {
  getValue(): T;
  subscribe(listener: (value: T) => void): UnregisterFunction;
}

// ✅ Correct - Multiple type parameters with clear purpose
function createComputedStore<
  T,                                    // Result type
  D extends readonly Store<any>[]       // Dependencies array type
>(
  dependencies: D,
  compute: (...values: StoreValues<D>) => T
): ComputedStore<T, D> { }

// ❌ Incorrect - Unclear generic naming
class ActionRegister<ActionMap> { }     // Should be T extends ActionPayloadMap
interface Handler<Data> { }            // Should be ActionHandler<P>
function create<A, B, C>() { }         // Should use descriptive names
```

**Framework-Specific Generic Patterns**:
```typescript
// Action-related generics
interface ActionPayloadMap {
  [K: string]: any;
}
type ActionDispatcher<T extends ActionPayloadMap> = {
  <K extends keyof T>(action: K, payload: T[K] extends void ? never : T[K]): Promise<void>;
  <K extends keyof T>(action: T[K] extends void ? K : never): Promise<void>;
};

// Store-related generics
interface Store<V> {
  getValue(): V;
  setValue(value: V): void;
  update(updater: (current: V) => V): void;
}

// Event-related generics
interface EventEmitter<E extends Record<string, any>> {
  on<K extends keyof E>(event: K, handler: (data: E[K]) => void): UnregisterFunction;
  emit<K extends keyof E>(event: K, data: E[K]): void;
}
```

**Related Terms**: [Type Safety](./architecture-terms.md#type-safety), [Generic Programming](#generic-programming)

---

## Documentation Naming

**Convention**: kebab-case for file names, Title Case for headings

**File Naming Patterns**:
- **Guides**: `topic-name.md` (e.g., `getting-started.md`, `mvvm-architecture.md`)
- **API References**: `component-name.md` (e.g., `action-register.md`, `store-hooks.md`)
- **Examples**: `example-type.md` (e.g., `basic-setup.md`, `advanced-patterns.md`)

**Heading Conventions**:
```markdown
# Main Document Title (H1 - Document title)
## Major Section (H2 - Main sections)
### Subsection (H3 - Detailed topics)
#### Implementation Detail (H4 - Specific details)

✅ Correct heading structure:
# Context-Action Framework Glossary
## Core Concepts
### Action Pipeline System
#### Pipeline Execution Flow

❌ Incorrect heading structure:
# context-action framework glossary    # Should be Title Case
## core concepts                       # Should be Title Case
### action pipeline system             # Should be Title Case
```

**Link Reference Naming**:
```markdown
# ✅ Correct - Descriptive link references
[Action Pipeline System][action-pipeline-system]
[Store Integration Pattern][store-integration-pattern]
[Pipeline Controller][pipeline-controller]

[action-pipeline-system]: ./core-concepts.md#action-pipeline-system
[store-integration-pattern]: ./core-concepts.md#store-integration-pattern
[pipeline-controller]: ./core-concepts.md#pipeline-controller

# ❌ Incorrect - Unclear references
[Action Pipeline System][aps]
[Store Integration Pattern][sip]
[Pipeline Controller][pc]
```

**Related Terms**: [Documentation Structure](#documentation-structure), [Link Management](#link-management)

---

## Validation Rules

### Automated Checks

1. **Naming Consistency**: Verify code follows established patterns
2. **Link Validation**: Ensure all glossary links are valid
3. **Type Alignment**: Check TypeScript types match documentation
4. **Cross-Reference Integrity**: Validate related term links

### Manual Review Checklist

- [ ] All new classes follow PascalCase convention
- [ ] All new interfaces have appropriate suffixes
- [ ] All new functions use descriptive verb-noun patterns
- [ ] All new constants use UPPER_SNAKE_CASE
- [ ] All new files follow kebab-case convention
- [ ] All new variables use descriptive camelCase
- [ ] All new generics use clear single-letter naming
- [ ] All new documentation follows established patterns

### Quality Standards

1. **Clarity**: Names should be immediately understandable
2. **Consistency**: Similar concepts should use similar naming patterns
3. **Conciseness**: Names should be as short as possible while remaining clear
4. **Searchability**: Names should be easy to find and grep for
5. **Future-Proofing**: Names should accommodate framework evolution

**Related Terms**: [Code Quality](#code-quality), [Framework Consistency](#framework-consistency)