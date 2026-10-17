# 03. 공개 API 레퍼런스 (Public API Specification)

## 3.1 `@context-action/preact` (Headless Adapter)

### `createDispatchContext<A>(name)`

`Provider({ dispatch, children })`와 `useDispatch()`를 반환합니다. `dispatch`는 Core의 `ActionDispatcher<A>`입니다. `Provider` 외부에서 훅을 호출하면 `"${name}: useDispatch requires its Provider"` 오류를 던집니다. `ActionRegister`나 핸들러를 직접 생성·파괴하지 않으며 Core 디스패치의 Promise/실패 의미를 그대로 유지합니다.

### `connectSourceSignal<T>(source)`

- **Source 계약 (`ReadableSource<T>`)**: `getSnapshot(): T`, `subscribe(notify: () => void): () => void`. 스냅샷은 불변 값/객체이며 변경 전까지 안정적인 참조를 유지해야 합니다.
- **반환 계약 (`SignalConnection<T>`)**: `{ readonly signal: ReadonlySignal<T>, readonly disposed: boolean, dispose(): void }`.
- 연결 즉시 구독하고 직후 `getSnapshot()`을 다시 읽어 초기 조회와 구독 등록 사이의 변경 누락을 방지합니다. 초기 재조회 실패 시 구독을 즉시 해제합니다.
- `dispose()`는 멱등(idempotent)이며 한 번만 `unsubscribe`를 실행하고 이후 도착하는 알림을 무시합니다. 원본 `source`는 파괴하지 않습니다.

### `createSourceContext<T>(name)` & `useProjection(sourceSignal, selector)`

- `createSourceContext<T>(name)`: `ReadonlySignal<T>`를 하위 컴포넌트 트리에 공급하는 `Provider`와 `useSourceSignal()`을 반환합니다.
- `useProjection(sourceSignal, selector)`: `useComputed(() => selector(sourceSignal.value))` 기반으로 미세 단위의 파생 읽기 전용 시그널(`ReadonlySignal<Projected>`)을 생성합니다. `selector`는 반드시 부수 효과가 없는 순수 함수여야 합니다.

---

## 3.2 `@context-action/preact-ui` (Subtree UI Runtime)

### `mountPreact<Input>(root, View, initialInput)`

빈 `Element | ShadowRoot`에 `ComponentType<{ input: Input }>`를 마운트하고 `MountInstance<Input>`를 반환합니다.

```ts
export interface MountInstance<Input> {
  readonly destroyed: boolean;
  update(input: Input): void;
  destroy(): void;
}
```

- `update(input)`는 전체 입력 스냅샷을 동기적으로 교체합니다(부분 병합 아님).
- `root.children`만 Preact에 위임하며 `destroy()` 시 호스트 `root` 컨테이너 자체는 제거하지 않습니다.
- 이미 자식 노드가 있는 루트나 관리 중인 Light-DOM 조상/자손 영역에 호출하면 즉시 실패합니다. 동기 렌더/업데이트 실패 시 언마운트를 시도하고 부분 렌더링된 잔여 자식 노드를 제거합니다.

### `hydratePreact<Input>(root, View, initialInput)`

서버에서 렌더링된 자식 노드가 들어 있는 `Element | ShadowRoot`를 채택하여 이벤트와 시그널을 연결하고 `HydrationInstance<Input>`를 반환합니다. 빈 루트나 이미 관리 중인 하위 루트가 포함된 영역은 거부합니다.

### `mountTemplate<Input>(host, template, View, input)`

신뢰된 `HTMLTemplateElement`를 `host.ownerDocument.importNode`로 복제하고, 템플릿 내부의 유일한 빈 `[data-preact-root]` 엘리먼트에 Preact를 마운트합니다. `destroy()`는 Preact를 먼저 해제한 뒤 복제된 템플릿 쉘 노드만 제거하며, 호스트의 기존 형제 노드와 원본 `<template>`은 보존합니다.

### `createDisposalScope()`

`add(cleanup)`, `dispose()`, `readonly disposed: boolean`을 제공합니다. 제공자부터 등록하고 소비자부터 역순(LIFO)으로 해제합니다. 일부 정리 함수가 실패해도 나머지를 모두 실행한 뒤 `AggregateError(errors, 'UI cleanup failed')`를 던집니다. 이미 해제된 스코프에 `add`하면 즉시 실행합니다.

### `definePreactElement<Input, Expose>(config)`

Shadow DOM 렌더러 위임, property-before-upgrade 재생, Form-Associated Custom Elements(FACE) 연동, 그리고 선언적 공개 멤버(`expose`) 바인딩을 제공하는 Custom Element 팩토리입니다.

```ts
export type PreactCustomElementConstructor<
  Input,
  Expose extends object = Record<never, never>,
> = CustomElementConstructor & {
  new (...args: any[]): ManagedPreactElement<Input> & Expose;
};

/** HTMLElement 플랫폼 멤버 + 관리형 API(dispose, updateInput, name, form, ...) */
export type ReservedElementKey = keyof ManagedPreactElement<unknown>;

export type ExposeContract<Expose> = {
  [K in keyof Expose]: K extends ReservedElementKey ? never : Expose[K];
};

export function definePreactElement<
  Input,
  Expose extends object & ExposeContract<Expose> = Record<never, never>,
>(
  config: PreactElementConfig<Input, Expose>,
): PreactCustomElementConstructor<Input, Expose>;
```

- **선언적 `expose` 바인딩**: `setup(element, context)` 반환 객체에 `expose`를 지정하면 `Object.getOwnPropertyDescriptors(expose)`를 통해 getter/setter 및 메서드가 인스턴스에 설치되며, 수동 `Object.defineProperties`나 `as unknown as` 캐스팅 없이 `ManagedPreactElement<Input> & Expose`로 추론됩니다.
- **예약 멤버 재정의 차단**: `expose`가 `ReservedElementKey`를 포함하면 컴파일 타임에 `ExposeContract`가 차단하고, 런타임 생성자에서도 멤버 설치 전 `TypeError`를 던진 뒤 `onDestroy()`로 `setup` 자원을 정리합니다(`onDestroy` 실패 시 `AggregateError`).
- **Pre-upgrade 프로퍼티 재생 (`upgradeProperties`)**: 생성자 초기(`expose` 설치 전)에 pre-upgrade own property 값을 캡처한 뒤 첫 연결 시점에 1회 재생합니다. `expose`가 정의한 프로퍼티는 `expose` setter로, 미정의 프로퍼티는 own property 삭제 후 프로토타입 setter(예: `name`)로 반영됩니다.
- **Declarative Shadow DOM (`hydrateShadowRoot: true`)**: 기존 ShadowRoot 내부의 단일 `[data-preact-root]`만 수화하며 재연결 시에는 일반 마운트로 전환합니다.

### `PublicActionMethods<Actions, PublicKeys, ReturnMap>`

내부 `ActionPayloadMap`에서 외부에 공개할 액션 키(`PublicKeys`)만 선택하여 OOP 명령 메서드 시그니처로 매핑합니다(`@context-action/preact-ui` 및 `./react-bridge` 양쪽에서 export).

```ts
export type PublicActionMethods<
  Actions extends Record<string, any>,
  PublicKeys extends keyof Actions = keyof Actions,
  ReturnMap extends Partial<Record<PublicKeys, unknown>> = Record<never, never>,
> = {
  readonly [K in PublicKeys]: [Actions[K]] extends [void | undefined]
    ? () => K extends keyof ReturnMap ? Promise<ReturnMap[K]> : Promise<void>
    : (payload: Actions[K]) => K extends keyof ReturnMap ? Promise<ReturnMap[K]> : Promise<void>;
};
```

### `createElementFacade<Element, Keys>(keys)`

지정한 공개 프로퍼티와 메서드 키 목록(`keys`)만 위임하는 동결된(frozen) OOP Facade 팩토리(`ImperativeHandleFactory`)를 생성합니다. React 무의존 호스트와 React 브릿지 모두에서 사용할 수 있도록 루트 엔트리(`.`)와 `./react-bridge` 양쪽에서 export됩니다.

```ts
export type ImperativeHandleFactory<
  Element extends HTMLElement,
  Handle,
> = (getElement: () => Element | null) => Handle;

export function createElementFacade<
  Element extends HTMLElement,
  const Keys extends readonly (keyof Element)[],
>(
  keys: Keys,
): ImperativeHandleFactory<Element, Pick<Element, Keys[number]>>;
```

- 메서드는 엘리먼트별 `WeakMap`에 캐시되어 동일 엘리먼트에서 항상 같은 함수 identity(`===`)를 반환합니다.
- 읽기 전용(getter-only) 프로퍼티에 대입하면 `TypeError`를 던지며, 미마운트 상태에서 접근하면 `Error('Custom element handle is not mounted')`를 던집니다.

---

## 3.3 선택적 서브패스 엔트리 (`./react-bridge`, `./ssr`)

### `@context-action/preact-ui/react-bridge` — `createCustomElementBridge`

Custom Element를 React 18/19 컴포넌트로 래핑하여 복합 프로퍼티 동기화(`properties`), 커스텀 이벤트 바인딩(`events`), 그리고 `useImperativeHandle` 기반 OOP 핸들 캡슐화(`createHandle`)를 제공합니다 (`react` peer 필요, `preact` 런타임 무의존).

```ts
export interface CustomElementBridgeOptions<
  Props extends Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
> {
  tagName: string;
  properties?: readonly (keyof Props)[];
  events?: Record<string, string>;
  createHandle?: ImperativeHandleFactory<Element, Handle>;
}
```

### `@context-action/preact-ui/ssr` — `createSSR(View)`

`preact-render-to-string` peer를 사용하여 브라우저 전역(`window`, `document`, `customElements`) 참조 없이 서버에서 `View`를 HTML 문자열로 렌더링하는 `{ render(input: Input): string }` 객체를 반환합니다.

---

## 3.4 예제 컴포넌트 소비자 계약 (Reference Examples)

예제는 공식 API가 아니라 위 API로 작성한 참조 구현입니다. `<ca-counter>`의 재연결 보존·에코 방지·pre-upgrade 재생은 `test/runtime.test.tsx`에서 검증하며, template counter와 `value` 유한수 검증은 현재 예제 수준 계약입니다(자동 테스트 없음).

- **Template counter (`examples/template-island/mount-counter.tsx`)**: `mountCounter(host, template, model, label)`은 `setLabel(string)`, `setValue(number): Promise<void>`, `destroy()`만 반환합니다. 빌려온(borrowed) `model`은 `destroy()`에서 파괴하지 않으며, 파괴 후 `setValue`는 거부된 Promise를 반환합니다.
- **Custom Element counter (`examples/web-component/counter-element.tsx`, `<ca-counter>`)**: 공개 멤버는 `value: number`, `disabled: boolean`, `focusIncrement(): boolean`이며 사용자 조작 시 `value-change` 이벤트(`detail: { value: number }`)를 발행합니다. `value`는 유한수만 허용(`RangeError`)하고, 프로그램 입력은 이벤트를 재발행하지 않으며, 연결 해제 중에도 값을 보존합니다.
