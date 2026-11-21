[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / provideActionDispatcher

# Function: provideActionDispatcher()

> **provideActionDispatcher**&lt;`A`&gt;(`host`, `dispatcher`, `context?`): `ContextProvider`\<\{ \}\>

Defined in: [packages/lit-ui/src/context.ts:152](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L152)

Imperatively attaches an ActionDispatcher ContextProvider to a host element.

## Type Parameters

### Generic type A

`A` *extends* `object` = `object`

Action payload map.

## Parameters

### host

`HTMLElement` & `ReactiveControllerHost`

The hosting LitElement or ReactiveElement.

### dispatcher

`ActionDispatcher`&lt;`A`&gt;

The ActionDispatcher function to provide.

### context?

Optional custom context token (defaults to actionDispatcherContext).

## Returns

`ContextProvider`\<\{ \}\>

The initialized ContextProvider instance.
