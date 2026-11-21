[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / apply

# Function: apply()

## Call Signature

> **apply**\<`T`, `F`, `_A`\>(`state`, `patches`, `applyOptions?`): `ApplyState`\<`T`, `F`, `undefined`\>

Defined in: [packages/mutative-core/dist/index.d.ts:279](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L279)

`apply(state, patches)` to apply patches to state

## Example

```ts
import { create, apply } from 'mutative';

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

#### _A

`_A` *extends* `ApplyOptions`&lt;`boolean`&gt; \| `undefined` = `ApplyImmutableOptions`&lt;`F`&gt;

### Parameters

#### state

Type parameter **T**

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions?

`undefined`

### Returns

`ApplyState`\<`T`, `F`, `undefined`\>

## Call Signature

> **apply**\<`T`, `F`, `A`\>(`state`, `patches`, `applyOptions`): `ApplyResult`\<`T`, `F`, `A`\>

Defined in: [packages/mutative-core/dist/index.d.ts:280](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L280)

`apply(state, patches)` to apply patches to state

## Example

```ts
import { create, apply } from 'mutative';

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

#### A

`A` *extends* `ApplyOptions`&lt;`boolean`&gt; \| `undefined` = `ApplyImmutableOptions`&lt;`F`&gt;

### Parameters

#### state

Type parameter **T**

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions

Type parameter **A**

### Returns

`ApplyResult`\<`T`, `F`, `A`\>

## Call Signature

> **apply**\<`T`, `F`, `A`\>(`state`, `patches`, `applyOptions?`): `ApplyState`\<`T`, `F`, `undefined`\> \| `ApplyResult`\<`T`, `F`, `A`\>

Defined in: [packages/mutative-core/dist/index.d.ts:281](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L281)

`apply(state, patches)` to apply patches to state

## Example

```ts
import { create, apply } from 'mutative';

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

#### A

`A` *extends* `ApplyOptions`&lt;`boolean`&gt; \| `undefined` = `ApplyImmutableOptions`&lt;`F`&gt;

### Parameters

#### state

Type parameter **T**

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions?

Type parameter **A**

### Returns

`ApplyState`\<`T`, `F`, `undefined`\> \| `ApplyResult`\<`T`, `F`, `A`\>

## Call Signature

> **apply**\<`T`, `F`\>(`state`, `patches`, `applyOptions`): `void`

Defined in: [packages/mutative-core/dist/index.d.ts:282](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L282)

`apply(state, patches)` to apply patches to state

## Example

```ts
import { create, apply } from 'mutative';

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

### Parameters

#### state

Type parameter **T**

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions

##### mutable

`true`

### Returns

`void`

## Call Signature

> **apply**\<`T`, `F`\>(`state`, `patches`, `applyOptions`): `void` \| `ApplyState`\<`T`, `F`, `undefined`\> \| `ApplyState`\<`T`, `F`, `ApplyMutableOptions`\>

Defined in: [packages/mutative-core/dist/index.d.ts:287](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L287)

`apply(state, patches)` to apply patches to state

## Example

```ts
import { create, apply } from 'mutative';

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

### Parameters

#### state

Type parameter **T**

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions

`ApplyMutableOptions` \| `undefined`

### Returns

`void` \| `ApplyState`\<`T`, `F`, `undefined`\> \| `ApplyState`\<`T`, `F`, `ApplyMutableOptions`\>
