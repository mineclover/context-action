# @context-action/react 패턴 가이드

@context-action/react 프레임워크에서 사용 가능한 두 가지 주요 패턴에 대한 완전한 가이드입니다.

## 📋 빠른 시작 가이드

사용 사례에 맞는 패턴을 선택하세요:

| 패턴 | 사용 사례 | 임포트 | 최적용도 |
|---------|----------|--------|----------|
| **🎯 Action Only** | 스토어 없이 액션 디스패칭 | `createActionContext` | 이벤트 시스템, 커맨드 패턴 |
| **🏪 Store Only** | 액션 없이 상태 관리 | `createDeclarativeStorePattern` | 순수 상태 관리, 데이터 레이어 |

**참고**: 액션과 상태가 모두 필요한 복잡한 애플리케이션의 경우, Action Only + Store Only 패턴을 함께 조합하세요.

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

// 2. 리네이밍 패턴으로 컨텍스트 생성
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
import { createDeclarativeStorePattern } from '@context-action/react';
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
} = createDeclarativeStorePattern('App', {
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

## 패턴 조합

복잡한 애플리케이션의 경우 두 패턴을 조합:

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

function MyComponent() {
  // 스토어 사용
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  const { updateStore } = useAppStoreManager();
  
  // 액션 사용
  const dispatch = useEventAction();
  
  useEventActionHandler('updateUser', (payload) => {
    // 액션에서 스토어 업데이트
    updateStore('user', payload.userData);
    dispatch('analytics', { event: 'user_updated' });
  });
  
  return <div>조합된 패턴 사용</div>;
}
```

## 마이그레이션 가이드

### 기존 패턴에서 새로운 패턴으로

기존의 복잡한 패턴들을 새로운 단순한 두 패턴으로 마이그레이션하는 방법:

1. **Action Only로 마이그레이션**: 상태가 없는 이벤트/커맨드 처리
2. **Store Only로 마이그레이션**: 순수 상태 관리
3. **패턴 조합**: 복잡한 비즈니스 로직

## 모범 사례

1. **도메인별 리네이밍**: 명확한 컨텍스트 분리를 위해 도메인별 이름 사용
2. **단일 책임**: 각 패턴을 특정 목적에만 사용
3. **타입 안전성**: TypeScript와 함께 사용하여 타입 안전성 확보
4. **성능 최적화**: 필요한 패턴만 사용하여 번들 크기 최소화