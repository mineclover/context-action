/**
 * LLMS Generation Command
 * 
 * Generates LLMS-TXT files with character_limit and category-based filtering,
 * supporting existing minimum and origin patterns.
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { CLIConfig } from '../types/CLITypes.js';
import { LLMSOutputPathManager } from '../../core/LLMSOutputPathManager.js';

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
  private pathManager: LLMSOutputPathManager;

  constructor(private config: CLIConfig) {
    this.pathManager = new LLMSOutputPathManager(config);
  }

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
      this.displayDocumentList(sortedDocuments);
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
    
    const languageDataDir = path.join(this.config.paths.llmContentDir, language);
    
    try {
      await fs.access(languageDataDir);
    } catch (_error) {
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
      // 1. Check if priority.json exists first
      const documentDir = path.dirname(filePath);
      const priorityPath = path.join(documentDir, 'priority.json');
      
      let priorityData: any = null;
      try {
        const priorityContent = await fs.readFile(priorityPath, 'utf-8');
        priorityData = JSON.parse(priorityContent);
      } catch (_error) {
        console.warn(`⚠️ Warning: No priority.json found for ${documentId}`);
      }

      // 2. Try to extract content from source document if priority.json exists and is not template
      if (priorityData && this.isPriorityDataValid(priorityData)) {
        const sourceContent = await this.extractFromSourceDocument(
          priorityData.document.source_path, 
          characterLimit, 
          priorityData
        );
        
        if (sourceContent) {
          // Clean up template values from priority data
          const cleanedPriorityData = this.cleanPriorityData(priorityData);
          
          return {
            documentId,
            category,
            language,
            characterLimit,
            title: cleanedPriorityData.document?.title || documentId,
            content: sourceContent,
            priority: cleanedPriorityData.priority?.score || 50,
            filePath,
            metadata: {
              completion_status: 'generated_from_source',
              workflow_stage: 'auto_generated',
              quality_score: cleanedPriorityData.quality?.completeness_threshold || 0.8,
              content_length: sourceContent.length
            }
          };
        }
      }

      // 3. Fallback to template file parsing (legacy mode)
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      const frontmatter = parsed.data;

      const templateContent = this.extractTemplateContent(parsed.content);
      if (!templateContent) return null;

      const priority = frontmatter.priority_score || 
                      frontmatter.priority || 
                      priorityData?.priority?.score ||
                      this.config.categories?.[category]?.priority || 
                      50;

      const title = frontmatter.title || 
                   frontmatter.document_id || 
                   priorityData?.document?.title ||
                   this.extractTitle(parsed.content) || 
                   documentId;

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
          completion_status: frontmatter.completion_status || frontmatter.update_status || 'template_based',
          workflow_stage: frontmatter.workflow_stage || 'template_content',
          quality_score: frontmatter.quality_score || priorityData?.quality?.completeness_threshold,
          content_length: templateContent.length
        }
      };
    } catch (error) {
      console.warn(`⚠️ Warning: Error parsing ${filePath}: ${error}`);
      return null;
    }
  }

  private async extractFromSourceDocument(
    sourcePath: string, 
    characterLimit: number, 
    priorityData: any
  ): Promise<string | null> {
    try {
      // Build full path to source document
      const fullSourcePath = path.join(this.config.paths.docsDir, sourcePath);
      
      if (!await this.fileExists(fullSourcePath)) {
        console.warn(`⚠️ Warning: Source document not found: ${fullSourcePath}`);
        return null;
      }

      const sourceContent = await fs.readFile(fullSourcePath, 'utf-8');
      const parsed = matter(sourceContent);
      
      // Use priority.json extraction strategy to generate appropriate content
      const strategy = priorityData.extraction?.character_limits?.[characterLimit];
      if (strategy) {
        return this.generateContentFromStrategy(parsed.content, strategy, characterLimit);
      }
      
      // Fallback: simple content extraction
      return this.extractContentByCharacterLimit(parsed.content, characterLimit);
      
    } catch (error) {
      console.warn(`⚠️ Warning: Error extracting from source document: ${error}`);
      return null;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (_error) {
      return false;
    }
  }

  private generateContentFromStrategy(content: string, strategy: any, characterLimit: number): string {
    // Remove frontmatter and basic cleanup
    const cleanContent = content
      .replace(/^---[\s\S]*?---\n/, '') // Remove frontmatter
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/^#+\s/gm, '') // Remove headers
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();

    // Extract first few sentences based on character limit
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let result = '';
    let currentLength = 0;
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentLength + trimmedSentence.length + 1 > characterLimit * 0.9) break; // Leave some margin
      
      if (result) result += '. ';
      result += trimmedSentence;
      currentLength = result.length;
    }
    
    if (result && !result.endsWith('.')) result += '.';
    return result || cleanContent.substring(0, characterLimit - 10) + '...';
  }

  private extractContentByCharacterLimit(content: string, characterLimit: number): string {
    const cleanContent = content
      .replace(/^---[\s\S]*?---\n/, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^#+\s/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleanContent.length <= characterLimit) return cleanContent;
    
    // Find the last complete sentence within the limit
    const truncated = cleanContent.substring(0, characterLimit - 3);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    return lastSentenceEnd > characterLimit * 0.5 
      ? truncated.substring(0, lastSentenceEnd + 1)
      : truncated + '...';
  }

  private isPriorityDataValid(priorityData: any): boolean {
    // Check if priority.json contains actual data or just template placeholders
    if (!priorityData.document?.source_path) return false;
    
    // Filter out common template/placeholder values
    const templateIndicators = [
      'Auto-generated priority assignment',
      'Provide comprehensive guidance on',
      'Understanding api ',
      'Implementing api ',
      'Framework learning',
      'framework-users',
      'beginners',
      '<!-- Set priority score',
      '<!-- Set tier:',
      '<!-- Explain why',
      '<!-- What is the main purpose',
      '<!-- Who should read this',
      '<!-- What to focus on'
    ];
    
    const rationale = priorityData.priority?.rationale || '';
    const primaryGoal = priorityData.purpose?.primary_goal || '';
    const score = String(priorityData.priority?.score || '');
    
    // Check if contains template indicators
    const hasTemplateContent = templateIndicators.some(indicator => 
      rationale.includes(indicator) || 
      primaryGoal.includes(indicator) ||
      score.includes(indicator)
    );
    
    // Check if purpose is empty object (cleaned template)
    const isPurposeEmpty = Object.keys(priorityData.purpose || {}).length === 0;
    
    if (hasTemplateContent || isPurposeEmpty) {
      console.log(`📋 Skipping template priority.json for ${priorityData.document?.id || 'unknown'}`);
      return false;
    }
    
    return true;
  }

  private cleanPriorityData(priorityData: any): any {
    // Create a cleaned copy of priority data, removing template values
    const cleaned = JSON.parse(JSON.stringify(priorityData));
    
    // Clean template rationale
    if (cleaned.priority?.rationale?.includes('Auto-generated priority assignment')) {
      cleaned.priority.rationale = null;
    }
    
    // Clean template primary_goal
    if (cleaned.purpose?.primary_goal?.includes('Provide comprehensive guidance on')) {
      cleaned.purpose.primary_goal = null;
    }
    
    // Clean template use_cases that contain generic patterns
    if (cleaned.purpose?.use_cases) {
      cleaned.purpose.use_cases = cleaned.purpose.use_cases.filter((useCase: string) => 
        !useCase.includes('Understanding ') && 
        !useCase.includes('Implementing ') && 
        !useCase.includes('Framework learning')
      );
      
      // If no valid use_cases left, clear the array
      if (cleaned.purpose.use_cases.length === 0) {
        cleaned.purpose.use_cases = null;
      }
    }
    
    // Clean template audience values
    if (cleaned.purpose?.target_audience) {
      cleaned.purpose.target_audience = cleaned.purpose.target_audience.filter((audience: string) => 
        !['framework-users', 'beginners'].includes(audience)
      );
      
      if (cleaned.purpose.target_audience.length === 0) {
        cleaned.purpose.target_audience = null;
      }
    }
    
    // Clean template technical keywords that are too generic
    if (cleaned.keywords?.technical) {
      const genericKeywords = ['API', 'methods', 'interfaces', 'framework'];
      cleaned.keywords.technical = cleaned.keywords.technical.filter((keyword: string) => 
        !genericKeywords.includes(keyword)
      );
      
      if (cleaned.keywords.technical.length === 0) {
        cleaned.keywords.technical = null;
      }
    }
    
    return cleaned;
  }

  private extractTemplateContent(content: string): string {
    // STANDARD FORMAT: Direct content after frontmatter (preferred)
    // This is the new standard format - gray-matter already removed frontmatter
    const directContent = content
      .trim()
      .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
      .replace(/^#+\s.*$/gm, '') // Remove markdown headers (if any)
      .replace(/^\s*---\s*$/gm, '') // Remove horizontal rules
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
    
    // Check if this is substantial content (not just template structure)
    if (directContent && 
        directContent.length > 10 && 
        !directContent.includes('## 템플릿 내용') &&
        !directContent.includes('Provide comprehensive guidance on')) {
      return directContent;
    }
    
    // LEGACY FORMAT: Try to extract from "템플릿 내용" section with markdown code block
    const codeBlockMatch = content.match(/## 템플릿 내용[^]*?```markdown\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim().replace(/<!--[\s\S]*?-->/g, '').trim();
    }
    
    // LEGACY FORMAT: If no code block found, try to extract content from "템플릿 내용" section
    const sectionMatch = content.match(/## 템플릿 내용[^]*?\n\n([\s\S]*?)(?=\n\n|$)/);
    if (sectionMatch && sectionMatch[1]) {
      return sectionMatch[1].trim().replace(/<!--[\s\S]*?-->/g, '').trim();
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
    
    if (content.length < 10) return false;
    
    const hasPlaceholders = 
      content.includes('여기에') ||
      content.includes('작성하세요') ||
      content.includes('Provide comprehensive guidance on') ||
      content.includes('Provide comprehensive guida'); // Handle truncated placeholder
    
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
    const { pattern, language, characterLimit } = options;
    
    let content = '';

    // Simple header with character limit info
    if (characterLimit) {
      content += `# Documentation (${characterLimit} chars)\n\n`;
      content += `Generated: ${new Date().toISOString().split('T')[0]}\n`;
      content += `Type: ${pattern === 'minimum' ? 'Minimum' : pattern === 'origin' ? 'Origin' : 'Standard'}\n`;
      content += `Language: ${language?.toUpperCase() || 'EN'}\n\n`;
      
      content += `This document contains ${characterLimit}-character summaries of the documentation.\n\n`;
    } else {
      content += `# Documentation\n\n`;
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

    // Simple footer
    content += '\n\n---\n\n';
    content += `*Generated automatically on ${new Date().toISOString().split('T')[0]}*\n`;

    return content;
  }

  private generateStandardHeader(language: string, filters: { characterLimit?: number; category?: string }): string {
    let title = 'Documentation';
    
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
      `This document contains ${filters.characterLimit ? `${filters.characterLimit}-character` : 'character-limited'} summaries${filters.category ? ` from the ${filters.category} category` : ''} of the documentation.`
    ].join('\n');
  }

  private generateMinimumHeader(language: string, filters: { characterLimit?: number; category?: string }): string {
    return [
      '# Document Navigation',
      '',
      `Generated: ${new Date().toISOString().split('T')[0]}`,
      'Type: Minimum (Navigation Links)',
      `Language: ${language.toUpperCase()}`,
      '',
      `This document provides quick navigation links to${filters.category ? ` ${filters.category}` : ''} documentation${filters.characterLimit ? ` with ${filters.characterLimit}-character summaries` : ''}, organized by priority tiers.`
    ].join('\n');
  }

  private generateOriginHeader(language: string, filters: { characterLimit?: number; category?: string }): string {
    return [
      '# Complete Documentation',
      '',
      `Generated: ${new Date().toISOString().split('T')[0]}`,
      'Type: Origin (Full Documents)',
      `Language: ${language.toUpperCase()}`,
      '',
      `This document contains the complete${filters.characterLimit ? ` ${filters.characterLimit}-character` : ''} content${filters.category ? ` from ${filters.category} category` : ''} of documentation, organized by priority.`
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
    let content = '';
    
    documents.forEach((doc, index) => {
      // Format document title to be more readable
      const readableTitle = this.formatReadableTitle(doc.title);
      
      // Add document separator and content without frontmatter
      content += `===================[ DOC: ${this.getRelativeSourcePath(doc)} ]===================\n`;
      content += `# ${readableTitle}\n\n`;
      content += `${doc.content}\n\n`;
      
      // Add separator between documents
      if (index < documents.length - 1) {
        content += `\n`;
      }
    });

    return content.trim();
  }

  private formatReadableTitle(title: string): string {
    // Convert document IDs like "guide--action-handlers" to "Action Handlers"
    if (title.includes('--')) {
      const parts = title.split('--');
      const mainPart = parts[parts.length - 1]; // Get the last part after --
      
      // Convert kebab-case to Title Case
      return mainPart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return title;
  }

  private getRelativeSourcePath(doc: DocumentContent): string {
    return this.pathManager.getRelativeSourcePath(doc.documentId, doc.language, doc.characterLimit, doc.filePath);
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
      const sourcePath = this.getRelativeSourcePath(doc);
      content += `${index + 1}. [${doc.title}](${sourcePath}) (${doc.category}) - Priority: ${doc.priority}\n`;
    });

    content += '\n## Documents by Category\n\n';

    categories.forEach(category => {
      const categoryDocs = documents.filter(d => d.category === category);
      content += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      
      categoryDocs.forEach(doc => {
        const sourcePath = this.getRelativeSourcePath(doc);
        const preview = doc.content.substring(0, 80);
        content += `- **[${this.formatReadableTitle(doc.title)}](${sourcePath})** (Priority: ${doc.priority}, ${doc.characterLimit} chars) - ${preview}...\n`;
      });
      content += '\n';
    });

    return content;
  }

  private generateOriginContent(documents: DocumentContent[]): string {
    let content = '## Complete Documentation Content\n\n';
    
    documents.forEach((doc, index) => {
      const readableTitle = this.formatReadableTitle(doc.title);
      content += `===================[ DOC: ${this.getRelativeSourcePath(doc)} ]===================\n`;
      content += `## ${readableTitle}\n`;
      content += `*Source: [${this.getRelativeSourcePath(doc)}](${this.getRelativeSourcePath(doc)}) | Category: ${doc.category} | Priority: ${doc.priority} | Characters: ${doc.metadata.content_length}*\n\n`;
      content += `${doc.content}\n\n`;
      
      // Add separator between documents
      if (index < documents.length - 1) {
        content += `\n`;
      }
    });

    return content;
  }

  private async writeOutput(content: string, options: LLMSGenerateOptions): Promise<string> {
    const { language, characterLimit, category, pattern, outputDir } = options;
    
    // Use path manager for consistent output path generation
    const { outputPath } = this.pathManager.generateOutputPath({
      language: language || 'en',
      characterLimit,
      category,
      pattern,
      outputDir
    });
    
    // Create directory and write file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
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

  private displayDocumentList(documents: DocumentContent[]): void {
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