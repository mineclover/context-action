# Store Conventions

Complete conventions for Store, TimeTravelStore, and MutableStore patterns in the Context-Action framework.

## 📋 Table of Contents

1. [Store Types Overview](#store-types-overview)
2. [Store (Default)](#store-default)
3. [TimeTravelStore](#timetravelstore)
4. [MutableStore Pattern](#mutablestore-pattern)
5. [notifyPath/notifyPaths API](#notifypathnotifypaths-api)
6. [Event Loop Control](#event-loop-control)
7. [Performance Guidelines](#performance-guidelines)
8. [Best Practices](#best-practices)

---

## Store Types Overview

Context-Action Framework provides three specialized Store implementations:

| Store Type | Implementation | Key Features | Use Case |
|------------|---------------|--------------|----------|
| **Store** | `createStore()` | Immutability + Deep Freeze | General state, forms, settings |
| **TimeTravelStore** | `createTimeTravelStore()` | Undo/Redo + Structural Sharing | Text editors, drawing apps |
| **MutableStore** | TimeTravelStore without undo/redo | Structural Sharing + Performance | High-frequency updates, large trees |

### Quick Selection Guide

```typescript
// ✅ Use Store for: General state, forms, settings
const formStore = createStore('form', { name: '', email: '' });

// ✅ Use TimeTravelStore for: Undo/redo features
const editorStore = createTimeTravelStore('editor', { content: '' });

// ✅ Use MutableStore Pattern for: High-performance without undo/redo
// (TimeTravelStore with mutable mode, undo/redo not used)
const dashboardStore = createTimeTravelStore('dashboard', {
  widgets: [...],
  layout: {...}
}, { mutable: true });
```

---

## Store (Default)

### Overview

Standard store with full immutability guarantees and safety features.

```typescript
import { createStore } from '@context-action/react';

const userStore = createStore('user', { name: '', email: '' });
```

### Features

- **Deep Freeze**: Values frozen to prevent accidental mutations
- **Copy-on-Write**: Efficient cloning with version-based caching
- **RAF Batching**: Multiple updates batched into single frame
- **Error Recovery**: Automatic problematic listener removal
- **Concurrency Protection**: Update queue prevents race conditions
- **notifyPath/notifyPaths**: Manual event control API

### Core API

```typescript
// Create store
const store = createStore('name', initialValue);

// Read value
const value = store.getValue();
const snapshot = store.getSnapshot();

// Update value
store.setValue(newValue);
store.update(draft => { draft.prop = value; });

// Subscribe
const unsubscribe = store.subscribe(() => {
  console.log('Store updated');
});

// Manual notifications
store.notifyPath(['nested', 'property']);
store.notifyPaths([['path1'], ['path2']]);
```

### React Integration

```typescript
import { useStoreValue } from '@context-action/react';

function UserComponent() {
  const userStore = useUserStore('profile');

  // ✅ Reactive subscription
  const user = useStoreValue(userStore);

  // ✅ Update
  const updateName = () => {
    userStore.update(draft => { draft.name = 'New Name'; });
  };

  return <div>{user.name}</div>;
}
```

### When to Use

- General state management
- Forms and settings
- Cached data
- When immutability guarantees are critical
- When using `useStoreValue()` subscriptions

---

## TimeTravelStore

### Overview

Store with built-in undo/redo functionality powered by history management.

```typescript
import { createTimeTravelStore } from '@context-action/react';

const editorStore = createTimeTravelStore('editor',
  { content: '', cursor: 0 },
  { maxHistory: 50, mutable: true }
);
```

### Features

- **Undo/Redo**: Full history navigation
- **Structural Sharing**: Unchanged parts keep same reference
- **Configurable History**: `maxHistory` option
- **Patch-based Updates**: Efficient change tracking via JSON patches
- **notifyPath/notifyPaths**: Manual event control API

### Core API

```typescript
// Time travel controls
editorStore.undo();        // Go back one step
editorStore.redo();        // Go forward one step
editorStore.goTo(3);       // Jump to specific position
editorStore.reset();       // Reset to initial state

// Check capabilities
if (editorStore.canUndo()) { /* ... */ }
if (editorStore.canRedo()) { /* ... */ }

// Get controls for UI
const { canUndo, canRedo, position, history } = editorStore.getTimeTravelControls();
```

### React Integration

**⚠️ CRITICAL**: Use `useStorePath()`, NOT `useStoreValue()`

```typescript
import { useStorePath, useTimeTravelControls } from '@context-action/react';

function Editor() {
  const editorStore = useEditorStore('document');

  // ✅ CORRECT: useStorePath for structural sharing
  const content = useStorePath(editorStore, ['content']);
  const cursor = useStorePath(editorStore, ['cursor']);

  // ❌ WRONG: useStoreValue won't detect changes
  // const state = useStoreValue(editorStore);

  // Time travel controls
  const { canUndo, canRedo, undo, redo } = useTimeTravelControls(editorStore);

  return (
    <div>
      <textarea value={content} />
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

### Subscription Pattern

```typescript
// TimeTravelStore uses structural sharing
// Top-level reference doesn't change, nested references do

// ❌ WRONG: Won't detect nested changes
const state = useStoreValue(editorStore);

// ✅ CORRECT: Detects nested reference changes
const content = useStorePath(editorStore, ['content']);
const cursor = useStorePath(editorStore, ['cursor']);
```

### When to Use

- Text editors, drawing applications
- Form wizards with back/forward navigation
- Any feature requiring undo/redo
- Debugging with state history
- When history tracking is essential

---

## MutableStore Pattern

### Overview

**Definition**: TimeTravelStore with `mutable: true` where undo/redo functionality is NOT used.

This pattern provides **structural sharing** and **high performance** without the overhead of history tracking, while still maintaining the technical capability.

```typescript
import { createTimeTravelStore } from '@context-action/react';

// MutableStore Pattern: TimeTravelStore without using undo/redo
const dashboardStore = createTimeTravelStore('dashboard', {
  user: { name: 'John', settings: { theme: 'dark' } },
  ui: { sidebar: { isOpen: true } }
}, {
  mutable: true  // Enable structural sharing (default)
  // Note: undo/redo methods exist but are not used
});
```

### Key Characteristics

1. **Structural Sharing**: Unchanged parts keep same reference
2. **No Undo/Redo Usage**: History methods available but ignored
3. **Performance Focus**: Optimized for high-frequency updates
4. **notifyPath/notifyPaths**: Advanced event control

### Why Not a Separate Implementation?

- TimeTravelStore already provides structural sharing via `mutable: true`
- Simply don't call `undo()`, `redo()`, `goTo()` methods
- Avoids code duplication and maintenance overhead
- History can be enabled later if needed

### Usage Pattern

```typescript
// ✅ MutableStore Pattern: TimeTravelStore without undo/redo
const appStore = createTimeTravelStore('app', {
  user: { name: 'John', status: 'online' },
  ui: { loading: false, progress: 0 }
}, { mutable: true });

// Use structural sharing for selective re-renders
const userName = useStorePath(appStore, ['user', 'name']);
const uiLoading = useStorePath(appStore, ['ui', 'loading']);

// Update with efficient structural sharing
appStore.update(draft => {
  draft.user.name = 'Jane';
  // Only ['user', 'name'] path triggers re-render
  // ui.loading subscribers NOT re-rendered
});

// ⚠️ Don't use undo/redo methods
// appStore.undo();  // Available but not used in MutableStore pattern
// appStore.redo();  // Available but not used in MutableStore pattern
```

### Advanced: Manual Event Control

```typescript
// 🎯 Pattern: Direct mutation + notifyPath
async function loadUserData() {
  // Step 1: Notify loading UI (no state change)
  appStore.notifyPath(['ui', 'loading']);

  // Step 2: Fetch data
  const userData = await fetchUserData();

  // Step 3: Single update with final data
  appStore.update(draft => {
    draft.user = userData;
    draft.ui.loading = false;
  });
}

// 🎯 Pattern: External mutation + notification
function setupWebSocket() {
  ws.on('message', (data) => {
    const state = appStore.getValue();
    state.user.status = data.status; // Direct mutation
    appStore.notifyPath(['user', 'status']);
  });
}
```

### When to Use MutableStore Pattern

- High-frequency updates (animations, real-time data)
- Large state trees requiring selective re-rendering
- Performance-sensitive applications
- External system integration (WebSocket, etc.)
- When undo/redo is NOT needed

### Performance Benefits

```typescript
// Traditional approach: Multiple re-renders
userStore.update(draft => { draft.loading = true; });  // Re-render 1
const data = await fetch();
userStore.update(draft => {                             // Re-render 2
  draft.data = data;
  draft.loading = false;
});
// Total: 2 re-renders

// MutableStore Pattern with notifyPath: Single re-render
userStore.notifyPath(['loading']);                      // UI update (no re-render)
const data = await fetch();
userStore.update(draft => {                             // Re-render 1
  draft.data = data;
  draft.loading = false;
});
// Total: 1 re-render (50% reduction)
```

---

## notifyPath/notifyPaths API

### Overview

Manual event control API that decouples state changes from React updates.

```typescript
// Notify single path
store.notifyPath(['nested', 'property']);

// Notify multiple paths (batched in RAF)
store.notifyPaths([
  ['ui', 'loading'],
  ['ui', 'progress']
]);
```

### Core Concept

Traditional state management:
```
State Change → React Re-render
```

With notifyPath:
```
State Change (optional) → Manual Notification → Selective React Re-render
```

### Use Cases

#### 1. Loading States Without State Change

```typescript
async function loadData() {
  // Notify loading UI (no actual state change)
  store.notifyPath(['loading']);

  const data = await fetchData();

  // Single update with actual data
  store.setValue({ data, loading: false });
}
```

#### 2. External System Integration

```typescript
function setupWebSocket(store: IStore<AppState>) {
  ws.onmessage = (event) => {
    const state = store.getValue();

    // Direct mutation (vanilla JS)
    state.messages.push(event.data);

    // Notify React
    store.notifyPath(['messages']);
  };
}
```

#### 3. Batch Notifications

```typescript
function updateMultipleMetrics() {
  const state = store.getValue();

  // Update multiple properties
  state.ui.loading = false;
  state.ui.progress = 100;
  state.metrics.lastUpdate = Date.now();

  // Single batched notification
  store.notifyPaths([
    ['ui', 'loading'],
    ['ui', 'progress'],
    ['metrics', 'lastUpdate']
  ]);
}
```

### RAF Batching Behavior

All `notifyPath/notifyPaths` calls are batched in `requestAnimationFrame`:

```typescript
// These all batch into single RAF frame
store.notifyPath(['path1']);
store.notifyPath(['path2']);
store.notifyPaths([['path3'], ['path4']]);

// Result: Single React update cycle
```

---

## Event Loop Control

### Pattern 1: Action Handler + notifyPath

**Problem**: Multiple re-renders for loading + data

```typescript
// ❌ Traditional: 2 re-renders
useActionHandler('loadUser', async (payload) => {
  userStore.update(draft => { draft.loading = true; });  // Re-render 1
  const data = await fetchUser(payload.id);
  userStore.update(draft => {                             // Re-render 2
    draft.user = data;
    draft.loading = false;
  });
});
```

**Solution**: Manual event control

```typescript
// ✅ Optimized: 1 re-render (50% reduction)
useActionHandler('loadUser', async (payload) => {
  userStore.notifyPath(['loading']);                      // UI update only
  const data = await fetchUser(payload.id);
  userStore.update(draft => {                             // Single re-render
    draft.user = data;
    draft.loading = false;
  });
});
```

### Pattern 2: RefContext + notifyPath

Combine direct DOM manipulation with selective React updates:

```typescript
function ProgressDashboard() {
  const progressBar = useProgressRef('bar');
  const dashboardStore = useAppStore('dashboard');

  const updateProgress = useCallback((progress: number) => {
    // Step 1: Direct DOM (zero React overhead)
    if (progressBar.target) {
      progressBar.target.style.width = `${progress}%`;
    }

    // Step 2: Notify state subscribers
    dashboardStore.notifyPath(['ui', 'progress']);

    // Step 3: Update store for persistence
    const state = dashboardStore.getValue();
    state.ui.progress = progress;
  }, [progressBar, dashboardStore]);

  return (
    <div>
      <div ref={progressBar.setRef} className="progress-bar" />
      <ProgressStats /> {/* Only this re-renders */}
    </div>
  );
}
```

### Pattern 3: Preventing Infinite Loops

**Problem**: Subscription triggers action → action updates store → subscription triggers

```typescript
// ❌ INFINITE LOOP
useEffect(() => {
  return store.subscribe(() => {
    dispatch('onStoreChange', { data: store.getValue() });
  });
}, []);

useActionHandler('onStoreChange', (payload) => {
  store.setValue(processData(payload.data)); // Triggers subscription!
});
```

**Solution**: Use notifyPath to break the loop

```typescript
// ✅ SOLUTION
useEffect(() => {
  return store.subscribe(() => {
    const value = store.getValue();
    if (requiresProcessing(value)) {
      dispatch('onStoreChange', { data: value });
    }
  });
}, []);

useActionHandler('onStoreChange', (payload) => {
  const processed = processData(payload.data);

  // Direct mutation + notification (no subscription trigger)
  const state = store.getValue();
  state.processed = processed;
  store.notifyPath(['processed']);
});
```

---

## Performance Guidelines

### Subscription Strategy

```typescript
// ✅ Store: Use useStoreValue
const userStore = createStore('user', { name: '' });
const user = useStoreValue(userStore);

// ✅ TimeTravelStore/MutableStore: Use useStorePath
const editorStore = createTimeTravelStore('editor', { content: '' });
const content = useStorePath(editorStore, ['content']);

// ❌ WRONG: useStoreValue on TimeTravelStore
const state = useStoreValue(editorStore); // Won't detect changes!
```

### Update Strategy

```typescript
// For Store (immutable)
userStore.setValue({ name: 'John', email: 'john@example.com' });
userStore.update(draft => { draft.name = 'John'; });

// For TimeTravelStore/MutableStore (structural sharing)
editorStore.update(draft => {
  draft.content = 'New content';
  // Only ['content'] path re-renders
});
```

### Event Control Strategy

```typescript
// Use notifyPath for:
// 1. Loading states
store.notifyPath(['loading']);

// 2. External mutations
const state = store.getValue();
state.prop = externalValue;
store.notifyPath(['prop']);

// 3. Batch updates
store.notifyPaths([['path1'], ['path2']]);

// Don't use notifyPath for:
// - Regular state updates (use setValue/update)
// - When subscription to full state is needed
```

---

## Best Practices

### 1. Choose the Right Store Type

```typescript
// ✅ Store: Forms, settings, general state
const settingsStore = createStore('settings', { theme: 'dark' });

// ✅ TimeTravelStore: Undo/redo needed
const editorStore = createTimeTravelStore('editor', { content: '' });

// ✅ MutableStore Pattern: High-performance, no undo/redo
const dashboardStore = createTimeTravelStore('dashboard', {
  widgets: [...]
}, { mutable: true });
```

### 2. Use Correct Subscription Pattern

```typescript
// ✅ Store
const value = useStoreValue(store);

// ✅ TimeTravelStore/MutableStore
const content = useStorePath(store, ['content']);
const cursor = useStorePath(store, ['cursor']);
```

### 3. Leverage notifyPath for Performance

```typescript
// ✅ Reduce re-renders
store.notifyPath(['loading']);
const data = await fetch();
store.setValue({ data, loading: false });

// ✅ Batch notifications
store.notifyPaths([['path1'], ['path2']]);

// ✅ External integration
state.prop = externalValue;
store.notifyPath(['prop']);
```

### 4. Prevent Infinite Loops

```typescript
// ✅ Use notifyPath in subscriptions
store.subscribe(() => {
  const state = store.getValue();
  state.processed = process(state.raw);
  store.notifyPath(['processed']);
});

// ❌ Don't use setValue in subscriptions
store.subscribe(() => {
  store.setValue(process(store.getValue())); // LOOP!
});
```

### 5. Combine Patterns for Maximum Efficiency

```typescript
// ✅ RefContext + notifyPath + MutableStore
function OptimizedComponent() {
  const domRef = useProgressRef('element');
  const store = useDashboardStore('metrics');

  const update = useCallback((value: number) => {
    // Direct DOM (zero overhead)
    if (domRef.target) {
      domRef.target.style.width = `${value}%`;
    }

    // Notify subscribers
    store.notifyPath(['progress']);

    // Persist state
    const state = store.getValue();
    state.progress = value;
  }, [domRef, store]);

  return <div ref={domRef.setRef} />;
}
```

---

## Comparison Table

```
┌──────────────────────────┬───────────────┬──────────────────┬──────────────────┐
│ Feature                  │ Store         │ TimeTravelStore  │ MutableStore     │
├──────────────────────────┼───────────────┼──────────────────┼──────────────────┤
│ Implementation           │ createStore   │ createTimeTravel │ createTimeTravel │
│ Immutability             │ ✅ Deep Freeze │ ❌ Mutable Mode  │ ❌ Mutable Mode  │
│ Structural Sharing       │ ❌ No          │ ✅ Yes           │ ✅ Yes           │
│ Undo/Redo                │ ❌ No          │ ✅ Yes (used)    │ ✅ Yes (ignored) │
│ notifyPath/notifyPaths   │ ✅ Yes         │ ✅ Yes           │ ✅ Yes           │
│ useStoreValue()          │ ✅ Works       │ ❌ Won't Update  │ ❌ Won't Update  │
│ useStorePath()           │ ✅ Works       │ ✅ Required      │ ✅ Required      │
│ RAF Batching             │ ✅ Yes         │ ✅ Yes           │ ✅ Yes           │
│ Clone on getValue()      │ ✅ Default On  │ ❌ Default Off   │ ❌ Default Off   │
│ Manual Event Control     │ ✅ Yes         │ ✅ Yes           │ ✅ Yes           │
│ External Mutation        │ ⚠️ Not Safe    │ ✅ Safe          │ ✅ Safe          │
│ Use Case                 │ General state │ Undo/Redo apps   │ High performance │
└──────────────────────────┴───────────────┴──────────────────┴──────────────────┘
```

---

## Related Documentation

- [Main Conventions](./conventions.md) - Overall framework conventions
- [Hooks Reference](./hooks-reference.md) - Complete hooks documentation
- [Architecture Guide](./architecture-guide.md) - Framework architecture
- [Infinite Loop Issues](../../troubleshooting/infinite-loop-issues.md) - Troubleshooting guide
