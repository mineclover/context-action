[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / actionWithHandler

# Function: actionWithHandler()

> **actionWithHandler**&lt;`T`&gt;(`payload`, `handler`, `config?`): [`ActionDefinition`](../type-aliases/ActionDefinition.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:664](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L664)

Action definition helper with handler

Creates an action definition that includes a predefined handler
and optional configuration. The handler will be automatically
registered when the Provider is created.

## Type Parameters

### Generic type T

Type parameter **T**

Payload type

## Parameters

### payload

Type parameter **T**

Payload type for type inference

### handler

`ActionHandler`&lt;`T`&gt;

Action handler function

### config?

Optional handler configuration

#### priority?

`number`

#### timeout?

`number`

#### tags?

`string`[]

## Returns

[`ActionDefinition`](../type-aliases/ActionDefinition.md)&lt;`T`&gt;

Extended action definition with handler

## Example

```typescript
const userActions = {
  login: actionWithHandler(
    { email: string; password: string },
    async (payload, controller) => {
      const result = await authService.login(payload)
      controller.setResult(result)
    },
    {
      priority: 100,
      timeout: 5000,
      tags: ['auth', 'login']
    }
  )
}
```
