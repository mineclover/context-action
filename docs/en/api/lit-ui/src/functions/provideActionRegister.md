[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / provideActionRegister

# Function: provideActionRegister()

> **provideActionRegister**&lt;`A`&gt;(`host`, `register`, `context?`): `ContextProvider`\<\{ \}\>

Defined in: [packages/lit-ui/src/context.ts:132](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L132)

Imperatively attaches an ActionRegister ContextProvider to a host element.

## Type Parameters

### Generic type A

`A` *extends* `object` = `object`

Action payload map.

## Parameters

### host

`HTMLElement` & `ReactiveControllerHost`

The hosting LitElement or ReactiveElement.

### register

`ActionRegister`&lt;`A`&gt;

The ActionRegister instance to provide.

### context?

Optional custom context token (defaults to actionRegisterContext).

## Returns

`ContextProvider`\<\{ \}\>

The initialized ContextProvider instance.
