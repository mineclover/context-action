# 도메인 훅 패턴

Context-Action 프레임워크의 **도메인 훅 패턴**은 타입 안전한 도메인별 인터페이스를 생성하는 핵심 메커니즘입니다. 구조 분해 할당을 통해 자동 타입 추론과 명확한 도메인 경계를 제공합니다.

## 패턴 개요

도메인 훅 패턴은 제네릭 훅 대신 도메인별로 특화된 훅을 생성하여 완전한 타입 안전성을 제공합니다:

```typescript
// ❌ 제네릭 접근법 (타입 정보 없음)
const store = useStore('user-profile');
const dispatch = useDispatch();

// ✅ 도메인 훅 패턴 (완전한 타입 안전성)
const store = useUserStore('profile');
const dispatch = useUserAction();
```

## 스토어 도메인 훅

### 기본 구조

```typescript
// stores/user.store.ts
import { createDeclarativeStores } from '@context-action/react';

export interface UserData {
  profile: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  session: {
    isLoggedIn: boolean;
    token: string | null;
    expiresAt: number | null;
  };
}

// 도메인별 스토어 훅 생성
export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,           // Store<UserData[K]> 타입 반환
  useStores: useUserStores,         // StoreRegistry<UserData> 타입 반환
  useCreateStore: useCreateUserStore // 동적 스토어 생성
} = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: ''
    },
    strategy: 'deep'
  },
  preferences: {
    initialValue: {
      theme: 'light',
      language: 'ko',
      notifications: {
        email: true,
        push: true
      }
    },
    strategy: 'shallow'
  },
  session: {
    initialValue: {
      isLoggedIn: false,
      token: null,
      expiresAt: null
    },
    strategy: 'reference'
  }
});
```

### 사용 패턴

```typescript
// 컴포넌트에서 사용
function UserProfile() {
  // 자동 타입 추론: Store<UserData['profile']>
  const profileStore = useUserStore('profile');
  
  // 자동 타입 추론: UserData['profile']
  const profile = useStoreValue(profileStore);
  
  // 자동 타입 추론: UserData['preferences']
  const preferences = useStoreValue(useUserStore('preferences'));
  
  return (
    <div>
      <h2>안녕하세요, {profile.name}님</h2>
      <p>현재 테마: {preferences.theme}</p>
    </div>
  );
}

// 핸들러에서 사용
function useUserHandlers() {
  const registry = useUserStores(); // StoreRegistry<UserData>
  
  const handler = useCallback(async (payload, controller) => {
    // 지연 평가로 최신 값 접근
    const profileStore = registry.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // 타입 안전한 스토어 업데이트
    profileStore.setValue({
      ...currentProfile,
      name: payload.newName
    });
  }, [registry]);
}
```

## 액션 도메인 훅

### 기본 구조

```typescript
// stores/user.actions.ts
import { createActionContext } from '@context-action/react';

export interface UserActions {
  // 인증 액션
  login: { 
    email: string; 
    password: string; 
    rememberMe?: boolean; 
  };
  logout: void;
  refreshToken: void;
  
  // 프로필 액션
  updateProfile: { 
    data: Partial<UserData['profile']>; 
  };
  uploadAvatar: { 
    file: File; 
  };
  deleteProfile: { 
    confirmation: string; 
  };
  
  // 설정 액션
  updatePreferences: { 
    preferences: Partial<UserData['preferences']>; 
  };
  
  // 복합 액션
  resetUserData: void;
  syncWithServer: { 
    force?: boolean; 
  };
}

// 도메인별 액션 훅 생성
export const {
  Provider: UserActionProvider,
  useAction: useUserAction,                    // Dispatch<UserActions>
  useActionHandler: useUserActionHandler,      // RegisterHandler<UserActions>
  useActionDispatchWithResult: useUserActionWithResult // WithResult<UserActions>
} = createActionContext<UserActions>({
  name: 'UserAction',
  debug: process.env.NODE_ENV === 'development'
});
```

### 사용 패턴

```typescript
// 컴포넌트에서 액션 디스패치
function LoginForm() {
  const dispatch = useUserAction(); // 완전히 타입된 디스패처
  const [form, setForm] = useState({ email: '', password: '' });
  
  const handleLogin = useCallback(async () => {
    // 타입 안전한 액션 디스패치
    await dispatch('login', {
      email: form.email,
      password: form.password,
      rememberMe: true
    });
  }, [dispatch, form]);
  
  return (
    <form onSubmit={handleLogin}>
      <input 
        value={form.email}
        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
        type="email"
        placeholder="이메일"
      />
      <input 
        value={form.password}
        onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
        type="password"
        placeholder="비밀번호"
      />
      <button type="submit">로그인</button>
    </form>
  );
}

// 결과를 필요로 하는 액션
function ProfileUpdater() {
  const dispatchWithResult = useUserActionWithResult();
  
  const handleUpdate = useCallback(async (data: Partial<UserData['profile']>) => {
    const result = await dispatchWithResult('updateProfile', { data }, {
      result: { collect: true, strategy: 'first' }
    });
    
    if (result.success) {
      console.log('업데이트 성공:', result.results);
    } else {
      console.error('업데이트 실패:', result.errors);
    }
  }, [dispatchWithResult]);
}
```

## 고급 패턴

### 1. 조건부 스토어 생성

```typescript
// 동적 스토어 생성
function UserDashboard({ userId }: { userId: string }) {
  const createStore = useCreateUserStore();
  
  // 사용자별 동적 스토어
  const userCache = createStore(`cache-${userId}`, {
    activities: [],
    lastFetch: null
  });
  
  const activities = useStoreValue(userCache);
  
  return <div>사용자 활동: {activities.length}개</div>;
}
```

### 2. 복합 도메인 훅

```typescript
// hooks/useUserProfile.ts - 복합 비즈니스 로직
export function useUserProfile() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const dispatch = useUserAction();
  
  const profile = useStoreValue(profileStore);
  const session = useStoreValue(sessionStore);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 프로필 업데이트 로직
  const updateProfile = useCallback(async (data: Partial<UserData['profile']>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await dispatch('updateProfile', { data });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '업데이트 실패';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);
  
  // 인증 상태 확인
  const isAuthenticated = useMemo(() => {
    return session.isLoggedIn && 
           session.token && 
           (session.expiresAt ? session.expiresAt > Date.now() : true);
  }, [session]);
  
  // 완전한 프로필 여부
  const hasCompleteProfile = useMemo(() => {
    return profile.name && profile.email && profile.id;
  }, [profile]);
  
  return {
    profile,
    session,
    isLoading,
    error,
    updateProfile,
    isAuthenticated,
    hasCompleteProfile,
    clearError: () => setError(null)
  };
}
```

### 3. 크로스 도메인 훅

```typescript
// hooks/useUserCartIntegration.ts - 다중 도메인 통합
export function useUserCartIntegration() {
  // 여러 도메인의 훅 사용
  const userProfile = useUserStore('profile');
  const cartItems = useCartStore('items');
  const userDispatch = useUserAction();
  const cartDispatch = useCartAction();
  
  const profile = useStoreValue(userProfile);
  const items = useStoreValue(cartItems);
  
  // 크로스 도메인 비즈니스 로직
  const processCheckout = useCallback(async () => {
    // 사용자 인증 확인
    if (!profile.id) {
      await userDispatch('login', { 
        /* 로그인 프롬프트 로직 */ 
      });
      return { success: false, reason: 'AUTH_REQUIRED' };
    }
    
    // 장바구니 검증
    if (items.length === 0) {
      return { success: false, reason: 'EMPTY_CART' };
    }
    
    // 결제 프로세스 시작
    const checkoutResult = await cartDispatch('processCheckout', {
      userId: profile.id,
      items: items,
      userEmail: profile.email
    });
    
    return checkoutResult;
  }, [profile, items, userDispatch, cartDispatch]);
  
  // 로그인 시 장바구니 동기화
  const syncCartOnLogin = useCallback(async () => {
    if (profile.id) {
      await cartDispatch('syncWithServer', { 
        userId: profile.id 
      });
    }
  }, [profile.id, cartDispatch]);
  
  // 장바구니 요약 정보
  const cartSummary = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      itemCount: totalItems,
      totalPrice,
      canCheckout: profile.id && totalItems > 0
    };
  }, [items, profile.id]);
  
  return {
    processCheckout,
    syncCartOnLogin,
    cartSummary,
    userProfile: profile,
    cartItems: items
  };
}
```

## 타입 안전성 장점

### 1. 컴파일 시 오류 검출

```typescript
// ❌ 컴파일 에러 - 존재하지 않는 스토어 키
const invalidStore = useUserStore('nonexistent');
// TS2345: Argument of type '"nonexistent"' is not assignable to parameter

// ❌ 컴파일 에러 - 잘못된 액션 이름
dispatch('invalidAction', {});
// TS2345: Argument of type '"invalidAction"' is not assignable

// ❌ 컴파일 에러 - 잘못된 페이로드 타입
dispatch('updateProfile', { invalidField: 'value' });
// TS2345: Object literal may only specify known properties
```

### 2. IDE 자동완성

```typescript
// 스토어 키 자동완성
const store = useUserStore('|'); // 'profile' | 'preferences' | 'session'

// 액션 이름 자동완성  
dispatch('|'); // 'login' | 'logout' | 'updateProfile' | ...

// 페이로드 타입 자동완성
dispatch('updateProfile', {
  data: {
    name: '|', // string 타입으로 추론
    email: '|' // string 타입으로 추론
  }
});
```

### 3. 리팩토링 안전성

```typescript
// 인터페이스 변경 시 관련 코드 자동 업데이트
interface UserData {
  profile: {
    id: string;
    fullName: string; // name에서 fullName으로 변경
    email: string;
  };
  // ...
}

// 모든 사용처에서 TypeScript 에러로 변경 필요 위치 표시
const profile = useStoreValue(useUserStore('profile'));
console.log(profile.name); // TS 에러: Property 'name' does not exist
console.log(profile.fullName); // ✅ 수정됨
```

## 성능 최적화

### 1. 선택적 구독

```typescript
// 필요한 스토어만 구독하여 불필요한 리렌더링 방지
function UserName() {
  const profile = useStoreValue(useUserStore('profile'));
  
  // preferences 변경 시에는 리렌더링되지 않음
  return <span>{profile.name}</span>;
}

function UserTheme() {
  const preferences = useStoreValue(useUserStore('preferences'));
  
  // profile 변경 시에는 리렌더링되지 않음
  return <div className={`theme-${preferences.theme}`} />;
}
```

### 2. 메모화와 조합

```typescript
function UserSummary() {
  const profile = useStoreValue(useUserStore('profile'));
  const preferences = useStoreValue(useUserStore('preferences'));
  
  // 프로필이나 환경설정이 변경될 때만 재계산
  const displayInfo = useMemo(() => ({
    greeting: `안녕하세요, ${profile.name}님`,
    themeClass: `user-theme-${preferences.theme}`,
    locale: preferences.language
  }), [profile.name, preferences.theme, preferences.language]);
  
  return (
    <div className={displayInfo.themeClass}>
      {displayInfo.greeting}
    </div>
  );
}
```

## 모범 사례

### 1. 명확한 도메인 경계

```typescript
// ✅ 좋음: 명확한 도메인별 분리
const userProfile = useUserStore('profile');
const cartItems = useCartStore('items');
const orderHistory = useOrderStore('history');

// ❌ 피하기: 하나의 훅에서 여러 도메인 접근 (필요한 경우 제외)
function ProfileComponent() {
  const profile = useUserStore('profile');
  const cartCount = useCartStore('items'); // 프로필에서 장바구니가 왜 필요한가?
}
```

### 2. 적절한 추상화 수준

```typescript
// ✅ 좋음: 도메인별 비즈니스 로직 훅
export function useUserAuthentication() {
  const sessionStore = useUserStore('session');
  const dispatch = useUserAction();
  
  return {
    login: (credentials) => dispatch('login', credentials),
    logout: () => dispatch('logout'),
    isAuthenticated: useStoreValue(sessionStore).isLoggedIn
  };
}

// 사용법
function LoginButton() {
  const { login, logout, isAuthenticated } = useUserAuthentication();
  
  return (
    <button onClick={isAuthenticated ? logout : () => login(credentials)}>
      {isAuthenticated ? '로그아웃' : '로그인'}
    </button>
  );
}
```

### 3. 일관된 명명 규칙

```typescript
// 스토어 훅
export const useUserStore = ...;
export const useCartStore = ...;
export const useOrderStore = ...;

// 액션 훅
export const useUserAction = ...;
export const useCartAction = ...;
export const useOrderAction = ...;

// 비즈니스 로직 훅
export const useUserProfile = ...;
export const useCartManagement = ...;
export const useOrderProcessing = ...;
```

---

## 요약

도메인 훅 패턴은 Context-Action 프레임워크의 핵심으로, 다음을 제공합니다:

- **완전한 타입 안전성** - 컴파일 시 오류 검출
- **명확한 도메인 경계** - 논리적 분리와 캡슐화
- **우수한 개발자 경험** - IDE 자동완성과 리팩토링 안전성
- **성능 최적화** - 선택적 구독과 최소한의 리렌더링
- **확장성** - 새로운 도메인과 기능의 쉬운 추가

이 패턴을 따르면 대규모 애플리케이션에서도 유지보수 가능하고 타입 안전한 상태 관리를 구현할 수 있습니다.

---

::: tip 다음 단계
- [스토어 관리](./store-management) - 스토어 시스템 심화 학습
- [액션 핸들러](./action-handlers) - 비즈니스 로직 구현 패턴
- [프로바이더 구성](./provider-composition) - 도메인 경계 관리
:::