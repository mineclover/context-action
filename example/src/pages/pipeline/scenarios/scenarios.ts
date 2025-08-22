import type { ScenarioRegistry } from './types';

// Demo scenarios configuration  
export const scenarios: ScenarioRegistry = {
  securityEscalation: {
    title: "Security Escalation (Standard User - Should Fail)",
    description: "Standard user tries to access admin function",
    payload: { 
      userId: "user-123", 
      action: "delete-user", 
      role: "standard" as const, 
      requiresElevation: true 
    },
    expectedFlow: "standard-auth → priority-jump(1000) → authorization-failed → abort"
  },

  securitySuccess: {
    title: "Security Escalation (Admin User - Should Pass)",
    description: "Admin user successfully accesses admin function",
    payload: { 
      userId: "admin-456", 
      action: "delete-user", 
      role: "admin" as const, 
      requiresElevation: true 
    },
    expectedFlow: "standard-auth → priority-jump(1000) → authorization-success → elevated-token"
  },

  securityNormal: {
    title: "Normal Security (No Elevation Needed)",
    description: "Standard user accesses normal function",
    payload: { 
      userId: "user-789", 
      action: "read-profile", 
      role: "standard" as const, 
      requiresElevation: false 
    },
    expectedFlow: "standard-auth → standard-processing → success"
  },
  
  cacheOptimization: {
    title: "Cache Optimization",
    description: "Data fetching with multi-level cache hierarchy",
    payload: { 
      key: "user-profile-456", 
      fallbackUrl: "/api/users/456", 
      bustCache: false 
    },
    expectedFlow: "memory-cache → redis-cache → database → early-return"
  },
  
  businessHourRouting: {
    title: "Business Hour Routing",
    description: "Order processing during/outside business hours",
    payload: { 
      orderId: "order-789", 
      amount: 5000, 
      expedited: false, 
      customerTier: "premium" as const 
    },
    expectedFlow: "time-check → business-rules → priority-adjust → processing"
  },
  
  errorRecovery: {
    title: "Error Recovery",
    description: "API failure with automatic retry and fallback",
    payload: { 
      endpoint: "/api/payments", 
      shouldFail: true, 
      retryCount: 0, 
      fallbackEnabled: true 
    },
    expectedFlow: "primary-api → error → retry-jump → fallback → recovery"
  }
};