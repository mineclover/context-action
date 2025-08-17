/**
 * FrontMatterManager - Centralized YAML front matter generation and management
 */

import type { PriorityMetadata } from '../types/index.js';

export interface FrontMatterSpec {
  title: string;
  description: string;
  category: string;
  priority_score: number;
  priority_tier: string;
  extraction_strategy: string;
  character_limit: number;
  source_path: string;
  document_id: string;
  focus: string;
  must_include: string[];
  avoid: string[];
  generated_at: string;
  tags: string[];
  audience: string[];
  complexity: string;
  // Optional fields for extended metadata
  subcategory?: string;
  language?: string;
  original_size?: number;
  last_updated?: string;
  version?: string;
}

export interface FrontMatterOptions {
  includeExtendedMetadata?: boolean;
  language?: string;
  customFields?: Record<string, any>;
  dateFormat?: 'iso' | 'date-only' | 'timestamp';
  arrayStyle?: 'flow' | 'block';
}

export class FrontMatterManager {
  private static instance: FrontMatterManager;
  
  /**
   * Singleton pattern for consistent front matter management
   */
  public static getInstance(): FrontMatterManager {
    if (!FrontMatterManager.instance) {
      FrontMatterManager.instance = new FrontMatterManager();
    }
    return FrontMatterManager.instance;
  }

  /**
   * Generate front matter spec from priority metadata
   */
  generateSpec(
    priority: PriorityMetadata,
    charLimit: number,
    charLimitConfig: any,
    options: FrontMatterOptions = {}
  ): FrontMatterSpec {
    const spec: FrontMatterSpec = {
      title: priority.document.title,
      description: this.generateDescription(priority, charLimit, options.language),
      category: priority.document.category,
      priority_score: priority.priority.score,
      priority_tier: priority.priority.tier,
      extraction_strategy: priority.extraction.strategy,
      character_limit: charLimit,
      source_path: priority.document.source_path,
      document_id: priority.document.id,
      focus: charLimitConfig?.focus || '기본 요약',
      must_include: charLimitConfig?.must_include || [],
      avoid: charLimitConfig?.avoid || [],
      generated_at: this.formatDate(new Date(), options.dateFormat),
      tags: priority.tags?.primary || [],
      audience: priority.tags?.audience || [],
      complexity: priority.tags?.complexity || 'basic'
    };

    // Add extended metadata if requested
    if (options.includeExtendedMetadata) {
      if (priority.document.subcategory) {
        spec.subcategory = priority.document.subcategory;
      }
      if (options.language) {
        spec.language = options.language;
      }
      if (priority.metadata?.original_size) {
        spec.original_size = priority.metadata.original_size;
      }
      if (priority.tags?.lastUpdated) {
        spec.last_updated = priority.tags.lastUpdated;
      }
      if (priority.metadata?.version) {
        spec.version = priority.metadata.version;
      }
    }

    // Add custom fields if provided
    if (options.customFields) {
      Object.assign(spec, options.customFields);
    }

    return spec;
  }

  /**
   * Generate YAML front matter string from spec
   */
  generateYAML(spec: FrontMatterSpec, options: FrontMatterOptions = {}): string {
    let yaml = '---\n';
    
    // Define field order for consistent output
    const fieldOrder = [
      'title', 'description', 'category', 'subcategory', 'language',
      'priority_score', 'priority_tier', 'extraction_strategy',
      'character_limit', 'source_path', 'document_id',
      'focus', 'must_include', 'avoid',
      'generated_at', 'last_updated', 'version', 'original_size',
      'tags', 'audience', 'complexity'
    ];

    // Add fields in order
    for (const field of fieldOrder) {
      if (field in spec && spec[field as keyof FrontMatterSpec] !== undefined) {
        const value = spec[field as keyof FrontMatterSpec];
        yaml += this.formatYAMLField(field, value, options);
      }
    }

    // Add any custom fields not in the standard order
    for (const [key, value] of Object.entries(spec)) {
      if (!fieldOrder.includes(key) && value !== undefined) {
        yaml += this.formatYAMLField(key, value, options);
      }
    }

    yaml += '---\n\n';
    return yaml;
  }

  /**
   * Generate complete front matter from priority metadata
   */
  generate(
    priority: PriorityMetadata,
    charLimit: number,
    charLimitConfig: any,
    options: FrontMatterOptions = {}
  ): string {
    const spec = this.generateSpec(priority, charLimit, charLimitConfig, options);
    return this.generateYAML(spec, options);
  }

  /**
   * Parse existing front matter from markdown content
   */
  parse(markdownContent: string): { frontMatter: Partial<FrontMatterSpec>; content: string } {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/;
    const match = markdownContent.match(frontMatterRegex);

    if (!match) {
      return { frontMatter: {}, content: markdownContent };
    }

    const [, yamlContent, content] = match;
    const frontMatter = this.parseYAML(yamlContent);

    return { frontMatter, content };
  }

  /**
   * Update existing front matter while preserving content
   */
  update(
    markdownContent: string,
    priority: PriorityMetadata,
    charLimit: number,
    charLimitConfig: any,
    options: FrontMatterOptions = {}
  ): string {
    const { frontMatter: existing, content } = this.parse(markdownContent);
    
    // Generate new spec
    const newSpec = this.generateSpec(priority, charLimit, charLimitConfig, options);
    
    // Preserve custom fields from existing front matter
    const preservedFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(existing)) {
      if (!(key in newSpec) && value !== undefined) {
        preservedFields[key] = value;
      }
    }

    // Merge with custom fields
    const mergedOptions = {
      ...options,
      customFields: { ...preservedFields, ...options.customFields }
    };

    const newFrontMatter = this.generateYAML(newSpec, mergedOptions);
    return newFrontMatter + content;
  }

  /**
   * Validate front matter spec
   */
  validate(spec: Partial<FrontMatterSpec>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    const requiredFields = [
      'title', 'description', 'category', 'priority_score', 'priority_tier',
      'extraction_strategy', 'character_limit', 'source_path', 'document_id'
    ];

    for (const field of requiredFields) {
      if (!(field in spec) || spec[field as keyof FrontMatterSpec] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Type validation
    if (spec.priority_score !== undefined && typeof spec.priority_score !== 'number') {
      errors.push('priority_score must be a number');
    }

    if (spec.character_limit !== undefined && typeof spec.character_limit !== 'number') {
      errors.push('character_limit must be a number');
    }

    if (spec.priority_score !== undefined && (spec.priority_score < 0 || spec.priority_score > 100)) {
      errors.push('priority_score must be between 0 and 100');
    }

    // Category validation
    const validCategories = ['guide', 'api', 'concept', 'example', 'reference', 'llms'];
    if (spec.category && !validCategories.includes(spec.category)) {
      errors.push(`Invalid category: ${spec.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate template front matter for new documents
   */
  generateTemplate(
    category: string,
    title: string,
    documentId: string,
    options: FrontMatterOptions = {}
  ): string {
    const spec: FrontMatterSpec = {
      title,
      description: `템플릿 문서 - ${category} 카테고리`,
      category,
      priority_score: 50,
      priority_tier: 'reference',
      extraction_strategy: 'concept-first',
      character_limit: 1000,
      source_path: `${options.language || 'en'}/${category}/${documentId.replace(/^[^-]+-/, '').replace(/-/g, '-')}.md`,
      document_id: documentId,
      focus: '기본 문서 개요',
      must_include: ['핵심 개념', '사용법'],
      avoid: ['복잡한 구현 세부사항'],
      generated_at: this.formatDate(new Date(), options.dateFormat),
      tags: [category],
      audience: ['framework-users'],
      complexity: 'basic'
    };

    return this.generateYAML(spec, options);
  }

  // Private helper methods
  private generateDescription(priority: PriorityMetadata, charLimit: number, language?: string): string {
    const categoryName = this.getCategoryDisplayName(priority.document.category, language);
    return `${charLimit}자 요약 - ${categoryName}`;
  }

  private getCategoryDisplayName(category: string, language?: string): string {
    const categoryNames: Record<string, Record<string, string>> = {
      ko: {
        guide: '가이드 카테고리',
        api: 'API 카테고리',
        concept: '개념 카테고리',
        example: '예제 카테고리',
        reference: '참조 카테고리',
        llms: 'LLMS 카테고리'
      },
      en: {
        guide: 'guide category',
        api: 'api category',
        concept: 'concept category',
        example: 'example category',
        reference: 'reference category',
        llms: 'llms category'
      }
    };

    const lang = language || 'ko';
    return categoryNames[lang]?.[category] || `${category} category`;
  }

  private formatDate(date: Date, format?: 'iso' | 'date-only' | 'timestamp'): string {
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'timestamp':
        return date.getTime().toString();
      case 'date-only':
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private formatYAMLField(key: string, value: any, options: FrontMatterOptions): string {
    if (value === undefined || value === null) {
      return '';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '';
      }

      const arrayStyle = options.arrayStyle || 'block';
      if (arrayStyle === 'flow') {
        const flowArray = value.map(item => `"${item}"`).join(', ');
        return `${key}: [${flowArray}]\n`;
      } else {
        let result = `${key}:\n`;
        value.forEach(item => {
          result += `  - "${item}"\n`;
        });
        return result;
      }
    }

    if (typeof value === 'string') {
      // Escape strings that contain special characters
      const needsQuotes = /[:\[\]{}|>@`"']/.test(value) || value.includes('\n');
      return `${key}: ${needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : `"${value}"`}\n`;
    }

    return `${key}: ${value}\n`;
  }

  private parseYAML(yamlContent: string): Partial<FrontMatterSpec> {
    // Simple YAML parser for front matter
    // Note: This is a basic implementation. For production, consider using a proper YAML library
    const result: Record<string, any> = {};
    const lines = yamlContent.split('\n');
    let currentKey: string | null = null;
    let currentArray: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('- ')) {
        // Array item
        if (currentKey) {
          const item = trimmed.substring(2).replace(/^"(.*)"$/, '$1');
          currentArray.push(item);
        }
      } else if (trimmed.includes(':')) {
        // Save previous array if exists
        if (currentKey && currentArray.length > 0) {
          result[currentKey] = [...currentArray];
          currentArray = [];
        }

        // New key-value pair
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        currentKey = key.trim();

        if (value) {
          // Single value
          result[currentKey] = this.parseValue(value);
          currentKey = null;
        }
        // else: expecting array values on following lines
      }
    }

    // Save final array if exists
    if (currentKey && currentArray.length > 0) {
      result[currentKey] = currentArray;
    }

    return result as Partial<FrontMatterSpec>;
  }

  private parseValue(value: string): any {
    // Remove quotes
    const cleaned = value.replace(/^"(.*)"$/, '$1');
    
    // Try to parse as number
    if (/^\d+$/.test(cleaned)) {
      return parseInt(cleaned, 10);
    }
    
    if (/^\d+\.\d+$/.test(cleaned)) {
      return parseFloat(cleaned);
    }

    // Try to parse as boolean
    if (cleaned === 'true') return true;
    if (cleaned === 'false') return false;

    return cleaned;
  }
}

// Export singleton instance for easy use
export const frontMatterManager = FrontMatterManager.getInstance();