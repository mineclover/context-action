# @context-action/preact-ui

특정 DOM subtree의 렌더링을 Preact에 위임하고, 외부에서는 공개 인터페이스로만 제어하는 **공개 preview UI runtime**입니다.

```text
Host / <template>       : 배치와 정적 shell (Preact가 컨테이너 자체를 삭제하지 않음)
Public controller / CE : 값·명령·이벤트·세션 수명 계약
Preact                 : 위임받은 root.children만을 배타적으로 관리
@context-action/preact : Action dispatch와 읽기 전용 Signal 연결
Domain                 : 원본 상태와 업무 규칙 (단일 진실 공급원)
```

`@context-action/preact-ui`는 마이크로 프론트엔드, 독립 웹 컴포넌트, 하이브리드 React 18/19 호스트, 그리고 서버 사이드 렌더링(SSR) 환경에서 일관된 DOM 소유권 경계와 수명 주기를 보장합니다.

---

## 1. 아키텍처 및 Subtree DOM Root 소유권 경계

핵심 아키텍처 대원칙:
> **"Host는 루트 컨테이너 엘리먼트와 외부 배치를 소유하고, Preact는 오직 `root.children`만을 소유합니다."**

### 1.1 소유권 경계 규칙 (DOM Ownership Rules)

1. **컨테이너 보존 원칙**:
   - `mountPreact`와 `hydratePreact`는 전달받은 `root`(`Element | ShadowRoot`)의 내부 자식 노드(`root.children`)만 렌더링합니다.
   - `destroy()` 호출 시 Preact 가상 DOM을 언마운트하고 잔여 자식 노드만 정리할 뿐, **호스트 루트 컨테이너 엘리먼트 자체는 절대 DOM 트리에서 제거하지 않습니다.**
2. **클라이언트 마운트 빈 루트 검증 (`claimMountRoot`)**:
   - `mountPreact`는 반드시 자식 노드가 없는 **빈 루트(`!root.hasChildNodes()`)**를 요구합니다.
   - 루트에 기존 DOM 노드가 남아있으면 `Error('Mount root must be empty; existing DOM is not adopted or hydrated')`를 던집니다. 이는 의도치 않은 기존 DOM 덮어쓰기나 예기치 않은 파괴를 방지하기 위함입니다.
3. **SSR 하이드레이션 채택 검증 (`claimHydrationRoot`)**:
   - `hydratePreact`는 서버에서 이미 렌더링된 자식 노드가 있는 **채워진 루트(`root.hasChildNodes()`)**를 요구합니다.
   - 빈 루트에 호출하면 `Error('Hydration root must contain server-rendered children')`를 발생시킵니다.
4. **Light-DOM 조상·자손 충돌 방지 (`assertUnmanagedAncestors`)**:
   - 하나의 Light-DOM 트리 내에서 이미 관리 중인 루트의 조상(Ancestor)이나 자손(Descendant) 영역에 중첩 마운트/하이드레이션하는 것을 차단합니다.
   - 충돌 감지 시 `Error('A managed DOM root already owns this light-DOM region')`를 던져 렌더러 간의 DOM 제어권 충돌을 사전에 방지합니다.
5. **Shadow DOM 경계 격리**:
   - 조상 노드 순회(`parentNode`)는 `ShadowRoot` 경계(`nodeType === 11 && 'host' in node`)에서 의도적으로 중단됩니다.
   - 따라서 상위 Light-DOM이 Preact로 관리되더라도, 하위 커스텀 엘리먼트의 ShadowRoot 내부에 별도의 Preact 루트를 마운트하는 것은 충돌 없이 안전하게 격리됩니다.
6. **LIFO 자원 정리 순서 (`createDisposalScope`)**:
   - 등록은 **제공자(Provider/Model) 우선, 소비자(Consumer/View) 후순위**로 수행합니다.
   - 해제는 **LIFO(Last-In-First-Out, 역순)**로 진행되어, 뷰가 먼저 언마운트된 후 시그널 구독이 해제되고 최종적으로 도메인 모델이 정리됩니다.
   - 정리 도중 발생한 예외는 중단 없이 수집되어 `AggregateError(errors, 'UI cleanup failed')`로 보고됩니다.
7. **Connection Session 수명 분리 (`definePreactElement`)**:
   - 커스텀 엘리먼트 인스턴스의 영구 수명(속성, 시그널 값, 모델)과 DOM 연결 세션(`connectedCallback` ↔ `disconnectedCallback`)을 철저히 분리합니다.
   - DOM에서 일시 분리되더라도 도메인 상태는 보존되며, 재연결 시 동일한 상태로 Preact 렌더러만 다시 마운트됩니다.

---

## 2. 진입점(Entry Points) 및 Peer 의존성 매트릭스

`@context-action/preact-ui`는 필요한 환경에 맞게 번들 크기와 의존성을 최소화할 수 있도록 서브패스(Subpath) 진입점별로 선택적(Optional) Peer 의존성을 엄격히 분리하여 제공합니다.

| 진입점 (Entry Point) | 하위 모듈 식별자 | 빌드 산출물 (ESM / CJS) | 필수 의존성 (Required Peers) | 선택적 의존성 (Optional Peers) | 주 사용 목적 및 런타임 특성 |
|---|---|---|---|---|---|
| **Base** (기본) | `@context-action/preact-ui` | `.`<br>(`./dist/index.js`, `./dist/index.cjs`) | `preact@^10.27.3`<br>`@preact/signals@^2.11.3`<br>`@context-action/preact@^0.1.0` | 없음 | 순수 Preact DOM 마운트, 템플릿 복제, 독립 웹 컴포넌트(FACE), LIFO 자원 정리. **React나 SSR 의존성 없음.** |
| **React Bridge** | `@context-action/preact-ui/react-bridge` | `./react-bridge`<br>(`./dist/react-bridge.js`, `./dist/react-bridge.cjs`) | Base 의존성 일체 +<br>`react@^18.0.0 \|\| ^19.0.0` | `react` | React 18/19 호스트 애플리케이션에서 커스텀 엘리먼트를 사용하기 위한 브릿지 래퍼 (`createCustomElementBridge`). |
| **SSR** | `@context-action/preact-ui/ssr` | `./ssr`<br>(`./dist/ssr.js`, `./dist/ssr.cjs`) | Base 의존성 일체 +<br>`preact-render-to-string@^6.7.0` | `preact-render-to-string` | 서버 사이드 문자열 HTML 렌더러 (`createSSR`). **브라우저 전역(`window`, `document`) 접근 없음.** |

### 2.1 설치 안내 (용도별 패키지 관리자 명령어)

#### 1) 순수 Preact / 독립 웹 컴포넌트 (Base 진입점만 사용)
```sh
# pnpm
pnpm add @context-action/preact-ui @context-action/preact preact @preact/signals

# npm
npm install @context-action/preact-ui @context-action/preact preact @preact/signals
```

#### 2) React 18 / React 19 호스트 연동 (React Bridge 포함)
```sh
# pnpm
pnpm add @context-action/preact-ui @context-action/preact preact @preact/signals react

# npm
npm install @context-action/preact-ui @context-action/preact preact @preact/signals react
```

#### 3) Node.js / Edge 서버 사이드 렌더링 및 클라이언트 하이드레이션 (SSR 포함)
```sh
# pnpm
pnpm add @context-action/preact-ui @context-action/preact preact @preact/signals preact-render-to-string

# npm
npm install @context-action/preact-ui @context-action/preact preact @preact/signals preact-render-to-string
```

---

## 3. 핵심 수명 주기 기본형 (Lifecycle Primitives)

### 3.1 `mountPreact<Input>(root, View, initialInput): MountInstance<Input>`
- **계약**: 빈 `Element` 또는 `ShadowRoot`에 Preact 뷰를 마운트합니다.
- **반환 인스턴스**:
  - `readonly destroyed: boolean`: 언마운트 여부.
  - `update(input: Input): void`: 전체 입력 스냅샷을 동기적으로 교체합니다(부분 머지가 아님). 이미 파괴된 경우 오류를 던집니다.
  - `destroy(): void`: 멱등(Idempotent) 해제 함수. Preact를 언마운트하고 부분 렌더링 잔여 노드를 제거하며 루트 임대를 해제합니다. 호스트 루트는 유지됩니다.

### 3.2 `hydratePreact<Input>(root, View, initialInput): HydrationInstance<Input>`
- **계약**: 서버에서 이미 렌더링된 HTML 자식 노드를 포함하는 루트를 인수받아 이벤트 리스너와 반응형 시그널을 연결합니다.
- **특징**: 초기 연결은 Preact `hydrate()`를 사용하며, 이후 `update(nextInput)` 호출은 일반 `render()`로 원활하게 전환됩니다.

### 3.3 `mountTemplate<Input>(host, template, View, input): MountInstance<Input>`
- **계약**: 신뢰할 수 있는 `<template>` 엘리먼트를 복제(`importNode`)하여 호스트에 삽입하고, 템플릿 내부의 단 하나뿐인 빈 `[data-preact-root]` 엘리먼트에 Preact를 마운트합니다.
- **특징**: `destroy()` 시 Preact 뷰를 해제하고 복제되었던 템플릿 쉘 노드만 정밀하게 DOM에서 제거합니다. 호스트의 기존 형제 엘리먼트나 원본 템플릿은 그대로 보존됩니다.

### 3.4 `createDisposalScope(): DisposalScope`
- **계약**: LIFO 순서의 결정론적 자원 정리 스코프를 제공합니다.
- **인터페이스**:
  - `add(cleanup: () => void): void`: 정리 콜백 등록. 스코프가 이미 해제된 상태에서 추가되면 콜백이 즉시 실행됩니다.
  - `dispose(): void`: 등록된 정리 콜백들을 역순으로 실행합니다. 실패한 콜백이 있더라도 나머지를 모두 실행한 후 `AggregateError`로 묶어서 보고합니다.
  - `readonly disposed: boolean`: 스코프 해제 상태.

### 3.5 `definePreactElement<Input>(config): CustomElementConstructor`
- **계약**: 표준 웹 컴포넌트(Custom Elements v1) 및 폼 연동 커스텀 엘리먼트(FACE, Form-Associated Custom Elements)를 선언합니다.
- **주요 기능**:
  - `formAssociated: true`: `ElementInternals`를 활성화하여 표준 `<form>`의 유효성 검증(`checkValidity`, `reportValidity`, `setCustomValidity`) 및 제출 값(`setFormValue`)과 연동됩니다.
  - `upgradeProperties`: 커스텀 엘리먼트 등록 이전에 인스턴스에 할당된 초기 프로퍼티 값을 유실 없이 재생합니다.
  - 연결 세션 격리: `connectedCallback`에서 마운트하고 `disconnectedCallback`에서 언마운트하되, 엘리먼트의 필드 값과 도메인 시그널 상태는 인스턴스에 안전하게 유지합니다.

---

## 4. 즉시 실행 가능한 퀵스타트 (Copy-Paste Quick Starts)

### 4.1 템플릿 아일랜드 마운트 (`mountTemplate`)

정적 HTML 쉘과 Preact 동적 아일랜드 영역을 명확히 분리하여 마운트합니다.

```html
<!-- index.html -->
<div id="island-host">
  <aside>Existing static sidebar (preserved)</aside>
</div>

<template id="user-island-template">
  <div class="user-card-shell">
    <header>User Profile</header>
    <!-- data-preact-root 속성을 가진 정확히 1개의 빈 컨테이너 엘리먼트 필요 -->
    <div data-preact-root></div>
    <footer>Standard footer</footer>
  </div>
</template>
```

```typescript
// island-bootstrap.ts
import { h } from 'preact';
import { mountTemplate } from '@context-action/preact-ui';

interface UserInput {
  name: string;
  role: string;
}

function UserCardView({ input }: { input: UserInput }) {
  return (
    <div class="user-details">
      <strong>{input.name}</strong>
      <span>({input.role})</span>
    </div>
  );
}

const host = document.getElementById('island-host')!;
const template = document.getElementById('user-island-template') as HTMLTemplateElement;

// 1. 템플릿 복제 및 아일랜드 마운트
const island = mountTemplate<UserInput>(host, template, UserCardView, {
  name: 'Alice',
  role: 'Engineer',
});

// 2. 전체 입력 스냅샷 갱신
island.update({
  name: 'Alice',
  role: 'Lead Architect',
});

// 3. 필요 시 해제: Preact 뷰와 복제된 템플릿 쉘만 제거되며, <aside>는 보존됨
// island.destroy();
```

---

### 4.2 폼 연동 커스텀 엘리먼트 (FACE with Signals)

표준 `<form>`과 완전히 통합되는 수량 조절 커스텀 엘리먼트 예제입니다. 브라우저 폼 리셋, 비활성화, 유효성 검증 API를 완벽히 지원합니다.

```typescript
// quantity-stepper.ts
import { h } from 'preact';
import { signal } from '@preact/signals';
import { definePreactElement } from '@context-action/preact-ui';

interface StepperInput {
  count: number;
  disabled: boolean;
}

export const QuantityStepper = definePreactElement<StepperInput>({
  tagName: 'quantity-stepper',
  formAssociated: true,
  observedAttributes: ['value', 'disabled', 'name'],
  upgradeProperties: ['value', 'disabled'],
  style: `
    :host { display: inline-flex; align-items: center; gap: 8px; font-family: sans-serif; }
    button { padding: 4px 8px; cursor: pointer; }
    output { font-weight: bold; min-width: 24px; text-align: center; }
  `,
  setup(element, context) {
    const count = signal(1);
    const disabled = signal(false);

    // 폼 값 및 유효성 동기화 헬퍼
    const syncForm = (val: number) => {
      context.setFormValue(String(val));
      if (val < 1) {
        context.setValidity({ rangeUnderflow: true }, '수량은 1개 이상이어야 합니다.');
      } else {
        context.setValidity({});
      }
    };

    syncForm(count.value);

    // Preact 내부 뷰 정의
    const view = ({ input }: { input: StepperInput }) => (
      <div>
        <button
          type="button"
          disabled={input.disabled || input.count <= 1}
          onClick={() => {
            count.value -= 1;
            syncForm(count.value);
            context.requestUpdate();
            element.dispatchEvent(new CustomEvent('quantity-change', {
              detail: { value: count.value },
              bubbles: true,
            }));
          }}
        >
          -
        </button>
        <output>{input.count}</output>
        <button
          type="button"
          disabled={input.disabled}
          onClick={() => {
            count.value += 1;
            syncForm(count.value);
            context.requestUpdate();
            element.dispatchEvent(new CustomEvent('quantity-change', {
              detail: { value: count.value },
              bubbles: true,
            }));
          }}
        >
          +
        </button>
      </div>
    );

    return {
      view,
      getInput: () => ({ count: count.value, disabled: disabled.value }),
      onFormReset() {
        count.value = 1;
        syncForm(1);
        context.requestUpdate();
      },
      onFormDisabled(isDisabled) {
        disabled.value = isDisabled;
        context.requestUpdate();
      },
      onAttributeChange(name, _oldVal, newVal) {
        if (name === 'value' && newVal !== null) {
          count.value = Number.parseInt(newVal, 10) || 1;
          syncForm(count.value);
          context.requestUpdate();
        }
        if (name === 'disabled') {
          disabled.value = newVal !== null;
          context.requestUpdate();
        }
      },
    };
  },
});
```

```html
<!-- HTML Form 사용 예시 -->
<form id="order-form">
  <label for="stepper">상품 수량:</label>
  <quantity-stepper id="stepper" name="quantity" value="2"></quantity-stepper>
  <button type="submit">주문하기</button>
  <button type="reset">초기화</button>
</form>
```

---

### 4.3 React 18 / 19 호스트 연동 (`createCustomElementBridge`)

React 호스트 애플리케이션에서 커스텀 엘리먼트를 사용할 때 발생하는 두 가지 고질적 문제(객체/배열 프로퍼티가 문자열 `[object Object]`로 변환되는 문제, 커스텀 이벤트 바인딩 누락)를 해결합니다.

> **주의**: 이 서브패스를 사용하려면 호스트 프로젝트에 `react`가 설치되어 있어야 합니다.

```tsx
// ReactOrderBridge.tsx
import * as React from 'react';
import { createCustomElementBridge } from '@context-action/preact-ui/react-bridge';

// 1. 커스텀 엘리먼트 프로퍼티 및 커스텀 이벤트 타입 정의
interface OrderBridgeProps {
  customerName?: string;
  items?: readonly { id: string; name: string; price: number }[];
  onOrderChange?: (e: CustomEvent<{ total: number }>) => void;
}

// 2. React 18/19 전용 타입 세이프 브릿지 컴포넌트 생성
export const ReactOrderBridge = createCustomElementBridge<OrderBridgeProps, HTMLElement>({
  tagName: 'order-workspace',
  // DOM 프로퍼티로 직접 할당할 복합 객체 키 목록 (HTML attribute로 변환되지 않음)
  properties: ['items'],
  // React prop 이름을 네이티브 CustomEvent 이름으로 매핑
  events: {
    onOrderChange: 'order-change',
  },
});

// 3. React 부모 컴포넌트에서 일반 React 컴포넌트처럼 사용
export function HostApp() {
  const [items, setItems] = React.useState([
    { id: '1', name: 'Widget A', price: 100 },
  ]);
  const elementRef = React.useRef<HTMLElement>(null);

  const handleOrderChange = (e: CustomEvent<{ total: number }>) => {
    console.log('총 주문 금액 변경됨:', e.detail.total);
  };

  return (
    <div>
      <h1>React 19 Host Application</h1>
      <ReactOrderBridge
        ref={elementRef}
        customerName="홍길동"
        items={items}
        onOrderChange={handleOrderChange}
      />
      <button onClick={() => setItems(prev => [...prev, { id: '2', name: 'Widget B', price: 200 }])}>
        품목 추가
      </button>
    </div>
  );
}
```

---

### 4.4 서버 사이드 렌더링(SSR) 및 클라이언트 하이드레이션 (`createSSR` & `hydratePreact`)

서버 환경에서는 DOM 전역 객체 없이 순수 HTML 문자열을 렌더링하고, 브라우저에서는 기존 서버 DOM 노드를 재사용하여 빠르게 하이드레이션합니다.

> **주의**: 서버 렌더링을 실행하려면 `preact-render-to-string`이 설치되어 있어야 합니다.

```typescript
// 1. 공유 컴포넌트 (SharedView.tsx)
import { h } from 'preact';

export interface CounterInput {
  initialCount: number;
  label: string;
}

export function CounterView({ input }: { input: CounterInput }) {
  return (
    <div class="counter-container">
      <h3>{input.label}</h3>
      <p>현재 값: <span>{input.initialCount}</span></p>
    </div>
  );
}
```

```typescript
// 2. 서버 사이드 렌더링 (server.ts - Node.js / Edge)
import { createSSR } from '@context-action/preact-ui/ssr';
import { CounterView } from './SharedView.js';

// 브라우저 전역 객체(window, document)에 접근하지 않는 순수 문자열 렌더러 생성
const ssr = createSSR(CounterView);

export function renderPage(count: number): string {
  const renderedHtml = ssr.render({
    initialCount: count,
    label: '서버 렌더링 카운터',
  });

  return `
    <!DOCTYPE html>
    <html>
      <head><title>SSR Page</title></head>
      <body>
        <!-- 서버에서 렌더링된 자식 마크업이 포함된 루트 컨테이너 -->
        <div id="counter-root">${renderedHtml}</div>
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  `;
}
```

```typescript
// 3. 클라이언트 하이드레이션 (client.ts - Browser)
import { hydratePreact } from '@context-action/preact-ui';
import { CounterView } from './SharedView.js';

const rootElement = document.getElementById('counter-root')!;

// 서버에서 렌더링된 마크업을 입양하여 이벤트 리스너와 시그널을 연결
const instance = hydratePreact(rootElement, CounterView, {
  initialCount: 10,
  label: '클라이언트 활성화 카운터',
});

// 하이드레이션 이후의 갱신은 일반 Preact render로 원활하게 처리됨
// instance.update({ initialCount: 11, label: '갱신된 카운터' });
```

---

## 5. 문제 해결 및 진단 가이드 (Actionable Troubleshooting)

라이브러리 사용 시 발생할 수 있는 주요 오류 코드, 원인 및 해결 방법입니다.

| 오류 메시지 / 진단 코드 | 발생 조건 및 상황 | 소스 코드 상의 근본 원인 | 해결 방법 (Actionable Fix) |
|---|---|---|---|
| `ERR_MODULE_NOT_FOUND`<br>`Cannot find package 'react'` 또는<br>`Cannot find module 'react'` | `react`가 설치되지 않은 환경에서 `@context-action/preact-ui/react-bridge`를 import한 경우 | `src/react-bridge.ts:1`에서 `react`를 직접 import함 | React 브릿지를 사용할 프로젝트에 React를 설치합니다:<br>`npm install react` 또는 `pnpm add react`.<br>순수 Preact 애플리케이션이라면 `@context-action/preact-ui`(Base)만 import하세요. |
| `ERR_MODULE_NOT_FOUND`<br>`Cannot find package 'preact-render-to-string'` | `preact-render-to-string`이 없는 환경에서 `@context-action/preact-ui/ssr`을 import한 경우 | `src/ssr.ts:3`에서 `preact-render-to-string`을 직접 import함 | 서버 렌더링 모듈에 의존성을 설치합니다:<br>`npm install preact-render-to-string`.<br>클라이언트 전용 번들에서는 `./ssr`을 import하지 마세요. |
| `Error: Mount root must be empty; existing DOM is not adopted or hydrated` | 자식 노드(`childNodes`)가 이미 존재하는 엘리먼트에 `mountPreact`를 호출한 경우 | `src/ownership.ts:42-44`<br>`root.hasChildNodes()` 검사 실패 | 마운트 전 컨테이너를 비웁니다 (`container.replaceChildren()`).<br>만약 서버 사이드 렌더링 마크업을 연결하려는 목적이라면 `hydratePreact`를 호출하세요. |
| `Error: Hydration root must contain server-rendered children` | 자식 노드가 없는 빈 엘리먼트에 `hydratePreact`를 호출한 경우 | `src/ownership.ts:65-67`<br>`!root.hasChildNodes()` 검사 실패 | 하이드레이션 대상 엘리먼트에 서버 렌더링된 HTML이 삽입되었는지 확인하세요. 클라이언트 전용 마운트라면 `mountPreact`를 사용해야 합니다. |
| `Error: A managed DOM root already owns this light-DOM region` | 이미 다른 `mountPreact`/`hydratePreact`에 의해 관리 중인 Light-DOM 영역의 조상 또는 자손 엘리먼트에 중첩 마운트를 시도한 경우 | `src/ownership.ts:22-31`<br>`assertUnmanagedAncestors` 검사 실패 | 동일한 Light-DOM 트리 내에서 관리 루트를 중첩하지 마세요. 하위 컴포넌트 분리가 필요하다면 Custom Element의 `ShadowRoot` 내부로 격리하세요. |
| `Error: Template requires exactly one empty [data-preact-root]` | `<template>` 내부에 `[data-preact-root]` 속성을 가진 엘리먼트가 0개이거나 2개 이상인 경우, 또는 해당 루트 엘리먼트에 이미 자식 노드가 존재하는 경우 | `src/template.ts:17-19`<br>루트 엘리먼트 개수 및 빈 상태 검증 실패 | 템플릿 마크업 내부에 내용이 비어 있는 엘리먼트 하나에만 `data-preact-root` 속성을 부여하세요. (예: `<div data-preact-root></div>`). |
| `Error: Cannot update a destroyed UI boundary` 또는<br>`Cannot update a destroyed hydrated UI boundary` | 이미 `destroy()`가 호출된 인스턴스에 `update(nextInput)`를 호출한 경우 | `src/mount.ts:40`,<br>`src/hydrate.ts:46`<br>`destroyed` 플래그 검사 실패 | `instance.destroyed` 플래그를 확인하여 이미 해제된 뷰에는 업데이트를 호출하지 않도록 방어 로직을 작성하거나, 새 루트에 새로 마운트하세요. |
| `AggregateError: UI cleanup failed` | `createDisposalScope`의 `dispose()` 호출 중 하나 이상의 정리 콜백 함수가 예외를 발생시킨 경우 | `src/disposal-scope.ts:24`<br>수집된 에러 집계 | `error.errors` 배열을 검사하여 어떤 리소스(구독 해제, 모델 정리 등)에서 예외가 발생했는지 확인하고 해당 정리 콜백 내부의 오류를 수정하세요. |
| `Error: <tag-name> is already registered` | 브라우저 런타임에 이미 등록된 동일한 태그 이름으로 `definePreactElement`를 다시 실행한 경우 | `src/custom-element.ts:108-110`<br>`customElements.get(tagName)` 중복 검사 | `customElements.get(tagName)`으로 사전 등록 여부를 확인하거나, 고유한 컴포넌트 태그 이름을 지정하세요. |
| `Error: Custom elements require a browser environment` | 브라우저 전역(`customElements`)이 없는 Node.js/서버 환경에서 `definePreactElement`를 호출한 경우 | `src/custom-element.ts:104-106`<br>환경 검증 실패 | 웹 컴포넌트 선언 및 등록 코드는 브라우저 클라이언트 환경에서만 실행되도록 분리하거나 동적 import를 사용하세요. |

---

## 6. 상세 문서 및 권장 학습 경로

1. [DOM 소유권 컨벤션](docs/01-dom-ownership.md): 반드시 지켜야 할 경계와 수명 규칙.
2. [적용 가이드](docs/02-integration-guide.md): 패키지 책임과 상태 연결 방법.
3. [공개 API 사양서](docs/03-api.md): 입력·출력·실패·해제 계약 전체 명세.
4. [Signals 프로젝션 & 비즈니스 훅 컨벤션](docs/05-signal-projection-convention.md): Context-Layered 관심사 분리와 프로젝션 훅 / 비즈니스 로직 훅 표준.
5. [순수 HTML 이식 & Web Component 아키텍처 리뷰](docs/06-standalone-embed-and-web-components.md): UMD 마운트 vs Web Component 이식 방식 비교 및 실증.
6. [모듈식 Web Component & Signals 통합 컨벤션](docs/07-modular-web-components-and-signals-convention.md): 가상 DOM 격리, 3계층 모듈화, 크로스 시그널 공유 표준.
7. [FACE 및 React 상호운용성 브릿지 가이드](docs/08-form-associated-elements-and-react-bridge.md): 표준 HTML 폼 연동 및 선택적 `@context-action/preact-ui/react-bridge` 컴포넌트.
8. [웹 컴포넌트 인터페이스 설계 및 상태 관리 표준 규약](../lit-ui/docs/05-interface-and-state-management-standards.md): Lit & Preact 공통 인터페이스 작성 규칙, 상태 3계층 모델, 4대 대원칙.
9. [범용 공개 계약](docs/09-public-component-contract.md): 컴포넌트 입력·명령·이벤트의 의미와 소비자 경계.
10. [작성 가이드](docs/10-component-authoring-guide.md): Controller·View·Host adapter의 책임과 Custom Element 작성 순서.
11. [생명주기와 자원](docs/11-lifecycle-and-resources.md): 인스턴스와 connection session, 정리·재연결·비동기 결과 규칙.
12. [계약 검증](docs/12-contract-verification.md): 정적·통합·실제 브라우저 검증 범위와 변경 영향.
13. [Layer Panel 참조 구현](examples/layer-panel/README.md): 하나의 공개 계약을 두 host adapter에 적용한 예제.
14. [SSR 진입점 가이드](docs/03-api.md): `@context-action/preact-ui/ssr`의 server-only render와 `hydratePreact` 계약.

구현 예제 코드는 [examples/](examples/README.md)에 위치하며, 실제 검증 결과와 남은 범위는 [검증 기록](docs/04-validation.md)에 기록되어 있습니다.

---

## 7. 릴리즈 현황 및 계약 검증 (Release Status & Verification)

`@context-action/preact-ui@0.1.0`은 `@context-action/preact@0.1.0`과 함께 배포되는 공개 preview 패키지입니다. Core/React 안정 cohort와는 별도의 Preact 공개 cohort로 관리되며, 0.x 계약이므로 1.0 승격 전 API와 지원 범위가 변경될 수 있습니다.

### 패키지 검증 명령
```sh
# 1. 단위 및 통합 테스트 실행 (64 tests across 11 suites)
pnpm --filter @context-action/preact-ui test

# 2. 브라우저/네이티브 DOM 소유권 계약 테스트 (13 tests)
pnpm --filter @context-action/preact-ui test:native

# 3. 엄격한 TypeScript 타입 검증
pnpm --filter @context-action/preact-ui type-check

# 4. 모노레포 코드 품질 린트 및 규약 검증
pnpm lint
pnpm convention:check

# 5. Preact 공개 배포 명세 적합성 검증
pnpm verify:preact-public-release -- --require-current-source
```
