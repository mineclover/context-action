[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionDefinition

# Type Alias: ActionDefinition\<T\>

> **ActionDefinition**&lt;`T`&gt; = `T` \| \{ `payload?`: `T`; `handler?`: `ActionHandler`&lt;`T`&gt;; `priority?`: `number`; `timeout?`: `number`; `tags?`: `string`[]; `config?`: `HandlerConfig`; \}

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:45](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L45)

Declarative action definition combining payload types and configuration

Flexible action definition that supports both simple payload types and
extended configurations with handlers, priorities, and metadata.

## Type Parameters

### Generic type T

`T` = `any`

The payload type for this action

## Examples

```typescript
type UserActions = {
  updateProfile: { name: string; email: string }  // Simple payload
  deleteAccount: void                             // No payload
}
```

```typescript
type UserActions = {
  updateProfile: {
    payload: { name: string; email: string }
    handler: ActionHandler<{ name: string; email: string }>
    priority: 100
    tags: ['user', 'profile']
  }
}
```
