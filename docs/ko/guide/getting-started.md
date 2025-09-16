# 시작하기

Context-Action은 완벽한 관심사 분리를 통한 확장 가능한 React 애플리케이션 구축을 위한 핵심 패턴들을 제공합니다.

## 빠른 시작

사용 사례에 맞는 적합한 패턴을 선택하세요:

| 패턴 | 사용 사례 | 임포트 | 최적용도 |
|---------|----------|--------|----------|
| **🎯 Action Only** | 스토어 없이 액션 디스패칭 | `createActionContext` | 이벤트 시스템, 커맨드 패턴 |
| **🏪 Store Only** | 액션 없이 상태 관리 | `createStoreContext` | 순수 상태 관리, 데이터 레이어 |
| **🔧 Ref Context** *(고급)* | 제로 리렌더링 직접 DOM 조작 | `createRefContext` | 고성능 UI, 애니메이션, 실시간 인터랙션 |

## 🎯 Action Only 패턴

상태 관리 없이 순수 액션 디스패칭.

### 기본 사용법
```tsx
import { createActionContext } from '@context-action/react';

// 1. 액션 정의
interface EventActions {
  userClick: { x: number; y: number };
  analytics: { event: string; data: any };
}

// 2. 컨텍스트 생성
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

// 3. Provider 설정
function App() {
  return (
    <EventActionProvider>
      <InteractiveComponent />
    </EventActionProvider>
  );
}

// 4. 컴포넌트 사용
function InteractiveComponent() {
  const dispatch = useEventAction();
  
  useEventActionHandler('userClick', (payload) => {
    console.log('사용자가 클릭한 위치:', payload.x, payload.y);
  });
  
  const handleClick = (e: MouseEvent) => {
    dispatch('userClick', { x: e.clientX, y: e.clientY });
  };
  
  return <button onClick={handleClick}>클릭해주세요</button>;
}
```

## 🏪 Store Only 패턴

액션 디스패칭 없이 타입 안전한 상태 관리.

### 기본 사용법
```tsx
import { createStoreContext } from '@context-action/react';

// 1. 패턴 생성
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createStoreContext('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' } }
});

// 2. Provider 설정
function App() {
  return (
    <AppStoreProvider>
      <UserComponent />
    </AppStoreProvider>
  );
}

// 3. 컴포넌트 사용
function UserComponent() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  const { updateStore } = useAppStoreManager();
  
  const updateUser = (newUser: any) => {
    updateStore('user', newUser);
  };
  
  return (
    <div>
      <p>사용자: {user.name}</p>
      <button onClick={() => updateUser({ name: '홍길동', email: 'hong@example.com' })}>
        사용자 업데이트
      </button>
    </div>
  );
}
```

## 🔧 Ref Context 패턴

제로 React 리렌더링으로 고성능 직접 DOM 조작.

### 기본 사용법
```tsx
import React, { useCallback } from 'react';
import { createRefContext } from '@context-action/react';

// 1. Ref 구조 정의
type MouseRefs = {
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  container: HTMLDivElement;
};

// 2. RefContext 생성
const {
  Provider: MouseProvider,
  useRefHandler: useMouseRef
} = createRefContext<MouseRefs>('Mouse');

// 3. Provider 설정
function App() {
  return (
    <MouseProvider>
      <MouseTracker />
    </MouseProvider>
  );
}

// 4. 직접 DOM 조작을 사용한 컴포넌트
function MouseTracker() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  const container = useMouseRef('container');
  
  // 직접 DOM 조작 - 제로 React 리렌더링
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 하드웨어 가속 변환
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    // 트레일 효과 추가
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
      trail.target.style.opacity = '0.7';
    }
  }, [cursor, trail, container]);
  
  return (
    <div 
      ref={container.setRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-96 bg-gray-100"
    >
      {/* 커서 요소 */}
      <div
        ref={cursor.setRef}
        className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      
      {/* 트레일 요소 */}
      <div
        ref={trail.setRef}
        className="absolute w-3 h-3 bg-blue-300 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)', opacity: 0 }}
      />
    </div>
  );
}
```

### 비즈니스 로직을 포함한 고급 RefContext
```tsx
// 마우스 위치 관리를 위한 커스텀 훅
function useMousePositionUpdater() {
  const cursor = useMouseRef('cursor');
  const positionHistory = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);
  
  const updatePosition = useCallback((x: number, y: number) => {
    // 직접 DOM 조작
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    
    // 비즈니스 로직 - 위치 기록 추적
    positionHistory.current.push({ x, y, timestamp: Date.now() });
    
    // 최근 50개 위치만 유지
    if (positionHistory.current.length > 50) {
      positionHistory.current.shift();
    }
  }, [cursor]);
  
  const getVelocity = useCallback(() => {
    const history = positionHistory.current;
    if (history.length < 2) return 0;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    const distance = Math.sqrt(
      (latest.x - previous.x) ** 2 + (latest.y - previous.y) ** 2
    );
    const timeDiff = latest.timestamp - previous.timestamp;
    
    return distance / timeDiff;
  }, []);
  
  return { updatePosition, getVelocity };
}
```

## 패턴 조합

복잡한 애플리케이션의 경우, 핵심 패턴과 고급 패턴을 조합하여 사용:

```tsx
function ComplexApp() {
  return (
    <AppStoreProvider>
      <EventActionProvider>
        <MouseProvider>
          <MyComponent />
        </MouseProvider>
      </EventActionProvider>
    </AppStoreProvider>
  );
}
```

## 다음 단계

- [React Refs 가이드](../concept/react-refs-guide.md) - RefContext 패턴 심화 학습
- [패턴 가이드](../concept/pattern-guide.md) - 세 패턴의 예시와 함께 비교 분석
- [액션 파이프라인](./action-pipeline.md) - 액션 처리에 대해 알아보기
- [아키텍처](./architecture.md) - 전체 아키텍처 이해하기
- [훅](./hooks.md) - 사용 가능한 React 훅 살펴보기
- [모범 사례](./best-practices.md) - 권장 패턴 따르기

## 실제 예시

- **RefContext를 사용한 마우스 이벤트**: 예시 앱에서 RefContext 마우스 이벤트 데모 확인하기
- **스토어 통합**: 액션 핸들러와 스토어를 결합하는 방법 학습하기
- **성능 최적화**: 직접 DOM 조작으로 제로 리렌더링 패턴 확인하기