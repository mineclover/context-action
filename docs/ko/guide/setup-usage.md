# 설정 및 사용법

Context-Action 프레임워크의 상세한 설정 방법과 실제 사용법을 배워보세요. 이 가이드는 프로덕션 환경에서 사용할 수 있는 견고한 애플리케이션을 구축하는 방법을 제공합니다.

## 설치 및 초기 설정

### 패키지 설치

```bash
# 핵심 패키지
npm install @context-action/core @context-action/react

# 선택적 패키지
npm install @context-action/logger  # 로깅 유틸리티
npm install @context-action/jotai   # Jotai 통합 (선택)
```

### TypeScript 설정

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## 프로젝트 구조 설정

### 권장 폴더 구조

```
src/
├── stores/          # 도메인별 스토어와 액션
│   ├── user/
│   │   ├── user.store.ts
│   │   └── index.ts
│   ├── cart/
│   └── index.ts
├── hooks/           # 비즈니스 로직 훅
│   ├── handlers/    # 액션 핸들러
│   │   ├── useUserHandlers.ts
│   │   └── index.ts
│   ├── logic/       # 복합 비즈니스 로직
│   └── index.ts
├── components/      # UI 컴포넌트
├── providers/       # 프로바이더 구성
└── types/          # 공통 타입 정의
```

## 도메인별 스토어 설정

### 1. 기본 스토어 생성

```typescript
// stores/user/user.store.ts
import { createDeclarativeStores, createActionContext } from '@context-action/react';

// 타입 정의
export interface UserData {
  profile: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
  session: {
    isLoggedIn: boolean;
    token: string | null;
    expiresAt: number | null;
  };
}

export interface UserActions {
  // 인증 액션
  login: { email: string; password: string };
  logout: void;
  refreshToken: void;
  
  // 프로필 액션
  updateProfile: { data: Partial<UserData['profile']> };
  deleteProfile: { confirmation: string };
  
  // 설정 액션
  updatePreferences: { preferences: Partial<UserData['preferences']> };
}

// 스토어 생성
export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStores: useUserStores,
  useCreateStore: useCreateUserStore
} = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: '',
      role: 'guest'
    },
    strategy: 'deep',  // 깊은 비교
    description: '사용자 프로필 정보'
  },
  preferences: {
    initialValue: {
      theme: 'light',
      language: 'ko',
      notifications: true
    },
    strategy: 'shallow', // 얕은 비교
    description: '사용자 환경설정'
  },
  session: {
    initialValue: {
      isLoggedIn: false,
      token: null,
      expiresAt: null
    },
    strategy: 'reference', // 참조 비교 (기본값)
    description: '세션 정보'
  }
});

// 액션 컨텍스트 생성
export const {
  Provider: UserActionProvider,
  useAction: useUserAction,
  useActionHandler: useUserActionHandler,
  useActionDispatchWithResult: useUserActionWithResult
} = createActionContext<UserActions>({
  name: 'UserAction',
  debug: process.env.NODE_ENV === 'development'
});
```

### 2. 인덱스 파일로 내보내기

```typescript
// stores/user/index.ts
export * from './user.store';

// stores/index.ts
export * from './user';
export * from './cart';
export * from './order';
```

## 핸들러 구현

### 1. 기본 핸들러 패턴

```typescript
// hooks/handlers/useUserHandlers.ts
import { useCallback, useEffect } from 'react';
import { useUserActionHandler, useUserStores, UserActions } from '@/stores/user';

export function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  // 로그인 핸들러
  const loginHandler = useCallback(async (
    payload: UserActions['login'],
    controller
  ) => {
    const sessionStore = stores.getStore('session');
    const profileStore = stores.getStore('profile');
    
    try {
      // API 호출 시뮬레이션
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        controller.abort('로그인 실패: 잘못된 자격증명');
        return { success: false, error: 'INVALID_CREDENTIALS' };
      }
      
      const data = await response.json();
      
      // 세션 업데이트
      sessionStore.setValue({
        isLoggedIn: true,
        token: data.token,
        expiresAt: Date.now() + (data.expiresIn * 1000)
      });
      
      // 프로필 업데이트
      profileStore.setValue(data.user);
      
      return { success: true, user: data.user };
      
    } catch (error) {
      controller.abort('로그인 중 오류 발생', error);
      return { success: false, error: 'NETWORK_ERROR' };
    }
  }, [stores]);
  
  // 로그아웃 핸들러
  const logoutHandler = useCallback(async (payload, controller) => {
    const sessionStore = stores.getStore('session');
    const profileStore = stores.getStore('profile');
    
    try {
      // 토큰 무효화 (서버)
      const session = sessionStore.getValue();
      if (session.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      // 서버 오류여도 로컬 상태는 정리
      console.warn('서버 로그아웃 실패:', error);
    } finally {
      // 로컬 상태 정리
      sessionStore.setValue({
        isLoggedIn: false,
        token: null,
        expiresAt: null
      });
      
      profileStore.setValue({
        id: '',
        name: '',
        email: '',
        role: 'guest'
      });
    }
    
    return { success: true };
  }, [stores]);
  
  // 프로필 업데이트 핸들러
  const updateProfileHandler = useCallback(async (
    payload: UserActions['updateProfile'],
    controller
  ) => {
    const profileStore = stores.getStore('profile');
    const sessionStore = stores.getStore('session');
    
    const currentProfile = profileStore.getValue();
    const session = sessionStore.getValue();
    
    // 인증 확인
    if (!session.isLoggedIn || !session.token) {
      controller.abort('인증이 필요합니다');
      return { success: false, error: 'UNAUTHORIZED' };
    }
    
    // 데이터 검증
    if (payload.data.email && !payload.data.email.includes('@')) {
      controller.abort('유효하지 않은 이메일 형식');
      return { success: false, error: 'INVALID_EMAIL' };
    }
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload.data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        controller.abort('프로필 업데이트 실패', error);
        return { success: false, error: error.code };
      }
      
      const updatedProfile = await response.json();
      
      // 로컬 상태 업데이트
      profileStore.setValue({
        ...currentProfile,
        ...updatedProfile
      });
      
      return { success: true, profile: updatedProfile };
      
    } catch (error) {
      controller.abort('프로필 업데이트 중 오류', error);
      return { success: false, error: 'NETWORK_ERROR' };
    }
  }, [stores]);
  
  // 환경설정 업데이트 핸들러
  const updatePreferencesHandler = useCallback(async (
    payload: UserActions['updatePreferences'],
    controller
  ) => {
    const preferencesStore = stores.getStore('preferences');
    const currentPreferences = preferencesStore.getValue();
    
    // 즉시 로컬 업데이트 (낙관적 업데이트)
    const newPreferences = { ...currentPreferences, ...payload.preferences };
    preferencesStore.setValue(newPreferences);
    
    // 서버에 동기화 (백그라운드)
    try {
      const sessionStore = stores.getStore('session');
      const session = sessionStore.getValue();
      
      if (session.isLoggedIn && session.token) {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload.preferences)
        });
      }
    } catch (error) {
      console.warn('환경설정 동기화 실패:', error);
      // 실패해도 로컬 변경사항 유지
    }
    
    return { success: true, preferences: newPreferences };
  }, [stores]);
  
  // 핸들러 등록
  useEffect(() => {
    if (!addHandler) return;
    
    const unregisterLogin = addHandler('login', loginHandler, {
      priority: 100,
      blocking: true,
      id: 'user-login',
      tags: ['auth', 'critical']
    });
    
    const unregisterLogout = addHandler('logout', logoutHandler, {
      priority: 100,
      blocking: true,
      id: 'user-logout',
      tags: ['auth']
    });
    
    const unregisterUpdateProfile = addHandler('updateProfile', updateProfileHandler, {
      priority: 90,
      blocking: true,
      id: 'profile-update',
      tags: ['profile', 'api']
    });
    
    const unregisterUpdatePreferences = addHandler('updatePreferences', updatePreferencesHandler, {
      priority: 80,
      blocking: false, // 논블로킹 - 빠른 UI 반응
      id: 'preferences-update',
      tags: ['preferences']
    });
    
    return () => {
      unregisterLogin();
      unregisterLogout();
      unregisterUpdateProfile();
      unregisterUpdatePreferences();
    };
  }, [addHandler, loginHandler, logoutHandler, updateProfileHandler, updatePreferencesHandler]);
}
```

### 2. 오류 처리 및 로깅

```typescript
// hooks/handlers/useUserHandlers.ts (오류 처리 예제)
import { createLogger } from '@context-action/logger';

const logger = createLogger('UserHandlers');

export function useUserHandlers() {
  // ... 기존 코드
  
  const loginHandler = useCallback(async (payload, controller) => {
    logger.info('로그인 시도', { email: payload.email });
    
    try {
      // 비즈니스 로직
      const result = await performLogin(payload);
      
      logger.info('로그인 성공', { userId: result.user.id });
      return { success: true, user: result.user };
      
    } catch (error) {
      logger.error('로그인 실패', {
        email: payload.email,
        error: error.message,
        stack: error.stack
      });
      
      controller.abort('로그인 실패', {
        operation: 'login',
        payload: { email: payload.email }, // 민감한 정보 제외
        timestamp: Date.now(),
        error: error.message
      });
      
      return { success: false, error: categorizeError(error) };
    }
  }, [stores]);
  
  // 오류 분류 함수
  function categorizeError(error: any): string {
    if (error.status === 401) return 'UNAUTHORIZED';
    if (error.status === 403) return 'FORBIDDEN';
    if (error.status >= 500) return 'SERVER_ERROR';
    if (error.name === 'NetworkError') return 'NETWORK_ERROR';
    return 'UNKNOWN_ERROR';
  }
}
```

## 프로바이더 구성

### 1. 단일 도메인 프로바이더

```typescript
// providers/UserProvider.tsx
import React from 'react';
import { UserStoreProvider, UserActionProvider } from '@/stores/user';
import { useUserHandlers } from '@/hooks/handlers/useUserHandlers';

function UserHandlersSetup() {
  useUserHandlers();
  return null;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserStoreProvider>
      <UserActionProvider>
        <UserHandlersSetup />
        {children}
      </UserActionProvider>
    </UserStoreProvider>
  );
}
```

### 2. 다중 도메인 프로바이더

```typescript
// providers/AppProvider.tsx
import React from 'react';
import { UserProvider } from './UserProvider';
import { CartProvider } from './CartProvider';
import { OrderProvider } from './OrderProvider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <CartProvider>
        <OrderProvider>
          {children}
        </OrderProvider>
      </CartProvider>
    </UserProvider>
  );
}
```

### 3. 조건부 프로바이더

```typescript
// providers/ConditionalProvider.tsx
import React from 'react';
import { UserProvider } from './UserProvider';
import { AdminProvider } from './AdminProvider';

interface ConditionalProviderProps {
  children: React.ReactNode;
  userRole?: 'admin' | 'user' | 'guest';
}

export function ConditionalProvider({ 
  children, 
  userRole = 'guest' 
}: ConditionalProviderProps) {
  return (
    <UserProvider>
      {userRole === 'admin' ? (
        <AdminProvider>
          {children}
        </AdminProvider>
      ) : (
        children
      )}
    </UserProvider>
  );
}
```

## 고급 패턴

### 1. 지속성 스토어

```typescript
// hooks/usePersistedUserStore.ts
import { useCallback, useEffect } from 'react';
import { useUserStores } from '@/stores/user';

export function usePersistedUserPreferences() {
  const stores = useUserStores();
  
  // 환경설정 로드
  useEffect(() => {
    const preferencesStore = stores.getStore('preferences');
    
    // 로컬 스토리지에서 로드
    const savedPreferences = localStorage.getItem('user-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        preferencesStore.setValue(parsed);
      } catch (error) {
        console.warn('환경설정 로드 실패:', error);
      }
    }
  }, [stores]);
  
  // 환경설정 변경 감지 및 저장
  useEffect(() => {
    const preferencesStore = stores.getStore('preferences');
    
    const unsubscribe = preferencesStore.subscribe((newPreferences) => {
      try {
        localStorage.setItem('user-preferences', JSON.stringify(newPreferences));
      } catch (error) {
        console.warn('환경설정 저장 실패:', error);
      }
    });
    
    return unsubscribe;
  }, [stores]);
}
```

### 2. 크로스 도메인 통합

```typescript
// hooks/logic/useUserCartIntegration.ts
import { useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore, useUserAction } from '@/stores/user';
import { useCartStore, useCartAction } from '@/stores/cart';

export function useUserCartIntegration() {
  // 다중 도메인 접근
  const profileStore = useUserStore('profile');
  const cartItemsStore = useCartStore('items');
  
  const profile = useStoreValue(profileStore);
  const cartItems = useStoreValue(cartItemsStore);
  
  const userAction = useUserAction();
  const cartAction = useCartAction();
  
  // 크로스 도메인 비즈니스 로직
  const processCheckout = useCallback(async () => {
    // 사용자 검증
    if (!profile.id) {
      await userAction('login', { /* 로그인 프롬프트 */ });
      return { success: false, reason: 'LOGIN_REQUIRED' };
    }
    
    // 장바구니 검증
    if (cartItems.length === 0) {
      return { success: false, reason: 'EMPTY_CART' };
    }
    
    // 결제 처리
    const result = await cartAction('processCheckout', {
      userId: profile.id,
      items: cartItems
    });
    
    return result;
  }, [profile.id, cartItems, userAction, cartAction]);
  
  // 로그인 시 장바구니 동기화
  const syncCartOnLogin = useCallback(async () => {
    if (profile.id) {
      await cartAction('syncWithServer', { userId: profile.id });
    }
  }, [profile.id, cartAction]);
  
  return {
    processCheckout,
    syncCartOnLogin,
    canCheckout: profile.id && cartItems.length > 0
  };
}
```

### 3. 커스텀 훅 조합

```typescript
// hooks/logic/useUserProfile.ts
import { useState, useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore, useUserAction } from '@/stores/user';

export function useUserProfile() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  
  const profile = useStoreValue(profileStore);
  const session = useStoreValue(sessionStore);
  const dispatch = useUserAction();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 프로필 업데이트
  const updateProfile = useCallback(async (data: Partial<typeof profile>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await dispatch('updateProfile', { data });
      if (!result?.success) {
        setError(result?.error || '업데이트 실패');
      }
      return result;
    } catch (error) {
      setError('네트워크 오류');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);
  
  // 로그인 상태 확인
  const isAuthenticated = useCallback(() => {
    return session.isLoggedIn && session.token && 
           (session.expiresAt ? session.expiresAt > Date.now() : true);
  }, [session]);
  
  return {
    profile,
    session,
    isLoading,
    error,
    updateProfile,
    isAuthenticated: isAuthenticated(),
    clearError: () => setError(null)
  };
}
```

## 테스팅 설정

### 1. 테스트 유틸리티

```typescript
// test-utils/providers.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { UserProvider } from '@/providers/UserProvider';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 2. 핸들러 테스트

```typescript
// __tests__/handlers/userHandlers.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useUserHandlers } from '@/hooks/handlers/useUserHandlers';
import { createMockStores, createMockController } from '@/test-utils';

describe('User Handlers', () => {
  let mockStores;
  let mockController;
  
  beforeEach(() => {
    mockStores = createMockStores();
    mockController = createMockController();
  });
  
  it('로그인 성공 시 프로필과 세션 업데이트', async () => {
    const { result } = renderHook(() => useUserHandlers());
    
    // Mock API 응답
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        token: 'fake-token',
        expiresIn: 3600,
        user: { id: '1', name: '테스트', email: 'test@example.com' }
      })
    });
    
    // 핸들러 실행
    await result.current.loginHandler(
      { email: 'test@example.com', password: 'password' },
      mockController
    );
    
    // 검증
    expect(mockStores.getStore('session').setValue).toHaveBeenCalledWith({
      isLoggedIn: true,
      token: 'fake-token',
      expiresAt: expect.any(Number)
    });
    
    expect(mockStores.getStore('profile').setValue).toHaveBeenCalledWith({
      id: '1',
      name: '테스트',
      email: 'test@example.com'
    });
  });
});
```

---

## 요약

이 설정 가이드는 Context-Action 프레임워크를 사용한 견고한 애플리케이션 구축의 기초를 제공합니다. 주요 포인트:

- **체계적인 프로젝트 구조**로 유지보수성 확보
- **타입 안전한 도메인 정의**로 개발자 경험 향상
- **견고한 오류 처리**로 안정성 확보
- **테스트 가능한 아키텍처**로 품질 보장

---

::: tip 다음 단계
- [도메인 훅 패턴](./domain-hooks-pattern) - 도메인별 훅의 고급 사용법
- [액션 핸들러](./action-handlers) - 비즈니스 로직 구현 심화
- [최선의 실습](./best-practices) - 프로덕션 환경 모범 사례
:::