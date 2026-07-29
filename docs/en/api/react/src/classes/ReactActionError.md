[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ReactActionError

# Class: ReactActionError

Defined in: [packages/react/src/actions/react-helpers.ts:97](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/react-helpers.ts#L97)

## Extends

- `Error`

## Constructors

### Constructor

> **new ReactActionError**(`message`, `action`, `payload?`, `handlerId?`, `originalError?`): `ReactActionError`

Defined in: [packages/react/src/actions/react-helpers.ts:100](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/react-helpers.ts#L100)

#### Parameters

##### message

`string`

##### action

`string`

##### payload?

`unknown`

##### handlerId?

`string`

##### originalError?

Type parameter **Error**

#### Returns

Type parameter **ReactActionError**

#### Overrides

`Error.constructor`

## Methods

### fromActionError()

> `static` **fromActionError**(`originalError`, `action`, `payload?`, `handlerId?`): `ReactActionError`

Defined in: [packages/react/src/actions/react-helpers.ts:112](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/react-helpers.ts#L112)

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

### timestamp

> `readonly` **timestamp**: `number`

Defined in: [packages/react/src/actions/react-helpers.ts:98](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/react-helpers.ts#L98)

***

### action

> `readonly` **action**: `string`

Defined in: [packages/react/src/actions/react-helpers.ts:102](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/react-helpers.ts#L102)

***

### payload?

> `readonly` `optional` **payload?**: `unknown`

Defined in: [packages/react/src/actions/react-helpers.ts:103](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/react-helpers.ts#L103)

***

### handlerId?

> `readonly` `optional` **handlerId?**: `string`

Defined in: [packages/react/src/actions/react-helpers.ts:104](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/react-helpers.ts#L104)
