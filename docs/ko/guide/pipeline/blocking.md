# 차단 작업

차단 및 비차단 핸들러 구성으로 파이프라인 실행 플로우를 제어합니다.

## 차단 vs 비차단

### 차단 핸들러 (기본값)

차단 핸들러는 다음 핸들러로 진행하기 전에 **완료를 기다립니다**:

```typescript
// ✅ 차단 핸들러 - 비동기 완료를 기다림
actionRegister.register('processData', async (payload) => {
  await heavyProcessing(payload.data);  // 파이프라인이 기다림
  return { step: 'processing', completed: true };
}, { 
  priority: 80,
  blocking: true  // 기본 동작
});
```

### 비차단 핸들러

비차단 핸들러는 파이프라인을 중지하지 않고 **백그라운드에서** 실행됩니다:

```typescript
// ⚡ 비차단 핸들러 - 발사 후 망각
actionRegister.register('processData', async (payload) => {
  // 이것은 백그라운드에서 실행되고, 파이프라인은 즉시 계속됨
  await sendAnalyticsInBackground(payload.data);
  return { step: 'analytics', sent: true };
}, { 
  priority: 30,
  blocking: false  // 명시적으로 비차단
});
```

## 차단 구성

### 핸들러 레벨 차단

핸들러별로 차단 동작을 구성합니다:

```typescript
interface OrderActions extends ActionPayloadMap {
  processOrder: { orderId: string; items: Item[] };
}

const orderRegister = new ActionRegister<OrderActions>();

// 차단: 완료해야 하는 중요한 작업
orderRegister.register('processOrder', validateOrder, { 
  priority: 100, 
  blocking: true   // 검증을 기다림
});

orderRegister.register('processOrder', chargePayment, { 
  priority: 90, 
  blocking: true   // 결제를 기다림
});

orderRegister.register('processOrder', updateInventory, { 
  priority: 80, 
  blocking: true   // 재고 업데이트를 기다림
});

// 비차단: 선택적 작업
orderRegister.register('processOrder', sendConfirmationEmail, { 
  priority: 40, 
  blocking: false  // 이메일을 기다리지 않음
});

orderRegister.register('processOrder', trackAnalytics, { 
  priority: 30, 
  blocking: false  // 분석을 기다리지 않음
});

orderRegister.register('processOrder', auditLog, { 
  priority: 20, 
  blocking: false  // 로깅을 기다리지 않음
});
```

### 레지스트리 레벨 기본값

전체 레지스트리에 대한 기본 차단 동작을 설정합니다:

```typescript
const actionRegister = new ActionRegister<MyActions>({
  name: 'MyApp',
  registry: {
    defaultBlocking: false,  // 기본적으로 모든 핸들러가 비차단
    defaultExecutionMode: 'sequential'
  }
});

// 특정 핸들러에 대해 기본값 재정의
actionRegister.register('criticalAction', handler, { 
  blocking: true  // 레지스트리 기본값 재정의
});
```

## 실행 플로우 예제

### 예제 1: 혼합 차단/비차단

```typescript
const executionLog: string[] = [];

// 차단 핸들러
actionRegister.register('mixedOperation', () => {
  executionLog.push('핸들러 A 시작');
  return new Promise(resolve => {
    setTimeout(() => {
      executionLog.push('핸들러 A 완료');
      resolve({ step: 'A', duration: 100 });
    }, 100);
  });
}, { priority: 100, blocking: true });

actionRegister.register('mixedOperation', () => {
  executionLog.push('핸들러 B 시작');
  return new Promise(resolve => {
    setTimeout(() => {
      executionLog.push('핸들러 B 완료');
      resolve({ step: 'B', duration: 50 });
    }, 50);
  });
}, { priority: 90, blocking: true });

// 비차단 핸들러
actionRegister.register('mixedOperation', () => {
  executionLog.push('핸들러 C 시작');
  return new Promise(resolve => {
    setTimeout(() => {
      executionLog.push('핸들러 C 완료');
      resolve({ step: 'C', duration: 200 });
    }, 200);
  });
}, { priority: 80, blocking: false });

actionRegister.register('mixedOperation', () => {
  executionLog.push('핸들러 D 시작');
  return { step: 'D', immediate: true };
}, { priority: 70, blocking: true });

await actionRegister.dispatch('mixedOperation', {});

console.log(executionLog);
// 결과:
// [
//   '핸들러 A 시작',
//   '핸들러 A 완료',    // A가 B 시작 전에 완료
//   '핸들러 B 시작', 
//   '핸들러 B 완료',    // B가 C 시작 전에 완료
//   '핸들러 C 시작',    // C가 시작하지만 차단하지 않음
//   '핸들러 D 시작',    // C 시작 직후 D가 즉시 시작
//   '핸들러 C 완료'     // C가 백그라운드에서 완료
// ]
```

### 예제 2: 성능 중요 파이프라인

```typescript
interface PerformanceActions extends ActionPayloadMap {
  optimizedOperation: { data: LargeDataSet };
}

const perfRegister = new ActionRegister<PerformanceActions>();

// 중요한 경로 - 모두 차단
perfRegister.register('optimizedOperation', validateData, { 
  priority: 100, 
  blocking: true   // 처리 전에 검증해야 함
});

perfRegister.register('optimizedOperation', processData, { 
  priority: 90, 
  blocking: true   // 반환 전에 처리해야 함
});

perfRegister.register('optimizedOperation', cacheResult, { 
  priority: 80, 
  blocking: true   // 응답 전에 캐시해야 함
});

// 성능 모니터링 - 비차단
perfRegister.register('optimizedOperation', trackPerformance, { 
  priority: 30, 
  blocking: false  // 메트릭을 위해 응답을 지연시키지 않음
});

perfRegister.register('optimizedOperation', updateStatistics, { 
  priority: 20, 
  blocking: false  // 백그라운드 통계 업데이트
});

// 결과: 중요한 작업이 먼저 완료되고, 모니터링은 백그라운드에서 실행
```

## 고급 차단 패턴

### 조건부 차단

```typescript
actionRegister.register('conditionalOperation', async (payload, controller) => {
  const results = controller.getResults();
  const needsBlocking = shouldBlock(payload, results);
  
  if (needsBlocking) {
    // 동기 작업
    const result = await processSync(payload.data);
    return { step: 'conditional', mode: 'sync', result };
  } else {
    // 발사 후 망각
    processAsync(payload.data);
    return { step: 'conditional', mode: 'async', started: true };
  }
}, { 
  priority: 70,
  blocking: true  // 핸들러 자체는 차단이지만 내부 로직은 다양함
});
```

### 구성을 사용한 동적 차단

```typescript
interface ConfigurableActions extends ActionPayloadMap {
  flexibleOperation: { 
    data: any; 
    config: { 
      waitForCompletion: boolean;
      timeoutMs?: number;
    };
  };
}

actionRegister.register('flexibleOperation', async (payload, controller) => {
  const operation = performOperation(payload.data);
  
  if (payload.config.waitForCompletion) {
    // 완료를 기다림
    const result = await operation;
    return { step: 'flexible', mode: 'waited', result };
  } else {
    // 즉시 계속
    operation.then(result => {
      // 백그라운드에서 결과 처리
      controller.setResult({ step: 'background', result });
    });
    return { step: 'flexible', mode: 'background', started: true };
  }
}, { 
  priority: 70,
  blocking: true  // 핸들러는 페이로드 구성에 따라 기다림
});
```

## 성능 고려사항

### 차단을 사용해야 하는 경우

✅ **차단 사용:**
- 후속 핸들러에 영향을 주는 중요한 검증
- 완료해야 하는 보안 검사
- 나중 핸들러에 필요한 데이터 변환  
- 순서가 중요한 작업
- 즉각적인 피드백이 필요한 오류가 발생하기 쉬운 작업

### 비차단을 사용해야 하는 경우

⚡ **비차단 사용:**
- 분석 및 추적
- 감사 로깅
- 성능 모니터링
- 이메일 알림
- 백그라운드 정리
- 선택적 개선 사항

### 성능 영향

```typescript
// 차단 파이프라인 - 총 실행 시간은 모든 핸들러의 합
const blockingDuration = handler1Time + handler2Time + handler3Time;

// 비차단 파이프라인 - 실행 시간은 가장 긴 차단 핸들러
const nonBlockingDuration = Math.max(
  blockingHandler1Time + blockingHandler2Time,  // 순차 차단
  nonBlockingHandler1Time,                      // 병렬 비차단
  nonBlockingHandler2Time                       // 병렬 비차단
);
```

## 차단을 사용한 오류 처리

### 차단 핸들러 오류

```typescript
actionRegister.register('sensitiveOperation', async (payload, controller) => {
  try {
    await criticalOperation(payload.data);
    return { step: 'critical', success: true };
  } catch (error) {
    // 차단 핸들러 오류는 파이프라인을 중지시킴
    controller.abort(`중요한 작업 실패: ${error.message}`);
  }
}, { priority: 100, blocking: true });
```

### 비차단 핸들러 오류

```typescript
actionRegister.register('sensitiveOperation', async (payload) => {
  try {
    await backgroundOperation(payload.data);
    return { step: 'background', success: true };
  } catch (error) {
    // 비차단 핸들러 오류는 파이프라인을 중지시키지 않음
    console.error('백그라운드 작업 실패:', error);
    return { step: 'background', success: false, error: error.message };
  }
}, { priority: 30, blocking: false });
```

## 실제 예제: API 차단 데모

[API 차단 데모](https://mineclover.github.io/context-action/example/actionguard/api-blocking)에서 차단 작업의 포괄적인 구현을 확인하세요:

```typescript
// API 호출 전에 완료해야 하는 차단 속도 제한기
useApiActionHandler('rateLimit', rateLimitHandler, { 
  priority: 100, 
  blocking: true 
});

// 속도 제한 허가를 기다리는 차단 API 호출
useApiActionHandler('apiCall', apiHandler, { 
  priority: 80, 
  blocking: true 
});

// 백그라운드에서 실행되는 비차단 분석
useApiActionHandler('trackMetrics', metricsHandler, { 
  priority: 20, 
  blocking: false 
});
```

이 예제는 최적의 API 관리를 위한 차단 vs 비차단 패턴을 사용한 실제 속도 제한을 보여줍니다.

## 관련 문서

- **[우선순위 시스템](./priority.md)** - 우선순위 기반 실행 순서
- **[중단 메커니즘](./abort.md)** - 필요시 파이프라인 실행 중지
- **[결과 처리](./result-handling.md)** - 핸들러 결과 수집과 사용
- **[디스패치 메서드](./dispatch.md)** - 파이프라인을 트리거하는 다양한 방법