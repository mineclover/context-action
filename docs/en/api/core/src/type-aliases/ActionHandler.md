[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionHandler

# Type Alias: ActionHandler()\<T, R\>

> **ActionHandler**\<`T`, `R`\> = (`payload`, `controller`) => `R` \| `Promise`&lt;`R`&gt;

Defined in: [packages/core/src/types.ts:96](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L96)

파이프라인 내에서 특정 액션을 처리하는 함수로, 비즈니스 로직과 스토어 상호작용을 담당합니다.

## Type Parameters

### Generic type T

`T` = `any`

### Generic type R

`R` = `void`

## Parameters

### payload

Type parameter **T**

### controller

[`PipelineController`](../interfaces/PipelineController.md)\<`T`, `R`\>

## Returns

`R` \| `Promise`&lt;`R`&gt;

## Implements

## Memberof

core-concepts

## Example

```typescript
const updateUserHandler: ActionHandler<{id: string, name: string}> = async (payload, controller) => {
  // 스토어에서 현재 상태 읽기
  const currentUser = userStore.getValue();
  
  // 비즈니스 로직 실행
  const updatedUser = { ...currentUser, ...payload };
  
  // 스토어 상태 업데이트
  userStore.setValue(updatedUser);
  
  // 핸들러가 자동으로 다음 핸들러로 진행
};
```
