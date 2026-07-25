[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValue

# Function: useStoreValue()

## Call Signature

> **useStoreValue**&lt;`S`&gt;(`store`, `options?`): `ReturnType`\<`S`\[`"getValue"`\]\>

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:60](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/hooks/useStoreValue.ts#L60)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:66](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/hooks/useStoreValue.ts#L66)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:72](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/hooks/useStoreValue.ts#L72)

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

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:79](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/hooks/useStoreValue.ts#L79)

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
