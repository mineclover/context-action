/**
 * Content Extractor
 * 
 * Extracts and saves character-limited content summaries to data directory
 * Creates files like: guide-concepts-100.txt, guide-concepts-300.txt, etc.
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { LLMSConfig, PriorityMetadata } from '../types/index.js';
import { PriorityManager } from './PriorityManager.js';
import { DocumentProcessor } from './DocumentProcessor.js';

export interface ContentExtractionOptions {
  languages: string[];
  characterLimits?: number[];
  dryRun?: boolean;
  overwrite?: boolean;
}

export interface ContentExtractionResult {
  success: boolean;
  generated: string[];
  errors: string[];
  summary: {
    totalGenerated: number;
    totalErrors: number;
    byLanguage: Record<string, number>;
    byCharacterLimit: Record<string, number>;
  };
}

export class ContentExtractor {
  private config: LLMSConfig;
  private priorityManager: PriorityManager;
  private documentProcessor: DocumentProcessor;

  constructor(config: LLMSConfig) {
    this.config = config;
    this.priorityManager = new PriorityManager(config.paths.llmContentDir);
    this.documentProcessor = new DocumentProcessor(config.paths.docsDir);
  }

  /**
   * Extract content summaries for all documents and character limits
   */
  async extractContentSummaries(options: ContentExtractionOptions): Promise<ContentExtractionResult> {
    const result: ContentExtractionResult = {
      success: true,
      generated: [],
      errors: [],
      summary: {
        totalGenerated: 0,
        totalErrors: 0,
        byLanguage: {},
        byCharacterLimit: {}
      }
    };

    for (const language of options.languages) {
      try {
        const allPriorities = await this.priorityManager.loadAllPriorities();
        const priorities = this.priorityManager.filterByLanguage(allPriorities, language);

        for (const [documentId, priority] of Object.entries(priorities)) {
          await this.extractDocumentSummaries(
            documentId,
            priority,
            language,
            options,
            result
          );
        }

        result.summary.byLanguage[language] = result.summary.byLanguage[language] || 0;
      } catch (error) {
        const errorMessage = `Failed to process language ${language}: ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMessage);
        result.summary.totalErrors++;
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Extract content summaries for a single document across all character limits
   */
  private async extractDocumentSummaries(
    documentId: string,
    priority: PriorityMetadata,
    language: string,
    options: ContentExtractionOptions,
    result: ContentExtractionResult
  ): Promise<void> {
    const characterLimits = options.characterLimits || this.getCharacterLimitsFromPriority(priority);

    for (const charLimit of characterLimits) {
      try {
        const outputPath = await this.extractSingleSummary(
          documentId,
          priority,
          language,
          charLimit,
          options
        );

        if (outputPath) {
          result.generated.push(outputPath);
          result.summary.totalGenerated++;
          result.summary.byLanguage[language] = (result.summary.byLanguage[language] || 0) + 1;
          result.summary.byCharacterLimit[charLimit.toString()] = (result.summary.byCharacterLimit[charLimit.toString()] || 0) + 1;
        }
      } catch (error) {
        const errorMessage = `Failed to extract ${documentId}-${charLimit}.txt (${language}): ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMessage);
        result.summary.totalErrors++;
        result.success = false;
      }
    }
  }

  /**
   * Extract a single content summary for specific character limit
   */
  private async extractSingleSummary(
    documentId: string,
    priority: PriorityMetadata,
    language: string,
    charLimit: number,
    options: ContentExtractionOptions
  ): Promise<string | null> {
    // Determine output directory - save to data directory, not docs directory
    const outputDir = path.join(this.config.paths.llmContentDir, language, documentId);
    const outputPath = path.join(outputDir, `${documentId}-${charLimit}.txt`);

    // Check if file exists and should not be overwritten
    if (existsSync(outputPath) && !options.overwrite) {
      console.log(`⏭️  Skipping existing file: ${outputPath}`);
      return null;
    }

    // Dry run mode
    if (options.dryRun) {
      console.log(`🔍 [DRY RUN] Would extract: ${outputPath}`);
      return outputPath;
    }

    // Extract content
    const content = await this.extractSummaryContent(documentId, priority, language, charLimit);

    // Create output directory if it doesn't exist
    await mkdir(outputDir, { recursive: true });

    // Write file
    await writeFile(outputPath, content, 'utf-8');

    console.log(`✅ Extracted: ${outputPath} (${content.length} characters)`);
    return outputPath;
  }

  /**
   * Extract summary content for specific character limit
   */
  private async extractSummaryContent(
    documentId: string,
    priority: PriorityMetadata,
    language: string,
    charLimit: number
  ): Promise<string> {
    // Get character limit configuration from priority
    const charLimitConfig = priority.extraction.character_limits[charLimit.toString()];
    
    // Try to read source document
    let sourceContent = '';
    let documentTitle = priority.document.title;
    
    try {
      const document = await this.documentProcessor.readSourceDocument(
        priority.document.source_path,
        language,
        documentId
      );
      sourceContent = document.cleanContent;
      documentTitle = document.title || priority.document.title;
    } catch (error) {
      console.warn(`⚠️  Could not read source document for ${documentId}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Generate content based on character limit and strategy
    if (sourceContent) {
      return this.generateSmartSummary(
        sourceContent,
        documentTitle,
        charLimit,
        charLimitConfig,
        priority
      );
    } else {
      return this.generatePlaceholderSummary(
        documentTitle,
        charLimit,
        charLimitConfig,
        priority
      );
    }
  }

  /**
   * Generate smart summary from source content
   */
  private generateSmartSummary(
    sourceContent: string,
    title: string,
    charLimit: number,
    charLimitConfig: any,
    priority: PriorityMetadata
  ): string {
    let summary = '';

    // Add title if space allows
    if (charLimit > 50) {
      summary += `# ${title}\n\n`;
    }

    // Calculate remaining space for content
    const remainingChars = charLimit - summary.length - 20; // Reserve some space for ending

    if (remainingChars > 0) {
      // Extract content based on strategy
      const strategy = priority.extraction.strategy;
      let extractedContent = '';

      switch (strategy) {
        case 'concept-first':
          extractedContent = this.extractConceptFirst(sourceContent, remainingChars);
          break;
        case 'api-first':
          extractedContent = this.extractApiFirst(sourceContent, remainingChars);
          break;
        case 'example-first':
          extractedContent = this.extractExampleFirst(sourceContent, remainingChars);
          break;
        default:
          extractedContent = this.extractGeneral(sourceContent, remainingChars);
      }

      summary += extractedContent;
    }

    // Ensure we don't exceed character limit
    if (summary.length > charLimit) {
      summary = summary.substring(0, charLimit - 3) + '...';
    }

    return summary;
  }

  /**
   * Extract content with concept-first strategy
   */
  private extractConceptFirst(content: string, maxChars: number): string {
    // Look for key concepts, definitions, and principles
    const lines = content.split('\n');
    let extracted = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Prioritize headings, definitions, and key concepts
      if (trimmed.startsWith('#') || 
          trimmed.includes('정의') || trimmed.includes('개념') || 
          trimmed.includes('definition') || trimmed.includes('concept') ||
          trimmed.includes('핵심') || trimmed.includes('key')) {
        
        if (extracted.length + trimmed.length + 2 <= maxChars) {
          extracted += trimmed + '\n\n';
        } else {
          break;
        }
      }
    }

    // If we have space, add more content
    if (extracted.length < maxChars * 0.7) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || extracted.includes(trimmed)) continue;

        if (extracted.length + trimmed.length + 2 <= maxChars) {
          extracted += trimmed + '\n\n';
        } else {
          break;
        }
      }
    }

    return extracted.trim();
  }

  /**
   * Extract content with API-first strategy
   */
  private extractApiFirst(content: string, maxChars: number): string {
    const lines = content.split('\n');
    let extracted = '';

    // Look for API signatures, functions, and usage examples
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Prioritize code blocks, function signatures, and API references
      if (trimmed.startsWith('```') || 
          trimmed.includes('function') || trimmed.includes('const') ||
          trimmed.includes('export') || trimmed.includes('interface') ||
          trimmed.includes('함수') || trimmed.includes('사용법')) {
        
        if (extracted.length + trimmed.length + 2 <= maxChars) {
          extracted += trimmed + '\n\n';
        } else {
          break;
        }
      }
    }

    // Add additional content if needed
    if (extracted.length < maxChars * 0.7) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || extracted.includes(trimmed)) continue;

        if (extracted.length + trimmed.length + 2 <= maxChars) {
          extracted += trimmed + '\n\n';
        } else {
          break;
        }
      }
    }

    return extracted.trim();
  }

  /**
   * Extract content with example-first strategy
   */
  private extractExampleFirst(content: string, maxChars: number): string {
    const lines = content.split('\n');
    let extracted = '';

    // Look for examples, code blocks, and practical usage
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Prioritize examples and practical content
      if (trimmed.includes('예제') || trimmed.includes('example') ||
          trimmed.includes('사용') || trimmed.includes('usage') ||
          trimmed.includes('실습') || trimmed.includes('practice') ||
          trimmed.startsWith('```')) {
        
        if (extracted.length + trimmed.length + 2 <= maxChars) {
          extracted += trimmed + '\n\n';
        } else {
          break;
        }
      }
    }

    // Add more content if needed
    if (extracted.length < maxChars * 0.7) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || extracted.includes(trimmed)) continue;

        if (extracted.length + trimmed.length + 2 <= maxChars) {
          extracted += trimmed + '\n\n';
        } else {
          break;
        }
      }
    }

    return extracted.trim();
  }

  /**
   * Extract content with general strategy
   */
  private extractGeneral(content: string, maxChars: number): string {
    // Simple truncation with word boundary respect
    if (content.length <= maxChars) {
      return content;
    }

    let truncated = content.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    const lastNewline = truncated.lastIndexOf('\n');
    
    const cutPoint = Math.max(lastSpace, lastNewline);
    if (cutPoint > maxChars * 0.8) {
      truncated = truncated.substring(0, cutPoint);
    }

    return truncated.trim() + '...';
  }

  /**
   * Generate placeholder summary when source is not available
   */
  private generatePlaceholderSummary(
    title: string,
    charLimit: number,
    charLimitConfig: any,
    priority: PriorityMetadata
  ): string {
    let content = `# ${title}\n\n`;
    
    const placeholder = `[${charLimit}자 요약 - 우선순위: ${priority.priority.score}/${priority.priority.tier}]\n\n` +
                       `이 문서는 ${priority.document.category} 카테고리의 ${title}에 대한 내용입니다.\n\n` +
                       `추출 전략: ${priority.extraction.strategy}\n\n` +
                       `실제 콘텐츠는 소스 문서에서 추출되어 여기에 표시됩니다.`;

    // Ensure we don't exceed character limit
    const totalContent = content + placeholder;
    if (totalContent.length > charLimit) {
      const availableSpace = charLimit - content.length - 3;
      content += placeholder.substring(0, availableSpace) + '...';
    } else {
      content += placeholder;
    }

    return content;
  }

  /**
   * Extract character limits from priority metadata
   */
  private getCharacterLimitsFromPriority(priority: PriorityMetadata): number[] {
    const limits = Object.keys(priority.extraction.character_limits || {})
      .filter(key => !isNaN(parseInt(key)))
      .map(key => parseInt(key))
      .sort((a, b) => a - b);

    return limits.length > 0 ? limits : this.config.generation.characterLimits;
  }

  /**
   * Extract content for specific character limits
   */
  async extractByCharacterLimits(
    language: string,
    characterLimits: number[],
    options: Partial<ContentExtractionOptions> = {}
  ): Promise<ContentExtractionResult> {
    return this.extractContentSummaries({
      languages: [language],
      characterLimits,
      ...options
    });
  }

  /**
   * Extract all content for a language
   */
  async extractForLanguage(
    language: string,
    options: Partial<ContentExtractionOptions> = {}
  ): Promise<ContentExtractionResult> {
    return this.extractContentSummaries({
      languages: [language],
      ...options
    });
  }
}