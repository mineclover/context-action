# 디스패치 메서드

다양한 수준의 제어와 결과 수집으로 액션 파이프라인을 트리거하는 다양한 방법.

## 핵심 디스패치 메서드

### 기본 디스패치

결과 수집 없이 간단한 액션 실행:

```typescript
interface UserActions extends ActionPayloadMap {
  updateProfile: { userId: string; data: UserProfile };
  sendNotification: { message: string; type: 'info' | 'success' | 'error' };
}

const userRegister = new ActionRegister<UserActions>();

// 기본 디스패치 - 발사 후 계속
await userRegister.dispatch('updateProfile', {
  userId: '123',
  data: { name: 'John Doe', email: 'john@example.com' }
});

// void 반환 (결과 수집 없음)
```

### 결과 수집과 함께 디스패치

상세한 결과와 함께 포괄적인 실행:

```typescript
const result = await userRegister.dispatchWithResult('updateProfile', 
  {
    userId: '123',
    data: { name: 'John Doe', email: 'john@example.com' }
  },
  { 
    result: { collect: true },  // 결과 수집 활성화
    timeout: 5000              // 선택적 타임아웃
  }
);

console.log(result);
// {
//   success: true,
//   aborted: false,
//   terminated: false,
//   results: [
//     { step: 'validation', success: true },
//     { step: 'update', userId: '123', updated: true },
//     { step: 'notification', sent: true }
//   ],
//   execution: {
//     handlersExecuted: 3,
//     startTime: 1640995200000,
//     endTime: 1640995200500,
//     duration: 500
//   }
// }
```

## React 통합 디스패치

### useActionDispatch 훅

React 컴포넌트에서의 기본 디스패치:

```typescript
import { useActionDispatch } from './UserActionContext';

function UserComponent() {
  const dispatch = useActionDispatch();
  
  const handleUpdate = async () => {
    // 간단한 디스패치
    await dispatch('updateProfile', {
      userId: '123',
      data: { name: 'Updated Name' }
    });
  };
  
  return <button onClick={handleUpdate}>프로필 업데이트</button>;
}
```

### useActionDispatchWithResult 훅

React 컴포넌트에서의 결과 수집:

```typescript
import { useActionDispatchWithResult } from './UserActionContext';

function AdvancedUserComponent() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  
  const handleComplexUpdate = async () => {
    try {
      const result = await dispatchWithResult('updateProfile', 
        {
          userId: '123',
          data: { name: 'Complex Update' }
        },
        { result: { collect: true } }
      );
      
      if (result.success) {
        console.log('업데이트 성공:', result.results);
      } else {
        console.error('업데이트 실패:', result.errors);
      }
      
    } catch (error) {
      console.error('작업 실패:', error);
    }
  };
  
  return <button onClick={handleComplexUpdate}>복합 업데이트</button>;
}
```

## 디스패치 옵션

### 타임아웃 구성

타임아웃으로 무한 대기를 방지합니다. `timeout`을 초과하면 실행 신호가 abort되고 반환된 Promise는 `ActionTimeoutError`로 **reject**(`isActionTimeoutError(error)`로 판별)되며, 내부 핸들러 작업은 정산될 때까지 안전하게 drain됩니다:

```typescript
import { isActionTimeoutError } from '@context-action/core';

try {
  const result = await actionRegister.dispatchWithResult(
    'longOperation',
    { data: 'large-dataset' },
    {
      result: { collect: true },
      timeout: 10000, // 10초 wall-clock 타임아웃 (큐 대기 및 재시도 지연 포함)
    },
  );
  console.log('완료 상태:', result.outcome, '조기 종료 여부:', result.terminated);
} catch (error) {
  if (isActionTimeoutError(error)) {
    console.log(`"${error.action}" 작업이 ${error.timeout}ms 후 시간 초과되었습니다`);
  } else {
    throw error;
  }
}
```

> 참고: `result.terminated === true`는 타임아웃이 아니라 핸들러가 `controller.return(value)`로 파이프라인을 조기 종료했음을 의미합니다.

### 결과 수집 옵션

어떤 결과를 수집할지 제어합니다:

```typescript
// 모든 결과 수집
const fullResult = await actionRegister.dispatchWithResult('operation', payload, {
  result: { collect: true }
});

// 오류는 result.errors와 result.failedResults에서 항상 확인할 수 있습니다.
const successResult = await actionRegister.dispatchWithResult('operation', payload, {
  result: { collect: true }
});

// 메타데이터와 함께 결과 수집
const detailedResult = await actionRegister.dispatchWithResult('operation', payload, {
  result: { collect: true }
});
console.log(detailedResult.handlers); // 핸들러별 상태, 타이밍, 메타데이터
```

## 고급 디스패치 패턴

### 조건부 디스패치

```typescript
function ConditionalDispatcher() {
  const dispatch = useActionDispatch();
  
  const handleUserAction = async (action: string, data: any) => {
    // 사용자 권한에 따른 조건부 디스패치
    const user = getCurrentUser();
    
    if (user.role === 'admin') {
      await dispatch('adminAction', { action, data, adminId: user.id });
    } else if (user.role === 'user') {
      await dispatch('userAction', { action, data, userId: user.id });
    } else {
      await dispatch('guestAction', { action, data });
    }
  };
  
  return <button onClick={() => handleUserAction('update', {})}>액션</button>;
}
```

### 배치 디스패치

```typescript
function BatchDispatcher() {
  const dispatch = useActionDispatch();
  
  const handleBatchOperation = async (items: any[]) => {
    // 순차 배치 처리
    for (const item of items) {
      await dispatch('processItem', { item, batchId: generateId() });
    }
    
    // 최종 배치 완료
    await dispatch('completeBatch', { 
      itemCount: items.length,
      completedAt: Date.now()
    });
  };
  
  // 병렬 배치 처리
  const handleParallelBatch = async (items: any[]) => {
    const batchId = generateId();
    
    // 모든 항목을 병렬로 디스패치
    const promises = items.map(item => 
      dispatch('processItem', { item, batchId })
    );
    
    await Promise.all(promises);
    
    // 모든 병렬 작업 후 완료
    await dispatch('completeBatch', { 
      itemCount: items.length,
      batchId,
      mode: 'parallel'
    });
  };
  
  return (
    <div>
      <button onClick={() => handleBatchOperation(items)}>
        순차 배치
      </button>
      <button onClick={() => handleParallelBatch(items)}>
        병렬 배치
      </button>
    </div>
  );
}
```

### 디스패치에서의 오류 처리

```typescript
import { isActionTimeoutError, isActionValidationError } from '@context-action/core';

function ErrorHandlingDispatcher() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  
  const handleRiskyOperation = async () => {
    try {
      const result = await dispatchWithResult('riskyOperation', 
        { data: 'sensitive-data' },
        { 
          result: { collect: true },
          timeout: 5000
        }
      );
      
      switch (result.outcome) {
        case 'cancelled':
          console.log('작업이 중단되었습니다:', result.abortReason);
          break;
        case 'debounced':
        case 'throttled':
          console.log('타이밍 가드에 의해 건너뛰어짐:', result.outcome);
          break;
        case 'completed':
        case 'completed_with_errors':
          console.log('작업 완료:', result.result, result.successResults);
          break;
        case 'failed':
          console.log('치명적 오류로 작업 실패:', result.errors);
          break;
      }
      
    } catch (error) {
      if (isActionTimeoutError(error)) {
        console.error('작업 시간 초과:', error.timeout);
      } else if (isActionValidationError(error)) {
        console.error('페이로드 검증 실패:', error.issues);
      } else {
        console.error('디스패치 실패:', error);
      }
    }
  };
  
  return <button onClick={handleRiskyOperation}>위험한 작업</button>;
}
```

## 디스패치 결과 구조

`dispatchWithResult()`는 `packages/core/src/types.ts`의 `ExecutionResult<R>` 객체를 반환합니다. 반면 타임아웃(`ActionTimeoutError`), 엄격 스키마 검증 실패(`ActionValidationError`), 종료 이후 호출(`ActionRegisterDestroyedError`)은 Promise rejection으로 전달됩니다.

```typescript
interface ExecutionResult<R = void> {
  success: boolean;
  aborted: boolean;
  abortReason: string | undefined;
  terminated: boolean; // controller.return()으로 조기 종료된 경우 true
  outcome: 'completed' | 'completed_with_errors' | 'failed' | 'cancelled' | 'debounced' | 'throttled';
  validation?: {
    passed: boolean;
    errors: string[];
  };
  result: R | R[] | undefined;   // 결과 전략에 따라 집계된 최종 결과
  successResults: R[];           // undefined가 아닌 성공 결과 배열
  results: Array<R | undefined>; // 수집된 원시 결과 배열
  failedResults: Array<{
    handlerId: string;
    error: Error;
    expectedType: string;
  }>;
  execution: {
    duration: number;
    admissionDuration: number;
    queueWaitDuration: number;
    pipelineDuration: number;
    retryDelayDuration?: number;
    resultProcessingDuration?: number;
    attempts?: Array<{
      startTime: number;
      endTime: number;
      duration: number;
      outcome: 'succeeded' | 'failed' | 'retried' | 'cancelled';
    }>;
    handlersExecuted: number;
    handlersSkipped: number;
    handlersFailed: number;
    startTime: number;
    endTime: number;
  };
  handlers: HandlerExecutionOutcome<R>[];
  raceDiagnostics?: {
    winnerId?: string;
    winner?: HandlerExecutionOutcome<R>;
    loserSnapshots: HandlerExecutionOutcome<R>[];
    pendingLosersAtReturn: number;
    observedLoserFailures: number;
  };
  errors: HandlerError[];
}
```

### 검증된 디스패치 및 결과 분기 예제

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  isActionTimeoutError,
  type ActionPayloadMap,
  type ActionResultMap,
  type ExecutionResult,
} from '@context-action/core';

interface ApiActions extends ActionPayloadMap {
  fetchUser: { userId: string };
  notify: { message: string };
}

interface ApiResults extends ActionResultMap<ApiActions> {
  fetchUser: { name: string };
}

const registry = new ActionRegister<ApiActions, ApiResults>({
  name: 'DispatchGuide',
  actions: {
    fetchUser: { queue: 'serial', timeout: 5000 },
    notify: { queue: 'immediate' },
  },
});

registry.registerResult('fetchUser', async payload => {
  await Promise.resolve();
  return { name: `User-${payload.userId}` };
});

registry.registerCommand('notify', payload => {
  console.info(payload.message);
});

async function runDispatchExamples() {
  // Fast Path 대상 순차 디스패치
  await registry.dispatch('notify', { message: 'hello' });
  await registry.actions.notify({ message: 'via-proxy' });

  // 상세 실행 결과 분기
  try {
    const execution: ExecutionResult<{ name: string }> =
      await registry.dispatchWithResult(
        'fetchUser',
        { userId: '123' },
        { result: { collect: true, strategy: 'first' } },
      );

    switch (execution.outcome) {
      case 'completed':
      case 'completed_with_errors':
        console.info(execution.result, execution.terminated);
        break;
      case 'cancelled':
        console.warn('중단 사유:', execution.abortReason);
        break;
      case 'debounced':
      case 'throttled':
        console.info('타이밍 가드로 건너뜀:', execution.outcome);
        break;
      case 'failed':
        console.error('실패:', execution.errors);
        break;
    }
  } catch (error) {
    if (isActionTimeoutError(error)) {
      console.error(`"${error.action}" 타임아웃(${error.timeout}ms)`);
    }
  } finally {
    await registry.destroyAsync();
  }
}

void runDispatchExamples;
```

## 성능 최적화

### 효율적인 디스패치와 2단계 Fast Path

장기 수명의 `ActionRegister` 인스턴스를 재사용하면 액션별 `CompiledActionPipeline` 캐시(핸들러 정렬·역할 분리·타이밍 판별 재사용)와 캐시된 `actions` / `actionsWithResult` Proxy 디스패처가 그대로 유지됩니다.

또한 트레이스 리스너, 호출 옵션, 큐, 스키마 검증, Guard, Observer, 타이밍 가드, `once` 핸들러가 없는 기본 순차 `dispatch()`는 `dispatchWithResult()`와 동일한 중단/오류 계약을 유지하면서 무할당 Fast Path로 자동 라우팅됩니다:

```typescript
// ✅ 좋음 - ActionRegister를 재사용해 CompiledActionPipeline & Proxy 캐시 활용
const register = new ActionRegister<MyActions>();

function OptimizedComponent() {
  const handleMultipleActions = async () => {
    await register.dispatch('action1', { data: 'a' });
    await register.actions.action2({ data: 'b' });
    await register.dispatch('action3', { data: 'c' });
  };
}

// ❌ 피해야 할 것 - 호출마다 새 레지스터를 생성하면 파이프라인 캐시가 무효화됨
function InefficientComponent() {
  const handleAction = async () => {
    const newRegister = new ActionRegister<MyActions>(); // 비용이 많이 듦!
    await newRegister.dispatch('action', { data: 'test' });
  };
}
```

### 배치 결과 수집

```typescript
function BatchResultCollector() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  
  const handleBatchWithResults = async (operations: Operation[]) => {
    const results = await Promise.all(
      operations.map(op => 
        dispatchWithResult('processOperation', 
          { operation: op },
          { result: { collect: true } }
        )
      )
    );
    
    // 배치 결과 분석
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`배치 완료: ${successful.length} 성공, ${failed.length} 실패`);
    
    return {
      successful: successful.length,
      failed: failed.length,
      results: results
    };
  };
  
  return <button onClick={() => handleBatchWithResults(operations)}>
    배치 처리
  </button>;
}
```

## 사용 사례별 디스패치 패턴

### 1. 발사 후 망각 (분석)

```typescript
// 결과가 필요하지 않음, 단순히 트리거
await dispatch('trackEvent', { event: 'button_click', data: eventData });
```

### 2. 검증 파이프라인 (결과 수집)

```typescript
// 검증이 통과했는지 알아야 함
const result = await dispatchWithResult('validateData', 
  { data: formData },
  { result: { collect: true } }
);

if (result.success) {
  proceedWithValidData();
} else {
  showValidationErrors(result.errors);
}
```

### 3. 다단계 작업 (진행 상황 추적)

```typescript
// 복합 작업을 통한 진행 상황 추적
const result = await dispatchWithResult('complexOperation', 
  { operation: 'data-migration' },
  { 
    result: { collect: true }
  }
);

// 사용자에게 진행 상황 표시
result.results.forEach(step => {
  console.log(`단계 ${step.step}: ${step.success ? '✅' : '❌'}`);
});
```

## 실제 예제: 디스패치를 사용한 결과 수집

[UseActionWithResult 데모](https://mineclover.github.io/context-action/example/react/useActionWithResult)에서 포괄적인 디스패치 패턴을 확인하세요:

```typescript
// 결과 수집과 함께 순차 워크플로우 실행
const executeWorkflow = async () => {
  const result = await dispatchWithResult('processWorkflow', 
    { data: workflowData },
    { result: { collect: true } }
  );
  
  // 다양한 디스패치 결과 처리
  if (result.success) {
    setWorkflowResults(result.results);
  } else if (result.aborted) {
    setError(`워크플로우 중단: ${result.abortReason}`);
  }
};
```

이 예제는 포괄적인 오류 처리와 UI 통합을 가진 `dispatchWithResult`의 실제 사용을 보여줍니다.

## 관련 문서

- **[우선순위 시스템](./priority.md)** - 우선순위로 실행 순서 제어
- **[차단 작업](./dispatch.md)** - 실행 플로우 제어
- **[중단 메커니즘](../patterns/action/advanced-patterns.md)** - 필요시 파이프라인 실행 중지
- **[결과 처리](./dispatch.md)** - 디스패치 결과 처리와 사용
