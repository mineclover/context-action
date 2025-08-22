import type { ActionPayloadMap } from '@context-action/core';

// Result types for handlers
export type SecurityResult = {
  level: 'standard' | 'elevated';
  processed?: boolean;
  authorized?: boolean;
  securityToken?: string;
  timestamp: number;
};

export type CacheResult = {
  source: 'memory-cache' | 'redis-cache' | 'database';
  data: any;
  timestamp: number;
};

export type OrderResult = {
  type: 'standard' | 'international' | 'premium-after-hours' | 'expedited' | 'high-value';
  processingTime: string;
  orderId: string;
  timestamp: number;
};

export type ApiResult = {
  success: boolean;
  attempt?: number;
  fallbackUsed?: boolean;
  message?: string;
  endpoint: string;
  timestamp: number;
};

// Action type definitions for different flow control scenarios
export interface SecurityActions extends ActionPayloadMap {
  processRequest: { 
    userId: string; 
    action: string; 
    role: 'standard' | 'admin' | 'super';
    requiresElevation?: boolean;
  };
}

export interface CacheActions extends ActionPayloadMap {
  fetchData: { 
    key: string; 
    fallbackUrl?: string;
    bustCache?: boolean;
  };
}

export interface OrderActions extends ActionPayloadMap {
  processOrder: {
    orderId: string;
    amount: number;
    expedited?: boolean;
    international?: boolean;
    customerTier: 'standard' | 'premium' | 'enterprise';
  };
}

export interface ApiActions extends ActionPayloadMap {
  apiCall: {
    endpoint: string;
    shouldFail?: boolean;
    retryCount?: number;
    fallbackEnabled?: boolean;
  };
}

// Scenario configuration types
export type ScenarioKey = 'securityEscalation' | 'cacheOptimization' | 'businessHourRouting' | 'errorRecovery';

export interface ScenarioConfig<T = any> {
  title: string;
  description: string;
  payload: T;
  expectedFlow: string;
}

export type ScenarioRegistry = {
  securityEscalation: ScenarioConfig<SecurityActions['processRequest']>;
  cacheOptimization: ScenarioConfig<CacheActions['fetchData']>;
  businessHourRouting: ScenarioConfig<OrderActions['processOrder']>;
  errorRecovery: ScenarioConfig<ApiActions['apiCall']>;
};