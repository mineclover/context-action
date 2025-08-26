// =============================================================================
// Mock Services for Conditional Patterns
// =============================================================================

export const mockServices = {
  // Environment-based deployment services
  quickDeploy: async (version: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: `dev-${Date.now()}`,
      version,
      status: 'completed'
    };
  },

  runIntegrationTests: async (version: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const success = Math.random() > 0.2; // 80% success rate
    return {
      allPassed: success,
      failures: success ? [] : ['auth-test', 'db-connection'],
      coverage: success ? 85 : 65,
      version
    };
  },

  stagingDeploy: async (version: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      id: `staging-${Date.now()}`,
      version,
      previewUrl: `https://staging-${version.replace(/\./g, '-')}.example.com`
    };
  },

  runProductionValidations: async (payload: any) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    const approved = Math.random() > 0.1; // 90% approval rate
    return {
      approved,
      reason: approved ? 'All validations passed' : 'Security scan failed',
      securityScore: approved ? 95 : 65,
      performanceScore: approved ? 90 : 70
    };
  },

  blueGreenDeploy: async (version: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      id: `prod-${Date.now()}`,
      version,
      rollbackId: `rollback-${Date.now()}`,
      strategy: 'blue-green'
    };
  },

  // Feature flag services
  evaluateFeatureFlag: async (flagId: string, userId: string, context?: any) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simple hash-based evaluation for consistent results
    const hash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };

    const userHash = hash(userId + flagId);
    const enabled = userHash % 100 < 50; // 50% rollout

    return {
      flagId,
      enabled,
      userId,
      rolloutPercentage: 50,
      evaluatedAt: new Date(),
      context
    };
  },

  // Business rule services
  validateCreditLimit: async (customerId: string, amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const customers: Record<string, any> = {
      'customer-001': { creditLimit: 1000, currentBalance: 200 },
      'customer-002': { creditLimit: 5000, currentBalance: 1500 },
      'customer-003': { creditLimit: 500, currentBalance: 450 }
    };

    const customer = customers[customerId] || { creditLimit: 500, currentBalance: 0 };
    const newBalance = customer.currentBalance + amount;
    const valid = newBalance <= customer.creditLimit;

    return {
      customerId,
      amount,
      currentBalance: customer.currentBalance,
      newBalance,
      creditLimit: customer.creditLimit,
      remainingCredit: customer.creditLimit - newBalance,
      valid,
      riskScore: valid ? 0.2 : 0.8
    };
  },

  calculateDiscount: async (tier: string, baseAmount: number) => {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const discountRates: Record<string, number> = {
      'bronze': 0,
      'silver': 0.05,
      'gold': 0.10,
      'platinum': 0.15
    };

    const discountRate = discountRates[tier] || 0;
    const discount = baseAmount * discountRate;
    const finalAmount = baseAmount - discount;

    return {
      tier,
      baseAmount,
      discountRate,
      discount,
      finalAmount,
      calculatedAt: new Date()
    };
  },

  // Permission services
  checkUserPermissions: async (userId: string, action: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const permissions: Record<string, string[]> = {
      'user-123': ['read', 'write'],
      'admin-456': ['read', 'write', 'delete', 'admin'],
      'guest-789': ['read']
    };

    const userPermissions = permissions[userId] || [];
    const hasPermission = userPermissions.includes(action) || userPermissions.includes('admin');

    return {
      userId,
      action,
      allowed: hasPermission,
      permissions: userPermissions,
      auditId: `audit-${Date.now()}`
    };
  },

  executeSecureOperation: async (action: string, userId: string, payload?: any) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const success = Math.random() > 0.15; // 85% success rate
    const operationId = `op-${Date.now()}`;
    
    return {
      operationId,
      action,
      userId,
      success,
      result: success 
        ? `Successfully executed ${action}` 
        : `Operation ${action} failed - system error`,
      executedAt: new Date(),
      payload
    };
  },

  // Time-based services
  checkBusinessHours: async (currentTime?: Date) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const now = currentTime || new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    const isBusinessHours = hour >= 9 && hour < 17;
    const isWeekday = day >= 1 && day <= 5;
    const isBusinessTime = isBusinessHours && isWeekday;

    return {
      currentTime: now,
      hour,
      day,
      isBusinessHours,
      isWeekday,
      isBusinessTime,
      nextBusinessHour: isBusinessTime ? null : getNextBusinessHour(now)
    };
  },

  scheduleTask: async (taskId: string, scheduledTime: Date) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      taskId,
      scheduledTime,
      status: 'scheduled',
      estimatedExecutionTime: new Date(scheduledTime.getTime() + 5000), // 5 seconds later
      scheduledAt: new Date()
    };
  },

  executeScheduledTask: async (taskId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      taskId,
      executed: success,
      executedAt: new Date(),
      result: success ? 'Task completed successfully' : 'Task execution failed',
      executionTime: 500 + Math.random() * 1000
    };
  }
};

function getNextBusinessHour(date: Date): Date {
  const next = new Date(date);
  
  // If it's weekend, move to next Monday
  if (next.getDay() === 0) next.setDate(next.getDate() + 1);
  if (next.getDay() === 6) next.setDate(next.getDate() + 2);
  
  // Set to business start hour
  next.setHours(9, 0, 0, 0);
  
  return next;
}