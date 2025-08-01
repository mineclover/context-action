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



**Related Terms**: [Store Hooks](./api-terms.md#store-hooks), [Action Handler](./core-concepts.md#action-handler)

---

## Constant Naming

**Convention**: UPPER_SNAKE_CASE for constants, SCREAMING_SNAKE_CASE for enums



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



**Related Terms**: [Project Structure](#project-structure), [Module Organization](#module-organization)

---

## Variable Naming

**Convention**: camelCase with descriptive names

**Patterns**:
- **Local Variables**: `descriptiveName` (e.g., `currentUser`, `actionResult`)
- **Function Parameters**: `parameterName` (e.g., `payload`, `controller`, `action`)
- **Component Props**: `propName` (e.g., `userId`, `onSubmit`, `isLoading`)
- **State Variables**: `stateName` (e.g., `isVisible`, `currentStep`, `userPreferences`)



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



**Related Terms**: [Type Safety](./architecture-terms.md#type-safety), [Generic Programming](#generic-programming)

---

## Documentation Naming

**Convention**: kebab-case for file names, Title Case for headings

**File Naming Patterns**:
- **Guides**: `topic-name.md` (e.g., `getting-started.md`, `mvvm-architecture.md`)
- **API References**: `component-name.md` (e.g., `action-register.md`, `store-hooks.md`)
- **Examples**: `example-type.md` (e.g., `basic-setup.md`, `advanced-patterns.md`)



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

---

## Logger System Naming

**Convention**: 로깅 시스템을 위한 일관된 명명 규칙

**Class Patterns**:
- **Logger Implementations**: `ConsoleLogger`, `NoopLogger`, `FileLogger`
- **Logger Factory**: `createLogger(level?: LogLevel)`
- **Environment Functions**: `getLogLevelFromEnv()`, `getDebugFromEnv()`, `getLoggerNameFromEnv()`

**Log Level Naming**:
- **Enum**: `LogLevel.TRACE`, `LogLevel.DEBUG`, `LogLevel.INFO`, `LogLevel.WARN`, `LogLevel.ERROR`, `LogLevel.NONE`
- **Environment Variables**: `CONTEXT_ACTION_LOG_LEVEL`, `CONTEXT_ACTION_DEBUG`, `CONTEXT_ACTION_TRACE`

**Related Terms**: [Logger Interface](./core-concepts.md#logger-interface), [Environment Configuration](#environment-configuration)

---

## Store System Naming

**Convention**: Store와 상태 관리를 위한 명명 규칙

**Store Class Patterns**:
- **Base Store**: `Store<T>`, `ManagedStore<T>`
- **Store Registry**: `StoreRegistry`, `RegistryUtils`
- **Store Factory**: `createStore()`, `createManagedStore()`, `createBasicStore()`

**Hook Naming Patterns**:
- **Value Access**: `useStoreValue()`, `useStoreValues()`
- **Store Access**: `useStore()`, `useLocalStore()`, `useRegistryStore()`
- **Specialized**: `usePersistedStore()`, `useComputedStore()`, `useDynamicStore()`

**Interface Naming**:
- **Core Interfaces**: `IStore<T>`, `IStoreRegistry`, `Snapshot<T>`
- **Configuration**: `StoreConfig`, `DynamicStoreOptions`, `StoreSyncConfig`
- **Type Definitions**: `Listener`, `Unsubscribe`, `Subscribe`

**Related Terms**: [Store Integration Pattern](./architecture-terms.md#store-integration-pattern), [Store Hooks](./api-terms.md#store-hooks)

---

## React Integration Naming

**Convention**: React 통합을 위한 컴포넌트 및 Hook 명명

**Provider Patterns**:
- **Context Providers**: `ActionProvider`, `StoreProvider`
- **HOC Functions**: `withActionProvider()`, `withStoreProvider()`, `withStoreAndActionProvider()`
- **Typed Creators**: `createTypedActionProvider()`, `createTypedStoreProvider()`

**Hook Patterns**:
- **Action Hooks**: `useActionDispatch()`, `useActionRegister()`
- **Store Hooks**: `useStoreValue()`, `useStoreActions()`, `useRegistry()`
- **Context Hooks**: `useActionContext()`, `useStoreContext()`

**Context Type Naming**:
- **Action Context**: `ActionContextType`, `ActionProviderProps`
- **Store Context**: `StoreContextType`, `StoreProviderProps`
- **Return Types**: `ActionContextReturn`, `StoreContextReturn`

**Related Terms**: [ActionProvider](./api-terms.md#actionprovider), [StoreProvider](./api-terms.md#storeprovider), [React Hooks](./api-terms.md#store-hooks)

---

## Jotai Integration Naming

**Convention**: Jotai 통합을 위한 명명 규칙

**Context Creation**:
- **Factory Function**: `createAtomContext<T>(initialValue: T)`
- **Provider Component**: `Provider`
- **Context Type**: `AtomContextType<T>`

**Hook Patterns**:
- **State Hooks**: `useAtomState()`, `useAtomReadOnly()`, `useAtomSetter()`
- **Derived Hooks**: `useAtomSelect()`, `useAtomContext()`
- **Type Definitions**: `AtomType<T>`, `AtomContextConfig`

**Configuration Naming**:
- **Config Interface**: `AtomContextConfig`
- **Config Properties**: `logger`, `logLevel`

**Related Terms**: [Jotai Integration](./api-terms.md#jotai-integration), [Context Integration](#context-integration)

---

## Core Framework Naming

**Convention**: 프레임워크 핵심 구성요소의 명명 규칙

**Action System**:
- **Core Class**: `ActionRegister<T extends ActionPayloadMap>`
- **Handler Types**: `ActionHandler<T>`, `HandlerRegistration<T>`
- **Dispatcher Type**: `ActionDispatcher<T>`
- **Configuration**: `ActionRegisterConfig`, `HandlerConfig`

**Pipeline Components**:
- **Controllers**: `PipelineController<T>`, `PipelineContext<T>`
- **Execution Modes**: `ExecutionMode` ('sequential' | 'parallel' | 'race')
- **Guard System**: `ActionGuard`, `GuardState`

**Event System**:
- **Event Emitter**: `SimpleEventEmitter<T>`, `EventEmitter<T>`
- **Event Types**: `ActionRegisterEvents<T>`, `EventHandler<T>`
- **Event Names**: `'action:start'`, `'action:complete'`, `'action:abort'`, `'action:error'`

**Related Terms**: [ActionRegister](./core-concepts.md#actionregister), [Action Pipeline System](./core-concepts.md#action-pipeline-system)

---

## Error and Utility Naming

**Convention**: 에러 처리 및 유틸리티 함수 명명

**Utility Functions**:
- **Environment Access**: `getEnvVar()`, `getLogLevelFromEnv()`, `getDebugFromEnv()`
- **Logger Utilities**: `createLogger()`, `getLoggerNameFromEnv()`
- **Store Utilities**: `StoreUtils`, `RegistryUtils`

**Error Handling**:
- **Error Types**: `ActionError`, `PipelineError`, `StoreError`
- **Error Methods**: `abort()`, `handleError()`, `rollback()`
- **Validation Functions**: `validate()`, `isValid()`, `checkCondition()`

**Performance and Metrics**:
- **Metrics Types**: `ActionMetrics`, `PerformanceMetrics`
- **Monitoring Functions**: `trackExecution()`, `measurePerformance()`
- **Optimization Utilities**: `debounce()`, `throttle()`, `memoize()`

**Related Terms**: [Action Guard](./core-concepts.md#action-guard), [Performance Optimization](./api-terms.md#performance-optimization)

---

## Environment Configuration

**Convention**: 환경 변수 및 설정을 위한 명명 규칙

**Environment Variable Patterns**:
- **Framework Prefix**: `CONTEXT_ACTION_*`
- **Log Configuration**: `CONTEXT_ACTION_LOG_LEVEL`, `CONTEXT_ACTION_DEBUG`, `CONTEXT_ACTION_TRACE`
- **Logger Settings**: `CONTEXT_ACTION_LOGGER_NAME`
- **Vite Environment**: `VITE_CONTEXT_ACTION_*` (브라우저 환경)

**Configuration Object Naming**:
- **Logger Config**: `LoggerConfig`, `ConsoleLoggerConfig`
- **Action Config**: `ActionRegisterConfig`
- **Store Config**: `StoreConfig`, `StoreRegistryConfig`

**Environment Detection**:
- **Node.js**: `process.env.*`
- **Vite/Browser**: `import.meta.env.VITE_*`
- **Cross-Platform**: `getEnvVar()` helper function

**Related Terms**: [Logger System Naming](#logger-system-naming), [Cross-Platform Support](#cross-platform-support)