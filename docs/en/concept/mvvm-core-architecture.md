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
    
    // Business validation
    if (!payload.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    // Business logic
    const updated = {
      ...current,
      ...payload,
      lastActivity: Date.now()
    };
    
    // State update
    profileStore.setValue(updated);
    
    // Side effects
    await saveToAPI(updated);
    
    // Session update
    sessionStore.update(session => ({
      ...session,
      lastActivity: Date.now()
    }));
  }, [profileStore, sessionStore]));
  
  // Business Logic: Logout with cleanup
  useUserActionHandler('logout', useCallback(async () => {
    // Business cleanup
    profileStore.setValue({ id: '', name: '', email: '', role: 'guest' });
    sessionStore.setValue({ isAuthenticated: false, permissions: [], lastActivity: 0 });
    
    // API cleanup
    await clearSession();
    
    // Navigation
    window.location.href = '/login';
  }, [profileStore, sessionStore]));
  
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

### 🧩 **Complex Shared Components**: Smart Widgets with Context-Action
```typescript
// Complex shared: Smart widgets with Context-Action for complexity resolution
// File: src/shared/DataTable/DataTableModel.ts
export const {
  Provider: DataTableProvider,
  useStore: useDataTableStore,
  useActionDispatch: useDataTableDispatch
} = createStoreContext('DataTable', {
  data: [] as any[],
  pagination: { page: 1, size: 10, total: 0 },
  sorting: { field: '', direction: 'asc' as 'asc' | 'desc' },
  filtering: {},
  selection: [] as any[],
  loading: false
});

export const {
  Provider: DataTableActionProvider,
  useActionHandler: useDataTableHandler
} = createActionContext<DataTableActions>('DataTableActions');

// File: src/shared/DataTable/useDataTable.ts
export function useDataTable() {
  const dataStore = useDataTableStore('data');
  const paginationStore = useDataTableStore('pagination');
  const sortingStore = useDataTableStore('sorting');
  const filteringStore = useDataTableStore('filtering');
  const selectionStore = useDataTableStore('selection');
  const loadingStore = useDataTableStore('loading');
  
  const dispatch = useDataTableDispatch();
  
  // State injection
  const data = useStoreValue(dataStore);
  const pagination = useStoreValue(paginationStore);
  const sorting = useStoreValue(sortingStore);
  const filtering = useStoreValue(filteringStore);
  const selection = useStoreValue(selectionStore);
  const loading = useStoreValue(loadingStore);
  
  // Action injection
  const changePage = useCallback((page: number) => {
    dispatch('changePage', { page });
  }, [dispatch]);
  
  const changeSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    dispatch('changeSort', { field, direction });
  }, [dispatch]);
  
  const applyFilter = useCallback((filters: Record<string, any>) => {
    dispatch('applyFilter', { filters });
  }, [dispatch]);
  
  const selectRow = useCallback((id: any) => {
    dispatch('selectRow', { id });
  }, [dispatch]);
  
  return {
    // State
    data,
    pagination,
    sorting,
    filtering,
    selection,
    loading,
    
    // Actions
    changePage,
    changeSort,
    applyFilter,
    selectRow,
    
    // Computed
    hasData: data.length > 0,
    totalPages: Math.ceil(pagination.total / pagination.size),
    selectedCount: selection.length,
    isAllSelected: selection.length === data.length
  };
}

// File: src/shared/DataTable/DataTable.tsx
interface DataTableProps {
  columns: Column[];
  initialData?: any[];
  onRowSelect?: (row: any) => void;
  onFilter?: (filters: Record<string, any>) => void;
  // Complex widget can accept external configuration
}

export function DataTable({ columns, initialData, onRowSelect, onFilter }: DataTableProps) {
  // Smart Widget: Uses Context-Action to manage internal complexity
  const {
    data, pagination, sorting, selection, loading,
    changePage, changeSort, selectRow,
    hasData, totalPages, selectedCount
  } = useDataTable();
  
  // Initialize data if provided
  useEffect(() => {
    if (initialData) {
      // Dispatch to update internal state
      dispatch('setData', { data: initialData });
    }
  }, [initialData]);
  
  // Complex rendering logic handled cleanly
  return (
    <div className="data-table">
      <div className="data-table-header">
        <span>{selectedCount} selected</span>
        <FilterControls onFilter={onFilter} />
      </div>
      
      <table>
        <thead>
          {columns.map(column => (
            <th 
              key={column.key}
              onClick={() => changeSort(column.key, sorting.direction === 'asc' ? 'desc' : 'asc')}
            >
              {column.title}
              {sorting.field === column.key && (
                <SortIcon direction={sorting.direction} />
              )}
            </th>
          ))}
        </thead>
        <tbody>
          {data.map(row => (
            <tr 
              key={row.id}
              className={selection.includes(row.id) ? 'selected' : ''}
              onClick={() => {
                selectRow(row.id);
                onRowSelect?.(row);
              }}
            >
              {columns.map(column => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <Pagination 
        current={pagination.page}
        total={totalPages}
        onPageChange={changePage}
      />
      
      {loading && <LoadingOverlay />}
    </div>
  );
}
```

---

## 🏗️ **App Architecture**: Provider Composition

**Role**: Compose all contexts and business logic at the app level

```typescript
// App: Full architecture composition
// File: src/App.tsx
function App() {
  return (
    <UserStoreProvider>          {/* Model Layer */}
      <UserActionProvider>       {/* Model Layer */}
        <UserRefProvider>        {/* Model Layer */}
          <UserBusinessLogic>    {/* Business Logic Layer */}
            <Router>
              <Routes>
                <Route path="/profile" element={<UserProfile />} />    {/* View Layer */}
                <Route path="/settings" element={<UserSettings />} />  {/* View Layer */}
              </Routes>
            </Router>
          </UserBusinessLogic>
        </UserRefProvider>
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

### 📊 **Complexity Resolution Examples**

#### **Smart Widget: Advanced Form**
```typescript
// Complex form that would normally have lots of internal state
// File: src/shared/AdvancedForm/AdvancedFormModel.ts
export const { 
  Provider: AdvancedFormProvider,
  useStore: useAdvancedFormStore 
} = createStoreContext('AdvancedForm', {
  fields: {} as Record<string, any>,
  validation: {} as Record<string, string[]>,
  isDirty: false,
  isSubmitting: false,
  errors: {} as Record<string, string>
});

// File: src/shared/AdvancedForm/useAdvancedForm.ts
export function useAdvancedForm() {
  // Complex form logic handled through Context-Action
  const fieldsStore = useAdvancedFormStore('fields');
  const validationStore = useAdvancedFormStore('validation');
  // ... other stores
  
  return {
    // Form state
    fields: useStoreValue(fieldsStore),
    // ... other state
    
    // Form actions
    updateField: (name: string, value: any) => {
      fieldsStore.update(fields => ({ ...fields, [name]: value }));
    },
    validateField: (name: string) => { /* validation logic */ },
    submitForm: () => { /* submit logic */ }
  };
}

// File: src/shared/AdvancedForm/AdvancedForm.tsx
export function AdvancedForm({ schema, onSubmit }: AdvancedFormProps) {
  // Smart Widget: Uses Context-Action to manage complexity
  const { fields, validation, updateField, validateField, submitForm } = useAdvancedForm();
  
  // Complex rendering made simple through proper state management
  return (
    <AdvancedFormProvider>
      <form onSubmit={submitForm}>
        {schema.fields.map(fieldConfig => (
          <FieldRenderer
            key={fieldConfig.name}
            config={fieldConfig}
            value={fields[fieldConfig.name]}
            errors={validation[fieldConfig.name]}
            onChange={(value) => updateField(fieldConfig.name, value)}
            onBlur={() => validateField(fieldConfig.name)}
          />
        ))}
        <Button type="submit">Submit</Button>
      </form>
    </AdvancedFormProvider>
  );
}
```

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