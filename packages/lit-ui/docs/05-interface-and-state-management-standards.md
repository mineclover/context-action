# 웹 컴포넌트 인터페이스 설계 및 상태 관리 표준 규약
(Web Component Interface Design & Baseline State Management Standards)

이 문서는 Context-Action 프레임워크 생태계(Lit 및 Preact 기반)에서 웹 컴포넌트(Custom Elements)를 제작할 때 준수해야 하는 **공식 인터페이스 설계 규약**과 **기본 상태 관리 원칙**을 정의합니다.

> **핵심 철학: 자율성 보장과 기본 원칙의 균형 (Autonomy with Invariants)**  
> 컴포넌트의 내부 렌더링 방식(Lit Template vs Preact Signals), 스타일링, 마크업 구조는 개발자에게 완전한 자유도를 부여하되, **외부로 노출되는 인터페이스(Interface Exposure)**와 **도메인 상태 연동(State Management)**에 대해서는 명확한 계약(Contract)을 확립하여 예측 가능하고 메모리 누수가 없는 아키텍처를 유지합니다.

---

## 1. 비타협적 4대 기본 원칙 (Non-Negotiable Invariants)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       4대 대원칙 (Core Invariants)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. SSOT (단일 진실 원천) : 도메인 상태를 독자 복제하지 않고 Store/Signal을 구독   │
│ 2. 속성/프로퍼티 이분법  : Primitive만 Attribute로, Complex/Store는 Property로  │
│ 3. 무누수 라이프사이클   : Disconnect 시 동기적 완전 해제, Reconnect 시 재동기화 │
│ 4. 웹 표준 프로토콜 준수 : composed 커스텀 이벤트 및 ElementInternals(FACE) 준수 │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **SSOT (Single Source of Truth) 준수**: 도메인 상태(Domain State)를 엘리먼트 내부에 독자 복제하여 원천 상태와 어긋나는 상태 불일치를 유발하지 않습니다. 도메인 데이터는 Context-Action Store나 공유 Signal이 유일한 원천이며, 컴포넌트는 이를 투영(Projection)하여 읽기만 합니다.
2. **속성과 프로퍼티의 엄격한 분리 (Attribute vs Property)**: 프리미티브 값만 HTML 속성으로 리플렉션하고, Store, ActionRegister, Model 객체, 함수 등 복합 객체는 **절대로** HTML 속성으로 취급하지 않고 DOM 프로퍼티(`attribute: false`)로만 수용합니다.
3. **결정론적 수명주기 및 메모리 누수 0 (Zero Memory Leak)**: 엘리먼트가 DOM에서 분리(`disconnectedCallback`)되면 등록된 모든 구독, 리스너, 진행 중인 비동기 요청(`AbortSignal`)이 동기적으로 완전 해제되어야 합니다. DOM에 재부착(`connectedCallback`)될 때는 최신 스냅샷으로 깨끗하게 재동기화되어야 합니다.
4. **웹 표준 프로토콜 준수 (Composed Events & FACE)**: 외부로 알리는 이벤트는 `composed: true`로 Shadow DOM을 통과할 수 있어야 하며, 폼 입력 성격의 컴포넌트는 `ElementInternals` 기반의 Form-Associated Custom Element (FACE) 표준을 준수해야 합니다.

---

## 2. 인터페이스 작성 규약 (Interface Authoring Standards)

### 2.1 속성(Attribute) vs 프로퍼티(Property) 분리

| 데이터 유형 | 전달 방식 | Lit 데코레이터 예시 | Preact 팩토리 예시 | 네이밍 규칙 |
|---|---|---|---|---|
| **문자열, 숫자, 불리언** | Attribute + Property 양방향 리플렉션 | `@property({ type: Number })` | `observedAttributes: ['min', 'max']` | Attribute: `kebab-case`<br>Property: `camelCase` |
| **불리언 플래그** | Presence / Absence (참일 때 속성 존재, 거짓일 때 속성 제거) | `@property({ type: Boolean, reflect: true })` | `observedAttributes: ['disabled']` | `disabled`, `readonly`, `hide-zero` |
| **Store, ActionRegister** | **순수 DOM 프로퍼티 전용 (속성 금지)** | `@property({ attribute: false })` | 인스턴스 프로퍼티 또는 `setup` 파라미터 | `store`, `register` |
| **객체, 배열, 콜백 함수** | **순수 DOM 프로퍼티 전용 (속성 금지)** | `@property({ attribute: false })` | 인스턴스 프로퍼티 | `items`, `selector`, `equalityFn` |

#### ⚠️ 안티패턴 vs 모범사례
```ts
// ❌ 안티패턴: 복합 객체를 속성으로 선언 (HTML 마크업에서 "[object Object]" 문자열화 버그 발생)
@property({ type: Object })
cartStore?: ReadableStore<CartState>;

// ✅ 올바른 표준: 복합 객체는 반드시 attribute: false로 지정
@property({ attribute: false })
cartStore?: ReadableStore<CartState>;
```

---

### 2.2 이벤트(CustomEvent) 노출 규약

1. **이벤트 명칭**:
   - 네이티브 시맨틱 호환 이벤트: `input`, `change`, `focus`, `blur`
   - 도메인 전용 커스텀 이벤트: `kebab-case` 명사-동사/상태 조합 (예: `quantity-change`, `cart-badge-click`, `order-submit`)
2. **이벤트 디테일 타입 명시 (Strictly Typed Payload)**:
   - 모든 커스텀 이벤트는 소비자가 TypeScript로 안전하게 타입을 추론할 수 있도록 `export interface XxxEventDetail` 규격을 함께 export합니다.
3. **버블링 및 섀도우 DOM 통과 (Composed & Bubbles)**:
   - 외부 섀도우 루트 및 호스트 문서 조상 엘리먼트가 이벤트를 수신할 수 있도록 `{ bubbles: true, composed: true }`를 필수 지정합니다.

```ts
// 1. 이벤트 페이로드 인터페이스 수출
export interface QuantityChangeEventDetail {
  value: number;
  previousValue?: number;
}

// 2. 표준 CustomEvent 디스패치
private emitQuantityChange(nextVal: number): void {
  this.dispatchEvent(
    new CustomEvent<QuantityChangeEventDetail>('quantity-change', {
      bubbles: true,
      composed: true,
      detail: { value: nextVal, previousValue: this.value }
    })
  );
}
```

---

### 2.3 명령형 인스턴스 메서드 (Imperative APIs)

컴포넌트 외부에서 스크립트나 ref를 통해 호출할 수 있는 공용 메서드는 다음 표준을 따릅니다:

1. **명시적 가시성 (Public Exposure)**:
   - 클래스 기반(Lit)의 경우 `public` 메서드로 선언합니다.
   - Preact의 경우 `setup()` 시점에 `element.methodName = ...` 형태로 인스턴스에 명시적으로 바인딩합니다.
2. **부수 효과 제어 옵션 (Options Pattern)**:
   - 프로그래밍 방식으로 값을 변경할 때 이벤트 발생 여부를 호출자가 제어할 수 있도록 옵션 파라미터를 제공합니다.
3. **표준 폼 유효성 메서드**:
   - `checkValidity()`, `reportValidity()`, `setCustomValidity(msg)`를 표준 구현하여 브라우저 내장 폼 검증과 완벽히 일치시킵니다.

```ts
// 명령형 메서드 작성 표준
public setValue(nextValue: number, options?: { dispatchEvents?: boolean }): void {
  this.value = nextValue;
  this.syncFormState();
  this.requestUpdate();

  if (options?.dispatchEvents) {
    this.emitQuantityChange(nextValue);
  }
}
```

---

### 2.4 React 18/19 호스트 연동 브리지 (`createLitElementBridge`)

React 호스트 환경에서 웹 컴포넌트를 소비할 때는 리액트의 속성 직렬화 한계(`[object Object]`)를 우회하는 브리지를 제공해야 합니다.

```tsx
// 컴포넌트 브리지 정의 표준
export const ReactQuantityStepper = createLitElementBridge<StepperProps, LitQuantityStepper>({
  tagName: 'lit-quantity-stepper',
  // 1. DOM 프로퍼티로 직할 할당할 복합 속성 목록
  properties: ['store', 'register', 'selector'],
  // 2. React onXxx 핸들러 ↔ DOM CustomEvent 이름 매핑
  events: {
    onQuantityChange: 'quantity-change',
  },
});
```

---

## 3. 기본 상태 관리 표준 규칙 (State Management Standards)

상태의 성격과 범위에 따라 **3가지 티어(Tier)**로 엄격히 구분하여 관리합니다.

```text
┌────────────────────────────────────────────────────────────────────────┐
│               3-Tier State Hierarchy (상태 3계층 모델)                 │
├────────────────────────────────────────────────────────────────────────┤
│ [Tier 1] Local UI Transient State : 포커스, 팝오버 오픈, 애니메이션 플래그│
│          → Lit @state(), Preact local signal (엘리먼트 내부 소멸 가능)   │
├────────────────────────────────────────────────────────────────────────┤
│ [Tier 2] Component Controlled Value : input value, disabled, validity  │
│          → @property() + ElementInternals.setFormValue() (폼 리셋 복원)│
├────────────────────────────────────────────────────────────────────────┤
│ [Tier 3] Domain Business State : 장바구니, 유저 정보, 주문 상태, 테마  │
│          → Context-Action ReadableStore / Global Signal (SSOT 원천)    │
│          → StoreController / connectSourceSignal 로 선택적 프로젝션 구독 │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Tier 1: 로컬 UI 일시 상태 (Local UI Transient State)
* **정의**: 컴포넌트 내부 렌더링에만 관여하며, 컴포넌트가 사라지면 버려져도 무방한 상태 (예: `focused`, `isOpen`, `hovered`).
* **구현**: Lit의 `@state()` 또는 Preact의 `signal()`.
* **원칙**: 이 상태를 상위 Store나 전역 상태로 끌어올리지(lifting) 않습니다.

### 3.2 Tier 2: 컴포넌트 제어 값 (Component Controlled Value)
* **정의**: 컴포넌트가 UI 컨트롤로서 보유하는 고유 값 (예: `value`, `min`, `max`, `defaultValue`).
* **구현**: `@property()` 및 `ElementInternals.setFormValue()`.
* **원칙**:
  - `connectedCallback` 시 `defaultValue` 또는 초기 `value`를 캡처해 둡니다.
  - 부모 `<form>`이 리셋될 때 `onFormReset()` 콜백에서 초기값으로 정확히 복원합니다.

### 3.3 Tier 3: 도메인/비즈니스 상태 (Domain Business State)
* **정의**: 여러 컴포넌트가 공유하거나 백엔드/스토어와 동기화되는 핵심 비즈니스 데이터.
* **구현**: **Context-Action `ReadableStore`** 또는 **공유 `ReadonlySignal`**.
* **원칙**:
  1. **절대 복제 금지**: 컴포넌트 내부에 별도의 로컬 state를 만들어 스토어 데이터를 복제하지 않습니다.
  2. **선택적 프로젝션 (Selective Projection)**: 스토어 전체를 구독하지 않고, 컴포넌트에 필요한 슬라이스만 `selector` 함수로 추출합니다.
  3. **Equality Guard**: 프로젝션 결과가 이전과 동일하다면 `equalityFn`을 통해 `requestUpdate()`를 억제하여 고주파(120fps) 상태 변경에서도 렌더링 오버헤드를 0으로 유지합니다.
  4. **Coalesced Pending**: `ActionController`를 통해 액션 진행 상태(`isPending`)를 추적하되, 리렌더링 요청은 **0 ↔ >0 전환 시점**에만 병합 실행합니다.

---

## 4. 자율성 보장 영역 vs 제한 영역 가이드

개발자가 창의성을 발휘할 수 있는 자율 영역과 반드시 지켜야 하는 제한 영역의 경계는 다음과 같습니다:

```text
 자유도 보장 영역 (Developer Freedom)
 ─────────────────────────────────────────────────────────────────────────────
 ✔ 렌더링 라이브러리 선택 (Lit vs Preact vs Vanilla)
 ✔ 컴포넌트 내부 스타일링 (CSS Custom Properties, Shadow CSS, ::part)
 ✔ 슬롯(Slot)을 활용한 자식 노드 컴포지션 구조
 ✔ 내부 계산용 유틸리티 및 순수 비즈니스 함수 구성
 ✔ 컴포넌트 내부 프라이빗 헬퍼 메서드 및 상태 모델링

 필수 제한 영역 (Non-Negotiable Contracts)
 ─────────────────────────────────────────────────────────────────────────────
 ✘ 복합 객체(Store/Register)를 HTML Attribute로 선언하는 행위 금지
 ✘ disconnectedCallback 시 구독/리스너를 해제하지 않아 메모리 누수를 내는 행위 금지
 ✘ 외부 알림 이벤트를 composed: false로 발송하여 Shadow DOM에 가두는 행위 금지
 ✘ 도메인 스토어의 값을 컴포넌트 로컬 상태로 복제하여 SSOT를 깨뜨리는 행위 금지
 ✘ Form-associated 컴포넌트가 Form Reset 수명주기를 무시하는 행위 금지
```

---

## 5. 자체 점검 체크리스트 (Self-Audit Checklist)

새로운 웹 컴포넌트를 제작하거나 PR을 검토할 때 아래 8개 항목을 확인하세요:

- [ ] **Attr/Prop 분리**: 프리미티브만 속성으로 연결되어 있고, Store/객체는 `attribute: false`로 정의되었는가?
- [ ] **SSOT 유지**: 도메인 데이터를 컴포넌트 내부에 중복 저장하지 않고 `StoreController` / `Signal`로 직접 프로젝션하는가?
- [ ] **프로젝션 최적화**: 필요한 데이터만 `selector`로 추출하고 불필요한 리렌더를 `equalityFn`으로 방어하고 있는가?
- [ ] **메모리 누수 차단**: `disconnectedCallback` 시 스토어 구독, DOM 이벤트, 비동기 작업이 완전하게 클린업되는가?
- [ ] **재연결 안전성**: DOM에서 뗐다가 다시 붙였을 때(`connectedCallback`) 최신 상태로 정상 동기화되는가?
- [ ] **이벤트 규격**: 커스텀 이벤트가 `{ bubbles: true, composed: true }`이며 전용 `detail` 타입을 함께 export하는가?
- [ ] **FACE 표준**: 폼 컨트롤 엘리먼트인 경우 `ElementInternals`에 폼 값과 유효성을 반영하고 `onFormReset`을 지원하는가?
- [ ] **React 브리지 제공**: React 호스트 소비자를 위한 `createLitElementBridge` / `createCustomElementBridge`를 제공하는가?
