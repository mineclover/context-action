# MVVM + Clean Architecture Guide

## Overview

This guide presents a comprehensive approach to code organization using **MVVM (Model-View-ViewModel)** combined with **Clean Architecture** principles in React applications. The Context-Action framework provides the foundation for implementing this architecture with clear separation of concerns and maintainable code structure.

## Core Principles

### 1. Single Responsibility Principle
Each module has one reason to change and handles a specific aspect of the application.

### 2. Separation of Concerns
Logic is clearly separated into distinct layers:
- **View UI**: Pure presentation components
- **View Actions**: User interaction handlers
- **Data Schema**: State structure definitions
- **Data Actions**: Business logic operations

### 3. Composition over Inheritance
External concepts are integrated through composition hooks rather than tight coupling.

## Architecture Layers

### Layer Separation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                        View Layer                           │
├─────────────────────┬───────────────────────────────────────┤
│     View UI         │           View Actions                │
│  (Presentation)     │      (User Interactions)             │
│                     │                                       │
│ - Pure Components   │ - Event Handlers                      │
│ - UI State          │ - User Input Processing               │
│ - Rendering Logic   │ - Navigation Logic                    │
└─────────────────────┼───────────────────────────────────────┤
│                        ViewModel Layer                     │
├─────────────────────┬───────────────────────────────────────┤
│   Data Schema       │          Data Actions                 │
│ (State Structure)   │     (Business Logic)                  │
│                     │                                       │
│ - Type Definitions  │ - Action Handlers                     │
│ - Store Schemas     │ - Business Rules                      │
│ - Data Models       │ - API Integration                     │
└─────────────────────┴───────────────────────────────────────┘
```

## Implementation Pattern

### 1. View UI (Presentation Layer)

Pure presentation components that receive props and render UI elements.

```typescript
// components/UserProfile/UserProfileView.tsx
interface UserProfileViewProps {
  user: User;
  isLoading: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  isLoading,
  onEditClick,
  onDeleteClick
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <div className="actions">
        <button onClick={onEditClick}>Edit</button>
        <button onClick={onDeleteClick}>Delete</button>
      </div>
    </div>
  );
};
```

### 2. View Actions (Interaction Layer)

Handles user interactions and coordinates with business logic.

```typescript
// components/UserProfile/UserProfileActions.tsx
interface UserProfileActionsProps {
  userId: string;
  onSuccess?: (message: string) => void;
  onError?: (error: Error) => void;
}

export const useUserProfileActions = ({
  userId,
  onSuccess,
  onError
}: UserProfileActionsProps) => {
  const dispatch = useUserActionDispatch();
  
  const handleEdit = useCallback(() => {
    // Navigate to edit page or open modal
    navigate(`/users/${userId}/edit`);
  }, [userId]);

  const handleDelete = useCallback(async () => {
    try {
      await dispatch('deleteUser', { userId });
      onSuccess?.('User deleted successfully');
    } catch (error) {
      onError?.(error as Error);
    }
  }, [dispatch, userId, onSuccess, onError]);

  return {
    handleEdit,
    handleDelete
  };
};
```

### 3. Data Schema (Model Layer)

Defines the structure and types for application data.

```typescript
// domains/user/schema/UserSchema.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  action: string;
  resource: string;
}

// Store schema definition
export const userStoreSchema = {
  currentUser: {
    initialValue: null as User | null
  },
  userList: {
    initialValue: [] as User[]
  },
  selectedUser: {
    initialValue: null as User | null
  },
  loading: {
    initialValue: {
      fetch: false,
      create: false,
      update: false,
      delete: false
    } as LoadingStates
  }
};

export type UserStoreSchema = typeof userStoreSchema;
```

### 4. Data Actions (Business Logic Layer)

Implements business rules and data operations.

```typescript
// domains/user/actions/UserDataActions.ts
export const useUserDataActions = () => {
  const userStore = useUserStore();
  const apiService = useApiService();
  const logger = useLogger();

  const fetchUser = useCallback(async (userId: string) => {
    const loadingStore = userStore.getStore('loading');
    
    try {
      loadingStore.update(prev => ({ ...prev, fetch: true }));
      
      const user = await apiService.users.getById(userId);
      
      // Validate data schema
      const validatedUser = UserSchema.parse(user);
      
      userStore.getStore('currentUser').setValue(validatedUser);
      logger.logSystem('User fetched successfully', { userId });
      
    } catch (error) {
      logger.logError('Failed to fetch user', error);
      throw error;
    } finally {
      loadingStore.update(prev => ({ ...prev, fetch: false }));
    }
  }, [userStore, apiService, logger]);

  const deleteUser = useCallback(async (userId: string) => {
    const loadingStore = userStore.getStore('loading');
    
    try {
      loadingStore.update(prev => ({ ...prev, delete: true }));
      
      await apiService.users.delete(userId);
      
      // Update store state
      const userListStore = userStore.getStore('userList');
      userListStore.update(users => users.filter(u => u.id !== userId));
      
      logger.logSystem('User deleted successfully', { userId });
      
    } catch (error) {
      logger.logError('Failed to delete user', error);
      throw error;
    } finally {
      loadingStore.update(prev => ({ ...prev, delete: false }));
    }
  }, [userStore, apiService, logger]);

  return {
    fetchUser,
    deleteUser
  };
};
```

## Composition Hooks Pattern

### Integration Hook for External Concepts

When integrating external libraries or concepts, create composition hooks that manage the integration.

```typescript
// hooks/useUserProfileComposition.tsx
interface UseUserProfileCompositionProps {
  userId: string;
  enableRealTimeUpdates?: boolean;
  enableOptimisticUpdates?: boolean;
}

export const useUserProfileComposition = ({
  userId,
  enableRealTimeUpdates = false,
  enableOptimisticUpdates = false
}: UseUserProfileCompositionProps) => {
  const userStore = useUserStore();
  const dataActions = useUserDataActions();
  const viewActions = useUserProfileActions({
    userId,
    onSuccess: (message) => toast.success(message),
    onError: (error) => toast.error(error.message)
  });

  // Subscribe to required state
  const currentUser = useStoreValue(userStore.getStore('currentUser'));
  const loading = useStoreValue(userStore.getStore('loading'));
  const isLoading = loading.fetch || loading.delete;

  // Register required actions
  useUserActionHandler('fetchUser', dataActions.fetchUser);
  useUserActionHandler('deleteUser', dataActions.deleteUser);

  // External integrations
  useEffect(() => {
    if (enableRealTimeUpdates) {
      const subscription = websocketService.subscribe(
        `user:${userId}`,
        (updatedUser: User) => {
          userStore.getStore('currentUser').setValue(updatedUser);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, [userId, enableRealTimeUpdates, userStore]);

  // Optimistic updates integration
  const optimisticActions = useOptimisticActions({
    enabled: enableOptimisticUpdates,
    rollbackStore: userStore.getStore('currentUser')
  });

  // Initialize data
  useEffect(() => {
    if (userId && !currentUser) {
      dataActions.fetchUser(userId);
    }
  }, [userId, currentUser, dataActions]);

  return {
    // View UI props
    viewProps: {
      user: currentUser,
      isLoading,
      onEditClick: viewActions.handleEdit,
      onDeleteClick: viewActions.handleDelete
    },
    
    // Additional composition data
    actions: {
      ...viewActions,
      ...dataActions,
      ...optimisticActions
    },
    
    state: {
      currentUser,
      isLoading,
      error: null // You might want to add error state
    }
  };
};
```

### Using the Composition Hook

```typescript
// pages/UserProfilePage.tsx
interface UserProfilePageProps {
  userId: string;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ 
  userId 
}) => {
  const { viewProps, actions, state } = useUserProfileComposition({
    userId,
    enableRealTimeUpdates: true,
    enableOptimisticUpdates: true
  });

  if (!state.currentUser && state.isLoading) {
    return <PageLoadingSpinner />;
  }

  return (
    <PageLayout title="User Profile">
      <UserProfileView {...viewProps} />
      
      {/* Additional composed features */}
      <UserActivityFeed userId={userId} />
      <UserPermissionsPanel 
        user={state.currentUser} 
        onPermissionsChange={actions.updatePermissions}
      />
    </PageLayout>
  );
};
```

## Benefits of This Architecture

### 1. **Clear Separation of Concerns**
- View UI handles only presentation
- View Actions manage user interactions
- Data Schema defines structure
- Data Actions implement business logic

### 2. **Single Responsibility Principle**
Each module has one clear responsibility and reason to change.

### 3. **Testability**
- UI components can be tested with simple props
- Business logic can be tested independently
- Composition hooks can be tested in isolation

### 4. **Reusability**
- Pure components can be reused across different contexts
- Business logic is independent of UI implementation
- Composition hooks can be shared across similar features

### 5. **Maintainability**
- Changes in business logic don't affect UI
- UI changes don't require business logic updates
- External integrations are isolated in composition hooks

## Testing Strategy

### View UI Testing
```typescript
// __tests__/UserProfileView.test.tsx
describe('UserProfileView', () => {
  it('renders user information correctly', () => {
    const mockUser = createMockUser();
    render(
      <UserProfileView
        user={mockUser}
        isLoading={false}
        onEditClick={jest.fn()}
        onDeleteClick={jest.fn()}
      />
    );
    
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });
});
```

### Business Logic Testing
```typescript
// __tests__/useUserDataActions.test.ts
describe('useUserDataActions', () => {
  it('fetches user and updates store', async () => {
    const { result } = renderHook(() => useUserDataActions());
    const mockUser = createMockUser();
    
    mockApiService.users.getById.mockResolvedValue(mockUser);
    
    await act(async () => {
      await result.current.fetchUser('user-1');
    });
    
    expect(mockUserStore.getStore('currentUser').setValue)
      .toHaveBeenCalledWith(mockUser);
  });
});
```

### Composition Hook Testing
```typescript
// __tests__/useUserProfileComposition.test.ts
describe('useUserProfileComposition', () => {
  it('provides correct view props and actions', () => {
    const { result } = renderHook(() => 
      useUserProfileComposition({ userId: 'user-1' })
    );
    
    expect(result.current.viewProps).toMatchObject({
      user: expect.any(Object),
      isLoading: expect.any(Boolean),
      onEditClick: expect.any(Function),
      onDeleteClick: expect.any(Function)
    });
  });
});
```

## Best Practices

### 1. **Keep Components Pure**
- View UI components should only receive props and render
- No direct store access in presentation components
- No business logic in UI components

### 2. **Use Composition Hooks for Integration**
- External libraries integration happens in composition hooks
- Multiple concerns are composed together in one place
- Easy to enable/disable features through props

### 3. **Separate Data and UI State**
- Business data lives in data stores
- UI-specific state (modals, forms) lives in component state
- Clear distinction between domain data and presentation state

### 4. **Action Handler Registration**
- Register action handlers in composition hooks
- Use meaningful action names that reflect business operations
- Keep action handlers focused on single operations

### 5. **State Subscription Strategy**
- Subscribe to minimal required state in composition hooks
- Use selectors to derive computed state
- Avoid over-subscribing to prevent unnecessary re-renders

## Conclusion

The MVVM + Clean Architecture approach with Context-Action framework provides:

- **Clear boundaries** between different aspects of your application
- **High testability** through separation of concerns
- **Easy maintenance** with single responsibility modules
- **Flexible composition** through integration hooks
- **Scalable architecture** that grows with your application

This architecture ensures that your React applications remain maintainable, testable, and scalable as they grow in complexity.