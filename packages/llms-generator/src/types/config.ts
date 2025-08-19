/**
 * Configuration types for LLMS Generator
 */

// Domain types commented out - not used in this configuration
// import { CharacterLimit, DocumentId } from '../domain/value-objects/index.js';
import type { 
  DocumentCategory, 
  PriorityTier, 
  TargetAudience, 
  ExtractionStrategy 
} from './priority.js';

export interface LLMSConfig {
  paths: {
    docsDir: string;           // 원본 문서 경로
    llmContentDir: string;     // llm-content 경로  
    outputDir: string;         // 출력 디렉토리
    templatesDir: string;      // 지시문 템플릿 경로
    instructionsDir: string;   // 생성된 지시문 경로
  };
  
  generation: {
    supportedLanguages: string[];
    characterLimits: number[];
    defaultLanguage: string;
    outputFormat: 'txt' | 'md';
  };
  
  quality: {
    minCompletenessThreshold: number;
    enableValidation: boolean;
    strictMode: boolean;
  };
  
  sync?: {
    enabled: boolean;
    serverUrl: string;
    apiKey: string;
  };
}

export interface SummaryConfig {
  maxRetries: number;
  timeout: number;
  enableCaching: boolean;
  cacheDir?: string;
}

export interface GenerationOptions {
  languages?: string[];
  formats?: GenerationFormat[];
  characterLimits?: number[];
  outputDir?: string;
  validate?: boolean;
}

export type GenerationFormat = 'minimum' | 'origin' | 'chars';

export interface GenerationResult {
  success: boolean;
  results: {
    [format: string]: {
      [language: string]: {
        path: string;
        size: number;
        charactersGenerated: number;
      };
    };
  };
  errors: string[];
  warnings: string[];
  totalFiles: number;
  totalSize: number;
  executionTime: number;
}

export interface QualityCriteria {
  completenessThreshold: number;
  requiredKeywords: string[];
  forbiddenKeywords?: string[];
  maxLength?: number;
  minLength?: number;
  requireCodeExamples?: boolean;
}

// Enhanced Configuration Types for Tag/Category System

export interface CategoryConfig {
  name: string;
  description: string;
  priority: number;
  defaultStrategy: ExtractStrategy;
  tags: string[];
  color?: string;
  icon?: string;
}

export interface TagConfig {
  name: string;
  description: string;
  weight: number;
  compatibleWith: string[];
  audience?: string[];
  importance?: 'critical' | 'optional';
  frequency?: 'high' | 'low';
  urgency?: 'high' | 'medium' | 'low';
}

export interface DependencyRuleConfig {
  description: string;
  weight: number;
  autoInclude: boolean;
  maxDepth?: number;
  strategy?: 'breadth-first' | 'selective' | 'optional' | 'space-permitting';
}

export interface DependencyConfig {
  rules: {
    prerequisite: DependencyRuleConfig;
    reference: DependencyRuleConfig;
    followup: DependencyRuleConfig;
    complement: DependencyRuleConfig;
  };
  conflictResolution: {
    strategy: 'exclude-conflicts' | 'higher-score-wins' | 'exclude-both' | 'manual-review';
    priority: 'higher-score-wins' | 'category-priority' | 'manual-review';
    allowPartialConflicts: boolean;
  };
}

export interface CompositionStrategyConfig {
  name: string;
  description?: string;
  algorithm?: string;
  weights?: {
    categoryWeight: number;
    tagWeight: number;
    dependencyWeight: number;
    priorityWeight: number;
    contextualWeight?: number;
  };
  criteria?: {
    categoryWeight: number;
    tagWeight: number;
    dependencyWeight: number;
    priorityWeight: number;
    contextualWeight?: number;
  };
  constraints?: {
    minCategoryRepresentation: number;
    maxDocumentsPerCategory: number;
    requireCoreTags: boolean;
    includeDependencyChains?: boolean;
    preferredTags?: string[];
  };
}

export interface CompositionConfig {
  strategies: Record<string, CompositionStrategyConfig>;
  defaultStrategy: string;
  optimization: {
    spaceUtilizationTarget: number;
    qualityThreshold: number;
    diversityBonus: number;
    redundancyPenalty: number;
  };
}

export interface ExtractionConfig {
  defaultQualityThreshold: number;
  autoTagExtraction: boolean;
  autoDependencyDetection: boolean;
  strategies: Record<ExtractStrategy, {
    focusOrder: string[];
  }>;
}

export interface ValidationConfig {
  schema: {
    enforceTagConsistency: boolean;
    validateDependencies: boolean;
    checkCategoryAlignment: boolean;
  };
  quality: {
    minPriorityScore: number;
    maxDocumentAge: string;
    requireMinimumContent: boolean;
  };
}

export interface UIConfig {
  dashboard: {
    enableTagCloud: boolean;
    showCategoryStats: boolean;
    enableDependencyGraph: boolean;
  };
  reporting: {
    generateCompositionReports: boolean;
    includeQualityMetrics: boolean;
    exportFormats: ('json' | 'csv' | 'html')[];
  };
}

export interface EnhancedLLMSConfig extends LLMSConfig {
  categories: Record<string, CategoryConfig>;
  tags: Record<string, TagConfig>;
  dependencies: DependencyConfig;
  composition: CompositionConfig;
  extraction: ExtractionConfig;
  validation: ValidationConfig;
  ui: UIConfig;
}

// Re-export from priority.ts to avoid duplication
export { ExtractionStrategy, DocumentCategory, PriorityTier } from './priority.js';
export type { TargetAudience, ConsistencyCheck } from './priority.js';

// Extract Strategy type - make compatible with configuration expectations
export type ExtractStrategy = keyof typeof ExtractionStrategy | string;

// Selection and Composition Types

export interface SelectionContext {
  targetCategory?: DocumentCategory;
  targetTags: string[];
  tagWeights: Record<string, number>;
  selectedDocuments: DocumentMetadata[];
  requiredTopics?: string[];
  characterLimit: number;
  targetCharacterLimit: number;
}

export interface SelectionConstraints {
  characterLimit: number;
  targetCharacterLimit: number;
  maxCharacters?: number;
  maxDocuments?: number;
  minQualityScore?: number;
  requiredCategories?: string[];
  excludedCategories?: string[];
  preferredTags?: string[];
  excludedTags?: string[];
  context: SelectionContext;
}

export interface DocumentMetadata {
  document: {
    id: string;
    title: string;
    source_path: string;
    category: DocumentCategory;
    subcategory?: string;
    lastModified?: string;
    wordCount?: number;
  };
  priority: {
    score: number;
    tier: PriorityTier;
    rationale?: string;
    reviewDate?: string;
    autoCalculated?: boolean;
  };
  tags: {
    primary: string[];
    secondary: string[];
    audience: TargetAudience[];
    complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
    lastUpdated?: string;
  };
  keywords?: {
    primary: string[];
    technical: string[];
    domain: string[];
    patterns?: string[];
    avoid?: string[];
  };
  dependencies: {
    prerequisites: Array<{
      documentId: string;
      importance: 'required' | 'recommended' | 'optional';
      reason?: string;
    }>;
    references: Array<{
      documentId: string;
      type: 'concept' | 'example' | 'api' | 'implementation';
      relevance?: number;
    }>;
    followups: Array<{
      documentId: string;
      reason?: string;
      timing: 'immediate' | 'after-practice' | 'advanced-stage';
    }>;
    conflicts: Array<{
      documentId: string;
      reason: string;
      severity: 'minor' | 'moderate' | 'major';
    }>;
    complements: Array<{
      documentId: string;
      relationship: 'alternative-approach' | 'deeper-dive' | 'practical-example' | 'related-concept';
      strength?: number;
    }>;
  };
  composition?: {
    categoryAffinity: Record<string, number>;
    tagAffinity: Record<string, number>;
    contextualRelevance: {
      onboarding?: number;
      troubleshooting?: number;
      advanced_usage?: number;
      api_reference?: number;
      learning_path?: number;
    };
    userJourneyStage?: 'discovery' | 'onboarding' | 'implementation' | 'mastery' | 'troubleshooting';
  };
  quality?: {
    readabilityScore: number;
    completenessScore: number;
    accuracyScore: number;
    freshnessScore: number;
  };
}