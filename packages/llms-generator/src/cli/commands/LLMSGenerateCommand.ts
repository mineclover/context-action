/**
 * LLMS Generation Command
 * 
 * Generates LLMS-TXT files with character_limit and category-based filtering,
 * supporting existing minimum and origin patterns.
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { EnhancedLLMSConfig } from '../../types/config.js';

export interface LLMSGenerateOptions {
  characterLimit?: number;
  category?: string;
  language?: string;
  pattern?: 'standard' | 'minimum' | 'origin';
  outputDir?: string;
  sortBy?: 'priority' | 'category' | 'alphabetical';
  includeMetadata?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface DocumentContent {
  documentId: string;
  category: string;
  language: string;
  characterLimit: number;
  title: string;
  content: string;
  priority: number;
  filePath: string;
  metadata: {
    completion_status: string;
    workflow_stage: string;
    quality_score?: number;
    content_length: number;
  };
}

export interface LLMSGenerateResult {
  outputPath: string;
  pattern: string;
  totalDocuments: number;
  totalCharacters: number;
  averageCharacters: number;
  filters: {
    characterLimit?: number;
    category?: string;
    language: string;
  };
  documents: DocumentContent[];
}

export class LLMSGenerateCommand {
  constructor(private config: EnhancedLLMSConfig) {}

  async execute(options: LLMSGenerateOptions = {}): Promise<void> {
    console.log('🚀 Generating LLMS-TXT file...\n');

    const validatedOptions = this.validateOptions(options);
    
    if (options.dryRun) {
      console.log('🔍 DRY RUN - No files will be created\n');
    }

    const documents = await this.collectDocuments(validatedOptions);
    
    if (documents.length === 0) {
      console.log('❌ No documents found matching the specified criteria');
      this.displayFilterCriteria(validatedOptions);
      return;
    }

    const filteredDocuments = this.filterDocuments(documents, validatedOptions);
    const sortedDocuments = this.sortDocuments(filteredDocuments, validatedOptions.sortBy);

    if (options.verbose || options.dryRun) {
      this.displayDocumentList(sortedDocuments, validatedOptions);
    }

    if (options.dryRun) {
      this.displayDryRunSummary(sortedDocuments, validatedOptions);
      return;
    }

    const content = this.generateContent(sortedDocuments, validatedOptions);
    const outputPath = await this.writeOutput(content, validatedOptions);

    const result: LLMSGenerateResult = {
      outputPath,
      pattern: validatedOptions.pattern,
      totalDocuments: sortedDocuments.length,
      totalCharacters: content.length,
      averageCharacters: Math.round(sortedDocuments.reduce((sum, doc) => sum + doc.metadata.content_length, 0) / sortedDocuments.length),
      filters: {
        characterLimit: validatedOptions.characterLimit,
        category: validatedOptions.category,
        language: validatedOptions.language
      },
      documents: sortedDocuments
    };

    this.displayResults(result);
  }

  private validateOptions(options: LLMSGenerateOptions): Required<Omit<LLMSGenerateOptions, 'characterLimit' | 'category' | 'outputDir'>> & Pick<LLMSGenerateOptions, 'characterLimit' | 'category' | 'outputDir'> {
    const language = options.language || this.config.generation?.defaultLanguage || 'en';
    const pattern = options.pattern || 'standard';
    const sortBy = options.sortBy || 'priority';
    const includeMetadata = options.includeMetadata !== false;
    const dryRun = options.dryRun || false;
    const verbose = options.verbose || false;

    // Validate language
    if (!this.config.generation?.supportedLanguages?.includes(language)) {
      throw new Error(`Unsupported language: ${language}. Supported: ${this.config.generation?.supportedLanguages?.join(', ') || 'none configured'}`);
    }

    // Validate character limit if provided
    if (options.characterLimit && !this.config.generation?.characterLimits?.includes(options.characterLimit)) {
      console.warn(`⚠️ Warning: Character limit ${options.characterLimit} is not in standard limits: ${this.config.generation?.characterLimits?.join(', ') || 'none configured'}`);
    }

    // Validate category if provided
    if (options.category && !Object.keys(this.config.categories || {}).includes(options.category)) {
      console.warn(`⚠️ Warning: Category ${options.category} is not in configured categories: ${Object.keys(this.config.categories || {}).join(', ')}`);
    }

    return {
      characterLimit: options.characterLimit,
      category: options.category,
      language,
      pattern,
      outputDir: options.outputDir,
      sortBy,
      includeMetadata,
      dryRun,
      verbose
    };
  }

  private async collectDocuments(options: LLMSGenerateOptions): Promise<DocumentContent[]> {
    const documents: DocumentContent[] = [];
    const language = options.language!;
    
    const languageDataDir = path.join(this.config.paths?.llmContentDir || './data', language);
    
    try {
      await fs.access(languageDataDir);
    } catch {
      throw new Error(`Language directory not found: ${languageDataDir}`);
    }

    const documentDirs = await fs.readdir(languageDataDir, { withFileTypes: true });

    for (const docDir of documentDirs) {
      if (!docDir.isDirectory()) continue;

      const documentId = docDir.name;
      const category = this.extractCategory(documentId);
      const documentPath = path.join(languageDataDir, documentId);

      try {
        const files = await fs.readdir(documentPath);
        const templateFiles = files.filter(f => f.endsWith('.md') && f.includes(documentId));

        for (const templateFile of templateFiles) {
          const characterLimit = this.extractCharacterLimit(templateFile);
          if (characterLimit === null) continue;

          const filePath = path.join(documentPath, templateFile);
          const document = await this.parseDocument(filePath, documentId, category, language, characterLimit);
          
          if (document && this.isDocumentComplete(document)) {
            documents.push(document);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Warning: Error processing ${documentId}: ${error}`);
      }
    }

    return documents;
  }

  private async parseDocument(
    filePath: string,
    documentId: string,
    category: string,
    language: string,
    characterLimit: number
  ): Promise<DocumentContent | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      const frontmatter = parsed.data;

      // Extract template content
      const templateContent = this.extractTemplateContent(parsed.content);
      if (!templateContent) return null;

      // Get priority from config or frontmatter
      const priority = frontmatter.priority_score || this.config.categories?.[category]?.priority || 50;

      // Extract title from content
      const title = this.extractTitle(parsed.content) || documentId;

      return {
        documentId,
        category,
        language,
        characterLimit,
        title,
        content: templateContent,
        priority,
        filePath,
        metadata: {
          completion_status: frontmatter.completion_status || 'unknown',
          workflow_stage: frontmatter.workflow_stage || 'unknown',
          quality_score: frontmatter.quality_score,
          content_length: templateContent.length
        }
      };
    } catch (error) {
      console.warn(`⚠️ Warning: Error parsing ${filePath}: ${error}`);
      return null;
    }
  }

  private extractTemplateContent(content: string): string {
    // Extract content from "템플릿 내용" section
    const contentMatch = content.match(/## 템플릿 내용[^]*?```markdown\s*([\s\S]*?)\s*```/);
    if (contentMatch && contentMatch[1]) {
      return contentMatch[1].trim().replace(/<!--[\s\S]*?-->/g, '').trim();
    }
    return '';
  }

  private extractTitle(content: string): string | null {
    const titleMatch = content.match(/^# (.+)/m);
    return titleMatch ? titleMatch[1].replace(/\s*\(\d+자\)/, '') : null;
  }

  private extractCategory(documentId: string): string {
    const parts = documentId.split('--');
    return parts[0] || 'unknown';
  }

  private extractCharacterLimit(fileName: string): number | null {
    const match = fileName.match(/-(\d+)\.md$/);
    return match ? parseInt(match[1]) : null;
  }

  private isDocumentComplete(document: DocumentContent): boolean {
    // Check if document has real content (not just template placeholders)
    const content = document.content;
    
    if (content.length < 30) return false;
    
    const hasPlaceholders = 
      content.includes('여기에') ||
      content.includes('작성하세요') ||
      content.includes('Provide comprehensive guidance on');
    
    return !hasPlaceholders;
  }

  private filterDocuments(documents: DocumentContent[], options: LLMSGenerateOptions): DocumentContent[] {
    let filtered = documents;

    // Filter by character limit
    if (options.characterLimit) {
      filtered = filtered.filter(doc => doc.characterLimit === options.characterLimit);
    }

    // Filter by category
    if (options.category) {
      filtered = filtered.filter(doc => doc.category === options.category);
    }

    return filtered;
  }

  private sortDocuments(documents: DocumentContent[], sortBy: string): DocumentContent[] {
    const sorted = [...documents];

    switch (sortBy) {
      case 'priority':
        return sorted.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // Higher priority first
          }
          return a.documentId.localeCompare(b.documentId);
        });
      
      case 'category':
        return sorted.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return b.priority - a.priority;
        });
      
      case 'alphabetical':
        return sorted.sort((a, b) => a.documentId.localeCompare(b.documentId));
      
      default:
        return sorted;
    }
  }

  private generateContent(documents: DocumentContent[], options: LLMSGenerateOptions): string {
    const { pattern, language, characterLimit, category, includeMetadata } = options;
    
    let content = '';

    // Generate header based on pattern
    switch (pattern) {
      case 'minimum':
        content += this.generateMinimumHeader(language, { characterLimit, category });
        break;
      case 'origin':
        content += this.generateOriginHeader(language, { characterLimit, category });
        break;
      default:
        content += this.generateStandardHeader(language, { characterLimit, category });
    }

    content += '\n\n';

    // Add metadata if requested
    if (includeMetadata) {
      content += this.generateMetadata(documents, { characterLimit, category, language });
      content += '\n\n';
    }

    // Generate content based on pattern
    switch (pattern) {
      case 'minimum':
        content += this.generateMinimumContent(documents);
        break;
      case 'origin':
        content += this.generateOriginContent(documents);
        break;
      default:
        content += this.generateStandardContent(documents);
    }

    // Add footer
    content += '\n\n---\n\n';
    content += `*Generated automatically on ${new Date().toISOString().split('T')[0]}*\n`;

    return content;
  }

  private generateStandardHeader(language: string, filters: { characterLimit?: number; category?: string }): string {
    let title = 'Context-Action Framework';
    
    if (filters.category) {
      title += ` - ${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}`;
    }
    
    if (filters.characterLimit) {
      title += ` (${filters.characterLimit} chars)`;
    }

    return [
      `# ${title}`,
      '',
      `Generated: ${new Date().toISOString().split('T')[0]}`,
      `Type: Standard`,
      `Language: ${language.toUpperCase()}`,
      '',
      `This document contains ${filters.characterLimit ? `${filters.characterLimit}-character` : 'character-limited'} summaries${filters.category ? ` from the ${filters.category} category` : ''} of the Context-Action framework documentation.`
    ].join('\n');
  }

  private generateMinimumHeader(language: string, filters: { characterLimit?: number; category?: string }): string {
    return [
      '# Context-Action Framework - Document Navigation',
      '',
      `Generated: ${new Date().toISOString().split('T')[0]}`,
      'Type: Minimum (Navigation Links)',
      `Language: ${language.toUpperCase()}`,
      '',
      `This document provides quick navigation links to${filters.category ? ` ${filters.category}` : ''} Context-Action framework documentation${filters.characterLimit ? ` with ${filters.characterLimit}-character summaries` : ''}, organized by priority tiers.`
    ].join('\n');
  }

  private generateOriginHeader(language: string, filters: { characterLimit?: number; category?: string }): string {
    return [
      '# Context-Action Framework - Complete Documentation',
      '',
      `Generated: ${new Date().toISOString().split('T')[0]}`,
      'Type: Origin (Full Documents)',
      `Language: ${language.toUpperCase()}`,
      '',
      `This document contains the complete${filters.characterLimit ? ` ${filters.characterLimit}-character` : ''} content${filters.category ? ` from ${filters.category} category` : ''} of Context-Action framework documentation, organized by priority.`
    ].join('\n');
  }

  private generateMetadata(documents: DocumentContent[], filters: { characterLimit?: number; category?: string; language: string }): string {
    const stats = {
      totalDocuments: documents.length,
      categories: [...new Set(documents.map(d => d.category))],
      characterLimits: [...new Set(documents.map(d => d.characterLimit))],
      averageQuality: documents.filter(d => d.metadata.quality_score).reduce((sum, d) => sum + d.metadata.quality_score!, 0) / documents.filter(d => d.metadata.quality_score).length || 0,
      totalCharacters: documents.reduce((sum, d) => sum + d.metadata.content_length, 0)
    };

    return [
      '## Document Collection Metadata',
      '',
      `**Total Documents**: ${stats.totalDocuments}`,
      `**Categories**: ${stats.categories.join(', ')}`,
      `**Character Limits**: ${stats.characterLimits.join(', ')}`,
      `**Total Characters**: ${stats.totalCharacters.toLocaleString()}`,
      `**Average Quality Score**: ${stats.averageQuality.toFixed(1)}`,
      '',
      '**Filters Applied**:',
      `- Language: ${filters.language}`,
      filters.characterLimit ? `- Character Limit: ${filters.characterLimit}` : '',
      filters.category ? `- Category: ${filters.category}` : ''
    ].filter(Boolean).join('\n');
  }

  private generateStandardContent(documents: DocumentContent[]): string {
    let content = '## Documents\n\n';
    
    documents.forEach((doc, index) => {
      content += `### ${index + 1}. ${doc.title}\n`;
      content += `**Category**: ${doc.category} | **Priority**: ${doc.priority} | **Length**: ${doc.metadata.content_length} chars\n\n`;
      content += `${doc.content}\n\n`;
      content += '---\n\n';
    });

    return content;
  }

  private generateMinimumContent(documents: DocumentContent[]): string {
    const categories = [...new Set(documents.map(d => d.category))];
    let content = '';

    content += '## Quick Start Path\n\n';
    content += 'For first-time users, follow this recommended reading order:\n';
    
    const topPriority = documents
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4);
    
    topPriority.forEach((doc, index) => {
      content += `${index + 1}. ${doc.title} (${doc.category})\n`;
    });

    content += '\n## Documents by Category\n\n';

    categories.forEach(category => {
      const categoryDocs = documents.filter(d => d.category === category);
      content += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      
      categoryDocs.forEach(doc => {
        content += `- [${doc.title}] - ${doc.content.substring(0, 100)}...\n`;
      });
      content += '\n';
    });

    return content;
  }

  private generateOriginContent(documents: DocumentContent[]): string {
    let content = '## Complete Documentation Content\n\n';
    
    documents.forEach((doc, index) => {
      content += `## ${index + 1}. ${doc.title}\n`;
      content += `*Category: ${doc.category} | Priority: ${doc.priority}*\n\n`;
      content += `${doc.content}\n\n`;
    });

    return content;
  }

  private async writeOutput(content: string, options: LLMSGenerateOptions): Promise<string> {
    const { language, characterLimit, category, pattern, outputDir } = options;
    
    // Determine output directory
    const baseOutputDir = outputDir || path.join(this.config.paths?.outputDir || './docs/llms');
    
    // Create output directory if it doesn't exist
    await fs.mkdir(baseOutputDir, { recursive: true });

    // Generate filename
    let filename = `llms-${language || 'en'}`;
    
    if (characterLimit) {
      filename += `-${characterLimit}chars`;
    }
    
    if (category) {
      filename += `-${category}`;
    }

    if (pattern && pattern !== 'standard') {
      filename += `-${pattern}`;
    }

    filename += '.txt';

    const outputPath = path.join(baseOutputDir, filename);
    await fs.writeFile(outputPath, content, 'utf-8');

    return outputPath;
  }

  private displayFilterCriteria(options: LLMSGenerateOptions): void {
    console.log('\n📋 Filter Criteria:');
    console.log(`   Language: ${options.language}`);
    if (options.characterLimit) console.log(`   Character Limit: ${options.characterLimit}`);
    if (options.category) console.log(`   Category: ${options.category}`);
    console.log(`   Pattern: ${options.pattern}`);
    console.log('\n💡 Try adjusting your filters or check if documents exist with these criteria.');
  }

  private displayDocumentList(documents: DocumentContent[], options: LLMSGenerateOptions): void {
    console.log(`📄 Found ${documents.length} documents:\n`);
    
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.documentId}`);
      console.log(`   📁 Category: ${doc.category}`);
      console.log(`   📏 Character Limit: ${doc.characterLimit}`);
      console.log(`   ⭐ Priority: ${doc.priority}`);
      console.log(`   📊 Content Length: ${doc.metadata.content_length} chars`);
      console.log(`   🎯 Status: ${doc.metadata.completion_status}`);
      console.log();
    });
  }

  private displayDryRunSummary(documents: DocumentContent[], options: LLMSGenerateOptions): void {
    const totalChars = documents.reduce((sum, doc) => sum + doc.metadata.content_length, 0);
    
    console.log('📊 Dry Run Summary:');
    console.log(`   Would generate LLMS file with:`);
    console.log(`   • ${documents.length} documents`);
    console.log(`   • ${totalChars.toLocaleString()} total characters`);
    console.log(`   • Pattern: ${options.pattern}`);
    console.log(`   • Language: ${options.language}`);
    if (options.characterLimit) console.log(`   • Character Limit: ${options.characterLimit}`);
    if (options.category) console.log(`   • Category: ${options.category}`);
    console.log();
  }

  private displayResults(result: LLMSGenerateResult): void {
    console.log('\n✅ LLMS file generated successfully!\n');
    console.log('📊 Generation Summary:');
    console.log(`   📄 Output: ${result.outputPath}`);
    console.log(`   📝 Pattern: ${result.pattern}`);
    console.log(`   📚 Documents: ${result.totalDocuments}`);
    console.log(`   📏 Total Characters: ${result.totalCharacters.toLocaleString()}`);
    console.log(`   📈 Average per Document: ${result.averageCharacters} chars`);
    
    console.log('\n🔍 Filters Applied:');
    console.log(`   🌐 Language: ${result.filters.language}`);
    if (result.filters.characterLimit) {
      console.log(`   📏 Character Limit: ${result.filters.characterLimit}`);
    }
    if (result.filters.category) {
      console.log(`   📁 Category: ${result.filters.category}`);
    }
    
    console.log();
  }
}