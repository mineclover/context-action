[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionTimeoutError

# Class: ActionTimeoutError

Defined in: [packages/core/src/errors.ts:164](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L164)

Raised when a dispatch exceeds its configured wall-clock timeout.
The underlying handler receives an aborted controller signal and the internal
queue keeps draining it safely, while the caller is released immediately with
this error.

## Extends

- `Error`

## Constructors

### Constructor

> **new ActionTimeoutError**(`action`, `timeout`): `ActionTimeoutError`

Defined in: [packages/core/src/errors.ts:167](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L167)

#### Parameters

##### action

`string`

##### timeout

`number`

#### Returns

Type parameter **ActionTimeoutError**

#### Overrides

`Error.constructor`

## Properties

### name

> **name**: `string` = `'ActionTimeoutError'`

Defined in: [packages/core/src/errors.ts:165](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L165)

#### Overrides

`Error.name`

***

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/errors.ts:168](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L168)

***

### timeout

> `readonly` **timeout**: `number`

Defined in: [packages/core/src/errors.ts:169](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L169)
