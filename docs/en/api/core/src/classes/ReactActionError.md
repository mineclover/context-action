[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ReactActionError

# Class: ReactActionError

Defined in: [packages/core/src/react-helpers.ts:243](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/react-helpers.ts#L243)

🆕 React Error Boundary integration

Utilities for integrating ActionRegister errors with React Error Boundaries.

## Extends

- `Error`

## Constructors

### Constructor

> **new ReactActionError**(`message`, `action`, `payload?`, `handlerId?`, `originalError?`): `ReactActionError`

Defined in: [packages/core/src/react-helpers.ts:249](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/react-helpers.ts#L249)

#### Parameters

##### message

`string`

##### action

`string`

##### payload?

`unknown`

##### handlerId?

`string` \| `undefined`

##### originalError?

Type parameter **Error**

#### Returns

Type parameter **ReactActionError**

#### Overrides

`Error.constructor`

## Methods

### fromActionError()

> `static` **fromActionError**(`originalError`, `action`, `payload?`, `handlerId?`): `ReactActionError`

Defined in: [packages/core/src/react-helpers.ts:272](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/react-helpers.ts#L272)

Create a React Error Boundary compatible error

#### Parameters

##### originalError

Type parameter **Error**

##### action

`string`

##### payload?

`unknown`

##### handlerId?

`string`

#### Returns

Type parameter **ReactActionError**

## Properties

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/react-helpers.ts:244](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/react-helpers.ts#L244)

***

### payload?

> `readonly` `optional` **payload?**: `unknown`

Defined in: [packages/core/src/react-helpers.ts:245](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/react-helpers.ts#L245)

***

### handlerId

> `readonly` **handlerId**: `string` \| `undefined`

Defined in: [packages/core/src/react-helpers.ts:246](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/react-helpers.ts#L246)

***

### timestamp

> `readonly` **timestamp**: `number`

Defined in: [packages/core/src/react-helpers.ts:247](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/react-helpers.ts#L247)
