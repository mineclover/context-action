# 기본 액션 설정

Context-Action 프레임워크를 위한 공유 액션 컨텍스트 설정 패턴입니다.

## 임포트
```typescript
import { createActionContext, ActionPayloadMap } from '@context-action/react';
```

## 타입 정의

### 일반적인 액션 패턴
```typescript
// 이벤트 액션 (UI 상호작용)
interface EventActions {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
  trackInteraction: { type: string; metadata?: Record<string, any> };
}

// CRUD 액션 (데이터 작업)
interface CRUDActions {
  createItem: { data: any };
  updateItem: { id: string; data: Partial<any> };
  deleteItem: { id: string };
  refreshData: void;
}

// 사용자 관리 액션
interface UserActions {
  login: { email: string; password: string };
  logout: void;
  updateProfile: { name: string; email: string };
  changePassword: { currentPassword: string; newPassword: string };
}

// API 액션
interface APIActions {
  fetchData: { endpoint: string; params?: Record<string, any> };
  postData: { endpoint: string; data: any };
  uploadFile: { file: File; metadata?: any };
}

// 알림 액션
interface NotificationActions {
  showNotification: { message: string; type: 'success' | 'error' | 'warning' | 'info' };
  hideNotification: { id: string };
  clearAllNotifications: void;
}
```

### 확장된 액션 인터페이스
```typescript
// ActionPayloadMap 확장이 필요한 애플리케이션용
interface AppActions extends ActionPayloadMap {
  // 사용자 관리
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  
  // 데이터 작업
  saveData: { data: any };
  loadData: { id: string };
  
  // UI 상태
  showModal: { modalType: string; data?: any };
  hideModal: { modalType: string };
  
  // 페이로드 없는 액션
  refreshAll: void;
  resetState: void;
}
```

## 컨텍스트 생성 패턴

### 단일 도메인 컨텍스트
```typescript
// 특정 도메인을 위한 기본 액션 컨텍스트
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventDispatch,
  useActionHandler: useEventHandler,
  useActionDispatchWithResult: useEventDispatchWithResult,
  useActionRegister: useEventRegister,
  useActionContext: useEventContext
} = createActionContext<EventActions>('Events');
```

### 다중 도메인 컨텍스트 설정
```typescript
// 사용자 도메인 액션
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserDispatch,
  useActionHandler: useUserHandler
} = createActionContext<UserActions>('User');

// API 도메인 액션
const {
  Provider: APIActionProvider,
  useActionDispatch: useAPIDispatch,
  useActionHandler: useAPIHandler
} = createActionContext<APIActions>('API');

// 알림 도메인 액션
const {
  Provider: NotificationActionProvider,
  useActionDispatch: useNotificationDispatch,
  useActionHandler: useNotificationHandler
} = createActionContext<NotificationActions>('Notifications');
```

## 프로바이더 설정 패턴

### 단일 프로바이더 설정
```typescript
// 기본 단일 액션 프로바이더
function App() {
  return (
    <EventActionProvider>
      <AppContent />
    </EventActionProvider>
  );
}
```

### 다중 프로바이더 설정
```typescript
// 수동 중첩 방식
function App() {
  return (
    <UserActionProvider>
      <APIActionProvider>
        <NotificationActionProvider>
          <AppContent />
        </NotificationActionProvider>
      </APIActionProvider>
    </UserActionProvider>
  );
}

// composeProviders 유틸리티 사용 (권장)
import { composeProviders } from '@context-action/react';

const ActionProviders = composeProviders([
  UserActionProvider,
  APIActionProvider,
  NotificationActionProvider
]);

function App() {
  return (
    <ActionProviders>
      <AppContent />
    </ActionProviders>
  );
}
```

### 조건부 프로바이더 설정
```typescript
// 기능에 따른 조건부 액션 프로바이더
interface AppConfig {
  features: {
    analytics: boolean;
    notifications: boolean;
    userManagement: boolean;
  };
}

function AppWithConfig({ config }: { config: AppConfig }) {
  const providers = [];
  
  // 항상 기본 이벤트 액션 포함
  providers.push(EventActionProvider);
  
  if (config.features.userManagement) {
    providers.push(UserActionProvider);
  }
  
  if (config.features.notifications) {
    providers.push(NotificationActionProvider);
  }
  
  if (config.features.analytics) {
    providers.push(APIActionProvider);
  }
  
  const ConditionalProviders = composeProviders(providers);
  
  return (
    <ConditionalProviders>
      <AppContent />
    </ConditionalProviders>
  );
}
```

## 내보내기 패턴

### 명명된 내보내기 (권장)
```typescript
// actions/EventActions.ts
export interface EventActions {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
}

export const {
  Provider: EventActionProvider,
  useActionDispatch: useEventDispatch,
  useActionHandler: useEventHandler,
  useActionDispatchWithResult: useEventDispatchWithResult,
  useActionRegister: useEventRegister
} = createActionContext<EventActions>('Events');

// 쉬운 임포트를 위한 재내보내기
export {
  EventActionProvider,
  useEventDispatch,
  useEventHandler,
  useEventDispatchWithResult,
  useEventRegister
};
```

### 배럴 내보내기
```typescript
// actions/index.ts - 배럴 내보내기 파일
export * from './EventActions';
export * from './UserActions';
export * from './APIActions';
export * from './NotificationActions';

// 컴포넌트에서 사용
import {
  useEventDispatch,
  useUserDispatch,
  useAPIDispatch
} from '../actions';
```

### 컨텍스트 번들 내보내기
```typescript
// actions/ActionContexts.ts - 모든 컨텍스트를 하나의 파일에
export const EventContext = createActionContext<EventActions>('Events');
export const UserContext = createActionContext<UserActions>('User');
export const APIContext = createActionContext<APIActions>('API');

// 사용
import { EventContext, UserContext } from '../actions/ActionContexts';

const EventDispatch = EventContext.useActionDispatch;
const UserDispatch = UserContext.useActionDispatch;
```

## 모범 사례

### 타입 조직
1. **도메인 주도 타입**: 비즈니스 도메인별로 액션 그룹화
2. **일관된 네이밍**: 일관된 동사-명사 패턴 사용 (createUser, updateUser, deleteUser)
3. **페이로드 구조**: 복잡한 데이터에는 객체, 간단한 값에는 원시 타입 사용
4. **Void 액션**: 페이로드 없는 액션에는 `void` 사용

### 컨텍스트 네이밍
1. **설명적 이름**: 명확한 도메인 이름 사용 ('User', 'Events', 'API')
2. **훅 리네이밍**: 명확성을 위해 도메인별 훅 이름 생성
3. **프로바이더 네이밍**: Provider 접미사 컨벤션 따르기

### 프로바이더 조직
1. **논리적 그룹화**: 관련된 액션 프로바이더들을 함께 그룹화
2. **기능 플래그**: 선택적 기능을 위해 조건부 프로바이더 사용
3. **프로바이더 구성**: 수동 중첩보다 `composeProviders` 선호
4. **성능**: 컴포넌트 트리에서 프로바이더 배치 고려

## 일반적인 패턴 참조

이 설정 파일은 다음을 위한 재사용 가능한 패턴을 제공합니다:

- **[액션 기본 사용법](../action/basic-usage.md)** - EventActions 패턴 사용
- **[디스패치 액세스 패턴](../action/dispatch-access.md)** - AppActions 패턴 사용  
- **[고급 액션 패턴](../action/advanced-patterns.md)** - 다중 도메인 패턴 사용
- **[MVVM 아키텍처](../architecture/mvvm.md)** - UserActions 패턴 사용
- **[도메인 컨텍스트 아키텍처](../architecture/domain-context.md)** - 다중 도메인 패턴 사용

## 관련 설정 가이드

- **[기본 스토어 설정](./basic-store-setup.md)** - 스토어 컨텍스트 설정 패턴
- **[다중 컨텍스트 설정](./multi-context-setup.md)** - 복잡한 아키텍처 설정
- **[프로바이더 구성](../store/withProvider-pattern.md)** - 고급 프로바이더 패턴