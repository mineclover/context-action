/**
 * Simple LLMS Generation Command
 * 
 * Generates clean, minimal LLMS-TXT files focused on content without metadata overhead.
 * Designed for actual LLM training/inference use cases.
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { CLIConfig } from '../types/CLITypes.js';
import { EnhancedLLMSConfig } from '../../types/config.js';
import { LLMSOutputPathManager } from '../../core/LLMSOutputPathManager.js';

export interface SimpleLLMSOptions {
  characterLimit?: number;
  category?: string;
  language?: string;
  pattern?: 'clean' | 'minimal' | 'raw' | 'origin' | 'minimum';
  patterns?: string[]; // Multiple patterns to generate
  generateAll?: boolean; // Generate origin, minimum, and default chars in one command
  outputDir?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface CleanDocument {
  title: string;
  content: string;
  priority: number;
  characterLimit: number;
  category: string;
  documentId: string;
  language: string;
  filePath: string;
  metadata: {
    completion_status: string;
    workflow_stage: string;
    quality_score?: number;
    content_length: number;
  };
}

export class SimpleLLMSCommand {
  private pathManager: LLMSOutputPathManager;

  constructor(private config: EnhancedLLMSConfig) {
    // Convert EnhancedLLMSConfig to CLIConfig for compatibility
    const cliConfig: CLIConfig = {
      paths: config.paths,
      generation: {
        supportedLanguages: config.generation.supportedLanguages,
        characterLimits: config.generation.characterLimits,
        defaultCharacterLimits: {
          summary: 300,
          detailed: 1000,
          comprehensive: 2000
        },
        defaultLanguage: config.generation.defaultLanguage,
        outputFormat: 'txt' as const
      },
      quality: config.quality,
      categories: config.categories
    };
    this.pathManager = new LLMSOutputPathManager(cliConfig);
  }

  async execute(options: SimpleLLMSOptions): Promise<void> {
    const {
      characterLimit,
      category,
      language = this.config.generation?.defaultLanguage || 'ko',
      pattern = 'clean',
      patterns,
      generateAll = false,
      outputDir = this.config.paths?.outputDir || './docs/llms',
      dryRun = false,
      verbose = false
    } = options;

    // Default behavior: generate origin, minimum, and default character limit files
    if (generateAll || (!pattern && !patterns && !characterLimit)) {
      return this.executeMultipleGeneration({
        ...options,
        language,
        outputDir,
        dryRun,
        verbose
      });
    }

    if (verbose) {
      console.log('🚀 Generating clean LLMS-TXT file...');
      if (dryRun) console.log('🔍 DRY RUN - No files will be created');
    }

    // Find and parse documents
    const documents = await this.findDocuments(language, characterLimit, category);
    
    if (documents.length === 0) {
      console.log('❌ No completed documents found matching the specified criteria');
      console.log('📋 Filter Criteria:');
      console.log(`   Language: ${language}`);
      if (characterLimit) console.log(`   Character Limit: ${characterLimit}`);
      if (category) console.log(`   Category: ${category}`);
      console.log('💡 Try running `work-next --show-completed` to see available documents.');
      return;
    }

    if (verbose) {
      console.log(`📄 Found ${documents.length} completed documents:`);
      documents.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.title} (${doc.category}, ${doc.characterLimit} chars)`);
      });
      console.log();
    }

    // Generate content
    const content = this.generateCleanContent(documents, pattern);
    
    // Use path manager for consistent output path generation
    const { outputPath, filename } = this.pathManager.generateOutputPath({
      language,
      characterLimit,
      category,
      pattern,
      outputDir
    });

    if (dryRun) {
      console.log('📊 Dry Run Summary:');
      console.log(`   Would generate: ${filename}`);
      console.log(`   Documents: ${documents.length}`);
      console.log(`   Total characters: ${content.length}`);
      console.log(`   Pattern: ${pattern}`);
      console.log(`   Language: ${language}`);
      if (characterLimit) console.log(`   Character Limit: ${characterLimit}`);
      if (category) console.log(`   Category: ${category}`);
      return;
    }

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Write file
    await fs.writeFile(outputPath, content, 'utf-8');
    
    console.log('✅ Clean LLMS file generated successfully!');
    console.log(`📄 Output: ${outputPath}`);
    console.log(`📝 Pattern: ${pattern}`);
    console.log(`📚 Documents: ${documents.length}`);
    console.log(`📏 Total Characters: ${content.length}`);
    if (documents.length > 0) {
      const avgChars = Math.round(content.length / documents.length);
      console.log(`📈 Average per Document: ${avgChars} chars`);
    }
  }

  private async findDocuments(language: string, characterLimit?: number, category?: string): Promise<CleanDocument[]> {
    const dataDir = path.resolve(this.config.paths?.llmContentDir || './data');
    const languageDir = path.join(dataDir, language);
    
    if (!await this.exists(languageDir)) {
      return [];
    }

    const documents: CleanDocument[] = [];
    const folders = await fs.readdir(languageDir);

    for (const folder of folders) {
      const folderPath = path.join(languageDir, folder);
      const stats = await fs.stat(folderPath);
      
      if (!stats.isDirectory()) continue;

      // Extract category from folder name (e.g., "guide--action-handlers" -> "guide")
      const docCategory = folder.split('--')[0];
      if (category && docCategory !== category) continue;

      // Find template files
      const files = await fs.readdir(folderPath);
      
      for (const file of files) {
        if (!file.endsWith('.md') || file === 'priority.json') continue;
        
        // Extract character limit from filename
        const charMatch = file.match(/-(\d+)\.md$/);
        if (!charMatch) continue;
        
        const fileCharLimit = parseInt(charMatch[1]);
        if (characterLimit && fileCharLimit !== characterLimit) continue;

        const filePath = path.join(folderPath, file);
        const document = await this.parseDocument(filePath, docCategory, fileCharLimit);
        
        if (document) {
          documents.push(document);
        }
      }
    }

    // Sort by priority (highest first), then by title
    return documents.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.title.localeCompare(b.title);
    });
  }

  private async parseDocument(filePath: string, category: string, characterLimit: number): Promise<CleanDocument | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      const frontmatter = parsed.data;

      // Extract clean content from template
      const cleanContent = this.extractCleanContent(parsed.content);
      if (!cleanContent) return null;

      // Extract title
      const title = this.extractTitle(parsed.content) || frontmatter.document_id || 'Untitled';
      
      // Get priority
      const priority = frontmatter.priority_score || this.config.categories?.[category]?.priority || 50;

      // Extract document ID from file path
      const fileName = path.basename(filePath, '.md');
      const documentId = fileName.replace(/-\d+$/, ''); // Remove character limit suffix

      // Get language from file path structure
      const pathParts = filePath.split(path.sep);
      const languageIndex = pathParts.findIndex(part => ['en', 'ko'].includes(part));
      const language = languageIndex >= 0 ? pathParts[languageIndex] : 'en';

      return {
        title: title.replace(/\s*\(\d+자\)/, ''), // Remove character limit from title
        content: cleanContent,
        priority,
        characterLimit,
        category,
        documentId,
        language,
        filePath,
        metadata: {
          completion_status: frontmatter.completion_status || frontmatter.update_status || 'template_based',
          workflow_stage: frontmatter.workflow_stage || 'template_content',
          quality_score: frontmatter.quality_score,
          content_length: cleanContent.length
        }
      };
    } catch {
      return null;
    }
  }

  private extractCleanContent(content: string): string {
    // STANDARD FORMAT: Direct content after frontmatter (preferred for all languages)
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
    
    // LEGACY FORMAT: Try to extract from "템플릿 내용" section with markdown code block (Korean templates)
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
    return titleMatch ? titleMatch[1] : null;
  }

  private isCompleted(document: CleanDocument): boolean {
    // Check if content is not placeholder text
    const content = document.content.toLowerCase();
    
    // Common placeholder patterns
    const placeholderPatterns = [
      '여기에',
      '작성하세요',
      'provide comprehensive guidance',
      'todo',
      'placeholder'
    ];

    // Must have substantial content (more than 30 characters)
    if (content.length < 30) return false;

    // Must not contain placeholder patterns
    for (const pattern of placeholderPatterns) {
      if (content.includes(pattern.toLowerCase())) return false;
    }

    return true;
  }

  private generateCleanContent(documents: CleanDocument[], pattern: string): string {
    let content = '';

    switch (pattern) {
      case 'minimal':
        // Minimal format: All available documents with standard link format
        content = this.generateMinimumLinkContent(documents);
        break;
        
      case 'raw':
        // Pure content only, no metadata
        content = documents.map(doc => doc.content).join('\n\n');
        break;
        
      case 'origin':
        // Origin format: Full content with document separators, no frontmatter
        content = documents.map((doc) => {
          let result = `===================[ DOC: ${this.getRelativeSourcePath(doc)} ]===================\n`;
          result += `# ${doc.title}\n\n${doc.content}`;
          return result;
        }).join('\n\n');
        break;
        
      default: // 'clean'
        // Clean format without frontmatter - pure content only
        content = documents.map((doc) => {
          let result = `===================[ DOC: ${this.getRelativeSourcePath(doc)} ]===================\n`;
          result += `# ${doc.title}\n\n${doc.content}`;
          return result;
        }).join('\n\n');
    }

    return content;
  }

  /**
   * Execute multiple generation patterns at once
   */
  private async executeMultipleGeneration(options: SimpleLLMSOptions): Promise<void> {
    const {
      category,
      language = this.config.generation?.defaultLanguage || 'ko',
      outputDir,
      dryRun = false,
      verbose = false
    } = options;

    if (verbose) {
      console.log('🚀 Generating multiple LLMS files (origin, minimum, default chars)...');
      if (dryRun) console.log('🔍 DRY RUN - No files will be created');
    }

    const generationTasks = [
      // Origin pattern (no character limit, full content)
      {
        pattern: 'origin' as const,
        characterLimit: undefined,
        description: 'Origin (full content)'
      },
      // Minimum pattern (link navigation only)
      {
        pattern: 'minimal' as const,
        characterLimit: undefined,
        description: 'Minimum (link navigation)'
      },
      // Default character limit (from config or 500)
      {
        pattern: 'clean' as const,
        characterLimit: this.getDefaultCharacterLimit(),
        description: `Default (${this.getDefaultCharacterLimit()} chars)`
      }
    ];

    const results: Array<{ task: typeof generationTasks[0]; success: boolean; outputPath?: string; error?: string }> = [];

    for (const task of generationTasks) {
      try {
        const result = await this.executeSingleGeneration({
          ...options,
          pattern: task.pattern,
          characterLimit: task.characterLimit,
          language,
          outputDir,
          dryRun,
          verbose: false // Suppress individual verbose output
        });
        
        results.push({
          task,
          success: true,
          outputPath: result.outputPath
        });
        
        if (verbose) {
          console.log(`✅ ${task.description}: ${result.filename}`);
        }
      } catch (error) {
        results.push({
          task,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        if (verbose) {
          console.log(`❌ ${task.description}: Failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n📊 Generation Summary:');
    console.log(`✅ Successful: ${successful}`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}`);
    }
    console.log(`📁 Language: ${language}`);
    if (category) console.log(`📂 Category: ${category}`);
    
    if (successful > 0) {
      console.log('\n📄 Generated Files:');
      results.filter(r => r.success).forEach(r => {
        console.log(`   ${r.task.description}: ${path.basename(r.outputPath || '')}`);
      });
    }

    if (failed > 0) {
      console.log('\n❌ Failed Generations:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   ${r.task.description}: ${r.error}`);
      });
    }
  }

  /**
   * Execute single generation and return result info
   */
  private async executeSingleGeneration(options: SimpleLLMSOptions): Promise<{ outputPath: string; filename: string }> {
    const {
      characterLimit,
      category,
      language = this.config.generation?.defaultLanguage || 'ko',
      pattern = 'clean',
      outputDir = this.config.paths?.outputDir || './docs/llms',
      dryRun = false
    } = options;

    // Find and parse documents
    const documents = await this.findDocuments(language, characterLimit, category);
    
    if (documents.length === 0) {
      throw new Error(`No completed documents found for ${language}${characterLimit ? ` with ${characterLimit} chars` : ''}${category ? ` in category ${category}` : ''}`);
    }

    // Generate content
    const content = this.generateCleanContent(documents, pattern);
    
    // Use path manager for consistent output path generation
    const { outputPath, filename } = this.pathManager.generateOutputPath({
      language,
      characterLimit,
      category,
      pattern,
      outputDir
    });

    if (!dryRun) {
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Write file
      await fs.writeFile(outputPath, content, 'utf-8');
    }

    return { outputPath, filename };
  }

  /**
   * Get default character limit from config or fallback
   */
  private getDefaultCharacterLimit(): number {
    const limits = this.config.generation?.characterLimits;
    if (limits && limits.length > 0) {
      // Use the middle value as default, or 500 if array is small
      const middle = Math.floor(limits.length / 2);
      return limits[middle] || 500;
    }
    return 500;
  }

  private getRelativeSourcePath(doc: CleanDocument): string {
    return this.pathManager.getRelativeSourcePath(doc.documentId, doc.language, doc.characterLimit, doc.filePath);
  }

  private generateMinimumLinkContent(documents: CleanDocument[]): string {
    let content = '';
    
    // Remove duplicates by documentId first
    const uniqueDocuments = documents.reduce((acc: CleanDocument[], doc) => {
      const exists = acc.find(existing => existing.documentId === doc.documentId);
      if (!exists) {
        acc.push(doc);
      }
      return acc;
    }, []);
    
    // Minimal format: Show ALL available documents with standard format
    // Sort by category first, then by priority and title for consistency
    const sortedDocs = uniqueDocuments.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.title.localeCompare(b.title);
    });
    
    // Generate content with standard link format for all documents
    sortedDocs.forEach((doc, index) => {
      const sourcePath = this.getRelativeSourcePath(doc);
      const readableTitle = this.formatReadableTitle(doc.title);
      content += `${index + 1}. **[${readableTitle}](${sourcePath})** (${doc.category}) - Priority: ${doc.priority}\n`;
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

  private generateFilename(language: string, characterLimit?: number, category?: string, pattern?: string): string {
    // Delegate to path manager for consistent filename generation
    return this.pathManager.generateOutputPath({
      language,
      characterLimit,
      category,
      pattern
    }).filename;
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}