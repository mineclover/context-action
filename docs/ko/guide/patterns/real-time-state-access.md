# 실시간 상태 접근 패턴

현재 상태에 실시간으로 접근하여 클로저 함정을 방지하는 패턴입니다.

## 문제: 클로저 함정

```typescript
// ❌ 문제가 있는 코드 - 오래된 클로저
const [isMounted, setIsMounted] = useState(false);

const actionHandler = useCallback(async () => {
  // 이 값은 오래된 것일 수 있습니다!
  if (!isMounted) {
    await waitForRefs('element');
  }
}, [waitForRefs, isMounted]); // 오래된 상태에 의존
```

## 해결책: 실시간 접근

```typescript
// ✅ 올바른 코드 - 실시간 상태 접근
const actionHandler = useCallback(async () => {
  // 항상 현재 상태를 가져옴
  const currentState = stateStore.getValue();
  
  if (!currentState.isMounted) {
    await waitForRefs('element');
  }
  
  // 작업 계속
}, [stateStore, waitForRefs]); // 반응형 상태에 의존하지 않음
```

## 완전한 예제

```typescript
const {
  stores,
  Provider: StoreProvider
} = createDeclarativeStorePattern('App', {
  isMounted: { initialValue: false },
  isProcessing: { initialValue: false }
});

function MyComponent() {
  const isMountedStore = stores.getStore('isMounted');
  const isProcessingStore = stores.getStore('isProcessing');
  
  const handleAction = useCallback(async () => {
    // 실시간 상태 접근
    const currentMounted = isMountedStore.getValue();
    const currentProcessing = isProcessingStore.getValue();
    
    if (currentProcessing) return; // 중복 실행 방지
    
    isProcessingStore.setValue(true);
    
    if (!currentMounted) {
      await waitForRefs('criticalElement');
    }
    
    // 액션 수행
    console.log('액션 완료');
    
    isProcessingStore.setValue(false);
  }, [isMountedStore, isProcessingStore, waitForRefs]);
}
```

## 주요 이점

- **오래된 클로저 없음**: 항상 현재 상태에 접근
- **경쟁 조건 방지**: 실시간 검사로 충돌 방지
- **성능**: 의존성으로 인한 불필요한 리렌더링 방지