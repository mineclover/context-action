# ActionRegister



## Usage Examples


### Example 1

```typescript
interface TestActions extends ActionPayloadMap {
simpleAction: { message: string
}

// Setup
actionRegister = new ActionRegister<SimpleTestActions>();

// Usage

```

should create ActionRegister instance


### Example 2

```typescript
interface TestActions extends ActionPayloadMap {
stringAction: string;
  numberAction: number;
  booleanAction: boolean;
  objectAction: { name: string; age: number
}

// Setup
actionRegister = new ActionRegister<TypeSafetyActions>({
      name: 'TypeSafetyTestRegister'

// Usage
interface CustomData<T> {
data: T;
metadata: { type: string; timestamp: number };
}
const customActionRegister = new ActionRegister<{
customAction: CustomData<{ value: number; label: string }>;
}>();
const handler = jest.fn((payload: CustomData<{ value: number; label: string }>) => ({
processedValue: payload.data.value * 2,
processedLabel: payload.data.label.toUpperCase(),
originalMetadata: payload.metadata
```

should maintain generic types through the entire pipeline


### Example 3

```typescript
interface TestActions extends ActionPayloadMap {
stringAction: string;
  numberAction: number;
  booleanAction: boolean;
  objectAction: { name: string; age: number
}

// Setup
actionRegister = new ActionRegister<TypeSafetyActions>({
      name: 'TypeSafetyTestRegister'

// Usage
interface CustomData<T> {
data: T;
metadata: { type: string; timestamp: number };
}
const customActionRegister = new ActionRegister<{
customAction: CustomData<{ value: number; label: string }>;
}>();
const handler = jest.fn((payload: CustomData<{ value: number; label: string }>) => ({
processedValue: payload.data.value * 2,
processedLabel: payload.data.label.toUpperCase(),
originalMetadata: payload.metadata
```

should maintain generic types through the entire pipeline


### Example 4

```typescript
interface TestActions extends ActionPayloadMap {
stringAction: string;
  numberAction: number;
  booleanAction: boolean;
  objectAction: { name: string; age: number
}

// Setup
actionRegister = new ActionRegister<TypeSafetyActions>({
      name: 'TypeSafetyTestRegister'

// Usage
interface CustomData<T> {
data: T;
metadata: { type: string; timestamp: number };
}
const customActionRegister = new ActionRegister<{
customAction: CustomData<{ value: number; label: string }>;
}>();
const handler = jest.fn((payload: CustomData<{ value: number; label: string }>) => ({
processedValue: payload.data.value * 2,
processedLabel: payload.data.label.toUpperCase(),
originalMetadata: payload.metadata
```

should maintain generic types through the entire pipeline


### Example 5

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.destroy();
```

should not have clearExecutionStats method


### Example 6

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.destroy();
```

should not have clearExecutionStats method


### Example 7

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.destroy();
```

should not have updateExecutionStats method


### Example 8

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.destroy();
```

should not have updateExecutionStats method


### Example 9

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.destroy();
```

should not have executionStats property


### Example 10

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.destroy();
```

should not have executionStats property


### Example 11

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.register('testAction', async (payload) => { /* handler logic */ });
const stats = actionRegister.getActionStats('testAction');
actionRegister.destroy();
```

should return undefined for executionStats in getActionStats


### Example 12

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.register('testAction', async (payload) => { /* handler logic */ });
const stats = actionRegister.getActionStats('testAction');
actionRegister.destroy();
```

should return undefined for executionStats in getActionStats


### Example 13

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const debugRegister = new ActionRegister<StatsTestActions>({
registry: { debug: true }
```

should not have debug overhead from stats tracking


### Example 14

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const debugRegister = new ActionRegister<StatsTestActions>({
registry: { debug: true }
```

should not have debug overhead from stats tracking


### Example 15

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.destroy();
```

should maintain existing API surface without stats methods


### Example 16

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { value: string
}

// Setup
actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }

// Usage
const actionRegister = new ActionRegister<StatsTestActions>();
actionRegister.destroy();
```

should maintain existing API surface without stats methods


### Example 17

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const limitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 2 }
```

should respect maxHandlersPerAction limit


### Example 18

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const limitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 2 }
```

should respect maxHandlersPerAction limit


### Example 19

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const customRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 5 }
```

should allow configuring custom handler limits


### Example 20

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const customRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 5 }
```

should allow configuring custom handler limits


### Example 21

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const unlimitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: Infinity }
```

should allow unlimited handlers when maxHandlersPerAction is Infinity


### Example 22

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const unlimitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: Infinity }
```

should allow unlimited handlers when maxHandlersPerAction is Infinity


### Example 23

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const limitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 3 }
```

should allow unregistering to make room for new handlers


### Example 24

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const limitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 3 }
```

should allow unregistering to make room for new handlers


### Example 25

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const limitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 10 }
```

should maintain performance with handler limit warnings


### Example 26

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const limitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 10 }
```

should maintain performance with handler limit warnings


### Example 27

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const limitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 5 }
```

should handle dispatch efficiently even with memory limits


### Example 28

```typescript
interface TestActions extends ActionPayloadMap {
testAction: { id: string; data: string
}

// Setup
actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }

// Usage
const limitedRegister = new ActionRegister<MemoryTestActions>({
registry: { maxHandlersPerAction: 5 }
```

should handle dispatch efficiently even with memory limits


### Example 29

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const safeRegister = new ActionRegister<TestActions>({
name: 'SafeRegister',
registry: { useConcurrencyQueue: true }
```

useConcurrencyQueue: true (safe execution)


### Example 30

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const safeRegister = new ActionRegister<TestActions>({
name: 'SafeRegister',
registry: { useConcurrencyQueue: true }
```

useConcurrencyQueue: true (safe execution)


### Example 31

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const unsafeRegister = new ActionRegister<TestActions>({
name: 'UnsafeRegister',
registry: { useConcurrencyQueue: false }
```

useConcurrencyQueue: false shows potential for issues


### Example 32

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const unsafeRegister = new ActionRegister<TestActions>({
name: 'UnsafeRegister',
registry: { useConcurrencyQueue: false }
```

useConcurrencyQueue: false shows potential for issues


### Example 33

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const performanceRegister = new ActionRegister<TestActions>({
name: 'HighPerformanceManager',
registry: {
useConcurrencyQueue: false,
defaultExecutionMode: 'parallel'
}
```

high-performance configuration for analytics


### Example 34

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const performanceRegister = new ActionRegister<TestActions>({
name: 'HighPerformanceManager',
registry: {
useConcurrencyQueue: false,
defaultExecutionMode: 'parallel'
}
```

high-performance configuration for analytics


### Example 35

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
interface UserStateActions {
login: { username: string; password: string };
updateProfile: { userId: string; changes: { name?: string; email?: string } };
}
const userManager = new ActionRegister<UserStateActions>({
name: 'UserStateManager'
```

user state management pattern (safe by default)


### Example 36

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
interface UserStateActions {
login: { username: string; password: string };
updateProfile: { userId: string; changes: { name?: string; email?: string } };
}
const userManager = new ActionRegister<UserStateActions>({
name: 'UserStateManager'
```

user state management pattern (safe by default)


### Example 37

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
interface AnalyticsActions {
trackEvent: { event: string; properties: Record<string, any> };
}
const analytics = new ActionRegister<AnalyticsActions>({
name: 'AnalyticsTracker',
registry: {
useConcurrencyQueue: false,     // Performance optimization
defaultExecutionMode: 'parallel'
}
```

analytics tracking pattern (performance optimized)


### Example 38

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
interface AnalyticsActions {
trackEvent: { event: string; properties: Record<string, any> };
}
const analytics = new ActionRegister<AnalyticsActions>({
name: 'AnalyticsTracker',
registry: {
useConcurrencyQueue: false,     // Performance optimization
defaultExecutionMode: 'parallel'
}
```

analytics tracking pattern (performance optimized)


### Example 39

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const memoryRegister = new ActionRegister<TestActions>({
name: 'MemoryOptimized',
registry: {
maxHandlersPerAction: 3 // Low limit for testing
}
```

maxHandlersPerAction limits memory usage


### Example 40

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const memoryRegister = new ActionRegister<TestActions>({
name: 'MemoryOptimized',
registry: {
maxHandlersPerAction: 3 // Low limit for testing
}
```

maxHandlersPerAction limits memory usage


### Example 41

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const sequentialRegister = new ActionRegister<TestActions>({
name: 'Sequential',
registry: { useConcurrencyQueue: true }
```

sequential vs parallel execution timing comparison


### Example 42

```typescript
// Setup
register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }

// Usage
const sequentialRegister = new ActionRegister<TestActions>({
name: 'Sequential',
registry: { useConcurrencyQueue: true }
```

sequential vs parallel execution timing comparison


### Example 43

```typescript
interface TestActions extends ActionPayloadMap {
userLogin: { username: string; password: string
}

// Setup
actionRegister = new ActionRegister<CoreTestActions>({
      name: 'CoreTestRegister',
      registry: {
        debug: false,
        defaultExecutionMode: 'sequential'
      }

// Usage
const debugRegister = new ActionRegister<CoreTestActions>({
name: 'DebugRegister',
registry: {
debug: true,
autoCleanup: true,
defaultExecutionMode: 'parallel'
}
```

should handle registry configuration options


### Example 44

```typescript
interface TestActions extends ActionPayloadMap {
userLogin: { username: string; password: string
}

// Setup
actionRegister = new ActionRegister<CoreTestActions>({
      name: 'CoreTestRegister',
      registry: {
        debug: false,
        defaultExecutionMode: 'sequential'
      }

// Usage
const debugRegister = new ActionRegister<CoreTestActions>({
name: 'DebugRegister',
registry: {
debug: true,
autoCleanup: true,
defaultExecutionMode: 'parallel'
}
```

should handle registry configuration options


### Example 45

```typescript
interface TestActions extends ActionPayloadMap {
processData: { data: string; delay?: number
}

// Setup
actionRegister = new ActionRegister<ExecutionTestActions>({
      name: 'ExecutionTestRegister',
      registry: { debug: false }

// Usage
actionRegister = new ActionRegister<ExecutionTestActions>({
name: 'ExecutionTestRegister',
registry: { debug: false }
```

should return first error if it completes first


### Example 46

```typescript
interface TestActions extends ActionPayloadMap {
processData: { data: string; delay?: number
}

// Setup
actionRegister = new ActionRegister<ExecutionTestActions>({
      name: 'ExecutionTestRegister',
      registry: { debug: false }

// Usage
actionRegister = new ActionRegister<ExecutionTestActions>({
name: 'ExecutionTestRegister',
registry: { debug: false }
```

should return first error if it completes first


### Example 47

```typescript
interface TestActions extends ActionPayloadMap {
processData: { data: string; delay?: number
}

// Setup
actionRegister = new ActionRegister<ExecutionTestActions>({
      name: 'ExecutionTestRegister',
      registry: { debug: false }

// Usage
const seqRegister = new ActionRegister<ExecutionTestActions>({
name: 'SequentialTestRegister',
registry: { debug: false }
```

should provide accurate execution statistics for different modes


### Example 48

```typescript
interface TestActions extends ActionPayloadMap {
processData: { data: string; delay?: number
}

// Setup
actionRegister = new ActionRegister<ExecutionTestActions>({
      name: 'ExecutionTestRegister',
      registry: { debug: false }

// Usage
const seqRegister = new ActionRegister<ExecutionTestActions>({
name: 'SequentialTestRegister',
registry: { debug: false }
```

should provide accurate execution statistics for different modes


### Example 49

```typescript
// Usage
'createActionContext',
'Store',
'createStore',
'useStoreValue',
'useStoreSelector',
'StoreErrorBoundary',
'createStoreContext',
'StoreManager',
'createRefContext',
'ActionRegister'
];
```

should export all expected main APIs


## Test Coverage

이 API는 다음 테스트 파일에서 검증됩니다:
- [__tests__/simple-working.test.ts](../../packages/core/__tests__/simple-working.test.ts)
- [__tests__/type-safety/ActionRegister.type-safety.test.ts](../../packages/core/__tests__/type-safety/ActionRegister.type-safety.test.ts)
- [__tests__/type-safety/ActionRegister.type-safety.test.ts](../../packages/core/__tests__/type-safety/ActionRegister.type-safety.test.ts)
- [__tests__/type-safety/ActionRegister.type-safety.test.ts](../../packages/core/__tests__/type-safety/ActionRegister.type-safety.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/execution-stats-removal.test.ts](../../packages/core/__tests__/feature-coverage/execution-stats-removal.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/feature-coverage/memory-management.test.ts](../../packages/core/__tests__/feature-coverage/memory-management.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/concurrency/concurrency-docs-simple.test.ts](../../packages/core/__tests__/concurrency/concurrency-docs-simple.test.ts)
- [__tests__/comprehensive/ActionRegister.core.test.ts](../../packages/core/__tests__/comprehensive/ActionRegister.core.test.ts)
- [__tests__/comprehensive/ActionRegister.core.test.ts](../../packages/core/__tests__/comprehensive/ActionRegister.core.test.ts)
- [__tests__/comprehensive/ExecutionModes.test.ts](../../packages/core/__tests__/comprehensive/ExecutionModes.test.ts)
- [__tests__/comprehensive/ExecutionModes.test.ts](../../packages/core/__tests__/comprehensive/ExecutionModes.test.ts)
- [__tests__/comprehensive/ExecutionModes.test.ts](../../packages/core/__tests__/comprehensive/ExecutionModes.test.ts)
- [__tests__/comprehensive/ExecutionModes.test.ts](../../packages/core/__tests__/comprehensive/ExecutionModes.test.ts)
- [__tests__/index.test.ts](../../packages/react/__tests__/index.test.ts)

## Related APIs

- 관련 API 링크들이 여기에 추가됩니다.

---
*이 문서는 테스트 코드를 기반으로 자동 생성되었습니다.*
