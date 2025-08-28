# Mouse Events Architecture Comparison

This directory demonstrates three different architectural patterns for handling mouse events in React applications, each with distinct approaches to state management, separation of concerns, and component organization.

## 🏗️ Clean Architecture (`clean-architecture/`)

**Philosophy**: Pure dependency injection with complete separation of concerns

**Structure**:
```
clean-architecture/
├── containers/          # UI containers that coordinate between layers
│   └── MouseEventsContainer.tsx
├── components/          # Pure view components with no business logic
│   ├── CleanMouseEventsView.tsx
│   ├── MouseEventsView.tsx
│   └── OptimizedMouseEventsView.tsx
├── controllers/         # Business logic coordination
│   └── MouseController.ts
├── hooks/              # Custom React hooks for logic encapsulation
│   └── useMouseEventsLogic.ts
├── services/           # Pure business logic services
│   ├── MousePathService.ts
│   └── MouseRenderService.ts
└── types/              # TypeScript definitions
```

**Key Features**:
- ✅ **Testability**: Each layer is independently testable
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Dependency Inversion**: Controllers depend on abstractions
- ✅ **No Framework Dependencies**: Business logic is framework-agnostic

## ⚛️ Reactive Stores (`reactive-stores/`)

**Philosophy**: Reactive state management with observable stores

**Structure**:
```
reactive-stores/
├── containers/          # Store-connected containers
│   └── StoreBasedMouseEventsContainer.tsx
├── components/          # Store-aware view components
│   └── StoreBasedMouseEventsView.tsx
├── controllers/         # Store management controllers
│   └── StoreBasedMouseController.ts
├── stores/             # Reactive store definitions
│   ├── MouseStoreDefinitions.ts
│   └── MouseStoreManager.ts
└── types/              # Store-related types
```

**Key Features**:
- ✅ **Reactive Updates**: Automatic UI updates on state changes
- ✅ **Centralized State**: Single source of truth per store
- ✅ **Performance**: Selective re-rendering with fine-grained subscriptions
- ✅ **Developer Experience**: Easy state debugging and time travel

## 🏪 Context Store Pattern (`context-store-pattern/`)

**Philosophy**: React Context with individual stores and selective subscriptions

**Structure**:
```
context-store-pattern/
├── containers/          # Context-aware containers
│   ├── ContextStoreMouseEventsContainer.tsx
│   └── EnhancedContextStoreContainer.tsx
├── components/          # Context-consuming components
│   ├── AdvancedMetricsPanel.tsx
│   ├── ContextStoreMouseEventsView.tsx
│   ├── EnhancedContextStoreView.tsx
│   └── RealTimeDebugger.tsx
├── context/            # React Context definitions and providers
│   └── MouseEventsContext.tsx
└── types/              # Context-related types
```

**Key Features**:
- ✅ **Individual Store Access**: Fine-grained reactivity with `useStore('storeName')`
- ✅ **Selective Subscriptions**: Components subscribe only to needed data
- ✅ **Action Integration**: Built-in action handling with context isolation
- ✅ **Real-time Analytics**: Live performance metrics and computed values
- ✅ **Type Safety**: Full TypeScript support with individual store typing

## 🔄 Shared Resources (`shared/`)

**Common components and utilities used across all patterns**:

```
shared/
├── components/          # Reusable UI components
│   ├── AnimatedClickIndicators.tsx
│   ├── IsolatedMouseRenderer.tsx
│   ├── RealtimeMouseCursor.tsx
│   ├── SimpleSmoothTracker.tsx
│   └── StaticMousePath.tsx
└── types/              # Shared TypeScript definitions
    └── MouseActions.ts
```

## 📊 Performance Comparison

| Pattern | Render Optimizations | State Updates | Learning Curve | Use Case |
|---------|---------------------|---------------|----------------|----------|
| **Clean Architecture** | Manual optimization | Imperative | Medium | Complex business logic |
| **Reactive Stores** | Automatic via subscriptions | Reactive | Medium | Real-time applications |
| **Context Store Pattern** | Selective subscriptions | Reactive + Actions | Low | React-native workflows |

## 🚀 Getting Started

### View All Patterns
```typescript
import { MouseEventsPage } from './MouseEventsPage';
// Shows all three patterns in comparison
```

### Enhanced Context Store (Standalone)
```typescript
import { ContextStoreMouseEventsPage } from './ContextStoreMouseEventsPage';
// Dedicated page with advanced analytics
```

### Individual Pattern Usage

**Clean Architecture**:
```typescript
import { MouseEventsContainer } from './clean-architecture/containers/MouseEventsContainer';
```

**Reactive Stores**:
```typescript
import { StoreBasedMouseEventsContainer } from './reactive-stores/containers/StoreBasedMouseEventsContainer';
```

**Context Store Pattern**:
```typescript
import { EnhancedContextStoreContainer } from './context-store-pattern/containers/EnhancedContextStoreContainer';
```

## 🎯 Key Learnings

1. **Clean Architecture**: Best for complex business logic that needs to be framework-agnostic and highly testable

2. **Reactive Stores**: Ideal for applications with frequent state changes and real-time updates

3. **Context Store Pattern**: Perfect for React applications needing fine-grained reactivity with minimal boilerplate

Each pattern demonstrates different approaches to the same problem, helping developers choose the right architecture for their specific needs.