# 핸들러 인트로스펙션 및 메타데이터

디버깅, 모니터링 및 시스템 분석을 위한 포괄적인 메타데이터 지원과 함께 등록된 핸들러의 런타임 발견 및 분석.

## 개요

핸들러 인트로스펙션은 런타임에서 등록된 핸들러를 검사하고, 구성을 분석하며, 핸들러 실행 및 성능에 대한 자세한 통계를 수집할 수 있는 강력한 기능을 제공합니다.

## 🔍 핸들러 발견

### 레지스트리 정보

기본 레지스트리 정보와 개요 가져오기:

```typescript
interface SystemActions extends ActionPayloadMap {
  systemHealth: void;
  auditHandlers: { action?: string };
}

const systemRegister = new ActionRegister<SystemActions>({
  name: 'SystemRegister',
  registry: { debug: true }
});

// 기본 레지스트리 정보
const registryInfo = systemRegister.getRegistryInfo();
console.log(`레지스트리: ${registryInfo.name}`);
console.log(`총 액션: ${registryInfo.totalActions}`);
console.log(`총 핸들러: ${registryInfo.totalHandlers}`);
console.log(`등록된 액션:`, registryInfo.registeredActions);
console.log(`기본 실행 모드: ${registryInfo.defaultExecutionMode}`);
```

### 자세한 핸들러 분석

```typescript
// 핸들러 발견 및 인트로스펙션
systemRegister.register('auditHandlers', async (payload, controller) => {
  const registryInfo = systemRegister.getRegistryInfo();
  
  console.log('🔍 레지스트리 정보:');
  console.log(`총 액션: ${registryInfo.totalActions}`);
  console.log(`총 핸들러: ${registryInfo.totalHandlers}`);
  console.log(`레지스트리 이름: ${registryInfo.name}`);
  console.log(`기본 실행 모드: ${registryInfo.defaultExecutionMode}`);
  
  // 각 액션에 대한 자세한 핸들러 정보 가져오기
  const allActionStats = systemRegister.getAllActionStats();
  
  for (const actionStats of allActionStats) {
    const actionName = String(actionStats.action);
    if (payload.action && actionName !== payload.action) continue;
    
    console.log(`\n📋 액션: ${actionName}`);
    console.log(`  핸들러: ${actionStats.handlerCount}`);
    console.log(`  실행 모드: ${registryInfo.actionExecutionModes.get(actionStats.action) || registryInfo.defaultExecutionMode}`);
    
    // 사용 가능한 경우 실행 통계 표시
    if (actionStats.executionStats) {
      console.log(`  실행 횟수: ${actionStats.executionStats.totalExecutions}`);
      console.log(`  성공률: ${actionStats.executionStats.successRate.toFixed(1)}%`);
      console.log(`  평균 실행 시간: ${actionStats.executionStats.averageDuration.toFixed(1)}ms`);
    }
    
    // 우선순위별로 그룹화된 핸들러 표시
    for (const priorityGroup of actionStats.handlersByPriority) {
      console.log(`\n  📊 우선순위 ${priorityGroup.priority} (${priorityGroup.handlers.length}개 핸들러):`);
      
      for (const handler of priorityGroup.handlers) {
        console.log(`\n    🔧 핸들러: ${handler.id}`);
        console.log(`       태그: [${handler.tags.join(', ')}]`);
        console.log(`       카테고리: ${handler.category || 'uncategorized'}`);
        console.log(`       설명: ${handler.description || '설명 없음'}`);
        console.log(`       버전: ${handler.version || 'unknown'}`);
      }
    }
  }
  
  return { auditComplete: true, registryInfo, actionStats: allActionStats };
}, {
  priority: 100,
  id: 'handler-auditor',
  tags: ['system', 'introspection'],
  category: 'administration'
});
```

## ⚙️ 핸들러 메타데이터

### 풍부한 핸들러 등록

포괄적인 메타데이터로 핸들러를 등록:

```typescript
// 풍부한 메타데이터로 핸들러 등록
systemRegister.register('systemHealth', async (payload, controller) => {
  const health = await checkSystemHealth();
  return { status: 'healthy', checks: health };
}, {
  priority: 100,
  id: 'health-checker',
  tags: ['system', 'monitoring', 'health'],
  category: 'diagnostics',
  description: '포괄적인 시스템 상태 검사를 수행합니다',
  version: '1.2.0',
  environment: ['production', 'staging'],
  metrics: {
    collectTiming: true,
    collectErrors: true,
    customMetrics: { healthCheckType: 'full' }
  },
  metadata: {
    author: 'system-team',
    lastUpdated: '2024-01-15',
    criticality: 'high'
  }
});

systemRegister.register('systemHealth', async (payload, controller) => {
  const dbHealth = await checkDatabaseHealth();
  return { database: dbHealth };
}, {
  priority: 90,
  id: 'db-health-checker',
  tags: ['database', 'monitoring'],
  category: 'diagnostics',
  description: '데이터베이스 연결성과 성능을 확인합니다',
  dependencies: ['database-connection'],
  timeout: 5000
});
```

### 메타데이터 필드

핸들러 구성을 위한 사용 가능한 메타데이터 필드:

```typescript
interface HandlerConfig {
  // 핵심 구성
  priority?: number;           // 실행 우선순위 (높을수록 먼저)
  id?: string;                // 고유 핸들러 식별자
  blocking?: boolean;          // 핸들러가 파이프라인을 차단하는지 여부
  once?: boolean;             // 첫 실행 후 핸들러 제거
  
  // 필터링 및 조건
  condition?: (payload: any) => boolean;  // 실행 조건
  validation?: (payload: any) => boolean; // 페이로드 검증
  
  // 성능 제어
  debounce?: number;          // 디바운스 지연 (밀리초)
  throttle?: number;          // 스로틀 지연 (밀리초)
  timeout?: number;           // 핸들러 타임아웃 (밀리초)
  retries?: number;           // 재시도 횟수
  
  // 조직 및 발견
  tags?: string[];            // 필터링을 위한 핸들러 태그
  category?: string;          // 핸들러 카테고리
  description?: string;       // 사람이 읽을 수 있는 설명
  version?: string;           // 핸들러 버전
  
  // 환경 및 종속성
  environment?: string[];     // 대상 환경
  dependencies?: string[];    // 필수 종속성
  conflicts?: string[];       // 충돌하는 핸들러
  feature?: string;           // 기능 플래그 식별자
  
  // 메트릭 및 모니터링
  metrics?: {
    collectTiming?: boolean;
    collectErrors?: boolean;
    customMetrics?: Record<string, any>;
  };
  
  // 사용자 정의 메타데이터
  metadata?: Record<string, any>;
}
```

## 📊 핸들러 분석

### 속성별 핸들러 쿼리

```typescript
// 태그로 핸들러 찾기
const monitoringHandlers = systemRegister.getHandlersByTag('monitoring');
console.log('모니터링 핸들러가 발견된 액션:', Array.from(monitoringHandlers.keys()));

// 카테고리별 핸들러 찾기
const diagnosticHandlers = systemRegister.getHandlersByCategory('diagnostics');
console.log('진단 핸들러가 발견된 액션:', Array.from(diagnosticHandlers.keys()));

// 특정 액션 통계 가져오기
const healthStats = systemRegister.getActionStats('systemHealth');
if (healthStats) {
  console.log(`상태 검사에 ${healthStats.handlerCount}개의 핸들러가 있습니다`);
  console.log('우선순위별 핸들러:', healthStats.handlersByPriority);
  
  if (healthStats.executionStats) {
    console.log(`평균 실행 시간: ${healthStats.executionStats.averageDuration}ms`);
    console.log(`성공률: ${healthStats.executionStats.successRate}%`);
  }
}
```

### 핸들러 통계

```typescript
// 모든 액션에 대한 포괄적인 통계 가져오기
const allStats = systemRegister.getAllActionStats();

console.log('📈 핸들러 통계 요약:');
allStats.forEach(stats => {
  console.log(`\n${String(stats.action)}:`);
  console.log(`  핸들러: ${stats.handlerCount}`);
  console.log(`  우선순위: ${stats.handlersByPriority.map(p => p.priority).join(', ')}`);
  
  if (stats.executionStats) {
    console.log(`  실행 횟수: ${stats.executionStats.totalExecutions}`);
    console.log(`  성공률: ${stats.executionStats.successRate.toFixed(1)}%`);
    console.log(`  평균 실행 시간: ${stats.executionStats.averageDuration.toFixed(2)}ms`);
    console.log(`  오류: ${stats.executionStats.errorCount}`);
  }
});
```

## 🔄 동적 핸들러 관리

### 런타임 핸들러 등록

```typescript
// 조건에 따라 동적으로 핸들러 등록
function registerConditionalHandlers(register: ActionRegister<any>) {
  const currentEnvironment = process.env.NODE_ENV;
  const featureFlags = getFeatureFlags();
  
  // 개발 전용 핸들러 등록
  if (currentEnvironment === 'development') {
    register.register('debugAction', async (payload, controller) => {
      console.log('🐛 디버그 핸들러 실행:', payload);
      return { debug: true, timestamp: Date.now() };
    }, {
      id: 'debug-handler',
      tags: ['debug', 'development'],
      category: 'debugging',
      description: '개발 디버깅 핸들러',
      environment: ['development']
    });
  }
  
  // 기능 게이트된 핸들러 등록
  if (featureFlags.advancedAnalytics) {
    register.register('dataAnalysis', async (payload, controller) => {
      const analytics = await performAdvancedAnalytics(payload.data);
      return { analytics, enhanced: true };
    }, {
      id: 'advanced-analytics',
      tags: ['analytics', 'advanced'],
      category: 'analysis',
      description: '고급 분석 처리',
      feature: 'advancedAnalytics',
      version: '2.0.0'
    });
  }
}
```

### 핸들러 라이프사이클 관리

```typescript
// 핸들러 등록 및 제거 추적
function setupHandlerLifecycleTracking(register: ActionRegister<any>) {
  // 원래 register 메서드 저장
  const originalRegister = register.register.bind(register);
  
  // 라이프사이클 추적으로 재정의
  register.register = function<K extends keyof any, R = void>(
    action: K,
    handler: any,
    config: any = {}
  ) {
    console.log(`🔄 핸들러 등록: ${config.id || 'anonymous'} for action: ${String(action)}`);
    
    // 원래 register 메서드 호출
    const unregisterFn = originalRegister(action, handler, config);
    
    // 로깅이 있는 향상된 unregister 함수 반환
    return () => {
      console.log(`🗑️ 핸들러 등록 해제: ${config.id || 'anonymous'} for action: ${String(action)}`);
      return unregisterFn();
    };
  };
}
```

## 🧪 실제 예제

### 실제 핸들러 인트로스펙션

포괄적인 메타데이터와 함께 핸들러 인트로스펙션을 실제로 확인하세요:

**[→ UseActionWithResult 데모](https://mineclover.github.io/context-action/example/react/use-action-with-result)**

이 데모는 다음을 보여줍니다:
- **풍부한 메타데이터가 있는 핸들러 등록**: 완전한 핸들러 구성
- **태그 기반 조직**: 핸들러 분류 및 발견
- **카테고리 기반 필터링**: 카테고리별 핸들러 선택
- **우선순위 기반 실행**: 핸들러 순서 및 실행 플로우
- **실행 통계**: 실시간 핸들러 성능 추적

### 핸들러 메타데이터 예제

실제 데모에서 포괄적인 메타데이터로 핸들러가 어떻게 등록되는지 확인하세요:

```typescript
useCartHandler('validateCart', validateCartHandler, {
  priority: 100,
  tags: ['validation', 'business-logic'],
  category: 'cart-validation',
  description: '카트 항목과 가격을 검증합니다',
  returnType: 'value',
  version: '1.0.0'
});

useCartHandler('calculateCart', calculateCartHandler, {
  priority: 90,
  tags: ['calculation', 'business-logic'],
  category: 'cart-calculation',
  description: '카트 총액과 세금을 계산합니다',
  returnType: 'value',
  dependencies: ['cart-validation']
});
```

## 🧪 인트로스펙션 테스트

### 핸들러 발견 테스트

```typescript
async function testHandlerIntrospection() {
  console.log('=== 핸들러 인트로스펙션 테스트 ===');
  
  // 모든 핸들러 감사
  await systemRegister.dispatch('auditHandlers', {});
  
  // 특정 액션 감사
  console.log('\n--- 특정 액션 감사 ---');
  await systemRegister.dispatch('auditHandlers', { action: 'systemHealth' });
}

async function testHandlerQueries() {
  console.log('=== 핸들러 쿼리 테스트 ===');
  
  // 태그로 쿼리
  const monitoringHandlers = systemRegister.getHandlersByTag('monitoring');
  console.log('모니터링 핸들러:', monitoringHandlers.size);
  
  // 카테고리로 쿼리  
  const diagnosticHandlers = systemRegister.getHandlersByCategory('diagnostics');
  console.log('진단 핸들러:', diagnosticHandlers.size);
  
  // 액션 통계 가져오기
  const healthStats = systemRegister.getActionStats('systemHealth');
  console.log('상태 액션 통계:', healthStats);
}
```

## 🛠️ 유틸리티 함수

```typescript
// 인트로스펙션 예제를 위한 헬퍼 함수
async function checkSystemHealth(): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 'healthy'
  };
}

async function checkDatabaseHealth(): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    connected: true,
    responseTime: 15,
    activeConnections: 8
  };
}

function getFeatureFlags(): Record<string, boolean> {
  return {
    advancedAnalytics: true,
    experimentalFeatures: false,
    debugMode: process.env.NODE_ENV === 'development'
  };
}

async function performAdvancedAnalytics(data: any): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    insights: ['trend1', 'pattern2'],
    confidence: 0.85,
    recommendations: ['action1', 'action2']
  };
}
```

## 📚 모범 사례

### 메타데이터 가이드라인

✅ **좋은 사례**
- 설명적인 핸들러 ID와 설명 사용
- 애플리케이션 전체에서 핸들러를 일관성 있게 태그 지정
- 변경 사항 추적을 위한 버전 정보 포함
- 종속성과 충돌 문서화
- 적절한 환경 제약 설정

❌ **피해야 할 것**
- 일반적이거나 의미 없는 태그
- 복잡한 핸들러에 대한 설명 누락
- 일관성 없는 분류
- 문서화되지 않은 종속성

### 성능 고려사항

- **인트로스펙션 오버헤드**: 핸들러 쿼리는 빠르지만 핫 패스에서 빈번한 호출 피하기
- **메타데이터 크기**: 메모리 문제를 피하기 위해 적절한 크기의 메타데이터 유지
- **디버그 모드**: 개발 환경에서만 디버그 모드 활성화
- **통계 수집**: 실행 통계를 모니터링하여 성능 병목 현상 식별

### 디버깅 전략

- 실행 순서를 이해하기 위해 핸들러 인트로스펙션 사용
- 핸들러 통계를 분석하여 느리거나 실패하는 핸들러 식별
- 관련 기능을 그룹화하기 위해 태그와 카테고리 사용
- 동적 등록 패턴을 위한 핸들러 라이프사이클 모니터링

## 관련 문서

- **[기본 파이프라인 기능](./index.md)** - 기본 파이프라인 개념
- **[플로우 제어](./flow-control.md)** - 파이프라인 플로우 제어
- **[결과 처리](./result-handling.md)** - 결과 수집 패턴  
- **[성능 모니터링](./performance.md)** - 성능 분석
- **[액션 패턴](../patterns/action/)** - 액션 구현 패턴