# React Refs 가이드

Context-Action의 RefContext는 제로 React 리렌더링으로 고성능 DOM 조작을 위한 현대적 접근법을 제공합니다.

## RefContext란 무엇인가요?

RefContext는 React 상태 업데이트를 거치지 않고 DOM 요소에 직접 접근하고 조작할 수 있게 해주는 고성능 패턴입니다. 이는 실시간 인터랙션, 애니메이션, 캔버스 작업과 같이 60fps 성능이 중요한 시나리오에서 완벽합니다.

### 주요 특징

- **제로 리렌더링**: DOM 업데이트가 React 리렌더링을 발생시키지 않음
- **타입 안전성**: 완전한 TypeScript 지원으로 엄격한 타입 검사
- **하드웨어 가속**: GPU 가속을 위한 `translate3d()` 변환 내장
- **분리된 비즈니스 로직**: DOM 조작과 비즈니스 로직의 깔끔한 분리

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

RefContext는 성능이 중요한 특정 사용 사례를 위한 강력한 도구입니다. 일반적인 React 상태 관리와 결합하면 고성능과 개발자 경험 모두를 달성할 수 있습니다.