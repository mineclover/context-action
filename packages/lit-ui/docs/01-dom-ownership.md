# DOM Tree Ownership Convention (Lit & Web Components)

이 문서는 `@context-action/lit` 및 `@context-action/lit-ui`를 사용할 때 준수해야 하는 **DOM 트리 렌더링 소유권(DOM Rendering Ownership)** 원칙과 **Shadow DOM 캡슐화 경계(Encapsulation Boundaries)**를 정의합니다.

---

## 1. 하나의 영역에는 하나의 렌더링 책임자 (Single Ownership Rule)

### 핵심 원칙
> **"하나의 DOM 서브트리에는 오직 하나의 렌더링 엔진(Owner)만이 구조와 속성을 변경할 수 있다."**

Web Component 환경에서 컴포넌트는 두 개의 독립적인 DOM 영역을 가집니다:

1. **외부 Host 영역 (Light DOM)**:
   - **소유자**: 상위 호스트 애플리케이션 (React, Vue, 바닐라 HTML 문서 등).
   - **책임**: Custom Element의 배치(Layout), 외부 스타일(CSS grid/flex), 호스트 속성(Attribute), 그리고 `<slot>`으로 투영될 Light DOM 자식 노드의 배치를 관리합니다.
2. **내부 렌더링 영역 (ShadowRoot / `this.renderRoot`)**:
   - **소유자**: Custom Element 인스턴스 (`LitElement` 또는 `FormAssociatedLitElement`).
   - **책임**: `render()` 메서드가 반환하는 `TemplateResult`(`html`...``)를 통해 Shadow DOM 내부의 모든 노드 생성, 갱신, 삭제를 독점적으로 통제합니다.

```text
┌─────────────────────────────────────────────────────────────┐
│ Host Application (React / HTML Page)                        │
│ - Owns: Custom Element tag placement (<lit-cart-badge>)     │
│ - Controls via: Properties, Attributes, Events              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                       [Shadow Boundary] (mode: 'open')
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ LitElement (Internal Owner)                                 │
│ - Owns: this.renderRoot (ShadowRoot)                        │
│ - Updates: Declarative TemplateResult via html`...`         │
│ - Controllers: StoreController, ActionController (Headless) │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Shadow DOM 캡슐화 경계 및 스타일 격리

### 2.1 캡슐화 보장
* `LitElement`는 기본적으로 `mode: 'open'`인 `ShadowRoot`를 생성합니다.
* 컴포넌트 내부 스타일은 `static styles = css`...``를 통해 Constructable Stylesheet로 캡슐화되어 외부 CSS 오염과 충돌을 원천 차단합니다.
* 외부 소비자는 컴포넌트 내부 DOM 노드(`shadowRoot.querySelector(...)`, `shadowRoot.innerHTML`)를 검색하거나 직접 수정해서는 안 됩니다.

### 2.2 허용된 외부 제어 계약 (Public Contract)
외부와의 모든 상호작용은 반드시 W3C 표준 인터페이스를 통해서만 이루어집니다:

1. **입력 (Input)**:
   - **DOM Property**: 복합 객체, 스토어, 원시값 (`element.value = 10`, `element.cartStore = ...`).
   - **HTML Attribute**: 원시 설정값 (`disabled`, `required`, `name="quantity"`).
2. **명령 (Command)**:
   - Custom Element의 공개 메서드 호출 또는 `ActionController`를 통한 액션 파이프라인 디스패치.
3. **출력 (Output / Events)**:
   - Shadow DOM 경계를 통과하는 표준 DOM 이벤트: `new CustomEvent('quantity-change', { bubbles: true, composed: true, detail: { ... } })`.
4. **스타일 확장 (Styling Extension)**:
   - **CSS Custom Properties**: 테마 토큰 주입 (예: `--stepper-border-color: #e2e8f0;`).
   - **`::part()` 선택자**: 공개된 서브 파트 스타일링 (예: `element::part(button) { ... }`).
   - **`<slot>` 프로젝션**: 부모의 Light DOM 노드를 지정된 위치에 투영.

### 2.3 반영 루프 방지 (Event Loop Prevention)
* 프로그램에 의한 프로퍼티 입력(`element.value = ...`)은 변경 이벤트를 재발행하지 않습니다.
* `value-change`, `quantity-change`와 같은 변경 알림 이벤트는 **오직 사용자의 실제 상호작용(클릭, 키 입력)이 발생했을 때만** 발행하여 무한 이벤트 루프를 방지합니다.

---

## 3. 스토어 및 컨트롤러의 DOM 조작 절대 금지 (Headless Controllers)

Context-Action 프레임워크에서 상태 스토어(`ReadableStore`)와 반응형 컨트롤러(`StoreController`, `ActionController`)는 **100% 무상태-무DOM(Headless)** 객체입니다.

### 🚫 엄격히 금지되는 안티패턴
1. **스토어 내부에 DOM 노드 보관 금지**:
   ```ts
   // ❌ 절대 금지: 상태에 HTMLElement나 DOM 노드를 보관
   interface BadState {
     buttonElement: HTMLButtonElement; // FORBIDDEN!
   }
   ```
2. **컨트롤러 콜백에서 직접 DOM 쿼리 및 수정 금지**:
   ```ts
   // ❌ 절대 금지: 컨트롤러가 DOM을 직접 변경
   store.subscribe((val) => {
     document.getElementById('badge').textContent = val; // FORBIDDEN!
     this.shadowRoot.querySelector('.count').innerHTML = val; // FORBIDDEN!
   });
   ```
3. **외부에서 Shadow DOM 노드 직접 조작 금지**:
   ```ts
   // ❌ 절대 금지: 외부 소비자가 내부 노드 침범
   const el = document.querySelector('lit-quantity-stepper');
   el.shadowRoot.querySelector('input').value = '99'; // FORBIDDEN!
   ```

### ✅ 올바른 단방향 흐름
```text
Store Update -> StoreController Projection (Memoized)
  -> host.requestUpdate()
    -> Lit Batch Scheduler (Microtask)
      -> element.render() (TemplateResult html`...`)
        -> Lit Part API updates exact DOM text/attributes
```

---

## 4. 책임의 분리 (Separation of Concerns)

| 영역 | 책임자 | 주 역할 | 허용되는 동작 | 금지되는 동작 |
|------|--------|---------|---------------|---------------|
| **상태 관리** | `StoreController`, `ReadableStore` | 비즈니스 상태 구독, 프로젝션 연산, 동등성 비교, 수명 관리 | `store.subscribe()`, `equalityFn`, `requestUpdate()` 호출 | DOM 탐색, HTML 마크업 생성, 스타일 접근 |
| **액션 조율** | `ActionController`, `ActionRegister` | 액션 디스패치, 비동기 파이프라인 조율, 로딩 상태, Abort 제어 | `dispatch()`, `activeCount`, `AbortSignal` 병합 | DOM 이벤트 직접 조작, UI 렌더링 |
| **렌더링** | `LitElement`, `FormAssociatedLitElement` | Shadow DOM 소유, 마크업 생성, 스타일 캡슐화, 사용자 이벤트 리스닝 | `render()`, `css`...``, `dispatchEvent()`, FACE API | 비즈니스 로직 직접 수행, 스토어 내부 직접 조작 |

---

## 5. 수명 주기와 자원 정리 (Lifecycle & Disposal)

### 5.1 Disconnect는 파괴(Destroy)가 아닌 분리(Unbind)
* Custom Element가 DOM 트리에서 제거될 때(`disconnectedCallback`), 이는 인스턴스의 영구 소멸이 아닙니다.
* DOM 노드 이동(Reparenting, 드래그 앤 드롭, 탭 전환) 시 `disconnectedCallback` 직후 새로운 부모에서 `connectedCallback`이 호출될 수 있습니다.
* 따라서 `disconnectedCallback`에서는 **스토어 구독 해제(`unsubscribe()`)와 비동기 요청 취소(`abort()`)**만을 수행하고, 엘리먼트 자체의 내부 상태나 컨트롤러 인스턴스를 파기하지 않습니다.

### 5.2 재연결 시 무결성 동기화 (Resynchronization)
* 엘리먼트가 다시 연결되면 `StoreController.hostConnected()`가 즉시 스토어를 재구독하고 스냅샷을 검사합니다.
* 분리되어 있던 동안 스토어 상태가 변경되었을 경우에만 `host.requestUpdate()`를 호출하여 최신 상태로 재동기화합니다.

---

## 6. 실패 처리와 보안 경계

1. **템플릿 신뢰성**: Lit의 `html` 태그 템플릿은 정적 템플릿 스트링만을 신뢰하며, 동적 변수 바인딩은 안전하게 이스케이프 처리됩니다. 단, 원시 HTML을 주입하는 `unsafeHTML`은 오직 검증된 소스에서만 제한적으로 사용해야 합니다.
2. **Shadow DOM과 접근 보안**: Shadow DOM은 CSS 및 DOM 캡슐화 경계이지 악의적인 스크립트를 방어하는 보안 샌드박스가 아닙니다. `mode: 'open'` 상태의 `shadowRoot`는 자바스크립트 실행 컨텍스트 내에서 접근 가능하므로 비밀 정보나 인증 토큰을 DOM 트리에 직접 노출하지 않습니다.
3. **스타일 확장 계약 준수**: 외부 테마 주입이 필요한 경우 CSS Custom Property(`--*`) 또는 `::part()`를 공식 계약으로 노출하며, 내부 DOM 계층 구조에 의존하는 임의의 셀렉터 해킹을 방지합니다.
