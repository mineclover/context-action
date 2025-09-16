# Context-Action Framework Conventions

This document defines coding conventions and best practices when using the Context-Action framework with its core patterns: Actions and Stores, plus advanced patterns like RefContext.

## 📋 Table of Contents

1. [MVVM Architecture Conventions](#mvvm-architecture-conventions)
2. [Naming Conventions](#naming-conventions)
3. [File Structure](#file-structure)
4. [Pattern Usage](#pattern-usage)
5. [Type Definitions](#type-definitions)
6. [Code Style](#code-style)
7. [Core Framework Principles](#core-framework-principles)
8. [Store Update Conventions](#store-update-conventions)
9. [Performance Guidelines](#performance-guidelines)
10. [Error Handling](#error-handling)
11. [RefContext Conventions](#refcontext-conventions)

---

## MVVM Architecture Conventions

### 🏗️ **Core Architecture Pattern**

Context-Action Framework follows **strict MVVM architecture** with clear layer separation:

- **Model Layer**: `create~Context` declarations (`src/models/`)
- **ViewModel Layer**: Custom hooks for behavior injection (`src/viewmodels/`)
- **Business Logic Layer**: Action handlers for domain rules (`src/business/`)
- **View Layer**: Pure components consuming ViewModels (`src/components/`, `src/pages/`)
- **Shared Layer**: Pure view components with explicit props (`src/shared/`)

### 📁 **Directory Structure Pattern**

```
src/
├── models/           # Model Layer - Context declarations
│   ├── UserModel.ts           # createStoreContext
│   ├── UserActionModel.ts     # createActionContext
│   └── UserRefModel.ts        # createRefContext
├── viewmodels/       # ViewModel Layer - Hook-based injection
│   ├── useUserProfile.ts      # Profile behavior injection
│   ├── useUserPreferences.ts  # Preferences behavior injection
│   └── useUserAuth.ts         # Auth behavior injection
├── business/         # Business Logic Layer - Action handlers
│   ├── UserBusinessLogic.tsx  # User domain business rules
│   └── AuthBusinessLogic.tsx  # Auth domain business rules
├── pages/            # View Layer - Page components
│   ├── UserProfilePage.tsx    # Profile page (ViewModel consumption)
│   └── SettingsPage.tsx       # Settings page (ViewModel consumption)
├── components/       # View Layer - Feature components
│   ├── UserProfile.tsx        # Profile component (ViewModel consumption)
│   └── UserSettings.tsx       # Settings component (ViewModel consumption)
└── shared/           # Shared Layer - Pure view components
    ├── Button.tsx             # Pure button with explicit props
    ├── Card.tsx               # Pure card with explicit props
    └── Form.tsx               # Pure form with explicit props
```

### 🎯 **Layer Responsibility Rules**

#### ✅ **Model Layer** - Context Declarations Only
```typescript
// ✅ MUST: Declare contexts with domain-specific naming
export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createStoreContext('User', userStoreConfig);

// ❌ FORBIDDEN: Business logic in models
// No useEffect, no API calls, no business rules
```

#### ✅ **ViewModel Layer** - Behavior Injection Only
```typescript
// ✅ MUST: Create hooks that inject state and behavior
export function useUserProfile() {
  const profileStore = useUserStore('profile');
  const dispatch = useUserDispatch();
  
  const profile = useStoreValue(profileStore);
  
  const updateProfile = useCallback((data) => {
    dispatch('updateProfile', data);
  }, [dispatch]);
  
  return { profile, updateProfile, displayName: profile.name || 'Guest' };
}

// ❌ FORBIDDEN: Direct API calls or business validation in ViewModels
// ❌ FORBIDDEN: JSX or component rendering
```

#### ✅ **Business Logic Layer** - Domain Rules Only  
```typescript
// ✅ MUST: Implement business logic through action handlers
export function UserBusinessLogic({ children }) {
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // Business validation
    if (!payload.email.includes('@')) {
      throw new Error('Invalid email');
    }
    
    // Business logic implementation
    const updated = { ...current, ...payload };
    profileStore.setValue(updated);
    
    // Side effects
    await saveToAPI(updated);
  }, [profileStore]));
  
  return children;
}

// ❌ FORBIDDEN: JSX rendering (except children passthrough)
// ❌ FORBIDDEN: UI state management
```

#### ✅ **View Layer** - ViewModel Consumption Only
```typescript
// ✅ MUST: Consume ViewModels through hooks
export function UserProfile() {
  const { profile, updateProfile, displayName } = useUserProfile();
  const { theme, toggleTheme } = useUserPreferences();
  
  return (
    <div data-theme={theme}>
      <h1>{displayName}</h1>
      <button onClick={() => updateProfile({ name: 'New Name' })}>
        Update
      </button>
    </div>
  );
}

// ❌ FORBIDDEN: Direct context consumption (useUserStore, useUserDispatch)
// ❌ FORBIDDEN: Business logic or API calls
// ❌ FORBIDDEN: Complex internal state management
```

#### ✅ **Shared Layer** - Pure View Only
```typescript
// ✅ MUST: Pure components with explicit props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick?: () => void;
  children: ReactNode;
}

export function Button({ variant, onClick, children }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// ❌ FORBIDDEN: Any hooks or context consumption
// ❌ FORBIDDEN: Internal state management
// ❌ FORBIDDEN: Business logic
```

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
} = createStoreContext('User', {...});

// ❌ Avoid: Direct object access
const UserStores = createStoreContext('User', {...});
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

### 📁 **MVVM Directory Structure** (Recommended)

```
src/
├── models/             # Model Layer - Context declarations
│   ├── UserModel.ts           # User domain contexts (Store, Action, Ref)
│   ├── ProductModel.ts        # Product domain contexts
│   ├── InteractionModel.ts    # UI interaction contexts (Mouse, Animation)
│   └── index.ts              # All model exports
├── viewmodels/         # ViewModel Layer - Behavior injection hooks
│   ├── user/
│   │   ├── useUserProfile.ts       # Profile behavior injection
│   │   ├── useUserPreferences.ts   # Preferences behavior injection
│   │   └── useUserAuth.ts          # Auth behavior injection
│   ├── product/
│   │   ├── useProductCatalog.ts    # Catalog behavior injection
│   │   └── useShoppingCart.ts      # Cart behavior injection
│   ├── interaction/
│   │   ├── useMouseTracking.ts     # Mouse behavior injection
│   │   └── useAnimationControl.ts  # Animation behavior injection
│   └── index.ts              # All ViewModel exports
├── business/           # Business Logic Layer - Action handlers
│   ├── UserBusinessLogic.tsx       # User domain business rules
│   ├── ProductBusinessLogic.tsx    # Product domain business rules
│   ├── AuthBusinessLogic.tsx       # Auth domain business rules
│   └── index.ts                   # All business logic exports
├── pages/              # View Layer - Page components
│   ├── user/
│   │   ├── UserProfilePage.tsx     # Profile page
│   │   └── UserSettingsPage.tsx    # Settings page
│   ├── product/
│   │   ├── ProductCatalogPage.tsx  # Catalog page
│   │   └── ShoppingCartPage.tsx    # Cart page
│   └── index.ts              # All page exports
├── components/         # View Layer - Feature components
│   ├── user/
│   │   ├── UserProfile.tsx         # Profile component
│   │   ├── UserSettings.tsx        # Settings component
│   │   └── UserAuth.tsx           # Auth component
│   ├── product/
│   │   ├── ProductList.tsx         # Product list
│   │   ├── ProductCard.tsx         # Product card
│   │   └── CartSummary.tsx         # Cart summary
│   └── index.ts              # All component exports
├── shared/             # Shared Layer - Pure view components
│   ├── Button.tsx              # Pure button component
│   ├── Card.tsx                # Pure card component
│   ├── Form.tsx                # Pure form component
│   ├── Modal.tsx               # Pure modal component
│   └── index.ts                # All shared component exports
├── types/              # Type definitions
│   ├── user.types.ts           # User domain types
│   ├── product.types.ts        # Product domain types
│   ├── ui.types.ts            # UI-specific types
│   └── index.ts               # All type exports
└── providers/          # Provider composition
    └── AppProvider.tsx         # Root provider composition
```

### 📁 **Legacy Directory Structure** (Migration Reference)

```
src/
├── contexts/           # Old structure - migrate to models/
│   ├── user/
│   │   ├── user.actions.ts     # → models/UserModel.ts
│   │   ├── user.stores.ts      # → models/UserModel.ts
│   │   ├── user.refs.ts        # → models/UserModel.ts
│   │   └── index.ts
│   └── index.ts
├── hooks/             # Old structure - migrate to viewmodels/
│   ├── user/
│   │   ├── useUserProfile.ts    # → viewmodels/user/useUserProfile.ts
│   │   └── index.ts
│   └── index.ts
└── components/        # Keep as View Layer
    └── ...
```

### 📄 **MVVM File Naming Conventions**

#### **Model Layer Files** (`src/models/`)
```typescript
// ✅ MVVM Recommended - Domain-based models
UserModel.ts          // User domain (Store + Action + Ref contexts)
ProductModel.ts       // Product domain contexts
InteractionModel.ts   // UI interaction contexts
AuthModel.ts          // Authentication contexts

// ❌ Avoid - Separate context files
user.actions.ts       // Split contexts reduce maintainability
user.stores.ts        // Prefer consolidated domain models
user.refs.ts          // Keep related contexts together
```

#### **ViewModel Layer Files** (`src/viewmodels/`)
```typescript
// ✅ MVVM Recommended - Hook-based behavior injection
useUserProfile.ts     // Profile behavior injection
useUserPreferences.ts // Preferences behavior injection  
useUserAuth.ts        // Auth behavior injection
useProductCatalog.ts  // Product catalog behavior
useShoppingCart.ts    // Shopping cart behavior

// ❌ Avoid - Generic or vague names
useUser.ts           // Too generic, unclear responsibility
userHooks.ts         // Not specific about injected behavior
profileManager.ts    // Not following hook convention
```

#### **Business Logic Layer Files** (`src/business/`)
```typescript
// ✅ MVVM Recommended - Business domain logic
UserBusinessLogic.tsx     // User domain business rules
ProductBusinessLogic.tsx  // Product domain business rules
AuthBusinessLogic.tsx     // Authentication business rules
PaymentBusinessLogic.tsx  // Payment domain business rules

// ❌ Avoid - Generic or unclear names
BusinessLogic.tsx    // Too generic, unclear domain
userHandlers.ts      // Not component-based business logic
UserManager.tsx      // Vague responsibility
```

#### **View Layer Files** (`src/components/`, `src/pages/`)
```typescript
// ✅ MVVM Recommended - ViewModel consumption
UserProfile.tsx      // Profile component (consumes useUserProfile)
UserSettings.tsx     // Settings component (consumes useUserPreferences)
ProductList.tsx      // Product list (consumes useProductCatalog)
ShoppingCart.tsx     // Cart component (consumes useShoppingCart)

// Pages
UserProfilePage.tsx  // Profile page
ProductCatalogPage.tsx // Catalog page

// ❌ Avoid - Direct context reference in names
UserStoreComponent.tsx   // Should not reference implementation detail
UserActionComponent.tsx  // Focus on business purpose, not technical detail
```

#### **Shared Layer Files** (`src/shared/`)
```typescript
// ✅ MVVM Recommended - Pure view components
Button.tsx           // Pure button with explicit props
Card.tsx             // Pure card with explicit props
Modal.tsx            // Pure modal with explicit props
Form.tsx             // Pure form with explicit props
Input.tsx            // Pure input with explicit props

// ❌ Avoid - Context consumption in shared
SmartButton.tsx      // Shared components should be "dumb"
ConnectedCard.tsx    // No context consumption in shared layer
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
} = createStoreContext('Settings', {
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
} = createStoreContext<SettingsStoreTypes>('Settings', {
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

#### ✅ **Context Separation Pattern** (MVVM Requirement)
```tsx
// ✅ REQUIRED: Separate Providers for different contexts to avoid hook conflicts
// Each context must have its own Provider to maintain proper isolation

// WRONG ❌ - Single Provider with multiple contexts causes conflicts
function WrongProvider({ children }: { children: React.ReactNode }) {
  return (
    <SharedContextProvider>  {/* This causes useActionDispatch conflicts */}
      <MemoizedWidget />
      <NonMemoizedWidget />
    </SharedContextProvider>
  );
}

// CORRECT ✅ - Separate Providers for isolated context usage
function CorrectProviders({ children }: { children: React.ReactNode }) {
  return (
    <ComparisonStoreProvider>           {/* Shared state layer */}
      <PerformanceControlProvider>      {/* Control state layer */}
        <PerformanceControlActionProvider>  {/* Control actions */}
          
          {/* Performance Control Widget - uses control contexts */}
          <PerformanceControlWidget />
          
          {/* Comparison Grid - each widget has its own action context */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Memoized Handler Widget with its own action context */}
            <MemoizedActionProvider>
              <MemoizedHandlerWidget />
            </MemoizedActionProvider>
            
            {/* Non-Memoized Handler Widget with its own action context */}
            <NonMemoizedActionProvider>
              <NonMemoizedHandlerWidget />
            </NonMemoizedActionProvider>
            
          </div>
          
        </PerformanceControlActionProvider>
      </PerformanceControlProvider>
    </ComparisonStoreProvider>
  );
}
```

#### 🎯 **Context Separation Rules**

##### **Rule 1: Provider Hierarchy for Context Isolation**
```tsx
// ✅ MUST: Use separate action contexts for different business domains
// This prevents useActionDispatch hook conflicts and maintains clean separation

// Model Definitions (separate contexts)
const {
  Provider: MemoizedActionProvider,
  useActionDispatch: useMemoizedActionDispatch,  // Different dispatch hook
  useActionHandler: useMemoizedActionHandler
} = createActionContext<ComparisonActions>('MemoizedComparison');

const {
  Provider: NonMemoizedActionProvider,
  useActionDispatch: useNonMemoizedActionDispatch,  // Different dispatch hook
  useActionHandler: useNonMemoizedActionHandler  
} = createActionContext<ComparisonActions>('NonMemoizedComparison');

// Provider Hierarchy
<SharedStoreProvider>               {/* Shared data layer */}
  <MemoizedActionProvider>          {/* Memoized business logic */}
    <MemoizedWidget />              {/* Uses useMemoizedActionDispatch */}
  </MemoizedActionProvider>
  
  <NonMemoizedActionProvider>       {/* Non-memoized business logic */}
    <NonMemoizedWidget />           {/* Uses useNonMemoizedActionDispatch */}
  </NonMemoizedActionProvider>
</SharedStoreProvider>
```

##### **Rule 2: Hook Isolation Pattern**
```tsx
// ✅ MUST: Create separate hooks for each context to avoid conflicts
// File: src/hooks/useComparisonActions.ts

export function useMemoizedActions() {
  const dispatch = useMemoizedActionDispatch();  // Specific to memoized context
  
  return {
    increment: () => dispatch('increment'),
    decrement: () => dispatch('decrement'),
    calculate: (multiplier: number) => dispatch('complexCalculation', { multiplier })
  };
}

export function useNonMemoizedActions() {
  const dispatch = useNonMemoizedActionDispatch();  // Specific to non-memoized context
  
  return {
    increment: () => dispatch('increment'),
    decrement: () => dispatch('decrement'),
    calculate: (multiplier: number) => dispatch('complexCalculation', { multiplier })
  };
}

// ❌ FORBIDDEN: Using same hook name that conflicts
function ConflictingHook() {
  const dispatch = useActionDispatch();  // Which context? Causes conflicts!
  return { actions };
}
```

##### **Rule 3: Business Logic Isolation**
```tsx
// ✅ MUST: Separate action handlers for different contexts
// File: src/hooks/useMemoizedHandlers.ts

export function useMemoizedHandlers() {
  const memoizedStore = useComparisonStore('memoized');
  
  // Memoized business logic - functions created once and reused
  const handleIncrement = useCallback(async () => {
    const current = memoizedStore.getValue();  // Lazy evaluation
    memoizedStore.setValue({ ...current, counter: current.counter + 1 });
  }, [memoizedStore]);  // Empty deps for memoization
  
  useMemoizedActionHandler('increment', handleIncrement);
  
  return { handlersRegistered: true };
}

// File: src/hooks/useNonMemoizedHandlers.ts
export function useNonMemoizedHandlers() {
  const nonMemoizedStore = useComparisonStore('nonMemoized');
  
  // Non-memoized business logic - functions recreated every render
  const handleIncrement = async () => {  // No useCallback
    const current = nonMemoizedStore.getValue();
    nonMemoizedStore.setValue({ ...current, counter: current.counter + 1 });
  };
  
  useNonMemoizedActionHandler('increment', handleIncrement);
  
  return { handlersRegistered: true };
}
```

#### composeProviders Utility (Recommended)
```tsx
// ✅ Recommended: Clean composition using composeProviders utility
import { composeProviders } from '@context-action/react';

const AllProviders = composeProviders([
  UserStoreProvider,
  UserActionProvider,
  ProductStoreProvider,
  ProductActionProvider,
  MouseProvider,
  UserAnalyticsProvider
]);

function App() {
  return (
    <AllProviders>
      <AppContent />
    </AllProviders>
  );
}

// Advanced: Build-time conditional composition (recommended)
const isProduction = process.env.NODE_ENV === 'production';
const hasAnalytics = process.env.REACT_APP_ANALYTICS === 'true';

function createAppProviders() {
  const providers = [
    // Model Layer - Core stores (MVVM compliant order)
    UIStoreProvider,
    UserStoreProvider,
    
    // Optional stores based on build config
    ...(hasAnalytics ? [AnalyticsStoreProvider] : []),
    ...(isProduction ? [ErrorTrackingStoreProvider] : [DebugStoreProvider]),
    
    // ViewModel Layer - Core actions
    UIActionProvider,
    UserActionProvider,
    
    // Optional actions based on build config
    ...(hasAnalytics ? [AnalyticsActionProvider] : []),
    ...(isProduction ? [ErrorTrackingActionProvider] : [DebugActionProvider])
  ];
  
  return composeProviders(providers);
}

// Static composition - evaluated once at app initialization
const AppProviders = createAppProviders();
```

#### withProvider HOC Pattern (Convenience)
```tsx
// ✅ Convenience: Automatic Provider wrapping with HOC (sugar syntax)
const { withProvider: withUserStoreProvider } = createStoreContext('User', {...});
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
// ✅ MVVM-compliant manual composition (for complex dependencies)
function MVVMUserProvider({ children }: { children: React.ReactNode }) {
  return (
    {/* Model Layer - Outermost */}
    <UserStoreProvider>
      <ProductStoreProvider>
        <UIStoreProvider>
          
          {/* ViewModel Layer */}
          <UserActionProvider>
            <ProductActionProvider>
              <UIActionProvider>
                
                {/* View Layer - Innermost */}
                {children}
                
              </UIActionProvider>
            </ProductActionProvider>
          </UserActionProvider>
        </UIStoreProvider>
      </ProductStoreProvider>
    </UserStoreProvider>
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
} = createStoreContext('User', {
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
} = createStoreContext<UserStoreTypes>('User', {
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

## Core Framework Principles

### 🎯 **Architecture Philosophy**

#### **1. Complete Business Logic Separation**
- **All logic must be delegated to Context-Action system**
- Components focus purely on UI rendering
- Minimize Props dependencies to extreme levels

#### **2. Single-Direction Dependency Principle**
- **Upper contexts MUST NOT know about lower contexts**
- **Lower contexts CAN consume upper context data**
- Ensures loose coupling and high reusability

### 📋 **Props Usage Guidelines**

#### ✅ **When Props are Acceptable**

##### **1. Design System and Component Composition**
```typescript
// UI component visual properties
<Button variant="primary" size="large">Submit</Button>
<Card className="shadow-lg">...</Card>
<Modal isOpen={true} onClose={handleClose} />
```

##### **2. Component Unique Identifiers**
```typescript
// Component identification for data loading
<UserProfile userId="user-123" />
<ProductCard productId="prod-456" />
<OrderSummary orderId="order-789" />

// Actual usage example
function UserProfile({ userId }: { userId: string }) {
  // Context-Action handles user data processing
  const userStore = useUserStore('profiles');
  const currentUser = useStoreValue(userStore);

  useEffect(() => {
    if (currentUser?.id !== userId) {
      dispatch('loadUser', { userId }); // Props ID used for data loading
    }
  }, [userId, currentUser?.id, dispatch]);

  return <div>User: {currentUser?.name}</div>;
}
```

##### **3. External Library Interfaces**
```typescript
// External library required Props
<ReactMarkdown content={markdownText} />
<DatePicker value={selectedDate} onChange={handleDateChange} />
```

#### ❌ **When Props Should be Avoided**

##### **1. Context-Action Logic Interference**
```typescript
// ❌ Injecting business logic through props
<UserHandlers
  userStore={userStore}
  onUserUpdate={handleUpdate}
  config={businessConfig}
/>

// ✅ Context-Action handles all logic
<UserHandlers />  // Required data comes from context/store
```

##### **2. State or Action Passing through Props**
```typescript
// ❌ Passing state through props
<UserProfile user={user} onUpdate={handleUpdate} />

// ✅ Context-Action manages state
<UserProfile userId="user-123" />  // Only identifier as props
```

##### **3. Inter-Component Communication via Props**
```typescript
// ❌ Data transfer through Props
<ParentComponent>
  <ChildA onDataChange={handleDataFromA} />
  <ChildB data={dataFromA} />
</ParentComponent>

// ✅ Context-Action data sharing
<ParentComponent>
  <ChildA />  // Context-Action data sharing
  <ChildB />  // Context-Action data access
</ParentComponent>
```

### 🏗️ **Context Dependency Flow**

#### **Provider Layer Hierarchy**
```tsx
// Upper → Lower order for Provider placement
<UserContextProvider>          {/* Upper: User information */}
  <AuthContextProvider>        {/* Middle: Authentication state */}
    <PaymentContextProvider>   {/* Lower: Payment (uses User + Auth data) */}
      <App />
    </PaymentContextProvider>
  </AuthContextProvider>
</UserContextProvider>
```

#### **Lower Context Consuming Upper Data**
```typescript
function PaymentHandlers() {
  // Get data from upper contexts
  const userStore = useUserStore('profile');    // Upper User data
  const authStore = useAuthStore('session');    // Upper Auth data
  const paymentStore = usePaymentStore('card'); // Current Payment data

  const processPaymentHandler = useCallback(async (payload) => {
    const user = userStore.getValue();
    const session = authStore.getValue();
    const card = paymentStore.getValue();

    // Process with combined data
    await processPayment({
      userId: user.id,
      sessionToken: session.token,
      cardInfo: card,
      ...payload
    });
  }, [userStore, authStore, paymentStore]);

  usePaymentActionHandler('processPayment', processPaymentHandler, {
    priority: 100,
    id: 'payment-process-handler',
    blocking: true
  });
}
```

---

## Store Update Conventions

### 🔄 **Store Immutability Rules**

Context-Action Framework uses **Immer** internally for store state management, which enforces immutability rules. All store updates must follow proper conventions to avoid runtime errors.

#### ✅ **Correct Store Update Methods**

```typescript
// ✅ MUST: Use store.setValue() for complete value replacement
const userStore = useUserStore('profile');

// Simple value replacement
userStore.setValue({ name: 'John', email: 'john@example.com' });

// ✅ MUST: Use store.update() for partial updates with Immer
userStore.update(draft => {
  draft.name = 'John Doe';
  draft.preferences.theme = 'dark';
  return draft; // Optional: Immer handles this automatically
});

// ✅ MUST: Use store.update() for Map/Set operations
const cacheStore = useAppStore('cache');
cacheStore.update(draft => {
  draft.memoryCache.set('key', value);
  draft.redisCache.delete('oldKey');
  return draft;
});

// ✅ MUST: Use store.update() for Array operations
const itemsStore = useAppStore('items');
itemsStore.update(draft => {
  draft.push(newItem);
  draft.splice(index, 1);
  return draft;
});
```

#### ❌ **Forbidden Store Update Patterns**

```typescript
// ❌ NEVER: Direct mutation of store values
const cache = useStoreValue(cacheStore);
cache.memoryCache.set('key', value); // Throws: Immer frozen object error
cache.items.push(newItem); // Throws: Immer frozen object error

// ❌ NEVER: Direct property assignment on store values
const user = useStoreValue(userStore);
user.name = 'John'; // Throws: Immer frozen object error
user.preferences.theme = 'dark'; // Throws: Immer frozen object error

// ❌ NEVER: Attempting to mutate returned store values
const profile = userStore.getValue();
profile.email = 'new@email.com'; // Throws: Immer frozen object error
```

### 🎯 **Store Integration 3-Step Process**

All action handlers must follow this standardized pattern:

```typescript
// ✅ Standard 3-step process for action handlers
useActionHandler('updateUserProfile', useCallback(async (payload, controller) => {
  // Step 1: Read current state
  const currentProfile = profileStore.getValue();
  const currentPrefs = preferencesStore.getValue();
  
  // Step 2: Execute business logic
  const updatedProfile = {
    ...currentProfile,
    ...payload,
    updatedAt: new Date().toISOString()
  };
  
  // Validate business rules
  if (!updatedProfile.email.includes('@')) {
    controller.abort('Invalid email format');
    return;
  }
  
  // Step 3: Update stores using proper methods
  profileStore.setValue(updatedProfile);
  
  // For partial updates, use store.update()
  preferencesStore.update(draft => {
    draft.lastProfileUpdate = Date.now();
    return draft;
  });
  
  // Side effects (API calls, notifications, etc.)
  await syncProfileToAPI(updatedProfile);
  
}, [profileStore, preferencesStore]));
```

### ⚠️ **Common Immer Errors and Solutions**

#### Error: "This object has been frozen and should not be mutated"

```typescript
// ❌ Problem: Direct mutation in action handler
const handleCacheUpdate = useCallback(async (payload) => {
  const cache = useStoreValue(cacheStore);
  cache.memoryCache.set(payload.key, payload.value); // ❌ Throws error
}, [cacheStore]);

// ✅ Solution: Use store.update()
const handleCacheUpdate = useCallback(async (payload) => {
  cacheStore.update(draft => {
    draft.memoryCache.set(payload.key, payload.value);
    return draft;
  });
}, [cacheStore]);
```

#### Error: "Cannot assign to read only property"

```typescript
// ❌ Problem: Property assignment on frozen object
const handleUserUpdate = useCallback(async (payload) => {
  const user = useStoreValue(userStore);
  user.name = payload.name; // ❌ Throws error
}, [userStore]);

// ✅ Solution: Use store.setValue() or store.update()
const handleUserUpdate = useCallback(async (payload) => {
  // Option 1: Complete replacement
  const currentUser = userStore.getValue();
  userStore.setValue({ ...currentUser, name: payload.name });
  
  // Option 2: Partial update with Immer
  userStore.update(draft => {
    draft.name = payload.name;
    return draft;
  });
}, [userStore]);
```

### 📚 **Best Practices Summary**

1. **Always use store methods**: `setValue()`, `update()`, never direct mutation
2. **Follow 3-step process**: Read → Business Logic → Update
3. **Use Immer drafts**: For complex objects, arrays, Maps, and Sets
4. **Lazy evaluation**: Use `store.getValue()` inside handlers for current state
5. **Proper dependencies**: Include stores in `useCallback` dependency arrays
6. **Error handling**: Use controller methods for validation and error reporting

---

## Performance Guidelines

### ⚡ Store Optimization

#### Comparison Strategy Selection
```tsx
// ✅ Recommended: Choose strategy based on data characteristics
const {
  Provider: DataStoreProvider,
  useStore: useDataStore
} = createStoreContext('Data', {
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

---

## 📚 **Related Documentation**

### 🏗️ **Architecture Guides**
- **[MVVM Core Architecture](./mvvm-core-architecture.md)** - Complete MVVM implementation guide with practical examples
- **[Architecture Guide](./architecture-guide.md)** - Overall framework architecture concepts
- **[Pattern Guide](./pattern-guide.md)** - Comprehensive pattern usage guide

### 📋 **Setup & Implementation**
- **[Setup Patterns](../guide/patterns/setup/index.md)** - Context creation patterns and configurations
- **[Store Patterns](../guide/patterns/store/index.md)** - State management implementation patterns
- **[Action Patterns](../guide/patterns/action/index.md)** - Business logic implementation patterns
- **[RefContext Patterns](../guide/patterns/ref/index.md)** - DOM manipulation and performance patterns

### 🎯 **Best Practices**
- **[Documentation Rules](../../DOCUMENTATION_RULES.md)** - Framework documentation standards
- **[Getting Started](../guide/getting-started.md)** - Quick start guide for new users

---

## 🎯 **Quick Reference for MVVM Implementation**

### **Model Layer** → Context Declarations
```typescript
// src/models/UserModel.ts
export const { Provider, useStore, useActionDispatch } = create~Context();
```

### **ViewModel Layer** → Behavior Injection  
```typescript
// src/viewmodels/useUserProfile.ts
export function useUserProfile() {
  return { state, actions, computed };
}
```

### **Business Logic Layer** → Domain Rules
```typescript
// src/business/UserBusinessLogic.tsx
export function UserBusinessLogic({ children }) {
  useActionHandler('action', businessLogic);
  return children;
}
```

### **View Layer** → Pure Components
```typescript
// src/components/UserProfile.tsx
export function UserProfile() {
  const { state, actions } = useUserProfile();
  return <UI />;
}
```

### **Shared Layer** → Reusable Components
```typescript  
// src/shared/Button.tsx
export function Button({ variant, onClick, children }: ButtonProps) {
  return <button className={variant} onClick={onClick}>{children}</button>;
}
```

**Follow this architecture for scalable, maintainable, and type-safe applications with Context-Action Framework.**