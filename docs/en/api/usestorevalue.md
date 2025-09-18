# useStoreValue

## Overview

useStoreValue is a core API in the Context-Action framework that provides reactive subscription to store values with automatic re-rendering on changes.

### Key Features
- ⚛️ **Reactive subscriptions** - Automatic re-rendering on value changes
- 🎯 **Type safety** - Full TypeScript support with store type inference
- 🚀 **Performance** - Optimized subscription management
- 🔄 **Automatic cleanup** - Memory leak prevention with automatic unsubscription

### When to Use
Use useStoreValue inside React components to subscribe to store values and trigger re-renders on changes.


## Quick Start

*No basic examples available.*


## Usage Examples



## Advanced Usage

### Advanced Patterns

#### should export store hooks

```typescript

```

#### should export all expected main APIs

```typescript
const expectedExports = [
  'createActionContext',
  'useStoreValue',
  'createStoreContext',
  expectedExports.forEach(exportName => {
  });
```







## Test Coverage

This API is thoroughly tested with **9 test cases** covering:

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

- [createStoreContext](./createstorecontext.md) - Store context creation
- [useStoreSelector](./usestoreselector.md) - Selective store subscriptions

## See Also

- [Pattern Guide](../concept/pattern-guide.md) - Comprehensive usage patterns
- [Architecture Guide](../concept/architecture-guide.md) - System architecture overview
- [Troubleshooting](../troubleshooting/) - Common issues and solutions


---

*This documentation is automatically generated from test code to ensure accuracy and completeness.*

**Need help?** Check the [troubleshooting guide](../troubleshooting/) or [open an issue](https://github.com/mineclover/context-action/issues).
