# Action Type System

Complete guide to the Context-Action framework's type system for actions, including ActionPayloadMap, type safety, and TypeScript integration.

## Prerequisites

For action type definitions and context setup, see **[Basic Action Setup](../setup/basic-action-setup.md)**.

This document demonstrates type system patterns using the action setup:
- Type definitions → [Extended Action Interface](../setup/basic-action-setup.md#extended-action-interface)
- Common patterns → [Common Action Patterns](../setup/basic-action-setup.md#common-action-patterns)

## ActionPayloadMap Interface

The foundation of type-safe action handling in the Context-Action framework.

### Basic Action Mapping

```typescript
// Using the AppActions pattern from setup guide
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  saveUser: { name: string; email: string };
  refreshData: void;
}
```

### Usage with ActionRegister

```typescript
const register = new ActionRegister<AppActions>()

// Type-safe handler registration using setup pattern
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

## Pipeline Controller Types

Type-safe pipeline control for action handlers.

### Basic Pipeline Control

```typescript
// Handler with pipeline control
register.register('validateAndSave', async (payload, controller) => {
  // Modify payload before other handlers
  controller.modifyPayload(p => ({ ...p, validated: true }))
  
  // Get current payload state
  const currentPayload = controller.getPayload()
  
  // Stop execution early if needed
  if (!currentPayload.id) {
    controller.abort('Missing required ID')
    return
  }
  
  // Continue with validation
  const result = await validateUser(currentPayload)
  controller.setResult(result)
})
```

### Early Return with Result

```typescript
register.register('quickCheck', async (payload, controller) => {
  const cached = await getCachedResult(payload.id)
  
  if (cached) {
    // Return early with cached result, skip remaining handlers
    controller.return(cached)
    return
  }
  
  // Continue with expensive operation
  const result = await expensiveOperation(payload)
  controller.setResult(result)
})
```

### Priority Jumping

```typescript
register.register('conditionalHandler', async (payload, controller) => {
  if (payload.urgent) {
    // Skip to high-priority handlers
    controller.jumpToPriority(100)
    return
  }
  
  // Normal processing
  const result = await normalProcessing(payload)
  controller.setResult(result)
}, { priority: 50 })
```

## Action Handler Types

Type-safe action handler definitions with full TypeScript support.

### Store Integration Pattern

```typescript
// Action handler with store integration
register.register('updateUserProfile', async (payload, controller) => {
  // Get current state from stores
  const currentUser = userStore.getValue()
  const currentSettings = settingsStore.getValue()
  
  try {
    // Business logic with type safety
    const updatedUser = { ...currentUser, ...payload }
    const result = await userService.update(updatedUser)
    
    // Update stores with new state
    userStore.setValue(result.user)
    settingsStore.update(settings => ({
      ...settings,
      lastUpdated: result.timestamp
    }))
    
    // Set handler result
    controller.setResult({ success: true, user: result.user })
  } catch (error) {
    controller.abort(`Update failed: ${error.message}`)
  }
})
```

### Async Handler with Error Handling

```typescript
register.register('syncData', async (payload, controller) => {
  try {
    // Start async operation
    const syncResult = await dataSync.start(payload.endpoint)
    
    // Update progress
    controller.setResult({ phase: 'syncing', progress: 0 })
    
    // Monitor progress
    for await (const progress of syncResult.progressStream) {
      controller.setResult({ phase: 'syncing', progress: progress.percent })
    }
    
    // Complete with final result
    controller.setResult({ 
      phase: 'complete', 
      progress: 100, 
      data: syncResult.data 
    })
  } catch (error) {
    controller.abort(`Sync failed: ${error.message}`)
  }
}, { 
  timeout: 30000,
  tags: ['data', 'async'] 
})
```

## Handler Configuration

Type-safe handler configuration with comprehensive options.

### Basic Handler Configuration

```typescript
register.register('processPayment', paymentHandler, {
  priority: 100,           // Higher number = higher priority
  tags: ['payment', 'critical'],
  category: 'business-logic',
  once: false,            // Can be executed multiple times
  timeout: 5000           // 5 second timeout
})
```

### Advanced Configuration

```typescript
register.register('analyticsTracker', trackingHandler, {
  priority: 10,
  tags: ['analytics', 'tracking'],
  category: 'monitoring',
  once: false,
  timeout: 2000,
  debounce: 100,         // Debounce rapid calls
  throttle: 500,         // Throttle execution frequency
  environment: 'production',  // Only in production
  feature: 'analytics'   // Feature flag
})
```

### Conditional Handler

```typescript
register.register('featureHandler', handler, {
  priority: 50,
  condition: (payload, context) => {
    // Only execute if user is premium
    return context.user?.isPremium === true
  },
  tags: ['premium', 'feature']
})
```

## Real-World Examples

- [TodoListDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - Complete todo list with action types
- [ChatDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - Chat system with message actions
- [UserProfileDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - User profile management

## Related Patterns

- [Action Basic Usage](./basic-usage.md) - Fundamental action patterns
- [Register Delegation](./register-delegation.md) - Advanced registration patterns
- [Store Integration](../store/basic-usage.md) - Integrating with stores