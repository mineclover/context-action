# RefContext 마운트 상태 구독

RefContext는 이제 마운트 상태 변경에 대한 반응형 구독 기능을 제공하여, 컴포넌트가 React 리렌더링으로 마운팅/언마운팅 이벤트에 응답할 수 있게 합니다.

## 개요

RefContext의 전통적인 `isMounted` 속성은 지연 평가를 사용하여 리렌더링을 발생시키지 않고 최신 상태를 제공하지만, 새로운 구독 훅은 컴포넌트가 마운트 상태 변경에 응답해야 할 때 반응형 패턴을 가능하게 합니다.

## 사용 가능한 구독 훅

### 1. `useRefMountState(refName)`

마운트 상태 변경을 구독하고 상태가 변경될 때 리렌더링을 트리거합니다.

```typescript
const { isMounted, isWaitingForMount, mountedTarget } = MyRefContext.useRefMountState('myElement');

// 이 값들은 변경될 때 리렌더링을 트리거합니다
useEffect(() => {
  if (isMounted) {
    console.log('Element is now mounted!');
  }
}, [isMounted]); // ✅ 이제 마운트 상태 변경에 반응합니다!
```

**반환값:**
- `isMounted`: boolean - 엘리먼트가 현재 마운트되어 있는지 여부
- `isWaitingForMount`: boolean - 마운트를 기다리고 있는지 여부
- `mountedTarget`: T | null - 실제 마운트된 엘리먼트 (또는 null)

### 2. `useOnMountStateChange(refName, callback)`

마운트 상태가 변경될 때마다 콜백을 실행합니다.

```typescript
MyRefContext.useOnMountStateChange('myElement', (mounted, target) => {
  console.log('Mount state changed:', { mounted, target });
  
  if (mounted && target) {
    // 엘리먼트가 방금 마운트됨
    target.style.backgroundColor = 'green';
  } else {
    // 엘리먼트가 언마운트됨
    console.log('Element unmounted');
  }
});
```

### 3. `useRefMountChecker(refName)`

현재 마운트 상태를 확인하는 안정적인 함수를 반환합니다 (이벤트 핸들러에서 유용).

```typescript
const checkMountState = MyRefContext.useRefMountChecker('myElement');

const handleClick = useCallback(() => {
  const { isMounted, target } = checkMountState();
  
  if (isMounted && target) {
    // DOM을 안전하게 조작
    target.style.transform = 'scale(0.95)';
  }
}, [checkMountState]);
```

## 사용 패턴

### 패턴 1: 반응형 마운트 상태 표시

```typescript
function MountStatusDisplay() {
  // 마운트 상태 변경을 구독
  const containerState = MyRefContext.useRefMountState('container');
  const buttonState = MyRefContext.useRefMountState('button');
  
  return (
    <div>
      <p>Container: {containerState.isMounted ? '✅ 마운트됨' : '❌ 마운트되지 않음'}</p>
      <p>Button: {buttonState.isMounted ? '✅ 마운트됨' : '❌ 마운트되지 않음'}</p>
      
      {containerState.isWaitingForMount && <p>⏳ 컨테이너 기다리는 중...</p>}
      
      <button disabled={!containerState.isMounted || !buttonState.isMounted}>
        {containerState.isMounted && buttonState.isMounted ? '준비!' : '대기 중...'}
      </button>
    </div>
  );
}
```

### 패턴 2: 마운트 기반 이펙트 실행

```typescript
function MountAwareComponent() {
  const canvasState = MyRefContext.useRefMountState('canvas');
  
  // 마운트 상태가 변경될 때 이펙트 실행
  useEffect(() => {
    if (canvasState.isMounted && canvasState.mountedTarget) {
      // 캔버스가 마운트될 때 초기화
      const ctx = canvasState.mountedTarget.getContext('2d');
      initializeCanvas(ctx);
      
      return () => {
        // 언마운트될 때 정리
        cleanupCanvas();
      };
    }
  }, [canvasState.isMounted, canvasState.mountedTarget]);
}
```

### 패턴 3: 이벤트 핸들러 안전성 확인

```typescript
function SafeEventHandlers() {
  const elementChecker = MyRefContext.useRefMountChecker('element');
  
  const handleInteraction = useCallback(() => {
    const { isMounted, target } = elementChecker();
    
    // 상호작용 시점에서 현재 상태를 항상 가져옴
    if (isMounted && target) {
      target.style.transform = 'translateY(-2px)';
      
      // 비동기 작업 후 다시 확인
      setTimeout(() => {
        const currentState = elementChecker();
        if (currentState.isMounted && currentState.target) {
          currentState.target.style.transform = '';
        }
      }, 200);
    }
  }, [elementChecker]);
  
  return <button onClick={handleInteraction}>애니메이션</button>;
}
```

## 비교: 지연 평가 vs 반응형 구독

### 전통적 방식 (지연 평가) - 리렌더링 없음

```typescript
function NonReactivePattern() {
  const element = MyRefContext.useRefHandler('element');
  
  // ❌ 이 useEffect는 마운트 상태 변경 시 실행되지 않습니다
  useEffect(() => {
    console.log('Mount state:', element.isMounted); // 항상 최신이지만 리렌더링 없음
  }, [element.isMounted]); // 리렌더링을 트리거하지 않음
  
  // ✅ 현재 상태를 위해 이벤트 핸들러에서 사용
  const handleClick = () => {
    if (element.isMounted && element.target) {
      element.target.style.color = 'blue'; // 항상 올바르게 작동
    }
  };
}
```

### 새로운 방식 (반응형 구독) - 리렌더링 트리거

```typescript
function ReactivePattern() {
  // ✅ 이것은 마운트 상태 변경 시 리렌더링을 트리거합니다
  const elementState = MyRefContext.useRefMountState('element');
  
  useEffect(() => {
    console.log('Mount state changed:', elementState.isMounted);
    // 마운트 상태가 변경될 때마다 실행됩니다!
  }, [elementState.isMounted]);
  
  return (
    <div>
      상태: {elementState.isMounted ? '마운트됨' : '마운트되지 않음'}
      {elementState.isWaitingForMount && <span> (대기 중...)</span>}
    </div>
  );
}
```

## 각 패턴을 사용해야 하는 경우

### 지연 평가 (전통적) 사용 시기:
- ✅ 선택적 구독 패턴 구축 (리렌더링 없음)
- ✅ 고성능 직접 DOM 조작
- ✅ 현재 상태를 확인하는 이벤트 핸들러
- ✅ 최대 성능을 위한 비반응형 패턴

### 반응형 구독 (새로운 방식) 사용 시기:
- ✅ UI가 마운트 상태 변경을 반영해야 하는 경우
- ✅ 컴포넌트가 마운팅/언마운팅에 반응해야 하는 경우
- ✅ 마운트 상태에 기반한 조건부 렌더링
- ✅ 엘리먼트가 사용 가능해질 때 이펙트 트리거

## 선택적 구독 패턴과의 통합

새로운 구독 훅은 선택적 구독 패턴과 매끄럽게 작동합니다:

```typescript
function HybridPattern() {
  // UI 상태용 반응형
  const containerState = MyRefContext.useRefMountState('container');
  
  // 직접 DOM 조작용 비반응형
  const container = MyRefContext.useRefHandler('container');
  
  // UI는 마운트 상태에 반응
  const statusMessage = containerState.isMounted ? '준비' : '로딩 중...';
  
  // 직접 DOM 조작 (리렌더링 없음)
  const updateVisuals = useCallback((x: number, y: number) => {
    if (container.isMounted && container.target) {
      container.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [container]);
  
  return (
    <div>
      <p>{statusMessage}</p>
      <button disabled={!containerState.isMounted} onClick={() => updateVisuals(10, 10)}>
        위치 업데이트
      </button>
    </div>
  );
}
```

## 성능 고려사항

- **반응형 구독**: 마운트 상태 변경 시 React 리렌더링 트리거
- **지연 평가**: 리렌더링 없음, 항상 현재 상태
- **마운트 체커**: 안정적인 함수, 리렌더링 없음, 요청 시 현재 상태

반응형 UI 업데이트가 필요한지 또는 직접 DOM 조작으로 최대 성능이 필요한지에 따라 적절한 패턴을 선택하세요.

## TypeScript 지원

모든 구독 훅은 완전히 타입 안전합니다:

```typescript
interface MyRefs {
  canvas: HTMLCanvasElement;
  button: HTMLButtonElement;
  container: HTMLDivElement;
}

const MyRefContext = createRefContext<MyRefs>('MyRefs');

// 타입 안전한 마운트 상태 구독
const canvasState = MyRefContext.useRefMountState('canvas');
// canvasState.mountedTarget은 HTMLCanvasElement | null

const buttonChecker = MyRefContext.useRefMountChecker('button');
// buttonChecker()는 { isMounted: boolean, target: HTMLButtonElement | null, ... }를 반환
```

## 마이그레이션 가이드

### 수동 상태 추적에서

```typescript
// ❌ 이전: 수동 마운트 상태 추적
function OldPattern() {
  const [isMounted, setIsMounted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (elementRef.current) {
      setIsMounted(true);
      return () => setIsMounted(false);
    }
  }, []);
}

// ✅ 이후: RefContext 마운트 구독 사용
function NewPattern() {
  const elementState = MyRefContext.useRefMountState('element');
  // 적절한 정리와 함께 자동으로 마운트 상태 추적
}
```

### useEffect + ref 확인에서

```typescript
// ❌ 이전: 수동 ref 확인
function OldPattern() {
  const element = MyRefContext.useRefHandler('element');
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (element.target) {
        // 무언가 수행
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
}

// ✅ 이후: 실제 마운트 상태 변경에 반응
function NewPattern() {
  const elementState = MyRefContext.useRefMountState('element');
  
  useEffect(() => {
    if (elementState.isMounted && elementState.mountedTarget) {
      // 엘리먼트가 사용 가능해질 때 정확히 실행
    }
  }, [elementState.isMounted, elementState.mountedTarget]);
}
```