# Jotai API 레퍼런스

`@context-action/jotai` 패키지는 [Jotai](https://jotai.org/) 상태 관리 라이브러리와 Context Action을 통합하여 원자적(atomic) 상태 관리와 타입 안전한 액션 시스템을 결합합니다.

## 설치

```bash
npm install @context-action/core @context-action/jotai jotai react
```

Jotai 2.0 이상과 React 16.8 이상이 필요합니다.

## createActionAtom

Jotai atom과 통합된 액션 시스템을 생성하는 함수입니다.

### 사용법

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { createActionAtom } from '@context-action/jotai';

// 상태 atoms 정의
const countAtom = atom(0);
const userAtom = atom<User | null>(null);

// 액션 인터페이스 정의
interface AppActions {
  increment: void;
  setCount: number;
  updateUser: { user: User };
  reset: void;
}

// 액션 atom 생성
const actionAtom = createActionAtom<AppActions>();
```

### 기본 사용 패턴

```typescript
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const action = useAtomValue(actionAtom);

  // 액션 핸들러는 컴포넌트 외부에서 정의하거나
  // useEffect 내에서 등록
  useEffect(() => {
    const removeHandlers = [
      action.addHandler('increment', () => {
        setCount(prev => prev + 1);
      }),
      
      action.addHandler('setCount', (value) => {
        setCount(value);
      }),
      
      action.addHandler('reset', () => {
        setCount(0);
      })
    ];

    return () => {
      removeHandlers.forEach(remove => remove());
    };
  }, [action, setCount]);

  return (
    <div>
      <p>카운트: {count}</p>
      <button onClick={() => action.dispatch('increment')}>증가</button>
      <button onClick={() => action.dispatch('setCount', 10)}>10으로 설정</button>
      <button onClick={() => action.dispatch('reset')}>리셋</button>
    </div>
  );
}
```

## useActionAtom

액션 atom을 더 편리하게 사용할 수 있는 커스텀 훅입니다.

```typescript
import { useActionAtom } from '@context-action/jotai';

function useCounterActions() {
  const [count, setCount] = useAtom(countAtom);
  
  const { dispatch, addHandler } = useActionAtom(actionAtom);

  // 핸들러 자동 등록 및 정리
  useEffect(() => {
    const removeHandlers = [
      addHandler('increment', () => setCount(prev => prev + 1)),
      addHandler('setCount', (value) => setCount(value)),
      addHandler('reset', () => setCount(0))
    ];

    return () => removeHandlers.forEach(remove => remove());
  }, [addHandler, setCount]);

  return { count, dispatch };
}

function Counter() {
  const { count, dispatch } = useCounterActions();

  return (
    <div>
      <p>카운트: {count}</p>
      <button onClick={() => dispatch('increment')}>증가</button>
      <button onClick={() => dispatch('setCount', 10)}>10으로 설정</button>
      <button onClick={() => dispatch('reset')}>리셋</button>
    </div>
  );
}
```

## 고급 패턴

### 원자적 상태 업데이트

여러 atom을 조합하여 복잡한 상태를 관리:

```typescript
// 상태 atoms
const userAtom = atom<User | null>(null);
const postsAtom = atom<Post[]>([]);
const loadingAtom = atom(false);
const errorAtom = atom<string | null>(null);

// 파생 atom
const userPostsAtom = atom((get) => {
  const user = get(userAtom);
  const posts = get(postsAtom);
  return user ? posts.filter(post => post.userId === user.id) : [];
});

// 액션 인터페이스
interface BlogActions {
  loadUser: { id: number };
  loadPosts: void;
  createPost: { title: string; content: string };
  deletePost: { id: number };
}

const blogActionAtom = createActionAtom<BlogActions>();

function useBlogActions() {
  const setUser = useSetAtom(userAtom);
  const setPosts = useSetAtom(postsAtom);
  const setLoading = useSetAtom(loadingAtom);
  const setError = useSetAtom(errorAtom);
  
  const { dispatch, addHandler } = useActionAtom(blogActionAtom);

  useEffect(() => {
    const removeHandlers = [
      addHandler('loadUser', async ({ id }) => {
        setLoading(true);
        setError(null);
        
        try {
          const user = await api.getUser(id);
          setUser(user);
        } catch (error) {
          setError('사용자 로드 실패');
        } finally {
          setLoading(false);
        }
      }),

      addHandler('loadPosts', async () => {
        setLoading(true);
        setError(null);
        
        try {
          const posts = await api.getPosts();
          setPosts(posts);
        } catch (error) {
          setError('포스트 로드 실패');
        } finally {
          setLoading(false);
        }
      }),

      addHandler('createPost', async ({ title, content }) => {
        setLoading(true);
        setError(null);
        
        try {
          const newPost = await api.createPost({ title, content });
          setPosts(prev => [...prev, newPost]);
        } catch (error) {
          setError('포스트 생성 실패');
        } finally {
          setLoading(false);
        }
      }),

      addHandler('deletePost', async ({ id }) => {
        try {
          await api.deletePost(id);
          setPosts(prev => prev.filter(post => post.id !== id));
        } catch (error) {
          setError('포스트 삭제 실패');
        }
      })
    ];

    return () => removeHandlers.forEach(remove => remove());
  }, [addHandler, setUser, setPosts, setLoading, setError]);

  return { dispatch };
}
```

### Atom 기반 미들웨어

Jotai의 atom을 활용한 미들웨어 패턴:

```typescript
// 로깅 atom
const actionLogAtom = atom<Array<{ action: string; timestamp: Date; payload: any }>>([]);

function useActionLogger() {
  const setActionLog = useSetAtom(actionLogAtom);
  const { addHandler } = useActionAtom(actionAtom);

  useEffect(() => {
    // 모든 액션을 로깅하는 와일드카드 핸들러
    const removeHandler = addHandler('*' as any, (payload: any, actionType: string) => {
      setActionLog(prev => [
        ...prev.slice(-99), // 최근 100개만 유지
        {
          action: actionType,
          timestamp: new Date(),
          payload
        }
      ]);
    }, { priority: 1000 });

    return removeHandler;
  }, [addHandler, setActionLog]);
}
```

### 영속성(Persistence) 통합

```typescript
import { atomWithStorage } from 'jotai/utils';

// 로컬 스토리지와 동기화되는 atom
const persistentCountAtom = atomWithStorage('count', 0);
const persistentUserAtom = atomWithStorage<User | null>('user', null);

interface PersistentActions {
  increment: void;
  setUser: { user: User };
  clearAll: void;
}

function usePersistentActions() {
  const [count, setCount] = useAtom(persistentCountAtom);
  const [user, setUser] = useAtom(persistentUserAtom);
  const { dispatch, addHandler } = useActionAtom(createActionAtom<PersistentActions>());

  useEffect(() => {
    const removeHandlers = [
      addHandler('increment', () => {
        setCount(prev => prev + 1);
        // 자동으로 로컬 스토리지에 저장됨
      }),

      addHandler('setUser', ({ user }) => {
        setUser(user);
        // 자동으로 로컬 스토리지에 저장됨
      }),

      addHandler('clearAll', () => {
        setCount(0);
        setUser(null);
        // 로컬 스토리지도 함께 정리됨
      })
    ];

    return () => removeHandlers.forEach(remove => remove());
  }, [addHandler, setCount, setUser]);

  return { count, user, dispatch };
}
```

## 성능 최적화

### 선택적 구독

Jotai의 장점을 활용하여 필요한 상태만 구독:

```typescript
const appStateAtom = atom({
  user: null as User | null,
  posts: [] as Post[],
  loading: false,
  error: null as string | null
});

// 특정 부분만 구독하는 파생 atom들
const userAtom = atom((get) => get(appStateAtom).user);
const postsAtom = atom((get) => get(appStateAtom).posts);
const loadingAtom = atom((get) => get(appStateAtom).loading);

function UserProfile() {
  // user가 변경될 때만 리렌더링
  const user = useAtomValue(userAtom);
  
  return user ? <div>{user.name}</div> : <div>로그인 필요</div>;
}

function LoadingIndicator() {
  // loading이 변경될 때만 리렌더링
  const loading = useAtomValue(loadingAtom);
  
  return loading ? <div>로딩 중...</div> : null;
}
```

### 배치 업데이트

여러 atom을 동시에 업데이트:

```typescript
function useBatchedActions() {
  const setUser = useSetAtom(userAtom);
  const setPosts = useSetAtom(postsAtom);
  const setLoading = useSetAtom(loadingAtom);
  
  const { dispatch, addHandler } = useActionAtom(actionAtom);

  useEffect(() => {
    const removeHandler = addHandler('loadUserData', async ({ id }) => {
      setLoading(true);
      
      try {
        // 동시에 여러 요청 실행
        const [user, posts] = await Promise.all([
          api.getUser(id),
          api.getUserPosts(id)
        ]);
        
        // React의 자동 배치 처리 활용
        setUser(user);
        setPosts(posts);
      } finally {
        setLoading(false);
      }
    });

    return removeHandler;
  }, [addHandler, setUser, setPosts, setLoading]);

  return { dispatch };
}
```

## 타입 안전성

### 타입 추론 활용

```typescript
// 액션 타입에서 자동으로 페이로드 타입 추론
interface TypedActions {
  updateUser: { id: number; name: string; email: string };
  deletePost: { postId: string };
  setTheme: 'light' | 'dark';
}

const typedActionAtom = createActionAtom<TypedActions>();

function MyComponent() {
  const { dispatch } = useActionAtom(typedActionAtom);

  // 타입 체크됨: id는 number, name과 email은 string이어야 함
  dispatch('updateUser', { 
    id: 1, 
    name: 'John', 
    email: 'john@example.com' 
  });

  // 타입 체크됨: 'light' 또는 'dark'만 허용
  dispatch('setTheme', 'light');
}
```

## 테스팅

Jotai와 함께 테스트하는 방법:

```typescript
import { Provider } from 'jotai';
import { render, screen, fireEvent } from '@testing-library/react';

describe('Jotai Integration', () => {
  it('should update atom state through actions', async () => {
    function TestComponent() {
      const [count, setCount] = useAtom(countAtom);
      const { dispatch, addHandler } = useActionAtom(actionAtom);

      useEffect(() => {
        const removeHandler = addHandler('increment', () => {
          setCount(prev => prev + 1);
        });
        return removeHandler;
      }, [addHandler, setCount]);

      return (
        <div>
          <span data-testid="count">{count}</span>
          <button onClick={() => dispatch('increment')}>증가</button>
        </div>
      );
    }

    render(
      <Provider>
        <TestComponent />
      </Provider>
    );

    const countElement = screen.getByTestId('count');
    const button = screen.getByText('증가');

    expect(countElement).toHaveTextContent('0');

    fireEvent.click(button);

    expect(countElement).toHaveTextContent('1');
  });
});
```

## 마이그레이션 가이드

### React Context에서 Jotai로

```typescript
// 기존 React Context 방식
const { Provider, useAction, useActionHandler } = createActionContext<Actions>();

function App() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}

// Jotai 통합 방식
import { Provider } from 'jotai';

function App() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}

function Counter() {
  const { dispatch } = useActionAtom(actionAtom);
  // atom 기반 상태 관리
}
```

Jotai 통합은 Context Action의 타입 안전성을 유지하면서 더 세밀한 상태 관리와 성능 최적화를 제공합니다. [고급 사용법](/ko/guide/advanced)이나 [Jotai 공식 문서](https://jotai.org/)에서 더 많은 패턴을 살펴보세요.