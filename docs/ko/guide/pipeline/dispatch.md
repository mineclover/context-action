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

타임아웃으로 무한 대기를 방지합니다:

```typescript
// 타임아웃과 함께 디스패치
const result = await actionRegister.dispatchWithResult('longOperation', 
  { data: 'large-dataset' },
  { 
    result: { collect: true },
    timeout: 10000  // 10초 타임아웃
  }
);

if (result.terminated) {
  console.log('작업 시간 초과');
}
```

### 결과 수집 옵션

어떤 결과를 수집할지 제어합니다:

```typescript
// 모든 결과 수집
const fullResult = await actionRegister.dispatchWithResult('operation', payload, {
  result: { collect: true }
});

// 성공한 결과만 수집
const successResult = await actionRegister.dispatchWithResult('operation', payload, {
  result: { 
    collect: true,
    includeErrors: false  // 실패한 핸들러 제외
  }
});

// 메타데이터와 함께 결과 수집
const detailedResult = await actionRegister.dispatchWithResult('operation', payload, {
  result: { 
    collect: true,
    includeMetadata: true,  // 핸들러 ID, 우선순위, 타이밍 포함
    includePayload: true    // 최종 페이로드 상태 포함
  }
});
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
      
      if (result.aborted) {
        console.log('작업이 중단되었습니다:', result.abortReason);
        // 중단을 우아하게 처리
      } else if (result.terminated) {
        console.log('작업 시간 초과');
        // 타임아웃 처리
      } else if (result.success) {
        console.log('작업 완료:', result.results);
        // 성공 처리
      } else {
        console.log('작업이 오류와 함께 실패');
        // 일반적인 실패 처리
      }
      
    } catch (error) {
      console.error('디스패치 실패:', error);
      // 디스패치 수준 오류 처리
    }
  };
  
  return <button onClick={handleRiskyOperation}>위험한 작업</button>;
}
```

## 디스패치 결과 구조

### 성공 결과

```typescript
interface DispatchResult<T = any> {
  success: true;
  aborted: false;
  terminated: false;
  results: T[];           // 모든 핸들러 반환값
  errors: never[];        // 성공한 작업에 대해서는 비어있음
  execution: {
    handlersExecuted: number;
    startTime: number;
    endTime: number;
    duration: number;
    mode: 'sequential' | 'parallel' | 'race';
  };
  metadata?: {
    handlerIds: string[];
    priorities: number[];
    payload: any;           // 최종 페이로드 상태
  };
}
```

### 중단된 결과

```typescript
interface AbortedResult {
  success: false;
  aborted: true;
  terminated: false;
  abortReason: string;     // controller.abort()에 제공된 이유
  abortedBy: string;       // 중단을 일으킨 핸들러 ID
  results: any[];          // 중단 전에 실행된 핸들러의 결과
  errors: Error[];
  execution: {
    handlersExecuted: number;
    startTime: number;
    endTime: number;
    duration: number;
  };
}
```

### 타임아웃 결과

```typescript
interface TimeoutResult {
  success: false;
  aborted: false;
  terminated: true;
  timeoutMs: number;       // 구성된 타임아웃 값
  results: any[];          // 타임아웃 전의 부분 결과
  errors: Error[];
  execution: {
    handlersExecuted: number;
    startTime: number;
    endTime: number;
    duration: number;
  };
}
```

## 성능 최적화

### 효율적인 디스패치

```typescript
// ✅ 좋음 - 액션 레지스터 인스턴스 재사용
const register = new ActionRegister<MyActions>();

function OptimizedComponent() {
  const handleMultipleActions = async () => {
    // 여러 디스패치에 동일한 레지스터 재사용
    await register.dispatch('action1', { data: 'a' });
    await register.dispatch('action2', { data: 'b' });
    await register.dispatch('action3', { data: 'c' });
  };
}

// ❌ 피해야 할 것 - 반복적으로 새 레지스터 생성
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
    result: { 
      collect: true,
      includeMetadata: true 
    }
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
- **[차단 작업](./blocking.md)** - 실행 플로우 제어
- **[중단 메커니즘](./abort.md)** - 필요시 파이프라인 실행 중지
- **[결과 처리](./result-handling.md)** - 디스패치 결과 처리와 사용