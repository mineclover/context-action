# 성능 모니터링 및 메트릭

성능 분석, 병목 현상 식별 및 최적화를 가능하게 하는 Context-Action 파이프라인을 위한 포괄적인 성능 모니터링 및 메트릭 수집.

## 개요

성능 모니터링은 모든 액션에 대한 내장된 메트릭 수집, 실행 통계 및 성능 분석 도구를 제공하여 병목 현상을 식별하고 시스템 상태를 추적하며 파이프라인 실행을 최적화하는 데 도움을 줍니다.

## 📊 내장된 메트릭 수집

### 자동 실행 통계

ActionRegister는 모든 액션에 대한 실행 통계를 자동으로 수집합니다:

```typescript
interface MetricsActions extends ActionPayloadMap {
  processWithMetrics: { data: any; trackPerformance: boolean };
}

const metricsRegister = new ActionRegister<MetricsActions>({
  name: 'MetricsRegister',
  registry: { debug: true }
});

// 성능 메트릭이 있는 핸들러
metricsRegister.register('processWithMetrics', async (payload, controller) => {
  const startTime = performance.now();
  
  // 처리 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (payload.trackPerformance) {
    controller.setResult({
      step: 'processing',
      duration,
      timestamp: Date.now(),
      performanceData: {
        startTime,
        endTime,
        memoryUsage: process.memoryUsage ? process.memoryUsage() : null
      }
    });
  }
  
  return { processed: true, duration };
}, {
  priority: 100,
  id: 'performance-processor',
  metrics: {
    collectTiming: true,
    collectErrors: true,
    customMetrics: {
      processingType: 'heavy-computation',
      memoryTracking: true
    }
  }
});
```

### 성능 통계 접근

```typescript
// 특정 액션에 대한 성능 통계 가져오기
const actionStats = metricsRegister.getActionStats('processWithMetrics');
if (actionStats?.executionStats) {
  console.log('📊 성능 통계:', {
    totalExecutions: actionStats.executionStats.totalExecutions,
    averageDuration: actionStats.executionStats.averageDuration,
    successRate: actionStats.executionStats.successRate,
    errorCount: actionStats.executionStats.errorCount
  });
}

// 모든 액션에 대한 통계 가져오기
const allStats = metricsRegister.getAllActionStats();
allStats.forEach(stats => {
  if (stats.executionStats) {
    console.log(`${String(stats.action)}: ${stats.executionStats.averageDuration.toFixed(2)}ms 평균`);
  }
});
```

## 🧪 실제 예제

### 우선순위 성능 데모

포괄적인 성능 모니터링을 실제로 확인하세요:

**[→ 우선순위 성능 데모](https://mineclover.github.io/context-action/example/actionguard/priority-performance)**

이 데모는 다음을 보여줍니다:
- **실시간 성능 모니터링**: 자세한 공식이 포함된 실시간 성능 메트릭
- **실행 시간 추적**: 개별 핸들러 타이밍 분석
- **성능 점수 계산**: 복잡한 성능 점수 계산 알고리즘
- **우선순위 기반 성능 분석**: 우선순위 변경의 성능 영향
- **고급 메트릭 패널**: 전문적인 성능 대시보드

### 컨텍스트 스토어 패턴 성능

실시간 메트릭으로 스토어 수준 성능을 모니터링:

**[→ 컨텍스트 스토어 패턴 데모](https://mineclover.github.io/context-action/example/mouse-events/context-store-pattern)**

보여주는 기능:
- **스토어 성능 모니터링**: 실시간 스토어 작업 추적
- **메모리 사용량 분석**: 스토어 메모리 소비 모니터링
- **업데이트 빈도 추적**: 스토어 업데이트 속도 분석
- **성능 영향 평가**: 스토어 패턴 성능 비교

## ⚡ 성능 테스트

### 벤치마크 테스트

```typescript
async function testPerformanceMonitoring() {
  console.log('=== 성능 모니터링 테스트 ===');
  
  const results = [];
  
  for (let i = 0; i < 5; i++) {
    const result = await metricsRegister.dispatchWithResult('processWithMetrics', {
      data: { iteration: i },
      trackPerformance: true
    });
    
    results.push(result);
    console.log(`반복 ${i + 1} 완료, ${result.execution.duration}ms 소요`);
  }
  
  // 성능 통계 분석
  const actionStats = metricsRegister.getActionStats('processWithMetrics');
  if (actionStats?.executionStats) {
    console.log('\n📊 실행 통계:', {
      totalExecutions: actionStats.executionStats.totalExecutions,
      averageDuration: actionStats.executionStats.averageDuration,
      successRate: actionStats.executionStats.successRate,
      errorCount: actionStats.executionStats.errorCount
    });
  }
  
  return results;
}
```

### 부하 테스트

```typescript
async function performLoadTest() {
  console.log('=== 부하 테스트 ===');
  
  const concurrentRequests = 10;
  const iterations = 5;
  
  console.log(`${iterations}회 반복으로 ${concurrentRequests}개의 동시 요청 실행`);
  
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const promises = Array.from({ length: concurrentRequests }, (_, index) =>
      metricsRegister.dispatchWithResult('processWithMetrics', {
        data: { iteration: i, request: index },
        trackPerformance: true
      })
    );
    
    const results = await Promise.all(promises);
    
    const avgDuration = results.reduce((sum, r) => sum + r.execution.duration, 0) / results.length;
    console.log(`반복 ${i + 1}: 평균 실행 시간 ${avgDuration.toFixed(2)}ms`);
  }
  
  const totalTime = Date.now() - startTime;
  const totalRequests = concurrentRequests * iterations;
  
  console.log(`\n📈 부하 테스트 결과:`);
  console.log(`총 시간: ${totalTime}ms`);
  console.log(`총 요청: ${totalRequests}`);
  console.log(`초당 요청: ${(totalRequests / (totalTime / 1000)).toFixed(2)}`);
  
  // 최종 통계 가져오기
  const finalStats = metricsRegister.getActionStats('processWithMetrics');
  if (finalStats?.executionStats) {
    console.log(`\n📊 최종 통계:`);
    console.log(`평균 실행 시간: ${finalStats.executionStats.averageDuration.toFixed(2)}ms`);
    console.log(`성공률: ${finalStats.executionStats.successRate.toFixed(1)}%`);
    console.log(`총 실행 횟수: ${finalStats.executionStats.totalExecutions}`);
  }
}
```

## 🔍 성능 분석

### 핸들러 성능 프로파일링

```typescript
interface ProfilingActions extends ActionPayloadMap {
  complexWorkflow: { steps: string[]; data: any };
}

const profilingRegister = new ActionRegister<ProfilingActions>();

// 빠른 핸들러
profilingRegister.register('complexWorkflow', async (payload, controller) => {
  const start = performance.now();
  
  // 빠른 검증
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const duration = performance.now() - start;
  
  controller.setResult({
    step: 'validation',
    duration,
    handlerId: 'fast-validator',
    complexity: 'low'
  });
  
  return { validated: true, duration };
}, {
  priority: 100,
  id: 'fast-validator',
  tags: ['validation', 'fast']
});

// 중간 핸들러  
profilingRegister.register('complexWorkflow', async (payload, controller) => {
  const start = performance.now();
  
  // 중간 처리
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const duration = performance.now() - start;
  
  controller.setResult({
    step: 'processing',
    duration,
    handlerId: 'medium-processor',
    complexity: 'medium'
  });
  
  return { processed: true, duration };
}, {
  priority: 90,
  id: 'medium-processor',
  tags: ['processing', 'medium']
});

// 느린 핸들러
profilingRegister.register('complexWorkflow', async (payload, controller) => {
  const start = performance.now();
  
  // 무거운 계산
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const duration = performance.now() - start;
  
  controller.setResult({
    step: 'analysis',
    duration,
    handlerId: 'slow-analyzer',
    complexity: 'high'
  });
  
  return { analyzed: true, duration };
}, {
  priority: 80,
  id: 'slow-analyzer',
  tags: ['analysis', 'slow']
});
```

### 성능 병목 현상 탐지

```typescript
async function analyzePerformanceBottlenecks() {
  console.log('=== 성능 병목 현상 분석 ===');
  
  const result = await profilingRegister.dispatchWithResult('complexWorkflow', {
    steps: ['validate', 'process', 'analyze'],
    data: { complexity: 'high' }
  }, {
    result: { collect: true }
  });
  
  if (result.success && result.results) {
    console.log('\n🔍 핸들러 성능 분석:');
    
    const sortedResults = result.results
      .filter(r => r.duration !== undefined)
      .sort((a, b) => b.duration - a.duration);
    
    const totalDuration = sortedResults.reduce((sum, r) => sum + r.duration, 0);
    
    sortedResults.forEach((r, index) => {
      const percentage = ((r.duration / totalDuration) * 100).toFixed(1);
      const indicator = index === 0 ? '🐌' : index === 1 ? '⚠️' : '✅';
      
      console.log(`${indicator} ${r.step}: ${r.duration.toFixed(2)}ms (${percentage}%) - ${r.handlerId}`);
    });
    
    // 병목 현상 식별
    const bottleneck = sortedResults[0];
    if (bottleneck.duration > totalDuration * 0.5) {
      console.log(`\n🚨 병목 현상 감지: ${bottleneck.handlerId}가 전체 시간의 ${((bottleneck.duration / totalDuration) * 100).toFixed(1)}%를 차지`);
    }
  }
  
  return result;
}
```

## 📈 메모리 사용량 모니터링

### 메모리 추적

```typescript
interface MemoryActions extends ActionPayloadMap {
  processLargeData: { size: 'small' | 'medium' | 'large'; data?: any };
}

const memoryRegister = new ActionRegister<MemoryActions>();

memoryRegister.register('processLargeData', async (payload, controller) => {
  const initialMemory = process.memoryUsage();
  
  // 다른 데이터 크기 시뮬레이션
  let data;
  switch (payload.size) {
    case 'small':
      data = new Array(1000).fill(0).map((_, i) => ({ id: i, value: Math.random() }));
      break;
    case 'medium':
      data = new Array(100000).fill(0).map((_, i) => ({ id: i, value: Math.random() }));
      break;
    case 'large':
      data = new Array(1000000).fill(0).map((_, i) => ({ id: i, value: Math.random() }));
      break;
  }
  
  // 데이터 처리
  const processed = data.map(item => ({ ...item, processed: true }));
  
  const finalMemory = process.memoryUsage();
  
  const memoryDiff = {
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
    rss: finalMemory.rss - initialMemory.rss
  };
  
  controller.setResult({
    step: 'memory-analysis',
    dataSize: payload.size,
    recordCount: data.length,
    initialMemory,
    finalMemory,
    memoryDiff,
    memoryEfficiency: memoryDiff.heapUsed / data.length // 레코드당 바이트
  });
  
  // 큰 데이터 정리
  data = null;
  
  return {
    processed: true,
    recordCount: processed.length,
    memoryUsed: memoryDiff.heapUsed
  };
}, {
  priority: 100,
  id: 'memory-processor',
  tags: ['memory', 'performance']
});

async function testMemoryUsage() {
  console.log('=== 메모리 사용량 테스트 ===');
  
  const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
  
  for (const size of sizes) {
    console.log(`\n--- ${size} 데이터 크기 테스트 ---`);
    
    const result = await memoryRegister.dispatchWithResult('processLargeData', {
      size
    });
    
    if (result.success && result.results.length > 0) {
      const memoryResult = result.results[0];
      console.log(`처리된 레코드: ${memoryResult.recordCount.toLocaleString()}`);
      console.log(`사용된 메모리: ${(memoryResult.memoryDiff.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`레코드당 메모리: ${memoryResult.memoryEfficiency.toFixed(2)} 바이트`);
    }
    
    // 사용 가능하면 가비지 컬렉션 강제 실행
    if (global.gc) {
      global.gc();
    }
  }
}
```

## ⏱️ 사용자 정의 성능 메트릭

### 사용자 정의 타이밍 메트릭

```typescript
interface CustomMetricsActions extends ActionPayloadMap {
  customProcess: { operation: string; data: any };
}

const customMetricsRegister = new ActionRegister<CustomMetricsActions>();

customMetricsRegister.register('customProcess', async (payload, controller) => {
  const metrics = {
    startTime: Date.now(),
    checkpoints: [] as Array<{ name: string; timestamp: number; duration: number }>
  };
  
  // 체크포인트 1: 설정
  const setupStart = performance.now();
  await setupOperation(payload.operation);
  const setupDuration = performance.now() - setupStart;
  metrics.checkpoints.push({
    name: 'setup',
    timestamp: Date.now(),
    duration: setupDuration
  });
  
  // 체크포인트 2: 메인 처리
  const processStart = performance.now();
  const result = await performMainOperation(payload.data);
  const processDuration = performance.now() - processStart;
  metrics.checkpoints.push({
    name: 'main-processing',
    timestamp: Date.now(),
    duration: processDuration
  });
  
  // 체크포인트 3: 정리
  const cleanupStart = performance.now();
  await cleanupOperation();
  const cleanupDuration = performance.now() - cleanupStart;
  metrics.checkpoints.push({
    name: 'cleanup',
    timestamp: Date.now(),
    duration: cleanupDuration
  });
  
  const totalDuration = metrics.checkpoints.reduce((sum, cp) => sum + cp.duration, 0);
  
  controller.setResult({
    step: 'custom-metrics',
    operation: payload.operation,
    metrics: {
      ...metrics,
      totalDuration,
      endTime: Date.now(),
      breakdown: metrics.checkpoints.map(cp => ({
        phase: cp.name,
        duration: cp.duration,
        percentage: ((cp.duration / totalDuration) * 100).toFixed(1)
      }))
    }
  });
  
  return {
    operation: payload.operation,
    success: true,
    totalDuration,
    result
  };
}, {
  priority: 100,
  id: 'custom-metrics-processor',
  metrics: {
    collectTiming: true,
    customMetrics: {
      detailedTiming: true,
      phaseBreakdown: true
    }
  }
});
```

## 📊 성능 대시보드

### 실시간 성능 모니터링

```typescript
class PerformanceDashboard {
  private registers: Map<string, ActionRegister<any>> = new Map();
  
  addRegister(name: string, register: ActionRegister<any>) {
    this.registers.set(name, register);
  }
  
  generatePerformanceReport(): any {
    const report = {
      timestamp: new Date().toISOString(),
      registers: [] as any[]
    };
    
    for (const [name, register] of this.registers) {
      const registryInfo = register.getRegistryInfo();
      const allStats = register.getAllActionStats();
      
      const registerReport = {
        name,
        totalActions: registryInfo.totalActions,
        totalHandlers: registryInfo.totalHandlers,
        actions: [] as any[]
      };
      
      for (const actionStats of allStats) {
        if (actionStats.executionStats) {
          registerReport.actions.push({
            action: String(actionStats.action),
            handlerCount: actionStats.handlerCount,
            statistics: {
              executions: actionStats.executionStats.totalExecutions,
              averageDuration: Math.round(actionStats.executionStats.averageDuration * 100) / 100,
              successRate: Math.round(actionStats.executionStats.successRate * 10) / 10,
              errorCount: actionStats.executionStats.errorCount
            }
          });
        }
      }
      
      report.registers.push(registerReport);
    }
    
    return report;
  }
  
  printPerformanceReport() {
    const report = this.generatePerformanceReport();
    
    console.log('\n📊 성능 대시보드 보고서');
    console.log('================================');
    console.log(`생성됨: ${report.timestamp}\n`);
    
    for (const register of report.registers) {
      console.log(`🏭 레지스트리: ${register.name}`);
      console.log(`   액션: ${register.totalActions}, 핸들러: ${register.totalHandlers}\n`);
      
      if (register.actions.length > 0) {
        console.log('   📈 액션 성능:');
        register.actions.forEach((action: any) => {
          const stats = action.statistics;
          console.log(`   • ${action.action}:`);
          console.log(`     실행: ${stats.executions}, 평균: ${stats.averageDuration}ms`);
          console.log(`     성공: ${stats.successRate}%, 오류: ${stats.errorCount}`);
        });
      }
      
      console.log('');
    }
  }
}

// 사용 예제
async function setupPerformanceDashboard() {
  const dashboard = new PerformanceDashboard();
  
  dashboard.addRegister('Metrics', metricsRegister);
  dashboard.addRegister('Profiling', profilingRegister);
  dashboard.addRegister('Memory', memoryRegister);
  dashboard.addRegister('CustomMetrics', customMetricsRegister);
  
  // 데이터를 생성하기 위해 몇 가지 작업 실행
  await testPerformanceMonitoring();
  await analyzePerformanceBottlenecks();
  
  // 보고서 생성 및 표시
  dashboard.printPerformanceReport();
  
  return dashboard;
}
```

## 🛠️ 헬퍼 함수

```typescript
// 성능 예제를 위한 헬퍼 함수
async function setupOperation(operation: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function performMainOperation(data: any): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return { processed: true, data };
}

async function cleanupOperation(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 30));
}
```

## 📚 모범 사례

### 성능 모니터링 가이드라인

✅ **좋은 사례**
- 중요한 핸들러에 대한 메트릭 수집 활성화
- 정기적인 성능 기준선 설정
- 데이터 집약적 작업의 메모리 사용량 모니터링
- 비즈니스별 측정을 위한 사용자 정의 메트릭 사용
- 성능 저하에 대한 성능 알림 구현

❌ **피해야 할 것**
- 모든 핸들러에 대한 메트릭 수집 (오버헤드)
- 장기 실행 프로세스의 메모리 누수 무시
- 데이터 없이 성능 결정 내리기
- 중요하지 않은 경로 과도 최적화

### 성능 최적화 전략

- **병목 현상 식별** 실행 통계 사용
- **중요한 경로 최적화** 가장 큰 영향력을 가진 것 우선
- **핸들러 필터링 사용** 불필요한 처리 감소
- **비용이 많이 드는 작업에 캐싱 구현**
- **메모리 사용량 모니터링** 및 누수 방지

### 모니터링 임계값

다음에 대한 알림 설정:
- 평균 실행 시간 > 기준선 + 50%
- 성공률 < 95%
- 오류 수 > 실행의 10%
- 시간당 메모리 사용량 증가 > 20%

## 관련 문서

- **[기본 파이프라인 기능](./index.md)** - 기본 파이프라인 개념
- **[핸들러 인트로스펙션](./introspection.md)** - 핸들러 메타데이터 및 발견
- **[플로우 제어](./flow-control.md)** - 파이프라인 플로우 제어
- **[우선순위 시스템](./priority.md)** - 핸들러 실행 순서
- **[액션 패턴](../patterns/action/)** - 액션 구현 패턴