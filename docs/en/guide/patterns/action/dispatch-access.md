# Dispatch Access Patterns

Two main approaches for accessing action dispatch functionality in the Context-Action framework: register-based access and hook-based access.

## Prerequisites

For complete setup instructions, see **[Basic Action Setup](../setup/basic-action-setup.md)**.

This document uses the `AppActions` pattern from the setup guide:
- Type definitions → [Extended Action Interface](../setup/basic-action-setup.md#extended-action-interface)
- Context creation → [Single Domain Context](../setup/basic-action-setup.md#single-domain-context)
- Provider setup → [Single Provider Setup](../setup/basic-action-setup.md#single-provider-setup)

## Hook-Based Dispatch (Recommended)

Use React hooks from `createActionContext` to access dispatch functionality within components. This is the recommended approach for React applications.

### Basic Hook Usage

```typescript
function UserComponent() {
  const dispatch = useActionDispatch()
  
  const handleUpdate = () => {
    dispatch('updateUser', { id: '123', name: 'John', email: 'john@example.com' })
  }
  
  return <button onClick={handleUpdate}>Update User</button>
}
```

### Hook with Result Collection

```typescript
function UserProfile() {
  const { dispatch } = useActionDispatchWithResult()
  const [loading, setLoading] = useState(false)
  
  const handleSave = async () => {
    setLoading(true)
    try {
      const result = await dispatch('saveUser', userData)
      if (result.success) {
        console.log('User saved successfully')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button onClick={handleSave} disabled={loading}>
      {loading ? 'Saving...' : 'Save User'}
    </button>
  )
}
```

### Complete Component Implementation

```typescript
function UserManagement() {
  const dispatch = useActionDispatch()
  
  const updateProfile = (data: { name: string; email: string }) => {
    // Fully type-safe dispatch
    dispatch('updateUser', { id: '123', ...data })
  }
  
  const deleteAccount = () => {
    dispatch('deleteUser', { id: '123' })
  }
  
  const refreshData = () => {
    dispatch('refreshData')  // No payload needed for void actions
  }
  
  return (
    <div>
      <button onClick={() => updateProfile({ name: 'John', email: 'john@example.com' })}>
        Update Profile
      </button>
      <button onClick={deleteAccount}>Delete Account</button>
      <button onClick={refreshData}>Refresh</button>
    </div>
  )
}
```

## Register-Based Dispatch

Access the ActionRegister instance through React context for advanced use cases within React applications.

### Advanced Dispatch with Register Access

```typescript
function AdvancedDispatchComponent() {
  const register = useActionRegister()  // From createActionContext
  
  const handleAdvancedDispatch = async () => {
    if (!register) return
    
    // Dispatch with detailed result information
    const result = await register.dispatchWithResult('updateUser', payload)

    if (result.success) {
      console.log('Execution details:', {
        duration: result.execution.duration,
        handlersExecuted: result.execution.handlersExecuted,
        results: result.results
      })
    } else {
      console.error('Action failed:', result.error)
    }
  }
  
  return <button onClick={handleAdvancedDispatch}>Advanced Dispatch</button>
}
```

## React Integration with Register Access

Access the underlying register instance within React components when needed.

### Using Context-Generated useActionRegister Hook

```typescript
function AdvancedComponent() {
  const register = useActionRegister()  // From createActionContext
  
  const handleComplexOperation = async () => {
    if (!register) return
    
    // Direct register access for advanced operations
    const result = await register.dispatchWithResult('updateUser', payload, {
      executionMode: 'parallel',
      filter: {
        tags: ['critical'],
        excludeTags: ['analytics']
      }
    })
    
    console.log('Advanced result:', result)
  }
  
  return <button onClick={handleComplexOperation}>Complex Operation</button>
}
```

### Register Information Access

```typescript
function DebugPanel() {
  const register = useActionRegister()  // From createActionContext
  
  const showRegistryInfo = () => {
    if (!register) return
    
    const info = register.getRegistryInfo()
    console.log('Registry information:', {
      name: info.name,
      totalActions: info.totalActions,
      totalHandlers: info.totalHandlers,
      registeredActions: info.registeredActions
    })
  }
  
  return <button onClick={showRegistryInfo}>Show Registry Info</button>
}
```

## Comparison: Hook vs Register

### Hook-Based Dispatch (Recommended)

**Pros:**
- React-optimized with automatic context management
- Cleaner component code with less boilerplate
- Automatic provider dependency injection
- Type-safe with excellent TypeScript integration
- Follows React patterns and conventions

**Cons:**
- React-specific, not usable outside React components
- Less control over advanced dispatch options
- Requires React Context setup

**Use Cases:**
- Standard React component interactions
- Form submissions and user events
- Component-level business logic
- Most React application scenarios

### Register-Based Dispatch

**Pros:**
- Framework-agnostic, works in any JavaScript environment
- Full control over dispatch options and configuration
- Direct access to all ActionRegister features
- Advanced debugging and monitoring capabilities
- Suitable for utility functions and services

**Cons:**
- More verbose setup and usage
- Manual dependency management
- Requires explicit register instance passing
- More complex error handling

**Use Cases:**
- Advanced dispatch configurations within React components
- Testing and debugging scenarios  
- Complex business logic requiring register metadata
- Service layer implementations within React context

## Best Practices

### When to Use Hooks

```typescript
// ✅ Standard component interactions
function UserForm() {
  const dispatch = useActionDispatch()
  
  const handleSubmit = (formData) => {
    dispatch('updateUser', formData)
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### When to Use Register

```typescript
// ✅ Service layer within React context
function UserManagement() {
  const register = useActionRegister()
  
  const batchUpdateUsers = async (users: User[]) => {
    if (!register) return []
    
    const results = await Promise.all(
      users.map(user => 
        register.dispatchWithResult('updateUser', user, {
          executionMode: 'parallel',
          timeout: 10000
        })
      )
    )
    
    return results.filter(r => r.success)
  }
  
  return <button onClick={() => batchUpdateUsers(selectedUsers)}>Batch Update</button>
}
```

### Hybrid Approach

```typescript
// ✅ Component uses both hook dispatch and register for complex operations
function UserManagement() {
  const dispatch = useActionDispatch()  // From createActionContext
  const register = useActionRegister()  // From createActionContext
  
  const handleBatchUpdate = async () => {
    if (!register) return
    
    // Use register for complex batch operation
    const results = await Promise.all(
      selectedUsers.map(user => 
        register.dispatchWithResult('updateUser', user, {
          executionMode: 'parallel',
          timeout: 10000
        })
      )
    )
    
    // Use hook dispatch for simple notification action
    dispatch('refreshData')
  }
  
  return <button onClick={handleBatchUpdate}>Batch Update</button>
}
```

## Error Handling Patterns

### Hook Error Handling

```typescript
function SafeComponent() {
  const dispatch = useActionDispatch()  // From createActionContext
  
  const handleAction = async () => {
    try {
      await dispatch('updateUser', payload)
    } catch (error) {
      // Handle dispatch errors - use an action that exists in AppActions
      console.error('Action failed:', error.message)
    }
  }
  
  return <button onClick={handleAction}>Safe Action</button>
}
```

### Register Error Handling

```typescript
function ComponentWithRegisterErrorHandling() {
  const register = useActionRegister()  // From createActionContext
  
  const handleWithRegister = async () => {
    if (!register) return
    
    try {
      const result = await register.dispatchWithResult('updateUser', payload)
      
      if (!result.success) {
        console.error('Action failed:', result.error)
        // Handle specific failure scenarios
        return { success: false, error: result.error }
      }
      
      return { success: true, data: result.results }
    } catch (error) {
      console.error('Unexpected error:', error)
      throw error
    }
  }
  
  return <button onClick={handleWithRegister}>Handle with Register</button>
}
```

## Real-World Examples

- [Todo List Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - Hook-based dispatch patterns
- [Chat Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - Mixed hook and register usage
- [User Profile Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - Advanced dispatch patterns

## Related Patterns

- [Dispatch Patterns](./dispatch-patterns.md) - Basic dispatching techniques
- [Register Patterns](./register-patterns.md) - Handler registration patterns
- [Action Basic Usage](./basic-usage.md) - Fundamental action concepts
- [Type System](./type-system.md) - TypeScript integration