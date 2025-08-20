[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createSimpleActionContext

# Function: createSimpleActionContext()

> **createSimpleActionContext**&lt;`T`&gt;(`contextName`): [`SimpleActionContextReturn`](../interfaces/SimpleActionContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/createActionContext.ts:149](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/createActionContext.ts#L149)

Create a simple action context for React components

Creates a type-safe action context following the Action Only Pattern.
Provides action dispatching and handler registration without state management.
Perfect for event systems, command patterns, and UI interactions.

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

Action payload mapping interface

## Parameters

### contextName

`string`

Unique name for this action context (used in error messages)

## Returns

[`SimpleActionContextReturn`](../interfaces/SimpleActionContextReturn.md)&lt;`T`&gt;

SimpleActionContextReturn with Provider, hooks, and context name

## Examples

```typescript
// Define action types
interface AuthActions extends Record<string, any> {
  login: { username: string; password: string }
  logout: void
  refreshToken: { token: string }
  updateProfile: { name: string; email: string }
}

// Create action context
const AuthActions = createActionContext<AuthActions>('AuthActions')

// Use in component
function AuthComponent() {
  const dispatch = AuthActions.useAction()
  
  // Register handlers with business logic
  AuthActions.useActionHandler('login', async ({ username, password }, controller) => {
    try {
      const response = await authAPI.login(username, password)
      controller.setResult({ success: true, user: response.user })
    } catch (error) {
      controller.abort('Login failed')
    }
  })
  
  AuthActions.useActionHandler('logout', async (_, controller) => {
    await authAPI.logout()
    controller.setResult({ success: true })
  })
  
  return (
    <div>
      <button onClick={() => dispatch('login', {
        username: 'user@example.com',
        password: 'password123'
      })}>
        Login
      </button>
      <button onClick={() => dispatch('logout')}>
        Logout
      </button>
    </div>
  )
}
```

```typescript
function App() {
  return (
    <AuthActions.Provider>
      <AuthComponent />
      <UserProfile />
    </AuthActions.Provider>
  )
}
```

```typescript
// High priority validation
AuthActions.useActionHandler('login', async (payload, controller) => {
  if (!payload.username || !payload.password) {
    controller.abort('Username and password required')
  }
}, { priority: 100 })

// Lower priority business logic
AuthActions.useActionHandler('login', async (payload, controller) => {
  const result = await authService.authenticate(payload)
  controller.setResult(result)
}, { priority: 50 })
```
