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

## 경로 포맷 레퍼런스

### 경로 타입 정의

```typescript
type StorePath = (string | number)[];
```

- **string**: 객체 속성 키
- **number**: 배열 인덱스

### 경로 예시

| 상태 접근 | 경로 |
|----------|------|
| `state.user` | `['user']` |
| `state.user.name` | `['user', 'name']` |
| `state.user.profile.address.city` | `['user', 'profile', 'address', 'city']` |
| `state.items[0]` | `['items', 0]` |
| `state.items[1].name` | `['items', 1, 'name']` |
| `state.matrix[0][1]` | `['matrix', 0, 1]` |

### 경로 문자열 정규화 (JSON Pointer RFC 6901)

내부적으로 경로는 효율적인 접두사 매칭을 위해 JSON Pointer 문자열 (RFC 6901)로 변환됩니다:

```typescript
['user', 'name']           → '/user/name'
['items', 0]               → '/items/0'
['items', 1, 'name']       → '/items/1/name'
['matrix', 0, 1]           → '/matrix/0/1'
[]                         → '' (빈 문자열 = 루트/전체 문서)
['']                       → '/' (빈 문자열 키)
```

**특수 문자 이스케이프 (RFC 6901 섹션 3):**

`~`나 `/`를 포함한 키는 이스케이프됩니다. 순서가 중요합니다 - `~`를 먼저 이스케이프:
- `~` → `~0`
- `/` → `~1`

```typescript
['data', 'a/b']            → '/data/a~1b'
['config', 'key~value']    → '/config/key~0value'
['path/key', 'nested~val'] → '/path~1key/nested~0val'

// 엣지 케이스: 키에 '~1'이 리터럴로 포함된 경우
['data', '~1']             → '/data/~01' (~ → ~0 이스케이프, 1은 유지)
```

**RFC 6901 섹션 5 예시:**

```typescript
// 주어진 데이터: { "m~n": 8, "a/b": 1, "": 0 }
pathToPointer(['m~n'])     → '/m~0n'    // 8로 평가
pathToPointer(['a/b'])     → '/a~1b'    // 1로 평가
pathToPointer([''])        → '/'        // 0으로 평가
```

**경로 경계 매칭:**

매칭 알고리즘은 경로 경계를 정확히 처리합니다:
```typescript
// '/user'는 '/users'나 '/userName'과 매칭되지 않음
// 매칭되는 것: '/user', '/user/name', '/user/profile/...'

isPointerPrefix('/user', '/user/name')  // true (유효한 부모)
isPointerPrefix('/user', '/users')       // false (다른 경로)
isPointerPrefix('/user', '/userName')    // false (다른 경로)
```

**유틸리티 함수 (export됨):**

```typescript
import {
  pathToPointer,
  pointerToPath,
  isPointerPrefix,
  escapeSegment,
  unescapeSegment
} from '@context-action/react';

// 경로 배열을 JSON Pointer 문자열로 변환
pathToPointer(['user', 'name'])  // → '/user/name'

// JSON Pointer를 경로 배열로 파싱
pointerToPath('/user/name')      // → ['user', 'name']

// 접두사 관계 확인
isPointerPrefix('/user', '/user/name')  // → true
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

### 매칭 알고리즘

```
패치: /user/name
├─ 구독 /user/name         → 일치 (정확) ✓
├─ 구독 /user              → 일치 (자식 변경) ✓
├─ 구독 /user/name/first   → 일치 (부모 변경) ✓
└─ 구독 /settings          → 불일치 ✗
```

## 배열 연산과 패치

배열 변경이 어떤 패치를 생성하는지 이해하면 효과적인 경로 구독이 가능합니다.

### 배열 변경 패치 패턴

| 연산 | 생성되는 패치 | 예시 |
|------|--------------|------|
| `arr[i] = value` | 인덱스에 `replace` | `{ path: ['items', 1], op: 'replace' }` |
| `arr[i].prop = value` | 중첩 경로에 `replace` | `{ path: ['items', 1, 'name'], op: 'replace' }` |
| `arr.push(value)` | 새 인덱스에 `add` | `{ path: ['items', 3], op: 'add' }` |
| `arr.unshift(value)` | 여러 `replace` + `add` | 모든 인덱스 이동 |
| `arr.splice(i, n)` | 여러 `replace` + `length` | i 이후 인덱스 영향 |

### 상세 패치 예시

```typescript
// 1. 직접 인덱스 수정
store.update(draft => { draft.items[1].name = 'updated'; });
// 패치: [{ op: 'replace', path: ['items', 1, 'name'], value: 'updated' }]

// 2. 배열 push
store.update(draft => { draft.list.push(4); });
// 패치: [{ op: 'add', path: ['list', 3], value: 4 }]

// 3. 배열 unshift (시작에 삽입)
store.update(draft => { draft.list.unshift(0); });
// 패치:
//   [{ op: 'replace', path: ['list', 0], value: 0 },
//    { op: 'replace', path: ['list', 1], value: <old[0]> },
//    { op: 'add', path: ['list', 2], value: <old[1]> }]

// 4. 배열 splice (중간 요소 삭제)
store.update(draft => { draft.list.splice(1, 2); });
// 패치:
//   [{ op: 'replace', path: ['list', 1], value: <old[3]> },
//    { op: 'replace', path: ['list', 'length'], value: 2 }]

// 5. 중첩 배열
store.update(draft => { draft.matrix[0][1] = 99; });
// 패치: [{ op: 'replace', path: ['matrix', 0, 1], value: 99 }]
```

### 배열 구독 전략

#### 전략 1: 특정 인덱스 구독
```tsx
// items[0]이 변경될 때만 리렌더
const firstItem = useStorePath(store, ['items', 0]);

// ⚠️ 주의: unshift 후 인덱스 0의 새 아이템은 감지 못함
// 배열 순서가 안정적일 때 사용
```

#### 전략 2: 전체 배열 구독
```tsx
// 모든 items 변경에 리렌더 (동적 배열에 권장)
const items = useStorePath(store, ['items']);

// ✅ 감지: push, pop, splice, unshift, 인덱스 수정
```

#### 전략 3: 배열 길이 + 특정 아이템
```tsx
// 구조 변경 감지를 위한 길이 구독
const itemCount = useStorePath(store, ['items', 'length']);
const firstItem = useStorePath(store, ['items', 0]);

// 구조 인식과 아이템 접근 모두 필요할 때 유용
```

### 중첩 배열 (Matrix)

```tsx
const store = createStore('game', {
  board: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ]
});

// 특정 셀 구독
const centerCell = useStorePath(store, ['board', 1, 1]); // 값: 5

// 전체 행 구독
const middleRow = useStorePath(store, ['board', 1]); // 값: [4, 5, 6]

// 전체 보드 구독
const board = useStorePath(store, ['board']);
```

### 복잡한 중첩 구조

```tsx
const store = createStore('app', {
  users: [
    { id: 1, profile: { name: 'John', tags: ['admin', 'active'] } },
    { id: 2, profile: { name: 'Jane', tags: ['user'] } }
  ]
});

// 깊은 경로: users[0].profile.tags[1]
const firstUserSecondTag = useStorePath(store, ['users', 0, 'profile', 'tags', 1]);

// 배열 내 객체
const firstUserProfile = useStorePath(store, ['users', 0, 'profile']);

// 계산값을 위한 경로 힌트가 있는 셀렉터
const allTags = useStoreSelectorWithPaths(
  store,
  (s) => s.users.flatMap(u => u.profile.tags),
  { dependsOn: [['users']] }  // 전체 users 배열 구독
);
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

스토어가 한 애니메이션 프레임 안에서 여러 업데이트를 배치하면 콜백에는
해당 프레임의 모든 전환 패치가 연결되어 전달됩니다. 따라서 경로 기반
구독자가 앞선 업데이트를 놓치지 않으며, 알림이 반영된 후
`getLastPatches()`도 동일한 누적 패치를 반환합니다.

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
