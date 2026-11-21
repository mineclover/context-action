[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative-core/src](../README.md) / makeCreator

# Variable: makeCreator

> `const` **makeCreator**: \<`_F`, `_O`\>(`options?`) => \{\<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)&lt;`T`&gt;, () => `Result`\<`T`, `O`, `F`\>\]; \}

Defined in: [packages/mutative-core/src/makeCreator.ts:215](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/makeCreator.ts#L215)

`makeCreator(options)` to make a creator function.

## Example

```ts
import { makeCreator } from 'mutative';

const baseState = { foo: { bar: 'str' }, arr: [] };
const create = makeCreator({ enableAutoFreeze: true });
const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
  },
);

expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
expect(state).not.toBe(baseState);
expect(state.foo).not.toBe(baseState.foo);
expect(state.arr).toBe(baseState.arr);
expect(Object.isFrozen(state)).toBeTruthy();
```

## Type Parameters

### _F

`_F` *extends* `boolean` = `false`

### _O

`_O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

## Parameters

### options?

[`Options`](../interfaces/Options.md)\<`_O`, `_F`\>

## Returns

\{\<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)&lt;`T`&gt;, () => `Result`\<`T`, `O`, `F`\>\]; \}
