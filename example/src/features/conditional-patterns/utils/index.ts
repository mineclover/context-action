// =============================================================================
// Conditional Patterns - Utility Functions
// =============================================================================

import { LogEntry, LogLevel, PatternDifficulty, PatternStatus } from '../types';

// =============================================================================
// Logging Utilities
// =============================================================================

export const addLog = (logs: LogEntry[], level: LogLevel, message: string, data?: any, patternId?: string, handlerId?: string): LogEntry[] => {
  const newLog: LogEntry = { 
    timestamp: Date.now(), 
    level, 
    message, 
    data,
    patternId,
    handlerId
  };
  return [...logs, newLog];
};

export const getLogIcon = (level: LogLevel) => {
  switch (level) {
    case 'info': return '📘';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'success': return '✅';
    default: return '📝';
  }
};

export const getLogColor = (level: LogLevel) => {
  switch (level) {
    case 'info': return 'text-blue-600 bg-blue-50';
    case 'warning': return 'text-yellow-600 bg-yellow-50';
    case 'error': return 'text-red-600 bg-red-50';
    case 'success': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const formatLogMessage = (entry: LogEntry): string => {
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const icon = getLogIcon(entry.level);
  return `${icon} [${timestamp}] ${entry.message}`;
};

// =============================================================================
// Pattern Classification Utilities
// =============================================================================

export const getDifficultyColor = (difficulty: PatternDifficulty) => {
  switch (difficulty) {
    case 'Basic': return 'bg-green-100 text-green-800 border-green-200';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Advanced': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Expert': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusColor = (status: PatternStatus) => {
  switch (status) {
    case 'Complete': return 'bg-green-100 text-green-800 border-green-200';
    case 'Preview': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Coming Soon': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getDifficultyOrder = (difficulty: PatternDifficulty): number => {
  switch (difficulty) {
    case 'Basic': return 1;
    case 'Intermediate': return 2;
    case 'Advanced': return 3;
    case 'Expert': return 4;
    default: return 0;
  }
};

// =============================================================================
// Time and Scheduling Utilities
// =============================================================================

export const isWithinBusinessHours = (date: Date, businessHours: { start: number; end: number }): boolean => {
  const hour = date.getHours();
  return hour >= businessHours.start && hour < businessHours.end;
};

export const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday to Friday
};

export const getNextBusinessHour = (date: Date, businessHours: { start: number; end: number }): Date => {
  const next = new Date(date);
  
  // If it's weekend, move to next Monday
  if (next.getDay() === 0) next.setDate(next.getDate() + 1);
  if (next.getDay() === 6) next.setDate(next.getDate() + 2);
  
  // Set to business start hour
  next.setHours(businessHours.start, 0, 0, 0);
  
  return next;
};

export const formatTimeForDisplay = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
};

export const getTimeStatus = (date: Date, businessHours: { start: number; end: number }) => {
  const isBusinessHours = isWithinBusinessHours(date, businessHours);
  const isWeekday = isBusinessDay(date);
  const currentHour = date.getHours();
  const isNight = currentHour < 6 || currentHour > 22;
  
  return {
    isBusinessHours,
    isWeekday,
    isNight,
    status: isBusinessHours && isWeekday ? 'business-hours' : 
            isWeekday && !isBusinessHours ? 'after-hours' : 'weekend'
  };
};

// =============================================================================
// Business Logic Utilities
// =============================================================================

export const getCreditThreshold = (tier: string): number => {
  const thresholds: Record<string, number> = {
    'bronze': 500,
    'silver': 1500,
    'gold': 5000,
    'platinum': 10000
  };
  return thresholds[tier] || 500;
};

export const getTierDiscount = (tier: string): number => {
  const discounts: Record<string, number> = {
    'bronze': 0,
    'silver': 0.05,
    'gold': 0.10,
    'platinum': 0.15
  };
  return discounts[tier] || 0;
};

export const calculateOrderTotal = (basePrice: number, quantity: number, tier: string): { baseTotal: number; discount: number; finalTotal: number } => {
  const baseTotal = basePrice * quantity;
  const discountRate = getTierDiscount(tier);
  const discount = baseTotal * discountRate;
  const finalTotal = baseTotal - discount;
  
  return { baseTotal, discount, finalTotal };
};

export const validateCreditLimit = (currentBalance: number, orderAmount: number, creditLimit: number): { valid: boolean; newBalance: number; remainingCredit: number } => {
  const newBalance = currentBalance + orderAmount;
  const remainingCredit = creditLimit - newBalance;
  const valid = newBalance <= creditLimit;
  
  return { valid, newBalance, remainingCredit };
};

// =============================================================================
// Permission and Security Utilities
// =============================================================================

export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(requiredPermission);
};

export const getPermissionLevel = (permissions: string[]): number => {
  if (permissions.includes('*')) return 100;
  if (permissions.includes('admin')) return 80;
  if (permissions.includes('moderate')) return 60;
  if (permissions.includes('write')) return 40;
  if (permissions.includes('read')) return 20;
  return 0;
};

export const createSecurityAuditEntry = (action: string, user: string, role: string, allowed: boolean, reason: string) => {
  return {
    action,
    user,
    role,
    timestamp: new Date(),
    allowed,
    reason
  };
};

// =============================================================================
// Feature Flag Utilities
// =============================================================================

export const evaluateFeatureFlag = (flag: { enabled: boolean; rolloutPercentage: number; conditions?: Record<string, any> }, userId: string, context?: Record<string, any>): boolean => {
  if (!flag.enabled) return false;
  
  // Simple hash-based rollout for consistent user experience
  const hash = hashString(userId);
  const userPercentile = hash % 100;
  
  if (userPercentile >= flag.rolloutPercentage) return false;
  
  // Evaluate additional conditions if present
  if (flag.conditions && context) {
    for (const [key, value] of Object.entries(flag.conditions)) {
      if (context[key] !== value) return false;
    }
  }
  
  return true;
};

export const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// =============================================================================
// Environment Utilities
// =============================================================================

export const getEnvironmentConfig = (environment: string) => {
  const configs = {
    development: {
      deploymentSpeed: 'fast',
      validationLevel: 'basic',
      rollbackSupport: true,
      monitoringLevel: 'debug'
    },
    staging: {
      deploymentSpeed: 'moderate',
      validationLevel: 'enhanced',
      rollbackSupport: true,
      monitoringLevel: 'info'
    },
    production: {
      deploymentSpeed: 'careful',
      validationLevel: 'comprehensive',
      rollbackSupport: true,
      monitoringLevel: 'warn'
    }
  };
  
  return configs[environment as keyof typeof configs] || configs.development;
};

// =============================================================================
// Performance and Execution Utilities
// =============================================================================

export const measureExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; executionTime: number }> => {
  const startTime = Date.now();
  const result = await fn();
  const executionTime = Date.now() - startTime;
  return { result, executionTime };
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number): T => {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

// =============================================================================
// Data Validation Utilities
// =============================================================================

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const validateRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// =============================================================================
// Export all utilities
// =============================================================================

export * from '../types';