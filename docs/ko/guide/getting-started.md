# 시작하기

Context-Action은 타입 안전한 커맨드 실행(**Action**)과 반응형 상태(**Store**)를 분리하여, 단순한 기능부터 시작하고 복잡도가 커질 때만 아키텍처 경계를 점진적으로 확장할 수 있게 해줍니다.

## 점진적 도입 단계 (Progressive Adoption)

Level 1부터 시작해 요구사항이 커질 때만 다음 단계로 확장하세요:

| 단계 | 적용 범위 | 핵심 API | 적합한 상황 |
| --- | --- | --- | --- |
| **Level 1 · Lite** | 스코프 단위 상태 또는 커맨드 | `createStoreContext`, `createActionContext` (또는 `createStateStore` + `ActionRegister`) | 컴포넌트 트리, 일반 폼, 가벼운 인터랙션 |
| **Level 2 · Standard** | 헤드리스 파이프라인, 역할별 훅, 120fps DOM | `<ActionProvider register={...}>`, `<StoreProvider stores={...} \| manager={...}>`, 역할별 훅 (`useActionGuard`, `useActionCommandHandler`, `useActionResultHandler`, `useActionObserver`), `useStorePath`, `createRefContext` | 비동기 오케스트레이션, React 무관 순수 TS 테스트, 캔버스/DOM 직접 제어 |
| **Level 3 · Enterprise** | 도메인 아키텍처·트랜잭션·통합 어댑터 | 6계층 Context-Layered 구조, `StoreTransactionCoordinator`, `@context-action/tool-protocol`, `@context-action/xstate`, Lit/Preact UI 브리지 | 다중 팀 협업, 다중 스토어 원자 Undo/Redo, AI/MCP 도구, 마이크로 프론트엔드 |

전체 상태 관리 수단 비교는 [Store별 선택 기준 및 사용법 가이드](../context-layered/store-selection-and-usage-guide.md)를 참고하세요.

## 빠른 시작

사용 사례에 맞는 적합한 패턴을 선택하세요:

| 패턴 | 사용 사례 | 임포트 | 최적 용도 |
|---------|----------|--------|----------|
| **🎯 Action Only** | 스토어 없이 액션 디스패칭 | `createActionContext` | 이벤트 시스템, 커맨드 패턴 |
| **🏪 Store Only** | 액션 없이 상태 관리 | `createStoreContext` | 순수 상태 관리, 데이터 레이어 |
| **🏗️ Headless-First** | 순수 TS 파이프라인 + 스토어 + React DI | `ActionRegister` + `Store` / `StoreManager` + `<Provider register / stores>` | UI 수명주기와 분리된 도메인 오케스트레이션, 이식 가능한 로직 |
| **🔧 Ref Context** *(고급)* | 제로 리렌더링 직접 DOM 조작 | `createRefContext` | 고성능 UI, 애니메이션, 실시간 인터랙션 |

## 🎯 Action Only 패턴

상태 관리 없이 순수 액션 디스패칭을 구성합니다.

### 기본 사용법

<!-- @context-action-compile -->
```tsx
import type React from 'react';
import { createActionContext } from '@context-action/react';
import type { ActionPayloadMap } from '@context-action/core';

// 1. 액션 정의
interface EventActions extends ActionPayloadMap {
  userClick: { x: number; y: number };
  analytics: { event: string; data: Record<string, unknown> };
}

// 2. 컨텍스트 생성
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionCommandHandler: useEventCommandHandler,
} = createActionContext<EventActions>('Events');

// 3. Provider 설정
export function App() {
  return (
    <EventActionProvider>
      <InteractiveComponent />
    </EventActionProvider>
  );
}

// 4. 컴포넌트 사용
function InteractiveComponent() {
  const dispatch = useEventAction();

  useEventCommandHandler('userClick', (payload) => {
    console.log('사용자가 클릭한 위치:', payload.x, payload.y);
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    void dispatch('userClick', { x: e.clientX, y: e.clientY });
  };

  return <button type="button" onClick={handleClick}>클릭해주세요</button>;
}
```

## 🏪 Store Only 패턴

액션 디스패칭 없이 타입 안전한 상태 관리를 구성합니다.

### 기본 사용법

<!-- @context-action-compile -->
```tsx
import { createStoreContext, useStoreValue } from '@context-action/react';

// 1. Store 컨텍스트 생성
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
} = createStoreContext('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' as 'light' | 'dark' } },
});

// 2. Provider 설정
export function App() {
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

  const updateUser = () => {
    userStore.setValue({ name: '홍길동', email: 'hong@example.com' });
  };

  return (
    <div>
      <p>사용자: {user.name}</p>
      <button type="button" onClick={updateUser}>
        사용자 업데이트
      </button>
    </div>
  );
}
```

## 🏗️ Headless-First 패턴 (`ActionRegister` + `Store` DI)

오케스트레이션과 상태가 UI 마운트 수명을 넘어 유지되어야 하거나 React와 독립적으로 테스트되어야 할 때는 `ActionRegister`와 `createStore`(또는 `StoreManager`)를 React 밖에서 조립한 뒤 `<ActionProvider register={...}>`와 `<StoreProvider stores={...} | manager={...}>`로 대칭 주입합니다. 기본 `ownership`은 `'shared'`이므로 Provider가 언마운트되어도 React 리스너만 정리되고 외부 레지스터·스토어는 유지됩니다(수명 위임이 필요할 때 `ownership="owned"` 전달).

<!-- @context-action-compile -->
```tsx
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStore,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

interface CounterActions extends ActionPayloadMap {
  increment: { amount: number };
}

interface CounterStores {
  counter: { count: number };
}

// 1. 프레임워크 중립 상태 + 커맨드 파이프라인 (React 없이 단독 테스트 가능)
export const counterStore = createStore<CounterStores['counter']>('counter', { count: 0 });
export const counterRegister = new ActionRegister<CounterActions>({ name: 'HeadlessCounter' });

counterRegister.registerCommand('increment', ({ amount }) => {
  counterStore.update(prev => ({ count: prev.count + amount }));
});

// 2. 얇은 React Context DI 경계 (기본 ownership="shared")
const CounterActionsContext = createActionContext<CounterActions>('CounterActions');
const CounterStoresContext = createStoreContext<CounterStores>('CounterStores', {
  counter: { count: 0 },
});

function CounterPanel() {
  const dispatch = CounterActionsContext.useActionDispatch();
  const state = useStoreValue(CounterStoresContext.useStore('counter'));

  return (
    <button type="button" onClick={() => void dispatch('increment', { amount: 1 })}>
      카운트: {state.count}
    </button>
  );
}

export function HeadlessCounterApp() {
  return (
    <CounterActionsContext.Provider register={counterRegister} ownership="shared">
      <CounterStoresContext.Provider stores={{ counter: counterStore }} ownership="shared">
        <CounterPanel />
      </CounterStoresContext.Provider>
    </CounterActionsContext.Provider>
  );
}
```

## 🔧 Ref Context 패턴

제로 React 리렌더링으로 고성능 직접 DOM 조작을 구현합니다.

### 기본 사용법

<!-- @context-action-compile -->
```tsx
import type React from 'react';
import { useCallback, useRef } from 'react';
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
  useRefHandler: useMouseRef,
} = createRefContext<MouseRefs>('Mouse');

// 3. Provider 설정
export function MouseApp() {
  return (
    <MouseProvider>
      <MouseTracker />
    </MouseProvider>
  );
}

// 4. 직접 DOM 조작 컴포넌트
function MouseTracker() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  const container = useMouseRef('container');

  // 직접 DOM 조작 - React 리렌더링 0회
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cursor.target || !container.target) return;

    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    if (trail.target) {
      trail.target.style.transform = `translate3d(${x - 5}px, ${y - 5}px, 0)`;
      trail.target.style.opacity = '0.7';
    }
  }, [cursor, trail, container]);

  return (
    <div
      ref={container.setRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-96 bg-gray-100"
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

export function useMousePositionHistory() {
  const cursor = useMouseRef('cursor');
  const positionHistory = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);

  const updatePosition = useCallback((x: number, y: number) => {
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    positionHistory.current.push({ x, y, timestamp: Date.now() });
    if (positionHistory.current.length > 50) {
      positionHistory.current.shift();
    }
  }, [cursor]);

  const getVelocity = useCallback(() => {
    const history = positionHistory.current;
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    if (!latest || !previous) return 0;

    const distance = Math.sqrt((latest.x - previous.x) ** 2 + (latest.y - previous.y) ** 2);
    const timeDiff = latest.timestamp - previous.timestamp;
    return timeDiff === 0 ? 0 : distance / timeDiff;
  }, []);

  return { updatePosition, getVelocity };
}
```

## 패턴 조합

복잡한 애플리케이션에서는 핵심 패턴과 고급 패턴을 조합해 사용합니다:

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

- [Store별 선택 기준 및 사용법 가이드](../context-layered/store-selection-and-usage-guide.md) - 경계별 적합한 Store 수단 고르기
- [Context-Layered 아키텍처](../context-layered/context-layered-guide.md) - Lite/Standard에서 6계층 도메인 구조로 확장하기
- [React Refs 가이드](../concept/react-refs-guide.md) - RefContext 패턴 심화 학습
- [패턴 가이드](../concept/pattern-guide.md) - 패턴 비교 및 실전 예시
- [액션 파이프라인](./action-pipeline.md) - 액션 처리 파이프라인 이해하기
- [모범 사례](./best-practices.md) - 권장 패턴 따르기

## 실제 예시

- **RefContext를 사용한 마우스 이벤트**: 예제 앱에서 RefContext 마우스 이벤트 데모 확인
- **스토어 통합**: 액션 핸들러와 스토어 결합 패턴
- **성능 최적화**: 직접 DOM 조작으로 제로 리렌더링 달성
