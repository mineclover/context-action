# 실시간 상태 접근 패턴

클로저 트랩을 피하고 현재 상태에 실시간으로 접근하는 패턴입니다.

## 사전 요구사항

스토어 컨텍스트 구성 및 명명 규칙은 [기본 스토어 설정](../setup/basic-store-setup.md)을 참조하세요.

## 문제점: 클로저 트랩

```typescript
// ❌ 문제가 있는 코드 - 오래된 클로저
const [isMounted, setIsMounted] = useState(false);

const actionHandler = useCallback(async () => {
  // 이 값이 오래되었을 수 있습니다!
  if (!isMounted) {
    await waitForRefs('element');
  }
}, [waitForRefs, isMounted]); // 오래된 상태에 대한 의존성
```

## 해결책: 실시간 접근

```typescript
// ✅ 올바른 방법 - 실시간 상태 접근
const actionHandler = useCallback(async () => {
  // 항상 현재 상태를 가져옵니다
  const currentState = stateStore.getValue();
  
  if (!currentState.isMounted) {
    await waitForRefs('element');
  }
  
  // 작업 계속 진행
}, [stateStore, waitForRefs]); // 반응형 상태에 대한 의존성 없음
```

## 완전한 예시

```typescript
// 적절한 구성을 갖춘 기본 스토어 설정 패턴 사용
const {
  Provider: UIStoreProvider,
  useStore: useUIStore,
  useStoreManager: useUIStoreManager
} = createDeclarativeStorePattern('UI', {
  isMounted: { 
    initialValue: false,
    strategy: 'shallow' as const,
    description: 'Component mount state tracking'
  },
  isProcessing: { 
    initialValue: false,
    strategy: 'shallow' as const,
    description: 'Processing operation state'
  }
});

function MyComponent() {
  const isMountedStore = useUIStore('isMounted');
  const isProcessingStore = useUIStore('isProcessing');
  
  const handleAction = useCallback(async () => {
    // 실시간 상태 접근 - 항상 현재 값을 가져옵니다
    const currentMounted = isMountedStore.getValue();
    const currentProcessing = isProcessingStore.getValue();
    
    if (currentProcessing) return; // 중복 실행 방지
    
    isProcessingStore.setValue(true);
    
    if (!currentMounted) {
      await waitForRefs('criticalElement');
    }
    
    // 액션 수행
    console.log('Action completed');
    
    isProcessingStore.setValue(false);
  }, [isMountedStore, isProcessingStore, waitForRefs]);
  
  return (
    <div>
      <button onClick={handleAction}>액션 실행</button>
    </div>
  );
}

// Provider를 포함한 앱 설정 (기본 스토어 설정 패턴 따름)
function App() {
  return (
    <UIStoreProvider>
      <MyComponent />
    </UIStoreProvider>
  );
}
```

## 고급 패턴

### 다중 스토어 협력

```typescript
function MultiStoreComponent() {
  const userStoreManager = useUserStoreManager();
  const settingsStoreManager = useSettingsStoreManager();
  const uiStoreManager = useUIStoreManager();
  
  useActionHandler('complexAction', useCallback(async (payload) => {
    // 각 스토어 관리자에서 현재 상태 가져오기
    const userState = userStoreManager.getStore('profile').getValue();
    const settingsState = settingsStoreManager.getStore('api').getValue();
    const uiState = uiStoreManager.getStore('loading').getValue();
    
    // 의사결정을 위해 모든 현재 상태 사용
    if (userState.isLoggedIn && settingsState.apiEnabled && !uiState.isLoading) {
      // 복잡한 로직 실행
    }
  }, [userStoreManager, settingsStoreManager, uiStoreManager]));
}
```

### 상태 검증 및 업데이트

```typescript
// 데이터 관리를 위한 추가 스토어 구성
const {
  Provider: DataStoreProvider,
  useStore: useDataStore,
  useStoreManager: useDataStoreManager
} = createDeclarativeStorePattern('Data', {
  data: {
    initialValue: { version: 1, content: {} },
    strategy: 'shallow' as const,
    description: 'Application data with versioning'
  }
});

function DataManagementComponent() {
  const dataStore = useDataStore('data');
  
  useActionHandler('validateAndUpdate', useCallback(async (payload) => {
    const current = dataStore.getValue();
    
    // 현재 상태 검증
    if (current.version !== payload.expectedVersion) {
      throw new Error('Version mismatch');
    }
    
    // 현재 상태를 기반으로 업데이트
    dataStore.setValue({
      ...current,
      ...payload.updates,
      version: current.version + 1
    });
  }, [dataStore]));
}
```

## 주요 이점

- **오래된 클로저 없음**: 항상 현재 상태에 접근
- **경쟁 조건 방지**: 실시간 검사로 충돌 방지
- **성능**: 의존성으로 인한 불필요한 재렌더링 방지
- **신뢰성**: 최신 상태 값 보장