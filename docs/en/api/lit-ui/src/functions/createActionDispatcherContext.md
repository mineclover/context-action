[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / createActionDispatcherContext

# Function: createActionDispatcherContext()

> **createActionDispatcherContext**&lt;`A`&gt;(`name?`): `Context`\<`symbol`, `ActionDispatcher`&lt;`A`&gt;\>

Defined in: [packages/lit-ui/src/context.ts:111](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L111)

Factory function creating a strongly-typed ActionDispatcher context token for a specific action map.

## Type Parameters

### Generic type A

`A` *extends* `object` = `object`

Action payload map.

## Parameters

### name?

`string` = `'default'`

Optional domain qualifier. Defaults to the root action dispatcher.

## Returns

`Context`\<`symbol`, `ActionDispatcher`&lt;`A`&gt;\>

A typed Context token for ActionDispatcher&lt;A&gt;.
