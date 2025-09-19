# TypeScript Type Inference Guide

Context-Action provides powerful TypeScript type inference to ensure type safety and excellent developer experience. This guide shows you how to leverage the framework's advanced type system effectively.

## 🎯 Quick Start

### Basic Setup

First, ensure your project has TypeScript configured with strict mode:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Automatic Type Inference

The framework automatically infers types from your data:

```typescript
import { createStoreContext } from '@context-action/react';

// ✅ Types are automatically inferred
const { Provider, useStore, useStoreManager } = createStoreContext('MyApp', {
  user: { name: 'John', age: 30 },           // Type: { name: string; age: number }
  count: 0,                                 // Type: number
  isLoading: false,                         // Type: boolean
  items: ['apple', 'banana'],               // Type: string[]
  settings: { theme: 'dark' as const }      // Type: { theme: 'dark' }
});
```

## 📋 Table of Contents

- [Store Type Inference](./type-inference/stores.md)
- [Action Type Inference](./type-inference/actions.md)
- [Advanced Type Features](./type-inference/advanced.md)
- [Type Safety Best Practices](./type-inference/best-practices.md)
- [IDE Setup and Tips](./type-inference/ide-setup.md)
- [Practical Examples](./type-inference/examples.md)

## 🔑 Key Features

### 🎯 **Automatic Type Inference**
- Zero manual type annotations for simple cases
- Intelligent type inference from initial values
- Support for complex nested structures

### 🛡️ **Type Safety**
- Compile-time error detection
- Runtime type validation integration
- Branded types for enhanced safety

### ⚡ **Developer Experience**
- IntelliSense autocompletion
- Type-aware refactoring
- Instant error feedback

### 🔧 **Advanced Features**
- Conditional type processing
- Result strategy type inference
- Generic type utilities

## 🚀 Getting Started

1. **[Store Type Inference](./type-inference/stores.md)** - Learn how to create type-safe stores
2. **[Action Type Inference](./type-inference/actions.md)** - Master action payload typing
3. **[Advanced Features](./type-inference/advanced.md)** - Explore branded types and utilities

## 💡 Quick Example

Here's a complete example showing type inference in action:

```typescript
// 1. Define your action types
interface UserActions {
  updateProfile: { name: string; email: string };
  deleteUser: { userId: string };
  resetState: void;
}

// 2. Create contexts with automatic type inference
const { Provider: UserActionProvider, useActionDispatch } =
  createActionContext<UserActions>('UserActions');

const { Provider: DataProvider, useStore } =
  createStoreContext('UserData', {
    user: { id: '', name: '', email: '' },
    isLoading: false
  });

// 3. Use with full type safety
function UserComponent() {
  const dispatch = useActionDispatch();
  const userStore = useStore('user');
  const user = useStoreValue(userStore);  // Type: { id: string; name: string; email: string }

  const handleUpdate = () => {
    // ✅ Type-safe dispatch
    dispatch('updateProfile', {
      name: user.name,
      email: user.email
    });
  };

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={handleUpdate}>Update Profile</button>
    </div>
  );
}
```

## 🔗 Related Documentation

- [Getting Started Guide](./getting-started.md)
- [Best Practices](./best-practices.md)
- [API Reference](../api/index.md)
- [Architecture Overview](../concept/architecture-guide.md)

---

**Next Steps**: Start with [Store Type Inference](./type-inference/stores.md) to learn the fundamentals.