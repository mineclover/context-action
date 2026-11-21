# Context-Action Architecture & Core Philosophy

## 1. Core Philosophy & Principles

### Why Context-Action Exists

Application state grows hard to maintain when three concerns collapse together:

- **UI Lifecycle Coupling**: Business workflows and async pipelines get trapped inside React components, effects, and hook trees, making them impossible to test or reuse outside a mounted screen.
- **Binary State Trap**: Codebases bounce between an overgrown global singleton store and fragmented local `useState`, leaving domain boundaries implicit.
- **Ad-Hoc Async Pipelines**: Validation guards, priority ordering, `AbortSignal` cancellation, multi-store coordination, and teardown end up re-implemented inside ad-hoc event handlers.

Context-Action resolves these with **five core principles**:

1. **Action–Store & Read/Write Separation**: Views express *intent* by dispatching typed **Actions** (`ActionRegister`), handlers mutate **Stores** (`Store` / `StateStore`), and Views read state through selective store subscriptions—never invoking business rules directly or reading mutated closure snapshots.
2. **Headless-First / Context as DI Boundary**: Assemble framework-neutral `ActionRegister` pipelines and standalone `Store` / `StoreManager` / `StateStore` instances in plain TypeScript modules first, free of React lifecycle dependencies. Treat React Context Providers (`<ActionProvider register={...} />` and `<StoreProvider stores={...} />` or `manager={...}`) strictly as thin dependency-injection boundaries (`ownership="shared"` by default; `ownership="owned"` when transferring teardown).
3. **Domain Boundaries & 3-Tier State**: Scope state and action pipelines per domain context rather than one monolithic store, separating **Tier 1 External/Persistent Contracts**, **Tier 2 Domain Orchestration State**, and **Tier 3 UI Presentation State** (modals, hover, 120fps `RefContext` animations).
4. **Role-Explicit Pipelines**: Split execution stages across dedicated contracts—Guard (`registerGuard` / `useActionGuard`), Command (`registerCommand` / `useActionCommandHandler`), Result (`registerResult` / `useActionResultHandler`), and Observer (`useActionObserver`)—with explicit priorities and `AbortSignal` propagation.
5. **Progressive Adoption + Contract-First Consistency**: Start with a minimal scoped Store or Action Context (`Level 1`), step up to headless DI + role hooks (`Level 2`), and scale into the 6-layer Context-Layered architecture, multi-store `StoreTransactionCoordinator`, `@context-action/tool-protocol`, `@context-action/xstate`, or Lit/Preact adapters (`Level 3`) with machine-checked surface parity (`CA-SURFACE-CATALOG-001`).

### Core Architecture Flow

```text
[Pure TS Domain Module: ActionRegister + Store / StateStore]
                         │  (Injected via React DI: ownership="shared" | "owned")
                         ▼
[View] ──dispatch──▶ [<ActionProvider register>] ──▶ [Handlers / Guards] ──▶ [<StoreProvider stores>] ──subscribe──▶ [View]
```

### Headless-First Symmetric DI Example

Assemble domain state and orchestration completely outside React, then inject both symmetrically into React components:

<!-- @context-action-compile -->
```tsx
import type React from 'react';
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStore,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

interface BillingActions extends ActionPayloadMap {
  charge: { invoiceId: string; amount: number };
}

interface BillingStores {
  summary: { lastInvoiceId: string | null; totalCharged: number };
}

// 1. Framework-neutral domain engine (unit-testable with zero React imports)
export const billingRegister = new ActionRegister<BillingActions>({ name: 'HeadlessBilling' });
export const billingSummaryStore = createStore<BillingStores['summary']>('summary', {
  lastInvoiceId: null,
  totalCharged: 0,
});

billingRegister.registerCommand('charge', ({ invoiceId, amount }) => {
  const prev = billingSummaryStore.getValue();
  billingSummaryStore.setValue({
    lastInvoiceId: invoiceId,
    totalCharged: prev.totalCharged + amount,
  });
}, { id: 'domain-charge' });

// 2. Thin React Contexts acting strictly as DI boundaries (ownership defaults to 'shared')
const BillingActionsContext = createActionContext<BillingActions>('BillingActions');
const BillingStoresContext = createStoreContext<BillingStores>('BillingStores', {
  summary: { lastInvoiceId: null, totalCharged: 0 },
});

function BillingPanel() {
  const dispatch = BillingActionsContext.useActionDispatch();
  const summary = useStoreValue(BillingStoresContext.useStore('summary'));

  return (
    <button
      type="button"
      onClick={() => void dispatch('charge', { invoiceId: 'INV-100', amount: 50 })}
    >
      Total: {summary.totalCharged} ({summary.lastInvoiceId ?? 'none'})
    </button>
  );
}

export function BillingFeature(): React.JSX.Element {
  return (
    <BillingActionsContext.Provider register={billingRegister} ownership="shared">
      <BillingStoresContext.Provider stores={{ summary: billingSummaryStore }} ownership="shared">
        <BillingPanel />
      </BillingStoresContext.Provider>
    </BillingActionsContext.Provider>
  );
}
```

### Architecture Implementation Layers

- **Domain Engine (Headless)**: `ActionRegister` (`@context-action/core`) + `Store` / `StoreManager` / `createStateStore` (`@context-action/store-core`)
- **Action Context (ViewModel DI Boundary)**: `createActionContext` (wraps or injects `ActionRegister`)
- **Declarative Store Context (Model DI Boundary)**: `createStoreContext` (wraps or injects `StoreManager` / `stores`)
- **RefContext (Zero Re-render Performance Layer)**: `createRefContext` (direct DOM/Canvas/Three.js references)
- **Selective Subscription**: `useStoreValue`, `useStoreSelector`, `useStorePath`, `useStoreSelectorWithPaths`
- **Presentation (View Layer)**: Pure React/Lit/Preact components forwarding intents and rendering subscribed state

### Context Separation Strategy

#### Domain-Based Context Architecture
- **Business Context**: Business logic, data processing, and domain rules (Actions + Stores)
- **UI Context**: Screen state, user interactions, and component behavior (Stores + RefContext)
- **Performance Context**: High-performance DOM manipulation and animations (RefContext + Selective Subscription)
- **Validation Context**: Data validation, form processing, and error handling (Actions + Stores)
- **Design Context**: Theme management, styling, layout, and visual states (Stores + RefContext)
- **Architecture Context**: System configuration, infrastructure, and technical decisions (Actions + Stores)

#### Document-Based Context Design
Each context is designed to manage its corresponding documentation and deliverables:
- **Design Documentation** → Design Context (themes, component specifications, style guides) → Stores + RefContext
- **Business Requirements** → Business Context (workflows, rules, domain logic) → Actions + Stores
- **Performance Specifications** → Performance Context (animations, interactions) → RefContext
- **Architecture Documents** → Architecture Context (system design, technical decisions) → Actions + Stores
- **Validation Specifications** → Validation Context (rules, schemas, error handling) → Actions + Stores
- **UI Specifications** → UI Context (interactions, state management, user flows) → All three patterns

### Advanced Handler & Trigger Management

Context-Action provides sophisticated handler and trigger management that existing libraries lack:

#### Priority-Based Handler Execution
- **Sequential Processing**: Handlers execute in priority order with proper async handling
- **Domain Isolation**: Each context maintains its own handler registry
- **Cross-Context Coordination**: Controlled communication between domain contexts
- **Result Collection**: Aggregate results from multiple handlers for complex workflows

#### Intelligent Trigger System
- **State-Change Triggers**: Automatic triggers based on store value changes
- **Cross-Context Triggers**: Domain boundaries can trigger actions in other contexts
- **Conditional Triggers**: Smart triggers based on business rules and conditions
- **Trigger Cleanup**: Automatic cleanup prevents memory leaks and stale references

### Key Benefits

1. **Document-Artifact Management**: Direct relationship between documentation and implementation
2. **Domain Isolation**: Each context maintains complete independence
3. **Type Safety**: Full TypeScript support with domain-specific hooks
4. **Performance**: Zero React re-renders with RefContext, selective subscriptions for optimization, hardware-accelerated animations
5. **Scalability**: Easy to add new domains without affecting existing ones
6. **Team Collaboration**: Different teams can work on different domains without conflicts
7. **Clear Boundaries**: Perfect separation of concerns based on document domains
8. **Hardware Acceleration**: Direct DOM manipulation with `translate3d()` for 60fps performance

## Implementation Documentation

**Note**: Detailed implementation patterns and examples have been moved to the [Patterns section](../guide/patterns/setup/index.md) for better organization.

### Core Patterns
- **[🎯 Action Only Pattern](../guide/patterns/action/basic-usage.md)** - Pure action dispatching without state management
- **[🏪 Store Only Pattern](../guide/patterns/store/basic-usage.md)** - Type-safe state management without actions
- **[🔧 Ref Context Pattern](../guide/patterns/ref/basic-usage.md)** - Direct DOM manipulation with zero re-renders

### Architecture Patterns
- **[Pattern Composition](../examples/pattern-composition.md)** - Combining patterns for complex applications
- **[Domain Context Architecture](../context-layered/context-layered-guide.md)** - Document-centric context separation
- **[MVVM Architecture](./architecture-guide.md)** - Complete Model-View-ViewModel implementation

### Implementation Guides
- **[Real-time State Access](../guide/patterns/async/real-time-state-access.md)** - Avoiding closure traps in handlers
- **[Provider Composition Setup](../guide/patterns/setup/provider-composition-setup.md)** - Advanced provider composition patterns

## RefContext Performance Architecture

### Zero Re-render Philosophy

The RefContext pattern introduces a **performance-first layer** that bypasses React's rendering cycle entirely for DOM manipulation:

```
[User Interaction] → [Direct DOM Manipulation] → [Hardware Acceleration] → [60fps Updates]
                               ↓
                         [No React Re-renders]
```

#### Core Performance Principles

1. **Direct DOM Access**: Manipulate DOM elements directly without triggering React reconciliation
2. **Hardware Acceleration**: Use `transform3d()` for GPU-accelerated animations
3. **Separation of Concerns**: Visual updates separated from business logic updates
4. **Memory Efficiency**: Automatic cleanup and lifecycle management
5. **Type Safety**: Full TypeScript support for DOM element types

#### Performance Characteristics

RefContext is specifically designed for **high-performance scenarios** requiring direct DOM control:

| Approach | Use Case | React Re-renders | DOM Access |
|----------|----------|------------------|------------|
| **useState** | Standard UI interactions | Triggers reconciliation | React-managed |
| **useRef** | Basic DOM manipulation | Manual control required | Direct reference |
| **RefContext** | **High-performance graphics, animations** | Zero re-renders | Direct manipulation |

**RefContext advantages:**
- **Zero React Re-renders**: Direct DOM manipulation without reconciliation
- **Hardware Acceleration**: Enables GPU-optimized animations

**Primary targets for RefContext:**
- ✅ Canvas animations and Three.js graphics
- ✅ WebGL rendering and game engines
- ✅ High-frequency DOM updates

**Note**: For data management, use **Store contexts** instead of useState for better scalability and type safety.

## Selective Subscription Performance Architecture

### Pre-Memoization Optimization Strategy

The **Selective Subscription Pattern** represents a fundamental shift in performance optimization philosophy - optimizing **before** memoization becomes necessary by strategically eliminating unnecessary reactive subscriptions:

```
Traditional: [Store Subscribe] → [React Re-render] → [Memoization] → [Optimization]
Selective:   [Store getValue()] → [Direct DOM Update] → [Zero Re-renders] → [Maximum Performance]
```

#### Performance Architecture Layers

1. **Reactive Layer**: Traditional useStoreValue() subscriptions for business logic
2. **Non-Reactive Layer**: store.getValue() for high-frequency visual updates  
3. **Hybrid Layer**: Strategic combination based on use case requirements

```typescript
// Performance-optimized architecture
function HighPerformanceComponent() {
  // Reactive for business logic (low frequency)
  const userSettings = useStoreValue(settingsStore);
  
  // Non-reactive for visual updates (high frequency) 
  const visualData = useStoreDataAccess();
  
  // RefContext for direct DOM manipulation
  const canvasRef = useCanvasRef('main');
  
  const handleHighFrequencyUpdate = useCallback(() => {
    // Direct DOM update - no React re-renders
    if (canvasRef.isMounted) {
      canvasRef.target.style.transform = 'translate3d(...)';
    }
    
    // Store update for data persistence only
    visualData.updatePosition(newPosition);
  }, [canvasRef, visualData]);
  
  return <canvas ref={canvasRef.setRef} />;
}
```

#### Subscription Decision Matrix

| Update Frequency | Data Type | Pattern Choice | Performance Impact |
|------------------|-----------|----------------|------------------|
| **>30fps** | Visual updates | Non-reactive + RefContext | Zero re-renders |
| **1-10fps** | Business logic | Reactive | Standard React |
| **Manual** | Debug/Admin | Manual refresh | On-demand only |
| **Mixed** | Hybrid apps | Selective combination | Optimized per use case |

#### Architecture Benefits

1. **Zero React Re-renders**: Visual updates bypass React entirely
2. **Hardware Acceleration**: GPU-accelerated animations via direct DOM
3. **Memory Efficiency**: No subscription overhead for high-frequency updates
4. **Debugging Support**: Manual refresh patterns for development tools
5. **Progressive Enhancement**: Start reactive, optimize selectively where needed

For detailed implementation patterns, see [Selective Subscription Patterns](../guide/patterns/store/subscription-optimization.md).

## Best Practices Summary

### Architecture Design
1. **One domain = One context boundary**
2. **Separate business and UI concerns**
3. **Use document-driven context separation**
4. **Prefer domain isolation, use cross-domain communication when necessary**

### Pattern Selection
5. **Start with Store Only** for simple state management
6. **Add Action Only** when you need side effects or complex workflows
7. **Add RefContext** when you need high-performance DOM manipulation
8. **Apply Selective Subscription** for performance-critical applications
9. **Compose all patterns** for full-featured applications

### Implementation
9. **Always use domain-specific hooks** for type safety and clarity
10. **Use lazy evaluation** in handlers to avoid stale state
11. **Follow provider composition** patterns for proper nesting
12. **Document domain boundaries** clearly for team collaboration

### Code Quality & Module Organization
13. **Prefer named imports over namespace imports** for better tree shaking and bundle optimization
14. **Use utility functions instead of static-only classes** to improve tree shaking and avoid linting issues
15. **Organize imports systematically**: React/external → framework → relative → types
16. **Follow functional programming patterns** for utility functions and error factories

### Code Examples

#### ✅ Recommended Import Patterns
```tsx
// Named imports for better tree shaking
import { validateFormData, FormData, ValidationState } from '../business/businessLogic';
import { createValidationError, createRefError } from '../utils/errorFactory';

// Clear import organization
import React, { useState, useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useRefRegistry } from '../contexts/RefContexts';
import type { ValidationResult } from '../types/validation';
```

#### ✅ Recommended Utility Functions
```tsx
// Utility functions instead of static-only classes
export function createValidationError(message: string, context?: Record<string, any>): HandlerError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    timestamp: Date.now(),
    context,
    recoverable: true
  };
}

// Usage: Direct function calls
import { createValidationError } from './errorUtils';
throw createValidationError('Invalid input', { field: 'email' });
```

#### ❌ Patterns to Avoid
```tsx
// Namespace imports prevent tree shaking
import * as BusinessLogic from '../business/businessLogic';
import * as ErrorFactory from '../utils/errorFactory';

// Static-only classes trigger linting warnings
export class ErrorFactory {
  static createValidationError(message: string): HandlerError {
    // Implementation...
  }
}
```

## Getting Started

For detailed implementation examples and step-by-step guides, see:

- **[Pattern Guide Index](../guide/patterns/setup/index.md)** - Complete pattern documentation
- **[Action Only Pattern](../guide/patterns/action/basic-usage.md)** - Start with pure actions
- **[Store Only Pattern](../guide/patterns/store/basic-usage.md)** - Recommended starting point
- **[Selective Subscription Patterns](../guide/patterns/store/subscription-optimization.md)** - Pre-memoization performance optimization
- **[Pattern Composition](../examples/pattern-composition.md)** - Combining patterns
- **[Coding Conventions](./conventions.md)** - Complete coding conventions and best practices including import patterns

For more information and updates, visit the project repository.