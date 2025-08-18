/**
 * @context-action/llms-generator - Optimized Main exports
 * 
 * Only core functionality that is actually used by the CLI
 */

// Core classes (only actively used)
export { EnhancedConfigManager } from './core/EnhancedConfigManager.js';

// Types (only actively used)
export * from './types/config.js';
export * from './shared/types/index.js';

// Default configuration
export { DEFAULT_CONFIG } from './shared/config/DefaultConfig.js';