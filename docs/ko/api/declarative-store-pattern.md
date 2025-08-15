# 선언형 스토어 패턴 API

타입 안전한 상태 관리를 위한 권장 접근 방식인 선언형 스토어 패턴 구현의 완전한 API 레퍼런스입니다.

## 개요

선언형 스토어 패턴은 수동 타입 주석 없이도 뛰어난 타입 추론을 제공하며, 스토어 관리에 중점을 둔 단순화된 API를 제공합니다. 대부분의 상태 관리 시나리오에 권장되는 패턴입니다.

## 패턴 생성

### `createDeclarativeStorePattern(contextName, storeConfig)`

자동 타입 추론을 통해 선언형 스토어 패턴을 생성합니다.

**매개변수:**
- `contextName`: 스토어 컨텍스트의 고유 식별자
- `storeConfig`: 초기값과 선택적 검증기를 포함한 스토어 설정

**반환값:**
```typescript
{
  Provider: React.ComponentType<{ children: React.ReactNode }>,
  useStore: <K extends keyof T>(storeName: K) => Store<T[K]>,
  useStoreManager: () => StoreManager<T>,
  withProvider: (Component: React.ComponentType) => React.ComponentType
}
```

**타입 추론:**
패턴은 설정에서 자동으로 타입을 추론합니다:

```typescript
// 자동 타입 추론이 있는 설정
const { Provider, useStore, useStoreManager, withProvider } = 
  createDeclarativeStorePattern('App', {
    // 단순 값 - string 타입으로 추론
    username: '',
    
    // 복잡한 객체 - 자동으로 타입 추론
    user: {
      id: '',
      name: '',
      email: '',
      isAuthenticated: false
    },
    
    // 배열 - 적절한 배열 타입으로 추론
    notifications: [] as Array<{ id: string; message: string; type: 'info' | 'warning' | 'error' }>,
    
    // 검증기 포함 - 타입 보존
    settings: {
      initialValue: { theme: 'light' as 'light' | 'dark', fontSize: 14 },
      validator: (value): value is { theme: 'light' | 'dark'; fontSize: number } => {
        return typeof value === 'object' &&
          'theme' in value &&
          'fontSize' in value &&
          ['light', 'dark'].includes(value.theme) &&
          typeof value.fontSize === 'number';
      }
    }
  });

// TypeScript가 자동으로 인식:
// - useStore('username')는 Store<string> 반환
// - useStore('user')는 Store<{ id: string; name: string; email: string; isAuthenticated: boolean }> 반환
// - useStore('notifications')는 Store<Array<{ id: string; message: string; type: 'info' | 'warning' | 'error' }>> 반환
// - useStore('settings')는 Store<{ theme: 'light' | 'dark'; fontSize: number }> 반환
```

## 스토어 설정 패턴

### 단순 값 설정

원시 타입을 위한 직접 값 할당:

```typescript
const simpleConfig = {
  // string 타입 추론
  title: 'My App',
  
  // number 타입 추론
  counter: 0,
  
  // boolean 타입 추론
  isLoading: false,
  
  // null 유니온 타입 추론
  selectedItem: null as string | null,
  
  // 명시적 타이핑으로 배열 타입 추론
  items: [] as Array<{ id: string; name: string }>
};

const { useStore } = createDeclarativeStorePattern('Simple', simpleConfig);

// TypeScript가 정확한 타입을 인식:
const titleStore = useStore('title');      // Store<string>
const counterStore = useStore('counter');  // Store<number>
const itemsStore = useStore('items');      // Store<Array<{ id: string; name: string }>>
```

### 고급 설정

검증기와 복잡한 객체:

```typescript
const advancedConfig = {
  // 중첩 구조를 가진 복잡한 객체
  userProfile: {
    personal: {
      firstName: '',
      lastName: '',
      dateOfBirth: null as Date | null
    },
    contact: {
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        country: ''
      }
    },
    preferences: {
      notifications: true,
      theme: 'light' as 'light' | 'dark',
      language: 'ko' as 'ko' | 'en' | 'es'
    }
  },
  
  // 런타임 검증을 위한 검증기
  appSettings: {
    initialValue: {
      maxRetries: 3,
      timeout: 5000,
      enableAnalytics: true
    },
    validator: (value): value is { maxRetries: number; timeout: number; enableAnalytics: boolean } => {
      return typeof value === 'object' &&
        typeof value.maxRetries === 'number' && value.maxRetries >= 0 &&
        typeof value.timeout === 'number' && value.timeout > 0 &&
        typeof value.enableAnalytics === 'boolean';
    }
  },
  
  // 계산된 초기값
  sessionInfo: {
    id: generateSessionId(),
    startTime: Date.now(),
    lastActivity: Date.now(),
    isActive: true
  }
};

const { useStore } = createDeclarativeStorePattern('Advanced', advancedConfig);
```

## 프로바이더 패턴

### `Provider` 컴포넌트

스토어를 자식 컴포넌트에서 사용할 수 있게 해주는 컨텍스트 프로바이더입니다.

```typescript
function App() {
  return (
    <Provider>
      <UserInterface />
      <DataLayer />
      <NotificationSystem />
    </Provider>
  );
}
```

### `withProvider(Component)` HOC

컴포넌트를 프로바이더로 자동 래핑하는 고차 컴포넌트입니다.

**매개변수:**
- `Component`: 래핑할 React 컴포넌트

**반환값:** 프로바이더로 래핑된 컴포넌트

```typescript
// 수동 프로바이더 래핑
function ManualApp() {
  return (
    <Provider>
      <UserInterface />
    </Provider>
  );
}

// HOC로 자동 프로바이더 래핑
const AutoApp = withProvider(() => (
  <UserInterface />
));

// 두 접근 방식은 동일합니다
export default AutoApp;
```

## 스토어 타입 안전성

### 타입 추론 예제

```typescript
const config = {
  // 원시 타입
  userName: 'john',           // Store<string>
  age: 25,                   // Store<number>
  isActive: true,            // Store<boolean>
  
  // 객체
  profile: {                 // Store<{ name: string; email: string }>
    name: 'John Doe',
    email: 'john@example.com'
  },
  
  // 명시적 타이핑이 있는 배열
  tags: [] as string[],      // Store<string[]>
  
  // 복잡한 배열
  items: [] as Array<{       // Store<Array<{ id: string; title: string; completed: boolean }>>
    id: string;
    title: string;
    completed: boolean;
  }>,
  
  // 유니온 타입
  status: 'idle' as 'idle' | 'loading' | 'success' | 'error',  // Store<'idle' | 'loading' | 'success' | 'error'>
  
  // 선택적 속성
  selectedId: null as string | null,  // Store<string | null>
  
  // Date 객체
  lastUpdated: new Date(),   // Store<Date>
  
  // 제네릭 객체
  metadata: {} as Record<string, any>  // Store<Record<string, any>>
};

function TypeSafeComponent() {
  // 모든 것들이 완벽한 타입 추론을 가집니다
  const userNameStore = useStore('userName');        // Store<string>
  const profileStore = useStore('profile');          // Store<{ name: string; email: string }>
  const statusStore = useStore('status');            // Store<'idle' | 'loading' | 'success' | 'error'>
  
  // 값들이 적절히 타입화됩니다
  const userName = useStoreValue(userNameStore);     // string
  const profile = useStoreValue(profileStore);       // { name: string; email: string }
  const status = useStoreValue(statusStore);         // 'idle' | 'loading' | 'success' | 'error'
  
  // 스토어 메서드들이 타입 안전합니다
  userNameStore.setValue('newName');                 // ✅ string
  // userNameStore.setValue(123);                    // ❌ TypeScript 에러
  
  profileStore.update(current => ({                  // ✅ 적절한 객체 구조
    ...current,
    name: 'Updated Name'
  }));
  
  statusStore.setValue('loading');                   // ✅ 유효한 유니온 값
  // statusStore.setValue('invalid');               // ❌ TypeScript 에러
  
  return <div>타입 안전한 컴포넌트</div>;
}
```

## 스토어 설정 검증

### 런타임 검증

```typescript
const validatedConfig = {
  userSettings: {
    initialValue: {
      theme: 'light' as 'light' | 'dark',
      fontSize: 14,
      notifications: true
    },
    validator: (value): value is { theme: 'light' | 'dark'; fontSize: number; notifications: boolean } => {
      return typeof value === 'object' &&
        value !== null &&
        'theme' in value &&
        'fontSize' in value &&
        'notifications' in value &&
        ['light', 'dark'].includes(value.theme) &&
        typeof value.fontSize === 'number' &&
        value.fontSize >= 8 && value.fontSize <= 32 &&
        typeof value.notifications === 'boolean';
    }
  },
  
  apiConfiguration: {
    initialValue: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3
    },
    validator: (value): value is { baseUrl: string; timeout: number; retries: number } => {
      return typeof value === 'object' &&
        value !== null &&
        'baseUrl' in value &&
        'timeout' in value &&
        'retries' in value &&
        typeof value.baseUrl === 'string' &&
        value.baseUrl.startsWith('https://') &&
        typeof value.timeout === 'number' &&
        value.timeout > 0 &&
        typeof value.retries === 'number' &&
        value.retries >= 0;
    }
  }
};

function ValidatedStoreUsage() {
  const settingsStore = useStore('userSettings');
  
  const updateTheme = (newTheme: 'light' | 'dark') => {
    try {
      settingsStore.update(current => ({
        ...current,
        theme: newTheme
      }));
      console.log('테마 업데이트 성공');
    } catch (error) {
      console.error('테마 업데이트 검증 실패:', error);
      // 검증 에러 처리
    }
  };
  
  return <button onClick={() => updateTheme('dark')}>다크 테마</button>;
}
```

## 고급 스토어 패턴

### 계산된 스토어 값

```typescript
function ComputedValues() {
  const userStore = useStore('user');
  const settingsStore = useStore('settings');
  
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  // 적절한 타이핑을 가진 계산된 값
  const displayName = useMemo(() => {
    return user.name || user.email?.split('@')[0] || '익명';
  }, [user.name, user.email]);
  
  const themeClass = useMemo(() => {
    return `theme-${settings.theme}`;
  }, [settings.theme]);
  
  const userStatus = useMemo(() => {
    if (!user.isAuthenticated) return 'guest';
    if (user.isAdmin) return 'admin';
    return 'user';
  }, [user.isAuthenticated, user.isAdmin]);
  
  return (
    <div className={themeClass}>
      <span>환영합니다 {displayName} ({userStatus})</span>
    </div>
  );
}
```

### 스토어 관계

```typescript
function RelatedStores() {
  const userStore = useStore('user');
  const preferencesStore = useStore('preferences');
  const cacheStore = useStore('cache');
  
  // 사용자 변경사항을 설정과 동기화
  useEffect(() => {
    return userStore.subscribe((newUser, previousUser) => {
      if (newUser.id !== previousUser?.id) {
        // 사용자가 변경됨 - 설정 로드
        preferencesStore.setValue({
          theme: newUser.preferredTheme || 'light',
          language: newUser.language || 'ko',
          notifications: newUser.notificationsEnabled ?? true
        });
      }
    });
  }, [userStore, preferencesStore]);
  
  // 사용자 데이터 캐싱
  useEffect(() => {
    return userStore.subscribe((newUser) => {
      cacheStore.update(cache => ({
        ...cache,
        lastUser: newUser,
        lastUserUpdate: Date.now()
      }));
    });
  }, [userStore, cacheStore]);
  
  return null;
}
```

### 스토어 지속성

```typescript
function PersistentStores() {
  const storeManager = useStoreManager();
  
  // 변경사항을 localStorage에 저장
  useEffect(() => {
    const persistentStores = ['user', 'settings', 'preferences'];
    const unsubscribers: (() => void)[] = [];
    
    persistentStores.forEach(storeName => {
      const store = storeManager.getStore(storeName);
      
      const unsubscribe = store.subscribe((newValue) => {
        try {
          localStorage.setItem(`store_${storeName}`, JSON.stringify(newValue));
        } catch (error) {
          console.error(`스토어 ${storeName} 지속 실패:`, error);
        }
      });
      
      unsubscribers.push(unsubscribe);
    });
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [storeManager]);
  
  // 마운트 시 localStorage에서 로드
  useEffect(() => {
    const persistentStores = ['user', 'settings', 'preferences'];
    
    persistentStores.forEach(storeName => {
      try {
        const saved = localStorage.getItem(`store_${storeName}`);
        if (saved) {
          const value = JSON.parse(saved);
          const store = storeManager.getStore(storeName);
          store.setValue(value);
        }
      } catch (error) {
        console.error(`스토어 ${storeName} 로드 실패:`, error);
      }
    });
  }, [storeManager]);
  
  return null;
}
```

## React 통합 패턴

### 컴포넌트 패턴 통합

```typescript
// 스토어 설정 정의
const appStoreConfig = {
  todos: [] as Array<{
    id: string;
    text: string;
    completed: boolean;
    createdAt: Date;
  }>,
  
  filter: 'all' as 'all' | 'active' | 'completed',
  
  ui: {
    loading: false,
    error: null as string | null,
    editingId: null as string | null
  }
};

const {
  Provider: TodoStoreProvider,
  useStore: useTodoStore,
  useStoreManager: useTodoStoreManager,
  withProvider: withTodoStoreProvider
} = createDeclarativeStorePattern('TodoApp', appStoreConfig);

// 패턴을 사용하는 컴포넌트
const TodoApp = withTodoStoreProvider(() => {
  return (
    <div className="todo-app">
      <TodoHeader />
      <TodoList />
      <TodoFooter />
    </div>
  );
});

function TodoList() {
  const todosStore = useTodoStore('todos');
  const filterStore = useTodoStore('filter');
  const uiStore = useTodoStore('ui');
  
  const todos = useStoreValue(todosStore);
  const filter = useStoreValue(filterStore);
  const ui = useStoreValue(uiStore);
  
  // 적절한 타이핑을 가진 필터링된 할 일
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active': return todos.filter(todo => !todo.completed);
      case 'completed': return todos.filter(todo => todo.completed);
      default: return todos;
    }
  }, [todos, filter]);
  
  const addTodo = (text: string) => {
    todosStore.update(current => [...current, {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date()
    }]);
  };
  
  const toggleTodo = (id: string) => {
    todosStore.update(current => 
      current.map(todo => 
        todo.id === id 
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };
  
  const removeTodo = (id: string) => {
    todosStore.update(current => current.filter(todo => todo.id !== id));
  };
  
  return (
    <div className="todo-list">
      {filteredTodos.map(todo => (
        <TodoItem 
          key={todo.id}
          todo={todo}
          onToggle={() => toggleTodo(todo.id)}
          onRemove={() => removeTodo(todo.id)}
        />
      ))}
    </div>
  );
}
```

### 스토어 매니저 통합

```typescript
function TodoManager() {
  const storeManager = useTodoStoreManager();
  
  const exportTodos = () => {
    const state = storeManager.exportState();
    const todoData = {
      todos: state.todos,
      filter: state.filter,
      exportedAt: new Date().toISOString()
    };
    
    const json = JSON.stringify(todoData, null, 2);
    downloadAsFile(json, 'todos.json');
  };
  
  const importTodos = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.todos && Array.isArray(data.todos)) {
          const todosStore = storeManager.getStore('todos');
          todosStore.setValue(data.todos);
          
          if (data.filter) {
            const filterStore = storeManager.getStore('filter');
            filterStore.setValue(data.filter);
          }
        }
      } catch (error) {
        console.error('가져오기 실패:', error);
      }
    };
    reader.readAsText(file);
  };
  
  const clearAllData = () => {
    if (confirm('모든 할 일을 지우시겠습니까?')) {
      storeManager.resetAll();
    }
  };
  
  return (
    <div className="todo-manager">
      <button onClick={exportTodos}>할 일 내보내기</button>
      <input 
        type="file" 
        accept=".json" 
        onChange={(e) => e.target.files?.[0] && importTodos(e.target.files[0])} 
      />
      <button onClick={clearAllData}>모두 지우기</button>
    </div>
  );
}
```

## 성능 최적화

### 선택적 재렌더링

```typescript
function OptimizedComponent() {
  const userStore = useStore('user');
  
  // 이름이 변경될 때만 재렌더링
  const userName = useStoreValue(userStore, user => user.name);
  
  // 인증 상태가 변경될 때만 재렌더링
  const isAuthenticated = useStoreValue(userStore, user => user.isAuthenticated);
  
  // 메모화된 비용이 많이 드는 계산
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(userName);
  }, [userName]);
  
  return (
    <div>
      {isAuthenticated ? (
        <span>환영합니다 {userName}</span>
      ) : (
        <span>로그인해주세요</span>
      )}
      <div>계산된 값: {expensiveValue}</div>
    </div>
  );
}
```

### 일괄 업데이트

```typescript
function BatchedUpdater() {
  const userStore = useStore('user');
  const settingsStore = useStore('settings');
  const uiStore = useStore('ui');
  
  const updateUserProfile = (profileData: any) => {
    // 여러 스토어 업데이트를 일괄 처리
    const updates = [
      () => userStore.update(current => ({
        ...current,
        ...profileData,
        lastUpdated: Date.now()
      })),
      () => settingsStore.update(current => ({
        ...current,
        lastProfileUpdate: Date.now()
      })),
      () => uiStore.update(current => ({
        ...current,
        notification: {
          message: '프로필이 성공적으로 업데이트되었습니다',
          type: 'success' as const
        }
      }))
    ];
    
    // 모든 업데이트 실행
    updates.forEach(update => update());
  };
  
  return (
    <button onClick={() => updateUserProfile({ name: '새 이름' })}>
      프로필 업데이트
    </button>
  );
}
```

## 고급 타입 패턴

### 조건부 스토어 타입

```typescript
// 조건부 타입을 가진 설정
const conditionalConfig = {
  // 사용자 유형에 따른 다른 형태
  userData: null as {
    type: 'guest';
    sessionId: string;
  } | {
    type: 'user';
    id: string;
    name: string;
    email: string;
  } | {
    type: 'admin';
    id: string;
    name: string;
    email: string;
    permissions: string[];
  } | null,
  
  // 타입 안전성을 가진 상태 머신
  requestState: {
    status: 'idle',
    data: null,
    error: null
  } as 
    | { status: 'idle'; data: null; error: null }
    | { status: 'loading'; data: null; error: null }
    | { status: 'success'; data: any; error: null }
    | { status: 'error'; data: null; error: string }
};

function ConditionalComponent() {
  const userDataStore = useStore('userData');
  const requestStore = useStore('requestState');
  
  const userData = useStoreValue(userDataStore);
  const requestState = useStoreValue(requestStore);
  
  // 타입 안전한 조건부 렌더링
  if (userData?.type === 'admin') {
    // TypeScript가 userData에 permissions 속성이 있다는 것을 인식
    return <AdminPanel permissions={userData.permissions} />;
  }
  
  if (userData?.type === 'user') {
    // TypeScript가 userData에 사용자 속성들이 있다는 것을 인식
    return <UserPanel user={userData} />;
  }
  
  // 요청 상태 처리
  switch (requestState.status) {
    case 'loading':
      return <LoadingSpinner />;
    case 'success':
      // TypeScript가 data가 사용 가능하다는 것을 인식
      return <SuccessView data={requestState.data} />;
    case 'error':
      // TypeScript가 error가 사용 가능하다는 것을 인식
      return <ErrorView error={requestState.error} />;
    default:
      return <IdleView />;
  }
}
```

### 제네릭 스토어 설정

```typescript
// 제네릭 설정 헬퍼
function createTypedStoreConfig<T extends Record<string, any>>(config: T) {
  return config;
}

// 완벽한 타입 추론과 함께 사용
const typedConfig = createTypedStoreConfig({
  products: [] as Array<{
    id: string;
    name: string;
    price: number;
    category: string;
  }>,
  
  cart: {
    items: [] as Array<{
      productId: string;
      quantity: number;
      addedAt: Date;
    }>,
    total: 0,
    currency: 'KRW' as const
  },
  
  checkout: {
    step: 1 as 1 | 2 | 3 | 4,
    isProcessing: false,
    paymentMethod: null as 'card' | 'paypal' | null
  }
});

const { useStore, withProvider } = createDeclarativeStorePattern('Shop', typedConfig);
```

## 외부 시스템과의 통합

### Redux DevTools 통합

```typescript
function DevToolsIntegration() {
  const storeManager = useStoreManager();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
      const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        name: 'Context-Action Stores'
      });
      
      // 초기 상태 전송
      devTools.init(storeManager.exportState());
      
      // 모든 스토어 변경사항 구독
      const stores = storeManager.getAllStores();
      const unsubscribers: (() => void)[] = [];
      
      for (const [storeName, store] of stores) {
        const unsubscribe = store.subscribe((newValue, previousValue) => {
          devTools.send(
            { type: `UPDATE_${storeName.toUpperCase()}`, payload: newValue },
            storeManager.exportState()
          );
        });
        
        unsubscribers.push(unsubscribe);
      }
      
      return () => {
        unsubscribers.forEach(unsub => unsub());
        devTools.disconnect();
      };
    }
  }, [storeManager]);
  
  return null;
}
```

## 베스트 프랙티스

### 1. 설정 디자인
- 복잡한 타입에는 명시적 타입 주석 사용
- 런타임 안전성을 위한 검증기 제공
- 목적을 반영하는 의미 있는 스토어 이름 사용

### 2. 타입 안전성
- TypeScript의 타입 추론 활용
- 상태 머신을 위한 유니온 타입 사용
- 사용자 입력에 대한 적절한 검증 구현

### 3. 성능
- 선택자와 함께 선택적 구독 사용
- 관련 업데이트를 함께 일괄 처리
- 계산된 값에 대한 적절한 메모화 구현

### 4. 통합
- 깔끔한 프로바이더 래핑을 위한 HOC 패턴 사용
- 적절한 지속성 전략 구현
- 디버깅을 위한 DevTools 통합 고려

### 5. 테스트
- 다양한 데이터 형태로 스토어 설정 테스트
- 검증기가 올바르게 작동하는지 검증
- 지속성 및 복원 로직 테스트

## 관련 자료

- **[Store Only 메서드](./store-only.md)** - 개별 스토어 메서드 및 작업
- **[스토어 매니저 API](./store-manager.md)** - 스토어 매니저 고급 작업
- **[Store Only 예제](../examples/store-only.md)** - 완전한 사용 예제