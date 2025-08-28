# Immer Integration Guide

Enhanced immutability system using Immer for superior performance and developer experience.

## 🎯 Overview

Context-Action v0.4.1+ replaces the complex internal immutability system with **Immer** for enhanced performance, better debugging experience, and more reliable state management.

## 🚀 Key Benefits

- **🔥 Performance**: Structural sharing for large objects
- **🐛 Debugging**: Better error messages and stack traces  
- **📝 Syntax**: Natural mutable syntax that produces immutable results
- **🎯 Precision**: Only changed parts are cloned
- **🧠 Memory**: Automatic memory optimization

## 🔧 Core Functions

### deepCloneWithImmer

Advanced deep cloning using Immer's structural sharing:

```typescript
import { deepCloneWithImmer } from '@context-action/react';

// Complex object cloning
const originalState = {
  user: {
    profile: { name: 'John', email: 'john@example.com' },
    settings: { theme: 'dark', notifications: true },
    history: [/* large array */]
  },
  metadata: { /* complex nested data */ }
};

// ✅ EFFICIENT: Only clones what's necessary
const clonedState = await deepCloneWithImmer(originalState);

// Structural sharing - unchanged parts reference original
console.log(clonedState.user.history === originalState.user.history); // true
```

### produceWithImmer

Produce new state with natural mutable syntax:

```typescript
import { produceWithImmer } from '@context-action/react';

// Store update with Immer
const userStore = useUserStore('profile');

const updateUserProfile = async (updates: Partial<UserProfile>) => {
  const currentUser = userStore.getValue();
  
  // ✅ NATURAL: Write code as if mutating
  const newUser = await produceWithImmer(currentUser, (draft) => {
    draft.profile.name = updates.name || draft.profile.name;
    draft.profile.email = updates.email || draft.profile.email;
    draft.metadata.lastUpdated = new Date();
    
    // Complex nested updates
    if (updates.preferences) {
      draft.settings.theme = updates.preferences.theme;
      draft.settings.notifications = updates.preferences.notifications;
    }
    
    // Array operations
    if (updates.newActivity) {
      draft.history.push(updates.newActivity);
    }
  });
  
  userStore.setValue(newUser);
};
```

## 🏪 Store Integration Patterns

### Direct Store Integration

```typescript
// Store configuration with Immer
const userStore = createStore({
  initialValue: { 
    profile: { name: '', email: '' },
    settings: { theme: 'light' } 
  },
  // Immer automatically used for complex objects
  comparisonOptions: { strategy: 'deep' }
});

// Action handler with Immer updates
useActionHandler('updateUser', async (payload) => {
  const currentUser = userStore.getValue();
  
  // ✅ AUTOMATIC: Immer used automatically for complex updates
  const updatedUser = await produceWithImmer(currentUser, (draft) => {
    Object.assign(draft.profile, payload);
    draft.metadata.lastUpdated = Date.now();
  });
  
  userStore.setValue(updatedUser);
});
```

### Store Update Helper

```typescript
// Helper function for Immer store updates
function createImmerStoreUpdater<T>(store: Store<T>) {
  return async (updater: (draft: T) => void) => {
    const currentValue = store.getValue();
    const newValue = await produceWithImmer(currentValue, updater);
    store.setValue(newValue);
  };
}

// Usage
const userStore = useUserStore('profile');
const updateUser = createImmerStoreUpdater(userStore);

// Clean, readable updates
await updateUser((draft) => {
  draft.profile.name = 'New Name';
  draft.settings.theme = 'dark';
  draft.history.push({ action: 'profile_update', timestamp: Date.now() });
});
```

## ⚡ Performance Optimization

### Conditional Immer Usage

```typescript
import { isComplexObject, isPrimitive } from '@context-action/react';

// Smart update strategy
const smartStoreUpdate = async (store, newValue) => {
  const current = store.getValue();
  
  // ✅ OPTIMIZED: Use Immer only when beneficial
  if (isPrimitive(newValue)) {
    // Direct assignment for primitives
    store.setValue(newValue);
  } else if (isComplexObject(newValue)) {
    // Immer for complex objects
    const updated = await produceWithImmer(current, (draft) => {
      Object.assign(draft, newValue);
    });
    store.setValue(updated);
  } else {
    // Simple object - direct assignment
    store.setValue({ ...current, ...newValue });
  }
};
```

### Batch Operations with Immer

```typescript
// Efficient batch updates
const batchUserUpdates = async (updates: UserUpdate[]) => {
  const current = userStore.getValue();
  
  // ✅ SINGLE IMMER CALL: Process all updates together
  const result = await produceWithImmer(current, (draft) => {
    updates.forEach(update => {
      switch (update.type) {
        case 'profile':
          Object.assign(draft.profile, update.data);
          break;
        case 'settings':
          Object.assign(draft.settings, update.data);
          break;
        case 'history':
          draft.history.push(update.data);
          break;
      }
    });
    
    // Update metadata once
    draft.metadata.lastBatchUpdate = Date.now();
    draft.metadata.batchSize = updates.length;
  });
  
  userStore.setValue(result);
};
```

## 🔍 Debugging with Immer

### Development Debugging

```typescript
// Enable Immer debugging in development
if (process.env.NODE_ENV === 'development') {
  import('immer').then(({ setAutoFreeze, enablePatches }) => {
    setAutoFreeze(true);   // Prevent accidental mutations
    enablePatches();       // Enable patch tracking for debugging
  });
}

// Debug Immer operations
const debugProduceWithImmer = async (base, updater) => {
  const { produce, enablePatches } = await import('immer');
  
  return produce(
    base, 
    updater,
    // Patch listener for debugging
    (patches, inversePatches) => {
      console.log('Immer patches applied:', patches);
      console.log('Immer inverse patches:', inversePatches);
    }
  );
};
```

### Performance Monitoring

```typescript
// Monitor Immer performance
const monitoredProduceWithImmer = async (base, updater) => {
  const startTime = performance.now();
  const result = await produceWithImmer(base, updater);
  const duration = performance.now() - startTime;
  
  console.log(`Immer operation completed in ${duration.toFixed(2)}ms`);
  
  // Log performance warnings
  if (duration > 10) {
    console.warn('Slow Immer operation detected - consider optimization');
  }
  
  return result;
};
```

## 🛡️ Error Handling

### Immer Error Recovery

```typescript
// Safe Immer operations with fallback
const safeImmerUpdate = async (store, updater) => {
  try {
    const current = store.getValue();
    const updated = await produceWithImmer(current, updater);
    store.setValue(updated);
  } catch (error) {
    console.error('Immer operation failed:', error);
    
    // Fallback to manual immutable update
    const current = store.getValue();
    const updated = JSON.parse(JSON.stringify(current));
    
    // Apply updates manually
    try {
      updater(updated);
      store.setValue(updated);
    } catch (fallbackError) {
      console.error('Fallback update also failed:', fallbackError);
      throw new Error('Unable to update store - both Immer and fallback failed');
    }
  }
};
```

## 📋 Best Practices

### Immer Usage Guidelines

1. **Complex Objects Only**: Use Immer for nested objects and arrays
2. **Primitive Bypass**: Direct assignment for primitives and simple objects
3. **Batch Operations**: Combine multiple updates in single Immer call
4. **Error Handling**: Always wrap Immer operations in try-catch
5. **Performance Monitoring**: Monitor operation duration in development

### Migration from Manual Immutability

```typescript
// Before: Manual immutable updates
const updateUserManually = (current, payload) => {
  return {
    ...current,
    profile: {
      ...current.profile,
      ...payload.profile
    },
    settings: {
      ...current.settings,
      ...payload.settings
    },
    history: [
      ...current.history,
      { action: 'update', timestamp: Date.now() }
    ]
  };
};

// After: Immer-based updates
const updateUserWithImmer = async (current, payload) => {
  return await produceWithImmer(current, (draft) => {
    Object.assign(draft.profile, payload.profile);
    Object.assign(draft.settings, payload.settings);
    draft.history.push({ action: 'update', timestamp: Date.now() });
  });
};
```

### Configuration Optimization

```typescript
// Configure global Immer settings
import { configureImmutability } from '@context-action/react';

// Development configuration
configureImmutability({
  enableCloning: true,       // Full cloning for safety
  enableVerification: true,  // Development checks
  warnOnFallback: true      // Warn when Immer unavailable
});

// Production configuration  
configureImmutability({
  enableCloning: true,       // Performance-optimized cloning
  enableVerification: false, // Skip development checks
  warnOnFallback: false     // Silent fallback
});
```

## 🧪 Testing Immer Integration

### Unit Testing

```typescript
// Test Immer-based store updates
test('Immer store updates work correctly', async () => {
  const store = createStore({ 
    initialValue: { count: 0, items: [] } 
  });
  
  // Test Immer update
  const current = store.getValue();
  const updated = await produceWithImmer(current, (draft) => {
    draft.count += 1;
    draft.items.push('new item');
  });
  
  expect(updated.count).toBe(1);
  expect(updated.items).toEqual(['new item']);
  expect(updated).not.toBe(current); // Different reference
});
```

The Immer integration provides a powerful, performant, and developer-friendly approach to immutable state management in the Context-Action framework.