# Path-Based Subscription

Optimized subscription pattern that uses JSON patches to determine when to re-render, providing fine-grained control over component updates.

## Overview

Traditional selectors run on every state change and compare results. Path-based subscription instead analyzes JSON patches to determine if subscribed paths are affected, avoiding unnecessary selector execution.

```
# Selector Approach
State Change → Run Selector → Compare Result → (if different) Re-render

# Path-Based Approach
State Change → Check Patch Paths → (if path affected) Get Value → Re-render
```

## Core APIs

### useStorePath

Subscribe to a specific path in the store. Only re-renders when that path changes.

```tsx
import { useStorePath } from '@context-action/react';

function UserName() {
  // Only re-renders when user.name changes
  const name = useStorePath(store, ['user', 'name']);
  return <span>{name}</span>;
}

function UserAge() {
  // Only re-renders when user.age changes
  const age = useStorePath(store, ['user', 'age']);
  return <span>{age}</span>;
}
```

### useStoreSelectorWithPaths

Combine selector transformation with path-based optimization.

```tsx
import { useStoreSelectorWithPaths } from '@context-action/react';

function FullName() {
  // Selector runs only when firstName or lastName changes
  const fullName = useStoreSelectorWithPaths(
    store,
    (state) => `${state.user.firstName} ${state.user.lastName}`,
    { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
  );
  return <span>{fullName}</span>;
}
```

## Comparison with Selectors

| Feature | useStoreSelector | useStorePath | useStoreSelectorWithPaths |
|---------|------------------|--------------|---------------------------|
| **Selector Execution** | Every change | Path match only | Path match only |
| **Comparison Target** | Selector result | Patch paths | Patch paths |
| **Derived Values** | ✅ Yes | ❌ No | ✅ Yes |
| **Performance** | Depends on selector | Fast (string compare) | Best of both |

## When to Use Each

### useStorePath
Best for direct property access without transformation:

```tsx
// Simple path access
const theme = useStorePath(settingsStore, ['theme']);
const count = useStorePath(counterStore, ['count']);

// Array access
const firstItem = useStorePath(listStore, ['items', 0]);

// Nested access
const city = useStorePath(userStore, ['address', 'city']);
```

### useStoreSelector
Best for complex transformations where path hints aren't practical:

```tsx
// Complex filtering/mapping
const activeUsers = useStoreSelector(store,
  (s) => s.users.filter(u => u.isActive)
);

// Aggregations
const totalPrice = useStoreSelector(store,
  (s) => s.items.reduce((sum, item) => sum + item.price, 0)
);
```

### useStoreSelectorWithPaths
Best for derived values with known dependencies:

```tsx
// Derived value with specific dependencies
const displayName = useStoreSelectorWithPaths(
  store,
  (s) => s.user.nickname || `${s.user.firstName} ${s.user.lastName}`,
  { dependsOn: [['user', 'nickname'], ['user', 'firstName'], ['user', 'lastName']] }
);

// Computed value from multiple paths
const cartSummary = useStoreSelectorWithPaths(
  store,
  (s) => ({
    count: s.cart.items.length,
    total: s.cart.total,
    hasDiscount: s.cart.discount > 0
  }),
  { dependsOn: [['cart', 'items'], ['cart', 'total'], ['cart', 'discount']] }
);
```

## Path Format Reference

### Path Type Definition

```typescript
type StorePath = (string | number)[];
```

- **string**: Object property keys
- **number**: Array indices

### Path Examples

| State Access | Path |
|-------------|------|
| `state.user` | `['user']` |
| `state.user.name` | `['user', 'name']` |
| `state.user.profile.address.city` | `['user', 'profile', 'address', 'city']` |
| `state.items[0]` | `['items', 0]` |
| `state.items[1].name` | `['items', 1, 'name']` |
| `state.matrix[0][1]` | `['matrix', 0, 1]` |

### Path String Normalization (JSON Pointer RFC 6901)

Internally, paths are converted to JSON Pointer strings (RFC 6901) for efficient prefix matching:

```typescript
['user', 'name']           → '/user/name'
['items', 0]               → '/items/0'
['items', 1, 'name']       → '/items/1/name'
['matrix', 0, 1]           → '/matrix/0/1'
[]                         → '' (empty string = root/whole document)
['']                       → '/' (empty string key)
```

**Special Character Escaping (RFC 6901 Section 3):**

Keys containing `~` or `/` are escaped. The order matters - `~` must be escaped first:
- `~` → `~0`
- `/` → `~1`

```typescript
['data', 'a/b']            → '/data/a~1b'
['config', 'key~value']    → '/config/key~0value'
['path/key', 'nested~val'] → '/path~1key/nested~0val'

// Edge case: key contains '~1' literally
['data', '~1']             → '/data/~01' (~ escaped to ~0, then 1 preserved)
```

**RFC 6901 Section 5 Examples:**

```typescript
// Given: { "m~n": 8, "a/b": 1, "": 0 }
pathToPointer(['m~n'])     → '/m~0n'    // evaluates to 8
pathToPointer(['a/b'])     → '/a~1b'    // evaluates to 1
pathToPointer([''])        → '/'        // evaluates to 0
```

**Path Boundary Matching:**

The matching algorithm correctly handles path boundaries:
```typescript
// '/user' does NOT match '/users' or '/userName'
// Only matches: '/user', '/user/name', '/user/profile/...'

isPointerPrefix('/user', '/user/name')  // true (valid parent)
isPointerPrefix('/user', '/users')       // false (different path)
isPointerPrefix('/user', '/userName')    // false (different path)
```

**Utility Functions (exported):**

```typescript
import {
  pathToPointer,
  pointerToPath,
  isPointerPrefix,
  escapeSegment,
  unescapeSegment
} from '@context-action/react';

// Convert path array to JSON Pointer string
pathToPointer(['user', 'name'])  // → '/user/name'

// Parse JSON Pointer back to path array
pointerToPath('/user/name')      // → ['user', 'name']

// Check prefix relationship
isPointerPrefix('/user', '/user/name')  // → true
```

## How Path Matching Works

A patch affects a subscribed path when:
1. **Exact match**: Patch path equals subscribed path
2. **Parent changed**: Patch path is prefix of subscribed path
3. **Child changed**: Subscribed path is prefix of patch path

```tsx
const store = createStore('app', {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark' }
  }
});

// Subscribing to ['user', 'profile', 'name']
// ✅ Affected by: patch to ['user', 'profile', 'name'] (exact)
// ✅ Affected by: patch to ['user', 'profile'] (parent)
// ✅ Affected by: patch to ['user'] (ancestor)
// ❌ NOT affected by: patch to ['user', 'settings'] (sibling)
// ❌ NOT affected by: patch to ['user', 'profile', 'age'] (sibling)
```

### Matching Algorithm

```
Patch: /user/name
├─ Subscribe /user/name         → Match (exact) ✓
├─ Subscribe /user              → Match (child changed) ✓
├─ Subscribe /user/name/first   → Match (parent changed) ✓
└─ Subscribe /settings          → No match ✗
```

## Array Operations and Patches

Understanding how array mutations generate patches is crucial for effective path subscriptions.

### Array Mutation Patch Patterns

| Operation | Patches Generated | Example |
|-----------|------------------|---------|
| `arr[i] = value` | `replace` at index | `{ path: ['items', 1], op: 'replace' }` |
| `arr[i].prop = value` | `replace` at nested path | `{ path: ['items', 1, 'name'], op: 'replace' }` |
| `arr.push(value)` | `add` at new index | `{ path: ['items', 3], op: 'add' }` |
| `arr.unshift(value)` | Multiple `replace` + `add` | Shifts all indices |
| `arr.splice(i, n)` | Multiple `replace` + `length` | Affects index i onwards |

### Detailed Patch Examples

```typescript
// 1. Direct index modification
store.update(draft => { draft.items[1].name = 'updated'; });
// Patch: [{ op: 'replace', path: ['items', 1, 'name'], value: 'updated' }]

// 2. Array push
store.update(draft => { draft.list.push(4); });
// Patch: [{ op: 'add', path: ['list', 3], value: 4 }]

// 3. Array unshift (inserts at beginning)
store.update(draft => { draft.list.unshift(0); });
// Patches:
//   [{ op: 'replace', path: ['list', 0], value: 0 },
//    { op: 'replace', path: ['list', 1], value: <old[0]> },
//    { op: 'add', path: ['list', 2], value: <old[1]> }]

// 4. Array splice (remove middle elements)
store.update(draft => { draft.list.splice(1, 2); });
// Patches:
//   [{ op: 'replace', path: ['list', 1], value: <old[3]> },
//    { op: 'replace', path: ['list', 'length'], value: 2 }]

// 5. Nested array
store.update(draft => { draft.matrix[0][1] = 99; });
// Patch: [{ op: 'replace', path: ['matrix', 0, 1], value: 99 }]
```

### Array Subscription Strategies

#### Strategy 1: Specific Index Subscription
```tsx
// Only re-renders when items[0] changes
const firstItem = useStorePath(store, ['items', 0]);

// ⚠️ Warning: Won't detect new items at index 0 after unshift
// Use this when array order is stable
```

#### Strategy 2: Entire Array Subscription
```tsx
// Re-renders on any items change (recommended for dynamic arrays)
const items = useStorePath(store, ['items']);

// ✅ Detects: push, pop, splice, unshift, index modifications
```

#### Strategy 3: Array Length + Specific Items
```tsx
// Subscribe to length for structural changes
const itemCount = useStorePath(store, ['items', 'length']);
const firstItem = useStorePath(store, ['items', 0]);

// Useful when you need both structure awareness and item access
```

### Nested Arrays (Matrix)

```tsx
const store = createStore('game', {
  board: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ]
});

// Subscribe to specific cell
const centerCell = useStorePath(store, ['board', 1, 1]); // value: 5

// Subscribe to entire row
const middleRow = useStorePath(store, ['board', 1]); // value: [4, 5, 6]

// Subscribe to entire board
const board = useStorePath(store, ['board']);
```

### Complex Nested Structures

```tsx
const store = createStore('app', {
  users: [
    { id: 1, profile: { name: 'John', tags: ['admin', 'active'] } },
    { id: 2, profile: { name: 'Jane', tags: ['user'] } }
  ]
});

// Deep path: users[0].profile.tags[1]
const firstUserSecondTag = useStorePath(store, ['users', 0, 'profile', 'tags', 1]);

// Object within array
const firstUserProfile = useStorePath(store, ['users', 0, 'profile']);

// Selector with path hints for computed values
const allTags = useStoreSelectorWithPaths(
  store,
  (s) => s.users.flatMap(u => u.profile.tags),
  { dependsOn: [['users']] }  // Subscribe to entire users array
);
```

## Custom Equality

Both hooks support custom equality functions:

```tsx
// With custom equality for complex objects
const position = useStorePath(store, ['player', 'position'], {
  equalityFn: (a, b) => a?.x === b?.x && a?.y === b?.y
});

// Shallow equality for objects
const config = useStoreSelectorWithPaths(
  store,
  (s) => s.config,
  {
    dependsOn: [['config']],
    equalityFn: shallowEqual
  }
);
```

## Store API: subscribeWithPatches

The underlying Store API that powers path-based hooks:

```typescript
import { createStore, type PatchAwareListener } from '@context-action/react';

const store = createStore('app', { count: 0, user: { name: 'John' } });

// Subscribe with patch awareness
const unsubscribe = store.subscribeWithPatches((patches) => {
  console.log('Patches:', patches);
  // [{ op: 'replace', path: ['count'], value: 1 }]
});

store.setValue({ ...store.getValue(), count: 1 });

// Get last patches
const lastPatches = store.getLastPatches();
```

## Performance Benefits

### Before (Selector Only)
```tsx
// Selector runs on EVERY state change
function ExpensiveComponent() {
  const result = useStoreSelector(store, (s) => {
    // This expensive computation runs every time ANY state changes
    return expensiveComputation(s.data);
  });
}
```

### After (Path-Based)
```tsx
// Selector only runs when 'data' path changes
function OptimizedComponent() {
  const result = useStoreSelectorWithPaths(
    store,
    (s) => expensiveComputation(s.data),
    { dependsOn: [['data']] }
  );
}
```

## Best Practices

### Do
- Use `useStorePath` for simple property access
- Use `useStoreSelectorWithPaths` when you need both transformation and optimization
- Specify precise `dependsOn` paths for better filtering
- Use array indices for specific array element subscriptions

### Avoid
- Using `useStorePath` when you need derived/computed values
- Omitting `dependsOn` when paths are known (falls back to every-change behavior)
- Over-specifying paths (subscribe to parent if multiple children are needed)

## Related Patterns

- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
- [Subscription Optimization](./subscription-optimization.md) - General optimization strategies
- [Memoization Patterns](./memoization-patterns.md) - Prevent unnecessary re-computations
- [Comparison Strategies](./comparison-strategies.md) - Choose the right comparison method
