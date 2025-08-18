/**
 * CLI Types - Common types for CLI system
 */

export interface CLICommand {
  execute(args: string[]): Promise<void>;
}

export interface CLIConfig {
  paths: {
    docsDir: string;
    llmContentDir: string;
    outputDir: string;
    templatesDir: string;
    instructionsDir: string;
  };
  generation: {
    supportedLanguages: string[];
    characterLimits: number[];
    defaultCharacterLimits: {
      summary: number;
      detailed: number;
      comprehensive: number;
    };
    defaultLanguage: string;
    outputFormat: 'txt';
  };
  quality: {
    minCompletenessThreshold: number;
    enableValidation: boolean;
    strictMode: boolean;
  };
  categories?: Record<string, any>;
}

export interface WorkNextOptions {
  language?: string;
  showCompleted?: boolean;
  verbose?: boolean;
}

export interface LLMSGenerateOptions {
  characterLimit?: number;
  category?: string;
  language?: string;
  pattern?: 'standard' | 'minimum' | 'origin';
  dryRun?: boolean;
  verbose?: boolean;
}

export interface CleanLLMSOptions {
  characterLimit?: number;
  language?: string;
  category?: string;
  pattern?: 'clean' | 'minimal' | 'raw';
  dryRun?: boolean;
  verbose?: boolean;
}