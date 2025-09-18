# createStore

## Overview

createStore is a core API in the framework.

## Quick Start

```typescript
const stringStore = createStore('string', 'initial');
const numberStore = createStore('number', 42);
const objectStore = createStore('object', { test: true });
stringStore.dispose();
numberStore.dispose();
objectStore.dispose();
```

## Usage Examples

### Error Handling

#### Example 1: should export error boundary components

```typescript

```

#### Example 2: should handle transformation errors gracefully

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

### Advanced Patterns

#### Example 1: should export Store class and createStore

```typescript

```

#### Example 2: should export createStoreContext and StoreManager

```typescript

```

#### Example 3: should export all expected main APIs

```typescript
const expectedExports = [
  'createActionContext',
  'useStoreValue',
  'createStoreContext',
  expectedExports.forEach(exportName => {
  });
```

### Basic Usage

#### Example 1: should create store with correct type and initial value

```typescript
const stringStore = createStore('string', 'initial');
const numberStore = createStore('number', 42);
const objectStore = createStore('object', { test: true });
stringStore.dispose();
numberStore.dispose();
objectStore.dispose();
```

#### Example 2: should handle setValue options correctly

```typescript
const store = createStore('options-test', { count: 0 });
const listener = async (payload) => {
};
store.subscribe(listener);
store.setValue({ count: 0 }, { skipComparison: true });
setTimeout(() => {
  store.dispose();
}, 20);
```

#### Example 3: should handle missing transform function

```typescript
const store = createStore('missing-transform', 'initial');
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
store.setValue(mockEvent as any, {
});
consoleErrorSpy.mockRestore();
store.dispose();
```

## Test Coverage

This API is tested with **81 test cases** across 4 test files.

---

*This documentation is automatically generated from test code.*
