[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / action

# Function: action()

> **action**&lt;`T`&gt;(`payload?`): [`ActionDefinition`](../type-aliases/ActionDefinition.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:627](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L627)

Simple action definition helper

Creates a basic action definition from a payload type.
Useful for simple actions without additional configuration.

## Type Parameters

### Generic type T

Type parameter **T**

Payload type

## Parameters

### payload?

Type parameter **T**

Optional payload type (for type inference)

## Returns

[`ActionDefinition`](../type-aliases/ActionDefinition.md)&lt;`T`&gt;

Action definition

## Example

```typescript
const userActions = {
  updateName: action<{ name: string }>(),
  deleteAccount: action<void>(),
  login: action<{ email: string; password: string }>()
}
```
