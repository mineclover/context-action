import { delay } from './utils';

// ===== Mock Services =====
export const mockServices = {
  async quickDeploy(version: string): Promise<{id: string}> {
    await delay(300);
    return { id: `dev-deploy-${Date.now()}` };
  },

  async runIntegrationTests(version: string): Promise<{allPassed: boolean, failures: string[]}> {
    await delay(500);
    return { allPassed: Math.random() > 0.3, failures: Math.random() > 0.5 ? [] : ['unit-test-5', 'integration-test-2'] };
  },

  async stagingDeploy(version: string): Promise<{id: string, previewUrl: string}> {
    await delay(400);
    return { 
      id: `staging-deploy-${Date.now()}`,
      previewUrl: `https://staging-${version}.example.com`
    };
  },

  async runProductionValidations(payload: any): Promise<{approved: boolean, reason?: string}> {
    await delay(800);
    return Math.random() > 0.2 ? 
      { approved: true } : 
      { approved: false, reason: 'Security validation failed' };
  },

  async blueGreenDeploy(version: string): Promise<{id: string, rollbackId: string}> {
    await delay(1000);
    return { 
      id: `prod-deploy-${Date.now()}`,
      rollbackId: `rollback-${Date.now()}`
    };
  },

  async getBasicUserData(userId: string) {
    await delay(200);
    return { 
      id: userId, 
      name: `User ${userId}`, 
      email: `${userId}@example.com`,
      registeredAt: Date.now() - (Math.random() * 31536000000) // Random date within last year
    };
  },

  async enhanceUserData(basicData: any) {
    await delay(300);
    return {
      ...basicData,
      analytics: {
        lastLogin: Date.now() - (Math.random() * 86400000), // Random within last day
        loginCount: Math.floor(Math.random() * 100),
        preferences: { theme: 'dark', language: 'en' }
      },
      recommendations: ['feature-a', 'feature-b', 'premium-upgrade']
    };
  },

  async getUserPermissions(userId: string): Promise<string[]> {
    await delay(100);
    const permissions: Record<string, string[]> = {
      'admin-456': ['admin', 'user', 'read', 'write'],
      'user-123': ['user', 'read'],
      'guest-789': ['read']
    };
    return permissions[userId] || ['read'];
  },

  async performSystemBackup(options: any) {
    await delay(600);
    return { 
      backupId: `backup-${Date.now()}`, 
      size: '2.5GB', 
      duration: '45s',
      includeUserData: options.includeUserData || false
    };
  },

  async performSystemRestore(options: any) {
    await delay(800);
    return { 
      restoreId: `restore-${Date.now()}`, 
      restoredFrom: options.backupId || 'backup-12345',
      duration: '60s'
    };
  },

  async performMaintenanceMode(options: any) {
    await delay(400);
    return { 
      maintenanceId: `maint-${Date.now()}`, 
      duration: options.duration || '30m',
      servicesAffected: ['api', 'database', 'cache']
    };
  },

  async performCreditCheck(customerId: string, amount: number) {
    await delay(200);
    return {
      approved: amount < 2000, // Fail for orders over $2000
      availableCredit: 5000,
      reason: amount >= 2000 ? 'Order amount exceeds credit limit' : undefined
    };
  },

  async processBusinessHoursTask(taskType: string) {
    await delay(300);
    return { 
      taskId: `task-${Date.now()}`, 
      type: taskType, 
      processedDuring: 'business-hours',
      priority: 'normal'
    };
  },

  async processOffHoursTask(taskType: string) {
    await delay(200);
    return { 
      taskId: `task-${Date.now()}`, 
      type: taskType, 
      processedDuring: 'off-hours',
      priority: 'low'
    };
  }
};