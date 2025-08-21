# Conditional & Dynamic Execution

Advanced conditional execution patterns and environment-based handler filtering for Context-Action pipelines.

## Overview

Conditional execution enables sophisticated business logic patterns where handlers execute based on runtime conditions, environment settings, feature flags, and dynamic business rules.

## 🔄 Environment-Based Execution

### Environment-Specific Handlers

Execute different handlers based on runtime environment conditions using handler filtering:

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

### Dynamic Feature Control

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

### Role-Based Handler Execution

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

### Schedule-Based Handlers

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

## 🔀 Conditional Logic Patterns

### Business Rule Engine

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

## 🧪 Testing Conditional Execution

### Test Environment-Based Filtering

```typescript
async function testConditionalExecution() {
  console.log('=== Conditional Execution Test ===');
  
  // Test feature flag behavior
  console.log('--- Testing Feature Flags ---');
  const userResult = await featureRegister.dispatchWithResult('processUser', {
    userId: 'user-123',
    operation: 'profile-update'
  });
  console.log('User processing result:', userResult);
  
  // Test permission-based execution
  console.log('--- Testing Permission Checks ---');
  try {
    const adminResult = await adminRegister.dispatchWithResult('manageSystem', {
      operation: 'backup',
      userId: 'admin-456',
      options: { includeUserData: true }
    });
    console.log('Admin operation result:', adminResult);
  } catch (error) {
    console.log('Admin operation failed:', error.message);
  }
  
  // Test business rules
  console.log('--- Testing Business Rules ---');
  const orderResult = await businessRegister.dispatchWithResult('processOrder', {
    order: {
      id: 'order-789',
      amount: 1500,
      customerId: 'customer-123',
      items: [{ id: 'item-1', quantity: 2, price: 750 }]
    },
    customer: {
      id: 'customer-123',
      tier: 'gold',
      creditLimit: 5000
    }
  });
  console.log('Order processing result:', orderResult);
}
```

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

## 🚧 Implementation Plans

### Environment-based Execution Demo
**Planned**: `/actionguard/conditional-execution` demo page

**Features to implement**:
- **Multi-environment Deployment**: Development, staging, production handler selection
- **Feature Flag Integration**: Dynamic feature control with real-time toggling
- **User Role Management**: Permission-based handler execution
- **Business Rule Engine**: Complex conditional logic patterns

```typescript
// Planned implementation examples
const environmentHandler = useCallback(async (payload, controller) => {
  // Environment-based execution
  if (process.env.NODE_ENV !== 'development') {
    controller.skip();
    return;
  }
  
  // Development-only debugging logic
  console.log('🐛 Development debug info:', payload);
  return { environment: 'development', debugInfo: true };
}, []);

useActionHandler('debugAction', environmentHandler, {
  environment: ['development'],
  condition: () => process.env.NODE_ENV === 'development',
  tags: ['debug', 'development']
});
```

### Feature Flag Control Demo
**Planned**: Advanced feature flag patterns with A/B testing

```typescript
// Feature flag with A/B testing
const featureHandler = useCallback(async (payload, controller) => {
  const userId = payload.userId;
  const featureVariant = await getFeatureVariant('new-ui', userId);
  
  if (!featureVariant.enabled) {
    controller.skipCategory('new-ui');
    return;
  }
  
  // Execute variant-specific logic
  if (featureVariant.variant === 'B') {
    controller.jumpToPriority(900); // Use B variant handlers
  }
  
  return { variant: featureVariant.variant, enabled: true };
}, []);
```

### Permission-based Execution Demo
**Planned**: Role-based access control with audit logging

```typescript
// Permission check with audit trail
const permissionHandler = useCallback(async (payload, controller) => {
  const userPermissions = await getUserPermissions(payload.userId);
  
  if (!userPermissions.includes('admin')) {
    // Log unauthorized access attempt
    await auditLog({
      action: 'unauthorized_access_attempt',
      userId: payload.userId,
      resource: payload.resource,
      timestamp: Date.now()
    });
    
    controller.abort('Insufficient permissions');
    return;
  }
  
  // Log authorized access
  await auditLog({
    action: 'authorized_access',
    userId: payload.userId,
    resource: payload.resource,
    permissions: userPermissions,
    timestamp: Date.now()
  });
  
  return { authorized: true, permissions: userPermissions };
}, []);
```

## 📚 Best Practices

### Conditional Execution Guidelines

✅ **Good Practices**
- Use handler filtering for environment-specific behavior
- Implement feature flags for gradual rollouts
- Check permissions early in the pipeline
- Use early returns for failed conditions
- Document business rules clearly

❌ **Avoid**
- Complex conditional logic within handlers
- Hardcoded environment checks
- Bypassing security checks
- Inconsistent business rule application

### Performance Considerations

- **Handler filtering** is more efficient than conditional logic in handlers
- **Early abort** prevents unnecessary processing
- **Feature flag caching** reduces external service calls
- **Permission caching** improves authorization performance

### Security Guidelines

- Always validate permissions before sensitive operations
- Use abort mechanisms for security failures
- Log security-related decisions for auditing
- Implement fail-safe defaults for authorization

## Related

- **[Basic Pipeline Features](./index.md)** - Foundation pipeline concepts
- **[Flow Control](./flow-control.md)** - Pipeline flow control
- **[Handler Introspection](./introspection.md)** - Handler metadata and discovery
- **[Priority System](./priority.md)** - Handler execution order
- **[Action Patterns](../patterns/action/)** - Action implementation patterns