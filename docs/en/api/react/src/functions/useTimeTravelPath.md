[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useTimeTravelPath

# Function: useTimeTravelPath()

> **useTimeTravelPath**\<`T`, `R`\>(`store`, `path`, `options?`): `R`

Defined in: [packages/react/src/stores/hooks/useTimeTravelPath.ts:96](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelPath.ts#L96)

Hook for subscribing to a specific path in TimeTravelStore

Only triggers re-renders when the value at the specified path changes,
determined by analyzing JSON patches from state updates.

## Type Parameters

### Generic type T

Type parameter **T**

### Generic type R

`R` = `unknown`

## Parameters

### store

[`TimeTravelStore`](../classes/TimeTravelStore.md)&lt;`T`&gt;

### path

Type parameter **StorePath**

### options?

[`UseTimeTravelPathOptions`](../interfaces/UseTimeTravelPathOptions.md)&lt;`R`&gt; = `{}`

## Returns

Type parameter **R**

## Example

```tsx
const store = createTimeTravelStore('app', {
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark' }
});

function UserName() {
  // Only re-renders when user.name changes
  const name = useTimeTravelPath(store, ['user', 'name']);
  return <span>{name}</span>;
}

function Theme() {
  // Only re-renders when settings.theme changes
  const theme = useTimeTravelPath(store, ['settings', 'theme']);
  return <span>{theme}</span>;
}
```
