# 액션 핸들러

액션 핸들러는 Context-Action 프레임워크의 비즈니스 로직 계층으로, 선언적 액션을 실제 상태 변경과 부수 효과로 변환합니다. 이 가이드는 효과적인 핸들러 작성과 관리 패턴을 다룹니다.

## 핸들러 기본 구조

### 핸들러 시그니처

모든 액션 핸들러는 표준화된 시그니처를 따릅니다:

```typescript
type ActionHandler<TPayload> = (
  payload: TPayload,
  controller: ActionController
) => Promise<any> | any;
```

### 기본 핸들러 패턴

```typescript
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserStores();
  
  // 핸들러 구현
  const updateProfileHandler = useCallback(async (
    payload: UserActions['updateProfile'],
    controller: ActionController
  ) => {
    // 1. 현재 상태 획득 (지연 평가)
    const profileStore = registry.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // 2. 입력 검증
    if (!payload.data.email?.includes('@')) {
      controller.abort('잘못된 이메일 형식');
      return { success: false, error: 'INVALID_EMAIL' };
    }
    
    // 3. 비즈니스 로직 실행
    try {
      const updatedProfile = {
        ...currentProfile,
        ...payload.data,
        lastModified: Date.now()
      };
      
      // 4. 상태 업데이트
      profileStore.setValue(updatedProfile);
      
      // 5. 결과 반환
      return { 
        success: true, 
        profile: updatedProfile,
        timestamp: Date.now()
      };
      
    } catch (error) {
      // 6. 오류 처리
      controller.abort('프로필 업데이트 실패', error);
      return { success: false, error: 'UPDATE_FAILED' };
    }
  }, [registry]);
  
  // 7. 핸들러 등록
  useEffect(() => {
    if (!register) return;
    
    const unregister = register('updateProfile', updateProfileHandler, {
      priority: 100,
      blocking: true,
      id: 'profile-updater'
    });
    
    return unregister; // 정리
  }, [register, updateProfileHandler]);
}
```

## 핸들러 구성 옵션

### 우선순위 시스템

핸들러는 우선순위에 따라 실행됩니다 (높은 숫자가 먼저):

```typescript
// 검증 핸들러 (가장 먼저 실행)
register('updateProfile', validationHandler, {
  priority: 200,
  blocking: true,
  id: 'profile-validator'
});

// 메인 비즈니스 로직 (두 번째)
register('updateProfile', updateHandler, {
  priority: 100,
  blocking: true,
  id: 'profile-updater'
});

// 로깅/감사 (마지막)
register('updateProfile', loggingHandler, {
  priority: 50,
  blocking: false,
  id: 'profile-logger'
});
```

### 블로킹 vs 논블로킹

```typescript
// 블로킹: 핸들러 완료를 기다림
register('criticalAction', criticalHandler, {
  priority: 100,
  blocking: true  // 다음 핸들러 실행 전 대기
});

// 논블로킹: 즉시 다음 핸들러 실행
register('logAction', loggingHandler, {
  priority: 50,
  blocking: false  // 병렬 실행
});
```

### 핸들러 메타데이터

```typescript
register('updateProfile', handler, {
  priority: 100,
  blocking: true,
  id: 'profile-updater',           // 고유 식별자
  tags: ['profile', 'user', 'api'], // 분류 태그
  category: 'business-logic',       // 카테고리
  description: '사용자 프로필 업데이트', // 설명
  version: '1.0.0'                 // 버전
});
```

## 고급 핸들러 패턴

### 1. 조건부 실행 핸들러

```typescript
const conditionalHandler = useCallback(async (payload, controller) => {
  const sessionStore = registry.getStore('session');
  const session = sessionStore.getValue();
  
  // 조건 체크
  if (!session.isLoggedIn) {
    controller.abort('인증이 필요합니다');
    return { success: false, error: 'AUTHENTICATION_REQUIRED' };
  }
  
  if (session.role !== 'admin' && payload.adminAction) {
    controller.abort('권한이 없습니다');
    return { success: false, error: 'INSUFFICIENT_PERMISSIONS' };
  }
  
  // 조건을 만족하는 경우에만 실행
  return await executeBusinessLogic(payload);
}, [registry]);
```

### 2. 낙관적 업데이트 핸들러

```typescript
const optimisticUpdateHandler = useCallback(async (payload, controller) => {
  const profileStore = registry.getStore('profile');
  const currentProfile = profileStore.getValue();
  
  // 1. 즉시 낙관적 업데이트
  const optimisticProfile = { ...currentProfile, ...payload.data };
  profileStore.setValue(optimisticProfile);
  
  try {
    // 2. 서버 API 호출
    const response = await updateProfileOnServer(payload.data);
    
    // 3. 서버 응답으로 최종 업데이트
    profileStore.setValue(response.profile);
    
    return { success: true, profile: response.profile };
    
  } catch (error) {
    // 4. 실패 시 롤백
    profileStore.setValue(currentProfile);
    controller.abort('서버 업데이트 실패', error);
    return { success: false, error: 'SERVER_ERROR' };
  }
}, [registry]);
```

### 3. 배치 처리 핸들러

```typescript
const batchUpdateHandler = useCallback(async (payload, controller) => {
  const { updates } = payload;
  const results = [];
  const errors = [];
  
  // 배치 처리
  for (const update of updates) {
    try {
      const result = await processSingleUpdate(update);
      results.push(result);
    } catch (error) {
      errors.push({ update, error });
    }
  }
  
  // 부분 성공 처리
  if (errors.length > 0) {
    controller.abort('일부 업데이트 실패', { errors });
    return { 
      success: false, 
      results, 
      errors,
      partialSuccess: results.length > 0
    };
  }
  
  return { success: true, results, processed: updates.length };
}, []);
```

### 4. 디바운스 핸들러

```typescript
function useDebouncedHandler(delay: number = 500) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const registry = useUserStores();
  
  const debouncedHandler = useCallback(async (payload, controller) => {
    // 이전 타이머 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await performUpdate(payload);
          resolve({ success: true, result });
        } catch (error) {
          controller.abort('업데이트 실패', error);
          resolve({ success: false, error });
        }
      }, delay);
    });
  }, [delay]);
  
  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedHandler;
}
```

### 5. 리트라이 메커니즘

```typescript
const retryHandler = useCallback(async (payload, controller) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const result = await unstableOperation(payload);
      return { success: true, result, attempts: attempt + 1 };
      
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        controller.abort('최대 재시도 횟수 초과', { 
          error, 
          attempts: attempt 
        });
        return { success: false, error: 'MAX_RETRIES_EXCEEDED' };
      }
      
      // 지수 백오프
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}, []);
```

## 오류 처리 패턴

### 1. 계층적 오류 처리

```typescript
const robustHandler = useCallback(async (payload, controller) => {
  try {
    // Level 1: 입력 검증
    validatePayload(payload);
    
    // Level 2: 비즈니스 규칙 검증
    await validateBusinessRules(payload);
    
    // Level 3: 외부 의존성
    const externalData = await fetchExternalData();
    
    // Level 4: 상태 업데이트
    updateStores(payload, externalData);
    
    return { success: true };
    
  } catch (error) {
    // 오류 타입별 처리
    if (error instanceof ValidationError) {
      controller.abort('검증 실패', { 
        type: 'VALIDATION_ERROR',
        details: error.details 
      });
      return { success: false, error: 'VALIDATION_FAILED' };
    }
    
    if (error instanceof NetworkError) {
      controller.abort('네트워크 오류', { 
        type: 'NETWORK_ERROR',
        retryable: true 
      });
      return { success: false, error: 'NETWORK_FAILED', retryable: true };
    }
    
    // 예상치 못한 오류
    controller.abort('예기치 않은 오류', { 
      type: 'UNKNOWN_ERROR',
      originalError: error.message 
    });
    return { success: false, error: 'UNKNOWN_ERROR' };
  }
}, []);
```

### 2. 복구 가능한 오류 처리

```typescript
const recoverableHandler = useCallback(async (payload, controller) => {
  const profileStore = registry.getStore('profile');
  const backup = profileStore.getValue();
  
  try {
    // 위험한 작업 수행
    const result = await riskyOperation(payload);
    profileStore.setValue(result.profile);
    
    return { success: true, result };
    
  } catch (error) {
    // 자동 복구 시도
    try {
      await automaticRecovery(backup);
      controller.abort('자동 복구됨', { recovered: true });
      return { success: false, recovered: true };
      
    } catch (recoveryError) {
      // 복구 실패 - 원본 상태로 롤백
      profileStore.setValue(backup);
      controller.abort('복구 실패', { 
        originalError: error,
        recoveryError 
      });
      return { success: false, rollback: true };
    }
  }
}, [registry]);
```

## 결과 수집 패턴

### 1. 단일 결과 수집

```typescript
function UserComponent() {
  const dispatchWithResult = useUserActionWithResult();
  
  const handleUpdate = useCallback(async () => {
    const result = await dispatchWithResult('updateProfile', 
      { data: { name: '새 이름' } },
      { result: { collect: true, strategy: 'first' } }
    );
    
    if (result.success) {
      console.log('첫 번째 핸들러 결과:', result.results[0]);
    } else {
      console.error('오류:', result.errors);
    }
  }, [dispatchWithResult]);
}
```

### 2. 모든 결과 수집

```typescript
const handleComplexAction = useCallback(async () => {
  const result = await dispatchWithResult('complexAction', payload, {
    result: { collect: true, strategy: 'all' }
  });
  
  if (result.success) {
    // 모든 핸들러 결과 처리
    result.results.forEach((handlerResult, index) => {
      console.log(`핸들러 ${index + 1} 결과:`, handlerResult);
    });
  }
}, [dispatchWithResult]);
```

### 3. 조건부 결과 수집

```typescript
const handleConditionalResult = useCallback(async () => {
  const result = await dispatchWithResult('action', payload, {
    result: { 
      collect: true, 
      strategy: 'all',
      filter: (result) => result && result.important === true
    }
  });
  
  // 중요한 결과만 수집됨
  console.log('중요한 결과들:', result.results);
}, [dispatchWithResult]);
```

## 핸들러 조합 패턴

### 1. 파이프라인 패턴

```typescript
// 단계별 처리 핸들러
const validationHandler = useCallback(async (payload, controller) => {
  // 검증만 수행
  const errors = validatePayload(payload);
  if (errors.length > 0) {
    controller.abort('검증 실패', { errors });
    return { valid: false, errors };
  }
  return { valid: true };
}, []);

const transformHandler = useCallback(async (payload, controller) => {
  // 데이터 변환
  const transformed = transformData(payload);
  return { transformed };
}, []);

const persistHandler = useCallback(async (payload, controller) => {
  // 영속성 처리
  await saveToStorage(payload);
  return { saved: true };
}, []);

// 등록 시 우선순위로 파이프라인 구성
useEffect(() => {
  if (!register) return;
  
  const unregisterValidation = register('processData', validationHandler, {
    priority: 300, // 첫 번째
    blocking: true
  });
  
  const unregisterTransform = register('processData', transformHandler, {
    priority: 200, // 두 번째
    blocking: true
  });
  
  const unregisterPersist = register('processData', persistHandler, {
    priority: 100, // 세 번째
    blocking: true
  });
  
  return () => {
    unregisterValidation();
    unregisterTransform();
    unregisterPersist();
  };
}, [register, validationHandler, transformHandler, persistHandler]);
```

### 2. 플러그인 패턴

```typescript
// 플러그인 기반 핸들러 시스템
function usePluginSystem() {
  const register = useUserActionRegister();
  
  const coreHandler = useCallback(async (payload, controller) => {
    // 핵심 비즈니스 로직
    const coreResult = await processCoreLogic(payload);
    return { ...coreResult, source: 'core' };
  }, []);
  
  const auditPlugin = useCallback(async (payload, controller) => {
    // 감사 로그
    await logAction('userAction', payload);
    return { audited: true, source: 'audit' };
  }, []);
  
  const metricsPlugin = useCallback(async (payload, controller) => {
    // 메트릭 수집
    metrics.increment('user.actions.count');
    return { metricsRecorded: true, source: 'metrics' };
  }, []);
  
  useEffect(() => {
    if (!register) return;
    
    const unregisterCore = register('userAction', coreHandler, {
      priority: 100,
      blocking: true,
      id: 'core-handler'
    });
    
    const unregisterAudit = register('userAction', auditPlugin, {
      priority: 50,
      blocking: false,
      id: 'audit-plugin'
    });
    
    const unregisterMetrics = register('userAction', metricsPlugin, {
      priority: 50,
      blocking: false,
      id: 'metrics-plugin'
    });
    
    return () => {
      unregisterCore();
      unregisterAudit();
      unregisterMetrics();
    };
  }, [register, coreHandler, auditPlugin, metricsPlugin]);
}
```

## 테스팅 패턴

### 1. 핸들러 단위 테스트

```typescript
// __tests__/handlers/userHandlers.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { createMockController, createMockRegistry } from '@/test-utils';

describe('User Handlers', () => {
  let mockRegistry;
  let mockController;
  
  beforeEach(() => {
    mockRegistry = createMockRegistry();
    mockController = createMockController();
  });
  
  it('프로필 업데이트 성공', async () => {
    // Arrange
    const initialProfile = { id: '1', name: 'Old Name', email: 'old@example.com' };
    mockRegistry.getStore('profile').getValue.mockReturnValue(initialProfile);
    
    // Act
    const result = await updateProfileHandler(
      { data: { name: 'New Name' } },
      mockController
    );
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.profile.name).toBe('New Name');
    expect(mockRegistry.getStore('profile').setValue).toHaveBeenCalledWith({
      ...initialProfile,
      name: 'New Name',
      lastModified: expect.any(Number)
    });
  });
  
  it('잘못된 이메일로 업데이트 실패', async () => {
    // Arrange
    const invalidPayload = { data: { email: 'invalid-email' } };
    
    // Act
    const result = await updateProfileHandler(invalidPayload, mockController);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_EMAIL');
    expect(mockController.abort).toHaveBeenCalledWith('잘못된 이메일 형식');
  });
});
```

### 2. 통합 테스트

```typescript
// __tests__/integration/userFlow.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider } from '@/providers/UserProvider';
import { UserProfile } from '@/components/UserProfile';

describe('User Flow Integration', () => {
  it('프로필 업데이트 전체 흐름', async () => {
    // Arrange
    const { getByTestId } = render(
      <UserProvider>
        <UserProfile />
      </UserProvider>
    );
    
    // Act
    fireEvent.change(getByTestId('name-input'), {
      target: { value: '새 이름' }
    });
    fireEvent.click(getByTestId('save-button'));
    
    // Assert
    await waitFor(() => {
      expect(getByTestId('name-display')).toHaveTextContent('새 이름');
    });
  });
});
```

## 모범 사례

### 1. 핸들러 설계 원칙

```typescript
// ✅ 좋음: 단일 책임 원칙
const updateProfileHandler = useCallback(async (payload, controller) => {
  // 프로필 업데이트만 담당
  const profileStore = registry.getStore('profile');
  // ...
}, [registry]);

const notifyUsersHandler = useCallback(async (payload, controller) => {
  // 알림 전송만 담당
  await sendNotification(payload.userId, 'profile-updated');
}, []);

// ❌ 피하기: 여러 책임
const monolithicHandler = useCallback(async (payload, controller) => {
  // 프로필 업데이트 + 알림 + 로깅 + 메트릭 등등...
  // 하나의 핸들러에 너무 많은 책임
}, []);
```

### 2. 오류 처리 일관성

```typescript
// 표준 오류 응답 형식 정의
interface StandardError {
  success: false;
  error: string;
  code?: string;
  details?: any;
  retryable?: boolean;
}

interface StandardSuccess<T = any> {
  success: true;
  data?: T;
  timestamp?: number;
}

type HandlerResult<T = any> = StandardSuccess<T> | StandardError;
```

### 3. 핸들러 문서화

```typescript
/**
 * 사용자 프로필 업데이트 핸들러
 * 
 * @description 사용자 프로필 정보를 검증하고 업데이트합니다.
 * @priority 100 (메인 비즈니스 로직)
 * @blocking true (완료 후 다음 핸들러 실행)
 * 
 * @param payload.data - 업데이트할 프로필 필드들
 * @returns {HandlerResult} 성공 시 업데이트된 프로필, 실패 시 오류 정보
 * 
 * @throws 'INVALID_EMAIL' - 이메일 형식이 잘못된 경우
 * @throws 'UPDATE_FAILED' - 데이터 업데이트 실패
 * 
 * @example
 * ```typescript
 * dispatch('updateProfile', { data: { name: '새 이름' } });
 * ```
 */
const updateProfileHandler = useCallback(async (payload, controller) => {
  // 구현...
}, [registry]);
```

---

## 요약

액션 핸들러는 Context-Action 프레임워크의 핵심 비즈니스 로직 계층입니다:

- **표준화된 시그니처**로 일관된 패턴 구현
- **우선순위 기반 실행**으로 복잡한 워크플로우 지원
- **강력한 오류 처리**로 안정적인 애플리케이션 구축
- **결과 수집**으로 핸들러 간 통신 지원
- **테스트 친화적**으로 품질 보장

올바른 핸들러 패턴을 따르면 유지보수 가능하고 확장 가능한 비즈니스 로직을 구현할 수 있습니다.

---

::: tip 다음 단계
- [React 통합](./react-integration) - React 컴포넌트와의 통합 패턴
- [프로바이더 구성](./provider-composition) - 핸들러 설정과 도메인 경계
- [성능 최적화](./performance) - 핸들러 성능 최적화 기법
:::