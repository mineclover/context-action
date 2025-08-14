/**
 * Priority metadata types based on priority-schema.json
 */

export enum DocumentCategory {
  GUIDE = 'guide',
  API = 'api',
  CONCEPT = 'concept',
  EXAMPLE = 'example',
  REFERENCE = 'reference',
  LLMS = 'llms'
}

export enum PriorityTier {
  CRITICAL = 'critical',
  ESSENTIAL = 'essential',
  IMPORTANT = 'important',
  REFERENCE = 'reference',
  SUPPLEMENTARY = 'supplementary'
}

export enum ExtractionStrategy {
  CONCEPT_FIRST = 'concept-first',
  EXAMPLE_FIRST = 'example-first',
  API_FIRST = 'api-first',
  TUTORIAL_FIRST = 'tutorial-first',
  REFERENCE_FIRST = 'reference-first'
}

export type TargetAudience = 
  | 'beginners' 
  | 'intermediate' 
  | 'advanced' 
  | 'framework-users' 
  | 'contributors' 
  | 'llms';

export type ConsistencyCheck = 
  | 'terminology' 
  | 'code_style' 
  | 'naming_conventions' 
  | 'pattern_usage' 
  | 'api_signatures';

export interface CharacterLimitGuideline {
  focus: string;
  structure: string;
  must_include: string[];
  avoid: string[];
  example_structure?: string;
}

export interface CharacterLimitsConfig {
  minimum?: CharacterLimitGuideline;
  origin?: CharacterLimitGuideline;
  [key: string]: CharacterLimitGuideline | undefined; // for numeric limits like "100", "300", etc.
}

export interface PriorityMetadata {
  document: {
    id: string;
    title: string;
    source_path: string;
    category: DocumentCategory;
    subcategory?: string;
  };
  priority: {
    score: number; // 1-100
    tier: PriorityTier;
    rationale?: string;
  };
  purpose: {
    primary_goal: string;
    target_audience: TargetAudience[];
    use_cases: string[];
    dependencies: string[];
  };
  keywords: {
    primary: string[];
    technical: string[];
    patterns?: string[];
    avoid?: string[];
  };
  extraction: {
    strategy: ExtractionStrategy;
    character_limits: CharacterLimitsConfig;
    emphasis: {
      must_include: string[];
      nice_to_have: string[];
    };
  };
  quality: {
    completeness_threshold: number;
    code_examples_required: boolean;
    consistency_checks: ConsistencyCheck[];
  };
  metadata: {
    created: string;
    updated?: string;
    version: string;
    original_size: number;
    estimated_extraction_time: Record<string, string>;
  };
}

export interface PriorityCollection {
  [language: string]: {
    [documentId: string]: PriorityMetadata;
  };
}

export interface SortedPriorityCollection {
  language: string;
  documents: Array<{
    id: string;
    priority: PriorityMetadata;
  }>;
}

export interface PriorityUpdate {
  language: string;
  documentId: string;
  updates: Partial<PriorityMetadata>;
  timestamp: string;
}