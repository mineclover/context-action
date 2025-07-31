# Best Practices

## Overview

This guide provides comprehensive best practices for developing robust, maintainable, and performant applications using the Context-Action framework. Following these practices ensures your application scales well, remains testable, and provides excellent developer experience.

### Core Principles

- **🎯 Clarity Over Cleverness**: Write code that's easy to understand and maintain
- **🔒 Type Safety First**: Leverage TypeScript throughout your application
- **🧪 Test-Driven Development**: Write tests that verify business logic and integration
- **⚡ Performance by Design**: Consider performance implications from the start
- **🛡️ Error Handling**: Plan for failure scenarios and provide graceful recovery
- **📚 Documentation**: Document complex business logic and architectural decisions

## Action Design Best Practices

### 1. ✅ Action Structure and Organization

#### Keep Actions Focused and Single-Purpose

```typescript
// ✅ Good: Single, focused action
actionRegister.register('updateUserName', async (payload: { userId: string; name: string }, controller) => {
  const user = userStore.getValue();
  
  if (user.id !== payload.userId) {
    controller.abort('User mismatch');
    return;
  }
  
  if (!payload.name.trim()) {
    controller.abort('Name cannot be empty');
    return;
  }
  
  userStore.update(user => ({
    ...user,
    name: payload.name,
    updatedAt: Date.now()
  }));
});

// ❌ Bad: Action doing too many things
actionRegister.register('updateUserEverything', async (payload: any, controller) => {
  // Updates user, preferences, settings, sends emails, logs analytics...
  // This violates single responsibility principle
});
```

#### Use Descriptive Action Names

```typescript
// ✅ Good: Clear, descriptive names
actionRegister.register('validateAndSubmitOrder', async (payload, controller) => { /* ... */ });
actionRegister.register('retryFailedPayment', async (payload, controller) => { /* ... */ });
actionRegister.register('sendWelcomeEmail', async (payload, controller) => { /* ... */ });

// ❌ Bad: Vague or unclear names
actionRegister.register('doStuff', async (payload, controller) => { /* ... */ });
actionRegister.register('handle', async (payload, controller) => { /* ... */ });
actionRegister.register('process', async (payload, controller) => { /* ... */ });
```

#### Implement Comprehensive Input Validation

```typescript
interface CreateUserPayload {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

actionRegister.register('createUser', async (payload: CreateUserPayload, controller) => {
  // Input validation with clear error messages
  if (!payload.email || !isValidEmail(payload.email)) {
    controller.abort('A valid email address is required');
    return;
  }
  
  if (!payload.password || payload.password.length < 8) {
    controller.abort('Password must be at least 8 characters long');
    return;
  }
  
  if (payload.password !== payload.confirmPassword) {
    controller.abort('Passwords do not match');
    return;
  }
  
  if (!payload.firstName?.trim() || !payload.lastName?.trim()) {
    controller.abort('First name and last name are required');
    return;
  }
  
  if (!payload.acceptTerms) {
    controller.abort('You must accept the terms of service');
    return;
  }
  
  // Business logic continues...
});
```

### 2. ✅ Error Handling Strategies

#### Provide Clear Error Messages

```typescript
actionRegister.register('processPayment', async (payload: PaymentPayload, controller) => {
  try {
    const result = await paymentService.process(payload);
    
    if (!result.success) {
      // Provide specific error messages based on failure type
      switch (result.errorCode) {
        case 'INSUFFICIENT_FUNDS':
          controller.abort('Payment failed: Insufficient funds in your account');
          break;
        case 'CARD_EXPIRED':
          controller.abort('Payment failed: Your card has expired');
          break;
        case 'CARD_DECLINED':
          controller.abort('Payment failed: Your card was declined');
          break;
        default:
          controller.abort(`Payment failed: ${result.errorMessage}`);
      }
      return;
    }
    
    // Success handling...
    
  } catch (error) {
    // Handle unexpected errors
    logger.error('Payment processing error:', error);
    controller.abort('Payment processing is temporarily unavailable. Please try again later.');
  }
});
```

#### Implement Rollback Strategies

```typescript
actionRegister.register('transferFunds', async (payload: TransferPayload, controller) => {
  const originalFromAccount = accountStore.getValue()[payload.fromAccountId];
  const originalToAccount = accountStore.getValue()[payload.toAccountId];
  
  try {
    // Step 1: Validate transfer
    if (originalFromAccount.balance < payload.amount) {
      controller.abort('Insufficient funds for transfer');
      return;
    }
    
    // Step 2: Update accounts
    accountStore.update(accounts => ({
      ...accounts,
      [payload.fromAccountId]: {
        ...originalFromAccount,
        balance: originalFromAccount.balance - payload.amount
      },
      [payload.toAccountId]: {
        ...originalToAccount,
        balance: originalToAccount.balance + payload.amount
      }
    }));
    
    // Step 3: Record transaction (external API call)
    const transaction = await api.recordTransaction(payload);
    
    // Step 4: Update transaction history
    transactionStore.update(transactions => [...transactions, transaction]);
    
  } catch (error) {
    // Rollback on any failure
    accountStore.update(accounts => ({
      ...accounts,
      [payload.fromAccountId]: originalFromAccount,
      [payload.toAccountId]: originalToAccount
    }));
    
    controller.abort('Transfer failed: Unable to complete transaction');
  }
});
```

### 3. ✅ Async Operation Patterns

#### Use Loading States Effectively

```typescript
actionRegister.register('loadUserProfile', async (payload: { userId: string }, controller) => {
  // Set loading state immediately
  uiStore.update(ui => ({
    ...ui,
    userProfile: { ...ui.userProfile, loading: true, error: null }
  }));
  
  try {
    const profile = await api.getUserProfile(payload.userId);
    
    // Update data and clear loading state
    userProfileStore.setValue(profile);
    uiStore.update(ui => ({
      ...ui,
      userProfile: { loading: false, error: null, lastUpdated: Date.now() }
    }));
    
  } catch (error) {
    // Clear loading state and set error
    uiStore.update(ui => ({
      ...ui,
      userProfile: { 
        loading: false, 
        error: error.message,
        lastError: Date.now()
      }
    }));
    
    controller.abort('Failed to load user profile');
  }
});
```

#### Implement Request Cancellation

```typescript
const activeRequestsStore = createStore<Record<string, AbortController>>({});

actionRegister.register('searchUsers', async (payload: { query: string }, controller) => {
  const requestKey = `search_${payload.query}`;
  
  // Cancel any existing search request
  const existingController = activeRequestsStore.getValue()[requestKey];
  if (existingController) {
    existingController.abort();
  }
  
  // Create new abort controller
  const abortController = new AbortController();
  activeRequestsStore.update(requests => ({
    ...requests,
    [requestKey]: abortController
  }));
  
  try {
    const results = await api.searchUsers(payload.query, {
      signal: abortController.signal
    });
    
    searchResultsStore.setValue(results);
    
    // Clean up request tracking
    activeRequestsStore.update(requests => {
      const newRequests = { ...requests };
      delete newRequests[requestKey];
      return newRequests;
    });
    
  } catch (error) {
    if (error.name === 'AbortError') {
      // Request was cancelled, don't treat as error
      return;
    }
    
    controller.abort('Search failed');
  }
});
```

## Store Management Best Practices

### 1. ✅ Store Design Patterns

#### Design Normalized Store Structures

```typescript
// ✅ Good: Normalized structure
interface AppState {
  users: {
    byId: Record<string, User>;
    allIds: string[];
  };
  posts: {
    byId: Record<string, Post>;
    allIds: string[];
    byUserId: Record<string, string[]>;
  };
  ui: {
    selectedUserId: string | null;
    loading: Record<string, boolean>;
    errors: Record<string, string | null>;
  };
}

// ❌ Bad: Denormalized, nested structure
interface BadAppState {
  users: Array<{
    id: string;
    name: string;
    posts: Array<{
      id: string;
      title: string;
      content: string;
      comments: Array<{
        id: string;
        text: string;
        author: User; // Circular reference
      }>;
    }>;
  }>;
}
```

#### Use Computed Stores for Derived State

```typescript
// Base stores
const usersStore = createStore<Record<string, User>>({});
const postsStore = createStore<Record<string, Post>>({});
const uiStore = createStore<{ selectedUserId: string | null }>({ selectedUserId: null });

// ✅ Good: Computed store for derived data
const selectedUserPostsStore = createComputedStore(
  [usersStore, postsStore, uiStore],
  (users, posts, ui) => {
    if (!ui.selectedUserId) return [];
    
    return Object.values(posts)
      .filter(post => post.userId === ui.selectedUserId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
);

// Component usage
function UserPostsList() {
  const posts = useStoreValue(selectedUserPostsStore);
  // Component re-renders only when relevant data changes
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

#### Implement Store Validation

```typescript
const userStore = createStore<User>({
  id: '',
  name: '',
  email: '',
  createdAt: 0
});

// Add validation layer
const validateUser = (user: User): void => {
  if (!user.id) throw new Error('User ID is required');
  if (!user.name.trim()) throw new Error('User name cannot be empty');
  if (!isValidEmail(user.email)) throw new Error('Invalid email format');
  if (user.createdAt <= 0) throw new Error('Invalid creation date');
};

// Wrapper for validated updates
const setValidatedUser = (user: User): void => {
  validateUser(user);
  userStore.setValue(user);
};

const updateValidatedUser = (updater: (user: User) => User): void => {
  const currentUser = userStore.getValue();
  const updatedUser = updater(currentUser);
  validateUser(updatedUser);
  userStore.setValue(updatedUser);
};
```

### 2. ✅ Performance Optimization

#### Use Selective Store Subscriptions

```typescript
// ❌ Bad: Component re-renders on any user change
function UserName() {
  const user = useStoreValue(userStore); // Re-renders for any user property change
  return <span>{user.name}</span>;
}

// ✅ Good: Component only re-renders when name changes
function UserName() {
  const userName = useStoreValue(userStore, user => user.name);
  return <span>{userName}</span>;
}

// ✅ Good: Memoized selector for complex computations
const userDisplayName = useStoreValue(userStore, 
  useMemo(() => (user: User) => 
    user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.email
  , [])
);
```

#### Batch Store Updates

```typescript
// ❌ Bad: Multiple separate updates causing multiple re-renders
actionRegister.register('updateUserProfile', async (payload, controller) => {
  userStore.update(user => ({ ...user, firstName: payload.firstName }));
  userStore.update(user => ({ ...user, lastName: payload.lastName }));
  userStore.update(user => ({ ...user, email: payload.email }));
  userStore.update(user => ({ ...user, updatedAt: Date.now() }));
});

// ✅ Good: Single batched update
actionRegister.register('updateUserProfile', async (payload, controller) => {
  userStore.update(user => ({
    ...user,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    updatedAt: Date.now()
  }));
});

// ✅ Good: Conditional updates to prevent unnecessary re-renders
actionRegister.register('updateUserIfChanged', async (payload, controller) => {
  const currentUser = userStore.getValue();
  
  const hasChanges = 
    currentUser.firstName !== payload.firstName ||
    currentUser.lastName !== payload.lastName ||
    currentUser.email !== payload.email;
  
  if (!hasChanges) {
    return; // No update needed
  }
  
  userStore.update(user => ({
    ...user,
    ...payload,
    updatedAt: Date.now()
  }));
});
```

## Component Integration Best Practices

### 1. ✅ Hook Usage Patterns

#### Organize Store Subscriptions Effectively

```typescript
// ✅ Good: Organized component with clear store usage
function UserDashboard({ userId }: { userId: string }) {
  // Group related store subscriptions
  const user = useStoreValue(userStore, user => 
    user.id === userId ? user : null
  );
  const userPosts = useStoreValue(postsStore, posts => 
    posts.filter(post => post.userId === userId)
  );
  const uiState = useStoreValue(uiStore, ui => ({
    loading: ui.loading,
    error: ui.error
  }));
  
  // Single dispatch instance
  const dispatch = useActionDispatch();
  
  // Memoized event handlers
  const handleUpdateUser = useCallback((updates: Partial<User>) => {
    dispatch('updateUser', { userId, ...updates });
  }, [dispatch, userId]);
  
  const handleCreatePost = useCallback((postData: CreatePostData) => {
    dispatch('createPost', { ...postData, userId });
  }, [dispatch, userId]);
  
  // Early returns for loading/error states
  if (uiState.loading) return <LoadingSpinner />;
  if (uiState.error) return <ErrorMessage error={uiState.error} />;
  if (!user) return <UserNotFound userId={userId} />;
  
  return (
    <div>
      <UserProfile user={user} onUpdate={handleUpdateUser} />
      <PostsList posts={userPosts} onCreate={handleCreatePost} />
    </div>
  );
}
```

#### Implement Custom Hooks for Complex Logic

```typescript
// ✅ Good: Custom hook encapsulating complex store logic
function useUserWithPosts(userId: string) {
  const user = useStoreValue(userStore, user => 
    user.id === userId ? user : null
  );
  
  const posts = useStoreValue(postsStore, posts => 
    posts.filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
  );
  
  const loading = useStoreValue(uiStore, ui => 
    ui.loading.user || ui.loading.posts
  );
  
  const error = useStoreValue(uiStore, ui => 
    ui.errors.user || ui.errors.posts
  );
  
  const dispatch = useActionDispatch();
  
  const refreshData = useCallback(() => {
    dispatch('loadUser', { userId });
    dispatch('loadUserPosts', { userId });
  }, [dispatch, userId]);
  
  const updateUser = useCallback((updates: Partial<User>) => {
    dispatch('updateUser', { userId, ...updates });
  }, [dispatch, userId]);
  
  const createPost = useCallback((postData: CreatePostData) => {
    dispatch('createPost', { ...postData, userId });
  }, [dispatch, userId]);
  
  return {
    user,
    posts,
    loading,
    error,
    actions: {
      refresh: refreshData,
      updateUser,
      createPost
    }
  };
}

// Usage in component
function UserDashboard({ userId }: { userId: string }) {
  const { user, posts, loading, error, actions } = useUserWithPosts(userId);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <UserNotFound userId={userId} />;
  
  return (
    <div>
      <UserProfile user={user} onUpdate={actions.updateUser} />
      <PostsList posts={posts} onCreate={actions.createPost} />
      <RefreshButton onClick={actions.refresh} />
    </div>
  );
}
```

### 2. ✅ Error Boundaries and Loading States

#### Implement Comprehensive Error Boundaries

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ActionErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    logger.error('Component error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
            {process.env.NODE_ENV === 'development' && (
              <pre>{this.state.errorInfo?.componentStack}</pre>
            )}
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        <ErrorBoundary>
          <Application />
        </ErrorBoundary>
      </ActionProvider>
    </StoreProvider>
  );
}
```

#### Create Reusable Loading Components

```typescript
// ✅ Good: Reusable loading wrapper
interface AsyncWrapperProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: string; onRetry?: () => void }>;
  onRetry?: () => void;
}

function AsyncWrapper({
  loading,
  error,
  children,
  loadingComponent: LoadingComponent = DefaultSpinner,
  errorComponent: ErrorComponent = DefaultError,
  onRetry
}: AsyncWrapperProps) {
  if (loading) {
    return <LoadingComponent />;
  }
  
  if (error) {
    return <ErrorComponent error={error} onRetry={onRetry} />;
  }
  
  return <>{children}</>;
}

// Usage in components
function UserProfile({ userId }: { userId: string }) {
  const user = useStoreValue(userStore);
  const loading = useStoreValue(uiStore, ui => ui.loading.user);
  const error = useStoreValue(uiStore, ui => ui.errors.user);
  const dispatch = useActionDispatch();
  
  const handleRetry = useCallback(() => {
    dispatch('loadUser', { userId });
  }, [dispatch, userId]);
  
  return (
    <AsyncWrapper 
      loading={loading} 
      error={error} 
      onRetry={handleRetry}
    >
      <div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
    </AsyncWrapper>
  );
}
```

## Testing Best Practices

### 1. ✅ Action Testing

#### Write Comprehensive Action Tests

```typescript
describe('updateUser action', () => {
  let mockUserStore: jest.Mocked<Store<User>>;
  let mockUIStore: jest.Mocked<Store<UIState>>;
  let mockAPI: jest.Mocked<typeof api>;
  
  beforeEach(() => {
    mockUserStore = createMockStore({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      updatedAt: 0
    });
    
    mockUIStore = createMockStore({
      loading: false,
      error: null
    });
    
    mockAPI = {
      updateUser: jest.fn()
    };
  });
  
  it('should update user successfully', async () => {
    // Arrange
    const payload = { name: 'Jane Doe', email: 'jane@example.com' };
    const controller = { abort: jest.fn() };
    mockAPI.updateUser.mockResolvedValue({ success: true });
    
    // Act
    await updateUserHandler(payload, controller);
    
    // Assert
    expect(mockUserStore.update).toHaveBeenCalledWith(
      expect.any(Function)
    );
    expect(mockAPI.updateUser).toHaveBeenCalledWith({
      id: '1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      updatedAt: expect.any(Number)
    });
    expect(controller.abort).not.toHaveBeenCalled();
  });
  
  it('should handle validation errors', async () => {
    // Arrange
    const payload = { name: '', email: 'invalid-email' };
    const controller = { abort: jest.fn() };
    
    // Act
    await updateUserHandler(payload, controller);
    
    // Assert
    expect(controller.abort).toHaveBeenCalledWith(
      'Name cannot be empty'
    );
    expect(mockUserStore.update).not.toHaveBeenCalled();
    expect(mockAPI.updateUser).not.toHaveBeenCalled();
  });
  
  it('should handle API errors', async () => {
    // Arrange
    const payload = { name: 'Jane Doe', email: 'jane@example.com' };
    const controller = { abort: jest.fn() };
    mockAPI.updateUser.mockRejectedValue(new Error('Network error'));
    
    // Act
    await updateUserHandler(payload, controller);
    
    // Assert
    expect(controller.abort).toHaveBeenCalledWith(
      'Failed to update user'
    );
    expect(mockUIStore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Network error',
        loading: false
      })
    );
  });
});
```

#### Test Action Integration

```typescript
describe('User Management Integration', () => {
  let userStore: Store<User>;
  let userListStore: Store<User[]>;
  let uiStore: Store<UIState>;
  
  beforeEach(() => {
    userStore = createStore(defaultUser);
    userListStore = createStore([]);
    uiStore = createStore({ loading: false, error: null });
  });
  
  it('should create user and update all related stores', async () => {
    // Arrange
    const newUserData = {
      name: 'New User',
      email: 'new@example.com'
    };
    
    // Act
    await dispatch('createUser', newUserData);
    
    // Assert
    const user = userStore.getValue();
    const userList = userListStore.getValue();
    const ui = uiStore.getValue();
    
    expect(user.name).toBe('New User');
    expect(user.email).toBe('new@example.com');
    expect(userList).toContain(user);
    expect(ui.loading).toBe(false);
    expect(ui.error).toBeNull();
  });
});
```

### 2. ✅ Component Testing

#### Test Component-Store Integration

```typescript
describe('UserProfile Component', () => {
  let userStore: Store<User>;
  let uiStore: Store<UIState>;
  
  beforeEach(() => {
    userStore = createStore({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      updatedAt: Date.now()
    });
    
    uiStore = createStore({
      loading: false,
      error: null
    });
  });
  
  it('should display user information', () => {
    render(
      <StoreProvider stores={{ userStore, uiStore }}>
        <UserProfile userId="1" />
      </StoreProvider>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
  
  it('should dispatch action on form submission', async () => {
    const mockDispatch = jest.fn();
    
    render(
      <StoreProvider stores={{ userStore, uiStore }}>
        <ActionProvider dispatch={mockDispatch}>
          <UserProfile userId="1" />
        </ActionProvider>
      </StoreProvider>
    );
    
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByText('Update');
    
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.click(submitButton);
    
    expect(mockDispatch).toHaveBeenCalledWith('updateUser', {
      userId: '1',
      name: 'Jane Doe'
    });
  });
  
  it('should show loading state', () => {
    uiStore.setValue({ loading: true, error: null });
    
    render(
      <StoreProvider stores={{ userStore, uiStore }}>
        <UserProfile userId="1" />
      </StoreProvider>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

## Performance Best Practices

### 1. ✅ Rendering Optimization

#### Prevent Unnecessary Re-renders

```typescript
// ✅ Good: Memoized component with specific dependencies
const UserCard = memo(({ userId }: { userId: string }) => {
  const user = useStoreValue(userStore, 
    useCallback(users => users[userId], [userId])
  );
  
  const handleEdit = useCallback(() => {
    dispatch('editUser', { userId });
  }, [userId]);
  
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
});

// ✅ Good: Virtualization for large lists
function UserList() {
  const userIds = useStoreValue(userListStore, users => 
    users.map(user => user.id)
  );
  
  return (
    <VirtualizedList
      height={400}
      itemCount={userIds.length}
      itemSize={60}
      renderItem={({ index, style }) => (
        <div style={style}>
          <UserCard userId={userIds[index]} />
        </div>
      )}
    />
  );
}
```

#### Optimize Store Selectors

```typescript
// ❌ Bad: Creating new objects on every render
function UserStats() {
  const stats = useStoreValue(userStore, user => ({
    fullName: `${user.firstName} ${user.lastName}`,
    isActive: user.lastLoginAt > Date.now() - 86400000,
    membershipDays: Math.floor((Date.now() - user.createdAt) / 86400000)
  })); // New object every time, causes unnecessary re-renders
  
  return <div>{stats.fullName}</div>;
}

// ✅ Good: Memoized selectors
const selectUserStats = createSelector(
  (user: User) => user.firstName,
  (user: User) => user.lastName,
  (user: User) => user.lastLoginAt,
  (user: User) => user.createdAt,
  (firstName, lastName, lastLoginAt, createdAt) => ({
    fullName: `${firstName} ${lastName}`,
    isActive: lastLoginAt > Date.now() - 86400000,
    membershipDays: Math.floor((Date.now() - createdAt) / 86400000)
  })
);

function UserStats() {
  const stats = useStoreValue(userStore, selectUserStats);
  return <div>{stats.fullName}</div>;
}
```

### 2. ✅ Memory Management

#### Clean Up Resources Properly

```typescript
actionRegister.register('startPeriodicSync', async (payload: { interval: number }, controller) => {
  const intervalId = setInterval(async () => {
    try {
      await dispatch('syncData', {});
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, payload.interval);
  
  // Store cleanup function
  cleanupStore.update(cleanup => ({
    ...cleanup,
    periodicSync: () => {
      clearInterval(intervalId);
    }
  }));
});

// Component cleanup hook
function useCleanupOnUnmount() {
  const cleanup = useStoreValue(cleanupStore);
  
  useEffect(() => {
    return () => {
      Object.values(cleanup).forEach(cleanupFn => {
        if (typeof cleanupFn === 'function') {
          cleanupFn();
        }
      });
    };
  }, [cleanup]);
}
```

## Development Workflow Best Practices

### 1. ✅ Code Organization

#### Organize Files by Feature

```
src/
├── features/
│   ├── user/
│   │   ├── actions/
│   │   │   ├── user-actions.ts
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── user-store.ts
│   │   │   ├── user-ui-store.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── UserProfile.tsx
│   │   │   ├── UserList.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useUser.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── orders/
│   └── products/
├── shared/
│   ├── stores/
│   ├── components/
│   └── utils/
└── app/
    ├── store-provider.tsx
    └── action-provider.tsx
```

#### Use Consistent Naming Conventions

```typescript
// Action names: verb + noun pattern
dispatch('createUser', payload);
dispatch('updateUserProfile', payload);
dispatch('deleteUserAccount', payload);
dispatch('validateUserInput', payload);

// Store names: noun + Store suffix
const userStore = createStore<User>({});
const userListStore = createStore<User[]>([]);
const userUIStore = createStore<UserUIState>({});

// Hook names: use + descriptive name
const useUser = (userId: string) => { /* ... */ };
const useUserList = (filters: UserFilters) => { /* ... */ };
const useUserActions = () => { /* ... */ };

// Component names: PascalCase, descriptive
const UserProfile = ({ userId }: UserProfileProps) => { /* ... */ };
const UserListItem = ({ user }: UserListItemProps) => { /* ... */ };
const UserEditModal = ({ userId, onClose }: UserEditModalProps) => { /* ... */ };
```

### 2. ✅ Documentation Standards

#### Document Complex Business Logic

```typescript
/**
 * Calculates the user's membership tier based on their activity and spending.
 * 
 * Tier calculation rules:
 * - Bronze: Default tier for all users
 * - Silver: $1000+ total spent OR 50+ orders in last 12 months
 * - Gold: $5000+ total spent AND 100+ orders in last 12 months
 * - Platinum: $10000+ total spent AND 200+ orders AND member for 2+ years
 * 
 * @param user - The user object containing spending and order history
 * @param orders - Array of user's orders for tier calculation
 * @returns The calculated membership tier
 */
actionRegister.register('calculateMembershipTier', async (
  payload: { userId: string },
  controller
) => {
  const user = userStore.getValue();
  const orders = orderStore.getValue().filter(order => 
    order.userId === payload.userId && 
    order.createdAt > Date.now() - (365 * 24 * 60 * 60 * 1000) // Last 12 months
  );
  
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const orderCount = orders.length;
  const membershipDuration = Date.now() - user.createdAt;
  const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
  
  let tier: MembershipTier = 'bronze';
  
  if (totalSpent >= 10000 && orderCount >= 200 && membershipDuration >= twoYears) {
    tier = 'platinum';
  } else if (totalSpent >= 5000 && orderCount >= 100) {
    tier = 'gold';
  } else if (totalSpent >= 1000 || orderCount >= 50) {
    tier = 'silver';
  }
  
  userStore.update(user => ({ ...user, membershipTier: tier }));
});
```

#### Document API Contracts

```typescript
/**
 * User registration action payload interface
 */
interface RegisterUserPayload {
  /** User's email address (must be unique and valid) */
  email: string;
  /** Password (minimum 8 characters, must contain uppercase, lowercase, and number) */
  password: string;
  /** Password confirmation (must match password) */
  confirmPassword: string;
  /** User's first name (required, non-empty) */
  firstName: string;
  /** User's last name (required, non-empty) */
  lastName: string;
  /** User must accept terms of service */
  acceptTerms: boolean;
  /** Optional marketing email consent */
  acceptMarketing?: boolean;
}

/**
 * Registers a new user account
 * 
 * @throws {ValidationError} When input validation fails
 * @throws {DuplicateEmailError} When email is already registered
 * @throws {ServiceUnavailableError} When registration service is down
 */
actionRegister.register('registerUser', async (
  payload: RegisterUserPayload,
  controller
) => {
  // Implementation...
});
```

## Security Best Practices

### 1. ✅ Input Validation and Sanitization

```typescript
import { z } from 'zod';

// Define validation schemas
const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms')
});

actionRegister.register('createUser', async (payload: unknown, controller) => {
  // Validate and parse input
  const validationResult = CreateUserSchema.safeParse(payload);
  
  if (!validationResult.success) {
    controller.abort(`Validation failed: ${validationResult.error.issues[0].message}`);
    return;
  }
  
  const validatedPayload = validationResult.data;
  
  // Sanitize input
  const sanitizedData = {
    ...validatedPayload,
    firstName: sanitizeString(validatedPayload.firstName),
    lastName: sanitizeString(validatedPayload.lastName),
  };
  
  // Continue with business logic...
});
```

### 2. ✅ Sensitive Data Handling

```typescript
// ❌ Bad: Storing sensitive data in stores
const userStore = createStore({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'plaintextpassword', // Never store passwords in client state
  creditCard: '4111-1111-1111-1111' // Never store sensitive financial data
});

// ✅ Good: Only store non-sensitive data
const userStore = createStore({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  hasPassword: true, // Boolean flag instead of actual password
  hasPaymentMethod: true // Boolean flag instead of actual payment data
});

// ✅ Good: Handle sensitive operations server-side
actionRegister.register('updatePassword', async (
  payload: { currentPassword: string; newPassword: string },
  controller
) => {
  try {
    // Send to server for secure processing
    await api.updatePassword({
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword
    });
    
    // Only update non-sensitive state
    userStore.update(user => ({
      ...user,
      hasPassword: true,
      passwordUpdatedAt: Date.now()
    }));
    
  } catch (error) {
    controller.abort('Failed to update password');
  }
});
```

## Summary

Following these best practices ensures your Context-Action applications are:

- **🎯 Maintainable**: Clear structure and separation of concerns
- **🔒 Type-Safe**: Comprehensive TypeScript usage
- **🧪 Testable**: Well-structured code with good test coverage
- **⚡ Performant**: Optimized rendering and efficient state management
- **🛡️ Robust**: Proper error handling and recovery mechanisms
- **📚 Documented**: Clear documentation for complex business logic
- **🔐 Secure**: Proper input validation and sensitive data handling

## Related Resources

- [MVVM Architecture Guide](./mvvm-architecture.md) - Overall architecture patterns
- [Store Integration Guide](./store-integration.md) - Store coordination patterns
- [Data Flow Patterns](./data-flow-patterns.md) - Advanced data flow techniques
- [API Reference](/api/core/) - Complete API documentation
- [Examples](/examples/) - Practical implementation examples