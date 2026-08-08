[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionValidationError

# Class: ActionValidationError

Defined in: [packages/core/src/errors.ts:80](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L80)

Action payload 검증 실패 에러

dispatch 시 Zod 스키마 검증이 실패하면 발생합니다.
(validationMode가 'strict'일 때만 throw)

## Example

```typescript
try {
  dispatch('updateUser', { id: '', name: 'John' });
} catch (error) {
  if (error instanceof ActionValidationError) {
    console.log('Action:', error.action);
    console.log('Issues:', error.issues);
    console.log('Formatted:', error.formattedErrors);
  }
}
```

## Extends

- `Error`

## Accessors

### issues

#### Get Signature

> **get** **issues**(): readonly `ZodIssueLike`[]

Defined in: [packages/core/src/errors.ts:113](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L113)

Zod 검증 이슈 목록

##### Returns

readonly `ZodIssueLike`[]

***

### formattedErrors

#### Get Signature

> **get** **formattedErrors**(): `unknown`

Defined in: [packages/core/src/errors.ts:128](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L128)

포맷된 에러 객체 (필드별 에러 메시지)

##### Returns

`unknown`

***

### flattenedErrors

#### Get Signature

> **get** **flattenedErrors**(): `unknown`

Defined in: [packages/core/src/errors.ts:143](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L143)

플랫 에러 맵 (필드명 → 에러 메시지 배열)

##### Returns

`unknown`

***

### firstError

#### Get Signature

> **get** **firstError**(): `string` \| `undefined`

Defined in: [packages/core/src/errors.ts:158](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L158)

첫 번째 에러 메시지

##### Returns

`string` \| `undefined`

***

### errorPaths

#### Get Signature

> **get** **errorPaths**(): `string`[]

Defined in: [packages/core/src/errors.ts:165](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L165)

에러 발생 필드 경로 목록

##### Returns

`string`[]

## Constructors

### Constructor

> **new ActionValidationError**(`action`, `zodError`): `ActionValidationError`

Defined in: [packages/core/src/errors.ts:91](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L91)

#### Parameters

##### action

`string`

검증 실패한 action 이름

##### zodError

`unknown`

Zod 검증 에러 객체 (ZodError compatible)

#### Returns

Type parameter **ActionValidationError**

#### Overrides

`Error.constructor`

## Methods

### toJSON()

> **toJSON**(): `object`

Defined in: [packages/core/src/errors.ts:174](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L174)

JSON 직렬화

#### Returns

`object`

##### name

> **name**: `string`

##### action

> **action**: `string`

##### message

> **message**: `string`

##### issues

> **issues**: readonly `ZodIssueLike`[]

## Properties

### name

> **name**: `string` = `'ActionValidationError'`

Defined in: [packages/core/src/errors.ts:82](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L82)

에러 이름

#### Overrides

`Error.name`

***

### zodError

> `readonly` **zodError**: `unknown`

Defined in: [packages/core/src/errors.ts:85](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L85)

원본 Zod 에러 객체

***

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/errors.ts:108](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L108)

검증 실패한 action 이름
