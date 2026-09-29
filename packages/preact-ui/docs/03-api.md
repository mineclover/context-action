# 공개 API

## Preact adapter

### `createDispatchContext<A>(name)`

`Provider({ dispatch, children })`와 `useDispatch()`를 반환합니다. `dispatch`는 Core의 `ActionDispatcher<A>`입니다. Provider 없는 hook 호출은 오류입니다. Register/Handler를 만들거나 해제하지 않으며 Core dispatch의 Promise/실패 의미를 변경하지 않습니다.

### `connectSourceSignal(source)`

Source 계약은 `getSnapshot(): T`, `subscribe(notify): unsubscribe`입니다. snapshot은 불변 값/객체이고 변경 전까지 안정적인 참조를 유지합니다. subscribe는 함수인 unsubscribe를 반환해야 하며, 알림은 snapshot이 최신이 된 뒤 동기적으로 호출하는 invalidation입니다. source 제공자는 subscribe 자체가 실패하면 자신이 부분 등록한 자원을 정리해야 합니다.

반환값은 `{ signal: ReadonlySignal<T>, disposed, dispose() }`입니다. 연결 즉시 구독하고 구독 직후 다시 읽어 초기 read/subscribe 사이의 변경을 놓치지 않습니다. 초기 재조회 실패 시 구독을 해제합니다. dispose는 한 번만 unsubscribe를 실행하고 늦은 알림을 무시합니다. 마지막 projection 값은 읽을 수 있지만 더는 갱신되지 않습니다. 원본 Source는 계속 사용 가능합니다.

## UI runtime

### `mountPreact(root, View, initialInput)`

Root는 빈 `Element | ShadowRoot`입니다. View는 `ComponentType<{ input: Input }>`이고 반환값은 다음 계약입니다.

```ts
interface MountInstance<Input> {
  readonly destroyed: boolean;
  update(input: Input): void;
  destroy(): void;
}
```

`update`는 전체 입력 snapshot 교체이며 partial merge가 아닙니다. 초기 render와 명시적 update 호출은 동기입니다. Signal에 의한 후속 Preact 작업은 Preact 스케줄링을 따릅니다.

Root children은 Preact에 위임하지만 Root 자체는 제거하지 않습니다. 기존 children, 중복 Root, 알려진 상위 light-DOM Owner가 있으면 실패합니다. 동기 render 실패는 unmount를 시도하고 instance를 종료합니다. unmount가 예외를 내면 정리 성공을 보장할 수 없으며 그 오류를 호출자에게 전달합니다.

### `mountTemplate(host, template, View, input)`

신뢰된 HTMLTemplateElement를 `host.ownerDocument.importNode`로 복제합니다. `[data-preact-root]`는 정확히 한 개이며 children이 없어야 합니다. 이를 검증한 뒤 shell을 연결하고 Preact를 마운트합니다.

반환 계약은 `MountInstance<Input>`입니다. destroy는 Preact를 먼저 해제하고 복제한 shell만 제거합니다. Host의 기존 형제 노드와 원본 template은 보존합니다. 실패한 초기 mount는 복제한 shell을 제거합니다. Host의 기존 자원은 해제하지 않습니다.

### `createDisposalScope()`

`add(cleanup)`, `dispose()`, 읽기 전용 `disposed`를 제공합니다. 제공자부터 등록하고 소비자부터 해제하는 LIFO 규칙입니다. 모든 cleanup을 시도한 후 실패들을 AggregateError로 보고합니다. 두 번째 dispose는 아무 일도 하지 않습니다. 이미 dispose된 scope에 add하면 cleanup을 즉시 실행합니다.

## 예제 Component 소비자 계약

Template counter: `setLabel(string)`, `setValue(number): Promise<void>`, `destroy()`. borrowed model을 사용합니다.

Custom Element counter: `value: number`, `disabled: boolean`, `focusIncrement(): boolean`, `value-change` 이벤트의 `detail: { value: number }`. value는 유한수만 허용합니다. 프로그램 입력은 이벤트를 재발행하지 않으며 사용자 조작에만 이벤트가 발생합니다. 연결 해제 중에도 value 입력은 보존합니다.
