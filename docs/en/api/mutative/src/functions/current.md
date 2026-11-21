[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / current

# Function: current()

## Call Signature

> **current**&lt;`T`&gt;(`target`): `T`

Defined in: [packages/mutative-core/dist/index.d.ts:329](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L329)

`current(draft)` to get current state in the draft mutation function.

## Example

```ts
import { create, current } from 'mutative';

const baseState = { foo: { bar: 'str' }, arr: [] };
const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
    expect(current(draft.foo)).toEqual({ bar: 'str2' });
  },
);
```

### Type Parameters

#### T

`T` *extends* `object`

### Parameters

#### target

[`Draft`](../type-aliases/Draft.md)&lt;`T`&gt;

### Returns

Type parameter **T**

## Call Signature

> **current**&lt;`T`&gt;(`target`): `T`

Defined in: [packages/mutative-core/dist/index.d.ts:331](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L331)

### Type Parameters

#### T

`T` *extends* `object`

### Parameters

#### target

Type parameter **T**

### Returns

Type parameter **T**

### Deprecated

You should call current only on `Draft&lt;T&gt;` types.
