# Action Handler State Access Patterns

Advanced patterns for accessing and managing state within action handlers, including critical best practices to avoid common pitfalls.

## Import

```typescript
// Framework import
import { useActionHandler } from '@context-action/react';
// Setup import (가상의 setup 참조)
import { useUserAction, useUserActionHandler, UserActionProvider } from '../setup/actions';
```

## Prerequisites

🎯 **스펙 재사용**: For complete action handler setup patterns, see **[Basic Action Setup](../setup/basic-action-setup.md)**.

📖 **이 문서의 모든 예제**는 아래 setup 스펙을 재사용합니다:
- 🎯 Action types → [EventActions, UserActions](../setup/basic-action-setup.md#type-definitions)
- 🎯 Hook naming → [useEventAction Pattern](../setup/basic-action-setup.md#context-creation)
- 🎯 Handler patterns → [Action Handler Setup](../setup/basic-action-setup.md#action-handler-patterns)

💡 **일관된 학습**: Setup 가이드를 먼저 읽으면 이 문서의 모든 예제를 **즉시 이해**할 수 있습니다.

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
  
  useUserActionHandler('updateProfile', async (payload) => {
    // 🚨 BUG: This 'user' is from handler registration time, not current time!
    if (user.name) {  // Stale value!
      await updateUserAPI(payload);
    }
  });
}

// ✅ CORRECT: Access store values directly inside handlers
function UserComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // For component rendering only
  
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // ✅ Always get fresh state from store
    const currentUser = userStore.getValue(); // Real-time value!
    
    if (currentUser.name) {
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
useUserActionHandler('updateProfile', async (payload) => {
  const currentProfile = profileStore.getValue();
  
  if (currentProfile.email) {
    // Proceed with action using current state
    await updateUserProfile(payload, currentProfile);
  }
});
```

### Pattern 2: Multiple Store Coordination

**Use for complex logic requiring multiple store states:**

```tsx
useUserActionHandler('login', async (payload) => {
  const profileState = profileStore.getValue();
  const preferencesState = preferencesStore.getValue();
  
  // Use all current states for decision making
  if (profileState.email && preferencesState.theme) {
    await executeLoginLogic(payload, { profileState, preferencesState });
  }
});
```

### Pattern 3: State Validation and Updates

**Use for validating current state before updates:**

```tsx
useUserActionHandler('changePassword', async (payload) => {
  const current = profileStore.getValue();
  
  // Validate current state
  if (!current.email || current.role === 'guest') {
    throw new Error('Insufficient permissions');
  }
  
  // Update with current state as base
  profileStore.setValue({
    ...current,
    lastPasswordChange: Date.now()
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
  const profileStore = useUserStore('profile');  // Stable reference
  const dispatch = useUserAction();              // Stable reference
  const profile = useStoreValue(profileStore);
  
  useEffect(() => {
    if (profile.email && !profile.name) {
      dispatch('updateProfile', { name: 'Default Name', email: profile.email });
      profileStore.setValue({ ...profile, lastSyncAttempt: Date.now() });
    }
  }, [profile.email, profile.name]); // Don't include profileStore or dispatch
  
  // Alternative: Include them if you prefer explicitness (no harm)
  useEffect(() => {
    if (profile.email && !profile.name) {
      dispatch('updateProfile', { name: 'Default Name', email: profile.email });
    }
  }, [profile.email, profile.name, dispatch, profileStore]); // Also fine
}
```

### Dependency Array Guidelines

```tsx
// ✅ Include: Values that actually change and affect behavior
useEffect(() => {
  if (profile.role === 'admin') {
    startPolling();
  }
}, [profile.role]); // Include derived values

// ✅ Omit: Stable references (but including them doesn't hurt)
const stableRef = profileStore;
const stableDispatch = dispatch;

useEffect(() => {
  // These don't need to be in deps, but you can include them
  stableRef.setValue(newValue);
  stableDispatch('updateProfile', payload);
}, []); // Empty deps is fine

// ❌ Avoid: Including whole objects when only specific properties matter
useEffect(() => {
  updateUI();
}, [profile]); // Re-runs on any profile change

// ✅ Better: Include only relevant properties
useEffect(() => {
  updateUI();
}, [preferences.theme, preferences.language]); // Only re-runs when these change
```

---

## 🔧 Handler Registration Best Practices

### Correct Handler Registration Pattern

```tsx
function UserComponent() {
  const profileStore = useUserStore('profile');
  const dispatch = useUserAction();
  
  // ✅ CORRECT: Handler with proper dependencies
  const updateProfileHandler = useCallback(async (payload) => {
    // Always get fresh state
    const currentProfile = profileStore.getValue();
    
    try {
      // Execute business logic with current state
      const updatedProfile = await updateUserProfile({
        ...currentProfile,
        ...payload
      });
      
      // Update store with fresh data
      profileStore.setValue(updatedProfile);
      
      // Notify success (using EventActions pattern from setup)
      dispatch('updateProfile', {
        name: updatedProfile.name,
        email: updatedProfile.email
      });
    } catch (error) {
      // Handle error appropriately
      console.error('Failed to update profile:', error);
    }
  }, [profileStore, dispatch]);
  
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
  const profileStore = useUserStore('profile');
  
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // Either get from store or pass through payload
    const currentProfile = profileStore.getValue();
    await updateUserProfile(currentProfile.id || payload.id, payload);
  }, [profileStore]));
}
```

---

## 📚 Related Patterns

- **[Basic Action Setup](../setup/basic-action-setup.md)** - Complete action context setup patterns
- **[Action Basic Usage](./basic-usage.md)** - Fundamental action dispatching patterns
- **[Dispatch Access Patterns](./dispatch-access.md)** - Advanced dispatch usage patterns

---

## 💡 Key Takeaways

1. **Never use component scope values in handlers** - they create closure traps
2. **Always use `store.getValue()` for current state** in handlers
3. **Store and dispatch references are stable** - safe to omit from deps
4. **Use `useCallback` for handler stability** and proper dependency management
5. **Include only changing values in dependency arrays** for optimal performance