[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValues

# Function: useStoreValues()

> **useStoreValues**\<`T`, `S`\>(`store`, `selectors`): `undefined` \| \{ \[K in string \| number \| symbol\]: ReturnType\<S\[K\]\> \}

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:290](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/hooks/useStoreValue.ts#L290)

Hook to get multiple values from a store using selectors

## Type Parameters

### Generic type T

Type parameter **T**

Type of the store value

### Generic type S

`S` *extends* `Record`\<`string`, (`value`) => `any`\>

Type of the selectors object

## Parameters

### store

The store to subscribe to

`undefined` | `null` | [`Store`](../classes/Store.md)&lt;`T`&gt;

### selectors

Type parameter **S**

Object with selector functions

## Returns

`undefined` \| \{ \[K in string \| number \| symbol\]: ReturnType\<S\[K\]\> \}

Object with selected values

## Implements

selective-subscription

## Memberof

api-terms

Optimizes re-renders by only updating when selected values change

## Example

```typescript
const userStore = createStore({ 
  id: '1', 
  name: 'John', 
  email: 'john@example.com',
  settings: { theme: 'dark', notifications: true }
});

const { name, theme } = useStoreValues(userStore, {
  name: user => user.name,
  theme: user => user.settings.theme
});
// Only re-renders when name or theme changes
```
