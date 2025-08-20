# Context-Action Framework Conventions

This document defines coding conventions and best practices when using the Context-Action framework with its three core patterns: Actions, Stores, and RefContext.

## 📋 Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [File Structure](#file-structure)
3. [Pattern Usage](#pattern-usage)
4. [Type Definitions](#type-definitions)
5. [Code Style](#code-style)
6. [Performance Guidelines](#performance-guidelines)
7. [Error Handling](#error-handling)
8. [RefContext Conventions](#refcontext-conventions)

---

## Naming Conventions

### 🏷️ Renaming Pattern

The core convention of the Context-Action framework is **domain-based renaming pattern** for all three patterns.

#### ✅ Store Pattern Renaming
```tsx
// ✅ Recommended: Domain-based renaming
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {...});

// ❌ Avoid: Direct object access
const UserStores = createDeclarativeStorePattern('User', {...});
const userStore = UserStores.useStore('profile'); // Domain unclear
```

#### ✅ Action Pattern Renaming
```tsx
// ✅ Recommended: Domain-based renaming with generic type
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// ❌ Avoid: Generic names
const {
  Provider,
  useActionDispatch,
  useActionHandler
} = createActionContext<UserActions>('UserActions');
```

#### ✅ RefContext Pattern Renaming
```tsx
// ✅ Recommended: Domain-based renaming with destructured API
const {
  Provider: MouseProvider,
  useRefHandler: useMouseRef
} = createRefContext<MouseRefs>('Mouse');

// ❌ Avoid: Generic names
const {
  Provider,
  useRefHandler
} = createRefContext<MouseRefs>('Mouse');
```

### 🎯 Context Naming Rules

#### Domain-Based Naming
```tsx
// ✅ Recommended: Clear domain separation
'UserProfile'     // User profile related
'ShoppingCart'    // Shopping cart related  
'ProductCatalog'  // Product catalog related
'OrderManagement' // Order management related
'AuthSystem'      // Authentication system related
'MouseEvents'     // Mouse interaction related
'AnimationStates' // Animation and performance related

// ❌ Avoid: Ambiguous names
'Data'           // Too broad
'State'          // Not specific
'App'            // Scope unclear (use only at root level)
'Manager'        // Role unclear
'Refs'           // Too generic
```

#### Action vs Store vs RefContext Distinction
```tsx
// Action Context (behavior/event focused)
'UserActions'         // User actions
'PaymentActions'      // Payment actions
'NavigationActions'   // Navigation actions

// Store Context (data/state focused)  
'UserData'           // User data
'ProductCatalog'     // Product catalog
'ShoppingCart'       // Shopping cart state
'AppSettings'        // App settings

// RefContext (performance/DOM focused)
'MouseInteractions'  // Mouse event handling
'AnimationRefs'      // Animation element references
'FormElements'       // Form DOM elements
'MediaControls'      // Media player controls
```

### 🔤 Hook Naming Patterns

#### Store Hook Naming
```tsx
// ✅ Recommended: use + Domain + Store pattern
const useUserStore = UserContext.useStore;
const useProductStore = ProductContext.useStore;
const useCartStore = CartContext.useStore;

// Usage
const profileStore = useUserStore('profile');
const wishlistStore = useUserStore('wishlist');
```

#### Action Hook Naming
```tsx
// ✅ Recommended: use + Domain + Action pattern
const useUserAction = UserContext.useActionDispatch;
const usePaymentAction = PaymentContext.useActionDispatch;
const useUserActionHandler = UserContext.useActionHandler;

// Usage
const dispatch = useUserAction();
useUserActionHandler('updateProfile', handler);
```

#### RefContext Hook Naming
```tsx
// ✅ Recommended: use + Domain + Ref pattern
const useMouseRef = MouseContext.useRefHandler;
const useAnimationRef = AnimationContext.useRefHandler;
const useFormRef = FormContext.useRefHandler;

// Usage
const cursor = useMouseRef('cursor');
const trail = useMouseRef('trail');
const container = useMouseRef('container');
```

---

## File Structure

### 📁 Recommended Directory Structure

```
src/
├── contexts/           # Context definitions
│   ├── user/
│   │   ├── user.actions.ts     # UserActions interface + createActionContext
│   │   ├── user.stores.ts      # UserData interface + createDeclarativeStorePattern
│   │   ├── user.refs.ts        # UserRefs interface + createRefContext
│   │   └── index.ts            # Renamed exports
│   ├── product/
│   │   ├── product.actions.ts
│   │   ├── product.stores.ts
│   │   └── index.ts
│   ├── interactions/
│   │   ├── mouse.refs.ts       # Mouse interaction RefContext
│   │   ├── animation.refs.ts   # Animation RefContext
│   │   └── index.ts
│   └── index.ts        # All contexts re-export
├── providers/          # Provider components
│   ├── UserProvider.tsx
│   ├── ProductProvider.tsx
│   ├── MouseProvider.tsx
│   └── AppProvider.tsx         # Root Provider composition
├── hooks/             # Domain-specific custom hooks
│   ├── user/
│   │   ├── useUserHandlers.ts   # Action handler collection
│   │   ├── useUserProfile.ts    # Business logic hooks
│   │   └── index.ts
│   ├── interactions/
│   │   ├── useMouseTracking.ts  # Mouse tracking logic
│   │   ├── useAnimationControl.ts # Animation control logic
│   │   └── index.ts
│   └── index.ts
├── types/             # Common type definitions
│   ├── user.types.ts
│   ├── product.types.ts
│   ├── interaction.types.ts     # RefContext types
│   └── index.ts
└── components/        # React components
    ├── user/
    ├── product/
    ├── interactive/     # RefContext components
    └── common/
```

### 📄 File Naming Conventions

#### Context File Names
```tsx
// ✅ Recommended
user.actions.ts       // Action context
user.stores.ts        // Store context
user.refs.ts          // RefContext
payment.actions.ts    // Payment actions
product.stores.ts     // Product stores
mouse.refs.ts         // Mouse RefContext

// ❌ Avoid
userContext.ts        // Ambiguous (action, store, or ref?)
User.ts              // Starts with capital (confuse with components)
userState.ts         // Prefer "stores" over "state"
userRefs.ts          // Prefer "refs" with lowercase
```

#### Provider File Names
```tsx
// ✅ Recommended
UserProvider.tsx      // User-related provider
ProductProvider.tsx   // Product-related provider
MouseProvider.tsx     // Mouse RefContext provider
AppProvider.tsx       // Root provider

// ❌ Avoid  
user-provider.tsx     // Use PascalCase instead of kebab-case
userProvider.tsx      // Use PascalCase instead of camelCase
```

---

## Pattern Usage

### 🎯 Pattern Selection Guide

#### Store Only Pattern
```tsx
// ✅ Use when: Pure state management needed
// - Form data management
// - Settings storage
// - Cached data management
// - UI state (modals, toggles, etc.)

// Method 1: Type inference (current approach)
const {
  Provider: SettingsStoreProvider,
  useStore: useSettingsStore,
  useStoreManager: useSettingsStoreManager
} = createDeclarativeStorePattern('Settings', {
  theme: 'light' as 'light' | 'dark',
  language: 'en',
  notifications: true
});

// Method 2: Explicit generic types (alternative approach)
interface SettingsStoreTypes {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

const {
  Provider: SettingsStoreProvider,
  useStore: useSettingsStore,
  useStoreManager: useSettingsStoreManager
} = createDeclarativeStorePattern<SettingsStoreTypes>('Settings', {
  theme: 'light',  // Type inferred from SettingsStoreTypes
  language: 'en',
  notifications: true
});
```

#### Action Only Pattern  
```tsx
// ✅ Use when: Pure action dispatching needed
// - Event tracking
// - Logging systems
// - Notification sending
// - API calls (without state changes)

const {
  Provider: AnalyticsActionProvider,
  useActionDispatch: useAnalyticsAction,
  useActionHandler: useAnalyticsActionHandler
} = createActionContext<AnalyticsActions>('Analytics');
```

#### RefContext Only Pattern
```tsx
// ✅ Use when: High-performance DOM manipulation needed
// - Real-time interactions (mouse tracking, drag & drop)
// - Animations requiring 60fps
// - Canvas operations
// - Media player controls

type MouseRefs = {
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  container: HTMLDivElement;
};

const {
  Provider: MouseProvider,
  useRefHandler: useMouseRef
} = createRefContext<MouseRefs>('Mouse');
```

#### Pattern Composition
```tsx
// ✅ Use when: Multiple pattern types needed  
// - Complex business logic with performance requirements
// - User profile management with real-time interactions
// - Shopping cart with drag & drop functionality
// - Game state management with animations

function App() {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <MouseProvider>
          <InteractiveUserProfile />
        </MouseProvider>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

### 🔄 Provider Composition Patterns

#### HOC Pattern (Recommended)
```tsx
// ✅ Recommended: Automatic Provider wrapping with HOC
const { withProvider: withUserStoreProvider } = createDeclarativeStorePattern('User', {...});
const { withProvider: withUserActionProvider } = createActionContext<UserActions>('UserActions');
const { withProvider: withMouseProvider } = createRefContext<MouseRefs>('Mouse');

// Multiple Provider composition
const withUserProviders = (Component: React.ComponentType) => 
  withUserActionProvider(
    withUserStoreProvider(
      withMouseProvider(Component)
    )
  );

const InteractiveUserProfileWithProviders = withUserProviders(InteractiveUserProfile);

// Usage
function App() {
  return <InteractiveUserProfileWithProviders />;
}
```

#### Manual Provider Composition
```tsx
// ✅ Manual composition (for complex dependencies)
function InteractiveUserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <MouseProvider>
          <UserAnalyticsProvider>
            {children}
          </UserAnalyticsProvider>
        </MouseProvider>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

---

## Type Definitions

### 🏷️ Interface Naming

#### Action Payload Map
```tsx
// ✅ Recommended: Domain + Actions pattern (extending ActionPayloadMap)
interface UserActions extends ActionPayloadMap {
  updateProfile: { id: string; data: Partial<UserProfile> };
  deleteAccount: { id: string; reason?: string };
  refreshToken: void;
}

// ✅ Recommended: Domain + Actions pattern (simple interface - future approach)
interface UserActions {
  updateProfile: { id: string; data: Partial<UserProfile> };
  deleteAccount: { id: string; reason?: string };
  refreshToken: void;
}

interface PaymentActions {
  processPayment: { amount: number; method: string };
  refundPayment: { transactionId: string };
  validateCard: { cardNumber: string };
}

// ❌ Avoid
interface Actions { ... }           // Too broad
interface UserActionTypes { ... }   // Inconsistent naming
```

#### Store Data Interface
```tsx
// ✅ Recommended: Domain + Data pattern or intuitive names
interface UserData {
  profile: UserProfile;
  preferences: UserPreferences;
  session: UserSession;
}

interface ShoppingCartData {
  items: CartItem[];
  total: number;
  discounts: Discount[];
}

// Or intuitive names
interface UserState {
  profile: UserProfile;
  preferences: UserPreferences;
}

// ❌ Avoid
interface Data { ... }           // Too broad
interface UserStoreType { ... }  // Unnecessary Type suffix
```

#### RefContext Type Interface
```tsx
// ✅ Recommended: Domain + Refs pattern
interface MouseRefs {
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  container: HTMLDivElement;
}

interface AnimationRefs {
  target: HTMLElement;
  trigger: HTMLButtonElement;
  container: HTMLDivElement;
}

interface FormRefs {
  nameInput: HTMLInputElement;
  emailInput: HTMLInputElement;
  submitButton: HTMLButtonElement;
  form: HTMLFormElement;
}

// ❌ Avoid
interface Refs { ... }           // Too broad
interface Elements { ... }       // Not specific to RefContext
interface MouseElements { ... }  // Prefer "Refs" suffix
```

### 🎯 Generic Type Usage

```tsx
// ✅ Recommended: Clear generic type usage
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends BaseEntity {
  name: string;
  email: string;
}

interface Product extends BaseEntity {
  name: string;
  price: number;
  category: string;
}

// Store definition - Method 1: Type inference (recommended)
const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createDeclarativeStorePattern('User', {
  users: { initialValue: [] as User[] },
  currentUser: { initialValue: null as User | null }
});

// Store definition - Method 2: Explicit generic
interface UserStoreTypes {
  users: User[];
  currentUser: User | null;
}

const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createDeclarativeStorePattern<UserStoreTypes>('User', {
  users: [],  // Direct value or
  currentUser: {  // Configuration object
    initialValue: null,
    strategy: 'reference'
  }
});

// Action definition - New API (contextName priority)
interface UserActions {
  createUser: { userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> };
  updateUser: { id: string; updates: Partial<User> };
  deleteUser: { id: string };
}

const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction
} = createActionContext<UserActions>('UserActions', {
  registry: { debug: true, maxHandlers: 10 }
});

// RefContext definition
interface InteractiveRefs {
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  container: HTMLDivElement;
}

const {
  Provider: InteractiveProvider,
  useRefHandler: useInteractiveRef
} = createRefContext<InteractiveRefs>('Interactive');
```

---

## Code Style

### ✨ Component Patterns

#### Store Usage Pattern
```tsx
// ✅ Recommended: Clear variable names and destructuring
function UserProfile() {
  // Store access
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // Value subscription
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  // Distinguish from local state
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div>
      <ProfileView profile={profile} preferences={preferences} />
      {isEditing && <ProfileEditor />}
    </div>
  );
}

// ❌ Avoid: Confusing variable names
function UserProfile() {
  const store1 = useUserStore('profile');  // What is this?
  const data = useStoreValue(store1);      // Not specific
  const userState = useStoreValue(store2); // Can be confusing
}
```

#### Action Handler Pattern
```tsx
// ✅ Recommended: useCallback with clear handler names
function UserProfile() {
  const dispatch = useUserAction();
  
  // Handler registration (useCallback required)
  useUserActionHandler('updateProfile', useCallback(async (payload, controller) => {
    try {
      const profileStore = storeManager.getStore('profile');
      const currentProfile = profileStore.getValue();
      
      // Execute business logic
      const updatedProfile = await updateUserProfile(payload.data);
      
      // Update store
      profileStore.setValue({ ...currentProfile, ...updatedProfile });
      
      // Success notification
      dispatch('showNotification', { 
        type: 'success', 
        message: 'Profile updated successfully.' 
      });
    } catch (error) {
      controller.abort('Profile update failed', error);
    }
  }, [dispatch, storeManager]));
  
  const handleEditProfile = () => {
    dispatch('updateProfile', {
      data: { name: 'New Name' }
    });
  };
  
  return <button onClick={handleEditProfile}>Edit Profile</button>;
}
```

#### RefContext Usage Pattern
```tsx
// ✅ Recommended: Clear ref names and direct DOM manipulation
function InteractiveMouseTracker() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  const container = useMouseRef('container');
  
  // Direct DOM manipulation with business logic
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Hardware accelerated transforms
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    // Trail effect with performance optimization
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
    }
  }, [cursor, trail, container]);
  
  return (
    <div 
      ref={container.setRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-96 bg-gray-100"
    >
      <div
        ref={cursor.setRef}
        className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
      />
      <div
        ref={trail.setRef}
        className="absolute w-3 h-3 bg-blue-300 rounded-full pointer-events-none"
      />
    </div>
  );
}

// ❌ Avoid: Confusing ref names
function MouseTracker() {
  const ref1 = useMouseRef('cursor');      // What is this?
  const element = useMouseRef('trail');    // Not specific
  const domRef = useMouseRef('container'); // Generic naming
}
```

### 🎨 Import Organization

```tsx
// ✅ Recommended: Group imports by category
// 1. React related
import React, { useCallback, useState, useEffect } from 'react';

// 2. Third-party libraries
import { toast } from 'react-hot-toast';

// 3. Context-Action framework
import { useStoreValue } from '@context-action/react';

// 4. Local contexts (renamed hooks)
import { 
  useUserStore, 
  useUserAction, 
  useUserActionHandler,
  useMouseRef
} from '@/contexts';

// 5. Components
import { ProfileForm } from './ProfileForm';
import { InteractiveMouseTracker } from './InteractiveMouseTracker';

// 6. Types
import type { UserProfile } from '@/types/user.types';
import type { MouseRefs } from '@/types/interaction.types';
```

---

## Performance Guidelines

### ⚡ Store Optimization

#### Comparison Strategy Selection
```tsx
// ✅ Recommended: Choose strategy based on data characteristics
const {
  Provider: DataStoreProvider,
  useStore: useDataStore
} = createDeclarativeStorePattern('Data', {
  // Primitive values: reference (default)
  counter: 0,
  isLoading: false,
  
  // Objects with property changes: shallow  
  userProfile: {
    initialValue: { name: '', email: '', age: 0 },
    strategy: 'shallow'
  },
  
  // Deeply nested objects with frequent changes: deep
  complexForm: {
    initialValue: { nested: { deep: { values: {} } } },
    strategy: 'deep'
  },
  
  // Large arrays or performance-critical cases: reference
  largeDataset: {
    initialValue: [] as DataItem[],
    strategy: 'reference',
    description: 'Use reference equality for performance'
  },
  
  // Advanced comparison options
  advancedData: {
    initialValue: { id: '', data: {}, lastUpdated: new Date() },
    comparisonOptions: {
      strategy: 'shallow',
      ignoreKeys: ['lastUpdated'], // Ignore specific keys
      maxDepth: 2,                 // Limit depth for performance
      enableCircularCheck: true    // Prevent circular references
    }
  },
  
  // Custom comparison logic
  versionedData: {
    initialValue: { version: 1, content: {} },
    comparisonOptions: {
      strategy: 'custom',
      customComparator: (oldVal, newVal) => {
        // Version-based comparison
        return oldVal.version === newVal.version;
      }
    }
  }
});
```

#### Memoization Patterns
```tsx
// ✅ Recommended: Handler memoization with useCallback
function UserComponent() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Handler memoization (careful with dependency array)
  const updateHandler = useCallback(async (payload) => {
    profileStore.setValue({ ...profile, ...payload.data });
  }, [profile, profileStore]);
  
  useUserActionHandler('updateProfile', updateHandler);
  
  // Computed value memoization
  const displayName = useMemo(() => {
    return profile.firstName + ' ' + profile.lastName;
  }, [profile.firstName, profile.lastName]);
  
  return <div>{displayName}</div>;
}
```

### 🔄 Action Optimization

#### Debounce/Throttle Configuration
```tsx
// ✅ Recommended: Appropriate debounce/throttle usage
useUserActionHandler('searchUsers', searchHandler, {
  debounce: 300,  // Search uses debounce
  id: 'search-handler'
});

useUserActionHandler('trackScroll', scrollHandler, {
  throttle: 100,  // Scroll uses throttle  
  id: 'scroll-handler'
});

useUserActionHandler('saveForm', saveHandler, {
  blocking: true,  // Critical actions are blocking
  once: false,
  id: 'save-handler'
});
```

### ⚡ RefContext Performance Optimization

#### Zero Re-render DOM Manipulation
```tsx
// ✅ Recommended: Direct DOM manipulation for performance
function HighPerformanceMouseTracker() {
  const cursor = useMouseRef('cursor');
  const container = useMouseRef('container');
  
  // Zero React re-renders - all DOM updates are direct
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Hardware accelerated transforms (GPU acceleration)
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    // Use will-change for complex animations
    if (!cursor.target.style.willChange) {
      cursor.target.style.willChange = 'transform';
    }
  }, [cursor, container]);
  
  // Cleanup will-change on unmount for memory optimization
  useEffect(() => {
    return () => {
      if (cursor.target) {
        cursor.target.style.willChange = '';
      }
    };
  }, [cursor]);
  
  return (
    <div ref={container.setRef} onMouseMove={handleMouseMove}>
      <div 
        ref={cursor.setRef}
        style={{ transform: 'translate3d(0, 0, 0)' }} // Initial GPU layer
      />
    </div>
  );
}

// ❌ Avoid: State-driven updates causing re-renders
function SlowMouseTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    // This causes re-renders on every mouse move
    setPosition({ x: e.clientX, y: e.clientY });
  };
  
  return (
    <div onMouseMove={handleMouseMove}>
      <div style={{ left: position.x, top: position.y }} />
    </div>
  );
}
```

#### Animation Performance
```tsx
// ✅ Recommended: requestAnimationFrame for smooth animations
function SmoothAnimationComponent() {
  const target = useAnimationRef('target');
  const animationRef = useRef<number>();
  
  const startAnimation = useCallback(() => {
    const animate = (timestamp: number) => {
      if (target.target) {
        // Smooth animation with hardware acceleration
        const progress = (timestamp % 2000) / 2000;
        const x = progress * 200;
        target.target.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  }, [target]);
  
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);
  
  useEffect(() => {
    return () => stopAnimation(); // Cleanup on unmount
  }, [stopAnimation]);
  
  return (
    <div>
      <div ref={target.setRef} style={{ transform: 'translate3d(0, 0, 0)' }} />
      <button onClick={startAnimation}>Start</button>
      <button onClick={stopAnimation}>Stop</button>
    </div>
  );
}
```

---

## RefContext Conventions

### 🔧 RefContext-Specific Guidelines

#### Ref Type Definitions
```tsx
// ✅ Recommended: Specific HTML element types
interface MouseRefs {
  cursor: HTMLDivElement;      // Specific element type
  trail: HTMLDivElement;
  container: HTMLDivElement;
}

interface FormRefs {
  nameInput: HTMLInputElement;  // Input-specific type
  emailInput: HTMLInputElement;
  submitButton: HTMLButtonElement; // Button-specific type
  form: HTMLFormElement;       // Form-specific type
}

// ❌ Avoid: Generic HTMLElement when specific type is known
interface BadRefs {
  cursor: HTMLElement;         // Too generic
  input: HTMLElement;          // Should be HTMLInputElement
}
```

#### Performance-Critical Patterns
```tsx
// ✅ Recommended: Separate business logic from DOM manipulation
function useMousePositionLogic() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  
  const updatePosition = useCallback((x: number, y: number) => {
    // Direct DOM manipulation - zero re-renders
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
    }
  }, [cursor, trail]);
  
  const getElementPosition = useCallback(() => {
    if (!cursor.target) return null;
    const rect = cursor.target.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }, [cursor]);
  
  return { updatePosition, getElementPosition };
}

// Usage in component
function MouseComponent() {
  const { updatePosition } = useMousePositionLogic();
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updatePosition(e.clientX, e.clientY);
  }, [updatePosition]);
  
  return <div onMouseMove={handleMouseMove}>...</div>;
}
```

#### RefContext Error Handling
```tsx
// ✅ Recommended: Null checks and error handling
function SafeRefComponent() {
  const element = useMouseRef('target');
  
  const safelyUpdateElement = useCallback((value: string) => {
    // Always check target existence
    if (!element.target) {
      console.warn('RefContext: Target element not yet mounted');
      return;
    }
    
    try {
      element.target.textContent = value;
    } catch (error) {
      console.error('RefContext: Failed to update element', error);
    }
  }, [element]);
  
  // Use useWaitForRefs for critical operations
  const { allRefsReady } = useWaitForRefs(['target']);
  
  useEffect(() => {
    if (allRefsReady) {
      safelyUpdateElement('Ready!');
    }
  }, [allRefsReady, safelyUpdateElement]);
  
  return <div ref={element.setRef}>Content</div>;
}
```

---

## Error Handling

### 🚨 Error Boundary Pattern

```tsx
// ✅ Recommended: Domain-specific Error Boundary
function UserErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<UserErrorFallback />}
      onError={(error, errorInfo) => {
        // User-related error logging
        console.error('User context error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <MouseProvider>
          <UserErrorBoundary>
            {children}
          </UserErrorBoundary>
        </MouseProvider>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

### 🛡️ Action Error Handling

```tsx
// ✅ Recommended: Error handling with Pipeline Controller
useUserActionHandler('riskyOperation', useCallback(async (payload, controller) => {
  try {
    // 1. Input validation
    if (!payload.data || !payload.data.id) {
      controller.abort('Invalid input data');
      return;
    }
    
    // 2. Execute business logic
    const result = await performRiskyOperation(payload.data);
    
    // 3. Update state on success
    const store = storeManager.getStore('userData');
    store.setValue(result);
    
    // 4. Return result (if needed)
    controller.setResult(result);
    
  } catch (error) {
    // 5. Error handling
    if (error instanceof ValidationError) {
      controller.abort('Data validation failed', error);
    } else if (error instanceof NetworkError) {
      controller.abort('Network error', error);
    } else {
      controller.abort('Unknown error occurred', error);
    }
  }
}, [storeManager]));
```

### 🛡️ RefContext Error Handling

```tsx
// ✅ Recommended: Safe ref operations with error handling
function SafeRefOperations() {
  const element = useMouseRef('target');
  const { allRefsReady, waitForRefs } = useWaitForRefs(['target']);
  
  const safelyManipulateDOM = useCallback(async () => {
    try {
      // Wait for refs to be ready before operations
      await waitForRefs();
      
      if (!element.target) {
        throw new Error('RefContext: Target element not available');
      }
      
      // Safe DOM manipulation
      element.target.style.transform = 'translate3d(100px, 100px, 0)';
      
    } catch (error) {
      console.error('RefContext operation failed:', error);
      // Fallback behavior
      console.warn('Falling back to alternative approach');
    }
  }, [element, waitForRefs]);
  
  // Error boundary for RefContext-specific errors
  if (!allRefsReady) {
    return <div>Loading refs...</div>;
  }
  
  return (
    <div ref={element.setRef} onClick={safelyManipulateDOM}>
      Click me
    </div>
  );
}

// ❌ Avoid: Unsafe ref operations
function UnsafeRefOperations() {
  const element = useMouseRef('target');
  
  const unsafeOperation = () => {
    // This can fail if element is not mounted yet
    element.target.style.transform = 'translate3d(100px, 100px, 0)';
  };
  
  return <div ref={element.setRef} onClick={unsafeOperation}>Click me</div>;
}
```

---

## 📚 Additional Resources

### Related Documentation
- [Pattern Guide](./pattern-guide.md) - Detailed pattern usage guide
- [Full Architecture Guide](./architecture-guide.md) - Complete architecture guide
- [Hooks Reference](./hooks-reference.md) - Hooks reference documentation
- [API Reference](../../api/) - API documentation

### Example Projects
- [Basic Example](../../../example/) - Basic usage examples
- [Advanced Patterns](../../examples/) - Advanced pattern examples

### Migration Guide
- [Legacy Pattern Migration](./pattern-guide.md#migration-guide) - Migration from legacy patterns

---

## ❓ FAQ

### Q: When should I use Store Only vs Action Only vs RefContext vs Composition?
- **Store Only**: Pure state management (forms, settings, cache)
- **Action Only**: Pure event handling (logging, tracking, notifications)
- **RefContext Only**: High-performance DOM manipulation (animations, real-time interactions)
- **Composition**: Complex business logic requiring multiple patterns (user management, interactive shopping cart)

### Q: Is the renaming pattern mandatory?
Yes, the renaming pattern is a core convention of the Context-Action framework. It significantly improves type safety and developer experience.

### Q: How should I approach performance optimization?
1. Choose appropriate comparison strategy for stores
2. Memoize handlers with useCallback
3. Use reference strategy for large data
4. Apply debounce/throttle when needed
5. Use RefContext for performance-critical DOM operations

### Q: How should I handle errors?
1. Use Pipeline Controller's abort() method for actions
2. Set up domain-specific Error Boundaries
3. Handle different error types appropriately
4. Provide user-friendly error messages
5. Always check ref.target existence before DOM manipulation

### Q: Should I use explicit generics or type inference?
- **Type inference (recommended)**: For most cases, code is concise and type safety is guaranteed
- **Explicit generics**: For complex type structures or strict type constraints

### Q: When should I use comparisonOptions?
1. **ignoreKeys**: When you want to ignore specific field changes like timestamps
2. **customComparator**: When special comparison logic is needed for business requirements
3. **maxDepth**: To limit deep comparison depth for performance optimization
4. **enableCircularCheck**: When dealing with objects that might have circular references

### Q: How should I write type tests?
1. Test both explicit generics and type inference
2. Verify type safety at compile time
3. Document error cases with comments
4. Write test components that reflect actual usage patterns
5. Include RefContext type validation in component tests

### Q: When should I use RefContext over regular state?
- **Use RefContext when**: Direct DOM manipulation needed, 60fps performance required, zero re-renders critical
- **Use regular state when**: Data needs to be displayed in UI, component re-rendering is acceptable
- **Combine both when**: Performance-critical operations alongside data display (e.g., real-time charts)

### Q: How do I ensure RefContext safety?
1. **Always check `ref.target` existence before DOM operations**
   ```tsx
   const element = useMouseRef('cursor');
   
   // ✅ Correct - safe access
   if (element.target) {
     element.target.style.transform = 'scale(1.1)';
   }
   
   // ❌ Wrong - potential error
   element.target.style.transform = 'scale(1.1)';
   ```

2. **Use `useWaitForRefs` for operations requiring multiple refs**
   ```tsx
   const { allRefsReady, waitForRefs } = useWaitForRefs(['cursor', 'container']);
   
   const performOperation = async () => {
     await waitForRefs(); // Wait until all refs are ready
     // Perform safe DOM operations
   };
   ```

3. **Implement proper cleanup for animations and event listeners**
   ```tsx
   useEffect(() => {
     return () => {
       // Clean up animations
       if (animationFrame) {
         cancelAnimationFrame(animationFrame);
       }
       // Remove event listeners
       element.target?.removeEventListener('click', handler);
     };
   }, []);
   ```

4. **Error boundary handling and warning messages**
   ```tsx
   if (!element.target) {
     console.warn('RefContext: Target element not yet mounted');
     return;
   }
   ```

### Q: How do I optimize RefContext performance?
1. **Use `translate3d()` for hardware acceleration**
   ```tsx
   // ✅ Correct - GPU acceleration
   element.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
   
   // ❌ Wrong - CPU only
   element.target.style.left = `${x}px`;
   element.target.style.top = `${y}px`;
   ```

2. **Manage `will-change` property for animations**
   ```tsx
   // Before animation starts
   element.target.style.willChange = 'transform';
   
   // During animation
   element.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
   
   // After animation completes (prevent memory leaks)
   element.target.style.willChange = '';
   ```

3. **Use requestAnimationFrame for smooth animations**
   ```tsx
   const animate = () => {
     if (element.target) {
       const x = Math.sin(Date.now() * 0.001) * 100;
       element.target.style.transform = `translate3d(${x}px, 0, 0)`;
     }
     requestAnimationFrame(animate);
   };
   ```