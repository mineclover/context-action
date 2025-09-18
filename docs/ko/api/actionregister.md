# ActionRegister

## Overview

ActionRegister is a core API in the framework.

## Quick Start

```typescript

```

## Usage Examples

### Advanced Patterns

#### Example 1: should handle registry configuration options

```typescript
const debugRegister = // Create action register instance
new ActionRegister<CoreUserActions>({
  registry: {
  }
});
debugRegister.destroy();
```

#### Example 2: should provide accurate execution statistics for different modes

```typescript
const seqRegister = // Create action register instance
new ActionRegister<ExecutionUserActions>({
  registry: { debug: false }
});
seqRegister.setActionExecutionMode('processData', 'sequential');
seqRegister.register('processData', async () => {
  await new Promise(resolve => setTimeout(resolve, 10));
  return 'result1';
});
seqRegister.register('processData', () => {
  throw new Error('Handler error');
});
seqRegister.register('processData', async () => {
  await new Promise(resolve => setTimeout(resolve, 5));
  return 'result2';
});
const sequentialResult = await seqRegister.dispatchWithResult('processData', { data: 'test' });
seqRegister.destroy();
const parallelRegister = new ActionRegister<ExecutionUserActions>({
  registry: { debug: false }
});
parallelRegister.setActionExecutionMode('performTask', 'parallel');
parallelRegister.register('performTask', async () => {
  await new Promise(resolve => setTimeout(resolve, 10));
  return 'parallel1';
});
parallelRegister.register('performTask', async () => {
  await new Promise(resolve => setTimeout(resolve, 15));
  return 'parallel2';
});
const parallelResult = await parallelRegister.dispatchWithResult('performTask', { taskId: 'stats-test' });
parallelRegister.destroy();
```

#### Example 3: useConcurrencyQueue: true (safe execution)

```typescript
const safeRegister = // Create action register instance
new ActionRegister<UserActions>({
  registry: { useConcurrencyQueue: true }
});
const results: number[] = [];
let counter = 0;
safeRegister.register('updateCounter', ({ increment }) => {
  const current = counter;
  results.push(counter);
});
await Promise.all([
  safeRegister.dispatch('updateCounter', { increment: 1 }),
  safeRegister.dispatch('updateCounter', { increment: 1 }),
  safeRegister.dispatch('updateCounter', { increment: 1 })
]);
safeRegister.destroy();
```

### Error Handling

#### Example 1: should return first error if it completes first

```typescript
actionRegister = // Create action register instance
new ActionRegister<ExecutionUserActions>({
  registry: { debug: false }
});
actionRegister.setActionExecutionMode('validateInput', 'race');
let firstCompleted = '';
actionRegister.register('validateInput', async () => {
  await new Promise(resolve => setTimeout(resolve, 30));
  return { valid: true };
}, { id: 'success-validator' });
actionRegister.register('validateInput', async () => {
  await new Promise(resolve => setTimeout(resolve, 20));
  throw new Error('Medium validator failed');
}, { id: 'medium-error' });
actionRegister.register('validateInput', async () => {
  await new Promise(resolve => setTimeout(resolve, 5));
  throw new Error('Fast validator failed');
}, { id: 'fast-error' });
const result = await actionRegister.dispatchWithResult('validateInput', { value: 'invalid-data' });
```

### Performance

#### Example 1: maxHandlersPerAction limits memory usage

```typescript
const memoryRegister = // Create action register instance
new ActionRegister<UserActions>({
  registry: {
  }
});
memoryRegister.register('test', () => ({ result: 'handler1' }), { id: 'handler1' });
memoryRegister.register('test', () => ({ result: 'handler2' }), { id: 'handler2' });
memoryRegister.register('test', () => ({ result: 'handler3' }), { id: 'handler3' });
memoryRegister.register('test', () => ({ result: 'handler4' }), { id: 'handler4' });
memoryRegister.destroy();
```

#### Example 2: high-performance configuration for analytics

```typescript
const performanceRegister = // Create action register instance
new ActionRegister<UserActions>({
  registry: {
  }
});
const executions: string[] = [];
performanceRegister.register('trackEvent', ({ event, properties }) => {
  executions.push(`${event}-${properties.id}`);
}, { priority: 10, blocking: false });
await performanceRegister.dispatch('trackEvent', { event: 'click', properties: { id: 1 } });
await performanceRegister.dispatch('trackEvent', { event: 'view', properties: { id: 2 } });
performanceRegister.destroy();
```

#### Example 3: analytics tracking pattern (performance optimized)

```typescript
interface AnalyticsActions {
  trackEvent: { event: string; properties: Record<string, any> };
}
const analytics = // Create action register instance
new ActionRegister<AnalyticsActions>({
  registry: {
  }
});
const trackedEvents: any[] = [];
analytics.register('trackEvent', ({ event, properties }) => {
  trackedEvents.push({ event, properties, timestamp: Date.now() });
}, { priority: 10, blocking: false });
await analytics.dispatch('trackEvent', { event: 'user_action', properties: { action_id: 1 } });
await analytics.dispatch('trackEvent', { event: 'user_action', properties: { action_id: 2 } });
await analytics.dispatch('trackEvent', { event: 'user_action', properties: { action_id: 3 } });
analytics.destroy();
```

### Basic Usage

#### Example 1: should create ActionRegister instance

```typescript

```

#### Example 2: should log when debug mode is enabled

```typescript
ReactDevUtils.enableDebugMode();
ReactDevUtils.log('MyComponent', 'updateUser', 'Handler registered', { priority: 10 });
```

#### Example 3: should handle logging without data parameter

```typescript
ReactDevUtils.enableDebugMode();
ReactDevUtils.log('MyComponent', 'updateUser', 'Simple message');
```

## Test Coverage

This API is tested with **158 test cases** across 9 test files.

---

*This documentation is automatically generated from test code.*
