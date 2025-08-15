# 파이프라인 컨트롤러 API

고급 파이프라인 제어를 위해 액션 핸들러에 전달되는 파이프라인 컨트롤러 객체의 완전한 API 레퍼런스입니다.

## 개요

파이프라인 컨트롤러는 액션 핸들러 내에서 고급 제어 플로우 기능을 제공합니다. 핸들러가 페이로드를 수정하고, 결과를 공유하며, 실행 플로우를 제어하고, 파이프라인의 다른 핸들러와 협업할 수 있게 해줍니다.

## 핵심 제어 메서드

### `controller.abort(reason, error?)`

전체 액션 파이프라인 실행을 중단합니다.

**매개변수:**
- `reason`: 중단하는 이유 (사람이 읽을 수 있는 형태)
- `error?`: 선택적 에러 객체

**동작:** 나머지 모든 핸들러를 중지하고 PipelineAbortError를 던집니다.

```typescript
useActionHandler('validateInput', (payload, controller) => {
  if (!payload.email || !payload.email.includes('@')) {
    controller.abort('유효한 이메일이 필요합니다');
    return;
  }
  
  if (payload.age < 18) {
    controller.abort('사용자는 18세 이상이어야 합니다', new ValidationError('나이 요구사항'));
    return;
  }
  
  return { valid: true };
});
```

### `controller.skip(reason?)`

다른 핸들러에 영향을 주지 않고 현재 핸들러를 건너뜁니다.

**매개변수:**
- `reason?`: 건너뛰는 이유 (선택적)

**반환값:** 특별한 건너뛰기 결과

```typescript
useActionHandler('premiumFeature', (payload, controller) => {
  if (!payload.user.isPremium) {
    return controller.skip('사용자가 프리미엄이 아닙니다');
  }
  
  // 프리미엄 기능 로직
  return { featureExecuted: true };
});
```

## 페이로드 관리

### `controller.getPayload()`

현재 (수정될 수 있는) 페이로드를 가져옵니다.

**반환값:** 현재 페이로드 객체

```typescript
useActionHandler('logAction', (_, controller) => {
  const currentPayload = controller.getPayload();
  
  console.log('사용된 최종 페이로드:', currentPayload);
  auditLogger.log('action_payload', currentPayload);
  
  return { logged: true };
}, { priority: 1 }); // 마지막에 실행되도록 낮은 우선순위
```

### `controller.modifyPayload(modifier)`

후속 핸들러를 위해 페이로드를 수정합니다.

**매개변수:**
- `modifier`: 현재 페이로드를 받아 수정된 페이로드를 반환하는 함수

```typescript
useActionHandler('enrichPayload', (payload, controller) => {
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId: getCurrentUserId(),
    userAgent: navigator.userAgent,
    source: 'web-app'
  }));
  
  return { enriched: true };
}, { priority: 95 }); // 일찍 실행되도록 높은 우선순위
```

### `controller.setPayloadProperty(key, value)`

페이로드의 특정 속성을 설정합니다.

**매개변수:**
- `key`: 설정할 속성 키
- `value`: 할당할 값

```typescript
useActionHandler('addMetadata', (payload, controller) => {
  controller.setPayloadProperty('requestId', generateRequestId());
  controller.setPayloadProperty('timestamp', Date.now());
  
  return { metadataAdded: true };
});
```

## 결과 관리

### `controller.setResult(result)`

나중 핸들러에서 액세스할 수 있는 결과를 설정합니다.

**매개변수:**
- `result`: 저장할 결과 객체

```typescript
useActionHandler('processPayment', async (payload, controller) => {
  try {
    const transaction = await paymentService.charge({
      amount: payload.amount,
      source: payload.paymentMethod
    });
    
    controller.setResult({
      step: 'payment',
      transactionId: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      success: true,
      provider: 'stripe'
    });
    
    return { success: true, transactionId: transaction.id };
    
  } catch (error) {
    controller.setResult({
      step: 'payment',
      success: false,
      error: error.message,
      provider: 'stripe'
    });
    
    controller.abort(`결제 실패: ${error.message}`);
  }
}, { priority: 90, id: 'payment-processor' });
```

### `controller.getResults()`

이전 핸들러들이 설정한 모든 결과를 가져옵니다.

**반환값:** 결과 객체 배열

```typescript
useActionHandler('sendConfirmation', async (payload, controller) => {
  const results = controller.getResults();
  const paymentResult = results.find(r => r.step === 'payment');
  const userResult = results.find(r => r.step === 'user-update');
  
  if (paymentResult?.success && userResult?.success) {
    await emailService.sendConfirmation({
      email: payload.email,
      transactionId: paymentResult.transactionId,
      userId: userResult.userId
    });
    
    return { confirmationSent: true };
  }
  
  return { confirmationSent: false, reason: '전제 조건이 충족되지 않음' };
}, { priority: 70, id: 'confirmation-sender' });
```

### `controller.getResult(predicate)`

조건 함수를 사용하여 특정 결과를 가져옵니다.

**매개변수:**
- `predicate`: 원하는 결과를 찾는 함수

**반환값:** 일치하는 결과 또는 undefined

```typescript
useActionHandler('processRefund', async (payload, controller) => {
  const paymentResult = controller.getResult(r => 
    r.step === 'payment' && r.provider === 'stripe'
  );
  
  if (paymentResult?.transactionId) {
    const refund = await stripeService.refund(paymentResult.transactionId);
    return { refunded: true, refundId: refund.id };
  }
  
  controller.abort('환불을 위한 유효한 결제를 찾을 수 없습니다');
}, { priority: 80 });
```

## 파이프라인 상태 관리

### `controller.setPipelineState(key, value)`

핸들러 간에 지속되는 파이프라인 레벨 상태를 설정합니다.

**매개변수:**
- `key`: 상태 키
- `value`: 상태 값

```typescript
useActionHandler('initializeSession', (payload, controller) => {
  const sessionId = generateSessionId();
  const userId = payload.userId;
  
  controller.setPipelineState('sessionId', sessionId);
  controller.setPipelineState('userId', userId);
  controller.setPipelineState('startTime', Date.now());
  
  return { sessionInitialized: true, sessionId };
}, { priority: 100 });
```

### `controller.getPipelineState(key)`

파이프라인 레벨 상태를 가져옵니다.

**매개변수:**
- `key`: 가져올 상태 키

**반환값:** 상태 값 또는 undefined

```typescript
useActionHandler('trackDuration', (payload, controller) => {
  const startTime = controller.getPipelineState('startTime');
  const duration = Date.now() - (startTime || Date.now());
  
  controller.setResult({
    step: 'duration-tracking',
    duration,
    startTime
  });
  
  return { durationTracked: true, duration };
}, { priority: 10 }); // 마지막에 실행되도록 낮은 우선순위
```

### `controller.getAllPipelineState()`

모든 파이프라인 상태를 가져옵니다.

**반환값:** 모든 파이프라인 상태를 포함한 객체

```typescript
useActionHandler('pipelineSummary', (payload, controller) => {
  const allState = controller.getAllPipelineState();
  const allResults = controller.getResults();
  
  const summary = {
    pipelineState: allState,
    handlerResults: allResults,
    finalPayload: controller.getPayload(),
    executionSummary: {
      totalHandlers: allResults.length,
      successfulHandlers: allResults.filter(r => !r.error).length,
      duration: Date.now() - (allState.startTime || Date.now())
    }
  };
  
  console.log('파이프라인 실행 요약:', summary);
  return summary;
}, { priority: 5 }); // 마지막에 실행되도록 매우 낮은 우선순위
```

## 고급 파이프라인 패턴

### 다단계 처리

```typescript
function MultiStageProcessor() {
  // 1단계: 입력 처리
  useActionHandler('processOrder', (payload, controller) => {
    const processedPayload = {
      ...payload,
      orderId: generateOrderId(),
      processedAt: Date.now()
    };
    
    controller.modifyPayload(() => processedPayload);
    controller.setPipelineState('stage', 'input-processed');
    
    return { stage: 'input', success: true };
  }, { priority: 100, id: 'input-processor' });
  
  // 2단계: 검증
  useActionHandler('processOrder', (payload, controller) => {
    const validationResult = validateOrder(payload);
    
    if (!validationResult.valid) {
      controller.abort(`검증 실패: ${validationResult.errors.join(', ')}`);
    }
    
    controller.setPipelineState('stage', 'validated');
    controller.setResult({
      step: 'validation',
      valid: true,
      checks: validationResult.checks
    });
    
    return { stage: 'validation', success: true };
  }, { priority: 90, id: 'validator' });
  
  // 3단계: 비즈니스 로직
  useActionHandler('processOrder', async (payload, controller) => {
    const stage = controller.getPipelineState('stage');
    
    if (stage !== 'validated') {
      controller.abort('주문이 제대로 검증되지 않음');
    }
    
    const orderResult = await orderService.createOrder(payload);
    
    controller.setResult({
      step: 'order-creation',
      orderId: orderResult.id,
      amount: orderResult.amount,
      success: true
    });
    
    controller.setPipelineState('stage', 'completed');
    return orderResult;
  }, { priority: 80, id: 'order-processor' });
  
  return null;
}
```

### 조건부 파이프라인 분기

```typescript
function ConditionalBranching() {
  // 페이로드에 따라 다른 핸들러로 라우팅
  useActionHandler('processPayment', (payload, controller) => {
    controller.setPipelineState('paymentMethod', payload.method);
    
    if (payload.method === 'credit_card') {
      controller.setPipelineState('processor', 'stripe');
    } else if (payload.method === 'paypal') {
      controller.setPipelineState('processor', 'paypal');
    } else {
      controller.abort(`지원되지 않는 결제 방법: ${payload.method}`);
    }
    
    return { routed: true, processor: controller.getPipelineState('processor') };
  }, { priority: 100, id: 'payment-router' });
  
  // Stripe 핸들러 (조건부)
  useActionHandler('processPayment', async (payload, controller) => {
    const processor = controller.getPipelineState('processor');
    
    if (processor !== 'stripe') {
      return controller.skip('Stripe 결제가 아닙니다');
    }
    
    const result = await stripeService.charge(payload);
    controller.setResult({ processor: 'stripe', ...result });
    
    return result;
  }, { priority: 80, id: 'stripe-processor' });
  
  // PayPal 핸들러 (조건부)
  useActionHandler('processPayment', async (payload, controller) => {
    const processor = controller.getPipelineState('processor');
    
    if (processor !== 'paypal') {
      return controller.skip('PayPal 결제가 아닙니다');
    }
    
    const result = await paypalService.charge(payload);
    controller.setResult({ processor: 'paypal', ...result });
    
    return result;
  }, { priority: 80, id: 'paypal-processor' });
  
  return null;
}
```

## 컨트롤러 상태 검사

### `controller.getExecutionContext()`

현재 실행 컨텍스트에 대한 정보를 가져옵니다.

**반환값:** 실행 컨텍스트 객체

```typescript
useActionHandler('debugHandler', (payload, controller) => {
  const context = controller.getExecutionContext();
  
  console.log('실행 컨텍스트:', {
    actionName: context.actionName,
    handlerId: context.currentHandlerId,
    executionId: context.executionId,
    startTime: context.startTime,
    remainingHandlers: context.remainingHandlers
  });
  
  return { debugInfo: context };
});
```

### `controller.getHandlerInfo()`

현재 핸들러에 대한 정보를 가져옵니다.

**반환값:** 핸들러 정보 객체

```typescript
useActionHandler('selfAwareHandler', (payload, controller) => {
  const handlerInfo = controller.getHandlerInfo();
  
  console.log('현재 핸들러:', {
    id: handlerInfo.id,
    priority: handlerInfo.priority,
    registeredAt: handlerInfo.registeredAt,
    executionCount: handlerInfo.executionCount
  });
  
  return handlerInfo;
}, { id: 'self-aware', priority: 50 });
```

## 에러 처리

### 파이프라인 에러 복구

```typescript
function ErrorRecoveryHandler() {
  useActionHandler('riskyOperation', async (payload, controller) => {
    try {
      const result = await riskyService.performOperation(payload);
      
      controller.setResult({
        step: 'risky-operation',
        success: true,
        data: result
      });
      
      return result;
      
    } catch (error) {
      // 에러 로그는 남기지만 중단하지 않음 - 복구 핸들러가 시도하도록 함
      controller.setResult({
        step: 'risky-operation',
        success: false,
        error: error.message,
        needsRecovery: true
      });
      
      return { error: error.message, recovered: false };
    }
  }, { priority: 90, id: 'risky-handler' });
  
  // 복구 핸들러
  useActionHandler('riskyOperation', async (payload, controller) => {
    const results = controller.getResults();
    const needsRecovery = results.some(r => r.needsRecovery);
    
    if (needsRecovery) {
      try {
        const result = await fallbackService.performOperation(payload);
        
        controller.setResult({
          step: 'recovery',
          success: true,
          data: result,
          recoveredFrom: 'risky-operation'
        });
        
        return { recovered: true, data: result };
        
      } catch (error) {
        controller.abort(`복구 실패: ${error.message}`);
      }
    }
    
    return controller.skip('복구가 필요하지 않음');
  }, { priority: 80, id: 'recovery-handler' });
  
  return null;
}
```

## 고급 파이프라인 제어

### 동적 핸들러 실행

```typescript
function DynamicHandler() {
  useActionHandler('dynamicAction', async (payload, controller) => {
    // 결과에 따라 실행 수정
    const results = controller.getResults();
    const hasValidation = results.some(r => r.step === 'validation');
    
    if (!hasValidation) {
      // 동적으로 검증 트리거
      controller.modifyPayload(current => ({
        ...current,
        needsValidation: true
      }));
      
      // 다음 핸들러에서 검증을 트리거하도록 상태 설정
      controller.setPipelineState('requireValidation', true);
    }
    
    return { dynamicExecutionApplied: true };
  }, { priority: 85 });
  
  // 조건부 검증 핸들러
  useActionHandler('dynamicAction', (payload, controller) => {
    const needsValidation = controller.getPipelineState('requireValidation');
    
    if (needsValidation) {
      const isValid = performValidation(payload);
      
      if (!isValid) {
        controller.abort('동적 검증 실패');
      }
      
      controller.setResult({ step: 'validation', success: true });
      return { validated: true };
    }
    
    return controller.skip('검증이 필요하지 않음');
  }, { priority: 80, id: 'dynamic-validator' });
  
  return null;
}
```

### 파이프라인 조정

```typescript
function PipelineCoordinator() {
  // 조정자 핸들러
  useActionHandler('complexWorkflow', async (payload, controller) => {
    // 모든 전제 조건이 충족되었는지 확인
    const results = controller.getResults();
    const hasAuth = results.some(r => r.step === 'authentication' && r.success);
    const hasValidation = results.some(r => r.step === 'validation' && r.success);
    const hasPermission = results.some(r => r.step === 'permission' && r.success);
    
    if (!hasAuth || !hasValidation || !hasPermission) {
      const missing = [];
      if (!hasAuth) missing.push('authentication');
      if (!hasValidation) missing.push('validation');
      if (!hasPermission) missing.push('permission');
      
      controller.abort(`누락된 전제 조건: ${missing.join(', ')}`);
      return;
    }
    
    // 모든 전제 조건이 충족됨, 주 작업 진행
    const mainResult = await performMainOperation(payload);
    
    controller.setResult({
      step: 'main-operation',
      success: true,
      data: mainResult,
      prerequisites: { hasAuth, hasValidation, hasPermission }
    });
    
    return mainResult;
    
  }, { priority: 50, id: 'workflow-coordinator' });
  
  return null;
}
```

## 컨트롤러 설정

### `controller.setTimeout(timeout)`

현재 핸들러 실행에 대한 타임아웃을 설정합니다.

**매개변수:**
- `timeout`: 밀리초 단위 타임아웃

```typescript
useActionHandler('longRunningTask', async (payload, controller) => {
  controller.setTimeout(30000); // 30초 타임아웃
  
  try {
    const result = await longRunningService.process(payload);
    return { success: true, data: result };
  } catch (error) {
    if (error.name === 'TimeoutError') {
      controller.abort('30초 후 작업 타임아웃');
    } else {
      controller.abort(`작업 실패: ${error.message}`);
    }
  }
});
```

### `controller.setMetadata(metadata)`

현재 실행에 대한 메타데이터를 설정합니다.

**매개변수:**
- `metadata`: 메타데이터 객체

```typescript
useActionHandler('trackedAction', (payload, controller) => {
  controller.setMetadata({
    handlerVersion: '1.2.0',
    environment: process.env.NODE_ENV,
    component: 'UserManager',
    feature: 'profile-update'
  });
  
  // 비즈니스 로직
  return { success: true };
}, { id: 'tracked-handler' });
```

## 파이프라인 디버깅

### `controller.enableDebug()`

현재 파이프라인에 대한 디버그 로깅을 활성화합니다.

```typescript
useActionHandler('debuggableAction', (payload, controller) => {
  if (process.env.NODE_ENV === 'development') {
    controller.enableDebug();
  }
  
  controller.setResult({ step: 'debug-setup', enabled: true });
  return { debugEnabled: true };
}, { priority: 100 });
```

### `controller.log(message, data?)`

파이프라인 실행 중에 디버그 정보를 로그합니다.

**매개변수:**
- `message`: 로그 메시지
- `data?`: 로그할 선택적 데이터

```typescript
useActionHandler('verboseHandler', async (payload, controller) => {
  controller.log('사용자 검증 시작');
  
  const user = await userService.getUser(payload.userId);
  controller.log('사용자 조회됨', { userId: user.id, name: user.name });
  
  const isValid = validateUser(user);
  controller.log('검증 완료', { isValid });
  
  if (!isValid) {
    controller.log('검증 실패 - 중단');
    controller.abort('사용자 검증 실패');
  }
  
  return { user, validated: true };
});
```

## 파이프라인 메트릭

### `controller.recordMetric(name, value)`

현재 실행에 대한 커스텀 메트릭을 기록합니다.

**매개변수:**
- `name`: 메트릭 이름
- `value`: 메트릭 값

```typescript
useActionHandler('performanceTrackedAction', async (payload, controller) => {
  const startTime = performance.now();
  
  try {
    const result = await expensiveOperation(payload);
    
    const duration = performance.now() - startTime;
    controller.recordMetric('execution_time', duration);
    controller.recordMetric('payload_size', JSON.stringify(payload).length);
    controller.recordMetric('result_size', JSON.stringify(result).length);
    
    return result;
    
  } catch (error) {
    const duration = performance.now() - startTime;
    controller.recordMetric('error_time', duration);
    controller.recordMetric('error_type', error.constructor.name);
    
    controller.abort(`${duration}ms 후 작업 실패: ${error.message}`);
  }
});
```

## 베스트 프랙티스

### 1. 에러 처리
- 실행을 중지해야 하는 중요한 실패에는 `abort()` 사용
- 중요하지 않은 에러에는 결과 공유 사용
- 적절한 에러 복구 전략 구현

### 2. 페이로드 관리
- 파이프라인 초기에 페이로드 수정 (높은 우선순위)
- 타입 안전성을 위한 페이로드 수정 검증
- 페이로드 구조 변경 문서화

### 3. 결과 협업
- 핸들러 간 통신을 위한 의미 있는 결과 구조 사용
- 단계 식별자와 성공 플래그 포함
- 다른 핸들러가 필요할 수 있는 결과 공유

### 4. 성능
- 오래 실행되는 핸들러에 적절한 타임아웃 설정
- 성능 모니터링을 위한 메트릭 기록
- 비용이 많이 드는 계산에 파이프라인 상태 사용

### 5. 디버깅
- 개발 중 디버그 모드 활성화
- 설명적인 로그 메시지 사용
- 로그에 관련 컨텍스트 포함

## 관련 자료

- **[Action Only 메서드](./action-only.md)** - 액션 디스패치 및 핸들러 등록
- **[액션 레지스트리 API](./action-registry.md)** - 레지스트리 관리 메서드
- **[Action Only 예제](../examples/action-only.md)** - 완전한 사용 예제