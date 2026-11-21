[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit/src](../README.md) / ControllerScope

# Class: ControllerScope

Defined in: [packages/lit/src/controller-scope.ts:107](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L107)

Container that owns ReactiveControllers and cleanup callbacks for one
connection session.

Guarantees:
- Entries are disposed in reverse registration order (LIFO), so child parts
  and downstream subscriptions are released before their providers.
- A thrown cleanup does not stop the remaining cleanups; all failures are
  collected into one `AggregateError`.
- Adding to an already-disposed scope disposes the new entry immediately, so
  late registrations cannot leak.
- A disposed scope is terminal. On reconnect, owners create a new scope
  rather than reusing the previous one.

## Example

```ts
class TimelineElement extends LitElement {
  #scope = new ControllerScope(this, { autoDisposeOnDisconnect: true });

  constructor() {
    super();
    const store = new StoreController(this, timelineStore);
    this.#scope.add(store);
    this.#scope.addCleanup(() => this.#detachPlayhead());
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.#scope.disposed) {
      this.#scope = new ControllerScope(this, { autoDisposeOnDisconnect: true });
    }
  }
}
```

## Implements

- `ReactiveController`

## Accessors

### disposed

#### Get Signature

> **get** **disposed**(): `boolean`

Defined in: [packages/lit/src/controller-scope.ts:126](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L126)

Whether this scope has already been disposed.

##### Returns

`boolean`

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [packages/lit/src/controller-scope.ts:131](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L131)

Number of entries that have not been disposed yet.

##### Returns

`number`

## Constructors

### Constructor

> **new ControllerScope**(`host`, `options?`): `ControllerScope`

Defined in: [packages/lit/src/controller-scope.ts:113](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L113)

#### Parameters

##### host

`ReactiveControllerHost`

##### options?

[`ControllerScopeOptions`](../interfaces/ControllerScopeOptions.md)

#### Returns

`ControllerScope`

## Methods

### add()

> **add**(`controller`): `void`

Defined in: [packages/lit/src/controller-scope.ts:141](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L141)

Registers a ReactiveController for LIFO disposal.

Registration order defines teardown order: register providers first and
dependent child parts later, so children disconnect before parents.

#### Parameters

##### controller

`ReactiveController`

#### Returns

`void`

***

### addCleanup()

> **addCleanup**(`cleanup`): `void`

Defined in: [packages/lit/src/controller-scope.ts:160](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L160)

Registers an arbitrary cleanup callback for LIFO disposal.

Adding a cleanup to an already-disposed scope runs it immediately so late
registrations cannot leak.

#### Parameters

##### cleanup

() => `void`

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/lit/src/controller-scope.ts:179](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L179)

Disposes every registered entry in reverse registration order.

Idempotent. Continues after individual failures and throws one
`AggregateError` containing all failures.

#### Returns

`void`

***

### hostConnected()

> **hostConnected**(): `void`

Defined in: [packages/lit/src/controller-scope.ts:189](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L189)

Lit lifecycle hook.

A disposed scope is terminal; this hook intentionally does not resurrect it.
Owners that reconnect should create a new scope.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostConnected`

***

### hostDisconnected()

> **hostDisconnected**(): `void`

Defined in: [packages/lit/src/controller-scope.ts:197](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L197)

Lit lifecycle hook. Disposes the scope when
`autoDisposeOnDisconnect` (or its alias) is enabled.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostDisconnected`
