# Action Handler State Access Patterns

Advanced patterns for accessing and managing state within action handlers, including critical best practices to avoid common pitfalls.

## 📋 Table of Contents

1. [Critical: Avoid Closure Traps](#critical-avoid-closure-traps)
2. [Real-time State Access Patterns](#real-time-state-access-patterns)
3. [useEffect Dependencies Best Practices](#useeffect-dependencies-best-practices)

---

## Critical: Avoid Closure Traps

### ⚠️ The Closure Trap Problem

When accessing store values inside action handlers, **never use values from component scope** as they create closure traps with stale data.

```tsx
// ❌ WRONG: Using component scope values in handlers
function UserComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // This value gets trapped in closure!
  
  useUserActionHandler('updateUser', async (payload) => {
    // 🚨 BUG: This 'user' is from handler registration time, not current time!
    if (user.isActive) {  // Stale value!
      await updateUserAPI(payload);
    }
  });
}

// ✅ CORRECT: Access store values directly inside handlers
function UserComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // For component rendering only
  
  useUserActionHandler('updateUser', useCallback(async (payload) => {
    // ✅ Always get fresh state from store
    const currentUser = userStore.getValue(); // Real-time value!
    
    if (currentUser.isActive) {
      await updateUserAPI(payload);
    }
  }, [userStore])); // Only store reference in deps
}
```

### 🔍 Why Closure Traps Happen

1. **Handler Registration Time**: Handlers capture variables from their lexical scope at registration time
2. **Stale References**: Component state values don't update inside the handler closure
3. **Re-registration Issues**: Without `useCallback`, handlers re-register on every render

---

## Real-time State Access Patterns

### Pattern 1: Direct Store getValue()

**Use for simple state checks and single store access:**

```tsx
useActionHandler('conditionalAction', async (payload) => {
  const currentState = someStore.getValue();
  
  if (currentState.isReady) {
    // Proceed with action using current state
    await performAction(payload, currentState);
  }
});
```

### Pattern 2: Multiple Store Coordination

**Use for complex logic requiring multiple store states:**

```tsx
useActionHandler('complexAction', async (payload) => {
  const userState = userStore.getValue();
  const settingsState = settingsStore.getValue();
  const uiState = uiStore.getValue();
  
  // Use all current states for decision making
  if (userState.isLoggedIn && settingsState.apiEnabled && !uiState.isLoading) {
    await executeComplexLogic(payload, { userState, settingsState, uiState });
  }
});
```

### Pattern 3: State Validation and Updates

**Use for validating current state before updates:**

```tsx
useActionHandler('validateAndUpdate', async (payload) => {
  const current = dataStore.getValue();
  
  // Validate current state
  if (current.version !== payload.expectedVersion) {
    throw new Error('Version mismatch');
  }
  
  // Update with current state as base
  dataStore.setValue({
    ...current,
    ...payload.updates,
    version: current.version + 1
  });
});
```

---

## useEffect Dependencies Best Practices

### Store and Dispatch References are Stable

Context-Action framework ensures that store instances and dispatch functions have stable references:

```tsx
// ✅ These are safe to omit from useEffect dependencies
function MyComponent() {
  const userStore = useUserStore('profile');  // Stable reference
  const dispatch = useUserAction();           // Stable reference
  const user = useStoreValue(userStore);
  
  useEffect(() => {
    if (user.needsSync) {
      dispatch('syncUser', { id: user.id });
      userStore.setValue({ ...user, lastSyncAttempt: Date.now() });
    }
  }, [user.needsSync, user.id]); // Don't include userStore or dispatch
  
  // Alternative: Include them if you prefer explicitness (no harm)
  useEffect(() => {
    if (user.needsSync) {
      dispatch('syncUser', { id: user.id });
    }
  }, [user.needsSync, user.id, dispatch, userStore]); // Also fine
}
```

### Dependency Array Guidelines

```tsx
// ✅ Include: Values that actually change and affect behavior
useEffect(() => {
  if (user.isActive) {
    startPolling();
  }
}, [user.isActive]); // Include derived values

// ✅ Omit: Stable references (but including them doesn't hurt)
const stableRef = userStore;
const stableDispatch = dispatch;

useEffect(() => {
  // These don't need to be in deps, but you can include them
  stableRef.setValue(newValue);
  stableDispatch('action', payload);
}, []); // Empty deps is fine

// ❌ Avoid: Including whole objects when only specific properties matter
useEffect(() => {
  updateUI();
}, [user]); // Re-runs on any user change

// ✅ Better: Include only relevant properties
useEffect(() => {
  updateUI();
}, [user.theme, user.language]); // Only re-runs when these change
```

---

## 🔧 Handler Registration Best Practices

### Correct Handler Registration Pattern

```tsx
function UserComponent() {
  const userStore = useUserStore('profile');
  const dispatch = useUserAction();
  
  // ✅ CORRECT: Handler with proper dependencies
  const updateProfileHandler = useCallback(async (payload) => {
    // Always get fresh state
    const currentProfile = userStore.getValue();
    
    try {
      // Execute business logic with current state
      const updatedProfile = await updateUserProfile({
        ...currentProfile,
        ...payload.data
      });
      
      // Update store with fresh data
      userStore.setValue(updatedProfile);
      
      // Notify success
      dispatch('showNotification', {
        type: 'success',
        message: 'Profile updated successfully'
      });
    } catch (error) {
      dispatch('showNotification', {
        type: 'error', 
        message: 'Failed to update profile'
      });
    }
  }, [userStore, dispatch]);
  
  useUserActionHandler('updateProfile', updateProfileHandler);
}
```

### Common Mistakes to Avoid

```tsx
// ❌ WRONG: Using component scope values
function BadComponent({ userId }: { userId: string }) {
  useUserActionHandler('updateProfile', async (payload) => {
    // userId is captured from props at registration time - STALE!
    await updateUserProfile(userId, payload);
  }); // Missing useCallback and userId in deps
}

// ✅ CORRECT: Use store or pass through payload
function GoodComponent({ userId }: { userId: string }) {
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // Either get from store or pass through payload
    const currentUserId = payload.userId || userIdStore.getValue();
    await updateUserProfile(currentUserId, payload);
  }, []));
}
```

---

## 📚 Related Patterns

- [Real-time State Access](../async/real-time-state-access.md) - Async state access patterns
- [Production Debugging](../debug/production-debugging.md) - Debugging state issues
- [Register Patterns](./register-patterns.md) - Advanced handler registration

---

## 💡 Key Takeaways

1. **Never use component scope values in handlers** - they create closure traps
2. **Always use `store.getValue()` for current state** in handlers
3. **Store and dispatch references are stable** - safe to omit from deps
4. **Use `useCallback` for handler stability** and proper dependency management
5. **Include only changing values in dependency arrays** for optimal performance