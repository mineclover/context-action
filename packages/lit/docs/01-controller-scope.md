# 01. ControllerScope와 Lifecycle

`ControllerScope`는 하나의 Lit connection session에 속한 `ReactiveController`, store subscription,
event listener, cleanup callback을 한 곳에서 LIFO로 정리하는 도구입니다.

## 1. 기본 사용

```ts
import { ControllerScope, StoreController } from '@context-action/lit';
import { LitElement } from 'lit';

class TimelineElement extends LitElement {
  #scope = new ControllerScope(this, { autoDisposeOnDisconnect: true });

  constructor() {
    super();
    this.#scope.add(new StoreController(this, timelineStore));
    this.#scope.addCleanup(() => this.#detachPlayhead());
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#scope.disposed) {
      this.#scope = new ControllerScope(this, { autoDisposeOnDisconnect: true });
    }
  }
}
```

## 2. API

```ts
class ControllerScope implements ReactiveController {
  constructor(host: ReactiveControllerHost, options?: ControllerScopeOptions);
  add(controller: ReactiveController): void;
  addCleanup(cleanup: () => void): void;
  dispose(): void;
  readonly disposed: boolean;
  readonly size: number;
}
```

옵션:

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `autoDisposeOnDisconnect` | `false` | `hostDisconnected`에서 자동 dispose |
| `disposeOnDisconnect` | alias | `autoDisposeOnDisconnect`와 동일 |
| `autoDispose` | alias | `autoDisposeOnDisconnect`와 동일 |

## 3. 정리 순서

등록 순서의 역순(LIFO)으로 정리합니다.

```ts
scope.add(provider);
scope.add(child);
scope.addCleanup(() => childDetach());
scope.addCleanup(() => providerDetach());

scope.dispose();
// providerDetach → childDetach → child → provider
```

자식 part, 구독, listener를 나중에 등록하면 부모/provider보다 먼저 해제됩니다.
각 controller는 Lit 표준 `hostDisconnected`와 명시적 `dispose`를 지원합니다.

## 4. 오류 처리

한 cleanup이 실패해도 나머지 cleanup은 계속 실행되고, 모든 오류가 `AggregateError`로 집계됩니다.

```ts
try {
  scope.dispose();
} catch (error) {
  if (error instanceof AggregateError) {
    report(error.errors);
  }
}
```

- 이미 dispose된 scope의 `dispose()`는 idempotent합니다.
- dispose된 scope에 `add`/`addCleanup`하면 즉시 실행됩니다.
- late registration이 실패하면 즉시 예외가 전파됩니다.

## 5. 재연결

`autoDisposeOnDisconnect`를 사용하는 경우 scope는 **하나의 connection session**을 나타냅니다.
dispose된 scope는 terminal이며 재사용하지 않습니다.

```ts
override connectedCallback(): void {
  super.connectedCallback();
  if (this.#scope.disposed) {
    this.#scope = new ControllerScope(this, { autoDisposeOnDisconnect: true });
    this.#mountParts(this.#scope);
  }
}
```

## 6. StoreController와 함께 사용

```ts
const controller = new StoreController(this, store, {
  selector: state => state.playhead,
  equalityFn: Object.is,
});

scope.add(controller);
```

scope dispose 시 store listener가 0이 되고 controller가 host에서 제거됩니다.
sibling controller를 건너뛰지 않도록 auto-dispose 중 자기 제거는 microtask로 미룹니다.

## 7. 검증

```sh
pnpm --filter @context-action/lit test
```

테스트는 LIFO, AggregateError, idempotency, late registration, nested scope,
auto-dispose, reconnect, 실제 StoreController 구독 해제, host controller 순회 안전성을 확인합니다.
