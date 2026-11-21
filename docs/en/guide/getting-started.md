# Getting Started

Context-Action separates typed command execution (**Actions**) from reactive state (**Stores**) so you can start simple and add explicit boundaries only as your application grows.

## Progressive Adoption Ladder

Start at Level 1 and expand only when complexity demands it:

| Level | Scope | Primitives | Best For |
| --- | --- | --- | --- |
| **Level 1 · Lite** | Scoped state or commands | `createStoreContext`, `createActionContext` (or `createStateStore` + `ActionRegister`) | Component trees, forms, lightweight workflows |
| **Level 2 · Standard** | Headless pipelines, roles, 120fps DOM | `<ActionProvider register={...}>`, `<StoreProvider stores={...} \| manager={...}>`, role hooks (`useActionGuard`, `useActionCommandHandler`, `useActionResultHandler`, `useActionObserver`), `useStorePath`, `createRefContext` | Async orchestration, testable pure-TS pipelines, canvas/DOM refs |
| **Level 3 · Enterprise** | Full domain architecture & integrations | 6-layer Context-Layered structure, `StoreTransactionCoordinator`, `@context-action/tool-protocol`, `@context-action/xstate`, Lit/Preact UI bridges | Large teams, atomic multi-store undo/redo, AI/MCP tools, micro-frontends |

See the [Store Selection and Usage Guide](../context-layered/store-selection-and-usage-guide.md) for the complete comparison matrix across all state primitives.

## Quick Start

Choose the right pattern for your use case:

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| **🎯 Action Only** | Action dispatching without stores | `createActionContext` | Event systems, command patterns |
| **🏪 Store Only** | State management without actions | `createStoreContext` | Pure state management, data layers |
| **🏗️ Headless-First** | Pure-TS pipeline + stores + React DI | `ActionRegister` + `Store` / `StoreManager` + `<Provider register / stores>` | UI-independent business orchestration, portable domain modules |
| **🔧 Ref Context** *(Advanced)* | Direct DOM manipulation with zero re-renders | `createRefContext` | High-performance UI, animations, real-time interactions |

## 🎯 Action Only Pattern

Pure action dispatching without state management.

### Basic Usage

<!-- @context-action-compile -->
```tsx
import type React from 'react';
import { createActionContext } from '@context-action/react';
import type { ActionPayloadMap } from '@context-action/core';

// 1. Define Actions
interface EventActions extends ActionPayloadMap {
  userClick: { x: number; y: number };
  analytics: { event: string; data: Record<string, unknown> };
}

// 2. Create Context
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionCommandHandler: useEventCommandHandler,
} = createActionContext<EventActions>('Events');

// 3. Provider Setup
export function App() {
  return (
    <EventActionProvider>
      <InteractiveComponent />
    </EventActionProvider>
  );
}

// 4. Component Usage
function InteractiveComponent() {
  const dispatch = useEventAction();

  useEventCommandHandler('userClick', (payload) => {
    console.log('User clicked at:', payload.x, payload.y);
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    void dispatch('userClick', { x: e.clientX, y: e.clientY });
  };

  return <button type="button" onClick={handleClick}>Click Me</button>;
}
```

## 🏪 Store Only Pattern

Type-safe state management without action dispatching.

### Basic Usage

<!-- @context-action-compile -->
```tsx
import { createStoreContext, useStoreValue } from '@context-action/react';

// 1. Create Store Context
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
} = createStoreContext('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' as 'light' | 'dark' } },
});

// 2. Provider Setup
export function App() {
  return (
    <AppStoreProvider>
      <UserComponent />
    </AppStoreProvider>
  );
}

// 3. Component Usage
function UserComponent() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);

  const updateUser = () => {
    userStore.setValue({ name: 'John', email: 'john@example.com' });
  };

  return (
    <div>
      <p>User: {user.name}</p>
      <button type="button" onClick={updateUser}>
        Update User
      </button>
    </div>
  );
}
```

## 🏗️ Headless-First Pattern (`ActionRegister` + `Store` DI)

When orchestration and state should outlive a UI mount or remain framework-agnostic, assemble your `ActionRegister` and `createStore` (or `StoreManager`) outside React and inject both symmetrically via `<ActionProvider register={...}>` and `<StoreProvider stores={...} | manager={...}>`. By default, `ownership` is `'shared'`, so unmounting React Providers detaches UI listeners without destroying your external register or stores (pass `ownership="owned"` when transferring teardown ownership).

<!-- @context-action-compile -->
```tsx
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStore,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

interface CounterActions extends ActionPayloadMap {
  increment: { amount: number };
}

interface CounterStores {
  counter: { count: number };
}

// 1. Framework-neutral state + command pipeline (testable without React)
export const counterStore = createStore<CounterStores['counter']>('counter', { count: 0 });
export const counterRegister = new ActionRegister<CounterActions>({ name: 'HeadlessCounter' });

counterRegister.registerCommand('increment', ({ amount }) => {
  counterStore.update(prev => ({ count: prev.count + amount }));
});

// 2. Thin React Context DI boundaries (ownership defaults to 'shared')
const CounterActionsContext = createActionContext<CounterActions>('CounterActions');
const CounterStoresContext = createStoreContext<CounterStores>('CounterStores', {
  counter: { count: 0 },
});

function CounterPanel() {
  const dispatch = CounterActionsContext.useActionDispatch();
  const state = useStoreValue(CounterStoresContext.useStore('counter'));

  return (
    <button type="button" onClick={() => void dispatch('increment', { amount: 1 })}>
      Count: {state.count}
    </button>
  );
}

export function HeadlessCounterApp() {
  return (
    <CounterActionsContext.Provider register={counterRegister} ownership="shared">
      <CounterStoresContext.Provider stores={{ counter: counterStore }} ownership="shared">
        <CounterPanel />
      </CounterStoresContext.Provider>
    </CounterActionsContext.Provider>
  );
}
```

## 🔧 Ref Context Pattern

High-performance direct DOM manipulation with zero React re-renders.

### Basic Usage

<!-- @context-action-compile -->
```tsx
import type React from 'react';
import { useCallback, useRef } from 'react';
import { createRefContext } from '@context-action/react';

// 1. Define Ref Structure
type MouseRefs = {
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  container: HTMLDivElement;
};

// 2. Create RefContext
const {
  Provider: MouseProvider,
  useRefHandler: useMouseRef,
} = createRefContext<MouseRefs>('Mouse');

// 3. Provider Setup
export function MouseApp() {
  return (
    <MouseProvider>
      <MouseTracker />
    </MouseProvider>
  );
}

// 4. Component with Direct DOM Manipulation
function MouseTracker() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  const container = useMouseRef('container');

  // Direct DOM manipulation - zero React re-renders
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cursor.target || !container.target) return;

    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    if (trail.target) {
      trail.target.style.transform = `translate3d(${x - 5}px, ${y - 5}px, 0)`;
      trail.target.style.opacity = '0.7';
    }
  }, [cursor, trail, container]);

  return (
    <div
      ref={container.setRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-96 bg-gray-100"
    >
      <div
        ref={cursor.setRef}
        className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      <div
        ref={trail.setRef}
        className="absolute w-3 h-3 bg-blue-300 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)', opacity: 0 }}
      />
    </div>
  );
}

export function useMousePositionHistory() {
  const cursor = useMouseRef('cursor');
  const positionHistory = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);

  const updatePosition = useCallback((x: number, y: number) => {
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    positionHistory.current.push({ x, y, timestamp: Date.now() });
    if (positionHistory.current.length > 50) {
      positionHistory.current.shift();
    }
  }, [cursor]);

  const getVelocity = useCallback(() => {
    const history = positionHistory.current;
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    if (!latest || !previous) return 0;

    const distance = Math.sqrt((latest.x - previous.x) ** 2 + (latest.y - previous.y) ** 2);
    const timeDiff = latest.timestamp - previous.timestamp;
    return timeDiff === 0 ? 0 : distance / timeDiff;
  }, []);

  return { updatePosition, getVelocity };
}
```

## Pattern Composition

For complex applications, combine core and advanced patterns:

```tsx
function ComplexApp() {
  return (
    <AppStoreProvider>
      <EventActionProvider>
        <MouseProvider>
          <MyComponent />
        </MouseProvider>
      </EventActionProvider>
    </AppStoreProvider>
  );
}
```

## Next Steps

- [Store Selection and Usage Guide](../context-layered/store-selection-and-usage-guide.md) - Choose the right store primitive for each boundary
- [Context-Layered Architecture](../context-layered/context-layered-guide.md) - Move smoothly from Lite/Standard to 6-layer domains
- [React Refs Guide](../concept/react-refs-guide.md) - Deep dive into RefContext patterns
- [Pattern Guide](../concept/pattern-guide.md) - Compare core and advanced patterns with examples
- [Pipeline System](./pipeline/) - Learn about action processing
- [Best Practices](./best-practices.md) - Follow recommended patterns

## Real-World Examples

- **Mouse Events with RefContext**: See the RefContext mouse events demo in our example app
- **Store Integration**: Learn how to combine stores with action handlers
- **Performance Optimization**: Discover zero re-render patterns with direct DOM manipulation
