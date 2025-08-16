/**
 * Centralized exports for all types
 */

export * from './priority.js';
export * from './document.js';
export * from './config.js';

// Re-export domain entities and value objects for convenience
export type { DocumentSummary } from '../domain/entities/DocumentSummary.js';
export type { 
  DocumentMetadata, 
  PriorityInfo, 
  SummaryMetadata, 
  GenerationInfo 
} from '../domain/entities/DocumentSummary.js';

export type { Frontmatter, FrontmatterData } from '../domain/value-objects/Frontmatter.js';

// Re-export service interfaces
export type { 
  IFrontmatterService,
  MarkdownWithFrontmatter,
  ParseResult,
  GenerateOptions
} from '../domain/services/interfaces/IFrontmatterService.js';

export type {
  SummaryExtractorInterface,
  ExtractionContext,
  ExtractionResult,
  MinimumDocumentInfo,
  OriginDocumentInfo
} from '../domain/services/interfaces/SummaryExtractorInterface.js';

export type {
  DocumentSummaryRepositoryInterface,
  SummarySearchCriteria,
  SummarySortOptions,
  SaveResult,
  BatchResult
} from '../domain/repositories/DocumentSummaryRepositoryInterface.js';

// Re-export use case types
export type {
  GenerateSummaryRequest,
  GenerateSummaryResponse,
  BatchGenerateRequest,
  BatchGenerateResponse
} from '../application/use-cases/GenerateSummaryUseCase.js';

export type {
  SummaryGenerationSource,
  BulkSummaryGenerationRequest,
  DocumentGenerationResult,
  BulkGenerationResult
} from '../application/use-cases/SummaryGeneratorUseCase.js';

// Re-export DI container types
export type { ServiceContainer } from '../infrastructure/di/DIContainer.js';