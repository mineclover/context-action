# 빠른 시작

Context-Action 프레임워크를 사용하여 빠르게 시작해보세요. 이 가이드는 5분 안에 첫 번째 애플리케이션을 실행할 수 있도록 도와줍니다.

## 설치

```bash
npm install @context-action/core @context-action/react
# 또는
yarn add @context-action/core @context-action/react
```

## 1단계: 도메인 정의

먼저 애플리케이션 도메인을 정의합니다:

```typescript
// stores/user.store.ts
import { createDeclarativeStores, createActionContext } from '@context-action/react';

// 데이터 구조 정의
export interface UserData {
  profile: {
    id: string;
    name: string;
    email: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

// 액션 정의
export interface UserActions {
  login: { email: string; password: string };
  updateProfile: { data: Partial<UserData['profile']> };
  logout: void;
}

// 스토어 훅 생성
export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStores: useUserStores
} = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: { id: '', name: '', email: '' }
  },
  preferences: {
    initialValue: { theme: 'light', language: 'ko' }
  }
});

// 액션 훅 생성
export const {
  Provider: UserActionProvider,
  useAction: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>({ name: 'UserAction' });
```

## 2단계: 비즈니스 로직 (핸들러)

```typescript
// hooks/useUserHandlers.ts
import { useCallback, useEffect } from 'react';
import { useUserActionHandler, useUserStores } from '../stores/user.store';

export function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  // 로그인 핸들러
  const loginHandler = useCallback(async (payload, controller) => {
    const profileStore = stores.getStore('profile');
    
    try {
      // 간단한 로그인 로직 (실제 환경에서는 API 호출)
      if (payload.email === 'test@example.com' && payload.password === 'password') {
        profileStore.setValue({
          id: '1',
          name: '테스트 사용자',
          email: payload.email
        });
        return { success: true };
      } else {
        controller.abort('잘못된 자격증명');
        return { success: false };
      }
    } catch (error) {
      controller.abort('로그인 실패', error);
      return { success: false };
    }
  }, [stores]);
  
  // 프로필 업데이트 핸들러
  const updateProfileHandler = useCallback(async (payload, controller) => {
    const profileStore = stores.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // 업데이트
    const updatedProfile = { ...currentProfile, ...payload.data };
    profileStore.setValue(updatedProfile);
    
    return { success: true, profile: updatedProfile };
  }, [stores]);
  
  // 로그아웃 핸들러
  const logoutHandler = useCallback(async (payload, controller) => {
    const profileStore = stores.getStore('profile');
    profileStore.setValue({ id: '', name: '', email: '' });
    return { success: true };
  }, [stores]);
  
  // 핸들러 등록
  useEffect(() => {
    if (!addHandler) return;
    
    const unregisterLogin = addHandler('login', loginHandler, {
      priority: 100,
      blocking: true,
      id: 'user-login'
    });
    
    const unregisterUpdate = addHandler('updateProfile', updateProfileHandler, {
      priority: 100,
      blocking: true,
      id: 'profile-update'
    });
    
    const unregisterLogout = addHandler('logout', logoutHandler, {
      priority: 100,
      blocking: true,
      id: 'user-logout'
    });
    
    return () => {
      unregisterLogin();
      unregisterUpdate();
      unregisterLogout();
    };
  }, [addHandler, loginHandler, updateProfileHandler, logoutHandler]);
}
```

## 3단계: UI 컴포넌트

```typescript
// components/UserProfile.tsx
import { useState, useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore, useUserAction } from '../stores/user.store';

export function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  const dispatch = useUserAction();
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: profile.name });
  
  // 로그인 처리
  const handleLogin = useCallback(async () => {
    await dispatch('login', loginForm);
  }, [dispatch, loginForm]);
  
  // 프로필 업데이트 처리
  const handleUpdateProfile = useCallback(async () => {
    await dispatch('updateProfile', { data: { name: editForm.name } });
    setIsEditing(false);
  }, [dispatch, editForm.name]);
  
  // 로그아웃 처리
  const handleLogout = useCallback(() => {
    dispatch('logout');
  }, [dispatch]);
  
  // 로그인되지 않은 경우
  if (!profile.id) {
    return (
      <div>
        <h2>로그인</h2>
        <div>
          <input
            type="email"
            placeholder="이메일"
            value={loginForm.email}
            onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="비밀번호"
            value={loginForm.password}
            onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
          />
        </div>
        <button onClick={handleLogin}>로그인</button>
        <p><small>테스트: test@example.com / password</small></p>
      </div>
    );
  }
  
  // 로그인된 경우
  return (
    <div>
      <h2>사용자 프로필</h2>
      <div>
        <p><strong>이메일:</strong> {profile.email}</p>
        <div>
          <strong>이름:</strong>
          {isEditing ? (
            <span>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ name: e.target.value })}
              />
              <button onClick={handleUpdateProfile}>저장</button>
              <button onClick={() => setIsEditing(false)}>취소</button>
            </span>
          ) : (
            <span>
              {profile.name || '이름 없음'}
              <button onClick={() => {
                setEditForm({ name: profile.name });
                setIsEditing(true);
              }}>
                편집
              </button>
            </span>
          )}
        </div>
        <button onClick={handleLogout}>로그아웃</button>
      </div>
    </div>
  );
}
```

## 4단계: 프로바이더 설정

```typescript
// providers/UserProvider.tsx
import React from 'react';
import { UserStoreProvider, UserActionProvider } from '../stores/user.store';
import { useUserHandlers } from '../hooks/useUserHandlers';

// 핸들러 설정 컴포넌트
function UserHandlersSetup() {
  useUserHandlers();
  return null;
}

// 통합 사용자 프로바이더
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

## 5단계: 앱 설정

```typescript
// App.tsx
import React from 'react';
import { UserProvider } from './providers/UserProvider';
import { UserProfile } from './components/UserProfile';

function App() {
  return (
    <UserProvider>
      <div style={{ padding: '20px' }}>
        <h1>Context-Action 빠른 시작</h1>
        <UserProfile />
      </div>
    </UserProvider>
  );
}

export default App;
```

## 결과

이제 다음 기능을 가진 완전한 애플리케이션이 있습니다:

- ✅ **타입 안전한** 상태 관리
- ✅ **반응형** UI 업데이트
- ✅ **중앙화된** 비즈니스 로직
- ✅ **도메인 격리**
- ✅ **자동 정리** (메모리 누수 없음)

## 애플리케이션 실행

```bash
npm run dev
# 또는
yarn dev
```

브라우저에서 다음을 볼 수 있습니다:
1. 로그인 폼
2. `test@example.com` / `password`로 로그인
3. 프로필 편집 기능
4. 로그아웃 기능

## 주요 개념 요약

### 1. 도메인별 훅
```typescript
const store = useUserStore('profile');  // 타입 안전한 스토어 접근
const dispatch = useUserAction();       // 타입 안전한 액션 디스패치
```

### 2. 반응형 구독
```typescript
const profile = useStoreValue(profileStore);  // 자동 리렌더링
```

### 3. 중앙화된 비즈니스 로직
```typescript
// 컴포넌트에서
dispatch('login', { email, password });

// 핸들러에서 처리됨
const loginHandler = async (payload, controller) => { /* 로직 */ };
```

### 4. 자동 정리
```typescript
useEffect(() => {
  const unregister = addHandler('action', handler);
  return unregister;  // 자동 정리
}, []);
```

---

## 다음 단계

축하합니다! 첫 번째 Context-Action 애플리케이션을 성공적으로 만들었습니다.

### 더 학습하기

- [핵심 개념](./concepts) - 깊이 있는 이해
- [설정 & 사용법](./setup-usage) - 고급 설정 옵션
- [최선의 실습](./best-practices) - 프로덕션 환경 팁
- [성능 최적화](./performance) - 성능 향상 기법

### 확장하기

이제 다음을 추가해볼 수 있습니다:
- 새로운 도메인 (Cart, Order 등)
- 더 복잡한 비즈니스 로직
- API 통합
- 테스트 작성
- 오류 처리 개선

Happy coding! 🚀