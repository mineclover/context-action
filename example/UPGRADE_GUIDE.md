# Context-Action Example Code Upgrade Guide

## 📋 Overview

This guide provides migration instructions for updating example files to follow the latest Context-Action framework specifications and best practices.

## 🎯 Current Status

### ✅ Updated Files (Using Latest Patterns)
- `src/pages/actionguard/SearchPage.tsx` - ✅ Updated to createDeclarativeStorePattern
- `src/pages/actionguard/ScrollPage.tsx` - ✅ Updated to createDeclarativeStorePattern  
- `src/pages/store/StoreBasicsPage.tsx` - ✅ Already using createDeclarativeStorePattern
- Multiple files in `/pages/demos/store-scenarios/` - ✅ Already using latest patterns

### ⚠️ Files Requiring Updates
Files still using deprecated `createStore` pattern:

1. **Core Demo Files:**
   - `src/pages/react/UseActionWithResultPage.tsx`
   - `src/pages/demos/StoreScenariosPage.tsx`
   - `src/pages/actionguard/ContextStoreMouseEventsPage.tsx`
   - `src/pages/store/StoreImmutabilityTestPage.tsx`

2. **System Files:**
   - `src/components/LogMonitor/store-registry.ts`
   - `src/components/ToastSystem/store.ts`

## 🔧 Migration Pattern

### Before (Deprecated Pattern)
```typescript
import { createStore, useStoreValue } from '@context-action/react';

// Individual store creation
const userStore = createStore('user', { name: '', email: '' });
const settingsStore = createStore('settings', { theme: 'light' });
const dataStore = createStore('data', []);

// Direct store usage
function Component() {
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  const data = useStoreValue(dataStore);
  
  // Handler with direct store access
  useActionHandler('updateUser', useCallback(async (payload) => {
    userStore.setValue(payload.user);
  }, []));
  
  return <div>...</div>;
}
```

### After (Recommended Pattern)
```typescript
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';

// Unified store pattern
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: { name: '', email: '' },
  settings: { theme: 'light' as const },
  data: [] as any[]
});

// Provider composition
function App() {
  return (
    <AppStoreProvider>
      <Component />
    </AppStoreProvider>
  );
}

// Store usage in components
function Component() {
  const userStore = useAppStore('user');
  const settingsStore = useAppStore('settings');
  const dataStore = useAppStore('data');
  
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  const data = useStoreValue(dataStore);
  
  // Handler with proper dependencies
  useActionHandler('updateUser', useCallback(async (payload) => {
    userStore.setValue(payload.user);
  }, [userStore]));
  
  return <div>...</div>;
}
```

## 🔄 Step-by-Step Migration

### Step 1: Update Imports
```typescript
// Remove
import { createStore, useStoreValue } from '@context-action/react';

// Add
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';
```

### Step 2: Convert Store Creation
```typescript
// Before: Individual stores
const store1 = createStore('name1', initialValue1);
const store2 = createStore('name2', initialValue2);

// After: Unified pattern
const {
  Provider: StoreProvider,
  useStore: useAppStore
} = createDeclarativeStorePattern('App', {
  name1: initialValue1,
  name2: initialValue2
});
```

### Step 3: Update Provider Structure
```typescript
// Before: No provider or individual providers
function App() {
  return <Component />;
}

// After: Unified provider
function App() {
  return (
    <StoreProvider>
      <Component />
    </StoreProvider>
  );
}
```

### Step 4: Update Component Store Usage
```typescript
// Before: Direct store usage
const value1 = useStoreValue(store1);

// After: Hook-based store access
const store1 = useAppStore('name1');
const value1 = useStoreValue(store1);
```

### Step 5: Update Handler Dependencies
```typescript
// Before: Empty or incomplete dependencies
useActionHandler('action', useCallback(async (payload) => {
  store1.setValue(newValue);
}, []));

// After: Proper dependencies
useActionHandler('action', useCallback(async (payload) => {
  store1.setValue(newValue);
}, [store1]));
```

## 📊 Benefits of Migration

### Type Safety
- ✅ Better TypeScript inference
- ✅ Compile-time error detection
- ✅ IntelliSense support

### Performance  
- ✅ Optimized re-renders
- ✅ Better store composition
- ✅ Reduced bundle size

### Maintainability
- ✅ Centralized store definitions
- ✅ Consistent naming patterns
- ✅ Easier refactoring

### Documentation Compliance
- ✅ Aligns with official documentation
- ✅ Follows Setup 스펙 재사용 중심 문서화
- ✅ Matches documented best practices

## 🚨 Common Migration Issues

### Issue 1: Store Access in Handlers
**Problem**: Using old store variables in new pattern
```typescript
// Wrong
useActionHandler('action', useCallback(async (payload) => {
  oldStoreVariable.setValue(value); // ❌ Old store reference
}, []));
```

**Solution**: Use new store hooks
```typescript
// Correct
const newStore = useAppStore('storeName');
useActionHandler('action', useCallback(async (payload) => {
  newStore.setValue(value); // ✅ New store reference
}, [newStore]));
```

### Issue 2: Missing Dependencies
**Problem**: Outdated dependency arrays
```typescript
// Wrong
useActionHandler('action', useCallback(async (payload) => {
  store.setValue(value);
}, [])); // ❌ Missing store dependency
```

**Solution**: Include all dependencies
```typescript
// Correct
useActionHandler('action', useCallback(async (payload) => {
  store.setValue(value);
}, [store])); // ✅ Proper dependencies
```

### Issue 3: Provider Composition
**Problem**: Missing or incorrect provider setup
```typescript
// Wrong - No provider
function App() {
  return <Component />; // ❌ No store context
}
```

**Solution**: Add proper provider
```typescript
// Correct
function App() {
  return (
    <StoreProvider>
      <Component />
    </StoreProvider>
  ); // ✅ Proper provider structure
}
```

## 📋 Migration Checklist

For each file requiring migration:

- [ ] Update imports to include `createDeclarativeStorePattern`
- [ ] Convert individual `createStore` calls to unified pattern  
- [ ] Add appropriate Provider to component tree
- [ ] Update component store access to use hooks
- [ ] Fix handler dependencies to include store references
- [ ] Test functionality to ensure no regressions
- [ ] Update any related tests or documentation

## 📚 Related Documentation

- [Store Basic Usage](docs/en/guide/patterns/store/basic-usage.md)
- [createDeclarativeStorePattern Reference](docs/en/guide/patterns/store/store-configuration.md)
- [Setup 스펙 가이드](docs/en/guide/patterns/setup/basic-store-setup.md)
- [Best Practices](docs/en/guide/patterns/store/withProvider-pattern.md)

## 🎯 Next Steps

1. **High Priority**: Update core demo files that showcase main framework features
2. **Medium Priority**: Update component system files (LogMonitor, ToastSystem)  
3. **Low Priority**: Update less frequently accessed demo files

The migration should be done incrementally to avoid breaking existing functionality while gradually improving code quality and documentation compliance.