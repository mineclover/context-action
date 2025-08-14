/**
 * Configuration types for LLMS Generator
 */

export interface LLMSConfig {
  paths: {
    docsDir: string;           // 원본 문서 경로
    llmContentDir: string;     // llm-content 경로  
    outputDir: string;         // 출력 디렉토리
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