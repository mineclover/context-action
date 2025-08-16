[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreSelector

# Function: useStoreSelector()

> **useStoreSelector**\<`T`, `R`\>(`store`, `selector`, `equalityFn`): `R`

Defined in: [packages/react/src/stores/hooks/useStoreSelector.ts:128](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/hooks/useStoreSelector.ts#L128)

Store에서 특정 값을 선택하여 구독하는 Hook

selector가 반환하는 값이 변경될 때만 컴포넌트가 리렌더링됩니다.

## Type Parameters

### Generic type T

Type parameter **T**

Store의 값 타입

### Generic type R

Type parameter **R**

Selector가 반환하는 값 타입

## Parameters

### store

[`Store`](../classes/Store.md)&lt;`T`&gt;

구독할 Store 인스턴스

### selector

(`value`) => `R`

Store 값에서 필요한 부분을 추출하는 함수

### equalityFn

(`a`, `b`) => `boolean`

이전 값과 새 값을 비교하는 함수 (기본값: Object.is)

## Returns

Type parameter **R**

selector가 반환하는 값

## Example

```typescript
interface User {
  id: string;
  profile: { name: string; email: string; avatar?: string };
  preferences: { theme: 'light' | 'dark'; language: string };
  metadata: { lastLogin: Date; createdAt: Date };
}

const userStore = createStore<User>('user', initialUser);

// 기본 사용법 - profile.name만 구독
const userName = useStoreSelector(
  userStore, 
  user => user.profile.name
);

// 얕은 비교로 객체 구독
const userProfile = useStoreSelector(
  userStore, 
  user => user.profile,
  shallowEqual
);

// 복잡한 계산된 값
const userDisplayInfo = useStoreSelector(
  userStore,
  user => ({
    displayName: user.profile.name || 'Anonymous',
    isNewUser: Date.now() - user.metadata.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000,
    avatarUrl: user.profile.avatar || '/default-avatar.png'
  }),
  shallowEqual
);

// 성능 최적화: 특정 조건에서만 계산
const expensiveComputation = useStoreSelector(
  userStore,
  user => {
    if (!user.profile.name) return null;
    
    // 복잡한 계산...
    return processUserData(user);
  }
);
```
