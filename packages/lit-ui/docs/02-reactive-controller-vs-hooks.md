# ReactiveController vs React Hooks & 3-Layer Architecture in Lit

이 문서는 React Hooks의 멘탈 모델과 Lit의 `ReactiveController` 패러다임을 심층 비교하고, `@context-action/lit` 및 `@context-action/lit-ui`를 활용하여 구축하는 **3계층 아키텍처(Action - Store - View)**를 설명합니다.

---

## 1. 멘탈 모델 비교: React Hooks vs Lit ReactiveControllers

React Hooks와 Lit ReactiveController는 모두 컴포넌트에 상태와 수명 주기를 합성(Composition)하는 도구이지만, 그 기반 철학은 근본적으로 다릅니다.

| 비교 항목 | React Hooks (`useEffect`, `useSyncExternalStore`) | Lit ReactiveControllers (`StoreController`, `ActionController`) |
|-----------|---------------------------------------------------|-----------------------------------------------------------------|
| **실행 패러다임** | **함수형 재실행 (Functional Re-execution)**<br>상태 변경마다 컴포넌트 함수 전체가 처음부터 끝까지 재호출됨 | **객체지향 수명주기 참여 (Object-Oriented Lifecycle Participant)**<br>클래스 인스턴스가 유지되며, 수명주기 이벤트 훅이 호출됨 |
| **호출 규칙** | **Strict Rules of Hooks**<br>루프, 조건문, 중첩 함수 내 호출 불가. 호출 순서가 고정되어야 함 | **Class Field / Constructor Initialization**<br>일반 클래스 필드로 인스턴스화. 조건부 생성이나 지연 생성도 유연하게 가능 |
| **클로저 함정 (Closure Traps)** | `useCallback`, `useMemo`, `useEffect` 의존성 배열(`[deps]`) 관리 필요. 누락 시 Stale State 버그 발생 | **클로저 함정 없음**<br>인스턴스 프로퍼티와 게터(`controller.value`)를 직접 참조하므로 항상 최신 상태 보장 |
| **렌더링 비용** | 전체 Virtual DOM diffing 트리 계산 발생 | TemplateResult의 동적 Part만 O(1)로 미세 갱신 (Virtual DOM 없음) |
| **연결/해제 수명** | `useEffect`의 cleanup 콜백이 commit phase 이후 비동기 실행 | 브라우저 표준 `connectedCallback` / `disconnectedCallback`과 동기적으로 실행 |

### 핵심 차이 요약
* **React Hooks**는 컴포넌트의 렌더 함수가 계속 다시 도는 과정에서 "기억(Memory)"을 유지하기 위한 트릭입니다.
* **Lit ReactiveController**는 Custom Element 인스턴스에 붙어서 **DOM 수명 주기(Connect/Disconnect/Update)에 직접 동참하는 독립적인 협력 객체**입니다.

---

## 2. Lit에서의 3계층 아키텍처 (3-Layer Architecture)

Context-Action 프레임워크는 Lit 기반 컴포넌트에서도 완벽한 관심사 분리를 보장하는 **3계층 구조(Action - Store - View)**를 구현합니다.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        1. Action Layer (Logic)                         │
│  ActionRegister<A, R> ◄────── ActionController<A, R>                  │
│  - Pipeline handlers          - Typed dispatch / dispatchWithResult    │
│  - Priority orchestration     - Coalesced isPending tracking           │
│  - Business side-effects      - Lifecycle AbortSignal propagation      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Updates domain state
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        2. Store Layer (State)                          │
│  ReadableStore<T>     ──────► StoreController<T, Selected>            │
│  - Single source of truth     - Synchronous initial snapshot           │
│  - Subscription broadcaster   - Selective projection & equalityFn      │
│  - Immutable domain state     - Leak-free unbind & resync on connect   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Triggers host.requestUpdate()
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         3. View Layer (UI)                             │
│  LitElement / FormAssociatedLitElement                                 │
│  - Shadow DOM encapsulation (mode: 'open', scoped CSS)                │
│  - Declarative rendering via html`...`                                 │
│  - Dispatches native CustomEvent for user interactions                 │
│  - Bridges to React 18/19 via createLitElementBridge                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Layer 1: Action Layer (액션 및 조율 계층)
* **`ActionRegister<A, TResultMap>`**: `@context-action/core`의 핵심 비즈니스 파이프라인. 액션 핸들러의 우선순위 실행, 인터셉터, 도메인 검증을 담당합니다.
* **`ActionController<A, TResultMap>`**: ActionRegister를 Lit의 ReactiveController로 감싸는 어댑터.
  - `dispatch('actionName', payload)`: 타입 세이프한 디스패치.
  - `isPending`: 0 ↔ >0 전환 시에만 `requestUpdate()`를 호출하여 불필요한 리렌더를 억제하고 로딩 UI를 제어 (Pending State Coalescing).
  - `AbortSignal` 자동 주입: 호스트 엘리먼트가 DOM에서 분리되면 진행 중인 비동기 액션을 즉시 취소(`AbortError`).

### 2.2 Layer 2: Store Layer (상태 및 프로젝션 계층)
* **`ReadableStore<T>`**: 도메인 상태의 원천(`getValue()` / `getSnapshot()`, `subscribe()`).
* **`StoreController<T, Selected>`**:
  - `selector`: 필요한 데이터 슬라이스만 선택적으로 투영.
  - `equalityFn`: 투영된 결과가 동일하면 `requestUpdate()`를 억제하여 고빈도 변경 상황에서도 렌더링 비용을 0으로 유지.
  - `hostDisconnected()` 시 즉시 구독 해제하여 메모리 누수를 완벽 차단.
* **`ContextStoreController` / `ContextActionController`**: W3C Context Protocol (`@lit/context`)을 통해 Shadow DOM 경계를 넘어 상위 Provider로부터 스토어와 레지스터를 자동 주입(DI).

### 2.3 Layer 3: View Layer (표현 및 커스텀 엘리먼트 계층)
* **`LitElement` / `FormAssociatedLitElement`**:
  - 뷰 렌더링만을 담당하며 비즈니스 로직을 포함하지 않습니다.
  - `render()` 메서드는 컨트롤러의 상태(`this.store.value`, `this.actions.isPending`)를 읽어 순수 HTML 템플릿(`TemplateResult`)을 반환합니다.
  - 사용자의 인터랙션은 표준 `CustomEvent`(`bubbles: true, composed: true`)로 외부에 알립니다.

---

## 3. 실전 구현 예제 (Implementation Recipe)

### 3.1 액션 및 스토어 정의 (Domain Logic)
```ts
// cart-domain.ts
import { ActionRegister } from '@context-action/core';
import type { ReadableStore } from '@context-action/lit';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  currency: string;
}

export interface CartActions {
  addItem: { product: Omit<CartItem, 'quantity'> };
  updateQuantity: { id: string; quantity: number };
  clearCart: void;
}
```

### 3.2 3계층 Lit 컴포넌트 구현
```ts
// lit-cart-badge.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { StoreController, ActionController } from '@context-action/lit';
import type { ReadableStore } from '@context-action/lit';
import type { ActionRegister } from '@context-action/core';
import type { CartState, CartActions } from './cart-domain.js';

@customElement('lit-cart-badge')
export class LitCartBadge extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      font-family: system-ui, sans-serif;
    }
    .badge {
      background: #0070f3;
      color: white;
      padding: 4px 8px;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .badge:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .spinner {
      width: 12px;
      height: 12px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  // Controllers attached as persistent class members
  protected cartStore: StoreController<CartState, number>;
  protected cartActions: ActionController<CartActions>;

  constructor(store: ReadableStore<CartState>, register: ActionRegister<CartActions>) {
    super();

    // 1. Store Layer: Selective projection with memoization
    this.cartStore = new StoreController(this, store, {
      selector: (state) => state.items.reduce((acc, item) => acc + item.quantity, 0),
      equalityFn: Object.is, // Suppresses rerender if total count is unchanged
    });

    // 2. Action Layer: Typed dispatch and pending tracking
    this.cartActions = new ActionController(this, register);
  }

  private handleClick = async () => {
    // Dispatch custom event to notify outer container
    this.dispatchEvent(
      new CustomEvent('cart-badge-click', {
        bubbles: true,
        composed: true,
        detail: { totalCount: this.cartStore.value },
      })
    );
  };

  // 3. View Layer: Pure declarative rendering
  override render() {
    const count = this.cartStore.value;
    const isPending = this.cartActions.isPending;

    return html`
      <button
        class="badge"
        part="button"
        ?disabled=${isPending}
        @click=${this.handleClick}
      >
        <span>장바구니</span>
        <span part="count">${count}</span>
        ${isPending ? html`<span class="spinner" part="spinner"></span>` : ''}
      </button>
    `;
  }
}
```

---

## 4. 수명 주기 및 동작 차이 분석 (Deep Dive)

### 4.1 언마운트 시 정리 (Unmount Cleanup)
* **React**: `useEffect` cleanup은 리액트 스케줄러가 DOM 노드를 제거한 뒤 비동기적으로 실행됩니다. 이 과정에서 취소되지 않은 비동기 작업이 setState를 호출해 경고를 유발하거나 메모리 누수를 남기기 쉽습니다.
* **Lit**: 브라우저 엔진이 DOM 트리를 떼어내는 순간 네이티브 `disconnectedCallback`에 의해 `hostDisconnected()`가 **동기적으로** 호출됩니다.
  - `StoreController.hostDisconnected()`: 즉시 `unsubscribe()`를 호출하여 스토어의 리스너 셋에서 완전히 제거됩니다 (리스너 수 = 0).
  - `ActionController.hostDisconnected()`: `this.#abortController.abort()`를 즉시 실행하여 진행 중이던 네트워크 요청 및 파이프라인 처리를 즉각 취소합니다.

### 4.2 재연결 시 무결성 동기화 (Reconnection Resynchronization)
* React 컴포넌트는 트리에서 빠졌다가 다시 들어가면 컴포넌트가 파괴되고 새로 마운트됩니다.
* Lit Custom Element는 DOM 위치가 이동되어도 동일한 인스턴스가 유지됩니다.
* `StoreController.hostConnected()`가 호출되면:
  1. 스토어를 즉시 다시 구독합니다.
  2. 분리되어 있던 동안 변경된 최신 원본 상태를 읽어와 프로젝션을 재평가합니다.
  3. 이전 값과 달라졌을 때만 `host.requestUpdate()`를 요청하여 깜빡임 없는 완벽한 동기화를 달성합니다.

### 4.3 선택적 프로젝션과 동등성 비교 (Selective Projection Memoization)
* React에서는 `useSelector(selector, shallowEqual)`나 `useSyncExternalStore`에서 항상 동일한 참조를 반환하도록 메모이제이션하지 않으면 무한 루프에 빠집니다.
* Lit의 `StoreController`는 스토어의 `subscribe` 리스너 내부에서 프로젝션과 동등성 검사를 직접 수행합니다:
  ```ts
  const nextRaw = this.#extractRawValue();
  const nextSelected = this.#selector(nextRaw);

  if (!this.#equalityFn(this.#selectedValue, nextSelected)) {
    this.#selectedValue = nextSelected;
    this.#host.requestUpdate();
  }
  ```
* 따라서 아무리 빈번하게 스토어가 갱신되어도, 컴포넌트가 바라보는 슬라이스가 동일하다면 `requestUpdate()`는 **단 한 번도 호출되지 않으며, Lit의 마이크로태스크 렌더 큐에 아무런 작업도 등록되지 않습니다.**

### 4.4 지능형 펜딩 상태 합산 (Pending State Coalescing)
* 복수의 액션이 동시에 실행될 때, 각 액션 시작과 종료 시점마다 매번 렌더링을 요청하면 불필요한 레이아웃 스래싱이 발생합니다.
* `ActionController`는 활성 디스패치 카운터(`activeCount`)를 관리하여 `0 -> 1`(로딩 시작) 및 `1 -> 0`(로딩 완료) 경계에서만 `requestUpdate()`를 트리거합니다:
  ```ts
  const prevCount = this.#activeCount;
  this.#activeCount++;
  if (prevCount === 0) {
    this.#host.requestUpdate();
  }
  ```
