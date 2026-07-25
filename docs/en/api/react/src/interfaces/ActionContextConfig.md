[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionContextConfig

# Interface: ActionContextConfig

Defined in: [packages/react/src/actions/ActionContext.types.ts:45](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L45)

Configuration options for createActionContext

Extends ActionRegisterConfig with optional Zod schema validation.
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

> `optional` **schema?**: `ActionSchemaMap`

Defined in: [packages/react/src/actions/ActionContext.types.ts:51](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L51)

Action schema map for runtime payload validation
When provided, enables Zod-based validation on dispatch
Shorthand for config.registry.schema
