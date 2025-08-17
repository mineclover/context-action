/**
 * Markdown Document Generator
 * 
 * Generates character-limited .md files based on priority.json configurations
 * Creates files like: guide-concepts-100.md, guide-concepts-300.md, etc.
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { LLMSConfig, PriorityMetadata } from '../types/index.js';
import { PriorityManager } from './PriorityManager.js';
import { DocumentProcessor } from './DocumentProcessor.js';

export interface MarkdownGenerationOptions {
  languages: string[];
  characterLimits?: number[];
  outputDir?: string;
  dryRun?: boolean;
  overwrite?: boolean;
}

export interface MarkdownGenerationResult {
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

export class MarkdownGenerator {
  private config: LLMSConfig;
  private priorityManager: PriorityManager;
  private documentProcessor: DocumentProcessor;

  constructor(config: LLMSConfig) {
    this.config = config;
    this.priorityManager = new PriorityManager(config.paths.llmContentDir);
    this.documentProcessor = new DocumentProcessor(config.paths.docsDir);
  }

  /**
   * Generate markdown files for all documents and character limits
   */
  async generateMarkdownFiles(options: MarkdownGenerationOptions): Promise<MarkdownGenerationResult> {
    const result: MarkdownGenerationResult = {
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
          await this.generateDocumentMarkdowns(
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
   * Generate markdown files for a single document across all character limits
   */
  private async generateDocumentMarkdowns(
    documentId: string,
    priority: PriorityMetadata,
    language: string,
    options: MarkdownGenerationOptions,
    result: MarkdownGenerationResult
  ): Promise<void> {
    const characterLimits = options.characterLimits || this.getCharacterLimitsFromPriority(priority);

    for (const charLimit of characterLimits) {
      try {
        const outputPath = await this.generateSingleMarkdown(
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
        const errorMessage = `Failed to generate ${documentId}-${charLimit}.md (${language}): ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMessage);
        result.summary.totalErrors++;
        result.success = false;
      }
    }
  }

  /**
   * Generate a single markdown file for specific character limit
   */
  private async generateSingleMarkdown(
    documentId: string,
    priority: PriorityMetadata,
    language: string,
    charLimit: number,
    options: MarkdownGenerationOptions
  ): Promise<string | null> {
    // Determine output directory
    const outputDir = options.outputDir || path.join(this.config.paths.docsDir, language, 'llms');
    const outputPath = path.join(outputDir, `${documentId}-${charLimit}.md`);

    // Check if file exists and should not be overwritten
    if (existsSync(outputPath) && !options.overwrite) {
      console.log(`⏭️  Skipping existing file: ${outputPath}`);
      return null;
    }

    // Dry run mode
    if (options.dryRun) {
      console.log(`🔍 [DRY RUN] Would generate: ${outputPath}`);
      return outputPath;
    }

    // Generate content
    const content = await this.generateMarkdownContent(documentId, priority, language, charLimit);

    // Create output directory if it doesn't exist
    await mkdir(outputDir, { recursive: true });

    // Write file
    await writeFile(outputPath, content, 'utf-8');

    console.log(`✅ Generated: ${outputPath} (${content.length} characters)`);
    return outputPath;
  }

  /**
   * Generate markdown content for specific character limit
   */
  private async generateMarkdownContent(
    documentId: string,
    priority: PriorityMetadata,
    language: string,
    charLimit: number
  ): Promise<string> {
    // Get character limit configuration from priority
    const charLimitConfig = priority.extraction.character_limits[charLimit.toString()];
    
    // Try to read source document
    let sourceContent = '';
    try {
      const document = await this.documentProcessor.readSourceDocument(
        priority.document.source_path,
        language,
        documentId
      );
      sourceContent = document.cleanContent;
    } catch (error) {
      console.warn(`⚠️  Could not read source document for ${documentId}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Generate markdown content
    const frontMatter = this.generateFrontMatter(priority, charLimit, language);
    const body = this.generateMarkdownBody(priority, charLimit, charLimitConfig, sourceContent);

    return `${frontMatter}\n\n${body}`;
  }

  /**
   * Generate YAML frontmatter for the markdown file
   */
  private generateFrontMatter(priority: PriorityMetadata, charLimit: number, language: string): string {
    const created = new Date().toISOString().split('T')[0];
    
    return `---
title: "${priority.document.title} (${charLimit} characters)"
description: "${charLimit}-character summary of ${priority.document.title}"
priority: ${priority.priority.score}
tier: "${priority.priority.tier}"
character_limit: ${charLimit}
language: "${language}"
category: "${priority.document.category}"
source_path: "${priority.document.source_path}"
generated: "${created}"
---`;
  }

  /**
   * Generate markdown body content
   */
  private generateMarkdownBody(
    priority: PriorityMetadata,
    charLimit: number,
    charLimitConfig: any,
    sourceContent: string
  ): string {
    let content = `# ${priority.document.title} (${charLimit} characters)\n\n`;

    // Add metadata section
    content += `## Document Information\n\n`;
    content += `- **Priority**: ${priority.priority.score}/100 (${priority.priority.tier})\n`;
    content += `- **Category**: ${priority.document.category}\n`;
    content += `- **Character Limit**: ${charLimit}\n`;
    content += `- **Source**: \`${priority.document.source_path}\`\n\n`;

    // Add character limit specific configuration if available
    if (charLimitConfig) {
      content += `## Extraction Guidelines\n\n`;
      if (charLimitConfig.focus) {
        content += `**Focus**: ${charLimitConfig.focus}\n\n`;
      }
      if (charLimitConfig.structure) {
        content += `**Structure**: ${charLimitConfig.structure}\n\n`;
      }
      if (charLimitConfig.must_include && charLimitConfig.must_include.length > 0) {
        content += `**Must Include**:\n`;
        for (const item of charLimitConfig.must_include) {
          content += `- ${item}\n`;
        }
        content += `\n`;
      }
      if (charLimitConfig.avoid && charLimitConfig.avoid.length > 0) {
        content += `**Avoid**:\n`;
        for (const item of charLimitConfig.avoid) {
          content += `- ${item}\n`;
        }
        content += `\n`;
      }
    }

    // Add content section
    content += `## Content\n\n`;
    
    if (sourceContent) {
      // Truncate source content to approximate character limit
      const contentLimit = Math.max(charLimit - content.length - 100, 100); // Reserve space for structure
      let truncatedContent = sourceContent.substring(0, contentLimit);
      
      // Try to break at word boundaries
      if (truncatedContent.length < sourceContent.length) {
        const lastSpace = truncatedContent.lastIndexOf(' ');
        if (lastSpace > contentLimit * 0.8) {
          truncatedContent = truncatedContent.substring(0, lastSpace);
        }
        truncatedContent += '...';
      }
      
      content += truncatedContent;
    } else {
      content += `*Source content will be generated here based on the character limit guidelines above.*\n\n`;
      content += `*This is a placeholder document. The actual content should be extracted from the source document according to the extraction strategy and guidelines defined in the priority.json file.*`;
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
   * Generate markdown files for specific character limits
   */
  async generateByCharacterLimits(
    language: string,
    characterLimits: number[],
    options: Partial<MarkdownGenerationOptions> = {}
  ): Promise<MarkdownGenerationResult> {
    return this.generateMarkdownFiles({
      languages: [language],
      characterLimits,
      ...options
    });
  }

  /**
   * Generate all markdown files for a language
   */
  async generateForLanguage(
    language: string,
    options: Partial<MarkdownGenerationOptions> = {}
  ): Promise<MarkdownGenerationResult> {
    return this.generateMarkdownFiles({
      languages: [language],
      ...options
    });
  }
}