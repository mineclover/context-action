# Type Safety in Context-Action Framework

The Context-Action framework has been designed with **strict type safety** as a core principle. This guide explains how our type system works and the recent improvements that ensure robust, compile-time safety throughout your application.

## Overview

Type safety in the Context-Action framework is achieved through:

1. **Strict TypeScript Integration** - Full type coverage with no `any` types
2. **Action Payload Validation** - Compile-time validation of action payloads
3. **Store Type Guarantees** - Guaranteed non-undefined returns for initialized stores
4. **Context Pattern Safety** - Automatic context validation and error handling

## Core Type Safety Features

### 1. Action Payload Type Safety

All actions must extend `ActionPayloadMap` interface, providing complete type safety for action dispatching:

```typescript
import { ActionPayloadMap } from '@context-action/react';

interface UserActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  clearUser: void; // For actions without payload
}

// ✅ Type-safe dispatch
const dispatch = useActionDispatch<UserActions>();
dispatch('updateUser', { id: '1', name: 'John', email: 'john@example.com' });

// ❌ Compile-time error - wrong payload type
dispatch('updateUser', { id: 1 }); // Error: id must be string
dispatch('updateUser', { name: 'John' }); // Error: missing required fields
```

### 2. Store Value Type Safety

#### Problem with Traditional `useStoreValue`

Previously, `useStoreValue` would return `T | undefined` even for stores with initial values, requiring unnecessary null checks:

```typescript
// ❌ Old approach - unnecessary undefined handling
const userStore = createStore({ name: 'John', age: 30 });
const user = useStoreValue(userStore); // Type: User | undefined

// Forced to handle undefined case even though store has initial value
if (user) {
  console.log(user.name); // TypeScript requires this check
}
```

#### Solution: `useStoreValueSafe`

The new `useStoreValueSafe` hook provides strict type safety for stores with initial values:

```typescript
// ✅ New approach - guaranteed non-undefined return
const userStore = createStore({ name: 'John', age: 30 });
const user = useStoreValueSafe(userStore); // Type: User (never undefined)

// Direct access without null checks
console.log(user.name); // ✅ Always safe
```

#### Multiple Hook Overloads

Both hooks now support multiple overloads for different use cases:

```typescript
// Basic usage
const value = useStoreValueSafe(store);

// With selector
const userName = useStoreValueSafe(userStore, user => user.name);

// Legacy compatibility maintained
const value = useStoreValue(store); // Still works, returns T | undefined
```

### 3. Context Pattern Type Safety

The Unified Context Pattern ensures complete type safety across the entire context hierarchy:

```typescript
// ✅ Type-safe context pattern creation
const UserContext = createContextPattern<UserActions>('User');

// ✅ Type-safe store creation with guaranteed types
const UserComponent = () => {
  const userStore = UserContext.useStore('user', { name: '', email: '' });
  const user = useStoreValueSafe(userStore); // Type: User (never undefined)
  
  // ✅ Type-safe action handling
  UserContext.useActionHandler('updateUser', ({ id, name, email }) => {
    // Payload is fully typed - no type assertions needed
    userStore.setValue({ id, name, email });
  });
  
  // ✅ Type-safe dispatch
  const dispatch = UserContext.useAction();
  dispatch('updateUser', { id: '1', name: 'John', email: 'john@example.com' });
};
```

### 4. Runtime Validation (Development Mode)

In addition to compile-time safety, the framework provides runtime validation in development mode:

```typescript
// Development mode warnings for debugging
const store = MyContext.useStore('data', undefined);
const value = useStoreValueSafe(store);
// Console warning: "Store 'data' initialized with undefined value"

// Runtime validation prevents common mistakes
const invalidStore = null;
const value = useStoreValueSafe(invalidStore);
// Runtime error: "useStoreValueSafe: Store cannot be null or undefined"
```

## Migration Guide

### From Legacy Store Patterns

If you're migrating from legacy patterns, follow these steps:

```typescript
// ❌ Old pattern - separate providers
<StoreProvider>
  <ActionProvider>
    <MyComponent />
  </ActionProvider>
</StoreProvider>

// ✅ New unified pattern
const MyContext = createContextPattern<MyActions>('MyContext');

<MyContext.Provider registryId="my-app">
  <MyComponent />
</MyContext.Provider>
```

### From `useStoreValue` to `useStoreValueSafe`

```typescript
// ❌ Old approach with unnecessary null checks
const user = useStoreValue(userStore);
const userName = user?.name ?? 'Unknown';

// ✅ New approach with guaranteed safety
const user = useStoreValueSafe(userStore);
const userName = user.name; // Always safe, no null check needed
```

## Type Safety Best Practices

### 1. Always Use Initial Values

```typescript
// ✅ Good - store has guaranteed initial value
const counterStore = MyContext.useStore('counter', 0);
const count = useStoreValueSafe(counterStore); // Type: number

// ⚠️ Avoid - store might be undefined
const maybeStore = MyContext.useStore('maybe-data', undefined);
const data = useStoreValue(maybeStore); // Type: unknown | undefined
```

### 2. Define Comprehensive Action Interfaces

```typescript
// ✅ Good - complete action interface
interface TodoActions extends ActionPayloadMap {
  addTodo: { text: string; priority: 'high' | 'medium' | 'low' };
  toggleTodo: { id: string };
  deleteTodo: { id: string };
  updateTodo: { id: string; text?: string; priority?: 'high' | 'medium' | 'low' };
  clearCompleted: void;
}

// ❌ Avoid - loose typing
interface LooseActions extends ActionPayloadMap {
  updateSomething: any; // Loses type safety benefits
}
```

### 3. Use Context Pattern for Complex State

```typescript
// ✅ Good - isolated context with complete typing
const ShoppingCartContext = createContextPattern<CartActions>('ShoppingCart');

const CartComponent = () => {
  const cartStore = ShoppingCartContext.useStore('items', []);
  const items = useStoreValueSafe(cartStore); // Type: CartItem[]
  
  ShoppingCartContext.useActionHandler('addItem', ({ item }) => {
    cartStore.update(prev => [...prev, item]);
  });
};
```

### 4. Leverage TypeScript Strict Mode

Ensure your `tsconfig.json` has strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## Advanced Type Safety Features

### Generic Store Types

```typescript
// ✅ Generic store with full type safety
interface ApiResponse<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

const useApiData = <T>() => {
  const apiStore = MyContext.useStore<ApiResponse<T>>('api', {
    data: {} as T,
    loading: false,
    error: null
  });
  
  const apiData = useStoreValueSafe(apiStore); // Type: ApiResponse<T>
  return apiData;
};
```

### Conditional Type Safety

```typescript
// ✅ Conditional types for different store states
type StoreState<T> = T extends undefined ? T | undefined : T;

// Framework automatically applies correct typing
const definedStore = createStore('initial'); // StoreState<string> = string
const undefinedStore = createStore(undefined); // StoreState<undefined> = undefined
```

## Common Type Safety Patterns

### Pattern 1: HOC with Type Safety

```typescript
const UserModuleContext = createContextPattern<UserActions>('UserModule');

const withUserModule = UserModuleContext.withProvider('user-module')(() => {
  const userStore = UserModuleContext.useStore('user', { name: '', email: '' });
  const user = useStoreValueSafe(userStore); // ✅ Always typed as User
  
  return <UserProfile user={user} />;
});
```

### Pattern 2: Cross-Context Communication

```typescript
// ✅ Type-safe communication between contexts
const GlobalContext = createContextPattern<GlobalActions>('Global');
const LocalContext = createContextPattern<LocalActions>('Local');

const LocalComponent = () => {
  LocalContext.useActionHandler('requestGlobal', ({ message }) => {
    // Type-safe dispatch to different context
    const globalDispatch = GlobalContext.useAction();
    globalDispatch('showNotification', { message, type: 'info' });
  });
};
```

## Troubleshooting Type Issues

### Common Issues and Solutions

1. **"Property might be undefined" errors**
   ```typescript
   // ❌ Problem
   const value = useStoreValue(store);
   console.log(value.property); // Error: Object is possibly undefined
   
   // ✅ Solution
   const value = useStoreValueSafe(store);
   console.log(value.property); // ✅ Always safe
   ```

2. **"Argument type not assignable" errors**
   ```typescript
   // ❌ Problem - action payload mismatch
   dispatch('updateUser', { name: 'John' }); // Missing required fields
   
   // ✅ Solution - provide complete payload
   dispatch('updateUser', { id: '1', name: 'John', email: 'john@example.com' });
   ```

3. **Context provider not found errors**
   ```typescript
   // ❌ Problem - using hook outside provider
   const MyComponent = () => {
     const store = MyContext.useStore('data', initial); // Error: Provider not found
   };
   
   // ✅ Solution - wrap with provider
   const App = () => (
     <MyContext.Provider registryId="app">
       <MyComponent />
     </MyContext.Provider>
   );
   ```

## Performance Considerations

Type safety improvements also enhance performance:

1. **Compile-time optimization** - TypeScript can optimize based on guaranteed types
2. **Runtime validation only in development** - Zero production overhead
3. **Reduced conditional checks** - Less branching in hot paths
4. **Better tree-shaking** - Unused type branches eliminated

## Conclusion

The Context-Action framework's type safety improvements provide:

- **Zero undefined errors** for properly initialized stores
- **Complete action payload validation** at compile time
- **Context isolation** with guaranteed type boundaries
- **Development-time validation** for early error detection
- **Performance optimization** through type guarantees

By following these patterns and using the provided type-safe hooks, you can build robust applications with confidence that type errors are caught at compile time rather than runtime.