# Domain Context Architecture

The Context-Action framework implements **document-centric context separation** for perfect domain isolation and effective artifact management. This is the **recommended approach** for multi-domain applications and large teams.

**Key Difference from MVVM Architecture**:
- **Domain Architecture**: Focuses on **business domains** (User, Product, Order contexts)
- **MVVM Architecture**: Focuses on **architectural layers** (Model, ViewModel, View layers)

Both can be combined - use Domain Architecture to separate business concerns, then apply MVVM within each domain for architectural clarity.

## Context Separation Strategy

### Domain-Based Context Architecture

- **Business Context**: Business logic, data processing, and domain rules
- **UI Context**: Screen state, user interactions, and component behavior
- **Validation Context**: Data validation, form processing, and error handling  
- **Design Context**: Theme management, styling, layout, and visual states
- **Architecture Context**: System configuration, infrastructure, and technical decisions

### Document-Based Context Design

Each context is designed to manage its corresponding documentation and deliverables:

- **Design Documentation** → Design Context (themes, component specifications, style guides)
- **Business Requirements** → Business Context (workflows, rules, domain logic)
- **Architecture Documents** → Architecture Context (system design, technical decisions)
- **Validation Specifications** → Validation Context (rules, schemas, error handling)
- **UI Specifications** → UI Context (interactions, state management, user flows)

## Implementation Patterns

### Business Context Implementation

```typescript
// stores/business/userBusiness.store.ts
export interface UserBusinessData {
  profile: { id: string; name: string; email: string; role: 'admin' | 'user' | 'guest' };
  preferences: { theme: 'light' | 'dark'; language: string };
}

export interface UserBusinessActions {
  validateUser: { userData: Partial<UserBusinessData['profile']> };
  processBusinessRule: { ruleId: string; data: any };
  generateReport: { reportType: string; filters: any };
}

// Create Business Context
export const {
  Provider: UserBusinessStoreProvider,
  useStore: useUserBusinessStore,
  useStoreManager: useUserBusinessStoreManager
} = createDeclarativeStorePattern('UserBusiness', {
  profile: { 
    initialValue: { id: '', name: '', email: '', role: 'guest' },
    strategy: 'shallow'
  },
  preferences: { 
    initialValue: { theme: 'light', language: 'en' },
    strategy: 'shallow'
  }
});

export const {
  Provider: UserBusinessActionProvider,
  useActionDispatch: useUserBusinessAction,
  useActionHandler: useUserBusinessActionHandler
} = createActionContext<UserBusinessActions>('UserBusinessActions');
```

### UI Context Implementation

```typescript
// stores/ui/userUI.store.ts
export interface UserUIData {
  viewState: {
    isEditing: boolean;
    activeTab: string;
    selectedItems: string[];
  };
  interactions: {
    mousePosition: { x: number; y: number };
    hoveredElement: string | null;
    dragState: any;
  };
}

export interface UserUIActions {
  updateViewState: { state: Partial<UserUIData['viewState']> };
  handleInteraction: { type: string; data: any };
  showNotification: { message: string; type: 'info' | 'warning' | 'error' };
}

// Create UI Context
export const {
  Provider: UserUIStoreProvider,
  useStore: useUserUIStore
} = createDeclarativeStorePattern('UserUI', {
  viewState: {
    initialValue: { isEditing: false, activeTab: 'profile', selectedItems: [] },
    strategy: 'shallow'
  },
  interactions: {
    initialValue: { mousePosition: { x: 0, y: 0 }, hoveredElement: null, dragState: null },
    strategy: 'shallow'
  }
});

export const {
  Provider: UserUIActionProvider,
  useActionDispatch: useUserUIAction,
  useActionHandler: useUserUIActionHandler
} = createActionContext<UserUIActions>('UserUIActions');

// UI Performance Context (RefContext for zero re-renders)
export const {
  Provider: UserUIRefProvider,
  useRefHandler: useUserUIRef
} = createRefContext<{
  modal: HTMLDivElement;
  tooltip: HTMLDivElement;
  cursor: HTMLDivElement;
  dragPreview: HTMLDivElement;
}>('UserUIRefs');
```

### Design Context Implementation

```typescript
// stores/design/designSystem.store.ts
export interface DesignSystemData {
  theme: {
    colors: Record<string, string>;
    typography: Record<string, any>;
    spacing: Record<string, string>;
  };
  components: {
    variants: Record<string, any>;
    sizes: Record<string, any>;
  };
  layout: {
    breakpoints: Record<string, string>;
    grid: any;
  };
}

// Create Design Context
export const {
  Provider: DesignSystemStoreProvider,
  useStore: useDesignSystemStore
} = createDeclarativeStorePattern('DesignSystem', {
  theme: {
    initialValue: {
      colors: { primary: '#007bff', secondary: '#6c757d' },
      typography: { base: '16px', scale: 1.2 },
      spacing: { sm: '8px', md: '16px', lg: '24px' }
    },
    strategy: 'deep' // Deep comparison for nested theme objects
  },
  components: {
    initialValue: { variants: {}, sizes: {} },
    strategy: 'shallow'
  },
  layout: {
    initialValue: {
      breakpoints: { sm: '576px', md: '768px', lg: '992px' },
      grid: { columns: 12, gap: '16px' }
    },
    strategy: 'shallow'
  }
});

// Design RefContext for theme transitions
export const {
  Provider: DesignRefProvider,
  useRefHandler: useDesignRef
} = createRefContext<{
  themeRoot: HTMLDivElement;
  animatedElements: HTMLDivElement;
}>('DesignRefs');
```

## Provider Composition Strategies

### Hierarchical Domain Composition

```tsx
// providers/DomainProvider.tsx
export function UserDomainProvider({ children }: { children: React.ReactNode }) {
  return (
    // Business layer (foundation)
    <UserBusinessStoreProvider>
      <UserBusinessActionProvider>
        
        {/* UI layer (depends on business) */}
        <UserUIStoreProvider>
          <UserUIActionProvider>
            <UserUIRefProvider>
              
              {/* Design layer (visual concerns) */}
              <DesignSystemStoreProvider>
                <DesignRefProvider>
                  {children}
                </DesignRefProvider>
              </DesignSystemStoreProvider>
              
            </UserUIRefProvider>
          </UserUIActionProvider>
        </UserUIStoreProvider>
        
      </UserBusinessActionProvider>
    </UserBusinessStoreProvider>
  );
}
```

### Modular Domain Composition

```tsx
// providers/modular/index.ts
export const BusinessProvider = ({ children }: PropsWithChildren) => (
  <UserBusinessStoreProvider>
    <UserBusinessActionProvider>
      {children}
    </UserBusinessActionProvider>
  </UserBusinessStoreProvider>
);

export const UIProvider = ({ children }: PropsWithChildren) => (
  <UserUIStoreProvider>
    <UserUIActionProvider>
      <UserUIRefProvider>
        {children}
      </UserUIRefProvider>
    </UserUIActionProvider>
  </UserUIStoreProvider>
);

export const DesignProvider = ({ children }: PropsWithChildren) => (
  <DesignSystemStoreProvider>
    <DesignRefProvider>
      {children}
    </DesignRefProvider>
  </DesignSystemStoreProvider>
);

// Compose as needed
function App() {
  return (
    <BusinessProvider>
      <UIProvider>
        <DesignProvider>
          <UserComponents />
        </DesignProvider>
      </UIProvider>
    </BusinessProvider>
  );
}
```

## Cross-Domain Communication

### Controlled Cross-Domain Integration

```tsx
// hooks/integration/useUserDomainIntegration.ts
export function useUserDomainIntegration() {
  // Business domain
  const profileStore = useUserBusinessStore('profile');
  const businessAction = useUserBusinessAction();
  
  // UI domain
  const viewStore = useUserUIStore('viewState');
  const uiAction = useUserUIAction();
  const modalRef = useUserUIRef('modal');
  
  // Design domain
  const themeStore = useDesignSystemStore('theme');
  const themeRef = useDesignRef('themeRoot');
  
  const profile = useStoreValue(profileStore);
  const viewState = useStoreValue(viewStore);
  const theme = useStoreValue(themeStore);
  
  // Coordinated actions across domains
  const updateUserProfile = useCallback(async (data: any) => {
    // 1. Update business state
    await businessAction('validateUser', { userData: data });
    
    // 2. Update UI state  
    uiAction('updateViewState', { state: { isEditing: false } });
    
    // 3. Show visual feedback with direct DOM manipulation
    if (modalRef.target) {
      modalRef.target.style.display = 'none';
    }
    
    // 4. Apply theme changes if needed
    if (themeRef.target) {
      themeRef.target.style.setProperty('--primary-color', theme.colors.primary);
    }
  }, [businessAction, uiAction, modalRef, themeRef, theme]);
  
  return {
    profile,
    viewState,
    theme,
    updateUserProfile
  };
}
```

### Event-Driven Cross-Domain Communication

```tsx
// hooks/events/useDomainEvents.ts
interface DomainEvents {
  'business:user-updated': { userId: string; changes: any };
  'ui:modal-opened': { modalId: string };
  'design:theme-changed': { themeId: string };
}

// Central event coordination
export const {
  Provider: DomainEventProvider,
  useActionDispatch: useDomainEvent,
  useActionHandler: useDomainEventHandler
} = createActionContext<DomainEvents>('DomainEvents');

// Business domain listens for UI events
function useBusinessDomainHandlers() {
  useDomainEventHandler('ui:modal-opened', (payload) => {
    console.log('Business domain: Modal opened', payload.modalId);
    // Business logic triggered by UI events
  });
}

// UI domain listens for business events  
function useUIDomainHandlers() {
  const modalRef = useUserUIRef('modal');
  
  useDomainEventHandler('business:user-updated', (payload) => {
    // Show success animation without React re-render
    if (modalRef.target) {
      modalRef.target.style.transform = 'scale(1.05)';
      setTimeout(() => {
        if (modalRef.target) {
          modalRef.target.style.transform = 'scale(1.0)';
        }
      }, 200);
    }
  });
}
```

## Advanced Handler & Trigger Management

### Priority-Based Handler Execution

```tsx
// Business handlers execute first
useUserBusinessActionHandler('updateProfile', businessHandler, {
  priority: 100,
  blocking: true,
  tags: ['business', 'validation']
});

// UI handlers execute after business logic
useUserUIActionHandler('updateProfile', uiHandler, {
  priority: 80,
  blocking: true,
  tags: ['ui', 'feedback']
});

// Design handlers execute last
useDesignSystemActionHandler('updateProfile', designHandler, {
  priority: 60,
  blocking: false,
  tags: ['design', 'animation']
});
```

### Domain-Specific Trigger System

```tsx
// Automatic triggers based on store changes
function useAutomaticTriggers() {
  const profileStore = useUserBusinessStore('profile');
  const themeStore = useDesignSystemStore('theme');
  
  // Trigger UI updates when business data changes
  useEffect(() => {
    const unsubscribe = profileStore.subscribe((newProfile, oldProfile) => {
      if (newProfile.role !== oldProfile.role) {
        // Trigger role-based UI changes
        useDomainEvent()('ui:role-changed', { 
          newRole: newProfile.role, 
          oldRole: oldProfile.role 
        });
      }
    });
    
    return unsubscribe;
  }, [profileStore]);
}
```

## Best Practices

### 1. Domain Isolation Principles
- **Clear Boundaries**: Each domain should have well-defined responsibilities
- **Minimal Dependencies**: Domains should minimize cross-domain dependencies
- **Document-Driven**: Align context boundaries with documentation domains
- **Team Ownership**: Different teams can own different domain contexts

### 2. Communication Patterns
- **Prefer Events**: Use event-driven communication over direct dependencies
- **Controlled Integration**: Use integration hooks for necessary cross-domain logic
- **Performance Layers**: Use RefContext for performance-critical cross-domain updates
- **Type Safety**: Maintain type safety across domain boundaries

### 3. Provider Organization
- **Hierarchical**: Organize providers in dependency order
- **Modular**: Support modular composition for different app configurations
- **Lazy Loading**: Load domain providers on-demand
- **Feature Flags**: Use conditional providers for feature toggling

### 4. Testing Strategy
- **Domain Isolation**: Test each domain in isolation
- **Integration Testing**: Test cross-domain communication separately
- **Mock Domains**: Use domain mocks for isolated testing
- **End-to-End**: Test complete domain interactions

Domain Context Architecture provides a scalable foundation for complex applications while maintaining clear separation of concerns and supporting effective team collaboration.