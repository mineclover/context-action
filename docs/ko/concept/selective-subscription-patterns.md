# 선택적 구독 패턴

**사전 메모화 최적화: 메모화가 필요하기 전에 불필요한 반응형 구독을 제거하는 전략적 구독 관리.**

## 개요

선택적 구독 패턴은 반응형 구독이 발생하기 전에 불필요한 구독을 제거하여 성능을 최적화하는 **사전 메모화 최적화 전략**을 나타냅니다. 비싼 메모화 체인을 관리하는 대신, 이 접근법은 반응형과 비반응형 데이터 접근 패턴 사이에서 전략적으로 선택하여, 시각적 업데이트가 React 리렌더링을 필요로 하지 않을 때 스토어를 반응형 상태 관리자에서 순수한 데이터 저장소로 변환합니다.

### 철학: 구독 최적화 우선

사실 후 메모화 기술로 최적화하는 대신, 선택적 구독 패턴은 성능 병목 현상을 그 근원에서 방지합니다:

```typescript
// ❌ 전통적 접근법: 반응형 + 메모화
const expensiveValue = useMemo(() => {
  return heavyCalculation(storeValue); // 여전히 구독 + 계산
}, [storeValue]);

// ✅ 선택적 접근법: 구독을 완전히 제거
const expensiveValue = useMemo(() => {
  return heavyCalculation(store.getValue()); // 구독 없음, 주문형만
}, []); // 빈 deps - 한 번 계산하거나 수동 새로고침
```

## 핵심 개념

### 1. 스토어를 데이터 저장소 패턴으로

스토어를 반응형 상태 관리자에서 순수 데이터 저장소로 변환:

```typescript
// 전통적 반응형 패턴
const position = useStoreValue(positionStore); // React 리렌더링 트리거

// 비반응형 데이터 저장소 패턴
const position = positionStore.getValue(); // 주문형 접근, 구독 없음
```

### 2. RefContext 직접 조작

React를 완전히 우회하는 시각적 업데이트를 위해 RefContext 사용:

```typescript
// RefContext 기반 시각적 업데이트 (60fps)
const updateCursorDirect = useCallback((x: number, y: number) => {
  const cursor = cursorRef.target;
  if (cursor) {
    cursor.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0)`;
  }
}, [cursorRef]);

// 데이터 지속성만을 위한 스토어
dispatch('updatePosition', { x, y, timestamp: Date.now() });
```

### 3. 조건부 구독 전략

사용 사례 요구사항에 따라 선택적 패턴 적용:

```typescript
// 고빈도 시각적 업데이트 → 비반응형 패턴
const canvasControl = useAdvancedCanvasControl();

// 저빈도 UI 업데이트 → 반응형 패턴  
const metrics = useStoreValue(metricsStore);

// 디버깅/관리용 수동 새로고침 → 수동 패턴
const debugData = storeManager.dumpAllStoreData();
```

## 구현 패턴

### 패턴 1: 비반응형 캔버스 제어

고성능 그래픽과 애니메이션용:

```typescript
export function useAdvancedCanvasControl() {
  const dispatch = useMouseAction();
  const storeData = useStoreDataAccess(); // 비반응형 접근
  
  // RefContext 참조
  const cursorRef = useMouseRef('cursor');
  const pathSvgRef = useMouseRef('pathSvg');
  
  // 직접 DOM 조작 (React 리렌더링 없음)
  const updatePathDirect = useCallback((newPoint: {x: number, y: number}) => {
    const pathSvg = pathSvgRef.target;
    if (!pathSvg) return;
    
    // SVG 직접 업데이트
    const pathData = pathPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    
    pathSvg.setAttribute('d', pathData);
  }, [pathSvgRef]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    
    // 즉시 시각적 업데이트 (RefContext)
    updatePathDirect({ x, y });
    
    // 데이터 지속성 (스토어)
    dispatch('updatePosition', { x, y, timestamp: Date.now() });
  }, [updatePathDirect, dispatch]);
  
  return { handleMouseMove, /* ... */ };
}
```

### 패턴 2: 선택적 메트릭 구독

성능 대시보드와 디버깅용:

```typescript
export function useSelectiveMetrics() {
  // 필수 메트릭만 구독
  const computedStore = useMouseStore('computed');
  const computed = useStoreValue(computedStore);
  
  // 자세한 디버깅용 비반응형 접근
  const storeAccess = useStoreDataAccess();
  
  const refreshDetailedMetrics = useCallback(() => {
    // 구독 없는 수동 새로고침
    return {
      position: storeAccess.getCurrentPosition(),
      movement: storeAccess.getCurrentMovement(),
      clicks: storeAccess.getCurrentClicks(),
      timestamp: Date.now()
    };
  }, [storeAccess]);
  
  return {
    // UI 표시용 반응형
    computed,
    // 자세한 분석용 수동
    refreshDetailedMetrics
  };
}
```

### 패턴 3: 하이브리드 아키텍처 토글

비교 성능 테스트용:

```typescript
export function EnhancedContextStorePage() {
  const [isNonReactive, setIsNonReactive] = useState(false);
  
  return (
    <MouseEventsModelProvider>
      {isNonReactive ? (
        <NonReactiveView />  // 순수 RefContext + getValue()
      ) : (
        <ReactiveView />     // 전통적 useStoreValue()
      )}
    </MouseEventsModelProvider>
  );
}
```

## 스토어 데이터 접근 패턴

### 비반응형 스토어 접근 훅

```typescript
export function useStoreDataAccess() {
  const positionStore = useMouseStore('position');
  const movementStore = useMouseStore('movement');
  const clicksStore = useMouseStore('clicks');
  
  // useStoreValue() 구독 없음 - 순수 데이터 접근
  const getCurrentPosition = useCallback(() => positionStore.getValue(), [positionStore]);
  const getCurrentMovement = useCallback(() => movementStore.getValue(), [movementStore]);
  const getCurrentClicks = useCallback(() => clicksStore.getValue(), [clicksStore]);
  
  const dumpAllStoreData = useCallback(() => ({
    position: getCurrentPosition(),
    movement: getCurrentMovement(),
    clicks: getCurrentClicks(),
    timestamp: Date.now()
  }), [getCurrentPosition, getCurrentMovement, getCurrentClicks]);
  
  return {
    // 개별 스토어 접근
    getCurrentPosition,
    getCurrentMovement, 
    getCurrentClicks,
    // 대량 접근
    dumpAllStoreData,
    // 고급 사용을 위한 스토어 참조
    stores: { positionStore, movementStore, clicksStore }
  };
}
```

## 성능 비교

### 전통적 반응형 패턴

```typescript
// ❌ 모든 위치 변경이 React 리렌더링을 트리거
const position = useStoreValue(positionStore);
const movement = useStoreValue(movementStore);

useEffect(() => {
  // React 리렌더링을 통한 캔버스 업데이트
  updateCanvas(position, movement);
}, [position, movement]);
```

**영향**: 마우스 추적을 위해 초당 ~60회 React 리렌더링

### 비반응형 선택적 패턴

```typescript
// ✅ 시각적 업데이트를 위한 React 리렌더링 없음
const handleMouseMove = useCallback((e) => {
  // 직접 DOM 업데이트 (60fps)
  updateCanvasDirect(e.clientX, e.clientY);
  
  // 스토어 업데이트 (30fps로 스로틀링)
  throttledDispatch('updatePosition', { x: e.clientX, y: e.clientY });
}, []);
```

**영향**: 0회 React 리렌더링 + 60fps GPU 가속 시각화

## 아키텍처 가이드라인

### 비반응형 패턴을 사용해야 하는 경우

1. **고빈도 시각적 업데이트** (애니메이션, 실시간 그래픽)
2. **성능 중요 상호작용** (게임, 그리기 앱)
3. **대규모 데이터 시각화** (차트, 대시보드)
4. **메모리 제약 환경** (모바일, 임베디드)

### 반응형 패턴을 사용해야 하는 경우

1. **폼 상태 관리** (사용자 입력, 유효성 검사)
2. **UI 컴포넌트 상태** (모달, 드롭다운, 토글)
3. **비즈니스 로직 상태** (사용자 프로필, 설정)
4. **저빈도 업데이트** (알림, 상태 메시지)

### 수동 패턴을 사용해야 하는 경우

1. **디버깅 및 개발** (스토어 검사, 로깅)
2. **관리자 인터페이스** (시스템 모니터링, 분석)
3. **배치 작업** (데이터 내보내기, 대량 업데이트)
4. **성능 프로파일링** (메트릭 수집, 벤치마킹)

## 모범 사례

### 1. 명확한 패턴 분리

```typescript
// ✅ 명확한 패턴 표시
function useReactiveUserProfile() { /* 반응형 패턴 */ }
function useNonReactiveCanvas() { /* 비반응형 패턴 */ }
function useManualMetrics() { /* 수동 패턴 */ }

// ❌ 같은 훅에서 혼합 패턴
function useConfusingPattern() { /* 불명확한 의도 */ }
```

### 2. 성능 모니터링

```typescript
const performanceMetrics = {
  reactiveSubscriptions: 0,
  nonReactiveAccesses: 0,
  manualRefreshes: 0,
  renderCount: 0
};
```

### 3. 패턴 선택 문서화

```typescript
/**
 * 캔버스 제어 훅 - 비반응형 패턴
 * 
 * 60fps 성능을 달성하기 위해 RefContext를 사용한 직접 DOM 조작.
 * React 리렌더링을 방지하기 위해 스토어 구독 제거.
 * 
 * 성능: 0회 React 리렌더링, GPU 가속 애니메이션
 */
export function useAdvancedCanvasControl() { /* ... */ }
```

## 문제 해결

### 일반적인 문제와 해결책

자세한 디버깅 지침은 [성능 문제 해결](../troubleshooting/performance-issues.md#selective-subscription-patterns)을 참조하세요.

### 메모리 관리

```typescript
// ✅ 비반응형 패턴에서 적절한 정리
useEffect(() => {
  return () => {
    // RAF 콜백 정리
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // 스로틀링된 함수 정리
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
  };
}, []);
```

## 관련 패턴

- [RefContext 가이드](./react-refs-guide.md) - 직접 DOM 조작 패턴
- [스토어 패턴](./pattern-guide.md#store-patterns) - 전통적 반응형 패턴
- [성능 최적화](../guide/best-practices.md#performance-optimization) - 일반 성능 가이드라인
- [MVVM 아키텍처](./mvvm-core-architecture.md) - 아키텍처 컨텍스트

## 예제

완전한 구현 예제는 다음을 참조하세요:

- [향상된 컨텍스트 스토어 데모](../../example/src/pages/performance/mouse-events/enhanced-context-store/) - 프로덕션 예제
- [캔버스 성능 비교](../examples/selective-subscription.md) - 벤치마킹 예제
- [아키텍처 토글 구현](../examples/pattern-comparison.md) - 하이브리드 패턴

---

**참고**: 선택적 구독 패턴은 고급 최적화 기술을 나타냅니다. 전통적 반응형 패턴으로 시작하고 성능 프로파일링에서 명확한 이점을 나타낼 때만 선택적 패턴으로 마이그레이션하세요.