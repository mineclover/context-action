# Action Only 메서드

`createActionContext`에서 제공하는 Action Only 패턴 메서드의 완전한 API 레퍼런스입니다.

## 개요

Action Only 패턴은 상태 관리 없이 타입 안전한 액션 디스패치를 제공합니다. 이 패턴은 이벤트 시스템, 커맨드 패턴, 비즈니스 로직 오케스트레이션, 그리고 로컬 상태 없이 액션 처리가 필요한 시나리오에 이상적입니다.

## 핵심 메서드

### `createActionContext<T>(contextName)`

타입 안전한 액션 디스패치와 핸들러 등록을 위한 액션 컨텍스트를 생성합니다.

**매개변수:**
- `contextName`: 액션 컨텍스트의 고유 식별자

**반환값:**
```typescript
{
  Provider: React.ComponentType,
  useActionDispatch: () => ActionDispatcher<T>,
  useActionHandler: (actionName, handler, options?) => void
}
```

**예제:**
```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
}

const { Provider, useActionDispatch, useActionHandler } = 
  createActionContext<AppActions>('App');
```

## 액션 디스패처 메서드

### `dispatch(actionName, payload)`

지정된 페이로드로 등록된 모든 핸들러에 액션을 디스패치합니다.

**매개변수:**
- `actionName`: 디스패치할 액션의 이름
- `payload`: 액션 페이로드 데이터

**반환값:** `Promise<ActionResult[]>` - 모든 핸들러의 결과

```typescript
function UserComponent() {
  const dispatch = useActionDispatch();
  
  const handleUpdate = async () => {
    try {
      const results = await dispatch('updateUser', {
        id: '123',
        name: 'John Doe'
      });
      console.log('액션 결과:', results);
    } catch (error) {
      console.error('액션 실패:', error);
    }
  };
  
  return <button onClick={handleUpdate}>사용자 업데이트</button>;
}
```

### `dispatch.async(actionName, payload)`

표준 dispatch 메서드의 별칭으로, 비동기 동작을 명시적으로 나타냅니다.

**매개변수:**
- `actionName`: 디스패치할 액션의 이름  
- `payload`: 액션 페이로드 데이터

**반환값:** `Promise<ActionResult[]>`

```typescript
const results = await dispatch.async('processData', { data: 'example' });
```

## 핸들러 등록

### `useActionHandler(actionName, handler, options?)`

지정된 액션에 대한 액션 핸들러를 등록합니다.

**매개변수:**
- `actionName`: 처리할 액션의 이름
- `handler`: 핸들러 함수 `(payload, controller) => Promise<any> | any`
- `options`: 선택적 설정 객체

**핸들러 함수 시그니처:**
```typescript
type ActionHandler<TPayload> = (
  payload: TPayload,
  controller: PipelineController
) => Promise<any> | any;
```

**옵션:**
```typescript
interface HandlerOptions {
  priority?: number;      // 실행 우선순위 (높을수록 먼저, 기본값: 0)
  id?: string;           // 고유 핸들러 식별자
  once?: boolean;        // 한 번만 실행 후 등록 해제
}
```

**예제:**
```typescript
function UserHandler() {
  const dispatch = useActionDispatch();
  
  useActionHandler('updateUser', useCallback(async (payload, controller) => {
    try {
      // 페이로드 검증
      if (!payload.id) {
        controller.abort('사용자 ID가 필요합니다');
        return;
      }
      
      // 비즈니스 로직
      const result = await userService.updateUser(payload.id, {
        name: payload.name
      });
      
      // 다른 핸들러를 위한 결과 설정
      controller.setResult({
        step: 'user-update',
        success: true,
        userId: result.id
      });
      
      return { success: true, user: result };
      
    } catch (error) {
      controller.abort(`사용자 업데이트 실패: ${error.message}`);
    }
  }, []), { priority: 100, id: 'user-updater' });
  
  return null;
}
```

## 파이프라인 컨트롤러 메서드

액션 핸들러의 `controller` 매개변수는 고급 파이프라인 제어를 제공합니다.

### `controller.abort(reason, error?)`

액션 파이프라인 실행을 중단합니다.

**매개변수:**
- `reason`: 중단 이유
- `error?`: 선택적 에러 객체

```typescript
useActionHandler('validateData', (payload, controller) => {
  if (!payload.data) {
    controller.abort('데이터가 필요합니다');
    return;
  }
  
  if (!isValid(payload.data)) {
    controller.abort('잘못된 데이터 형식', new ValidationError());
    return;
  }
});
```

### `controller.modifyPayload(modifier)`

파이프라인의 후속 핸들러를 위해 페이로드를 수정합니다.

**매개변수:**
- `modifier`: 현재 페이로드를 받아 수정된 페이로드를 반환하는 함수

```typescript
useActionHandler('enrichData', (payload, controller) => {
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    userId: getCurrentUserId(),
    sessionId: getSessionId()
  }));
  
  return { enriched: true };
}, { priority: 100 }); // 먼저 실행되도록 높은 우선순위
```

### `controller.setResult(result)`

나중 핸들러가 액세스할 수 있는 결과를 설정합니다.

**매개변수:**
- `result`: 저장할 결과 객체

```typescript
useActionHandler('processPayment', async (payload, controller) => {
  const transaction = await paymentService.process(payload);
  
  controller.setResult({
    step: 'payment',
    transactionId: transaction.id,
    amount: transaction.amount,
    success: true
  });
  
  return transaction;
}, { priority: 90 });
```

### `controller.getResults()`

이전 핸들러들이 설정한 모든 결과를 가져옵니다.

**반환값:** 결과 객체 배열

```typescript
useActionHandler('sendReceipt', async (payload, controller) => {
  const results = controller.getResults();
  const paymentResult = results.find(r => r.step === 'payment');
  
  if (paymentResult?.success) {
    await emailService.sendReceipt({
      transactionId: paymentResult.transactionId,
      amount: paymentResult.amount,
      email: payload.email
    });
  }
}, { priority: 80 }); // 결제 후 실행되도록 낮은 우선순위
```

### `controller.getPayload()`

현재 (수정될 수 있는) 페이로드를 가져옵니다.

**반환값:** 현재 페이로드 객체

```typescript
useActionHandler('logAction', (_, controller) => {
  const currentPayload = controller.getPayload();
  console.log('최종 페이로드:', currentPayload);
  
  return { logged: true };
}, { priority: 10 }); // 마지막에 실행되도록 낮은 우선순위
```

## 핸들러 패턴

### 순차 처리

우선순위 순서로 핸들러가 실행되어 순차 처리됩니다:

```typescript
function SequentialHandlers() {
  // 1단계: 검증 (우선순위 100)
  useActionHandler('processOrder', (payload, controller) => {
    if (!validateOrder(payload)) {
      controller.abort('잘못된 주문');
    }
    return { step: 'validation', valid: true };
  }, { priority: 100 });
  
  // 2단계: 결제 (우선순위 90)
  useActionHandler('processOrder', async (payload, controller) => {
    const payment = await processPayment(payload.paymentInfo);
    controller.setResult({ step: 'payment', transactionId: payment.id });
    return payment;
  }, { priority: 90 });
  
  // 3단계: 주문 처리 (우선순위 80)
  useActionHandler('processOrder', async (payload, controller) => {
    const results = controller.getResults();
    const paymentResult = results.find(r => r.step === 'payment');
    
    if (paymentResult) {
      const order = await fulfillOrder(payload, paymentResult.transactionId);
      return { step: 'fulfillment', orderId: order.id };
    }
  }, { priority: 80 });
  
  return null;
}
```

### 병렬 처리

같은 액션을 독립적으로 처리하는 여러 핸들러:

```typescript
function ParallelHandlers() {
  // 애널리틱스 추적 (독립적)
  useActionHandler('userAction', async (payload) => {
    await analytics.track(payload.action, payload.data);
    return { provider: 'analytics', tracked: true };
  }, { id: 'analytics' });
  
  // 에러 모니터링 (독립적)
  useActionHandler('userAction', async (payload) => {
    await errorMonitor.log(payload.action, payload.context);
    return { provider: 'monitor', logged: true };
  }, { id: 'monitor' });
  
  // 사용자 피드백 (독립적)
  useActionHandler('userAction', (payload) => {
    showToast(`액션 ${payload.action}이 완료되었습니다`);
    return { provider: 'ui', notified: true };
  }, { id: 'ui-feedback' });
  
  return null;
}
```

### 에러 복구

우아한 에러 처리 및 복구:

```typescript
function ErrorRecoveryHandlers() {
  // 주 핸들러
  useActionHandler('apiCall', async (payload, controller) => {
    try {
      const result = await primaryApi.call(payload.endpoint, payload.data);
      controller.setResult({ provider: 'primary', success: true, data: result });
      return result;
    } catch (error) {
      controller.setResult({ provider: 'primary', success: false, error });
      // 중단하지 않고 폴백 핸들러가 시도하도록 함
      return { error: error.message };
    }
  }, { priority: 100, id: 'primary-api' });
  
  // 폴백 핸들러
  useActionHandler('apiCall', async (payload, controller) => {
    const results = controller.getResults();
    const primaryFailed = results.some(r => r.provider === 'primary' && !r.success);
    
    if (primaryFailed) {
      try {
        const result = await fallbackApi.call(payload.endpoint, payload.data);
        return { success: true, data: result, fallback: true };
      } catch (error) {
        controller.abort(`모든 API 제공자 실패: ${error.message}`);
      }
    }
    
    return { skipped: true, reason: 'primary-succeeded' };
  }, { priority: 90, id: 'fallback-api' });
  
  return null;
}
```

## 고급 사용 사례

### 커맨드 패턴 구현

```typescript
interface CommandActions extends ActionPayloadMap {
  executeCommand: {
    type: 'create' | 'update' | 'delete';
    entity: string;
    data: any;
  };
}

function CommandProcessor() {
  const dispatch = useActionDispatch();
  
  useActionHandler('executeCommand', async (payload, controller) => {
    const command = createCommand(payload.type, payload.entity, payload.data);
    
    try {
      const result = await command.execute();
      
      // 커맨드 실행 로그
      dispatch('trackEvent', {
        event: 'command_executed',
        data: {
          commandType: payload.type,
          entity: payload.entity,
          success: true
        }
      });
      
      return result;
    } catch (error) {
      // 커맨드 실패 로그
      dispatch('logError', {
        error: error.message,
        context: { command: payload },
        severity: 'high'
      });
      
      controller.abort(`커맨드 실행 실패: ${error.message}`);
    }
  }, [dispatch]);
  
  return null;
}
```

### 이벤트 집계

```typescript
function EventAggregator() {
  const dispatch = useActionDispatch();
  
  useActionHandler('userInteraction', useCallback((payload, controller) => {
    // 상호작용 데이터 수집
    const interactionData = {
      type: payload.type,
      element: payload.element,
      timestamp: Date.now(),
      sessionId: getSessionId()
    };
    
    // 배치를 위해 저장
    addToInteractionBuffer(interactionData);
    
    // 버퍼가 가득 찬 경우 배치 처리 트리거
    if (isBufferFull()) {
      dispatch('flushInteractions', { interactions: getBufferContents() });
      clearBuffer();
    }
    
    return { buffered: true };
  }, [dispatch]), { id: 'interaction-aggregator' });
  
  useActionHandler('flushInteractions', async (payload) => {
    await analytics.batchTrack(payload.interactions);
    return { flushed: payload.interactions.length };
  }, { id: 'interaction-flusher' });
  
  return null;
}
```

## 베스트 프랙티스

### 1. 핸들러 조직화
- 관련 기능을 위한 전용 핸들러 컴포넌트 생성
- 디버깅을 위해 의미 있는 핸들러 ID 사용
- 도메인이나 책임별로 핸들러 그룹화

### 2. 우선순위 관리
- 중요한 설정/검증에는 높은 우선순위 (90-100) 사용
- 비즈니스 로직에는 중간 우선순위 (50-80) 사용
- 정리/로깅에는 낮은 우선순위 (10-40) 사용

### 3. 에러 처리
- 실행을 중지해야 하는 중요한 실패에는 `controller.abort()` 사용
- 중요하지 않은 실패에는 에러 객체 반환
- 탄력성을 위한 폴백 핸들러 구현

### 4. 성능
- 재등록을 방지하기 위해 항상 핸들러를 `useCallback`으로 감싸기
- 디버깅과 프로파일링을 위해 핸들러 ID 사용
- 핸들러에서 복잡한 계산 피하기 - 서비스에 위임

### 5. 테스트
- 직접 액션 디스패치를 사용하여 핸들러를 독립적으로 테스트
- 의존성과 서비스를 모킹
- 에러 시나리오와 엣지 케이스 테스트

## 관련 자료

- **[액션 레지스트리 API](./action-registry.md)** - 액션 등록 및 관리
- **[파이프라인 컨트롤러 API](./pipeline-controller.md)** - 파이프라인 제어 메서드
- **[Action Only 예제](../examples/action-only.md)** - 완전한 사용 예제