/**
 * @context-action/llms-generator - Optimized Main exports
 * 
 * Only core functionality that is actually used by the CLI
 */

// Core classes (only actively used)
export { EnhancedConfigManager } from './core/EnhancedConfigManager.js';

// Types (only actively used)
export type { 
  LLMSConfig, 
  SummaryConfig, 
  GenerationOptions, 
  EnhancedLLMSConfig, 
  UIConfig 
} from './types/config.js';
// Export only specific types from shared to avoid conflicts
export type { 
  Result, 
  OperationResult, 
  Paginated, 
  SortOptions, 
  FilterOptions,
  ValidationError
} from './shared/types/index.js';

// Default configuration
export { DEFAULT_CONFIG } from './shared/config/DefaultConfig.js';