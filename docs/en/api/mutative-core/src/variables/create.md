[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative-core/src](../README.md) / create

# Variable: create

> `const` **create**: \{\<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)&lt;`T`&gt;, () => `Result`\<`T`, `O`, `F`\>\]; \}

Defined in: [packages/mutative-core/src/create.ts:25](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/create.ts#L25)

`create(baseState, callback, options)` to create the next state

## Example

```ts
import { create } from 'mutative';

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

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

`ExplicitState`&lt;`T`&gt;

#### mutate

`ExplicitRecipe`\<`T`, \[\], `ExplicitSyncReturn`&lt;`T`&gt;\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>

## Call Signature

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

`ExplicitState`&lt;`T`&gt;

#### mutate

`ExplicitRecipe`\<`T`, \[\], `Promise`\<`ExplicitReturn`&lt;`T`&gt;\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>

## Call Signature

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

`ExplicitState`&lt;`T`&gt;

#### mutate

`ExplicitPrimitiveRecipe`\<`T`, \[\]\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>

## Call Signature

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

`ExplicitState`&lt;`T`&gt;

#### mutate

`ExplicitRecipe`\<`T`, \[\], `ExplicitReturn`&lt;`T`&gt; \| `Promise`\<`ExplicitReturn`&lt;`T`&gt;\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>

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

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

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

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### mutate

`ExplicitRecipe`\<`T`, `P`, `ExplicitSyncReturn`&lt;`T`&gt;\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### mutate

`ExplicitRecipe`\<`T`, `P`, `Promise`\<`ExplicitReturn`&lt;`T`&gt;\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### mutate

`ExplicitPrimitiveRecipe`\<`T`, `P`\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### mutate

`ExplicitRecipe`\<`T`, `P`, `ExplicitReturn`&lt;`T`&gt; \| `Promise`\<`ExplicitReturn`&lt;`T`&gt;\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`&lt;`T`&gt;, `O`, `F`\>\>

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

`R` *extends* `unknown` = `void`

### Parameters

#### mutate

(`draft`, ...`args`) => `R`

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>

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

`R` *extends* `unknown` = `void`

### Parameters

#### mutate

(`draft`, ...`args`) => `R`

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

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

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

\[[`Draft`](../type-aliases/Draft.md)&lt;`T`&gt;, () => `Result`\<`T`, `O`, `F`\>\]
