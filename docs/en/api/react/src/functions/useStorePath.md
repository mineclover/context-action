[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStorePath

# Function: useStorePath()

> **useStorePath**\<`T`, `R`\>(`store`, `path`, `options?`): `R`

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:113](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStorePath.ts#L113)

Hook for subscribing to a specific path in Store

Only triggers re-renders when the value at the specified path changes,
determined by analyzing JSON patches from state updates.

## Type Parameters

### Generic type T

Type parameter **T**

### Generic type R

`R` = `unknown`

## Parameters

### store

`PatchAwareStore`&lt;`T`&gt;

### path

[`StorePath`](../type-aliases/StorePath.md)

### options?

[`UseStorePathOptions`](../interfaces/UseStorePathOptions.md)&lt;`R`&gt; = `{}`

## Returns

Type parameter **R**

## Example

```tsx
const store = createStore('app', {
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark' }
});

function UserName() {
  // Only re-renders when user.name changes
  const name = useStorePath(store, ['user', 'name']);
  return <span>{name}</span>;
}

function Theme() {
  // Only re-renders when settings.theme changes
  const theme = useStorePath(store, ['settings', 'theme']);
  return <span>{theme}</span>;
}
```
