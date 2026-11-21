[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / StoreInitConfig

# Interface: StoreInitConfig\<T\>

Defined in: [packages/react/src/stores/utils/type-helpers.ts:77](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/type-helpers.ts#L77)

Type for store initialization configuration

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### name

> **name**: `string`

Defined in: [packages/react/src/stores/utils/type-helpers.ts:78](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/type-helpers.ts#L78)

***

### initialValue

> **initialValue**: `T`

Defined in: [packages/react/src/stores/utils/type-helpers.ts:79](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/type-helpers.ts#L79)

***

### validateValue?

> `optional` **validateValue?**: (`value`) => `value is T`

Defined in: [packages/react/src/stores/utils/type-helpers.ts:80](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/type-helpers.ts#L80)

#### Parameters

##### value

`unknown`

#### Returns

`value is T`

***

### transformValue?

> `optional` **transformValue?**: (`value`) => `T`

Defined in: [packages/react/src/stores/utils/type-helpers.ts:81](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/type-helpers.ts#L81)

#### Parameters

##### value

`unknown`

#### Returns

Type parameter **T**
