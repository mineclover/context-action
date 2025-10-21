# Ref Event Handler Implementation

## 📋 Overview

Implement `useRefEventHandler` API to allow registering event-based callbacks on refs that execute automatically when specific lifecycle events occur.

## 🎯 Goal

Enable declarative event handling for ref lifecycle events (init, unmount, remount, update) with named callbacks that can be registered from anywhere in the component tree.

## 🔑 Key Concepts

### API Design

```typescript
const { addEventListener, removeEventListener } = useRefEventHandler();

// Register callback for specific ref + event type + callback name
addEventListener(
  'nextButton',           // refName: which ref to target
  'init',                 // eventType: when to execute
  'handleClick',          // callbackName: identifier for this callback
  (ref, context) => {     // callback: function to execute
    ref.onclick = (e) => {
      e.currentTarget.value = 'after';
    };

    // Optional cleanup function
    return () => {
      ref.onclick = null;
    };
  }
);

// Remove specific callback
removeEventListener('nextButton', 'init', 'handleClick');
```

### Event Types

| Event Type | Trigger Condition | Use Case |
|------------|------------------|----------|
| `init` | First mount of ref | Initial setup, event listeners, styling |
| `unmount` | Ref becomes null | Save state, analytics, cleanup |
| `remount` | Ref replaced with different DOM object | Dynamic component swaps, source changes |
| `update` | Same ref object re-set | Force re-initialization |

## 📐 Architecture

### Type Definitions

```typescript
// packages/react/src/refs/types.ts

export type RefEventType = 'init' | 'unmount' | 'update' | 'remount';

export type RefEventCallback<T = any> = (
  ref: T,
  context: RefEventContext<T>
) => void | (() => void);

export interface RefEventContext<T = any> {
  refName: string;
  eventType: RefEventType;
  previousRef?: T | null;
  isFirstMount: boolean;
  isRemount: boolean;
}

export type RefEventCallbackMap<T = any> = {
  [K in RefEventType]: Map<string, RefEventCallback<T>>;
};

export type RefEventCleanupMap = {
  [K in RefEventType]: Map<string, () => void>;
};

export interface InternalRefState<T = any> {
  // ... existing fields ...

  mountCount: number;
  eventCallbacks: RefEventCallbackMap<T>;
  eventCleanups: RefEventCleanupMap;
}
```

### Core Logic Flow

#### 1. Callback Registration

```typescript
addRefEventCallback(refName, eventType, callbackName, callback) {
  1. Get/create ref state
  2. If callback with same name exists:
     - Execute existing cleanup
     - Remove from cleanup map
  3. Register new callback in eventCallbacks[eventType]
  4. If eventType === 'init' && ref already mounted:
     - Execute callback immediately
  5. Return unregister function
}
```

#### 2. Event Execution (on setRefTarget)

```typescript
setRefTarget(refName, target) {
  if (target === null) {
    // UNMOUNT
    1. Execute all 'unmount' callbacks
    2. Execute all cleanups (init, update, remount)
    3. Update ref state
  } else {
    const isInitialMount = !wasInitiallyMounted;
    const isRemount = wasInitiallyMounted && previousTarget !== target;
    const isUpdate = wasInitiallyMounted && previousTarget === target;

    if (isInitialMount) {
      1. Set mountCount = 1
      2. Execute all 'init' callbacks
    } else if (isRemount) {
      1. Increment mountCount
      2. Execute cleanups for 'remount' event
      3. Execute all 'remount' callbacks
    } else if (isUpdate) {
      1. Execute cleanups for 'update' event
      2. Execute all 'update' callbacks
    }
  }
}
```

#### 3. Cleanup Strategy

```typescript
Event-specific cleanup maps:
- eventCleanups.init
- eventCleanups.unmount
- eventCleanups.update
- eventCleanups.remount

Cleanup execution:
- Before executing callbacks: clear that event's cleanups
- On unmount: execute ALL cleanups (init, update, remount)
- On callback removal: execute that callback's cleanup
- On Provider unmount: execute ALL cleanups for ALL refs
```

## 🛠 Implementation Tasks

### ✅ Phase 1: Type Definitions

- [x] Add `RefEventType` type
- [x] Add `RefEventCallback` type
- [x] Add `RefEventContext` interface
- [x] Add `RefEventCallbackMap` type
- [x] Add `RefEventCleanupMap` type
- [x] Extend `InternalRefState` with event fields

**File**: `packages/react/src/refs/types.ts`

### ✅ Phase 2: Helper Updates

- [ ] Update `getOrCreateRefState` to initialize event maps
  ```typescript
  eventCallbacks: {
    init: new Map(),
    unmount: new Map(),
    update: new Map(),
    remount: new Map()
  },
  eventCleanups: {
    init: new Map(),
    unmount: new Map(),
    update: new Map(),
    remount: new Map()
  },
  mountCount: 0
  ```

**File**: `packages/react/src/refs/helpers.ts`

### ✅ Phase 3: Core Logic Implementation

- [ ] Implement `addRefEventCallback` function
- [ ] Implement `removeRefEventCallback` function
- [ ] Implement `executeEventCallbacks` function
- [ ] Implement `executeEventCallback` function (single callback)
- [ ] Update `setRefTarget` to handle event execution
- [ ] Update Provider cleanup to clear all event callbacks/cleanups

**File**: `packages/react/src/refs/createRefContext.ts`

### ✅ Phase 4: Hook Implementation

- [ ] Create `useRefEventHandler` hook
- [ ] Export `addEventListener` function
- [ ] Export `removeEventListener` function
- [ ] Add to createRefContext return value

**File**: `packages/react/src/refs/createRefContext.ts`

### ✅ Phase 5: Export Updates

- [ ] Export `RefEventType` from types
- [ ] Export `RefEventCallback` from types
- [ ] Export `RefEventContext` from types
- [ ] Export `useRefEventHandler` from index

**Files**:
- `packages/react/src/refs/types.ts`
- `packages/react/src/refs/index.ts`

### ✅ Phase 6: Testing

- [ ] Test init event on first mount
- [ ] Test unmount event on ref removal
- [ ] Test remount event on ref replacement
- [ ] Test update event on same ref re-set
- [ ] Test cleanup execution
- [ ] Test multiple callbacks per event
- [ ] Test callback removal
- [ ] Test immediate execution for init on already-mounted ref
- [ ] Test error isolation between callbacks
- [ ] Test Provider unmount cleanup

**File**: `packages/react/src/refs/__tests__/useRefEventHandler.test.ts`

### ✅ Phase 7: Documentation

- [ ] Add JSDoc comments to all public APIs
- [ ] Create usage examples
- [ ] Document event types and when they trigger
- [ ] Document cleanup behavior
- [ ] Add to API reference docs

**Files**:
- Inline JSDoc in implementation files
- `docs/en/guide/patterns/ref/event-handlers.md` (new)

## 📝 Usage Examples

### Example 1: Basic Event Handling

```typescript
function ButtonEventHandlers() {
  const { addEventListener } = useRefEventHandler();

  useEffect(() => {
    const unsubscribers = [
      // Init: First mount
      addEventListener('nextButton', 'init', 'handleClick', (ref) => {
        ref.onclick = () => console.log('Clicked!');
        return () => { ref.onclick = null; };
      }),

      // Unmount: Save state
      addEventListener('nextButton', 'unmount', 'saveState', (ref) => {
        localStorage.setItem('buttonValue', ref.value);
      }),

      // Remount: Detect element change
      addEventListener('nextButton', 'remount', 'logChange', (ref, ctx) => {
        console.log('Button replaced!', ctx.previousRef, '→', ref);
      })
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [addEventListener]);

  return null;
}
```

### Example 2: Input Validation Injection

```typescript
function InputValidationInjector() {
  const { addEventListener } = useRefEventHandler();

  useEffect(() => {
    return addEventListener('emailInput', 'init', 'validation', (input) => {
      const validate = () => {
        const isValid = input.value.includes('@');
        input.classList.toggle('invalid', !isValid);
      };

      input.addEventListener('input', validate);
      input.addEventListener('blur', validate);

      return () => {
        input.removeEventListener('input', validate);
        input.removeEventListener('blur', validate);
      };
    });
  }, [addEventListener]);

  return null;
}
```

### Example 3: Video Analytics

```typescript
function VideoAnalytics() {
  const { addEventListener } = useRefEventHandler();

  useEffect(() => {
    const unsubscribers = [
      // Init: Setup tracking
      addEventListener('videoPlayer', 'init', 'analytics', (video) => {
        const onPlay = () => analytics.track('video_play');
        const onPause = () => analytics.track('video_pause');

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);

        return () => {
          video.removeEventListener('play', onPlay);
          video.removeEventListener('pause', onPause);
        };
      }),

      // Unmount: Save watch duration
      addEventListener('videoPlayer', 'unmount', 'saveStats', (video) => {
        analytics.track('video_session_end', {
          duration: video.currentTime
        });
      }),

      // Remount: Detect source change
      addEventListener('videoPlayer', 'remount', 'sourceChange', (video, ctx) => {
        if (ctx.previousRef?.src !== video.src) {
          analytics.track('video_source_changed');
          video.load();
        }
      })
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [addEventListener]);

  return null;
}
```

### Example 4: Conditional Registration

```typescript
function ConditionalEvents() {
  const { addEventListener, removeEventListener } = useRefEventHandler();
  const [enableAnalytics, setEnableAnalytics] = useState(true);

  useEffect(() => {
    if (enableAnalytics) {
      return addEventListener('submitButton', 'init', 'analytics', (button) => {
        button.addEventListener('click', () => analytics.track('submit'));
        return () => { /* cleanup */ };
      });
    } else {
      removeEventListener('submitButton', 'init', 'analytics');
    }
  }, [enableAnalytics, addEventListener, removeEventListener]);

  return (
    <button onClick={() => setEnableAnalytics(!enableAnalytics)}>
      Analytics: {enableAnalytics ? 'ON' : 'OFF'}
    </button>
  );
}
```

## 🔍 Edge Cases & Error Handling

### 1. Callback Errors
- Wrap each callback execution in try-catch
- Log error with context (refName, eventType, callbackName)
- Continue executing other callbacks

### 2. Cleanup Errors
- Wrap cleanup execution in try-catch
- Log error but don't throw
- Ensure all cleanups execute even if one fails

### 3. Multiple Callbacks with Same Name
- New registration replaces old one
- Execute old cleanup before registering new callback
- Warn in development mode

### 4. Registration on Already-Mounted Ref
- For 'init' event: execute callback immediately
- For other events: wait for next trigger

### 5. Provider Unmount
- Execute all cleanups for all events for all refs
- Clear all callback maps
- Clear all cleanup maps

### 6. Callback Removal During Execution
- Safe to remove callbacks during event execution
- Cleanup executes before removal

## 🎨 Design Decisions

### Why Named Callbacks?

**Problem**: Multiple components might want to register the same type of handler on the same ref.

**Solution**: Use callback names to allow multiple independent handlers.

```typescript
// Component A
addEventListener('button', 'init', 'analytics', ...);

// Component B
addEventListener('button', 'init', 'tooltip', ...);

// Both coexist without conflict
```

### Why Event-Specific Cleanup Maps?

**Problem**: Different events have different cleanup lifecycles.

**Solution**: Separate cleanup maps allow fine-grained cleanup control.

```typescript
// init cleanup: cleared on unmount
// unmount cleanup: cleared after unmount execution
// remount cleanup: cleared on each remount
// update cleanup: cleared on each update
```

### Why Immediate Execution for Init?

**Problem**: Registering init callback after ref already mounted would never execute.

**Solution**: Execute init callbacks immediately if ref is already mounted.

```typescript
if (eventType === 'init' && refState.isMounted) {
  executeEventCallback(...);
}
```

## 📊 Performance Considerations

### Memory Usage
- 4 Maps per ref (event callbacks)
- 4 Maps per ref (event cleanups)
- Typical: ~10 refs × 8 maps = 80 Map objects
- Negligible overhead for most apps

### Execution Performance
- O(n) where n = number of callbacks for that event
- Typically 1-3 callbacks per event
- No performance impact on normal ref usage

### Optimization Opportunities
1. Lazy map creation (only create maps when needed)
2. Callback pooling (reuse callback wrappers)
3. Batch cleanup execution (use microtask queue)

## 🚀 Future Enhancements

### 1. Wildcard Event Listeners
```typescript
// Listen to all events for a ref
addEventListener('button', '*', 'logger', (ref, ctx) => {
  console.log(`Event: ${ctx.eventType}`);
});
```

### 2. Event Filters
```typescript
addEventListener('button', 'init', 'conditional', (ref, ctx) => {
  // Only execute if condition met
}, {
  filter: (ref, ctx) => ref.dataset.enabled === 'true'
});
```

### 3. Priority-Based Execution
```typescript
addEventListener('button', 'init', 'highPriority', callback, {
  priority: 10
});
```

### 4. Async Callbacks
```typescript
addEventListener('button', 'init', 'asyncInit', async (ref) => {
  await fetchData();
  ref.textContent = 'Loaded';
});
```

## ✅ Acceptance Criteria

- [x] API design complete
- [ ] All types defined
- [ ] Core logic implemented
- [ ] Hook created and exported
- [ ] All 4 event types working correctly
- [ ] Cleanup logic verified
- [ ] Error handling in place
- [ ] Tests written and passing
- [ ] Documentation complete
- [ ] Examples added

## 📅 Timeline

- **Phase 1-2**: Type definitions & helpers (~30 min)
- **Phase 3**: Core logic implementation (~2 hours)
- **Phase 4**: Hook implementation (~30 min)
- **Phase 5**: Exports (~15 min)
- **Phase 6**: Testing (~1.5 hours)
- **Phase 7**: Documentation (~1 hour)

**Total Estimated Time**: ~5.5 hours

## 🔗 Related Files

- `packages/react/src/refs/types.ts` - Type definitions
- `packages/react/src/refs/helpers.ts` - Helper functions
- `packages/react/src/refs/createRefContext.ts` - Main implementation
- `packages/react/src/refs/index.ts` - Exports
- `packages/react/src/refs/__tests__/useRefEventHandler.test.ts` - Tests

## 📌 Notes

- This feature is additive - no breaking changes to existing ref APIs
- Existing `onMount` callback in `useRefHandler` continues to work
- Event callbacks are independent of individual ref listeners
- Provider-level lifecycle ensures all cleanups execute
- Named callbacks enable modular, composable ref logic
