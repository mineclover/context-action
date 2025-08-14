# 액션 핸들러

액션 핸들러는 애플리케이션의 비즈니스 로직을 포함합니다. 확장 가능하고 유지보수가 가능한 애플리케이션을 위해 핸들러를 효과적으로 구현, 등록, 관리하는 방법을 알아보세요.

## 핸들러 구현 패턴

### 모범 사례: useActionHandler 패턴

핸들러 등록에 권장되는 패턴은 최적의 성능과 적절한 정리를 위해 `useActionHandler` + `useEffect`를 사용하는 것입니다:

```typescript
import React, { useEffect, useCallback } from 'react';
import { useUserActionHandler, useUserStores } from '@/stores/user.store';

function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  // 재등록을 방지하기 위해 핸들러를 useCallback으로 감싸기
  const updateProfileHandler = useCallback(async (payload, controller) => {
    // 현재 상태를 위한 stores 지연 평가
    const profileStore = stores.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // 검증
    if (payload.validate && !isValidEmail(payload.data.email)) {
      controller.abort('유효하지 않은 이메일 형식');
      return;
    }
    
    // 비즈니스 로직
    const updatedProfile = {
      ...currentProfile,
      ...payload.data,
      updatedAt: Date.now()
    };
    
    // 스토어 업데이트
    profileStore.setValue(updatedProfile);
    
    // 수집을 위한 결과 반환
    return { success: true, profile: updatedProfile };
  }, [stores]);
  
  // 정리와 함께 핸들러 등록
  useEffect(() => {
    if (!addHandler) return;
    
    // 등록은 등록 해제 함수를 반환
    const unregister = addHandler('updateProfile', updateProfileHandler, {
      priority: 100,      // 높은 우선순위가 먼저 실행
      blocking: true,     // 순차 모드에서 비동기 완료 대기
      tags: ['business'], // 필터링용
      id: 'profile-updater' // 디버깅을 위한 명시적 ID
    });
    
    // 중요: 언마운트 시 메모리 정리를 위한 unregister 반환
    return unregister;
  }, [addHandler, updateProfileHandler]);
}
```

## 핸들러 설정 옵션

```typescript
interface HandlerConfig {
  priority?: number;        // 실행 순서 (높을수록 먼저)
  blocking?: boolean;       // 비동기 완료 대기
  tags?: string[];         // 필터링과 분류를 위함
  id?: string;            // 명시적 핸들러 ID
  category?: string;      // 핸들러 카테고리
  returnType?: 'value';   // 반환 값 수집 활성화
}
```

## 핸들러 실행 흐름

1. **순차 모드** (기본값): 핸들러가 우선순위 순서로 실행
2. **병렬 모드**: 모든 핸들러가 동시에 실행
3. **경쟁 모드**: 첫 번째로 완료되는 핸들러가 승리

```typescript
// 블로킹과 함께 순차 실행
addHandler('processOrder', handler1, { priority: 100, blocking: true });
addHandler('processOrder', handler2, { priority: 90, blocking: true });
addHandler('processOrder', handler3, { priority: 80, blocking: true });
// 실행: handler1 → 대기 → handler2 → 대기 → handler3

// 병렬 실행
dispatch('processOrder', payload, { executionMode: 'parallel' });
```

## 컨트롤러 메서드

컨트롤러는 핸들러 실행 흐름을 관리하는 메서드를 제공합니다:

```typescript
const handler = async (payload, controller) => {
  // 파이프라인 중단
  if (error) controller.abort('에러 메시지');
  
  // 특정 우선순위로 점프
  if (urgent) controller.jumpToPriority(90);
  
  // 수집을 위한 결과 설정
  controller.setResult(computedValue);
  
  // 결과와 함께 파이프라인 종료
  if (canFinishEarly) controller.return(finalResult);
};
```

## 고급 핸들러 패턴

### 에러 핸들링

```typescript
const robustHandler = useCallback(async (payload, controller) => {
  const store = stores.getStore('data');
  
  try {
    // 위험한 작업
    const result = await performRiskyOperation(payload);
    store.setValue(result);
    
    return { success: true, data: result };
  } catch (error) {
    // 컨텍스트와 함께 적절한 에러 핸들링
    controller.abort(`작업 실패: ${error.message}`, {
      operation: 'performRiskyOperation',
      payload,
      timestamp: Date.now(),
      error: error.stack
    });
    
    return { success: false, error: error.message };
  }
}, [stores]);
```

### 검증 핸들러

```typescript
const validationHandler = useCallback(async (payload, controller) => {
  // 입력 검증
  const errors = validatePayload(payload);
  if (errors.length > 0) {
    controller.abort('검증 실패', { errors });
    return { success: false, errors };
  }
  
  // 비즈니스 규칙 검증
  const store = stores.getStore('state');
  const currentState = store.getValue();
  
  if (!canPerformAction(currentState, payload)) {
    controller.abort('현재 상태에서 액션이 허용되지 않음');
    return { success: false, error: 'INVALID_STATE' };
  }
  
  return { success: true };
}, [stores]);
```

### 부작용 핸들러

```typescript
const sideEffectsHandler = useCallback(async (payload, controller) => {
  const store = stores.getStore('data');
  
  // 주요 작업
  const result = await mainOperation(payload);
  store.setValue(result);
  
  // 부작용 (실행 후 무시)
  scheduleCleanup(result.id);
  sendAnalytics('operation_completed', { id: result.id });
  logActivity('user_action', { action: 'update', userId: payload.userId });
  
  // 선택사항: 수집을 위한 결과 설정
  controller.setResult(result);
  
  return result;
}, [stores]);
```

## 결과 수집

여러 핸들러로부터 결과 수집:

```typescript
function useOrderProcessing() {
  const dispatchWithResult = useUserActionWithResult();
  
  const processOrder = async (orderData) => {
    const result = await dispatchWithResult('processOrder', orderData, {
      result: {
        collect: true,         // 수집 활성화
        strategy: 'all',       // 모든 결과 수집
        timeout: 5000,         // 5초 타임아웃
        maxResults: 10         // 결과 제한
      },
      filter: {
        tags: ['validation', 'business'], // 이 핸들러들만
        excludeTags: ['logging']          // 로깅 제외
      }
    });
    
    if (result.success) {
      console.log('결과:', result.results);
      console.log('지속시간:', result.execution.duration);
    }
    
    return result.result;
  };
}
```

## 핸들러 조직 패턴

### 도메인별 핸들러 파일

```typescript
// hooks/handlers/useUserBusinessHandlers.ts
export function useUserBusinessHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  // 프로필 핸들러
  const updateProfileHandler = useCallback(/* ... */, [stores]);
  const deleteProfileHandler = useCallback(/* ... */, [stores]);
  
  // 인증 핸들러  
  const loginHandler = useCallback(/* ... */, [stores]);
  const logoutHandler = useCallback(/* ... */, [stores]);
  
  // 모든 핸들러 등록
  useEffect(() => {
    if (!addHandler) return;
    
    const unregisterUpdate = addHandler('updateProfile', updateProfileHandler, {
      priority: 100, blocking: true, id: 'update-profile'
    });
    
    const unregisterDelete = addHandler('deleteProfile', deleteProfileHandler, {
      priority: 100, blocking: true, id: 'delete-profile'
    });
    
    const unregisterLogin = addHandler('login', loginHandler, {
      priority: 100, blocking: true, id: 'user-login'
    });
    
    const unregisterLogout = addHandler('logout', logoutHandler, {
      priority: 100, blocking: true, id: 'user-logout'
    });
    
    return () => {
      unregisterUpdate();
      unregisterDelete();
      unregisterLogin();
      unregisterLogout();
    };
  }, [addHandler, updateProfileHandler, deleteProfileHandler, loginHandler, logoutHandler]);
}
```

### 핸들러 조합

```typescript
// 여러 핸들러 훅 조합
function useAllHandlers() {
  useUserBusinessHandlers();
  useUserUIHandlers();
  useCartHandlers();
  useOrderHandlers();
  // 모든 핸들러가 한 곳에서 등록됨
}
```

## 성능 고려사항

### 핸들러 최적화

```typescript
// ✅ 좋음: 최소 의존성을 가진 안정적인 핸들러
const optimizedHandler = useCallback(async (payload, controller) => {
  const store = registry.getStore('data');
  // 핸들러 로직
}, [registry]); // registry 의존성만

// ❌ 나쁨: 매 렌더링마다 재생성되는 핸들러
const unoptimizedHandler = async (payload, controller) => {
  // 매 렌더링마다 새로운 함수
};
```

### 지연 로딩

```typescript
// 비용이 많이 드는 핸들러를 조건부로 등록
function useConditionalHandlers(userRole: string) {
  const addHandler = useActionHandler();
  
  useEffect(() => {
    if (!addHandler) return;
    
    const handlers = [];
    
    // 항상 기본 핸들러 등록
    handlers.push(addHandler('basic', basicHandler));
    
    // 관리자에게만 관리자 핸들러 등록
    if (userRole === 'admin') {
      handlers.push(addHandler('admin', adminHandler));
    }
    
    return () => handlers.forEach(unregister => unregister());
  }, [addHandler, userRole]);
}
```

## 일반적인 핸들러 안티패턴

### ❌ 정리 누락

```typescript
// 잘못됨 - 메모리 누수
useEffect(() => {
  addHandler('action', handler);
}, []); // 정리 없음
```

### ❌ 오래된 클로저

```typescript
// 잘못됨 - 오래된 값 사용
const data = store.getValue();
const handler = useCallback(() => {
  console.log(data); // 오래된 값
}, [data]);
```

### ❌ 에러 핸들링 누락

```typescript
// 잘못됨 - 무음 실패
const handler = async (payload, controller) => {
  await riskyOperation(); // 에러 핸들링 없음
};
```

## 요약

효과적인 액션 핸들러 구현에는 다음이 필요합니다:

- **적절한 등록**: `useActionHandler` + `useEffect` 패턴 사용
- **메모리 관리**: 항상 정리 함수 반환
- **에러 핸들링**: 의미 있는 메시지와 함께 견고한 에러 핸들링
- **성능**: `useCallback`을 사용한 안정적인 핸들러
- **테스트**: 비즈니스 로직에 대한 격리된 단위 테스트
- **조직**: 도메인별 핸들러 파일

액션 핸들러는 비즈니스 로직의 핵심입니다 - 유지보수 가능하고 확장 가능한 애플리케이션을 위해 올바르게 구현하세요.

---

::: tip 다음 단계
- 효과적인 상태 처리를 위한 [스토어 관리](./store-management) 학습
- 다중 도메인 핸들러를 위한 [교차 도메인 통합](./cross-domain-integration) 탐색
- 종합적인 핸들러 테스트 전략을 위한 [테스트 가이드](./testing) 참조
:::