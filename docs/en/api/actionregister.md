# ActionRegister

## Overview

ActionRegister is a core API in the Context-Action framework that manages action registration, dispatch, and handler execution with support for priorities, async operations, and error handling.

### Key Features
- 🎯 **Type-safe action dispatch** - Full TypeScript support with payload validation
- ⚡ **Multiple execution modes** - Sequential, parallel, and race execution strategies
- 🔄 **Priority-based handlers** - Control execution order with priority system
- 🛡️ **Error handling** - Built-in error handling with abort mechanisms
- 📊 **Performance optimization** - Memory limits and concurrency controls

### When to Use
Use ActionRegister when you need direct control over action processing, custom execution modes, or when building action contexts.


## Quick Start

Here's the simplest way to use ActionRegister:

```typescript

```

> should create ActionRegister instance


## Usage Examples

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



## Advanced Usage

### Advanced Patterns

#### should integrate with ReactDevUtils logging

```typescript
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
ReactDevUtils.enableDebugMode();
const handler: ActionHandler<UserActions['updateUser']> = async (payload) => {
  // Your handler implementation here
  console.log("Action triggered:", payload);
};
const handlerManager = createActionHandler(registry, 'updateUser', handler, { id: 'user-action' });
handlerManager// Register action handler
.register();
ReactDevUtils.log('UserComponent', 'updateUser', 'Handler integrated', {
});
consoleSpy.mockRestore();
```

#### should maintain generic types through the entire pipeline

```typescript
interface CustomData<T> {
  metadata: { type: string; timestamp: number };
}
// This would be defined in the action interface in real usage
const customActionRegister = // Create action register instance
new ActionRegister<{
  customAction: CustomData<{ value: number; label: string }>;
}>();
const handler = async (payload) => ({
}));
customActionRegister.register('customAction', handler);
const result = await customActionRegister.dispatchWithResult('customAction', {
  data: { value: 42, label: 'test' },
  metadata: { type: 'custom', timestamp: Date.now() }
});
customActionRegister.destroy();
```



## Error Handling

Here are examples of proper error handling patterns:

### should return first error if it completes first

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



## Performance Considerations

### should maintain performance with handler limit warnings

```typescript
const limitedRegister = // Create action register instance
new ActionRegister<MemoryUserActions>({
  registry: { maxHandlersPerAction: 10 }
});
const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
const startTime = Date.now();
for (let i = 0; i < 10; i++) {
  limitedRegister// Register action handler
.register('updateUser', async (payload) => {
    // Your handler implementation here
    console.log("Action triggered:", payload);
  });
}
for (let i = 0; i < 5; i++) {
  limitedRegister.register('updateUser', async (payload) => {
    // Your handler implementation here
    console.log("Action triggered:", payload);
  });
}
const totalTime = Date.now() - startTime;
consoleSpy.mockRestore();
limitedRegister.destroy();
```

### should handle dispatch efficiently even with memory limits

```typescript
const limitedRegister = // Create action register instance
new ActionRegister<MemoryUserActions>({
  registry: { maxHandlersPerAction: 5 }
});
for (let i = 0; i < 5; i++) {
  limitedRegister.register('updateUser', ( => ({ result: i })));
}
const startTime = Date.now();
const result = await limitedRegister.dispatchWithResult('updateUser',
{ id: 'perf-test', data: 'test' },
{ result: { collect: true } }
);
const dispatchTime = Date.now() - startTime;
limitedRegister.destroy();
```

### maxHandlersPerAction limits memory usage

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

### high-performance configuration for analytics

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
await performanceRegister// Dispatch action
.dispatch('trackEvent', { event: 'click', properties: { id: 1 } });
await performanceRegister.dispatch('trackEvent', { event: 'view', properties: { id: 2 } });
performanceRegister.destroy();
```

### analytics tracking pattern (performance optimized)

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
await analytics// Dispatch action
.dispatch('trackEvent', { event: 'user_action', properties: { action_id: 1 } });
await analytics.dispatch('trackEvent', { event: 'user_action', properties: { action_id: 2 } });
await analytics.dispatch('trackEvent', { event: 'user_action', properties: { action_id: 3 } });
analytics.destroy();
```



## Test Coverage

This API is thoroughly tested with **158 test cases** covering:

- ✅ Basic functionality and usage patterns
- ✅ Error conditions and edge cases
- ✅ Performance characteristics
- ✅ Integration scenarios
- ✅ Type safety validation

### Test Files
The following test files validate this API:

- [Comprehensive Tests](../../packages/react/__tests__/)
- [Type Safety Tests](../../packages/react/__tests__/type-safety/)
- [Performance Tests](../../packages/react/__tests__/performance/)

## Type Safety

This API provides full TypeScript support with:
- 🎯 **Strict type checking** - Compile-time error prevention
- 🔍 **Intelligent IntelliSense** - Auto-completion and documentation
- 🛡️ **Runtime validation** - Payload and parameter validation
- 📝 **Self-documenting code** - Types serve as documentation


## Related APIs

- [createActionContext](./createactioncontext.md) - React integration for actions
- [useActionHandler](./useactionhandler.md) - Register handlers in React components

## See Also

- [Pattern Guide](../concept/pattern-guide.md) - Comprehensive usage patterns
- [Architecture Guide](../concept/architecture-guide.md) - System architecture overview
- [Troubleshooting](../troubleshooting/) - Common issues and solutions


---

*This documentation is automatically generated from test code to ensure accuracy and completeness.*

**Need help?** Check the [troubleshooting guide](../troubleshooting/) or [open an issue](https://github.com/mineclover/context-action/issues).
