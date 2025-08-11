# Common Pitfalls

Learn from common mistakes and avoid them in your Context-Action implementations. This guide covers the most frequent issues developers encounter and how to fix them.

## Handler Registration Issues

### ❌ Missing Cleanup

**Problem:** Memory leaks from handlers not being cleaned up on component unmount.

```typescript
// ❌ Wrong - Memory leak
function useUserHandlers() {
  const register = useUserActionRegister();
  
  useEffect(() => {
    register('updateProfile', handler);
  }, []); // No cleanup - handlers accumulate in memory
}
```

**Solution:** Always return the unregister function.

```typescript
// ✅ Correct - Proper cleanup
function useUserHandlers() {
  const register = useUserActionRegister();
  
  const handler = useCallback(async (payload, controller) => {
    // Handler logic
  }, []);
  
  useEffect(() => {
    if (!register) return;
    const unregister = register('updateProfile', handler);
    return unregister; // Critical: cleanup on unmount
  }, [register, handler]);
}
```

**Symptoms:**
- Increasing memory usage over time
- Handlers executing multiple times
- Stale closure errors

### ❌ Missing `blocking` for Async Handlers

**Problem:** Async handlers execute simultaneously instead of sequentially.

```typescript
// ❌ Wrong - Handlers execute simultaneously
register('processOrder', asyncHandler1, { priority: 100 });
register('processOrder', asyncHandler2, { priority: 90 });
register('processOrder', asyncHandler3, { priority: 80 });
// All execute at the same time!
```

**Solution:** Use `blocking: true` for async handlers that should run sequentially.

```typescript
// ✅ Correct - Sequential execution
register('processOrder', asyncHandler1, { 
  priority: 100, 
  blocking: true // Wait for completion
});
register('processOrder', asyncHandler2, { 
  priority: 90, 
  blocking: true // Runs after handler1 completes
});
```

**Symptoms:**
- Race conditions between handlers
- Inconsistent state updates
- Handlers overwriting each other's changes

### ❌ Using Stale Closures

**Problem:** Handlers capture stale values from registration time.

```typescript
// ❌ Wrong - Stale closure
function useUserHandlers() {
  const profileStore = useUserStore('profile');
  const profile = profileStore.getValue(); // Captured at registration time
  
  const handler = useCallback(async (payload, controller) => {
    console.log(profile); // This is stale data!
    // Always shows the profile from when handler was registered
  }, [profile]); // Dependencies include stale value
}
```

**Solution:** Use lazy evaluation with registry.getStore().

```typescript
// ✅ Correct - Lazy evaluation
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  const handler = useCallback(async (payload, controller) => {
    const profileStore = registry.getStore('profile');
    const profile = profileStore.getValue(); // Fresh value at execution time
    console.log(profile); // Always current data
  }, [registry]); // Only registry in dependencies
}
```

**Symptoms:**
- Handlers working with old data
- State updates based on stale values
- Logic that doesn't reflect current application state

## Store Access Issues

### ❌ Not Using Reactive Subscriptions

**Problem:** Components don't re-render when store data changes.

```typescript
// ❌ Wrong - Not reactive
function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = profileStore.getValue(); // One-time access, not reactive
  
  // Component never re-renders when profile changes
  return <div>{profile.name}</div>;
}
```

**Solution:** Use `useStoreValue()` for reactive subscriptions.

```typescript
// ✅ Correct - Reactive subscription
function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore); // Reactive subscription
  
  // Component re-renders when profile changes
  return <div>{profile.name}</div>;
}
```

**Symptoms:**
- Components not updating when state changes
- Stale UI that doesn't reflect current data
- Manual refresh needed to see changes

### ❌ Direct Store Mutation

**Problem:** Mutating store objects directly instead of using setValue.

```typescript
// ❌ Wrong - Direct mutation
function updateUserName(newName: string) {
  const profileStore = useUserStore('profile');
  const profile = profileStore.getValue();
  
  profile.name = newName; // Direct mutation - no subscribers notified
  // Components won't re-render!
}
```

**Solution:** Always use setValue for updates.

```typescript
// ✅ Correct - Immutable updates
function updateUserName(newName: string) {
  const profileStore = useUserStore('profile');
  const profile = profileStore.getValue();
  
  profileStore.setValue({
    ...profile,
    name: newName // New object - subscribers notified
  });
}
```

**Symptoms:**
- Changes not reflected in UI
- Inconsistent state across components
- Debugging confusion about when state changes

### ❌ Null/Undefined Initial Values

**Problem:** Using null or undefined as initial values causes TypeScript and runtime issues.

```typescript
// ❌ Wrong - Null initial values
const userStores = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: null // TypeScript errors, runtime issues
  }
});

function UserProfile() {
  const profile = useStoreValue(useUserStore('profile'));
  return <div>{profile.name}</div>; // Runtime error if profile is null
}
```

**Solution:** Provide proper default values.

```typescript
// ✅ Correct - Proper initial values
const userStores = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: ''
    }
  }
});

function UserProfile() {
  const profile = useStoreValue(useUserStore('profile'));
  return <div>{profile.name || 'No name'}</div>; // Safe access
}
```

**Symptoms:**
- TypeScript compilation errors
- Runtime null/undefined errors
- Defensive coding needed everywhere

## Type Safety Issues

### ❌ Using Generic Hooks

**Problem:** Losing type safety by using generic hooks instead of domain-specific ones.

```typescript
// ❌ Wrong - No type safety
function UserProfile() {
  const store = useStore('user-profile'); // any type
  const dispatch = useDispatch(); // any action type
  
  dispatch('updateUser', { anyData: 'here' }); // No compile-time checking
}
```

**Solution:** Use domain-specific hooks for full type safety.

```typescript
// ✅ Correct - Full type safety
function UserProfile() {
  const profileStore = useUserStore('profile'); // Store<UserProfile>
  const dispatch = useUserAction(); // Typed dispatcher
  
  dispatch('updateProfile', { 
    data: { name: 'John' } // Compile-time type checking
  });
}
```

### ❌ Any Types in Interfaces

**Problem:** Using `any` types defeats the purpose of TypeScript.

```typescript
// ❌ Wrong - Lost type safety
interface UserActions {
  updateProfile: any;
  deleteUser: any;
}
```

**Solution:** Define proper, specific types.

```typescript
// ✅ Correct - Specific types
interface UserActions {
  updateProfile: { data: Partial<UserProfile> };
  deleteUser: { userId: string };
  resetProfile: void; // Explicit void for no payload
}
```

## Provider Setup Issues

### ❌ Wrong Provider Order

**Problem:** Incorrect provider nesting causes context errors.

```typescript
// ❌ Wrong - Action provider outside store provider
function App() {
  return (
    <UserActionProvider>  {/* Actions need stores to exist */}
      <UserProvider>      {/* Stores created here */}
        <UserProfile />
      </UserProvider>
    </UserActionProvider>
  );
}
// Error: Actions can't access stores
```

**Solution:** Store providers must wrap action providers.

```typescript
// ✅ Correct - Store provider wraps action provider
function App() {
  return (
    <UserProvider>         {/* Stores created first */}
      <UserActionProvider> {/* Actions can access stores */}
        <UserProfile />
      </UserActionProvider>
    </UserProvider>
  );
}
```

### ❌ Missing Handler Setup

**Problem:** Forgetting to set up handlers in the provider tree.

```typescript
// ❌ Wrong - Handlers never registered
function App() {
  return (
    <UserProvider>
      <UserActionProvider>
        <UserProfile /> {/* Actions dispatch but no handlers respond */}
      </UserActionProvider>
    </UserProvider>
  );
}
```

**Solution:** Include handler setup component.

```typescript
// ✅ Correct - Handlers properly set up
function HandlerSetup() {
  useUserHandlers(); // Register all handlers
  return null;
}

function App() {
  return (
    <UserProvider>
      <UserActionProvider>
        <HandlerSetup />    {/* Handlers registered */}
        <UserProfile />
      </UserActionProvider>
    </UserProvider>
  );
}
```

## Performance Issues

### ❌ Over-Subscription

**Problem:** Components subscribing to more stores than needed.

```typescript
// ❌ Wrong - Unnecessary subscriptions
function UserName() {
  const profile = useStoreValue(useUserStore('profile'));
  const preferences = useStoreValue(useUserStore('preferences')); // Not needed
  const session = useStoreValue(useUserStore('session')); // Not needed
  const history = useStoreValue(useUserStore('history')); // Not needed
  
  // Component re-renders when ANY of these change
  return <span>{profile.name}</span>; // Only needs profile
}
```

**Solution:** Only subscribe to stores you actually use.

```typescript
// ✅ Correct - Minimal subscriptions
function UserName() {
  const profile = useStoreValue(useUserStore('profile'));
  
  // Only re-renders when profile changes
  return <span>{profile.name}</span>;
}
```

### ❌ Handler Re-creation

**Problem:** Creating new handler functions on every render.

```typescript
// ❌ Wrong - Handler recreated every render
function useUserHandlers() {
  const register = useUserActionRegister();
  
  // New function created every render
  const handler = async (payload, controller) => {
    // Handler logic
  };
  
  useEffect(() => {
    const unregister = register('action', handler);
    return unregister;
  }, [register, handler]); // Handler changes every render!
}
```

**Solution:** Use `useCallback` to stabilize handler references.

```typescript
// ✅ Correct - Stable handler reference
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  // Stable function reference
  const handler = useCallback(async (payload, controller) => {
    // Handler logic
  }, [registry]); // Only changes if registry changes
  
  useEffect(() => {
    const unregister = register('action', handler);
    return unregister;
  }, [register, handler]); // Effect only runs when needed
}
```

## Cross-Domain Issues

### ❌ Tight Coupling Between Domains

**Problem:** Domains directly accessing each other's internals.

```typescript
// ❌ Wrong - Direct domain coupling
function useUserHandlers() {
  const cartStore = useCartStore('items'); // User domain accessing cart internals
  
  const loginHandler = useCallback(async (payload, controller) => {
    // Login logic
    
    // Direct manipulation of other domain
    cartStore.setValue([]); // Tight coupling!
  }, [cartStore]);
}
```

**Solution:** Use integration hooks or events for cross-domain communication.

```typescript
// ✅ Correct - Loose coupling via integration
function useUserCartIntegration() {
  const userAction = useUserAction();
  const cartAction = useCartAction();
  
  const loginWithCartReset = useCallback(async (loginData) => {
    await userAction('login', loginData);
    await cartAction('clearCart'); // Proper domain boundaries
  }, [userAction, cartAction]);
  
  return { loginWithCartReset };
}
```

### ❌ Circular Dependencies

**Problem:** Domains depending on each other creating circular imports.

```typescript
// ❌ Wrong - Circular dependency
// user.store.ts
import { useCartAction } from './cart.store'; // User imports Cart

// cart.store.ts  
import { useUserAction } from './user.store'; // Cart imports User
// Circular dependency!
```

**Solution:** Create separate integration modules.

```typescript
// ✅ Correct - Integration module
// integration/userCartIntegration.ts
import { useUserAction } from '../stores/user.store';
import { useCartAction } from '../stores/cart.store';

export function useUserCartIntegration() {
  const userAction = useUserAction();
  const cartAction = useCartAction();
  
  // Integration logic here
  return { /* integration methods */ };
}
```

## Debugging Issues

### ❌ Poor Error Messages

**Problem:** Handlers failing silently or with unhelpful errors.

```typescript
// ❌ Wrong - Poor error handling
const handler = useCallback(async (payload, controller) => {
  try {
    await riskyOperation();
  } catch (error) {
    controller.abort(); // No context about what failed
  }
}, []);
```

**Solution:** Provide detailed error context.

```typescript
// ✅ Correct - Detailed error handling
const handler = useCallback(async (payload, controller) => {
  try {
    await riskyOperation();
  } catch (error) {
    controller.abort(`Profile update failed: ${error.message}`, {
      operation: 'updateProfile',
      payload,
      timestamp: Date.now(),
      error: error.stack
    });
  }
}, []);
```

### ❌ No Handler IDs

**Problem:** Difficult to debug which handler is causing issues.

```typescript
// ❌ Wrong - No handler identification
register('updateProfile', handler, {
  priority: 100,
  blocking: true
  // No ID - hard to debug
});
```

**Solution:** Use descriptive IDs for debugging.

```typescript
// ✅ Correct - Clear handler identification
register('updateProfile', handler, {
  priority: 100,
  blocking: true,
  id: 'profile-validation-handler' // Clear identification
});
```

---

## Troubleshooting Checklist

When something isn't working, check these common issues:

### Handler Issues ✓
- [ ] Are handlers returning unregister functions?
- [ ] Are async handlers using `blocking: true`?
- [ ] Are handlers using lazy evaluation (`registry.getStore()`)?
- [ ] Are handlers wrapped with `useCallback`?

### Store Issues ✓
- [ ] Are components using `useStoreValue()` for reactivity?
- [ ] Are store updates using `setValue()` instead of direct mutation?
- [ ] Are initial values properly defined (not null)?

### Provider Issues ✓
- [ ] Are store providers wrapping action providers?
- [ ] Are handler setup components included?
- [ ] Are providers in the correct order?

### Type Issues ✓
- [ ] Are you using domain-specific hooks?
- [ ] Are interfaces properly defined without `any` types?
- [ ] Are action payloads matching interface definitions?

### Performance Issues ✓
- [ ] Are components only subscribing to needed stores?
- [ ] Are handlers stable with `useCallback`?
- [ ] Are you avoiding unnecessary re-renders?

---

## Summary

Most Context-Action issues stem from:

1. **Memory Management**: Not cleaning up handlers
2. **Async Coordination**: Missing `blocking: true`  
3. **Reactivity**: Not using reactive subscriptions
4. **Type Safety**: Using generic instead of domain-specific hooks
5. **Provider Setup**: Incorrect provider order or missing handlers

Following the patterns in this guide will help you avoid these common pitfalls and build more robust applications.

---

::: tip Prevention
Set up ESLint rules and code review checklists to catch these issues early. Consider creating custom hooks that enforce correct patterns in your team's codebase.
:::