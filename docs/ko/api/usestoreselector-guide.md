# `useStoreSelector` 훅

## 1. 목적

`useStoreSelector` 훅을 사용하면 스토어 데이터의 특정 부분만 구독할 수 있습니다. 이 훅은 스토어 값에서 원하는 데이터를 추출하는 `selector` 함수를 인자로 받으며, 선택된 값이 변경될 경우에만 컴포넌트를 다시 렌더링합니다. 이는 스토어 데이터의 다른 부분이 변경될 때 불필요한 리렌더링을 방지하므로 성능 최적화를 위한 강력한 도구입니다.

## 2. 시그니처

```typescript
export function useStoreSelector<T, R>(
  store: Store<T>,
  selector: (value: T) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R;
```

-   `store`: 구독할 스토어 인스턴스입니다.
-   `selector`: 스토어의 값을 인자로 받아 구독하려는 특정 데이터를 반환하는 함수입니다.
-   `equalityFn` (선택 사항): 이전 선택 값과 새 선택 값을 비교하는 함수입니다. 기본적으로 스마트한 동등성 검사를 수행합니다.

## 3. 사용 패턴

`useStoreSelector`를 사용하여 스토어 상태의 일부를 구독합니다.

### 단일 필드 구독하기

```typescript
import { useStoreSelector } from '@context-action/react';
import { userStore } from './stores';

const UserName = () => {
  const userName = useStoreSelector(userStore, (user) => user.name);

  return <div>{userName}</div>;
};
```
이 예제에서 `UserName` 컴포넌트는 `userStore`의 `name` 속성이 변경될 때만 다시 렌더링됩니다.

### 사용자 정의 동등성 함수 사용하기

사용자 정의 동등성 함수를 제공하여 컴포넌트가 언제 다시 렌더링될지 제어할 수 있습니다.

```typescript
import { useStoreSelector, shallowEqual } from '@context-action/react';
import { userStore } from './stores';

const UserProfile = () => {
  const user = useStoreSelector(
    userStore,
    (user) => ({ name: user.name, age: user.age }),
    shallowEqual // 얕은 동등성 검사 사용
  );

  return (
    <div>
      <p>이름: {user.name}</p>
      <p>나이: {user.age}</p>
    </div>
  );
};
```

## 4. TypeDoc 링크

[useStoreSelector.ts의 useStoreSelector](../../../packages/react/src/stores/hooks/useStoreSelector.ts)
