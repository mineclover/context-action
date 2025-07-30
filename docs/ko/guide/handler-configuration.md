# 핸들러 설정

핸들러 설정을 통해 실행 우선순위, 비동기 동작, 식별 등을 포함하여 파이프라인 내에서 액션 핸들러의 동작 방식을 제어할 수 있습니다.

## 설정 옵션

`HandlerConfig` 인터페이스는 핸들러 동작을 사용자 정의하기 위한 여러 옵션을 제공합니다:

```typescript
interface HandlerConfig {
  /** 우선순위 레벨 (높은 숫자가 먼저 실행됨). 기본값: 0 */
  priority?: number;
  
  /** 핸들러의 고유 식별자. 제공되지 않으면 자동 생성됨 */
  id?: string;
  
  /** 비동기 핸들러 완료를 기다릴지 여부. 기본값: false */
  blocking?: boolean;
}
```

## 우선순위 시스템

### 우선순위 이해하기

핸들러는 **내림차순 우선순위 순서**로 실행됩니다 (높은 것부터 낮은 것 순). 이를 통해 액션 파이프라인에서 작업 순서를 제어할 수 있습니다.

```typescript
// 이 핸들러들은 다음 순서로 실행됩니다:
useActionHandler('saveData', validateData, { priority: 100 }); // 1번째
useActionHandler('saveData', transformData, { priority: 50 });  // 2번째  
useActionHandler('saveData', persistData, { priority: 25 });    // 3번째
useActionHandler('saveData', logAction);                        // 4번째 (기본 우선순위: 0)
useActionHandler('saveData', sendNotification, { priority: -10 }); // 5번째
```

### 우선순위 모범 사례

#### 일반적인 우선순위 범위

- **1000+**: 전역 미들웨어, 로깅, 모니터링
- **900-999**: 인증, 권한 부여
- **800-899**: 입력 검증, 정제  
- **700-799**: 속도 제한, 보안 검사
- **100-699**: 비즈니스 로직 (높을수록 중요)
- **50-99**: 데이터 지속성, 외부 API 호출
- **1-49**: 알림, 분석, 정리
- **0**: 표준 작업의 기본 우선순위
- **음수**: 백그라운드 작업, 선택적 작업

```typescript
interface UserActions extends ActionPayloadMap {
  createUser: { email: string; password: string; name: string };
}

// 전역 요청 로깅 (최고 우선순위)
useActionHandler('createUser', (userData) => {
  logger.info('사용자 생성 시작', { email: userData.email });
}, { priority: 1000 });

// 인증 확인
useActionHandler('createUser', (userData, controller) => {
  if (!isAuthenticated()) {
    controller.abort('인증이 필요합니다');
    return;
  }
  controller.next();
}, { priority: 900 });

// 입력 검증
useActionHandler('createUser', (userData, controller) => {
  const errors = validateUserData(userData);
  if (errors.length > 0) {
    controller.abort(`검증 실패: ${errors.join(', ')}`);
    return;
  }
  controller.next();
}, { priority: 800 });

// 속도 제한
useActionHandler('createUser', async (userData, controller) => {
  const allowed = await rateLimiter.check(userData.email);
  if (!allowed) {
    controller.abort('속도 제한 초과');
    return;
  }
  controller.next();
}, { priority: 700 });

// 핵심 비즈니스 로직
useActionHandler('createUser', async (userData, controller) => {
  const user = await userService.createUser(userData);
  controller.modifyPayload(payload => ({
    ...payload,
    userId: user.id,
    createdAt: user.createdAt
  }));
  controller.next();
}, { priority: 200, blocking: true });

// 환영 이메일 발송 (낮은 우선순위)
useActionHandler('createUser', async (userData) => {
  await emailService.sendWelcomeEmail(userData.email, userData.name);
}, { priority: 50 });

// 분석 추적 (가장 낮은 우선순위)
useActionHandler('createUser', (userData) => {
  analytics.track('user_created', {
    email: userData.email,
    timestamp: userData.createdAt
  });
}, { priority: 10 });
```

### 동적 우선순위

조건에 따라 우선순위를 동적으로 계산할 수 있습니다:

```typescript
function getHandlerPriority(userRole: string): number {
  switch (userRole) {
    case 'admin': return 100;
    case 'moderator': return 50;
    case 'user': return 25;
    default: return 0;
  }
}

function UserRoleHandler({ userRole }: { userRole: string }) {
  useActionHandler('performAction', (payload) => {
    // 사용자 역할에 따른 처리
    console.log(`${userRole}에 의해 수행된 액션`);
  }, { 
    priority: getHandlerPriority(userRole),
    id: `role-handler-${userRole}`
  });
  
  return null;
}
```

## 핸들러 식별

### 자동 ID 생성

기본적으로 핸들러는 중복 등록을 방지하기 위해 자동 생성된 ID를 받습니다:

```typescript
useActionHandler('myAction', handleMyAction); 
// 자동 생성된 ID: "handler_1640995200000_0.123456789"
```

### 사용자 정의 ID

더 나은 제어와 디버깅을 위해 사용자 정의 ID를 제공하세요:

```typescript
useActionHandler('saveUser', validateUser, { 
  id: 'user-validator',
  priority: 100 
});

useActionHandler('saveUser', persistUser, { 
  id: 'user-persister',
  priority: 50 
});

useActionHandler('saveUser', notifyUser, { 
  id: 'user-notifier',
  priority: 10 
});
```

### 사용자 정의 ID의 장점

- **디버깅**: 로그와 디버깅 도구에서 핸들러를 쉽게 식별
- **교체**: 같은 ID로 등록하여 특정 핸들러 교체
- **조건부 로직**: 설정에 따라 특정 핸들러 활성화/비활성화

```typescript
// 조건부로 핸들러 교체
function UserHandlers({ enableEmailNotifications }: { enableEmailNotifications: boolean }) {
  // 핵심 사용자 생성 (항상 존재)
  useActionHandler('createUser', createUserInDatabase, {
    id: 'create-user-db',
    priority: 100
  });
  
  // 조건부 이메일 알림
  useActionHandler('createUser', enableEmailNotifications 
    ? sendWelcomeEmail 
    : () => console.log('이메일 알림이 비활성화됨'), {
    id: 'create-user-email',
    priority: 50
  });
  
  return null;
}
```

## 블로킹 vs 논-블로킹 핸들러

### 블로킹 핸들러 (`blocking: true`)

다음 핸들러로 진행하기 전에 비동기 핸들러가 완료될 때까지 기다립니다:

```typescript
useActionHandler('processOrder', async (order, controller) => {
  // 재고 예약 전에 결제가 완료되어야 함
  const paymentResult = await paymentService.charge(order);
  
  if (!paymentResult.success) {
    controller.abort('결제 실패');
    return;
  }
  
  controller.modifyPayload(payload => ({
    ...payload,
    paymentId: paymentResult.id
  }));
  
  controller.next();
}, { blocking: true, priority: 100 });

useActionHandler('processOrder', async (order) => {
  // 결제가 성공한 후에만 실행됩니다
  await inventoryService.reserve(order.items);
}, { blocking: true, priority: 50 });
```

### 논-블로킹 핸들러 (`blocking: false`)

완료를 기다리지 않고 동시에 실행됩니다:

```typescript
useActionHandler('userLogin', async (loginData) => {
  // 이들은 모두 병렬로 실행됩니다
  analytics.track('login', loginData);
}, { blocking: false });

useActionHandler('userLogin', async (loginData) => {
  await auditLogger.log('user_login', loginData);
}, { blocking: false });

useActionHandler('userLogin', async (loginData) => {
  await updateLastSeenTimestamp(loginData.userId);
}, { blocking: false });
```

### 혼합 블로킹 모드

블로킹과 논-블로킹 핸들러를 전략적으로 결합:

```typescript
// 중요한 검증 (블로킹)
useActionHandler('submitForm', async (formData, controller) => {
  const isValid = await validateFormData(formData);
  if (!isValid) {
    controller.abort('폼 검증 실패');
    return;
  }
  controller.next();
}, { blocking: true, priority: 100 });

// 데이터 지속성 (블로킹)
useActionHandler('submitForm', async (formData, controller) => {
  const result = await database.save(formData);
  controller.modifyPayload(payload => ({
    ...payload,
    recordId: result.id
  }));
  controller.next();
}, { blocking: true, priority: 50 });

// 분석 (논-블로킹)
useActionHandler('submitForm', async (formData) => {
  analytics.track('form_submitted', formData);
}, { blocking: false, priority: 10 });

// 이메일 알림 (논-블로킹)
useActionHandler('submitForm', async (formData) => {
  await emailService.sendConfirmation(formData.email);
}, { blocking: false, priority: 10 });
```

## 고급 설정 패턴

### 조건부 핸들러 등록

런타임 조건에 따라 핸들러 등록:

```typescript
function ConditionalHandlers({ feature }: { feature: string }) {
  // 항상 핵심 핸들러 등록
  useActionHandler('processData', coreDataProcessor, {
    id: 'core-processor',
    priority: 100
  });
  
  // 기능별로 조건부 핸들러 등록
  if (feature === 'analytics') {
    useActionHandler('processData', analyticsProcessor, {
      id: 'analytics-processor',
      priority: 50
    });
  }
  
  if (feature === 'monitoring') {
    useActionHandler('processData', monitoringProcessor, {
      id: 'monitoring-processor', 
      priority: 75
    });
  }
  
  return null;
}
```

### 환경 기반 설정

다른 환경에 대한 다른 설정:

```typescript
const getHandlerConfig = (env: string): HandlerConfig => {
  const baseConfig = { priority: 50 };
  
  switch (env) {
    case 'development':
      return { ...baseConfig, id: 'dev-handler' };
    case 'staging':
      return { ...baseConfig, id: 'staging-handler', blocking: true };
    case 'production':
      return { ...baseConfig, id: 'prod-handler', blocking: true, priority: 100 };
    default:
      return baseConfig;
  }
};

function EnvironmentHandlers() {
  const config = getHandlerConfig(process.env.NODE_ENV);
  
  useActionHandler('apiCall', apiHandler, config);
  
  return null;
}
```

### 핸들러 팩토리 패턴

재사용 가능한 핸들러 설정 생성:

```typescript
interface HandlerFactoryOptions {
  retries?: number;
  timeout?: number;
  priority?: number;
  blocking?: boolean;
}

const createApiHandler = (
  endpoint: string, 
  options: HandlerFactoryOptions = {}
) => {
  const { retries = 3, timeout = 5000, priority = 50, blocking = true } = options;
  
  return {
    handler: async (payload: any, controller: PipelineController) => {
      let attempt = 0;
      
      while (attempt <= retries) {
        try {
          const result = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(timeout)
          });
          
          const data = await result.json();
          controller.modifyPayload(payload => ({ ...payload, response: data }));
          controller.next();
          return;
        } catch (error) {
          attempt++;
          if (attempt > retries) {
            controller.abort(`${retries}번 재시도 후 API 호출 실패`);
            return;
          }
          
          // 지수 백오프
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    },
    config: {
      id: `api-handler-${endpoint.replace(/\W/g, '-')}`,
      priority,
      blocking
    }
  };
};

// 사용법
function ApiHandlers() {
  const userHandler = createApiHandler('/api/users', { 
    priority: 100, 
    retries: 5 
  });
  
  const notificationHandler = createApiHandler('/api/notifications', { 
    priority: 10, 
    blocking: false 
  });
  
  useActionHandler('createUser', userHandler.handler, userHandler.config);
  useActionHandler('createUser', notificationHandler.handler, notificationHandler.config);
  
  return null;
}
```

## 성능 최적화

### 핸들러 메모이제이션

불필요한 재등록 방지:

```typescript
function OptimizedHandlers({ userId, settings }) {
  // 핸들러 함수 메모이제이션
  const handleUserAction = useCallback((payload) => {
    processUserAction(payload, userId, settings);
  }, [userId, settings]);
  
  // 설정 객체 메모이제이션
  const handlerConfig = useMemo(() => ({
    id: `user-handler-${userId}`,
    priority: settings.priority || 50,
    blocking: settings.blocking || false
  }), [userId, settings.priority, settings.blocking]);
  
  useActionHandler('userAction', handleUserAction, handlerConfig);
  
  return null;
}
```

### 지연 핸들러 등록

필요할 때만 핸들러 등록:

```typescript
function LazyHandlers({ shouldRegister }: { shouldRegister: boolean }) {
  const handlerConfig = useMemo(() => ({
    id: 'expensive-handler',
    priority: 100,
    blocking: true
  }), []);
  
  // 필요할 때만 등록
  useActionHandler(
    'expensiveOperation',
    shouldRegister ? expensiveHandler : undefined,
    handlerConfig
  );
  
  return null;
}
```

## 핸들러 설정 테스트

### 우선순위 순서 테스트

```typescript
describe('핸들러 우선순위', () => {
  it('우선순위 순서대로 핸들러를 실행해야 합니다', async () => {
    const actionRegister = new ActionRegister<TestActions>();
    const executionOrder: string[] = [];
    
    actionRegister.register('test', () => {
      executionOrder.push('low');
    }, { priority: 10 });
    
    actionRegister.register('test', () => {
      executionOrder.push('high');
    }, { priority: 100 });
    
    actionRegister.register('test', () => {
      executionOrder.push('medium');
    }, { priority: 50 });
    
    await actionRegister.dispatch('test');
    
    expect(executionOrder).toEqual(['high', 'medium', 'low']);
  });
});
```

### 블로킹 동작 테스트

```typescript
describe('블로킹 핸들러', () => {
  it('블로킹 핸들러를 기다려야 합니다', async () => {
    const actionRegister = new ActionRegister<TestActions>();
    const events: string[] = [];
    
    actionRegister.register('test', async () => {
      events.push('blocking-start');
      await new Promise(resolve => setTimeout(resolve, 100));
      events.push('blocking-end');
    }, { blocking: true, priority: 100 });
    
    actionRegister.register('test', () => {
      events.push('non-blocking');
    }, { priority: 50 });
    
    await actionRegister.dispatch('test');
    
    expect(events).toEqual(['blocking-start', 'blocking-end', 'non-blocking']);
  });
});
```

## 설정 모범 사례

1. **의미 있는 우선순위 사용**: 도메인에서 의미가 있는 우선순위 값 선택
2. **우선순위 범위 문서화**: 우선순위 값에 대한 팀 규칙 수립
3. **사용자 정의 ID 선호**: 디버깅을 위해 의미 있는 ID 사용
4. **블로킹을 현명하게 선택**: 순차적으로 완료되어야 하는 작업에만 블로킹 사용
5. **설정 테스트**: 우선순위 순서와 블로킹 동작에 대한 테스트 작성
6. **성능 모니터링**: 프로덕션에서 핸들러 실행 프로파일링
7. **설정을 단순하게 유지**: 지나치게 복잡한 설정 로직 피하기
8. **팩토리 사용**: 재사용 가능한 설정 패턴 생성

## 일반적인 함정

### 우선순위 간격

```typescript
// ❌ 우선순위 공간을 낭비하는 큰 간격 피하기
useActionHandler('action', handler1, { priority: 1000 });
useActionHandler('action', handler2, { priority: 10 });

// ✅ 향후 삽입을 위한 합리적인 간격 사용
useActionHandler('action', handler1, { priority: 100 });
useActionHandler('action', handler2, { priority: 50 });
```

### 블로킹 남용

```typescript
// ❌ 모든 것을 블로킹으로 만들지 마세요
useActionHandler('logEvent', async () => {
  await analytics.track(event);
}, { blocking: true }); // 불필요한 블로킹

// ✅ 순서가 중요할 때만 블로킹 사용
useActionHandler('processPayment', async () => {
  await paymentService.charge();
}, { blocking: true }); // 결제는 먼저 완료되어야 함
```

### 설정 객체 재생성

```typescript
// ❌ 매 렌더링마다 새로운 설정 객체 생성
useActionHandler('action', handler, { 
  priority: someProp,
  blocking: otherProp
});

// ✅ 설정 객체 메모이제이션
const config = useMemo(() => ({
  priority: someProp,
  blocking: otherProp
}), [someProp, otherProp]);

useActionHandler('action', handler, config);
```

## 다음 단계

- [액션 파이프라인](/ko/guide/action-pipeline) 개념에 대해 알아보기
- [고급 사용법](/ko/guide/advanced) 패턴 탐색하기
- 실제 설정을 위한 [예제](/ko/examples/) 확인하기
- 자세한 문서를 위한 [API 레퍼런스](/ko/api/) 찾아보기