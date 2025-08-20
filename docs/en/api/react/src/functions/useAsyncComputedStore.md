[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useAsyncComputedStore

# Function: useAsyncComputedStore()

> **useAsyncComputedStore**&lt;`R`&gt;(`dependencies`, `compute`, `config`): `object`

Defined in: [packages/react/src/stores/hooks/useComputedStore.ts:597](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/useComputedStore.ts#L597)

비동기 계산을 지원하는 Computed Store Hook

## Type Parameters

### Generic type R

Type parameter **R**

## Parameters

### dependencies

[`Store`](../classes/Store.md)&lt;`any`&gt;[]

### compute

(`values`) => `Promise`&lt;`R`&gt;

### config

`ComputedStoreConfig`&lt;`R`&gt; & `object` = `{}`

## Returns

`object`

### value

> **value**: `R`

### loading

> **loading**: `boolean`

### error

> **error**: `null` \| `Error`

### reload()

> **reload**: () => `void`

#### Returns

`void`

## Example

```typescript
const userIdStore = createStore('userId', '123');

const userProfile = useAsyncComputedStore(
  [userIdStore],
  async ([userId]) => {
    if (!userId) return null;
    
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  {
    initialValue: null,
    name: 'userProfile'
  }
);
```
