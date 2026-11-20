# 기본 설정

이 예제는 Action Only와 Store Only 패턴을 모두 사용한 Context-Action 프레임워크의 기본 설정을 Context-Layered 구조에 맞춰 보여줍니다.

## 설치

먼저 필요한 패키지를 설치하세요:

```bash
pnpm add @context-action/core @context-action/react
# 또는
npm install @context-action/core @context-action/react
```

## 프로젝트 구조

```
src/
├── contexts/
│   ├── actions.tsx            # 액션 컨텍스트
│   └── stores.tsx             # 스토어 패턴
├── handlers/
│   └── AppActionHandlers.tsx  # 액션 핸들러 오케스트레이션
├── components/
│   ├── App.tsx                # 메인 애플리케이션
│   ├── UserProfile.tsx        # 순수 UI 프레젠테이션 뷰
│   └── EventLogger.tsx        # 이벤트 로깅 뷰
└── types/
    └── actions.ts             # 액션 타입 정의
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
  trackEvent: { event: string; data: unknown };
  logError: { error: string; context: unknown };

  // UI 액션
  showNotification: { message: string; type: 'success' | 'error' | 'info' };
  hideNotification: void;
}
```

## 단계 2: 액션 컨텍스트 생성

비즈니스 로직 오케스트레이션을 위한 Action Only 패턴을 설정하세요:

```typescript
// src/contexts/actions.tsx
import { createActionContext } from '@context-action/react';
import type { AppActions } from '../types/actions';

export const {
  Provider: AppActionProvider,
  useActionDispatch: useAppAction,
  useActionHandler: useAppActionHandler
} = createActionContext<AppActions>('App');
```

## 단계 3: 스토어 패턴 생성

상태 관리를 위한 Store Only 패턴을 설정하세요 (`createStoreContext`는 `initialValue`, `strategy`, `description` 등 실제 `StoreConfig` 옵션을 사용합니다):

```typescript
// src/contexts/stores.tsx
import { createStoreContext } from '@context-action/react';

export const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager,
  withProvider: withAppStoreProvider
} = createStoreContext('App', {
  user: {
    id: '',
    name: '',
    email: '',
    isAuthenticated: false
  },
  ui: {
    loading: false,
    notification: null as { message: string; type: 'success' | 'error' | 'info' } | null
  },
  settings: {
    initialValue: { theme: 'light' as 'light' | 'dark', language: 'ko' as 'ko' | 'en' },
    strategy: 'shallow' as const,
    description: '사용자 UI 설정'
  }
});

export function isValidSettings(value: { theme: string; language: string }): boolean {
  return ['light', 'dark'].includes(value.theme) && ['ko', 'en'].includes(value.language);
}
```

## 단계 4: 메인 애플리케이션 설정

Provider를 조합하고, 뷰 컴포넌트 상단에 핸들러 컴포넌트를 배치하세요:

```typescript
// src/components/App.tsx
import React from 'react';
import { AppActionProvider } from '../contexts/actions';
import { withAppStoreProvider } from '../contexts/stores';
import { AppActionHandlers } from '../handlers/AppActionHandlers';
import { UserProfile } from './UserProfile';
import { EventLogger } from './EventLogger';

const App = withAppStoreProvider(() => (
  <AppActionProvider>
    <AppActionHandlers>
      <div className="app">
        <header>
          <h1>Context-Action Example</h1>
        </header>

        <main>
          <UserProfile />
          <EventLogger />
        </main>
      </div>
    </AppActionHandlers>
  </AppActionProvider>
));

export default App;
```

## 단계 5: 핸들러 레이어 및 사용자 프로필 뷰

핸들러 등록(`useAppActionHandler`, 스토어 읽기·쓰기)을 순수 프레젠테이션 뷰(`useStoreValue` + `dispatch`)와 분리하세요:

```typescript
// src/handlers/AppActionHandlers.tsx
import React, { useCallback } from 'react';
import { useAppAction, useAppActionHandler } from '../contexts/actions';
import { isValidSettings, useAppStore } from '../contexts/stores';

export function AppActionHandlers({ children }: { children: React.ReactNode }) {
  const dispatch = useAppAction();
  const userStore = useAppStore('user');
  const uiStore = useAppStore('ui');
  const settingsStore = useAppStore('settings');

  // 프로필 업데이트 핸들러
  useAppActionHandler('updateProfile', useCallback(async (payload, controller) => {
    try {
      uiStore.update(current => ({ ...current, loading: true }));

      await new Promise(resolve => setTimeout(resolve, 1000));

      userStore.update(current => ({
        ...current,
        name: payload.name,
        email: payload.email
      }));

      const currentSettings = settingsStore.getValue();
      if (isValidSettings(currentSettings)) {
        settingsStore.setValue(currentSettings);
      }

      dispatch('showNotification', {
        message: '프로필이 업데이트되었습니다!',
        type: 'success'
      });
    } catch (error) {
      dispatch('logError', {
        error: (error as Error).message,
        context: { component: 'AppActionHandlers', action: 'updateProfile' }
      });

      controller.abort('프로필 업데이트 실패');
    } finally {
      uiStore.update(current => ({ ...current, loading: false }));
    }
  }, [dispatch, userStore, uiStore, settingsStore]));

  // 로그인 핸들러
  useAppActionHandler('login', useCallback(async (payload) => {
    uiStore.update(current => ({ ...current, loading: true }));

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      userStore.setValue({
        id: '123',
        name: '홍길동',
        email: `${payload.username}@example.com`,
        isAuthenticated: true
      });

      dispatch('trackEvent', {
        event: 'user_login',
        data: { username: payload.username, timestamp: Date.now() }
      });
    } catch {
      dispatch('showNotification', {
        message: '로그인에 실패했습니다.',
        type: 'error'
      });
    } finally {
      uiStore.update(current => ({ ...current, loading: false }));
    }
  }, [dispatch, userStore, uiStore]));

  useAppActionHandler('showNotification', useCallback((payload) => {
    uiStore.update(current => ({
      ...current,
      notification: { message: payload.message, type: payload.type }
    }));

    setTimeout(() => {
      dispatch('hideNotification');
    }, 3000);
  }, [dispatch, uiStore]));

  useAppActionHandler('hideNotification', useCallback(() => {
    uiStore.update(current => ({ ...current, notification: null }));
  }, [uiStore]));

  return <>{children}</>;
}
```

```typescript
// src/components/UserProfile.tsx
import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useAppAction } from '../contexts/actions';
import { useAppStore } from '../contexts/stores';

export function UserProfile() {
  const dispatch = useAppAction();
  const userStore = useAppStore('user');
  const uiStore = useAppStore('ui');

  const user = useStoreValue(userStore);
  const ui = useStoreValue(uiStore);

  const handleUpdateProfile = () => {
    dispatch('updateProfile', {
      name: '홍길동',
      email: 'hong@example.com'
    });
  };

  const handleLogin = () => {
    dispatch('login', {
      username: 'hong.gildong',
      password: 'secret123'
    });
  };

  const handleLogout = () => {
    userStore.setValue({
      id: '',
      name: '',
      email: '',
      isAuthenticated: false
    });

    dispatch('trackEvent', {
      event: 'user_logout',
      data: { timestamp: Date.now() }
    });
  };

  return (
    <div className="user-profile">
      <h2>사용자 프로필</h2>

      {ui.loading && <div className="loading">로딩 중...</div>}

      {ui.notification && (
        <div className={`notification notification--${ui.notification.type}`}>
          {ui.notification.message}
        </div>
      )}

      {user.isAuthenticated ? (
        <div className="user-info">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>이름:</strong> {user.name}</p>
          <p><strong>이메일:</strong> {user.email}</p>

          <div className="actions">
            <button onClick={handleUpdateProfile} disabled={ui.loading}>
              프로필 업데이트
            </button>
            <button onClick={handleLogout}>로그아웃</button>
          </div>
        </div>
      ) : (
        <div className="login-form">
          <p>계속하려면 로그인하세요</p>
          <button onClick={handleLogin} disabled={ui.loading}>
            로그인
          </button>
        </div>
      )}
    </div>
  );
}
```

## 단계 6: 이벤트 로거 컴포넌트

이벤트 추적 액션을 수신하는 독립 로거 컴포넌트입니다:

```typescript
// src/components/EventLogger.tsx
import React, { useCallback, useState } from 'react';
import { useAppActionHandler } from '../contexts/actions';

export function EventLogger() {
  const [events, setEvents] = useState<Array<{ event: string; data: unknown; timestamp: number }>>([]);
  const [errors, setErrors] = useState<Array<{ error: string; context: unknown; timestamp: number }>>([]);

  useAppActionHandler('trackEvent', useCallback((payload) => {
    setEvents(current => [...current, { event: payload.event, data: payload.data, timestamp: Date.now() }]);
  }, []));

  useAppActionHandler('logError', useCallback((payload) => {
    setErrors(current => [...current, { error: payload.error, context: payload.context, timestamp: Date.now() }]);
  }, []));

  return (
    <div className="event-logger">
      <h3>이벤트 로그 ({events.length}) / 에러 ({errors.length})</h3>
      {events.slice(-5).map((entry, index) => (
        <div key={index}>{entry.event}</div>
      ))}
    </div>
  );
}
```

## 주요 개념

- **Context-Layered 분리**: View 레이어(`UserProfile`, `EventLogger`), Handler 레이어(`AppActionHandlers`), Model 레이어(Store Context)를 명확히 분리합니다.
- **실제 Store API 사용**: `useAppStore('user')`로 타입이 추론된 스토어를 가져와 `useStoreValue(store)`로 구독하고 `store.setValue()` / `store.update()`로 갱신합니다.
- **오류 복원력**: `controller.abort()`와 `try / finally`로 로딩 상태와 실패 알림을 안전하게 처리합니다.

## 예제 실행 (Vite)

```bash
pnpm create vite@latest context-action-example -- --template react-ts
cd context-action-example
pnpm add @context-action/core @context-action/react
# 위 코드를 src/에 복사한 뒤 실행
pnpm dev
```

## 다음 단계

- **[Context-Layered 아키텍처 가이드](../context-layered/context-layered-guide)** - 6계층 도메인 격리 규칙
- **[Store 선택 및 사용 가이드](../context-layered/store-selection-and-usage-guide)** - Store 기본 요소와 React 구독 훅 선택 기준
- **[Action Only 패턴](./action-only)** - 순수 액션 디스패치 패턴 심화
- **[Store Only 패턴](./store-only)** - 순수 상태 관리 패턴 심화
- **[패턴 조합](./pattern-composition)** - 대규모 앱을 위한 Action + Store 조합
