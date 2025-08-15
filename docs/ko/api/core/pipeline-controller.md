# PipelineController API

`PipelineController` 클래스는 액션 핸들러를 위한 고급 파이프라인 제어 메서드를 제공하여, 정교한 워크플로우 관리, 페이로드 수정, 결과 수집을 가능하게 합니다.

## 개요

각 액션 핸들러는 두 번째 매개변수로 `PipelineController` 인스턴스를 받아, 실행 파이프라인에 대한 세밀한 제어가 가능합니다:

```typescript
type ActionHandler<TPayload> = (
  payload: TPayload,
  controller: PipelineController
) => any | Promise<any>;
```

## 파이프라인 제어 메서드

### `abort(reason?)`

선택적 중단 이유와 함께 파이프라인 실행을 즉시 중지합니다.

**매개변수:**
- `reason?: string` - 중단 이유 (선택적)

**반환값:** `void`

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (!payload.username) {
    controller.abort('사용자명이 필요합니다');
    return; // 후속 핸들러는 실행되지 않음
  }
});
```

**사용 사례:**
- 입력 검증 실패
- 보안 검사 실패
- 조기 종료 조건
- 에러 상태 처리

### `return(value)`

특정 반환값으로 파이프라인 실행을 조기 종료합니다.

**매개변수:**
- `value: any` - 파이프라인의 반환값

**반환값:** `void`

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (isAlreadyAuthenticated(payload.username)) {
    controller.return({ alreadyAuthenticated: true, user: getCurrentUser() });
    return; // 파이프라인이 성공으로 여기서 종료됨
  }
});
```

**`abort()`와의 차이점:**
- `return()`은 파이프라인을 결과와 함께 성공으로 표시
- `abort()`는 파이프라인을 실패/중단으로 표시

## 페이로드 관리

### `modifyPayload(modifier)`

파이프라인의 후속 핸들러를 위해 페이로드를 변환합니다.

**매개변수:**
- `modifier: (current: TPayload) => TPayload` - 페이로드 변환 함수

**반환값:** `void`

```typescript
actionRegister.register('processData', (payload, controller) => {
  // 페이로드에 메타데이터 추가
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    processed: true,
    version: '2.0'
  }));
  
  return { step: 'enrichment', completed: true };
}, { priority: 100 });

actionRegister.register('processData', (payload) => {
  // 페이로드에 이제 timestamp, processed, version이 포함됨
  console.log(payload.timestamp); // 현재 타임스탬프
  console.log(payload.processed); // true
}, { priority: 50 });
```

**베스트 프랙티스:**
- 메타데이터 추가 (타임스탬프, 사용자 컨텍스트, 처리 플래그)
- 계산된 값으로 페이로드 강화
- 데이터 형식 정규화 또는 검증
- 다운스트림 핸들러를 위한 컨텍스트 정보 추가

### `getPayload()`

이전 핸들러들이 만든 수정사항을 포함한 현재 페이로드를 가져옵니다.

**반환값:** `TPayload` - 현재 페이로드 상태

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  // 이전 핸들러가 페이로드를 수정했을 수 있음
  const currentPayload = controller.getPayload();
  
  if (currentPayload.processed) {
    // 이미 처리된 파일 처리
  }
  
  return { step: 'upload', fileId: generateId() };
});
```

## 결과 관리

### `setResult(result)`

후속 핸들러에서 액세스할 수 있는 중간 결과를 설정합니다.

**매개변수:**
- `result: any` - 저장할 결과 값

**반환값:** `void`

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  // 파일 검증
  const validation = validateFile(payload.filename, payload.content);
  
  // 다른 핸들러를 위해 검증 결과 저장
  controller.setResult({ 
    step: 'validation', 
    isValid: validation.isValid,
    fileSize: validation.size 
  });
  
  return validation;
}, { priority: 100, id: 'validator' });
```

### `getResults()`

이전에 실행된 핸들러들의 모든 결과를 가져옵니다.

**반환값:** `any[]` - 이전 핸들러들의 결과 배열

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  const previousResults = controller.getResults();
  
  // 검증 결과 찾기
  const validationResult = previousResults.find(r => r.step === 'validation');
  
  if (validationResult?.isValid) {
    // 업로드 진행
    return { step: 'upload', success: true };
  }
  
  controller.abort('파일 검증 실패');
}, { priority: 50, id: 'uploader' });
```

## 고급 패턴

### 다단계 검증 파이프라인

```typescript
interface ValidationActions extends ActionPayloadMap {
  validateUser: { id: string; name: string; email: string };
}

const validationRegister = new ActionRegister<ValidationActions>();

// 1단계: 기본 검증
validationRegister.register('validateUser', (payload, controller) => {
  const errors: string[] = [];
  
  if (!payload.name) errors.push('이름이 필요합니다');
  if (!payload.email) errors.push('이메일이 필요합니다');
  
  if (errors.length > 0) {
    controller.abort(`검증 실패: ${errors.join(', ')}`);
    return;
  }
  
  controller.setResult({ step: 'basic', valid: true });
  return { basicValidation: true };
}, { priority: 100, id: 'basic-validator' });

// 2단계: 이메일 형식 검증
validationRegister.register('validateUser', (payload, controller) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(payload.email)) {
    controller.abort('잘못된 이메일 형식');
    return;
  }
  
  controller.setResult({ step: 'email', valid: true });
  return { emailValidation: true };
}, { priority: 90, id: 'email-validator' });

// 3단계: 데이터베이스 고유성 검사
validationRegister.register('validateUser', async (payload, controller) => {
  const existingUser = await checkUserExists(payload.email);
  
  if (existingUser) {
    controller.abort('이메일이 이미 존재합니다');
    return;
  }
  
  controller.setResult({ step: 'uniqueness', valid: true });
  return { uniquenessValidation: true };
}, { priority: 80, id: 'uniqueness-validator' });
```

### 결과 집계 패턴

```typescript
actionRegister.register('processOrder', async (payload, controller) => {
  const results = controller.getResults();
  
  // 모든 검증 결과 집계
  const validationSteps = results.filter(r => r.step);
  const allValid = validationSteps.every(step => step.valid);
  
  if (!allValid) {
    controller.abort('주문 검증 실패');
    return;
  }
  
  // 모든 처리 결과 결합
  const processingResults = {
    validations: validationSteps,
    processed: true,
    orderId: generateOrderId(),
    timestamp: Date.now()
  };
  
  controller.setResult(processingResults);
  return processingResults;
}, { priority: 10, id: 'aggregator' });
```

### 조건부 핸들러 실행

```typescript
actionRegister.register('processPayment', async (payload, controller) => {
  // 이전 검증이 통과한 경우에만 처리
  const results = controller.getResults();
  const validationPassed = results.some(r => r.step === 'validation' && r.valid);
  
  if (!validationPassed) {
    // 이 핸들러 건너뛰기
    return { step: 'payment', skipped: true };
  }
  
  // 결제 처리
  const paymentResult = await paymentProcessor.charge({
    amount: payload.amount,
    card: payload.cardToken
  });
  
  return { 
    step: 'payment', 
    success: paymentResult.success,
    transactionId: paymentResult.id 
  };
}, { 
  priority: 70, 
  id: 'payment-processor',
  condition: (payload) => payload.amount > 0 // 추가 조건 검사
});
```

## 에러 처리

PipelineController는 에러 처리를 위한 여러 메커니즘을 제공합니다:

### 우아한 에러 처리

```typescript
actionRegister.register('uploadFile', async (payload, controller) => {
  try {
    // 위험한 작업
    const result = await uploadToCloud(payload.file);
    
    controller.setResult({ step: 'upload', success: true, url: result.url });
    return result;
    
  } catch (error) {
    // 에러 로그는 남기지만 중단하지 않음 - 다른 핸들러가 시도하도록 함
    controller.setResult({ 
      step: 'upload', 
      success: false, 
      error: (error as Error).message 
    });
    
    // 파이프라인 계속 - 폴백 핸들러가 성공할 수 있음
    return { uploadFailed: true, error: (error as Error).message };
  }
}, { priority: 80, id: 'primary-uploader' });

// 폴백 핸들러
actionRegister.register('uploadFile', async (payload, controller) => {
  const results = controller.getResults();
  const uploadFailed = results.some(r => r.uploadFailed);
  
  if (uploadFailed) {
    // 대안 업로드 방법 시도
    const fallbackResult = await uploadToFallbackService(payload.file);
    return { step: 'fallback-upload', success: true, url: fallbackResult.url };
  }
  
  // 주 업로드가 성공, 폴백 건너뛰기
  return { step: 'fallback-upload', skipped: true };
}, { priority: 50, id: 'fallback-uploader' });
```

## ActionRegister와의 통합

PipelineController는 핸들러 실행 중에 ActionRegister에 의해 자동으로 제공됩니다:

```typescript
const register = new ActionRegister<MyActions>();

// 핸들러가 자동으로 컨트롤러를 받음
register.register('myAction', (payload, controller) => {
  // 컨트롤러가 자동으로 제공됨
  // 모든 PipelineController 메서드에 완전 액세스
});

// 디스패치가 컨트롤러와 함께 핸들러를 트리거
await register.dispatch('myAction', { data: 'test' });
```

## 관련 자료

- **[ActionRegister API](./action-register.md)** - 핵심 액션 파이프라인 시스템
- **[액션 컨텍스트](../react/action-context.md)** - React 통합
- **[액션 파이프라인 가이드](../../guide/action-pipeline.md)** - 사용 가이드 및 예제