[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegisterDestroyedError

# Class: ActionRegisterDestroyedError

Defined in: [packages/core/src/errors.ts:203](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L203)

Raised when work is submitted after an ActionRegister begins shutdown.

## Extends

- `Error`

## Constructors

### Constructor

> **new ActionRegisterDestroyedError**(`registerName`, `state`): `ActionRegisterDestroyedError`

Defined in: [packages/core/src/errors.ts:206](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L206)

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

Defined in: [packages/core/src/errors.ts:204](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L204)

#### Overrides

`Error.name`

***

### registerName

> `readonly` **registerName**: `string`

Defined in: [packages/core/src/errors.ts:207](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L207)

***

### state

> `readonly` **state**: `"closing"` \| `"destroyed"`

Defined in: [packages/core/src/errors.ts:208](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L208)
