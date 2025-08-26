# Context-Action React Examples

This directory contains comprehensive examples and demonstrations for the Context-Action React package.

## 📁 Directory Structure

```
examples/
├── hooks/                    # Hook examples by category
│   ├── essential/           # Must-learn hooks
│   │   ├── useStoreValue-example.tsx
│   │   └── useLocalStore-example.tsx
│   ├── utility/            # Performance and convenience hooks
│   │   ├── useStoreSelector-example.tsx
│   │   └── useComputedStore-example.tsx
│   ├── patterns/           # Pattern hook examples
│   └── index.tsx           # Interactive hook explorer
└── stores/
    └── patterns/           # Store pattern examples
        ├── declarative-examples.tsx
        └── unified-pattern-example.tsx
```

## 🎯 Hook Examples

### Essential Hooks (Must Learn)
- **`useStoreValue`**: Subscribe to store values with reactive updates
- **`useLocalStore`**: Create component-local stores for complex state

### Utility Hooks (Learn As Needed)
- **`useStoreSelector`**: Performance optimization through selective subscriptions
- **`useComputedStore`**: Derived state computation from store values
- **`usePersistedStore`**: Browser storage synchronization

### Pattern Hooks (For Larger Apps)
- **`createStoreContext`**: Type-safe store pattern factory
- **`createActionContext`**: Action context factory for business logic

## 🚀 Getting Started

### View Examples Locally

```bash
# In the React package directory
cd packages/react

# Install dependencies (if not already done)
pnpm install

# Start the example app (you'll need to set up a dev server)
# Or import the components in your own React app
```

### Using Examples in Your App

```tsx
import { HookExamplesIndex } from './examples/hooks';
import { UseStoreValueExamples } from './examples/hooks/essential/useStoreValue-example';

function App() {
  return (
    <div>
      {/* Interactive hook explorer */}
      <HookExamplesIndex />
      
      {/* Or specific hook examples */}
      <UseStoreValueExamples />
    </div>
  );
}
```

## 📚 Learning Path

### 1. Start with Essential Hooks
Begin with the hooks you'll use most frequently:
- `useStoreValue` - Core reactive subscriptions
- `useLocalStore` - Component-local complex state

### 2. Add Performance Optimization
When you need better performance:
- `useStoreSelector` - Selective subscriptions
- `useComputedStore` - Memoized derived state

### 3. Use Pattern Hooks
For larger applications:
- `createStoreContext` - Type-safe store management
- `createActionContext` - Business logic separation

### 4. Add Specialized Features
As needed:
- `usePersistedStore` - Browser storage
- `useAsyncComputedStore` - Async operations
- `useStoreActions` - Memoized methods

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

- **[HOOKS_REFERENCE.md](../docs/HOOKS_REFERENCE.md)**: Complete hook documentation
- **[PATTERN_GUIDE.md](../docs/PATTERN_GUIDE.md)**: Architectural patterns
- **[TEST_STRUCTURE.md](../docs/TEST_STRUCTURE.md)**: Testing approach

## 🧪 Testing

All hooks have corresponding test files in the `__tests__` directory:

```
__tests__/
├── stores/
│   └── hooks/
│       ├── useStoreValue.test.tsx
│       ├── useLocalStore.test.tsx
│       ├── useStoreSelector.test.tsx
│       ├── useComputedStore.test.tsx
│       └── usePersistedStore.test.tsx
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