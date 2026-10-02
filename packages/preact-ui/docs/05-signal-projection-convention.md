# Preact Signals 기반 관심사 분리 코딩 컨벤션 및 훅 가이드

이 문서는 Preact와 `@preact/signals` 환경에서 **Context-Layered Architecture(ttsc 기반 6계층 구조)**를 적용할 때의 **프로젝션 훅(Projection Hooks)**과 **비즈니스 로직 훅(Business Logic Hooks)** 분리 규칙 및 코딩 컨벤션을 정의합니다.

---

## 1. 배경: React 렌더링 vs Preact Signals 렌더링

| 비교 항목 | React (`@context-action/react`) | Preact Signals (`@context-action/preact`) |
|---|---|---|
| **상태 소비 방식** | `useStoreValue(store)` | `useOrderProjection()` → `ReadonlySignal<T>` |
| **갱신 단위** | 컴포넌트 단위 가상 DOM 리렌더링 | **DOM 텍스트 노드 단위 Fine-grained 직접 갱신** |
| **파생 상태 최적화** | `useMemo` 또는 Selector | `computed(() => ...)` 자동 종속성 추적 |
| **View 책임** | 상태 구독 + 디스패치 호출 | **Signal의 DOM 바인딩 + Typed 액션 트리거** |

React에서는 상태가 변경되면 컴포넌트 함수 전체가 재실행되므로 메모이제이션(`useMemo`, `useCallback`)에 세심한 주의가 필요합니다. 반면 **Preact Signals**에서는 JSX 노드에 Signal을 직접 전달할 경우 (`<output>{countSignal}</output>`), 컴포넌트 렌더 함수를 다시 실행하지 않고 해당 DOM 텍스트 노드만 O(1)로 직접 갱신합니다.

따라서 Preact 환경에서는 상태를 단순 값(Value)으로 풀지 않고, **읽기 전용 파생 신호를 제공하는 프로젝션 훅**과 **사용자 인텐트를 처리하는 비즈니스 로직 훅**으로 명확히 분리해야 Signals의 성능 이점을 극대화할 수 있습니다.

---

## 2. Context-Layered 6계층 구조와 역할

```text
packages/preact-ui/examples/projected-order/
├── business/               # [1] 순수 비즈니스 로직 (FSM, 도메인 검증, 계산 공식)
│   ├── order-types.ts
│   ├── order-validation.ts
│   ├── order-calculations.ts
│   └── order-state-machine.ts
│
├── contexts/               # [2] 컨텍스트 주입 계층 (DispatchContext, SourceContext)
│   └── order-contexts.tsx
│
├── handlers/               # [3] 액션 파이프라인 (ActionRegister 핸들러, 모델 오케스트레이션)
│   └── order-handlers.ts
│
├── projections/            # [4] 프로젝션 훅 (Signal 기반 computed 파생 뷰모델)
│   └── use-order-projection.ts
│
├── actions/                # [5] 비즈니스 로직 훅 (Typed Action Intent API)
│   └── use-order-actions.ts
│
└── views/                  # [6] 프리젠테이션 View (DOM 시그널 바인딩 + UI 로컬 상태)
    ├── OrderSummaryView.tsx
    └── OrderWorkspaceView.tsx
```

---

## 3. 프로젝션 훅 (Projection Hooks) 컨벤션

### 목적
도메인 원본 상태 신호(`ReadonlySignal<State>`)로부터 View가 필요로 하는 화면 단위의 파생 데이터(Derived/Computed Slice)를 계산하고, 불필요한 재계산을 방지하며 읽기 전용 신호(`ReadonlySignal<T>`)로 투영(Projection)합니다.

### 명명 및 시그니처 규칙
- **파일명**: `projections/use-<domain>-projection.ts`
- **함수명**: `use<Domain>Projection()`
- **반환 타입**: 모든 파생 필드는 `ReadonlySignal<T>` 타입이어야 합니다.

```ts
export interface OrderProjection {
  customerNameSignal: ReadonlySignal<string>;
  itemsSignal: ReadonlySignal<readonly OrderItem[]>;
  summarySignal: ReadonlySignal<OrderSummary>;
  isSubmittingSignal: ReadonlySignal<boolean>;
  canSubmitSignal: ReadonlySignal<boolean>;
  getFieldError: (field: string) => ReadonlySignal<string | undefined>;
}

export function useOrderProjection(): OrderProjection {
  const sourceSignal = OrderSourceContext.useSourceSignal();

  // useProjection(sourceSignal, selector)을 활용하여 미세 단위 computed 생성
  const customerNameSignal = useProjection(sourceSignal, (s) => s.draft.customerName);
  const itemsSignal = useProjection(sourceSignal, (s) => s.draft.items);
  const summarySignal = useProjection(sourceSignal, (s) => calculateOrderSummary(s.draft.items));
  const isSubmittingSignal = useProjection(sourceSignal, (s) => s.submission.phase === 'submitting');
  const canSubmitSignal = useProjection(
    sourceSignal,
    (s) => s.draft.items.length > 0 && s.submission.phase !== 'submitting',
  );

  const getFieldError = (field: string) =>
    useComputed(() => sourceSignal.value.validationIssues.find((i) => i.field === field)?.message);

  return {
    customerNameSignal,
    itemsSignal,
    summarySignal,
    isSubmittingSignal,
    canSubmitSignal,
    getFieldError,
  };
}
```

### 프로젝션 훅 핵심 규칙
1. **순수성 유지**: 프로젝션 훅 내부에서 어떠한 `dispatch`나 부수 효과(side-effect)도 일으키지 않습니다.
2. **Fine-grained 분할**: 화면 전체를 하나의 커다란 객체 Signal로 반환하지 않고, 독립적으로 변경되는 필드 단위(수량, 상태, 에러 등)로 세분화된 Signal을 반환합니다.
3. **도메인 계산 격리**: 할인율 계산, 합계 포맷팅 등의 로직은 훅 내부에 직접 작성하지 않고 `business/*.ts`의 순수 함수(`calculateOrderSummary`)를 호출합니다.

---

## 4. 비즈니스 로직 훅 (Business Logic / Action Hooks) 컨벤션

### 목적
UI의 사용자 인터랙션(버튼 클릭, 폼 제출, 값 입력 등)을 처리하기 위해, ActionDispatcher를 래핑하여 강타입(Strongly-typed) 비즈니스 인텐트 메서드를 제공합니다.

### 명명 및 시그니처 규칙
- **파일명**: `actions/use-<domain>-actions.ts`
- **함수명**: `use<Domain>Actions()` 또는 `use<Domain>Workflow()`
- **반환 타입**: 호출 가능한 시맨틱 메서드 집합 (`Promise<void>` 또는 `void`).

```ts
export interface OrderActionsHook {
  setCustomerName: (name: string) => Promise<void>;
  addItem: (item: OrderItem) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  submitOrder: () => Promise<void>;
  resetDraft: () => Promise<void>;
}

export function useOrderActions(): OrderActionsHook {
  const dispatch = OrderDispatchContext.useDispatch();

  const setCustomerName = useCallback(
    (name: string) => dispatch('updateCustomerName', { name }),
    [dispatch],
  );

  const addItem = useCallback(
    (item: OrderItem) => dispatch('addItem', { item }),
    [dispatch],
  );

  const submitOrder = useCallback(() => dispatch('submitOrder'), [dispatch]);
  const resetDraft = useCallback(() => dispatch('resetDraft'), [dispatch]);

  return {
    setCustomerName,
    addItem,
    submitOrder,
    resetDraft,
    // ...
  };
}
```

### 비즈니스 로직 훅 핵심 규칙
1. **Raw Action Type 차단**: View 컴포넌트는 `dispatch('updateCustomerName', { ... })`와 같은 문자열 기반 raw dispatch를 절대 직접 호출하지 않습니다.
2. **의도 중심 네이밍**: `dispatchAddItem` 대신 `addItem`, `triggerSubmit` 대신 `submitOrder`와 같이 비즈니스 행위를 직접 나타내는 이름을 사용합니다.
3. **비즈니스 상태 변경 캡슐화**: 비동기 호출 후의 후속 조치나 재시도 로직을 훅 또는 핸들러 레벨에서 은닉합니다.

---

## 5. 프리젠테이션 뷰 (Presentation Views) 컨벤션

View 컴포넌트는 오직 **프로젝션 훅의 Signals**와 **비즈니스 로직 훅의 액션 함수**를 소비하여 화면을 구성합니다.

```tsx
export function OrderWorkspaceView({ idPrefix }: { idPrefix: string }) {
  // The adapter supplies a stable, mount-unique prefix. Do not derive public
  // light-DOM ids from a root-local useId() value.
  // [1] 프로젝션 훅: 읽기 전용 Signals
  const { summarySignal, canSubmitSignal, isSubmittingSignal } = useOrderProjection();

  // [2] 비즈니스 로직 훅: 사용자 동작 핸들러
  const { addItem, submitOrder } = useOrderActions();

  // [3] Tier 3: 순수 UI 로컬 상태 (Waiver 대상: 모달, 아코디언, 드래프트 입력)
  const [isLogOpen, setIsLogOpen] = useState(false);

  return (
    <div>
      {/* Preact의 Fine-grained Signal DOM 직결 바인딩 */}
      <span>총액: <output>{summarySignal.value.formattedGrandTotal}</output></span>

      <button
        type="button"
        disabled={!canSubmitSignal.value}
        onClick={() => void submitOrder()}
      >
        {isSubmittingSignal.value ? '주문 중...' : '주문 완료'}
      </button>

      {/* Tier 3 UI 전용 로컬 상태 토글 */}
      <button onClick={() => setIsLogOpen(!isLogOpen)}>로그 보기</button>
    </div>
  );
}
```

### Tier 3 Volatile Presentation State 면제 (Waiver) 원칙
- **해당 항목**: 모달/팝오버 열림 여부(`isOpen`), 탭 인덱스(`activeTab`), 임시 입력 필드(`textInput`), 포커스/호버 상태 등
- **관리 위치**: 반드시 컴포넌트 로컬 `useState`로만 관리하며, 도메인 ActionRegister나 Store에 등록하지 않습니다.
- **근거**: [CA-SPEC-EVIDENCE-001](./04-validation.md) 거버넌스에 따라 화면 전용 휘발성 상태는 TypeSpec 모델링 및 Evidence 추적 대상에서 공식 면제됩니다.

---

## 6. 안티패턴 및 체크리스트

| 안티패턴 (Bad) | 올바른 패턴 (Good) | 이유 |
|---|---|---|
| View 내에서 `dispatch('addItem', { item })` 직접 호출 | `useOrderActions()`의 `addItem(item)` 호출 | Action 타입 오타 방지 및 View와 Action 결합도 분리 |
| View 렌더 바디에서 `items.reduce(...)` 매번 계산 | `useOrderProjection()`의 `summarySignal` 소비 | 불필요한 재계산 방지 및 Signal DOM 직결 최적화 |
| 프로젝션 훅 안에서 `dispatch()` 호출 | 프로젝션 훅은 순수 읽기 전용으로만 구성 | 단방향 데이터 흐름 위반 및 예측 불가능한 렌더 루프 방지 |
| 모달 개폐 `isModalOpen`을 도메인 Action/Store에 등록 | View 컴포넌트의 로컬 `useState(false)`로 격리 | 상태 계층화(Tier 3 Waiver) 준수 및 비즈니스 모델 오염 방지 |
