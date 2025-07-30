# 액션 파이프라인

액션 파이프라인은 Context Action의 핵심 개념으로, 여러 핸들러가 제어된 순서로 실행되는 강력하고 유연하며 조합 가능한 액션 처리 시스템입니다.

## 액션 파이프라인이란?

액션 파이프라인은 액션이 디스패치될 때 실행되는 핸들러들의 순서입니다. 각 핸들러는 다음과 같은 작업을 수행할 수 있습니다:

- 액션 페이로드 처리
- 후속 핸들러를 위한 데이터 변환
- 파이프라인 흐름 제어 (계속, 중단 또는 수정)
- 동기 또는 비동기 실행

```typescript
// 같은 액션에 대한 여러 핸들러
useActionHandler('saveUser', validateUser, { priority: 100 });
useActionHandler('saveUser', sendToDatabase, { priority: 50 });
useActionHandler('saveUser', logUserAction, { priority: 10 });
useActionHandler('saveUser', sendNotification, { priority: 0 });

// 'saveUser'가 디스패치되면 핸들러가 우선순위 순으로 실행됩니다:
// 1. validateUser (우선순위: 100)
// 2. sendToDatabase (우선순위: 50)
// 3. logUserAction (우선순위: 10)
// 4. sendNotification (우선순위: 0)
```

## 파이프라인 실행 모델

### 우선순위 기반 순서

핸들러는 우선순위 내림차순으로 실행됩니다 (높은 것부터 낮은 것 순):

```typescript
interface UserActions extends ActionPayloadMap {
  registerUser: { email: string; password: string; name: string };
}

// 유효성 검사 (최고 우선순위)
useActionHandler('registerUser', (userData, controller) => {
  if (!isValidEmail(userData.email)) {
    controller.abort('잘못된 이메일 형식');
    return;
  }
  
  if (userData.password.length < 8) {
    controller.abort('비밀번호가 너무 짧습니다');
    return;
  }
  
  controller.next();
}, { priority: 100 });

// 데이터베이스 작업 (중간 우선순위)
useActionHandler('registerUser', async (userData, controller) => {
  try {
    const user = await database.createUser(userData);
    
    // 후속 핸들러를 위해 사용자 ID를 페이로드에 추가
    controller.modifyPayload(payload => ({
      ...payload,
      userId: user.id,
      createdAt: user.createdAt
    }));
    
    controller.next();
  } catch (error) {
    controller.abort(`데이터베이스 오류: ${error.message}`);
  }
}, { priority: 50, blocking: true });

// 알림 (낮은 우선순위)
useActionHandler('registerUser', async (userData) => {
  await emailService.sendWelcomeEmail(userData.email, userData.name);
}, { priority: 10 });

// 분석 (가장 낮은 우선순위)
useActionHandler('registerUser', (userData) => {
  analytics.track('user_registered', {
    email: userData.email,
    timestamp: userData.createdAt
  });
}, { priority: 1 });
```

### 비동기 실행 모드

#### 블로킹 핸들러

다음 핸들러로 진행하기 전에 완료될 때까지 기다립니다:

```typescript
useActionHandler('processOrder', async (order, controller) => {
  // 다음 핸들러가 실행되기 전에 완료되어야 함
  const paymentResult = await paymentService.charge(order.total);
  
  if (!paymentResult.success) {
    controller.abort('결제 실패');
    return;
  }
  
  controller.modifyPayload(payload => ({
    ...payload,
    paymentId: paymentResult.id,
    paidAt: new Date()
  }));
  
  controller.next();
}, { blocking: true, priority: 100 });

useActionHandler('processOrder', async (order) => {
  // 결제가 성공한 후에만 실행됩니다
  await inventoryService.reserveItems(order.items);
  await shippingService.createShipment(order);
}, { blocking: true, priority: 50 });
```

#### 논-블로킹 핸들러

기다리지 않고 동시에 실행됩니다:

```typescript
useActionHandler('userLogin', async (loginData) => {
  // 이들은 동시에 실행되며 서로를 차단하지 않습니다
  analytics.track('user_login', loginData);
}, { blocking: false });

useActionHandler('userLogin', async (loginData) => {
  await auditLog.record('login_attempt', loginData);
}, { blocking: false });

useActionHandler('userLogin', async (loginData) => {
  await notificationService.sendLoginAlert(loginData.userId);
}, { blocking: false });
```

## 파이프라인 제어

### 컨트롤러 API

모든 핸들러는 실행을 제어하는 `PipelineController`를 받습니다:

```typescript
type PipelineController<T> = {
  next: () => void;                              // 다음 핸들러로 계속
  abort: (reason?: string) => void;              // 파이프라인 실행 중단
  modifyPayload: (modifier: (payload: T) => T) => void; // 페이로드 변환
};
```

### 흐름 제어 예제

#### 조건부 실행

```typescript
useActionHandler('processPayment', (payment, controller) => {
  if (payment.amount <= 0) {
    controller.abort('잘못된 결제 금액');
    return;
  }
  
  if (payment.amount > 10000) {
    // 고액 결제에는 추가 검증 필요
    controller.modifyPayload(payload => ({
      ...payload,
      requiresVerification: true
    }));
  }
  
  controller.next();
}, { priority: 100 });

useActionHandler('processPayment', async (payment, controller) => {
  if (payment.requiresVerification) {
    const verified = await fraudService.verify(payment);
    if (!verified) {
      controller.abort('결제 검증 실패');
      return;
    }
  }
  
  // 결제 처리...
  controller.next();
}, { priority: 50 });
```

#### 데이터 변환

```typescript
useActionHandler('submitForm', (formData, controller) => {
  // 입력 데이터 정제
  const sanitized = {
    name: formData.name.trim(),
    email: formData.email.toLowerCase().trim(),
    phone: formData.phone.replace(/\D/g, ''), // 숫자가 아닌 문자 제거
    message: formData.message.slice(0, 1000) // 길이 제한
  };
  
  controller.modifyPayload(() => sanitized);
  controller.next();
}, { priority: 100 });

useActionHandler('submitForm', (formData, controller) => {
  // 정제된 데이터 검증
  if (!formData.name || !formData.email) {
    controller.abort('필수 필드가 누락되었습니다');
    return;
  }
  
  // 메타데이터 추가
  controller.modifyPayload(payload => ({
    ...payload,
    submittedAt: new Date().toISOString(),
    source: 'web_form'
  }));
  
  controller.next();
}, { priority: 90 });
```

## 고급 파이프라인 패턴

### 미들웨어 패턴

재사용 가능한 미들웨어 함수 생성:

```typescript
// 범용 로깅 미들웨어
const createLogger = (action: string) => (payload: any, controller: PipelineController) => {
  console.log(`[${action}] 시작, 페이로드:`, payload);
  
  const originalNext = controller.next;
  controller.next = () => {
    console.log(`[${action}] 성공적으로 완료`);
    originalNext();
  };
  
  const originalAbort = controller.abort;
  controller.abort = (reason?: string) => {
    console.log(`[${action}] 중단됨: ${reason}`);
    originalAbort(reason);
  };
  
  controller.next();
};

// 범용 검증 미들웨어
const createValidator = <T>(rules: (payload: T) => string | null) => 
  (payload: T, controller: PipelineController<T>) => {
    const error = rules(payload);
    if (error) {
      controller.abort(error);
      return;
    }
    controller.next();
  };

// 사용법
useActionHandler('createUser', createLogger('createUser'), { priority: 1000 });
useActionHandler('createUser', createValidator(userData => {
  if (!userData.email) return '이메일이 필요합니다';
  if (!userData.password) return '비밀번호가 필요합니다';
  return null;
}), { priority: 900 });
```

### 서킷 브레이커 패턴

연쇄 장애 방지:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1분

  isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailureTime) < this.timeout;
  }

  recordSuccess(): void {
    this.failures = 0;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}

const paymentCircuitBreaker = new CircuitBreaker();

useActionHandler('processPayment', async (payment, controller) => {
  if (paymentCircuitBreaker.isOpen()) {
    controller.abort('결제 서비스를 일시적으로 사용할 수 없습니다');
    return;
  }

  try {
    const result = await paymentService.process(payment);
    paymentCircuitBreaker.recordSuccess();
    
    controller.modifyPayload(payload => ({
      ...payload,
      paymentResult: result
    }));
    
    controller.next();
  } catch (error) {
    paymentCircuitBreaker.recordFailure();
    controller.abort(`결제 실패: ${error.message}`);
  }
}, { priority: 50, blocking: true });
```

### 재시도 패턴

지수 백오프를 통한 자동 재시도:

```typescript
const createRetryHandler = <T>(
  handler: (payload: T, controller: PipelineController<T>) => Promise<void>,
  maxRetries = 3,
  baseDelay = 1000
) => async (payload: T, controller: PipelineController<T>) => {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      await handler(payload, controller);
      return; // 성공
    } catch (error) {
      attempt++;
      
      if (attempt > maxRetries) {
        controller.abort(`${maxRetries}번 재시도 후 실패: ${error.message}`);
        return;
      }
      
      // 지수 백오프
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

useActionHandler('sendEmail', createRetryHandler(async (emailData, controller) => {
  await emailService.send(emailData);
  controller.next();
}, 3, 1000), { priority: 50 });
```

## 성능 고려사항

### 핸들러 등록

- 컴포넌트 마운트 시 한 번만 핸들러 등록
- 재등록을 방지하기 위해 핸들러 함수에 `useCallback` 사용
- 컴포넌트 언마운트 시 핸들러 정리 (`useActionHandler`에서 자동)

```typescript
function MyComponent() {
  // ✅ 좋음: 안정적인 핸들러 참조
  const handleUserAction = useCallback((userData) => {
    processUserData(userData);
  }, []);
  
  useActionHandler('userAction', handleUserAction);
  
  // ❌ 피하기: 매 렌더링마다 핸들러 재등록
  useActionHandler('userAction', (userData) => {
    processUserData(userData);
  });
}
```

### 메모리 관리

- 핸들러를 적절히 정리하여 메모리 누수 방지
- 클로저의 큰 객체에 대해 약한 참조 사용
- 장시간 실행되는 작업에 대한 정리 로직 구현

```typescript
function DataProcessor() {
  const processDataRef = useRef<AbortController>();
  
  useActionHandler('processLargeDataset', async (dataset, controller) => {
    // 이 작업을 위한 중단 컨트롤러 생성
    const abortController = new AbortController();
    processDataRef.current = abortController;
    
    try {
      await processInChunks(dataset, {
        signal: abortController.signal,
        onProgress: (progress) => {
          controller.modifyPayload(payload => ({
            ...payload,
            progress
          }));
        }
      });
      
      controller.next();
    } catch (error) {
      if (error.name !== 'AbortError') {
        controller.abort(error.message);
      }
    }
  });
  
  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      processDataRef.current?.abort();
    };
  }, []);
}
```

## 오류 처리 전략

### 전역 오류 경계

```typescript
function ErrorBoundaryHandler() {
  useActionHandler('*', (payload, controller) => {
    // 모든 액션에 대해 캐치올로 실행
    const originalNext = controller.next;
    const originalAbort = controller.abort;
    
    controller.next = () => {
      try {
        originalNext();
      } catch (error) {
        console.error('파이프라인 오류:', error);
        errorReporting.captureException(error);
        controller.abort(`예상치 못한 오류: ${error.message}`);
      }
    };
  }, { priority: Number.MAX_SAFE_INTEGER });
}
```

### 액션별 오류 처리

```typescript
useActionHandler('criticalOperation', async (payload, controller) => {
  try {
    await performCriticalTask(payload);
    controller.next();
  } catch (error) {
    // 오류 로깅
    logger.error('중요한 작업 실패', { payload, error });
    
    // 오류 추적 서비스로 전송
    errorTracker.captureException(error, {
      context: 'criticalOperation',
      payload
    });
    
    // 복구 시도
    try {
      await rollbackChanges(payload);
      controller.abort('작업은 실패했지만 롤백에 성공했습니다');
    } catch (rollbackError) {
      controller.abort('작업과 롤백 모두 실패했습니다');
    }
  }
});
```

## 파이프라인 동작 테스트

### 핸들러 단위 테스트

```typescript
import { ActionRegister } from '@context-action/core';

describe('사용자 등록 파이프라인', () => {
  let actionRegister: ActionRegister<UserActions>;
  
  beforeEach(() => {
    actionRegister = new ActionRegister<UserActions>();
  });
  
  it('저장하기 전에 사용자 데이터를 검증해야 합니다', async () => {
    const mockSave = jest.fn();
    let validationRan = false;
    
    // 검증 핸들러 등록
    actionRegister.register('registerUser', (userData, controller) => {
      validationRan = true;
      if (!userData.email) {
        controller.abort('이메일이 필요합니다');
        return;
      }
      controller.next();
    }, { priority: 100 });
    
    // 저장 핸들러 등록
    actionRegister.register('registerUser', mockSave, { priority: 50 });
    
    // 잘못된 데이터 테스트
    await actionRegister.dispatch('registerUser', { 
      email: '', 
      password: 'test123' 
    });
    
    expect(validationRan).toBe(true);
    expect(mockSave).not.toHaveBeenCalled();
  });
});
```

## 모범 사례

1. **핸들러를 집중적으로 유지**: 각 핸들러는 단일 책임을 가져야 합니다
2. **적절한 우선순위 사용**: 검증과 중요한 작업에는 높은 우선순위를 예약하세요
3. **오류를 우아하게 처리**: 항상 의미 있는 오류 메시지를 제공하세요
4. **부작용 최소화**: 가능한 경우 순수 함수를 선호하세요
5. **복잡한 파이프라인 문서화**: 핸들러 관계를 설명하기 위해 주석을 사용하세요
6. **철저한 테스트**: 개별 핸들러와 완전한 파이프라인 모두를 테스트하세요
7. **성능 모니터링**: 프로덕션에서 파이프라인 실행을 프로파일링하세요
8. **TypeScript 사용**: 페이로드 검증을 위해 타입 안전성을 활용하세요

## 다음 단계

- [핸들러 설정](/ko/guide/handler-configuration) 옵션에 대해 알아보기
- [고급 사용법](/ko/guide/advanced) 패턴 탐색하기
- 실제 구현을 위한 [예제](/ko/examples/) 확인하기
- 자세한 문서를 위한 [API 레퍼런스](/ko/api/) 찾아보기