# Advanced Store Hooks

Advanced store hook patterns including selective subscriptions, performance optimization, computed values, and debugging techniques.

## useStoreValue Advanced Patterns

### Selective Subscription

```typescript
const userStore = createStore('user', { 
  id: '1', 
  name: 'John', 
  email: 'john@example.com' 
})

// Only re-renders when name changes, ignores email/id changes
const userName = useStoreValue(userStore, user => user.name)
```

### Shallow Comparison for Objects

```typescript
const settingsStore = createStore('settings', {
  theme: 'light',
  language: 'en',
  notifications: { email: true, push: false }
})

// Re-renders only when top-level properties change
const settings = useStoreValue(settingsStore, undefined, { 
  comparison: 'shallow' 
})
```

### Conditional Subscription

```typescript
const [subscribeToUser, setSubscribeToUser] = useState(true)

// Conditionally subscribe to store changes
const user = useStoreValue(
  subscribeToUser ? userStore : null,
  user => user?.name
)
```

### Debounced Subscription

```typescript
// Debounce rapid store changes
const debouncedValue = useStoreValue(fastChangingStore, undefined, {
  debounce: 300  // Wait 300ms after last change
})
```

## useStoreSelector Advanced Usage

### Multi-Store Selection

```typescript
const { user, settings, theme } = useStoreSelector({
  user: userStore,
  settings: settingsStore,
  theme: themeStore
}, {
  user: user => ({ name: user.name, email: user.email }),
  settings: settings => settings.language,
  theme: theme => theme
})
```

### Complex Selections

```typescript
const profileData = useStoreSelector({
  user: userStore,
  profile: profileStore,
  permissions: permissionsStore
}, {
  user: user => user.id,
  profile: profile => ({ avatar: profile.avatar, bio: profile.bio }),
  permissions: perms => perms.canEdit
}, {
  comparison: 'deep'
})
```

### Conditional Usage

```typescript
const conditionalData = useStoreSelector(
  shouldLoad ? { data: dataStore } : {},
  shouldLoad ? { data: data => data.processed } : {}
)
```

## useComputedStore Patterns

### Basic Computed Value

```typescript
const userStore = createStore('user', { firstName: 'John', lastName: 'Doe' })

// Computed full name
const fullName = useComputedStore(
  [userStore],
  ([user]) => `${user.firstName} ${user.lastName}`
)
```

### Complex Computed Object

```typescript
const totalPrice = useComputedStore(
  [cartStore, discountStore, taxStore],
  ([cart, discount, tax]) => {
    const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0)
    const discountAmount = subtotal * (discount.percentage / 100)
    const taxAmount = (subtotal - discountAmount) * (tax.rate / 100)
    
    return {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: subtotal - discountAmount + taxAmount
    }
  }
)
```

### Performance Optimized with Caching

```typescript
const expensiveComputation = useComputedStore(
  [dataStore, configStore],
  ([data, config]) => heavyComputation(data, config),
  {
    comparison: 'deep',
    cacheKey: 'expensive-calc',
    debug: true
  }
)
```

## Performance Best Practices

### Memoization Strategies

```typescript
// Use selector to prevent unnecessary re-renders
const userName = useStoreValue(userStore, useCallback(
  user => user.name,
  [] // No dependencies needed for stable selector
))
```

### Batched Updates

```typescript
// Batch multiple store updates
const updateUserProfile = useCallback(async (updates) => {
  // Disable store notifications temporarily
  userStore.batch(() => {
    userStore.update(user => ({ ...user, ...updates.user }))
    profileStore.update(profile => ({ ...profile, ...updates.profile }))
    settingsStore.update(settings => ({ ...settings, ...updates.settings }))
  })
}, [])
```

### Lazy Evaluation

```typescript
// Lazy evaluation pattern for performance
const handleAction = useCallback(async () => {
  // Get current state at execution time, not render time
  const currentUser = userStore.getValue()
  const currentSettings = settingsStore.getValue()
  
  // Process with fresh state
  await processData(currentUser, currentSettings)
}, [])
```

## Debugging and Development

### Debug Mode

```typescript
// Enable debug logging for store hooks
const user = useStoreValue(userStore, undefined, {
  debug: true,
  debugName: 'UserProfile'
})
```

### Store State Inspection

```typescript
// Development utility for inspecting store state
const useStoreDebug = (store, name) => {
  useEffect(() => {
    const unsubscribe = store.subscribe((value, previous) => {
      console.log(`[${name}] State changed:`, { previous, current: value })
    })
    return unsubscribe
  }, [store, name])
}
```

## Error Handling

### Safe Store Access

```typescript
const userData = useStoreValue(userStore, user => {
  try {
    return user ? formatUserData(user) : null
  } catch (error) {
    console.error('Error formatting user data:', error)
    return null
  }
})
```

### Fallback Values

```typescript
const safeUserName = useStoreValue(
  userStore, 
  user => user?.name || 'Guest',
  { fallback: 'Loading...' }
)
```

## Path-Based Selection

```typescript
const appStore = createStore('app', {
  user: {
    profile: { name: 'John', email: 'john@example.com' },
    settings: { theme: 'dark' }
  },
  ui: { isLoading: false }
})

// Deep path value selection
const userName = useStorePathSelector(appStore, ['user', 'profile', 'name'])
const userTheme = useStorePathSelector(appStore, ['user', 'settings', 'theme'])
```

## Computed Store Instances

```typescript
const userStore = createStore('user', { name: 'John', score: 85 })
const settingsStore = createStore('settings', { showBadges: true })

// Computed Store instance creation
const userBadgeStore = useComputedStoreInstance(
  [userStore, settingsStore],
  ([user, settings]) => {
    if (!settings.showBadges) return null
    
    return {
      name: user.name,
      level: user.score >= 80 ? 'expert' : 'beginner',
      badge: user.score >= 90 ? '🏆' : user.score >= 70 ? '🥉' : '📖'
    }
  },
  { name: 'userBadge' }
)

// Subscribable from other components
function BadgeDisplay() {
  const badge = useStoreValue(userBadgeStore)
  return badge ? <div>{badge.badge} {badge.name}</div> : null
}
```

## Async Computed Patterns

```typescript
const userIdStore = createStore('userId', '123')

const userProfile = useAsyncComputedStore(
  [userIdStore],
  async ([userId]) => {
    if (!userId) return null
    
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  },
  {
    initialValue: null,
    name: 'userProfile'
  }
)

// Returns: { value, loading, error, reload }
```

## Real-World Examples

- [UserProfileDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - Advanced user profile management
- [ChatDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - Real-time chat with selective subscriptions
- [TodoListDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - Complex state management patterns

## Related Patterns

- [Store Basic Usage](./basic-usage.md) - Fundamental store patterns
- [Store HOC Pattern](./hoc-pattern.md) - Higher-order component patterns
- [Action Integration](../action/basic-usage.md) - Integrating with actions