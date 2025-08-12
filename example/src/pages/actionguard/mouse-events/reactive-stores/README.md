# ⚛️ Reactive Stores Pattern

Reactive state management with observable stores and automatic UI updates.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                Store Layer                      │
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │   Store Defs    │  │  Store Manager      │   │
│  │  (Schema)       │  │  (Orchestration)    │   │
│  └─────────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────┤
│              Controller Layer                   │
│  ┌─────────────────┐                            │
│  │   Controllers   │    (Reactive State Logic)  │
│  │  (Store Logic)  │                            │
│  └─────────────────┘                            │
├─────────────────────────────────────────────────┤
│                View Layer                       │
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │   Containers    │  │    Components       │   │
│  │ (Store Bridge)  │  │ (Store Reactive)    │   │
│  └─────────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Key Components

### 📦 Containers (`containers/`)
- **`StoreBasedMouseEventsContainer.tsx`**: Connects stores to React components

### 🎨 Components (`components/`)
- **`StoreBasedMouseEventsView.tsx`**: Store-reactive view component

### 🎮 Controllers (`controllers/`)
- **`StoreBasedMouseController.ts`**: Store state management and business logic

### 🏪 Stores (`stores/`)
- **`MouseStoreDefinitions.ts`**: Store schemas and reactive definitions
- **`MouseStoreManager.ts`**: Store lifecycle and subscription management

## Store Architecture

### Store Types
```typescript
interface MouseStores {
  position: {
    current: MousePosition;
    previous: MousePosition;
    isInsideArea: boolean;
  };
  
  movement: {
    moveCount: number;
    isMoving: boolean;
    velocity: number;
    path: MousePosition[];
  };
  
  clicks: {
    count: number;
    history: ClickEvent[];
  };
}
```

### Reactive Updates
```typescript
// Automatic UI updates when store changes
const positionStore = useStore('position');
const position = useStoreValue(positionStore); // Re-renders on change
```

## Usage Example

```typescript
import { StoreBasedMouseEventsContainer } from './containers/StoreBasedMouseEventsContainer';

function App() {
  return (
    <div>
      <StoreBasedMouseEventsContainer />
    </div>
  );
}
```

## Benefits

- ✅ **Reactive Updates**: Automatic UI updates on state changes
- ✅ **Performance**: Selective re-rendering based on store subscriptions
- ✅ **Centralized State**: Single source of truth for each store
- ✅ **Developer Experience**: Great debugging with store inspection
- ✅ **Time Travel**: Easy to implement undo/redo functionality

## Trade-offs

- ⚠️ **Learning Curve**: Requires understanding of reactive patterns
- ⚠️ **Memory Usage**: Store subscriptions and reactive chains
- ⚠️ **Debugging**: Can be complex to trace reactive updates