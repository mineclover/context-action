[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / provideStore

# Function: provideStore()

> **provideStore**&lt;`T`&gt;(`host`, `context`, `store`): `ContextProvider`\<\{ \}\>

Defined in: [packages/lit-ui/src/context.ts:172](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L172)

Imperatively attaches a ReadableStore ContextProvider to a host element.

## Type Parameters

### Generic type T

Type parameter **T**

Store state type.

## Parameters

### host

`HTMLElement` & `ReactiveControllerHost`

The hosting LitElement or ReactiveElement.

### context

The store Context token created via `createStoreContext`.

### store

`ReadableStore`&lt;`T`&gt;

The ReadableStore instance to provide.

## Returns

`ContextProvider`\<\{ \}\>

The initialized ContextProvider instance.
