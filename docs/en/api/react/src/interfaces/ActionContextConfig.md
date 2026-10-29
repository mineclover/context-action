[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionContextConfig

# Interface: ActionContextConfig

Defined in: [packages/react/src/actions/ActionContext.types.ts:53](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L53)

Configuration options for createActionContext

Extends ActionRegisterConfig with optional structural payload validation.
When schema is provided, payload validation is enabled on dispatch.

## Example

```typescript
const { Provider } = createActionContext<UserActions>('User', {
  schema: userActionSchema,
  registry: {
    validationMode: 'strict', // 'strict' | 'warn' | 'silent'
  },
});
```

## Extends

- `Omit`\<`ActionRegisterConfig`, `"name"`\>

## Properties

### schema?

> `optional` **schema?**: `Record`\<`string`, `ActionSchemaLike`\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:59](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L59)

Action schema map for runtime payload validation
Uses the core validator contract; no tool protocol or schema library is required.
Shorthand for config.registry.schema
