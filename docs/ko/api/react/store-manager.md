# 스토어 매니저 API

스토어 매니저는 스토어 패턴 내의 모든 스토어를 중앙 집중식으로 관리하며, 재설정 작업, 대량 작업, 스토어 액세스를 위한 유틸리티를 제공합니다.

## 개요

스토어 매니저는 `useStoreManager()` 훅을 통해 액세스하며 패턴 전체 작업을 제공합니다:

```typescript
function ManagementComponent() {
  const storeManager = useUserStoreManager();
  
  // 모든 스토어 관리 작업에 액세스
}
```

## 스토어 매니저 인터페이스

```typescript
interface StoreManager<T> {
  // 재설정 작업
  reset<K extends keyof T>(key: K): void;
  resetAll(): void;
  
  // 대량 작업
  getAllValues(): { [K in keyof T]: InferStoreValue<T[K]> };
  setAllValues(values: Partial<{ [K in keyof T]: InferStoreValue<T[K]> }>): void;
  
  // 스토어 액세스
  getStore<K extends keyof T>(key: K): Store<InferStoreValue<T[K]>>;
  getStoreNames(): Array<keyof T>;
  
  // 상태 관리
  hasStore(key: keyof T): boolean;
  getStoreCount(): number;
}
```

## 재설정 작업

### `reset(key)`

특정 스토어를 초기값으로 재설정합니다.

**매개변수:**
- `key: keyof T` - 재설정할 스토어 키

**반환값:** `void`

```typescript
function UserProfileComponent() {
  const storeManager = useUserStoreManager();
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  const resetProfile = () => {
    storeManager.reset('profile');
    // 프로필 스토어가 초기값으로 돌아감: { name: '', email: '', avatar: '' }
  };
  
  const resetPreferences = () => {
    storeManager.reset('preferences');
    // 환경설정 스토어가 초기값으로 돌아감
  };
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <button onClick={resetProfile}>프로필 재설정</button>
      <button onClick={resetPreferences}>환경설정 재설정</button>
    </div>
  );
}
```

### `resetAll()`

패턴의 모든 스토어를 초기값으로 재설정합니다.

**반환값:** `void`

```typescript
function AppResetComponent() {
  const storeManager = useUserStoreManager();
  
  const resetAllStores = () => {
    storeManager.resetAll();
    // 모든 스토어가 초기값으로 돌아감:
    // - profile: { name: '', email: '', avatar: '' }
    // - preferences: { theme: 'light', language: 'ko' }
    // - settings: { notifications: true, privacy: 'public' }
  };
  
  const confirmReset = () => {
    if (confirm('모든 사용자 데이터를 재설정하시겠습니까?')) {
      resetAllStores();
    }
  };
  
  return (
    <div>
      <button onClick={confirmReset}>모든 데이터 재설정</button>
    </div>
  );
}
```

## 대량 작업

### `getAllValues()`

모든 스토어에서 현재 값을 가져옵니다 (비반응형 스냅샷).

**반환값:** `{ [K in keyof T]: StoreValue<T[K]> }` - 모든 현재 값을 가진 객체

```typescript
function DebugComponent() {
  const storeManager = useUserStoreManager();
  
  const logAllValues = () => {
    const values = storeManager.getAllValues();
    console.log('현재 상태 스냅샷:', values);
    // {
    //   profile: { name: '홍길동', email: 'hong@example.com', avatar: '' },
    //   preferences: { theme: 'dark', language: 'ko' },
    //   settings: { notifications: false, privacy: 'private' }
    // }
  };
  
  const exportState = () => {
    const state = storeManager.getAllValues();
    const dataStr = JSON.stringify(state, null, 2);
    downloadFile('user-state.json', dataStr);
  };
  
  return (
    <div>
      <button onClick={logAllValues}>상태 로그</button>
      <button onClick={exportState}>상태 내보내기</button>
    </div>
  );
}
```

### `setAllValues(values)`

여러 스토어 값을 한 번에 설정합니다.

**매개변수:**
- `values: Partial<{ [K in keyof T]: StoreValue<T[K]> }>` - 업데이트할 스토어 값을 가진 객체

**반환값:** `void`

```typescript
function ImportComponent() {
  const storeManager = useUserStoreManager();
  
  const importState = (importedData: any) => {
    try {
      // 부분 상태 검증 및 가져오기
      storeManager.setAllValues({
        profile: {
          name: importedData.profile?.name || '',
          email: importedData.profile?.email || '',
          avatar: importedData.profile?.avatar || ''
        },
        preferences: {
          theme: importedData.preferences?.theme || 'light',
          language: importedData.preferences?.language || 'ko'
        }
        // settings는 생략 가능 - 지정된 스토어만 업데이트됨
      });
    } catch (error) {
      console.error('가져오기 실패:', error);
    }
  };
  
  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const data = JSON.parse(event.target?.result as string);
            importState(data);
          };
          reader.readAsText(file);
        }
      }}
    />
  );
}
```

## 스토어 액세스

### `getStore(key)`

매니저에서 직접 스토어 인스턴스를 가져옵니다 (`useStore`의 대안).

**매개변수:**
- `key: keyof T` - 스토어 키

**반환값:** `Store<StoreValue>` - 스토어 인스턴스

```typescript
function AdvancedComponent() {
  const storeManager = useUserStoreManager();
  
  const bulkUpdate = () => {
    // 매니저를 통해 여러 스토어에 액세스
    const profileStore = storeManager.getStore('profile');
    const preferencesStore = storeManager.getStore('preferences');
    
    // 조정된 업데이트
    profileStore.update(profile => ({ ...profile, name: '대량 업데이트됨' }));
    preferencesStore.update(prefs => ({ ...prefs, theme: 'light' }));
  };
  
  return <button onClick={bulkUpdate}>대량 업데이트</button>;
}
```

### `getStoreNames()`

패턴의 모든 스토어 이름 목록을 가져옵니다.

**반환값:** `Array<keyof T>` - 스토어 키 배열

```typescript
function StoreListComponent() {
  const storeManager = useUserStoreManager();
  
  useEffect(() => {
    const storeNames = storeManager.getStoreNames();
    console.log('사용 가능한 스토어:', storeNames);
    // ['profile', 'preferences', 'settings']
  }, [storeManager]);
  
  return null;
}
```

## 유틸리티 메서드

### `hasStore(key)`

패턴에 스토어가 존재하는지 확인합니다.

**매개변수:**
- `key: keyof T` - 확인할 스토어 키

**반환값:** `boolean`

```typescript
const storeManager = useUserStoreManager();

const checkStore = (storeName: string) => {
  if (storeManager.hasStore(storeName as keyof UserStores)) {
    console.log(`스토어 ${storeName}가 존재합니다`);
  } else {
    console.log(`스토어 ${storeName}를 찾을 수 없습니다`);
  }
};
```

### `getStoreCount()`

패턴의 총 스토어 수를 가져옵니다.

**반환값:** `number`

```typescript
function StoreStatsComponent() {
  const storeManager = useUserStoreManager();
  
  const storeCount = storeManager.getStoreCount();
  const storeNames = storeManager.getStoreNames();
  
  return (
    <div>
      <p>총 스토어 수: {storeCount}</p>
      <p>스토어: {storeNames.join(', ')}</p>
    </div>
  );
}
```

## 실제 사용 패턴

### 상태 지속성

```typescript
function StatePersistenceManager() {
  const storeManager = useUserStoreManager();
  
  // localStorage에 자동 저장
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const currentState = storeManager.getAllValues();
      localStorage.setItem('userState', JSON.stringify(currentState));
    }, 5000); // 5초마다 저장
    
    return () => clearInterval(saveInterval);
  }, [storeManager]);
  
  // 마운트 시 localStorage에서 로드
  useEffect(() => {
    const savedState = localStorage.getItem('userState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        storeManager.setAllValues(parsedState);
      } catch (error) {
        console.error('저장된 상태 로드 실패:', error);
      }
    }
  }, [storeManager]);
  
  return null;
}
```

### 스토어 동기화

```typescript
function StoreSyncComponent() {
  const storeManager = useUserStoreManager();
  
  // 외부 API와 동기화
  const syncWithServer = async () => {
    try {
      const currentState = storeManager.getAllValues();
      
      // 서버로 전송
      await api.saveUserState(currentState);
      
      // 서버에서 업데이트된 상태 가져오기
      const serverState = await api.getUserState();
      
      // 로컬 스토어 업데이트
      storeManager.setAllValues(serverState);
      
    } catch (error) {
      console.error('동기화 실패:', error);
    }
  };
  
  return (
    <div>
      <button onClick={syncWithServer}>서버와 동기화</button>
    </div>
  );
}
```

### 개발 도구 통합

```typescript
function DevToolsComponent() {
  const storeManager = useUserStoreManager();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 디버깅을 위해 스토어 매니저를 window에 노출
      (window as any).storeManager = storeManager;
      
      console.log('window.storeManager에서 스토어 매니저 사용 가능');
      console.log('사용 가능한 메서드:', Object.getOwnPropertyNames(storeManager));
    }
  }, [storeManager]);
  
  return null;
}

// 브라우저 콘솔에서 사용:
// window.storeManager.getAllValues()
// window.storeManager.reset('profile')
// window.storeManager.getStoreNames()
```

## 에러 처리

### 검증 에러

```typescript
function SafeUpdateComponent() {
  const storeManager = useUserStoreManager();
  
  const safeUpdate = (storeName: keyof UserStores, newValue: any) => {
    try {
      const store = storeManager.getStore(storeName);
      store.setValue(newValue);
    } catch (error) {
      console.error(`${String(storeName)} 업데이트 실패:`, error);
      // 검증 에러 또는 타입 불일치 처리
    }
  };
  
  return null;
}
```

### 스토어 액세스 에러

```typescript
function ErrorHandlingComponent() {
  const storeManager = useUserStoreManager();
  
  const safeStoreAccess = (storeName: string) => {
    if (storeManager.hasStore(storeName as keyof UserStores)) {
      const store = storeManager.getStore(storeName as keyof UserStores);
      return store.getValue();
    } else {
      console.warn(`스토어 ${storeName}가 존재하지 않습니다`);
      return null;
    }
  };
  
  return null;
}
```

## 예제

완전한 스토어 매니저 사용 예제는 [Store Only 패턴 예제](../../examples/store-only.md)를 참조하세요.

## 관련 자료

- **[스토어 패턴 API](./store-pattern.md)** - 스토어 패턴 생성 및 사용
- **[액션 컨텍스트 API](./action-context.md)** - Action Only 패턴
- **[메인 패턴 가이드](../../guide/patterns.md)** - 패턴 선택 및 베스트 프랙티스
- **[스토어 통합 예제](../../examples/pattern-composition.md)** - 고급 스토어 조정