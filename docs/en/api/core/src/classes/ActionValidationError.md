[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionValidationError

# Class: ActionValidationError

Defined in: [packages/core/src/errors.ts:54](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L54)

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

Defined in: [packages/core/src/errors.ts:87](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L87)

Zod 검증 이슈 목록

##### Returns

readonly `ZodIssueLike`[]

***

### formattedErrors

#### Get Signature

> **get** **formattedErrors**(): `unknown`

Defined in: [packages/core/src/errors.ts:102](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L102)

포맷된 에러 객체 (필드별 에러 메시지)

##### Returns

`unknown`

***

### flattenedErrors

#### Get Signature

> **get** **flattenedErrors**(): `unknown`

Defined in: [packages/core/src/errors.ts:117](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L117)

플랫 에러 맵 (필드명 → 에러 메시지 배열)

##### Returns

`unknown`

***

### firstError

#### Get Signature

> **get** **firstError**(): `string` \| `undefined`

Defined in: [packages/core/src/errors.ts:132](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L132)

첫 번째 에러 메시지

##### Returns

`string` \| `undefined`

***

### errorPaths

#### Get Signature

> **get** **errorPaths**(): `string`[]

Defined in: [packages/core/src/errors.ts:139](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L139)

에러 발생 필드 경로 목록

##### Returns

`string`[]

## Constructors

### Constructor

> **new ActionValidationError**(`action`, `zodError`): `ActionValidationError`

Defined in: [packages/core/src/errors.ts:65](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L65)

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

Defined in: [packages/core/src/errors.ts:148](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L148)

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

Defined in: [packages/core/src/errors.ts:56](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L56)

에러 이름

#### Overrides

`Error.name`

***

### zodError

> `readonly` **zodError**: `unknown`

Defined in: [packages/core/src/errors.ts:59](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L59)

원본 Zod 에러 객체

***

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/errors.ts:82](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/errors.ts#L82)

검증 실패한 action 이름
