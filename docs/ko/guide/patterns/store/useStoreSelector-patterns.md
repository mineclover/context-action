# useStoreSelector 패턴

선택적 구독과 성능 최적화를 위한 `useStoreSelector`를 사용한 고급 스토어 선택 패턴.

## 사전 요구사항

이 가이드는 설정 사양을 기반으로 구축됩니다. 다음이 있는지 확인하세요:
- [스토어 설정 패턴](../setup/store-setup.md)에 대한 기본 이해
- `UserStores`와 `ProductStores` 명명 패턴에 대한 익숙함
- [스토어 프로바이더 설정](../setup/provider-setup.md)에 대한 지식

## 핵심 기능

`useStoreSelector` 훅은 다음을 제공합니다:
- **선택적 구독**: 스토어 데이터의 특정 부분만 구독
- **자동 셀렉터 안정화**: 내부 `useRef`가 셀렉터가 메모이제이션 없이 작동하도록 보장
- **성능 최적화**: 지능적인 등가성 확인을 통해 불필요한 재렌더링 방지
- **타입 안전성**: 제네릭 타입 매개변수로 완전한 TypeScript 지원

## 내부 셀렉터 안정화

**핵심 기능**: `useStoreSelector`는 내부적으로 `useRef`를 사용하여 셀렉터 함수를 안정화하므로 **성능 문제 없이 인라인 셀렉터를 전달할 수 있습니다**:

```tsx
import { useStoreSelector, useMultiStoreSelector } from '@context-action/react';

// 설정 기반 UserStores 패턴 사용
const { useUserStore } = UserStores();
const { useProductStore } = ProductStores();

function UserProfile() {
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');
  const productStore = useProductStore('cart');

  // ✅ 이것은 useCallback 없이도 효율적으로 작동합니다!
  const userName = useStoreSelector(userStore, user => user.name);

  // ✅ 인라인 셀렉터는 자동으로 안정화됩니다
  const userDisplay = useStoreSelector(userStore, user => 
    `${user.firstName} ${user.lastName} (${user.role})`
  );

  // ✅ 다중 스토어 셀렉터도 메모이제이션 없이 작동합니다
  const dashboardData = useMultiStoreSelector(
    [userStore, settingsStore, productStore],
    ([user, settings, cart]) => ({
      user: { name: user.name, role: user.role },
      theme: settings.theme,
      cartItems: cart.items.length
    })
  );

  return <div>{userDisplay} - 카트: {dashboardData.cartItems}</div>;
}
```

**내부 작동 방식**:
- 셀렉터 함수는 안정된 참조를 유지하기 위해 `useRef`에 저장됩니다
- 매 렌더링마다 새로운 인라인 함수를 전달해도 효율적으로 작동합니다
- 개발 모드에서는 도움이 되는 경고를 표시하지만 기능을 깨뜨리지 않습니다
- 더 최적화하려는 경우가 아니라면 `useCallback`이 필요하지 않습니다

## 기본 단일 스토어 선택

설정 기반 UserStores 패턴 사용:

```tsx
function UserProfile() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');

  // 특정 필드 선택
  const userName = useStoreSelector(userStore, user => user.name);

  // 계산된 값 선택
  const userDisplayName = useStoreSelector(
    userStore, 
    user => `${user.firstName} ${user.lastName}`
  );

  // 중첩 속성 선택
  const userTheme = useStoreSelector(
    settingsStore, 
    settings => settings.preferences.theme
  );

  return (
    <div>
      <h2>{userDisplayName}</h2>
      <p>테마: {userTheme}</p>
    </div>
  );
}
```

## useMultiStoreSelector를 사용한 다중 스토어 선택

UserStores와 ProductStores 패턴 결합:

```tsx
function Dashboard() {
  const { useUserStore } = UserStores();
  const { useProductStore } = ProductStores();
  
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');
  const notificationStore = useUserStore('notifications');
  const cartStore = useProductStore('cart');

  // 여러 스토어의 데이터 결합
  const dashboardData = useMultiStoreSelector(
    [userStore, settingsStore, notificationStore],
    ([user, settings, notifications]) => ({
      userName: user.name,
      theme: settings.theme,
      unreadCount: notifications.filter(n => !n.read).length
    })
  );

  // 사용자 컨텍스트가 있는 카트
  const cartSummary = useMultiStoreSelector(
    [cartStore, userStore],
    ([cart, user]) => ({
      itemCount: cart.items.length,
      total: cart.total,
      isPremium: user.membership === 'premium'
    })
  );

  return (
    <div>
      <h1>{dashboardData.userName}님, 환영합니다</h1>
      <p>테마: {dashboardData.theme}</p>
      <p>알림: {dashboardData.unreadCount}</p>
      <p>카트: {cartSummary.itemCount}개 항목 (${cartSummary.total})</p>
      {cartSummary.isPremium && <span>프리미엄 회원</span>}
    </div>
  );
}
```

## 고급 선택 패턴

### useStorePathSelector를 사용한 경로 기반 선택

설정 기반 스토어 접근 사용:

```tsx
function UserSettings() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');

  // 경로로 중첩 속성 접근
  const userTheme = useStorePathSelector(userStore, ['profile', 'preferences', 'theme']);
  const emailEnabled = useStorePathSelector(settingsStore, ['notifications', 'email']);

  return (
    <div>
      <p>현재 테마: {userTheme}</p>
      <p>이메일 알림: {emailEnabled ? '켜짐' : '꺼짐'}</p>
    </div>
  );
}
```

### 조건부 스토어 선택

설정 기반 조건부 접근 사용:

```tsx
function ConditionalUserData({ shouldLoad }) {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');

  // 조건부 구독
  const userData = useStoreSelector(
    shouldLoad ? userStore : null,
    user => user?.name || '로드되지 않음'
  );

  return <div>{userData}</div>;
}
```

## 성능 최적화

### 등가성 함수

```tsx
import { shallowEqual, deepEqual } from '@context-action/react';

function PerformanceOptimizedUser() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');

  // 참조 등가성 (기본) - 가장 빠름
  const userName = useStoreSelector(userStore, user => user.name);

  // 객체의 얕은 등가성
  const userInfo = useStoreSelector(
    userStore,
    user => ({ name: user.name, email: user.email }),
    shallowEqual
  );

  // 깊은 등가성 (드물게 사용)
  const nestedData = useStoreSelector(userStore, user => user.profile, deepEqual);

  return (
    <div>
      <h2>{userName}</h2>
      <p>이메일: {userInfo.email}</p>
      <div>프로필: {JSON.stringify(nestedData)}</div>
    </div>
  );
}
```

### 외부 셀렉터 (최고 성능)

```tsx
// 컴포넌트 외부에서 셀렉터 정의
const userNameSelector = (user) => user.name;
const userStatsSelector = (user) => ({ posts: user.posts.length, followers: user.followers.length });
const dashboardSelector = ([user, notifications]) => ({
  name: user.name,
  unreadCount: notifications.filter(n => !n.read).length
});

function UserDashboard() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  const notificationStore = useUserStore('notifications');
  
  const userName = useStoreSelector(userStore, userNameSelector);
  const userStats = useStoreSelector(userStore, userStatsSelector);
  const dashboard = useMultiStoreSelector([userStore, notificationStore], dashboardSelector);
  
  return (
    <div>
      <h2>{userName}</h2>
      <p>게시물: {userStats.posts}, 팔로워: {userStats.followers}</p>
      <p>{dashboard.unreadCount}개의 읽지 않은 알림</p>
    </div>
  );
}
```

### useCallback을 사용한 동적 셀렉터

```tsx
function UserProfile({ userId }) {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  // props에 의존하는 셀렉터에 useCallback 사용
  const userSelector = useCallback(
    user => user.id === userId ? user : null,
    [userId]
  );
  
  const userData = useStoreSelector(userStore, userSelector);
  return userData ? <div>{userData.name}</div> : null;
}
```

## 빠른 참조

```tsx
function QuickReferenceExample() {
  const { useUserStore } = UserStores();
  const { useProductStore } = ProductStores();
  
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');
  const cartStore = useProductStore('cart');

  // 단일 스토어 선택
  const userName = useStoreSelector(userStore, user => user.name);

  // 다중 스토어 선택
  const summary = useMultiStoreSelector(
    [userStore, cartStore], 
    ([user, cart]) => ({ name: user.name, items: cart.items.length })
  );

  // 경로 선택
  const theme = useStorePathSelector(settingsStore, ['preferences', 'theme']);

  // 외부 셀렉터 (최고 성능)
  const nameSelector = (user) => user.name;
  const displayName = useStoreSelector(userStore, nameSelector);

  // 등가성 제어
  const userInfo = useStoreSelector(
    userStore,
    user => ({ name: user.name, email: user.email }),
    shallowEqual
  );

  return (
    <div>
      <p>사용자: {userName}</p>
      <p>카트: {summary.items}개 항목</p>
      <p>테마: {theme}</p>
    </div>
  );
}
```

## 모범 사례

### 1. 셀렉터를 순수하게 유지

```tsx
function PureSelectorExample() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');

  // ✅ 좋음: 순수 셀렉터
  const userData = useStoreSelector(
    userStore,
    user => ({ name: user.name, email: user.email })
  );

  // ❌ 피해야 함: 셀렉터에서 부작용
  const badUserData = useStoreSelector(userStore, user => {
    console.log('사용자 접근됨'); // 부작용
    return { name: user.name };
  });

  return <div>{userData.name}</div>;
}
```

### 2. 선택된 데이터 최소화

```tsx
function MinimalSelectionExample() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');

  // ✅ 좋음: 필요한 것만 선택
  const userName = useStoreSelector(userStore, user => user.name);

  // ❌ 피해야 함: 불필요하게 전체 객체 선택
  const user = useStoreSelector(userStore, user => user); // 전체 user 객체 반환

  return <div>{userName}</div>;
}
```

### 3. 올바른 패턴 선택

```tsx
function PatternSelectionExample() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  const settingsStore = useUserStore('settings');

  // 단일 스토어, 간단한 셀렉터
  const userName = useStoreSelector(userStore, user => user.name);

  // 여러 스토어, 결합된 데이터
  const dashboard = useMultiStoreSelector(
    [userStore, settingsStore], 
    ([user, settings]) => ({ user: user.name, theme: settings.theme })
  );

  // 깊게 중첩된 접근
  const userTheme = useStorePathSelector(settingsStore, ['preferences', 'theme']);

  return <div>{userName} - {dashboard.theme}</div>;
}
```

### 4. 가능할 때 외부 셀렉터 선호

```tsx
// ✅ 최고: 외부 셀렉터 (권장)
const userNameSelector = (user) => user.name;
const userEmailSelector = (user) => user.email;

function UserComponent() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  const userName = useStoreSelector(userStore, userNameSelector);
  const userEmail = useStoreSelector(userStore, userEmailSelector);
  
  return <div>{userName} ({userEmail})</div>;
}

// ✅ 좋음: 인라인 셀렉터 (내부 안정화로 작동)
function UserComponentInline() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  const userName = useStoreSelector(userStore, user => user.name);
  const userEmail = useStoreSelector(userStore, user => user.email);
  
  return <div>{userName} ({userEmail})</div>;
}

// ✅ props에 의존하는 셀렉터에는 인라인 사용
function UserProfile({ showEmail }) {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  const displayInfo = useStoreSelector(userStore, user => ({
    name: user.name,
    email: showEmail ? user.email : null
  }));
  
  return <div>{displayInfo.name}</div>;
}
```

### 5. 셀렉터 조직

```tsx
// selectors/userSelectors.ts
export const userSelectors = {
  name: (user) => user.name,
  email: (user) => user.email,
  isAdmin: (user) => user.role === 'admin'
};

// 설정 패턴과 함께 컴포넌트에서 사용
function UserProfile() {
  const { useUserStore } = UserStores();
  const userStore = useUserStore('user');
  
  const userName = useStoreSelector(userStore, userSelectors.name);
  const isAdmin = useStoreSelector(userStore, userSelectors.isAdmin);
  
  return <div>{userName} {isAdmin && '(관리자)'}</div>;
}
```

## 관련 패턴

- [useStoreValue 패턴](./useStoreValue-patterns.md) - 기본 스토어 구독 패턴
- [useComputedStore 패턴](./useComputedStore-patterns.md) - 계산된 값 패턴
- [성능 패턴](./performance-patterns.md) - 성능 최적화 기법