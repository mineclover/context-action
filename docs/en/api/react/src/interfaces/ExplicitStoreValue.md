[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ExplicitStoreValue

# Interface: ExplicitStoreValue\<T\>

Defined in: [packages/react/src/stores/patterns/store-definition.ts:12](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/store-definition.ts#L12)

Explicit wrapper for a store value that could otherwise look like store configuration.

Most object values do not need this wrapper. Use [asStoreValue](../functions/asStoreValue.md) when every
property of the value is also a valid configuration property, for example
`{ initialValue: 'domain-value' }`.

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### value

> `readonly` **value**: `T`

Defined in: [packages/react/src/stores/patterns/store-definition.ts:13](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/store-definition.ts#L13)

***

### \[explicitStoreValueMarker\]

> `readonly` **\[explicitStoreValueMarker\]**: `true`

Defined in: [packages/react/src/stores/patterns/store-definition.ts:14](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/store-definition.ts#L14)
