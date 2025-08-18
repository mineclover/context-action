/**
 * Config Types - Configuration-related types
 */

export interface PathConfig {
  docsDir: string;
  llmContentDir: string;
  outputDir: string;
  templatesDir: string;
  instructionsDir: string;
}

export interface GenerationConfig {
  supportedLanguages: string[];
  characterLimits: number[];
  defaultCharacterLimits: {
    summary: number;
    detailed: number;
    comprehensive: number;
  };
  defaultLanguage: string;
  outputFormat: 'txt';
}

export interface QualityConfig {
  minCompletenessThreshold: number;
  enableValidation: boolean;
  strictMode: boolean;
}

export interface CategoryConfig {
  [key: string]: {
    priority: number;
    description: string;
    documentTypes: string[];
  };
}

export interface AppConfig {
  paths: PathConfig;
  generation: GenerationConfig;
  quality: QualityConfig;
  categories?: CategoryConfig;
}

export interface EnhancedConfig extends AppConfig {
  version: string;
  lastUpdated: string;
  environment: 'development' | 'production' | 'test';
}