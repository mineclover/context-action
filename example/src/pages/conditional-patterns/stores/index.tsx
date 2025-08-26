import React from 'react';
import { createActionContext, createStoreContext } from '@context-action/react';

// =============================================================================
// Type Definitions
// =============================================================================

export interface ConditionalActions {
  deployApplication: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    features?: string[];
  };
  toggleFeatureFlag: {
    flagId: string;
    enabled: boolean;
  };
  evaluateFeatureFlags: {
    userId: string;
    context?: Record<string, any>;
  };
  checkPermission: {
    action: string;
    userId: string;
    resourceId?: string;
  };
  executeSecureAction: {
    action: string;
    payload: any;
    userId: string;
  };
  processOrder: {
    customerId: string;
    productId: string;
    quantity: number;
  };
  validateCreditLimit: {
    customerId: string;
    amount: number;
  };
  scheduleTask: {
    taskId: string;
    scheduledTime: Date;
    taskType: string;
  };
  executeTimeBasedAction: {
    actionType: string;
    payload: any;
    timeConstraints?: {
      businessHours?: boolean;
      emergencyOverride?: boolean;
    };
  };
  executeCombinedScenario: {
    scenarioId: string;
    context: Record<string, any>;
  };
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
  patternId?: string;
  handlerId?: string;
}

// =============================================================================
// Store Pattern Setup
// =============================================================================

const storePattern = createStoreContext('ConditionalPatterns', {
  // Environment Configuration
  environment: { 
    initialValue: 'development' as 'development' | 'staging' | 'production' 
  },
  
  // Feature Flags Configuration
  featureFlags: { 
    initialValue: {
      'enhanced-user-processing': true,
      'experimental-features': false,
      'advanced-analytics': true,
      'blue-green-deployment': false,
      'premium-features': false,
      'maintenance-mode': false
    } as Record<string, boolean>
  },
  
  // User and Permission Configuration
  userRole: { 
    initialValue: 'user' as 'user' | 'admin' | 'guest' | 'moderator' | 'superadmin'
  },
  currentUser: { 
    initialValue: 'user-123' 
  },
  currentUserProfile: {
    initialValue: {
      id: 'user-123',
      name: 'Demo User',
      email: 'demo@example.com',
      tier: 'bronze' as 'bronze' | 'silver' | 'gold' | 'platinum',
      permissions: ['read'] as string[]
    }
  },
  
  // Business Context
  selectedCustomer: {
    initialValue: {
      id: 'customer-001',
      name: 'John Doe',
      tier: 'bronze' as 'bronze' | 'silver' | 'gold' | 'platinum',
      creditLimit: 1000,
      currentBalance: 200,
      loyaltyPoints: 150,
      riskScore: 0.3
    }
  },
  selectedProduct: {
    initialValue: {
      id: 'product-001',
      name: 'Sample Product',
      basePrice: 100,
      category: 'electronics' as 'electronics' | 'clothing' | 'books' | 'premium',
      inventory: 10,
      requiresPremium: false
    }
  },
  
  // Time Context
  timeContext: {
    initialValue: {
      currentTime: new Date(),
      timezone: 'UTC',
      businessHours: { start: 9, end: 17 },
      isBusinessDay: true,
      isHoliday: false
    }
  },
  
  // Result Storage
  deploymentResults: { 
    initialValue: [] as Array<any> 
  },
  featureFlagResults: { 
    initialValue: [] as Array<any> 
  },
  permissionResults: {
    initialValue: [] as Array<any>
  },
  businessRuleResults: {
    initialValue: [] as Array<any>
  },
  timeBasedResults: {
    initialValue: [] as Array<any>
  },
  combinedResults: {
    initialValue: [] as Array<any>
  },
  
  // Feature Flag Specific Stores
  basicUserData: {
    initialValue: null as any
  },
  userProcessingResults: {
    initialValue: [] as Array<any>
  },
  
  // Logging System
  logs: { 
    initialValue: [] as Array<LogEntry> 
  },
  errorLogs: {
    initialValue: [] as Array<LogEntry>
  },
  auditLogs: {
    initialValue: [] as Array<any>
  },
  
  // UI State
  activeDemo: {
    initialValue: '' as string
  },
  isLoading: {
    initialValue: false
  },
  lastExecutionTime: {
    initialValue: 0
  }
});

export const ConditionalStoreProvider = storePattern.Provider;
export const useConditionalStore = storePattern.useStore;
export const useConditionalStoreManager = storePattern.useStoreManager;

// =============================================================================
// Action Context Setup
// =============================================================================

const actionContext = createActionContext<ConditionalActions>('ConditionalPatterns');

export const ConditionalActionProvider = actionContext.Provider;
export const useConditionalAction = actionContext.useActionDispatch;
export const useConditionalActionHandler = actionContext.useActionHandler;

// =============================================================================
// Combined Provider Setup
// =============================================================================

export function ConditionalPatternsProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConditionalStoreProvider>
      <ConditionalActionProvider>
        {children}
      </ConditionalActionProvider>
    </ConditionalStoreProvider>
  );
}