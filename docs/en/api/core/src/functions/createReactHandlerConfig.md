[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / createReactHandlerConfig

# Function: createReactHandlerConfig()

> **createReactHandlerConfig**(`action`, `componentId?`, `config?`): `Required`\<[`HandlerConfig`](../interfaces/HandlerConfig.md)\>

Defined in: [packages/core/src/react-helpers.ts:179](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L179)

🆕 React handler configuration factory

Creates optimized handler configurations for React environments with
proper cleanup and unique ID generation.

## Parameters

### action

`string`

Action name

### componentId?

`string`

Optional component identifier for debugging

### config?

[`HandlerConfig`](../interfaces/HandlerConfig.md) = `{}`

Base handler configuration

## Returns

`Required`\<[`HandlerConfig`](../interfaces/HandlerConfig.md)\>

Optimized configuration for React environments

## Example

```tsx
function MyComponent({ userId }: { userId: string }) {
  const registry = useActionRegister();
  
  useEffect(() => {
    const config = createReactHandlerConfig('updateUser', 'MyComponent', {
      priority: 10
    });
    
    const unregister = registry.register('updateUser', handler, config);
    return unregister;
  }, [registry, handler]);
}
```
