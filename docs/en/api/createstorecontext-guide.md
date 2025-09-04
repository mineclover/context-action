# createStoreContext Function Guide

Create Store-Only pattern context for reactive state management.

## Purpose
Main pattern creation function for type-safe store management with React Context integration.

## Function Signatures

### Overload 1: Explicit Types
```typescript
createStoreContext<T extends Record<string, any>>(
  contextName: string, 
  initialStores: InitialStores<T>
): StoreContextReturn<T>
```

### Overload 2: Type Inference (Recommended)
```typescript
createStoreContext<T extends StoreDefinitions>(
  contextName: string, 
  storeDefinitions: T
): StoreContextReturn<InferStoreTypes<T>>
```

## Return Value

### Provider Component
```typescript
Provider: ({ children, registryId?: string }) => React.Element
```
- **Purpose**: Context provider for store access
- **registryId**: Optional isolation for multiple instances

### Core Hooks
```typescript
useStore<K>(storeName: K): Store<T[K]>           // Primary store access
useStoreManager(): StoreManager<T>               // Advanced store management
useStoreInfo(): { name: string; storeCount: number; availableStores: string[] }
useStoreClear(): () => void                      // Clear all stores
```

### HOC Support
```typescript
withProvider<P>(Component: ComponentType<P>, config?: WithProviderConfig): FC<P>
```

## Usage Patterns

### Basic Type Inference Pattern (Recommended)
```typescript
// Automatic type inference - no manual types needed
const UserStores = createStoreContext('User', {
  profile: { name: '', email: '', age: 25 },           // Direct values
  settings: { theme: 'light', notifications: true },
  preferences: { initialValue: { language: 'en' } },   // Configuration object
  counter: 0                                           // Primitive values
});

function UserComponent() {
  const profileStore = UserStores.useStore('profile');
  const profile = useStoreValue(profileStore);
  
  const updateProfile = () => {
    profileStore.update(current => ({
      ...current,
      name: 'Updated Name'
    }));
  };
  
  return <div>{profile.name}</div>;
}

function App() {
  return (
    <UserStores.Provider>
      <UserComponent />
    </UserStores.Provider>
  );
}
```

### Advanced Configuration Pattern
```typescript
const AppStores = createStoreContext('App', {
  // Configuration object with validation
  user: {
    initialValue: { id: '', name: '', email: '' },
    validator: (value) => value && typeof value.id === 'string',
    strategy: 'shallow' as const
  },
  
  // Direct value with type inference
  counter: 0,
  
  // Complex state
  ui: {
    initialValue: {
      modal: null as string | null,
      loading: false,
      errors: [] as string[]
    }
  }
});
```

### HOC Pattern (Auto Provider Wrapping)
```typescript
const DataStores = createStoreContext('Data', {
  items: [] as Item[],
  filters: { category: 'all', search: '' }
});

// Automatic provider wrapping
const App = DataStores.withProvider(() => (
  <div>
    <ItemList />
    <FilterPanel />
  </div>
));

// Usage with configuration
const AppWithConfig = DataStores.withProvider(MainComponent, {
  registryId: 'main-app'
});
```

### Multiple Store Contexts
```typescript
// Separate concerns with multiple contexts
const UserStores = createStoreContext('User', {
  profile: { name: '', email: '' },
  preferences: { theme: 'light' }
});

const ProductStores = createStoreContext('Product', {
  items: [] as Product[],
  cart: { items: [], total: 0 },
  favorites: new Set<string>()
});

function App() {
  return (
    <UserStores.Provider>
      <ProductStores.Provider>
        <MainApp />
      </ProductStores.Provider>
    </UserStores.Provider>
  );
}
```

### Registry Isolation Pattern
```typescript
const IsolatedStores = createStoreContext('Isolated', {
  data: { value: 0 }
});

function MultiInstance() {
  return (
    <div>
      <IsolatedStores.Provider registryId="instance-1">
        <ComponentA />
      </IsolatedStores.Provider>
      
      <IsolatedStores.Provider registryId="instance-2">
        <ComponentB />
      </IsolatedStores.Provider>
    </div>
  );
}
```

## Store Definition Types

### Direct Values (Type Inference)
```typescript
const SimpleStores = createStoreContext('Simple', {
  name: 'John',              // string
  age: 25,                   // number  
  active: true,              // boolean
  items: [] as string[],     // array with explicit type
  data: null as Data | null  // union types
});
```

### Configuration Objects
```typescript
const ConfigStores = createStoreContext('Config', {
  // Full configuration
  user: {
    initialValue: { id: '', name: '' },
    validator: (value) => value && value.id.length > 0,
    strategy: 'deep' as const
  },
  
  // Minimal configuration
  settings: {
    initialValue: { theme: 'light' }
  }
});
```

### Mixed Patterns
```typescript
const MixedStores = createStoreContext('Mixed', {
  // Direct values
  counter: 0,
  title: 'App Title',
  
  // Configuration objects  
  user: {
    initialValue: { name: '', email: '' },
    validator: (user) => user.email.includes('@')
  },
  
  // Complex types
  items: [] as Array<{ id: string; name: string }>,
  
  // Optional with defaults
  settings: {
    initialValue: { 
      theme: 'light' as const, 
      notifications: true 
    }
  }
});
```

## Advanced Usage

### Store Manager Access
```typescript
function AdminPanel() {
  const storeManager = AppStores.useStoreManager();
  const storeInfo = AppStores.useStoreInfo();
  
  const handleReset = () => {
    storeManager.resetStore('user');
    storeManager.resetStore('settings');
  };
  
  const handleClearAll = AppStores.useStoreClear();
  
  return (
    <div>
      <h3>Admin Panel</h3>
      <p>Context: {storeInfo.name}</p>
      <p>Store Count: {storeInfo.storeCount}</p>
      <p>Available: {storeInfo.availableStores.join(', ')}</p>
      
      <button onClick={handleReset}>Reset Selected</button>
      <button onClick={handleClearAll}>Clear All</button>
    </div>
  );
}
```

### Custom Store Updates
```typescript
function DataManager() {
  const itemsStore = AppStores.useStore('items');
  const filtersStore = AppStores.useStore('filters');
  
  const addItem = (item: Item) => {
    itemsStore.update(current => [...current, item]);
  };
  
  const applyFilter = (category: string) => {
    filtersStore.update(current => ({
      ...current,
      category
    }));
  };
  
  const resetData = () => {
    itemsStore.setValue([]);
    filtersStore.setValue({ category: 'all', search: '' });
  };
  
  return (
    <div>
      <button onClick={() => addItem(newItem)}>Add Item</button>
      <button onClick={() => applyFilter('electronics')}>Electronics</button>
      <button onClick={resetData}>Reset</button>
    </div>
  );
}
```

### Computed Values Pattern
```typescript
const ComputedStores = createStoreContext('Computed', {
  items: [] as Array<{ id: string; price: number; quantity: number }>,
  taxRate: 0.1
});

function ShoppingCart() {
  const itemsStore = ComputedStores.useStore('items');
  const taxRateStore = ComputedStores.useStore('taxRate');
  
  const items = useStoreValue(itemsStore);
  const taxRate = useStoreValue(taxRateStore);
  
  // Computed values (consider useMemo for complex calculations)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  return (
    <div>
      <div>Items: {items.length}</div>
      <div>Subtotal: ${subtotal.toFixed(2)}</div>
      <div>Tax: ${tax.toFixed(2)}</div>
      <div>Total: ${total.toFixed(2)}</div>
    </div>
  );
}
```

## Type Safety Benefits

### Automatic Type Inference
```typescript
const TypedStores = createStoreContext('Typed', {
  user: { name: 'John', age: 25, active: true },
  items: [] as Product[],
  settings: { theme: 'light' as const }
});

function TypeSafeComponent() {
  const userStore = TypedStores.useStore('user');
  const user = useStoreValue(userStore);
  
  // ✅ TypeScript knows these exist
  console.log(user.name);    // string
  console.log(user.age);     // number  
  console.log(user.active);  // boolean
  
  // ❌ TypeScript error - doesn't exist
  // console.log(user.email);
  
  // ✅ Type-safe updates
  userStore.update(current => ({
    ...current,
    age: current.age + 1  // TypeScript knows age is number
  }));
}
```

### Store Name Validation
```typescript
function ValidatedAccess() {
  const validStore = TypedStores.useStore('user');     // ✅ Valid
  const itemsStore = TypedStores.useStore('items');    // ✅ Valid
  // const invalid = TypedStores.useStore('unknown');  // ❌ TypeScript error
}
```

## Performance Considerations

- **Type Inference**: Preferred over explicit types for better performance
- **Direct Values**: More efficient than configuration objects for simple data
- **Registry Isolation**: Use `registryId` for multiple instances
- **Store Granularity**: Separate frequently-updated data into different stores
- **Update Patterns**: Use `update()` for partial updates, `setValue()` for replacement

## Integration

- **Pattern Type**: Store-Only pattern (no actions)
- **useStoreValue**: Essential hook for reactive subscriptions  
- **StoreManager**: Advanced store lifecycle management
- **HOC Support**: Automatic provider wrapping
- **MVVM Architecture**: Model layer implementation

## Links

- **TypeDoc**: [createStoreContext.md](./react/src/functions/createStoreContext.md)
- **Store Guide**: [Store Class Guide](./store-guide.md)  
- **Hook Guide**: [useStoreValue Guide](./usestorevalue-guide.md)
- **Pattern Guide**: [Store Patterns](/en/guide/patterns/store/)