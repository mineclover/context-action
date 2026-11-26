# Context-Action React Examples

This directory contains comprehensive examples and demonstrations for the Context-Action React package.

## 📁 Directory Structure

```
examples/
├── actions/                  # Action pipeline & dual-lane view examples
│   └── view-fast-lane-example.tsx
├── hooks/                    # Hook examples by category
│   ├── aria-headless-hooks-example.tsx
│   ├── essential/           # Must-learn hooks
│   │   ├── useStoreValue-example.tsx
│   │   └── useLocalStore-example.tsx
│   ├── utility/            # Performance and convenience hooks
│   │   └── useStoreSelector-example.tsx
│   └── index.tsx           # Interactive hook explorer
├── refs/                     # Imperative & custom ref examples
│   ├── SimpleFormExample.tsx
│   ├── GameUIExample.tsx
│   ├── createRefContext-examples.tsx
│   ├── three-mock-types.ts
│   └── three-types.d.ts
└── stores/
    └── patterns/           # Store pattern examples
        ├── declarative-examples.tsx
        ├── external-sync-patterns-example.tsx
        ├── leaf-subscription-signal-example.tsx
        └── unified-pattern-example.tsx
```

## 🎯 Hook Examples

### Essential Hooks (Must Learn)
- **`useStoreValue`** (`@context-action/react`): Subscribe to store values with reactive updates
- **`useLocalStore`** (`@context-action/react/advanced`): Create component-local stores (`{ value, store }`)

### Utility & Path Hooks
- **`useStoreSelector`** (`@context-action/react`): Performance optimization through selective subscriptions
- **`useStorePath`** (`@context-action/react`): Typed `StorePathOf<T>` path subscriptions with derived `{ select }` option
- **`useRefRegistry`** (`@context-action/react/refs` & `./advanced`): Zero-rerender component-local typed ref registry
- **`compareValues`** (`@context-action/react/utils`): Shallow and deep value comparison helpers

### Pattern Factories (`@context-action/react`)
- **`createScopedContext`**: Single flat `Provider` uniting `ActionContext`, runtime setup, and shallow-stabilized `useScope()`
- **`createStoreContext`**: Type-safe store pattern factory
- **`createActionContext`**: Action context factory for business logic
- **`createRefContext`**: Type-safe DOM and imperative object reference factory

## 🚀 Getting Started

### Type-check & Run Examples

```bash
# Type-check all React package examples
pnpm --filter @context-action/react exec tsc --noEmit -p tsconfig.examples.json

# Run React package unit tests
pnpm --filter @context-action/react test
```

### Public Package Imports

All example files import from the public entrypoints rather than internal `src/*` paths:

```tsx
import {
  createActionContext,
  createScopedContext,
  createStoreContext,
  useStoreValue,
  useStoreSelector,
  useStorePath,
} from '@context-action/react';
import { createRefContext, useRefRegistry } from '@context-action/react/refs';
import { useLocalStore, useComputedStore } from '@context-action/react/advanced';
import { compareValues } from '@context-action/react/utils';
```

## 📚 Learning Path

### 1. Start with Essential Hooks
Begin with the hooks you'll use most frequently:
- `useStoreValue` - Core reactive subscriptions
- `useLocalStore` - Component-local complex state

### 2. Add Performance Optimization
When you need better performance:
- `useStoreSelector` - Selective subscriptions

### 3. Use Pattern Hooks
For larger applications:
- `createStoreContext` - Type-safe store management
- `createActionContext` - Business logic separation

### 4. Add Specialized Features
As needed:
- `useComputedStore` (`@context-action/react/advanced`) - Derived state from stores
- `useStorePath` (`@context-action/react`) - JSON-patch path subscriptions
- `createRefContext` (`@context-action/react/refs`) - Imperative DOM/Canvas/WebGL refs (`useRefController` for zero mount re-renders)
- Dual-lane View + Transaction separation (`actions/view-fast-lane-example.tsx`): `lane: 'fast'` view actions paired with `useRefController` + `lane: 'orchestrated'` commits paired with scoped `bindActionTransactions` (`@context-action/react/transactions`)
- Leaf-subscription pseudo-signal & `useEffect` isolation (`stores/patterns/leaf-subscription-signal-example.tsx`): Top-level `useActionDispatch()` shell + `store.update()` + Leaf `useStorePath()` preserving standard React `useEffect` lifecycles only in affected leafs
- External system sync patterns (`stores/patterns/external-sync-patterns-example.tsx`): IndexedDB write-through rollback, bidirectional URL `popstate`/`pushState` sync, and realtime RAF-batched stream + sequence guard
- React Aria-style headless UI hooks (`hooks/aria-headless-hooks-example.tsx`): `useAriaButton`, `createAriaTabs`, `createAriaSlider`, `createAriaDialog`, `createAriaComboBox`, `createAriaDataGrid`, and `createAriaMenu` combining `createScopedContext`, Path-Trie `useStorePath` (`{ select }`), `useRefRegistry`, `useRefCollection`, `mergeProps`, and `./advanced` (`useStoreInstance`, `useControlledStoreSync` + `onSync`, `useDismissLayer`, `useRovingFocus` + typeahead/`getActiveDescendant`, `usePointerGesture`, backed by `@context-action/interactions` and `@context-action/core/element`)

## 🔍 Example Features

### Interactive Examples
- **Live Code**: All examples are fully interactive
- **Performance Tracking**: See render counts and computation counts
- **State Management**: Manipulate stores to see reactive updates
- **Type Safety**: Full TypeScript support with type inference

### Educational Features
- **Step-by-step explanations**: Each example builds complexity gradually
- **Best Practices**: Demonstrates recommended patterns and anti-patterns
- **Performance Comparisons**: Shows optimized vs unoptimized approaches
- **Real-world Scenarios**: Shopping carts, forms, user profiles, etc.

## 📖 Documentation References

- **[Store Selection & Usage Guide](../../docs/en/context-layered/store-selection-and-usage-guide.md)**: Choosing stores and React subscription hooks
- **[Context-Layered Architecture Guide](../../docs/en/context-layered/context-layered-guide.md)**: Architectural patterns
- **[Repository Surface Catalog](../../docs/en/context-layered/repository-surface-catalog.md)**: Package exports and example inventory

## 🧪 Testing

All hooks have corresponding test files in the `__tests__` directory:

```
__tests__/
├── stores/
│   └── hooks/
│       ├── useStoreValue.test.tsx
│       ├── useLocalStore.test.tsx
│       └── useStoreSelector.test.tsx
```

Run tests with:
```bash
pnpm test
```

## 🎨 Styling

Examples use inline styles for simplicity and portability. In real applications, you'd typically use:
- CSS Modules
- Styled Components
- Tailwind CSS
- Your preferred styling solution

## 💡 Tips for Learning

1. **Start Simple**: Begin with basic `useStoreValue` examples
2. **Experiment**: Modify the examples to see how they behave
3. **Check Performance**: Use the render counters to understand optimization
4. **Read Comments**: Examples include detailed explanations
5. **Compare Approaches**: See multiple ways to solve the same problem

## 🤝 Contributing

When adding new examples:

1. **Follow the Pattern**: Use the same structure as existing examples
2. **Include Performance Tracking**: Add render/compute counters where relevant
3. **Document Features**: List key features and use cases
4. **Add Tests**: Create corresponding test files
5. **Update Index**: Add new examples to the navigation

## 📝 Example Template

```tsx
/**
 * useNewHook Hook Examples
 * 
 * Demonstrates [hook purpose and main features]
 */

import React from 'react';
// ... imports

// Example 1: Basic functionality
function BasicExample() {
  // Hook usage
  // Interactive controls
  // Display results
}

// Example 2: Advanced features
function AdvancedExample() {
  // More complex usage
  // Performance tracking
  // Edge cases
}

// Main component
export function UseNewHookExamples() {
  return (
    <div>
      <h1>useNewHook Hook Examples</h1>
      <p>Description and purpose</p>
      
      <BasicExample />
      <AdvancedExample />
      
      <div className="example-section">
        <h3>Key Features</h3>
        <ul>
          <li>✅ Feature 1</li>
          <li>✅ Feature 2</li>
        </ul>
      </div>
      
      <div className="example-section">
        <h3>When to Use</h3>
        <ul>
          <li>🎯 Use case 1</li>
          <li>🎯 Use case 2</li>
        </ul>
      </div>
    </div>
  );
}
```