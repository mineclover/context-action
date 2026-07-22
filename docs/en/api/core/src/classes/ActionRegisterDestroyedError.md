[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegisterDestroyedError

# Class: ActionRegisterDestroyedError

Defined in: [packages/core/src/errors.ts:177](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L177)

Raised when work is submitted after an ActionRegister begins shutdown.

## Extends

- `Error`

## Constructors

### Constructor

> **new ActionRegisterDestroyedError**(`registerName`, `state`): `ActionRegisterDestroyedError`

Defined in: [packages/core/src/errors.ts:180](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L180)

#### Parameters

##### registerName

`string`

##### state

`"closing"` \| `"destroyed"`

#### Returns

Type parameter **ActionRegisterDestroyedError**

#### Overrides

`Error.constructor`

## Properties

### name

> **name**: `string` = `'ActionRegisterDestroyedError'`

Defined in: [packages/core/src/errors.ts:178](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L178)

#### Overrides

`Error.name`

***

### registerName

> `readonly` **registerName**: `string`

Defined in: [packages/core/src/errors.ts:181](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L181)

***

### state

> `readonly` **state**: `"closing"` \| `"destroyed"`

Defined in: [packages/core/src/errors.ts:182](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L182)
