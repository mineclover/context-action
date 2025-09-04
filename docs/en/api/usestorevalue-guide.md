# useStoreValue Hook Guide

Essential hook for reactive store value subscriptions with type safety.

## Purpose
Primary React hook for subscribing to store values with automatic re-rendering, selector support, and null-safe access.

## Function Signatures

### Basic Usage
```typescript
useStoreValue<T>(store: Store<T>, options?: StoreValueOptions<T>): T
```
- **Purpose**: Subscribe to complete store value
- **Returns**: Current store value with automatic re-renders

### Null-Safe Access
```typescript
useStoreValue<T>(store: undefined | null | Store<T>, options?: StoreValueOptions<T>): undefined | T
```
- **Purpose**: Handle optional/conditional stores safely
- **Returns**: `undefined` when store is null/undefined, value otherwise

### Selector Pattern
```typescript
useStoreValue<T, R>(store: Store<T>, selector: (value: T) => R, options?: StoreValueOptions<R>): R
```
- **Purpose**: Subscribe to derived/computed values from store
- **Returns**: Transformed value using selector function

### Selector with Null Safety
```typescript
useStoreValue<T, R>(store: undefined | null | Store<T>, selector: (value: T) => R, options?: StoreValueOptions<R>): undefined | R
```
- **Purpose**: Combine selector pattern with null-safe access
- **Returns**: `undefined` or selector result

## Core Features

### Reactive Subscriptions
```typescript
function UserProfile() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // Auto re-renders on change
  
  return <div>Name: {user.name}</div>;
}
```

### Selector Performance
```typescript
function UserEmail() {
  const userStore = useUserStore('profile');
  // Only re-renders when email changes, not other user fields
  const email = useStoreValue(userStore, user => user.email);
  
  return <div>Email: {email}</div>;
}
```

### Null-Safe Pattern
```typescript
function ConditionalProfile({ userStore }: { userStore?: Store<User> }) {
  const user = useStoreValue(userStore); // Returns undefined if store is null
  
  if (!user) return <div>No user loaded</div>;
  return <div>User: {user.name}</div>;
}
```

## Usage Patterns

### Direct Store Value
```typescript
const AppStores = createStoreContext('App', {
  counter: 0,
  user: { name: '', email: '' }
});

function Counter() {
  const counterStore = AppStores.useStore('counter');
  const count = useStoreValue(counterStore);
  
  return <div>Count: {count}</div>;
}
```

### Complex Object Access
```typescript
function UserInfo() {
  const userStore = AppStores.useStore('user');
  const user = useStoreValue(userStore);
  
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### Optimized Selectors
```typescript
function UserName() {
  const userStore = AppStores.useStore('user');
  // Only re-renders when name changes, not email
  const name = useStoreValue(userStore, user => user.name);
  
  return <h1>{name}</h1>;
}

function UserStatus() {
  const userStore = AppStores.useStore('user');
  // Compute derived state
  const isComplete = useStoreValue(userStore, user => 
    user.name.length > 0 && user.email.includes('@')
  );
  
  return <div>Profile: {isComplete ? 'Complete' : 'Incomplete'}</div>;
}
```

### List Processing
```typescript
const ListStores = createStoreContext('List', {
  items: [] as Array<{ id: string; name: string; active: boolean }>
});

function ActiveItemCount() {
  const itemsStore = ListStores.useStore('items');
  const activeCount = useStoreValue(itemsStore, items => 
    items.filter(item => item.active).length
  );
  
  return <div>Active Items: {activeCount}</div>;
}

function ItemNames() {
  const itemsStore = ListStores.useStore('items');
  const names = useStoreValue(itemsStore, items => 
    items.map(item => item.name)
  );
  
  return <ul>{names.map(name => <li key={name}>{name}</li>)}</ul>;
}
```

### Conditional Rendering
```typescript
function ProfileSection() {
  const userStore = AppStores.useStore('user');
  const hasUser = useStoreValue(userStore, user => 
    user.name.length > 0
  );
  
  if (!hasUser) {
    return <div>Please complete your profile</div>;
  }
  
  return <UserProfile />;
}
```

### Error Boundaries
```typescript
function SafeUserDisplay() {
  const userStore = AppStores.useStore('user');
  const displayName = useStoreValue(userStore, user => {
    try {
      return user.name || 'Anonymous';
    } catch {
      return 'Error loading user';
    }
  });
  
  return <div>{displayName}</div>;
}
```

### Multi-Store Coordination
```typescript
function UserDashboard() {
  const userStore = AppStores.useStore('user');
  const settingsStore = AppStores.useStore('settings');
  
  const user = useStoreValue(userStore);
  const theme = useStoreValue(settingsStore, settings => settings.theme);
  
  return (
    <div className={`dashboard ${theme}`}>
      <h1>Welcome, {user.name}</h1>
    </div>
  );
}
```

## Performance Optimization

### Selector Benefits
```typescript
// ❌ Re-renders on any user change
const user = useStoreValue(userStore);
return <div>{user.email}</div>;

// ✅ Only re-renders when email changes
const email = useStoreValue(userStore, user => user.email);
return <div>{email}</div>;
```

### Memoized Selectors
```typescript
const emailSelector = useCallback((user: User) => user.email, []);

function UserEmail() {
  const userStore = AppStores.useStore('user');
  const email = useStoreValue(userStore, emailSelector);
  
  return <div>{email}</div>;
}
```

### Complex Computations
```typescript
function ExpensiveComputation() {
  const dataStore = AppStores.useStore('data');
  const result = useStoreValue(dataStore, useMemo(() => 
    (data: DataType) => {
      // Expensive calculation only runs when data changes
      return data.items.reduce((sum, item) => sum + item.value, 0);
    }, []
  ));
  
  return <div>Total: {result}</div>;
}
```

## Type Safety Benefits

### Automatic Type Inference
```typescript
const UserStores = createStoreContext('User', {
  profile: { name: '', email: '', age: 25 }
});

function TypedComponent() {
  const profileStore = UserStores.useStore('profile');
  const profile = useStoreValue(profileStore); // Typed as { name: string; email: string; age: number }
  
  // TypeScript knows these properties exist
  return (
    <div>
      <div>{profile.name}</div>     {/* ✅ string */}
      <div>{profile.age}</div>      {/* ✅ number */}
      {/* <div>{profile.id}</div>   ❌ TypeScript error */}
    </div>
  );
}
```

### Selector Type Safety
```typescript
function TypedSelector() {
  const profileStore = UserStores.useStore('profile');
  
  // TypeScript infers return type as string
  const name = useStoreValue(profileStore, profile => profile.name);
  
  // TypeScript infers return type as boolean
  const isAdult = useStoreValue(profileStore, profile => profile.age >= 18);
  
  return <div>{name} is {isAdult ? 'adult' : 'minor'}</div>;
}
```

## Best Practices

### Single Responsibility
```typescript
// ✅ One value per hook call
const name = useStoreValue(userStore, user => user.name);
const email = useStoreValue(userStore, user => user.email);

// ❌ Avoid complex objects from selectors unless needed
const userInfo = useStoreValue(userStore, user => ({ 
  name: user.name, 
  email: user.email,
  computed: someExpensiveCalculation(user)
}));
```

### Null Safety Pattern
```typescript
function SafeComponent({ optionalStore }: { optionalStore?: Store<User> }) {
  const user = useStoreValue(optionalStore);
  
  if (!user) return <div>Loading...</div>;
  
  return <div>User: {user.name}</div>;
}
```

### Component Granularity
```typescript
// ✅ Small focused components
function UserName() {
  const name = useStoreValue(userStore, user => user.name);
  return <h1>{name}</h1>;
}

function UserEmail() {
  const email = useStoreValue(userStore, user => user.email);
  return <p>{email}</p>;
}

// Better than one large component that re-renders on any user change
```

## Common Patterns

### Loading States
```typescript
function UserProfile() {
  const userStore = AppStores.useStore('user');
  const user = useStoreValue(userStore);
  const isLoading = useStoreValue(userStore, user => !user.name);
  
  if (isLoading) return <div>Loading...</div>;
  return <div>Welcome, {user.name}</div>;
}
```

### Conditional Display
```typescript
function AdminPanel() {
  const userStore = AppStores.useStore('user');
  const isAdmin = useStoreValue(userStore, user => user.role === 'admin');
  
  if (!isAdmin) return null;
  
  return <div>Admin Controls</div>;
}
```

### Form Integration
```typescript
function ProfileForm() {
  const userStore = AppStores.useStore('user');
  const user = useStoreValue(userStore);
  
  return (
    <form>
      <input 
        type="text" 
        value={user.name}
        onChange={(e) => userStore.update(u => ({ ...u, name: e.target.value }))}
      />
      <input 
        type="email" 
        value={user.email}
        onChange={(e) => userStore.update(u => ({ ...u, email: e.target.value }))}
      />
    </form>
  );
}
```

## Integration

- **Store System**: Primary hook for reactive store subscriptions
- **React Context**: Seamless integration with Context-Action patterns
- **Type Safety**: Automatic TypeScript inference from store types
- **Performance**: Optimized re-rendering through intelligent subscription management

## Links

- **TypeDoc**: [useStoreValue.md](./react/src/functions/useStoreValue.md)
- **Store Guide**: [Store Class Guide](./store-guide.md)
- **Pattern Guide**: [Store Patterns](/en/guide/patterns/store/)