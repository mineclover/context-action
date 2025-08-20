[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValue

# Function: useStoreValue()

## Call Signature

> **useStoreValue**&lt;`T`&gt;(`store`, `options?`): `T`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:130](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/useStoreValue.ts#L130)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:136](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/useStoreValue.ts#L136)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:142](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/useStoreValue.ts#L142)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:149](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/useStoreValue.ts#L149)

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
