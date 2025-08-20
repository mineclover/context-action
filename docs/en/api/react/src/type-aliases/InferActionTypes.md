[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InferActionTypes

# Type Alias: InferActionTypes\<T\>

> **InferActionTypes**&lt;`T`&gt; = `{ [K in keyof T]: T[K] extends ActionDefinition<infer P> ? P : T[K] extends { payload: infer P } ? P : T[K] }`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:107](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L107)

Infer action payload types from action definitions

Utility type that extracts payload types from action definitions,
supporting both simple and extended definition formats.

## Type Parameters

### Generic type T

`T` *extends* [`ActionDefinitions`](ActionDefinitions.md)

Action definitions record

## Example

```typescript
const definitions = {
  updateUser: { name: string; email: string },
  deleteUser: { id: string },
  resetApp: void
}

type ActionTypes = InferActionTypes<typeof definitions>
// Result: {
//   updateUser: { name: string; email: string }
//   deleteUser: { id: string }
//   resetApp: void
// }
```
