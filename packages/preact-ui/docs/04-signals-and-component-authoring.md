# 04. Signals 프로젝션 및 컴포넌트 작성 가이드 (Signals & Component Authoring)

이 문서는 `@context-action/preact`의 Signals 기반 Context-Layered 6계층 구조와 `@context-action/preact-ui`를 활용한 `<template>` 아일랜드 및 Web Component 작성 표준을 통합하여 정의합니다.

---

## 4.1 패키지 역할 분담과 Context-Layered 6계층 구조

`packages/preact`는 Core `ActionDispatcher` 주입과 `ReadableSource` → `ReadonlySignal` 구독을 담당하고, `packages/preact-ui`는 DOM 소유권과 mount/teardown/Custom Element shell을 담당합니다.

```text
ActionRegister (Host 소유)
       ↓ dispatcher
Preact Dispatch Provider → use<Domain>Actions (Semantic Intent Hook)
                            ↓
                         Core Handler (Business Logic)
                            ↓
Domain Source → connectSourceSignal → use<Domain>Projection (ReadonlySignal)
                                           ↓
                                      Preact View / Custom Element Shell
```

### 표준 폴더 구조 (Reference: `examples/projected-order/` & `examples/layer-panel/`)

```text
projected-order/
├── business/               # [1] 순수 비즈니스 로직 (FSM, 도메인 검증, 계산 공식 — DOM/Preact 무의존)
├── contexts/               # [2] 컨텍스트 주입 계층 (createDispatchContext, createSourceContext)
├── handlers/               # [3] 액션 파이프라인 (ActionRegister 핸들러 및 모델 오케스트레이션)
├── projections/            # [4] 프로젝션 훅 (use<Domain>Projection — ReadonlySignal 슬라이스)
├── actions/                # [5] 비즈니스 액션 훅 (use<Domain>Actions — 강타입 인텐트 메서드)
├── views/                  # [6] 프레젠테이션 View (Signal 직접 바인딩 + Tier 3 로컬 UI 상태)
├── order-contract.ts       # 외부 소비자용 OOP Handle / Snapshot / Event 계약 및 createElementFacade
├── order-session.ts        # Connection Session 생명주기 및 이벤트 발행 어댑터
├── order-element.tsx       # <order-workspace> definePreactElement 등록 쉘
└── mount-order-workspace.tsx # Light-DOM / <template> 마운트 어댑터
```

단순 위젯(`layer-panel` 등)은 `component.contract.md` + `public.ts` + `internal/{controller,session,View}.ts` + `mount.ts` + `define.ts` 형태로 경량화할 수 있습니다. ([R1](references.md#r1))

---

## 4.2 프로젝션 훅(`use<Domain>Projection`)과 액션 훅(`use<Domain>Actions`) 분리

### 1) 프로젝션 훅 (`projections/use-<domain>-projection.ts`)
- **목적**: 도메인 원본 신호(`ReadonlySignal<State>`)로부터 화면 단위의 파생 데이터를 계산하여 `ReadonlySignal<T>` 필드로 반환합니다.
- **규칙**:
  1. **순수성**: 내부에서 `dispatch`나 부수 효과를 절대 실행하지 않습니다.
  2. **Fine-grained 분할**: 화면 전체를 단일 객체로 묶지 않고 독립적으로 갱신되는 필드 단위로 세분화합니다.
  3. **조기 연결**: `connectSourceSignal(source)`는 컴포넌트 렌더 함수 내부가 아니라 호스트/세션 부트스트랩 시점에 생성하고 종료 시 `dispose()`합니다. ([R2](references.md#r2))

```ts
export function useOrderProjection(): OrderProjection {
  const sourceSignal = OrderSourceContext.useSourceSignal();
  return {
    customerNameSignal: useProjection(sourceSignal, (s) => s.draft.customerName),
    itemsSignal: useProjection(sourceSignal, (s) => s.draft.items),
    summarySignal: useProjection(sourceSignal, (s) => calculateOrderSummary(s.draft.items)),
    canSubmitSignal: useProjection(
      sourceSignal,
      (s) => s.draft.items.length > 0 && s.submission.phase !== 'submitting',
    ),
  };
}
```

### 2) 비즈니스 액션 훅 (`actions/use-<domain>-actions.ts`)
- **목적**: `useDispatch()`를 감싸 의도 중심의 강타입 비즈니스 메서드(`addItem`, `submitOrder`, `resetDraft`)만 View에 제공합니다. View가 문자열 액션 키(`dispatch('updateCustomerName', ...)`)를 직접 호출하지 않도록 격리합니다.

### 3) 프레젠테이션 View와 Tier 3 로컬 상태 면제(Waiver)
- JSX 텍스트 위치에 Signal을 직접 전달(`<output>{countSignal}</output>`)하면 컴포넌트 재실행 없이 텍스트 노드를 직접 갱신할 수 있습니다. 조건 분기나 목록 렌더링을 위해 `.value`를 읽으면 해당 컴포넌트의 렌더링 의존성이 됩니다.
- 모달/아코디언 열림 여부(`isLogOpen`), 탭 인덱스, 포커스/호버 같은 **화면 전용 휘발성 상태(Tier 3)** 는 도메인 Store에 넣지 않고 컴포넌트 로컬 `useState`로만 관리합니다.

---

## 4.3 모듈화 3계층 표준 (3-Tier Modular Web Components)

복수의 Custom Element가 동일한 도메인 시그널을 공유할 때는 트리쉐이킹과 재사용성을 위해 3계층으로 분리합니다 (`examples/modular-signals-wc/`):

1. **[Level 1] 순수 도메인 시그널 모듈 (`shared-*-signal.ts`)**: DOM/`HTMLElement`/`window`/JSX 의존성 0%. 외부에는 writable signal 대신 `ReadonlySignal` 파생 신호와 인텐트 함수(`addProductToCart`)만 export합니다.
2. **[Level 2] Side-effect Free 엘리먼트 정의 (`*-element.tsx`)**: 모듈을 `import`하는 것만으로 `customElements.define`이 실행되지 않도록 반드시 `defineXElement(tagName?)` 팩토리 함수로 export합니다.
3. **[Level 3] 호스트 조립**: 호스트 애플리케이션이 필요한 엘리먼트만 import하여 태그 이름을 등록하고 배치합니다.

**크로스 엘리먼트 Signal 공유**: 서로 다른 DOM 브랜치나 서로 다른 `ShadowRoot`에 있는 엘리먼트(`<cart-badge>`, `<cart-drawer>`)도 같은 Level 1 Signal을 읽으면, 인텐트 함수 호출 한 번으로 각 엘리먼트의 바인딩이 독립적으로 갱신됩니다. 엘리먼트마다 별도 Preact 트리를 가지므로 A의 갱신이 B의 VDOM diff를 유발하지 않습니다. 다만 실제 지연과 DOM 갱신 범위는 대상 브라우저와 입력 빈도에서 측정해야 하며, Signals 사용만으로 성능을 보장하지 않습니다.

> **Signal-only 어댑터 예외**: `<cart-badge>`처럼 전역 읽기 전용 Signal만 읽고 별도 DOM 리스너·타이머·외부 source 구독을 만들지 않는 경우, Preact 마운트가 Signal 구독을 소유하고 `mount.destroy()`가 이를 정리하므로 별도 owner-session 객체를 생략할 수 있습니다. 외부 리스너나 비동기 작업을 추가하는 즉시 명시적 `onConnect`/`onDisconnect` 세션으로 승격합니다.

---

## 4.4 Custom Element Shell 및 `<template>` 아일랜드 작성

### 1) `PublicActionMethods`를 통한 공개 명령 추출
내부 `ActionPayloadMap` 중 외부 소비자에게 노출할 명령만 선택해 OOP 메서드 시그니처로 변환합니다:

```ts
import type { PublicActionMethods } from '@context-action/preact-ui';

export type OrderPublicCommands = PublicActionMethods<
  OrderActions,
  'addItem' | 'removeItem'
> & {
  submit(): Promise<void>;
  reset(): Promise<void>;
};
```

### 2) `definePreactElement<Input, Expose>` 선언적 `expose` 작성
- 생성자 단계에서는 호스트 어트리뷰트나 자식 노드를 변경하지 않으며, 연결(`onConnect`) 시점에 세션을 시작하고 해제(`onDisconnect`) 시점에 세션을 정리합니다. ([R0](references.md#r0), [R4](references.md#r4))
- 엘리먼트 인스턴스에 공개할 프로퍼티(getter/setter)와 명령 메서드는 수동 `Object.defineProperties`나 `as unknown as` 캐스팅 대신 `expose` 필드에 선언합니다:

```ts
const Element = definePreactElement<OrderWorkspaceInput, OrderWorkspaceHandle>({
  tagName: 'order-workspace',
  observedAttributes: ['customer-name', 'shipping-address'],
  upgradeProperties: ['customerName', 'shippingAddress'],
  setup(element, context) {
    const model = createOrderModel();
    let session: OrderWorkspaceOwnerSession | undefined;

    return {
      view: OrderWorkspaceElementView,
      getInput: () => session?.getInput() ?? failDisconnected(),
      expose: {
        get customerName() {
          return model.source.getSnapshot().draft.customerName;
        },
        set customerName(value: string) {
          element.setAttribute('customer-name', value);
        },
        get items() {
          return Object.freeze(
            model.source.getSnapshot().draft.items.map((item) => Object.freeze({ ...item })),
          );
        },
        addItem: (item: OrderItem) => model.dispatch('addItem', { item }),
        removeItem: (itemId: string) => model.dispatch('removeItem', { itemId }),
        submit: () => model.dispatch('submitOrder'),
        reset: () => model.dispatch('resetDraft'),
      },
      onConnect() {
        session = createOrderWorkspaceOwnerSession(model, element, consumeSuppressedChange, idPrefix);
        context.requestUpdate();
      },
      onDisconnect() {
        session?.destroy();
        session = undefined;
      },
      onDestroy: () => model.destroy(),
    };
  },
});
```

- **예약 멤버 보호**: `expose`에 `HTMLElement` 플랫폼 멤버(`focus`, `id`, `hidden` 등)나 관리형 API(`dispose`, `updateInput`, `name`, `form`, `validity` 등)를 선언하면 컴파일 타임(`ExposeContract`)과 런타임(`TypeError` + `onDestroy` 롤백) 양쪽에서 즉시 차단됩니다. 포커스 위임은 `focusItem(id)`이나 `focusIncrement()`처럼 의미 있는 명령 이름으로 노출합니다.
- **Pre-upgrade 프로퍼티 재생**: `upgradeProperties`에 선언된 프로퍼티는 엘리먼트 정의 이전에 할당된 값을 첫 연결 시점에 `expose` setter 또는 프로토타입 setter로 유실 없이 1회 재생합니다.

### 3) `<template>` 아일랜드 작성 (`mountTemplate`)
정적 HTML shell 내부에 단 하나의 빈 `[data-preact-root]`를 두고 `mountTemplate`으로 마운트합니다. 외부에는 `MountInstance` 원본 대신 `setLabel`, `setValue`, `destroy`처럼 도메인에 맞게 좁힌 컨트롤러 핸들만 반환하며, 빌려온 공유 모델은 아일랜드 `destroy()`에서 파괴하지 않습니다.

---

## 4.5 Shell 작성 규칙, 등록 및 완료 기준

`definePreactElement`는 아래 규칙 상당수(연결 세션 관리, pre-upgrade 재생, 태그 충돌 오류)를 대신 수행합니다. 다만 규칙 자체는 helper 사용 여부와 무관한 계약이므로, helper 없이 shell을 직접 작성하거나 helper 콜백(`setup`/`onConnect`/`getInput`)을 채울 때도 그대로 적용합니다.

### 1) Controller의 역할을 좁힌다
- Controller는 입력 검증·정규화, 내부 상태 전이, 허용된 명령 호출, 이벤트 `detail` 생성, 필요한 View projection만 담당합니다. Domain이 소유한 업무 규칙을 다시 구현하지 않습니다.
- View는 사용자 의도를 callback으로 전달합니다. 작은 View 로컬 상태나 내부 ref/focus 처리는 View에서 해도 되지만, 외부 요소를 찾아 수정하거나 Domain 정본을 우회 변경하지 않습니다.
- 소비자에게는 내부 Controller 전체가 아니라 필요한 기능만 묶은 facade를 넘깁니다. `internal/` 같은 파일명만으로 경계가 생기지 않으므로 barrel export와 emitted declaration(`.d.ts`)도 확인합니다.

### 2) Shell 콜백 규칙
- **constructor**: `super()` 호출, 인스턴스 초기 상태, ShadowRoot 등 내부 구조 준비로 제한합니다. Host attribute/children의 존재에 의존하거나 Host에 attribute·light children을 추가하지 않습니다. 연결·렌더·외부 자원 시작은 연결 단계에서 수행합니다. ([R0](references.md#r0))
- **연결**: 현재 연결 여부와 중복 mount를 검사하고, 공개 attribute와 정의 이전에 할당된 property를 복원·정규화한 뒤 완성된 초기 입력으로 한 번만 mount합니다.
- **Pre-upgrade property 가림 방지**: 정의 이전에 생긴 own property가 나중에 정의된 setter를 가리지 않도록 삭제 후 재할당합니다(`upgradeProperties`). 공개 accessor와 같은 이름의 class field initializer로 입력을 덮어쓰지 않습니다. ([R4](references.md#r4))
- **초기 입력 우선순위**: 권장 순서는 기본값 → 초기 attribute → 정의 이전에 명시한 property이며, 초기화 이후에는 유효한 외부 입력의 도착 순서를 따릅니다. 이 순서는 브라우저가 보장하는 정책이 아니므로 컴포넌트별로 계약에 적고 테스트합니다.
- **`attributeChangedCallback`**: 값 변환과 내부 입력 반영만 처리합니다. 프로그램 입력을 사용자 이벤트로 재발행하지 않으며, 연결 전에도 호출될 수 있으므로 DOM 존재에 의존하지 않습니다.
- **`setup` vs `onConnect`**: `setup`은 인스턴스 수명의 정본과 View 계약만 구성하고, 외부 subscription·observer·timer·`AbortController`는 `onConnect`에서 만들고 `onDisconnect`에서 해제합니다. 렌더 실패 시 세션 종료 규칙은 [01 §1.6](01-dom-ownership-and-lifecycle.md#16-실패와-보존)을 따릅니다.

### 3) 등록과 import를 분리한다
- 루트 import만으로 `document`/`customElements`를 사용하거나 전역 태그를 등록하지 않습니다. DOM 없는 import를 요구하는 엔트리에서는 `HTMLElement`를 참조하는 클래스 생성도 `defineXElement()` 같은 브라우저 팩토리 안으로 제한합니다.
- 이미 등록된 태그 이름은 기본적으로 오류입니다(`definePreactElement`는 `<tag> is already registered`를 던집니다). `if (customElements.get(name)) return`으로 다른 구현과의 충돌까지 성공 처리하지 않습니다. 동일 constructor 재사용이나 HMR이 필요하면 별도 개발 정책으로 정합니다.
- **DOM 없는 환경에서 import 성공, SSR 렌더(`createSSR`), hydration(`hydratePreact`) 지원은 서로 다른 계약입니다.** 하나를 확인했다고 나머지를 보장하지 않습니다.

### 4) 완료 시 제출할 최소 구성
- 소비자 계약([`templates/component.contract.md`](templates/component.contract.md)), 공개 타입, 실제 구현, 공개 계약 테스트, 관련 브라우저 테스트 결과를 서로 연결합니다.
- 예제에만 존재하는 동작을 공식 API로 승격하지 않습니다. 신규 공통 helper가 필요하면 어떤 반복과 실패를 줄이는지 먼저 밝히고, 기존 mount API를 대체하지 않는 방향으로 제안합니다.

---

## 4.6 핵심 안티패턴 요약

| 안티패턴 (Bad) ❌ | 표준 패턴 (Good) ✅ | 이유 |
|---|---|---|
| View에서 `dispatch('addItem', { item })` 직접 호출 | `useOrderActions()`의 `addItem(item)` 호출 | Action 키 결합 제거 및 강타입 인텐트 보장 |
| 렌더 함수 내부에서 `connectSourceSignal(source)` 호출 | 세션 초기화(`onConnect`/bootstrap)에서 연결 후 `dispose()` | 매 렌더링 중복 구독 및 메모리 누수 방지 |
| `import './my-element.js'` 시 자동 `customElements.define` | `export function defineMyElement(tagName?)` 팩토리 제공 | 트리쉐이킹 보장, DOM 없는 환경의 import 안전성(SSR 지원과는 별개 계약), 태그 충돌 오류 보존 |
| `mountPreact(this, View)`로 Host 태그 자체를 루트로 위임 | ShadowRoot 내부의 빈 `[data-preact-root]`만 위임 | Host 속성·light children과의 소유권 충돌 방지 |
| `disconnectedCallback`에서 도메인 모델까지 파괴 | `onDisconnect`에서는 세션/렌더러만 해제하고 모델은 보존 | DOM 이동·탭 전환 시 사용자 작성 상태 보존 |
| 수동 `Object.defineProperties` + `as unknown as` 캐스팅 | `definePreactElement<Input, Expose>`의 `expose` 사용 | 타입 추론 일관성 및 예약 멤버 덮어쓰기 방지 |
