[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionPayloadMap

# Interface: ActionPayloadMap

Defined in: [packages/core/src/types.ts:40](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L40)

Action payload mapping interface for type-safe action dispatching

Defines the mapping between action names and their corresponding payload types.
This interface serves as the foundation for type-safe action handling throughout
the Context-Action framework.

## Examples

```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string }
  deleteUser: { id: string }
  resetUser: void  // Actions without payload
  fetchUsers: { page: number; limit: number }
  toggleTheme: { theme: 'light' | 'dark' }
}
```

```typescript
const register = new ActionRegister<AppActions>()

// Type-safe handler registration
register.register('updateUser', async (payload, controller) => {
  // payload is automatically typed as { id: string; name: string; email: string }
  await userService.update(payload.id, payload)
})

// Type-safe dispatch
await register.dispatch('updateUser', {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
})
```

## Indexable

\[`actionName`: `string`\]: `unknown`
