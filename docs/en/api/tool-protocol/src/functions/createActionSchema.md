[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / createActionSchema

# Function: createActionSchema()

> **createActionSchema**&lt;`T`&gt;(`actions`): `T`

Defined in: [packages/tool-protocol/src/action-schema.ts:321](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L321)

다중 Action 스키마 생성

여러 defineAction을 묶어서 ActionSchemaMap 생성

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, [`UnifiedAction`](../interfaces/UnifiedAction.md)&lt;`unknown`&gt;\>

## Parameters

### actions

Type parameter **T**

UnifiedAction 맵

## Returns

Type parameter **T**

The input schema map with its literal action keys preserved

## Example

```typescript
const userActionSchema = createActionSchema({
  updateUser: defineAction({ ... }, z),
  deleteUser: defineAction({ ... }, z),
});

type UserActions = InferActionPayloadMap<typeof userActionSchema>;
```
