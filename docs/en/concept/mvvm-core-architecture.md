# Context-Action MVVM Core Architecture

**Practical MVVM Implementation Guide for Prompt-Based Development**

## 🎯 Architecture Overview

Context-Action Framework implements a **pure MVVM architecture** where:
- **Model**: `create~Context` declarations (Store, Action, Ref)
- **ViewModel**: Custom hooks that inject state and behavior 
- **View**: Components consuming hooks with minimal internal state

### Core Principle
**"Declarative Context Definition + Hook-Based Injection = Pure MVVM"**

---

## 📐 Three-Layer Architecture

### 🏗️ **Model Layer**: Context Declarations

**Role**: Pre-define business logic, state management, and DOM references declaratively

```typescript
// Model: Declarative context definitions
// File: src/models/UserModel.ts
export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createStoreContext('User', {
  profile: { id: '', name: '', email: '', role: 'guest' as const },
  preferences: { theme: 'light' as const, language: 'en', notifications: true },
  session: { isAuthenticated: false, permissions: [], lastActivity: 0 }
});

// File: src/models/UserActionModel.ts  
export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserDispatch,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// File: src/models/UserRefModel.ts
export const {
  Provider: UserRefProvider,
  useRefHandler: useUserRef
} = createRefContext<UserRefs>('UserRefs');
```

### 🔗 **ViewModel Layer**: Hook-Based Injection & Composition

**Role**: Create focused hooks for state and behavior, then compose them for complex page needs

```typescript
// ViewModel: State-only hook
// File: src/viewmodels/useUserState.ts
export function useUserState() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  return {
    profile,
    isLoggedIn: profile.id !== '',
    displayName: profile.name || 'Guest',
    canEdit: profile.role !== 'guest'
  };
}

// ViewModel: Actions-only hook  
// File: src/viewmodels/useUserActions.ts
export function useUserActions() {
  const dispatch = useUserDispatch();
  
  return {
    updateProfile: useCallback((data: Partial<UserProfile>) => {
      dispatch('updateProfile', data);
    }, [dispatch]),
    
    logout: useCallback(() => {
      dispatch('logout');
    }, [dispatch])
  };
}

// ViewModel: Page-specific composed hook
// File: src/viewmodels/useUserProfilePage.ts
export function useUserProfilePage() {
  const state = useUserState();
  const actions = useUserActions();
  
  // Page-specific effects and computed values (ALL logic in hook)
  useEffect(() => {
    // Load profile data on page mount
    if (state.isLoggedIn) {
      actions.loadProfile();
    }
  }, [state.isLoggedIn, actions.loadProfile]);
  
  const profileCompleteness = useMemo(() => {
    const fields = ['name', 'email', 'avatar'];
    const completed = fields.filter(field => state.profile[field as keyof typeof state.profile]);
    return (completed.length / fields.length) * 100;
  }, [state.profile]);
  
  return {
    ...state,
    ...actions,
    profileCompleteness
  };
}
```

### 🎨 **View Layer**: Pure Component Consumption with Hook Composition

**Role**: Components consume composed ViewModel hooks tailored for their specific needs

```typescript
// View: Page components using composed hooks
// File: src/pages/UserProfilePage.tsx
export function UserProfilePage() {
  // Page-specific composed hook - all logic comes from hook composition
  const {
    profile, isLoggedIn, displayName, canEditProfile, profileCompleteness,
    saveProfileChanges, logout
  } = useUserProfilePage();
  
  // View: Pure rendering with injected behavior from composed hook
  return (
    <div className="user-profile-page">
      <header>
        <h1>{displayName}</h1>
        <div className="profile-progress">
          Profile {profileCompleteness}% complete
        </div>
      </header>
      
      {isLoggedIn ? (
        <div>
          <ProfileCard 
            profile={profile}
            canEdit={canEditProfile}
            onSave={saveProfileChanges}
          />
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <LoginPrompt />
      )}
    </div>
  );
}

// File: src/pages/UserSettingsPage.tsx  
export function UserSettingsPage() {
  // Settings-specific composed hook
  const {
    profile, preferences, isLoggedIn, hasUnsavedChanges,
    saveAllSettings, updatePreferences
  } = useUserSettingsPage();
  
  if (!isLoggedIn) {
    return <LoginRequired />;
  }
  
  // View: Pure UI logic with settings-specific composition
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <ProfileSettingsSection 
        profile={profile}
        onChange={(changes) => updatePreferences({ profile: changes })}
      />
      
      <PreferencesSection 
        preferences={preferences}
        onChange={updatePreferences}
      />
      
      <div className="settings-actions">
        <Button 
          variant="primary"
          disabled={!hasUnsavedChanges}
          onClick={() => saveAllSettings({ profile, preferences })}
        >
          Save All Changes
        </Button>
        {hasUnsavedChanges && <span>You have unsaved changes</span>}
      </div>
    </div>
  );
}

// File: src/components/ProfileCard.tsx - Component using focused hooks
export function ProfileCard({ 
  profile, 
  canEdit, 
  onSave 
}: { 
  profile: UserProfile; 
  canEdit: boolean; 
  onSave: (changes: Partial<UserProfile>) => void; 
}) {
  // Component can use focused hooks for specific needs
  const { theme } = useUserState(); // Only state needed here
  const [isEditing, setIsEditing] = useState(false);
  const [changes, setChanges] = useState<Partial<UserProfile>>({});
  
  const handleSave = () => {
    onSave(changes);
    setIsEditing(false);
    setChanges({});
  };
  
  return (
    <Card theme={theme}>
      {isEditing ? (
        <div>
          <Input 
            value={changes.name ?? profile.name}
            onChange={(name) => setChanges(prev => ({ ...prev, name }))}
          />
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      ) : (
        <div>
          <h3>{profile.name}</h3>
          <p>{profile.email}</p>
          {canEdit && (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
        </div>
      )}
    </Card>
  );
}
```

---

## 🏢 **Business Logic Layer**: Action Handlers

**Role**: Implement business logic separately from UI through action handlers

```typescript
// Business Logic: Action handlers for business rules
// File: src/business/UserBusinessLogic.tsx
export function UserBusinessLogic({ children }: { children: ReactNode }) {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  
  // Business Logic: Update profile with validation
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    const current = profileStore.getValue();
    
    if (!payload.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    const updated = { ...current, ...payload };
    profileStore.setValue(updated);
    await saveToAPI(updated);
  }, [profileStore]));
  
  // Business Logic: Logout
  useUserActionHandler('logout', useCallback(async () => {
    profileStore.setValue({ id: '', name: '', email: '' });
    await clearSession();
  }, [profileStore]));
  
  return <>{children}</>;
}
```

---

## 🎭 **Shared Components**: Smart Widget Pattern

**Role**: Handle complexity through Context-Action while maintaining reusability

### 📦 **Simple Shared Components**: Pure View
```typescript
// Simple shared: Pure view components with explicit props
// File: src/shared/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export function Button({ variant, size, disabled, loading, children, onClick }: ButtonProps) {
  // Pure View: No hooks, no internal state, maximum reusability
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

### 🧩 **Smart Widget Pattern**
```typescript
// Smart Widget Hook: All complexity in hook
function useDataTable(initialData: any[]) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const changePage = useCallback((newPage: number) => {
    setLoading(true);
    setPage(newPage);
    // Load data logic here
    setLoading(false);
  }, []);
  
  return { data, page, loading, changePage };
}

// Smart Widget Component: Pure consumption
export function DataTable({ columns, data, onRowSelect }: {
  columns: Column[];
  data: any[];
  onRowSelect?: (row: any) => void;
}) {
  const table = useDataTable(data);
  
  return (
    <div>
      <table>
        <tbody>
          {table.data.map((row, i) => (
            <tr key={i} onClick={() => table.changePage(table.page + 1)}>
              {columns.map(col => <td key={col.key}>{row[col.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {table.loading && <div>Loading...</div>}
    </div>
  );
}

```

---

## 🏗️ **App Architecture**: Provider Composition

**Role**: Compose all contexts and business logic at the app level

```typescript
// App: MVVM Architecture composition
function App() {
  return (
    <UserStoreProvider>         {/* Model Layer */}
      <UserActionProvider>      {/* Model Layer */}
        <UserBusinessLogic>     {/* Business Logic Layer */}
          <Router>
            <Route path="/profile" element={<UserProfile />} />
          </Router>
        </UserBusinessLogic>
      </UserActionProvider>
    </UserStoreProvider>
  );
}
```

---

## 📋 **Implementation Checklist**

### ✅ **Model Layer** (`src/models/`)
- [ ] Create `~StoreContext` for state management
- [ ] Create `~ActionContext` for business actions  
- [ ] Create `~RefContext` for DOM manipulation
- [ ] Export providers and hooks with domain-specific naming

### ✅ **ViewModel Layer** (`src/viewmodels/`)
- [ ] Create focused hooks first:
  - [ ] State-only hooks (`useUserState`, `useProductData`)
  - [ ] Actions-only hooks (`useUserActions`, `useProductActions`)
  - [ ] Events-only hooks (`useUserEvents`, `useFormEvents`)
- [ ] Create composed hooks for pages:
  - [ ] Page-specific hooks (`useUserProfilePage`, `useSettingsPage`)
  - [ ] Feature-specific hooks (`useSearchFeature`, `useAdminFeature`)
- [ ] Keep hooks pure and focused on single responsibilities
- [ ] Enable hook composition for complex page requirements
- [ ] Return only what views need (no internal logic exposure)

### ✅ **Business Logic Layer** (`src/business/`)
- [ ] Implement `useActionHandler` for business rules
- [ ] Keep business logic separate from UI concerns
- [ ] Handle validation, API calls, and side effects
- [ ] Manage cross-store coordination

### ✅ **View Layer** (`src/components/`, `src/pages/`)
- [ ] Consume ViewModel hooks only
- [ ] Minimize internal state (prefer injected state)
- [ ] Focus on pure rendering and user interactions
- [ ] Delegate all logic to ViewModel layer

### ✅ **Shared Components** (`src/shared/`)
- [ ] Decide component complexity:
  - [ ] **Simple components**: Pure props, no hooks (Button, Input, Card)
  - [ ] **Smart widgets**: Context-Action for complexity (DataTable, RichTextEditor)
- [ ] For simple components:
  - [ ] Create pure components with explicit props
  - [ ] No hooks, no context consumption  
  - [ ] Maximum reusability through view state management
- [ ] For smart widgets:
  - [ ] Create dedicated Model, ViewModel, and Business Logic
  - [ ] Wrap in Provider for isolation
  - [ ] Handle complexity through Context-Action patterns

---

## 🎯 **Development Workflow**

### 1. **Define Domain** (Model)
```bash
# Create context declarations first
src/models/UserModel.ts       # Store contexts
src/models/UserActionModel.ts # Action contexts  
src/models/UserRefModel.ts    # Ref contexts
```

### 2. **Create ViewModels** (ViewModel)
```bash
# Create focused hooks first
src/viewmodels/useUserState.ts     # State-only hook
src/viewmodels/useUserActions.ts   # Actions-only hook  
src/viewmodels/useUserEvents.ts    # Events-only hook

# Then create composed hooks for specific pages
src/viewmodels/useUserProfilePage.ts  # Composed for profile page
src/viewmodels/useUserSettingsPage.ts # Composed for settings page
src/viewmodels/useUserDashboard.ts    # Composed for dashboard page
```

### 3. **Implement Business Logic** (Business)
```bash
# Create action handlers for business rules
src/business/UserBusinessLogic.tsx
src/business/AuthBusinessLogic.tsx
```

### 4. **Build Views** (View)
```bash
# Create components that consume ViewModels
src/pages/UserProfilePage.tsx
src/components/UserProfile.tsx
```

### 5. **Create Shared Components** (Shared)
```bash
# Build reusable pure components
src/shared/Button.tsx
src/shared/Card.tsx
src/shared/Form.tsx
```

---

## 🔧 **Advanced Patterns**

### 🎯 **Hook Composition Strategy**

The Context-Action MVVM architecture supports flexible hook composition:

#### **Focused Hook Pattern**
```typescript
// State-only hooks - Focus on data access
useUserState()     // Returns only state and computed values
useProductData()   // Returns only product-related data
useCartState()     // Returns only shopping cart state

// Actions-only hooks - Focus on behavior
useUserActions()   // Returns only action functions
useProductActions() // Returns only product-related actions
useCartActions()   // Returns only cart-related actions

// Event-only hooks - Focus on DOM event handlers
useUserEvents()    // Returns only event handlers for user interactions
useFormEvents()    // Returns only form-related event handlers
useKeyboardEvents() // Returns only keyboard event handlers
```

#### **Composed Hook Pattern**
```typescript
// Page-specific hooks - Combine focused hooks for specific pages
useUserProfilePage()  // Combines useUserState + useUserActions + page logic
useProductListPage()  // Combines useProductData + useProductActions + list logic
useCheckoutPage()     // Combines useCartState + useUserState + usePaymentActions

// Feature-specific hooks - Combine for specific features
useSearchFeature()    // Combines search state + search actions + search logic
useShoppingFeature()  // Combines cart + product + user logic
useAdminFeature()     // Combines admin state + admin actions + permission logic
```

### 🧩 **Smart Widget vs Simple Component Decision Tree**

```
Is the component complex with internal logic?
├─ YES → Smart Widget with Context-Action
│   ├─ Create dedicated Model (Context declarations)
│   ├─ Create dedicated ViewModel (Hook for behavior injection)
│   ├─ Create Business Logic (Action handlers)
│   └─ Wrap in Provider for isolation
│
└─ NO → Simple Shared Component
    ├─ Pure props interface
    ├─ No hooks or context consumption
    └─ Maximum reusability

Examples:
Smart Widgets: DataTable, RichTextEditor, MediaPlayer, Dashboard
Simple Components: Button, Input, Card, Modal, Icon
```

### 🎯 **Key Rules**

**Components Rules:**
- ❌ Never use `dispatch` or `useEffect` in components
- ❌ Never consume Context-Action directly in components  
- ✅ Only consume custom hooks
- ✅ Focus purely on rendering

**Hook Rules:**
- ✅ All logic, effects, and dispatch calls in hooks
- ✅ Compose hooks for complex requirements
- ✅ Return only what components need

---

## 💡 **Key Architecture Benefits**

### 🔄 **Perfect Separation of Concerns**
- **Model**: What data and capabilities exist
- **ViewModel**: How to use them in views
- **View**: What users see and interact with
- **Business**: Why and when things happen
- **Shared**: How to display information consistently

### 🚀 **Development Efficiency** 
- **Model-First**: Define capabilities before implementation
- **Hook-Injection**: Consistent behavior patterns across all views
- **Pure Views**: Components focus only on presentation
- **Reusable Shared**: Build once, use everywhere

### 🏗️ **Architecture Scalability**
- **Domain Isolation**: Add new features without touching existing code
- **Type Safety**: Full TypeScript support throughout all layers
- **Team Collaboration**: Different teams can work on different layers
- **Testing**: Each layer can be tested independently

---

## 📚 **Related Documentation**

- **[Setup Patterns](../guide/patterns/setup/index.md)** - Context creation patterns
- **[Store Patterns](../guide/patterns/store/index.md)** - State management patterns  
- **[Action Patterns](../guide/patterns/action/index.md)** - Business logic patterns
- **[Architecture Patterns](../guide/patterns/architecture/index.md)** - Complex architecture patterns
- **[Conventions](./conventions.md)** - Naming and coding conventions

This architecture provides a **prompt-ready foundation** for building scalable, maintainable applications with clear separation of concerns and maximum code reusability.