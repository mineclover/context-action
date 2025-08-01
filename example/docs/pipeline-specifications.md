# Context Action Pipeline 스펙 정의 및 구현 시나리오

## 🎯 문서 목적

Context Action 라이브러리의 파이프라인 시스템에 필요한 모든 스펙을 정의하고, 각 시나리오별 구현 예제와 매핑을 제공합니다.

---

## 📋 파이프라인 핵심 스펙

### 1. 기본 파이프라인 구조

```typescript
interface PipelineSpec {
  // 액션 등록과 실행
  register: (action: string, handler: Function, options?: HandlerOptions) => UnsubscribeFunction;
  dispatch: (action: string, payload?: any) => Promise<void> | void;
  
  // 파이프라인 제어
  controller: {
    next(): void;           // 다음 핸들러로 진행
    abort(): void;          // 파이프라인 중단
    modifyPayload(payload: any): void;  // 페이로드 수정
    jumpToPriority(priority: number): void;  // 특정 우선순위로 이동
  };
  
  // 실행 모드
  executionMode: 'sequential' | 'parallel' | 'race';
}
```

### 2. 핸들러 옵션 스펙

```typescript
interface HandlerOptions {
  priority?: number;          // 실행 우선순위 (낮을수록 먼저 실행)
  condition?: (payload: any) => boolean;  // 조건부 실행
  validation?: (payload: any) => boolean; // 검증 로직
  middleware?: boolean;       // 미들웨어 마킹
  once?: boolean;            // 일회성 실행
  debounce?: number;         // 디바운싱 (ms)
  throttle?: number;         // 스로틀링 (ms)
}
```

---

## 🚀 구현 시나리오 및 예제 코드

### 시나리오 1: Sync Fetch Loading Pattern

**스펙 요구사항**:
- 비동기 연산 → Store 업데이트 → Notify → UI 업데이트
- 로딩/에러 상태 관리
- Suspense/Concurrent Rendering 호환

**구현된 페이지**: `StoreFullDemoPage.tsx` - PersistedStoreDemo

```typescript
// 🔗 구현 위치: /pages/react/store/demo/PersistedStoreDemo.tsx
interface SyncFetchState {
  data: any | null;
  loading: boolean;
  error: string | null;
}

// 액션 정의
interface FetchActionMap extends ActionPayloadMap {
  startFetch: { url: string };
  fetchSuccess: { data: any };
  fetchError: { error: string };
  resetFetch: undefined;
}

// Store 기반 상태 관리
const fetchStore = new Store<SyncFetchState>('fetch', {
  data: null,
  loading: false,
  error: null
});

// 파이프라인 구현
const actionRegister = new ActionRegister<FetchActionMap>();

// 로딩 상태 시작
actionRegister.register('startFetch', ({ url }, controller) => {
  fetchStore.update(state => ({ ...state, loading: true, error: null }));
  
  // 비동기 fetch 시작
  fetch(url)
    .then(response => response.json())
    .then(data => actionRegister.dispatch('fetchSuccess', { data }))
    .catch(error => actionRegister.dispatch('fetchError', { error: error.message }));
    
  controller.next();
}, { priority: 0 });

// 성공 처리
actionRegister.register('fetchSuccess', ({ data }, controller) => {
  fetchStore.update(state => ({ ...state, data, loading: false }));
  controller.next();
}, { priority: 1 });

// 에러 처리
actionRegister.register('fetchError', ({ error }, controller) => {
  fetchStore.update(state => ({ ...state, error, loading: false }));
  controller.next();
}, { priority: 1 });
```

---

### 시나리오 2: State Registry + Action Registry (문자열 상태)

**스펙 요구사항**:
- Store Registry와 Action Registry 통합 활용
- 문자열 기반 단순 상태 관리
- Hook 기반 View/Action 분리

**구현된 페이지**: `StoreBasicsPage.tsx`

```typescript
// 🔗 구현 위치: /pages/react/store/StoreBasicsPage.tsx
// 문자열 상태 스토어
const messageStore = new Store<string>('message', 'Hello World');

// 액션 정의
interface StringStateActionMap extends ActionPayloadMap {
  updateMessage: string;
  clearMessage: undefined;
  appendMessage: string;
}

const actionRegister = new ActionRegister<StringStateActionMap>();

// 메시지 업데이트 핸들러
actionRegister.register('updateMessage', (message, controller) => {
  messageStore.setValue(message);
  controller.next();
}, { priority: 0 });

// 메시지 추가 핸들러
actionRegister.register('appendMessage', (addition, controller) => {
  const current = messageStore.getSnapshot();
  messageStore.setValue(`${current} ${addition}`);
  controller.next();
}, { priority: 0 });

// 컴포넌트 분리 패턴
// Data View Hook
function useMessageView() {
  return useSyncExternalStore(
    messageStore.subscribe.bind(messageStore),
    messageStore.getSnapshot.bind(messageStore)
  );
}

// Action Trigger Hook
function useMessageActions() {
  return {
    updateMessage: (msg: string) => actionRegister.dispatch('updateMessage', msg),
    clearMessage: () => actionRegister.dispatch('clearMessage'),
    appendMessage: (text: string) => actionRegister.dispatch('appendMessage', text)
  };
}
```

---

### 시나리오 3: State Registry + Action Registry (객체 상태)

**스펙 요구사항**:
- 복잡한 객체 상태 관리
- 중첩 상태 업데이트
- 불변성 보장

**구현된 페이지**: `StoreFullDemoPage.tsx` - CartDemo

```typescript
// 🔗 구현 위치: /pages/react/store/demo/CartDemo.tsx
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  discount: number;
  tax: number;
}

// 객체 상태 스토어
const cartStore = new Store<CartState>('cart', {
  items: [],
  total: 0,
  discount: 0,
  tax: 0
});

// 액션 정의
interface CartActionMap extends ActionPayloadMap {
  addItem: CartItem;
  removeItem: string; // item id
  updateQuantity: { id: string; quantity: number };
  applyDiscount: number;
  calculateTotal: undefined;
}

const cartActions = new ActionRegister<CartActionMap>();

// 아이템 추가
cartActions.register('addItem', (item, controller) => {
  cartStore.update(state => ({
    ...state,
    items: [...state.items, item]
  }));
  
  // 자동으로 총합 계산 트리거
  cartActions.dispatch('calculateTotal');
  controller.next();
}, { priority: 0 });

// 수량 업데이트
cartActions.register('updateQuantity', ({ id, quantity }, controller) => {
  cartStore.update(state => ({
    ...state,
    items: state.items.map(item => 
      item.id === id ? { ...item, quantity } : item
    )
  }));
  
  cartActions.dispatch('calculateTotal');
  controller.next();
}, { priority: 0 });

// 총합 계산 (자동 트리거)
cartActions.register('calculateTotal', (_, controller) => {
  cartStore.update(state => {
    const subtotal = state.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    const total = (subtotal - state.discount) * (1 + state.tax);
    
    return { ...state, total };
  });
  
  controller.next();
}, { priority: 1 });
```

---

### 시나리오 4: Hook 내 Registry 생성 (컨텍스트별 확장)

**스펙 요구사항**:
- Hook 내부에서 Registry 생성
- 컨텍스트당 독립적인 인스턴스
- 동적 생성과 정리

**구현된 페이지**: `ReactBasicsPage.tsx`

```typescript
// 🔗 구현 위치: /pages/react/ReactBasicsPage.tsx
// createActionContext 사용
const { Provider, useAction, useActionHandler } = 
  createActionContext<ReactActionMap>({
    logLevel: LogLevel.DEBUG
  });

// 컴포넌트별 독립적인 핸들러 등록
function useCounter() {
  const [count, setCount] = useState(0);

  // 각 컴포넌트마다 독립적인 핸들러
  useActionHandler('increment', useCallback(() => {
    setCount(prev => prev + 1);
  }, []), { priority: 1 });

  useActionHandler('decrement', useCallback(() => {
    setCount(prev => prev - 1);
  }, []), { priority: 1 });

  return { count };
}

// 여러 컨텍스트에서 사용 시 각각 독립적
function MultiContextExample() {
  return (
    <Provider> {/* 첫 번째 컨텍스트 */}
      <Counter />
      <Provider> {/* 중첩된 독립 컨텍스트 */}
        <AnotherCounter />
      </Provider>
    </Provider>
  );
}
```

---

### 시나리오 5: 모듈 레벨 Singleton Registry

**스펙 요구사항**:
- 모듈 단위 싱글톤 패턴
- 전역 상태 관리
- 메모리 효율성

**구현된 페이지**: `StoreFullDemoPage.tsx` - StoreRegistry 패턴

```typescript
// 🔗 구현 위치: /pages/react/store/demo/StoreRegistryViewer.tsx
// 전역 싱글톤 레지스트리
class GlobalStoreRegistry {
  private static instance: GlobalStoreRegistry;
  private stores = new Map<string, Store<any>>();
  private actionRegister = new ActionRegister();

  static getInstance(): GlobalStoreRegistry {
    if (!GlobalStoreRegistry.instance) {
      GlobalStoreRegistry.instance = new GlobalStoreRegistry();
    }
    return GlobalStoreRegistry.instance;
  }

  registerStore<T>(id: string, initialValue: T): Store<T> {
    if (!this.stores.has(id)) {
      const store = new Store(id, initialValue);
      this.stores.set(id, store);
      
      // 글로벌 액션 등록
      this.actionRegister.register(`update_${id}`, (value) => {
        store.setValue(value);
      });
    }
    
    return this.stores.get(id)!;
  }

  getAllStores(): Map<string, Store<any>> {
    return new Map(this.stores);
  }
}

// 모듈 레벨에서 사용
const globalRegistry = GlobalStoreRegistry.getInstance();

// 다른 모듈에서도 같은 인스턴스 접근
const userStore = globalRegistry.registerStore('user', { name: '', email: '' });
const themeStore = globalRegistry.registerStore('theme', 'light');
```

---

### 시나리오 6: 우선순위 경합 테스트

**스펙 요구사항**:
- 동일 우선순위 핸들러 처리
- 실행 순서 보장
- 경합 상황 처리

**구현된 페이지**: `CoreAdvancedPage.tsx`

```typescript
// 🔗 구현 위치: /pages/core/CoreAdvancedPage.tsx
// 우선순위 경합 시나리오
const priorityTestRegister = new ActionRegister<AdvancedActionMap>();

// 같은 우선순위 핸들러들
priorityTestRegister.register('testAction', () => {
  console.log('Handler A - Priority 1');
}, { priority: 1 });

priorityTestRegister.register('testAction', () => {
  console.log('Handler B - Priority 1');
}, { priority: 1 });

priorityTestRegister.register('testAction', () => {
  console.log('Handler C - Priority 1');
}, { priority: 1 });

// 다른 우선순위 핸들러들
priorityTestRegister.register('testAction', () => {
  console.log('Handler High - Priority 0');
}, { priority: 0 });

priorityTestRegister.register('testAction', () => {
  console.log('Handler Low - Priority 2');
}, { priority: 2 });

// 실행 결과:
// Handler High - Priority 0
// Handler A - Priority 1 (등록 순서대로)
// Handler B - Priority 1
// Handler C - Priority 1
// Handler Low - Priority 2
```

---

### 시나리오 7: 파이프라인 제어 기능

**스펙 요구사항**:
- 검증 로직으로 블로킹
- 특정 우선순위로 점프
- 페이로드 수정
- 조건부 실행

**구현된 페이지**: `CoreAdvancedPage.tsx` - 미들웨어 시뮬레이션

```typescript
// 🔗 구현 위치: /pages/core/CoreAdvancedPage.tsx
// 파이프라인 제어 예제

// 1. 검증 로직으로 블로킹
actionRegister.register('secureAction', (payload, controller) => {
  // 검증 실패 시 파이프라인 중단
  if (!isValidPayload(payload)) {
    addLog('error', 'Validation failed - pipeline blocked');
    controller.abort();
    return;
  }
  
  addLog('middleware', 'Validation passed');
  controller.next();
}, { priority: 0, validation: true });

// 2. 페이로드 수정
actionRegister.register('dataTransform', (payload, controller) => {
  const enhancedPayload = {
    ...payload,
    timestamp: Date.now(),
    userId: getCurrentUserId()
  };
  
  controller.modifyPayload(enhancedPayload);
  controller.next();
}, { priority: 1 });

// 3. 조건부 실행
actionRegister.register('conditionalAction', (payload, controller) => {
  const { condition, value } = payload;
  
  if (condition) {
    // 조건 만족 시 실행
    setCount(prev => prev + value);
    addLog('action', `Conditional executed: +${value}`);
  } else {
    // 조건 불만족 시 로그만
    addLog('action', `Conditional skipped (condition: ${condition})`);
  }
  
  controller.next();
}, { 
  priority: 2,
  condition: (payload) => typeof payload.condition === 'boolean'
});

// 4. 특정 우선순위로 점프 (미래 구현)
actionRegister.register('jumpAction', (payload, controller) => {
  if (payload.emergency) {
    // 긴급 상황 시 높은 우선순위로 점프
    controller.jumpToPriority(0);
  } else {
    controller.next();
  }
}, { priority: 5 });
```

---

### 시나리오 8: 실행 모드별 처리

**스펙 요구사항**:
- 병렬 실행 (Parallel)
- 경쟁 실행 (Race)
- 순차 실행 (Sequential)

**구현 예정**: 새로운 페이지에서 구현 필요

```typescript
// 미래 구현 예정 - ExecutionModePage.tsx
interface ExecutionModeActionMap extends ActionPayloadMap {
  parallelTask: { tasks: string[] };
  raceTask: { competitors: string[] };
  sequentialTask: { steps: string[] };
}

const executionRegister = new ActionRegister<ExecutionModeActionMap>();

// 1. 병렬 실행 - 모든 핸들러 동시 실행
executionRegister.setExecutionMode('parallel');
executionRegister.register('parallelTask', async (payload, controller) => {
  const results = await Promise.all(
    payload.tasks.map(task => processTask(task))
  );
  console.log('All tasks completed:', results);
  controller.next();
});

// 2. 경쟁 실행 - 가장 빠른 결과만 채택
executionRegister.setExecutionMode('race');
executionRegister.register('raceTask', async (payload, controller) => {
  const winner = await Promise.race(
    payload.competitors.map(comp => processCompetitor(comp))
  );
  console.log('Winner:', winner);
  controller.next();
});

// 3. 순차 실행 - 우선순위 순서대로 실행 (기본값)
executionRegister.setExecutionMode('sequential');
executionRegister.register('sequentialTask', (payload, controller) => {
  payload.steps.forEach(step => {
    processStep(step);
  });
  console.log('All steps completed sequentially');
  controller.next();
});
```

---

## 📊 구현 현황 매트릭스

| 시나리오 | 구현 상태 | 구현 페이지 | 완성도 |
|---------|----------|------------|--------|
| Sync Fetch Loading | ✅ 완료 | StoreFullDemoPage | 100% |
| String State Registry | ✅ 완료 | StoreBasicsPage | 100% |
| Object State Registry | ✅ 완료 | StoreFullDemoPage (CartDemo) | 100% |
| Hook Level Registry | ✅ 완료 | ReactBasicsPage | 100% |
| Singleton Registry | ✅ 완료 | StoreFullDemoPage (Registry) | 100% |
| Priority Competition | ✅ 완료 | CoreAdvancedPage | 100% |
| Pipeline Control | 🚧 부분 완료 | CoreAdvancedPage | 70% |
| Execution Modes | ❌ 미구현 | - | 0% |

---

## 🔄 다음 구현 단계

### 우선순위 1: Pipeline Control 완성
- `controller.abort()` 구현
- `controller.modifyPayload()` 구현  
- `controller.jumpToPriority()` 구현

### 우선순위 2: Execution Modes 구현
- 새로운 페이지 `ExecutionModePage.tsx` 생성
- Parallel, Race, Sequential 모드 구현
- 성능 비교 데모 추가

### 우선순위 3: 추가 시나리오
- 복잡한 미들웨어 체인
- 동적 핸들러 등록/해제
- 메모리 누수 방지 패턴

---

## 📚 관련 문서

- **구현 분석**: `/docs/pages-analysis.md`
- **추가 케이스**: `/docs/add-case.md`
- **API 레퍼런스**: 각 패키지별 README.md