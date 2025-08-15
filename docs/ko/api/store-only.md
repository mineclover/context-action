# Store Only 메서드

`createDeclarativeStorePattern`에서 제공하는 Store Only 패턴 메서드의 완전한 API 레퍼런스입니다.

## 개요

Store Only 패턴은 액션 디스패치 없이 타입 안전한 상태 관리를 제공합니다. 이 패턴은 데이터 레이어, 단순한 상태 관리, 그리고 복잡한 비즈니스 로직 없이 반응형 상태가 필요한 시나리오에 이상적입니다.

## 핵심 메서드

### `createDeclarativeStorePattern<T>(contextName, storeConfig)`

타입 안전한 상태 관리로 선언형 스토어 패턴을 생성합니다.

**매개변수:**
- `contextName`: 스토어 컨텍스트의 고유 식별자
- `storeConfig`: 스토어와 초기값을 정의하는 설정 객체

**반환값:**
```typescript
{
  Provider: React.ComponentType,
  useStore: (storeName: keyof T) => Store<T[storeName]>,
  useStoreManager: () => StoreManager<T>,
  withProvider: (Component: React.ComponentType) => React.ComponentType
}
```

**예제:**
```typescript
const { Provider, useStore, useStoreManager, withProvider } = 
  createDeclarativeStorePattern('App', {
    user: { id: '', name: '', email: '' },
    settings: { theme: 'light', language: 'ko' }
  });
```

## 스토어 인스턴스 메서드

### `store.getValue()`

스토어의 현재 값을 동기적으로 반환합니다.

**반환값:** 현재 스토어 값
**사용 사례:** 액션 핸들러나 이펙트에서 현재 상태 읽기

```typescript
const userStore = useStore('user');
const currentUser = userStore.getValue();
console.log('현재 사용자:', currentUser);
```

### `store.setValue(newValue)`

현재 상태를 교체하여 전체 스토어 값을 설정합니다.

**매개변수:**
- `newValue`: 스토어의 완전히 새로운 값

**반환값:** `void`

```typescript
const userStore = useStore('user');
userStore.setValue({
  id: '123',
  name: '홍길동',
  email: 'hong@example.com'
});
```

### `store.update(updater)`

현재 값을 받는 업데이터 함수를 사용하여 스토어를 업데이트합니다.

**매개변수:**
- `updater`: 현재 값을 받아 새 값을 반환하는 함수

**반환값:** `void`

```typescript
const userStore = useStore('user');
userStore.update(current => ({
  ...current,
  name: '업데이트된 이름'
}));
```

### `store.subscribe(callback)`

콜백 함수로 스토어 변경사항을 구독합니다.

**매개변수:**
- `callback`: 스토어 값이 변경될 때 호출되는 함수

**반환값:** 구독 해제 함수

```typescript
const userStore = useStore('user');
const unsubscribe = userStore.subscribe((newValue, previousValue) => {
  console.log('사용자 변경:', { newValue, previousValue });
});

// 정리
useEffect(() => unsubscribe, []);
```

### `store.reset()`

스토어를 초기값으로 재설정합니다.

**반환값:** `void`

```typescript
const userStore = useStore('user');
userStore.reset(); // 초기 상태로 돌아감
```

## 스토어 설정 옵션

### 기본 설정

간단한 값 초기화:

```typescript
const config = {
  user: { id: '', name: '', email: '' },
  settings: { theme: 'light', language: 'ko' }
};
```

### 고급 설정

검증기와 커스텀 초기값:

```typescript
const config = {
  user: {
    initialValue: { id: '', name: '', email: '' },
    validator: (value) => typeof value === 'object' && 'id' in value
  },
  settings: {
    initialValue: { theme: 'light', language: 'ko' },
    validator: (value) => 
      typeof value === 'object' && 
      'theme' in value && 
      ['light', 'dark'].includes(value.theme)
  }
};
```

## React 통합 훅

### `useStoreValue(store)`

컴포넌트에서 반응형 스토어 구독을 위한 훅입니다.

**매개변수:**
- `store`: `useStore()`에서 가져온 스토어 인스턴스

**반환값:** 현재 스토어 값 (반응형)

```typescript
function UserComponent() {
  const userStore = useStore('user');
  const user = useStoreValue(userStore); // 반응형 구독
  
  return <div>환영합니다 {user.name}님</div>;
}
```

### `useStore(storeName)`

이름으로 스토어 인스턴스를 가져오는 훅입니다.

**매개변수:**
- `storeName`: 설정에서 스토어의 키

**반환값:** 메서드가 있는 스토어 인스턴스

```typescript
function UserComponent() {
  const userStore = useStore('user');
  const settingsStore = useStore('settings');
  
  // 스토어 메서드 사용
  const handleUpdate = () => {
    userStore.update(current => ({ ...current, name: '새 이름' }));
  };
  
  return <button onClick={handleUpdate}>사용자 업데이트</button>;
}
```

### `useStoreManager()`

고급 작업을 위한 스토어 매니저를 가져오는 훅입니다.

**반환값:** StoreManager 인스턴스

```typescript
function AdminPanel() {
  const storeManager = useStoreManager();
  
  const resetAllStores = () => {
    storeManager.resetAll();
  };
  
  const exportState = () => {
    const state = storeManager.exportState();
    console.log('현재 상태:', state);
  };
  
  return (
    <div>
      <button onClick={resetAllStores}>모두 재설정</button>
      <button onClick={exportState}>상태 내보내기</button>
    </div>
  );
}
```

## 스토어 설정 패턴

### 단순 값 패턴

단순한 타입을 위한 직접 값 할당:

```typescript
const simpleConfig = {
  counter: 0,
  username: '',
  isLoggedIn: false,
  theme: 'light'
};
```

### 객체 패턴

초기 상태가 있는 복잡한 객체:

```typescript
const objectConfig = {
  user: {
    id: '',
    profile: {
      name: '',
      email: '',
      avatar: null as string | null
    },
    preferences: {
      notifications: true,
      theme: 'light'
    }
  }
};
```

### 검증 패턴

검증 함수가 있는 스토어:

```typescript
const validatedConfig = {
  settings: {
    initialValue: { theme: 'light', fontSize: 14 },
    validator: (value) => {
      return typeof value === 'object' &&
        'theme' in value &&
        'fontSize' in value &&
        ['light', 'dark'].includes(value.theme) &&
        typeof value.fontSize === 'number' &&
        value.fontSize >= 10 && value.fontSize <= 24;
    }
  }
};
```

## 고급 스토어 작업

### 조건부 업데이트

```typescript
function ConditionalUpdater() {
  const userStore = useStore('user');
  
  const updateIfLoggedIn = () => {
    const current = userStore.getValue();
    if (current.isAuthenticated) {
      userStore.update(user => ({
        ...user,
        lastActivity: Date.now()
      }));
    }
  };
  
  return <button onClick={updateIfLoggedIn}>활동 업데이트</button>;
}
```

### 계산된 값

```typescript
function ComputedValues() {
  const userStore = useStore('user');
  const settingsStore = useStore('settings');
  
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  // 여러 스토어 기반 계산된 값
  const displayName = user.name || user.email?.split('@')[0] || '익명';
  const isDarkTheme = settings.theme === 'dark';
  
  return (
    <div className={isDarkTheme ? 'dark' : 'light'}>
      환영합니다 {displayName}님
    </div>
  );
}
```

### 스토어 동기화

```typescript
function StoreSynchronizer() {
  const userStore = useStore('user');
  const cacheStore = useStore('cache');
  
  // 사용자 변경사항을 캐시에 동기화
  useEffect(() => {
    return userStore.subscribe((newUser) => {
      cacheStore.update(cache => ({
        ...cache,
        lastUser: newUser,
        lastUpdated: Date.now()
      }));
    });
  }, [userStore, cacheStore]);
  
  return null;
}
```

## 성능 최적화

### 선택적 구독

```typescript
function OptimizedComponent() {
  const userStore = useStore('user');
  
  // 특정 변경사항만 구독
  const userName = useStoreValue(userStore, user => user.name);
  const userEmail = useStoreValue(userStore, user => user.email);
  
  // 이름 또는 이메일이 변경될 때만 컴포넌트 재렌더링
  return <div>{userName} ({userEmail})</div>;
}
```

### 배치 업데이트

```typescript
function BatchedUpdates() {
  const userStore = useStore('user');
  
  const updateUserProfile = () => {
    // 모든 변경사항을 하나의 업데이트로
    userStore.update(current => ({
      ...current,
      name: '새 이름',
      email: 'new@email.com',
      lastUpdated: Date.now()
    }));
  };
  
  return <button onClick={updateUserProfile}>프로필 업데이트</button>;
}
```

## 에러 처리

### 검증 에러

```typescript
function ValidatedStore() {
  const settingsStore = useStore('settings');
  
  const updateTheme = (theme: string) => {
    try {
      settingsStore.update(current => ({
        ...current,
        theme: theme as 'light' | 'dark'
      }));
    } catch (error) {
      console.error('테마 업데이트 실패:', error);
      // 검증 에러 처리
    }
  };
  
  return <button onClick={() => updateTheme('dark')}>다크 테마</button>;
}
```

## 관련 자료

- **[스토어 매니저 API](./store-manager.md)** - 스토어 매니저 메서드 및 작업
- **[선언형 스토어 패턴](./declarative-store-pattern.md)** - 패턴 구현 세부사항
- **[Store Only 예제](../examples/store-only.md)** - 완전한 사용 예제