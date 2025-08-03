# 고급 사용법

이 가이드에서는 Context Action의 고급 기능들을 다룹니다. 비동기 액션, 에러 처리, 우선순위 설정, 그리고 복잡한 상태 관리 패턴을 배워보세요.

## 비동기 액션 처리

Context Action은 비동기 액션을 완벽하게 지원합니다. 프로미스를 반환하는 핸들러를 등록할 수 있습니다.

### 기본 비동기 액션

```typescript
interface ApiActions {
  fetchUser: { id: number };
  saveUser: { user: User };
  deleteUser: { id: number };
}

const { Provider, useAction, useActionHandler } = createActionContext<ApiActions>();

function UserComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useAction();

  // 비동기 액션 핸들러
  useActionHandler('fetchUser', async ({ id }) => {
    setLoading(true);
    try {
      const userData = await api.getUser(id);
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보를 가져오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  });

  useActionHandler('saveUser', async ({ user }) => {
    setLoading(true);
    try {
      const savedUser = await api.saveUser(user);
      setUser(savedUser);
    } catch (error) {
      console.error('사용자 저장에 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div>
      {loading && <p>로딩 중...</p>}
      {user && <UserProfile user={user} />}
      <button onClick={() => dispatch('fetchUser', { id: 1 })}>
        사용자 정보 가져오기
      </button>
    </div>
  );
}
```

### 액션 결과 대기

`dispatch` 메서드는 프로미스를 반환하므로 액션 완료를 기다릴 수 있습니다:

```typescript
async function handleSubmit() {
  try {
    await dispatch('saveUser', { user: formData });
    // 저장 성공 후 실행될 코드
    navigate('/user-list');
  } catch (error) {
    // 에러 처리
    setError('저장에 실패했습니다.');
  }
}
```

## 우선순위 시스템

여러 핸들러가 같은 액션을 처리할 때 우선순위를 설정할 수 있습니다. ActionRegister는 높은 숫자의 우선순위를 먼저 실행합니다.

```typescript
function LoggingComponent() {
  const dispatch = useAction();

  // 높은 우선순위 (먼저 실행됨)
  useActionHandler('increment', () => {
    console.log('증가 액션 시작');
  }, { priority: 100 });

  // 기본 우선순위 (중간에 실행됨)
  useActionHandler('increment', () => {
    console.log('카운터 증가');
  }, { priority: 0 });

  // 낮은 우선순위 (나중에 실행됨)
  useActionHandler('increment', () => {
    console.log('증가 액션 완료');
  }, { priority: 1 });

  return <button onClick={() => dispatch('increment')}>클릭</button>;
}
```

## 액션 인터셉터 패턴

ActionRegister의 우선순위 시스템을 활용하여 강력한 인터셉터 패턴을 구현할 수 있습니다.

### 보안 인터셉터

```typescript
interface SecurityActions {
  sensitiveOperation: { data: string; userId: string };
}

function SecurityInterceptorDemo() {
  const [enableInterceptor, setEnableInterceptor] = useState(true);
  const [interceptedActions, setInterceptedActions] = useState<string[]>([]);
  const interceptorEnabledRef = useRef(enableInterceptor);
  
  // 상태 변경 시 ref 업데이트
  useEffect(() => {
    interceptorEnabledRef.current = enableInterceptor;
  }, [enableInterceptor]);

  const actionRegister = useActionRegister<SecurityActions>();

  useEffect(() => {
    // 높은 우선순위 인터셉터 (먼저 실행됨)
    const unsubscribeInterceptor = actionRegister.register(
      'sensitiveOperation',
      ({ data, userId }, controller) => {
        const isInterceptorEnabled = interceptorEnabledRef.current;
        
        if (isInterceptorEnabled) {
          // 보안 검사 - 권한이 없는 접근 차단
          if (!hasPermission(userId, 'sensitive_operation')) {
            setInterceptedActions(prev => [...prev, 
              `🛡️ 차단됨: ${data} - 권한 없는 사용자 ${userId}`
            ]);
            
            // 전체 파이프라인 중단 - 비즈니스 로직 실행 안됨
            controller.abort('보안 인터셉터에 의해 권한 없는 접근이 차단됨');
            return;
          }
        }
        
        // 비즈니스 로직으로 진행 허용
        console.log('✅ 보안 검사 통과, 진행...');
        controller.next();
      },
      { priority: 10 } // 높은 우선순위 - 먼저 실행
    );

    // 낮은 우선순위 비즈니스 로직 (허가된 경우에만 실행)
    const unsubscribeBusinessLogic = actionRegister.register(
      'sensitiveOperation',
      ({ data }, controller) => {
        // 인터셉터를 통과한 경우에만 실행됨
        console.log('🎯 비즈니스 로직 실행:', data);
        
        // 실제 민감한 작업 수행
        performSensitiveOperation(data);
        
        controller.next();
      },
      { priority: 1 } // 낮은 우선순위 - 인터셉터 이후 실행
    );

    return () => {
      unsubscribeInterceptor();
      unsubscribeBusinessLogic();
    };
  }, []);

  return (
    <div>
      <button onClick={() => setEnableInterceptor(!enableInterceptor)}>
        {enableInterceptor ? '비활성화' : '활성화'} 보안 인터셉터
      </button>
      
      <button onClick={() => 
        actionRegister.dispatch('sensitiveOperation', { 
          data: '기밀-데이터', 
          userId: 'user123' 
        })
      }>
        민감한 작업 실행
      </button>

      {interceptedActions.length > 0 && (
        <div>
          <h3>차단된 액션:</h3>
          {interceptedActions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 파이프라인 플로우 제어

```typescript
interface FlowControlActions {
  processData: { data: any; skipValidation?: boolean };
  chainedAction: { step: number; data: string };
}

function PipelineFlowDemo() {
  const actionRegister = useActionRegister<FlowControlActions>();

  useEffect(() => {
    // 검증 핸들러 (높은 우선순위)
    actionRegister.register('processData', ({ data, skipValidation }, controller) => {
      if (!skipValidation && !isValid(data)) {
        console.log('❌ 검증 실패 - 파이프라인 중단');
        controller.abort('데이터 검증 실패');
        return;
      }
      
      console.log('✅ 검증 통과');
      controller.next();
    }, { priority: 10 });

    // 처리 핸들러 (중간 우선순위)
    actionRegister.register('processData', ({ data }, controller) => {
      console.log('🔄 데이터 처리 중...');
      
      // 다음 핸들러를 위한 페이로드 수정
      controller.modifyPayload((payload) => ({
        ...payload,
        data: processData(payload.data),
        processedAt: new Date().toISOString()
      }));
      
      controller.next();
    }, { priority: 5 });

    // 로깅 핸들러 (낮은 우선순위)
    actionRegister.register('processData', ({ data }, controller) => {
      console.log('📝 처리된 데이터 로깅:', data);
      
      // 분석에 로그 전송
      analytics.track('data_processed', { 
        timestamp: new Date().toISOString(),
        dataSize: JSON.stringify(data).length 
      });
      
      controller.next();
    }, { priority: 1 });

    // 체인 액션 예제
    actionRegister.register('chainedAction', ({ step, data }, controller) => {
      console.log(`단계 ${step}: ${data}`);
      
      // 다음 단계 자동 트리거
      if (step < 3) {
        setTimeout(() => {
          actionRegister.dispatch('chainedAction', { 
            step: step + 1, 
            data: `체인 단계 ${step + 1}` 
          });
        }, 1000);
      } else {
        console.log('🎉 체인 완료');
      }
      
      controller.next();
    });

  }, [actionRegister]);
}
```

## 에러 처리 및 중단

액션 파이프라인에서 에러 처리와 중단 메커니즘을 활용할 수 있습니다.

### 에러 경계 처리

```typescript
function ValidationComponent() {
  const dispatch = useAction();

  useActionHandler('submitForm', async (data) => {
    // 유효성 검사
    if (!data.email) {
      throw new Error('이메일은 필수 항목입니다.');
    }
    
    if (!data.password || data.password.length < 8) {
      throw new Error('비밀번호는 8자 이상이어야 합니다.');
    }

    // 실제 제출 로직
    await api.submitForm(data);
  });

  const handleSubmit = async (formData: FormData) => {
    try {
      await dispatch('submitForm', formData);
      setSuccess('양식이 성공적으로 제출되었습니다.');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 요소들 */}
    </form>
  );
}
```

### 조건부 실행

```typescript
function ConditionalComponent() {
  const [isEnabled, setIsEnabled] = useState(true);
  const dispatch = useAction();

  useActionHandler('conditionalAction', (data) => {
    if (!isEnabled) {
      console.log('액션이 비활성화되어 있습니다.');
      return; // 조기 반환으로 나머지 핸들러 실행 방지
    }
    
    // 실제 처리 로직
    processData(data);
  }, { priority: 1000 }); // 높은 우선순위로 먼저 검사

  return (
    <div>
      <label>
        <input 
          type="checkbox" 
          checked={isEnabled} 
          onChange={(e) => setIsEnabled(e.target.checked)} 
        />
        액션 활성화
      </label>
      <button onClick={() => dispatch('conditionalAction', { data: 'test' })}>
        조건부 액션 실행
      </button>
    </div>
  );
}
```

## 복잡한 상태 관리

여러 컴포넌트 간의 복잡한 상태를 관리하는 패턴입니다.

### 글로벌 상태 관리

```typescript
interface AppActions {
  setUser: { user: User };
  setTheme: { theme: 'light' | 'dark' };
  showNotification: { message: string; type: 'success' | 'error' };
  hideNotification: void;
}

// 글로벌 상태 컨텍스트
const { Provider: AppProvider, useAction, useActionHandler } = createActionContext<AppActions>();

// 상태 관리 훅
function useAppState() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  useActionHandler('setUser', ({ user }) => setUser(user));
  useActionHandler('setTheme', ({ theme }) => setTheme(theme));
  useActionHandler('showNotification', ({ message, type }) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  });
  useActionHandler('hideNotification', () => setNotification(null));

  return { user, theme, notification };
}

// 루트 앱 컴포넌트
function App() {
  return (
    <AppProvider>
      <AppStateProvider />
      <Header />
      <MainContent />
      <NotificationCenter />
    </AppProvider>
  );
}

function AppStateProvider() {
  useAppState(); // 상태만 관리, UI는 렌더링하지 않음
  return null;
}
```

### 모듈별 상태 분리

```typescript
// 사용자 모듈
interface UserActions {
  login: { credentials: LoginCredentials };
  logout: void;
  updateProfile: { profile: UserProfile };
}

// 쇼핑카트 모듈  
interface CartActions {
  addItem: { item: CartItem };
  removeItem: { itemId: string };
  updateQuantity: { itemId: string; quantity: number };
  clearCart: void;
}

// 각각 별도의 컨텍스트로 관리
const UserContext = createActionContext<UserActions>();
const CartContext = createActionContext<CartActions>();

function App() {
  return (
    <UserContext.Provider>
      <CartContext.Provider>
        <ShoppingApp />
      </CartContext.Provider>
    </UserContext.Provider>
  );
}
```

## 디버깅과 개발 도구

개발 환경에서 액션 흐름을 추적하고 디버깅하는 방법입니다.

### 액션 로깅

```typescript
function DebugComponent() {
  const dispatch = useAction();

  // 개발 환경에서만 로깅
  if (process.env.NODE_ENV === 'development') {
    useActionHandler('*', (payload, actionType) => {
      console.group(`🎯 Action: ${actionType}`);
      console.log('Payload:', payload);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }, { priority: 1000 });
  }

  return <div>{/* 컴포넌트 내용 */}</div>;
}
```

### 성능 모니터링

```typescript
function PerformanceMonitor() {
  useActionHandler('*', async (payload, actionType) => {
    const startTime = performance.now();
    
    // 다른 핸들러들이 실행된 후 측정하기 위해 약간 지연
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 100) { // 100ms 이상 걸린 액션 로깅
      console.warn(`⚠️ Slow action detected: ${actionType} took ${duration.toFixed(2)}ms`);
    }
  }, { priority: -1000 });

  return null;
}
```

## 테스팅

Context Action 애플리케이션을 테스트하는 방법입니다.

### 액션 테스트

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { createActionContext } from '@context-action/react';

describe('Counter Component', () => {
  it('should increment counter when button is clicked', async () => {
    const { Provider, useAction, useActionHandler } = createActionContext<CounterActions>();
    
    function TestCounter() {
      const [count, setCount] = useState(0);
      const dispatch = useAction();
      
      useActionHandler('increment', () => setCount(prev => prev + 1));
      
      return (
        <div>
          <span data-testid="count">{count}</span>
          <button onClick={() => dispatch('increment')}>증가</button>
        </div>
      );
    }
    
    render(
      <Provider>
        <TestCounter />
      </Provider>
    );
    
    const button = screen.getByText('증가');
    const countElement = screen.getByTestId('count');
    
    expect(countElement).toHaveTextContent('0');
    
    fireEvent.click(button);
    
    expect(countElement).toHaveTextContent('1');
  });
});
```

## 성능 최적화

대규모 애플리케이션에서 Context Action의 성능을 최적화하는 방법입니다.

### 컨텍스트 분할

```typescript
// 자주 변경되는 상태와 그렇지 않은 상태를 분리
const UserContext = createActionContext<UserActions>();      // 자주 변경되지 않음
const UIStateContext = createActionContext<UIStateActions>(); // 자주 변경됨

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

### 메모이제이션 적용

```typescript
const MemoizedComponent = React.memo(function ExpensiveComponent() {
  const dispatch = useAction();
  
  useActionHandler('expensiveAction', useCallback((data) => {
    // 비용이 큰 연산
    processLargeDataSet(data);
  }, []));
  
  return <div>{/* 컴포넌트 내용 */}</div>;
});
```

이제 Context Action의 고급 기능들을 활용하여 더 복잡하고 견고한 애플리케이션을 구축할 수 있습니다. 다음으로 [API 레퍼런스](/ko/api/)를 참조하여 더 자세한 정보를 확인하세요.