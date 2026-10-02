# Form-Associated Custom Elements (FACE) 및 React 상호운용성 브릿지 가이드

> FACE와 React bridge는 선택 기능이다. 이 문서는 `@context-action/preact-ui`의 공통 구현 컨벤션을 대체하지 않으며, 컴포넌트별 계약에서 필요한 경우에만 적용한다. 공개 의미와 수명은 [공개 계약](09-public-component-contract.md) 및 [생명주기 규칙](11-lifecycle-and-resources.md)에 먼저 기록한다.

이 문서는 Preact + Signals 기반 Custom Elements를 브라우저 **웹 표준 폼(HTMLFormElement, FormData, Constraint Validation)** 및 **외부 대규모 React 애플리케이션**과 완벽하게 연동하기 위한 두 가지 핵심 확장 아키텍처 패턴을 설명합니다.

---

## 1. Form-Associated Custom Elements (FACE) 아키텍처

### 1.1 배경 및 문제의식
기존의 프레임워크 기반 폼 컴포넌트(React Hook Form, Formik 등)는 프레임워크 런타임에 강하게 결합되어 있어, 순수 HTML 서버 렌더링 폼이나 마이크로 프론트엔드 환경에서 독립적으로 사용하기 어렵습니다.

웹 표준 **FACE (Form-Associated Custom Elements)** 규격을 준수하면:
1. **표준 `<form>` 태그 자동 수집**: `new FormData(form)` 실행 시 커스텀 엘리먼트의 내부 값이 네이티브 인풋 필드처럼 자동으로 포함됩니다.
2. **브라우저 기본 제약 검증(Constraint Validation)**: `element.checkValidity()`, `element.reportValidity()` 및 툴팁 UI를 브라우저 네이티브로 활용할 수 있습니다.
3. **폼 리셋 및 수명주기 연동**: `<button type="reset">` 또는 `form.reset()` 호출 시 내부 Preact Signal이 초기 상태로 자동 복원됩니다.

---

### 1.2 `definePreactElement`의 FACE 지원 구조

`definePreactElement`는 `formAssociated: true` 옵션을 제공하며, `ElementInternals` 인터페이스를 안전하게 캡슐화합니다:

`setup(element, context)`의 `context`는 작성자용 어댑터 입력으로 contextual typing된다.
패키지 루트에서는 `PreactElementContext`를 타입으로 재-export하지 않으므로 이 객체를
소비자 계약으로 직접 참조하거나 저장하지 않는다. 작성자는 별도 타입 import 없이
`context.setFormValue()`와 `context.setValidity()`를 호출할 수 있고, 렌더러 내부 focus/ref
같은 경우에 한해 `context.root`를 사용할 수 있다. 최종 컴포넌트 소비자에게는 업무 값,
명령, 이벤트와 같은 명시적 계약만 노출한다.

현재 어댑터 context의 형태는 다음과 같다.

```typescript
interface PreactElementContext {
  /** 브라우저 네이티브 ElementInternals 인스턴스 */
  internals?: ElementInternals | undefined;
  /**
   * renderer가 소유한 내부 mount root.
   * author가 focus/selection 같은 의미 있는 명령을 연결할 때만 사용한다.
   * 공개 컴포넌트 계약을 대체하는 임의의 DOM query 용도로 사용하지 않는다.
   */
  readonly root: HTMLElement;
  /** 현재 connection session의 전체 input snapshot 갱신을 요청한다. */
  readonly requestUpdate: () => void;
  /** 폼 제출 값 및 복원 상태 설정 */
  setFormValue(value: File | string | FormData | null, state?: File | string | FormData | null): void;
  /** 유효성 플래그 및 커스텀 오류 메시지 설정 */
  setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
}
```

`root`와 `requestUpdate`는 `definePreactElement`가 owner adapter에 제공하는 author 전용
escape hatch다. `root`는 renderer가 소유하므로 adapter가 그 자식 노드를 제거하거나 다른
renderer를 mount해서는 안 된다. `requestUpdate()`는 현재 connection session이 살아 있을
때만 renderer를 갱신하며, `dispose()` 이후에는 아무 작업도 하지 않는다.

Declarative Shadow DOM을 사용하는 Custom Element는 `hydrateShadowRoot: true`를 명시하고
서버 ShadowRoot 안에 `[data-preact-root]`를 하나만 제공해야 한다. 이 모드는 그 root만
hydrate하며 재연결 시에는 일반 mount로 전환한다. 옵션 없이 기존 ShadowRoot를 자동 채택하지
않으므로 임의의 서버 children을 조용히 소유하지 않는다.

```mermaid
flowchart LR
    subgraph Preact Shadow DOM
        Signal["countSignal (Preact Signal)"] --> View["QuantityStepperView (Preact)"]
        View -- "사용자 클릭 (+ / -)" --> Signal
    end

    Signal -- "동기화" --> Context["PreactElementContext"]
    Context -- "setFormValue()" --> Internals["ElementInternals"]
    Context -- "setValidity()" --> Internals

    subgraph Host Native Form
        Internals --> Form["<form id='order-form'>"]
        Form -- "form.reset()" --> Reset["formResetCallback()"]
    end

    Reset -- "초기화" --> Signal
```

---

### 1.3 FACE 참조 구현: `<quantity-stepper>`

[`packages/preact-ui/examples/modular-signals-wc/quantity-stepper-element.tsx`](file:///Users/junwoobang/workflow/context-action/packages/preact-ui/examples/modular-signals-wc/quantity-stepper-element.tsx)에 구현된 완전한 예제:

```tsx
import { signal } from '@preact/signals';
import { definePreactElement } from '@context-action/preact-ui';

export const QuantityStepperElement = definePreactElement({
  tagName: 'quantity-stepper',
  formAssociated: true,
  observedAttributes: ['min', 'max', 'name', 'value'],
  setup(element, context) {
    const initial = parseInt(element.getAttribute('value') ?? '1', 10);
    const count = signal(initial);

    function updateForm(val: number) {
      const min = parseInt(element.getAttribute('min') ?? '1', 10);
      context.setFormValue(String(val));

      if (val < min) {
        context.setValidity({ rangeUnderflow: true }, `최소 ${min}개 이상이어야 합니다.`);
      } else {
        context.setValidity({});
      }
    }

    return {
      view: () => (
        <div class="stepper">
          <button type="button" onClick={() => { count.value--; updateForm(count.value); }}>−</button>
          <span>{count}</span>
          <button type="button" onClick={() => { count.value++; updateForm(count.value); }}>+</button>
        </div>
      ),
      getInput: () => count.value,
      // ElementInternals mutations are deferred until the element is
      // connected. Browsers can reject form state changes during construction.
      onConnect() {
        updateForm(count.value);
      },
      onFormReset() {
        count.value = initial;
        updateForm(initial);
      },
      onFormDisabled(disabled) {
        // fieldset disabled 연동
      },
    };
  },
});
```

---

### 1.4 수량 스테퍼 접근성 계약

FACE가 폼에 참여하는 것만으로 내부 Shadow DOM 컨트롤의 의미가 외부에 전달되지는 않는다. 참조 구현은 연결 세션이 시작된 뒤 host에 `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`, `aria-invalid`를 동기화한다. `ArrowUp`/`ArrowDown` 및 `Home`/`End` 키와 이름이 있는 `Decrease quantity`/`Increase quantity` 버튼을 함께 제공하므로 키보드 사용자와 보조기술이 같은 명령 경로를 사용한다.

호스트 라벨은 일반 labelable 컨트롤과 동일하게 `for`/`id`로 연결하고, Shadow DOM 경계를 넘어 이름이 안정적으로 계산되도록 `aria-labelledby`도 명시한다.

```html
<label id="order-quantity-label" for="order-quantity">수량 선택</label>
<quantity-stepper
  id="order-quantity"
  aria-labelledby="order-quantity-label"
  name="orderQuantity"
  value="2"
  min="1"
  max="10"
></quantity-stepper>
```

범위를 벗어나면 `ElementInternals.setValidity()`와 함께 host의 `aria-invalid="true"`와 직접적인 `aria-description`이 설정된다. 지원하는 브라우저에서는 `ElementInternals.ariaDescribedByElements`에 Shadow DOM의 도움말·오류 노드도 연결하고, 그렇지 않은 경우에도 직접 설명 문자열과 `role="alert"`/`aria-live="assertive"` 오류 알림을 유지한다. Shadow DOM 내부 ID를 host의 문자열 `aria-describedby`로만 연결하면 Chromium 접근성 트리에서 설명 관계가 해석되지 않는다. 실제 제품에서는 이 계약을 유지한 상태로 사용하는 보조기술과 브라우저 조합을 별도 수동 검증한다.

브라우저가 범위를 벗어난 `aria-valuenow`를 접근성 트리에서 최소·최대 경계로 정규화할 수 있으므로, DOM의 원본 값·`aria-invalid`·검증 메시지와 실제 음성 값이 항상 같다고 가정하지 않는다.

---

## 2. React ↔ Custom Element 상호운용성 브릿지 (`createCustomElementBridge`)

### 2.1 React와 Web Component 결합 시의 고질적 한계

React 18 및 React 19 환경에서 Custom Element를 직접 JSX로 작성할 때(` <cart-badge oncart-badge-click={...} /> `) 다음과 같은 문제가 발생합니다:
1. **커스텀 이벤트 청취 실패**: React의 합성 이벤트(SyntheticEvent) 시스템은 `dash-cased` 커스텀 이벤트(예: `cart-badge-click`)를 정상적으로 위임 처리하지 못합니다.
2. **복합 객체 프로퍼티의 문자열 직렬화**: 배열이나 모델 객체(`items={[...]}`)를 JSX props로 전달하면 `setAttribute('items', '[object Object]')`로 처리되어 데이터가 유실됩니다.
3. **Ref 접근 및 DOM 제어**: 컴포넌트의 내부 메서드(`element.addItem(...)`) 호출 시 ref 타입 추론이 번거롭습니다.

---

### 2.2 `createCustomElementBridge` 헬퍼

`@context-action/preact-ui`는 React 상호운용성을 위한 경량 브릿지 팩토리를 제공합니다:

```typescript
import { createCustomElementBridge } from '@context-action/preact-ui/react-bridge';

interface CartBadgeProps {
  customerName?: string;
  items?: readonly CartItem[];
  onCartChange?: (event: CustomEvent<{ total: number }>) => void;
}

// React 컴포넌트로 래핑
export const ReactCartBadge = createCustomElementBridge<CartBadgeProps, HTMLElement>({
  tagName: 'cart-badge',
  properties: ['items'], // DOM property로 직접 할당
  events: {
    onCartChange: 'cart-change', // DOM CustomEvent 매핑 및 자동 cleanup
  },
});
```

### 2.3 React 애플리케이션 내 사용 예시

```tsx
import React, { useRef } from 'react';
import { ReactCartBadge } from './bridge.js';

export function ReactHeader() {
  const badgeRef = useRef<HTMLElement>(null);

  return (
    <header>
      <h1>나의 React 쇼핑몰</h1>
      <ReactCartBadge
        ref={badgeRef}
        customerName="김철수"
        items={[{ id: '1', name: '상품', price: 10 }]}
        onCartChange={(e) => {
          console.log('React에서 수신한 커스텀 이벤트:', e.detail.total);
        }}
      />
    </header>
  );
}
```

---

## 3. 핵심 가치 요약

1. **표준 준수 (Standard First)**: 별도의 프레임워크 폼 라이브러리 없이 브라우저 네이티브 `<form>` 및 `FormData`와 완벽 통합.
2. **다중 환경 무손실 배포 (Zero Friction Interop)**:
   - 순수 HTML 페이지: `<quantity-stepper>`, `<cart-badge>` 태그로 직접 사용.
   - React 애플리케이션: `createCustomElementBridge`를 통해 네이티브 React 컴포넌트처럼 사용.
3. **가상 DOM 경계 분리 보장**: React의 VDOM과 Preact의 VDOM/Signals가 서로 간섭하지 않고 독립적으로 최고 효율의 렌더링을 수행.
