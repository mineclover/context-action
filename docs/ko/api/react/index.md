# React API 레퍼런스

`@context-action/react` 패키지는 React 애플리케이션에서 Context Action을 사용하기 위한 통합 기능을 제공합니다. React Context API와 커스텀 훅을 통해 컴포넌트 간 액션 관리를 쉽게 할 수 있습니다.

## 설치

```bash
npm install @context-action/core @context-action/react
```

React 16.8 이상이 필요합니다 (Hooks 지원).

## createActionContext

React Context 기반의 액션 시스템을 생성하는 함수입니다.

### 사용법

```typescript
import { createActionContext } from '@context-action/react';

interface MyActions {
  increment: void;
  setCount: number;
  reset: void;
}

const { Provider, useAction, useActionHandler } = createActionContext<MyActions>();
```

### 반환값

`createActionContext`는 다음 속성을 가진 객체를 반환합니다:

#### `Provider`

액션 컨텍스트를 제공하는 React 컴포넌트입니다.

```typescript
function App() {
  return (
    <Provider>
      <Counter />
      <ResetButton />
    </Provider>
  );
}
```

**Props:**
- `children`: `React.ReactNode` - 자식 컴포넌트들

#### `useAction`

액션을 디스패치할 수 있는 객체를 반환하는 훅입니다.

```typescript
function MyComponent() {
  const dispatch = useAction();

  const handleClick = () => {
    dispatch('increment');
  };

  const handleSetCount = (value: number) => {
    dispatch('setCount', value);
  };

  return (
    <div>
      <button onClick={handleClick}>증가</button>
      <button onClick={() => handleSetCount(10)}>10으로 설정</button>
    </div>
  );
}
```

**반환값:**
- `dispatch<K>(actionType: K, payload?: TActions[K]): Promise<void>` - 액션을 디스패치하는 메서드

#### `useActionHandler`

액션 핸들러를 등록하는 훅입니다.

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  useActionHandler('increment', () => {
    setCount(prev => prev + 1);
  });

  useActionHandler('setCount', (value) => {
    setCount(value);
  });

  useActionHandler('reset', () => {
    setCount(0);
  });

  return <div>카운트: {count}</div>;
}
```

**매개변수:**
- `actionType`: `keyof TActions` - 처리할 액션 타입
- `handler`: `ActionHandler<TActions[K]>` - 액션 핸들러 함수
- `options?`: `HandlerOptions` - 핸들러 옵션 (우선순위 등)

**의존성 배열:**
핸들러 함수는 컴포넌트가 리렌더링될 때마다 새로 등록되지 않도록 주의해야 합니다:

```typescript
// ❌ 나쁜 예: 매번 새로운 함수가 생성됨
useActionHandler('increment', () => {
  setCount(count + 1); // count를 클로저로 캡처
});

// ✅ 좋은 예: useCallback 사용
const incrementHandler = useCallback(() => {
  setCount(prev => prev + 1);
}, []);

useActionHandler('increment', incrementHandler);

// ✅ 좋은 예: 함수형 setState 사용
useActionHandler('increment', () => {
  setCount(prev => prev + 1); // 의존성 없음
});
```

## 고급 사용 패턴

### 다중 컨텍스트

서로 다른 도메인의 액션을 분리하여 관리할 수 있습니다:

```typescript
// 사용자 관련 액션
interface UserActions {
  login: { credentials: LoginCredentials };
  logout: void;
  updateProfile: { profile: UserProfile };
}

// UI 상태 관련 액션
interface UIActions {
  showModal: { modalType: string };
  hideModal: void;
  setTheme: { theme: 'light' | 'dark' };
}

const UserContext = createActionContext<UserActions>();
const UIContext = createActionContext<UIActions>();

function App() {
  return (
    <UserContext.Provider>
      <UIContext.Provider>
        <Dashboard />
      </UIContext.Provider>
    </UserContext.Provider>
  );
}

function Dashboard() {
  const userAction = UserContext.useAction();
  const uiAction = UIContext.useAction();

  // 각각의 컨텍스트에서 액션 사용
  const handleLogin = () => {
    userdispatch('login', { credentials });
  };

  const handleShowModal = () => {
    uidispatch('showModal', { modalType: 'settings' });
  };

  return (
    <div>
      <button onClick={handleLogin}>로그인</button>
      <button onClick={handleShowModal}>설정 모달 열기</button>
    </div>
  );
}
```

### 컴포넌트 분리 패턴

액션 핸들러를 전용 컴포넌트로 분리하여 관심사를 명확히 할 수 있습니다:

```typescript
// 상태 관리만 담당하는 컴포넌트
function CounterState() {
  const [count, setCount] = useState(0);

  useActionHandler('increment', () => setCount(prev => prev + 1));
  useActionHandler('decrement', () => setCount(prev => prev - 1));
  useActionHandler('reset', () => setCount(0));
  useActionHandler('setCount', (value) => setCount(value));

  // 상태를 다른 방법으로 공유 (Context, props 등)
  return <CounterDisplay count={count} />;
}

// UI만 담당하는 컴포넌트
function CounterButtons() {
  const dispatch = useAction();

  return (
    <div>
      <button onClick={() => dispatch('increment')}>+</button>
      <button onClick={() => dispatch('decrement')}>-</button>
      <button onClick={() => dispatch('reset')}>리셋</button>
    </div>
  );
}

function Counter() {
  return (
    <Provider>
      <CounterState />
      <CounterButtons />
    </Provider>
  );
}
```

### 비동기 액션 처리

비동기 작업과 에러 처리를 포함한 패턴:

```typescript
interface AsyncActions {
  fetchUser: { id: number };
  saveUser: { user: User };
}

function UserManager() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAction();

  // 비동기 액션 핸들러
  useActionHandler('fetchUser', async ({ id }) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await api.getUser(id);
      setUser(userData);
    } catch (err) {
      setError('사용자 정보를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  });

  useActionHandler('saveUser', async ({ user }) => {
    setLoading(true);
    setError(null);
    
    try {
      const savedUser = await api.saveUser(user);
      setUser(savedUser);
    } catch (err) {
      setError('사용자 정보를 저장하는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  });

  const handleFetch = async (id: number) => {
    try {
      await dispatch('fetchUser', { id });
    } catch (err) {
      // 이미 핸들러에서 처리되었지만, 추가 처리가 필요한 경우
      console.error('액션 디스패치 실패:', err);
    }
  };

  return (
    <div>
      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {user && <UserProfile user={user} />}
      <button onClick={() => handleFetch(1)}>사용자 1 로드</button>
    </div>
  );
}
```

### 조건부 핸들러

특정 조건에서만 액션을 처리하는 패턴:

```typescript
function ConditionalHandler() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // 로그인된 사용자만 처리
  useActionHandler('updateProfile', (profile) => {
    if (!user) {
      console.warn('로그인이 필요합니다.');
      return;
    }
    
    setUser({ ...user, ...profile });
  });

  // 기능이 활성화된 경우만 처리
  useActionHandler('advancedFeature', (data) => {
    if (!isEnabled) {
      console.warn('기능이 비활성화되어 있습니다.');
      return;
    }
    
    processAdvancedFeature(data);
  }, { priority: 1000 }); // 높은 우선순위로 먼저 체크

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
        고급 기능 활성화
      </label>
    </div>
  );
}
```

## 성능 최적화

### 컨텍스트 분할

자주 변경되는 상태와 그렇지 않은 상태를 분리:

```typescript
// 자주 변경되지 않는 사용자 정보
const UserContext = createActionContext<UserActions>();

// 자주 변경되는 UI 상태
const UIStateContext = createActionContext<UIStateActions>();

function App() {
  return (
    <UserContext.Provider>
      <UIStateContext.Provider>
        <AppContent />
      </UIStateContext.Provider>
    </UserContext.Provider>
  );
}
```

### 메모이제이션

비용이 큰 핸들러 함수의 메모이제이션:

```typescript
function ExpensiveComponent() {
  const dispatch = useAction();

  // 비용이 큰 연산을 메모이제이션
  const expensiveHandler = useCallback(async (data) => {
    const result = await performExpensiveOperation(data);
    processResult(result);
  }, []);

  useActionHandler('expensiveAction', expensiveHandler);

  return <div>{/* 컴포넌트 내용 */}</div>;
}
```

## 테스팅

React Testing Library와 함께 테스트하는 방법:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createActionContext } from '@context-action/react';

describe('Counter Component', () => {
  interface TestActions {
    increment: void;
    setCount: number;
  }

  const { Provider, useAction, useActionHandler } = createActionContext<TestActions>();

  function TestCounter() {
    const [count, setCount] = useState(0);
    const dispatch = useAction();

    useActionHandler('increment', () => setCount(prev => prev + 1));
    useActionHandler('setCount', (value) => setCount(value));

    return (
      <div>
        <span data-testid="count">{count}</span>
        <button onClick={() => dispatch('increment')}>증가</button>
        <button onClick={() => dispatch('setCount', 10)}>10으로 설정</button>
      </div>
    );
  }

  it('should increment count when button is clicked', async () => {
    render(
      <Provider>
        <TestCounter />
      </Provider>
    );

    const countElement = screen.getByTestId('count');
    const incrementButton = screen.getByText('증가');

    expect(countElement).toHaveTextContent('0');

    fireEvent.click(incrementButton);

    await waitFor(() => {
      expect(countElement).toHaveTextContent('1');
    });
  });

  it('should set count to specific value', async () => {
    render(
      <Provider>
        <TestCounter />
      </Provider>
    );

    const countElement = screen.getByTestId('count');
    const setButton = screen.getByText('10으로 설정');

    fireEvent.click(setButton);

    await waitFor(() => {
      expect(countElement).toHaveTextContent('10');
    });
  });
});
```

## 마이그레이션 가이드

### Redux에서 마이그레이션

```typescript
// Redux 방식
const increment = () => ({ type: 'INCREMENT' });
const setCount = (count) => ({ type: 'SET_COUNT', payload: count });

// Context Action 방식
interface CounterActions {
  increment: void;
  setCount: number;
}

const { Provider, useAction, useActionHandler } = createActionContext<CounterActions>();
```

### Context API에서 마이그레이션

```typescript
// 기존 Context API 방식
const CounterContext = createContext();

// Context Action 방식
const { Provider, useAction, useActionHandler } = createActionContext<CounterActions>();
```

Context Action은 기존 React 패턴과 자연스럽게 통합되면서도 타입 안전성과 더 나은 개발 경험을 제공합니다. [고급 사용법](/ko/guide/advanced)에서 더 복잡한 패턴을 살펴보거나, [Jotai 통합](/ko/api/jotai/)을 통해 더 세밀한 상태 관리를 경험해보세요.