# 🏗️ Clean Architecture Pattern

Pure dependency injection with complete separation of concerns, no React Context or external state management.

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│                 UI Layer                        │
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │   Containers    │  │    Components       │   │
│  │  (Orchestrate)  │  │   (Pure Views)      │   │
│  └─────────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────┤
│               Application Layer                 │
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │   Controllers   │  │      Hooks          │   │
│  │ (Coordination)  │  │  (React Logic)      │   │
│  └─────────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────┤
│                Domain Layer                     │
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │    Services     │  │      Types          │   │
│  │ (Business Logic)│  │  (Domain Models)    │   │
│  └─────────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Key Components

### 📦 Containers (`containers/`)
- **`MouseEventsContainer.tsx`**: Main orchestrator that coordinates all layers

### 🎨 Components (`components/`)
- **`CleanMouseEventsView.tsx`**: Pure UI component with no business logic
- **`MouseEventsView.tsx`**: Alternative view implementation
- **`OptimizedMouseEventsView.tsx`**: Performance-optimized variant

### 🎮 Controllers (`controllers/`)
- **`MouseController.ts`**: Business logic coordination and state management

### 🪝 Hooks (`hooks/`)
- **`useMouseEventsLogic.ts`**: React-specific logic encapsulation

### ⚙️ Services (`services/`)
- **`MousePathService.ts`**: Path calculation and manipulation
- **`MouseRenderService.ts`**: DOM rendering and animation logic

## Usage Example

```typescript
import { MouseEventsContainer } from './containers/MouseEventsContainer';

function App() {
  return (
    <div>
      <MouseEventsContainer />
    </div>
  );
}
```

## Benefits

- ✅ **Framework Agnostic**: Business logic can be tested without React
- ✅ **Highly Testable**: Each layer has clear interfaces and dependencies
- ✅ **Maintainable**: Changes in one layer don't affect others
- ✅ **Scalable**: Easy to add new features without coupling

## Trade-offs

- ⚠️ **More Boilerplate**: Requires more files and interfaces
- ⚠️ **Learning Curve**: Developers need to understand layered architecture
- ⚠️ **Manual Optimizations**: No automatic re-rendering optimizations