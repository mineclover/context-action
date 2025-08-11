# Hook Naming Migration Guide

## Overview

This guide outlines the migration plan from the current confusing hook naming (`useActionRegister`/`useRegistry`) to clearer, more intuitive naming (`useActionHandler`/`useStores`).

## Current vs New Naming

### Hook Names
| Current (Confusing) | New (Clear) | Purpose |
|---------------------|-------------|---------|
| `useActionRegister` | `useActionHandler` | Returns function to add action handlers |
| `useRegistry` | `useStores` | Returns object to access stores |

### Variable Names
| Current (Confusing) | New (Clear) | Purpose |
|---------------------|-------------|---------|
| `register` | `addHandler` | Function that registers handlers |
| `registry` | `stores` | Object that provides store access |

## Migration Strategy

### Phase 1: Dual Export (Backwards Compatibility)
- Export both old and new hook names
- Add deprecation warnings for old hooks
- Update all documentation to use new names
- Update examples and demos

### Phase 2: Core Implementation Updates
1. **ActionContext.tsx Files**
   - Update return object keys
   - Maintain backwards compatibility with aliases
   - Add deprecation warnings

2. **Store Hook Files**
   - Rename `useRegistry` → `useStores`
   - Update all internal references
   - Add backwards compatibility aliases

3. **Type Definitions**
   - Update interface names where applicable
   - Maintain backwards compatibility types

### Phase 3: Example Updates
- Update all example applications
- Update demo implementations
- Update test files

### Phase 4: Deprecation Removal (Future)
- Remove old hook exports (breaking change)
- Remove backwards compatibility aliases
- Update major version

## Files to Update

### Core Files (packages/react/src/)
```
actions/
├── ActionContext.tsx           # Main update: return object keys
├── index.ts                   # Export aliases
└── utils/

stores/hooks/
├── useRegistry.ts             # Rename to useStores.ts
├── index.ts                  # Export new names + aliases
└── ...

hooks/
└── index.ts                  # Update main exports
```

### Development Files (packages/react-dev/src/)
```
actions/
├── ActionContext.tsx          # Mirror production changes
└── ...

stores/hooks/
├── useRegistry.ts             # Mirror production changes
└── index.ts                  # Mirror production changes
```

### Documentation
```
docs/en/guide/
├── *.md                      # Already updated ✅
└── ...
```

### Examples
```
example/src/
├── **/*.tsx                  # Update all usage
└── ...
```

## Implementation Details

### 1. ActionContext Return Object Update

**Current:**
```typescript
export const {
  Provider: UserActionProvider,
  useAction: useUserAction,
  useActionRegister: useUserActionRegister
} = createActionContext<UserActions>({ name: 'UserAction' });
```

**New (with backwards compatibility):**
```typescript
export const {
  Provider: UserActionProvider,
  useAction: useUserAction,
  useActionHandler: useUserActionHandler,
  // Deprecated aliases
  useActionRegister: useUserActionRegister // → useActionHandler
} = createActionContext<UserActions>({ name: 'UserAction' });
```

### 2. Store Hooks Update

**Current:**
```typescript
export { useRegistry } from './useRegistry';
```

**New (with backwards compatibility):**
```typescript
export { useStores } from './useStores';
export { useStores as useRegistry } from './useStores'; // Deprecated alias
```

### 3. Variable Naming in Examples

**Current:**
```typescript
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  useEffect(() => {
    if (!register) return;
    return register('action', handler);
  }, [register, handler]);
}
```

**New:**
```typescript
function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  useEffect(() => {
    if (!addHandler) return;
    return addHandler('action', handler);
  }, [addHandler, handler]);
}
```

## Deprecation Warnings

### Console Warnings
```typescript
export function useActionRegister() {
  console.warn(
    'useActionRegister is deprecated. Use useActionHandler instead. ' +
    'This alias will be removed in v2.0.0'
  );
  return useActionHandler();
}

export function useRegistry() {
  console.warn(
    'useRegistry is deprecated. Use useStores instead. ' +
    'This alias will be removed in v2.0.0'
  );
  return useStores();
}
```

### TypeScript Deprecation
```typescript
/**
 * @deprecated Use useActionHandler instead. Will be removed in v2.0.0
 */
export const useActionRegister = useActionHandler;

/**
 * @deprecated Use useStores instead. Will be removed in v2.0.0
 */
export const useRegistry = useStores;
```

## Testing Strategy

### Unit Tests
- Test both old and new hook names work identically
- Test deprecation warnings are shown
- Test all functionality remains intact

### Integration Tests
- Test real applications continue to work
- Test examples work with new naming
- Test backwards compatibility

### Type Tests
- Test TypeScript types work correctly
- Test deprecation warnings show in IDEs
- Test backwards compatibility types

## Migration Timeline

### Week 1: Core Implementation
- [ ] Update ActionContext.tsx files
- [ ] Update store hook files  
- [ ] Add backwards compatibility aliases
- [ ] Add deprecation warnings

### Week 2: Examples and Tests
- [ ] Update all example code
- [ ] Update all test files
- [ ] Verify backwards compatibility
- [ ] Add migration tests

### Week 3: Documentation and Validation
- [ ] Validate all documentation is consistent
- [ ] Test with real applications
- [ ] Performance validation
- [ ] Final review

### Future: v2.0.0 Breaking Change
- [ ] Remove deprecated hooks
- [ ] Remove backwards compatibility aliases
- [ ] Update major version
- [ ] Migration guide for v2.0.0

## Benefits After Migration

### Developer Experience
- **Intuitive**: `addHandler` clearly indicates adding a handler
- **Clear Separation**: `stores` vs `addHandler` removes confusion
- **Better Autocomplete**: Clearer function purposes in IDEs
- **Reduced Cognitive Load**: Less mental mapping required

### Code Readability
- **Self-Documenting**: Variable names explain their purpose
- **Consistent**: All examples use the same clear patterns
- **Maintainable**: New developers understand immediately

### API Consistency
- **Verb/Noun Pattern**: `addHandler` (verb) vs `stores` (noun)
- **Functional Naming**: Names reflect what they do
- **Future-Proof**: Better foundation for new features

## Success Criteria

- [ ] All existing code continues to work (backwards compatibility)
- [ ] New developers prefer the new naming in surveys
- [ ] Documentation examples are clearer and easier to follow
- [ ] IDE autocomplete provides better suggestions
- [ ] Deprecation warnings guide migration properly
- [ ] Performance impact is negligible
- [ ] Bundle size impact is minimal

## Rollback Plan

If issues arise:
1. **Immediate**: Disable deprecation warnings
2. **Short-term**: Revert to primary old naming
3. **Long-term**: Reassess naming strategy

Migration can be paused at any phase if needed.