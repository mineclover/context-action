[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValue

# Function: useStoreValue()

## Call Signature

> **useStoreValue**\<`T`\>(`store`, `options?`): `T`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:81](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/hooks/useStoreValue.ts#L81)

### Type Parameters

#### T

`T`

### Parameters

#### store

[`Store`](../classes/Store.md)\<`T`\>

#### options?

`StoreValueOptions`\<`T`\>

### Returns

`T`

## Call Signature

> **useStoreValue**\<`T`\>(`store`, `options?`): `undefined` \| `T`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:87](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/hooks/useStoreValue.ts#L87)

### Type Parameters

#### T

`T`

### Parameters

#### store

`undefined` | `null` | [`Store`](../classes/Store.md)\<`T`\>

#### options?

`StoreValueOptions`\<`T`\>

### Returns

`undefined` \| `T`

## Call Signature

> **useStoreValue**\<`T`, `R`\>(`store`, `selector`, `options?`): `R`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:93](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/hooks/useStoreValue.ts#L93)

### Type Parameters

#### T

`T`

#### R

`R`

### Parameters

#### store

[`Store`](../classes/Store.md)\<`T`\>

#### selector

(`value`) => `R`

#### options?

`StoreValueOptions`\<`R`\>

### Returns

`R`

## Call Signature

> **useStoreValue**\<`T`, `R`\>(`store`, `selector`, `options?`): `undefined` \| `R`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:100](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/hooks/useStoreValue.ts#L100)

### Type Parameters

#### T

`T`

#### R

`R`

### Parameters

#### store

`undefined` | `null` | [`Store`](../classes/Store.md)\<`T`\>

#### selector

(`value`) => `R`

#### options?

`StoreValueOptions`\<`R`\>

### Returns

`undefined` \| `R`
