/**
 * Priority Generator - generates priority.json files for documents
 */

import { writeFile, mkdir, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { LLMSConfig } from '../types/index.js';
import { PrioritySchemaManager, type PrioritySchema, type PriorityGenerationOptions } from './PrioritySchemaManager.js';
import { DocumentProcessor } from './DocumentProcessor.js';

export interface DocumentDiscoveryResult {
  documentId: string;
  sourcePath: string;
  fullPath: string;
  category: string;
  language: string;
  exists: boolean;
  stats?: {
    size: number;
    modified: Date;
  };
}

export interface BulkGenerationOptions {
  languages?: string[];
  categories?: string[];
  overwriteExisting?: boolean;
  dryRun?: boolean;
  priorityDefaults?: {
    score?: number;
    tier?: PrioritySchema['priority']['tier'];
    strategy?: PrioritySchema['extraction']['strategy'];
  };
}

export interface BulkGenerationResult {
  success: boolean;
  generated: DocumentDiscoveryResult[];
  skipped: DocumentDiscoveryResult[];
  errors: Array<{
    document: DocumentDiscoveryResult;
    error: string;
  }>;
  summary: {
    totalDiscovered: number;
    totalGenerated: number;
    totalSkipped: number;
    totalErrors: number;
  };
}

export class PriorityGenerator {
  private config: LLMSConfig;
  private schemaManager: PrioritySchemaManager;
  private documentProcessor: DocumentProcessor;

  constructor(config: LLMSConfig) {
    this.config = config;
    this.schemaManager = new PrioritySchemaManager(config.paths.llmContentDir);
    this.documentProcessor = new DocumentProcessor(config.paths.docsDir);
  }

  /**
   * Initialize the generator (load schema, etc.)
   */
  async initialize(): Promise<void> {
    await this.schemaManager.loadSchema();
  }

  /**
   * Discover all documents in the docs directory
   */
  async discoverDocuments(language: string = 'en'): Promise<DocumentDiscoveryResult[]> {
    const docsDir = path.join(this.config.paths.docsDir, language);
    const documents: DocumentDiscoveryResult[] = [];

    if (!existsSync(docsDir)) {
      console.warn(`Documents directory not found: ${docsDir}`);
      return documents;
    }

    await this.scanDirectory(docsDir, language, '', documents);
    return documents.sort((a, b) => a.documentId.localeCompare(b.documentId));
  }

  /**
   * Recursively scan directory for markdown files
   */
  private async scanDirectory(
    dirPath: string,
    language: string,
    relativePath: string,
    results: DocumentDiscoveryResult[]
  ): Promise<void> {
    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stats = await stat(fullPath);
        const currentRelativePath = relativePath ? `${relativePath}/${entry}` : entry;

        if (stats.isDirectory()) {
          // Skip certain directories
          if (['llms', 'assets', '.vitepress', 'node_modules'].includes(entry)) {
            continue;
          }
          
          await this.scanDirectory(fullPath, language, currentRelativePath, results);
        } else if (stats.isFile() && entry.endsWith('.md') && entry !== 'index.md') {
          const sourcePath = currentRelativePath;
          const documentId = this.generateDocumentId(sourcePath);
          const category = this.extractCategory(sourcePath);

          results.push({
            documentId,
            sourcePath,
            fullPath,
            category,
            language,
            exists: true,
            stats: {
              size: stats.size,
              modified: stats.mtime
            }
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error);
    }
  }

  /**
   * Generate document ID from source path
   */
  private generateDocumentId(sourcePath: string): string {
    // 더블 대시 방식: 경로는 --, 단어 내부는 -
    const withoutExt = sourcePath.replace(/\.md$/, '');
    const pathParts = withoutExt.split('/');
    
    return pathParts.join('--').toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{3,}/g, '--')  // 3개 이상 연속 대시를 --로 변환
      .replace(/^-+|-+$/g, ''); // 앞뒤 대시 제거
  }

  /**
   * Extract category from source path
   */
  private extractCategory(sourcePath: string): string {
    const parts = sourcePath.split('/');
    const firstPart = parts[0];

    // Map directory names to categories
    const categoryMap: Record<string, string> = {
      'guide': 'guide',
      'api': 'api',
      'concept': 'concept',
      'examples': 'example',
      'reference': 'reference',
      'llms': 'llms'
    };

    return categoryMap[firstPart] || 'guide';
  }

  /**
   * Generate single priority.json file
   */
  async generateSinglePriority(
    document: DocumentDiscoveryResult,
    options: Partial<PriorityGenerationOptions> = {}
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const generationOptions: PriorityGenerationOptions = {
        documentId: document.documentId,
        sourcePath: document.sourcePath,
        language: document.language,
        category: document.category as PrioritySchema['document']['category'],
        priorityScore: options.priorityScore || this.getDefaultPriorityScore(document.category),
        priorityTier: options.priorityTier || this.getDefaultPriorityTier(document.category),
        strategy: options.strategy || this.getDefaultStrategy(document.category),
        overwrite: options.overwrite || false
      };

      // Generate priority template
      const priority = this.schemaManager.generatePriorityTemplate(generationOptions);

      // Try to enhance with actual document analysis
      await this.enhancePriorityWithDocumentAnalysis(priority, document);

      // Validate the generated priority
      const validation = this.schemaManager.validatePriority(priority);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Write priority file
      const outputPath = await this.writePriorityFile(priority, document, generationOptions.overwrite);
      
      return {
        success: true,
        path: outputPath
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Enhance priority with actual document analysis
   */
  private async enhancePriorityWithDocumentAnalysis(
    priority: PrioritySchema,
    document: DocumentDiscoveryResult
  ): Promise<void> {
    try {
      const documentContent = await this.documentProcessor.readSourceDocument(
        document.sourcePath,
        document.language,
        document.documentId
      );

      // Update title from actual document
      if (documentContent.title) {
        priority.document.title = documentContent.title;
      }

      // Update metadata with actual size
      if (priority.metadata) {
        priority.metadata.original_size = documentContent.size;
      }

      // Enhance keywords based on content analysis
      const contentKeywords = this.extractKeywordsFromContent(documentContent.cleanContent);
      if (contentKeywords.length > 0) {
        // Add unique keywords to technical keywords
        const existingTechnical = priority.keywords.technical || [];
        priority.keywords.technical = [...new Set([...existingTechnical, ...contentKeywords])];
      }

    } catch (error) {
      // Silently continue if document analysis fails
      console.debug(`Could not analyze document ${document.documentId}:`, error);
    }
  }

  /**
   * Extract keywords from document content
   */
  private extractKeywordsFromContent(content: string): string[] {
    const keywords: string[] = [];
    
    // Extract common API/method names
    const apiMatches = content.match(/\b(use[A-Z]\w+|create[A-Z]\w+|[A-Z]\w*(?:Manager|Register|Controller|Provider))\b/g);
    if (apiMatches) {
      keywords.push(...apiMatches.slice(0, 10));
    }

    // Extract code blocks with function names
    const codeMatches = content.match(/```[\s\S]*?```/g);
    if (codeMatches) {
      for (const codeBlock of codeMatches.slice(0, 3)) {
        const functionNames = codeBlock.match(/\b[a-z][a-zA-Z0-9]*\s*\(/g);
        if (functionNames) {
          keywords.push(...functionNames.map(fn => fn.replace(/\s*\($/, '')).slice(0, 5));
        }
      }
    }

    return [...new Set(keywords)];
  }

  /**
   * Write priority file to disk
   */
  private async writePriorityFile(
    priority: PrioritySchema,
    document: DocumentDiscoveryResult,
    overwrite: boolean = false
  ): Promise<string> {
    const outputDir = path.join(
      this.config.paths.llmContentDir,
      document.language,
      document.documentId
    );
    const outputPath = path.join(outputDir, 'priority.json');

    // Check if file exists and overwrite is false
    if (existsSync(outputPath) && !overwrite) {
      throw new Error(`Priority file already exists: ${outputPath}`);
    }

    // Ensure directory exists
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // Add schema reference
    const priorityWithSchema = {
      $schema: '../../priority-schema-enhanced.json',
      ...priority
    };

    // Write file with proper formatting
    const content = JSON.stringify(priorityWithSchema, null, 2);
    await writeFile(outputPath, content, 'utf-8');

    return outputPath;
  }

  /**
   * Bulk generate priority files for multiple documents
   */
  async bulkGeneratePriorities(options: BulkGenerationOptions = {}): Promise<BulkGenerationResult> {
    const result: BulkGenerationResult = {
      success: true,
      generated: [],
      skipped: [],
      errors: [],
      summary: {
        totalDiscovered: 0,
        totalGenerated: 0,
        totalSkipped: 0,
        totalErrors: 0
      }
    };

    const languages = options.languages || this.config.generation.supportedLanguages;
    
    for (const language of languages) {
      console.log(`\n🔍 Discovering documents for language: ${language}`);
      
      const documents = await this.discoverDocuments(language);
      result.summary.totalDiscovered += documents.length;
      
      console.log(`📄 Found ${documents.length} documents`);
      
      for (const document of documents) {
        // Skip if category filter is specified and doesn't match
        if (options.categories && !options.categories.includes(document.category)) {
          result.skipped.push(document);
          result.summary.totalSkipped++;
          continue;
        }

        // Check if priority file already exists
        const priorityPath = path.join(
          this.config.paths.llmContentDir,
          document.language,
          document.documentId,
          'priority.json'
        );

        if (existsSync(priorityPath) && !options.overwriteExisting) {
          console.log(`⏭️  Skipping ${document.documentId} (already exists)`);
          result.skipped.push(document);
          result.summary.totalSkipped++;
          continue;
        }

        if (options.dryRun) {
          console.log(`🧪 [DRY RUN] Would generate: ${document.documentId}`);
          result.generated.push(document);
          result.summary.totalGenerated++;
          continue;
        }

        // Generate priority file
        console.log(`📝 Generating priority for: ${document.documentId}`);
        
        const generationResult = await this.generateSinglePriority(document, {
          priorityScore: options.priorityDefaults?.score,
          priorityTier: options.priorityDefaults?.tier,
          strategy: options.priorityDefaults?.strategy,
          overwrite: options.overwriteExisting
        });

        if (generationResult.success) {
          console.log(`✅ Generated: ${generationResult.path}`);
          result.generated.push(document);
          result.summary.totalGenerated++;
        } else {
          console.error(`❌ Failed to generate ${document.documentId}: ${generationResult.error}`);
          result.errors.push({
            document,
            error: generationResult.error || 'Unknown error'
          });
          result.summary.totalErrors++;
          result.success = false;
        }
      }
    }

    return result;
  }

  /**
   * Get default priority score based on category
   */
  private getDefaultPriorityScore(category: string): number {
    const scoreMap: Record<string, number> = {
      'guide': 80,
      'api': 75,
      'concept': 50,
      'example': 75,
      'reference': 50,
      'llms': 50
    };

    return scoreMap[category] || 75;
  }

  /**
   * Get default priority tier based on category
   */
  private getDefaultPriorityTier(category: string): PrioritySchema['priority']['tier'] {
    const tierMap: Record<string, PrioritySchema['priority']['tier']> = {
      'guide': 'essential',
      'api': 'important',
      'concept': 'reference',
      'example': 'important',
      'reference': 'reference',
      'llms': 'reference'
    };

    return tierMap[category] || 'important';
  }

  /**
   * Get default extraction strategy based on category
   */
  private getDefaultStrategy(category: string): PrioritySchema['extraction']['strategy'] {
    const strategyMap: Record<string, PrioritySchema['extraction']['strategy']> = {
      'guide': 'tutorial-first',
      'api': 'api-first',
      'concept': 'concept-first',
      'example': 'example-first',
      'reference': 'reference-first',
      'llms': 'reference-first'
    };

    return strategyMap[category] || 'concept-first';
  }

  /**
   * Get generation statistics
   */
  async getGenerationStats(language: string = 'en'): Promise<{
    totalDocuments: number;
    withPriorities: number;
    withoutPriorities: number;
    byCategory: Record<string, { total: number; withPriorities: number }>;
  }> {
    const documents = await this.discoverDocuments(language);
    const stats = {
      totalDocuments: documents.length,
      withPriorities: 0,
      withoutPriorities: 0,
      byCategory: {} as Record<string, { total: number; withPriorities: number }>
    };

    for (const document of documents) {
      // Initialize category stats
      if (!stats.byCategory[document.category]) {
        stats.byCategory[document.category] = { total: 0, withPriorities: 0 };
      }
      stats.byCategory[document.category].total++;

      // Check if priority file exists
      const priorityPath = path.join(
        this.config.paths.llmContentDir,
        document.language,
        document.documentId,
        'priority.json'
      );

      if (existsSync(priorityPath)) {
        stats.withPriorities++;
        stats.byCategory[document.category].withPriorities++;
      } else {
        stats.withoutPriorities++;
      }
    }

    return stats;
  }
}