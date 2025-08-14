/**
 * Main LLMS Generator class - orchestrates the entire generation process
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type {
  LLMSConfig,
  GenerationOptions,
  GenerationResult,
  DocumentContent,
  PriorityMetadata
} from '../types/index.js';
import { PriorityManager } from './PriorityManager.js';
import { DocumentProcessor } from './DocumentProcessor.js';
import { PriorityGenerator } from './PriorityGenerator.js';

export class LLMSGenerator {
  private config: LLMSConfig;
  private priorityManager: PriorityManager;
  private documentProcessor: DocumentProcessor;
  private priorityGenerator: PriorityGenerator;

  constructor(config: LLMSConfig) {
    this.config = config;
    this.priorityManager = new PriorityManager(config.paths.llmContentDir);
    this.documentProcessor = new DocumentProcessor(config.paths.docsDir);
    this.priorityGenerator = new PriorityGenerator(config);
  }

  /**
   * Initialize the generator (load schema, etc.)
   */
  async initialize(schemaPath?: string): Promise<void> {
    if (schemaPath) {
      await this.priorityManager.initializeValidator(schemaPath);
    }
    await this.priorityGenerator.initialize();
  }

  /**
   * Get priority generator instance for direct access
   */
  getPriorityGenerator(): PriorityGenerator {
    return this.priorityGenerator;
  }

  /**
   * Generate minimum format content (navigation links)
   */
  async generateMinimum(language: string = this.config.generation.defaultLanguage): Promise<string> {
    const priorities = await this.priorityManager.loadAllPriorities();
    const langPriorities = this.priorityManager.filterByLanguage(priorities, language);
    const sortedPriorities = this.priorityManager.sortByPriority(langPriorities);

    let content = this.generateMinimumHeader(language);
    
    // Group by tier
    const tierGroups = this.groupDocumentsByTier(sortedPriorities.documents);

    for (const [tierName, tierDocs] of Object.entries(tierGroups)) {
      if (tierDocs.length === 0) continue;
      
      content += `\n## ${this.capitalizeTier(tierName)} Documents (${tierDocs.length})\n\n`;
      
      for (const doc of tierDocs) {
        const url = this.generateDocumentURL(doc.priority.document.source_path, doc.id, language);
        content += `- [${doc.priority.document.title}](${url}) - Priority: ${doc.priority.priority.score}\n`;
      }
    }
    
    content += this.generateMinimumFooter();
    return content;
  }

  /**
   * Generate origin format content (complete original documents)
   */
  async generateOrigin(language: string = this.config.generation.defaultLanguage): Promise<string> {
    const priorities = await this.priorityManager.loadAllPriorities();
    const langPriorities = this.priorityManager.filterByLanguage(priorities, language);
    const sortedPriorities = this.priorityManager.sortByPriority(langPriorities);
    
    const documents = await this.documentProcessor.processDocuments(langPriorities, language);
    const sortedDocuments = this.documentProcessor.sortByPriority(documents, langPriorities);
    
    console.log(`📄 Successfully processed ${documents.length} out of ${Object.keys(langPriorities).length} documents`);

    let content = this.generateOriginHeader(language);
    
    for (const document of sortedDocuments) {
      const priority = langPriorities[document.id];
      if (!priority) continue;

      content += `\n# ${document.title}\n\n`;
      content += `**Source**: \`${document.sourcePath}\`  \n`;
      content += `**Priority**: ${priority.priority.score} (${priority.priority.tier})  \n\n`;
      content += document.cleanContent;
      content += '\n\n---\n\n';
    }
    
    content += this.generateOriginFooter();
    return content;
  }

  /**
   * Generate character-limited content
   */
  async generateCharacterLimited(
    targetChars: number,
    language: string = this.config.generation.defaultLanguage
  ): Promise<string> {
    console.log(`\n📏 Generating ${targetChars}-character content (${language})...`);
    
    // TODO: Implement intelligent content summarization based on priority and character limits
    // This would use the extraction guidelines from priority.json files
    
    const priorities = await this.priorityManager.loadAllPriorities();
    const langPriorities = this.priorityManager.filterByLanguage(priorities, language);
    
    let content = `# Context-Action Framework - ${targetChars} Character Summary\n\n`;
    content += `Generated: ${new Date().toISOString().split('T')[0]}\n`;
    content += `Language: ${language.toUpperCase()}\n`;
    content += `Character Limit: ${targetChars}\n\n`;
    
    // For now, return a placeholder
    content += `*Character-limited content generation (${targetChars} chars) not yet fully implemented*\n\n`;
    content += `This will intelligently summarize documents based on:\n`;
    content += `- Priority scores and tiers\n`;
    content += `- Extraction strategies from priority.json\n`;
    content += `- Character limit guidelines\n`;
    content += `- Must-include keywords and concepts\n`;

    return content;
  }

  /**
   * Main generation method for batch processing
   */
  async generate(options: GenerationOptions = {}): Promise<GenerationResult> {
    const startTime = Date.now();
    const result: GenerationResult = {
      success: true,
      results: {},
      errors: [],
      warnings: [],
      totalFiles: 0,
      totalSize: 0,
      executionTime: 0
    };

    const languages = options.languages || [this.config.generation.defaultLanguage];
    const formats = options.formats || ['minimum', 'origin'];

    try {
      for (const language of languages) {
        for (const format of formats) {
          let content: string;
          let filename: string;

          switch (format) {
            case 'minimum':
              content = await this.generateMinimum(language);
              filename = `llms-minimum-${language}.txt`;
              break;
              
            case 'origin':
              content = await this.generateOrigin(language);
              filename = `llms-origin-${language}.txt`;
              break;
              
            case 'chars':
              if (!options.characterLimits || options.characterLimits.length === 0) {
                result.warnings.push('Character limits not specified for chars format');
                continue;
              }
              
              for (const limit of options.characterLimits) {
                content = await this.generateCharacterLimited(limit, language);
                filename = `llms-${limit}chars-${language}.txt`;
                
                const outputPath = await this.writeOutput(content, filename, language, options.outputDir);
                this.updateResult(result, format + '-' + limit, language, outputPath, content.length);
              }
              continue;
              
            default:
              result.errors.push(`Unknown format: ${format}`);
              continue;
          }

          const outputPath = await this.writeOutput(content, filename, language, options.outputDir);
          this.updateResult(result, format, language, outputPath, content.length);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  /**
   * Write output content to file
   */
  private async writeOutput(
    content: string,
    filename: string,
    language: string,
    customOutputDir?: string
  ): Promise<string> {
    const outputDir = customOutputDir || path.join(this.config.paths.docsDir, language, 'llms');
    
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, filename);
    await writeFile(outputPath, content, 'utf-8');
    
    const sizeKB = (content.length / 1024).toFixed(1);
    console.log(`✅ Generated: ${outputPath}`);
    console.log(`📊 Size: ${sizeKB}KB (${content.length} characters)`);
    
    return outputPath;
  }

  /**
   * Update generation result
   */
  private updateResult(
    result: GenerationResult,
    format: string,
    language: string,
    path: string,
    size: number
  ): void {
    if (!result.results[format]) {
      result.results[format] = {};
    }
    
    result.results[format][language] = {
      path,
      size,
      charactersGenerated: size
    };
    
    result.totalFiles++;
    result.totalSize += size;
  }

  /**
   * Group documents by tier
   */
  private groupDocumentsByTier(documents: Array<{ id: string; priority: PriorityMetadata }>) {
    return {
      critical: documents.filter(d => d.priority.priority.tier === 'critical'),
      essential: documents.filter(d => d.priority.priority.tier === 'essential'),
      important: documents.filter(d => d.priority.priority.tier === 'important'),
      reference: documents.filter(d => d.priority.priority.tier === 'reference'),
      supplementary: documents.filter(d => d.priority.priority.tier === 'supplementary')
    };
  }

  /**
   * Generate document URL
   */
  private generateDocumentURL(sourcePath: string, documentId: string, language: string): string {
    const baseURL = 'https://mineclover.github.io/context-action';
    
    if (sourcePath) {
      const urlPath = sourcePath.replace(/\.md$/, '');
      return `${baseURL}/${language}/${urlPath}`;
    }
    
    // Fallback: generate from document ID
    const pathSegments = documentId.split('-');
    if (pathSegments.length >= 2) {
      const category = pathSegments[0];
      const name = pathSegments.slice(1).join('-');
      return `${baseURL}/${language}/${category}/${name}`;
    }
    
    return `${baseURL}/${language}/${documentId}`;
  }

  /**
   * Capitalize tier name
   */
  private capitalizeTier(tier: string): string {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  /**
   * Generate headers and footers
   */
  private generateMinimumHeader(language: string): string {
    return `# Context-Action Framework - Document Navigation

Generated: ${new Date().toISOString().split('T')[0]}
Type: Minimum (Navigation Links)
Language: ${language.toUpperCase()}

This document provides quick navigation links to all Context-Action framework documentation, organized by priority tiers.

`;
  }

  private generateMinimumFooter(): string {
    return `

## Usage Notes

- **Critical**: Essential documents for understanding the framework
- **Essential**: Important guides and API references  
- **Important**: Valuable reference material
- **Reference**: Advanced and supplementary content

## Quick Start Path

For first-time users, follow this recommended reading order:
1. Core Concepts (Critical)
2. Getting Started (Critical)  
3. Pattern Guide (Essential)
4. API Reference (Essential)

---

*Generated automatically from llm-content structure*`;
  }

  private generateOriginHeader(language: string): string {
    return `# Context-Action Framework - Complete Documentation

Generated: ${new Date().toISOString().split('T')[0]}
Type: Origin (Full Documents)
Language: ${language.toUpperCase()}

This document contains the complete original content of all Context-Action framework documentation files, organized by priority.

---

`;
  }

  private generateOriginFooter(): string {
    return `

---

## Document Collection Summary

This collection includes all original documentation content from the Context-Action framework, preserving the complete information while removing YAML metadata for clean presentation.

**Generation Date**: ${new Date().toISOString().split('T')[0]}
**Content Type**: Original Documentation  
**Processing**: YAML frontmatter removed, content preserved

*Generated automatically from source documentation files*`;
  }
}