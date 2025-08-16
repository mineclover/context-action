/**
 * YAML to TXT Converter
 * Converts YAML template files to TXT format for config-based automatic generation
 */

import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import type { EnhancedLLMSConfig } from '../types/config';

export interface YamlTemplate {
  document: {
    path: string;
    title: string;
    id: string;
    category: string;
  };
  priority: {
    score: number;
    tier: string;
  };
  summary: {
    character_limit: number;
    focus: string;
    strategy: string;
    language: string;
  };
  content: string;
  work_status: {
    created: string;
    modified: string;
    edited: boolean;
    needs_update: boolean;
  };
}

export interface TxtTemplate {
  document_path: string;
  title: string;
  document_id: string;
  category: string;
  priority_score: number;
  priority_tier: string;
  character_limit: number;
  focus: string;
  strategy: string;
  language: string;
  content: string;
  created_date: string;
  modified_date: string;
  is_edited: boolean;
  needs_update: boolean;
}

export class YamlToTxtConverter {
  constructor(private config: EnhancedLLMSConfig) {}

  /**
   * Convert YAML template to TXT format
   */
  async convertYamlToTxt(yamlFilePath: string, outputDir?: string): Promise<string> {
    try {
      const yamlContent = await fs.readFile(yamlFilePath, 'utf-8');
      const yamlData: YamlTemplate = YAML.parse(yamlContent);
      
      const txtContent = this.formatAsTxt(yamlData);
      
      // Generate output path
      const outputPath = outputDir 
        ? path.join(outputDir, this.generateTxtFilename(yamlData))
        : yamlFilePath.replace('.yaml', '.txt').replace('.yml', '.txt');
      
      await fs.writeFile(outputPath, txtContent, 'utf-8');
      
      console.log(`✅ Converted: ${path.basename(yamlFilePath)} → ${path.basename(outputPath)}`);
      return outputPath;
      
    } catch (error) {
      console.error(`❌ Failed to convert ${yamlFilePath}:`, error);
      throw error;
    }
  }

  /**
   * Batch convert all YAML files in a directory to TXT
   */
  async convertDirectoryYamlToTxt(sourceDir: string, outputDir: string): Promise<string[]> {
    const convertedFiles: string[] = [];
    
    try {
      await fs.mkdir(outputDir, { recursive: true });
      
      const files = await this.findYamlFiles(sourceDir);
      
      for (const yamlFile of files) {
        try {
          const txtFile = await this.convertYamlToTxt(yamlFile, outputDir);
          convertedFiles.push(txtFile);
        } catch (error) {
          console.warn(`⚠️  Skipped ${yamlFile} due to error:`, error);
        }
      }
      
      console.log(`📊 Converted ${convertedFiles.length}/${files.length} files`);
      return convertedFiles;
      
    } catch (error) {
      console.error(`❌ Directory conversion failed:`, error);
      throw error;
    }
  }

  /**
   * Convert all character limit variants for a document
   */
  async convertAllCharacterLimits(
    documentId: string, 
    language: string,
    sourceDir: string,
    outputDir: string
  ): Promise<string[]> {
    const characterLimits = this.config.generation?.defaultCharacterLimits || [100, 300, 1000];
    const convertedFiles: string[] = [];
    
    for (const charLimit of characterLimits) {
      const yamlFile = path.join(sourceDir, language, documentId, `${documentId}-${charLimit}.yaml`);
      
      try {
        if (await this.fileExists(yamlFile)) {
          const txtFile = await this.convertYamlToTxt(yamlFile, outputDir);
          convertedFiles.push(txtFile);
        } else {
          console.warn(`⚠️  YAML file not found: ${yamlFile}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to convert ${yamlFile}:`, error);
      }
    }
    
    return convertedFiles;
  }

  /**
   * Format YAML data as TXT content
   */
  private formatAsTxt(yamlData: YamlTemplate): string {
    const lines: string[] = [];
    
    // Document metadata
    lines.push('# Document Information');
    lines.push(`Document Path: ${yamlData.document.path}`);
    lines.push(`Title: ${yamlData.document.title}`);
    lines.push(`Document ID: ${yamlData.document.id}`);
    lines.push(`Category: ${yamlData.document.category}`);
    lines.push('');
    
    // Priority information
    lines.push('# Priority');
    lines.push(`Score: ${yamlData.priority.score}`);
    lines.push(`Tier: ${yamlData.priority.tier}`);
    lines.push('');
    
    // Summary configuration
    lines.push('# Summary Configuration');
    lines.push(`Character Limit: ${yamlData.summary.character_limit}`);
    lines.push(`Focus: ${yamlData.summary.focus}`);
    lines.push(`Strategy: ${yamlData.summary.strategy}`);
    lines.push(`Language: ${yamlData.summary.language}`);
    lines.push('');
    
    // Content
    lines.push('# Content');
    lines.push(yamlData.content.trim());
    lines.push('');
    
    // Work status
    lines.push('# Work Status');
    lines.push(`Created: ${yamlData.work_status.created}`);
    lines.push(`Modified: ${yamlData.work_status.modified}`);
    lines.push(`Edited: ${yamlData.work_status.edited ? 'Yes' : 'No'}`);
    lines.push(`Needs Update: ${yamlData.work_status.needs_update ? 'Yes' : 'No'}`);
    
    return lines.join('\n');
  }

  /**
   * Generate TXT filename from YAML data
   */
  private generateTxtFilename(yamlData: YamlTemplate): string {
    const { id } = yamlData.document;
    const { character_limit } = yamlData.summary;
    return `${id}-${character_limit}.txt`;
  }

  /**
   * Find all YAML files in directory recursively
   */
  private async findYamlFiles(dir: string): Promise<string[]> {
    const yamlFiles: string[] = [];
    
    const scan = async (currentDir: string) => {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
            yamlFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Cannot read directory ${currentDir}:`, error);
      }
    };
    
    await scan(dir);
    return yamlFiles;
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create TXT template from scratch
   */
  async createTxtTemplate(
    documentId: string,
    title: string,
    category: string,
    characterLimit: number,
    language: string,
    outputPath: string
  ): Promise<void> {
    const templateData: TxtTemplate = {
      document_path: `${language}/${category}/${documentId}.md`,
      title,
      document_id: documentId,
      category,
      priority_score: 80,
      priority_tier: 'useful',
      character_limit: characterLimit,
      focus: '기본 개념',
      strategy: 'concept-first',
      language,
      content: `${title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.`,
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      is_edited: false,
      needs_update: true
    };

    const txtContent = this.formatTxtTemplate(templateData);
    await fs.writeFile(outputPath, txtContent, 'utf-8');
    
    console.log(`✅ Created TXT template: ${outputPath}`);
  }

  /**
   * Format TXT template from structured data
   */
  private formatTxtTemplate(data: TxtTemplate): string {
    const lines: string[] = [];
    
    lines.push('# Document Information');
    lines.push(`Document Path: ${data.document_path}`);
    lines.push(`Title: ${data.title}`);
    lines.push(`Document ID: ${data.document_id}`);
    lines.push(`Category: ${data.category}`);
    lines.push('');
    
    lines.push('# Priority');
    lines.push(`Score: ${data.priority_score}`);
    lines.push(`Tier: ${data.priority_tier}`);
    lines.push('');
    
    lines.push('# Summary Configuration');
    lines.push(`Character Limit: ${data.character_limit}`);
    lines.push(`Focus: ${data.focus}`);
    lines.push(`Strategy: ${data.strategy}`);
    lines.push(`Language: ${data.language}`);
    lines.push('');
    
    lines.push('# Content');
    lines.push(data.content);
    lines.push('');
    
    lines.push('# Work Status');
    lines.push(`Created: ${data.created_date}`);
    lines.push(`Modified: ${data.modified_date}`);
    lines.push(`Edited: ${data.is_edited ? 'Yes' : 'No'}`);
    lines.push(`Needs Update: ${data.needs_update ? 'Yes' : 'No'}`);
    
    return lines.join('\n');
  }

  /**
   * Parse TXT template back to structured data
   */
  async parseTxtTemplate(txtFilePath: string): Promise<TxtTemplate | null> {
    try {
      const content = await fs.readFile(txtFilePath, 'utf-8');
      const lines = content.split('\n');
      
      const data: Partial<TxtTemplate> = {};
      let currentSection = '';
      let contentLines: string[] = [];
      let inContentSection = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('# ')) {
          currentSection = trimmed.substring(2);
          inContentSection = currentSection === 'Content';
          continue;
        }
        
        if (inContentSection && currentSection === 'Content') {
          if (!trimmed.startsWith('#') && trimmed) {
            contentLines.push(line);
          }
        } else if (trimmed.includes(': ')) {
          const [key, value] = trimmed.split(': ', 2);
          
          switch (key) {
            case 'Document Path':
              data.document_path = value;
              break;
            case 'Title':
              data.title = value;
              break;
            case 'Document ID':
              data.document_id = value;
              break;
            case 'Category':
              data.category = value;
              break;
            case 'Score':
              data.priority_score = parseInt(value);
              break;
            case 'Tier':
              data.priority_tier = value;
              break;
            case 'Character Limit':
              data.character_limit = parseInt(value);
              break;
            case 'Focus':
              data.focus = value;
              break;
            case 'Strategy':
              data.strategy = value;
              break;
            case 'Language':
              data.language = value;
              break;
            case 'Created':
              data.created_date = value;
              break;
            case 'Modified':
              data.modified_date = value;
              break;
            case 'Edited':
              data.is_edited = value.toLowerCase() === 'yes';
              break;
            case 'Needs Update':
              data.needs_update = value.toLowerCase() === 'yes';
              break;
          }
        }
      }
      
      data.content = contentLines.join('\n').trim();
      
      return data as TxtTemplate;
      
    } catch (error) {
      console.error(`❌ Failed to parse TXT template ${txtFilePath}:`, error);
      return null;
    }
  }
}