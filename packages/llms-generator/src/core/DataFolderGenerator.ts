/**
 * Data Folder Structure Generator
 * Generates files based on existing priority.json structure in data folders
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export interface PriorityDocument {
  document: {
    id: string;
    title: string;
    source_path: string;
    category: string;
  };
  priority: {
    score: number;
    tier: string;
  };
  extraction?: {
    strategy?: string;
    character_limits?: Record<string, any>;
  };
  work_status?: {
    generated_files?: Record<string, any>;
  };
}

export interface GenerationConfig {
  dataDirectory: string;
  languages: string[];
  characterLimits: number[];
  format: 'txt' | 'md';
}

export interface GenerationResult {
  success: boolean;
  totalGenerated: number;
  totalSkipped: number;
  totalErrors: number;
  generatedFiles: string[];
  errors: string[];
  processingTimeMs: number;
}

export class DataFolderGenerator {
  constructor() {}

  /**
   * Scan all priority.json files and generate templates
   */
  async generateFromPriorityFiles(config: GenerationConfig): Promise<GenerationResult> {
    const startTime = Date.now();
    const result: GenerationResult = {
      success: false,
      totalGenerated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      generatedFiles: [],
      errors: [],
      processingTimeMs: 0
    };

    console.log('🚀 Starting Data Folder Generation...');
    console.log(`📊 Config: ${config.languages.length} languages, ${config.characterLimits.length} character limits`);

    try {
      // Find all priority.json files
      const priorityFiles = await this.findPriorityFiles(config.dataDirectory, config.languages);
      console.log(`📄 Found ${priorityFiles.length} priority.json files`);

      // Process each priority file
      for (const priorityFile of priorityFiles) {
        try {
          const folderPath = path.dirname(priorityFile);
          const priorityData = await this.readPriorityFile(priorityFile);
          
          if (!priorityData) {
            console.warn(`⚠️  Skipping invalid priority file: ${priorityFile}`);
            continue;
          }

          // Generate files for each character limit
          for (const charLimit of config.characterLimits) {
            const outputPath = await this.generateSingleFile(
              folderPath,
              priorityData,
              charLimit,
              config.format
            );
            
            if (outputPath) {
              result.generatedFiles.push(outputPath);
              result.totalGenerated++;
              console.log(`   ✅ Generated: ${path.relative(config.dataDirectory, outputPath)}`);
            } else {
              result.totalSkipped++;
            }
          }
        } catch (error) {
          const errorMsg = `Failed to process ${priorityFile}: ${error}`;
          result.errors.push(errorMsg);
          result.totalErrors++;
          console.warn(`⚠️  ${errorMsg}`);
        }
      }

      result.success = result.totalErrors === 0 || result.totalGenerated > 0;
      result.processingTimeMs = Date.now() - startTime;

      console.log(`✅ Generation completed in ${result.processingTimeMs}ms`);
      console.log(`📊 Results: ${result.totalGenerated} generated, ${result.totalSkipped} skipped, ${result.totalErrors} errors`);

      return result;

    } catch (error) {
      result.errors.push(`Generation failed: ${error}`);
      result.processingTimeMs = Date.now() - startTime;
      console.error('❌ Generation failed:', error);
      return result;
    }
  }

  /**
   * Generate single file based on priority data
   */
  private async generateSingleFile(
    folderPath: string,
    priorityData: PriorityDocument,
    characterLimit: number,
    format: 'txt' | 'md'
  ): Promise<string | null> {
    const documentId = priorityData.document.id;
    const fileName = `${documentId}-${characterLimit}.${format}`;
    const outputPath = path.join(folderPath, fileName);

    // Check if file already exists
    try {
      await fs.access(outputPath);
      // File exists, check if it needs update
      const workStatus = priorityData.work_status?.generated_files?.[characterLimit];
      if (workStatus && !workStatus.needs_update) {
        return null; // Skip if doesn't need update
      }
    } catch {
      // File doesn't exist, will create it
    }

    // Determine language from folder path
    const language = folderPath.includes('/ko/') ? 'ko' : 'en';
    
    // Generate content based on format
    let content: string;
    if (format === 'md') {
      content = this.generateMarkdownContent(priorityData, language, characterLimit);
    } else {
      content = this.generateTxtContent(priorityData, language, characterLimit);
    }

    await fs.writeFile(outputPath, content, 'utf-8');
    
    // Update priority.json with work status
    await this.updateWorkStatus(folderPath, characterLimit, outputPath);
    
    return outputPath;
  }

  /**
   * Generate Markdown content with frontmatter
   */
  private generateMarkdownContent(
    priorityData: PriorityDocument,
    language: string,
    characterLimit: number
  ): string {
    const lines: string[] = [];
    
    // Frontmatter
    lines.push('---');
    lines.push('document:');
    lines.push(`  path: "${language}/${priorityData.document.source_path}"`);
    lines.push(`  title: "${priorityData.document.title}"`);
    lines.push(`  id: "${priorityData.document.id}"`);
    lines.push(`  category: "${priorityData.document.category}"`);
    lines.push('priority:');
    lines.push(`  score: ${priorityData.priority.score}`);
    lines.push(`  tier: "${priorityData.priority.tier}"`);
    lines.push('summary:');
    lines.push(`  character_limit: ${characterLimit}`);
    
    // Get focus from extraction config
    const limitConfig = priorityData.extraction?.character_limits?.[characterLimit];
    const focus = limitConfig?.focus || (language === 'ko' ? '기본 개념' : 'Core Concepts');
    
    lines.push(`  focus: "${focus}"`);
    lines.push(`  strategy: "${priorityData.extraction?.strategy || 'general'}"`);
    lines.push(`  language: "${language}"`);
    lines.push('work_status:');
    lines.push(`  created: "${new Date().toISOString()}"`);
    lines.push(`  modified: "${new Date().toISOString()}"`);
    lines.push(`  edited: false`);
    lines.push(`  needs_update: true`);
    lines.push('---');
    lines.push('');
    
    // Content
    lines.push(`# ${priorityData.document.title}`);
    lines.push('');
    
    const contentTemplate = language === 'ko' 
      ? `${priorityData.document.title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.`
      : `This is a ${characterLimit}-character summary about ${priorityData.document.title}. This content is an automatically generated template.`;
    
    lines.push(contentTemplate);
    lines.push('');
    
    return lines.join('\n');
  }

  /**
   * Generate TXT content
   */
  private generateTxtContent(
    priorityData: PriorityDocument,
    language: string,
    characterLimit: number
  ): string {
    const lines: string[] = [];
    
    lines.push('# Document Information');
    lines.push(`Document Path: ${language}/${priorityData.document.source_path}`);
    lines.push(`Title: ${priorityData.document.title}`);
    lines.push(`Document ID: ${priorityData.document.id}`);
    lines.push(`Category: ${priorityData.document.category}`);
    lines.push('');
    
    lines.push('# Priority');
    lines.push(`Score: ${priorityData.priority.score}`);
    lines.push(`Tier: ${priorityData.priority.tier}`);
    lines.push('');
    
    lines.push('# Summary Configuration');
    lines.push(`Character Limit: ${characterLimit}`);
    
    const limitConfig = priorityData.extraction?.character_limits?.[characterLimit];
    const focus = limitConfig?.focus || (language === 'ko' ? '기본 개념' : 'Core Concepts');
    
    lines.push(`Focus: ${focus}`);
    lines.push(`Strategy: ${priorityData.extraction?.strategy || 'general'}`);
    lines.push(`Language: ${language}`);
    lines.push('');
    
    lines.push('# Content');
    const contentTemplate = language === 'ko' 
      ? `${priorityData.document.title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.`
      : `This is a ${characterLimit}-character summary about ${priorityData.document.title}. This content is an automatically generated template.`;
    
    lines.push(contentTemplate);
    lines.push('');
    
    lines.push('# Work Status');
    lines.push(`Created: ${new Date().toISOString()}`);
    lines.push(`Modified: ${new Date().toISOString()}`);
    lines.push(`Edited: No`);
    lines.push(`Needs Update: Yes`);
    
    return lines.join('\n');
  }

  /**
   * Find all priority.json files in data directory
   */
  private async findPriorityFiles(dataDirectory: string, languages: string[]): Promise<string[]> {
    const priorityFiles: string[] = [];
    
    for (const lang of languages) {
      const pattern = path.join(dataDirectory, lang, '**/priority.json');
      const files = await glob(pattern);
      priorityFiles.push(...files);
    }
    
    return priorityFiles;
  }

  /**
   * Read and parse priority.json file
   */
  private async readPriorityFile(filePath: string): Promise<PriorityDocument | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as PriorityDocument;
    } catch (error) {
      console.error(`Failed to read priority file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Update work_status in priority.json
   */
  private async updateWorkStatus(
    folderPath: string,
    characterLimit: number,
    generatedPath: string
  ): Promise<void> {
    const priorityPath = path.join(folderPath, 'priority.json');
    
    try {
      const content = await fs.readFile(priorityPath, 'utf-8');
      const priorityData = JSON.parse(content);
      
      // Initialize work_status if not exists
      if (!priorityData.work_status) {
        priorityData.work_status = {};
      }
      if (!priorityData.work_status.generated_files) {
        priorityData.work_status.generated_files = {};
      }
      
      // Update specific character limit entry
      priorityData.work_status.generated_files[characterLimit] = {
        path: generatedPath,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        edited: false,
        needs_update: false
      };
      
      priorityData.work_status.last_checked = new Date().toISOString();
      
      // Write back to file
      await fs.writeFile(
        priorityPath, 
        JSON.stringify(priorityData, null, 2), 
        'utf-8'
      );
    } catch (error) {
      console.warn(`Failed to update work status in ${priorityPath}:`, error);
    }
  }
}