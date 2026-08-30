[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / InferActionPayloadMap

# Type Alias: InferActionPayloadMap\<T\>

> **InferActionPayloadMap**&lt;`T`&gt; = `{ [K in keyof T]: T[K] extends UnifiedAction<infer P> ? P : never }`

Defined in: [packages/tool-protocol/src/action-schema.ts:166](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L166)

ActionSchemaMap에서 ActionPayloadMap 타입 추론

## Type Parameters

### Generic type T

`T` *extends* [`ActionSchemaMap`](../interfaces/ActionSchemaMap.md)

## Example

```typescript
const schema = createActionSchema({
  updateUser: defineAction({ ... }),
  deleteUser: defineAction({ ... }),
});

type MyActions = InferActionPayloadMap<typeof schema>;
// { updateUser: { id: string; name: string }; deleteUser: { id: string } }
```
