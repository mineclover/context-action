# MVVM-Inspired Architecture

The Context-Action framework implements a clean separation of concerns through an **MVVM-inspired pattern** combined with **Context Store Pattern** for complete domain isolation.

## Architecture Overview

The MVVM-inspired architecture provides clear separation between different layers of your application:

- **Actions** handle business logic (ViewModel layer)
- **Context Store Pattern** manages state with domain isolation (Model layer)
- **Components** render UI (View layer)
- **Context Boundaries** isolate functional domains
- **Type-Safe Integration** through domain-specific hooks

## Three-Layer Architecture

### Model Layer (Context Store Pattern)

The Model layer manages application state through isolated store contexts:

```typescript
// stores/user.store.ts
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

// Create domain-specific stores (Model layer)
export const {
  Provider: UserProvider,
  useStore: useUserStore,
  useRegistry: useUserRegistry
} = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: '',
      role: 'guest'
    }
  },
  preferences: {
    initialValue: {
      theme: 'light',
      language: 'en'
    }
  }
});
```

**Model Layer Responsibilities:**
- State management and persistence
- Data validation and consistency
- Domain boundaries and isolation
- Store lifecycle management

### ViewModel Layer (Actions)

The ViewModel layer handles business logic through action handlers:

```typescript
// Define business operations (ViewModel layer)
export interface UserActions {
  login: { email: string; password: string };
  logout: void;
  updateProfile: { data: Partial<UserData['profile']> };
  deleteUser: { userId: string };
}

// Create action context for business logic
export const {
  Provider: UserActionProvider,
  useAction: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>({ name: 'UserAction' });

// Business logic handlers (ViewModel layer)
function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  const loginHandler = useCallback(async (payload, controller) => {
    const profileStore = stores.getStore('profile');
    
    // Business logic: authentication
    try {
      const response = await authenticateUser(payload);
      
      // Update model
      profileStore.setValue({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role
      });
    } catch (error) {
      controller.abort('Authentication failed', error);
    }
  }, [stores]);
  
  useEffect(() => {
    if (!addHandler) return;
    return addHandler('login', loginHandler, { priority: 100, blocking: true });
  }, [addHandler, loginHandler]);
}
```

**ViewModel Layer Responsibilities:**
- Business logic implementation
- Data transformation and validation
- External service integration
- State coordination and updates

### View Layer (React Components)

The View layer handles UI rendering and user interactions:

```typescript
// components/UserProfile.tsx (View layer)
export function UserProfile() {
  // Connect to Model layer
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Connect to ViewModel layer
  const dispatch = useUserAction();
  
  // Local UI state (View layer only)
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(profile);
  
  // Sync form with model changes
  useEffect(() => {
    setFormData(profile);
  }, [profile]);
  
  // View actions (UI interactions)
  const handleSave = useCallback(async () => {
    try {
      // Delegate to ViewModel layer
      await dispatch('updateProfile', { data: formData });
      setEditMode(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  }, [dispatch, formData]);
  
  // Pure UI rendering
  if (editMode) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <input 
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        <button type="submit">Save</button>
        <button type="button" onClick={() => setEditMode(false)}>Cancel</button>
      </form>
    );
  }
  
  return (
    <div>
      <h2>{profile.name}</h2>
      <p>{profile.email}</p>
      <p>Role: {profile.role}</p>
      <button onClick={() => setEditMode(true)}>Edit</button>
    </div>
  );
}
```

**View Layer Responsibilities:**
- UI rendering and presentation
- User interaction handling
- Local UI state management
- Event handling and form validation

## MVVM Data Flow

### Unidirectional Data Flow

```
[View] → dispatch → [ViewModel] → update → [Model] → subscribe → [View]
```

1. **View** dispatches actions (user interactions)
2. **ViewModel** processes business logic
3. **Model** updates state
4. **View** re-renders through reactive subscriptions

### Complete Flow Example

```typescript
// 1. View Layer - User clicks save button
function SaveButton() {
  const dispatch = useUserAction();
  
  const handleSave = () => {
    // Dispatch to ViewModel layer
    dispatch('updateProfile', { data: { name: 'New Name' } });
  };
  
  return <button onClick={handleSave}>Save</button>;
}

// 2. ViewModel Layer - Business logic handler
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  const updateHandler = useCallback(async (payload, controller) => {
    // Business logic: validation
    if (!payload.data.name?.trim()) {
      controller.abort('Name cannot be empty');
      return;
    }
    
    // Business logic: data transformation
    const sanitizedData = {
      ...payload.data,
      name: payload.data.name.trim(),
      updatedAt: Date.now()
    };
    
    // Update Model layer
    const profileStore = registry.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    profileStore.setValue({
      ...currentProfile,
      ...sanitizedData
    });
  }, [registry]);
  
  useEffect(() => {
    if (!register) return;
    return register('updateProfile', updateHandler);
  }, [register, updateHandler]);
}

// 3. Model Layer - State management
const userStore = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: { /* initial state */ }
  }
});

// 4. View Layer - Reactive updates
function UserDisplay() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore); // Reactive subscription
  
  // Re-renders when Model updates
  return <div>{profile.name}</div>;
}
```

## Architecture Benefits

### 1. Clear Separation of Concerns

- **View**: Only UI rendering and user interactions
- **ViewModel**: Pure business logic, no UI dependencies
- **Model**: State management, no business logic

### 2. Testability

Each layer can be tested independently:

```typescript
// Test ViewModel layer (business logic)
describe('User Business Logic', () => {
  it('should validate profile updates', async () => {
    const handler = createUpdateProfileHandler(mockRegistry);
    const mockController = { abort: jest.fn() };
    
    await handler({ data: { name: '' } }, mockController);
    
    expect(mockController.abort).toHaveBeenCalledWith('Name cannot be empty');
  });
});

// Test View layer (UI interactions)
describe('UserProfile Component', () => {
  it('should dispatch action on save', () => {
    const mockDispatch = jest.fn();
    render(<UserProfile dispatch={mockDispatch} />);
    
    fireEvent.click(getByText('Save'));
    
    expect(mockDispatch).toHaveBeenCalledWith('updateProfile', { data: expect.any(Object) });
  });
});
```

### 3. Maintainability

- Business logic centralized in ViewModel handlers
- UI logic isolated in View components
- State management isolated in Model stores
- Clear interfaces between layers

### 4. Scalability

- Add new Views without affecting business logic
- Extend business logic without changing UI
- Scale Model independently
- Domain isolation prevents conflicts

## Advanced MVVM Patterns

### 1. Multi-Domain MVVM

```typescript
// Each domain has its own MVVM layers
const UserDomain = {
  Model: createUserStores(),
  ViewModel: createUserActions(),
  View: UserComponents
};

const CartDomain = {
  Model: createCartStores(),
  ViewModel: createCartActions(), 
  View: CartComponents
};

// Cross-domain coordination through integration layer
function useUserCartIntegration() {
  const userAction = useUserAction();   // User ViewModel
  const cartAction = useCartAction();   // Cart ViewModel
  
  const loginWithCartReset = useCallback(async (loginData) => {
    await userAction('login', loginData);        // User domain business logic
    await cartAction('clearCart');               // Cart domain business logic
  }, [userAction, cartAction]);
  
  return { loginWithCartReset };
}
```

### 2. Shared ViewModel Services

```typescript
// Shared business logic across domains
export function useNotificationService() {
  const userAction = useUserAction();
  const cartAction = useCartAction();
  const orderAction = useOrderAction();
  
  const sendNotification = useCallback(async (type: string, data: any) => {
    // Cross-domain business logic
    switch (type) {
      case 'user-update':
        return userAction('notifyUpdate', data);
      case 'cart-change':
        return cartAction('notifyChange', data);
      case 'order-status':
        return orderAction('notifyStatus', data);
    }
  }, [userAction, cartAction, orderAction]);
  
  return { sendNotification };
}
```

### 3. View-ViewModel Composition

```typescript
// Compose multiple ViewModels in a single View
export function DashboardView() {
  // Multiple ViewModel connections
  const userProfile = useUserProfile();       // User ViewModel
  const cartSummary = useCartSummary();       // Cart ViewModel
  const orderHistory = useOrderHistory();     // Order ViewModel
  
  return (
    <div>
      <UserProfileWidget {...userProfile} />
      <CartSummaryWidget {...cartSummary} />
      <OrderHistoryWidget {...orderHistory} />
    </div>
  );
}
```

## Best Practices

### ✅ Do

- **Keep layers pure**: No business logic in View, no UI logic in ViewModel
- **Use reactive subscriptions**: Connect View to Model through `useStoreValue`
- **Centralize business logic**: Put all business logic in ViewModel handlers
- **Test layers independently**: Unit test each layer in isolation
- **Use domain boundaries**: Keep related functionality together

### ❌ Don't

- **Mix layers**: Don't put business logic in components or UI logic in handlers
- **Direct store access**: Don't bypass ViewModel layer for state updates
- **Tight coupling**: Don't create dependencies between domains
- **Stale closures**: Don't capture values at registration time
- **Skip cleanup**: Always clean up handlers and subscriptions

---

## Summary

The MVVM-inspired architecture in Context-Action provides:

- **Clear Separation**: Distinct Model, ViewModel, and View layers
- **Type Safety**: Full TypeScript support across all layers  
- **Testability**: Independent testing of business logic and UI
- **Maintainability**: Centralized concerns with clear boundaries
- **Scalability**: Domain isolation and modular architecture

This architecture enables building complex, maintainable applications with clear responsibilities and strong architectural boundaries.

---

::: tip Next Steps
- Learn [Logic Fit Hooks](./logic-fit-hooks) for combining business and UI logic
- Explore [Cross-Domain Integration](./cross-domain-integration) for multi-domain coordination
- See [Testing Strategies](./testing) for comprehensive testing approaches
:::