# Store Type Inference

Learn how to create type-safe stores with automatic type inference in Context-Action.

## 🎯 Automatic Type Inference (Recommended)

The simplest way to create stores is to let TypeScript infer types from your initial values:

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

function UserComponent() {
  const userStore = useStore('user');       // ✅ Store<{ name: string; age: number }>
  const countStore = useStore('count');     // ✅ Store<number>

  const user = useStoreValue(userStore);    // ✅ { name: string; age: number }
  const count = useStoreValue(countStore);  // ✅ number

  // ✅ Type-safe updates
  const updateUser = () => {
    userStore.setValue({ name: 'Jane', age: 25 }); // ✅ Exact type required
    // userStore.setValue({ invalid: true });      // ❌ Type error!
  };

  return <div>{user.name} is {user.age} years old</div>;
}
```

## 🏗️ Explicit Type Declaration

For complex types or when you need specific interfaces:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

interface AppStores {
  user: User;
  users: User[];
  currentUserId: string | null;
}

const { Provider, useStore } = createStoreContext<AppStores>('MyApp', {
  user: {
    id: '',
    name: '',
    email: '',
    preferences: { theme: 'light', notifications: true }
  },
  users: [],
  currentUserId: null
});
```

## 🔧 Store Configuration with Types

You can also use store configurations for more advanced setups:

```typescript
import { StoreConfig } from '@context-action/react';

interface ProductStore {
  products: Product[];
  selectedProduct: Product | null;
  filters: ProductFilters;
}

const storeConfigs = {
  products: {
    name: 'products',
    initialValue: [] as Product[],
    validator: (value): value is Product[] => Array.isArray(value),
    eventHandling: 'transform' as const,
    eventTransform: (event: Event) => extractProductsFromEvent(event)
  } satisfies StoreConfig<Product[]>,

  selectedProduct: {
    name: 'selectedProduct',
    initialValue: null as Product | null
  } satisfies StoreConfig<Product | null>,

  filters: {
    name: 'filters',
    initialValue: { category: 'all', priceRange: [0, 1000] } as ProductFilters
  } satisfies StoreConfig<ProductFilters>
};

const { Provider, useStore } = createStoreContext('ProductApp', storeConfigs);
```

## 🎨 Advanced Type Inference

### Readonly Arrays and Immutable Data

```typescript
const { Provider, useStore } = createStoreContext('ImmutableApp', {
  readonlyItems: ['item1', 'item2'] as readonly string[],
  frozenState: Object.freeze({ count: 0, active: true }),
  tupleData: [1, 'hello', true] as const  // Tuple type: [1, 'hello', true]
});

function ImmutableComponent() {
  const itemsStore = useStore('readonlyItems');
  const items = useStoreValue(itemsStore);  // Type: readonly string[]

  // ✅ Type-safe operations
  const newItems = [...items, 'new item'];
  itemsStore.setValue(newItems);
}
```

### Discriminated Unions

```typescript
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: string };

const { Provider, useStore } = createStoreContext('AsyncApp', {
  userState: { status: 'idle' } as LoadingState
});

function AsyncComponent() {
  const stateStore = useStore('userState');
  const state = useStoreValue(stateStore);

  // ✅ Type narrowing works automatically
  switch (state.status) {
    case 'loading':
      return <div>Loading...</div>;
    case 'success':
      return <div>Users: {state.data.length}</div>; // ✅ data is available
    case 'error':
      return <div>Error: {state.error}</div>;      // ✅ error is available
    default:
      return <div>Idle</div>;
  }
}
```

## 🔍 Type Utilities

### Using TypeUtils for Advanced Operations

```typescript
import { TypeUtils } from '@context-action/core';

interface AppState {
  user: User;
  posts: Post[];
  settings: AppSettings;
}

// ✅ Extract keys of specific types
type UserKeys = TypeUtils.KeysOfType<AppState, User>;     // 'user'
type ArrayKeys = TypeUtils.KeysOfType<AppState, unknown[]>; // 'posts'

// ✅ Make specific fields required
type UserWithRequiredEmail = TypeUtils.RequireFields<User, 'email'>;

// ✅ Deep readonly for immutable structures
type ReadonlyAppState = TypeUtils.DeepReadonly<AppState>;

// ✅ Use in store creation
const { Provider, useStore } = createStoreContext('TypedApp', {
  state: {} as ReadonlyAppState,
  requiredUser: {} as UserWithRequiredEmail
});
```

## 🚨 Common Type Issues and Solutions

### Issue 1: Type Widening

```typescript
// ❌ Problem: Type widening
const config = {
  theme: 'dark',  // Type becomes string instead of 'dark'
  size: 'medium'  // Type becomes string instead of 'medium'
};

// ✅ Solution: Use const assertion
const config = {
  theme: 'dark',
  size: 'medium'
} as const;  // Types: { theme: 'dark', size: 'medium' }
```

### Issue 2: Complex Nested Objects

```typescript
// ❌ Problem: Lose type information in complex objects
const complexStore = {
  nested: {
    deep: {
      value: someComplexValue  // Type might be too wide
    }
  }
};

// ✅ Solution: Use satisfies operator
const complexStore = {
  nested: {
    deep: {
      value: someComplexValue
    }
  }
} satisfies ComplexStoreType;
```

### Issue 3: Union Types in Stores

```typescript
// ✅ Proper union type handling
type Theme = 'light' | 'dark' | 'auto';

const { Provider, useStore } = createStoreContext('ThemeApp', {
  theme: 'light' as Theme,  // Explicit type annotation needed
  // theme: 'light',        // ❌ Would infer as string
});
```

## 🔗 Related Sections

- [Action Type Inference](./actions.md) - Learn about action payload typing
- [Advanced Type Features](./advanced.md) - Explore branded types and utilities
- [Best Practices](./best-practices.md) - Type safety recommendations

---

**Next**: Learn about [Action Type Inference](./actions.md)