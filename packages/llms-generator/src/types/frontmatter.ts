/**
 * Frontmatter types for LLMS documents
 */

export interface LLMSFrontmatter {
  document_id?: string;
  title?: string;
  category?: string;
  source_path?: string;
  character_limit?: number;
  last_update?: string;
  update_status?: string;
  priority_score?: number;
  priority_tier?: string;
  completion_status?: string;
  workflow_stage?: string;
  quality_score?: number;
  content_length?: number;
  language?: string;
  priority?: number;
  [key: string]: unknown;
}

export interface PriorityData {
  document?: {
    id?: string;
    title?: string;
    source_path?: string;
    category?: string;
    subcategory?: string;
  };
  priority?: {
    score?: number;
    tier?: string;
    rationale?: string;
  };
  purpose?: {
    primary_goal?: string;
    target_audience?: string[];
    use_cases?: string[];
    dependencies?: string[];
  };
  keywords?: {
    primary?: string[];
    technical?: string[];
    patterns?: string[];
    avoid?: string[];
  };
  extraction?: {
    strategy?: string;
    character_limits?: Record<string, unknown>;
    emphasis?: {
      must_include?: string[];
      nice_to_have?: string[];
    };
  };
  quality?: {
    completeness_threshold?: number;
    code_examples_required?: boolean;
    consistency_checks?: string[];
  };
  metadata?: {
    created?: string;
    updated?: string;
    version?: string;
    original_size?: number;
    description?: string;
    tags?: string[];
    keywords?: {
      primary?: string[];
      technical?: string[];
      functional?: string[];
      patterns?: string[];
      avoid?: string[];
    };
  };
  [key: string]: unknown;
}

export interface DocumentSummaryData {
  document?: {
    title?: string;
  };
  purpose?: {
    primary_goal?: string;
  };
}

export interface CleanedPriorityData extends PriorityData {
  document?: {
    title?: string;
    id?: string;
    source_path?: string;
  };
  priority?: {
    score?: number;
    tier?: string;
    rationale?: string;
  };
  quality?: {
    completeness_threshold?: number;
  };
  extraction?: {
    character_limits?: Record<string, unknown>;
  };
}

export interface ConfigCategories {
  [category: string]: {
    priority?: number;
    description?: string;
    [key: string]: unknown;
  };
}