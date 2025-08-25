# 등록 위임 패턴

외부 함수와 `useActionRegister()` 훅을 사용해 별도 모듈에서 액션 핸들러를 구성하는 고급 패턴입니다.

## Import
```typescript
import { createActionContext, ActionPayloadMap, ActionRegister } from '@context-action/react';
```

## 기능
- ✅ 모듈식 핸들러 구성
- ✅ 외부 함수 위임
- ✅ 팀 기반 개발 지원
- ✅ 플러그인 아키텍처 활성화
- ✅ 정리 관리

## 필수 조건

🎯 **스펙 재사용**: 타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 **[기본 액션 설정](../setup/basic-action-setup.md)**을 참조하세요.

📖 **이 문서의 모든 예제**는 아래 설정 스펙을 재사용합니다:
- 🎯 액션 타입 → [EventActions 패턴](../setup/basic-action-setup.md#common-action-patterns)
- 🎯 컨텍스트 생성 → [단일 도메인 컨텍스트](../setup/basic-action-setup.md#single-domain-context)
- 🎯 프로바이더 설정 → [단일 프로바이더 설정](../setup/basic-action-setup.md#single-provider-setup)

💡 **일관된 학습**: 설정 가이드를 먼저 읽으면 이 문서의 모든 예제를 **즉시 이해**할 수 있습니다.

## 개요

등록 위임은 핸들러 로직을 외부 모듈로 분리하여 모듈식 핸들러 구성을 가능하게 합니다. 이 패턴은 복잡한 비즈니스 로직, 팀 기반 개발, 플러그인 아키텍처가 있는 대규모 애플리케이션에 필수적입니다.

## 기본 위임 패턴

```tsx
// 프레임워크 imports
import { useEffect } from 'react';
import { ActionRegister } from '@context-action/react';
// 설정 imports - 설정 가이드의 EventActions 재사용
import { useEventRegister, EventActions } from '../setup/actions';

// 외부 등록 함수
function setupAnalyticsHandlers(register: ActionRegister<EventActions>) {
  // React 컴포넌트 외부에서 핸들러 등록
  register.register('analytics', async (payload, controller) => {
    await analyticsAPI.track(payload.event, payload.data);
  }, {
    priority: 100,
    tags: ['analytics']
  });
  
  register.register('userClick', async (payload, controller) => {
    await analyticsAPI.trackClick(payload.x, payload.y);
  }, {
    priority: 90,
    tags: ['analytics', 'interaction']
  });
}

// 등록을 위임하는 컴포넌트
function AnalyticsSetup() {
  const register = useEventRegister();
  
  useEffect(() => {
    if (!register) return;
    
    // 외부 함수에 등록 위임
    setupAnalyticsHandlers(register);
    
    // 언마운트 시 정리
    return () => {
      register.unregisterByTags(['analytics']);
    };
  }, [register]);
  
  return null; // 설정 컴포넌트
}
```

## 모듈식 핸들러 등록

```tsx
// utils/handlers/userHandlers.ts - 설정의 UserActions 사용한 사용자 도메인 핸들러
import { ActionRegister } from '@context-action/react';
import { UserActions } from '../setup/actions';

export function registerUserHandlers(register: ActionRegister<UserActions>) {
  register.register('updateProfile', async (payload, controller) => {
    try {
      await userAPI.updateProfile(payload);
      controller.setResult({ success: true });
    } catch (error) {
      controller.abort('프로필 업데이트 실패', error);
    }
  }, { tags: ['user', 'profile'] });
  
  register.register('changePassword', async (payload, controller) => {
    const isValid = await validatePassword(payload.currentPassword);
    if (!isValid) {
      controller.abort('현재 비밀번호가 올바르지 않습니다');
      return;
    }
    
    await userAPI.updatePassword(payload.newPassword);
  }, { tags: ['user', 'security'] });
}

// utils/handlers/apiHandlers.ts - 설정의 APIActions 사용한 API 도메인 핸들러
import { ActionRegister } from '@context-action/react';
import { APIActions } from '../setup/actions';

export function registerAPIHandlers(register: ActionRegister<APIActions>) {
  register.register('fetchData', async (payload, controller) => {
    // API 데이터 가져오기 로직
    const result = await fetch(payload.endpoint + '?' + new URLSearchParams(payload.params));
    const data = await result.json();
    controller.setResult(data);
  }, { tags: ['api', 'fetch'] });
  
  register.register('uploadFile', async (payload, controller) => {
    // 파일 업로드 로직
    const formData = new FormData();
    formData.append('file', payload.file);
    const result = await fetch('/upload', { method: 'POST', body: formData });
    controller.setResult(result);
  }, { tags: ['api', 'upload'] });
}

// 여러 핸들러 모듈을 조정하는 컴포넌트
function AppHandlerSetup() {
  const userRegister = useUserRegister();
  const apiRegister = useAPIRegister();
  const eventRegister = useEventRegister();
  
  useEffect(() => {
    if (!userRegister || !apiRegister || !eventRegister) return;
    
    // 다른 모듈에서 핸들러 등록
    registerUserHandlers(userRegister);
    registerAPIHandlers(apiRegister);
    setupAnalyticsHandlers(eventRegister);
    
    // 언마운트 시 모듈 태그로 정리
    return () => {
      userRegister.unregisterByTags(['user']);
      apiRegister.unregisterByTags(['api']);
      eventRegister.unregisterByTags(['analytics']);
    };
  }, [userRegister, apiRegister, eventRegister]);
  
  return null;
}
```

## 동적 핸들러 등록

```tsx
// 구성에 기반한 동적 핸들러 설정
import { useStoreValue } from '@context-action/react';
import { useEventRegister } from '../setup/actions';

function DynamicHandlerSetup() {
  const register = useEventRegister();
  const config = useStoreValue(configStore);
  
  useEffect(() => {
    if (!register) return;
    
    // 현재 구성에 기반한 핸들러 등록
    if (config.enableAnalytics) {
      setupAnalyticsHandlers(register);
    }
    
    if (config.enableNotifications) {
      setupNotificationHandlers(register);
    }
    
    if (config.debugMode) {
      setupDebugHandlers(register);
    }
    
    // 정리 함수 반환
    return () => {
      register.clearHandlers();
    };
  }, [register, config.enableAnalytics, config.enableNotifications, config.debugMode]);
  
  return null;
}
```

## 팀 기반 핸들러 구성

```tsx
// 설정 스펙 타입을 사용한 팀별 핸들러 모듈
// team-auth/handlers.ts
import { ActionRegister } from '@context-action/react';
import { UserActions } from '../setup/actions';

export function registerAuthHandlers(register: ActionRegister<UserActions>) {
  register.register('login', authLoginHandler, { tags: ['auth'] });
  register.register('logout', authLogoutHandler, { tags: ['auth'] });
  // refreshToken 핸들러는 설정의 UserActions에 추가해야 함
}

// team-products/handlers.ts
import { ActionRegister } from '@context-action/react';
import { APIActions } from '../setup/actions';

export function registerProductHandlers(register: ActionRegister<APIActions>) {
  register.register('fetchData', productLoadHandler, { tags: ['products'] });
  register.register('postData', productSearchHandler, { tags: ['products'] });
  // 추가 제품 핸들러는 설정의 APIActions를 확장
}

// team-notifications/handlers.ts
import { ActionRegister } from '@context-action/react';
import { NotificationActions } from '../setup/actions';

export function registerNotificationHandlers(register: ActionRegister<NotificationActions>) {
  register.register('showNotification', orderNotificationHandler, { tags: ['orders'] });
  register.register('hideNotification', paymentNotificationHandler, { tags: ['orders'] });
}

// 메인 애플리케이션 핸들러 조정
function TeamHandlerCoordinator() {
  const userRegister = useUserRegister();
  const apiRegister = useAPIRegister();
  const notificationRegister = useNotificationRegister();
  
  useEffect(() => {
    if (!userRegister || !apiRegister || !notificationRegister) return;
    
    // 각 팀이 설정 스펙을 사용해 핸들러 등록
    registerAuthHandlers(userRegister);
    registerProductHandlers(apiRegister);
    registerNotificationHandlers(notificationRegister);
    
    return () => {
      userRegister.unregisterByTags(['auth']);
      apiRegister.unregisterByTags(['products']);
      notificationRegister.unregisterByTags(['orders']);
    };
  }, [userRegister, apiRegister, notificationRegister]);
  
  return null;
}
```

## 모범 사례

1. **모듈 구성**: 관련 핸들러를 별도 모듈로 그룹화
2. **정리 관리**: 언마운트 시 항상 핸들러 등록 해제
3. **타입 안전성**: 타입 안전성 유지를 위해 타입화된 ActionRegister 전달
4. **구성 기반**: 구성을 사용해 조건부로 핸들러 등록
5. **에러 처리**: 등록 오류를 우아하게 처리
6. **성능**: 모든 렌더링마다가 아닌 한 번만 핸들러 등록
7. **팀 경계**: 팀 또는 기능 소유권별로 핸들러 구성
8. **핸들러 ID**: 디버깅 및 관리를 쉽게 하기 위해 설명적인 ID 사용

## 언제 등록 위임을 사용할까요

- **대규모 애플리케이션**: 여러 모듈에 걸친 복잡한 핸들러 로직
- **팀 개발**: 다른 팀이 다른 핸들러를 소유
- **동적 구성**: 런타임 구성에 기반한 핸들러 등록
- **플러그인 아키텍처**: 모듈식 핸들러 등록 시스템
- **테스팅**: 개별 핸들러 모듈을 더 쉽게 모킹하고 테스트