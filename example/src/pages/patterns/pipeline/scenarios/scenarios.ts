import type { ScenarioRegistry } from './types';

// Demo scenarios configuration  
export const scenarios: ScenarioRegistry = {
  securityEscalation: {
    title: "Security Escalation (Standard User - Should Fail)",
    description: "Standard user tries to access admin function with priority jump",
    payload: { 
      userId: "user-123", 
      action: "delete-user", 
      role: "standard" as const, 
      requiresElevation: true 
    },
    expectedFlow: "Standard Handler (P:1000) → jumpToPriority(50) → Elevated Handler (P:50) → Authorization Failed → Abort"
  },

  securitySuccess: {
    title: "Security Escalation (Admin User - Should Pass)",
    description: "Admin user successfully accesses admin function with priority jump",
    payload: { 
      userId: "admin-456", 
      action: "delete-user", 
      role: "admin" as const, 
      requiresElevation: true 
    },
    expectedFlow: "Standard Handler (P:1000) → jumpToPriority(50) → Elevated Handler (P:50) → Authorization Success → Security Token"
  },

  securityNormal: {
    title: "Normal Security (No Elevation Needed)",
    description: "Standard user accesses normal function without priority jump",
    payload: { 
      userId: "user-789", 
      action: "read-profile", 
      role: "standard" as const, 
      requiresElevation: false 
    },
    expectedFlow: "Standard Handler (P:1000) → Standard Processing → Success"
  },
  
  cacheOptimization: {
    title: "Cache Optimization",
    description: "Data fetching with multi-level cache hierarchy and early returns",
    payload: { 
      key: "user-profile-456", 
      fallbackUrl: "/api/users/456", 
      bustCache: false 
    },
    expectedFlow: "Memory Cache (P:100) → Redis Cache (P:80) → Database (P:60) → Early Return on Cache Hit"
  },
  
  businessHourRouting: {
    title: "Business Hour Routing",
    description: "Order processing with dynamic priority routing based on business rules",
    payload: { 
      orderId: "order-789", 
      amount: 5000, 
      expedited: false, 
      customerTier: "premium" as const 
    },
    expectedFlow: "Business Rules (P:100) → jumpToPriority(700) → Premium After-Hours (P:700) → Processing"
  },
  
  errorRecovery: {
    title: "Error Recovery",
    description: "API failure with automatic retry mechanism and fallback handling",
    payload: { 
      endpoint: "/api/payments", 
      shouldFail: true, 
      retryCount: 0, 
      fallbackEnabled: true 
    },
    expectedFlow: "Primary API (P:100) → Error → jumpToPriority(500) → Retry (P:500) → jumpToPriority(1000) → Fallback (P:1000)"
  }
};