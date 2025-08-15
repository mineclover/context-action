# 스토어 매니저 API

`useStoreManager()`에서 반환되는 스토어 매니저 객체의 완전한 API 레퍼런스입니다.

## 개요

스토어 매니저는 선언형 스토어 패턴 컨텍스트 내에서 여러 스토어를 관리하기 위한 고급 작업을 제공합니다. 일괄 작업, 상태 내보내기/가져오기, 관리 제어 기능을 제공합니다.

## 핵심 메서드

### `storeManager.getStore(storeName)`

이름으로 특정 스토어 인스턴스를 가져옵니다.

**매개변수:**
- `storeName`: 설정에서 스토어의 키

**반환값:** 스토어 인스턴스

```typescript
function AdminComponent() {
  const storeManager = useStoreManager();
  
  const userStore = storeManager.getStore('user');
  const settingsStore = storeManager.getStore('settings');
  
  // 스토어 직접 사용
  const currentUser = userStore.getValue();
  settingsStore.setValue({ theme: 'dark', language: 'ko' });
}
```

### `storeManager.getAllStores()`

모든 스토어 인스턴스를 맵으로 가져옵니다.

**반환값:** `Map<string, Store<any>>`

```typescript
function StoreInspector() {
  const storeManager = useStoreManager();
  
  const inspectAllStores = () => {
    const stores = storeManager.getAllStores();
    
    for (const [name, store] of stores) {
      console.log(`스토어 ${name}:`, store.getValue());
    }
  };
  
  return <button onClick={inspectAllStores}>스토어 검사</button>;
}
```

### `storeManager.resetStore(storeName)`

특정 스토어를 초기값으로 재설정합니다.

**매개변수:**
- `storeName`: 재설정할 스토어의 키

**반환값:** `void`

```typescript
function ResetControls() {
  const storeManager = useStoreManager();
  
  const resetUser = () => {
    storeManager.resetStore('user');
    console.log('사용자 스토어가 초기 상태로 재설정됨');
  };
  
  return <button onClick={resetUser}>사용자 재설정</button>;
}
```

### `storeManager.resetAll()`

모든 스토어를 초기값으로 재설정합니다.

**반환값:** `void`

```typescript
function GlobalReset() {
  const storeManager = useStoreManager();
  
  const resetApplication = () => {
    if (confirm('모든 애플리케이션 데이터를 재설정하시겠습니까?')) {
      storeManager.resetAll();
      console.log('모든 스토어가 초기 상태로 재설정됨');
    }
  };
  
  return <button onClick={resetApplication}>모든 데이터 재설정</button>;
}
```

## 상태 관리

### `storeManager.exportState()`

모든 스토어의 현재 상태를 내보냅니다.

**반환값:** 모든 스토어 값이 포함된 객체

```typescript
function StateExporter() {
  const storeManager = useStoreManager();
  
  const exportToJson = () => {
    const state = storeManager.exportState();
    const json = JSON.stringify(state, null, 2);
    
    // 파일로 다운로드
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-state.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return <button onClick={exportToJson}>상태 내보내기</button>;
}
```

### `storeManager.importState(state)`

모든 스토어에 상태 데이터를 가져옵니다.

**매개변수:**
- `state`: 스토어 값을 포함하는 객체

**반환값:** `void`

```typescript
function StateImporter() {
  const storeManager = useStoreManager();
  
  const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string);
        storeManager.importState(state);
        console.log('상태 가져오기 성공');
      } catch (error) {
        console.error('상태 가져오기 실패:', error);
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div>
      <input type="file" accept=".json" onChange={importFromFile} />
      <label>JSON에서 상태 가져오기</label>
    </div>
  );
}
```

### `storeManager.getStoreNames()`

사용 가능한 모든 스토어의 이름을 가져옵니다.

**반환값:** `string[]`

```typescript
function StoreList() {
  const storeManager = useStoreManager();
  
  const storeNames = storeManager.getStoreNames();
  
  return (
    <div>
      <h3>사용 가능한 스토어:</h3>
      <ul>
        {storeNames.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 고급 작업

### 일괄 스토어 작업

```typescript
function BulkOperations() {
  const storeManager = useStoreManager();
  
  const resetUserRelatedStores = () => {
    const userStores = ['user', 'userPreferences', 'userSettings'];
    
    userStores.forEach(storeName => {
      if (storeManager.getStoreNames().includes(storeName)) {
        storeManager.resetStore(storeName);
      }
    });
  };
  
  const exportUserData = () => {
    const fullState = storeManager.exportState();
    const userData = {
      user: fullState.user,
      userPreferences: fullState.userPreferences,
      userSettings: fullState.userSettings
    };
    
    return userData;
  };
  
  return (
    <div>
      <button onClick={resetUserRelatedStores}>사용자 데이터 재설정</button>
      <button onClick={() => console.log(exportUserData())}>사용자 데이터 내보내기</button>
    </div>
  );
}
```

### 스토어 검증

```typescript
function StoreValidator() {
  const storeManager = useStoreManager();
  
  const validateAllStores = () => {
    const stores = storeManager.getAllStores();
    const validation = {
      valid: true,
      errors: [] as string[]
    };
    
    for (const [name, store] of stores) {
      const value = store.getValue();
      
      // 커스텀 검증 로직
      if (!validateStoreValue(name, value)) {
        validation.valid = false;
        validation.errors.push(`스토어 ${name}에 잘못된 값이 있습니다`);
      }
    }
    
    return validation;
  };
  
  const fixInvalidStores = () => {
    const validation = validateAllStores();
    
    if (!validation.valid) {
      console.warn('잘못된 스토어가 발견됨:', validation.errors);
      
      // 잘못된 스토어 재설정
      validation.errors.forEach(error => {
        const storeName = error.match(/스토어 (\w+)/)?.[1];
        if (storeName) {
          storeManager.resetStore(storeName);
        }
      });
    }
  };
  
  return (
    <div>
      <button onClick={() => console.log(validateAllStores())}>
        스토어 검증
      </button>
      <button onClick={fixInvalidStores}>
        잘못된 스토어 수정
      </button>
    </div>
  );
}
```

### 스토어 동기화

```typescript
function StoreSynchronizer() {
  const storeManager = useStoreManager();
  
  const syncToLocalStorage = () => {
    const state = storeManager.exportState();
    localStorage.setItem('app-state', JSON.stringify(state));
  };
  
  const syncFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('app-state');
      if (saved) {
        const state = JSON.parse(saved);
        storeManager.importState(state);
      }
    } catch (error) {
      console.error('localStorage에서 동기화 실패:', error);
    }
  };
  
  // 상태 변경 시 자동 동기화
  useEffect(() => {
    const stores = storeManager.getAllStores();
    const unsubscribers: (() => void)[] = [];
    
    // 모든 스토어 변경사항 구독
    for (const [name, store] of stores) {
      const unsubscribe = store.subscribe(() => {
        // 과도한 저장을 피하기 위해 디바운스
        debouncedSyncToLocalStorage();
      });
      unsubscribers.push(unsubscribe);
    }
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);
  
  return (
    <div>
      <button onClick={syncToLocalStorage}>로컬 스토리지에 저장</button>
      <button onClick={syncFromLocalStorage}>로컬 스토리지에서 로드</button>
    </div>
  );
}
```

## 스토어 매니저 유틸리티

### 스토어 통계

```typescript
function StoreStatistics() {
  const storeManager = useStoreManager();
  
  const getStoreStats = () => {
    const stores = storeManager.getAllStores();
    const stats = {
      totalStores: stores.size,
      storeDetails: [] as Array<{
        name: string;
        hasValue: boolean;
        valueType: string;
        size: number;
      }>
    };
    
    for (const [name, store] of stores) {
      const value = store.getValue();
      stats.storeDetails.push({
        name,
        hasValue: value !== null && value !== undefined,
        valueType: typeof value,
        size: JSON.stringify(value).length
      });
    }
    
    return stats;
  };
  
  return (
    <div>
      <button onClick={() => console.table(getStoreStats().storeDetails)}>
        스토어 통계 보기
      </button>
    </div>
  );
}
```

### 스토어 상태 모니터링

```typescript
function StoreHealthMonitor() {
  const storeManager = useStoreManager();
  const [health, setHealth] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const checkHealth = () => {
      const stores = storeManager.getAllStores();
      const healthStatus: Record<string, boolean> = {};
      
      for (const [name, store] of stores) {
        try {
          const value = store.getValue();
          healthStatus[name] = value !== null && value !== undefined;
        } catch (error) {
          healthStatus[name] = false;
        }
      }
      
      setHealth(healthStatus);
    };
    
    // 30초마다 상태 확인
    const interval = setInterval(checkHealth, 30000);
    checkHealth(); // 초기 확인
    
    return () => clearInterval(interval);
  }, [storeManager]);
  
  return (
    <div className="store-health">
      <h3>스토어 상태 모니터링</h3>
      {Object.entries(health).map(([storeName, isHealthy]) => (
        <div key={storeName} className={`health-item ${isHealthy ? 'healthy' : 'unhealthy'}`}>
          <span>{storeName}:</span>
          <span>{isHealthy ? '✅ 정상' : '❌ 비정상'}</span>
        </div>
      ))}
    </div>
  );
}
```

## 에러 처리

### 스토어 매니저 에러 복구

```typescript
function StoreManagerErrorHandler() {
  const storeManager = useStoreManager();
  
  const handleStoreError = (storeName: string, error: Error) => {
    console.error(`스토어 ${storeName} 에러:`, error);
    
    // 스토어를 재설정하여 복구 시도
    try {
      storeManager.resetStore(storeName);
      console.log(`스토어 ${storeName} 재설정 성공`);
    } catch (resetError) {
      console.error(`스토어 ${storeName} 재설정 실패:`, resetError);
    }
  };
  
  const safeStoreOperation = <T>(
    operation: () => T,
    storeName: string
  ): T | null => {
    try {
      return operation();
    } catch (error) {
      handleStoreError(storeName, error as Error);
      return null;
    }
  };
  
  return { safeStoreOperation };
}
```

## 관련 자료

- **[Store Only 메서드](./store-only.md)** - 개별 스토어 메서드
- **[선언형 스토어 패턴](./declarative-store-pattern.md)** - 패턴 구현
- **[Store Only 예제](../examples/store-only.md)** - 완전한 사용 예제