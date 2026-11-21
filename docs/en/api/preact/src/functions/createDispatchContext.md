[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact/src](../README.md) / createDispatchContext

# Function: createDispatchContext()

> **createDispatchContext**&lt;`A`&gt;(`name`): `object`

Defined in: [packages/preact/src/dispatch-context.tsx:20](https://github.com/mineclover/context-action/blob/main/packages/preact/src/dispatch-context.tsx#L20)

Creates a borrowed dispatcher context that neither creates nor destroys a register.

## Type Parameters

### Generic type A

`A` *extends* `object`

## Parameters

### name

`string`

## Returns

`object`

### Provider

> **Provider**: (`props`) => `Element`

#### Parameters

##### props

###### dispatch

`ActionDispatcher`&lt;`A`&gt;

###### children?

`ComponentChildren`

#### Returns

`Element`

### useDispatch

> **useDispatch**: () => `ActionDispatcher`&lt;`A`&gt;

#### Returns

`ActionDispatcher`&lt;`A`&gt;
