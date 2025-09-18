# createStore

## Overview

createStore is a core API in the Context-Action framework that provides essential functionality for the Context-Action framework.

### Key Features
- ✨ Core framework functionality

### When to Use
Use this API as part of the Context-Action framework integration.


## Quick Start

Here's the simplest way to use createStore:

```typescript
const config = createStoreConfig({
});
```

> should create store config with default validator


## Usage Examples

### Basic Usage

#### Example 1: should create store config with default validator

```typescript
const config = createStoreConfig({
});
```

#### Example 2: should preserve transform function

```typescript
const transform = (value: unknown) => String(value);
const config = createStoreConfig({
});
```

#### Example 3: should create store with correct type and initial value

```typescript
const stringStore = createStore('string', 'initial');
const numberStore = createStore('number', 42);
const objectStore = createStore('object', { test: true });
stringStore.dispose();
numberStore.dispose();
objectStore.dispose();
```



## Advanced Usage

### Advanced Patterns

#### should export Store class and createStore

```typescript

```

#### should export createStoreContext and StoreManager

```typescript

```



## Error Handling

Here are examples of proper error handling patterns:

### should export error boundary components

```typescript

```

### should handle transformation errors gracefully

```typescript
const store = createStore('transform-test', 'initial');
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
store.setValue(mockEvent as any, {
  eventTransform: () => {
    throw new Error('Transform error');
  }
});
consoleErrorSpy.mockRestore();
store.dispose();
```





## Test Coverage

This API is thoroughly tested with **81 test cases** covering:

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




---

*This documentation is automatically generated from test code to ensure accuracy and completeness.*

**Need help?** Check the [troubleshooting guide](../troubleshooting/) or [open an issue](https://github.com/mineclover/context-action/issues).
