# 모범 사례

## 개요

이 가이드는 Context-Action 프레임워크를 사용하여 견고하고 유지보수 가능하며 성능이 뛰어난 애플리케이션을 개발하기 위한 포괄적인 모범 사례를 제공합니다. 이러한 사례를 따르면 애플리케이션이 잘 확장되고, 테스트 가능하며, 훌륭한 개발자 경험을 제공할 수 있습니다.

### 핵심 원칙

- **🎯 명확성보다 영리함**: 이해하고 유지보수하기 쉬운 코드 작성
- **🔒 타입 안전성 우선**: 애플리케이션 전반에 걸쳐 TypeScript 활용
- **🧪 테스트 주도 개발**: 비즈니스 로직과 통합을 검증하는 테스트 작성
- **⚡ 설계로 인한 성능**: 처음부터 성능 영향을 고려
- **🛡️ 에러 처리**: 실패 시나리오를 계획하고 우아한 복구 제공
- **📚 문서화**: 복잡한 비즈니스 로직과 아키텍처 결정 문서화

## 액션 설계 모범 사례

### 1. ✅ 액션 구조와 조직

#### 액션을 집중적이고 단일 목적으로 유지

```typescript
// ✅ 좋음: 단일하고 집중적인 액션
actionRegister.register('updateUserName', async (payload: { userId: string; name: string }, controller) => {
  const user = userStore.getValue();
  
  if (user.id !== payload.userId) {
    controller.abort('사용자 불일치');
    return;
  }
  
  if (!payload.name.trim()) {
    controller.abort('이름은 비워둘 수 없습니다');
    return;
  }
  
  userStore.update(user => ({
    ...user,
    name: payload.name,
    updatedAt: Date.now()
  }));
});

// ❌ 나쁨: 너무 많은 일을 하는 액션
actionRegister.register('updateUserEverything', async (payload: any, controller) => {
  // 사용자, 환경설정, 설정 업데이트, 이메일 발송, 분석 로깅...
  // 단일 책임 원칙 위반
});
```

#### 설명적인 액션 이름 사용

```typescript
// ✅ 좋음: 명확하고 설명적인 이름
actionRegister.register('validateAndSubmitOrder', async (payload, controller) => { /* ... */ });
actionRegister.register('retryFailedPayment', async (payload, controller) => { /* ... */ });
actionRegister.register('sendWelcomeEmail', async (payload, controller) => { /* ... */ });

// ❌ 나쁨: 모호하거나 불분명한 이름
actionRegister.register('doStuff', async (payload, controller) => { /* ... */ });
actionRegister.register('handle', async (payload, controller) => { /* ... */ });
actionRegister.register('process', async (payload, controller) => { /* ... */ });
```

#### 포괄적인 입력 검증 구현

```typescript
interface CreateUserPayload {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

actionRegister.register('createUser', async (payload: CreateUserPayload, controller) => {
  // 명확한 에러 메시지와 함께 입력 검증
  if (!payload.email || !isValidEmail(payload.email)) {
    controller.abort('유효한 이메일 주소가 필요합니다');
    return;
  }
  
  if (!payload.password || payload.password.length < 8) {
    controller.abort('비밀번호는 최소 8자 이상이어야 합니다');
    return;
  }
  
  if (payload.password !== payload.confirmPassword) {
    controller.abort('비밀번호가 일치하지 않습니다');
    return;
  }
  
  if (!payload.firstName?.trim() || !payload.lastName?.trim()) {
    controller.abort('이름과 성이 필요합니다');
    return;
  }
  
  if (!payload.acceptTerms) {
    controller.abort('서비스 약관에 동의해야 합니다');
    return;
  }
  
  // 비즈니스 로직 계속...
});
```

### 2. ✅ 에러 처리 전략

#### 명확한 에러 메시지 제공

```typescript
actionRegister.register('processPayment', async (payload: PaymentPayload, controller) => {
  try {
    const result = await paymentService.process(payload);
    
    if (!result.success) {
      // 실패 유형에 따른 구체적인 에러 메시지 제공
      switch (result.errorCode) {
        case 'INSUFFICIENT_FUNDS':
          controller.abort('결제 실패: 계정 잔액이 부족합니다');
          break;
        case 'CARD_EXPIRED':
          controller.abort('결제 실패: 카드가 만료되었습니다');
          break;
        case 'CARD_DECLINED':
          controller.abort('결제 실패: 카드가 거부되었습니다');
          break;
        default:
          controller.abort(`결제 실패: ${result.errorMessage}`);
      }
      return;
    }
    
    // 성공 처리...
    
  } catch (error) {
    // 예상치 못한 에러 처리
    logger.error('결제 처리 에러:', error);
    controller.abort('결제 처리가 일시적으로 불가능합니다. 나중에 다시 시도해주세요.');
  }
});
```

#### 롤백 전략 구현

```typescript
actionRegister.register('transferFunds', async (payload: TransferPayload, controller) => {
  const originalFromAccount = accountStore.getValue()[payload.fromAccountId];
  const originalToAccount = accountStore.getValue()[payload.toAccountId];
  
  try {
    // 1단계: 이체 검증
    if (originalFromAccount.balance < payload.amount) {
      controller.abort('이체할 잔액이 부족합니다');
      return;
    }
    
    // 2단계: 계정 업데이트
    accountStore.update(accounts => ({
      ...accounts,
      [payload.fromAccountId]: {
        ...originalFromAccount,
        balance: originalFromAccount.balance - payload.amount
      },
      [payload.toAccountId]: {
        ...originalToAccount,
        balance: originalToAccount.balance + payload.amount
      }
    }));
    
    // 3단계: 거래 기록 (외부 API 호출)
    const transaction = await api.recordTransaction(payload);
    
    // 4단계: 거래 내역 업데이트
    transactionStore.update(transactions => [...transactions, transaction]);
    
  } catch (error) {
    // 실패 시 롤백
    accountStore.update(accounts => ({
      ...accounts,
      [payload.fromAccountId]: originalFromAccount,
      [payload.toAccountId]: originalToAccount
    }));
    
    controller.abort('이체 실패: 거래를 완료할 수 없습니다');
  }
});
```

### 3. ✅ 비동기 작업 패턴

#### 로딩 상태를 효과적으로 사용

```typescript
actionRegister.register('loadUserProfile', async (payload: { userId: string }, controller) => {
  // 즉시 로딩 상태 설정
  uiStore.update(ui => ({
    ...ui,
    userProfile: { ...ui.userProfile, loading: true, error: null }
  }));
  
  try {
    const profile = await api.getUserProfile(payload.userId);
    
    // 데이터 업데이트 및 로딩 상태 클리어
    userProfileStore.setValue(profile);
    uiStore.update(ui => ({
      ...ui,
      userProfile: { loading: false, error: null, lastUpdated: Date.now() }
    }));
    
  } catch (error) {
    // 로딩 상태 클리어 및 에러 설정
    uiStore.update(ui => ({
      ...ui,
      userProfile: { 
        loading: false, 
        error: error.message,
        lastError: Date.now()
      }
    }));
    
    controller.abort('사용자 프로필 로드에 실패했습니다');
  }
});
```

#### 요청 취소 구현

```typescript
const activeRequestsStore = createStore<Record<string, AbortController>>({});

actionRegister.register('searchUsers', async (payload: { query: string }, controller) => {
  const requestKey = `search_${payload.query}`;
  
  // 기존 검색 요청 취소
  const existingController = activeRequestsStore.getValue()[requestKey];
  if (existingController) {
    existingController.abort();
  }
  
  // 새로운 abort controller 생성
  const abortController = new AbortController();
  activeRequestsStore.update(requests => ({
    ...requests,
    [requestKey]: abortController
  }));
  
  try {
    const results = await api.searchUsers(payload.query, {
      signal: abortController.signal
    });
    
    searchResultsStore.setValue(results);
    
    // 요청 추적 정리
    activeRequestsStore.update(requests => {
      const newRequests = { ...requests };
      delete newRequests[requestKey];
      return newRequests;
    });
    
  } catch (error) {
    if (error.name === 'AbortError') {
      // 요청이 취소됨, 에러로 처리하지 않음
      return;
    }
    
    controller.abort('검색에 실패했습니다');
  }
});
```

## 스토어 관리 모범 사례

### 1. ✅ 스토어 설계 패턴

#### 정규화된 스토어 구조 설계

```typescript
// ✅ 좋음: 정규화된 구조
interface AppState {
  users: {
    byId: Record<string, User>;
    allIds: string[];
  };
  posts: {
    byId: Record<string, Post>;
    allIds: string[];
    byUserId: Record<string, string[]>;
  };
  ui: {
    selectedUserId: string | null;
    loading: Record<string, boolean>;
    errors: Record<string, string | null>;
  };
}

// ❌ 나쁨: 비정규화된 중첩 구조
interface BadAppState {
  users: Array<{
    id: string;
    name: string;
    posts: Array<{
      id: string;
      title: string;
      content: string;
      comments: Array<{
        id: string;
        text: string;
        author: User; // 순환 참조
      }>;
    }>;
  }>;
}
```

#### 파생 상태를 위한 계산된 스토어 사용

```typescript
// 기본 스토어
const usersStore = createStore<Record<string, User>>({});
const postsStore = createStore<Record<string, Post>>({});
const uiStore = createStore<{ selectedUserId: string | null }>({ selectedUserId: null });

// ✅ 좋음: 파생 데이터를 위한 계산된 스토어
const selectedUserPostsStore = createComputedStore(
  [usersStore, postsStore, uiStore],
  (users, posts, ui) => {
    if (!ui.selectedUserId) return [];
    
    return Object.values(posts)
      .filter(post => post.userId === ui.selectedUserId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
);

// 컴포넌트 사용
function UserPostsList() {
  const posts = useStoreValue(selectedUserPostsStore);
  // 관련 데이터가 변경될 때만 컴포넌트 리렌더링
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

#### 스토어 검증 구현

```typescript
const userStore = createStore<User>({
  id: '',
  name: '',
  email: '',
  createdAt: 0
});

// 검증 레이어 추가
const validateUser = (user: User): void => {
  if (!user.id) throw new Error('사용자 ID가 필요합니다');
  if (!user.name.trim()) throw new Error('사용자 이름은 비워둘 수 없습니다');
  if (!isValidEmail(user.email)) throw new Error('유효하지 않은 이메일 형식입니다');
  if (user.createdAt <= 0) throw new Error('유효하지 않은 생성 날짜입니다');
};

// 검증된 업데이트를 위한 래퍼
const setValidatedUser = (user: User): void => {
  validateUser(user);
  userStore.setValue(user);
};

const updateValidatedUser = (updater: (user: User) => User): void => {
  const currentUser = userStore.getValue();
  const updatedUser = updater(currentUser);
  validateUser(updatedUser);
  userStore.setValue(updatedUser);
};
```

### 2. ✅ 성능 최적화

#### 선택적 스토어 구독 사용

```typescript
// ❌ 나쁨: 모든 사용자 변경 시 컴포넌트 리렌더링
function UserName() {
  const user = useStoreValue(userStore); // 모든 사용자 속성 변경 시 리렌더링
  return <span>{user.name}</span>;
}

// ✅ 좋음: 이름이 변경될 때만 컴포넌트 리렌더링
function UserName() {
  const userName = useStoreValue(userStore, user => user.name);
  return <span>{userName}</span>;
}

// ✅ 좋음: 복잡한 계산을 위한 메모화된 선택자
const userDisplayName = useStoreValue(userStore, 
  useMemo(() => (user: User) => 
    user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.email
  , [])
);
```

#### 스토어 업데이트 배치화

```typescript
// ❌ 나쁨: 여러 개별 업데이트로 여러 번 리렌더링 유발
actionRegister.register('updateUserProfile', async (payload, controller) => {
  userStore.update(user => ({ ...user, firstName: payload.firstName }));
  userStore.update(user => ({ ...user, lastName: payload.lastName }));
  userStore.update(user => ({ ...user, email: payload.email }));
  userStore.update(user => ({ ...user, updatedAt: Date.now() }));
});

// ✅ 좋음: 단일 배치 업데이트
actionRegister.register('updateUserProfile', async (payload, controller) => {
  userStore.update(user => ({
    ...user,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    updatedAt: Date.now()
  }));
});

// ✅ 좋음: 불필요한 리렌더링을 방지하는 조건부 업데이트
actionRegister.register('updateUserIfChanged', async (payload, controller) => {
  const currentUser = userStore.getValue();
  
  const hasChanges = 
    currentUser.firstName !== payload.firstName ||
    currentUser.lastName !== payload.lastName ||
    currentUser.email !== payload.email;
  
  if (!hasChanges) {
    return; // 업데이트 불필요
  }
  
  userStore.update(user => ({
    ...user,
    ...payload,
    updatedAt: Date.now()
  }));
});
```

## 컴포넌트 통합 모범 사례

### 1. ✅ 훅 사용 패턴

#### 스토어 구독을 효과적으로 조직화

```typescript
// ✅ 좋음: 명확한 스토어 사용이 있는 조직화된 컴포넌트
function UserDashboard({ userId }: { userId: string }) {
  // 관련 스토어 구독 그룹화
  const user = useStoreValue(userStore, user => 
    user.id === userId ? user : null
  );
  const userPosts = useStoreValue(postsStore, posts => 
    posts.filter(post => post.userId === userId)
  );
  const uiState = useStoreValue(uiStore, ui => ({
    loading: ui.loading,
    error: ui.error
  }));
  
  // 단일 디스패치 인스턴스
  const dispatch = useActionDispatch();
  
  // 메모화된 이벤트 핸들러
  const handleUpdateUser = useCallback((updates: Partial<User>) => {
    dispatch('updateUser', { userId, ...updates });
  }, [dispatch, userId]);
  
  const handleCreatePost = useCallback((postData: CreatePostData) => {
    dispatch('createPost', { ...postData, userId });
  }, [dispatch, userId]);
  
  // 로딩/에러 상태를 위한 조기 반환
  if (uiState.loading) return <LoadingSpinner />;
  if (uiState.error) return <ErrorMessage error={uiState.error} />;
  if (!user) return <UserNotFound userId={userId} />;
  
  return (
    <div>
      <UserProfile user={user} onUpdate={handleUpdateUser} />
      <PostsList posts={userPosts} onCreate={handleCreatePost} />
    </div>
  );
}
```

#### 복잡한 로직을 위한 커스텀 훅 구현

```typescript
// ✅ 좋음: 복잡한 스토어 로직을 캡슐화하는 커스텀 훅
function useUserWithPosts(userId: string) {
  const user = useStoreValue(userStore, user => 
    user.id === userId ? user : null
  );
  
  const posts = useStoreValue(postsStore, posts => 
    posts.filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
  );
  
  const loading = useStoreValue(uiStore, ui => 
    ui.loading.user || ui.loading.posts
  );
  
  const error = useStoreValue(uiStore, ui => 
    ui.errors.user || ui.errors.posts
  );
  
  const dispatch = useActionDispatch();
  
  const refreshData = useCallback(() => {
    dispatch('loadUser', { userId });
    dispatch('loadUserPosts', { userId });
  }, [dispatch, userId]);
  
  const updateUser = useCallback((updates: Partial<User>) => {
    dispatch('updateUser', { userId, ...updates });
  }, [dispatch, userId]);
  
  const createPost = useCallback((postData: CreatePostData) => {
    dispatch('createPost', { ...postData, userId });
  }, [dispatch, userId]);
  
  return {
    user,
    posts,
    loading,
    error,
    actions: {
      refresh: refreshData,
      updateUser,
      createPost
    }
  };
}

// 컴포넌트에서 사용
function UserDashboard({ userId }: { userId: string }) {
  const { user, posts, loading, error, actions } = useUserWithPosts(userId);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <UserNotFound userId={userId} />;
  
  return (
    <div>
      <UserProfile user={user} onUpdate={actions.updateUser} />
      <PostsList posts={posts} onCreate={actions.createPost} />
      <RefreshButton onClick={actions.refresh} />
    </div>
  );
}
```

### 2. ✅ 에러 경계와 로딩 상태

#### 포괄적인 에러 경계 구현

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ActionErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // 모니터링 서비스에 에러 로깅
    logger.error('경계에서 잡힌 컴포넌트 에러:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>문제가 발생했습니다</h2>
          <details>
            <summary>에러 세부사항</summary>
            <pre>{this.state.error?.message}</pre>
            {process.env.NODE_ENV === 'development' && (
              <pre>{this.state.errorInfo?.componentStack}</pre>
            )}
          </details>
          <button onClick={() => window.location.reload()}>
            페이지 새로고침
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// 사용
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        <ErrorBoundary>
          <Application />
        </ErrorBoundary>
      </ActionProvider>
    </StoreProvider>
  );
}
```

#### 재사용 가능한 로딩 컴포넌트 생성

```typescript
// ✅ 좋음: 재사용 가능한 로딩 래퍼
interface AsyncWrapperProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: string; onRetry?: () => void }>;
  onRetry?: () => void;
}

function AsyncWrapper({
  loading,
  error,
  children,
  loadingComponent: LoadingComponent = DefaultSpinner,
  errorComponent: ErrorComponent = DefaultError,
  onRetry
}: AsyncWrapperProps) {
  if (loading) {
    return <LoadingComponent />;
  }
  
  if (error) {
    return <ErrorComponent error={error} onRetry={onRetry} />;
  }
  
  return <>{children}</>;
}

// 컴포넌트에서 사용
function UserProfile({ userId }: { userId: string }) {
  const user = useStoreValue(userStore);
  const loading = useStoreValue(uiStore, ui => ui.loading.user);
  const error = useStoreValue(uiStore, ui => ui.errors.user);
  const dispatch = useActionDispatch();
  
  const handleRetry = useCallback(() => {
    dispatch('loadUser', { userId });
  }, [dispatch, userId]);
  
  return (
    <AsyncWrapper 
      loading={loading} 
      error={error} 
      onRetry={handleRetry}
    >
      <div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
    </AsyncWrapper>
  );
}
```

## 테스트 모범 사례

### 1. ✅ 액션 테스트

#### 포괄적인 액션 테스트 작성

```typescript
describe('updateUser action', () => {
  let mockUserStore: jest.Mocked<Store<User>>;
  let mockUIStore: jest.Mocked<Store<UIState>>;
  let mockAPI: jest.Mocked<typeof api>;
  
  beforeEach(() => {
    mockUserStore = createMockStore({
      id: '1',
      name: '홍길동',
      email: 'hong@example.com',
      updatedAt: 0
    });
    
    mockUIStore = createMockStore({
      loading: false,
      error: null
    });
    
    mockAPI = {
      updateUser: jest.fn()
    };
  });
  
  it('should update user successfully', async () => {
    // 준비
    const payload = { name: '김철수', email: 'kim@example.com' };
    const controller = { abort: jest.fn() };
    mockAPI.updateUser.mockResolvedValue({ success: true });
    
    // 실행
    await updateUserHandler(payload, controller);
    
    // 검증
    expect(mockUserStore.update).toHaveBeenCalledWith(
      expect.any(Function)
    );
    expect(mockAPI.updateUser).toHaveBeenCalledWith({
      id: '1',
      name: '김철수',
      email: 'kim@example.com',
      updatedAt: expect.any(Number)
    });
    expect(controller.abort).not.toHaveBeenCalled();
  });
  
  it('should handle validation errors', async () => {
    // 준비
    const payload = { name: '', email: 'invalid-email' };
    const controller = { abort: jest.fn() };
    
    // 실행
    await updateUserHandler(payload, controller);
    
    // 검증
    expect(controller.abort).toHaveBeenCalledWith(
      '이름은 비워둘 수 없습니다'
    );
    expect(mockUserStore.update).not.toHaveBeenCalled();
    expect(mockAPI.updateUser).not.toHaveBeenCalled();
  });
  
  it('should handle API errors', async () => {
    // 준비
    const payload = { name: '김철수', email: 'kim@example.com' };
    const controller = { abort: jest.fn() };
    mockAPI.updateUser.mockRejectedValue(new Error('네트워크 오류'));
    
    // 실행
    await updateUserHandler(payload, controller);
    
    // 검증
    expect(controller.abort).toHaveBeenCalledWith(
      '사용자 업데이트에 실패했습니다'
    );
    expect(mockUIStore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        error: '네트워크 오류',
        loading: false
      })
    );
  });
});
```

#### 액션 통합 테스트

```typescript
describe('User Management Integration', () => {
  let userStore: Store<User>;
  let userListStore: Store<User[]>;
  let uiStore: Store<UIState>;
  
  beforeEach(() => {
    userStore = createStore(defaultUser);
    userListStore = createStore([]);
    uiStore = createStore({ loading: false, error: null });
  });
  
  it('should create user and update all related stores', async () => {
    // 준비
    const newUserData = {
      name: '새 사용자',
      email: 'new@example.com'
    };
    
    // 실행
    await dispatch('createUser', newUserData);
    
    // 검증
    const user = userStore.getValue();
    const userList = userListStore.getValue();
    const ui = uiStore.getValue();
    
    expect(user.name).toBe('새 사용자');
    expect(user.email).toBe('new@example.com');
    expect(userList).toContain(user);
    expect(ui.loading).toBe(false);
    expect(ui.error).toBeNull();
  });
});
```

### 2. ✅ 컴포넌트 테스트

#### 컴포넌트-스토어 통합 테스트

```typescript
describe('UserProfile Component', () => {
  let userStore: Store<User>;
  let uiStore: Store<UIState>;
  
  beforeEach(() => {
    userStore = createStore({
      id: '1',
      name: '홍길동',
      email: 'hong@example.com',
      updatedAt: Date.now()
    });
    
    uiStore = createStore({
      loading: false,
      error: null
    });
  });
  
  it('should display user information', () => {
    render(
      <StoreProvider stores={{ userStore, uiStore }}>
        <UserProfile userId="1" />
      </StoreProvider>
    );
    
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('hong@example.com')).toBeInTheDocument();
  });
  
  it('should dispatch action on form submission', async () => {
    const mockDispatch = jest.fn();
    
    render(
      <StoreProvider stores={{ userStore, uiStore }}>
        <ActionProvider dispatch={mockDispatch}>
          <UserProfile userId="1" />
        </ActionProvider>
      </StoreProvider>
    );
    
    const nameInput = screen.getByLabelText('이름');
    const submitButton = screen.getByText('업데이트');
    
    fireEvent.change(nameInput, { target: { value: '김철수' } });
    fireEvent.click(submitButton);
    
    expect(mockDispatch).toHaveBeenCalledWith('updateUser', {
      userId: '1',
      name: '김철수'
    });
  });
  
  it('should show loading state', () => {
    uiStore.setValue({ loading: true, error: null });
    
    render(
      <StoreProvider stores={{ userStore, uiStore }}>
        <UserProfile userId="1" />
      </StoreProvider>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

## 성능 모범 사례

### 1. ✅ 렌더링 최적화

#### 불필요한 리렌더링 방지

```typescript
// ✅ 좋음: 특정 종속성이 있는 메모화된 컴포넌트
const UserCard = memo(({ userId }: { userId: string }) => {
  const user = useStoreValue(userStore, 
    useCallback(users => users[userId], [userId])
  );
  
  const handleEdit = useCallback(() => {
    dispatch('editUser', { userId });
  }, [userId]);
  
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={handleEdit}>편집</button>
    </div>
  );
});

// ✅ 좋음: 큰 목록을 위한 가상화
function UserList() {
  const userIds = useStoreValue(userListStore, users => 
    users.map(user => user.id)
  );
  
  return (
    <VirtualizedList
      height={400}
      itemCount={userIds.length}
      itemSize={60}
      renderItem={({ index, style }) => (
        <div style={style}>
          <UserCard userId={userIds[index]} />
        </div>
      )}
    />
  );
}
```

#### 스토어 선택자 최적화

```typescript
// ❌ 나쁨: 렌더링할 때마다 새 객체 생성
function UserStats() {
  const stats = useStoreValue(userStore, user => ({
    fullName: `${user.firstName} ${user.lastName}`,
    isActive: user.lastLoginAt > Date.now() - 86400000,
    membershipDays: Math.floor((Date.now() - user.createdAt) / 86400000)
  })); // 매번 새 객체, 불필요한 리렌더링 유발
  
  return <div>{stats.fullName}</div>;
}

// ✅ 좋음: 메모화된 선택자
const selectUserStats = createSelector(
  (user: User) => user.firstName,
  (user: User) => user.lastName,
  (user: User) => user.lastLoginAt,
  (user: User) => user.createdAt,
  (firstName, lastName, lastLoginAt, createdAt) => ({
    fullName: `${firstName} ${lastName}`,
    isActive: lastLoginAt > Date.now() - 86400000,
    membershipDays: Math.floor((Date.now() - createdAt) / 86400000)
  })
);

function UserStats() {
  const stats = useStoreValue(userStore, selectUserStats);
  return <div>{stats.fullName}</div>;
}
```

### 2. ✅ 메모리 관리

#### 리소스 적절히 정리

```typescript
actionRegister.register('startPeriodicSync', async (payload: { interval: number }, controller) => {
  const intervalId = setInterval(async () => {
    try {
      await dispatch('syncData', {});
    } catch (error) {
      console.error('동기화 실패:', error);
    }
  }, payload.interval);
  
  // 정리 함수 저장
  cleanupStore.update(cleanup => ({
    ...cleanup,
    periodicSync: () => {
      clearInterval(intervalId);
    }
  }));
});

// 컴포넌트 정리 훅
function useCleanupOnUnmount() {
  const cleanup = useStoreValue(cleanupStore);
  
  useEffect(() => {
    return () => {
      Object.values(cleanup).forEach(cleanupFn => {
        if (typeof cleanupFn === 'function') {
          cleanupFn();
        }
      });
    };
  }, [cleanup]);
}
```

## 개발 워크플로우 모범 사례

### 1. ✅ 코드 조직

#### 기능별로 파일 조직

```
src/
├── features/
│   ├── user/
│   │   ├── actions/
│   │   │   ├── user-actions.ts
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── user-store.ts
│   │   │   ├── user-ui-store.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── UserProfile.tsx
│   │   │   ├── UserList.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useUser.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── orders/
│   └── products/
├── shared/
│   ├── stores/
│   ├── components/
│   └── utils/
└── app/
    ├── store-provider.tsx
    └── action-provider.tsx
```

#### 일관된 명명 규칙 사용

```typescript
// 액션 이름: 동사 + 명사 패턴
dispatch('createUser', payload);
dispatch('updateUserProfile', payload);
dispatch('deleteUserAccount', payload);
dispatch('validateUserInput', payload);

// 스토어 이름: 명사 + Store 접미사
const userStore = createStore<User>({});
const userListStore = createStore<User[]>([]);
const userUIStore = createStore<UserUIState>({});

// 훅 이름: use + 설명적인 이름
const useUser = (userId: string) => { /* ... */ };
const useUserList = (filters: UserFilters) => { /* ... */ };
const useUserActions = () => { /* ... */ };

// 컴포넌트 이름: PascalCase, 설명적
const UserProfile = ({ userId }: UserProfileProps) => { /* ... */ };
const UserListItem = ({ user }: UserListItemProps) => { /* ... */ };
const UserEditModal = ({ userId, onClose }: UserEditModalProps) => { /* ... */ };
```

### 2. ✅ 문서화 표준

#### 복잡한 비즈니스 로직 문서화

```typescript
/**
 * 사용자의 활동과 지출을 기반으로 멤버십 등급을 계산합니다.
 * 
 * 등급 계산 규칙:
 * - 브론즈: 모든 사용자의 기본 등급
 * - 실버: 총 지출 $1000+ 또는 최근 12개월 내 주문 50개+
 * - 골드: 총 지출 $5000+ 그리고 최근 12개월 내 주문 100개+
 * - 플래티넘: 총 지출 $10000+ 그리고 주문 200개+ 그리고 2년+ 멤버
 * 
 * @param user - 지출 및 주문 내역을 포함한 사용자 객체
 * @param orders - 등급 계산을 위한 사용자의 주문 배열
 * @returns 계산된 멤버십 등급
 */
actionRegister.register('calculateMembershipTier', async (
  payload: { userId: string },
  controller
) => {
  const user = userStore.getValue();
  const orders = orderStore.getValue().filter(order => 
    order.userId === payload.userId && 
    order.createdAt > Date.now() - (365 * 24 * 60 * 60 * 1000) // 최근 12개월
  );
  
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const orderCount = orders.length;
  const membershipDuration = Date.now() - user.createdAt;
  const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
  
  let tier: MembershipTier = 'bronze';
  
  if (totalSpent >= 10000 && orderCount >= 200 && membershipDuration >= twoYears) {
    tier = 'platinum';
  } else if (totalSpent >= 5000 && orderCount >= 100) {
    tier = 'gold';
  } else if (totalSpent >= 1000 || orderCount >= 50) {
    tier = 'silver';
  }
  
  userStore.update(user => ({ ...user, membershipTier: tier }));
});
```

#### API 계약 문서화

```typescript
/**
 * 사용자 등록 액션 페이로드 인터페이스
 */
interface RegisterUserPayload {
  /** 사용자의 이메일 주소 (고유하고 유효해야 함) */
  email: string;
  /** 비밀번호 (최소 8자, 대문자, 소문자, 숫자 포함) */
  password: string;
  /** 비밀번호 확인 (비밀번호와 일치해야 함) */
  confirmPassword: string;
  /** 사용자의 이름 (필수, 비어있지 않음) */
  firstName: string;
  /** 사용자의 성 (필수, 비어있지 않음) */
  lastName: string;
  /** 사용자는 서비스 약관에 동의해야 함 */
  acceptTerms: boolean;
  /** 선택사항인 마케팅 이메일 동의 */
  acceptMarketing?: boolean;
}

/**
 * 새 사용자 계정을 등록합니다
 * 
 * @throws {ValidationError} 입력 검증이 실패할 때
 * @throws {DuplicateEmailError} 이메일이 이미 등록되어 있을 때
 * @throws {ServiceUnavailableError} 등록 서비스가 다운되었을 때
 */
actionRegister.register('registerUser', async (
  payload: RegisterUserPayload,
  controller
) => {
  // 구현...
});
```

## 보안 모범 사례

### 1. ✅ 입력 검증 및 정제

```typescript
import { z } from 'zod';

// 검증 스키마 정의
const CreateUserSchema = z.object({
  email: z.string().email('유효하지 않은 이메일 형식'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '비밀번호에는 대문자가 포함되어야 합니다')
    .regex(/[a-z]/, '비밀번호에는 소문자가 포함되어야 합니다')
    .regex(/[0-9]/, '비밀번호에는 숫자가 포함되어야 합니다'),
  firstName: z.string().min(1, '이름이 필요합니다'),
  lastName: z.string().min(1, '성이 필요합니다'),
  acceptTerms: z.boolean().refine(val => val === true, '약관에 동의해야 합니다')
});

actionRegister.register('createUser', async (payload: unknown, controller) => {
  // 입력 검증 및 파싱
  const validationResult = CreateUserSchema.safeParse(payload);
  
  if (!validationResult.success) {
    controller.abort(`검증 실패: ${validationResult.error.issues[0].message}`);
    return;
  }
  
  const validatedPayload = validationResult.data;
  
  // 입력 정제
  const sanitizedData = {
    ...validatedPayload,
    firstName: sanitizeString(validatedPayload.firstName),
    lastName: sanitizeString(validatedPayload.lastName),
  };
  
  // 비즈니스 로직 계속...
});
```

### 2. ✅ 민감한 데이터 처리

```typescript
// ❌ 나쁨: 스토어에 민감한 데이터 저장
const userStore = createStore({
  id: '1',
  name: '홍길동',
  email: 'hong@example.com',
  password: 'plaintextpassword', // 클라이언트 상태에 비밀번호 저장 금지
  creditCard: '4111-1111-1111-1111' // 민감한 금융 데이터 저장 금지
});

// ✅ 좋음: 민감하지 않은 데이터만 저장
const userStore = createStore({
  id: '1',
  name: '홍길동',
  email: 'hong@example.com',
  hasPassword: true, // 실제 비밀번호 대신 불린 플래그
  hasPaymentMethod: true // 실제 결제 데이터 대신 불린 플래그
});

// ✅ 좋음: 민감한 작업을 서버 측에서 처리
actionRegister.register('updatePassword', async (
  payload: { currentPassword: string; newPassword: string },
  controller
) => {
  try {
    // 안전한 처리를 위해 서버로 전송
    await api.updatePassword({
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword
    });
    
    // 민감하지 않은 상태만 업데이트
    userStore.update(user => ({
      ...user,
      hasPassword: true,
      passwordUpdatedAt: Date.now()
    }));
    
  } catch (error) {
    controller.abort('비밀번호 업데이트에 실패했습니다');
  }
});
```

## 요약

이러한 모범 사례를 따르면 Context-Action 애플리케이션이 다음과 같이 됩니다:

- **🎯 유지보수 가능**: 명확한 구조와 관심사의 분리
- **🔒 타입 안전**: 포괄적인 TypeScript 사용
- **🧪 테스트 가능**: 좋은 테스트 커버리지를 가진 잘 구조화된 코드
- **⚡ 성능 우수**: 최적화된 렌더링과 효율적인 상태 관리
- **🛡️ 견고함**: 적절한 에러 처리와 복구 메커니즘
- **📚 문서화됨**: 복잡한 비즈니스 로직에 명확한 문서
- **🔐 보안**: 적절한 입력 검증과 민감한 데이터 처리

## 관련 자료

- [MVVM 아키텍처 가이드](./mvvm-architecture.md) - 전체 아키텍처 패턴
- [스토어 통합 가이드](./store-integration.md) - 스토어 조정 패턴
- [데이터 플로우 패턴](./data-flow-patterns.md) - 고급 데이터 플로우 기법
- [API 참조](/api/core/) - 완전한 API 문서
- [예제](/examples/) - 실용적인 구현 예제