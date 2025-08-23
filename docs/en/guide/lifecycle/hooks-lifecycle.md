# Hooks Lifecycle

Context-Action React hooks follow specific lifecycle patterns to ensure proper resource management, memory cleanup, and optimal performance. This guide explains **how hooks work internally** - their lifecycle, cleanup mechanisms, and performance characteristics.

## Related Guides

- 🎯 **[React Hooks](./hooks.md)** - How to use hooks (API examples and usage patterns)
- 📚 **[Hooks Reference](/en/concept/hooks-reference)** - Complete catalog of all available hooks  
- ✅ **[Best Practices](../best-practices.md)** - Coding patterns and conventions

---

## Core Lifecycle Concepts

### Hook Registration and Cleanup Pattern

All Context-Action hooks follow a consistent **register-and-cleanup** lifecycle:

1. **Mount**: Hook registers resources (handlers, subscriptions, refs)
2. **Update**: Dependencies change, hook re-registers if needed
3. **Unmount**: Automatic cleanup prevents memory leaks

This pattern ensures that:
- Resources are properly cleaned up on component unmount
- Memory leaks are prevented
- Handler registration is optimized for performance

## Action Hooks Lifecycle

### `useActionHandler()` Lifecycle

The most important lifecycle pattern in Context-Action:

```tsx
function UserComponent() {
  useActionHandler('updateUser', useCallback(async (payload) => {
    // Handler logic
  }, []), { priority: 1 });
}
```

**Lifecycle Stages:**

1. **Registration Phase** (Mount/Update)
   ```tsx
   useEffect(() => {
     // Register handler with unique ID
     const unregister = register.register(action, handler, config);
     
     // Return cleanup function
     return unregister;
   }, [action, actionId]); // Re-register when action or ID changes
   ```

2. **Execution Phase** (Runtime)
   - Handler executes when action is dispatched
   - Uses current ref values (not stale closures)
   - Supports priority-based execution

3. **Cleanup Phase** (Unmount/Update)
   - Automatic unregistration via returned cleanup function
   - Prevents handler execution after component unmount
   - No memory leaks or stale handlers

**Key Implementation Details:**
- Uses `useRef` to store current handler (prevents stale closures)
- Uses `useId` for unique handler identification
- Updates refs when dependencies change (no re-registration needed)
- Re-registers only when action name or component ID changes

### `useActionDispatch()` Lifecycle

Provides stable dispatch function across component re-renders:

```tsx
const dispatch = useActionDispatch();
// Same reference across re-renders - safe to use in useCallback deps
```

**Lifecycle Characteristics:**
- **Stable Reference**: `useCallback` with empty deps array
- **Auto-Abort**: Enables automatic cancellation for React components
- **Error Boundary**: Throws descriptive errors if context not found

## Store Hooks Lifecycle

### `useStoreValue()` Lifecycle

Subscribes to store changes with automatic cleanup:

```tsx
function UserProfile() {
  const user = useStoreValue(userStore);
  // Automatic subscription management
}
```

**Lifecycle Stages:**

1. **Subscription Phase** (Mount)
   - Subscribes to store changes
   - Gets initial value immediately

2. **Update Phase** (Store Changes)
   - Re-renders only when store value actually changes
   - Uses shallow equality by default for optimization

3. **Cleanup Phase** (Unmount)
   - Automatically unsubscribes from store
   - Prevents memory leaks

**Performance Optimizations:**
- Only re-renders on actual value changes (not reference changes)
- Subscription cleanup is automatic
- No manual subscription management required

### `useStore()` Lifecycle (from Store Pattern)

Provides access to store instances with context validation:

```tsx
const profileStore = useUserStore('profile');
```

**Lifecycle Characteristics:**
- **Context Validation**: Throws error if context not available
- **Type Safety**: Returns properly typed store instance
- **Stable Reference**: Store references remain stable across re-renders

## RefContext Hooks Lifecycle

### `useRefHandler()` Lifecycle

Manages DOM element references with mount/unmount handling:

```tsx
function CanvasComponent() {
  const canvasRef = useCanvasRef('mainCanvas');
  
  useEffect(() => {
    if (canvasRef.target) {
      // Direct DOM manipulation
      canvasRef.target.width = 800;
    }
  }, [canvasRef.target]);
}
```

**Lifecycle Stages:**

1. **Initial Phase** (Mount)
   - Returns ref handler with initial state (`target: null`)
   - Provides `setRef` function for element attachment

2. **Mount Phase** (Element Attached)
   - Element attached via `setRef(element)`
   - Triggers mount event and resolves mount promises
   - Updates state: `{ target: element, isMounted: true }`

3. **Cleanup Phase** (Unmount)
   - Element detached (`setRef(null)`)
   - Automatic cleanup if `autoCleanup: true`
   - Custom cleanup functions executed
   - Mount promises rejected with cleanup error

**Advanced Features:**
- **Mount Timeout**: Configurable timeout for element mounting
- **Auto Cleanup**: Automatic resource cleanup on unmount
- **Mount Promises**: `waitForMount()` for async operations
- **Event System**: Mount/unmount/cleanup event notifications

## Lifecycle Patterns Summary

Context-Action hooks follow consistent lifecycle patterns optimized for React's lifecycle. For specific usage patterns and best practices, see:

- [React Hooks Guide](/en/guide/hooks) - Hook usage and API examples
- [Best Practices Guide](/en/guide/best-practices) - Coding patterns and conventions
- [Hooks Reference](/en/concept/hooks-reference) - Complete hook catalog

## Memory Management

### Automatic Cleanup Features

Context-Action hooks provide automatic cleanup to prevent memory leaks:

1. **Action Handler Cleanup**
   - Handlers automatically unregistered on unmount
   - No stale handler execution after component unmount

2. **Store Subscription Cleanup** 
   - Subscriptions automatically removed on unmount
   - No memory leaks from store listeners

3. **Ref Resource Cleanup**
   - Custom cleanup functions executed on unmount
   - Automatic resource disposal (Three.js objects, event listeners, etc.)

4. **Context Cleanup**
   - Provider cleanup when context unmounts
   - Proper ActionRegister disposal

### Manual Cleanup Control

For advanced scenarios, manual cleanup control is available:

```tsx
// Manual handler unregistration
const unregister = register.register('action', handler);
// Later...
unregister();

// Manual store subscription
const subscription = store.subscribe(callback);
// Later...
subscription.unsubscribe();

// Manual ref cleanup
await refStore.cleanup();
```

## Performance Characteristics

Context-Action hooks are designed with performance in mind:

- **Minimal Re-renders**: Only trigger updates when necessary
- **Efficient Registration**: Optimized handler management
- **Memory Safety**: Automatic cleanup prevents leaks

For detailed performance optimization techniques, see [Performance Guide](/en/guide/patterns/ref/performance).

## Debugging Lifecycle Issues

### Common Issues and Solutions

1. **Stale Closures in Handlers**
   ```tsx
   // ❌ Problem: Captures stale state
   useActionHandler('action', async () => {
     console.log(someState); // May be stale
   });

   // ✅ Solution: Access current state
   useActionHandler('action', useCallback(async () => {
     const current = store.getValue();
     console.log(current);
   }, []));
   ```

2. **Handler Not Executing**
   - Verify Provider wraps component
   - Check handler registration before dispatch
   - Ensure unique handler IDs

3. **Memory Leaks**
   - Verify automatic cleanup is working
   - Check for manual subscriptions that need cleanup
   - Use React DevTools Profiler to identify leaks

### Lifecycle Events for Debugging

RefContext provides lifecycle events for debugging:

```tsx
const canvasRef = useCanvasRef('canvas');

canvasRef.addEventListener((event) => {
  console.log(`Ref event: ${event.type}`, event);
  // Events: 'mount', 'unmount', 'cleanup', 'error'
});
```

This lifecycle understanding is essential for building robust, performant React applications with Context-Action.