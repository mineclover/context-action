[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionHandler

# Type Alias: ActionHandler()\<T, R\>

> **ActionHandler**\<`T`, `R`\> = (`payload`, `controller`) => `R` \| `Promise`&lt;`R`&gt; \| `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:220](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L220)

Action handler function type for processing actions within the pipeline

Defines the signature for action handler functions that contain the business logic
for processing specific actions. Handlers follow the Store Integration Pattern:
1. Read current state from stores
2. Execute business logic
3. Update stores with new state

## Type Parameters

### Generic type T

`T` = `any`

The payload type for this action

### Generic type R

`R` = `void`

The return type for this handler

## Parameters

### payload

Type parameter **T**

The action payload data

### controller

[`PipelineController`](../interfaces/PipelineController.md)\<`T`, `R`\>

Pipeline controller for managing execution flow

## Returns

`R` \| `Promise`&lt;`R`&gt; \| `void` \| `Promise`&lt;`void`&gt;

The result value or Promise resolving to result

## Examples

```typescript
const updateUserHandler: ActionHandler<{id: string, name: string, email: string}> = 
  async (payload, controller) => {
    // 1. Read current state from stores
    const currentUser = userStore.getValue()
    const settings = settingsStore.getValue()
    
    // 2. Execute business logic
    if (!settings.allowUserUpdates) {
      controller.abort('User updates are disabled')
      return
    }
    
    const updatedUser = {
      ...currentUser,
      ...payload,
      updatedAt: new Date().toISOString()
    }
    
    // 3. Update stores
    userStore.setValue(updatedUser)
    
    // Set result for other handlers or components
    controller.setResult({ success: true, user: updatedUser })
  }
```

```typescript
const saveUserHandler: ActionHandler<UserData, SaveResult> = 
  async (payload, controller) => {
    try {
      const result = await userService.save(payload)
      
      // Update local store with server response
      userStore.setValue(result.user)
      
      return { success: true, userId: result.user.id }
    } catch (error) {
      controller.abort(`Save failed: ${error.message}`)
      return { success: false, error: error.message }
    }
  }
```
