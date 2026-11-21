[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / rawReturn

# Function: rawReturn()

> **rawReturn**&lt;`T`&gt;(`value`): `T`

Defined in: [packages/mutative-core/dist/index.d.ts:385](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L385)

Use rawReturn() to wrap the return value to skip the draft check and thus improve performance.

## Example

```ts
import { create, rawReturn } from 'mutative';

const baseState = { foo: { bar: 'str' }, arr: [] };
const state = create(
  baseState,
  (draft) => {
    return rawReturn(baseState);
  },
);
expect(state).toBe(baseState);
```

## Type Parameters

### Generic type T

`T` *extends* `object` \| `undefined`

## Parameters

### value

Type parameter **T**

## Returns

Type parameter **T**
