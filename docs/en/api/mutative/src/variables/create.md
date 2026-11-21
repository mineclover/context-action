[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / create

# Variable: create

> `const` **create**: \{\<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\> \| `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\> \| `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)&lt;`T`&gt;, () => `Result`\<`T`, `O`, `F`\>\]; \}

Defined in: [packages/mutative-core/dist/index.d.ts:233](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L233)

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

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]

#### mutate

\[`T`\] *extends* \[`never`\] ? `never` : (`draft`) => \[\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\] *extends* \[`string` \| `number` \| `bigint` \| `boolean` \| `symbol` \| `null` \| `undefined`\] ? `true` : `false` *extends* `true` ? `Promise`\<`void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\>\> & `object` : `void` \| `Promise`\<`void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[...\]\[... *extends* ... ? ... : ...\]\>\> & `object` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\>

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>

## Call Signature

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]

#### mutate

\[`T`\] *extends* \[`never`\] ? `never` : (`draft`) => `Promise`\<`void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\>\>

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

`Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>

## Call Signature

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]

#### mutate

\[\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\] *extends* \[`string` \| `number` \| `bigint` \| `boolean` \| `symbol` \| `null` \| `undefined`\] ? `true` : `false` *extends* `true` ? \[`T`\] *extends* \[`never`\] ? `never` : (`draft`) => `void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\> : `never`

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>

## Call Signature

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\> \| `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]

#### mutate

\[`T`\] *extends* \[`never`\] ? `never` : (`draft`) => `void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\> \| `Promise`\<`void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\>\>

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\> \| `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>

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

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>

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

\[`T`\] *extends* \[`never`\] ? `never` : (`draft`, ...`args`) => \[\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\] *extends* \[`string` \| `number` \| `bigint` \| `boolean` \| `symbol` \| `null` \| `undefined`\] ? `true` : `false` *extends* `true` ? `Promise`\<`void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\>\> & `object` : `void` \| `Promise`\<`void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[...\]\[... *extends* ... ? ... : ...\]\>\> & `object` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\>

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>

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

\[`T`\] *extends* \[`never`\] ? `never` : (`draft`, ...`args`) => `Promise`\<`void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\>\>

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>

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

\[\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\] *extends* \[`string` \| `number` \| `bigint` \| `boolean` \| `symbol` \| `null` \| `undefined`\] ? `true` : `false` *extends* `true` ? \[`T`\] *extends* \[`never`\] ? `never` : (`draft`, ...`args`) => `void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\> : `never`

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\> \| `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>

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

\[`T`\] *extends* \[`never`\] ? `never` : (`draft`, ...`args`) => `void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\> \| `Promise`\<`void` \| \[`T`\]\[`T` *extends* `any` ? `0` : `never`\] \| [`Draft`](../type-aliases/Draft.md)\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\]\>\>

#### options?

`ExternalOptions`\<`O`, `F`\>

### Returns

(`base`, ...`args`) => `Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\> \| `Promise`\<`Result`\<\[`T`\]\[`T` *extends* `any` ? `0` : `never`\], `O`, `F`\>\>

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

`ExternalOptions`\<`O`, `F`\>

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
