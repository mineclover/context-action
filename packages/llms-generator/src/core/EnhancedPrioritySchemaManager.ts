/**
 * Enhanced Priority Schema Manager - supports enhanced schema with tags, categories, and dependencies
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { 
  DocumentMetadata, 
  EnhancedLLMSConfig, 
  ExtractStrategy, 
  DocumentCategory, 
  PriorityTier,
  TargetAudience
} from '../types/config.js';

export interface EnhancedPriorityGenerationOptions {
  documentId?: string;
  sourcePath?: string;
  language: string;
  category?: DocumentCategory;
  priorityScore?: number;
  priorityTier?: PriorityTier;
  strategy?: ExtractStrategy;
  tags?: string[];
  targetAudience?: TargetAudience[];
  overwrite?: boolean;
  autoExtractTags?: boolean;
  autoDetectDependencies?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface SchemaInfo {
  version: string;
  description: string;
  categories: string[];
  tiers: string[];
  strategies: string[];
  supportedTags: string[];
  validationRules: number;
}

export class EnhancedPrioritySchemaManager {
  private schemaPath: string;
  private schema: any = null;
  private ajv: Ajv | null = null;
  private validate: any = null;
  private config: EnhancedLLMSConfig | null = null;

  constructor(llmContentDir: string, config?: EnhancedLLMSConfig) {
    this.schemaPath = path.join(llmContentDir, 'priority-schema-enhanced.json');
    this.config = config || null;
  }

  /**
   * Load and validate the enhanced priority schema
   */
  async loadSchema(): Promise<any> {
    if (!existsSync(this.schemaPath)) {
      throw new Error(`Enhanced priority schema not found: ${this.schemaPath}`);
    }

    const schemaContent = await readFile(this.schemaPath, 'utf-8');
    this.schema = JSON.parse(schemaContent);
    
    // Initialize Ajv validator
    this.initializeValidator();
    
    return this.schema;
  }

  /**
   * Set configuration for enhanced features
   */
  setConfig(config: EnhancedLLMSConfig): void {
    this.config = config;
  }

  /**
   * Initialize Ajv validator with enhanced schema
   */
  private initializeValidator(): void {
    if (!this.schema) {
      throw new Error('Schema must be loaded before initializing validator');
    }

    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      removeAdditional: false
    });

    // Add format support
    addFormats(this.ajv);

    // Add custom validation functions
    this.addCustomValidations();

    // Compile schema
    try {
      this.validate = this.ajv.compile(this.schema);
    } catch (error) {
      throw new Error(`Failed to compile enhanced schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add custom validation functions for enhanced features
   */
  private addCustomValidations(): void {
    if (!this.ajv) return;

    // Tag consistency validation
    this.ajv.addKeyword({
      keyword: 'tagConsistency',
      type: 'object',
      schemaType: 'boolean',
      compile: (schemaVal: boolean) => {
        return (data: any): boolean => {
          if (!schemaVal || !this.config) return true;

          const tags = data.tags?.primary || [];
          const category = data.document?.category;

          if (!category || !this.config.categories[category]) return true;

          const categoryTags = this.config.categories[category].tags;
          const hasMatchingTag = tags.some((tag: string) => categoryTags.includes(tag));

          return hasMatchingTag;
        };
      }
    });

    // Dependency validation
    this.ajv.addKeyword({
      keyword: 'validDependencies',
      type: 'object',
      schemaType: 'boolean',
      compile: (schemaVal: boolean) => {
        return (data: any): boolean => {
          if (!schemaVal) return true;

          const dependencies = data.dependencies || {};
          const currentId = data.document?.id;

          // Check for self-references
          const allDeps = [
            ...(dependencies.prerequisites || []),
            ...(dependencies.references || []),
            ...(dependencies.followups || []),
            ...(dependencies.conflicts || []),
            ...(dependencies.complements || [])
          ];

          return !allDeps.some((dep: any) => dep.documentId === currentId);
        };
      }
    });
  }

  /**
   * Validate a priority object against the enhanced schema
   */
  validatePriority(priority: DocumentMetadata): ValidationResult {
    if (!this.validate) {
      // Fall back to basic validation if Ajv is not initialized
      return this.validatePriorityBasic(priority);
    }

    const valid = this.validate(priority);
    
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.validate.errors) {
      for (const error of this.validate.errors) {
        const path = error.instancePath || error.schemaPath || '';
        const message = error.message || 'validation error';
        errors.push(`${path}: ${message}`);
      }
    }

    // Additional semantic validations
    this.performSemanticValidation(priority, warnings);

    return {
      valid,
      errors,
      warnings
    };
  }

  /**
   * Perform additional semantic validation beyond schema
   */
  private performSemanticValidation(priority: DocumentMetadata, warnings: string[]): void {
    // Check tag compatibility
    if (this.config && priority.tags?.primary) {
      for (const tag of priority.tags.primary) {
        const tagConfig = this.config.tags[tag];
        if (tagConfig) {
          // Check for incompatible tag combinations
          const incompatibleTags = priority.tags.primary.filter(otherTag => 
            otherTag !== tag && !tagConfig.compatibleWith.includes(otherTag)
          );

          if (incompatibleTags.length > 0) {
            warnings.push(`Tag '${tag}' may be incompatible with: ${incompatibleTags.join(', ')}`);
          }
        }
      }
    }

    // Check priority score vs category
    if (this.config && priority.document.category) {
      const categoryConfig = this.config.categories[priority.document.category];
      if (categoryConfig && Math.abs(priority.priority.score - categoryConfig.priority) > 20) {
        warnings.push(`Priority score ${priority.priority.score} significantly differs from category average ${categoryConfig.priority}`);
      }
    }

    // Check dependency cycles (basic check)
    const prereqs = priority.dependencies?.prerequisites?.map(p => p.documentId) || [];
    const followups = priority.dependencies?.followups?.map(f => f.documentId) || [];
    const cycles = prereqs.filter(prereq => followups.includes(prereq));
    if (cycles.length > 0) {
      warnings.push(`Potential dependency cycles detected with: ${cycles.join(', ')}`);
    }
  }

  /**
   * Basic validation without Ajv (fallback)
   */
  private validatePriorityBasic(priority: DocumentMetadata): ValidationResult {
    const errors: string[] = [];

    // Basic required field validation
    if (!priority.document) {
      errors.push('document section is required');
    } else {
      if (!priority.document.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(priority.document.id)) {
        errors.push('document.id must match pattern ^[a-z0-9]+(-[a-z0-9]+)*$');
      }
      if (!priority.document.title) {
        errors.push('document.title is required');
      }
      if (!priority.document.source_path) {
        errors.push('document.source_path is required');
      }
      if (!priority.document.category) {
        errors.push('document.category is required');
      }
    }

    if (!priority.priority) {
      errors.push('priority section is required');
    } else {
      if (typeof priority.priority.score !== 'number' || priority.priority.score < 1 || priority.priority.score > 100) {
        errors.push('priority.score must be between 1 and 100');
      }
      if (!priority.priority.tier) {
        errors.push('priority.tier is required');
      }
    }

    if (!priority.tags || !priority.tags.primary || priority.tags.primary.length === 0) {
      errors.push('tags.primary is required and must not be empty');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate an enhanced priority template
   */
  generatePriorityTemplate(options: EnhancedPriorityGenerationOptions): DocumentMetadata {
    const {
      documentId,
      sourcePath,
      language,
      category = 'guide',
      priorityScore,
      priorityTier,
      strategy,
      tags = [],
      targetAudience = ['framework-users', 'beginners'],
      autoExtractTags = true,
      autoDetectDependencies = true
    } = options;

    // Extract document info from source path if not provided
    const finalDocumentId = documentId || this.extractDocumentIdFromPath(sourcePath || '');
    const finalSourcePath = sourcePath || this.generateSourcePathFromId(finalDocumentId, category);
    const title = this.generateTitleFromId(finalDocumentId);

    // Get category config for smart defaults
    const categoryConfig = this.config?.categories[category];
    const finalPriorityScore = priorityScore || categoryConfig?.priority || 75;
    const finalPriorityTier = priorityTier || this.calculateTierFromScore(finalPriorityScore);
    const finalStrategy = strategy || categoryConfig?.defaultStrategy || 'concept-first';

    // Generate smart tags
    const primaryTags = this.generateSmartTags(finalDocumentId, category, tags, autoExtractTags);
    const secondaryTags = this.generateSecondaryTags(category, finalDocumentId);

    const template: DocumentMetadata = {
      document: {
        id: finalDocumentId,
        title: title,
        source_path: finalSourcePath,
        category: category,
        lastModified: new Date().toISOString(),
        wordCount: 0
      },
      priority: {
        score: finalPriorityScore,
        tier: finalPriorityTier,
        rationale: `Auto-generated priority for ${category} document`,
        reviewDate: new Date().toISOString().split('T')[0],
        autoCalculated: true
      },
      purpose: {
        primary_goal: `${category} documentation for ${title}`,
        target_audience: targetAudience,
        use_cases: [],
        learning_objectives: []
      },
      keywords: {
        primary: primaryTags,
        technical: this.generateTechnicalKeywords(finalDocumentId, category),
        patterns: [],
        avoid: []
      },
      tags: {
        primary: primaryTags,
        secondary: secondaryTags,
        audience: targetAudience,
        complexity: this.calculateComplexity(category, primaryTags),
        estimatedReadingTime: this.estimateReadingTime(category),
        lastUpdated: new Date().toISOString().split('T')[0]
      },
      dependencies: {
        prerequisites: autoDetectDependencies ? this.detectPrerequisites(finalDocumentId, category) : [],
        references: [],
        followups: autoDetectDependencies ? this.detectFollowups(finalDocumentId, category) : [],
        conflicts: [],
        complements: []
      },
      extraction: {
        strategy: finalStrategy,
        characterLimit: {},
        emphasis: {
          must_include: [],
          nice_to_have: [],
          contextual_keywords: []
        }
      },
      composition: {
        categoryAffinity: this.generateCategoryAffinity(category),
        tagAffinity: this.generateTagAffinity(primaryTags),
        contextualRelevance: this.generateContextualRelevance(category, primaryTags),
        userJourneyStage: this.determineUserJourneyStage(category, primaryTags)
      }
    };

    return template;
  }

  /**
   * Generate smart tags based on document ID, category, and context
   */
  private generateSmartTags(
    documentId: string, 
    category: DocumentCategory, 
    explicitTags: string[], 
    autoExtract: boolean
  ): string[] {
    const tags = new Set(explicitTags);

    // Add category-based default tags
    if (this.config?.categories[category]) {
      this.config.categories[category].tags.forEach(tag => tags.add(tag));
    }

    // Auto-extract tags from document ID if enabled
    if (autoExtract) {
      const extractedTags = this.extractTagsFromDocumentId(documentId);
      extractedTags.forEach(tag => tags.add(tag));
    }

    // Ensure we don't exceed maximum primary tags
    return Array.from(tags).slice(0, 5);
  }

  /**
   * Extract tags from document ID patterns
   */
  private extractTagsFromDocumentId(documentId: string): string[] {
    const tags: string[] = [];

    // Pattern matching for common terms
    if (documentId.includes('getting-started') || documentId.includes('quick-start')) {
      tags.push('beginner', 'quick-start');
    }
    if (documentId.includes('advanced') || documentId.includes('expert')) {
      tags.push('advanced');
    }
    if (documentId.includes('troubleshooting') || documentId.includes('debug')) {
      tags.push('troubleshooting');
    }
    if (documentId.includes('api')) {
      tags.push('reference', 'technical');
    }
    if (documentId.includes('tutorial') || documentId.includes('guide')) {
      tags.push('step-by-step', 'practical');
    }
    if (documentId.includes('core') || documentId.includes('essential')) {
      tags.push('core');
    }

    return tags;
  }

  /**
   * Generate technical keywords based on document ID and category
   */
  private generateTechnicalKeywords(documentId: string, category: DocumentCategory): string[] {
    const keywords: string[] = [];
    
    // Add category-specific keywords
    if (category === 'api') {
      keywords.push('API', 'interface', 'methods');
    } else if (category === 'concept') {
      keywords.push('concept', 'theory', 'architecture');
    } else if (category === 'guide') {
      keywords.push('tutorial', 'how-to', 'step-by-step');
    } else if (category === 'example') {
      keywords.push('example', 'demo', 'implementation');
    }
    
    // Extract keywords from document ID
    const idParts = documentId.split('-');
    idParts.forEach(part => {
      if (part.length > 3 && !['the', 'and', 'for', 'with'].includes(part)) {
        keywords.push(part);
      }
    });
    
    return keywords.slice(0, 10); // Limit to 10 keywords
  }

  /**
   * Calculate complexity based on category and tags
   */
  private calculateComplexity(category: DocumentCategory, tags: string[]): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    if (tags.includes('beginner') || tags.includes('quick-start')) return 'basic';
    if (tags.includes('advanced') || tags.includes('expert')) return 'advanced';
    if (category === 'api' && tags.includes('technical')) return 'intermediate';
    if (category === 'concept') return 'intermediate';
    return 'basic';
  }

  /**
   * Estimate reading time based on category
   */
  private estimateReadingTime(category: DocumentCategory): string {
    const estimates: Record<DocumentCategory, string> = {
      guide: '10-15분',
      api: '5-10분',
      concept: '15-20분',
      example: '5-10분',
      reference: '3-5분',
      llms: '1-2분'
    };
    return estimates[category];
  }

  /**
   * Generate category affinity scores
   */
  private generateCategoryAffinity(category: DocumentCategory): Record<string, number> {
    const baseAffinities: Record<DocumentCategory, Record<string, number>> = {
      guide: { guide: 1.0, concept: 0.8, example: 0.9, api: 0.6, reference: 0.5, llms: 0.3 },
      api: { api: 1.0, reference: 0.9, example: 0.7, guide: 0.6, concept: 0.5, llms: 0.8 },
      concept: { concept: 1.0, guide: 0.8, api: 0.5, example: 0.6, reference: 0.7, llms: 0.6 },
      example: { example: 1.0, guide: 0.9, api: 0.7, concept: 0.6, reference: 0.5, llms: 0.4 },
      reference: { reference: 1.0, api: 0.9, guide: 0.5, concept: 0.7, example: 0.5, llms: 0.8 },
      llms: { llms: 1.0, reference: 0.8, api: 0.8, guide: 0.3, concept: 0.6, example: 0.4 }
    };

    return baseAffinities[category];
  }

  /**
   * Generate tag affinity scores
   */
  private generateTagAffinity(tags: string[]): Record<string, number> {
    const affinity: Record<string, number> = {};
    
    tags.forEach(tag => {
      affinity[tag] = 1.0;
      
      // Add compatible tags with lower scores
      if (this.config?.tags[tag]) {
        this.config.tags[tag].compatibleWith.forEach(compatibleTag => {
          affinity[compatibleTag] = Math.max(affinity[compatibleTag] || 0, 0.7);
        });
      }
    });

    return affinity;
  }

  /**
   * Generate contextual relevance scores
   */
  private generateContextualRelevance(category: DocumentCategory, tags: string[]): any {
    const relevance = {
      onboarding: 0.5,
      troubleshooting: 0.3,
      advanced_usage: 0.4,
      api_reference: 0.3,
      learning_path: 0.6
    };

    // Adjust based on category
    if (category === 'guide') {
      relevance.onboarding = 0.9;
      relevance.learning_path = 0.8;
    }
    if (category === 'api') {
      relevance.api_reference = 1.0;
      relevance.advanced_usage = 0.7;
    }

    // Adjust based on tags
    if (tags.includes('beginner')) {
      relevance.onboarding = Math.max(relevance.onboarding, 0.9);
    }
    if (tags.includes('troubleshooting')) {
      relevance.troubleshooting = 1.0;
    }
    if (tags.includes('advanced')) {
      relevance.advanced_usage = 0.9;
    }

    return relevance;
  }

  /**
   * Determine user journey stage
   */
  private determineUserJourneyStage(category: DocumentCategory, tags: string[]): any {
    if (tags.includes('beginner') || tags.includes('quick-start')) {
      return 'onboarding';
    }
    if (tags.includes('troubleshooting')) {
      return 'troubleshooting';
    }
    if (tags.includes('advanced')) {
      return 'mastery';
    }
    if (category === 'guide') {
      return 'implementation';
    }
    return 'discovery';
  }

  /**
   * Calculate tier from priority score
   */
  private calculateTierFromScore(score: number): PriorityTier {
    if (score >= 90) return 'critical';
    if (score >= 80) return 'essential';
    if (score >= 70) return 'important';
    if (score >= 60) return 'reference';
    return 'supplementary';
  }

  /**
   * Auto-detect potential prerequisites
   */
  private detectPrerequisites(documentId: string, category: DocumentCategory): any[] {
    const prerequisites: any[] = [];

    // Basic heuristics for common patterns
    if (documentId.includes('advanced') || documentId.includes('complex')) {
      if (category === 'guide') {
        prerequisites.push({
          documentId: 'guide-getting-started',
          importance: 'required' as const,
          reason: 'Basic knowledge required before advanced concepts'
        });
      }
    }

    if (documentId.includes('api') && !documentId.includes('getting-started')) {
      prerequisites.push({
        documentId: 'guide-getting-started',
        importance: 'recommended' as const,
        reason: 'Understanding basic concepts helps with API usage'
      });
    }

    return prerequisites;
  }

  /**
   * Auto-detect potential followups
   */
  private detectFollowups(documentId: string, category: DocumentCategory): any[] {
    const followups: any[] = [];

    if (documentId.includes('getting-started') || documentId.includes('basic')) {
      if (category === 'guide') {
        followups.push({
          documentId: 'guide-advanced-patterns',
          reason: 'Next step after learning basics',
          timing: 'after-practice' as const
        });
      }
    }

    return followups;
  }

  /**
   * Utility methods from parent class
   */
  private extractDocumentIdFromPath(sourcePath: string): string {
    const baseName = path.basename(sourcePath, '.md');
    return baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  private generateSourcePathFromId(documentId: string, category: string): string {
    const parts = documentId.split('-');
    if (parts.length >= 2 && parts[0] === category) {
      return `${category}/${parts.slice(1).join('-')}.md`;
    }
    return `${category}/${documentId}.md`;
  }

  private generateTitleFromId(documentId: string): string {
    return documentId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private generateSecondaryTags(category: DocumentCategory, documentId: string): string[] {
    const secondaryTags: string[] = [];

    // Add framework-specific tags
    if (documentId.includes('react')) secondaryTags.push('React');
    if (documentId.includes('typescript')) secondaryTags.push('TypeScript');
    if (documentId.includes('hook')) secondaryTags.push('hooks');
    if (documentId.includes('component')) secondaryTags.push('components');

    // Add category-specific secondary tags
    if (category === 'guide') secondaryTags.push('tutorial', 'implementation');
    if (category === 'api') secondaryTags.push('reference', 'methods');
    if (category === 'concept') secondaryTags.push('theory', 'principles');

    return secondaryTags;
  }

  /**
   * Get enhanced schema information
   */
  getSchemaInfo(): SchemaInfo {
    if (!this.schema) {
      throw new Error('Schema not loaded');
    }

    const categories = this.config ? Object.keys(this.config.categories) : [];
    const supportedTags = this.config ? Object.keys(this.config.tags) : [];

    return {
      version: this.schema.title || 'Enhanced Priority Schema v1.0',
      description: this.schema.description || 'Enhanced schema with tag/category/dependency support',
      categories,
      tiers: ['critical', 'essential', 'important', 'reference', 'supplementary'],
      strategies: ['concept-first', 'example-first', 'api-first', 'tutorial-first', 'reference-first'],
      supportedTags,
      validationRules: this.schema.properties ? Object.keys(this.schema.properties).length : 0
    };
  }

  /**
   * Save enhanced priority metadata to file
   */
  async savePriorityMetadata(
    filePath: string, 
    metadata: DocumentMetadata, 
    validate: boolean = true
  ): Promise<void> {
    if (validate) {
      const validation = this.validatePriority(metadata);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const jsonContent = JSON.stringify(metadata, null, 2);
    await writeFile(filePath, jsonContent, 'utf-8');
  }
}