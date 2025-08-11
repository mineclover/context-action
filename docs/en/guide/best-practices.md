# Development Best Practices

Essential best practices for building maintainable, scalable applications with the Context-Action framework. Follow these guidelines to ensure code quality, performance, and team productivity.

## Handler Registration Best Practices

### 1. Always Use `useActionRegister` + `useEffect` Pattern

```typescript
// ✅ Correct: Proper registration with cleanup
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  const handler = useCallback(async (payload, controller) => {
    // Handler logic
  }, [registry]);
  
  useEffect(() => {
    if (!register) return;
    const unregister = register('action', handler, {
      priority: 100,
      blocking: true
    });
    return unregister; // Critical: cleanup on unmount
  }, [register, handler]);
}

// ❌ Wrong: Missing cleanup
function useUserHandlers() {
  const register = useUserActionRegister();
  
  useEffect(() => {
    register('action', handler); // Memory leak!
  }, []);
}
```

### 2. Use `blocking: true` for Sequential Async Handlers

```typescript
// ✅ Correct: Sequential execution
register('asyncAction', asyncHandler, { 
  priority: 100, 
  blocking: true // Wait for completion
});

// ❌ Wrong: Handlers execute simultaneously
register('asyncAction', asyncHandler, { 
  priority: 100 
  // Missing blocking: true
});
```

### 3. Consider Explicit IDs for Debugging and Critical Handlers

```typescript
// ✅ Good: Explicit IDs for debugging
register('updateProfile', handler, {
  priority: 100,
  blocking: true,
  id: 'profile-updater-main' // Helpful for debugging
});

// ✅ Also good: Auto-generated IDs for simple cases
register('updateProfile', handler, {
  priority: 100,
  blocking: true
  // Framework generates ID automatically
});
```

### 4. Wrap Handlers with `useCallback` to Prevent Re-registration

```typescript
// ✅ Correct: Stable handler reference
const handler = useCallback(async (payload, controller) => {
  // Handler logic
}, [registry]); // Stable dependencies only

// ❌ Wrong: Handler recreated every render
const handler = async (payload, controller) => {
  // This creates new function every render
};
```

## Store Access Best Practices

### 5. Use Domain-Specific Hooks in Components

```typescript
// ✅ Correct: Domain-specific hooks
function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  const dispatch = useUserAction();
  
  return <div>{profile.name}</div>;
}

// ❌ Wrong: Generic hooks (no type safety)
function UserProfile() {
  const store = useStore('user-profile'); // No type information
  const dispatch = useDispatch(); // No action safety
}
```

### 6. Use `registry.getStore()` for Lazy Evaluation in Handlers

```typescript
// ✅ Correct: Lazy evaluation (fresh values)
const handler = useCallback(async (payload, controller) => {
  const profileStore = registry.getStore('profile');
  const currentProfile = profileStore.getValue(); // Current value
  
  // Business logic with fresh data
}, [registry]);

// ❌ Wrong: Stale closure
const profile = profileStore.getValue();
const handler = useCallback(async (payload, controller) => {
  console.log(profile); // Stale value from registration time
}, [profile]);
```

### 7. Provide Proper Initial Values, Not Null

```typescript
// ✅ Correct: Proper initial values
export const userStores = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: ''
    }
  }
});

// ❌ Wrong: Null values cause type issues
export const userStores = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: null // TypeScript errors, runtime issues
  }
});
```

### 8. Keep Store Updates Predictable and Traceable

```typescript
// ✅ Correct: Clear, traceable updates
const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
  const profileStore = registry.getStore('profile');
  const currentProfile = profileStore.getValue();
  
  const newProfile = {
    ...currentProfile,
    ...updates,
    updatedAt: Date.now() // Add metadata
  };
  
  profileStore.setValue(newProfile);
  
  // Log for debugging
  console.log('Profile updated:', { from: currentProfile, to: newProfile });
}, [registry]);

// ❌ Wrong: Unclear mutations
const updateProfile = useCallback((updates) => {
  // Direct mutation (hard to debug)
  Object.assign(currentProfile, updates);
}, []);
```

## Type Safety (Recommended)

### 9. Define Interfaces for Better Type Safety

```typescript
// ✅ Good: Clear interfaces
export interface UserData {
  profile: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

export interface UserActions {
  updateProfile: { data: Partial<UserData['profile']> };
  deleteUser: { userId: string };
  resetUser: void; // Explicit void for actions without payload
}

// ❌ Avoid: Any types (lose safety)
export interface UserActions {
  updateProfile: any;
  deleteUser: any;
}
```

### 10. Use Domain-Specific Hooks for Type Inference

```typescript
// ✅ Correct: Automatic type inference
function UserComponent() {
  const profileStore = useUserStore('profile'); // Store<UserProfile>
  const profile = useStoreValue(profileStore);  // UserProfile
  const dispatch = useUserAction();             // Typed dispatcher
  
  dispatch('updateProfile', { 
    data: { name: 'New Name' } // ✓ Type-checked
  });
}
```

### 11. Avoid `any` Types - Leverage TypeScript

```typescript
// ✅ Correct: Proper typing
const handler = useCallback(async (
  payload: UserActions['updateProfile'],
  controller: ActionController
) => {
  // Fully typed handler
}, []);

// ❌ Wrong: Any types defeat the purpose
const handler = useCallback(async (payload: any, controller: any) => {
  // Lost all type safety
}, []);
```

## Performance Best Practices

### 12. Only Subscribe to Needed Stores

```typescript
// ✅ Correct: Minimal subscriptions
function UserName() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Only re-renders when profile changes
  return <span>{profile.name}</span>;
}

// ❌ Wrong: Over-subscription
function UserName() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences'); // Unnecessary
  const sessionStore = useUserStore('session'); // Unnecessary
  
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore); // Causes extra re-renders
  const session = useStoreValue(sessionStore); // Causes extra re-renders
  
  return <span>{profile.name}</span>; // Only needs profile
}
```

### 13. Use Proper Handler Priorities

```typescript
// ✅ Correct: Logical priority order
register('updateProfile', validationHandler, { 
  priority: 200, // Validation first
  blocking: true 
});

register('updateProfile', updateHandler, { 
  priority: 100, // Main logic second
  blocking: true 
});

register('updateProfile', loggingHandler, { 
  priority: 50,  // Logging last
  blocking: true 
});
```

### 14. Clean Up Handlers on Unmount

```typescript
// ✅ Correct: All handlers cleaned up
useEffect(() => {
  if (!register) return;
  
  const unregisterA = register('actionA', handlerA);
  const unregisterB = register('actionB', handlerB);
  const unregisterC = register('actionC', handlerC);
  
  return () => {
    unregisterA();
    unregisterB();
    unregisterC();
  };
}, [register, handlerA, handlerB, handlerC]);
```

### 15. Use Result Collection Selectively

```typescript
// ✅ Good: Only when you need results
const dispatchWithResult = useUserActionWithResult();

const criticalAction = async () => {
  const result = await dispatchWithResult('importantAction', payload, {
    result: { collect: true, strategy: 'all' }
  });
  
  // Process results
  return result.results;
};

// ✅ Also good: Regular dispatch when results not needed
const dispatch = useUserAction();

const simpleAction = () => {
  dispatch('simpleAction', payload); // No result collection overhead
};
```

## Architecture Best Practices

### 16. One Domain = One Context Boundary

```typescript
// ✅ Correct: Clear domain boundaries
function App() {
  return (
    <UserProvider>        {/* User domain */}
      <CartProvider>      {/* Cart domain */}
        <OrderProvider>   {/* Order domain */}
          <AppContent />
        </OrderProvider>
      </CartProvider>
    </UserProvider>
  );
}
```

### 17. Separate Business and UI Concerns

```typescript
// ✅ Correct: Separated concerns
// Business data
interface UserBusinessData {
  profile: UserProfile;
  session: UserSession;
}

// UI state  
interface UserUIState {
  isEditing: boolean;
  selectedTab: string;
  loadingState: LoadingState;
}

// Separate providers
<UserBusinessProvider>
  <UserUIProvider>
    <UserComponents />
  </UserUIProvider>
</UserBusinessProvider>
```

### 18. Prefer Domain Isolation - Use Cross-Domain Only When Necessary

```typescript
// ✅ Good: Domain isolation (preferred)
function UserProfile() {
  const profileStore = useUserStore('profile');
  const userAction = useUserAction();
  // Self-contained user logic
}

// ✅ Also good: Cross-domain when truly needed
function useCheckoutProcess() {
  const userProfile = useUserStore('profile');
  const cartItems = useCartStore('items');
  const userAction = useUserAction();
  const cartAction = useCartAction();
  
  // Business logic that truly spans domains
}

// ❌ Avoid: Unnecessary coupling
function UserProfile() {
  const cartItems = useCartStore('items'); // Why does user profile need cart?
}
```

### 19. Document Domain Boundaries Clearly

```typescript
// ✅ Good: Clear documentation
/**
 * User Domain
 * 
 * Responsibilities:
 * - User authentication and profile management
 * - User preferences and settings
 * - User session management
 * 
 * Dependencies:
 * - None (self-contained)
 * 
 * Provides to other domains:
 * - User ID for data association
 * - Authentication status
 */
export interface UserData {
  // Domain data definition
}
```

## Development Workflow Best Practices

### 20. Test Handlers in Isolation

```typescript
// ✅ Good: Isolated handler testing
describe('updateProfile handler', () => {
  it('should update profile with valid data', async () => {
    // Arrange
    const mockRegistry = createMockRegistry();
    const mockController = createMockController();
    const handler = createUpdateProfileHandler(mockRegistry);
    
    // Act
    const result = await handler(
      { data: { name: 'John Doe' } },
      mockController
    );
    
    // Assert
    expect(result).toEqual({ success: true });
    expect(mockRegistry.getStore('profile').setValue).toHaveBeenCalledWith({
      name: 'John Doe'
    });
  });
});
```

### 21. Use Consistent Error Handling

```typescript
// ✅ Correct: Consistent error patterns
const handler = useCallback(async (payload, controller) => {
  try {
    // Validation
    if (!isValid(payload)) {
      controller.abort('Validation failed: invalid payload');
      return { success: false, error: 'VALIDATION_ERROR' };
    }
    
    // Business logic
    const result = await performOperation(payload);
    
    return { success: true, data: result };
    
  } catch (error) {
    controller.abort('Operation failed', error);
    return { 
      success: false, 
      error: error.code || 'UNKNOWN_ERROR',
      message: error.message 
    };
  }
}, []);
```

### 22. Implement Progressive Enhancement

```typescript
// ✅ Good: Progressive enhancement
function useUserFeatures() {
  const profile = useStoreValue(useUserStore('profile'));
  const [advancedFeatures, setAdvancedFeatures] = useState(false);
  
  // Enable advanced features progressively
  useEffect(() => {
    if (profile.role === 'premium' && profile.isActive) {
      setAdvancedFeatures(true);
    }
  }, [profile.role, profile.isActive]);
  
  return {
    basicFeatures: true,      // Always available
    advancedFeatures,         // Conditionally available
    adminFeatures: profile.role === 'admin' // Role-based
  };
}
```

## Code Organization Best Practices

### 23. Consistent File Structure

```
src/
├── stores/
│   ├── user/
│   │   ├── userBusiness.store.ts
│   │   ├── userUI.store.ts
│   │   └── index.ts
│   ├── cart/
│   │   ├── cart.store.ts
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── handlers/
│   │   ├── useUserHandlers.ts
│   │   ├── useCartHandlers.ts
│   │   └── index.ts
│   ├── logic/
│   │   ├── useUserLogic.ts
│   │   ├── useCartLogic.ts
│   │   └── index.ts
│   └── integration/
│       ├── useUserCartIntegration.ts
│       └── index.ts
├── components/
│   ├── user/
│   ├── cart/
│   └── shared/
└── providers/
    ├── UserProvider.tsx
    ├── CartProvider.tsx
    └── AppProvider.tsx
```

### 24. Use Barrel Exports

```typescript
// stores/user/index.ts
export * from './userBusiness.store';
export * from './userUI.store';

// stores/index.ts  
export * from './user';
export * from './cart';
export * from './order';

// Usage
import { useUserStore, useCartStore } from '@/stores';
```

### 25. Implement Consistent Naming Conventions

```typescript
// ✅ Consistent naming
// Stores
export const useUserBusinessStore = ...;
export const useUserUIStore = ...;

// Actions
export const useUserBusinessAction = ...;
export const useUserUIAction = ...;

// Handlers
export const useUserBusinessHandlers = ...;
export const useUserUIHandlers = ...;

// Logic hooks
export const useUserProfile = ...;
export const useUserSettings = ...;
```

---

## Summary Checklist

### Handler Registration ✓
- [ ] Always use `useActionRegister` + `useEffect` pattern
- [ ] Return unregister function for cleanup
- [ ] Use `blocking: true` for sequential async handlers
- [ ] Consider explicit IDs for debugging and critical handlers
- [ ] Wrap handlers with `useCallback` to prevent re-registration

### Store Access ✓
- [ ] Use domain-specific hooks in components
- [ ] Use `registry.getStore()` for lazy evaluation in handlers
- [ ] Provide proper initial values, not null
- [ ] Keep store updates predictable and traceable

### Type Safety ✓
- [ ] Define interfaces for better type safety
- [ ] Use domain-specific hooks for type inference
- [ ] Avoid `any` types - leverage TypeScript

### Performance ✓
- [ ] Only subscribe to needed stores
- [ ] Use proper handler priorities
- [ ] Clean up handlers on unmount
- [ ] Use result collection selectively

### Architecture ✓
- [ ] One domain = One context boundary
- [ ] Separate business and UI concerns
- [ ] Prefer domain isolation - use cross-domain only when necessary
- [ ] Document domain boundaries clearly

Following these best practices ensures maintainable, scalable, and performant applications with the Context-Action framework.

---

::: tip Continuous Improvement
Regularly review your codebase against this checklist. Consider setting up ESLint rules and automated checks to enforce these patterns in your development workflow.
:::