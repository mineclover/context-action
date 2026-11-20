[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / MutativeUtils

# Variable: MutativeUtils

> `const` **MutativeUtils**: `object`

Defined in: [packages/mutative/src/immutable.ts:201](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/immutable.ts#L201)

## Type Declaration

### isDraft()

> **isDraft**(`value`): `boolean`

Check if value is a Draft object

#### Parameters

##### value

`unknown`

#### Returns

`boolean`

### original()

> **original**&lt;`T`&gt;(`value`): `T` \| `undefined`

Get original object from Draft

#### Type Parameters

##### T

Type parameter **T**

#### Parameters

##### value

Type parameter **T**

#### Returns

`T` \| `undefined`

### current()

> **current**&lt;`T`&gt;(`value`): `T`

Get current state of Draft (finalized snapshot)

#### Type Parameters

##### T

Type parameter **T**

#### Parameters

##### value

Type parameter **T**

#### Returns

Type parameter **T**

### rawReturn()

> **rawReturn**&lt;`T`&gt;(`value`): `T`

Raw return for replacing entire state

#### Type Parameters

##### T

Type parameter **T**

#### Parameters

##### value

Type parameter **T**

#### Returns

Type parameter **T**

### produce

> **produce**: \<`T`, `F`\>(`baseState`, `producer`, `options?`) => `T`

Produce new state

Create immutable state updates using Mutative

#### Type Parameters

##### T

Type parameter **T**

##### F

`F` *extends* `boolean` = `false`

#### Parameters

##### baseState

Type parameter **T**

The base state to update

##### producer

(`draft`) => `T` \| `undefined`

Function that modifies the draft

##### options?

[`ProduceOptions`](../interfaces/ProduceOptions.md)&lt;`F`&gt;

Optional configuration

#### Returns

Type parameter **T**

The new immutable state

#### Example

```ts
const nextState = produce(state, (draft) => {
  draft.user.name = 'John';
  draft.items.push({ id: 1 });
});
```

### produceWithPatches

> **produceWithPatches**: \<`T`, `F`\>(`baseState`, `producer`, `options?`) => \[`T`, [`Patches`](../type-aliases/Patches.md), [`Patches`](../type-aliases/Patches.md)\]

Produce with patches

Create immutable state updates with patches

#### Type Parameters

##### T

Type parameter **T**

##### F

`F` *extends* `boolean` = `false`

#### Parameters

##### baseState

Type parameter **T**

##### producer

(`draft`) => `T` \| `undefined`

##### options?

`Omit`\<[`ProduceOptions`](../interfaces/ProduceOptions.md)&lt;`F`&gt;, `"enablePatches"`\>

#### Returns

\[`T`, [`Patches`](../type-aliases/Patches.md), [`Patches`](../type-aliases/Patches.md)\]

[nextState, patches, inversePatches]

### apply

> **apply**: \{&lt;`T`&gt;(`state`, `patches`, `options`): `void`; &lt;`T`&gt;(`state`, `patches`, `options?`): `T`; \} = `applyPatches`

Apply patches

#### Call Signature

> &lt;`T`&gt;(`state`, `patches`, `options`): `void`

Apply patches to a state

##### Type Parameters

###### T

Type parameter **T**

##### Parameters

###### state

Type parameter **T**

The state to apply patches to

###### patches

[`Patches`](../type-aliases/Patches.md)

The patches to apply

###### options

Optional configuration

###### mutable

`true`

##### Returns

`void`

The new state with patches applied, or `undefined` when
  `mutable: true` mutates the provided state in place

#### Call Signature

> &lt;`T`&gt;(`state`, `patches`, `options?`): `T`

Apply patches to a state

##### Type Parameters

###### T

Type parameter **T**

##### Parameters

###### state

Type parameter **T**

The state to apply patches to

###### patches

[`Patches`](../type-aliases/Patches.md)

The patches to apply

###### options?

Optional configuration

###### mutable?

`false`

##### Returns

Type parameter **T**

The new state with patches applied, or `undefined` when
  `mutable: true` mutates the provided state in place
