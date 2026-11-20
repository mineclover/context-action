[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/mutative/src](../README.md) / apply

# Function: apply()

> **apply**\<`T`, `F`, `A`\>(`state`, `patches`, `applyOptions?`): `ApplyResult`\<`T`, `F`, `A`\>

Defined in: [packages/mutative-core/dist/index.d.ts:189](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L189)

`apply(state, patches)` to apply patches to state

## Example

```ts
import { create, apply } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const [state, patches] = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
  },
  { enablePatches: true }
);
expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
expect(patches).toEqual([{ op: 'replace', path: ['foo', 'bar'], value: 'str2' }]);
expect(state).toEqual(apply(baseState, patches));
```

## Type Parameters

### Generic type T

`T` *extends* `object`

### Generic type F

`F` *extends* `boolean` = `false`

### Generic type A

`A` *extends* `ApplyOptions`&lt;`F`&gt; = `ApplyOptions`&lt;`F`&gt;

## Parameters

### state

Type parameter **T**

### patches

[`Patches`](../type-aliases/Patches.md)

### applyOptions?

Type parameter **A**

## Returns

`ApplyResult`\<`T`, `F`, `A`\>
