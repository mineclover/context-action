[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / createActionRegisterContext

# Function: createActionRegisterContext()

> **createActionRegisterContext**&lt;`A`&gt;(`name?`): `Context`\<`symbol`, `ActionRegister`\<`A`, \{ \}\>\>

Defined in: [packages/lit-ui/src/context.ts:96](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L96)

Factory function creating a strongly-typed ActionRegister context token for a specific action map.

## Type Parameters

### Generic type A

`A` *extends* `object` = `object`

Action payload map.

## Parameters

### name?

`string` = `'default'`

Optional domain qualifier. Defaults to the root action register.

## Returns

`Context`\<`symbol`, `ActionRegister`\<`A`, \{ \}\>\>

A typed Context token for ActionRegister&lt;A&gt;.
