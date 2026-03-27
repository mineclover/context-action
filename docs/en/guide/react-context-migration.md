# React Context to Context-Action Migration Guide

This guide helps developers migrate from traditional React Context patterns to Context-Action. It covers common patterns, their context-action equivalents, and patterns that require different approaches.

## Overview

Context-Action provides a more structured approach to state management compared to vanilla React Context. While most patterns can be directly translated, some require architectural adjustments due to the framework's separation of concerns philosophy.

### Key Differences

| Aspect | React Context | Context-Action |
|--------|--------------|----------------|
| State + Logic | Combined in Provider | Separated (Store + Handler) |
| State Updates | `setState` / `dispatch` | `setValue` / `update` |
| Cross-context | Hook calls in Provider | Handler accesses multiple stores |
| Side Effects | In Provider's useEffect | Separate components/hooks |
| Immutability | Manual | Automatic (Mutative) |

---

## Pattern Migration Guide

### 1. Basic State Management

**React Context:**
```jsx
const CounterContext = createContext(null);

function CounterProvider({ children }) {
  const [count, setCount] = useState(0);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);

  return (
    <CounterContext.Provider value={{ count, increment, decrement }}>
      {children}
    </CounterContext.Provider>
  );
}
```

**Context-Action:**
```tsx
// 1. Define store
const { Provider, useStore } = createStoreContext('Counter', {
  count: 0
});

// 2. Use in component
function CounterComponent() {
  const countStore = useStore('count');
  const count = useStoreValue(countStore);

  const increment = () => countStore.update(prev => prev + 1);
  const decrement = () => countStore.update(prev => prev - 1);

  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}

// 3. Wrap with Provider
<Provider>
  <CounterComponent />
</Provider>
```

---

### 2. Smart Setters (Function or Value)

React's `useState` and many Context patterns support both direct values and updater functions in a single setter.

**React Context:**
```jsx
const TransformContext = createContext(null);

function TransformProvider({ children }) {
  const [transform, setTransformInternal] = useState({ zoom: 1, pan: { x: 0, y: 0 } });

  // Smart setter: accepts function OR value
  const setTransform = useCallback((actionOrValue) => {
    setTransformInternal((prev) => {
      // If function, call it with previous value
      if (typeof actionOrValue === "function") {
        actionOrValue = actionOrValue(prev);
      }

      // Merge with defaults and apply constraints
      return {
        zoom: clamp(actionOrValue.zoom ?? prev.zoom, 0.02, 5),
        pan: {
          x: actionOrValue.pan?.x ?? prev.pan.x,
          y: actionOrValue.pan?.y ?? prev.pan.y,
        },
      };
    });
  }, []);

  return (
    <TransformContext.Provider value={{ transform, setTransform }}>
      {children}
    </TransformContext.Provider>
  );
}

// Usage - both work:
setTransform({ zoom: 2 });                      // Direct value
setTransform(prev => ({ ...prev, zoom: 2 }));   // Updater function
```

**Context-Action:**
```tsx
// Context-Action separates these into two methods

const { Provider, useStore } = createStoreContext('Transform', {
  transform: { zoom: 1, pan: { x: 0, y: 0 } }
});

function useTransformActions() {
  const transformStore = useStore('transform');

  // Option 1: Direct value with full replacement
  const setTransformDirect = (value: Partial<Transform>) => {
    transformStore.update(prev => ({
      zoom: clamp(value.zoom ?? prev.zoom, 0.02, 5),
      pan: {
        x: value.pan?.x ?? prev.pan.x,
        y: value.pan?.y ?? prev.pan.y,
      }
    }));
  };

  // Option 2: Functional update with draft mutation (Mutative)
  const setTransformFn = (updater: (prev: Transform) => Partial<Transform>) => {
    transformStore.update(prev => {
      const updates = updater(prev);
      return {
        zoom: clamp(updates.zoom ?? prev.zoom, 0.02, 5),
        pan: {
          x: updates.pan?.x ?? prev.pan.x,
          y: updates.pan?.y ?? prev.pan.y,
        }
      };
    });
  };

  // Combined smart setter (mimics React pattern)
  const setTransform = useCallback((actionOrValue: Transform | ((prev: Transform) => Transform)) => {
    transformStore.update(prev => {
      const newValue = typeof actionOrValue === 'function'
        ? actionOrValue(prev)
        : actionOrValue;

      return {
        zoom: clamp(newValue.zoom ?? prev.zoom, 0.02, 5),
        pan: {
          x: newValue.pan?.x ?? prev.pan.x,
          y: newValue.pan?.y ?? prev.pan.y,
        }
      };
    });
  }, [transformStore]);

  return { setTransform };
}
```

**Key Points:**
- `setValue(value)` - Direct replacement (no access to previous)
- `update(prev => newValue)` - Functional update with previous value access
- Create a wrapper function if you need both patterns in one API

---

### 3. localStorage Persistence

**React Context:**
```jsx
function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem("settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
```

**Context-Action:**
```tsx
// Approach 1: Dedicated persistence component
function SettingsPersistence() {
  const settingsStore = useStore('settings');

  useEffect(() => {
    // Load
    const saved = localStorage.getItem("settings");
    if (saved) {
      settingsStore.setValue(JSON.parse(saved));
    }

    // Save on changes
    return settingsStore.subscribe(() => {
      localStorage.setItem("settings", JSON.stringify(settingsStore.getValue()));
    });
  }, [settingsStore]);

  return null;
}

// Approach 2: Reusable hook
function usePersistedStore<T>(store: Store<T>, key: string, defaultValue?: T) {
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        store.setValue(JSON.parse(saved));
      } catch {
        if (defaultValue !== undefined) store.setValue(defaultValue);
      }
    }

    return store.subscribe(() => {
      localStorage.setItem(key, JSON.stringify(store.getValue()));
    });
  }, [store, key]);
}

// Usage
function SettingsSetup() {
  const settingsStore = useStore('settings');
  usePersistedStore(settingsStore, 'settings');
  return null;
}

// App structure
<SettingsProvider>
  <SettingsSetup />  {/* Handles persistence */}
  <App />
</SettingsProvider>
```

---

### 4. Cross-Context Communication

**React Context:**
```jsx
// DiagramProvider depends on other contexts
function DiagramProvider({ children }) {
  const [tables, setTables] = useState([]);

  // Access other contexts inside provider
  const { transform } = useTransform();
  const { setUndoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();

  const addTable = (data) => {
    const newTable = {
      x: transform.pan.x,  // Read from TransformContext
      y: transform.pan.y,
      // ...
    };

    setTables(prev => [...prev, newTable]);
    setUndoStack(prev => [...prev, { action: 'ADD', data: newTable }]); // Update UndoContext
  };

  const deleteTable = (id) => {
    setTables(prev => prev.filter(t => t.id !== id));

    // Update SelectContext if deleted table was selected
    if (id === selectedElement.id) {
      setSelectedElement({ element: null, id: null });
    }
  };

  return (
    <DiagramContext.Provider value={{ tables, addTable, deleteTable }}>
      {children}
    </DiagramContext.Provider>
  );
}
```

**Context-Action:**
```tsx
// Define all stores
const { Provider: DiagramProvider, useStore: useDiagramStore } = createStoreContext('Diagram', {
  tables: [] as Table[],
  relationships: [] as Relationship[],
});

const { Provider: TransformProvider, useStore: useTransformStore } = createStoreContext('Transform', {
  pan: { x: 0, y: 0 },
  zoom: 1,
});

const { Provider: UndoProvider, useStore: useUndoStore } = createStoreContext('Undo', {
  undoStack: [] as HistoryEntry[],
  redoStack: [] as HistoryEntry[],
});

const { Provider: SelectProvider, useStore: useSelectStore } = createStoreContext('Select', {
  selectedElement: { element: null, id: null },
});

// Handler component accesses multiple stores
function DiagramHandlers({ children }: { children: ReactNode }) {
  const tablesStore = useDiagramStore('tables');
  const transformStore = useTransformStore('pan');
  const undoStore = useUndoStore('undoStack');
  const selectStore = useSelectStore('selectedElement');

  useActionHandler('addTable', useCallback((data) => {
    const pan = transformStore.getValue();  // Read from transform store

    const newTable = {
      id: generateId(),
      x: pan.x,
      y: pan.y,
      ...data,
    };

    tablesStore.update(prev => [...prev, newTable]);
    undoStore.update(prev => [...prev, { action: 'ADD', data: newTable }]);
  }, [tablesStore, transformStore, undoStore]));

  useActionHandler('deleteTable', useCallback((id: string) => {
    const selected = selectStore.getValue();

    tablesStore.update(prev => prev.filter(t => t.id !== id));

    // Update selection if deleted table was selected
    if (id === selected.id) {
      selectStore.setValue({ element: null, id: null });
    }
  }, [tablesStore, selectStore]));

  return children;
}

// Provider composition
function AppProviders({ children }) {
  return (
    <DiagramActionProvider>
      <DiagramProvider>
        <TransformProvider>
          <UndoProvider>
            <SelectProvider>
              <DiagramHandlers>
                {children}
              </DiagramHandlers>
            </SelectProvider>
          </UndoProvider>
        </TransformProvider>
      </DiagramProvider>
    </DiagramActionProvider>
  );
}
```

---

### 5. DOM Side Effects

**React Context:**
```jsx
function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  // DOM side effect inside provider
  useEffect(() => {
    document.body.setAttribute("theme-mode", settings.mode);
  }, [settings.mode]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
```

**Context-Action:**
```tsx
// Separate component for DOM effects
function ThemeEffect() {
  const settingsStore = useStore('settings');
  const mode = useStoreValue(settingsStore, s => s.mode);

  useEffect(() => {
    document.body.setAttribute("theme-mode", mode);
  }, [mode]);

  return null;
}

// Or as a custom hook
function useThemeMode() {
  const settingsStore = useStore('settings');
  const mode = useStoreValue(settingsStore, s => s.mode);

  useEffect(() => {
    document.body.setAttribute("theme-mode", mode);
  }, [mode]);

  return mode;
}

// App structure
<SettingsProvider>
  <ThemeEffect />  {/* Handles DOM side effect */}
  <App />
</SettingsProvider>
```

---

### 6. Nested State Updates

**React Context:**
```jsx
const updateField = (tableId, fieldId, updates) => {
  setTables(prev => prev.map(table => {
    if (table.id === tableId) {
      return {
        ...table,
        fields: table.fields.map(field =>
          field.id === fieldId ? { ...field, ...updates } : field
        ),
      };
    }
    return table;
  }));
};
```

**Context-Action (with Mutative):**
```tsx
const updateField = (tableId: string, fieldId: string, updates: Partial<Field>) => {
  tablesStore.update(draft => {
    const table = draft.find(t => t.id === tableId);
    if (table) {
      const field = table.fields.find(f => f.id === fieldId);
      if (field) {
        Object.assign(field, updates);  // Direct mutation - Mutative handles immutability
      }
    }
  });
};

// Alternative: path-based subscription for performance
const field = useStorePath(tablesStore, ['0', 'fields', '0', 'name']);
```

---

### 7. Undo/Redo Pattern

**React Context:**
```jsx
function UndoRedoProvider({ children }) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const pushUndo = (entry) => {
    setUndoStack(prev => [...prev, entry]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const entry = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, entry]);

    return entry;
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const entry = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, entry]);

    return entry;
  };

  return (
    <UndoRedoContext.Provider value={{ pushUndo, undo, redo, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 }}>
      {children}
    </UndoRedoContext.Provider>
  );
}
```

**Context-Action (Built-in TimeTravelStore):**
```tsx
import { createTimeTravelStoreContext, useTimeTravelControls } from '@context-action/react';

// Create time-travel enabled store
const { Provider, useStore } = createTimeTravelStoreContext('Editor', {
  tables: [] as Table[],
  settings: defaultSettings,
}, {
  historyLimit: 50,  // Max undo steps
});

// Usage in component
function EditorToolbar() {
  const tablesStore = useStore('tables');
  const { canUndo, canRedo, undo, redo, position, historyLength } = useTimeTravelControls(tablesStore);

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      <span>{position + 1} / {historyLength}</span>
    </div>
  );
}
```

---

## Migration Checklist

### Before Migration

- [ ] Identify all Context providers in your app
- [ ] Map out cross-context dependencies
- [ ] List all side effects in providers (localStorage, DOM, API calls)
- [ ] Identify smart setter patterns (function/value dual support)

### During Migration

- [ ] Create store contexts for each state domain
- [ ] Separate business logic into handler components
- [ ] Extract side effects into dedicated components/hooks
- [ ] Replace setState with setValue/update
- [ ] Update cross-context communication to use handler pattern

### After Migration

- [ ] Verify all state updates work correctly
- [ ] Test undo/redo if using TimeTravelStore
- [ ] Check persistence (localStorage) functionality
- [ ] Validate cross-store coordination
- [ ] Performance test with useStorePath for nested data

---

## Patterns Not Directly Supported

### 1. Dynamic Context Creation

React allows creating contexts at runtime. Context-Action requires pre-defined stores.

**Workaround:** Use `useLocalStore` for truly dynamic state, or pre-define all possible stores.

### 2. Provider-Embedded Business Logic

React Context allows all logic inside the Provider. Context-Action separates this.

**Workaround:** Use Handler components that wrap children and register action handlers.

### 3. Automatic Partial Merging

React's setState with objects automatically merges. Context-Action requires explicit merging.

**Workaround:** Create wrapper functions that handle partial updates with spread operators.

---

## Benefits After Migration

1. **Better Separation of Concerns** - UI, business logic, and state are clearly separated
2. **Automatic Immutability** - Mutative integration prevents accidental mutations
3. **Built-in Time Travel** - Undo/redo without manual implementation
4. **Path-based Subscriptions** - Fine-grained re-rendering control
5. **Type Safety** - Full TypeScript inference throughout
6. **Memory Leak Prevention** - Automatic cleanup and event object filtering
