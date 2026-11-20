[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / produce

# Function: produce()

> **produce**\<`T`, `F`\>(`baseState`, `producer`, `options?`): `T`

Defined in: [packages/mutative/src/immutable.ts:74](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/immutable.ts#L74)

Create immutable state updates using Mutative

## Type Parameters

### Generic type T

Type parameter **T**

### Generic type F

`F` *extends* `boolean` = `false`

## Parameters

### baseState

Type parameter **T**

The base state to update

### producer

(`draft`) => `T` \| `undefined`

Function that modifies the draft

### options?

[`ProduceOptions`](../interfaces/ProduceOptions.md)&lt;`F`&gt;

Optional configuration

## Returns

Type parameter **T**

The new immutable state

## Example

```ts
const nextState = produce(state, (draft) => {
  draft.user.name = 'John';
  draft.items.push({ id: 1 });
});
```
