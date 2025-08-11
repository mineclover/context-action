# Setup & Usage

This guide covers the detailed setup and usage patterns for the Context-Action framework. Learn how to properly configure your domains, providers, and implement best practices.

## Installation & Setup

### Package Installation

```bash
# Core packages (required)
npm install @context-action/core @context-action/react

# Optional integrations
npm install @context-action/jotai  # For Jotai integration
npm install @context-action/logger # For enhanced logging
```

### TypeScript Configuration

Ensure your `tsconfig.json` has strict type checking enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noImplicitThis": true
  }
}
```

## Domain Setup Patterns

### 1. Basic Domain Setup

Start with a simple domain structure:

```typescript
// stores/counter.store.ts
import { createDeclarativeStores, createActionContext } from '@context-action/react';

// Define your domain data
export interface CounterData {
  count: { value: number; step: number };
  history: { actions: string[]; timestamps: number[] };
}

// Define your domain actions
export interface CounterActions {
  increment: void;
  decrement: void;
  setStep: { step: number };
  reset: void;
}

// Create domain-specific store hooks
export const {
  Provider: CounterProvider,
  useStore: useCounterStore,
  useRegistry: useCounterRegistry
} = createDeclarativeStores<CounterData>('Counter', {
  count: { 
    initialValue: { value: 0, step: 1 }
  },
  history: { 
    initialValue: { actions: [], timestamps: [] }
  }
});

// Create domain-specific action hooks
export const {
  Provider: CounterActionProvider,
  useAction: useCounterAction,
  useActionRegister: useCounterActionRegister
} = createActionContext<CounterActions>({ 
  name: 'CounterAction' 
});
```

### 2. Multi-Layer Domain Setup

Separate business logic from UI state:

```typescript
// stores/user/userBusiness.store.ts
export interface UserBusinessData {
  profile: { id: string; name: string; email: string };
  session: { token: string; expiresAt: number };
}

export interface UserBusinessActions {
  login: { email: string; password: string };
  logout: void;
  updateProfile: { data: Partial<UserBusinessData['profile']> };
}

export const {
  Provider: UserBusinessProvider,
  useStore: useUserBusinessStore,
  useRegistry: useUserBusinessRegistry
} = createDeclarativeStores<UserBusinessData>('UserBusiness', {
  // ... store definitions
});

// stores/user/userUI.store.ts  
export interface UserUIState {
  view: { isEditing: boolean; selectedTab: string };
  modal: { isOpen: boolean; type: string | null };
  validation: { errors: Record<string, string> };
}

export interface UserUIActions {
  setEditMode: { editing: boolean };
  openModal: { type: string; data?: any };
  closeModal: void;
}

export const {
  Provider: UserUIProvider,
  useStore: useUserUIStore
} = createDeclarativeStores<UserUIState>('UserUI', {
  // ... UI state definitions
});
```

## Provider Composition Patterns

### 1. Single Domain Provider

```typescript
// providers/CounterProvider.tsx
import React from 'react';
import { 
  CounterProvider,
  CounterActionProvider
} from '../stores/counter.store';
import { useCounterHandlers } from '../hooks/useCounterHandlers';

function CounterHandlersSetup() {
  useCounterHandlers();
  return null;
}

export function CounterDomainProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <CounterProvider>
      <CounterActionProvider>
        <CounterHandlersSetup />
        {children}
      </CounterActionProvider>
    </CounterProvider>
  );
}
```

### 2. Multi-Domain Provider Composition

```typescript
// providers/AppProvider.tsx
import React from 'react';
import { 
  UserBusinessProvider,
  UserBusinessActionProvider,
  UserUIProvider,
  UserUIActionProvider
} from '../stores/user';
import {
  CartProvider,
  CartActionProvider
} from '../stores/cart';

// Individual domain provider
function UserDomainProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserBusinessProvider>
      <UserUIProvider>
        <UserBusinessActionProvider>
          <UserUIActionProvider>
            <UserHandlersSetup />
            {children}
          </UserUIActionProvider>
        </UserBusinessActionProvider>
      </UserUIProvider>
    </UserBusinessProvider>
  );
}

// Application-wide provider composition
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserDomainProvider>
      <CartDomainProvider>
        <OrderDomainProvider>
          {children}
        </OrderDomainProvider>
      </CartDomainProvider>
    </UserDomainProvider>
  );
}
```

### 3. HOC Pattern for Self-Contained Components

```typescript
// Higher-order component approach
const UserStores = createContextStorePattern('User');

export const withUserDomain = UserStores.withCustomProvider(
  ({ children }) => (
    <UserActionProvider>
      <UserHandlersSetup />
      {children}
    </UserActionProvider>
  ),
  'user-domain'
);

// Usage - completely self-contained
const UserModule = withUserDomain(() => {
  const userStore = UserStores.useStore('profile', initialData);
  const dispatch = useUserAction();
  
  return <UserInterface />;
});

// No manual provider setup needed
function App() {
  return (
    <div>
      <UserModule />  {/* Self-contained with providers */}
    </div>
  );
}
```

## Handler Implementation Patterns

### 1. Basic Handler Setup

```typescript
// hooks/useCounterHandlers.ts
import { useEffect, useCallback } from 'react';
import { 
  useCounterActionRegister,
  useCounterRegistry
} from '../stores/counter.store';

export function useCounterHandlers() {
  const register = useCounterActionRegister();
  const registry = useCounterRegistry();
  
  // Increment handler
  const incrementHandler = useCallback(async (payload, controller) => {
    const countStore = registry.getStore('count');
    const historyStore = registry.getStore('history');
    
    const currentCount = countStore.getValue();
    const currentHistory = historyStore.getValue();
    
    // Update count
    countStore.setValue({
      ...currentCount,
      value: currentCount.value + currentCount.step
    });
    
    // Update history
    historyStore.setValue({
      actions: [...currentHistory.actions, 'increment'],
      timestamps: [...currentHistory.timestamps, Date.now()]
    });
    
    return { success: true, newValue: currentCount.value + currentCount.step };
  }, [registry]);
  
  // Register all handlers
  useEffect(() => {
    if (!register) return;
    
    const unregisterIncrement = register('increment', incrementHandler, {
      priority: 100,
      blocking: true,
      id: 'counter-increment'
    });
    
    // Add other handlers...
    
    return () => {
      unregisterIncrement();
      // Cleanup other handlers...
    };
  }, [register, incrementHandler]);
}
```

### 2. Advanced Handler Patterns

```typescript
// hooks/useAdvancedHandlers.ts
export function useAdvancedHandlers() {
  const register = useActionRegister();
  const registry = useRegistry();
  
  // Handler with validation
  const validateAndUpdate = useCallback(async (payload, controller) => {
    // Input validation
    if (!payload.data) {
      controller.abort('Data is required');
      return { success: false, error: 'Missing data' };
    }
    
    // Business rule validation
    const currentState = registry.getStore('state').getValue();
    if (!canPerformAction(currentState, payload)) {
      controller.abort('Action not allowed in current state');
      return { success: false, error: 'Invalid state' };
    }
    
    try {
      // Perform update
      const result = await performUpdate(payload.data);
      
      // Update multiple stores atomically
      const stateStore = registry.getStore('state');
      const historyStore = registry.getStore('history');
      
      stateStore.setValue(result.newState);
      historyStore.setValue({
        ...historyStore.getValue(),
        lastAction: { type: 'update', timestamp: Date.now() }
      });
      
      return { success: true, result };
      
    } catch (error) {
      controller.abort('Update failed', error);
      return { success: false, error: error.message };
    }
  }, [registry]);
  
  // Handler with side effects
  const handlerWithSideEffects = useCallback(async (payload, controller) => {
    const store = registry.getStore('data');
    
    // Main operation
    const result = await mainOperation(payload);
    store.setValue(result);
    
    // Side effects (fire and forget)
    scheduleCleanup(result.id);
    sendAnalytics('operation_completed', { id: result.id });
    
    // Optional: Set result for collection
    controller.setResult(result);
    
    return result;
  }, [registry]);
  
  // Conditional handler execution
  const conditionalHandler = useCallback(async (payload, controller) => {
    const userStore = registry.getStore('user');
    const user = userStore.getValue();
    
    // Skip if user not authenticated
    if (!user.id) {
      return; // Handler completes without error
    }
    
    // Skip if insufficient permissions
    if (!hasPermission(user, payload.requiredPermission)) {
      controller.abort('Insufficient permissions');
      return;
    }
    
    // Continue with authenticated user logic
    await performAuthenticatedAction(payload, user);
  }, [registry]);
  
  // Handler with priority control
  const priorityHandler = useCallback(async (payload, controller) => {
    if (payload.urgent) {
      // Jump to high priority execution
      controller.jumpToPriority(200);
    }
    
    // Regular processing
    await processAction(payload);
  }, []);
}
```

## Component Usage Patterns

### 1. Basic Component Integration

```typescript
// components/Counter.tsx
import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useCounterStore, useCounterAction } from '../stores/counter.store';

export function Counter() {
  const countStore = useCounterStore('count');
  const historyStore = useCounterStore('history');
  
  const count = useStoreValue(countStore);
  const history = useStoreValue(historyStore);
  const dispatch = useCounterAction();
  
  return (
    <div>
      <h2>Count: {count.value}</h2>
      <p>Step: {count.step}</p>
      
      <button onClick={() => dispatch('increment')}>
        +{count.step}
      </button>
      
      <button onClick={() => dispatch('decrement')}>
        -{count.step}
      </button>
      
      <button onClick={() => dispatch('reset')}>
        Reset
      </button>
      
      <div>
        <h3>History</h3>
        {history.actions.map((action, index) => (
          <div key={index}>
            {action} at {new Date(history.timestamps[index]).toLocaleTimeString()}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Logic Fit Hooks Pattern

```typescript
// hooks/useCounterLogic.ts
export function useCounterLogic() {
  const countStore = useCounterStore('count');
  const historyStore = useCounterStore('history');
  const dispatch = useCounterAction();
  
  const count = useStoreValue(countStore);
  const history = useStoreValue(historyStore);
  
  // Computed values
  const canIncrement = count.value < 100;
  const canDecrement = count.value > 0;
  const totalActions = history.actions.length;
  
  // Methods
  const increment = useCallback(() => {
    if (canIncrement) {
      dispatch('increment');
    }
  }, [canIncrement, dispatch]);
  
  const decrement = useCallback(() => {
    if (canDecrement) {
      dispatch('decrement');
    }
  }, [canDecrement, dispatch]);
  
  const setStep = useCallback((step: number) => {
    if (step > 0 && step <= 10) {
      dispatch('setStep', { step });
    }
  }, [dispatch]);
  
  return {
    // State
    count: count.value,
    step: count.step,
    history: history.actions,
    
    // Computed
    canIncrement,
    canDecrement,
    totalActions,
    
    // Methods
    increment,
    decrement,
    setStep,
    reset: () => dispatch('reset')
  };
}

// Component using logic hook
export function SmartCounter() {
  const {
    count,
    step,
    canIncrement,
    canDecrement,
    increment,
    decrement,
    setStep
  } = useCounterLogic();
  
  return (
    <div>
      <h2>{count}</h2>
      <button onClick={increment} disabled={!canIncrement}>
        +{step}
      </button>
      <button onClick={decrement} disabled={!canDecrement}>
        -{step}
      </button>
    </div>
  );
}
```

### 3. Form Integration Pattern

```typescript
// components/UserForm.tsx
export function UserForm() {
  const profileStore = useUserStore('profile');
  const validationStore = useUserStore('validation');
  const dispatch = useUserAction();
  
  const profile = useStoreValue(profileStore);
  const validation = useStoreValue(validationStore);
  
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await dispatch('updateProfile', {
      data: formData
    });
    
    if (result?.success) {
      // Handle success
      console.log('Profile updated successfully');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            name: e.target.value 
          }))}
        />
        {validation.errors.name && (
          <span className="error">{validation.errors.name}</span>
        )}
      </div>
      
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            email: e.target.value 
          }))}
        />
        {validation.errors.email && (
          <span className="error">{validation.errors.email}</span>
        )}
      </div>
      
      <button type="submit">
        Save Profile
      </button>
    </form>
  );
}
```

## Configuration Options

### Store Configuration

```typescript
const {
  Provider,
  useStore,
  useRegistry
} = createDeclarativeStores<MyData>('Domain', {
  storeName: {
    initialValue: defaultValue,
    
    // Optional: Custom store options
    persist: true,           // Persist to localStorage
    serialize: customSerializer,
    deserialize: customDeserializer
  }
});
```

### Action Context Configuration

```typescript
const {
  Provider,
  useAction,
  useActionRegister
} = createActionContext<MyActions>({
  name: 'DomainAction',
  
  // Optional: Default execution options
  defaultOptions: {
    executionMode: 'sequential', // or 'parallel', 'race'
    timeout: 5000,
    retries: 2
  },
  
  // Optional: Custom logging
  logger: customLogger
});
```

---

## Summary

Proper setup and usage of the Context-Action framework involves:

1. **Domain Definition**: Clear interfaces for data and actions
2. **Provider Composition**: Proper nesting and organization
3. **Handler Implementation**: Business logic with proper cleanup
4. **Component Integration**: Reactive subscriptions and type safety
5. **Configuration**: Optional settings for advanced use cases

Following these patterns ensures scalable, maintainable applications with clear architectural boundaries.

---

::: tip Next Steps
- Explore [Store Management](./store-management) for advanced store patterns
- Learn [Action Handlers](./action-handlers) for complex business logic
- See [Full Implementation Guide](./full) for comprehensive examples
:::