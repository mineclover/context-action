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
9. [Business Logic Separation](#business-logic-separation)

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

## Business Logic Separation

### Overview

Separating business logic from UI components and state management is crucial for maintainability, testability, and scalability. The Context-Action framework supports this through modular business logic patterns with async process state management.

### Core Principles

1. **Pure Business Logic**: Business logic should be independent of React and store implementations
2. **State Machines**: Use explicit state transitions for complex async processes
3. **Progress Decoupling**: Separate progress updates from state changes using `notifyPath`
4. **Modular Design**: Business logic modules should be testable without UI

### Pattern 1: Business Logic Module

Create pure business logic classes or functions independent of React/stores:

```typescript
// ✅ Pure business logic module
class FileUploadService {
  /**
   * Validate file (pure function)
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large' };
    }
    return { valid: true };
  }

  /**
   * Upload with progress callbacks
   */
  async uploadFile(
    file: File,
    onProgress: (progress: number) => void
  ): Promise<{ fileId: string }> {
    // Upload implementation with progress tracking
    for (let i = 0; i <= 100; i += 10) {
      await delay(100);
      onProgress(i);
    }
    return { fileId: `file_${Date.now()}` };
  }

  /**
   * Complete workflow orchestration
   */
  async completeUpload(
    file: File,
    callbacks: {
      onStateChange: (state: ProcessState) => void;
      onProgress: (progress: number) => void;
    }
  ): Promise<UploadResult> {
    try {
      callbacks.onStateChange('validating');
      const validation = this.validateFile(file);
      if (!validation.valid) {
        callbacks.onStateChange('error');
        return { success: false, error: validation.error };
      }

      callbacks.onStateChange('uploading');
      const { fileId } = await this.uploadFile(file, callbacks.onProgress);

      callbacks.onStateChange('complete');
      return { success: true, fileId };
    } catch (error) {
      callbacks.onStateChange('error');
      return { success: false, error: error.message };
    }
  }
}
```

**Benefits**:
- ✅ Testable without React or stores
- ✅ Reusable across different UI frameworks
- ✅ Clear separation of concerns
- ✅ Easy to mock and test

**Test Reference**: See `packages/react/__tests__/stores/notifyPath-async-process.test.tsx`
- `describe('Business Logic Separation')` - Pure business logic without dependencies
- `FileUploadService` class implementation

### Pattern 2: Async Process State Machine

Use explicit state types and transitions for complex async workflows:

```typescript
// State machine type
type ProcessState =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error';

// Store with state machine
const processStore = createTimeTravelStore('process', {
  state: 'idle' as ProcessState,
  progress: { percentage: 0, bytesUploaded: 0, totalBytes: 0 },
  error: null as string | null,
  result: null as UploadResult | null
}, { mutable: true });

// State transitions with notifyPath
async function executeUpload(file: File) {
  const uploadService = new FileUploadService();

  await uploadService.completeUpload(file, {
    // State transition (notifyPath only)
    onStateChange: (state) => {
      const current = processStore.getValue();
      current.state = state;
      processStore.notifyPath(['state']);
    },

    // Progress update (notifyPath only)
    onProgress: (percentage) => {
      const current = processStore.getValue();
      current.progress.percentage = percentage;
      processStore.notifyPath(['progress', 'percentage']);
    }
  });
}
```

**State Machine Benefits**:
- ✅ Explicit state transitions
- ✅ Easy to visualize workflow
- ✅ Prevents invalid states
- ✅ Facilitates debugging

**Test Reference**: See `packages/react/__tests__/stores/notifyPath-async-process.test.tsx`
- `describe('Async Process State Machine')` - State machine pattern with notifyPath
- `it('proves state machine pattern with notifyPath for state-only updates')` - Full workflow test

### Pattern 3: Progress-Only Updates

Decouple progress updates from state changes for maximum performance:

```typescript
const uploadStore = createTimeTravelStore('upload', {
  state: 'uploading' as ProcessState,
  progress: { current: 0, total: 100 },
  file: null as File | null
}, { mutable: true });

// Component subscribes to specific paths
function UploadProgress() {
  // Only re-renders when progress changes
  const progress = useStorePath(uploadStore, ['progress']);
  return <ProgressBar value={progress.current} max={progress.total} />;
}

function UploadState() {
  // Only re-renders when state changes
  const state = useStorePath(uploadStore, ['state']);
  return <StatusText state={state} />;
}

// Update progress WITHOUT triggering state re-render
function updateProgress(current: number) {
  const store = uploadStore.getValue();
  store.progress.current = current;
  // Only UploadProgress component re-renders
  uploadStore.notifyPath(['progress', 'current']);
}

// Update state WITHOUT triggering progress re-render
function updateState(newState: ProcessState) {
  const store = uploadStore.getValue();
  store.state = newState;
  // Only UploadState component re-renders
  uploadStore.notifyPath(['state']);
}
```

**Progress Decoupling Benefits**:
- ✅ 100% re-render efficiency (no wasted renders)
- ✅ High-frequency updates without performance cost
- ✅ Independent component subscriptions
- ✅ Optimal for progress bars, loading indicators

**Test Reference**: See `packages/react/__tests__/stores/notifyPath-async-process.test.tsx`
- `describe('Async Process State Machine')` - Progress-only updates test
- `it('proves progress-only updates do not trigger state re-renders')` - 10 progress updates, 0 state renders

### Pattern 4: Modular Integration

Integrate business logic, state management, and UI with clear boundaries:

```typescript
// 1. Business Logic Layer (no dependencies)
const uploadService = new FileUploadService();

// 2. State Management Layer
const uploadFlowStore = createTimeTravelStore('uploadFlow', {
  files: [] as Array<{ id: string; state: ProcessState; progress: number }>,
  activeUpload: null as { fileId: string; state: ProcessState } | null
}, { mutable: true });

// 3. Orchestration Layer (connects business logic + state)
async function processUploadQueue(files: File[]) {
  const state = uploadFlowStore.getValue();

  for (const file of files) {
    const fileId = `file_${Date.now()}`;

    // Add to queue
    state.files.push({ id: fileId, state: 'idle', progress: 0 });
    uploadFlowStore.notifyPath(['files']);

    // Set active
    state.activeUpload = { fileId, state: 'uploading' };
    uploadFlowStore.notifyPath(['activeUpload']);

    // Execute business logic
    await uploadService.completeUpload(file, {
      onStateChange: (uploadState) => {
        const current = uploadFlowStore.getValue();
        if (current.activeUpload) {
          current.activeUpload.state = uploadState;
          uploadFlowStore.notifyPath(['activeUpload', 'state']);
        }
      },
      onProgress: (percentage) => {
        const current = uploadFlowStore.getValue();
        const fileIndex = current.files.findIndex(f => f.id === fileId);
        if (fileIndex >= 0) {
          current.files[fileIndex].progress = percentage;
          uploadFlowStore.notifyPath(['files', fileIndex, 'progress']);
        }
      }
    });

    // Complete
    state.activeUpload = null;
    uploadFlowStore.notifyPath(['activeUpload']);
  }
}

// 4. UI Layer (pure presentation)
function UploadQueue() {
  const files = useStorePath(uploadFlowStore, ['files']);
  return (
    <div>
      {files.map(file => (
        <FileItem key={file.id} file={file} />
      ))}
    </div>
  );
}

function FileItem({ file }) {
  return (
    <div>
      <span>{file.state}</span>
      <ProgressBar value={file.progress} />
    </div>
  );
}
```

**Integration Benefits**:
- ✅ Business logic testable in isolation
- ✅ State management decoupled from business logic
- ✅ UI components are pure presentation
- ✅ Clear separation of concerns
- ✅ Each layer independently testable

**Test Reference**: See `packages/react/__tests__/stores/notifyPath-async-process.test.tsx`
- `describe('Modular Business Logic Integration')` - Complete integration test
- `it('proves integration of business logic, state management, and selective rendering')` - Full layer separation proof

### Pattern 5: Error Handling with State Machine

Handle errors through explicit state transitions:

```typescript
const errorStore = createTimeTravelStore('error', {
  state: 'idle' as ProcessState,
  error: null as { code: string; message: string } | null,
  retryCount: 0,
  maxRetries: 3
}, { mutable: true });

async function executeWithErrorHandling(operation: () => Promise<void>) {
  const state = errorStore.getValue();

  try {
    state.state = 'processing';
    state.error = null;
    errorStore.notifyPaths([['state'], ['error']]);

    await operation();

    state.state = 'complete';
    state.retryCount = 0;
    errorStore.notifyPaths([['state'], ['retryCount']]);

  } catch (error) {
    state.state = 'error';
    state.error = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message
    };
    state.retryCount++;

    errorStore.notifyPaths([
      ['state'],
      ['error'],
      ['retryCount']
    ]);

    // Auto-retry logic
    if (state.retryCount < state.maxRetries) {
      await delay(1000 * state.retryCount); // Exponential backoff
      await executeWithErrorHandling(operation);
    }
  }
}
```

**Error Handling Benefits**:
- ✅ Explicit error states
- ✅ Retry logic with backoff
- ✅ Error details tracked
- ✅ Clear failure recovery paths

**Test Reference**: See `packages/react/__tests__/stores/notifyPath-async-process.test.tsx`
- `describe('Error Handling with State Machine')` - Error state management test
- `it('proves error state management with notifyPath')` - Validation error handling

### Pattern 6: Multi-file Queue Management

Complex workflow with multiple concurrent operations:

```typescript
const queueStore = createTimeTravelStore('queue', {
  queue: [] as Array<{
    id: string;
    state: ProcessState;
    progress: number;
    error: string | null;
  }>,
  processing: false,
  currentIndex: -1,
  completedCount: 0,
  failedCount: 0
}, { mutable: true });

async function processQueue(files: File[]) {
  const state = queueStore.getValue();

  // Initialize queue
  state.queue = files.map((file, i) => ({
    id: `file_${i}`,
    state: 'idle' as ProcessState,
    progress: 0,
    error: null
  }));
  state.processing = true;
  queueStore.notifyPaths([['queue'], ['processing']]);

  // Process each file
  for (let i = 0; i < files.length; i++) {
    state.currentIndex = i;
    state.queue[i].state = 'uploading';
    queueStore.notifyPaths([
      ['currentIndex'],
      ['queue', i, 'state']
    ]);

    try {
      await uploadService.uploadFile(files[i], (progress) => {
        // Progress-only update
        state.queue[i].progress = progress;
        queueStore.notifyPath(['queue', i, 'progress']);
      });

      state.queue[i].state = 'complete';
      state.completedCount++;
      queueStore.notifyPaths([
        ['queue', i, 'state'],
        ['completedCount']
      ]);

    } catch (error) {
      state.queue[i].state = 'error';
      state.queue[i].error = error.message;
      state.failedCount++;
      queueStore.notifyPaths([
        ['queue', i, 'state'],
        ['queue', i, 'error'],
        ['failedCount']
      ]);
    }
  }

  state.processing = false;
  state.currentIndex = -1;
  queueStore.notifyPaths([['processing'], ['currentIndex']]);
}
```

**Queue Management Benefits**:
- ✅ Per-item state tracking
- ✅ Selective path updates
- ✅ Batch notifications with `notifyPaths`
- ✅ No unnecessary re-renders
- ✅ Global queue status tracking

**Test Reference**: See `packages/react/__tests__/stores/notifyPath-async-process.test.tsx`
- `describe('Complex Workflow: Multi-file Upload Queue')` - Queue management test
- `it('proves complex async workflow with queue management')` - 3 files, 5 progress updates each

### Testing Business Logic

```typescript
// Test business logic WITHOUT React or stores
describe('FileUploadService', () => {
  it('validates file size', () => {
    const service = new FileUploadService();
    const largeFile = new File(['x'.repeat(20 * 1024 * 1024)], 'huge.pdf');

    const result = service.validateFile(largeFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('uploads with progress tracking', async () => {
    const service = new FileUploadService();
    const file = new File(['content'], 'test.pdf');
    const progressUpdates: number[] = [];

    await service.uploadFile(file, (progress) => {
      progressUpdates.push(progress);
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });
});
```

### Performance Characteristics

**Traditional setValue Approach**:
```typescript
// ❌ Multiple re-renders for single operation
store.setValue({ ...state, loading: true });    // Re-render 1
store.setValue({ ...state, progress: 50 });     // Re-render 2
store.setValue({ ...state, loading: false });   // Re-render 3
// Total: 3 re-renders
```

**Optimized notifyPath Approach**:
```typescript
// ✅ Selective updates, minimal re-renders
state.loading = true;
store.notifyPath(['loading']);                  // Notification only

state.progress = 50;
store.notifyPath(['progress']);                 // Progress update only

state.loading = false;
store.setValue(state);                          // Final re-render
// Total: 1 re-render + 2 selective notifications
```

### Best Practices Summary

1. **Separate Business Logic**: Keep business logic independent of React/stores
2. **Use State Machines**: Explicit states for complex async workflows
3. **Decouple Progress**: Use `notifyPath` for progress without state changes
4. **Path-based Subscriptions**: `useStorePath` for selective re-rendering
5. **Batch Updates**: Use `notifyPaths` for multiple path updates
6. **Test in Isolation**: Unit test business logic without UI dependencies
7. **Clear Boundaries**: Business → State → UI layer separation
8. **Error States**: Explicit error handling through state machine

### Related Documentation

**Performance & Testing**:
- [Performance Proof](./notifyPath-performance-proof.md) - Mathematical performance proofs (50% re-render reduction, RAF batching, etc.)
- [Async Process Tests](../../packages/react/__tests__/stores/notifyPath-async-process.test.tsx) - Comprehensive test suite with 6 test categories:
  - Business Logic Separation - Pure business logic without dependencies
  - Async Process State Machine - State transitions with notifyPath
  - Progress-Only Updates - Selective re-rendering proof
  - Modular Business Logic Integration - Full layer separation
  - Error Handling - Validation and error states
  - Multi-file Queue Management - Complex concurrent workflows
- [Performance Tests](../../packages/react/__tests__/stores/notifyPath-performance.test.tsx) - Re-render reduction, RAF batching, selective rendering benchmarks

**Architecture & Patterns**:
- [Event Loop Control](#event-loop-control) - Integration patterns with Action Handlers and RefContext
- [Main Conventions](./conventions.md) - Overall framework conventions
- [Hooks Reference](./hooks-reference.md) - Complete hooks documentation

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
