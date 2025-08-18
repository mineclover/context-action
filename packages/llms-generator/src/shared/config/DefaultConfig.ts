/**
 * Default Config - Default application configuration
 */

import { AppConfig } from '../types/ConfigTypes.js';

export const DEFAULT_CONFIG: AppConfig = {
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

export const PRODUCTION_CONFIG: Partial<AppConfig> = {
  quality: {
    minCompletenessThreshold: 0.9,
    enableValidation: true,
    strictMode: true
  }
};

export const DEVELOPMENT_CONFIG: Partial<AppConfig> = {
  quality: {
    minCompletenessThreshold: 0.7,
    enableValidation: false,
    strictMode: false
  }
};