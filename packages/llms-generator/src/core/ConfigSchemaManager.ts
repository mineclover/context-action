/**
 * Configuration Schema Manager - handles config validation and type safety
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export interface EstimatedReadingTime {
  min: number;
  max: number;
  unit: 'seconds' | 'minutes' | 'hours';
  complexity: 'low' | 'medium' | 'high';
}

export interface TimeSpan {
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}

export interface CategoryConfig {
  name: string;
  description: string;
  priority: number;
  defaultStrategy: 'tutorial-first' | 'api-first' | 'concept-first' | 'example-first' | 'reference-first';
  tags: string[];
  color?: string;
  icon?: string;
}

export interface TagConfig {
  name: string;
  description: string;
  weight: number;
  compatibleWith?: string[];
  audience?: Array<'new-users' | 'learners' | 'experienced-users' | 'experts' | 'contributors' | 'all-users'>;
  estimatedReadingTime?: EstimatedReadingTime;
  importance?: 'critical' | 'high' | 'medium' | 'low' | 'optional';
  frequency?: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  urgency?: 'critical' | 'high' | 'medium' | 'low';
}

export interface DependencyRule {
  description: string;
  weight: number;
  autoInclude: boolean;
  maxDepth?: number;
  strategy?: 'breadth-first' | 'depth-first' | 'selective' | 'optional' | 'space-permitting';
}

export interface CompositionWeights {
  categoryWeight: number;
  tagWeight: number;
  dependencyWeight: number;
  priorityWeight: number;
}

export interface CompositionConstraints {
  minCategoryRepresentation?: number;
  maxDocumentsPerCategory?: number;
  requireCoreTags?: boolean;
  includeDependencyChains?: boolean;
  preferredTags?: string[];
}

export interface CompositionStrategy {
  name: string;
  description: string;
  weights: CompositionWeights;
  constraints?: CompositionConstraints;
}

export interface OptimizationConfig {
  spaceUtilizationTarget?: number;
  qualityThreshold?: number;
  diversityBonus?: number;
  redundancyPenalty?: number;
}

export interface ExtractionStrategy {
  focusOrder: string[];
  weightMultipliers?: Record<string, number>;
}

export interface LLMSEnhancedConfig {
  characterLimits: number[];
  languages: string[];
  paths: {
    docsDir: string;
    dataDir: string;
    outputDir: string;
    tempDir?: string;
    cacheDir?: string;
  };
  categories: Record<string, CategoryConfig>;
  tags: Record<string, TagConfig>;
  dependencies?: {
    rules?: {
      prerequisite?: DependencyRule;
      reference?: DependencyRule;
      followup?: DependencyRule;
      complement?: DependencyRule;
    };
    conflictResolution?: {
      strategy?: 'exclude-conflicts' | 'include-highest-priority' | 'user-choice';
      priority?: 'higher-score-wins' | 'category-priority' | 'manual-override';
      allowPartialConflicts?: boolean;
    };
  };
  composition?: {
    strategies?: Record<string, CompositionStrategy>;
    defaultStrategy?: string;
    optimization?: OptimizationConfig;
  };
  extraction?: {
    defaultQualityThreshold?: number;
    autoTagExtraction?: boolean;
    autoDependencyDetection?: boolean;
    strategies?: Record<string, ExtractionStrategy>;
  };
  validation?: {
    schema?: {
      enforceTagConsistency?: boolean;
      validateDependencies?: boolean;
      checkCategoryAlignment?: boolean;
    };
    quality?: {
      minPriorityScore?: number;
      maxDocumentAge?: TimeSpan;
      requireMinimumContent?: boolean;
    };
  };
  ui?: {
    dashboard?: {
      enableTagCloud?: boolean;
      showCategoryStats?: boolean;
      enableDependencyGraph?: boolean;
    };
    reporting?: {
      generateCompositionReports?: boolean;
      includeQualityMetrics?: boolean;
      exportFormats?: Array<'json' | 'csv' | 'html' | 'xml' | 'yaml'>;
    };
  };
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  config?: LLMSEnhancedConfig;
}

export class ConfigSchemaManager {
  private schemaPath: string;
  private schema: any = null;
  private ajv: Ajv | null = null;
  private validate: any = null;

  constructor(dataDir: string) {
    this.schemaPath = path.join(dataDir, 'config-schema.json');
  }

  /**
   * Load and compile the configuration schema
   */
  async loadSchema(): Promise<any> {
    if (!existsSync(this.schemaPath)) {
      throw new Error(`Configuration schema not found: ${this.schemaPath}`);
    }

    const schemaContent = await readFile(this.schemaPath, 'utf-8');
    this.schema = JSON.parse(schemaContent);
    
    // Initialize Ajv validator
    this.initializeValidator();
    
    return this.schema;
  }

  /**
   * Initialize Ajv validator with custom formats
   */
  private initializeValidator(): void {
    if (!this.schema) {
      throw new Error('Schema must be loaded before initializing validator');
    }

    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });

    // Add format support
    addFormats(this.ajv);

    // Add custom formats
    this.addCustomFormats();

    // Compile schema
    try {
      this.validate = this.ajv.compile(this.schema);
    } catch (error) {
      throw new Error(`Failed to compile configuration schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add custom format validators
   */
  private addCustomFormats(): void {
    if (!this.ajv) return;

    // Validate weight sum for composition strategies
    this.ajv.addKeyword({
      keyword: 'weightSum',
      type: 'object',
      schemaType: 'number',
      compile: (targetSum: number) => {
        return function validate(data: CompositionWeights) {
          const sum = data.categoryWeight + data.tagWeight + data.dependencyWeight + data.priorityWeight;
          return Math.abs(sum - targetSum) < 0.01; // Allow small floating point errors
        };
      }
    });
  }

  /**
   * Validate configuration against schema
   */
  async validateConfig(configPath: string): Promise<ConfigValidationResult> {
    if (!this.validate) {
      await this.loadSchema();
    }

    try {
      const configContent = await readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      const valid = this.validate(config);
      const errors: string[] = [];
      const warnings: string[] = [];

      // Collect validation errors
      if (this.validate.errors) {
        for (const error of this.validate.errors) {
          const path = error.instancePath || error.schemaPath || '';
          const message = error.message || 'validation error';
          errors.push(`${path}: ${message}`);
        }
      }

      // Additional semantic validations
      if (valid) {
        const semanticValidation = this.validateSemantics(config);
        errors.push(...semanticValidation.errors);
        warnings.push(...semanticValidation.warnings);
      }

      return {
        valid: valid && errors.length === 0,
        errors,
        warnings,
        config: valid ? config : undefined
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Perform semantic validation beyond schema structure
   */
  private validateSemantics(config: LLMSEnhancedConfig): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate composition strategy weights sum to 1.0
    if (config.composition?.strategies) {
      for (const [strategyName, strategy] of Object.entries(config.composition.strategies)) {
        const weightSum = Object.values(strategy.weights).reduce((sum, weight) => sum + weight, 0);
        if (Math.abs(weightSum - 1.0) > 0.01) {
          errors.push(`composition.strategies.${strategyName}.weights: weights must sum to 1.0 (current: ${weightSum.toFixed(3)})`);
        }
      }
    }

    // Validate tag references in categories
    if (config.categories && config.tags) {
      const availableTags = new Set(Object.keys(config.tags));
      for (const [categoryName, category] of Object.entries(config.categories)) {
        for (const tag of category.tags || []) {
          if (!availableTags.has(tag)) {
            warnings.push(`categories.${categoryName}.tags: references undefined tag "${tag}"`);
          }
        }
      }
    }

    // Validate compatibleWith references in tags
    if (config.tags) {
      const availableTags = new Set(Object.keys(config.tags));
      for (const [tagName, tag] of Object.entries(config.tags)) {
        for (const compatibleTag of tag.compatibleWith || []) {
          if (!availableTags.has(compatibleTag)) {
            warnings.push(`tags.${tagName}.compatibleWith: references undefined tag "${compatibleTag}"`);
          }
        }
      }
    }

    // Validate default strategy reference
    if (config.composition?.defaultStrategy && config.composition?.strategies) {
      if (!config.composition.strategies[config.composition.defaultStrategy]) {
        errors.push(`composition.defaultStrategy: references undefined strategy "${config.composition.defaultStrategy}"`);
      }
    }

    // Validate character limits are sorted
    if (config.characterLimits) {
      const sorted = [...config.characterLimits].sort((a, b) => a - b);
      if (!config.characterLimits.every((limit, index) => limit === sorted[index])) {
        warnings.push('characterLimits: should be sorted in ascending order for optimal processing');
      }
    }

    return { errors, warnings };
  }

  /**
   * Generate TypeScript type definitions from schema
   */
  async generateTypeDefinitions(outputPath: string): Promise<void> {
    if (!this.schema) {
      await this.loadSchema();
    }

    const typeDefinitions = this.generateTypesFromSchema(this.schema);
    await writeFile(outputPath, typeDefinitions, 'utf-8');
  }

  /**
   * Generate TypeScript types from JSON schema
   */
  private generateTypesFromSchema(schema: any): string {
    return `/**
 * Generated TypeScript types from config-schema.json
 * DO NOT EDIT MANUALLY - This file is auto-generated
 */

// Re-export types from ConfigSchemaManager for consistency
export type {
  LLMSEnhancedConfig,
  CategoryConfig,
  TagConfig,
  DependencyRule,
  CompositionStrategy,
  CompositionWeights,
  CompositionConstraints,
  OptimizationConfig,
  ExtractionStrategy,
  EstimatedReadingTime,
  TimeSpan,
  ConfigValidationResult
} from './ConfigSchemaManager.js';

// Additional utility types
export type CategoryName = keyof LLMSEnhancedConfig['categories'];
export type TagName = keyof LLMSEnhancedConfig['tags'];
export type StrategyName = keyof NonNullable<LLMSEnhancedConfig['composition']>['strategies'];
export type Language = LLMSEnhancedConfig['languages'][number];
export type CharacterLimit = LLMSEnhancedConfig['characterLimits'][number];
`;
  }

  /**
   * Get schema information
   */
  getSchemaInfo(): any {
    if (!this.schema) {
      return null;
    }

    return {
      title: this.schema.title || 'Unknown',
      description: this.schema.description || '',
      version: this.schema.$id || 'Unknown',
      requiredFields: this.schema.required || [],
      optionalFields: Object.keys(this.schema.properties || {}).filter(
        key => !this.schema.required?.includes(key)
      )
    };
  }

  /**
   * Validate configuration in memory
   */
  validateConfigObject(config: any): ConfigValidationResult {
    if (!this.validate) {
      return {
        valid: false,
        errors: ['Schema not loaded. Call loadSchema() first.']
      };
    }

    const valid = this.validate(config);
    const errors: string[] = [];

    if (this.validate.errors) {
      for (const error of this.validate.errors) {
        const path = error.instancePath || error.schemaPath || '';
        const message = error.message || 'validation error';
        errors.push(`${path}: ${message}`);
      }
    }

    // Semantic validation
    if (valid) {
      const semanticValidation = this.validateSemantics(config);
      errors.push(...semanticValidation.errors);
    }

    return {
      valid: valid && errors.length === 0,
      errors,
      config: valid ? config : undefined
    };
  }
}