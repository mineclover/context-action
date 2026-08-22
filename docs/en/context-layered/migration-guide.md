# Migration Guide: MVVM to Context-Layered Architecture

A comprehensive guide for migrating from traditional MVVM patterns to the advanced Context-Layered Architecture.

## 🎯 Migration Overview

**Context-Layered Architecture** is an evolution of traditional MVVM patterns, specifically designed for real-world React applications using the Context-Action framework. It provides more practical, maintainable, and scalable solutions.

### Key Differences

| Aspect | Traditional MVVM | Context-Layered |
|--------|------------------|-----------------|
| **Focus** | Conceptual layers (Model/View/ViewModel) | Practical implementation layers |
| **Structure** | 4 layers (Model/View/ViewModel/Performance) | 6 layers (contexts/handlers/actions/hooks/views/MainPage) |
| **Business Logic** | Mixed across ViewModel | Isolated in handlers with props-based DI |
| **Dependency Management** | Context-based only | Props-based dependency injection |
| **Handler Registration** | Component-level | Centralized with registry pattern |
| **Testing** | Component-focused | Layer-focused with mock injection |

## Current package-boundary migration

The tool protocol is now a separate framework-neutral package. Install it only
when action schemas or MCP/provider adapters are needed:

```bash
npm install @context-action/react @context-action/core @context-action/tool-protocol zod
```

Import `defineAction`, `createActionSchema`, `listAllTools`, and protocol types
from `@context-action/tool-protocol`. `@context-action/react/tools` owns
`createToolContext` and its React hooks; `@context-action/react` remains the
default action/store entry, while `@context-action/core` owns the action runtime.
The old Core and React re-exports are removed.

Durable mutation recovery is intentionally a separate optional package. Add
`@context-action/tool-durable-operations` when the application needs durable
operation records, cross-process claims, or HTTP/queue side-effect adapters;
it is not required for provider-neutral schemas and discovery.

The action context factory now requires an explicit context name:

```ts
createActionContext<AppActions>('Checkout', { registry: { debug: true } });
```

For a void action, dispatch options are the second argument so payload and
options cannot be confused:

```ts
await register.actions.reset(undefined, { debounce: 100 });
```

`@context-action/react` requires React 19.2 or later. Import Store and Action
APIs from `@context-action/react`; the former `react18` compatibility entry
point is no longer exported.
The maintained `@context-action/mutative-core` / `@context-action/mutative`
fork remains the immutable runtime contract; synchronize upstream changes via
its [`UPSTREAM.md`](../../../packages/mutative-core/UPSTREAM.md) record.

## 🚀 Migration Strategy

### Phase 1: Structure Reorganization

#### Before: Traditional MVVM Structure
```
src/components/checkout/
├── CheckoutModel.tsx        # Store definitions
├── CheckoutViewModel.tsx    # Business logic + handlers
├── CheckoutView.tsx         # UI components
└── CheckoutPerformance.tsx  # Refs and DOM manipulation
```

#### After: Context-Layered Structure
```
src/pages/checkout/
├── contexts/               # Store and action definitions
│   ├── CheckoutContext.ts
│   └── PaymentContext.ts
├── handlers/               # Business logic with props-based DI
│   ├── handler-registry.ts
│   ├── useCheckoutHandlers.ts
│   └── usePaymentHandlers.ts
├── actions/                # Action dispatching
│   ├── useCheckoutActions.ts
│   └── usePaymentActions.ts
├── hooks/                  # Store subscriptions
│   ├── useCheckoutData.ts
│   └── usePaymentData.ts
├── views/                  # Pure UI components
│   ├── CheckoutView.tsx
│   └── PaymentView.tsx
└── CheckoutPage.tsx        # Integration point
```

### Phase 2: Code Migration Patterns

#### 1. Context Definition Migration

**Before (MVVM Model Layer):**
```typescript
// CheckoutModel.tsx
export const {
  Provider: CheckoutStoreProvider,
  useStore: useCheckoutStore
} = createStoreContext('Checkout', {
  checkoutData: { initialValue: defaultCheckoutData }
});

export const {
  Provider: CheckoutActionProvider,
  useActionDispatch: useCheckoutDispatch,
  useActionHandler: useCheckoutHandler
} = createActionContext<CheckoutActions>('CheckoutActions');
```

**After (Context-Layered):**
```typescript
// contexts/CheckoutContext.ts
export interface CheckoutStores {
  'checkout-data': CheckoutData;
  'validation-state': ValidationState;
}

export interface CheckoutActions extends ActionPayloadMap {
  validate: CheckoutData;
  submit: OrderData;
  reset: void;
}

export const {
  Provider: CheckoutStoreProvider,
  useStore: useCheckoutStore
} = createStoreContext('Checkout', {
  'checkout-data': { initialValue: defaultCheckoutData },
  'validation-state': { initialValue: defaultValidationState }
});

export const {
  Provider: CheckoutActionProvider,
  useActionDispatch: useCheckoutDispatch,
  useActionHandler: useCheckoutHandler
} = createActionContext<CheckoutActions>('CheckoutActions');
```

#### 2. Business Logic Migration

**Before (MVVM ViewModel):**
```typescript
// CheckoutViewModel.tsx
export function CheckoutViewModel({ children }: { children: React.ReactNode }) {
  const checkoutStore = useCheckoutStore();
  const apiClient = useApiClient(); // Hardcoded dependency
  
  useCheckoutHandler('validate', async (payload) => {
    const result = await apiClient.validate(payload);
    checkoutStore.setValue(result);
  });
  
  return children;
}
```

**After (Context-Layered Handlers):**
```typescript
// handlers/useCheckoutHandlers.ts
export interface CheckoutHandlerProps {
  moduleId: string;
  apiClient: ApiClient;
  validator: FormValidator;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function useCheckoutValidateHandler(props: CheckoutHandlerProps) {
  const { moduleId, apiClient, validator, onSuccess, onError } = props;
  const checkoutStore = useCheckoutStore('checkout-data');
  
  useCheckoutHandler(
    CHECKOUT_HANDLERS.VALIDATE.id,
    async (payload: CheckoutData) => {
      try {
        const isValid = await validator.validate(payload);
        if (isValid) {
          const result = await apiClient.saveCheckout(payload);
          checkoutStore.setValue(result);
          onSuccess?.(result);
        }
      } catch (error) {
        onError?.(error as Error);
      }
    },
    CHECKOUT_HANDLERS.VALIDATE.priority
  );
}
```

#### 3. Data Access Migration

**Before (Direct store access):**
```typescript
// CheckoutView.tsx
export function CheckoutView() {
  const checkoutStore = useCheckoutStore();
  const checkoutData = useStoreValue(checkoutStore);
  const dispatch = useCheckoutDispatch();
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      dispatch('validate', checkoutData);
    }}>
      {/* UI implementation */}
    </form>
  );
}
```

**After (Layered hooks):**
```typescript
// hooks/useCheckoutData.ts
export function useCheckoutData() {
  const checkoutStore = useCheckoutStore('checkout-data');
  const validationStore = useCheckoutStore('validation-state');
  
  return {
    checkout: useStoreValue(checkoutStore),
    validation: useStoreValue(validationStore),
    isFormValid: useStoreValue(validationStore, state => state.isValid)
  };
}

// actions/useCheckoutActions.ts
export function useCheckoutActions() {
  const dispatch = useCheckoutDispatch();
  
  return {
    validate: useCallback((data: CheckoutData) => 
      dispatch(CHECKOUT_HANDLERS.VALIDATE.dispatchName, data), [dispatch]),
    submit: useCallback((order: OrderData) => 
      dispatch(CHECKOUT_HANDLERS.SUBMIT.dispatchName, order), [dispatch])
  };
}

// views/CheckoutView.tsx
export function CheckoutView() {
  const { checkout, validation, isFormValid } = useCheckoutData();
  const { validate, submit } = useCheckoutActions();
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (isFormValid) {
        submit(checkout);
      }
    }}>
      {/* UI implementation */}
    </form>
  );
}
```

#### 4. Integration Point Migration

**Before (MVVM composition):**
```typescript
// CheckoutPage.tsx
export default function CheckoutPage() {
  return (
    <CheckoutStoreProvider>
      <CheckoutActionProvider>
        <CheckoutViewModel>
          <CheckoutPerformanceLayer>
            <CheckoutView />
          </CheckoutPerformanceLayer>
        </CheckoutViewModel>
      </CheckoutActionProvider>
    </CheckoutStoreProvider>
  );
}
```

**After (Context-Layered composition):**
```typescript
// CheckoutPage.tsx
export default function CheckoutPage({ moduleId = "main" }) {
  const apiClient = useApiClient();
  const validator = useFormValidator();
  
  return (
    <CheckoutActionProvider>
      <CheckoutStoreProvider>
        <CheckoutRefProvider>
          <CheckoutHandlerRegistry
            moduleId={moduleId}
            apiClient={apiClient}
            validator={validator}
          >
            <div className="checkout-page">
              <h1>Checkout - {moduleId}</h1>
              <CheckoutView />
            </div>
          </CheckoutHandlerRegistry>
        </CheckoutRefProvider>
      </CheckoutStoreProvider>
    </CheckoutActionProvider>
  );
}
```

## 📋 Migration Checklist

### ✅ Preparation Phase
- [ ] Analyze current MVVM structure
- [ ] Identify business logic scattered across components
- [ ] List external dependencies (APIs, services, utilities)
- [ ] Document current handler registration patterns

### ✅ Structure Phase
- [ ] Create new folder structure (contexts/handlers/actions/hooks/views)
- [ ] Set up handler registry with ID/priority management
- [ ] Define TypeScript interfaces for all layers

### ✅ Implementation Phase
- [ ] Migrate context definitions to new structure
- [ ] Extract business logic into handlers with props-based DI
- [ ] Create action dispatch hooks
- [ ] Create data subscription hooks
- [ ] Refactor view components to use new hooks

### ✅ Integration Phase
- [ ] Update main page components to mount the Handler Registry
- [ ] Add proper error handling and logging
- [ ] Set up testing infrastructure for new layers
- [ ] Update documentation and team guidelines

### ✅ Validation Phase
- [ ] Run existing tests and fix failures
- [ ] Add new layer-specific tests
- [ ] Performance testing and optimization
- [ ] Code review and team feedback

## 🧪 Testing Strategy Migration

### Before: Component-focused Testing
```typescript
// Traditional MVVM testing
describe('CheckoutViewModel', () => {
  it('should validate checkout data', () => {
    // Test entire ViewModel component
  });
});
```

### After: Layer-focused Testing
```typescript
// Context-Layered testing
describe('useCheckoutValidateHandler', () => {
  it('should validate with mock dependencies', () => {
    const mockValidator = { validate: jest.fn().mockResolvedValue(true) };
    const mockApiClient = { saveCheckout: jest.fn() };
    
    renderHook(() => useCheckoutValidateHandler({
      moduleId: 'test',
      validator: mockValidator,
      apiClient: mockApiClient
    }));
    
    // Test handler in isolation
  });
});

describe('useCheckoutActions', () => {
  it('should dispatch correct actions', () => {
    // Test action dispatching
  });
});

describe('useCheckoutData', () => {
  it('should provide correct store subscriptions', () => {
    // Test data subscriptions
  });
});
```

## 🎯 Benefits After Migration

### Enhanced Maintainability
- **Clear separation of concerns** across 6 distinct layers
- **Testable business logic** with dependency injection
- **Consistent patterns** across the entire application

### Improved Scalability
- **Modular architecture** that scales with team size
- **Reusable handlers** across different modules
- **Centralized configuration** through registry pattern

### Better Developer Experience
- **TypeScript support** throughout all layers
- **Clear debugging** with isolated components
- **Faster development** with established patterns

## 🔗 Related Documentation

- [Context-Layered Architecture Guide](./context-layered-guide.md)
- [Folder Structure Guide](./architecture/folder-structure.md)
- [Props-based Handler Patterns](./patterns/props-based-handlers.md)
- [Handler Registry Pattern](./architecture/handler-registry.md)
- [Traditional MVVM Documentation](../guide/architecture/mvvm.md) (Legacy)

## 🚨 Migration Tips

### Common Pitfalls
- **Don't rush the migration** - Take it one layer at a time
- **Maintain backward compatibility** during transition
- **Keep tests running** throughout the process
- **Document decisions** for team alignment

### Success Factors
- **Team buy-in** and proper training
- **Gradual migration** starting with new features
- **Clear communication** about architectural changes
- **Proper tooling** and development setup

This migration guide ensures a smooth transition from traditional MVVM to the modern, production-ready Context-Layered Architecture.
