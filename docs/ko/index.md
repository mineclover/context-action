---
layout: home
title: Context Action
titleTemplate: 타입 안전한 액션 파이프라인 관리 시스템

hero:
  name: Context Action
  text: 타입 안전한 액션 파이프라인 관리 시스템
  tagline: React 18/19, W3C Web Components(Lit & Preact), 엔터프라이즈 디자인 시스템을 아우르는 차세대 상태 관리 프레임워크
  image:
    src: /logo.svg
    alt: Context Action
  actions:
    - theme: brand
      text: 표준 컨벤션 보기
      link: /ko/context-layered/implementation-convention
    - theme: alt
      text: 시나리오 라이브러리
      link: /ko/examples/implementation-playbook-scenarios

features:
  - icon: 📐
    title: 표준 아키텍처 컨벤션
    details: Action, Store, View 3계층 분리와 Context-Layered 패턴을 고정하는 공식 표준
  - icon: 🧩
    title: W3C 웹 컴포넌트 (Lit & Preact)
    details: Zero VDOM 초경량 Lit과 미세 반응형 Preact Signals 기반의 독립 캡슐화 컴포넌트
  - icon: 🎨
    title: 엔터프라이즈 디자인 시스템
    details: Shadow DOM CSS 토큰 주입, ::part() 훅, React Aria 완벽 호환
  - icon: ⚡
    title: 120fps 고성능 상태 관리
    details: Selective Projection과 Equality Guard로 불필요한 리렌더링 0 보장
  - icon: 📝
    title: 폼 표준 (FACE)
    details: ElementInternals 기반의 네이티브 form/FormData 완벽 통합 및 폼 리셋 라이프사이클
  - icon: 🛡️
    title: 엄격한 인터페이스 계약
    details: Property/Attribute 엄격 분리, typed CustomEvent, React 18/19 상호운용 브리지
---

## 🏛️ Context-Action 4대 핵심 개발 표준

Context-Action 프레임워크는 마이크로 프론트엔드와 엔터프라이즈 환경에서 자율성을 보장하면서도 일관된 품질을 유지하기 위해 **4대 핵심 개발 표준(상태 관리, 인터페이스, 디자인 시스템, 웹 컴포넌트 컨벤션)**을 규정합니다.

---

### 1. 📊 상태 관리 아키텍처 (State Management)

도메인 상태의 단일 진실 원천(SSOT)을 유지하고 불필요한 리렌더링을 원천 차단하기 위해 **상태 3계층 모델(3-Tier State Hierarchy)**과 **선택적 프로젝션(Selective Projection)**을 적용합니다.

```text
┌────────────────────────────────────────────────────────────────────────┐
│               3-Tier State Hierarchy (상태 3계층 모델)                 │
├────────────────────────────────────────────────────────────────────────┤
│ [Tier 1] Local UI Transient State : 포커스, 팝오버 오픈, 애니메이션 플래그│
│          → Lit @state(), Preact local signal (컴포넌트 내부 일시 상태)   │
├────────────────────────────────────────────────────────────────────────┤
│ [Tier 2] Component Controlled Value : input value, disabled, validity  │
│          → @property() + ElementInternals.setFormValue() (폼 리셋 복원)│
├────────────────────────────────────────────────────────────────────────┤
│ [Tier 3] Domain Business State : 장바구니 품목, 사용자 세션, 주문 상태  │
│          → Context-Action ReadableStore / Global Signal (SSOT 원천)    │
│          → StoreController / connectSourceSignal 로 선택적 프로젝션 구독 │
└────────────────────────────────────────────────────────────────────────┘
```

* **SSOT (Single Source of Truth)**: 도메인 데이터를 컴포넌트 내부에 중복/복제하여 저장하지 않습니다.
* **Selective Projection**: 스토어 전체가 아닌 컴포넌트에 필요한 최소 슬라이스만 `selector` 함수로 추출합니다.
* **Equality Guard**: 프로젝션 결과가 이전과 같을 경우 `equalityFn`(기본값 `Object.is`)으로 비교하여 렌더링 요청을 억제함으로써 120fps 고주파 이벤트에서도 렌더 비용을 0으로 유지합니다.
* **Coalesced Pending**: `ActionController`를 통해 액션 로딩 상태(`isPending`)를 추적하되, 리렌더링은 0 ↔ >0 전환 시점에만 병합 실행합니다.

---

### 2. 🔌 인터페이스 설계 표준 (Interface Design Standards)

브라우저 표준 및 호스트 프레임워크(React 18/19 등)와의 결합 시 데이터 왜곡을 방지하기 위한 인터페이스 계약입니다.

* **속성(Attribute) vs 프로퍼티(Property) 엄격 분리**:
  - 문자열, 숫자, 불리언 등 프리미티브만 HTML 속성(`kebab-case`)과 1:1 양방향 리플렉션합니다.
  - Store, ActionRegister, Model 객체, 함수 등 복합 객체는 **반드시 `attribute: false`로 선언**하여 HTML 어트리뷰트 문자열화(`"[object Object]"`)를 원천 차단합니다.
* **표준 CustomEvent 디스패칭**:
  - 시맨틱 명칭(`quantity-change`, `cart-badge-click`)을 사용하며, **`{ bubbles: true, composed: true }`를 기본값으로 지정**하여 Shadow DOM 경계를 자연스럽게 탈출합니다.
  - 소비자의 완벽한 타입 안전성을 위해 `export interface XxxEventDetail { ... }` 규격을 필수로 제공합니다.
* **명령형 인스턴스 메서드 (Imperative APIs)**:
  - `.focus()`, `.setValue()`, `.increment()`, `.checkValidity()` 등은 `public`으로 명확히 노출하며, 옵션 객체(`options?: { dispatchEvents?: boolean }`) 패턴으로 부수 효과를 제어합니다.
* **React 18/19 호스트 연동 브리지**:
  - `createLitElementBridge` 및 `createCustomElementBridge`를 통해 복합 객체(`properties: ['store', 'register']`)의 DOM 프로퍼티 직할 할당과 React 카멜케이스 핸들러 ↔ DOM 이벤트 매핑을 자동화합니다.

---

### 3. 🎨 디자인 시스템 적용 방법 (Design System Integration)

웹 컴포넌트의 Shadow DOM 캡슐화 장점을 극대화하면서, 전사 디자인 시스템 토큰 및 외부 테마와 조화롭게 결합하는 기법입니다.

* **CSS Custom Properties 기반 디자인 토큰 주입**:
  - 컴포넌트 내부 스타일은 Fallback을 갖춘 전역 토큰(`var(--stepper-border-color, #cbd5e1)`)으로 참조하여 상위 호스트 문서에서 테마(색상, 타이포그래피, 간격)를 일괄 주입받습니다.
* **`::part()` 의사 요소 훅(Styling Hook) 노출**:
  - 외부에서 미세한 스타일 커스터마이징이 가능하도록 핵심 내부 노드에 `part="button"`, `part="input"` 훅을 명시적으로 노출합니다.
* **Constructable Stylesheets & 테마 적응**:
  - `static override styles = css`...``를 사용하여 브라우저 메모리를 절약하고, 다크 모드(`:host-context([data-theme="dark"])` 또는 미디어 쿼리)에 즉각 반응합니다.
* **Adobe React Aria 호환성**:
  - React Aria Components의 접근성 및 스타일 계약(`data-focus-visible`, `data-hovered`, `data-disabled`)과 완벽히 동기화됩니다.

---

### 4. 🧩 웹 컴포넌트 구현 컨벤션 (Web Component Conventions)

Lit과 Preact 두 가지 런타임의 특성에 맞춘 최적의 구현 컨벤션입니다.

| 구분 | Lit 기반 (@context-action/lit) | Preact 기반 (@context-action/preact) |
|---|---|---|
| **런타임 특성** | **Zero VDOM**, 브라우저 네이티브 템플릿, O(1) Parts 갱신 | **Micro VDOM (3KB)** + `@preact/signals` 미세 반응성 |
| **권장 용도** | 독립형 엔터프라이즈 디자인 시스템, 고성능 기본 컨트롤 | React/JSX 친화적 마이크로 프론트엔드 위젯, 복잡한 로컬 UI |
| **의존성 주입** | **W3C Context Protocol (`@lit/context`)** 완벽 지원 | Direct Property / Setup Closure Injection |
| **상태 바인딩** | `StoreController`, `ActionController` | `connectSourceSignal`, `definePreactElement` |
| **폼 표준 (FACE)** | `FormAssociatedLitElement` 상속 | `PreactElementContext.setFormValue()`, `setValidity()` |

* **결정론적 수명주기 & Zero Memory Leak**:
  - `disconnectedCallback` 시점에 스토어 구독, DOM 이벤트, 진행 중인 비동기 요청(`AbortSignal`)이 동기적으로 완전 해제되어야 합니다.
  - DOM에 재부착(`connectedCallback`)될 때 최신 상태 스냅샷으로 깨끗하게 재동기화됩니다.
* **Form-Associated Custom Elements (FACE) 준수**:
  - `ElementInternals`를 통해 네이티브 `<form>` 참여 및 `new FormData()` 수집을 보장하고, 폼 리셋 시 `onFormReset()` 콜백으로 초기 상태로 복원합니다.

---

## 🧭 추천 학습 경로 및 실전 데모

1. [Implementation Convention](/ko/context-layered/implementation-convention)
2. [Canonical Order Form](/ko/examples/canonical-order-form)
3. [Playbook 시나리오 라이브러리](/ko/examples/implementation-playbook-scenarios)

### 🎮 인터랙티브 라이브 쇼케이스
- [Lit Web Components & React 19 쇼케이스](https://mineclover.github.io/context-action/example/integrations/lit-web-components)
- [Preact Web Components & Signals 쇼케이스](https://mineclover.github.io/context-action/example/integrations/preact-web-components)
- [Canonical Order](https://mineclover.github.io/context-action/example/patterns/implementation-playbook)
- [Access Request](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/access-request)
- [Incident Escalation](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/incident-escalation)
- [Renewal Risk Review](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/renewal-risk-review)
- [Standalone Web Coding Studio](https://mineclover.github.io/context-action/web-coding/)

<style>
.VPFeature .icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.VPFeatures .VPFeature {
  transition: transform 0.2s, box-shadow 0.2s;
}

.VPFeatures .VPFeature:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
</style>
