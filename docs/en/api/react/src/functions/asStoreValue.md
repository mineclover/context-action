[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / asStoreValue

# Function: asStoreValue()

> **asStoreValue**&lt;`T`&gt;(`value`): [`ExplicitStoreValue`](../interfaces/ExplicitStoreValue.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/store-definition.ts:24](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/store-definition.ts#L24)

Marks a definition as a direct store value without changing the value stored.

This is an additive escape hatch for the structurally ambiguous case where a
domain value has exactly the same shape as a store configuration object.

## Type Parameters

### Generic type T

Type parameter **T**

## Parameters

### value

Type parameter **T**

## Returns

[`ExplicitStoreValue`](../interfaces/ExplicitStoreValue.md)&lt;`T`&gt;
