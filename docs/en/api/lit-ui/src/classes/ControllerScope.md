[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / ControllerScope

# Class: ControllerScope

Defined in: [packages/lit/dist/index.d.ts:275](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L275)

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

Defined in: [packages/lit/dist/index.d.ts:279](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L279)

Whether this scope has already been disposed.

##### Returns

`boolean`

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [packages/lit/dist/index.d.ts:281](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L281)

Number of entries that have not been disposed yet.

##### Returns

`number`

## Constructors

### Constructor

> **new ControllerScope**(`host`, `options?`): `ControllerScope`

Defined in: [packages/lit/dist/index.d.ts:277](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L277)

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

Defined in: [packages/lit/dist/index.d.ts:288](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L288)

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

Defined in: [packages/lit/dist/index.d.ts:295](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L295)

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

Defined in: [packages/lit/dist/index.d.ts:302](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L302)

Disposes every registered entry in reverse registration order.

Idempotent. Continues after individual failures and throws one
`AggregateError` containing all failures.

#### Returns

`void`

***

### hostConnected()

> **hostConnected**(): `void`

Defined in: [packages/lit/dist/index.d.ts:309](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L309)

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

Defined in: [packages/lit/dist/index.d.ts:314](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L314)

Lit lifecycle hook. Disposes the scope when
`autoDisposeOnDisconnect` (or its alias) is enabled.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostDisconnected`
