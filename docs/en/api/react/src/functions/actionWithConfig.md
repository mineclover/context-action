[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / actionWithConfig

# Function: actionWithConfig()

> **actionWithConfig**&lt;`T`&gt;(`payload`, `config`): [`ActionDefinition`](../type-aliases/ActionDefinition.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:710](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L710)

Action definition helper with configuration

Creates an action definition with comprehensive configuration options
including optional handler, priority, timeout, and tags.

## Type Parameters

### Generic type T

Type parameter **T**

Payload type

## Parameters

### payload

Type parameter **T**

Payload type for type inference

### config

Configuration object with optional handler and settings

#### handler?

`ActionHandler`&lt;`T`&gt;

#### priority?

`number`

#### timeout?

`number`

#### tags?

`string`[]

## Returns

[`ActionDefinition`](../type-aliases/ActionDefinition.md)&lt;`T`&gt;

Configured action definition

## Example

```typescript
const userActions = {
  updateProfile: actionWithConfig(
    { name: string; avatar?: string },
    {
      handler: async (payload, controller) => {
        await userService.updateProfile(payload)
      },
      priority: 50,
      timeout: 3000,
      tags: ['user', 'profile', 'update']
    }
  )
}
```
