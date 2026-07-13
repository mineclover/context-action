# Context-Layered Architecture - Folder Structure Guide

A comprehensive guide to organizing Context-Action framework projects using **Context-Layered Architecture** with clear separation of concerns.

## 🏗️ Context-Layered Architecture Overview

The Context-Layered Architecture provides clear separation of responsibilities while maintaining React Context integration. This architecture combines the benefits of traditional Layered Architecture with React Context patterns and props-based dependency injection:

```
pages/checkout/
├── contexts/                    # 🗄️ Context Definitions
├── business/                    # 🏢 Pure Domain Logic
├── handlers/                    # ⚙️ Handler Logic (Props-based)
├── actions/                     # 🚀 Dispatch + Callbacks
├── hooks/                       # 🔗 Store Subscriptions
├── views/                       # 🖼️ Pure UI Components
└── CheckoutPage.tsx             # 🎯 Integration Point
```

## 📁 Layer Responsibilities

### 1. `contexts/` - Context Definitions
**Purpose**: Type definitions and context creation only

```typescript
// contexts/CheckoutContext.ts
import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';

export interface CheckoutStores {
  'checkout-data': CheckoutData;
  'validation-state': ValidationState;
}

export interface CheckoutActions extends ActionPayloadMap {
  validate: CheckoutData;
  submit: OrderData;
  reset: void;
}

export interface CheckoutRefs {
  emailInput: HTMLInputElement;
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

export const {
  Provider: CheckoutRefProvider,
  useRefHandler: useCheckoutRef,
} = createRefContext<CheckoutRefs>('CheckoutRefs');
```

**Responsibilities**:
- ✅ Type definitions (Stores, Actions)
- ✅ Context creation
- ❌ Handler registration
- ❌ Business logic
- ❌ UI components

### 2. `business/` - Pure Domain Logic
**Purpose**: Side-effect-free validation, calculations, and state transitions

Keep domain rules in pure functions so they can be tested without React, stores, or external services.

### 3. `handlers/` - Handler Logic (Props-based)
**Purpose**: Isolated handler registration with props-based dependency injection

```typescript
// handlers/useCheckoutHandlers.ts
import { CHECKOUT_HANDLERS } from './handler-registry';

export interface CheckoutHandlerProps {
  moduleId: string;
  customPriority?: number;
  apiClient: ApiClient;
  validator: FormValidator;
}

export function useCheckoutValidateHandler(props: CheckoutHandlerProps) {
  const { moduleId, customPriority, apiClient, validator } = props;
  const checkoutStore = useCheckoutStore('checkout-data');
  const validationStore = useCheckoutStore('validation-state');
  
  useCheckoutHandler(
    CHECKOUT_HANDLERS.VALIDATE.id,
    async (payload: CheckoutData) => {
      const currentData = checkoutStore.getValue();
      const isValid = await validator.validate(payload);
      
      if (isValid) {
        checkoutStore.setValue({ ...currentData, ...payload });
        validationStore.setValue({ isValid: true, errors: [] });
        await apiClient.saveCheckout(payload);
      } else {
        validationStore.setValue({ isValid: false, errors: validator.getErrors() });
      }
    },
    customPriority || CHECKOUT_HANDLERS.VALIDATE.priority
  );
}

export function useCheckoutSubmitHandler(props: CheckoutHandlerProps) {
  // Submit handler logic...
}
```

**Key Features**:
- ✅ Props-based dependency injection
- ✅ Direct `useActionHandler` usage
- ✅ Business logic implementation
- ✅ Store access and updates
- ❌ UI rendering
- ❌ Direct dispatch calls

Group those handler hooks behind one domain registry. The registry is the only place where a page-level feature registers handlers, even when the feature has only one handler.

```tsx
// handlers/CheckoutHandlerRegistry.tsx
export function CheckoutHandlerRegistry({
  children,
  ...props
}: CheckoutHandlerProps & { children: React.ReactNode }) {
  useCheckoutValidateHandler(props);
  useCheckoutSubmitHandler(props);
  return <>{children}</>;
}
```

### 4. `actions/` - Dispatch + Callbacks
**Purpose**: Action dispatching and payload callback creation

```typescript
// actions/useCheckoutActions.ts
import { CHECKOUT_HANDLERS } from '../handlers/handler-registry';

export function useCheckoutActions() {
  const dispatch = useCheckoutDispatch();
  
  return {
    // Callback creation focused on dispatch + payload mapping
    validate: useCallback((data: CheckoutData) => 
      dispatch(CHECKOUT_HANDLERS.VALIDATE.dispatchName, data), [dispatch]),
    
    submit: useCallback((order: OrderData) => 
      dispatch(CHECKOUT_HANDLERS.SUBMIT.dispatchName, order), [dispatch]),
    
    reset: useCallback(() => 
      dispatch(CHECKOUT_HANDLERS.RESET.dispatchName), [dispatch])
  };
}
```

**Responsibilities**:
- ✅ Action dispatching
- ✅ Payload callback creation
- ✅ Dispatch name mapping
- ❌ Handler registration
- ❌ Business logic
- ❌ Store subscriptions

### 5. `hooks/` - Store Subscriptions
**Purpose**: Reactive store value subscriptions for views

```typescript
// hooks/useCheckoutData.ts
export function useCheckoutData() {
  const checkoutStore = useCheckoutStore('checkout-data');
  const validationStore = useCheckoutStore('validation-state');
  
  return {
    // Focus only on store subscriptions
    checkout: useStoreValue(checkoutStore),
    validation: useStoreValue(validationStore),
    
    // Computed values for UI
    isFormValid: useStoreValue(validationStore, state => state.isValid),
    errorCount: useStoreValue(validationStore, state => state.errors.length)
  };
}
```

**Responsibilities**:
- ✅ Store value subscriptions
- ✅ Computed values for UI
- ✅ Data transformation for views
- ❌ Handler registration
- ❌ Action dispatching
- ❌ Business logic

### 6. `views/` - Pure UI Components
**Purpose**: Pure UI rendering without business logic

```typescript
// views/CheckoutView.tsx
export function CheckoutView() {
  const { checkout, validation, isFormValid } = useCheckoutData();
  const { validate, submit, reset } = useCheckoutActions();
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (isFormValid) {
        submit(checkout);
      }
    }}>
      <input 
        value={checkout.email}
        onChange={(e) => validate({ ...checkout, email: e.target.value })}
      />
      {!validation.isValid && (
        <ErrorList errors={validation.errors} />
      )}
      <button type="submit" disabled={!isFormValid}>
        Submit Order
      </button>
      <button type="button" onClick={reset}>
        Reset
      </button>
    </form>
  );
}
```

**Responsibilities**:
- ✅ UI rendering
- ✅ Event handling
- ✅ User interactions
- ❌ Business logic
- ❌ Direct store manipulation
- ❌ Handler registration

### 7. `MainPage.tsx` - Integration Point
**Purpose**: Provider composition and registry mounting

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
            customPriority={150}
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

**Responsibilities**:
- ✅ Handler Registry mounting with props
- ✅ Context provider setup
- ✅ Component composition
- ✅ Props dependency injection
- ❌ Direct business logic
- ❌ UI implementation details

## 🎯 Key Benefits

### Clear Separation of Concerns
Each layer has a single, well-defined responsibility that doesn't overlap with others.

### Props-based Dependency Injection
Handlers receive all dependencies through props, making them testable and flexible.

### React Context Integration
Handler registration happens within React Context boundaries, ensuring proper lifecycle management.

### Scalable Architecture
Easy to add new features by following the established pattern in each layer.

### Type Safety
Full TypeScript support with clear interfaces between layers.

## 📋 Best Practices

### Do's ✅
- Keep each layer focused on its single responsibility
- Use props for dependency injection in handlers
- Register handlers in the domain Handler Registry
- Use Action Provider → Store Provider → Ref Provider (when used) → Handler Registry → View nesting
- Maintain clear naming conventions across layers
- Use TypeScript interfaces for all layer boundaries

### Don'ts ❌
- Don't register handlers directly in page, view, or context components
- Don't mix business logic with UI components
- Don't access stores directly in action hooks
- Don't put handler logic in action or hook layers
- Don't bypass the props-based dependency pattern

This structure ensures maintainable, testable, and scalable Context-Action applications with clear architectural boundaries.
