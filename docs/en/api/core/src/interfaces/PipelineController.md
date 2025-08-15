[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / PipelineController

# Interface: PipelineController\<T, R\>

Defined in: [packages/core/src/types.ts:47](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L47)

액션 핸들러에게 제공되는 파이프라인 실행 흐름 관리 및 페이로드 수정을 위한 인터페이스입니다.

## Implements

## Memberof

core-concepts

## Example

```typescript
register('processData', async (payload, controller) => {
  // 입력 검증
  if (!payload.isValid) {
    controller.abort('Invalid payload');
    return;
  }
  
  // 페이로드 변형
  controller.modifyPayload(data => ({ 
    ...data, 
    processed: true,
    timestamp: Date.now()
  }));
  
  // 핸들러가 자동으로 다음 핸들러로 진행
});
```

## Type Parameters

### Generic type T

`T` = `any`

### Generic type R

`R` = `void`

## Methods

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/core/src/types.ts:49](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L49)

Abort the pipeline execution with an optional reason

#### Parameters

##### reason?

`string`

#### Returns

`void`

***

### modifyPayload()

> **modifyPayload**(`modifier`): `void`

Defined in: [packages/core/src/types.ts:52](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L52)

Modify the payload that will be passed to subsequent handlers

#### Parameters

##### modifier

(`payload`) => `T`

#### Returns

`void`

***

### getPayload()

> **getPayload**(): `T`

Defined in: [packages/core/src/types.ts:55](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L55)

Get the current payload

#### Returns

Type parameter **T**

***

### jumpToPriority()

> **jumpToPriority**(`priority`): `void`

Defined in: [packages/core/src/types.ts:58](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L58)

Jump to a specific priority level in the pipeline

#### Parameters

##### priority

`number`

#### Returns

`void`

***

### return()

> **return**(`result`): `void`

Defined in: [packages/core/src/types.ts:62](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L62)

Return a result and terminate the pipeline

#### Parameters

##### result

Type parameter **R**

#### Returns

`void`

***

### setResult()

> **setResult**(`result`): `void`

Defined in: [packages/core/src/types.ts:65](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L65)

Set a result but continue pipeline execution

#### Parameters

##### result

Type parameter **R**

#### Returns

`void`

***

### getResults()

> **getResults**(): `R`[]

Defined in: [packages/core/src/types.ts:68](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L68)

Get all results from previously executed handlers

#### Returns

`R`[]

***

### mergeResult()

> **mergeResult**(`merger`): `void`

Defined in: [packages/core/src/types.ts:71](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L71)

Merge current result with previous results using a custom merger function

#### Parameters

##### merger

(`previousResults`, `currentResult`) => `R`

#### Returns

`void`
