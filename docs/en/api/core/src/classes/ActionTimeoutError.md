[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionTimeoutError

# Class: ActionTimeoutError

Defined in: [packages/core/src/errors.ts:180](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L180)

Raised when a dispatch exceeds its configured wall-clock timeout.
The underlying handler receives an aborted controller signal and the internal
queue keeps draining it safely, while the caller is released immediately with
this error.

## Extends

- `Error`

## Constructors

### Constructor

> **new ActionTimeoutError**(`action`, `timeout`): `ActionTimeoutError`

Defined in: [packages/core/src/errors.ts:183](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L183)

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

Defined in: [packages/core/src/errors.ts:181](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L181)

#### Overrides

`Error.name`

***

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/errors.ts:184](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L184)

***

### timeout

> `readonly` **timeout**: `number`

Defined in: [packages/core/src/errors.ts:185](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L185)
