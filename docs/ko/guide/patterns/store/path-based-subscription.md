# 경로 기반 구독 (Path-Based Subscription)

JSON 패치를 분석하여 리렌더링 시점을 결정하는 최적화된 구독 패턴입니다. 컴포넌트 업데이트를 세밀하게 제어할 수 있습니다.

## 개요

기존 셀렉터는 모든 상태 변경 시 실행되어 결과를 비교합니다. 경로 기반 구독은 JSON 패치를 분석하여 구독 경로가 영향받았는지 확인하므로, 불필요한 셀렉터 실행을 피할 수 있습니다.

```
# 셀렉터 방식
상태 변경 → 셀렉터 실행 → 결과 비교 → (다르면) 리렌더

# 경로 기반 방식
상태 변경 → 패치 경로 확인 → (경로 영향 시) 값 조회 → 리렌더
```

## 핵심 API

### useStorePath

스토어의 특정 경로를 구독합니다. 해당 경로가 변경될 때만 리렌더링됩니다.

```tsx
import { useStorePath } from '@context-action/react';

function UserName() {
  // user.name이 변경될 때만 리렌더
  const name = useStorePath(store, ['user', 'name']);
  return <span>{name}</span>;
}

function UserAge() {
  // user.age가 변경될 때만 리렌더
  const age = useStorePath(store, ['user', 'age']);
  return <span>{age}</span>;
}
```

### useStoreSelectorWithPaths

셀렉터 변환과 경로 기반 최적화를 결합합니다.

```tsx
import { useStoreSelectorWithPaths } from '@context-action/react';

function FullName() {
  // firstName 또는 lastName이 변경될 때만 셀렉터 실행
  const fullName = useStoreSelectorWithPaths(
    store,
    (state) => `${state.user.firstName} ${state.user.lastName}`,
    { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
  );
  return <span>{fullName}</span>;
}
```

## 셀렉터와 비교

| 기능 | useStoreSelector | useStorePath | useStoreSelectorWithPaths |
|------|------------------|--------------|---------------------------|
| **셀렉터 실행** | 매 변경마다 | 경로 매칭 시만 | 경로 매칭 시만 |
| **비교 대상** | 셀렉터 결과 | 패치 경로 | 패치 경로 |
| **파생값 지원** | ✅ 가능 | ❌ 불가 | ✅ 가능 |
| **성능** | 셀렉터 비용 의존 | 빠름 (문자열 비교) | 두 장점 결합 |

## 언제 무엇을 사용할까

### useStorePath
변환 없이 직접 속성에 접근할 때:

```tsx
// 단순 경로 접근
const theme = useStorePath(settingsStore, ['theme']);
const count = useStorePath(counterStore, ['count']);

// 배열 접근
const firstItem = useStorePath(listStore, ['items', 0]);

// 중첩 접근
const city = useStorePath(userStore, ['address', 'city']);
```

### useStoreSelector
경로 힌트가 실용적이지 않은 복잡한 변환:

```tsx
// 복잡한 필터링/매핑
const activeUsers = useStoreSelector(store,
  (s) => s.users.filter(u => u.isActive)
);

// 집계
const totalPrice = useStoreSelector(store,
  (s) => s.items.reduce((sum, item) => sum + item.price, 0)
);
```

### useStoreSelectorWithPaths
의존성이 명확한 파생값:

```tsx
// 특정 의존성을 가진 파생값
const displayName = useStoreSelectorWithPaths(
  store,
  (s) => s.user.nickname || `${s.user.firstName} ${s.user.lastName}`,
  { dependsOn: [['user', 'nickname'], ['user', 'firstName'], ['user', 'lastName']] }
);

// 여러 경로에서 계산된 값
const cartSummary = useStoreSelectorWithPaths(
  store,
  (s) => ({
    count: s.cart.items.length,
    total: s.cart.total,
    hasDiscount: s.cart.discount > 0
  }),
  { dependsOn: [['cart', 'items'], ['cart', 'total'], ['cart', 'discount']] }
);
```

## 경로 매칭 동작 방식

패치가 구독 경로에 영향을 주는 경우:
1. **정확히 일치**: 패치 경로가 구독 경로와 동일
2. **부모 변경**: 패치 경로가 구독 경로의 접두사
3. **자식 변경**: 구독 경로가 패치 경로의 접두사

```tsx
const store = createStore('app', {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark' }
  }
});

// ['user', 'profile', 'name'] 구독 시
// ✅ 영향받음: ['user', 'profile', 'name'] 패치 (정확히 일치)
// ✅ 영향받음: ['user', 'profile'] 패치 (부모)
// ✅ 영향받음: ['user'] 패치 (조상)
// ❌ 영향없음: ['user', 'settings'] 패치 (형제)
// ❌ 영향없음: ['user', 'profile', 'age'] 패치 (형제)
```

## 커스텀 동등성 비교

두 훅 모두 커스텀 동등성 함수를 지원합니다:

```tsx
// 복잡한 객체에 대한 커스텀 동등성
const position = useStorePath(store, ['player', 'position'], {
  equalityFn: (a, b) => a?.x === b?.x && a?.y === b?.y
});

// 객체에 대한 얕은 비교
const config = useStoreSelectorWithPaths(
  store,
  (s) => s.config,
  {
    dependsOn: [['config']],
    equalityFn: shallowEqual
  }
);
```

## Store API: subscribeWithPatches

경로 기반 훅을 지원하는 기본 Store API:

```typescript
import { createStore, type PatchAwareListener } from '@context-action/react';

const store = createStore('app', { count: 0, user: { name: 'John' } });

// 패치 인식 구독
const unsubscribe = store.subscribeWithPatches((patches) => {
  console.log('패치:', patches);
  // [{ op: 'replace', path: ['count'], value: 1 }]
});

store.setValue({ ...store.getValue(), count: 1 });

// 마지막 패치 가져오기
const lastPatches = store.getLastPatches();
```

## 성능 이점

### 이전 (셀렉터만 사용)
```tsx
// 모든 상태 변경 시 셀렉터 실행
function ExpensiveComponent() {
  const result = useStoreSelector(store, (s) => {
    // 이 비용이 큰 계산이 어떤 상태 변경에도 실행됨
    return expensiveComputation(s.data);
  });
}
```

### 이후 (경로 기반)
```tsx
// 'data' 경로가 변경될 때만 셀렉터 실행
function OptimizedComponent() {
  const result = useStoreSelectorWithPaths(
    store,
    (s) => expensiveComputation(s.data),
    { dependsOn: [['data']] }
  );
}
```

## 모범 사례

### 권장
- 단순 속성 접근에는 `useStorePath` 사용
- 변환과 최적화가 모두 필요하면 `useStoreSelectorWithPaths` 사용
- 더 나은 필터링을 위해 정확한 `dependsOn` 경로 지정
- 특정 배열 요소 구독에는 배열 인덱스 사용

### 피해야 할 것
- 파생/계산 값이 필요할 때 `useStorePath` 사용
- 경로를 알 때 `dependsOn` 생략 (매 변경마다 실행됨)
- 경로 과다 지정 (여러 자식이 필요하면 부모 구독)

## 관련 패턴

- [useStoreValue 패턴](./useStoreValue-patterns.md) - 기본 구독 패턴
- [스토어 설정](./store-configuration.md) - 스토어 설정 옵션
- [기본 사용법](./basic-usage.md) - 스토어 기본 사용법
