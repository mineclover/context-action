# Advanced Result Handling

Sophisticated result collection, merging, and processing strategies for Context-Action pipelines, enabling complex data aggregation and transformation patterns.

## Result Collection Methods

### controller.setResult()

Store intermediate results that other handlers can access:

```typescript
actionRegister.register('processOrder', async (payload, controller) => {
  // Validate order
  const validation = await validateOrder(payload.order);
  
  // Store validation result for other handlers
  controller.setResult({ 
    step: 'validation', 
    valid: validation.isValid,
    errors: validation.errors,
    orderId: payload.order.id
  });
  
  if (!validation.isValid) {
    controller.abort('Order validation failed');
    return;
  }
  
  return { step: 'order-validation', success: true };
}, { priority: 100, id: 'validator' });
```

### controller.getResults()

Access results from previously executed handlers:

```typescript
actionRegister.register('processOrder', async (payload, controller) => {
  // Get results from validation handler
  const previousResults = controller.getResults();
  const validationResult = previousResults.find(r => r.step === 'validation');
  
  if (!validationResult?.valid) {
    controller.abort('Cannot process invalid order');
    return;
  }
  
  // Use validation data for processing
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

Merge current result with previous results using custom logic:

```typescript
interface ReportActions extends ActionPayloadMap {
  generateReport: { sections: string[] };
}

// Section 1: User data
actionRegister.register('generateReport', async (payload, controller) => {
  const userData = await getUserData();
  
  controller.setResult({
    section: 'users',
    data: userData,
    count: userData.length
  });
}, { priority: 100, id: 'user-section' });

// Section 2: Merge with previous results
actionRegister.register('generateReport', async (payload, controller) => {
  const revenueData = await getRevenueData();
  
  // Custom merge strategy: combine sections into a report
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

## Result Types

### Handler Return Values

Each handler can return any value, which becomes part of the results:

```typescript
actionRegister.register('uploadFile', async (payload) => {
  const fileId = await uploadToStorage(payload.file);
  
  // This return value is collected in dispatch results
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
  
  // Create database record
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

### Intermediate Results

Use `controller.setResult()` for data that doesn't need to be returned:

```typescript
actionRegister.register('complexOperation', async (payload, controller) => {
  // Step 1: Prepare data
  const prepared = await prepareData(payload.input);
  controller.setResult({ 
    step: 'preparation', 
    dataSize: prepared.length,
    preparedAt: Date.now()
  });
  
  // Step 2: Validate prepared data
  const validation = validatePreparedData(prepared);
  controller.setResult({ 
    step: 'validation', 
    valid: validation.isValid,
    issues: validation.issues
  });
  
  if (!validation.isValid) {
    controller.abort('Prepared data validation failed');
    return;
  }
  
  // Step 3: Process
  const result = await processData(prepared);
  
  // Return final result
  return { 
    step: 'processing', 
    success: true,
    result,
    processedItems: result.length
  };
});
```

## Result Collection Patterns

### Sequential Result Building

```typescript
interface AnalysisActions extends ActionPayloadMap {
  analyzeData: { dataset: any[]; analysisType: string };
}

// Handler 1: Data cleaning
actionRegister.register('analyzeData', (payload, controller) => {
  const cleaned = cleanDataset(payload.dataset);
  
  controller.modifyPayload(current => ({
    ...current,
    dataset: cleaned  // Update payload for subsequent handlers
  }));
  
  controller.setResult({ 
    step: 'cleaning', 
    originalCount: payload.dataset.length,
    cleanedCount: cleaned.length,
    removedCount: payload.dataset.length - cleaned.length
  });
  
  return { step: 'data-cleaning', success: true };
}, { priority: 100, id: 'cleaner' });

// Handler 2: Statistical analysis
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

// Handler 3: Generate report
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

### Result Aggregation

```typescript
actionRegister.register('batchOperation', async (payload, controller) => {
  const items = payload.items;
  const batchResults = [];
  
  // Process each item and collect results
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
  
  // Store aggregated results
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

## React Integration

### Result-Based UI Updates

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
        error: 'Operation failed'
      });
    }
  };
  
  return (
    <div>
      <button 
        onClick={handleComplexOperation} 
        disabled={operationState.loading}
      >
        {operationState.loading ? 'Processing...' : 'Start Operation'}
      </button>
      
      {operationState.error && (
        <div className="error">Error: {operationState.error}</div>
      )}
      
      {operationState.results.length > 0 && (
        <div className="results">
          <h3>Operation Steps:</h3>
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

### Progress Tracking

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
            // Update progress in real-time as handlers complete
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
        currentStep: 'Complete'
      }));
    }
  };
  
  return (
    <div>
      <button onClick={handleProgressOperation}>Start Multi-Step</button>
      
      <div className="progress">
        <div>Current: {progress.currentStep}</div>
        <div>Progress: {progress.completedSteps.length}/{progress.totalSteps}</div>
        
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

## Result Best Practices

### 1. Consistent Result Structure

```typescript
// ✅ Good - consistent result structure
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

### 2. Use Meaningful Step Names

```typescript
// ✅ Good - descriptive step names
controller.setResult({ step: 'user-authentication', success: true });
controller.setResult({ step: 'permission-check', authorized: true });
controller.setResult({ step: 'data-validation', valid: true });

// ❌ Avoid - generic step names
controller.setResult({ step: 'step1', done: true });
controller.setResult({ step: 'step2', ok: true });
```

### 3. Include Timing Information

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

## 🧪 Live Examples

### Comprehensive Result Collection Demo

See advanced result handling in action with real-world examples:

**[→ UseActionWithResult Demo](https://mineclover.github.io/context-action/example/react/use-action-with-result)**

This demo demonstrates:
- **Individual Action Execution**: Single handler execution with result collection
- **Sequential Workflow**: Multi-step processes with result dependency
- **Tag-based Filtering**: Handler selection using `tags: ['validation', 'business-logic']`
- **Parallel and Merge Execution**: Concurrent processing with result aggregation
- **Complex Cart Workflow**: Real-world validation → calculation → processing pipeline

### Handler Metadata Integration

The demo also showcases comprehensive handler registration with metadata:

```typescript
useCartHandler('validateCart', validateCartHandler, {
  priority: 100,
  tags: ['validation', 'business-logic'],
  category: 'cart-validation',
  returnType: 'value',
});
```

## Live Example: Result Collection Demo

See a comprehensive result handling implementation in the [UseActionWithResult Demo](https://mineclover.github.io/context-action/example/react/use-action-with-result):

```typescript
// Sequential workflow with result collection
const executeWorkflow = async () => {
  const result = await dispatchWithResult('processWorkflow', 
    { data: workflowData },
    { result: { collect: true } }
  );
  
  if (result.success) {
    // Access all handler results
    const validationResult = result.results.find(r => r.step === 'validation');
    const processingResult = result.results.find(r => r.step === 'processing');
    
    setWorkflowResults(result.results);
  }
};
```

This example demonstrates real-world result collection patterns with sequential workflow execution and result aggregation.

## Related

- **[Priority System](./priority.md)** - Priority affects result order
- **[Blocking Operations](./blocking.md)** - Blocking affects when results are available
- **[Abort Mechanisms](./abort.md)** - Abort affects result collection
- **[Dispatch Methods](./dispatch.md)** - Different dispatch methods affect result access