[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValue

# Function: useStoreValue()

## Call Signature

> **useStoreValue**&lt;`T`&gt;(`store`, `options?`): `T`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:81](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/hooks/useStoreValue.ts#L81)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:87](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/hooks/useStoreValue.ts#L87)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:93](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/hooks/useStoreValue.ts#L93)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:100](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/hooks/useStoreValue.ts#L100)

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
