[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ReactActionError

# Class: ReactActionError

Defined in: [packages/core/src/react-helpers.ts:239](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/react-helpers.ts#L239)

🆕 React Error Boundary integration

Utilities for integrating ActionRegister errors with React Error Boundaries.

## Extends

- `Error`

## Constructors

### Constructor

> **new ReactActionError**(`message`, `action`, `payload?`, `handlerId?`, `originalError?`): `ReactActionError`

Defined in: [packages/core/src/react-helpers.ts:245](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/react-helpers.ts#L245)

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

Type parameter **Error**

#### Returns

Type parameter **ReactActionError**

#### Overrides

`Error.constructor`

## Methods

### fromActionError()

> `static` **fromActionError**(`originalError`, `action`, `payload?`, `handlerId?`): `ReactActionError`

Defined in: [packages/core/src/react-helpers.ts:268](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/react-helpers.ts#L268)

Create a React Error Boundary compatible error

#### Parameters

##### originalError

Type parameter **Error**

##### action

`string`

##### payload?

`any`

##### handlerId?

`string`

#### Returns

Type parameter **ReactActionError**

## Properties

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/react-helpers.ts:240](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/react-helpers.ts#L240)

***

### payload?

> `readonly` `optional` **payload**: `any`

Defined in: [packages/core/src/react-helpers.ts:241](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/react-helpers.ts#L241)

***

### handlerId

> `readonly` **handlerId**: `undefined` \| `string`

Defined in: [packages/core/src/react-helpers.ts:242](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/react-helpers.ts#L242)

***

### timestamp

> `readonly` **timestamp**: `number`

Defined in: [packages/core/src/react-helpers.ts:243](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/react-helpers.ts#L243)
