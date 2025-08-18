/**
 * Centralized exports for all types
 */

export * from './priority.js';
export * from './document.js';
export type { 
  LLMSConfig, 
  SummaryConfig, 
  GenerationOptions, 
  EnhancedLLMSConfig, 
  UIConfig 
} from './config.js';

// Domain-related exports removed - not used in current CLI implementation
// These were part of a more complex domain-driven architecture that is not currently needed

// Re-export document status types (excluding ValidationResult to avoid duplicates)
export type { 
  DocumentUpdateStatus, 
  StatusTransition, 
  StatusTrigger, 
  StatusContext, 
  WorkflowConfig,
  EnhancedFrontmatter,
  IDocumentStatusManager
} from './document-status.js';

// Re-export front matter types (disabled until FrontMatterManager is implemented)
// export type { FrontMatterSpec, FrontMatterOptions } from '../core/FrontMatterManager.js';