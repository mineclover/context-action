/**
 * @context-action/llms-generator - Main exports
 */

// Core classes
export { LLMSGenerator } from './core/LLMSGenerator.js';
export { PriorityManager } from './core/PriorityManager.js';
export { DocumentProcessor } from './core/DocumentProcessor.js';

// Types
export * from './types/index.js';

// Utilities
export * from './utils/index.js';

// Default configuration
export const DEFAULT_CONFIG = {
  paths: {
    docsDir: './docs',
    llmContentDir: './docs/llm-content',
    outputDir: './docs/llms'
  },
  generation: {
    supportedLanguages: ['en', 'ko'],
    characterLimits: [100, 300, 500, 1000, 2000, 3000, 4000],
    defaultLanguage: 'en',
    outputFormat: 'txt' as const
  },
  quality: {
    minCompletenessThreshold: 0.8,
    enableValidation: true,
    strictMode: false
  }
};