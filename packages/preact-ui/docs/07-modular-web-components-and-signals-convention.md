# Preact Signals & Web Component 모듈식 통합 아키텍처 및 코딩 컨벤션

> 이 문서는 Signals와 Web Component를 조합하는 선택적 구현 패턴이다. 모든 컴포넌트가 `definePreactElement`나 전역 Signal을 사용해야 한다는 뜻이 아니다. 범용 정본은 [공개 계약](09-public-component-contract.md), [작성 가이드](10-component-authoring-guide.md), [생명주기 규칙](11-lifecycle-and-resources.md)이며, 이 문서의 예시는 그 규칙을 적용한 한 가지 방법이다.

이 문서는 **Preact Signals**의 고성능 반응성, **가상 DOM(Virtual DOM)**의 선언적 생산성, 그리고 **웹 컴포넌트(Custom Elements & Shadow DOM)**의 표준 캡슐화를 모듈식으로 결합할 때 지켜야 할 **공식 아키텍처 및 코딩 컨벤션**을 정의합니다.

---

## 1. 아키텍처 목표 및 오해 해소

### ❓ "가상 DOM을 관리해야 해서 Web Component와 모듈식 결합이 어려운가?"
**결론: 전혀 어렵지 않으며, 오히려 Preact Signals는 Web Component와 가장 완벽한 시너지를 냅니다.**

과거 React 생태계에서 가상 DOM과 Web Component가 충돌했던 주된 원인은 다음과 같습니다:
1. **DOM 독점성**: 가상 DOM 렌더러가 Custom Element 자체(`this`)와 자식 트리를 통째로 통제하려 함.
2. **리렌더링 폭포수**: 상태 변경 시 컴포넌트 함수 전체를 재실행하여 가상 DOM diffing을 강제함.

**Preact Signals가 이를 해결하는 원리:**
* **Virtual DOM 우회(Bypass)**: Signal이 변경될 때 가상 DOM diffing 엔진을 거치지 않고, **해당 텍스트 노드나 속성만 O(1)로 미세 갱신(Fine-grained Update)**합니다.
* **Shadow DOM 위임(Delegation)**: Preact 렌더러에게는 Shadow DOM 내부의 전용 빈 컨테이너(`this.#root`)만 위임하므로 호스트 엘리먼트나 외부 DOM과 충돌할 여지가 전혀 없습니다.

---

## 2. 모듈화 3계층 표준 (3-Tier Modular Hierarchy)

모듈은 재사용성과 트리쉐이킹(Tree-shaking)을 위해 엄격히 3계층으로 분리하여 export/import합니다.

```text
packages/preact-ui/examples/modular-signals-wc/
├── shared-cart-signal.ts    # [Level 1] 순수 도메인 시그널 모듈 (DOM/HTML 0%)
├── cart-badge-element.tsx   # [Level 2] <cart-badge> 정의 모듈 (Side-effect Free)
├── cart-drawer-element.tsx  # [Level 2] <cart-drawer> 정의 모듈 (Side-effect Free)
└── index.ts                 # [Level 3] 모듈식 재수출 (Tree-shakeable Entry)
```

### [Level 1] 순수 도메인 & 시그널 모듈 (`shared-*-signal.ts`)
* **책임**: 도메인 상태와 반응형 파생 신호(`ReadonlySignal`), 순수 비즈니스 함수 관리.
* **규칙**: **DOM, `HTMLElement`, `window`, JSX 의존성을 단 1줄도 포함하지 않습니다.**
* **효과**: Web Component뿐만 아니라 React, Vue, Svelte, Node.js 서버, 바닐라 JS 등 모든 환경에서 공유 가능.

Level 1의 writable signal은 domain module 내부 구현이다. 모듈식 소비자 entry에서는 writable signal을 그대로 재수출하지 않고 `ReadonlySignal` projection과 intent 함수만 공개한다. 외부 계약은 `.value` 대입이 아니라 명시적인 명령으로 상태를 변경한다.

```ts
// shared-cart-signal.ts (Level 1)
import { signal, computed } from '@preact/signals';
import type { ReadonlySignal } from '@preact/signals';

export const cartItemsSignal = signal<readonly CartProduct[]>([]);

export const cartItemCountSignal: ReadonlySignal<number> = computed(() =>
  cartItemsSignal.value.reduce((sum, item) => sum + item.quantity, 0)
);

export function addProductToCart(product: CartProduct) {
  cartItemsSignal.value = [...cartItemsSignal.value, product];
}
```

---

### [Level 2] 커스텀 엘리먼트 정의 모듈 (`*-element.tsx`)
* **책임**: 특정 UI 역할을 수행하는 Custom Element 클래스 선언.
* **규칙**:
  1. **Side-effect Free**: 모듈을 `import`하는 것만으로 `customElements.define`이 자동 실행되지 않도록, 반드시 `defineXElement(tagName?)` 함수 형태로 export합니다.
  2. **선택적 프리미티브 사용**: 기존 `definePreactElement()`를 사용할 수 있지만, 컴포넌트 의미·입력·이벤트·연결 세션은 작성자가 별도로 정의합니다. 공통 factory가 이를 추론하지 않습니다.
  3. **통신 표준**: 외부 통신은 항상 표준 **Property, Attribute, CustomEvent**를 통합니다.

```tsx
// cart-badge-element.tsx (Level 2)
import { definePreactElement } from '@context-action/preact-ui';
import { cartItemCountSignal } from './shared-cart-signal.js';

export function defineCartBadgeElement(tagName = 'cart-badge') {
  return definePreactElement({
    tagName,
    style: `:host { display: inline-block; } button { font-weight: 600; }`,
    setup(element) {
      function CartBadgeView() {
        return (
          <button
            type="button"
            onClick={() => {
              element.dispatchEvent(new CustomEvent('cart-badge-click', { bubbles: true, composed: true }));
            }}
          >
            <span>장바구니: </span>
            {/* Virtual DOM diffing을 우회하는 Signal 직접 바인딩 */}
            <output>{cartItemCountSignal}</output>
          </button>
        );
      }
      return { view: CartBadgeView, getInput: () => undefined };
    },
  });
}
```

---

### [Level 3] 선언적 마크업 및 호스트 앱 조립
* **책임**: HTML 문서 또는 호스트 프레임워크에서 모듈을 선택적으로 import하여 선언적 조립.

```html
<script type="module">
  // 필요한 모듈만 명시적으로 import
  import { defineCartBadgeElement, defineCartDrawerElement, addProductToCart } from './index.js';

  // 태그 등록
  defineCartBadgeElement('site-cart-badge');
  defineCartDrawerElement('site-cart-drawer');

  // 외부 바닐라 코드에서 비즈니스 함수 호출
  document.getElementById('buy-btn').addEventListener('click', () => {
    addProductToCart({ id: 'p1', name: '키보드', price: 120, quantity: 1 });
  });
</script>

<!-- 헤더에는 뱃지 배치 -->
<header>
  <site-cart-badge></site-cart-badge>
</header>

<!-- 본문/사이드바에는 서랍 배치 -->
<aside>
  <site-cart-drawer></site-cart-drawer>
</aside>
```

---

## 3. 가상 DOM 관리 및 충돌 방지 "3대 골든 룰"

### 룰 1: Host 태그 직접 위임 금지 (Shadow Root Delegation)
* ❌ **Bad**: `mountPreact(this, View)`  
  → Custom Element 자신을 가상 DOM 컨테이너로 쓰면, 호스트 속성이나 외부 라이트 DOM 조작과 충돌합니다.
* ✅ **Good**: `mountPreact(this.shadowRoot.querySelector('#root'), View)`  
  → 가상 DOM 렌더러에게는 Shadow DOM 내부의 격리된 `#root`만 위임합니다.

### 룰 2: 수명 분리 (State vs Renderer Lifecycle Decoupling)
* ❌ **Bad**: `disconnectedCallback()`에서 Signal이나 도메인 모델까지 파괴.  
  → 탭 전환, BFCache 복원, 가상 스크롤 등으로 요소가 잠시 DOM에서 떨어졌다가 다시 붙을 때 사용자의 작성 상태가 소실됩니다.
* ✅ **Good**: `disconnectedCallback()`에서는 **Preact 렌더러(`mount.destroy()`)만 언마운트**하고, 도메인 Signal/상태는 그대로 유지합니다. 영구적인 정리가 필요할 때만 명시적 `element.dispose()`를 호출합니다.

### 룰 3: Signal DOM 직결 바인딩 (Virtual DOM Bypass)
* ❌ **Bad**: 매 렌더링마다 `const count = countSignal.value; return <span>{count}</span>;`  
  → 값이 바뀔 때마다 컴포넌트 렌더 함수 전체가 재실행됩니다.
* ✅ **Good**: `<span>{countSignal}</span>` 또는 `<output>{countSignal}</output>`  
  → JSX 자식 노드에 Signal 객체 자체를 전달하면, 컴포넌트 재실행 없이 DOM 텍스트 노드만 O(1)로 직접 패치됩니다.

---

## 4. 다중 엘리먼트 간 크로스 시그널 공유 (Cross-Element Signal Sharing)

서로 다른 Custom Element(`<cart-badge>`와 `<cart-drawer>`)가 서로 다른 DOM 브랜치, 심지어 완전히 격리된 서로 다른 `ShadowRoot` 안에 위치하더라도:
1. 두 엘리먼트 모두 Level 1 모듈의 `cartItemCountSignal`을 바라보고 있습니다.
2. 어느 한 곳이나 외부 스크립트에서 `addProductToCart()`를 호출하면,
3. 각 Shadow DOM 내부의 텍스트 노드가 Signals binding으로 독립 갱신될 수 있습니다. 실제 지연·DOM 갱신 범위는 대상 browser와 입력 빈도에서 측정해야 하며, Signals 사용만으로 성능을 보장하지 않습니다.
4. 전역 가상 DOM 트리를 공유하지 않으므로, 엘리먼트 A의 갱신이 엘리먼트 B의 가상 DOM diffing을 유발하지 않습니다.

---

## 5. 안티패턴 및 체크리스트

| 안티패턴 (Bad) | 올바른 패턴 (Good) | 이유 |
|---|---|---|
| `import 'my-element.js'` 시 자동으로 `customElements.define` 실행 | `export function defineMyElement()` 함수 제공 | 번들러의 트리쉐이킹 방해 및 태그명 충돌 방지 |
| Custom Element 내부에서 글로벌 Signal을 직접 수정 | Level 1의 비즈니스 인텐트 함수(`addProductToCart`) 호출 | 상태 변경 추적성 확보 및 단방향 데이터 흐름 유지 |
| `disconnectedCallback`에서 Model을 완전히 dispose | 렌더러만 unmount하고 모델은 보존 | 탭 이동이나 DOM 재배치 시 상태 보존 (재연결 탄력성) |
| Shadow DOM 안쪽 요소를 외부에서 직접 쿼리 | Custom Element의 Property/Method/CustomEvent 사용 | 캡슐화 원칙 준수 및 내부 가상 DOM 구조 변경에 안전 |
