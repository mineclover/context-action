# 예제

Context Action을 실제로 사용하는 다양한 예제들을 살펴보세요. 각 예제는 실용적인 사용 사례를 바탕으로 작성되었습니다.

## 기본 예제

### 간단한 카운터

가장 기본적인 Context Action 사용 예제입니다.

```typescript
import React, { useState } from 'react';
import { createActionContext } from '@context-action/react';

interface CounterActions {
  increment: void;
  decrement: void;
  setCount: number;
  reset: void;
}

const { Provider, useAction, useActionHandler } = createActionContext<CounterActions>();

function Counter() {
  const [count, setCount] = useState(0);
  const action = useAction();

  useActionHandler('increment', () => setCount(prev => prev + 1));
  useActionHandler('decrement', () => setCount(prev => prev - 1));
  useActionHandler('setCount', (value) => setCount(value));
  useActionHandler('reset', () => setCount(0));

  return (
    <div>
      <h2>카운터: {count}</h2>
      <div>
        <button onClick={() => action.dispatch('increment')}>+1</button>
        <button onClick={() => action.dispatch('decrement')}>-1</button>
        <button onClick={() => action.dispatch('setCount', 10)}>10으로 설정</button>
        <button onClick={() => action.dispatch('reset')}>리셋</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}
```

## 실용적인 예제

### 할 일 목록 (Todo List)

복잡한 상태 관리와 비동기 작업을 포함한 실용적인 예제입니다.

```typescript
import React, { useState, useEffect } from 'react';
import { createActionContext } from '@context-action/react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoActions {
  addTodo: { text: string };
  toggleTodo: { id: string };
  deleteTodo: { id: string };
  editTodo: { id: string; text: string };
  clearCompleted: void;
  loadTodos: void;
  saveTodos: void;
}

const { Provider, useAction, useActionHandler } = createActionContext<TodoActions>();

// 로컬 스토리지 유틸리티
const TodoStorage = {
  load: (): Todo[] => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  },
  save: (todos: Todo[]) => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }
};

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const action = useAction();

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    action.dispatch('loadTodos');
  }, [action]);

  // 액션 핸들러 등록
  useActionHandler('addTodo', ({ text }) => {
    if (!text.trim()) return;
    
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setTodos(prev => [...prev, newTodo]);
    setInputText('');
  });

  useActionHandler('toggleTodo', ({ id }) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  });

  useActionHandler('deleteTodo', ({ id }) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  });

  useActionHandler('editTodo', ({ id, text }) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, text } : todo
      )
    );
  });

  useActionHandler('clearCompleted', () => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  });

  useActionHandler('loadTodos', () => {
    const savedTodos = TodoStorage.load();
    setTodos(savedTodos);
  });

  useActionHandler('saveTodos', () => {
    TodoStorage.save(todos);
  });

  // 자동 저장
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      action.dispatch('saveTodos');
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [todos, action]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    action.dispatch('addTodo', { text: inputText });
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>할 일 목록</h1>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="새로운 할 일을 입력하세요..."
          style={{ width: '70%', padding: '8px', marginRight: '10px' }}
        />
        <button type="submit">추가</button>
      </form>

      <div style={{ margin: '20px 0' }}>
        <span>전체: {totalCount}, 완료: {completedCount}</span>
        {completedCount > 0 && (
          <button
            onClick={() => action.dispatch('clearCompleted')}
            style={{ marginLeft: '10px' }}
          >
            완료된 항목 삭제
          </button>
        )}
      </div>

      <TodoList todos={todos} />
    </div>
  );
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const action = useAction();

  const handleSave = () => {
    if (editText.trim() && editText !== todo.text) {
      action.dispatch('editTodo', { id: todo.id, text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  return (
    <li style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '10px',
      borderBottom: '1px solid #eee'
    }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => action.dispatch('toggleTodo', { id: todo.id })}
        style={{ marginRight: '10px' }}
      />
      
      {isEditing ? (
        <div style={{ flex: 1, display: 'flex' }}>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            style={{ flex: 1, marginRight: '10px' }}
            autoFocus
          />
          <button onClick={handleSave}>저장</button>
          <button onClick={handleCancel}>취소</button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
          <span
            style={{
              textDecoration: todo.completed ? 'line-through' : 'none',
              opacity: todo.completed ? 0.6 : 1
            }}
          >
            {todo.text}
          </span>
          <div>
            <button
              onClick={() => setIsEditing(true)}
              disabled={todo.completed}
              style={{ marginRight: '5px' }}
            >
              수정
            </button>
            <button onClick={() => action.dispatch('deleteTodo', { id: todo.id })}>
              삭제
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function App() {
  return (
    <Provider>
      <TodoApp />
    </Provider>
  );
}

export default App;
```

### 사용자 인증 시스템

비동기 작업과 에러 처리를 포함한 인증 시스템 예제입니다.

```typescript
import React, { useState, useEffect } from 'react';
import { createActionContext } from '@context-action/react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: { email: string; password: string };
  logout: void;
  register: { email: string; password: string; name: string };
  updateProfile: { name: string; avatar?: string };
  clearError: void;
  checkAuth: void;
}

const { Provider, useAction, useActionHandler } = createActionContext<AuthActions>();

// Mock API 서비스
const AuthService = {
  login: async (email: string, password: string): Promise<User> => {
    // 실제로는 서버 API 호출
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'admin@example.com' && password === 'password') {
      return {
        id: '1',
        email: 'admin@example.com',
        name: '관리자',
        avatar: 'https://via.placeholder.com/100'
      };
    }
    
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  },

  register: async (email: string, password: string, name: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: Date.now().toString(),
      email,
      name,
      avatar: 'https://via.placeholder.com/100'
    };
  },

  getCurrentUser: async (): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  },

  updateProfile: async (user: User, updates: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return { ...user, ...updates };
  }
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null
  });

  const action = useAction();

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    action.dispatch('checkAuth');
  }, [action]);

  // 액션 핸들러 등록
  useActionHandler('login', async ({ email, password }) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const user = await AuthService.login(email, password);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuthState(prev => ({ ...prev, user, loading: false }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '로그인 실패',
        loading: false
      }));
    }
  });

  useActionHandler('logout', () => {
    localStorage.removeItem('currentUser');
    setAuthState({ user: null, loading: false, error: null });
  });

  useActionHandler('register', async ({ email, password, name }) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const user = await AuthService.register(email, password, name);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuthState(prev => ({ ...prev, user, loading: false }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '회원가입 실패',
        loading: false
      }));
    }
  });

  useActionHandler('updateProfile', async ({ name, avatar }) => {
    if (!authState.user) return;
    
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedUser = await AuthService.updateProfile(authState.user, { name, avatar });
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setAuthState(prev => ({ ...prev, user: updatedUser, loading: false }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '프로필 업데이트 실패',
        loading: false
      }));
    }
  });

  useActionHandler('clearError', () => {
    setAuthState(prev => ({ ...prev, error: null }));
  });

  useActionHandler('checkAuth', async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const user = await AuthService.getCurrentUser();
      setAuthState(prev => ({ ...prev, user, loading: false }));
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  });

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

// Context를 통한 상태 공유
const AuthContext = React.createContext<AuthState>({
  user: null,
  loading: false,
  error: null
});

function useAuth() {
  return React.useContext(AuthContext);
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error } = useAuth();
  const action = useAction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    action.dispatch('login', { email, password });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>로그인</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
          <button 
            type="button" 
            onClick={() => action.dispatch('clearError')}
            style={{ marginLeft: '10px' }}
          >
            ✕
          </button>
        </div>
      )}
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        style={{ width: '100%', padding: '10px' }}
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
      
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        테스트: admin@example.com / password
      </p>
    </form>
  );
}

function UserProfile() {
  const { user } = useAuth();
  const action = useAction();

  if (!user) return null;

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2>프로필</h2>
      
      {user.avatar && (
        <img 
          src={user.avatar} 
          alt={user.name}
          style={{ width: '100px', height: '100px', borderRadius: '50%' }}
        />
      )}
      
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      
      <button onClick={() => action.dispatch('logout')}>
        로그아웃
      </button>
    </div>
  );
}

function AuthApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center' }}>로딩 중...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {user ? <UserProfile /> : <LoginForm />}
    </div>
  );
}

function App() {
  return (
    <Provider>
      <AuthProvider>
        <AuthApp />
      </AuthProvider>
    </Provider>
  );
}

export default App;
```

## Jotai 통합 예제

### 원자적 상태 관리

Jotai와 함께 사용하는 고급 예제입니다.

```typescript
import React from 'react';
import { atom, useAtom, useAtomValue, Provider } from 'jotai';
import { createActionAtom } from '@context-action/jotai';

// 상태 atoms
const countAtom = atom(0);
const nameAtom = atom('');
const themeAtom = atom<'light' | 'dark'>('light');

// 파생 atom
const doubleCountAtom = atom((get) => get(countAtom) * 2);
const greetingAtom = atom((get) => {
  const name = get(nameAtom);
  return name ? `안녕하세요, ${name}님!` : '이름을 입력해주세요';
});

// 액션 인터페이스
interface AppActions {
  increment: void;
  decrement: void;
  setCount: number;
  setName: string;
  toggleTheme: void;
  reset: void;
}

const actionAtom = createActionAtom<AppActions>();

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubleCount = useAtomValue(doubleCountAtom);
  const { dispatch, addHandler } = useActionAtom(actionAtom);

  React.useEffect(() => {
    const removeHandlers = [
      addHandler('increment', () => setCount(prev => prev + 1)),
      addHandler('decrement', () => setCount(prev => prev - 1)),
      addHandler('setCount', (value) => setCount(value)),
      addHandler('reset', () => setCount(0))
    ];

    return () => removeHandlers.forEach(remove => remove());
  }, [addHandler, setCount]);

  return (
    <div>
      <h3>카운터</h3>
      <p>현재 값: {count}</p>
      <p>두 배 값: {doubleCount}</p>
      <div>
        <button onClick={() => dispatch('increment')}>+1</button>
        <button onClick={() => dispatch('decrement')}>-1</button>
        <button onClick={() => dispatch('setCount', 10)}>10으로 설정</button>
        <button onClick={() => dispatch('reset')}>리셋</button>
      </div>
    </div>
  );
}

function NameInput() {
  const [name, setName] = useAtom(nameAtom);
  const greeting = useAtomValue(greetingAtom);
  const { dispatch, addHandler } = useActionAtom(actionAtom);

  React.useEffect(() => {
    const removeHandler = addHandler('setName', (newName) => {
      setName(newName);
    });

    return removeHandler;
  }, [addHandler, setName]);

  return (
    <div>
      <h3>이름 입력</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => dispatch('setName', e.target.value)}
        placeholder="이름을 입력하세요"
      />
      <p>{greeting}</p>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);
  const { dispatch, addHandler } = useActionAtom(actionAtom);

  React.useEffect(() => {
    const removeHandler = addHandler('toggleTheme', () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
    });

    return removeHandler;
  }, [addHandler, setTheme]);

  return (
    <div>
      <h3>테마</h3>
      <p>현재 테마: {theme}</p>
      <button onClick={() => dispatch('toggleTheme')}>
        {theme === 'light' ? '다크 모드' : '라이트 모드'}로 변경
      </button>
    </div>
  );
}

function JotaiApp() {
  const theme = useAtomValue(themeAtom);

  return (
    <div style={{
      backgroundColor: theme === 'light' ? '#fff' : '#333',
      color: theme === 'light' ? '#333' : '#fff',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1>Jotai + Context Action 예제</h1>
      <Counter />
      <hr />
      <NameInput />
      <hr />
      <ThemeToggle />
    </div>
  );
}

function App() {
  return (
    <Provider>
      <JotaiApp />
    </Provider>
  );
}

export default App;
```

이러한 예제들을 통해 Context Action의 다양한 활용 방법을 익힐 수 있습니다. 더 복잡한 패턴이나 특정 사용 사례에 대해서는 [고급 사용법 가이드](/ko/guide/advanced)를 참조하세요.