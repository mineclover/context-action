[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / original

# Function: original()

> **original**&lt;`T`&gt;(`target`): `T`

Defined in: [packages/mutative-core/dist/index.d.ts:308](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L308)

`original(draft)` to get original state in the draft mutation function.

## Example

```ts
import { create, original } from 'mutative';

const baseState = { foo: { bar: 'str' }, arr: [] };
const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
    expect(original(draft.foo)).toEqual({ bar: 'str' });
  }
);
```

## Type Parameters

### Generic type T

Type parameter **T**

## Parameters

### target

Type parameter **T**

## Returns

Type parameter **T**
