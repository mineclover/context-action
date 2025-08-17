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
export { EnhancedWorkStatusManager } from './core/EnhancedWorkStatusManager.js';
export { ConfigManager } from './core/ConfigManager.js';
export { InstructionGenerator } from './core/InstructionGenerator.js';
export { CategoryMinimumGenerator } from './core/CategoryMinimumGenerator.js';
export { FrontMatterManager, frontMatterManager } from './core/FrontMatterManager.js';

// Types
export * from './types/index.js';
export * from './types/user-config.js';
export * from './types/instruction.js';

// Utilities
export * from './utils/index.js';

// Domain Layer (Clean Architecture)
export { DocumentSummary } from './domain/entities/DocumentSummary.js';
export { DocumentSummaryFactory } from './domain/factories/DocumentSummaryFactory.js';
export { DocumentId } from './domain/value-objects/DocumentId.js';
export { CharacterLimit } from './domain/value-objects/CharacterLimit.js';
export { Result, Errors } from './domain/value-objects/Result.js';
export * from './domain/events/DomainEvent.js';
export * from './domain/events/DocumentSummaryEvents.js';
export { Specification, SpecificationBuilder } from './domain/specifications/Specification.js';
export * from './domain/specifications/DocumentSummarySpecifications.js';

// Default configuration
export const DEFAULT_CONFIG = {
  paths: {
    docsDir: './docs',
    llmContentDir: './data',
    outputDir: './docs/llms',
    templatesDir: './templates',
    instructionsDir: './instructions'
  },
  generation: {
    supportedLanguages: ['en', 'ko'],
    characterLimits: [100, 200, 300, 500, 1000, 2000, 5000],
    defaultCharacterLimits: {
      summary: 1000,
      detailed: 3000,
      comprehensive: 5000
    },
    defaultLanguage: 'en',
    outputFormat: 'txt' as const
  },
  quality: {
    minCompletenessThreshold: 0.8,
    enableValidation: true,
    strictMode: false
  }
};