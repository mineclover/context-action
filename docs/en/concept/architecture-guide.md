# Context-Action Store Integration Architecture

## 1. Overview & Core Concepts

### What is Context-Action Architecture?

The Context-Action framework is a **revolutionary state management system** designed to overcome the fundamental limitations of existing libraries through document-centric context separation and effective artifact management.

#### Project Philosophy

The Context-Action framework addresses critical issues in modern state management:

**Problems with Existing Libraries:**
- **High React Coupling**: Tight integration makes component modularization and props handling difficult
- **Binary State Approach**: Simple global/local state dichotomy fails to handle specific scope-based separation  
- **Inadequate Handler/Trigger Management**: Poor support for complex interactions and business logic processing

**Context-Action's Solution:**
- **Document-Artifact Centered Design**: Context separation based on document themes and deliverable management
- **Perfect Separation of Concerns**: 
  - View design in isolation → Design Context
  - Development architecture in isolation → Architecture Context
  - Business logic in isolation → Business Context  
  - Data validation in isolation → Validation Context
- **Clear Boundaries**: Implementation results maintain distinct, well-defined domain boundaries
- **Effective Document-Artifact Management**: State management library that actively supports the relationship between documentation and deliverables

### Architecture Implementation

The framework implements a clean separation of concerns through an MVVM-inspired pattern with **four core architectural strategies** for complete domain isolation:

- **Actions** handle business logic and coordination (ViewModel layer) via `createActionContext`
- **Declarative Store Pattern** manages state with domain isolation (Model layer) via `createStoreContext`
- **RefContext** provides direct DOM manipulation with zero re-renders (Performance layer) via `createRefContext`
- **Selective Subscription** optimizes performance through strategic subscription management (Optimization layer)
- **Components** render UI (View layer)
- **Context Boundaries** isolate functional domains
- **Type-Safe Integration** through domain-specific hooks

### Core Architecture Flow

```
[Component] → dispatch → [Action Pipeline] → handlers → [Store] → subscribe → [Component]
```

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

**Note**: Detailed implementation patterns and examples have been moved to the [Patterns section](../guide/patterns/index.md) for better organization.

### Core Patterns
- **[🎯 Action Only Pattern](../guide/patterns/action/basic-usage.md)** - Pure action dispatching without state management
- **[🏪 Store Only Pattern](../guide/patterns/store/basic-usage.md)** - Type-safe state management without actions
- **[🔧 Ref Context Pattern](../guide/patterns/ref/basic-usage.md)** - Direct DOM manipulation with zero re-renders

### Architecture Patterns
- **[Pattern Composition](../guide/patterns/architecture/composition.md)** - Combining patterns for complex applications
- **[Domain Context Architecture](../guide/patterns/architecture/domain-context.md)** - Document-centric context separation
- **[MVVM Architecture](../guide/patterns/architecture/mvvm.md)** - Complete Model-View-ViewModel implementation

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

For detailed implementation patterns, see [Selective Subscription Patterns](./selective-subscription-patterns.md).

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

- **[Pattern Guide Index](../guide/patterns/index.md)** - Complete pattern documentation
- **[Action Only Pattern](../guide/patterns/action/basic-usage.md)** - Start with pure actions
- **[Store Only Pattern](../guide/patterns/store/basic-usage.md)** - Recommended starting point
- **[Selective Subscription Patterns](./selective-subscription-patterns.md)** - Pre-memoization performance optimization
- **[Pattern Composition](../guide/patterns/architecture/composition.md)** - Combining patterns
- **[Coding Conventions](./conventions.md)** - Complete coding conventions and best practices including import patterns

For more information and updates, visit the project repository.