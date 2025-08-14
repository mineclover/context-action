# 시작하기

Context-Action은 React 애플리케이션에서 상태 관리를 위한 두 가지 주요 패턴을 제공합니다.

## 빠른 시작

사용 사례에 맞는 패턴을 선택하세요:

| 패턴 | 사용 사례 | 임포트 | 최적용도 |
|---------|----------|--------|----------|
| **🎯 Action Only** | 스토어 없이 액션 디스패칭 | `createActionContext` | 이벤트 시스템, 커맨드 패턴 |
| **🏪 Store Only** | 액션 없이 상태 관리 | `createDeclarativeStorePattern` | 순수 상태 관리, 데이터 레이어 |

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
import { createDeclarativeStorePattern } from '@context-action/react';

// 1. 패턴 생성
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
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

## 패턴 조합

복잡한 애플리케이션의 경우, 두 패턴을 조합하여 사용:

```tsx
function ComplexApp() {
  return (
    <AppStoreProvider>
      <EventActionProvider>
        <MyComponent />
      </EventActionProvider>
    </AppStoreProvider>
  );
}
```

## 다음 단계

- [액션 파이프라인](./action-pipeline.md) - 액션 처리에 대해 알아보기
- [아키텍처](./architecture.md) - 전체 아키텍처 이해하기
- [훅](./hooks.md) - 사용 가능한 React 훅 살펴보기
- [모범 사례](./best-practices.md) - 권장 패턴 따르기