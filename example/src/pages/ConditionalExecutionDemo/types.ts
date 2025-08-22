// ===== Type Definitions =====
import { ActionPayloadMap } from '@context-action/react';

export interface ConditionalActions extends ActionPayloadMap {
  deployApplication: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    features: string[];
  };
  processUser: { 
    userId: string; 
    operation: string; 
  };
  manageSystem: { 
    operation: 'backup' | 'restore' | 'maintenance';
    userId: string;
    options: any;
  };
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
  processScheduledTask: { 
    taskType: string; 
    scheduledTime: number; 
  };
}

export type LogLevel = 'info' | 'warning' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
}

export interface DeploymentResult {
  environment: string;
  deploymentId: string;
  version: string;
  timestamp: number;
  skipValidations?: boolean;
  hotReload?: boolean;
  testResults?: any;
  previewUrl?: string;
  strategy?: string;
  validations?: any;
  rollbackId?: string;
}

export interface UserProcessingResult {
  step: string;
  userId: string;
  data: any;
  timestamp: number;
  processed: boolean;
  enhanced: boolean;
  enhancedData?: any;
}

export interface SystemOperationResult {
  operation: string;
  success: boolean;
  result: any;
  timestamp: number;
}

export interface OrderResult {
  orderId: string;
  customerId: string;
  originalAmount: number;
  finalAmount: number;
  discountApplied: boolean;
  discountPercentage: number;
  timestamp: number;
}

export interface ScheduleResult {
  processedDuringBusinessHours: boolean;
  result: any;
  processedAt: string;
  timestamp: number;
  offHoursProcessing?: boolean;
  deferred?: boolean;
  reason?: string;
  nextAvailableTime?: string;
}