# Best Practices

Essential best practices for Context-Action framework development. This document provides quick references and links to comprehensive pattern guides.

<!-- Updated for sync-docs testing -->

## 📚 Comprehensive Pattern Documentation

This guide has been reorganized for better maintainability. For detailed implementations, see the [**Pattern Collection**](./patterns/):

### 🎯 Core Framework Patterns
- **[Action Patterns](./patterns/action/)** - Pure action dispatching without state management
- **[Store Patterns](./patterns/store/)** - Type-safe state management (Recommended)  
- **[RefContext Patterns](./patterns/ref/)** - Direct DOM manipulation with zero re-renders

### 🏗️ Advanced Patterns
- **[Architecture Patterns](./patterns/architecture/)** - System architecture and design patterns
- **[Async Patterns](./patterns/async/)** - Asynchronous operation patterns and control flow
- **[Performance Patterns](./patterns/performance/)** - Performance optimization techniques
- **[Debug Patterns](./patterns/debug/)** - Production debugging and troubleshooting

## ⚠️ Critical Best Practices

### 🔴 Must-Read Critical Patterns

These patterns address common pitfalls that can cause serious issues in production:

#### 1. **Handler State Access** - ⚠️ **CRITICAL**
Avoid closure traps when accessing store values in action handlers.

```tsx
// ❌ WRONG: Component scope values create closure traps
function BadComponent() {
  const user = useStoreValue(userStore); // Trapped in closure!
  
  useActionHandler('updateUser', async (payload) => {
    if (user.isActive) {  // STALE VALUE!
      await updateUserAPI(payload);
    }
  });
}

// ✅ CORRECT: Always get fresh state from store
function GoodComponent() {
  useActionHandler('updateUser', useCallback(async (payload) => {
    const currentUser = userStore.getValue(); // Real-time value!
    
    if (currentUser.isActive) {
      await updateUserAPI(payload);
    }
  }, [userStore]));
}
```

**📖 Read More**: [Handler State Access Patterns](./patterns/action/handler-state-access.md)

#### 2. **Production Debugging** - 🐛 **ESSENTIAL**
Critical issues like duplicate handlers, race conditions, and component lifecycle conflicts.

**📖 Read More**: [Production Debugging Patterns](./patterns/debug/production-debugging.md)

#### 3. **Real-time State Access** - ⚡ **IMPORTANT**
Proper async patterns for accessing current state values.

**📖 Read More**: [Real-time State Access](./patterns/async/real-time-state-access.md)

## 📋 Quick Reference

### Essential Development Rules

#### ✅ Always Do
- Use `useCallback` for action handlers
- Access real-time state with `store.getValue()` in handlers
- Choose appropriate comparison strategies for stores
- Handle errors with try-catch in action handlers
- Test both mounted/unmounted scenarios

#### ❌ Never Do
- Use component scope values in action handlers (closure traps!)
- Register handlers without `useCallback`
- Use direct DOM queries (`document.getElementById`)
- Ignore error handling in critical operations
- Skip timeout protection for async operations

### Pattern Selection Guide

```tsx
// 🎯 Action Only: Pure event handling
const { useActionDispatch, useActionHandler } = createActionContext<Actions>('MyActions');

// 🏪 Store Only: Pure state management (Recommended)
const { useStore, useStoreManager } = createStoreContext('MyStores', {
  data: initialData,
  isLoading: false
});

// 🔧 RefContext: High-performance DOM manipulation
const { useRefHandler } = createRefContext<Refs>('MyRefs');

// 🏗️ Composition: Complex applications
function App() {
  return (
    <MyActionProvider>
      <MyStoreProvider>
        <MyRefProvider>
          <AppContent />
        </MyRefProvider>
      </MyStoreProvider>
    </MyActionProvider>
  );
}
```

## 📖 Detailed Documentation

### Core Concepts
For naming conventions, file structure, and type definitions, see:
- **[Conventions Guide](../concept/conventions.md)** - Complete coding conventions
- **[Architecture Guide](../concept/architecture-guide.md)** - MVVM architecture guide
- **[Pattern Guide](../concept/pattern-guide.md)** - Pattern selection guide

### Implementation Guides
For step-by-step implementation details, see:
- **[Basic Examples](../../examples/)** - Working code examples
- **[Pattern Collection](./patterns/)** - Comprehensive implementation guides

## 🚨 Common Pitfalls

### ⚠️ Critical Issues to Avoid

1. **Closure Traps**: Never use component scope values in handlers
2. **Duplicate Handlers**: Check for multiple registrations of same handler
3. **Race Conditions**: Use processing state flags for critical actions
4. **Memory Leaks**: Clean up refs, animations, and event listeners
5. **Stale State**: Always use `store.getValue()` for current state
6. **Event Object Storage**: Never store DOM events or React event objects in stores
7. **Cross-Platform Compatibility**: Use proper timeout types for browser/Node.js environments

**📖 Detailed Solutions**: [Production Debugging](./patterns/debug/production-debugging.md)

### 🔧 Security & Performance Guidelines

#### Event Object Handling
Never store DOM event objects in stores as they can cause memory leaks:

```tsx
// ❌ WRONG: Storing event objects causes memory leaks
function BadHandler() {
  useActionHandler('handleClick', async (event) => {
    // This will trigger an error and prevent storage
    store.setValue({ clickEvent: event }); 
  });
}

// ✅ CORRECT: Extract needed data from events
function GoodHandler() {
  useActionHandler('handleClick', async (event) => {
    // Extract only the data you need
    const clickData = {
      clientX: event.clientX,
      clientY: event.clientY,
      target: event.target?.tagName,
      timestamp: Date.now()
    };
    store.setValue({ clickData });
  });
}
```

#### Memory Management
The framework automatically handles memory-heavy objects:

```tsx
// EventBus automatically prevents memory leaks by:
// 1. Detecting DOM elements and React components
// 2. Storing only essential metadata instead of full objects
// 3. Cleaning up problematic references automatically
```

#### Error Handling
Use the centralized error handling system:

```tsx
// Framework provides ErrorHandlers for:
// - Store operation errors
// - Event handler failures  
// - Ref mount callback errors
// - Async operation failures with proper context
```

## 🎯 Migration Guide

If you're migrating from other state management libraries or updating existing code:

1. **Identify Pattern Types**: Determine which patterns (Action, Store, RefContext) you need
2. **Check Critical Patterns**: Review handler state access and async patterns
3. **Update Conventions**: Follow naming and file structure conventions
4. **Test Thoroughly**: Especially focus on handler behavior and state updates

**📖 Complete Migration Guide**: [Pattern Guide](../concept/pattern-guide.md#migration-guide)

---

## 📚 Additional Resources

### Documentation Links
- [API Reference](../../api/) - Complete API documentation
- [Example Code](../../../example/) - Working example application
- [Pattern Collection](./patterns/) - Comprehensive pattern guides

### External Resources
- [Context-Action GitHub](https://github.com/mineclover/context-action) - Source code and issues
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript best practices