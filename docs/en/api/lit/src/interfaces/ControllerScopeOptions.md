[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit/src](../README.md) / ControllerScopeOptions

# Interface: ControllerScopeOptions

Defined in: [packages/lit/src/controller-scope.ts:15](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L15)

Configuration for [ControllerScope](../classes/ControllerScope.md).

## Properties

### autoDisposeOnDisconnect?

> `optional` **autoDisposeOnDisconnect?**: `boolean`

Defined in: [packages/lit/src/controller-scope.ts:22](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L22)

Dispose the scope automatically when the host disconnects.

Defaults to `false`; enable it when a scope represents one connection
session and the owner creates a fresh scope on the next `hostConnected()`.

***

### disposeOnDisconnect?

> `optional` **disposeOnDisconnect?**: `boolean`

Defined in: [packages/lit/src/controller-scope.ts:25](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L25)

Alias for [autoDisposeOnDisconnect](#autodisposeondisconnect).

***

### autoDispose?

> `optional` **autoDispose?**: `boolean`

Defined in: [packages/lit/src/controller-scope.ts:28](https://github.com/mineclover/context-action/blob/main/packages/lit/src/controller-scope.ts#L28)

Alias for [autoDisposeOnDisconnect](#autodisposeondisconnect).
