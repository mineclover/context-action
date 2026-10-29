[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValue

# Function: useStoreValue()

## Call Signature

> **useStoreValue**&lt;`S`&gt;(`store`, `options?`): `ReturnType`\<`S`\[`"getValue"`\]\>

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:63](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStoreValue.ts#L63)

### Type Parameters

#### S

`S` *extends* [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;

### Parameters

#### store

Type parameter **S**

#### options?

`StoreValueOptions`\<`ReturnType`\<`S`\[`"getValue"`\]\>\>

### Returns

`ReturnType`\<`S`\[`"getValue"`\]\>

## Call Signature

> **useStoreValue**&lt;`S`&gt;(`store`, `options?`): `ReturnType`\<`S`\[`"getValue"`\]\> \| `undefined`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:69](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStoreValue.ts#L69)

### Type Parameters

#### S

`S` *extends* [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;

### Parameters

#### store

`S` \| `null` \| `undefined`

#### options?

`StoreValueOptions`\<`ReturnType`\<`S`\[`"getValue"`\]\>\>

### Returns

`ReturnType`\<`S`\[`"getValue"`\]\> \| `undefined`

## Call Signature

> **useStoreValue**\<`S`, `R`\>(`store`, `selector`, `options?`): `R`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:75](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStoreValue.ts#L75)

### Type Parameters

#### S

`S` *extends* [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;

#### R

Type parameter **R**

### Parameters

#### store

Type parameter **S**

#### selector

(`value`) => `R`

#### options?

`StoreValueOptions`&lt;`R`&gt;

### Returns

Type parameter **R**

## Call Signature

> **useStoreValue**\<`S`, `R`\>(`store`, `selector`, `options?`): `R` \| `undefined`

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:82](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStoreValue.ts#L82)

### Type Parameters

#### S

`S` *extends* [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;

#### R

Type parameter **R**

### Parameters

#### store

`S` \| `null` \| `undefined`

#### selector

(`value`) => `R`

#### options?

`StoreValueOptions`&lt;`R`&gt;

### Returns

`R` \| `undefined`
