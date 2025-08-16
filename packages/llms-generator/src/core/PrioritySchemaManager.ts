/**
 * Priority Schema Manager - handles schema validation and priority file generation
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { PriorityMetadata } from '../types/index.js';

// Priority schema types based on priority-schema-enhanced.json
export interface PrioritySchema {
  document: {
    id: string;
    title: string;
    source_path: string;
    category: 'guide' | 'api' | 'concept' | 'example' | 'reference' | 'llms';
    subcategory?: string;
  };
  priority: {
    score: number; // 1-100
    tier: 'critical' | 'essential' | 'important' | 'reference' | 'supplementary';
    rationale?: string;
  };
  purpose: {
    primary_goal: string;
    target_audience: Array<'beginners' | 'intermediate' | 'advanced' | 'framework-users' | 'contributors' | 'llms'>;
    use_cases?: string[];
    dependencies?: string[];
  };
  keywords: {
    primary: string[]; // max 5
    technical: string[];
    patterns?: string[];
    avoid?: string[];
  };
  extraction: {
    strategy: 'concept-first' | 'example-first' | 'api-first' | 'tutorial-first' | 'reference-first';
    characterLimit: {
      minimum?: CharacterLimitGuideline;
      origin?: CharacterLimitGuideline;
      '100'?: CharacterLimitGuideline;
      '300'?: CharacterLimitGuideline;
      '500'?: CharacterLimitGuideline;
      '1000'?: CharacterLimitGuideline;
      '2000'?: CharacterLimitGuideline;
      '3000'?: CharacterLimitGuideline;
      '4000'?: CharacterLimitGuideline;
    };
    emphasis?: {
      must_include?: string[];
      nice_to_have?: string[];
    };
  };
  quality?: {
    completeness_threshold?: number; // 0.5-1.0
    code_examples_required?: boolean;
    consistency_checks?: Array<'terminology' | 'code_style' | 'naming_conventions' | 'pattern_usage' | 'api_signatures'>;
  };
  metadata?: {
    created?: string;
    updated?: string;
    version?: string;
    original_size?: number;
  };
}

export interface CharacterLimitGuideline {
  focus?: string;
  structure?: string;
  must_include?: string[];
  avoid?: string[];
  example_structure?: string;
}

export interface PriorityGenerationOptions {
  documentId?: string;
  sourcePath?: string;
  language: string;
  category?: PrioritySchema['document']['category'];
  priorityScore?: number;
  priorityTier?: PrioritySchema['priority']['tier'];
  strategy?: PrioritySchema['extraction']['strategy'];
  characterLimits?: number[];
  overwrite?: boolean;
}

export class PrioritySchemaManager {
  private schemaPath: string;
  private schema: any = null;
  private ajv: Ajv | null = null;
  private validate: any = null;

  constructor(llmContentDir: string) {
    this.schemaPath = path.join(llmContentDir, 'priority-schema-enhanced.json');
  }

  /**
   * Load and validate the priority schema
   */
  async loadSchema(): Promise<any> {
    if (!existsSync(this.schemaPath)) {
      throw new Error(`Priority schema not found: ${this.schemaPath}`);
    }

    const schemaContent = await readFile(this.schemaPath, 'utf-8');
    this.schema = JSON.parse(schemaContent);
    
    // Initialize Ajv validator
    this.initializeValidator();
    
    return this.schema;
  }

  /**
   * Initialize Ajv validator
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

    // Compile schema
    try {
      this.validate = this.ajv.compile(this.schema);
    } catch (error) {
      throw new Error(`Failed to compile schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate a priority object against the schema using Ajv
   */
  validatePriority(priority: PrioritySchema): { valid: boolean; errors: string[] } {
    if (!this.validate) {
      // Fall back to basic validation if Ajv is not initialized
      return this.validatePriorityBasic(priority);
    }

    const valid = this.validate(priority);
    
    const errors: string[] = [];
    if (this.validate.errors) {
      for (const error of this.validate.errors) {
        const path = error.instancePath || error.schemaPath || '';
        const message = error.message || 'validation error';
        errors.push(`${path}: ${message}`);
      }
    }

    return {
      valid,
      errors
    };
  }

  /**
   * Basic validation without Ajv (fallback)
   */
  private validatePriorityBasic(priority: PrioritySchema): { valid: boolean; errors: string[] } {
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

    if (!priority.purpose) {
      errors.push('purpose section is required');
    } else {
      if (!priority.purpose.primary_goal) {
        errors.push('purpose.primary_goal is required');
      }
      if (!priority.purpose.target_audience || priority.purpose.target_audience.length === 0) {
        errors.push('purpose.target_audience is required and must not be empty');
      }
    }

    if (!priority.keywords) {
      errors.push('keywords section is required');
    } else {
      if (!priority.keywords.primary || priority.keywords.primary.length === 0 || priority.keywords.primary.length > 5) {
        errors.push('keywords.primary must have 1-5 items');
      }
      if (!priority.keywords.technical) {
        errors.push('keywords.technical is required');
      }
    }

    if (!priority.extraction) {
      errors.push('extraction section is required');
    } else {
      if (!priority.extraction.strategy) {
        errors.push('extraction.strategy is required');
      }
      if (!priority.extraction.characterLimit) {
        errors.push('extraction.characterLimit is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a default priority template for a document
   */
  generatePriorityTemplate(options: PriorityGenerationOptions): PrioritySchema {
    const {
      documentId,
      sourcePath,
      language,
      category = 'guide',
      priorityScore = 75,
      priorityTier = 'important',
      strategy = 'concept-first'
    } = options;

    // Extract document info from source path if not provided
    const finalDocumentId = documentId || this.extractDocumentIdFromPath(sourcePath || '');
    // Always generate source path with language to ensure correct format
    const finalSourcePath = this.generateSourcePathFromId(finalDocumentId, category, language);
    const title = this.generateTitleFromId(finalDocumentId);

    const template: PrioritySchema = {
      document: {
        id: finalDocumentId,
        title: title,
        source_path: finalSourcePath,
        category: category
      },
      priority: {
        score: priorityScore,
        tier: priorityTier,
        rationale: `Auto-generated priority assignment for ${category} document`
      },
      purpose: {
        primary_goal: `Provide comprehensive guidance on ${title.toLowerCase()}`,
        target_audience: ['framework-users', 'beginners'],
        use_cases: [
          `Understanding ${title.toLowerCase()}`,
          `Implementing ${title.toLowerCase()} patterns`,
          'Framework learning'
        ],
        dependencies: []
      },
      keywords: {
        primary: [
          'Context-Action framework',
          ...this.extractKeywordsFromTitle(title).slice(0, 4)
        ],
        technical: this.generateTechnicalKeywords(category, finalDocumentId),
        patterns: this.generatePatternKeywords(category),
        avoid: [
          'Complex implementation details',
          'Advanced optimization techniques'
        ]
      },
      tags: {
        primary: this.generatePrimaryTags(category),
        secondary: this.generateSecondaryTags(category, finalDocumentId),
        audience: ['framework-users', 'beginners'],
        complexity: this.getDefaultComplexity(category)
      },
      dependencies: {
        prerequisites: [],
        references: [],
        followups: [],
        conflicts: [],
        complements: []
      },
      extraction: {
        strategy: strategy,
        characterLimit: this.generateCharacterLimits(strategy, category, title, options),
        emphasis: {
          must_include: this.generateMustInclude(category, title),
          nice_to_have: this.generateNiceToHave(category)
        }
      },
      quality: {
        completeness_threshold: 0.8,
        code_examples_required: category === 'guide' || category === 'example',
        consistency_checks: ['terminology', 'pattern_usage']
      },
      metadata: {
        created: new Date().toISOString().split('T')[0],
        version: '1.0'
      }
    };

    return template;
  }

  /**
   * Extract document ID from source path
   */
  private extractDocumentIdFromPath(sourcePath: string): string {
    const baseName = path.basename(sourcePath, '.md');
    return baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  /**
   * Generate source path from document ID
   */
  private generateSourcePathFromId(documentId: string, category: string, language?: string): string {
    const parts = documentId.split('-').filter(part => part.length > 0); // Remove empty parts
    let basePath: string;
    
    if (parts.length >= 2 && parts[0] === category) {
      basePath = `${category}/${parts.slice(1).join('-')}.md`;
    } else {
      basePath = `${category}/${documentId.replace(/^-+|-+$/g, '').replace(/-+/g, '-')}.md`;
    }
    
    // Include language if provided
    if (language) {
      return `${language}/${basePath}`;
    }
    
    return basePath;
  }

  /**
   * Generate title from document ID
   */
  private generateTitleFromId(documentId: string): string {
    return documentId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract keywords from title
   */
  private extractKeywordsFromTitle(title: string): string[] {
    return title.split(' ')
      .filter(word => word.length > 2)
      .map(word => word.toLowerCase());
  }

  /**
   * Generate technical keywords based on category and ID
   */
  private generateTechnicalKeywords(category: string, documentId: string): string[] {
    const baseKeywords = ['Context-Action'];
    
    if (category === 'api') {
      baseKeywords.push('API', 'methods', 'interfaces');
    } else if (category === 'guide') {
      baseKeywords.push('patterns', 'implementation', 'best practices');
    } else if (category === 'concept') {
      baseKeywords.push('architecture', 'principles', 'design');
    } else if (category === 'example') {
      baseKeywords.push('examples', 'usage', 'implementation');
    }

    // Add specific keywords based on document ID
    if (documentId.includes('action')) {
      baseKeywords.push('ActionRegister', 'useActionDispatch', 'createActionContext');
    }
    if (documentId.includes('store')) {
      baseKeywords.push('StoreManager', 'useStoreValue', 'createDeclarativeStorePattern');
    }

    return baseKeywords;
  }

  /**
   * Generate pattern keywords based on category
   */
  private generatePatternKeywords(category: string): string[] {
    const patterns = ['Action Only Pattern', 'Store Only Pattern'];
    
    if (category === 'guide' || category === 'concept') {
      patterns.push('Store Integration Pattern', 'Context Store Pattern', 'Pattern Composition');
    }
    
    return patterns;
  }

  /**
   * Generate character limits guidelines
   */
  private generateCharacterLimits(strategy: string, category: string, title: string, options: PriorityGenerationOptions): PrioritySchema['extraction']['characterLimit'] {
    // Get character limits from config (passed through options)
    const characterLimits = options.characterLimits || [200, 500, 1000];
    
    const baseGuidelines: any = {
      minimum: {
        focus: 'Quick navigation and document overview',
        structure: 'Document links + 2-3 line description + related documents',
        must_include: ['source document link', 'brief purpose', 'related documents'],
        avoid: ['detailed explanations', 'code examples'],
        example_structure: `Source: ${category}/*.md | Purpose: ${title} overview | Related: getting-started, best-practices`
      },
      origin: {
        focus: 'Complete original content preservation',
        structure: 'Full markdown content from source file',
        must_include: ['complete original content'],
        avoid: ['modifications', 'truncations'],
        example_structure: `Complete copy of ${category}/*.md`
      }
    };

    // Dynamically add character limits from config
    characterLimits.forEach((limit, index) => {
      const limitKey = limit.toString();
      
      if (index === 0) {
        // First (smallest) limit
        baseGuidelines[limitKey] = {
          focus: strategy === 'concept-first' ? 'Core concept definition' : 'Primary functionality',
          structure: 'One-sentence definition or primary use case',
          must_include: ['main concept', 'framework context'],
          avoid: ['code examples', 'detailed explanations'],
          example_structure: `${title}: Brief definition with Context-Action framework context`
        };
      } else if (index === 1) {
        // Second (medium) limit
        baseGuidelines[limitKey] = {
          focus: 'Core concepts with basic context',
          structure: 'Definition + main purpose + key benefit',
          must_include: ['concept definition', 'main purpose', 'key benefit'],
          avoid: ['code syntax', 'advanced details'],
          example_structure: 'Concept definition → Main purpose → Key benefit'
        };
      } else if (index === 2) {
        // Third (largest) limit
        baseGuidelines[limitKey] = {
          focus: 'Practical understanding',
          structure: 'Concept + basic usage + simple example hint',
          must_include: ['concept', 'usage context', 'basic example'],
          avoid: ['detailed code', 'advanced topics'],
          example_structure: 'Concept → Usage context → Basic example'
        };
      }
    });

    return baseGuidelines;
  }

  /**
   * Generate must-include items
   */
  private generateMustInclude(category: string, title: string): string[] {
    const baseItems = ['Context-Action framework', title];
    
    if (category === 'guide') {
      baseItems.push('implementation pattern', 'usage example');
    } else if (category === 'api') {
      baseItems.push('API signature', 'parameters');
    } else if (category === 'concept') {
      baseItems.push('architectural concept', 'design principle');
    }
    
    return baseItems;
  }

  /**
   * Generate nice-to-have items
   */
  private generateNiceToHave(category: string): string[] {
    const items = ['best practices', 'common use cases'];
    
    if (category === 'guide') {
      items.push('troubleshooting tips', 'related patterns');
    } else if (category === 'api') {
      items.push('usage examples', 'return types');
    } else if (category === 'concept') {
      items.push('comparison with alternatives', 'design rationale');
    }
    
    return items;
  }

  /**
   * Generate primary tags based on category
   */
  private generatePrimaryTags(category: string): string[] {
    const categoryTags: Record<string, string[]> = {
      'guide': ['tutorial', 'step-by-step', 'practical'],
      'api': ['reference', 'technical', 'developer'],
      'concept': ['theory', 'architecture', 'design'],
      'example': ['practical', 'code', 'sample'],
      'reference': ['detailed', 'comprehensive', 'lookup'],
      'llms': ['llms', 'optimized', 'concise']
    };
    return categoryTags[category] || ['general'];
  }

  /**
   * Generate secondary tags based on category and document ID
   */
  private generateSecondaryTags(category: string, documentId: string): string[] {
    const tags: string[] = [];
    
    if (documentId.includes('action')) {
      tags.push('action-pipeline', 'dispatch');
    }
    if (documentId.includes('store')) {
      tags.push('state-management', 'reactive');
    }
    if (documentId.includes('hook')) {
      tags.push('react-hooks');
    }
    if (documentId.includes('pattern')) {
      tags.push('design-patterns');
    }
    
    // Add category-specific secondary tags
    if (category === 'guide') {
      tags.push('implementation', 'best-practices');
    } else if (category === 'api') {
      tags.push('methods', 'interfaces');
    }
    
    return tags.slice(0, 5); // Limit to 5 tags
  }

  /**
   * Get default complexity based on category
   */
  private getDefaultComplexity(category: string): string {
    const complexityMap: Record<string, string> = {
      'guide': 'basic',
      'api': 'intermediate',
      'concept': 'intermediate',
      'example': 'basic',
      'reference': 'advanced',
      'llms': 'basic'
    };
    return complexityMap[category] || 'basic';
  }

  /**
   * Get schema statistics
   */
  getSchemaInfo(): any {
    if (!this.schema) {
      return null;
    }

    return {
      version: this.schema.title || 'Unknown',
      description: this.schema.description || '',
      categories: this.schema.properties?.document?.properties?.category?.enum || [],
      tiers: this.schema.properties?.priority?.properties?.tier?.enum || [],
      strategies: this.schema.properties?.extraction?.properties?.strategy?.enum || []
    };
  }
}