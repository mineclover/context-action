[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionDefinitions

# Type Alias: ActionDefinitions

> **ActionDefinitions** = `Record`\<`string`, [`ActionDefinition`](ActionDefinition.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:79](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L79)

Action definitions mapping interface

Maps action names to their definitions, supporting both simple payload types
and extended configurations. Used as the foundation for type-safe action handling.

## Example

```typescript
const actions: ActionDefinitions = {
  login: { email: string; password: string },
  logout: void,
  updateProfile: {
    payload: { name: string },
    handler: async (payload, controller) => {
      await userService.updateProfile(payload)
    },
    priority: 100
  }
}
```
