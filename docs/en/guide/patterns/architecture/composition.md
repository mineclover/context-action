# Pattern Composition

For complex applications, compose all three patterns for maximum flexibility and separation of concerns.

## Overview

The Context-Action framework provides three core patterns that can be composed together:

- **🎯 Action Only Pattern**: Pure action dispatching without stores
- **🏪 Store Only Pattern**: State management without actions  
- **🔧 Ref Context Pattern**: Direct DOM manipulation with zero re-renders

## Complete Composition Example

```tsx
// 1. Create separate contexts with renaming patterns
const { 
  Provider: EventActionProvider, 
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: { id: '', name: '' },
  counter: 0
});

const {
  Provider: UIRefsProvider,
  useRefHandler: useUIRef
} = createRefContext<{
  cursor: HTMLDivElement;
  notification: HTMLDivElement;
  modal: HTMLDivElement;
}>('UIRefs');

// 2. Compose all three patterns
function App() {
  return (
    <EventActionProvider>
      <AppStoreProvider>
        <UIRefsProvider>
          <ComplexComponent />
        </UIRefsProvider>
      </AppStoreProvider>
    </EventActionProvider>
  );
}

// 3. Use all three patterns in components
function ComplexComponent() {
  // Actions from Action Only pattern
  const dispatch = useEventAction();
  
  // State from Store Only pattern
  const userStore = useAppStore('user');
  const counterStore = useAppStore('counter');
  
  // Refs from RefContext pattern
  const cursor = useUIRef('cursor');
  const notification = useUIRef('notification');
  
  const user = useStoreValue(userStore);
  const counter = useStoreValue(counterStore);
  
  // Action handlers that update state and manipulate DOM (properly memoized)
  const updateUserHandler = useCallback((payload) => {
    // Update store
    userStore.setValue(payload);
    
    // Show notification with direct DOM manipulation
    if (notification.target) {
      notification.target.textContent = `User ${payload.name} updated!`;
      notification.target.style.display = 'block';
      notification.target.style.opacity = '1';
      
      setTimeout(() => {
        if (notification.target) {
          notification.target.style.opacity = '0';
          setTimeout(() => {
            if (notification.target) {
              notification.target.style.display = 'none';
            }
          }, 300);
        }
      }, 2000);
    }
    
    // Dispatch analytics
    dispatch('analytics', { event: 'user-updated' });
  }, [userStore, notification, dispatch]);

  useEventActionHandler('updateUser', updateUserHandler);
  
  // Mouse events with direct DOM manipulation
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }
  }, [cursor]);
  
  return (
    <div onMouseMove={handleMouseMove}>
      <div>User: {user.name}</div>
      <div>Counter: {counter}</div>
      
      {/* Direct DOM manipulation elements */}
      <div
        ref={cursor.setRef}
        className="fixed w-4 h-4 bg-blue-500 rounded-full pointer-events-none z-50"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      
      <div
        ref={notification.setRef}
        className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg"
        style={{ display: 'none', opacity: 0, transition: 'opacity 300ms' }}
      />
    </div>
  );
}
```

## Domain-Based Composition

### Business + UI Domain Separation

```tsx
// Business domain
const { 
  Provider: UserBusinessProvider, 
  useStore: useUserBusinessStore,
  useActionDispatch: useUserBusinessAction,
  useActionHandler: useUserBusinessActionHandler
} = createBusinessDomain();

// UI domain  
const {
  Provider: UserUIProvider,
  useStore: useUserUIStore,
  useRefHandler: useUserUIRef
} = createUIDomain();

// Combined provider
function UserProvider({ children }) {
  return (
    <UserBusinessProvider>
      <UserUIProvider>
        {children}
      </UserUIProvider>
    </UserBusinessProvider>
  );
}
```

### Domain-Specific Logic Hooks

```tsx
// Combine business and UI logic in reusable hooks
export function useUserEditor() {
  // Business layer
  const profileStore = useUserBusinessStore('profile');
  const businessAction = useUserBusinessAction();
  
  // UI layer  
  const viewStore = useUserUIStore('view');
  const modalRef = useUserUIRef('modal');
  
  const profile = useStoreValue(profileStore);
  const view = useStoreValue(viewStore);
  
  const startEditing = useCallback(() => {
    viewStore.setValue({ ...view, isEditing: true });
    
    // Show modal with direct DOM manipulation
    if (modalRef.target) {
      modalRef.target.style.display = 'block';
      modalRef.target.style.opacity = '1';
    }
  }, [viewStore, view, modalRef]);
  
  const saveChanges = useCallback(async (data) => {
    await businessAction('updateProfile', { data });
    viewStore.setValue({ ...view, isEditing: false });
    
    // Hide modal
    if (modalRef.target) {
      modalRef.target.style.opacity = '0';
      setTimeout(() => {
        if (modalRef.target) {
          modalRef.target.style.display = 'none';
        }
      }, 300);
    }
  }, [businessAction, viewStore, view, modalRef]);
  
  return {
    profile,
    isEditing: view.isEditing,
    startEditing,
    saveChanges
  };
}
```

## Architecture Patterns

### MVVM Architecture Integration

```tsx
// Model Layer (Store Only Pattern)
const ModelLayer = createDeclarativeStorePattern('Model', {
  userData: { id: '', name: '', email: '' },
  appState: { loading: false, error: null }
});

// ViewModel Layer (Action Only Pattern) 
const ViewModelLayer = createActionContext<{
  loadUser: { userId: string };
  updateUser: { data: Partial<UserData> };
  showError: { message: string };
}>('ViewModel');

// Performance Layer (RefContext Pattern)
const PerformanceLayer = createRefContext<{
  loadingSpinner: HTMLDivElement;
  errorModal: HTMLDivElement;
  userCard: HTMLDivElement;
}>('Performance');

// View Layer (React Components)
function UserView() {
  // Model
  const userStore = ModelLayer.useStore('userData');
  const user = useStoreValue(userStore);
  
  // ViewModel  
  const dispatch = ViewModelLayer.useActionDispatch();
  
  // Performance
  const spinnerRef = PerformanceLayer.useRefHandler('loadingSpinner');
  
  // Business logic handlers
  ViewModelLayer.useActionHandler('loadUser', async (payload) => {
    // Show loading spinner directly
    if (spinnerRef.target) {
      spinnerRef.target.style.display = 'block';
    }
    
    try {
      const userData = await userAPI.load(payload.userId);
      userStore.setValue(userData);
    } finally {
      // Hide loading spinner
      if (spinnerRef.target) {
        spinnerRef.target.style.display = 'none';
      }
    }
  });
  
  return (
    <div>
      <div>User: {user.name}</div>
      <div ref={spinnerRef.setRef} style={{ display: 'none' }}>
        Loading...
      </div>
    </div>
  );
}
```

## Performance Optimization

### Layer-Specific Optimizations

```tsx
// Performance Layer: Zero re-renders for animations
const AnimationLayer = createRefContext<{
  particles: HTMLDivElement;
  canvas: HTMLCanvasElement;
}>('Animation');

// State Layer: Selective updates for data
const DataLayer = createDeclarativeStorePattern('Data', {
  particleCount: 100,
  animationSpeed: 1.0,
  // Use reference equality for large datasets
  particleData: {
    initialValue: [] as Particle[],
    strategy: 'reference'
  }
});

// Action Layer: Coordination between layers
const CoordinationLayer = createActionContext<{
  updateAnimation: { speed: number };
  addParticle: { particle: Particle };
}>('Coordination');

function PerformanceOptimizedComponent() {
  // Data layer triggers React re-renders only for configuration
  const speedStore = DataLayer.useStore('animationSpeed');
  const speed = useStoreValue(speedStore);
  
  // Performance layer handles 60fps updates without React
  const particlesRef = AnimationLayer.useRefHandler('particles');
  
  // Coordination layer bridges between data and performance
  CoordinationLayer.useActionHandler('updateAnimation', (payload) => {
    speedStore.setValue(payload.speed); // Update config (React re-render)
    
    // Update animation directly (no React re-render)
    if (particlesRef.target) {
      particlesRef.target.style.animationDuration = `${1 / payload.speed}s`;
    }
  });
}
```

## Best Practices

### 1. Handler Registration (Critical)
- **Always use useCallback**: All action handlers must be wrapped with `useCallback` to prevent infinite re-registration
- **Proper Dependencies**: Include only necessary dependencies in the dependency array
- **Avoid Inline Functions**: Never pass inline functions directly to action handlers

> **Important**: For detailed handler registration patterns, see the [Handler Registration Guide](../conventions.md#handler-registration)

### 2. Pattern Selection Strategy
- **Start with Store Only** for simple state management
- **Add Action Only** when you need side effects or complex workflows
- **Add RefContext** when you need high-performance DOM manipulation
- **Compose all patterns** for full-featured applications

### 2. Domain Boundaries
- **Business Logic**: Use Action Only + Store Only patterns
- **UI Interactions**: Use Store Only + RefContext patterns  
- **Performance Critical**: Use RefContext pattern primarily
- **Cross-Domain**: Use composition hooks for integration

### 3. Provider Organization
- **Nested Providers**: Organize by domain hierarchy
- **HOC Pattern**: Use Higher-Order Components for automatic wrapping
- **Conditional Providers**: Load providers based on feature flags
- **Lazy Providers**: Load providers on-demand for performance

### 4. Performance Considerations
- **RefContext**: Use for animations, real-time interactions
- **Store Pattern**: Use reference equality for large datasets
- **Action Pattern**: Keep handlers lightweight, use async appropriately
- **Composition**: Minimize cross-pattern dependencies

## Migration Guide

### From Legacy Action Context Pattern

```tsx
// ❌ Old (removed)
// const UserContext = createActionContextPattern<UserActions>('User');

// ✅ New (compose patterns with renaming)
const { 
  Provider: UserActionProvider, 
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('UserStores', {
  profile: { id: '', name: '', email: '' },
  preferences: { theme: 'light' as const }
});

// Compose providers
function App() {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserComponent />
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

Pattern composition provides the ultimate flexibility while maintaining clear separation of concerns and optimal performance characteristics.