[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / ContextActionError

# Class: ContextActionError

Defined in: [packages/react/src/stores/utils/error-handling.ts:25](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/error-handling.ts#L25)

Context-Action 프레임워크의 표준 에러 클래스

## Extends

- `Error`

## Constructors

### Constructor

> **new ContextActionError**(`type`, `message`, `context?`, `originalError?`): `ContextActionError`

Defined in: [packages/react/src/stores/utils/error-handling.ts:30](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/error-handling.ts#L30)

#### Parameters

##### type

[`ContextActionErrorType`](../enumerations/ContextActionErrorType.md)

##### message

`string`

##### context?

`Record`\<`string`, `unknown`\>

##### originalError?

`Error`

#### Returns

`ContextActionError`

#### Overrides

`Error.constructor`

## Properties

### type

> `readonly` **type**: [`ContextActionErrorType`](../enumerations/ContextActionErrorType.md)

Defined in: [packages/react/src/stores/utils/error-handling.ts:26](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/error-handling.ts#L26)

***

### context

> `readonly` **context**: `Record`\<`string`, `unknown`\> \| `undefined`

Defined in: [packages/react/src/stores/utils/error-handling.ts:27](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/error-handling.ts#L27)

***

### timestamp

> `readonly` **timestamp**: `number`

Defined in: [packages/react/src/stores/utils/error-handling.ts:28](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/error-handling.ts#L28)
