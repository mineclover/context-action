/**
 * @context-action/llms-generator - Main exports
 */

// Core classes
export { LLMSGenerator } from './core/LLMSGenerator.js';
export { PriorityManager } from './core/PriorityManager.js';
export { DocumentProcessor } from './core/DocumentProcessor.js';
export { PriorityGenerator } from './core/PriorityGenerator.js';
export { PrioritySchemaManager } from './core/PrioritySchemaManager.js';
export { SchemaGenerator } from './core/SchemaGenerator.js';
export { MarkdownGenerator } from './core/MarkdownGenerator.js';
export { ContentExtractor } from './core/ContentExtractor.js';
export { AdaptiveComposer } from './core/AdaptiveComposer.js';
export { WorkStatusManager } from './core/WorkStatusManager.js';
export { ConfigManager } from './core/ConfigManager.js';
export { InstructionGenerator } from './core/InstructionGenerator.js';

// Types
export * from './types/index.js';
export * from './types/user-config.js';
export * from './types/instruction.js';

// Utilities
export * from './utils/index.js';

// Default configuration
export const DEFAULT_CONFIG = {
  paths: {
    docsDir: './docs',
    llmContentDir: './packages/llms-generator/data',
    outputDir: './docs/llms',
    templatesDir: './templates',
    instructionsDir: './instructions'
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