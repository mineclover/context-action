# Context-Layered Architecture Guide

A comprehensive architecture pattern for Context-Action framework applications, combining traditional layered architecture principles with React Context patterns and props-based dependency injection.

## 🎯 Architecture Overview

**Context-Layered Architecture** is a specialized architectural pattern designed for React applications using the Context-Action framework. It provides clear separation of concerns while leveraging React Context for state management and dependency injection.

### Core Principles

1. **Layer Separation**: Clear boundaries between different concerns
2. **Context Integration**: Built around React Context lifecycle  
3. **Props-based DI**: Dependency injection through component props
4. **Handler Isolation**: Business logic isolated in dedicated handlers
5. **Type Safety**: Full TypeScript support across all layers

## 🏗️ Architecture Layers

### 6-Layer Structure

```
├── contexts/     # 🗄️ Context Definitions
├── business/     # 🏢 Pure Domain Logic
├── handlers/     # ⚙️ Handler Logic (Props-based)  
├── actions/      # 🚀 Dispatch + Callbacks
├── hooks/        # 🔗 Store Subscriptions
├── views/        # 🖼️ Pure UI Components  
└── MainPage.tsx  # 🎯 Integration Point
```

### Layer Responsibilities

| Layer | Purpose | Key Features |
|-------|---------|--------------|
| **Contexts** | Type definitions & context creation | ActionPayloadMap, Store interfaces, Context providers |
| **Business** | Pure domain rules and state transitions | Validation, calculation, event definitions |
| **Handlers** | Business logic with props-based DI | Handler Registry registration, dependency injection |
| **Actions** | Action dispatching & callbacks | `dispatch` calls, payload mapping, callback creation |
| **Hooks** | Store value subscriptions | `useStoreValue`, computed values, data transformation |
| **Views** | Pure UI components | Event handling, rendering, user interactions |
| **MainPage** | Registry mounting & composition | Props injection, context setup, component orchestration |

## Usecase and Recipe Profile

The six layers above describe the internal Context-Layered Runtime. When that runtime is connected to a design-system-based product UI, add the **Usecase Boundary → Facade → Recipe** profile:

```text
Product Scope → Recipe → Facade → Context-Layered Runtime → Business
                    └──── Astryx primitives
```

- **Usecase Boundary** owns one feature's state and execution contract.
- **Facade** exposes stable commands and a view model while hiding raw dispatch and store managers.
- **Recipe** composes Astryx primitives and maps the view model to controlled props.
- **Primitive** components own visual states, accessibility, and intrinsic interaction.

Read the complete convention in [Usecase and Recipe Profile](./usecase-recipe-profile.md).

## 🔄 Data Flow

### 1. User Interaction → Action
```typescript
// views/CheckoutView.tsx
const { validate } = useCheckoutActions();
<button onClick={() => validate(formData)}>Validate</button>
```

### 2. Action → Handler (via Context)
```typescript
// actions/useCheckoutActions.ts  
validate: (data) => dispatch('validate', data)
```

### 3. Handler → Store Update
```typescript
// handlers/useCheckoutHandlers.ts (mounted by CheckoutHandlerRegistry)
useActionHandler('validate', async (data) => {
  const result = await apiClient.validate(data);
  checkoutStore.setValue(result);
});
```

### 4. Store → View Update (Reactive)
```typescript
// hooks/useCheckoutData.ts
const checkout = useStoreValue(checkoutStore);
```

## 🎯 Key Benefits

### Clear Separation of Concerns
Each layer has a single, well-defined responsibility:
- **Contexts**: Data structure definition
- **Business**: Pure domain rules and state transitions
- **Handlers**: Business logic execution  
- **Actions**: User action coordination
- **Hooks**: Data access abstraction
- **Views**: UI presentation
- **MainPage**: System composition

### Props-based Dependency Injection
```typescript
// Flexible, testable dependency injection
useCheckoutValidateHandler({ 
  moduleId: 'main',
  apiClient,
  validator,
  customPriority: 150
});
```

### React Context Integration
- Handler registration within Context boundaries
- React-mounted UI/screen handlers register through the domain Handler Registry, including one-handler UI features (domain pipelines independent of React lifecycle can be registered headless outside React and injected via `ActionRegister` DI)
- Automatic lifecycle management
- Type-safe context usage

### Scalable Architecture
- Easy to add new features following established patterns
- Clear guidelines for each layer
- Maintainable codebase structure

## 📚 Documentation Structure

```
docs/en/context-layered/
├── context-layered-guide.md       # This overview and reading path
├── convention-index.md             # Convention catalogue and ownership links
├── implementation-convention.md    # Runtime implementation rules
├── change-management-convention.md # Issue/spec/test/document lifecycle
├── interaction-intent-contract.md  # Upstream UX intent contract
├── interaction-intent-implementation-flow.md # IIC to six-layer mapping
├── package-boundary-convention.md  # Package ownership and dependency direction
├── architecture/
│   ├── folder-structure.md         # Six-layer structure
│   ├── handler-registry.md         # Handler registration and priority
│   └── durable-operation-operations.md # Deployment and recovery runbook
├── patterns/                       # Explicit state-machine patterns
├── usecase-*.md                    # Usecase and recipe conventions
├── stability-test-cycle.md         # Verification strategy
└── next-work.md                    # Single backlog and documentation ownership
```

The folders above are the maintained documentation surfaces. Package READMEs are
discovery pages, TypeDoc pages are generated API references, and `llmsData/` is
derived output; none of them is a second architecture specification. Use the
[Convention Index](./convention-index.md) when a topic could belong to more than
one page.

## 🚀 Getting Started

### Before you start: record interaction intent when the UX changes

Before removing a button or explanation, adding automatic behavior, or changing
how a user discovers and recovers from a state, write an [Interaction Intent
Contract (IIC)](./interaction-intent-contract.md) and follow the
[IIC-to-implementation flow](./interaction-intent-implementation-flow.md).

### 1. Set up the folder structure
Follow the [folder structure guide](./architecture/folder-structure.md) to organize your project.

### 2. Define contexts
Create your action and store contexts with proper TypeScript interfaces.

### 3. Implement handlers
Build business logic using props-based dependency injection patterns.

### 4. Connect actions and hooks  
Set up action dispatching and store subscriptions.

### 5. Build views
Create pure UI components that use actions and hooks.

### 6. Compose in main page
Mount the Handler Registry with props and compose `Action Provider → Store Provider → Ref Provider (when used) → Handler Registry → View`.

For product-facing features, the recommended composition is `Provider → Handler Registry → Facade → Recipe → Primitive`.

## 🔗 Related Documentation

- [Folder Structure Guide](./architecture/folder-structure.md) - Detailed 6-layer structure
- [Handler Registry](./architecture/handler-registry.md) - ID and priority management
- [Usecase and Recipe Profile](./usecase-recipe-profile.md) - Facade, Recipe, and design-system boundaries
- [Interaction Intent Contract (IIC)](./interaction-intent-contract.md) - Upstream UX intent and implicit agreements
- [IIC to Implementation Flow](./interaction-intent-implementation-flow.md) - Map intent to Context-Action layers and evidence
- [Migration Guide](./migration-guide.md) - Migrate from traditional MVVM to Context-Layered
- [Next Work and Documentation Ownership](./next-work.md) - single backlog and source-of-truth map

## 📈 Progressive Adoption: Lite vs. Standard vs. Full 6-Layer

Not every feature needs all 6 folders on day one. Choose the level that matches the domain's real surface area:

| Level | Folder Shape | When to Choose |
| --- | --- | --- |
| **Level 1 · Lite** | 1–2 files (`contexts.ts` + feature component/hooks) | Self-contained form, local filter panel, or small CRUD widget |
| **Level 2 · Standard** | `contexts/`, pure `business/`, optional headless `ActionRegister` + `Store` / `StoreManager` (`<ActionProvider register={...}>` + `<StoreProvider stores={...}>`), role hooks (`useActionGuard` / `useActionCommandHandler` / `useActionObserver`) | Non-trivial async orchestration, unit-testing domain pipelines without React, 120fps `RefContext` views |
| **Level 3 · Full 6-Layer** | `contexts / business / handlers / actions / hooks / views` (+ `Facade → Recipe → Primitive` when bound to Astryx) | Multi-team domains, complex multi-step workflows, approval/escalation playbooks, strict architectural parity |

## 🧭 Handler & Store Ownership: React Handler Registry vs. Headless-First DI

Depending on whether orchestration belongs to a UI mount lifecycle or outlives React components, choose or compose the ownership model cleanly:

| Ownership Model | How It Works | Best Fit |
| --- | --- | --- |
| **React-Mounted Handler Registry** (`<DomainHandlerRegistry />` using `useActionHandler`) | Handlers and React-owned stores subscribe and clean up within the Provider's React insertion-effect lifetime (including React 19 `<Activity>` hide/reveal and props-based DI) | Screen-scoped orchestration needing React context DI, props-injected UI callbacks, or per-route lifecycle isolation |
| **Headless-First DI** (`<DomainActionProvider register={...} />` + `<DomainStoreProvider stores={...} \| manager={...} />`) | Pure TypeScript modules instantiate `ActionRegister` + `createStore` / `StoreManager` (or `createStateStore`) outside React; Providers inject live references (`ownership="shared"` by default) | Portable domain logic shared across non-React hosts/workers/Lit/Preact, zero-React pipeline unit tests, orchestration and state surviving view unmounts |

Both models compose cleanly—assemble headless domain commands/stores outside React and add UI-scoped guards, observers, or local stores lazily inside React:

<!-- @context-action-compile -->
```tsx
import type React from 'react';
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStore,
  createStoreContext,
} from '@context-action/react';

interface BillingActions extends ActionPayloadMap {
  charge: { invoiceId: string; amount: number };
}

interface BillingStores {
  lastCharge: { invoiceId: string | null; amount: number };
}

export const billingRegister = new ActionRegister<BillingActions>({ name: 'Billing' });
export const lastChargeStore = createStore<BillingStores['lastCharge']>('lastCharge', {
  invoiceId: null,
  amount: 0,
});

billingRegister.registerCommand('charge', async ({ invoiceId, amount }) => {
  await Promise.resolve({ invoiceId, amount });
  lastChargeStore.setValue({ invoiceId, amount });
});

const BillingActionsContext = createActionContext<BillingActions>('BillingActions');
const BillingStoresContext = createStoreContext<BillingStores>('BillingStores', {
  lastCharge: { invoiceId: null, amount: 0 },
});

export function BillingFeature({ children }: { children: React.ReactNode }) {
  return (
    <BillingActionsContext.Provider register={billingRegister} ownership="shared">
      <BillingStoresContext.Provider stores={{ lastCharge: lastChargeStore }} ownership="shared">
        {children}
      </BillingStoresContext.Provider>
    </BillingActionsContext.Provider>
  );
}
```

## 🎯 When to Use Context-Layered Architecture

### ✅ Ideal for:
- Medium to large React applications
- Projects requiring clear separation of concerns
- Applications with complex business logic
- Teams needing consistent architectural patterns
- Projects using Context-Action framework

### ⚠️ Consider alternatives for:
- Simple applications with minimal business logic
- Prototypes or proof-of-concept projects  
- Applications not using React Context extensively

This architecture provides a solid foundation for scalable, maintainable React applications with clear boundaries and excellent developer experience.
