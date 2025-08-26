# @context-action/react 패턴 가이드

@context-action/react 프레임워크에서 사용 가능한 세 가지 주요 패턴의 완전한 가이드입니다.

## 📋 빠른 시작 가이드

사용 사례에 맞는 적합한 패턴을 선택하세요:

| 패턴 | 사용 사례 | 임포트 | 최적용도 |
|---------|----------|--------|----------|
| **🎯 Action Only** | 스토어 없이 액션 디스패칭 | `createActionContext` | 이벤트 시스템, 커맨드 패턴 |
| **🏪 Store Only** | 액션 없이 상태 관리 | `createStoreContext` | 순수 상태 관리, 데이터 레이어 |
| **🔧 Ref Context** | 제로 리렌더링 직접 DOM 조작 | `createRefContext` | 고성능 UI, 애니메이션, 실시간 인터랙션 |

**참고**: 복잡한 애플리케이션의 경우, 최대한의 유연성과 관심사 분리를 위해 패턴들을 조합하여 사용하세요.

---

## 🎯 Action Only 패턴

**언제 사용**: 상태 관리 없이 순수 액션 디스패칭 (이벤트 시스템, 커맨드 패턴).

### 임포트
```typescript
import { createActionContext } from '@context-action/react';
```

### 기능
- ✅ 타입 안전한 액션 디스패칭
- ✅ 액션 핸들러 등록
- ✅ 중단 지원
- ✅ 결과 처리
- ✅ 경량 (스토어 오버헤드 없음)

### 기본 사용법
```tsx
// 1. 액션 정의 (ActionPayloadMap 선택사항)
interface EventActions {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
}

// 2. 이름 변경 패턴으로 컨텍스트 생성
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

// 4. 리네이밍된 훅을 사용한 컴포넌트 사용  
function InteractiveComponent() {
  const dispatch = useEventAction();
  
  // 리네이밍된 훅으로 액션 핸들러 등록
  useEventActionHandler('userClick', (payload, controller) => {
    console.log('사용자가 클릭한 위치:', payload.x, payload.y);
    // 순수 부작용, 상태 관리 없음
  });
  
  useEventActionHandler('analytics', async (payload) => {
    await fetch('/analytics', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  });
  
  const handleClick = (e: MouseEvent) => {
    dispatch('userClick', { x: e.clientX, y: e.clientY });
    dispatch('analytics', { event: 'click', data: { timestamp: Date.now() } });
  };
  
  return <button onClick={handleClick}>클릭해주세요</button>;
}
```

## 🏪 Store Only 패턴

**언제 사용**: 액션 디스패칭 없이 순수 상태 관리 (데이터 레이어, 단순 상태).

### 임포트
```typescript
import { createStoreContext } from '@context-action/react';
```

### 기능
- ✅ 뛰어난 타입 추론 (수동 타입 어노테이션 불필요)
- ✅ 스토어 관리에 집중된 단순화된 API
- ✅ 직접 값 또는 설정 객체 지원
- ✅ HOC 패턴 지원

### 기본 사용법
```tsx
// 1. 패턴 생성 (타입 추론 방식)
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createStoreContext('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' } },
  counter: 0  // 직접 값도 지원
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
  const settingsStore = useAppStore('settings');
  const counterStore = useAppStore('counter');
  
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  const counter = useStoreValue(counterStore);
  
  const { updateStore, resetStore } = useAppStoreManager();
  
  const updateUser = () => {
    updateStore('user', { name: '홍길동', email: 'hong@example.com' });
  };
  
  const incrementCounter = () => {
    updateStore('counter', prev => prev + 1);
  };
  
  return (
    <div>
      <p>사용자: {user.name}</p>
      <p>테마: {settings.theme}</p>
      <p>카운터: {counter}</p>
      <button onClick={updateUser}>사용자 업데이트</button>
      <button onClick={incrementCounter}>카운터 증가</button>
    </div>
  );
}
```

### 사용 가능한 훅
- `useStore(name)` - 이름으로 타입화된 스토어 가져오기 (주 API)
- `useStoreManager()` - 스토어 관리자 액세스 (고급 사용)
- `useStoreInfo()` - 레지스트리 정보 가져오기
- `useStoreClear()` - 모든 스토어 지우기

---

## 🔧 Ref Context 패턴

**언제 사용하나요**: 제로 React 리렌더링으로 직접 DOM 조작 (고성능 UI, 애니메이션, 실시간 인터랙션).

### 임포트
```typescript
import { createRefContext } from '@context-action/react';
```

### 특징
- ✅ DOM 조작을 위한 제로 React 리렌더링
- ✅ 하드웨어 가속 변환
- ✅ 타입 안전한 ref 관리
- ✅ 자동 생명주기 관리
- ✅ 완벽한 관심사 분리
- ✅ 자동 정리를 통한 메모리 효율성

### 기본 사용법
```tsx
// 1. ref 타입 정의
type MouseRefs = {
  cursor: HTMLDivElement;
  container: HTMLDivElement;
  trail: HTMLDivElement;
};

// 2. 이름 변경 패턴으로 RefContext 생성
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
  const container = useMouseRef('container');
  const trail = useMouseRef('trail');
  
  // 직접 DOM 조작 - 제로 React 리렌더링!
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 하드웨어 가속 변환
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
      trail.target.style.opacity = '0.7';
    }
  }, [cursor, container, trail]);
  
  return (
    <div
      ref={container.setRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-96 bg-gray-100 overflow-hidden"
    >
      <div
        ref={cursor.setRef}
        className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      <div
        ref={trail.setRef}
        className="absolute w-3 h-3 bg-blue-300 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)', opacity: 0 }}
      />
    </div>
  );
}
```

### 커스텀 훅을 사용한 고급 RefContext
```tsx
// 비즈니스 로직 분리를 위한 커스텀 훅
function useMouseUpdater() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  const positionHistory = useRef<Array<{x: number, y: number}>>([]);
  
  const updatePosition = useCallback((x: number, y: number) => {
    // 직접 DOM 조작
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
      trail.target.style.opacity = '0.7';
    }
    
    // 비즈니스 로직 - 위치 기록 추적
    positionHistory.current.push({ x, y });
    if (positionHistory.current.length > 100) {
      positionHistory.current.shift();
    }
  }, [cursor, trail]);
  
  const getVelocity = useCallback(() => {
    const history = positionHistory.current;
    if (history.length < 2) return 0;
    
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    return Math.sqrt((current.x - previous.x) ** 2 + (current.y - previous.y) ** 2);
  }, []);
  
  return { updatePosition, getVelocity };
}

// 컴포넌트에서 사용
function AdvancedMouseTracker() {
  const { updatePosition, getVelocity } = useMouseUpdater();
  const container = useMouseRef('container');
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    updatePosition(x, y);
    
    // 리렌더링을 발생시키지 않고 속도 로깅
    console.log('마우스 속도:', getVelocity());
  }, [container, updatePosition, getVelocity]);
  
  return (
    <div
      ref={container.setRef}
      onMouseMove={handleMouseMove}
      className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50"
    />
  );
}
```

### 사용 가능한 훅
- `useRefHandler(name)` - 이름으로 타입화된 ref 핸들러 가져오기
- `useWaitForRefs()` - 여러 ref가 마운트될 때까지 대기
- `useGetAllRefs()` - 마운트된 모든 ref 액세스
- `refHandler.setRef` - ref 콜백 설정
- `refHandler.target` - 현재 ref 값 액세스
- `refHandler.isMounted` - 마운트 상태 확인
- `refHandler.waitForMount()` - 비동기 ref 대기
- `refHandler.withTarget()` - 안전한 작업

---

## 🔧 패턴 조합

복잡한 애플리케이션의 경우, 최대한의 유연성을 위해 세 패턴을 모두 조합하세요:

```tsx
// 1. 이름 변경 패턴으로 별도 컨텍스트 생성
const { 
  Provider: EventActionProvider, 
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createStoreContext('App', {
  user: { id: '', name: '' },
  counter: 0
});

const {
  Provider: UIRefsProvider,
  useRefHandler: useUIRef
} = createRefContext<{
  cursor: HTMLDivElement;
  notification: HTMLDivElement;
  modal: HTMLDivElement;
}>('UIRefs');

// 2. 세 패턴 모두 조합
function App() {
  return (
    <EventActionProvider>
      <AppStoreProvider>
        <UIRefsProvider>
          <ComplexComponent />
        </UIRefsProvider>
      </AppStoreProvider>
    </EventActionProvider>
  );
}

// 3. 컴포넌트에서 세 패턴 모두 사용
function ComplexComponent() {
  // Action Only 패턴에서 액션
  const dispatch = useEventAction();
  
  // Store Only 패턴에서 상태
  const userStore = useAppStore('user');
  const counterStore = useAppStore('counter');
  
  // RefContext 패턴에서 refs
  const cursor = useUIRef('cursor');
  const notification = useUIRef('notification');
  
  const user = useStoreValue(userStore);
  const counter = useStoreValue(counterStore);
  
  // 상태를 업데이트하고 DOM을 조작하는 액션 핸들러
  useEventActionHandler('updateUser', (payload) => {
    // 스토어 업데이트
    userStore.setValue(payload);
    
    // 직접 DOM 조작으로 알림 표시
    if (notification.target) {
      notification.target.textContent = `사용자 ${payload.name} 업데이트됨!`;
      notification.target.style.display = 'block';
      notification.target.style.opacity = '1';
      
      setTimeout(() => {
        if (notification.target) {
          notification.target.style.opacity = '0';
          setTimeout(() => {
            if (notification.target) {
              notification.target.style.display = 'none';
            }
          }, 300);
        }
      }, 2000);
    }
    
    // 분석 이벤트 디스패치
    dispatch('analytics', { event: 'user-updated' });
  });
  
  // 직접 DOM 조작을 사용한 마우스 이벤트
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }
  }, [cursor]);
  
  return (
    <div onMouseMove={handleMouseMove}>
      <div>사용자: {user.name}</div>
      <div>카운터: {counter}</div>
      
      {/* 직접 DOM 조작 요소들 */}
      <div
        ref={cursor.setRef}
        className="fixed w-4 h-4 bg-blue-500 rounded-full pointer-events-none z-50"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      
      <div
        ref={notification.setRef}
        className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg"
        style={{ display: 'none', opacity: 0, transition: 'opacity 300ms' }}
      />
    </div>
  );
}
```

## 마이그레이션 가이드

### 기존 패턴에서 새로운 패턴으로

기존의 복잡한 패턴들을 새로운 단순한 두 패턴으로 마이그레이션하는 방법:

1. **Action Only로 마이그레이션**: 상태가 없는 이벤트/커맨드 처리
2. **Store Only로 마이그레이션**: 순수 상태 관리
3. **패턴 조합**: 복잡한 비즈니스 로직

---

## 📚 모범 사례

### 1. 패턴 선택
- 간단한 상태 관리는 **Store Only로 시작**
- 부수 효과나 복잡한 워크플로가 필요하면 **Action Only 추가**
- 고성능 DOM 조작이 필요하면 **RefContext 추가**
- 완전한 기능의 애플리케이션은 **세 패턴 모두 조합**

### 2. 명명 규칙
- 설명적인 컨텍스트 이름 사용: `UserActions`, `AppStores`, `MouseRefs`
- 명확성을 위해 내보낸 훅 이름 변경: `useUserAction`, `useAppStore`, `useMouseRef`
- 스토어 이름은 간단하게 유지: `user`, `counter`, `settings`
- 도메인별 ref 이름 사용: `cursor`, `modal`, `canvas`

### 3. 성능
- **Store 패턴**: 대용량 데이터셋에는 `strategy: 'reference'`, 객체에는 `'shallow'`, 필요할 때만 `'deep'` 사용
- **RefContext 패턴**: 하드웨어 가속을 위해 `translate3d()` 사용, DOM 업데이트 배치, React 리렌더링 방지
- **Action 패턴**: 핸들러를 가볍게 유지, 무거운 작업에는 async 사용

### 4. 타입 안전성
- **액션**: 액션에 명시적 인터페이스 사용 (ActionPayloadMap 선택사항)
- **스토어**: TypeScript가 스토어 타입을 추론하게 하거나 명시적 제네릭 사용
- **Refs**: 적절한 HTML 요소 타입으로 명확한 ref 타입 인터페이스 정의
- 모든 패턴에서 리터럴 타입에 `as const` 사용

### 5. 관심사 분리
- **액션**: 부수 효과, 비즈니스 로직, 조정 처리
- **스토어**: 애플리케이션 상태와 데이터 관리
- **RefContext**: DOM 조작과 성능 중요 UI 처리
- 각 패턴을 특정 책임에 집중시키기

---

## 🔍 예시

각 패턴의 완전한 작업 예시는 `examples/` 디렉토리를 참조하세요.