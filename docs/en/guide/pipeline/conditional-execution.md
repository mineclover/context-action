# Conditional & Dynamic Execution

Advanced conditional execution patterns for Context-Action pipelines with environment-based filtering, feature flags, and dynamic business rules.

## Core Principles

**Conditional Execution** enables sophisticated business logic where handlers execute based on runtime conditions. The framework provides four primary conditional patterns:

1. **Environment-Based Execution** - Different handlers per deployment environment
2. **Feature Flag Integration** - Dynamic feature control with real-time toggling  
3. **Permission-Based Execution** - Role-based access control with audit logging
4. **Business Rule Engine** - Tier-based discounts and dynamic pricing logic

> **Live Demo**: Visit `/actionguard/conditional-execution` to see all patterns in action with interactive controls.

## 🔄 Environment-Based Execution

### Core Mechanism

Handler filtering enables environment-specific execution without conditional logic in handler code:

**Key Principle**: Each environment runs only its designated handlers through filtering, not conditional branches.

```typescript
interface DeploymentActions extends ActionPayloadMap {
  deployApplication: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    features: string[];
  };
}

const deploymentRegister = new ActionRegister<DeploymentActions>();

// Development deployment handler
deploymentRegister.register('deployApplication', async (payload, controller) => {
  console.log('🚧 Development deployment process');
  
  // Skip heavy validations in development
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

// Staging deployment handler
deploymentRegister.register('deployApplication', async (payload, controller) => {
  console.log('🔄 Staging deployment process');
  
  // Run integration tests
  const testResults = await runIntegrationTests(payload.version);
  
  if (!testResults.allPassed) {
    controller.abort(`Integration tests failed: ${testResults.failures.join(', ')}`);
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

// Production deployment handler
deploymentRegister.register('deployApplication', async (payload, controller) => {
  console.log('🏭 Production deployment process');
  
  // Comprehensive validations for production
  const validations = await runProductionValidations(payload);
  
  if (!validations.approved) {
    controller.abort(`Production validation failed: ${validations.reason}`);
    return;
  }
  
  // Blue-green deployment
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

### Environment Filtering

Use handler filtering to run only appropriate handlers for each environment:

```typescript
// Test environment-based execution
async function testEnvironmentExecution() {
  console.log('=== Environment-Based Execution Test ===');
  
  const deploymentData = {
    version: '1.2.3',
    features: ['new-dashboard', 'enhanced-security']
  };
  
  // Simulate different environments using handler filtering
  const environments: Array<'development' | 'staging' | 'production'> = [
    'development', 'staging', 'production'
  ];
  
  for (const env of environments) {
    console.log(`\n--- Deploying to ${env} ---`);
    
    // Use environment filtering to run only appropriate handlers
    const result = await deploymentRegister.dispatchWithResult('deployApplication', {
      ...deploymentData,
      environment: env
    }, {
      filter: {
        environment: env // Filter handlers by environment
      }
    });
    
    console.log(`${env} deployment result:`, result);
  }
}
```

## 🎯 Feature Flag Integration

### Core Mechanism

Feature flags control handler execution at runtime without code deployment:

**Key Principle**: Handlers check feature state and skip execution when disabled, enabling safe gradual rollouts.

```typescript
interface FeatureActions extends ActionPayloadMap {
  processUser: { userId: string; operation: string };
}

const featureRegister = new ActionRegister<FeatureActions>();

// Standard user processing
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

// Enhanced processing (feature-gated)
featureRegister.register('processUser', async (payload, controller) => {
  // Check feature flag
  const featureEnabled = await getFeatureFlag('enhanced-user-processing');
  
  if (!featureEnabled) {
    console.log('Enhanced processing disabled, skipping...');
    return;
  }
  
  const previousResults = controller.getResults();
  const basicResult = previousResults.find(r => r.step === 'basic-processing');
  
  if (!basicResult) {
    controller.abort('Basic processing required for enhancement');
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

## 🔒 Permission-Based Execution

### Core Mechanism

Permission validation occurs early in the pipeline with automatic abort on failure:

**Key Principle**: Security checks happen first, business logic only executes for authorized users.

```typescript
interface AdminActions extends ActionPayloadMap {
  manageSystem: { 
    operation: 'backup' | 'restore' | 'maintenance';
    userId: string;
    options: any;
  };
}

const adminRegister = new ActionRegister<AdminActions>();

// Permission check handler
adminRegister.register('manageSystem', async (payload, controller) => {
  const userPermissions = await getUserPermissions(payload.userId);
  
  controller.setResult({
    step: 'permission-check',
    userId: payload.userId,
    permissions: userPermissions,
    hasAdminAccess: userPermissions.includes('admin')
  });
  
  if (!userPermissions.includes('admin')) {
    controller.abort('Insufficient permissions for system management');
    return;
  }
  
  return { authorized: true };
}, {
  priority: 100,
  id: 'permission-checker',
  tags: ['security', 'authorization']
});

// Admin operation handler
adminRegister.register('manageSystem', async (payload, controller) => {
  const previousResults = controller.getResults();
  const permissionResult = previousResults.find(r => r.step === 'permission-check');
  
  if (!permissionResult?.hasAdminAccess) {
    // This shouldn't happen due to abort in permission check
    controller.abort('Permission check failed');
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
      controller.abort(`Unknown operation: ${payload.operation}`);
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

## 🕐 Time-Based Execution

### Core Mechanism

Time-based handlers use priority ordering and early returns for schedule-aware processing:

**Key Principle**: Business hours handlers run first, off-hours handlers activate only when business hours logic doesn't execute.

```typescript
interface ScheduledActions extends ActionPayloadMap {
  processScheduledTask: { taskType: string; scheduledTime: number };
}

const scheduledRegister = new ActionRegister<ScheduledActions>();

// Business hours handler
scheduledRegister.register('processScheduledTask', async (payload, controller) => {
  const now = new Date();
  const isBusinessHours = isWithinBusinessHours(now);
  
  if (!isBusinessHours) {
    console.log('Outside business hours, deferring task...');
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

// Off-hours handler (lower priority)
scheduledRegister.register('processScheduledTask', async (payload, controller) => {
  const now = new Date();
  const isBusinessHours = isWithinBusinessHours(now);
  
  // Only run if business hours handler didn't process
  if (isBusinessHours) {
    return; // Let business hours handler take care of it
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

## 🔀 Business Rule Engine

### Core Mechanism

Business rules execute as separate handlers with cascading logic through pipeline results:

**Key Principle**: Each business rule (credit check, discount calculation) runs independently, building up context for subsequent handlers.

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

// Credit check handler
businessRegister.register('processOrder', async (payload, controller) => {
  const { order, customer } = payload;
  
  // Apply business rules based on customer tier and order amount
  const creditCheckRequired = order.amount > getCreditThreshold(customer.tier);
  
  if (creditCheckRequired) {
    const creditCheck = await performCreditCheck(customer.id, order.amount);
    
    if (!creditCheck.approved) {
      controller.abort(`Credit check failed: ${creditCheck.reason}`);
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

// Discount calculation handler
businessRegister.register('processOrder', async (payload, controller) => {
  const { order, customer } = payload;
  
  let discountPercentage = 0;
  
  // Apply tier-based discounts
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
  
  // Volume discount for large orders
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

## ⚡ Pattern Implementation

### Real-World Usage

The conditional execution patterns combine to create sophisticated business workflows:

```typescript
// Environment + Feature + Permission integration
const result = await actionRegister.dispatchWithResult('processOrder', orderData, {
  filter: {
    environment: process.env.NODE_ENV,  // Environment filtering
    feature: 'enhanced-processing',     // Feature flag filtering  
    permissions: ['order-management']   // Permission filtering
  }
});
```

**Integration Benefits**:
- **Separation of Concerns**: Each conditional aspect handled independently
- **Testability**: Individual patterns can be tested in isolation
- **Maintainability**: Business rules exist as discrete, discoverable handlers
- **Performance**: Early filtering prevents unnecessary handler execution

## 🛠️ Utility Functions

```typescript
// Helper functions for conditional execution examples
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
  // Simulate feature flag lookup
  const flags = {
    'enhanced-user-processing': true,
    'experimental-features': false,
    'advanced-analytics': true
  };
  return flags[flag] || false;
}

async function getUserPermissions(userId: string): Promise<string[]> {
  // Simulate permission lookup
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
  
  // Monday (1) to Friday (5), 9 AM to 5 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}

function getNextBusinessHour(date: Date): Date {
  const next = new Date(date);
  
  // If it's weekend, move to next Monday
  if (next.getDay() === 0) next.setDate(next.getDate() + 1);
  if (next.getDay() === 6) next.setDate(next.getDate() + 2);
  
  // Set to 9 AM
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

## 🎮 Live Demo

The complete conditional execution system is demonstrated at `/actionguard/conditional-execution` with:

### Interactive Features
- **Environment Switcher**: Change deployment environments in real-time
- **Feature Flag Toggle**: Enable/disable features dynamically
- **Role Selector**: Switch user roles to test permissions  
- **Business Rule Controls**: Adjust customer tiers and order amounts
- **Time Scheduler**: Test business hours vs off-hours processing
- **Activity Monitor**: Real-time logging of all conditional decisions

### Demo Architecture
```typescript
// Store-based handler coordination (no controller.setResult conflicts)
const environmentStore = useConditionalStore('environment');
const featureFlagStore = useConditionalStore('featureFlags');
const permissionStore = useConditionalStore('permissions');

// Handlers coordinate through stores instead of controller results
useActionHandler('processConditionalLogic', async (payload) => {
  const environment = environmentStore.getValue();
  const flags = featureFlagStore.getValue();
  
  if (!flags.enhancedProcessing) return;
  
  // Environment-specific processing
  const result = await processForEnvironment(environment, payload);
  environmentStore.update(store => ({ ...store, lastResult: result }));
}, []);
```

## 📚 Architecture Principles

### Design Philosophy

**Declarative over Imperative**: Handlers declare their conditions (environment, features, permissions) rather than implementing conditional logic.

```typescript
// ✅ Declarative approach
useActionHandler('deployToProduction', handler, {
  environment: ['production'],
  permissions: ['deploy'],
  feature: 'production-deployment'
});

// ❌ Imperative approach  
useActionHandler('deploy', (payload) => {
  if (env !== 'production') return;
  if (!hasPermission('deploy')) return;
  if (!isFeatureEnabled('production-deployment')) return;
  // ... actual logic
});
```

### Core Benefits

- **Separation of Concerns**: Conditions separated from business logic
- **Handler Reusability**: Same handler works across different conditional contexts
- **Performance**: Filtering happens before handler execution
- **Testability**: Conditions and logic can be tested independently
- **Maintainability**: Business rules exist as discoverable, discrete handlers

## Related

- **[Basic Pipeline Features](./index.md)** - Foundation pipeline concepts
- **[Flow Control](./flow-control.md)** - Pipeline flow control
- **[Handler Introspection](./introspection.md)** - Handler metadata and discovery
- **[Priority System](./priority.md)** - Handler execution order
- **[Action Patterns](../patterns/action/)** - Action implementation patterns