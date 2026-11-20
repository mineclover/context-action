[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/mutative/src](../README.md) / create

# Variable: create

> `const` **create**: \{\<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)&lt;`T`&gt;, () => `Result`\<`T`, `O`, `F`\>\]; \}

Defined in: [packages/mutative-core/dist/index.d.ts:160](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L160)

`create(baseState, callback, options)` to create the next state

## Example

```ts
import { create } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
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
```

## Call Signature

> \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

#### T

`T` *extends* `unknown`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

#### R

`R` *extends* `unknown` = `void`

### Parameters

#### base

Type parameter **T**

#### mutate

(`draft`) => `R`

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

## Call Signature

> \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

#### T

`T` *extends* `unknown`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

#### R

`R` *extends* `void` \| `Promise`&lt;`void`&gt; = `void`

### Parameters

#### base

Type parameter **T**

#### mutate

(`draft`) => `R`

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

## Call Signature

> \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

#### T

`T` *extends* `unknown`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

#### R

`R` *extends* `void` \| `Promise`&lt;`void`&gt; = `void`

### Parameters

#### mutate

(`draft`, ...`args`) => `R`

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>

## Call Signature

> \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)&lt;`T`&gt;, () => `Result`\<`T`, `O`, `F`\>\]

### Type Parameters

#### T

`T` *extends* `unknown`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

#### F

`F` *extends* `boolean` = `false`

### Parameters

#### base

Type parameter **T**

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

\[[`Draft`](../type-aliases/Draft.md)&lt;`T`&gt;, () => `Result`\<`T`, `O`, `F`\>\]
