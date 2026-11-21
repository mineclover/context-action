[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact/src](../README.md) / SourceContext

# Interface: SourceContext\<T\>

Defined in: [packages/preact/src/source-context.tsx:18](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-context.tsx#L18)

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### Provider()

> **Provider**(`props`): `Element`

Defined in: [packages/preact/src/source-context.tsx:19](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-context.tsx#L19)

#### Parameters

##### props

###### sourceSignal

`ReadonlySignal`&lt;`T`&gt;

###### children?

`ComponentChildren`

#### Returns

`Element`

***

### useSourceSignal()

> **useSourceSignal**(): `ReadonlySignal`&lt;`T`&gt;

Defined in: [packages/preact/src/source-context.tsx:23](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-context.tsx#L23)

#### Returns

`ReadonlySignal`&lt;`T`&gt;
