[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValue

# Function: useStoreValue()

## Call Signature

> **useStoreValue**&lt;`T`&gt;(`store`, `options?`): `T`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:91](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/hooks/useStoreValue.ts#L91)

### Type Parameters

#### T

Type parameter **T**

### Parameters

#### store

[`Store`](../classes/Store.md)&lt;`T`&gt;

#### options?

`StoreValueOptions`&lt;`T`&gt;

### Returns

Type parameter **T**

## Call Signature

> **useStoreValue**&lt;`T`&gt;(`store`, `options?`): `undefined` \| `T`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:97](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/hooks/useStoreValue.ts#L97)

### Type Parameters

#### T

Type parameter **T**

### Parameters

#### store

`undefined` | `null` | [`Store`](../classes/Store.md)&lt;`T`&gt;

#### options?

`StoreValueOptions`&lt;`T`&gt;

### Returns

`undefined` \| `T`

## Call Signature

> **useStoreValue**\<`T`, `R`\>(`store`, `selector`, `options?`): `R`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:103](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/hooks/useStoreValue.ts#L103)

### Type Parameters

#### T

Type parameter **T**

#### R

Type parameter **R**

### Parameters

#### store

[`Store`](../classes/Store.md)&lt;`T`&gt;

#### selector

(`value`) => `R`

#### options?

`StoreValueOptions`&lt;`R`&gt;

### Returns

Type parameter **R**

## Call Signature

> **useStoreValue**\<`T`, `R`\>(`store`, `selector`, `options?`): `undefined` \| `R`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:110](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/hooks/useStoreValue.ts#L110)

### Type Parameters

#### T

Type parameter **T**

#### R

Type parameter **R**

### Parameters

#### store

`undefined` | `null` | [`Store`](../classes/Store.md)&lt;`T`&gt;

#### selector

(`value`) => `R`

#### options?

`StoreValueOptions`&lt;`R`&gt;

### Returns

`undefined` \| `R`
