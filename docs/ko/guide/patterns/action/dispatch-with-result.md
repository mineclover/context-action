# 결과와 함께 디스패치 패턴

Context-Action 프레임워크를 위한 고급 결과 수집 및 처리 패턴입니다.

## 필수 조건

타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 **[기본 액션 설정](../setup/basic-action-setup.md)**을 참조하세요.

이 문서는 설정 가이드의 다음 패턴을 사용합니다:
- 타입 정의 → [이벤트 액션 패턴](../setup/basic-action-setup.md#common-action-patterns)  
- 컨텍스트 생성 → [단일 도메인 컨텍스트](../setup/basic-action-setup.md#single-domain-context)
- 프로바이더 설정 → [단일 프로바이더 설정](../setup/basic-action-setup.md#single-provider-setup)

### 사용된 설정 컨텍스트 훅
```typescript
// 설정 패턴에서 - 컨텍스트 생성 후 이 훅들을 사용할 수 있습니다:
const useEventDispatch = EventContext.useActionDispatchWithResult; // EventActions
const useUserDispatch = UserContext.useActionDispatchWithResult;   // UserActions  
const useAPIDispatch = APIContext.useActionDispatchWithResult;     // APIActions
```

## 기본 결과 수집

액션 디스패치에서 실행 결과와 메타데이터를 수집합니다.

```typescript
// 설정 패턴의 EventActions 사용
const { dispatchWithResult } = useEventDispatch();

const result = await dispatchWithResult('analytics', {
  event: 'user-interaction',
  data: { timestamp: Date.now() }
});

if (result.success) {
  console.log(`${result.execution.handlersExecuted}개의 핸들러 실행됨`);
  console.log(`지속 시간: ${result.execution.duration}ms`);
  console.log('최종 결과:', result.results);
}
```

## 결과 수집 전략

### 병합 전략

```typescript
// 설정 패턴의 UserActions 사용  
const { dispatchWithResult } = useUserDispatch();

const result = await dispatchWithResult('updateProfile', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  result: {
    collect: true,
    strategy: 'merge',
    maxResults: 5,
    merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  }
});

console.log('병합된 결과:', result.results);
```

### 배열 전략

```typescript
// 설정 패턴의 APIActions 사용
const { dispatchWithResult } = useAPIDispatch();

const result = await dispatchWithResult('fetchData', {
  endpoint: '/api/users',
  params: { limit: 10 }
}, {
  result: {
    collect: true,
    strategy: 'array',
    maxResults: 10
  }
});

// results는 모든 핸들러 결과의 배열
result.results.forEach((handlerResult, index) => {
  console.log(`핸들러 ${index} 결과:`, handlerResult);
});
```

### 커스텀 전략

```typescript
// 복잡한 분석 처리를 위한 EventActions 사용
const { dispatchWithResult } = useEventDispatch();

const result = await dispatchWithResult('analytics', {
  event: 'complex-operation',
  data: { userId: 123, feature: 'dashboard' }
}, {
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => {
      // 결과 집계를 위한 커스텀 비즈니스 로직
      return {
        summary: results.length,
        errors: results.filter(r => r.error),
        success: results.filter(r => r.success),
        data: results.map(r => r.data).filter(Boolean)
      };
    }
  }
});
```

## 실행 메타데이터

자세한 실행 정보에 액세스합니다.

### 기본 메타데이터

```typescript
// 추적을 위한 EventActions 사용
const { dispatchWithResult } = useEventDispatch();

const result = await dispatchWithResult('trackInteraction', {
  type: 'button_click',
  metadata: { component: 'header', section: 'navigation' }
});

console.log('실행 메타데이터:', {
  duration: result.execution.duration,
  handlersExecuted: result.execution.handlersExecuted,
  totalHandlers: result.execution.totalHandlers,
  success: result.success
});
```

### 핸들러 레벨 메타데이터

```typescript
// 자세한 분석을 위한 EventActions 사용
const { dispatchWithResult } = useEventDispatch();

const result = await dispatchWithResult('analytics', {
  event: 'detailed-operation',
  data: { timestamp: Date.now(), userId: 'user123' }
}, {
  result: {
    collect: true,
    includeMetadata: true
  }
});

result.results.forEach((handlerResult, index) => {
  console.log(`핸들러 ${index}:`, {
    result: handlerResult.value,
    duration: handlerResult.metadata.duration,
    priority: handlerResult.metadata.priority,
    tags: handlerResult.metadata.tags
  });
});
```

## 성능 모니터링

### 타이밍 분석

```typescript
// 성능 모니터링을 위한 APIActions 사용
const { dispatchWithResult } = useAPIDispatch();

const result = await dispatchWithResult('fetchData', {
  endpoint: '/api/performance-test',
  params: { size: 'large' }
});

if (result.execution.duration > 1000) {
  console.warn('느린 액션 감지:', {
    action: 'fetchData',
    duration: result.execution.duration,
    handlers: result.execution.handlersExecuted
  });
}
```

### 성공률 추적

```typescript
// 신뢰성 테스트를 위한 APIActions 사용
const { dispatchWithResult } = useAPIDispatch();
const results = [];

for (let i = 0; i < 100; i++) {
  const result = await dispatchWithResult('fetchData', {
    endpoint: '/api/reliability-test',
    params: { attempt: i }
  });
  results.push(result.success);
}

const successRate = results.filter(Boolean).length / results.length;
console.log(`성공률: ${(successRate * 100).toFixed(2)}%`);
```

## 비즈니스 로직 패턴

### 검증 파이프라인

```typescript
// 프로필 검증을 위한 UserActions 사용
const { dispatchWithResult } = useUserDispatch();

const result = await dispatchWithResult('updateProfile', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  executionMode: 'sequential',
  result: {
    collect: true,
    strategy: 'merge'
  }
});

if (!result.success) {
  // 모든 검증 오류 수집
  const validationErrors = result.results.errors || [];
  throw new ValidationError('사용자 검증 실패', validationErrors);
}
```

### 데이터 처리 파이프라인

```typescript
// 데이터 변환을 위한 APIActions 사용
const { dispatchWithResult } = useAPIDispatch();

const result = await dispatchWithResult('postData', {
  endpoint: '/api/process-pipeline',
  data: rawData
}, {
  executionMode: 'sequential',
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => {
      // 각 핸들러가 데이터를 변환
      return results.reduce((data, handlerResult) => {
        return handlerResult.transformedData || data;
      }, rawData);
    }
  }
});

console.log('처리된 데이터:', result.results);
```

### 집계 패턴

```typescript
// 지표 집계를 위한 APIActions 사용
const { dispatchWithResult } = useAPIDispatch();

const result = await dispatchWithResult('fetchData', {
  endpoint: '/api/metrics-aggregate',
  params: { period: 'monthly', includeDetails: true }
}, {
  executionMode: 'parallel',
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => ({
      totalUsers: results.reduce((sum, r) => sum + (r.userCount || 0), 0),
      totalRevenue: results.reduce((sum, r) => sum + (r.revenue || 0), 0),
      averageScore: results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length
    })
  }
});
```

## 에러 결과 처리

### 부분 성공 처리

```typescript
// 배치 처리를 위한 APIActions 사용
const { dispatchWithResult } = useAPIDispatch();

const result = await dispatchWithResult('postData', {
  endpoint: '/api/batch-process',
  data: items
}, {
  continueOnError: true,
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => ({
      successful: results.filter(r => r.success),
      failed: results.filter(r => r.error),
      total: results.length
    })
  }
});

console.log(`${result.results.successful.length}/${result.results.total} 항목 처리됨`);
```

### 결과와 함께 재시도

```typescript
// 재시도 패턴이 있는 APIActions 사용
const { dispatchWithResult } = useAPIDispatch();

async function fetchDataWithRetry(endpoint: string, params: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await dispatchWithResult('fetchData', {
      endpoint,
      params
    });
    
    if (result.success) {
      return result;
    }
    
    if (attempt === maxRetries) {
      throw new Error(`${maxRetries}번 시도 후 API 호출 실패`);
    }
    
    // 재시도 전 대기
    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
  }
}
```

## 관련 패턴

- [디스패치 패턴](./dispatch-patterns.md) - 기본 디스패칭 패턴
- [등록 패턴](./register-patterns.md) - 핸들러 등록 패턴
- [타입 시스템](./type-system.md) - TypeScript 통합
- [액션 기본 사용법](./basic-usage.md) - 기본 패턴