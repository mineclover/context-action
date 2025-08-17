/**
 * Document Status Management Types
 * 
 * Defines comprehensive status management system for documents and summaries
 * with Git-based workflow integration
 */

/**
 * Document update status values (English-based)
 */
export enum DocumentUpdateStatus {
  // Template and generation states
  TEMPLATE_GENERATED = 'template_generated',
  SUMMARY_GENERATED = 'summary_generated',
  
  // Source document change detection
  SOURCE_UPDATED = 'source_updated',
  SYNC_REQUIRED = 'sync_required',
  
  // User workflow states
  UNDER_REVIEW = 'under_review',
  REVIEW_COMPLETED = 'review_completed',
  EDIT_COMPLETED = 'edit_completed',
  
  // Finalization states
  READY_FOR_LLMS = 'ready_for_llms',
  LLMS_GENERATED = 'llms_generated',
  PUBLISHED = 'published',
  
  // Error and conflict states
  SYNC_CONFLICT = 'sync_conflict',
  VALIDATION_FAILED = 'validation_failed',
  ERROR = 'error'
}

/**
 * Status transition rules and workflow
 */
export interface StatusTransition {
  from: DocumentUpdateStatus;
  to: DocumentUpdateStatus;
  trigger: StatusTrigger;
  condition?: (context: StatusContext) => boolean;
  action?: (context: StatusContext) => Promise<void>;
}

/**
 * Triggers that cause status changes
 */
export enum StatusTrigger {
  // Template generation
  TEMPLATE_CREATION = 'template_creation',
  
  // Git-based triggers
  SOURCE_COMMIT = 'source_commit',
  SUMMARY_COMMIT = 'summary_commit',
  
  // User actions
  USER_REVIEW = 'user_review',
  USER_EDIT = 'user_edit',
  
  // Automatic triggers
  AUTO_SYNC = 'auto_sync',
  AUTO_VALIDATION = 'auto_validation',
  
  // LLMS generation
  LLMS_REQUEST = 'llms_request',
  LLMS_COMPLETION = 'llms_completion'
}

/**
 * Context information for status transitions
 */
export interface StatusContext {
  documentId: string;
  documentPath?: string;
  summaryPath?: string;
  commitHash?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Workflow configuration for automatic actions
 */
export interface WorkflowConfig {
  // Auto-sync settings
  autoSyncEnabled: boolean;
  autoSyncDelay: number; // milliseconds
  
  // LLMS generation settings
  autoLLMSGeneration: boolean;
  llmsGenerationTriggers: DocumentUpdateStatus[];
  
  // Validation settings
  validationRequired: boolean;
  validationRules: ValidationRule[];
  
  // Notification settings
  notificationEnabled: boolean;
  notificationTargets: NotificationTarget[];
}

/**
 * Validation rules for status transitions
 */
export interface ValidationRule {
  name: string;
  description: string;
  validate: (context: StatusContext) => Promise<ValidationResult>;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
  suggestions?: string[];
}

/**
 * Notification configuration
 */
export interface NotificationTarget {
  type: 'console' | 'webhook' | 'file';
  config: Record<string, any>;
}

/**
 * Document status history entry
 */
export interface StatusHistoryEntry {
  timestamp: string;
  previousStatus: DocumentUpdateStatus;
  newStatus: DocumentUpdateStatus;
  trigger: StatusTrigger;
  context: StatusContext;
  metadata?: Record<string, any>;
}

/**
 * Enhanced frontmatter with status management
 */
export interface EnhancedFrontmatter {
  // Basic document info
  document_id: string;
  category: string;
  source_path: string;
  character_limit?: number;
  
  // Status management
  update_status: DocumentUpdateStatus;
  status_history?: StatusHistoryEntry[];
  
  // Timestamps
  last_update: string;
  last_source_update?: string;
  last_review_date?: string;
  
  // Priority and completion
  priority_score: number;
  priority_tier: string;
  completion_status: 'template' | 'draft' | 'review' | 'completed';
  
  // Workflow metadata
  workflow_stage?: string;
  assigned_reviewer?: string;
  review_notes?: string;
  
  // Related documents and dependencies
  related_document?: string;
  dependencies?: string[];
  blocks?: string[];
  
  // Quality and validation
  validation_status?: 'pending' | 'passed' | 'failed';
  validation_errors?: string[];
  quality_score?: number;
}

/**
 * Status manager interface
 */
export interface IDocumentStatusManager {
  // Status queries
  getCurrentStatus(documentId: string): Promise<DocumentUpdateStatus>;
  getStatusHistory(documentId: string): Promise<StatusHistoryEntry[]>;
  
  // Status transitions
  transitionStatus(
    documentId: string, 
    newStatus: DocumentUpdateStatus, 
    trigger: StatusTrigger, 
    context: StatusContext
  ): Promise<void>;
  
  // Workflow automation
  processWorkflowTrigger(trigger: StatusTrigger, context: StatusContext): Promise<void>;
  
  // Validation
  validateTransition(
    from: DocumentUpdateStatus, 
    to: DocumentUpdateStatus, 
    context: StatusContext
  ): Promise<ValidationResult>;
}

/**
 * Default status transition workflow
 */
export const DEFAULT_STATUS_TRANSITIONS: StatusTransition[] = [
  // Template generation workflow
  {
    from: DocumentUpdateStatus.TEMPLATE_GENERATED,
    to: DocumentUpdateStatus.UNDER_REVIEW,
    trigger: StatusTrigger.USER_REVIEW
  },
  
  // Source document update workflow
  {
    from: DocumentUpdateStatus.SUMMARY_GENERATED,
    to: DocumentUpdateStatus.SOURCE_UPDATED,
    trigger: StatusTrigger.SOURCE_COMMIT
  },
  {
    from: DocumentUpdateStatus.SOURCE_UPDATED,
    to: DocumentUpdateStatus.SYNC_REQUIRED,
    trigger: StatusTrigger.AUTO_SYNC
  },
  
  // User review and edit workflow
  {
    from: DocumentUpdateStatus.UNDER_REVIEW,
    to: DocumentUpdateStatus.REVIEW_COMPLETED,
    trigger: StatusTrigger.USER_REVIEW
  },
  {
    from: DocumentUpdateStatus.UNDER_REVIEW,
    to: DocumentUpdateStatus.EDIT_COMPLETED,
    trigger: StatusTrigger.USER_EDIT
  },
  {
    from: DocumentUpdateStatus.REVIEW_COMPLETED,
    to: DocumentUpdateStatus.EDIT_COMPLETED,
    trigger: StatusTrigger.USER_EDIT
  },
  
  // LLMS generation workflow
  {
    from: DocumentUpdateStatus.EDIT_COMPLETED,
    to: DocumentUpdateStatus.READY_FOR_LLMS,
    trigger: StatusTrigger.AUTO_VALIDATION
  },
  {
    from: DocumentUpdateStatus.REVIEW_COMPLETED,
    to: DocumentUpdateStatus.READY_FOR_LLMS,
    trigger: StatusTrigger.AUTO_VALIDATION
  },
  {
    from: DocumentUpdateStatus.READY_FOR_LLMS,
    to: DocumentUpdateStatus.LLMS_GENERATED,
    trigger: StatusTrigger.LLMS_COMPLETION
  },
  
  // Publication workflow
  {
    from: DocumentUpdateStatus.LLMS_GENERATED,
    to: DocumentUpdateStatus.PUBLISHED,
    trigger: StatusTrigger.LLMS_COMPLETION
  }
];

/**
 * Default workflow configuration
 */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  autoSyncEnabled: true,
  autoSyncDelay: 1000, // 1 second
  
  autoLLMSGeneration: true,
  llmsGenerationTriggers: [
    DocumentUpdateStatus.READY_FOR_LLMS,
    DocumentUpdateStatus.EDIT_COMPLETED,
    DocumentUpdateStatus.REVIEW_COMPLETED
  ],
  
  validationRequired: true,
  validationRules: [],
  
  notificationEnabled: true,
  notificationTargets: [
    {
      type: 'console',
      config: { level: 'info' }
    }
  ]
};