# `InitialStores` 타입 별칭

## 1. 목적

`InitialStores` 타입 별칭은 `createStoreContext`로 스토어 컨텍스트를 생성할 때 스토어의 초기 상태와 구성을 정의하는 데 사용됩니다. 스토어를 정의하는 유연한 방법을 제공하여 전체 구성 객체 또는 초기값만 제공할 수 있도록 합니다.

## 2. 구조

`InitialStores`는 스토어 이름과 해당 값 타입을 레코드로 받는 맵드 타입입니다. 각 스토어에 대해 `StoreConfig` 객체 또는 초기값을 직접 제공할 수 있습니다.

```typescript
export type InitialStores<T extends Record<string, any>> = {
  [K in keyof T]: StoreConfig<T[K]> | T[K];
};
```

## 3. 사용 패턴

`createStoreContext` 함수에 `InitialStores` 객체를 전달합니다.

### 간단한 초기화

초기값만 제공하여 스토어를 정의할 수 있습니다.

```typescript
import { createStoreContext } from '@context-action/react';

const { Provider, useStore } = createStoreContext('myContext', {
  user: { name: 'Guest', age: 0 },
  theme: 'light',
  counter: 0,
});
```

### 고급 구성

더 많은 제어를 위해 모든 스토어에 `StoreConfig` 객체를 제공할 수 있습니다. 이를 통해 비교 전략을 설정하고 설명을 추가하는 등의 작업을 수행할 수 있습니다.

```typescript
import { createStoreContext } from '@context-action/react';

const { Provider, useStore } = createStoreContext('myContext', {
  user: {
    initialValue: { name: 'Guest', age: 0 },
    strategy: 'deep',
    description: '애플리케이션의 현재 사용자입니다.',
  },
  theme: 'light',
});
```

## 4. TypeDoc 링크

[declarative-store-pattern-v2.tsx의 InitialStores](../../../packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx)
