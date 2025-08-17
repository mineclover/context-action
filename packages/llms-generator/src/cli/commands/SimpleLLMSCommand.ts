/**
 * Simple LLMS Generation Command
 * 
 * Generates clean, minimal LLMS-TXT files focused on content without metadata overhead.
 * Designed for actual LLM training/inference use cases.
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { EnhancedLLMSConfig } from '../../types/config.js';

export interface SimpleLLMSOptions {
  characterLimit?: number;
  category?: string;
  language?: string;
  pattern?: 'clean' | 'minimal' | 'raw';
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
}

export class SimpleLLMSCommand {
  constructor(private config: EnhancedLLMSConfig) {}

  async execute(options: SimpleLLMSOptions): Promise<void> {
    const {
      characterLimit,
      category,
      language = this.config.generation?.defaultLanguage || 'ko',
      pattern = 'clean',
      outputDir = this.config.paths?.outputDir || './docs/llms',
      dryRun = false,
      verbose = false
    } = options;

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
    
    // Generate filename
    const filename = this.generateFilename(language, characterLimit, category, pattern);
    const outputPath = path.join(outputDir, filename);

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
        
        if (document && this.isCompleted(document)) {
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

      return {
        title: title.replace(/\s*\(\d+자\)/, ''), // Remove character limit from title
        content: cleanContent,
        priority,
        characterLimit,
        category
      };
    } catch (error) {
      return null;
    }
  }

  private extractCleanContent(content: string): string {
    // Extract content from "템플릿 내용" section
    const contentMatch = content.match(/## 템플릿 내용[^]*?```markdown\s*([\s\S]*?)\s*```/);
    if (contentMatch && contentMatch[1]) {
      const extracted = contentMatch[1].trim();
      // Remove comments and clean up
      return extracted
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/^\s*#\s*.*$/gm, '') // Remove markdown headers from content
        .trim();
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
        // Just titles and content, no extra formatting
        content = documents.map(doc => `${doc.title}\n\n${doc.content}`).join('\n\n---\n\n');
        break;
        
      case 'raw':
        // Pure content only, no titles
        content = documents.map(doc => doc.content).join('\n\n');
        break;
        
      default: // 'clean'
        // Clean format with minimal structure
        content = documents.map((doc, index) => {
          return `${index + 1}. ${doc.title}\n\n${doc.content}`;
        }).join('\n\n---\n\n');
    }

    return content;
  }

  private generateFilename(language: string, characterLimit?: number, category?: string, pattern?: string): string {
    let filename = `llms-${language}`;
    
    if (characterLimit) filename += `-${characterLimit}chars`;
    if (category) filename += `-${category}`;
    if (pattern && pattern !== 'clean') filename += `-${pattern}`;
    
    filename += '.txt';
    return filename;
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