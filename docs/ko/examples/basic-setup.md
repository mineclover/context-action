# 기본 설정

이 예제는 Action Only와 Store Only 패턴을 모두 사용한 Context-Action 프레임워크의 기본 설정을 보여줍니다.

## 설치

먼저 필요한 패키지를 설치하세요:

```bash
npm install @context-action/core @context-action/react
# 또는
pnpm add @context-action/core @context-action/react
# 또는  
yarn add @context-action/core @context-action/react
```

## 프로젝트 구조

```
src/
├── contexts/
│   ├── actions.tsx          # 액션 컨텍스트
│   └── stores.tsx           # 스토어 패턴
├── components/
│   ├── App.tsx              # 메인 애플리케이션
│   ├── UserProfile.tsx      # 사용자 프로필 컴포넌트
│   └── EventLogger.tsx      # 이벤트 로깅 컴포넌트
└── types/
    └── actions.ts           # 액션 타입 정의
```

## 단계 1: 액션 타입 정의

액션을 위한 타입 정의를 생성하세요:

```typescript
// src/types/actions.ts
import type { ActionPayloadMap } from '@context-action/core';

export interface AppActions extends ActionPayloadMap {
  // 사용자 액션
  updateProfile: { name: string; email: string };
  login: { username: string; password: string };
  logout: void;
  
  // 이벤트 추적
  trackEvent: { event: string; data: any };
  logError: { error: string; context: any };
  
  // UI 액션
  showNotification: { message: string; type: 'success' | 'error' | 'info' };
  hideNotification: void;
}
```

## 단계 2: 액션 컨텍스트 생성

비즈니스 로직을 위한 Action Only 패턴을 설정하세요:

```typescript
// src/contexts/actions.tsx
import { createActionContext } from '@context-action/react';
import type { AppActions } from '../types/actions';

export const {
  Provider: AppActionProvider,
  useActionDispatch: useAppAction,
  useActionHandler: useAppActionHandler
} = createActionContext<AppActions>('AppActions');
```

## 단계 3: 스토어 패턴 생성

상태 관리를 위한 Store Only 패턴을 설정하세요:

```typescript
// src/contexts/stores.tsx
import { createDeclarativeStorePattern } from '@context-action/react';

export const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: {
    initialValue: {
      name: '',
      email: '',
      isLoggedIn: false
    }
  },
  notifications: {
    initialValue: [] as Array<{
      id: string;
      message: string;
      type: 'success' | 'error' | 'info';
    }>
  },
  ui: {
    initialValue: {
      isLoading: false,
      theme: 'light' as 'light' | 'dark'
    }
  }
});
```

## 단계 4: 메인 앱 컴포넌트

Provider들을 조합하여 메인 앱을 생성하세요:

```typescript
// src/components/App.tsx
import React from 'react';
import { AppActionProvider } from '../contexts/actions';
import { AppStoreProvider } from '../contexts/stores';
import { UserProfile } from './UserProfile';
import { EventLogger } from './EventLogger';

export function App() {
  return (
    <AppStoreProvider>
      <AppActionProvider>
        <div className="app">
          <h1>Context-Action 기본 설정</h1>
          <UserProfile />
          <EventLogger />
        </div>
      </AppActionProvider>
    </AppStoreProvider>
  );
}
```

## 단계 5: 사용자 프로필 컴포넌트

액션과 스토어를 모두 사용하는 컴포넌트:

```typescript
// src/components/UserProfile.tsx
import React, { useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useAppStore, useAppStoreManager } from '../contexts/stores';
import { useAppAction, useAppActionHandler } from '../contexts/actions';

export function UserProfile() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  const { updateStore } = useAppStoreManager();
  const dispatch = useAppAction();

  // 액션 핸들러 등록
  useAppActionHandler('updateProfile', useCallback(async (payload) => {
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 스토어 업데이트
      updateStore('user', prevUser => ({
        ...prevUser,
        name: payload.name,
        email: payload.email
      }));
      
      // 성공 알림
      dispatch('showNotification', {
        message: '프로필이 업데이트되었습니다',
        type: 'success'
      });
      
      // 이벤트 추적
      dispatch('trackEvent', {
        event: 'profile_updated',
        data: { name: payload.name, email: payload.email }
      });
    } catch (error) {
      dispatch('logError', {
        error: '프로필 업데이트 실패',
        context: payload
      });
    }
  }, [updateStore, dispatch]));

  useAppActionHandler('login', useCallback(async (payload) => {
    try {
      // 로그인 로직 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateStore('user', prevUser => ({
        ...prevUser,
        isLoggedIn: true,
        name: payload.username
      }));
      
      dispatch('showNotification', {
        message: `${payload.username}님, 환영합니다!`,
        type: 'success'
      });
    } catch (error) {
      dispatch('showNotification', {
        message: '로그인에 실패했습니다',
        type: 'error'
      });
    }
  }, [updateStore, dispatch]));

  const handleUpdateProfile = () => {
    dispatch('updateProfile', {
      name: '홍길동',
      email: 'hong@example.com'
    });
  };

  const handleLogin = () => {
    dispatch('login', {
      username: 'user123',
      password: 'password'
    });
  };

  return (
    <div className="user-profile">
      <h2>사용자 프로필</h2>
      <p>이름: {user.name || '미설정'}</p>
      <p>이메일: {user.email || '미설정'}</p>
      <p>로그인 상태: {user.isLoggedIn ? '로그인됨' : '로그아웃됨'}</p>
      
      <div className="actions">
        <button onClick={handleUpdateProfile}>
          프로필 업데이트
        </button>
        <button onClick={handleLogin}>
          로그인
        </button>
      </div>
    </div>
  );
}
```

## 단계 6: 이벤트 로거 컴포넌트

이벤트 추적을 위한 Action Only 패턴 사용:

```typescript
// src/components/EventLogger.tsx
import React, { useCallback, useState } from 'react';
import { useAppActionHandler } from '../contexts/actions';

export function EventLogger() {
  const [logs, setLogs] = useState<string[]>([]);

  // 이벤트 추적 핸들러
  useAppActionHandler('trackEvent', useCallback((payload) => {
    const logMessage = `[${new Date().toLocaleTimeString()}] 이벤트: ${payload.event}`;
    setLogs(prev => [...prev, logMessage]);
    console.log('이벤트 추적:', payload);
  }, []));

  // 에러 로깅 핸들러
  useAppActionHandler('logError', useCallback((payload) => {
    const logMessage = `[${new Date().toLocaleTimeString()}] 에러: ${payload.error}`;
    setLogs(prev => [...prev, logMessage]);
    console.error('에러 로그:', payload);
  }, []));

  return (
    <div className="event-logger">
      <h3>이벤트 로그</h3>
      <div className="logs">
        {logs.length === 0 ? (
          <p>로그가 없습니다</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="log-entry">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

## 주요 포인트

1. **패턴 분리**: Action Only는 비즈니스 로직, Store Only는 상태 관리
2. **타입 안전성**: TypeScript로 완전한 타입 안전성 확보
3. **도메인별 리네이밍**: 명확한 컨텍스트 분리를 위한 훅 리네이밍
4. **패턴 조합**: 복잡한 애플리케이션을 위한 패턴 조합
5. **최적화**: useCallback을 사용한 핸들러 최적화

이 기본 설정을 바탕으로 더 복잡한 애플리케이션을 구축할 수 있습니다.