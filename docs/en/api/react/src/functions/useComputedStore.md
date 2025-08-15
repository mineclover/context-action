[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useComputedStore

# Function: useComputedStore()

> **useComputedStore**\<`T`, `R`\>(`store`, `compute`, `config`): `R`

Defined in: [packages/react/src/stores/hooks/useComputedStore.ts:87](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/hooks/useComputedStore.ts#L87)

단일 Store 기반 Computed Hook

## Type Parameters

### Generic type T

Type parameter **T**

원본 Store의 값 타입

### Generic type R

Type parameter **R**

계산된 값의 타입

## Parameters

### store

[`Store`](../classes/Store.md)&lt;`T`&gt;

원본 Store

### compute

(`value`) => `R`

계산 함수

### config

`ComputedStoreConfig`&lt;`R`&gt; = `{}`

설정 옵션

## Returns

Type parameter **R**

계산된 값

## Example

```typescript
const userStore = createStore('user', { 
  firstName: 'John', 
  lastName: 'Doe', 
  age: 30 
});

// 단순 계산
const fullName = useComputedStore(
  userStore,
  user => `${user.firstName} ${user.lastName}`
);

// 복잡한 계산과 설정
const userSummary = useComputedStore(
  userStore,
  user => ({
    displayName: user.firstName,
    initials: `${user.firstName[0]}${user.lastName[0]}`,
    isAdult: user.age >= 18,
    category: user.age < 18 ? 'minor' : user.age < 65 ? 'adult' : 'senior'
  }),
  {
    equalityFn: shallowEqual,
    debug: true,
    name: 'userSummary'
  }
);
```
