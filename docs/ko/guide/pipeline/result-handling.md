# 고급 결과 처리

복잡한 데이터 집계 및 변환 패턴을 가능하게 하는 Context-Action 파이프라인을 위한 정교한 결과 수집, 병합 및 처리 전략.

## 결과 수집 메서드

### controller.setResult()

다른 핸들러가 액세스할 수 있는 중간 결과 저장:

```typescript
actionRegister.register('processOrder', async (payload, controller) => {
  // 주문 검증
  const validation = await validateOrder(payload.order);
  
  // 다른 핸들러를 위한 검증 결과 저장
  controller.setResult({ 
    step: 'validation', 
    valid: validation.isValid,
    errors: validation.errors,
    orderId: payload.order.id
  });
  
  if (!validation.isValid) {
    controller.abort('주문 검증 실패');
    return;
  }
  
  return { step: 'order-validation', success: true };
}, { priority: 100, id: 'validator' });
```

### controller.getResults()

이전에 실행된 핸들러의 결과에 액세스:

```typescript
actionRegister.register('processOrder', async (payload, controller) => {
  // 검증 핸들러의 결과 가져오기
  const previousResults = controller.getResults();
  const validationResult = previousResults.find(r => r.step === 'validation');
  
  if (!validationResult?.valid) {
    controller.abort('유효하지 않은 주문을 처리할 수 없습니다');
    return;
  }
  
  // 처리를 위해 검증 데이터 사용
  const processed = await processValidOrder(
    payload.order, 
    validationResult.orderId
  );
  
  controller.setResult({ 
    step: 'processing', 
    processedAt: Date.now(),
    orderId: validationResult.orderId
  });
  
  return { step: 'order-processing', result: processed };
}, { priority: 90, id: 'processor' });
```

### controller.mergeResult()

사용자 정의 로직을 사용하여 현재 결과를 이전 결과와 병합:

```typescript
interface ReportActions extends ActionPayloadMap {
  generateReport: { sections: string[] };
}

// 섹션 1: 사용자 데이터
actionRegister.register('generateReport', async (payload, controller) => {
  const userData = await getUserData();
  
  controller.setResult({
    section: 'users',
    data: userData,
    count: userData.length
  });
}, { priority: 100, id: 'user-section' });

// 섹션 2: 이전 결과와 병합
actionRegister.register('generateReport', async (payload, controller) => {
  const revenueData = await getRevenueData();
  
  // 사용자 정의 병합 전략: 섹션을 보고서로 결합
  controller.mergeResult((previousResults, currentResult) => {
    return {
      reportType: 'combined',
      generatedAt: Date.now(),
      sections: [...previousResults, currentResult],
      summary: {
        totalSections: previousResults.length + 1,
        totalUsers: previousResults.find(r => r.section === 'users')?.count || 0,
        totalRevenue: currentResult.data.total
      }
    };
  });
  
  return {
    section: 'revenue',
    data: revenueData,
    total: revenueData.reduce((sum, item) => sum + item.amount, 0)
  };
}, { priority: 90, id: 'revenue-section' });
```

## 결과 유형

### 핸들러 반환값

각 핸들러는 결과의 일부가 되는 값을 반환할 수 있습니다:

```typescript
actionRegister.register('uploadFile', async (payload) => {
  const fileId = await uploadToStorage(payload.file);
  
  // 이 반환값은 디스패치 결과에 수집됩니다
  return { 
    step: 'upload',
    fileId,
    size: payload.file.size,
    uploadedAt: Date.now()
  };
});

actionRegister.register('uploadFile', async (payload, controller) => {
  const results = controller.getResults();
  const uploadResult = results.find(r => r.step === 'upload');
  
  // 데이터베이스 레코드 생성
  const record = await createFileRecord({
    fileId: uploadResult.fileId,
    originalName: payload.file.name,
    size: uploadResult.size
  });
  
  return {
    step: 'database',
    recordId: record.id,
    fileId: uploadResult.fileId
  };
});
```

### 중간 결과

반환할 필요가 없는 데이터에 대해서는 `controller.setResult()` 사용:

```typescript
actionRegister.register('complexOperation', async (payload, controller) => {
  // 단계 1: 데이터 준비
  const prepared = await prepareData(payload.input);
  controller.setResult({ 
    step: 'preparation', 
    dataSize: prepared.length,
    preparedAt: Date.now()
  });
  
  // 단계 2: 준비된 데이터 검증
  const validation = validatePreparedData(prepared);
  controller.setResult({ 
    step: 'validation', 
    valid: validation.isValid,
    issues: validation.issues
  });
  
  if (!validation.isValid) {
    controller.abort('준비된 데이터 검증 실패');
    return;
  }
  
  // 단계 3: 처리
  const result = await processData(prepared);
  
  // 최종 결과 반환
  return { 
    step: 'processing', 
    success: true,
    result,
    processedItems: result.length
  };
});
```

## 결과 수집 패턴

### 순차적 결과 구축

```typescript
interface AnalysisActions extends ActionPayloadMap {
  analyzeData: { dataset: any[]; analysisType: string };
}

// 핸들러 1: 데이터 정리
actionRegister.register('analyzeData', (payload, controller) => {
  const cleaned = cleanDataset(payload.dataset);
  
  controller.modifyPayload(current => ({
    ...current,
    dataset: cleaned  // 후속 핸들러를 위해 페이로드 업데이트
  }));
  
  controller.setResult({ 
    step: 'cleaning', 
    originalCount: payload.dataset.length,
    cleanedCount: cleaned.length,
    removedCount: payload.dataset.length - cleaned.length
  });
  
  return { step: 'data-cleaning', success: true };
}, { priority: 100, id: 'cleaner' });

// 핸들러 2: 통계 분석
actionRegister.register('analyzeData', (payload, controller) => {
  const results = controller.getResults();
  const cleaningResult = results.find(r => r.step === 'cleaning');
  
  const stats = calculateStatistics(payload.dataset);
  
  controller.setResult({ 
    step: 'statistics', 
    mean: stats.mean,
    median: stats.median,
    stdDev: stats.standardDeviation,
    dataPoints: cleaningResult.cleanedCount
  });
  
  return { step: 'statistical-analysis', stats };
}, { priority: 90, id: 'statistician' });

// 핸들러 3: 보고서 생성
actionRegister.register('analyzeData', (payload, controller) => {
  const results = controller.getResults();
  const cleaningResult = results.find(r => r.step === 'cleaning');
  const statsResult = results.find(r => r.step === 'statistics');
  
  const report = generateAnalysisReport({
    analysisType: payload.analysisType,
    originalDataCount: cleaningResult.originalCount,
    processedDataCount: cleaningResult.cleanedCount,
    statistics: {
      mean: statsResult.mean,
      median: statsResult.median,
      standardDeviation: statsResult.stdDev
    },
    generatedAt: Date.now()
  });
  
  return { 
    step: 'reporting', 
    success: true,
    reportId: report.id,
    reportUrl: report.url
  };
}, { priority: 80, id: 'reporter' });
```

### 결과 집계

```typescript
actionRegister.register('batchOperation', async (payload, controller) => {
  const items = payload.items;
  const batchResults = [];
  
  // 각 항목을 처리하고 결과 수집
  for (const item of items) {
    try {
      const result = await processItem(item);
      batchResults.push({ itemId: item.id, success: true, result });
    } catch (error) {
      batchResults.push({ 
        itemId: item.id, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  // 집계된 결과 저장
  controller.setResult({ 
    step: 'batch-processing', 
    totalItems: items.length,
    successful: batchResults.filter(r => r.success).length,
    failed: batchResults.filter(r => !r.success).length,
    results: batchResults
  });
  
  return { 
    step: 'batch-complete', 
    success: true,
    summary: {
      total: items.length,
      successful: batchResults.filter(r => r.success).length,
      failed: batchResults.filter(r => !r.success).length
    }
  };
}, { priority: 80, id: 'batch-processor' });
```

## React 통합

### 결과 기반 UI 업데이트

```typescript
function ResultDrivenComponent() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  const [operationState, setOperationState] = useState<{
    loading: boolean;
    results: any[];
    error?: string;
  }>({ loading: false, results: [] });
  
  const handleComplexOperation = async () => {
    setOperationState({ loading: true, results: [] });
    
    try {
      const result = await dispatchWithResult('complexOperation', 
        { data: 'input-data' },
        { result: { collect: true } }
      );
      
      if (result.aborted) {
        setOperationState({ 
          loading: false, 
          results: result.results,
          error: result.abortReason 
        });
        return;
      }
      
      if (result.success) {
        setOperationState({ 
          loading: false, 
          results: result.results 
        });
      }
      
    } catch (error) {
      setOperationState({ 
        loading: false, 
        results: [],
        error: '작업 실패'
      });
    }
  };
  
  return (
    <div>
      <button 
        onClick={handleComplexOperation} 
        disabled={operationState.loading}
      >
        {operationState.loading ? '처리 중...' : '작업 시작'}
      </button>
      
      {operationState.error && (
        <div className="error">오류: {operationState.error}</div>
      )}
      
      {operationState.results.length > 0 && (
        <div className="results">
          <h3>작업 단계:</h3>
          {operationState.results.map((result, index) => (
            <div key={index} className="result-step">
              ✅ {result.step}: {JSON.stringify(result)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 진행률 추적

```typescript
function ProgressTrackingComponent() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  const [progress, setProgress] = useState<{
    currentStep: string;
    completedSteps: string[];
    totalSteps: number;
  }>({ currentStep: '', completedSteps: [], totalSteps: 0 });
  
  const handleProgressOperation = async () => {
    const result = await dispatchWithResult('multiStepOperation', 
      { data: 'complex-data' },
      { 
        result: { 
          collect: true,
          onProgress: (currentResult) => {
            // 핸들러가 완료되면서 실시간으로 진행률 업데이트
            setProgress(prev => ({
              currentStep: currentResult.step,
              completedSteps: [...prev.completedSteps, currentResult.step],
              totalSteps: prev.totalSteps + 1
            }));
          }
        }
      }
    );
    
    if (result.success) {
      setProgress(prev => ({
        ...prev,
        currentStep: '완료'
      }));
    }
  };
  
  return (
    <div>
      <button onClick={handleProgressOperation}>다단계 시작</button>
      
      <div className="progress">
        <div>현재: {progress.currentStep}</div>
        <div>진행률: {progress.completedSteps.length}/{progress.totalSteps}</div>
        
        <div className="steps">
          {progress.completedSteps.map(step => (
            <div key={step} className="completed-step">✅ {step}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 결과 모범 사례

### 1. 일관된 결과 구조

```typescript
// ✅ 좋음 - 일관된 결과 구조
interface StepResult {
  step: string;
  success: boolean;
  timestamp: number;
  data?: any;
  metadata?: Record<string, any>;
}

actionRegister.register('operation', () => {
  return {
    step: 'validation',
    success: true,
    timestamp: Date.now(),
    data: { validated: true }
  } as StepResult;
});
```

### 2. 의미 있는 단계 이름 사용

```typescript
// ✅ 좋음 - 설명적인 단계 이름
controller.setResult({ step: 'user-authentication', success: true });
controller.setResult({ step: 'permission-check', authorized: true });
controller.setResult({ step: 'data-validation', valid: true });

// ❌ 피해야 할 것 - 일반적인 단계 이름
controller.setResult({ step: 'step1', done: true });
controller.setResult({ step: 'step2', ok: true });
```

### 3. 타이밍 정보 포함

```typescript
actionRegister.register('timedOperation', async (payload, controller) => {
  const startTime = Date.now();
  
  const result = await performOperation(payload.data);
  
  const duration = Date.now() - startTime;
  
  controller.setResult({ 
    step: 'operation', 
    duration,
    startTime,
    endTime: Date.now()
  });
  
  return { step: 'timed-operation', result, duration };
});
```

## 🧪 실제 예제

### 포괄적인 결과 수집 데모

실제 예제와 함께 고급 결과 처리를 실제로 확인하세요:

**[→ UseActionWithResult 데모](https://mineclover.github.io/context-action/example/react/use-action-with-result)**

이 데모는 다음을 보여줍니다:
- **개별 액션 실행**: 결과 수집이 있는 단일 핸들러 실행
- **순차 워크플로우**: 결과 의존성이 있는 다단계 프로세스
- **태그 기반 필터링**: `tags: ['validation', 'business-logic']`을 사용한 핸들러 선택
- **병렬 및 병합 실행**: 결과 집계가 있는 동시 처리
- **복잡한 카트 워크플로우**: 실제 검증 → 계산 → 처리 파이프라인

### 핸들러 메타데이터 통합

데모는 또한 메타데이터가 있는 포괄적인 핸들러 등록을 보여줍니다:

```typescript
useCartHandler('validateCart', validateCartHandler, {
  priority: 100,
  tags: ['validation', 'business-logic'],
  category: 'cart-validation',
  returnType: 'value',
});
```

## 실제 예제: 결과 수집 데모

[UseActionWithResult 데모](https://mineclover.github.io/context-action/example/react/use-action-with-result)에서 포괄적인 결과 처리 구현을 확인하세요:

```typescript
// 결과 수집과 함께 순차 워크플로우
const executeWorkflow = async () => {
  const result = await dispatchWithResult('processWorkflow', 
    { data: workflowData },
    { result: { collect: true } }
  );
  
  if (result.success) {
    // 모든 핸들러 결과에 액세스
    const validationResult = result.results.find(r => r.step === 'validation');
    const processingResult = result.results.find(r => r.step === 'processing');
    
    setWorkflowResults(result.results);
  }
};
```

이 예제는 순차 워크플로우 실행과 결과 집계가 있는 실제 결과 수집 패턴을 보여줍니다.

## 관련 문서

- **[우선순위 시스템](./priority.md)** - 우선순위가 결과 순서에 미치는 영향
- **[차단 작업](./blocking.md)** - 차단이 결과 가용성에 미치는 영향
- **[중단 메커니즘](./abort.md)** - 중단이 결과 수집에 미치는 영향
- **[디스패치 메서드](./dispatch.md)** - 다른 디스패치 메서드가 결과 액세스에 미치는 영향