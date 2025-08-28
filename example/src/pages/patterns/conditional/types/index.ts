// =============================================================================
// Conditional Patterns - Type Definitions
// =============================================================================

export interface ConditionalPattern {
  id: string;
  title: string;
  description: string;
  path: string;
  features: string[];
  difficulty: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  color: string;
  status: 'Complete' | 'Preview' | 'Coming Soon';
  section: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

export interface ExecutionResult {
  id: string;
  patternType: string;
  handlerId: string;
  executed: boolean;
  timestamp: Date;
  executionTime: number;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
  patternId?: string;
  handlerId?: string;
}

export interface PatternContext {
  currentPattern: string;
  activeHandlers: string[];
  executionResults: ExecutionResult[];
  logs: LogEntry[];
  isExecuting: boolean;
}

// Environment-Based Execution Types
export interface EnvironmentConfig {
  current: 'development' | 'staging' | 'production';
  deploymentStrategy: 'fast' | 'canary' | 'blue-green';
  validationLevel: 'basic' | 'enhanced' | 'comprehensive';
}

export interface DeploymentResult {
  environment: string;
  version: string;
  strategy: string;
  success: boolean;
  rollbackId?: string;
  features?: string[];
  executionTime: number;
}

// Feature Flag Types
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: Record<string, any>;
  description: string;
}

export interface FeatureFlagContext {
  flags: Record<string, FeatureFlag>;
  userSegment: string;
  evaluationResults: Record<string, boolean>;
}

// Permission-Based Execution Types
export interface UserRole {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  description: string;
}

export interface SecurityAudit {
  action: string;
  user: string;
  role: string;
  timestamp: Date;
  allowed: boolean;
  reason: string;
}

export interface PermissionResult {
  action: string;
  allowed: boolean;
  executedBy: string;
  executionTime: number;
  auditEntry: SecurityAudit;
}

// Business Rules Types
export interface Customer {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  creditLimit: number;
  currentBalance: number;
  loyaltyPoints: number;
  riskScore: number;
}

export interface Product {
  id: string;
  name: string;
  basePrice: number;
  category: 'electronics' | 'clothing' | 'books' | 'premium';
  inventory: number;
  requiresPremium: boolean;
}

export interface BusinessRuleResult {
  ruleId: string;
  ruleName: string;
  applied: boolean;
  impact: string;
  executionTime: number;
  data: any;
}

// Time-Based Execution Types
export interface TimeContext {
  currentTime: Date;
  timezone: string;
  businessHours: {
    start: number;
    end: number;
  };
  isBusinessDay: boolean;
  isHoliday: boolean;
}

export interface ScheduledTask {
  id: string;
  name: string;
  action: string;
  scheduledTime: Date;
  executed: boolean;
  executedAt?: Date;
  result?: string;
}

export interface TimeBasedResult {
  taskId: string;
  handlerName: string;
  executed: boolean;
  scheduledFor: string;
  executedAt?: string;
  reason: string;
  executionTime: number;
  data: any;
}

// Combined Patterns Types
export interface CombinedPatternScenario {
  id: string;
  name: string;
  description: string;
  patterns: string[];
  complexity: 'Simple' | 'Moderate' | 'Complex' | 'Enterprise';
  requiredPermissions?: string[];
  environmentRestrictions?: string[];
  timeConstraints?: {
    businessHours?: boolean;
    emergencyOverride?: boolean;
  };
}

export interface CombinedPatternResult {
  scenarioId: string;
  executedPatterns: string[];
  overallSuccess: boolean;
  results: ExecutionResult[];
  totalExecutionTime: number;
  coordinationMetadata: Record<string, any>;
}

// Store Schema Types
export interface ConditionalPatternStore {
  environment: EnvironmentConfig;
  featureFlags: Record<string, FeatureFlag>;
  userRole: UserRole;
  currentUser: string;
  selectedCustomer: Customer;
  selectedProduct: Product;
  timeContext: TimeContext;
  patternContext: PatternContext;
  
  // Result stores
  deploymentResults: DeploymentResult[];
  userProcessingResults: any[];
  systemResults: any[];
  orderResults: any[];
  scheduleResults: any[];
  logs: LogEntry[];
  
  // Coordination stores
  basicUserData: any;
  permissionCheckResult: any;
  creditCheckResult: any;
}

// Action Map Types
export interface ConditionalActions {
  // Environment actions
  deployApplication: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    features?: string[];
  };
  
  // Feature flag actions
  toggleFeatureFlag: {
    flagId: string;
    enabled: boolean;
  };
  
  evaluateFeatureFlags: {
    userId: string;
    context?: Record<string, any>;
  };
  
  // Permission actions
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
  
  // Business rule actions
  processOrder: {
    customerId: string;
    productId: string;
    quantity: number;
  };
  
  validateCreditLimit: {
    customerId: string;
    amount: number;
  };
  
  // Time-based actions
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
  
  // Combined pattern actions
  executeCombinedScenario: {
    scenarioId: string;
    context: Record<string, any>;
  };
}

// Utility Types
export type PatternDifficulty = 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
export type PatternStatus = 'Complete' | 'Preview' | 'Coming Soon';
export type LogLevel = 'info' | 'warning' | 'error' | 'success';
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

// Navigation Types
export interface PatternNavigation {
  currentPattern: string;
  availablePatterns: ConditionalPattern[];
  navigationHistory: string[];
}