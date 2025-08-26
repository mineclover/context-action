# React Refs 가이드

Context-Action의 RefContext는 제로 React 리렌더링으로 고성능 DOM 조작과 타임아웃 기반 안전한 ref 대기를 위한 현대적 접근법을 제공합니다.

## RefContext란 무엇인가요?

RefContext는 React 상태 업데이트를 거치지 않고 DOM 요소에 직접 접근하고 조작할 수 있게 해주는 고성능 패턴입니다. 이는 실시간 인터랙션, 애니메이션, 캔버스 작업과 같이 60fps 성능이 중요한 시나리오에서 완벽합니다.

### 주요 특징

- **제로 리렌더링**: DOM 업데이트가 React 리렌더링을 발생시키지 않음
- **타입 안전성**: 완전한 TypeScript 지원으로 엄격한 타입 검사
- **하드웨어 가속**: GPU 가속을 위한 `translate3d()` 변환 내장
- **분리된 비즈니스 로직**: DOM 조작과 비즈니스 로직의 깔끔한 분리
- **타임아웃 보호**: 자동 1초 기본 타임아웃으로 무한 대기 방지
- **유연한 타임아웃**: 첫 번째 파라미터로 커스텀 타임아웃 설정 가능

## 기본 사용법

### 간단한 RefContext 생성

```tsx
import { createRefContext } from '@context-action/react';

// 1. Ref 타입 정의
type MouseRefs = {
  cursor: HTMLDivElement;
  container: HTMLDivElement;
  trail: HTMLDivElement;
};

// 2. RefContext 생성 (구조분해 API 사용)
const {
  Provider: MouseProvider,
  useRefHandler: useMouseRef
} = createRefContext<MouseRefs>('Mouse');
```

### 컴포넌트에서 사용

```tsx
function MouseTracker() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  const container = useMouseRef('container');
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 직접 DOM 조작 - 리렌더링 없음!
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
    }
  }, [cursor, trail, container]);
  
  return (
    <div ref={container.setRef} onMouseMove={handleMouseMove}>
      <div ref={cursor.setRef} className="cursor" />
      <div ref={trail.setRef} className="trail" />
    </div>
  );
}
```

## 실제 예시: 마우스 이벤트 처리

다음은 관심사 분리를 보여주는 완전한 마우스 추적 시스템입니다:

```tsx
import React, { useCallback, useRef } from 'react';
import { createRefContext } from '@context-action/react';

// 타입 정의
type MouseRefs = {
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  container: HTMLDivElement;
  info: HTMLDivElement;
};

type MousePosition = {
  x: number;
  y: number;
  timestamp: number;
};

// RefContext 생성
const {
  Provider: MouseProvider,
  useRefHandler: useMouseRef
} = createRefContext<MouseRefs>('Mouse');

// 1. Provider 설정
export function App() {
  return (
    <MouseProvider>
      <MouseTrackingDemo />
    </MouseProvider>
  );
}

// 2. 비즈니스 로직 분리
function useMouseTracking() {
  const positionHistory = useRef<MousePosition[]>([]);
  
  const addPosition = useCallback((x: number, y: number) => {
    const position: MousePosition = { x, y, timestamp: Date.now() };
    positionHistory.current.push(position);
    
    // 최근 50개 위치만 유지
    if (positionHistory.current.length > 50) {
      positionHistory.current.shift();
    }
    
    return position;
  }, []);
  
  const getVelocity = useCallback(() => {
    const history = positionHistory.current;
    if (history.length < 2) return 0;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    const distance = Math.sqrt(
      (latest.x - previous.x) ** 2 + (latest.y - previous.y) ** 2
    );
    const timeDiff = latest.timestamp - previous.timestamp;
    
    return timeDiff > 0 ? distance / timeDiff : 0;
  }, []);
  
  return { addPosition, getVelocity, positionHistory };
}

// 3. DOM 조작 로직 분리
function useMouseRenderer() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  const info = useMouseRef('info');
  
  const updateCursorPosition = useCallback((x: number, y: number) => {
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [cursor]);
  
  const updateTrailPosition = useCallback((x: number, y: number, opacity: number = 0.7) => {
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
      trail.target.style.opacity = opacity.toString();
    }
  }, [trail]);
  
  const updateInfo = useCallback((text: string) => {
    if (info.target) {
      info.target.textContent = text;
    }
  }, [info]);
  
  return { updateCursorPosition, updateTrailPosition, updateInfo };
}

// 4. 메인 컴포넌트
function MouseTrackingDemo() {
  const container = useMouseRef('container');
  const { addPosition, getVelocity } = useMouseTracking();
  const { updateCursorPosition, updateTrailPosition, updateInfo } = useMouseRenderer();
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 비즈니스 로직 실행
    addPosition(x, y);
    const velocity = getVelocity();
    
    // DOM 업데이트 - 제로 리렌더링!
    updateCursorPosition(x, y);
    updateTrailPosition(x, y);
    updateInfo(`위치: (${Math.round(x)}, ${Math.round(y)}) | 속도: ${velocity.toFixed(2)}`);
  }, [container, addPosition, getVelocity, updateCursorPosition, updateTrailPosition, updateInfo]);
  
  return (
    <div className="mouse-demo">
      <div 
        ref={container.setRef}
        onMouseMove={handleMouseMove}
        className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden cursor-none"
      >
        {/* 커서 요소 */}
        <div
          ref={useMouseRef('cursor').setRef}
          className="absolute w-6 h-6 bg-blue-500 rounded-full pointer-events-none shadow-lg"
          style={{ transform: 'translate3d(-50%, -50%, 0)' }}
        />
        
        {/* 트레일 요소 */}
        <div
          ref={useMouseRef('trail').setRef}
          className="absolute w-4 h-4 bg-blue-300 rounded-full pointer-events-none"
          style={{ transform: 'translate3d(-50%, -50%, 0)', opacity: 0 }}
        />
        
        {/* 정보 표시 */}
        <div
          ref={useMouseRef('info').setRef}
          className="absolute top-4 left-4 text-sm text-gray-600 font-mono"
        >
          마우스를 이동해보세요
        </div>
      </div>
      
      <div className="mt-4 text-center text-gray-600">
        <p>이 예시는 <strong>제로 React 리렌더링</strong>으로 실시간 마우스 추적을 보여줍니다</p>
        <p>모든 DOM 업데이트는 직접적이며 React 상태를 거치지 않습니다</p>
      </div>
    </div>
  );
}
```

## 고급 패턴

### Ref 대기 및 검증

```tsx
import { useWaitForRefs } from '@context-action/react';

function AdvancedComponent() {
  const element = useMouseRef('cursor');
  const { allRefsReady, waitForRefs } = useWaitForRefs(['cursor', 'container']);
  
  const performComplexOperation = useCallback(async () => {
    // 모든 ref가 준비될 때까지 대기
    await waitForRefs();
    
    if (element.target) {
      // 안전한 DOM 조작
      element.target.style.transform = 'scale(1.2)';
    }
  }, [element, waitForRefs]);
  
  if (!allRefsReady) {
    return <div>Refs 로딩 중...</div>;
  }
  
  return (
    <div>
      <div ref={element.setRef}>준비완료!</div>
      <button onClick={performComplexOperation}>애니메이션 실행</button>
    </div>
  );
}
```

### 성능 최적화 패턴

```tsx
function PerformanceOptimizedComponent() {
  const element = useMouseRef('target');
  
  const startAnimation = useCallback(() => {
    if (!element.target) return;
    
    // GPU 레이어 생성을 위한 will-change 설정
    element.target.style.willChange = 'transform';
    
    let frame: number;
    const animate = () => {
      if (element.target) {
        const time = Date.now() * 0.001;
        const x = Math.sin(time) * 100;
        const y = Math.cos(time) * 100;
        
        // 하드웨어 가속 변환
        element.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    
    // 10초 후 정리
    setTimeout(() => {
      cancelAnimationFrame(frame);
      if (element.target) {
        element.target.style.willChange = ''; // 메모리 정리
      }
    }, 10000);
  }, [element]);
  
  return (
    <div>
      <div 
        ref={element.setRef}
        className="w-10 h-10 bg-red-500 rounded-full"
        style={{ transform: 'translate3d(0, 0, 0)' }} // 초기 GPU 레이어
      />
      <button onClick={startAnimation}>애니메이션 시작</button>
    </div>
  );
}
```

### 메모이제이션과 지연 평가

RefContext의 속성들(`isMounted`, `isWaitingForMount`, `target`)은 **지연 평가(lazy evaluation)**를 사용하여 항상 최신 상태를 반환합니다. 이는 React의 메모이제이션 패턴과 함께 사용될 때도 예상대로 동작합니다.

```tsx
function MemoizationTestComponent() {
  const element = useDemoRef('element');
  
  // 빈 deps 배열이지만 항상 최신 값을 반환
  const memoizedCheck = useCallback(() => {
    return {
      isMounted: element.isMounted,       // 항상 최신 상태
      isWaiting: element.isWaitingForMount, // 항상 최신 상태
      hasTarget: !!element.target         // 항상 최신 상태
    };
  }, []); // 빈 deps - 함수 자체는 재생성되지 않음
  
  // useMemo로 포착된 객체 vs 직접 접근 테스트
  const capturedElement = useMemo(() => element, []); // 최초 렌더링 시점에 포착
  
  const testCapturedVsDirect = useCallback(() => {
    console.log('직접 접근:', element.isMounted);
    console.log('포착된 객체:', capturedElement.isMounted); // 동일한 값!
    // 둘 다 같은 값을 반환 (지연 평가 덕분)
  }, [element, capturedElement]);
  
  return (
    <div>
      <div ref={element.setRef}>테스트 요소</div>
      <button onClick={testCapturedVsDirect}>
        메모이제이션 테스트
      </button>
    </div>
  );
}
```

**핵심 원리:**
- RefContext 속성들은 **getter 함수**로 구현되어 있습니다
- 호출 시점에 실제 상태를 계산하여 반환합니다
- 메모이제이션된 함수 내에서도 항상 최신 값을 제공합니다
- React의 의존성 배열에 ref 객체를 포함할 필요가 없습니다

```tsx
// ✅ 올바른 사용법 - deps 배열이 비어있어도 최신 값 보장
const checkMount = useCallback(() => {
  return element.isMounted; // 항상 최신 상태
}, []);

// ❌ 불필요한 패턴 - element를 deps에 포함할 필요 없음
const checkMount = useCallback(() => {
  return element.isMounted;
}, [element]); // element 객체는 변하지 않으므로 불필요
```

**실제 활용 예시:**
```tsx
function OptimizedInteraction() {
  const button = useMouseRef('button');
  
  // 성능 최적화된 이벤트 핸들러 (메모이제이션 + 지연 평가)
  const handleClick = useCallback(() => {
    // 클릭 시점에 마운트 상태 확인 (항상 최신)
    if (button.isMounted && button.target) {
      button.target.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        // 타이머 실행 시점에도 최신 상태 확인
        if (button.isMounted && button.target) {
          button.target.style.transform = '';
        }
      }, 150);
    }
  }, []); // 빈 deps 배열로 성능 최적화
  
  return <button ref={button.setRef} onClick={handleClick}>
    클릭해보세요
  </button>;
}
```

## 패턴 통합

### Actions + Stores + RefContext

```tsx
// RefContext와 다른 패턴들의 조합
function IntegratedExample() {
  // 액션으로 비즈니스 로직 처리
  const dispatch = useEventAction();
  
  // 스토어에서 상태 읽기
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore);
  
  // RefContext로 고성능 DOM 조작
  const status = useMouseRef('status');
  
  useEventActionHandler('userAction', useCallback((payload) => {
    // 비즈니스 로직 실행
    console.log('액션 처리됨:', payload);
    
    // DOM 직접 업데이트
    if (status.target) {
      status.target.textContent = `${user.name}님의 액션 처리됨`;
      status.target.style.color = 'green';
    }
  }, [status, user.name]));
  
  return (
    <div>
      <div ref={status.setRef}>상태 대기중...</div>
      <button onClick={() => dispatch('userAction', { data: 'test' })}>
        액션 실행
      </button>
    </div>
  );
}
```

## 모범 사례

### 1. 항상 Ref 존재 확인

```tsx
// ✅ 올바름
const handleUpdate = useCallback(() => {
  if (element.target) {
    element.target.style.transform = 'scale(1.1)';
  }
}, [element]);

// ❌ 잘못됨
const handleUpdate = useCallback(() => {
  element.target.style.transform = 'scale(1.1)'; // 에러 가능성
}, [element]);
```

### 2. GPU 가속 사용

```tsx
// ✅ 올바름 - GPU 가속
element.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;

// ❌ 잘못됨 - CPU만 사용
element.target.style.left = `${x}px`;
element.target.style.top = `${y}px`;
```

### 3. 메모리 정리

```tsx
useEffect(() => {
  return () => {
    // 애니메이션 정리
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    // will-change 정리
    if (element.target) {
      element.target.style.willChange = '';
    }
  };
}, [element]);
```

### 4. 비즈니스 로직과 DOM 조작 분리

```tsx
// ✅ 올바름 - 관심사 분리
function useMouseLogic() {
  // 비즈니스 로직만
  const calculatePosition = useCallback((x, y) => {
    return { adjustedX: x * 0.8, adjustedY: y * 0.8 };
  }, []);
  
  return { calculatePosition };
}

function useMouseRenderer() {
  // DOM 조작만
  const element = useMouseRef('cursor');
  
  const updatePosition = useCallback((x, y) => {
    if (element.target) {
      element.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [element]);
  
  return { updatePosition };
}
```

## waitForRefs 제한사항 및 실용적 대안

### ⚠️ waitForRefs의 주요 문제점

`waitForRefs`는 블러킹 방식으로 동작하여 실제 프로덕션 환경에서는 매우 제한적입니다:

```typescript
// ❌ 문제가 있는 패턴 - UI 완전 정지
const handleClick = async () => {
  await waitForRefs('element'); // UI가 멈춤!
  element.target?.doSomething();
};
```

**주요 문제점들:**
- **UI 완전 정지**: 전체 인터페이스가 응답하지 않음
- **예측 불가능한 대기 시간**: 언제 마운트될지 알 수 없음
- **사용자 경험 저해**: 반응성 없는 인터페이스
- **에러 핸들링 복잡**: 타임아웃 상황 처리 어려움

### 🚀 실용적인 대안 패턴들

#### 1. 조건부 실행 패턴 (권장)

가장 실용적이고 안전한 패턴입니다:

```typescript
// ✅ 권장 패턴 - 조건부 실행
const handleAction = () => {
  if (interactiveElement.isMounted) {
    // 즉시 실행
    interactiveElement.target?.doSomething();
  } else if (interactiveElement.isWaitingForMount) {
    // 대기 중임을 사용자에게 표시
    showMessage('요소 준비 중입니다...');
  } else {
    // 사용자에게 명확한 안내
    showMessage('먼저 요소를 마운트해주세요');
  }
};
```

#### 2. 콜백 기반 실행 패턴

완전히 비블러킹으로 동작합니다:

```typescript
// ✅ 콜백 패턴 - 완전 비블러킹
const handleAsyncAction = () => {
  const polling = refPolling('element', {
    interval: 100,
    timeout: 3000,
    onTick: (elapsed) => {
      updateProgress(`대기 중... ${elapsed}ms`);
    },
    onSuccess: (elapsed, element) => {
      element.doSomething();
      showMessage('작업 완료!');
    },
    onTimeout: () => {
      showMessage('요소를 찾을 수 없습니다');
    }
  });
  
  // UI는 계속 반응함
  showMessage('작업 시작, 다른 작업도 가능합니다');
};
```

#### 3. React 상태 기반 반응형 패턴

React의 선언적 특성을 활용합니다:

```typescript
// ✅ 반응형 패턴 - React 상태 활용
const ActionButton = () => {
  const element = useDemoRef('element');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleAction = () => {
    if (element.isMounted && !isProcessing) {
      setIsProcessing(true);
      element.target?.doSomething();
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };
  
  return (
    <button 
      onClick={handleAction}
      disabled={!element.isMounted || isProcessing}
    >
      {!element.isMounted ? '요소 대기 중' : 
       isProcessing ? '처리 중...' : '실행'}
    </button>
  );
};
```

#### 4. useEffect 기반 자동 실행 패턴

마운트 감지 시 자동으로 실행됩니다:

```typescript
// ✅ 자동 실행 패턴 - useEffect 활용
const AutoExecuteComponent = () => {
  const element = useDemoRef('element');
  
  useEffect(() => {
    if (element.isMounted && element.target) {
      // 마운트 즉시 자동 실행
      element.target.doSomething();
    }
  }, [element.isMounted, element.target]);
  
  return <div>자동 실행 컴포넌트</div>;
};
```

### 📋 패턴 선택 가이드

| 패턴 | 사용 시기 | 장점 | 단점 |
|------|----------|------|------|
| 조건부 실행 | 일반적인 UI 인터랙션 | 간단, 안전, 직관적 | 마운트 대기 시 사용자 대기 |
| 콜백 기반 | 비동기 작업, 백그라운드 처리 | 완전 비블러킹, 진행 상황 표시 가능 | 코드 복잡도 증가 |
| React 상태 | 상태 기반 UI 업데이트 | 선언적, React 패러다임 일치 | React 리렌더링 발생 |
| useEffect | 자동화된 반응 | 자동 실행, 깔끔한 코드 | 과도한 자동 실행 위험 |

### 🎯 권장 사용법

1. **일반적인 경우**: 조건부 실행 패턴 사용
2. **백그라운드 작업**: 콜백 기반 패턴 사용
3. **UI 상태 관리**: React 상태 기반 패턴 사용
4. **자동화 필요**: useEffect 기반 패턴 사용
5. **waitForRefs**: 테스트, 초기화 로직에만 제한적 사용

## 언제 RefContext를 사용할까요?

### ✅ 적합한 경우:
- 실시간 마우스/터치 인터랙션
- 60fps 애니메이션
- 캔버스 조작
- 드래그 앤 드롭
- 게임 UI 요소
- 미디어 플레이어 컨트롤

### ❌ 부적합한 경우:
- 간단한 상태 표시
- 폼 입력 처리
- 목록 렌더링
- 일반적인 UI 상태 관리

RefContext는 성능이 중요한 특정 사용 사례를 위한 강력한 도구입니다. 하지만 `waitForRefs`의 블러킹 문제를 고려하여 실용적인 대안 패턴들을 우선 고려하시기 바랍니다.