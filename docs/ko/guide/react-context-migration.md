# React Context에서 Context-Action으로 마이그레이션 가이드

이 가이드는 기존 React Context 패턴에서 Context-Action으로 마이그레이션하는 방법을 설명합니다. 일반적인 패턴들과 Context-Action에서의 대응 방법, 그리고 다른 접근이 필요한 패턴들을 다룹니다.

## 개요

Context-Action은 기본 React Context에 비해 더 구조화된 상태 관리 접근 방식을 제공합니다. 대부분의 패턴은 직접 변환이 가능하지만, 일부는 프레임워크의 관심사 분리 철학으로 인해 아키텍처 조정이 필요합니다.

### 주요 차이점

| 관점 | React Context | Context-Action |
|------|---------------|----------------|
| 상태 + 로직 | Provider에 통합 | 분리됨 (Store + Handler) |
| 상태 업데이트 | `setState` / `dispatch` | `setValue` / `update` |
| 크로스 컨텍스트 | Provider 내 훅 호출 | Handler에서 여러 store 접근 |
| 사이드 이펙트 | Provider의 useEffect 내부 | 별도 컴포넌트/훅으로 분리 |
| 불변성 | 수동 관리 | 자동 (Mutative) |

---

## 패턴 마이그레이션 가이드

### 1. 기본 상태 관리

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
// 1. Store 정의
const { Provider, useStore } = createStoreContext('Counter', {
  count: 0
});

// 2. 컴포넌트에서 사용
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

// 3. Provider로 감싸기
<Provider>
  <CounterComponent />
</Provider>
```

---

### 2. 스마트 Setter (함수 또는 값)

React의 `useState`와 많은 Context 패턴은 단일 setter에서 직접 값과 업데이터 함수를 모두 지원합니다.

**React Context:**
```jsx
const TransformContext = createContext(null);

function TransformProvider({ children }) {
  const [transform, setTransformInternal] = useState({ zoom: 1, pan: { x: 0, y: 0 } });

  // 스마트 setter: 함수 또는 값 모두 허용
  const setTransform = useCallback((actionOrValue) => {
    setTransformInternal((prev) => {
      // 함수면 이전 값으로 호출
      if (typeof actionOrValue === "function") {
        actionOrValue = actionOrValue(prev);
      }

      // 기본값과 병합하고 제약 적용
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

// 사용법 - 둘 다 가능:
setTransform({ zoom: 2 });                      // 직접 값
setTransform(prev => ({ ...prev, zoom: 2 }));   // 업데이터 함수
```

**Context-Action:**
```tsx
// Context-Action은 두 메서드로 분리됨

const { Provider, useStore } = createStoreContext('Transform', {
  transform: { zoom: 1, pan: { x: 0, y: 0 } }
});

function useTransformActions() {
  const transformStore = useStore('transform');

  // 옵션 1: 직접 값으로 전체 교체
  const setTransformDirect = (value: Partial<Transform>) => {
    transformStore.update(prev => ({
      zoom: clamp(value.zoom ?? prev.zoom, 0.02, 5),
      pan: {
        x: value.pan?.x ?? prev.pan.x,
        y: value.pan?.y ?? prev.pan.y,
      }
    }));
  };

  // 옵션 2: draft 변이를 사용한 함수형 업데이트 (Mutative)
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

  // React 패턴을 모방한 통합 스마트 setter
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

**핵심 포인트:**
- `setValue(value)` - 직접 교체 (이전 값 접근 불가)
- `update(prev => newValue)` - 이전 값 접근이 가능한 함수형 업데이트
- 하나의 API에서 두 패턴이 모두 필요하면 래퍼 함수 생성

---

### 3. localStorage 영속성

**React Context:**
```jsx
function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  // 마운트 시 로드
  useEffect(() => {
    const saved = localStorage.getItem("settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  // 변경 시 저장
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
// 방법 1: 전용 영속성 컴포넌트
function SettingsPersistence() {
  const settingsStore = useStore('settings');

  useEffect(() => {
    // 로드
    const saved = localStorage.getItem("settings");
    if (saved) {
      settingsStore.setValue(JSON.parse(saved));
    }

    // 변경 시 저장
    return settingsStore.subscribe(() => {
      localStorage.setItem("settings", JSON.stringify(settingsStore.getValue()));
    });
  }, [settingsStore]);

  return null;
}

// 방법 2: 재사용 가능한 훅
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

// 사용법
function SettingsSetup() {
  const settingsStore = useStore('settings');
  usePersistedStore(settingsStore, 'settings');
  return null;
}

// 앱 구조
<SettingsProvider>
  <SettingsSetup />  {/* 영속성 처리 */}
  <App />
</SettingsProvider>
```

---

### 4. 크로스 컨텍스트 통신

**React Context:**
```jsx
// DiagramProvider가 다른 컨텍스트에 의존
function DiagramProvider({ children }) {
  const [tables, setTables] = useState([]);

  // Provider 내부에서 다른 컨텍스트 접근
  const { transform } = useTransform();
  const { setUndoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();

  const addTable = (data) => {
    const newTable = {
      x: transform.pan.x,  // TransformContext에서 읽기
      y: transform.pan.y,
      // ...
    };

    setTables(prev => [...prev, newTable]);
    setUndoStack(prev => [...prev, { action: 'ADD', data: newTable }]); // UndoContext 업데이트
  };

  const deleteTable = (id) => {
    setTables(prev => prev.filter(t => t.id !== id));

    // 삭제된 테이블이 선택된 경우 SelectContext 업데이트
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
// 모든 store 정의
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

// Handler 컴포넌트에서 여러 store 접근
function DiagramHandlers({ children }: { children: ReactNode }) {
  const tablesStore = useDiagramStore('tables');
  const transformStore = useTransformStore('pan');
  const undoStore = useUndoStore('undoStack');
  const selectStore = useSelectStore('selectedElement');

  useActionHandler('addTable', useCallback((data) => {
    const pan = transformStore.getValue();  // transform store에서 읽기

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

    // 삭제된 테이블이 선택된 경우 selection 업데이트
    if (id === selected.id) {
      selectStore.setValue({ element: null, id: null });
    }
  }, [tablesStore, selectStore]));

  return children;
}

// Provider 조합
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

### 5. DOM 사이드 이펙트

**React Context:**
```jsx
function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  // Provider 내부의 DOM 사이드 이펙트
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
// DOM 이펙트를 위한 별도 컴포넌트
function ThemeEffect() {
  const settingsStore = useStore('settings');
  const mode = useStoreValue(settingsStore, s => s.mode);

  useEffect(() => {
    document.body.setAttribute("theme-mode", mode);
  }, [mode]);

  return null;
}

// 또는 커스텀 훅으로
function useThemeMode() {
  const settingsStore = useStore('settings');
  const mode = useStoreValue(settingsStore, s => s.mode);

  useEffect(() => {
    document.body.setAttribute("theme-mode", mode);
  }, [mode]);

  return mode;
}

// 앱 구조
<SettingsProvider>
  <ThemeEffect />  {/* DOM 사이드 이펙트 처리 */}
  <App />
</SettingsProvider>
```

---

### 6. 중첩 상태 업데이트

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

**Context-Action (Mutative 사용):**
```tsx
const updateField = (tableId: string, fieldId: string, updates: Partial<Field>) => {
  tablesStore.update(draft => {
    const table = draft.find(t => t.id === tableId);
    if (table) {
      const field = table.fields.find(f => f.id === fieldId);
      if (field) {
        Object.assign(field, updates);  // 직접 변이 - Mutative가 불변성 처리
      }
    }
  });
};

// 대안: 성능을 위한 경로 기반 구독
const field = useStorePath(tablesStore, ['0', 'fields', '0', 'name']);
```

---

### 7. Undo/Redo 패턴

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

**Context-Action (내장 TimeTravelStore):**
```tsx
import { createTimeTravelStoreContext, useTimeTravelControls } from '@context-action/react';

// 시간 여행 가능한 store 생성
const { Provider, useStore } = createTimeTravelStoreContext('Editor', {
  tables: [] as Table[],
  settings: defaultSettings,
}, {
  historyLimit: 50,  // 최대 undo 단계
});

// 컴포넌트에서 사용
function EditorToolbar() {
  const tablesStore = useStore('tables');
  const { canUndo, canRedo, undo, redo, position, historyLength } = useTimeTravelControls(tablesStore);

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>실행 취소</button>
      <button onClick={redo} disabled={!canRedo}>다시 실행</button>
      <span>{position + 1} / {historyLength}</span>
    </div>
  );
}
```

---

## 마이그레이션 체크리스트

### 마이그레이션 전

- [ ] 앱의 모든 Context provider 파악
- [ ] 크로스 컨텍스트 의존성 매핑
- [ ] provider의 모든 사이드 이펙트 목록화 (localStorage, DOM, API 호출)
- [ ] 스마트 setter 패턴 파악 (함수/값 이중 지원)

### 마이그레이션 중

- [ ] 각 상태 도메인에 대한 store context 생성
- [ ] 비즈니스 로직을 handler 컴포넌트로 분리
- [ ] 사이드 이펙트를 전용 컴포넌트/훅으로 추출
- [ ] setState를 setValue/update로 교체
- [ ] 크로스 컨텍스트 통신을 handler 패턴으로 업데이트

### 마이그레이션 후

- [ ] 모든 상태 업데이트가 올바르게 동작하는지 확인
- [ ] TimeTravelStore 사용 시 undo/redo 테스트
- [ ] 영속성 (localStorage) 기능 확인
- [ ] 크로스 스토어 조정 검증
- [ ] 중첩 데이터에 대해 useStorePath로 성능 테스트

---

## 직접 지원되지 않는 패턴

### 1. 동적 Context 생성

React는 런타임에 context를 생성할 수 있습니다. Context-Action은 미리 정의된 store가 필요합니다.

**해결 방법:** 진정한 동적 상태에는 `useLocalStore`를 사용하거나, 가능한 모든 store를 미리 정의하세요.

### 2. Provider 내장 비즈니스 로직

React Context는 Provider 내부에 모든 로직을 허용합니다. Context-Action은 이를 분리합니다.

**해결 방법:** children을 감싸고 action handler를 등록하는 Handler 컴포넌트를 사용하세요.

### 3. 자동 부분 병합

React의 객체를 사용한 setState는 자동으로 병합합니다. Context-Action은 명시적 병합이 필요합니다.

**해결 방법:** spread 연산자로 부분 업데이트를 처리하는 래퍼 함수를 만드세요.

---

## 마이그레이션 후 이점

1. **더 나은 관심사 분리** - UI, 비즈니스 로직, 상태가 명확하게 분리됨
2. **자동 불변성** - Mutative 통합으로 우발적 변이 방지
3. **내장 시간 여행** - 수동 구현 없이 Undo/Redo 지원
4. **경로 기반 구독** - 세밀한 리렌더링 제어
5. **타입 안전성** - 전체에 걸친 완전한 TypeScript 추론
6. **메모리 누수 방지** - 자동 정리 및 이벤트 객체 필터링
