# Unified Declarative Store Pattern - Summary

## Changes Made

### 1. Renamed `schema` → `initialStores`
- More intuitive naming that clearly indicates these are initial store configurations
- Better reflects the purpose of the parameter

### 2. Removed `withCustomProvider` 
- Simplified API by removing rarely-used method
- `withProvider` is sufficient for HOC needs
- Reduces API surface area and complexity

### 3. Simplified Implementation
- Focused solely on store management
- Removed unnecessary complexity
- Maintained excellent type inference

## API Comparison

### Before (Complex)
```typescript
const storeSchema: StoreSchema<AppStores> = {
  user: { 
    initialValue: { id: '', name: '' },
    strategy: 'shallow',
    description: 'User data'
  },
  // ...
};

const AppStores = createDeclarativeStorePattern('App', storeSchema);

// Two HOC methods
AppStores.withProvider()
AppStores.withCustomProvider() // Removed
```

### After (Simplified)
```typescript
const AppStores = createDeclarativeStorePattern('App', {
  // Direct values - cleanest syntax
  counter: 0,
  userName: '',
  
  // Or with configuration
  user: {
    initialValue: { id: '', name: '' },
    strategy: 'shallow'
  }
});

// Single HOC method
AppStores.withProvider()
```

## Key Benefits

1. **Cleaner API**: `initialStores` is more intuitive than `schema`
2. **Less Complexity**: Removed `withCustomProvider` that added unnecessary complexity
3. **Better Type Inference**: No manual type annotations needed
4. **Flexible Initialization**: Support both direct values and config objects
5. **Focused Purpose**: Store management without selector complexity

## Usage Examples

### Simple Direct Values
```typescript
const Stores = createDeclarativeStorePattern('App', {
  count: 0,
  name: 'Guest',
  isActive: false
});
```

### With Configuration
```typescript
const Stores = createDeclarativeStorePattern('App', {
  user: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow'
  }
});
```

### Mixed Approach
```typescript
const Stores = createDeclarativeStorePattern('App', {
  // Simple primitives
  counter: 0,
  
  // Complex with config
  userData: {
    initialValue: { profile: {}, settings: {} },
    strategy: 'deep'
  }
});
```

## Migration Guide

### From Old Pattern
```typescript
// Old
const schema: StoreSchema<T> = { ... };
const Stores = createDeclarativeStorePattern('App', schema);
Stores.withCustomProvider(Wrapper)(Component);

// New - 매우 간단하면서도 유연함!
const Stores = createDeclarativeStorePattern('App', { ... });

// 기본 사용법
const WrappedComponent = Stores.withProvider(Component);

// 선택적 설정 사용
const CustomWrappedComponent = Stores.withProvider(Component, {
  displayName: 'MyCustomComponent',
  registryId: 'custom-registry'
});
```

### From createStoreContext
```typescript
// Old
const StoreCtx = createStoreContext('app');
// Manual store creation needed

// New
const Stores = createDeclarativeStorePattern('App', {
  // Direct store definitions
  counter: 0,
  user: { id: '', name: '' }
});
```

## Type Safety Maintained

The pattern maintains full type safety with excellent inference:

```typescript
const Stores = createDeclarativeStorePattern('App', {
  counter: 0,                    // Inferred as Store<number>
  user: { id: '', name: '' },    // Inferred as Store<{id: string, name: string}>
  theme: 'light' as const        // Inferred as Store<'light'>
});

// Full type safety in usage
const counter = Stores.useStore('counter');  // Store<number>
const value = useStoreValue(counter);        // number
```