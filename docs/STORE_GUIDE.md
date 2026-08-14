# Historical Store System Notes

> **Status:** This page is retained for historical context and is not the
> versioned public Store specification. Use the current Store pattern guides and
> generated API reference when implementing new code. Performance depends on
> the application's update shape, subscription topology, and browser/runtime;
> this document does not establish a quantitative performance guarantee.

## Store Types Overview

The Context-Action framework provides two main store types:

| Store Type | Use Case | Features |
|------------|----------|----------|
| **Store** | Standard state management | RAF batching, shallow equality, patches |
| **TimeTravelStore** | Undo/redo + High-performance | All Store features + Time travel + Structural sharing |

## TimeTravelStore Usage Patterns

### Pattern 1: Full Time Travel (with Undo/Redo)

Use when you need undo/redo functionality (text editors, drawing apps, form builders):

```typescript
import { createTimeTravelStore } from '@context-action/react';

const editorStore = createTimeTravelStore('editor',
  { content: '', cursor: 0 },
  {
    maxHistory: 50,        // Keep 50 history entries
    mutable: true,         // Enable structural sharing
    notificationMode: 'batched'  // RAF batching (default: 'immediate')
  }
);

// Use time travel methods
editorStore.setValue({ content: 'Hello', cursor: 5 });
editorStore.setValue({ content: 'Hello World', cursor: 11 });

editorStore.undo();  // Back to 'Hello'
editorStore.redo();  // Forward to 'Hello World'

console.log(editorStore.canUndo());  // true
console.log(editorStore.canRedo());  // false
```

### Pattern 2: High-Performance Mode (NO Undo/Redo)

Use when you need structural sharing and performance but don't need undo/redo:

```typescript
import { createTimeTravelStore } from '@context-action/react';

const dashboardStore = createTimeTravelStore('dashboard',
  {
    data: { users: [], metrics: {} },
    ui: { loading: false, selectedId: null }
  },
  {
    maxHistory: 0,         // ⚡ Disable history tracking (no overhead)
    mutable: true,         // ✅ Enable structural sharing
    notificationMode: 'batched'  // ✅ RAF batching for performance
  }
);

// Update with structural sharing (unchanged parts keep same reference)
dashboardStore.update(draft => {
  draft.ui.loading = true;  // Only ui.loading reference changes
  // data keeps the same reference!
});

// Don't use undo/redo methods (maxHistory: 0 means no history)
// dashboardStore.undo();  // ❌ Won't work (no history)
```

**Benefits of maxHistory: 0**:
- ✅ Zero memory overhead for history
- ✅ Structural sharing for selective re-rendering
- ✅ All other Store features (patches, notifyPath, RAF batching)
- ✅ Can reduce history bookkeeping; measure high-frequency behavior in the
  target application before adopting it as a performance strategy

## Disabling Undo/Redo: Configuration Options

### Option 1: maxHistory: 0 (Recommended)

**Complete disable** - No history tracking at all:

```typescript
const store = createTimeTravelStore('app', initialValue, {
  maxHistory: 0,        // ✅ Disable completely
  mutable: true,        // Optional: enable structural sharing
});

// Time travel methods become no-ops
store.undo();      // Does nothing
store.canUndo();   // Always false
```

**When to use**:
- High-performance scenarios (dashboards, real-time data)
- Large state trees with frequent updates
- When undo/redo is not needed
- Memory-constrained environments

### Option 2: maxHistory: 1 (Minimal History)

**Single-level undo** - Keeps only last state:

```typescript
const store = createTimeTravelStore('app', initialValue, {
  maxHistory: 1,        // Keep only 1 history entry
  mutable: true,
});

store.setValue(state1);
store.setValue(state2);
store.setValue(state3);

store.undo();     // Go back to state2 only
store.undo();     // Can't go further (only 1 entry)
```

**When to use**:
- Need minimal undo capability
- Want to save memory but keep basic recovery
- Form validation with single-step undo

### Option 3: Custom maxHistory (Default: 50)

**Limited history** - Balance between features and memory:

```typescript
const store = createTimeTravelStore('app', initialValue, {
  maxHistory: 10,       // Keep 10 history entries
  mutable: true,
});
```

**When to use**:
- Production apps with undo/redo
- Known undo depth requirements
- Memory budget constraints

## Notification Modes

Control when listeners are notified:

### Batched Mode (Default for Production)

```typescript
const store = createTimeTravelStore('app', initialValue, {
  notificationMode: 'batched',  // RAF-based batching
});

// Multiple updates in same frame = 1 notification
store.update(draft => { draft.a = 1; });
store.update(draft => { draft.b = 2; });
store.update(draft => { draft.c = 3; });
// → Only 1 re-render in next RAF frame
```

**Benefits**:
- ⚡ 5x fewer re-renders in high-frequency scenarios
- 🎯 Automatic optimization
- 📊 Better performance metrics

### Immediate Mode (Testing/Critical Updates)

```typescript
const store = createTimeTravelStore('app', initialValue, {
  notificationMode: 'immediate',  // Synchronous notifications
});

store.update(draft => { draft.count++; });
// → Immediate re-render (no RAF delay)
```

**When to use**:
- Unit testing (predictable timing)
- Critical real-time updates
- Debugging (easier to trace)

## Best Practices

### ✅ DO

```typescript
// Use maxHistory: 0 for high-performance scenarios
const store = createTimeTravelStore('dashboard', data, {
  maxHistory: 0,
  mutable: true,
  notificationMode: 'batched'
});

// Use appropriate maxHistory for undo/redo features
const editorStore = createTimeTravelStore('editor', content, {
  maxHistory: 50,  // Keep 50 undo levels
  mutable: true
});
```

### ❌ DON'T

```typescript
// Don't use high maxHistory for non-undo scenarios
const store = createTimeTravelStore('data', data, {
  maxHistory: 1000  // ❌ Wastes memory if not using undo/redo
});

// Don't call undo/redo when maxHistory: 0
const store = createTimeTravelStore('app', data, { maxHistory: 0 });
store.undo();  // ❌ No-op, confusing code
```

## Migration from MutableStore

The `MutableStore` class has been removed. Use `TimeTravelStore` with `maxHistory: 0`:

```typescript
// Before (MutableStore - removed)
const store = createMutableStore('app', initialValue, {
  notificationMode: 'batched'
});

// After (TimeTravelStore)
const store = createTimeTravelStore('app', initialValue, {
  maxHistory: 0,              // Disable undo/redo
  mutable: true,              // Enable structural sharing
  notificationMode: 'batched' // Same batching behavior
});
```

**Why the change?**
- Simplified API (one less class to learn)
- Same performance characteristics
- More flexible (can enable undo later if needed)
