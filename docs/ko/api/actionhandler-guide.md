# `ActionHandler` 타입 가이드

파이프라인에서 액션을 처리하기 위한 핸들러 함수 타입입니다.

## 타입 시그니처
```typescript
type ActionHandler<T = any, R = void> = (
  payload: T,
  controller: PipelineController<T, R>
) => R | Promise<R> | void | Promise<void>
```

## 목적
스토어 통합 패턴에 따라 특정 액션을 처리하는 비즈니스 로직 함수를 정의합니다.

## 매개변수

### payload: T
- **타입**: 액션 페이로드 데이터 (`ActionPayloadMap`에서 추론됨)
- **용도**: 핸들러 작업의 입력 데이터
- **유효성 검사**: 액션 정의에 따라 자동으로 타입이 지정됨

### controller: PipelineController<T, R>
- **타입**: 파이프라인 제어 인터페이스
- **용도**: 흐름 제어, 페이로드 수정, 결과 관리
- **기능**: `abort()`, `modifyPayload()`, `setResult()` 등

## 반환 타입

### 동기 핸들러
```typescript
// void 반환 (가장 일반적)
const simpleHandler: ActionHandler<UserData> = (payload, controller) => {
  userStore.setValue(payload);
  controller.setResult({ success: true });
};

// 직접적인 반환 값
const calculationHandler: ActionHandler<NumberInput, number> = (payload) => {
  return payload.a + payload.b;
};
```

### 비동기 핸들러
```typescript
// Promise<void> (비동기 작업)
const asyncHandler: ActionHandler<SaveData> = async (payload, controller) => {
  await saveToDatabase(payload);
  controller.setResult({ saved: true });
};

// Promise<R> (반환 값이 있는 비동기)
const fetchHandler: ActionHandler<FetchRequest, ApiResponse> = async (payload) => {
  const response = await api.get(payload.url);
  return response.data;
};
```

## 사용 패턴

### 스토어 통합 패턴 (권장)
```typescript
const updateUserHandler: ActionHandler<UpdateUserPayload> = async (payload, controller) => {
  // 1. 스토어에서 현재 상태 읽기
  const currentUser = userStore.getValue();
  const settings = settingsStore.getValue();
  
  // 2. 비즈니스 로직 실행
  if (!settings.allowUpdates) {
    controller.abort('업데이트가 비활성화되었습니다');
    return;
  }
  
  const updatedUser = {
    ...currentUser,
    ...payload,
    updatedAt: new Date()
  };
  
  try {
    // 현재 상태로 API 호출
    await userApi.update(updatedUser);
    
    // 3. 새 상태로 스토어 업데이트
    userStore.setValue(updatedUser);
    controller.setResult({ success: true, user: updatedUser });
    
  } catch (error) {
    controller.setResult({ success: false, error: error.message });
  }
};
```

### 유효성 검사 핸들러
```typescript
const validateUserHandler: ActionHandler<UserInput> = (payload, controller) => {
  const errors: string[] = [];
  
  if (!payload.email?.includes('@')) {
    errors.push('잘못된 이메일 형식입니다');
  }
  
  if (!payload.name?.trim()) {
    errors.push('이름은 필수입니다');
  }
  
  if (errors.length > 0) {
    controller.abort(`유효성 검사 실패: ${errors.join(', ')}`);
    return;
  }
  
  // 다음 핸들러를 위해 데이터 정규화
  controller.modifyPayload(data => ({
    ...data,
    email: data.email.toLowerCase(),
    name: data.name.trim()
  }));
};
```

### 사이드 이펙트 핸들러
```typescript
const trackingHandler: ActionHandler<UserAction> = async (payload, controller) => {
  // 분석 추적
  await analytics.track(payload.eventName, {
    userId: payload.userId,
    timestamp: Date.now(),
    metadata: payload.metadata
  });
  
  // 로깅
  console.log(`사용자 액션: ${payload.eventName}`, payload);
  
  // 다른 핸들러를 방해하지 않음
  controller.setResult({ tracked: true });
};
```

### 캐싱 핸들러
```typescript
const cacheHandler: ActionHandler<DataRequest, CachedData> = async (payload, controller) => {
  const cacheKey = `data:${payload.id}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    // 캐시된 데이터 반환, 비용이 많이 드는 핸들러 건너뛰기
    controller.return({
      data: cached,
      source: 'cache',
      timestamp: cached.timestamp
    });
    return;
  }
  
  // 캐시 미스 - 데이터 가져오기 핸들러로 계속 진행
  controller.setResult({ cache: 'miss' });
};
```

### 오류 복구 핸들러
```typescript
const retryHandler: ActionHandler<ApiRequest> = async (payload, controller) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const result = await api.request(payload);
      controller.setResult({ success: true, data: result, attempt });
      return;
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        controller.abort(`${maxRetries}번 시도 후 실패: ${error.message}`);
        return;
      }
      
      // 지수 백오프
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};
```

### 조건부 처리
```typescript
const conditionalHandler: ActionHandler<ProcessRequest> = async (payload, controller) => {
  // 사용자 권한 가져오기
  const user = userStore.getValue();
  
  if (user.role === 'admin') {
    // 관리자 처리 - 전체 접근
    const result = await processWithFullAccess(payload);
    controller.setResult({ level: 'admin', result });
  } else if (user.role === 'user') {
    // 일반 사용자 - 제한된 처리
    const result = await processWithLimitedAccess(payload);
    controller.setResult({ level: 'user', result });
  } else {
    // 게스트 - 중단
    controller.abort('인증이 필요합니다');
    return;
  }
};
```

### 결과 집계
```typescript
const aggregateHandler: ActionHandler<AggregateRequest> = async (payload, controller) => {
  // 다른 핸들러에서 이전 결과 가져오기
  const previousResults = controller.getResults();
  
  // 집계 처리
  const aggregated = previousResults.reduce((acc, result) => {
    if (result.data) {
      acc.items.push(...result.data);
      acc.count += result.data.length;
    }
    return acc;
  }, { items: [], count: 0 });
  
  // 현재 처리 추가
  const currentData = await processData(payload);
  aggregated.items.push(...currentData);
  aggregated.count += currentData.length;
  
  controller.setResult({
    aggregated,
    sources: previousResults.length + 1,
    totalItems: aggregated.count
  });
};
```

## 타입 안전성 이점

### 자동 타입 추론
```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  notifyUser: { message: string; type: 'info' | 'warning' | 'error' };
}

// 페이로드 타입이 자동으로 추론됨
register.register('updateUser', (payload, controller) => {
  // payload는 { id: string; name: string; email: string } 타입으로 지정됨
  console.log(payload.id);    // ✅ TypeScript가 존재를 앎
  console.log(payload.name);  // ✅ TypeScript가 존재를 앎
  console.log(payload.age);   // ❌ TypeScript 오류 - 존재하지 않음
});

register.register('notifyUser', (payload, controller) => {
  // payload는 { message: string; type: 'info' | 'warning' | 'error' } 타입으로 지정됨
  if (payload.type === 'error') { // ✅ 타입 좁히기 작동
    console.error(payload.message);
  }
});
```

### 제네릭 타입 사용
```typescript
// 복잡한 시나리오를 위한 명시적 타이핑
const typedHandler: ActionHandler<
  { data: Array<{ id: string; value: number }> },
  { processed: number; total: number }
> = async (payload, controller) => {
  const processed = payload.data.filter(item => item.value > 0);
  
  return {
    processed: processed.length,
    total: payload.data.length
  };
};
```

## 모범 사례

### 핸들러 구성
```typescript
// 여러 핸들러로 관심사 분리
register.register('processOrder', validateOrderHandler, { priority: 100 });
register.register('processOrder', calculateTotalsHandler, { priority: 200 });
register.register('processOrder', saveOrderHandler, { priority: 300 });
register.register('processOrder', sendNotificationHandler, { priority: 400 });
```

### 오류 처리
```typescript
const safeHandler: ActionHandler<RiskyOperation> = async (payload, controller) => {
  try {
    const result = await riskyOperation(payload);
    controller.setResult({ success: true, data: result });
  } catch (error) {
    // 오류를 기록하지만 파이프라인을 중단하지 않음
    console.error('핸들러 오류:', error);
    controller.setResult({ 
      success: false, 
      error: error.message,
      timestamp: Date.now() 
    });
  }
};
```

### 리소스 정리
```typescript
const resourceHandler: ActionHandler<FileOperation> = async (payload, controller) => {
  let fileHandle;
  
  try {
    fileHandle = await openFile(payload.path);
    const result = await processFile(fileHandle, payload.options);
    controller.setResult({ success: true, result });
  } catch (error) {
    controller.abort(`파일 작업 실패: ${error.message}`);
  } finally {
    if (fileHandle) {
      await closeFile(fileHandle);
    }
  }
};
```

## 통합

- **ActionRegister**: `register()` 메서드에서 주로 사용
- **createActionContext**: React 훅 통합
- **PipelineController**: 실행 제어 인터페이스
- **스토어 통합**: 반응형 상태 관리 패턴

## 링크

- **TypeDoc**: [ActionHandler.md](./core/src/type-aliases/ActionHandler.md)
- **파이프라인 제어**: [PipelineController 가이드](./pipelinecontroller-guide.md)
- **스토어 통합**: [스토어 패턴](/en/guide/patterns/store/)
