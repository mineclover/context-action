/**
 * Config Validator - Validates configuration objects
 */

import { AppConfig, GenerationConfig, PathConfig, QualityConfig } from '../types/ConfigTypes.js';
import { ValidationError, ValidationResult } from '../types/index.js';

function validatePaths(paths: PathConfig): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredPaths = ['docsDir', 'llmContentDir', 'outputDir', 'templatesDir', 'instructionsDir'];

    for (const pathKey of requiredPaths) {
      const path = (paths as unknown as Record<string, unknown>)[pathKey];
      if (!path || typeof path !== 'string' || path.trim() === '') {
        errors.push({
          field: `paths.${pathKey}`,
          message: `${pathKey} is required and must be a non-empty string`,
          code: 'REQUIRED_PATH'
        });
      }
    }

    return errors;
  }

function validateGeneration(generation: GenerationConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate supported languages
    if (!Array.isArray(generation.supportedLanguages) || generation.supportedLanguages.length === 0) {
      errors.push({
        field: 'generation.supportedLanguages',
        message: 'supportedLanguages must be a non-empty array',
        code: 'INVALID_LANGUAGES'
      });
    }

    // Validate character limits
    if (!Array.isArray(generation.characterLimits) || generation.characterLimits.length === 0) {
      errors.push({
        field: 'generation.characterLimits',
        message: 'characterLimits must be a non-empty array',
        code: 'INVALID_CHAR_LIMITS'
      });
    } else {
      const invalidLimits = generation.characterLimits.filter(limit => 
        typeof limit !== 'number' || limit <= 0
      );
      if (invalidLimits.length > 0) {
        errors.push({
          field: 'generation.characterLimits',
          message: 'All character limits must be positive numbers',
          code: 'INVALID_CHAR_LIMIT_VALUES'
        });
      }
    }

    // Validate default language
    if (!generation.defaultLanguage || !generation.supportedLanguages.includes(generation.defaultLanguage)) {
      errors.push({
        field: 'generation.defaultLanguage',
        message: 'defaultLanguage must be one of the supported languages',
        code: 'INVALID_DEFAULT_LANGUAGE'
      });
    }

    return errors;
  }

function validateQuality(quality: QualityConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate completeness threshold
    if (typeof quality.minCompletenessThreshold !== 'number' || 
        quality.minCompletenessThreshold < 0 || 
        quality.minCompletenessThreshold > 1) {
      errors.push({
        field: 'quality.minCompletenessThreshold',
        message: 'minCompletenessThreshold must be a number between 0 and 1',
        code: 'INVALID_THRESHOLD'
      });
    }

    return errors;
}

/**
 * Configuration validation API. Kept as an object to preserve the historical
 * `ConfigValidator.validate(...)` call shape without introducing a static-only
 * class.
 */
export const ConfigValidator = {
  validate(config: AppConfig): ValidationResult {
    const errors: ValidationError[] = [
      ...validatePaths(config.paths),
      ...validateGeneration(config.generation),
      ...validateQuality(config.quality)
    ];

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} as const;
