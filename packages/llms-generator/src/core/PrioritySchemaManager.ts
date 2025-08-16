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
    character_limits: {
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
    estimated_extraction_time?: {
      minimum?: string;
      origin?: string;
      '300'?: string;
      '1000'?: string;
      '2000'?: string;
    };
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
      if (!priority.extraction.character_limits) {
        errors.push('extraction.character_limits is required');
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
    const finalSourcePath = sourcePath || this.generateSourcePathFromId(finalDocumentId, category);
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
      extraction: {
        strategy: strategy,
        character_limits: this.generateCharacterLimits(strategy, category, title),
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
        version: '1.0',
        estimated_extraction_time: {
          minimum: '10 minutes',
          origin: 'automatic',
          '300': '20 minutes',
          '1000': '45 minutes',
          '2000': '60 minutes'
        }
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
  private generateSourcePathFromId(documentId: string, category: string): string {
    const parts = documentId.split('-');
    if (parts.length >= 2 && parts[0] === category) {
      return `${category}/${parts.slice(1).join('-')}.md`;
    }
    return `${category}/${documentId}.md`;
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
  private generateCharacterLimits(strategy: string, category: string, title: string): PrioritySchema['extraction']['character_limits'] {
    const baseGuidelines = {
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
      },
      '100': {
        focus: strategy === 'concept-first' ? 'Core concept definition' : 'Primary functionality',
        structure: 'One-sentence definition or primary use case',
        must_include: ['main concept', 'framework context'],
        avoid: ['code examples', 'detailed explanations'],
        example_structure: `${title}: Brief definition with Context-Action framework context`
      },
      '300': {
        focus: 'Core concepts with basic context',
        structure: 'Definition + main purpose + key benefit',
        must_include: ['concept definition', 'main purpose', 'key benefit'],
        avoid: ['code syntax', 'advanced details'],
        example_structure: 'Concept definition → Main purpose → Key benefit'
      },
      '500': {
        focus: 'Practical understanding',
        structure: 'Concept + basic usage + simple example hint',
        must_include: ['concept', 'usage context', 'basic example'],
        avoid: ['detailed code', 'advanced topics'],
        example_structure: 'Concept → Usage context → Basic example'
      }
    };

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