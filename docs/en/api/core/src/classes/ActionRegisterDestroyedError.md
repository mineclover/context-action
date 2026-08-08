[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegisterDestroyedError

# Class: ActionRegisterDestroyedError

Defined in: [packages/core/src/errors.ts:193](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L193)

Raised when work is submitted after an ActionRegister begins shutdown.

## Extends

- `Error`

## Constructors

### Constructor

> **new ActionRegisterDestroyedError**(`registerName`, `state`): `ActionRegisterDestroyedError`

Defined in: [packages/core/src/errors.ts:196](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L196)

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

Defined in: [packages/core/src/errors.ts:194](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L194)

#### Overrides

`Error.name`

***

### registerName

> `readonly` **registerName**: `string`

Defined in: [packages/core/src/errors.ts:197](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L197)

***

### state

> `readonly` **state**: `"closing"` \| `"destroyed"`

Defined in: [packages/core/src/errors.ts:198](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L198)
