# 스토어 패턴 API

스토어 패턴은 `createDeclarativeStorePattern` 함수를 통해 타입 안전한 상태 관리를 제공하며, 뛰어난 타입 추론과 반응형 상태 관리에 중점을 둔 단순화된 API를 제공합니다.

## 임포트

```typescript
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';
```

## createDeclarativeStorePattern

### `createDeclarativeStorePattern<T>(name, config)`

Provider, 훅, 스토어 관리 기능을 갖춘 완전한 스토어 패턴을 생성합니다.

**타입 매개변수:**
- `T` - 스토어 정의가 있는 스토어 설정 객체

**매개변수:**
- `name: string` - 디버깅 및 식별을 위한 패턴 이름
- `config: T` - 스토어 설정 객체

**반환값:** `StorePatternResult<T>`

```typescript
interface StorePatternResult<T> {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  useStore: <K extends keyof T>(key: K) => Store<InferStoreValue<T[K]>>;
  useStoreManager: () => StoreManager<T>;
  withProvider: (Component: React.ComponentType) => React.ComponentType;
}
```

## 스토어 설정

### 직접 값 설정

```typescript
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', {
  // 직접 값 - 타입이 자동으로 추론됨
  profile: { name: '', email: '', avatar: '' },
  preferences: { theme: 'light', language: 'ko' },
  settings: { notifications: true, privacy: 'public' }
});
```

### 설정 객체 지원

```typescript
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  // initialValue를 가진 설정
  user: {
    initialValue: { id: '', name: '', email: '', isAuthenticated: false }
  },
  
  // 검증기를 가진 설정
  preferences: {
    initialValue: { theme: 'light', language: 'ko' },
    validator: (value) => 
      typeof value === 'object' && 
      'theme' in value && 
      'language' in value
  },
  
  // 파생 상태를 가진 설정
  analytics: {
    initialValue: { events: [], sessionId: '' },
    derived: {
      eventCount: (analytics) => analytics.events.length,
      hasEvents: (analytics) => analytics.events.length > 0
    }
  }
});
```

## Provider 컴포넌트

### `<Provider>`

스토어 인스턴스를 관리하고 자식 컴포넌트에 스토어 기능을 제공하는 컨텍스트 프로바이더입니다.

**Props:**
- `children: React.ReactNode` - 자식 컴포넌트

```typescript
function App() {
  return (
    <UserStoreProvider>
      <UserProfile />
      <UserSettings />
    </UserStoreProvider>
  );
}
```

### `withProvider(Component)`

컴포넌트를 스토어 프로바이더로 자동 래핑하는 고차 컴포넌트입니다.

**매개변수:**
- `Component: React.ComponentType` - 래핑할 컴포넌트

**반환값:** `React.ComponentType` - 래핑된 컴포넌트

```typescript
// 수동 프로바이더 래핑
function App() {
  return (
    <UserStoreProvider>
      <UserComponent />
    </UserStoreProvider>
  );
}

// HOC 패턴 (권장)
const App = withUserStoreProvider(() => (
  <UserComponent />
));
```

## 스토어 액세스 훅

### `useStore(key)`

패턴에서 특정 스토어 인스턴스에 액세스합니다.

**매개변수:**
- `key: keyof T` - 설정의 스토어 키

**반환값:** `Store<StoreValue>` - 스토어 인스턴스

```typescript
function UserComponent() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // 스토어 인스턴스는 getValue, setValue, update 메서드를 제공
  const profile = profileStore.getValue();
  
  return <div>{profile.name}</div>;
}
```

## 스토어 인스턴스 메서드

### `getValue()`

현재 스토어 값을 가져옵니다 (비반응형).

**반환값:** `StoreValue` - 현재 값

```typescript
const profileStore = useUserStore('profile');
const currentProfile = profileStore.getValue();
// { name: '', email: '', avatar: '' }
```

### `setValue(value)`

새로운 스토어 값을 완전히 설정합니다.

**매개변수:**
- `value: StoreValue` - 새로운 값

**반환값:** `void`

```typescript
profileStore.setValue({
  name: '홍길동',
  email: 'hong@example.com',
  avatar: 'https://example.com/avatar.jpg'
});
```

### `update(updater)`

업데이터 함수를 사용하여 스토어 값을 업데이트합니다.

**매개변수:**
- `updater: (current: StoreValue) => StoreValue` - 업데이트 함수

**반환값:** `void`

```typescript
// 부분 업데이트
profileStore.update(current => ({
  ...current,
  name: '홍길동 업데이트'
}));

// 조건부 업데이트
preferencesStore.update(current => ({
  ...current,
  theme: current.theme === 'light' ? 'dark' : 'light'
}));
```

## 반응형 구독

### `useStoreValue(store)`

스토어 변경사항을 구독하고 반응형 업데이트를 받습니다.

**매개변수:**
- `store: Store<T>` - `useStore()`에서 가져온 스토어 인스턴스

**반환값:** `T` - 현재 스토어 값 (반응형)

```typescript
function UserProfile() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // 반응형 구독 - 변경 시 컴포넌트가 재렌더링됨
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  const updateProfile = () => {
    profileStore.setValue({
      ...profile,
      name: '업데이트된 이름'
    });
    // 새 이름으로 컴포넌트가 자동으로 재렌더링됨
  };
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>테마: {preferences.theme}</p>
      <button onClick={updateProfile}>업데이트</button>
    </div>
  );
}
```

## 스토어 매니저

### `useStoreManager()`

패턴 전체 작업을 위한 스토어 매니저에 액세스합니다.

**반환값:** `StoreManager<T>` - 스토어 매니저 인스턴스

```typescript
interface StoreManager<T> {
  reset(key: keyof T): void;
  resetAll(): void;
  getAllValues(): { [K in keyof T]: InferStoreValue<T[K]> };
  getStore<K extends keyof T>(key: K): Store<InferStoreValue<T[K]>>;
}
```

### 스토어 매니저 메서드

#### `reset(key)`

특정 스토어를 초기값으로 재설정합니다.

**매개변수:**
- `key: keyof T` - 재설정할 스토어 키

```typescript
function ResetComponent() {
  const storeManager = useUserStoreManager();
  
  const resetProfile = () => {
    storeManager.reset('profile');
    // 프로필 스토어가 다음으로 돌아감: { name: '', email: '', avatar: '' }
  };
  
  return <button onClick={resetProfile}>프로필 재설정</button>;
}
```

#### `resetAll()`

모든 스토어를 초기값으로 재설정합니다.

```typescript
const resetAllStores = () => {
  storeManager.resetAll();
  // 모든 스토어가 초기값으로 돌아감
};
```

#### `getAllValues()`

모든 스토어에서 현재 값을 가져옵니다 (비반응형).

**반환값:** 모든 현재 스토어 값을 가진 객체

```typescript
const storeManager = useUserStoreManager();

const logAllValues = () => {
  const values = storeManager.getAllValues();
  console.log(values);
  // {
  //   profile: { name: 'John', email: 'john@example.com', avatar: '' },
  //   preferences: { theme: 'dark', language: 'ko' },
  //   settings: { notifications: true, privacy: 'private' }
  // }
};
```

#### `getStore(key)`

매니저에서 직접 스토어 인스턴스를 가져옵니다.

**매개변수:**
- `key: keyof T` - 스토어 키

**반환값:** `Store<StoreValue>` - 스토어 인스턴스

```typescript
function UtilityComponent() {
  const storeManager = useUserStoreManager();
  
  const updateProfileFromManager = () => {
    const profileStore = storeManager.getStore('profile');
    profileStore.setValue({ name: '매니저 업데이트', email: '', avatar: '' });
  };
  
  return <button onClick={updateProfileFromManager}>매니저를 통해 업데이트</button>;
}
```

## 고급 패턴

### 파생 상태

```typescript
const { useStore } = createDeclarativeStorePattern('Analytics', {
  events: {
    initialValue: [] as Array<{ type: string; timestamp: number }>,
    derived: {
      // 자동으로 업데이트되는 계산된 속성
      eventCount: (events) => events.length,
      recentEvents: (events) => events.filter(e => 
        Date.now() - e.timestamp < 300000 // 최근 5분
      ),
      hasRecentActivity: (events) => 
        events.some(e => Date.now() - e.timestamp < 60000) // 최근 1분
    }
  }
});

function AnalyticsComponent() {
  const eventsStore = useAnalyticsStore('events');
  const events = useStoreValue(eventsStore);
  
  // 파생 상태 액세스
  console.log(events.eventCount);      // 계산된 개수
  console.log(events.recentEvents);    // 필터링된 이벤트
  console.log(events.hasRecentActivity); // 불린 플래그
}
```

### 스토어 검증

```typescript
const { useStore } = createDeclarativeStorePattern('Settings', {
  config: {
    initialValue: { apiUrl: '', timeout: 5000, retries: 3 },
    validator: (value) => {
      if (typeof value !== 'object') return false;
      if (!value.apiUrl || typeof value.apiUrl !== 'string') return false;
      if (typeof value.timeout !== 'number' || value.timeout < 1000) return false;
      if (typeof value.retries !== 'number' || value.retries < 0) return false;
      return true;
    }
  }
});

function ConfigComponent() {
  const configStore = useSettingsStore('config');
  
  const updateConfig = () => {
    try {
      configStore.setValue({
        apiUrl: 'https://api.example.com',
        timeout: 3000,
        retries: 5
      }); // ✅ 검증 통과
    } catch (error) {
      console.error('잘못된 설정:', error);
    }
  };
}
```

### 다중 스토어 조정

```typescript
function UserDashboard() {
  const userStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  const settingsStore = useUserStore('settings');
  
  const user = useStoreValue(userStore);
  const preferences = useStoreValue(preferencesStore);
  const settings = useStoreValue(settingsStore);
  
  const updateUserTheme = (newTheme: 'light' | 'dark') => {
    // 설정 업데이트
    preferencesStore.update(current => ({
      ...current,
      theme: newTheme
    }));
    
    // 테마에 따른 설정 업데이트
    settingsStore.update(current => ({
      ...current,
      contrast: newTheme === 'dark' ? 'high' : 'normal'
    }));
  };
  
  return (
    <div className={`theme-${preferences.theme}`}>
      <h1>환영합니다, {user.name}</h1>
      <button onClick={() => updateUserTheme('dark')}>
        다크 모드로 전환
      </button>
    </div>
  );
}
```

## 베스트 프랙티스

### 스토어 패턴을 언제 사용할지

✅ **다음에 이상적:**
- 애플리케이션 상태 관리
- 폼 상태 및 UI 상태
- 데이터 캐싱 및 지속성
- 파생 상태 및 계산된 값

❌ **다음은 피하세요:**
- 복잡한 비즈니스 로직 (Action 패턴 사용)
- 부작용 및 API 호출 (Action 패턴 사용)
- 이벤트 처리 및 분석 (Action 패턴 사용)

### 성능 최적화

```typescript
// 비용이 많이 드는 컴포넌트에 React.memo 사용
const ExpensiveComponent = React.memo(function ExpensiveComponent() {
  const dataStore = useAppStore('largeDataset');
  const data = useStoreValue(dataStore);
  
  // 비용이 많이 드는 계산
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// 큰 객체에 대한 선택적 구독
function OptimizedComponent() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  
  // 이름이 변경될 때만 재렌더링
  const userName = useMemo(() => user.name, [user.name]);
  
  return <h1>{userName}</h1>;
}
```

## 예제

완전한 작동 예제는 [Store Only 패턴 예제](../../examples/store-only.md)를 참조하세요.

## 관련 자료

- **[스토어 매니저 API](./store-manager.md)** - 스토어 관리 유틸리티
- **[액션 컨텍스트 API](./action-context.md)** - Action Only 패턴
- **[메인 패턴 가이드](../../guide/patterns.md)** - 패턴 사용 가이드
- **[기본 설정 예제](../../examples/basic-setup.md)** - 완전한 통합 예제