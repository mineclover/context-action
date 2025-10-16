import type { ScenarioRegistry } from './types';

// Demo scenarios configuration
export const scenarios: ScenarioRegistry = {
  securityEscalation: {
    title: 'Security Escalation (Standard User - Should Fail)',
    description:
      'Standard user tries to access admin function with priority jump',
    payload: {
      userId: 'user-123',
      action: 'delete-user',
      role: 'standard' as const,
      requiresElevation: true,
    },
    expectedFlow:
      'Standard Handler (P:1000) → jumpToPriority(50) → Elevated Handler (P:50) → Authorization Failed → Abort',
  },

  securitySuccess: {
    title: 'Security Escalation (Admin User - Should Pass)',
    description:
      'Admin user successfully accesses admin function with priority jump',
    payload: {
      userId: 'admin-456',
      action: 'delete-user',
      role: 'admin' as const,
      requiresElevation: true,
    },
    expectedFlow:
      'Standard Handler (P:1000) → jumpToPriority(50) → Elevated Handler (P:50) → Authorization Success → Security Token',
  },

  securityNormal: {
    title: 'Normal Security (No Elevation Needed)',
    description: 'Standard user accesses normal function without priority jump',
    payload: {
      userId: 'user-789',
      action: 'read-profile',
      role: 'standard' as const,
      requiresElevation: false,
    },
    expectedFlow: 'Standard Handler (P:1000) → Standard Processing → Success',
  },

  cacheOptimization: {
    title: 'Cache Optimization (Memory Hit)',
    description:
      'Data fetching with memory cache hit demonstrating early return',
    payload: {
      key: 'cached-user-profile',
      fallbackUrl: '/api/users/cached',
      bustCache: false,
    },
    expectedFlow:
      'Memory Cache (P:100) → Cache HIT → Early Return (Skip Redis & Database)',
  },

  cacheRedisHit: {
    title: 'Cache Redis Hit (Memory Miss)',
    description:
      'Memory cache miss, Redis cache hit with population back to memory',
    payload: {
      key: 'redis-cached-profile',
      fallbackUrl: '/api/users/redis',
      bustCache: false,
    },
    expectedFlow:
      'Memory Cache (P:100) → MISS → Redis Cache (P:80) → HIT → Populate Memory → Early Return',
  },

  cacheMissAll: {
    title: 'Cache Miss All (Database Fetch)',
    description:
      'All cache levels miss, fetch from database and populate caches',
    payload: {
      key: 'new-user-profile',
      fallbackUrl: '/api/users/new',
      bustCache: false,
    },
    expectedFlow:
      'Memory Cache (P:100) → MISS → Redis Cache (P:80) → MISS → Database (P:60) → Populate All Caches',
  },

  businessHourRouting: {
    title: 'Business Hour Routing',
    description:
      'Order processing with dynamic priority routing based on business rules',
    payload: {
      orderId: 'order-789',
      amount: 5000,
      expedited: false,
      customerTier: 'premium' as const,
    },
    expectedFlow:
      'Business Rules (P:100) → jumpToPriority(700) → Premium After-Hours (P:700) → Processing',
  },

  errorRecovery: {
    title: 'Error Recovery',
    description:
      'API failure with automatic retry mechanism and fallback handling',
    payload: {
      endpoint: '/api/payments',
      shouldFail: true,
      retryCount: 0,
      fallbackEnabled: true,
    },
    expectedFlow:
      'Primary API (P:1000) → Error → jumpToPriority(500) → Retry (P:500) → jumpToPriority(100) → Fallback (P:100)',
  },
};
