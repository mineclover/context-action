# Action Only 패턴 예제

상태 관리 없이 순수 액션 디스패칭을 위한 Action Only 패턴의 실제 사용 예제입니다.

## 사용 사례

Action Only 패턴은 다음과 같은 경우에 적합합니다:
- 이벤트 추적 및 분석
- 로깅 시스템
- API 호출 (상태 변경 없이)
- 알림 시스템
- 커맨드 패턴 구현

## 기본 설정

```typescript
import { createActionContext } from '@context-action/react';

// 액션 타입 정의
interface EventActions {
  trackPageView: { page: string; userId?: string };
  trackUserAction: { action: string; data: any };
  sendAnalytics: { event: string; properties: Record<string, any> };
  logError: { error: string; stack?: string; context: any };
}

// Action Only 컨텍스트 생성
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');
```

## 이벤트 추적 시스템

```typescript
function EventTracker() {
  const dispatch = useEventAction();

  // 페이지 뷰 추적 핸들러
  useEventActionHandler('trackPageView', async (payload) => {
    console.log('페이지 뷰:', payload.page);
    
    // 외부 분석 서비스로 전송
    await fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: payload.page,
        userId: payload.userId,
        timestamp: Date.now()
      })
    });
  });

  // 사용자 액션 추적 핸들러
  useEventActionHandler('trackUserAction', async (payload) => {
    console.log('사용자 액션:', payload.action);
    
    // 여러 분석 서비스에 병렬 전송
    await Promise.all([
      fetch('/api/analytics/action', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
      fetch('/api/internal-analytics', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    ]);
  });

  // 에러 로깅 핸들러
  useEventActionHandler('logError', async (payload) => {
    console.error('에러 로그:', payload.error);
    
    // 에러 모니터링 서비스로 전송
    await fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    });
  });

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}
```

## 알림 시스템

```typescript
interface NotificationActions {
  showNotification: { 
    message: string; 
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  };
  hideNotification: { id: string };
  clearAllNotifications: void;
}

const {
  Provider: NotificationActionProvider,
  useActionDispatch: useNotificationAction,
  useActionHandler: useNotificationActionHandler
} = createActionContext<NotificationActions>('Notifications');

function NotificationSystem() {
  // 알림 표시 핸들러
  useNotificationActionHandler('showNotification', (payload) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // 토스트 라이브러리 사용
    if (payload.type === 'success') {
      toast.success(payload.message, { id });
    } else if (payload.type === 'error') {
      toast.error(payload.message, { id });
    } else if (payload.type === 'warning') {
      toast.warning(payload.message, { id });
    } else {
      toast.info(payload.message, { id });
    }

    // 자동 숨김 (duration이 지정된 경우)
    if (payload.duration) {
      setTimeout(() => {
        toast.dismiss(id);
      }, payload.duration);
    }
  });

  // 알림 숨김 핸들러
  useNotificationActionHandler('hideNotification', (payload) => {
    toast.dismiss(payload.id);
  });

  // 모든 알림 지우기 핸들러
  useNotificationActionHandler('clearAllNotifications', () => {
    toast.dismiss();
  });

  return null;
}
```

## API 호출 시스템

```typescript
interface ApiActions {
  fetchUserData: { userId: string };
  updateUserProfile: { userId: string; data: any };
  deleteUser: { userId: string };
  refreshCache: { key: string };
}

const {
  Provider: ApiActionProvider,
  useActionDispatch: useApiAction,
  useActionHandler: useApiActionHandler
} = createActionContext<ApiActions>('Api');

function ApiService() {
  const notificationDispatch = useNotificationAction();

  // 사용자 데이터 가져오기
  useApiActionHandler('fetchUserData', async (payload) => {
    try {
      const response = await fetch(`/api/users/${payload.userId}`);
      const userData = await response.json();
      
      // 다른 액션으로 결과 전달
      return userData;
    } catch (error) {
      notificationDispatch('showNotification', {
        message: '사용자 데이터 로드 실패',
        type: 'error'
      });
      throw error;
    }
  });

  // 사용자 프로필 업데이트
  useApiActionHandler('updateUserProfile', async (payload) => {
    try {
      const response = await fetch(`/api/users/${payload.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.data)
      });

      if (response.ok) {
        notificationDispatch('showNotification', {
          message: '프로필이 업데이트되었습니다',
          type: 'success'
        });
      }
    } catch (error) {
      notificationDispatch('showNotification', {
        message: '프로필 업데이트 실패',
        type: 'error'
      });
    }
  });

  // 캐시 새로고침
  useApiActionHandler('refreshCache', async (payload) => {
    await fetch(`/api/cache/refresh/${payload.key}`, {
      method: 'POST'
    });
    
    console.log(`캐시 새로고침: ${payload.key}`);
  });

  return null;
}
```

## 컴포넌트에서 사용

```typescript
function UserDashboard({ userId }: { userId: string }) {
  const eventDispatch = useEventAction();
  const notificationDispatch = useNotificationAction();
  const apiDispatch = useApiAction();

  useEffect(() => {
    // 페이지 뷰 추적
    eventDispatch('trackPageView', {
      page: '/dashboard',
      userId
    });
  }, [eventDispatch, userId]);

  const handleButtonClick = () => {
    // 사용자 액션 추적
    eventDispatch('trackUserAction', {
      action: 'button_click',
      data: { button: 'refresh', userId }
    });

    // API 호출
    apiDispatch('fetchUserData', { userId });

    // 알림 표시
    notificationDispatch('showNotification', {
      message: '데이터를 새로고침하고 있습니다...',
      type: 'info',
      duration: 3000
    });
  };

  return (
    <div>
      <h1>사용자 대시보드</h1>
      <button onClick={handleButtonClick}>
        데이터 새로고침
      </button>
    </div>
  );
}
```

## 앱 설정

```typescript
function App() {
  return (
    <EventActionProvider>
      <NotificationActionProvider>
        <ApiActionProvider>
          {/* 서비스 컴포넌트들 */}
          <EventTracker />
          <NotificationSystem />
          <ApiService />
          
          {/* UI 컴포넌트들 */}
          <UserDashboard userId="123" />
        </ApiActionProvider>
      </NotificationActionProvider>
    </EventActionProvider>
  );
}
```

## 결과 수집 사용

```typescript
function AdvancedApiService() {
  const { dispatchWithResult } = useApiActionWithResult();

  const handleComplexOperation = async () => {
    try {
      const result = await dispatchWithResult('fetchUserData', 
        { userId: '123' },
        { result: { collect: true } }
      );

      if (result.success) {
        console.log('API 호출 성공:', result.results);
      } else {
        console.error('API 호출 실패:', result.errors);
      }
    } catch (error) {
      console.error('작업 실패:', error);
    }
  };

  return (
    <button onClick={handleComplexOperation}>
      결과 수집으로 API 호출
    </button>
  );
}
```

## 주요 특징

1. **상태 없음**: 순수 사이드 이펙트만 처리
2. **이벤트 기반**: 액션 디스패치를 통한 이벤트 처리
3. **분리된 관심사**: 각 액션 컨텍스트가 특정 도메인 담당
4. **비동기 지원**: async/await를 통한 비동기 작업 처리
5. **에러 처리**: 적절한 에러 처리 및 복구

Action Only 패턴은 상태 관리 없이 비즈니스 로직을 깔끔하게 분리하는 강력한 도구입니다.