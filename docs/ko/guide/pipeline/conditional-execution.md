# 조건부 및 동적 실행

환경 기반 필터링, 기능 플래그 및 동적 비즈니스 규칙을 사용한 Context-Action 파이프라인의 고급 조건부 실행 패턴.

## 핵심 원칙

**조건부 실행**은 핸들러가 런타임 조건에 따라 실행되는 정교한 비즈니스 로직을 가능하게 합니다. 프레임워크는 네 가지 주요 조건부 패턴을 제공합니다:

1. **환경 기반 실행** - 배포 환경별 다른 핸들러
2. **기능 플래그 통합** - 실시간 토글을 사용한 동적 기능 제어  
3. **권한 기반 실행** - 감사 로깅을 사용한 역할 기반 액세스 제어
4. **비즈니스 규칙 엔진** - 등급 기반 할인 및 동적 가격 책정 로직

> **실제 데모**: `/actionguard/conditional-execution`에서 대화형 제어로 모든 패턴이 실제로 작동하는 모습을 확인하세요.

## 🔄 환경 기반 실행

### 핵심 메커니즘

핸들러 필터링을 통해 핸들러 코드의 조건부 로직 없이 환경별 실행이 가능합니다:

**핵심 원칙**: 각 환경은 조건부 분기가 아닌 필터링을 통해 지정된 핸들러만 실행합니다.

```typescript
interface DeploymentActions extends ActionPayloadMap {
  deployApplication: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    features: string[];
  };
}

const deploymentRegister = new ActionRegister<DeploymentActions>();

// 개발 배포 핸들러
deploymentRegister.register('deployApplication', async (payload, controller) => {
  console.log('🚧 개발 배포 프로세스');
  
  // 개발에서는 무거운 검증 건너뛰기
  const result = await quickDeploy(payload.version);
  
  return { 
    environment: 'development',
    deploymentId: result.id,
    skipValidations: true,
    hotReload: true
  };
}, {
  priority: 100,
  id: 'dev-deployer',
  environment: ['development'],
  tags: ['deployment', 'development']
});

// 스테이징 배포 핸들러
deploymentRegister.register('deployApplication', async (payload, controller) => {
  console.log('🔄 스테이징 배포 프로세스');
  
  // 통합 테스트 실행
  const testResults = await runIntegrationTests(payload.version);
  
  if (!testResults.allPassed) {
    controller.abort(`통합 테스트 실패: ${testResults.failures.join(', ')}`);
    return;
  }
  
  const result = await stagingDeploy(payload.version);
  
  return {
    environment: 'staging',
    deploymentId: result.id,
    testResults,
    previewUrl: result.previewUrl
  };
}, {
  priority: 100,
  id: 'staging-deployer',
  environment: ['staging'],
  tags: ['deployment', 'staging', 'testing']
});

// 프로덕션 배포 핸들러
deploymentRegister.register('deployApplication', async (payload, controller) => {
  console.log('🏭 프로덕션 배포 프로세스');
  
  // 프로덕션용 포괄적 검증
  const validations = await runProductionValidations(payload);
  
  if (!validations.approved) {
    controller.abort(`프로덕션 검증 실패: ${validations.reason}`);
    return;
  }
  
  // 블루-그린 배포
  const result = await blueGreenDeploy(payload.version);
  
  return {
    environment: 'production',
    deploymentId: result.id,
    strategy: 'blue-green',
    validations,
    rollbackId: result.rollbackId
  };
}, {
  priority: 100,
  id: 'prod-deployer',
  environment: ['production'],
  tags: ['deployment', 'production', 'blue-green'],
  dependencies: ['production-validation', 'rollback-capability']
});
```

### 환경 필터링

핸들러 필터링을 사용하여 각 환경에 적절한 핸들러만 실행:

```typescript
// 환경 기반 실행 테스트
async function testEnvironmentExecution() {
  console.log('=== 환경 기반 실행 테스트 ===');
  
  const deploymentData = {
    version: '1.2.3',
    features: ['new-dashboard', 'enhanced-security']
  };
  
  // 핸들러 필터링을 사용하여 다른 환경 시뮬레이션
  const environments: Array<'development' | 'staging' | 'production'> = [
    'development', 'staging', 'production'
  ];
  
  for (const env of environments) {
    console.log(`\n--- ${env}에 배포 ---`);
    
    // 환경 필터링을 사용하여 적절한 핸들러만 실행
    const result = await deploymentRegister.dispatchWithResult('deployApplication', {
      ...deploymentData,
      environment: env
    }, {
      filter: {
        environment: env // 환경별 핸들러 필터링
      }
    });
    
    console.log(`${env} 배포 결과:`, result);
  }
}
```

## 🎯 기능 플래그 통합

### 핵심 메커니즘

기능 플래그는 코드 배포 없이 런타임에서 핸들러 실행을 제어합니다:

**핵심 원칙**: 핸들러는 기능 상태를 확인하고 비활성화되면 실행을 건너뛰어 안전한 점진적 롤아웃을 가능하게 합니다.

```typescript
interface FeatureActions extends ActionPayloadMap {
  processUser: { userId: string; operation: string };
}

const featureRegister = new ActionRegister<FeatureActions>();

// 표준 사용자 처리
featureRegister.register('processUser', async (payload, controller) => {
  const userData = await getBasicUserData(payload.userId);
  
  controller.setResult({
    step: 'basic-processing',
    userId: payload.userId,
    data: userData
  });
  
  return { processed: true, enhanced: false };
}, {
  priority: 100,
  id: 'basic-processor',
  tags: ['user', 'basic']
});

// 향상된 처리 (기능 게이트됨)
featureRegister.register('processUser', async (payload, controller) => {
  // 기능 플래그 확인
  const featureEnabled = await getFeatureFlag('enhanced-user-processing');
  
  if (!featureEnabled) {
    console.log('향상된 처리 비활성화됨, 건너뛰기...');
    return;
  }
  
  const previousResults = controller.getResults();
  const basicResult = previousResults.find(r => r.step === 'basic-processing');
  
  if (!basicResult) {
    controller.abort('향상을 위해서는 기본 처리가 필요합니다');
    return;
  }
  
  const enhancedData = await enhanceUserData(basicResult.data);
  
  controller.setResult({
    step: 'enhanced-processing',
    userId: payload.userId,
    enhancedData,
    enhancementType: 'advanced-analytics'
  });
  
  return { processed: true, enhanced: true };
}, {
  priority: 80,
  id: 'enhanced-processor',
  feature: 'enhanced-user-processing',
  tags: ['user', 'enhanced', 'analytics']
});
```

## 🔒 권한 기반 실행

### 핵심 메커니즘

권한 검증은 파이프라인 초기에 실행되며 실패시 자동 중단됩니다:

**핵심 원칙**: 보안 검사가 먼저 이루어지고, 비즈니스 로직은 인증된 사용자에게만 실행됩니다.

```typescript
interface AdminActions extends ActionPayloadMap {
  manageSystem: { 
    operation: 'backup' | 'restore' | 'maintenance';
    userId: string;
    options: any;
  };
}

const adminRegister = new ActionRegister<AdminActions>();

// 권한 확인 핸들러
adminRegister.register('manageSystem', async (payload, controller) => {
  const userPermissions = await getUserPermissions(payload.userId);
  
  controller.setResult({
    step: 'permission-check',
    userId: payload.userId,
    permissions: userPermissions,
    hasAdminAccess: userPermissions.includes('admin')
  });
  
  if (!userPermissions.includes('admin')) {
    controller.abort('시스템 관리에 대한 권한이 부족합니다');
    return;
  }
  
  return { authorized: true };
}, {
  priority: 100,
  id: 'permission-checker',
  tags: ['security', 'authorization']
});

// 관리자 작업 핸들러
adminRegister.register('manageSystem', async (payload, controller) => {
  const previousResults = controller.getResults();
  const permissionResult = previousResults.find(r => r.step === 'permission-check');
  
  if (!permissionResult?.hasAdminAccess) {
    // 권한 확인의 중단으로 인해 이런 일은 발생하지 않아야 함
    controller.abort('권한 확인 실패');
    return;
  }
  
  let result;
  switch (payload.operation) {
    case 'backup':
      result = await performSystemBackup(payload.options);
      break;
    case 'restore':
      result = await performSystemRestore(payload.options);
      break;
    case 'maintenance':
      result = await performMaintenanceMode(payload.options);
      break;
    default:
      controller.abort(`알 수 없는 작업: ${payload.operation}`);
      return;
  }
  
  controller.setResult({
    step: 'admin-operation',
    operation: payload.operation,
    result,
    executedBy: payload.userId,
    executedAt: Date.now()
  });
  
  return { 
    operation: payload.operation,
    success: true,
    result 
  };
}, {
  priority: 80,
  id: 'admin-operator',
  tags: ['admin', 'system-management']
});
```

## 🕐 시간 기반 실행

### 핵심 메커니즘

시간 기반 핸들러는 일정 인식 처리를 위해 우선순위 순서와 조기 반환을 사용합니다:

**핵심 원칙**: 업무 시간 핸들러가 먼저 실행되고, 업무 외 시간 핸들러는 업무 시간 로직이 실행되지 않을 때만 활성화됩니다.

```typescript
interface ScheduledActions extends ActionPayloadMap {
  processScheduledTask: { taskType: string; scheduledTime: number };
}

const scheduledRegister = new ActionRegister<ScheduledActions>();

// 업무 시간 핸들러
scheduledRegister.register('processScheduledTask', async (payload, controller) => {
  const now = new Date();
  const isBusinessHours = isWithinBusinessHours(now);
  
  if (!isBusinessHours) {
    console.log('업무 시간 외, 작업 연기...');
    controller.return({ 
      deferred: true, 
      reason: 'outside-business-hours',
      nextAvailableTime: getNextBusinessHour(now)
    });
    return;
  }
  
  const result = await processBusinessHoursTask(payload.taskType);
  
  return {
    processedDuringBusinessHours: true,
    result,
    processedAt: now.toISOString()
  };
}, {
  priority: 100,
  id: 'business-hours-processor',
  tags: ['scheduled', 'business-hours']
});

// 업무 외 시간 핸들러 (낮은 우선순위)
scheduledRegister.register('processScheduledTask', async (payload, controller) => {
  const now = new Date();
  const isBusinessHours = isWithinBusinessHours(now);
  
  // 업무 시간 핸들러가 처리하지 않은 경우에만 실행
  if (isBusinessHours) {
    return; // 업무 시간 핸들러가 처리하도록 함
  }
  
  const result = await processOffHoursTask(payload.taskType);
  
  return {
    processedDuringBusinessHours: false,
    result,
    processedAt: now.toISOString(),
    offHoursProcessing: true
  };
}, {
  priority: 50,
  id: 'off-hours-processor',
  tags: ['scheduled', 'off-hours']
});
```

## 🔀 비즈니스 규칙 엔진

### 핵심 메커니즘

비즈니스 규칙은 파이프라인 결과를 통해 연쇄 로직을 사용하여 별도의 핸들러로 실행됩니다:

**핵심 원칙**: 각 비즈니스 규칙(신용 확인, 할인 계산)이 독립적으로 실행되어 후속 핸들러를 위한 컨텍스트를 구축합니다.

```typescript
interface BusinessRuleActions extends ActionPayloadMap {
  processOrder: {
    order: {
      id: string;
      amount: number;
      customerId: string;
      items: Array<{ id: string; quantity: number; price: number }>;
    };
    customer: {
      id: string;
      tier: 'bronze' | 'silver' | 'gold' | 'platinum';
      creditLimit: number;
    };
  };
}

const businessRegister = new ActionRegister<BusinessRuleActions>();

// 신용 확인 핸들러
businessRegister.register('processOrder', async (payload, controller) => {
  const { order, customer } = payload;
  
  // 고객 등급과 주문 금액에 따른 비즈니스 규칙 적용
  const creditCheckRequired = order.amount > getCreditThreshold(customer.tier);
  
  if (creditCheckRequired) {
    const creditCheck = await performCreditCheck(customer.id, order.amount);
    
    if (!creditCheck.approved) {
      controller.abort(`신용 확인 실패: ${creditCheck.reason}`);
      return;
    }
    
    controller.setResult({
      step: 'credit-check',
      approved: true,
      creditLimit: customer.creditLimit,
      orderAmount: order.amount,
      availableCredit: creditCheck.availableCredit
    });
  }
  
  return { creditCheckRequired, approved: !creditCheckRequired || true };
}, {
  priority: 100,
  id: 'credit-checker',
  tags: ['financial', 'credit', 'business-rules']
});

// 할인 계산 핸들러
businessRegister.register('processOrder', async (payload, controller) => {
  const { order, customer } = payload;
  
  let discountPercentage = 0;
  
  // 등급 기반 할인 적용
  switch (customer.tier) {
    case 'platinum':
      discountPercentage = 15;
      break;
    case 'gold':
      discountPercentage = 10;
      break;
    case 'silver':
      discountPercentage = 5;
      break;
    case 'bronze':
      discountPercentage = 0;
      break;
  }
  
  // 대량 주문 할인
  if (order.amount > 1000) {
    discountPercentage += 5;
  }
  
  const discountAmount = (order.amount * discountPercentage) / 100;
  const finalAmount = order.amount - discountAmount;
  
  controller.setResult({
    step: 'discount-calculation',
    originalAmount: order.amount,
    discountPercentage,
    discountAmount,
    finalAmount,
    customerTier: customer.tier
  });
  
  return {
    discountApplied: discountPercentage > 0,
    discountPercentage,
    finalAmount
  };
}, {
  priority: 90,
  id: 'discount-calculator',
  tags: ['pricing', 'discount', 'business-rules']
});
```

## ⚡ 패턴 구현

### 실제 사용법

조건부 실행 패턴을 결합하여 정교한 비즈니스 워크플로우를 만듭니다:

```typescript
// 환경 + 기능 + 권한 통합
const result = await actionRegister.dispatchWithResult('processOrder', orderData, {
  filter: {
    environment: process.env.NODE_ENV,  // 환경 필터링
    feature: 'enhanced-processing',     // 기능 플래그 필터링  
    permissions: ['order-management']   // 권한 필터링
  }
});
```

**통합의 이점**:
- **관심사 분리**: 각 조건부 측면이 독립적으로 처리됨
- **테스트 가능성**: 개별 패턴을 격리하여 테스트 가능
- **유지보수성**: 비즈니스 규칙이 개별적이고 발견 가능한 핸들러로 존재
- **성능**: 조기 필터링으로 불필요한 핸들러 실행을 방지

## 🛠️ 유틸리티 함수

```typescript
// 조건부 실행 예제를 위한 헬퍼 함수
async function quickDeploy(version: string): Promise<{id: string}> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { id: `dev-deploy-${Date.now()}` };
}

async function runIntegrationTests(version: string): Promise<{allPassed: boolean, failures: string[]}> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { allPassed: true, failures: [] };
}

async function stagingDeploy(version: string): Promise<{id: string, previewUrl: string}> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return { 
    id: `staging-deploy-${Date.now()}`,
    previewUrl: `https://staging-${version}.example.com`
  };
}

async function runProductionValidations(payload: any): Promise<{approved: boolean, reason?: string}> {
  await new Promise(resolve => setTimeout(resolve, 800));
  return { approved: true };
}

async function blueGreenDeploy(version: string): Promise<{id: string, rollbackId: string}> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { 
    id: `prod-deploy-${Date.now()}`,
    rollbackId: `rollback-${Date.now()}`
  };
}

async function getFeatureFlag(flag: string): Promise<boolean> {
  // 기능 플래그 조회 시뮬레이션
  const flags = {
    'enhanced-user-processing': true,
    'experimental-features': false,
    'advanced-analytics': true
  };
  return flags[flag] || false;
}

async function getUserPermissions(userId: string): Promise<string[]> {
  // 권한 조회 시뮬레이션
  const permissions = {
    'admin-456': ['admin', 'user', 'read', 'write'],
    'user-123': ['user', 'read'],
    'guest-789': ['read']
  };
  return permissions[userId] || ['read'];
}

function isWithinBusinessHours(date: Date): boolean {
  const hour = date.getHours();
  const day = date.getDay();
  
  // 월요일(1)부터 금요일(5), 오전 9시부터 오후 5시
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}

function getNextBusinessHour(date: Date): Date {
  const next = new Date(date);
  
  // 주말이면 다음 월요일로 이동
  if (next.getDay() === 0) next.setDate(next.getDate() + 1);
  if (next.getDay() === 6) next.setDate(next.getDate() + 2);
  
  // 오전 9시로 설정
  next.setHours(9, 0, 0, 0);
  
  return next;
}

function getCreditThreshold(tier: string): number {
  const thresholds = {
    'bronze': 100,
    'silver': 500,
    'gold': 1000,
    'platinum': 2000
  };
  return thresholds[tier] || 100;
}

async function performCreditCheck(customerId: string, amount: number): Promise<{approved: boolean, availableCredit: number, reason?: string}> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    approved: true,
    availableCredit: 5000,
    reason: undefined
  };
}
```

## 🎮 실제 데모

완전한 조건부 실행 시스템이 `/actionguard/conditional-execution`에서 다음과 함께 시연됩니다:

### 대화형 기능
- **환경 스위처**: 배포 환경을 실시간으로 변경
- **기능 플래그 토글**: 기능을 동적으로 활성화/비활성화
- **역할 선택기**: 사용자 역할을 전환하여 권한 테스트  
- **비즈니스 규칙 제어**: 고객 등급과 주문 금액 조정
- **시간 스케줄러**: 업무 시간 vs 업무 외 시간 처리 테스트
- **활동 모니터**: 모든 조건부 결정의 실시간 로깅

### 데모 아키텍처
```typescript
// 스토어 기반 핸들러 조정 (controller.setResult 충돌 없음)
const environmentStore = useConditionalStore('environment');
const featureFlagStore = useConditionalStore('featureFlags');
const permissionStore = useConditionalStore('permissions');

// 핸들러는 컨트롤러 결과 대신 스토어를 통해 조정
useActionHandler('processConditionalLogic', async (payload) => {
  const environment = environmentStore.getValue();
  const flags = featureFlagStore.getValue();
  
  if (!flags.enhancedProcessing) return;
  
  // 환경별 처리
  const result = await processForEnvironment(environment, payload);
  environmentStore.update(store => ({ ...store, lastResult: result }));
}, []);
```

## 📚 아키텍처 원칙

### 설계 철학

**선언적 vs 명령적**: 핸들러는 조건부 로직을 구현하는 대신 조건(환경, 기능, 권한)을 선언합니다.

```typescript
// ✅ 선언적 접근법
useActionHandler('deployToProduction', handler, {
  environment: ['production'],
  permissions: ['deploy'],
  feature: 'production-deployment'
});

// ❌ 명령적 접근법  
useActionHandler('deploy', (payload) => {
  if (env !== 'production') return;
  if (!hasPermission('deploy')) return;
  if (!isFeatureEnabled('production-deployment')) return;
  // ... 실제 로직
});
```

### 핵심 이점

- **관심사 분리**: 조건이 비즈니스 로직과 분리됨
- **핸들러 재사용성**: 동일한 핸들러가 다른 조건부 컨텍스트에서 작동
- **성능**: 핸들러 실행 전에 필터링 발생
- **테스트 가능성**: 조건과 로직을 독립적으로 테스트 가능
- **유지보수성**: 비즈니스 규칙이 발견 가능하고 개별적인 핸들러로 존재

## 관련 문서

- **[기본 파이프라인 기능](./index.md)** - 기본 파이프라인 개념
- **[플로우 제어](./flow-control.md)** - 파이프라인 플로우 제어
- **[핸들러 인트로스펙션](./introspection.md)** - 핸들러 메타데이터 및 발견
- **[우선순위 시스템](./priority.md)** - 핸들러 실행 순서
- **[액션 패턴](../patterns/action/)** - 액션 구현 패턴