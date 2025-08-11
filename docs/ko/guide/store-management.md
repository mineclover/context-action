# 스토어 관리

Context-Action 프레임워크의 스토어 시스템은 프로바이더 경계 내에서 반응형 상태 관리를 제공합니다. 이 가이드는 효율적이고 안전한 스토어 관리 패턴을 다룹니다.

## 스토어 생명주기

### 생성과 초기화

스토어는 프로바이더 내에서 처음 접근될 때 생성되고 초기화됩니다:

```typescript
// 스토어 정의
export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStores: useUserStores
} = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: '',
      status: 'offline'
    },
    strategy: 'deep' // 변경 감지 전략
  },
  settings: {
    initialValue: {
      theme: 'light',
      language: 'ko',
      notifications: true
    },
    strategy: 'shallow'
  }
});

// 사용법
function UserComponent() {
  // 첫 번째 접근 시 스토어가 생성되고 초기화됨
  const profileStore = useUserStore('profile');
  const settingsStore = useUserStore('settings');
  
  // 동일한 이름의 스토어는 동일한 인스턴스를 반환 (싱글톤)
  const sameProfileStore = useUserStore('profile'); // profileStore와 동일
}
```

### 변경 감지 전략

스토어는 세 가지 변경 감지 전략을 제공합니다:

```typescript
// 1. 참조 비교 (기본값) - 빠름, 원시값과 불변 객체에 적합
{
  strategy: 'reference' // Object.is() 사용
}

// 2. 얕은 비교 - 객체의 최상위 속성만 비교
{
  strategy: 'shallow' // 각 속성을 개별적으로 비교
}

// 3. 깊은 비교 - 중첩된 객체까지 재귀적으로 비교
{
  strategy: 'deep' // 모든 중첩 수준에서 비교
}
```

**전략 선택 가이드:**

```typescript
// 원시값 또는 불변 객체 - reference (기본값)
counter: {
  initialValue: 0,
  strategy: 'reference'
}

// 평면 객체 - shallow
userPreferences: {
  initialValue: { theme: 'light', lang: 'ko' },
  strategy: 'shallow'
}

// 중첩 객체 - deep (성능 비용 고려)
complexUserData: {
  initialValue: {
    profile: { name: '', settings: { privacy: true } },
    metadata: { lastLogin: null }
  },
  strategy: 'deep'
}
```

## 스토어 접근 패턴

### 1. 컴포넌트에서의 반응형 접근

```typescript
function UserProfile() {
  // 반응형 스토어 접근
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // 상태 변경 시 컴포넌트 자동 리렌더링
  return (
    <div>
      <h2>{profile.name}</h2>
      <p>상태: {profile.status}</p>
    </div>
  );
}

// 여러 스토어 구독
function UserDashboard() {
  const profile = useStoreValue(useUserStore('profile'));
  const settings = useStoreValue(useUserStore('settings'));
  
  // 각각 독립적으로 구독됨
  return (
    <div className={`theme-${settings.theme}`}>
      <h1>환영합니다, {profile.name}님</h1>
      <p>언어: {settings.language}</p>
    </div>
  );
}
```

### 2. 핸들러에서의 지연 평가 접근

```typescript
function useUserHandlers() {
  const registry = useUserStores();
  
  const updateProfileHandler = useCallback(async (payload, controller) => {
    // 지연 평가 - 실행 시점의 최신 값
    const profileStore = registry.getStore('profile');
    const currentProfile = profileStore.getValue(); // 현재 값 획득
    
    // 비즈니스 로직
    const updatedProfile = {
      ...currentProfile,
      ...payload.data,
      lastModified: Date.now()
    };
    
    // 스토어 업데이트
    profileStore.setValue(updatedProfile);
    
    return { success: true, profile: updatedProfile };
  }, [registry]);
}
```

### 3. 직접 스토어 조작

```typescript
function UserEditor() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // 직접 업데이트 (간단한 경우)
  const updateName = useCallback((newName: string) => {
    profileStore.setValue({
      ...profile,
      name: newName,
      lastModified: Date.now()
    });
  }, [profileStore, profile]);
  
  // 부분 업데이트 헬퍼
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    profileStore.update(current => ({
      ...current,
      ...updates,
      lastModified: Date.now()
    }));
  }, [profileStore]);
  
  return (
    <div>
      <input 
        value={profile.name}
        onChange={(e) => updateName(e.target.value)}
      />
      <button onClick={() => updateProfile({ status: 'online' })}>
        온라인 상태로 변경
      </button>
    </div>
  );
}
```

## 고급 스토어 패턴

### 1. 동적 스토어 생성

```typescript
function UserCacheManager() {
  const createStore = useCreateUserStore();
  
  // 사용자별 캐시 스토어 동적 생성
  const createUserCache = useCallback((userId: string) => {
    return createStore(`cache-${userId}`, {
      data: null,
      lastFetched: null,
      isLoading: false
    });
  }, [createStore]);
  
  return { createUserCache };
}

// 사용법
function UserDataComponent({ userId }: { userId: string }) {
  const { createUserCache } = useUserCacheManager();
  const userCache = createUserCache(userId);
  const cacheData = useStoreValue(userCache);
  
  return <div>사용자 {userId} 캐시: {cacheData.data?.name}</div>;
}
```

### 2. 스토어 구독 최적화

```typescript
// 선택적 필드 구독
function OptimizedUserDisplay() {
  const profileStore = useUserStore('profile');
  
  // 이름 변경 시만 리렌더링
  const userName = useStoreValue(profileStore, profile => profile.name);
  
  // 상태 변경 시만 리렌더링
  const userStatus = useStoreValue(profileStore, profile => profile.status);
  
  return (
    <div>
      <span>이름: {userName}</span>
      <span>상태: {userStatus}</span>
    </div>
  );
}

// 조건부 구독
function ConditionalSubscription({ showDetails }: { showDetails: boolean }) {
  const profileStore = useUserStore('profile');
  
  // showDetails가 true일 때만 구독
  const profile = useStoreValue(profileStore, 
    showDetails ? undefined : () => null
  );
  
  if (!showDetails || !profile) {
    return <div>간단한 뷰</div>;
  }
  
  return <div>상세 정보: {profile.email}</div>;
}
```

### 3. 스토어 동기화 패턴

```typescript
// 로컬 스토리지와 동기화
function usePersistedStore() {
  const settingsStore = useUserStore('settings');
  const settings = useStoreValue(settingsStore);
  
  // 초기 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem('user-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        settingsStore.setValue(parsed);
      } catch (error) {
        console.warn('설정 로드 실패:', error);
      }
    }
  }, [settingsStore]);
  
  // 변경사항 저장
  useEffect(() => {
    const unsubscribe = settingsStore.subscribe((newSettings) => {
      try {
        localStorage.setItem('user-settings', JSON.stringify(newSettings));
      } catch (error) {
        console.warn('설정 저장 실패:', error);
      }
    });
    
    return unsubscribe;
  }, [settingsStore]);
  
  return { settings };
}

// 서버와 동기화
function useServerSync() {
  const profileStore = useUserStore('profile');
  const [lastSync, setLastSync] = useState<number>(0);
  
  // 서버에서 데이터 로드
  const loadFromServer = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      const serverProfile = await response.json();
      profileStore.setValue(serverProfile);
      setLastSync(Date.now());
    } catch (error) {
      console.error('서버 동기화 실패:', error);
    }
  }, [profileStore]);
  
  // 서버에 데이터 저장
  const syncToServer = useCallback(async (profile: UserProfile) => {
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      setLastSync(Date.now());
    } catch (error) {
      console.error('서버 업로드 실패:', error);
    }
  }, []);
  
  return { loadFromServer, syncToServer, lastSync };
}
```

## 메모리 관리

### 1. 스토어 정리

```typescript
// 프로바이더 언마운트 시 자동 정리
function App() {
  const [showUser, setShowUser] = useState(true);
  
  return (
    <div>
      {showUser ? (
        <UserStoreProvider>
          <UserComponents />
        </UserStoreProvider>
      ) : (
        <div>사용자 섹션 숨김</div>
      )}
      <button onClick={() => setShowUser(!showUser)}>
        {showUser ? '숨기기' : '보이기'}
      </button>
    </div>
  );
}
// UserStoreProvider가 언마운트되면 모든 User 스토어가 정리됨
```

### 2. 구독 해제

```typescript
function ManualSubscription() {
  const profileStore = useUserStore('profile');
  const [manualData, setManualData] = useState(null);
  
  useEffect(() => {
    // 수동 구독
    const unsubscribe = profileStore.subscribe((newProfile) => {
      setManualData(processProfile(newProfile));
    });
    
    // 정리 함수에서 구독 해제
    return unsubscribe;
  }, [profileStore]);
  
  return <div>수동 처리된 데이터: {manualData}</div>;
}
```

### 3. 메모리 누수 방지

```typescript
// ❌ 메모리 누수 위험
function BadPattern() {
  const profileStore = useUserStore('profile');
  
  useEffect(() => {
    const subscription = profileStore.subscribe((profile) => {
      // 외부 서비스에 등록
      externalService.updateProfile(profile);
    });
    // 정리 함수 없음 - 메모리 누수!
  }, [profileStore]);
}

// ✅ 적절한 정리
function GoodPattern() {
  const profileStore = useUserStore('profile');
  
  useEffect(() => {
    const subscription = profileStore.subscribe((profile) => {
      externalService.updateProfile(profile);
    });
    
    // 적절한 정리
    return () => {
      subscription(); // 구독 해제
      externalService.cleanup(); // 외부 서비스 정리
    };
  }, [profileStore]);
}
```

## 성능 최적화

### 1. 배치 업데이트

```typescript
function BatchUpdates() {
  const profileStore = useUserStore('profile');
  const settingsStore = useUserStore('settings');
  
  const updateMultiple = useCallback(() => {
    // React의 배치 업데이트를 활용
    profileStore.setValue(prevProfile => ({
      ...prevProfile,
      name: '새 이름',
      lastModified: Date.now()
    }));
    
    settingsStore.setValue(prevSettings => ({
      ...prevSettings,
      theme: 'dark'
    }));
    
    // 두 업데이트가 하나의 렌더링 사이클에서 배치됨
  }, [profileStore, settingsStore]);
}
```

### 2. 지연 초기화

```typescript
// 무거운 계산을 지연 초기화
export const expensiveDataStore = createDeclarativeStores<ExpensiveData>('Expensive', {
  computedData: {
    initialValue: () => {
      // 첫 접근 시에만 실행되는 무거운 계산
      return computeExpensiveInitialValue();
    },
    strategy: 'deep'
  }
});
```

### 3. 선택적 리렌더링

```typescript
function OptimizedComponent() {
  const profileStore = useUserStore('profile');
  
  // 이름이 변경될 때만 리렌더링
  const name = useStoreValue(profileStore, profile => profile.name);
  
  // 상태가 변경될 때만 리렌더링  
  const status = useStoreValue(profileStore, profile => profile.status);
  
  return (
    <div>
      <UserName name={name} />
      <UserStatus status={status} />
    </div>
  );
}

// 메모화로 추가 최적화
const UserName = React.memo(({ name }: { name: string }) => (
  <h2>{name}</h2>
));

const UserStatus = React.memo(({ status }: { status: string }) => (
  <span className={`status-${status}`}>{status}</span>
));
```

## 디버깅과 개발 도구

### 1. 개발 모드 로깅

```typescript
// 개발 환경에서 상태 변경 로깅
export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStores: useUserStores
} = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: defaultProfile,
    strategy: 'deep',
    // 개발 모드에서만 로깅
    onChange: process.env.NODE_ENV === 'development' 
      ? (newValue, oldValue) => {
          console.log('Profile 변경:', { from: oldValue, to: newValue });
        }
      : undefined
  }
});
```

### 2. 스토어 상태 검사

```typescript
function DebugPanel() {
  const registry = useUserStores();
  const [storeStates, setStoreStates] = useState({});
  
  const captureStoreStates = useCallback(() => {
    const states = {
      profile: registry.getStore('profile').getValue(),
      settings: registry.getStore('settings').getValue()
    };
    setStoreStates(states);
  }, [registry]);
  
  return (
    <div>
      <button onClick={captureStoreStates}>스토어 상태 캡처</button>
      <pre>{JSON.stringify(storeStates, null, 2)}</pre>
    </div>
  );
}
```

### 3. 시간 여행 디버깅

```typescript
// 상태 변경 히스토리 추적
function useStoreHistory<T>(store: Store<T>) {
  const [history, setHistory] = useState<T[]>([]);
  
  useEffect(() => {
    const unsubscribe = store.subscribe((newValue) => {
      setHistory(prev => [...prev.slice(-9), newValue]); // 최근 10개 유지
    });
    
    return unsubscribe;
  }, [store]);
  
  return history;
}

// 사용법
function DebugComponent() {
  const profileStore = useUserStore('profile');
  const profileHistory = useStoreHistory(profileStore);
  
  return (
    <div>
      <h3>프로필 변경 히스토리</h3>
      {profileHistory.map((profile, index) => (
        <div key={index}>
          {index}: {profile.name} ({profile.lastModified})
        </div>
      ))}
    </div>
  );
}
```

## 모범 사례

### 1. 적절한 초기값 설정

```typescript
// ✅ 좋음: 완전한 타입 구조
{
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: '',
      avatar: null,
      status: 'offline',
      lastLogin: null
    }
  }
}

// ❌ 피하기: null 또는 undefined
{
  profile: {
    initialValue: null // 타입 안전성 문제
  }
}
```

### 2. 일관된 업데이트 패턴

```typescript
// ✅ 좋음: 불변성 유지
const updateProfile = (updates: Partial<UserProfile>) => {
  profileStore.setValue(current => ({
    ...current,
    ...updates,
    lastModified: Date.now()
  }));
};

// ❌ 피하기: 직접 변경
const badUpdate = (updates: Partial<UserProfile>) => {
  const current = profileStore.getValue();
  Object.assign(current, updates); // 직접 변경은 반응성 문제
  profileStore.setValue(current);
};
```

### 3. 명확한 책임 분리

```typescript
// ✅ 좋음: 관련 데이터 그룹화
interface UserData {
  // 사용자 신원 정보
  identity: {
    id: string;
    name: string;
    email: string;
  };
  
  // 사용자 설정
  preferences: {
    theme: string;
    language: string;
  };
  
  // 세션 정보
  session: {
    isLoggedIn: boolean;
    token: string | null;
  };
}

// ❌ 피하기: 평면적 구조
interface UserDataFlat {
  id: string;
  name: string;
  email: string;
  theme: string;
  language: string;
  isLoggedIn: boolean;
  token: string | null;
  // 모든 것이 한 레벨에 있어 관리 어려움
}
```

---

## 요약

Context-Action의 스토어 관리는 다음 핵심 원칙을 따릅니다:

- **반응형 상태 관리** - 변경사항에 자동 반응
- **프로바이더 범위 싱글톤** - 컨텍스트 경계 내 일관성
- **타입 안전성** - 완전한 TypeScript 지원
- **성능 최적화** - 선택적 구독과 배치 업데이트
- **메모리 안전성** - 자동 정리와 구독 관리

이러한 패턴을 따르면 확장 가능하고 유지보수 가능한 상태 관리를 구현할 수 있습니다.

---

::: tip 다음 단계
- [액션 핸들러](./action-handlers) - 비즈니스 로직 구현
- [React 통합](./react-integration) - React와의 효과적인 통합
- [성능 최적화](./performance) - 고급 성능 최적화 기법
:::