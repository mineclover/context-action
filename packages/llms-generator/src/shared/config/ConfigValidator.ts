/**
 * Config Validator - Validates configuration objects
 */

import { AppConfig, PathConfig, GenerationConfig, QualityConfig } from '../types/ConfigTypes.js';
import { ValidationResult, ValidationError } from '../types/index.js';

export class ConfigValidator {
  static validate(config: AppConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate paths
    errors.push(...this.validatePaths(config.paths));

    // Validate generation config
    errors.push(...this.validateGeneration(config.generation));

    // Validate quality config
    errors.push(...this.validateQuality(config.quality));

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static validatePaths(paths: PathConfig): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredPaths = ['docsDir', 'llmContentDir', 'outputDir', 'templatesDir', 'instructionsDir'];

    for (const pathKey of requiredPaths) {
      const path = (paths as any)[pathKey];
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

  private static validateGeneration(generation: GenerationConfig): ValidationError[] {
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

  private static validateQuality(quality: QualityConfig): ValidationError[] {
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
}