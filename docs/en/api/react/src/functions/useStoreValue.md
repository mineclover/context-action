[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValue

# Function: useStoreValue()

## Call Signature

> **useStoreValue**&lt;`T`&gt;(`store`, `options?`): `T`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:74](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/hooks/useStoreValue.ts#L74)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:80](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/hooks/useStoreValue.ts#L80)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:86](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/hooks/useStoreValue.ts#L86)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:93](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/hooks/useStoreValue.ts#L93)

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
