# Context Action 구현 예제 코드 전체 리스트

## 🎯 문서 목적

실제 구현된 모든 페이지의 핵심 코드 예제를 한 곳에 모아 개발자가 참고할 수 있는 완전한 구현 가이드를 제공합니다.

---

## 📦 Core Package 구현 예제

### 1. 기본 ActionRegister 사용법 (CoreBasicsPage.tsx)

```typescript
// 액션 타입 정의
interface CoreActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  log: string;
}

// ActionRegister 생성 및 핸들러 등록
export function CoreBasicsPage() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actionRegister] = useState(() => new ActionRegister<CoreActionMap>());

  useEffect(() => {
    // 핸들러 등록
    const unsubscribeIncrement = actionRegister.register(
      'increment',
      (_, controller) => {
        setCount((prev) => prev + 1);
        addLog('Increment action executed');
        controller.next();
      }
    );

    const unsubscribeDecrement = actionRegister.register(
      'decrement',
      (_, controller) => {
        setCount((prev) => prev - 1);
        addLog('Decrement action executed');
        controller.next();
      }
    );

    const unsubscribeSetCount = actionRegister.register(
      'setCount',
      (payload, controller) => {
        setCount(payload);
        addLog(`Count set to: ${payload}`);
        controller.next();
      }
    );

    // 정리 함수
    return () => {
      unsubscribeIncrement();
      unsubscribeDecrement();
      unsubscribeSetCount();
    };
  }, [actionRegister, addLog]);

  // 액션 디스패치
  const handleIncrement = () => actionRegister.dispatch('increment');
  const handleSetCount = () => actionRegister.dispatch('setCount', 10);
}
```

### 2. 고급 파이프라인 패턴 (CoreAdvancedPage.tsx)

```typescript
// 고급 액션 맵 정의
interface AdvancedActionMap extends ActionPayloadMap {
  increment: undefined;
  multiply: number;
  chainedAction: { step: number; data: string };
  conditionalAction: { condition: boolean; value: number };
  delayedAction: { delay: number; message: string };
  errorAction: undefined;
}

// 우선순위 기반 핸들러 등록
function setupAdvancedHandlers(actionRegister: ActionRegister<AdvancedActionMap>) {
  // 기본 액션 (Priority 1)
  actionRegister.register('increment', () => {
    setCount((prev) => prev + 1);
    addLog('action', 'Counter incremented', 1);
  }, { priority: 1 });

  // 고급 액션 (Priority 2)
  actionRegister.register('multiply', (factor) => {
    setCount((prev) => prev * factor);
    addLog('action', `Counter multiplied by ${factor}`, 2);
  }, { priority: 2 });

  // 비동기 체이닝 액션
  actionRegister.register('chainedAction', async ({ step, data }) => {
    addLog('action', `Chain step ${step}: ${data}`, 1);

    if (step < 3) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      actionRegister.dispatch('chainedAction', {
        step: step + 1,
        data: `${data} -> Step ${step + 1}`,
      });
    } else {
      addLog('action', 'Chain completed!', 1);
    }
  }, { priority: 1 });

  // 조건부 실행 액션
  actionRegister.register('conditionalAction', ({ condition, value }) => {
    if (condition) {
      setCount((prev) => prev + value);
      addLog('action', `Conditional action executed: +${value}`, 1);
    } else {
      addLog('action', `Conditional action skipped (condition: ${condition})`, 1);
    }
  }, { priority: 1 });

  // 지연 실행 액션
  actionRegister.register('delayedAction', async ({ delay, message }) => {
    addLog('action', `Delayed action started: ${message} (${delay}ms delay)`, 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
    addLog('action', `Delayed action completed: ${message}`, 1);
  }, { priority: 1 });

  // 에러 처리 액션
  actionRegister.register('errorAction', () => {
    addLog('action', 'Error action triggered', 1);
    throw new Error('Intentional error for testing');
  }, { priority: 1 });
}

// 미들웨어 시뮬레이션 패턴
type Middleware<T extends ActionPayloadMap> = (
  action: keyof T,
  payload: T[keyof T],
  next: () => void | Promise<void>
) => void | Promise<void>;

const loggingMiddleware: Middleware<AdvancedActionMap> = (action, payload, next) => {
  addLog('middleware', `🔍 Pre-execution: ${String(action)} with payload: ${JSON.stringify(payload)}`);
  next();
  addLog('middleware', `✅ Post-execution: ${String(action)} completed`);
};

const authenticationMiddleware: Middleware<AdvancedActionMap> = (action, _payload, next) => {
  const protectedActions = ['reset', 'multiply'];
  
  if (protectedActions.includes(String(action))) {
    addLog('middleware', `🔐 Authentication check for ${String(action)}`);
    if (Math.random() > 0.1) { // 90% 성공률
      addLog('middleware', `✅ Authentication passed for ${String(action)}`);
      next();
    } else {
      addLog('middleware', `❌ Authentication failed for ${String(action)}`);
      addLog('error', `Access denied for ${String(action)}`);
      return;
    }
  } else {
    next();
  }
};
```

---

## ⚛️ React Integration 구현 예제

### 1. 기본 React 통합 (ReactBasicsPage.tsx)

```typescript
// React 액션 맵 정의
interface ReactActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  updateMessage: string;
}

// 컨텍스트 생성 (DEBUG 레벨 로깅)
const { Provider, useAction, useActionHandler } = createActionContext<ReactActionMap>({
  logLevel: LogLevel.DEBUG,
});

// 커스텀 훅 - 카운터 로직
function useCounter() {
  const [count, setCount] = useState(0);

  const incrementHandler = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  const decrementHandler = useCallback(() => {
    setCount((prev) => prev - 1);
  }, []);

  const setCountHandler = useCallback((payload: number) => {
    setCount(payload);
  }, []);

  const resetHandler = useCallback(() => {
    setCount(0);
  }, []);

  // 액션 핸들러 등록 (우선순위 1)
  useActionHandler('increment', incrementHandler, { priority: 1 });
  useActionHandler('decrement', decrementHandler, { priority: 1 });
  useActionHandler('setCount', setCountHandler, { priority: 1 });
  useActionHandler('reset', resetHandler, { priority: 1 });

  return { count };
}

// 커스텀 훅 - 로거 로직
function useLogger() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  }, []);

  // 로깅 핸들러 (우선순위 0 - 먼저 실행)
  const incrementLogHandler = useCallback(() => {
    console.log('[TRACE] Logger: Increment action detected');
    addLog('Increment action detected');
  }, [addLog]);

  useActionHandler('increment', incrementLogHandler, { priority: 0 });
  useActionHandler('decrement', () => addLog('Decrement action detected'), { priority: 0 });
  useActionHandler('setCount', (payload: number) => addLog(`SetCount: ${payload}`), { priority: 0 });
  useActionHandler('reset', () => {
    addLog('Reset action detected');
    setLogs([]); // 로그도 리셋
  }, { priority: 0 });

  return { logs };
}

// 액션 디스패치 훅
function useCounterActions() {
  const dispatch = useAction();

  return {
    increment: () => dispatch('increment'),
    decrement: () => dispatch('decrement'),
    setCount: (value: number) => dispatch('setCount', value),
    reset: () => dispatch('reset'),
  };
}

// Container/Presenter 패턴 구현
function Counter() {
  const { count } = useCounter();
  const { increment, decrement, setCount, reset } = useCounterActions();

  return (
    <CounterView
      count={count}
      onIncrement={increment}
      onDecrement={decrement}
      onSetCount={() => setCount(10)}
      onReset={reset}
    />
  );
}

// 순수 뷰 컴포넌트
function CounterView({ count, onIncrement, onDecrement, onSetCount, onReset }) {
  return (
    <div>
      <div>Count: {count}</div>
      <button onClick={onIncrement}>+1</button>
      <button onClick={onDecrement}>-1</button>
      <button onClick={onSetCount}>Set to 10</button>
      <button onClick={onReset}>Reset</button>
    </div>
  );
}

// 메인 페이지 컴포넌트
export function ReactBasicsPage() {
  return (
    <Provider>
      <Counter />
      <Logger />
      <MessageSender />
    </Provider>
  );
}
```

---

## 🏪 Store System 구현 예제

### 1. 기본 Store 사용법 (StoreBasicsPage.tsx)

```typescript
// 기본 Store 생성과 사용
function BasicStoreExample() {
  // 문자열 스토어
  const messageStore = new Store<string>('message', 'Hello World');
  
  // 숫자 스토어 (NumericStore)
  const counterStore = new NumericStore('counter', 0);

  // React와 통합
  const message = useSyncExternalStore(
    messageStore.subscribe.bind(messageStore),
    messageStore.getSnapshot.bind(messageStore)
  );

  const count = useSyncExternalStore(
    counterStore.subscribe.bind(counterStore),
    counterStore.getSnapshot.bind(counterStore)
  );

  // 기본 CRUD 연산
  const updateMessage = (newMessage: string) => {
    messageStore.setValue(newMessage);
  };

  const incrementCounter = () => {
    counterStore.increment(1);
  };

  const updateCounter = (value: number) => {
    counterStore.update((current) => current + value);
  };

  return (
    <div>
      <div>Message: {message}</div>
      <div>Count: {count}</div>
      <button onClick={() => updateMessage('Updated!')}>Update Message</button>
      <button onClick={incrementCounter}>+1</button>
      <button onClick={() => updateCounter(5)}>+5</button>
    </div>
  );
}
```

### 2. 복잡한 Store 시나리오 (StoreFullDemoPage.tsx)

#### Counter with History (Undo/Redo)

```typescript
interface CounterState {
  value: number;
  history: number[];
  historyIndex: number;
}

function CounterDemo() {
  const counterStore = new Store<CounterState>('counter-history', {
    value: 0,
    history: [0],
    historyIndex: 0
  });

  const state = useSyncExternalStore(
    counterStore.subscribe.bind(counterStore),
    counterStore.getSnapshot.bind(counterStore)
  );

  const increment = () => {
    counterStore.update(state => {
      const newValue = state.value + 1;
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newValue);
      
      return {
        value: newValue,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  };

  const undo = () => {
    counterStore.update(state => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          ...state,
          value: state.history[newIndex],
          historyIndex: newIndex
        };
      }
      return state;
    });
  };

  const redo = () => {
    counterStore.update(state => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          ...state,
          value: state.history[newIndex],
          historyIndex: newIndex
        };
      }
      return state;
    });
  };

  return (
    <div>
      <div>Value: {state.value}</div>
      <div>History: {state.history.join(' → ')}</div>
      <button onClick={increment}>+1</button>
      <button onClick={undo} disabled={state.historyIndex === 0}>Undo</button>
      <button onClick={redo} disabled={state.historyIndex === state.history.length - 1}>Redo</button>
    </div>
  );
}
```

#### Theme Store with LocalStorage

```typescript
function ThemeDemo() {
  const themeStore = new Store<'light' | 'dark'>('theme', 'light');

  // LocalStorage와 동기화
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      themeStore.setValue(savedTheme);
    }

    // 스토어 변경을 localStorage에 저장
    const unsubscribe = themeStore.subscribe((theme) => {
      localStorage.setItem('theme', theme);
      document.body.className = `theme-${theme}`;
    });

    return unsubscribe;
  }, []);

  const theme = useSyncExternalStore(
    themeStore.subscribe.bind(themeStore),
    themeStore.getSnapshot.bind(themeStore)
  );

  const toggleTheme = () => {
    themeStore.setValue(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div>
      <div>Current Theme: {theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

#### Shopping Cart with Auto-calculation

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  tax: number;
}

function CartDemo() {
  const cartStore = new Store<CartState>('shopping-cart', {
    items: [],
    total: 0,
    tax: 0.1 // 10% tax
  });

  const cart = useSyncExternalStore(
    cartStore.subscribe.bind(cartStore),
    cartStore.getSnapshot.bind(cartStore)
  );

  // 자동 총합 계산
  useEffect(() => {
    const calculateTotal = () => {
      cartStore.update(state => {
        const subtotal = state.items.reduce(
          (sum, item) => sum + (item.price * item.quantity), 0
        );
        const total = subtotal * (1 + state.tax);
        
        return { ...state, total };
      });
    };

    // 초기 계산
    calculateTotal();

    // 아이템 변경 시 자동 재계산
    const unsubscribe = cartStore.subscribe((state, prevState) => {
      if (state.items !== prevState?.items) {
        calculateTotal();
      }
    });

    return unsubscribe;
  }, []);

  const addItem = (item: Omit<CartItem, 'id'>) => {
    cartStore.update(state => ({
      ...state,
      items: [...state.items, { ...item, id: Date.now().toString() }]
    }));
  };

  const updateQuantity = (id: string, quantity: number) => {
    cartStore.update(state => ({
      ...state,
      items: state.items.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    }));
  };

  const removeItem = (id: string) => {
    cartStore.update(state => ({
      ...state,
      items: state.items.filter(item => item.id !== id)
    }));
  };

  return (
    <div>
      <h3>Shopping Cart</h3>
      {cart.items.map(item => (
        <div key={item.id}>
          <span>{item.name} - ${item.price} x {item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
      <div>Total: ${cart.total.toFixed(2)}</div>
      <button onClick={() => addItem({ name: 'Apple', price: 1.0, quantity: 1 })}>
        Add Apple
      </button>
    </div>
  );
}
```

#### Computed Store (Derived Values)

```typescript
function ComputedStoreDemo() {
  // 기본 스토어들
  const firstNameStore = new Store('firstName', 'John');
  const lastNameStore = new Store('lastName', 'Doe');
  const ageStore = new NumericStore('age', 25);

  // 계산된 값을 위한 스토어
  const computedStore = new Store('computed', {
    fullName: '',
    ageGroup: '',
    initials: ''
  });

  // 의존성 스토어들 구독
  useEffect(() => {
    const updateComputed = () => {
      const firstName = firstNameStore.getSnapshot();
      const lastName = lastNameStore.getSnapshot();
      const age = ageStore.getSnapshot();

      computedStore.setValue({
        fullName: `${firstName} ${lastName}`,
        ageGroup: age < 18 ? 'Minor' : age < 65 ? 'Adult' : 'Senior',
        initials: `${firstName[0]}.${lastName[0]}.`
      });
    };

    // 초기 계산
    updateComputed();

    // 의존성 변경 시 자동 재계산
    const unsubscribes = [
      firstNameStore.subscribe(updateComputed),
      lastNameStore.subscribe(updateComputed),
      ageStore.subscribe(updateComputed)
    ];

    return () => unsubscribes.forEach(fn => fn());
  }, []);

  const firstName = useSyncExternalStore(
    firstNameStore.subscribe.bind(firstNameStore),
    firstNameStore.getSnapshot.bind(firstNameStore)
  );

  const computed = useSyncExternalStore(
    computedStore.subscribe.bind(computedStore),
    computedStore.getSnapshot.bind(computedStore)
  );

  return (
    <div>
      <h3>Computed Values Demo</h3>
      <input 
        value={firstName}
        onChange={(e) => firstNameStore.setValue(e.target.value)}
        placeholder="First Name"
      />
      <div>Full Name: {computed.fullName}</div>
      <div>Age Group: {computed.ageGroup}</div>
      <div>Initials: {computed.initials}</div>
    </div>
  );
}
```

#### Cross-Tab LocalStorage Sync

```typescript
function PersistedStoreDemo() {
  const syncStore = new Store('cross-tab-sync', { message: '', timestamp: 0 });

  useEffect(() => {
    // LocalStorage에서 초기값 로드
    const saved = localStorage.getItem('cross-tab-sync');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        syncStore.setValue(data);
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }

    // 스토어 변경 시 LocalStorage 업데이트
    const unsubscribeStore = syncStore.subscribe((state) => {
      localStorage.setItem('cross-tab-sync', JSON.stringify(state));
    });

    // 다른 탭에서의 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cross-tab-sync' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          syncStore.setValue(data);
        } catch (err) {
          console.error('Failed to sync from storage:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribeStore();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const state = useSyncExternalStore(
    syncStore.subscribe.bind(syncStore),
    syncStore.getSnapshot.bind(syncStore)
  );

  const updateMessage = (message: string) => {
    syncStore.setValue({
      message,
      timestamp: Date.now()
    });
  };

  return (
    <div>
      <h3>Cross-Tab Sync Demo</h3>
      <input 
        value={state.message}
        onChange={(e) => updateMessage(e.target.value)}
        placeholder="Type here (syncs across tabs)"
      />
      <div>Last updated: {new Date(state.timestamp).toLocaleTimeString()}</div>
      <p>Open this page in multiple tabs to see real-time sync!</p>
    </div>
  );
}
```

#### Store Registry Viewer

```typescript
function StoreRegistryViewer() {
  const [registryData, setRegistryData] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    // StoreRegistry에서 모든 스토어 정보 수집
    const updateRegistry = () => {
      const allStores = new Map();
      
      // 현재 페이지의 모든 스토어 수집
      // (실제 구현에서는 StoreRegistry.getAllStores() 같은 메소드 사용)
      
      setRegistryData(allStores);
    };

    const interval = setInterval(updateRegistry, 1000);
    updateRegistry();

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Store Registry Monitor</h3>
      <div>
        {Array.from(registryData.entries()).map(([id, store]) => (
          <div key={id}>
            <strong>{id}</strong>: {JSON.stringify(store.getSnapshot())}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Store Lifecycle Management

```typescript
function StoreLifecycleDemo() {
  const [dynamicStores, setDynamicStores] = useState<Map<string, Store<any>>>(new Map());

  const createStore = (id: string, initialValue: any) => {
    const newStore = new Store(id, initialValue);
    
    setDynamicStores(prev => new Map(prev.set(id, newStore)));
    
    // 자동 정리를 위한 타이머 (5초 후)
    setTimeout(() => {
      destroyStore(id);
    }, 5000);
  };

  const destroyStore = (id: string) => {
    const store = dynamicStores.get(id);
    if (store) {
      // 모든 구독 해제 (실제로는 store.destroy() 같은 메소드 필요)
      setDynamicStores(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }
  };

  return (
    <div>
      <h3>Dynamic Store Lifecycle</h3>
      <button onClick={() => createStore(`store-${Date.now()}`, Math.random())}>
        Create Random Store (auto-destroy in 5s)
      </button>
      <div>
        Active Stores: {dynamicStores.size}
        {Array.from(dynamicStores.keys()).map(id => (
          <div key={id}>
            {id}
            <button onClick={() => destroyStore(id)}>Destroy</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🚀 Action Guard 구현 예제

### Debouncing & Throttling

```typescript
// Action Guard 시스템 (미래 구현)
interface ActionGuardOptions {
  debounce?: number;
  throttle?: number;
  block?: boolean;
}

function useActionGuard() {
  const createGuardedAction = (
    action: string, 
    options: ActionGuardOptions
  ) => {
    if (options.debounce) {
      return debounce((payload: any) => {
        dispatch(action, payload);
      }, options.debounce);
    }
    
    if (options.throttle) {
      return throttle((payload: any) => {
        dispatch(action, payload);
      }, options.throttle);
    }
    
    return (payload: any) => dispatch(action, payload);
  };

  return { createGuardedAction };
}

// 사용 예제
function SearchComponent() {
  const { createGuardedAction } = useActionGuard();
  
  const debouncedSearch = createGuardedAction('search', { debounce: 300 });
  const throttledScroll = createGuardedAction('scroll', { throttle: 100 });

  return (
    <div>
      <input onChange={(e) => debouncedSearch(e.target.value)} />
      <div onScroll={(e) => throttledScroll(e.scrollTop)}>
        {/* scrollable content */}
      </div>
    </div>
  );
}
```

---

## 📊 성능 최적화 패턴

### Batch Processing

```typescript
// 대량 액션 배치 처리 (미래 구현)
class BatchProcessor {
  private queue: Array<{ action: string; payload: any }> = [];
  private processing = false;

  addToQueue(action: string, payload: any) {
    this.queue.push({ action, payload });
    
    if (!this.processing) {
      this.processBatch();
    }
  }

  private async processBatch() {
    this.processing = true;
    
    const batch = this.queue.splice(0, 50); // 50개씩 처리
    
    await Promise.all(
      batch.map(({ action, payload }) => 
        actionRegister.dispatch(action, payload)
      )
    );
    
    if (this.queue.length > 0) {
      setTimeout(() => this.processBatch(), 0);
    } else {
      this.processing = false;
    }
  }
}
```

---

## 🔧 유틸리티 함수들

### 공통 헬퍼 함수

```typescript
// 디바운스 함수
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// 스로틀 함수
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// 로그 엔트리 생성
function createLogEntry(type: string, message: string, priority?: number) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
    priority
  };
}

// 페이로드 검증
function validatePayload(payload: any, schema: any): boolean {
  // 간단한 검증 로직
  if (schema.required && !payload) return false;
  if (schema.type && typeof payload !== schema.type) return false;
  return true;
}
```

---

## 📚 타입 정의 모음

### 공통 타입 정의

```typescript
// 기본 액션 맵
interface ActionPayloadMap {
  [key: string]: any;
}

// 로그 엔트리
interface LogEntry {
  id: string;
  timestamp: string;
  type: 'action' | 'middleware' | 'error' | 'interceptor';
  message: string;
  priority?: number;
}

// 핸들러 옵션
interface HandlerOptions {
  priority?: number;
  condition?: (payload: any) => boolean;
  validation?: (payload: any) => boolean;
  middleware?: boolean;
  once?: boolean;
}

// 컨트롤러 인터페이스
interface ActionController {
  next(): void;
  abort(): void;
  modifyPayload(payload: any): void;
  jumpToPriority?(priority: number): void;
}

// 미들웨어 타입
type Middleware<T extends ActionPayloadMap> = (
  action: keyof T,
  payload: T[keyof T],
  next: () => void | Promise<void>
) => void | Promise<void>;
```

---

## 🎯 구현 완성도 체크리스트

### ✅ 완료된 기능들
- [x] 기본 ActionRegister 사용법
- [x] 우선순위 기반 핸들러 실행
- [x] React Context 통합
- [x] Container/Presenter 패턴
- [x] 기본 Store 시스템
- [x] 복잡한 Store 시나리오 (8가지)
- [x] 비동기 액션 체이닝
- [x] 조건부 액션 실행
- [x] 에러 처리 패턴
- [x] LocalStorage 연동
- [x] Cross-tab 동기화
- [x] 동적 Store 생성/해제

### 🚧 부분 완료된 기능들
- [x] 미들웨어 시뮬레이션 (실제 구현 대기)
- [x] 파이프라인 제어 (abort, modifyPayload 구현 대기)

### ❌ 미구현 기능들
- [ ] Action Guard (debouncing, throttling)
- [ ] 실행 모드 (parallel, race, sequential)
- [ ] 대량 액션 배치 처리
- [ ] 성능 메트릭 시스템
- [ ] Jotai 통합

이 문서는 실제 구현된 모든 코드 예제를 포함하고 있으며, 개발자가 Context Action 라이브러리를 효과적으로 활용할 수 있도록 완전한 참고 자료를 제공합니다.