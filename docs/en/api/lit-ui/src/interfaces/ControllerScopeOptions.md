[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / ControllerScopeOptions

# Interface: ControllerScopeOptions

Defined in: [packages/lit/dist/index.d.ts:227](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L227)

Configuration for [ControllerScope](../classes/ControllerScope.md).

## Properties

### autoDisposeOnDisconnect?

> `optional` **autoDisposeOnDisconnect?**: `boolean`

Defined in: [packages/lit/dist/index.d.ts:234](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L234)

Dispose the scope automatically when the host disconnects.

Defaults to `false`; enable it when a scope represents one connection
session and the owner creates a fresh scope on the next `hostConnected()`.

***

### disposeOnDisconnect?

> `optional` **disposeOnDisconnect?**: `boolean`

Defined in: [packages/lit/dist/index.d.ts:236](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L236)

Alias for [autoDisposeOnDisconnect](#autodisposeondisconnect).

***

### autoDispose?

> `optional` **autoDispose?**: `boolean`

Defined in: [packages/lit/dist/index.d.ts:238](https://github.com/mineclover/context-action/blob/main/packages/lit/dist/index.d.ts#L238)

Alias for [autoDisposeOnDisconnect](#autodisposeondisconnect).
