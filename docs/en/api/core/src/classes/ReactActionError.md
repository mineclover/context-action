[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ReactActionError

# Class: ReactActionError

Defined in: [packages/core/src/react-helpers.ts:336](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L336)

🆕 React Error Boundary integration

Utilities for integrating ActionRegister errors with React Error Boundaries.

## Extends

- `Error`

## Constructors

### Constructor

> **new ReactActionError**(`message`, `action`, `payload?`, `handlerId?`, `originalError?`): `ReactActionError`

Defined in: [packages/core/src/react-helpers.ts:342](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L342)

#### Parameters

##### message

`string`

##### action

`string`

##### payload?

`any`

##### handlerId?

`undefined` | `string`

##### originalError?

`Error`

#### Returns

`ReactActionError`

#### Overrides

`Error.constructor`

## Methods

### fromActionError()

> `static` **fromActionError**(`originalError`, `action`, `payload?`, `handlerId?`): `ReactActionError`

Defined in: [packages/core/src/react-helpers.ts:365](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L365)

Create a React Error Boundary compatible error

#### Parameters

##### originalError

`Error`

##### action

`string`

##### payload?

`any`

##### handlerId?

`string`

#### Returns

`ReactActionError`

## Properties

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/react-helpers.ts:337](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L337)

***

### payload?

> `readonly` `optional` **payload**: `any`

Defined in: [packages/core/src/react-helpers.ts:338](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L338)

***

### handlerId

> `readonly` **handlerId**: `undefined` \| `string`

Defined in: [packages/core/src/react-helpers.ts:339](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L339)

***

### timestamp

> `readonly` **timestamp**: `number`

Defined in: [packages/core/src/react-helpers.ts:340](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L340)
