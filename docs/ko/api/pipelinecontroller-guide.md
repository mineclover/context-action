# `PipelineController` 인터페이스 가이드

파이프라인의 액션 핸들러를 위한 실행 제어 인터페이스입니다.

## 목적
핸들러에게 파이프라인 실행, 페이로드 수정, 결과 관리 및 흐름 제어에 대한 강력한 제어 기능을 제공합니다.

## 핵심 메서드

### abort()
```typescript
abort(reason?: string): void
```
- **목적**: 파이프라인 실행 즉시 중지
- **용도**: 유효성 검사 실패, 오류 조건, 조기 종료
- **효과**: 후속 핸들러가 실행되지 않음

### modifyPayload()
```typescript
modifyPayload(modifier: (payload: T) => T): void
```
- **목적**: 후속 핸들러를 위한 페이로드 변환
- **용도**: 데이터 정규화, 보강, 전처리
- **효과**: 다음 핸들러는 수정된 페이로드를 받음

### getPayload()
```typescript
getPayload(): T
```
- **목적**: 현재 페이로드 상태 접근
- **용도**: 수정 후 현재 페이로드 읽기
- **반환**: 현재 페이로드 (이전 핸들러에 의해 수정되었을 수 있음)

## 흐름 제어

### jumpToPriority()
```typescript
jumpToPriority(priority: number): void
```
- **목적**: 특정 우선순위 수준의 핸들러로 건너뛰기
- **용도**: 조건부 라우팅, 보안 에스컬레이션
- **효과**: 현재 우선순위와 대상 우선순위 사이의 핸들러를 건너뜀

### return()
```typescript
return(result: R): void
```
- **목적**: 결과 반환 및 파이프라인 종료
- **용도**: 데이터와 함께 조기 반환, 캐시 히트, 단락 패턴
- **효과**: 파이프라인이 중지되고 이 결과를 반환함

## 결과 관리

### setResult()
```typescript
setResult(result: R): void
```
- **목적**: 결과 설정 후 파이프라인 계속 진행
- **용도**: 중간 결과, 단계별 처리
- **효과**: 결과가 수집되고 파이프라인이 계속됨

### getResults()
```typescript
getResults(): R[]
```
- **목적**: 이전 모든 핸들러 결과 접근
- **용도**: 집계, 이전 결과에 대한 의존성
- **반환**: 실행된 핸들러의 결과 배열

### mergeResult()
```typescript
mergeResult(merger: (previousResults: R[], currentResult: R) => R): void
```
- **목적**: 사용자 정의 결과 병합 로직
- **용도**: 복잡한 결과 집계, 사용자 정의 병합 전략
- **효과**: 현재 결과를 이전 결과와 병합함

## 사용 패턴

### 유효성 검사 및 조기 중단
```typescript
register.register('validateUser', async (payload, controller) => {
  // 입력 유효성 검사
  if (!payload.email?.includes('@')) {
    controller.abort('잘못된 이메일 형식입니다');
    return; // 파이프라인이 여기서 중지됨
  }
  
  if (!payload.id) {
    controller.abort('사용자 ID가 필요합니다');
    return;
  }
  
  // 유효성 검사가 통과되면 다음 핸들러로 계속 진행
});
```

### 페이로드 변환
```typescript
register.register('normalizeData', async (payload, controller) => {
  controller.modifyPayload(data => ({
    ...data,
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    timestamp: Date.now(),
    processed: true
  }));
  
  // 다음 핸들러는 정규화된 페이로드를 받음
});
```

### 캐싱 및 조기 반환
```typescript
register.register('checkCache', async (payload, controller) => {
  const cached = await cache.get(payload.key);
  
  if (cached) {
    // 캐시된 데이터 반환, 비용이 많이 드는 핸들러 건너뛰기
    controller.return({ 
      data: cached, 
      source: 'cache',
      timestamp: cached.timestamp 
    });
    return; // 파이프라인이 이 결과로 종료됨
  }
  
  // 캐시 미스 - 데이터 가져오기 핸들러로 계속 진행
});
```

### 조건부 라우팅
```typescript
register.register('routeRequest', async (payload, controller) => {
  if (payload.requiresElevatedPermissions) {
    // 높은 우선순위 보안 핸들러로 건너뛰기
    controller.jumpToPriority(1000);
  } else if (payload.isBatchOperation) {
    // 배치 처리 핸들러로 건너뛰기  
    controller.jumpToPriority(500);
  }
  
  // 그렇지 않으면 정상적인 흐름으로 계속 진행
}, { priority: 100 });
```

### 결과 집계
```typescript
register.register('collectResults', async (payload, controller) => {
  // 이전 모든 결과 가져오기
  const previousResults = controller.getResults();
  
  // 처리 및 집계
  const aggregated = previousResults.reduce((acc, result) => ({
    ...acc,
    ...result,
    count: acc.count + 1
  }), { count: 0 });
  
  controller.setResult(aggregated);
});
```

### 고급 결과 병합
```typescript
register.register('mergeData', async (payload, controller) => {
  const currentResult = await processData(payload);
  
  // 사용자 정의 병합 전략
  controller.mergeResult((previousResults, current) => {
    const allData = previousResults.flatMap(r => r.data || []);
    return {
      data: [...allData, ...current.data],
      totalCount: allData.length + current.data.length,
      sources: [...new Set([...previousResults.map(r => r.source), current.source])]
    };
  });
});
```

### 다단계 처리
```typescript
register.register('step1-authenticate', async (payload, controller) => {
  const user = await authenticate(payload.token);
  
  controller.modifyPayload(data => ({ ...data, user }));
  controller.setResult({ step: 1, authenticated: true });
}, { priority: 100 });

register.register('step2-authorize', async (payload, controller) => {
  const currentPayload = controller.getPayload();
  const permissions = await authorize(currentPayload.user, payload.action);
  
  if (!permissions.allowed) {
    controller.abort('권한이 부족합니다');
    return;
  }
  
  controller.modifyPayload(data => ({ ...data, permissions }));
  controller.setResult({ step: 2, authorized: true });
}, { priority: 200 });

register.register('step3-execute', async (payload, controller) => {
  const currentPayload = controller.getPayload();
  const result = await executeAction(currentPayload);
  
  const previousResults = controller.getResults();
  controller.setResult({ 
    step: 3, 
    result, 
    pipeline: { steps: previousResults.length + 1 }
  });
}, { priority: 300 });
```

## 모범 사례

### 오류 처리
```typescript
register.register('safeHandler', async (payload, controller) => {
  try {
    const result = await riskyOperation(payload);
    controller.setResult(result);
  } catch (error) {
    // 중단하지 않음 - 오류 처리 미들웨어에서 처리하도록 함
    controller.setResult({ 
      error: true, 
      message: error.message,
      timestamp: Date.now() 
    });
  }
});
```

### 조건부 로직
```typescript
register.register('conditionalProcessor', async (payload, controller) => {
  if (payload.skipProcessing) {
    // 이 핸들러를 건너뛰지만 파이프라인은 계속 진행
    return;
  }
  
  if (payload.fastTrack) {
    // 빠른 경로 - 중간 핸들러 건너뛰기
    const result = await quickProcess(payload);
    controller.return(result);
    return;
  }
  
  // 정상 처리
  const result = await normalProcess(payload);
  controller.setResult(result);
});
```

### 페이로드 유효성 검사 체인
```typescript
// 유효성 검사 핸들러 체인
register.register('validateRequired', async (payload, controller) => {
  const required = ['id', 'email', 'name'];
  const missing = required.filter(field => !payload[field]);
  
  if (missing.length > 0) {
    controller.abort(`필수 필드 누락: ${missing.join(', ')}`);
    return;
  }
}, { priority: 10 });

register.register('validateFormat', async (payload, controller) => {
  if (payload.email && !isValidEmail(payload.email)) {
    controller.abort('잘못된 이메일 형식입니다');
    return;
  }
  
  // 다음 핸들러를 위해 정규화
  controller.modifyPayload(data => ({
    ...data,
    email: data.email.toLowerCase()
  }));
}, { priority: 20 });
```

## 통합

- **ActionRegister**: 핸들러에 두 번째 매개변수로 제공됨
- **Handler Functions**: 비즈니스 로직의 기본 인터페이스
- **Type Safety**: 페이로드 및 결과에 대한 제네릭 타입 `<T, R>`
- **Pipeline Control**: 고급 액션 패턴을 위한 핵심 메커니즘

## 링크

- **TypeDoc**: [PipelineController.md](./core/src/interfaces/PipelineController.md)  
- **액션 핸들러**: [ActionHandler 가이드](./actionhandler-guide.md)
- **사용 예제**: [액션 패턴](/en/guide/patterns/action/)
