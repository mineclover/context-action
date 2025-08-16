# API Specification for useActionDispatch

The `useActionDispatch` hook provides a typed way to dispatch actions within the Context-Action framework.

## Syntax

```typescript
const dispatch = useActionDispatch<TActions>();
```

## Parameters

- **TActions**: Generic type extending `ActionPayloadMap` that defines the available actions and their payload types.

## Returns

Returns a dispatch function with the following signature:

```typescript
type DispatchFunction<TActions> = <K extends keyof TActions>(
  actionName: K,
  payload: TActions[K]
) => Promise<ActionResult>
```

## Usage Example

```typescript
interface MyActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
  resetData: void;
}

function UserComponent() {
  const dispatch = useActionDispatch<MyActions>();
  
  const handleUpdate = async () => {
    const result = await dispatch('updateUser', { 
      id: '123', 
      name: 'John Doe' 
    });
    
    if (result.success) {
      console.log('User updated successfully');
    }
  };
  
  return (
    <button onClick={handleUpdate}>
      Update User
    </button>
  );
}
```

## Error Handling

The dispatch function returns a Promise that resolves to an `ActionResult` object containing:
- `success`: boolean indicating if the action completed successfully
- `error`: error information if the action failed
- `data`: any result data from the action handlers

## Best Practices

1. Always handle the returned Promise to catch any errors
2. Use proper TypeScript typing for actions to ensure type safety
3. Keep action payloads simple and serializable
4. Consider using action result data for UI updates