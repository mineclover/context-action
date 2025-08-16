/**
 * Config-Based Automatic Generation System
 * Generates TXT templates and processes them with priority updates
 */

import fs from 'fs/promises';
import path from 'path';
import type { EnhancedLLMSConfig } from '../types/config';
import { YamlToTxtConverter } from './YamlToTxtConverter';

export interface GenerationConfig {
  languages: string[];
  characterLimits: number[];
  categories: string[];
  outputDirectory: string;
  templateDirectory: string;
  batchSize: number;
  priorityUpdateMode: 'preserve' | 'recalculate' | 'update-only';
}

export interface DocumentTemplate {
  documentId: string;
  title: string;
  category: string;
  sourcePath: string;
  priority: {
    score: number;
    tier: string;
  };
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

export class ConfigBasedGenerator {
  private converter: YamlToTxtConverter;

  constructor(private config: EnhancedLLMSConfig) {
    this.converter = new YamlToTxtConverter(config);
  }

  /**
   * Generate all TXT templates based on configuration
   */
  async generateAllTemplates(generationConfig: GenerationConfig): Promise<GenerationResult> {
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

    console.log('🚀 Starting config-based automatic generation...');
    console.log(`📊 Config: ${generationConfig.languages.length} languages, ${generationConfig.characterLimits.length} character limits`);

    try {
      // Ensure output directory exists
      await fs.mkdir(generationConfig.outputDirectory, { recursive: true });

      // Discover documents
      const documents = await this.discoverDocuments(generationConfig);
      console.log(`📄 Found ${documents.length} documents to process`);

      // Generate templates for each combination
      for (const lang of generationConfig.languages) {
        for (const doc of documents) {
          for (const charLimit of generationConfig.characterLimits) {
            try {
              const outputPath = await this.generateSingleTemplate(
                doc,
                lang,
                charLimit,
                generationConfig
              );
              
              result.generatedFiles.push(outputPath);
              result.totalGenerated++;
              
              // Log progress every 10 files
              if (result.totalGenerated % 10 === 0) {
                console.log(`📈 Generated ${result.totalGenerated} files...`);
              }
              
            } catch (error) {
              const errorMsg = `Failed to generate ${doc.documentId}-${charLimit}.txt: ${error}`;
              result.errors.push(errorMsg);
              result.totalErrors++;
              console.warn(`⚠️  ${errorMsg}`);
            }
          }
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
   * Update priorities in existing TXT templates
   */
  async updatePriorities(
    templatesDirectory: string,
    priorityUpdates: Record<string, { score: number; tier: string }>
  ): Promise<void> {
    console.log('🔄 Updating priorities in TXT templates...');

    const txtFiles = await this.findTxtFiles(templatesDirectory);
    let updatedCount = 0;

    for (const txtFile of txtFiles) {
      try {
        const template = await this.converter.parseTxtTemplate(txtFile);
        if (!template) continue;

        const updateKey = template.document_id;
        if (priorityUpdates[updateKey]) {
          const update = priorityUpdates[updateKey];
          
          // Update priority values
          template.priority_score = update.score;
          template.priority_tier = update.tier;
          template.modified_date = new Date().toISOString();
          template.needs_update = false;

          // Rewrite the file with updated priority
          await this.writeTxtTemplate(txtFile, template);
          updatedCount++;
          
          console.log(`✅ Updated priority for ${updateKey}: score=${update.score}, tier=${update.tier}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to update ${txtFile}:`, error);
      }
    }

    console.log(`📊 Updated priorities in ${updatedCount} files`);
  }

  /**
   * Batch process TXT templates with priority-based selection
   */
  async batchProcessTemplates(
    templatesDirectory: string,
    outputDirectory: string,
    minPriorityScore: number = 70
  ): Promise<string[]> {
    console.log(`🔥 Batch processing templates with priority ≥ ${minPriorityScore}...`);

    const txtFiles = await this.findTxtFiles(templatesDirectory);
    const processedFiles: string[] = [];

    await fs.mkdir(outputDirectory, { recursive: true });

    for (const txtFile of txtFiles) {
      try {
        const template = await this.converter.parseTxtTemplate(txtFile);
        if (!template) continue;

        // Check priority threshold
        if (template.priority_score >= minPriorityScore) {
          const outputPath = path.join(
            outputDirectory,
            `${template.document_id}-${template.character_limit}-processed.txt`
          );

          // Process and save (in real implementation, this would apply LLM processing)
          template.content = `[PROCESSED] ${template.content}`;
          template.modified_date = new Date().toISOString();
          template.needs_update = false;

          await this.writeTxtTemplate(outputPath, template);
          processedFiles.push(outputPath);

          console.log(`✅ Processed ${template.document_id} (priority: ${template.priority_score})`);
        } else {
          console.log(`⏭️  Skipped ${template?.document_id} (priority: ${template?.priority_score} < ${minPriorityScore})`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process ${txtFile}:`, error);
      }
    }

    console.log(`📊 Processed ${processedFiles.length} files based on priority`);
    return processedFiles;
  }

  /**
   * Discover documents from source directories
   */
  private async discoverDocuments(config: GenerationConfig): Promise<DocumentTemplate[]> {
    const documents: DocumentTemplate[] = [];

    // In a real implementation, this would scan the docs directory
    // For demo purposes, create some sample documents
    const sampleDocs = [
      {
        documentId: 'guide-action-handlers',
        title: '액션 핸들러',
        category: 'guide',
        sourcePath: 'ko/guide/action-handlers.md',
        priority: { score: 90, tier: 'essential' }
      },
      {
        documentId: 'guide-store-integration',
        title: '스토어 통합',
        category: 'guide',
        sourcePath: 'ko/guide/store-integration.md',
        priority: { score: 85, tier: 'important' }
      },
      {
        documentId: 'api-action-context',
        title: '액션 컨텍스트 API',
        category: 'api',
        sourcePath: 'ko/api/action-context.md',
        priority: { score: 80, tier: 'useful' }
      }
    ];

    return sampleDocs;
  }

  /**
   * Generate single TXT template
   */
  private async generateSingleTemplate(
    doc: DocumentTemplate,
    language: string,
    characterLimit: number,
    config: GenerationConfig
  ): Promise<string> {
    const outputPath = path.join(
      config.outputDirectory,
      language,
      doc.category,
      `${doc.documentId}-${characterLimit}.txt`
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Check if file already exists
    try {
      await fs.access(outputPath);
      return outputPath; // File exists, skip
    } catch {
      // File doesn't exist, create it
    }

    await this.converter.createTxtTemplate(
      doc.documentId,
      doc.title,
      doc.category,
      characterLimit,
      language,
      outputPath
    );

    return outputPath;
  }

  /**
   * Find all TXT files recursively
   */
  private async findTxtFiles(directory: string): Promise<string[]> {
    const txtFiles: string[] = [];

    const scan = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.txt')) {
            txtFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Cannot scan directory ${dir}:`, error);
      }
    };

    await scan(directory);
    return txtFiles;
  }

  /**
   * Write TXT template from structured data
   */
  private async writeTxtTemplate(filePath: string, template: any): Promise<void> {
    const lines: string[] = [];

    lines.push('# Document Information');
    lines.push(`Document Path: ${template.document_path}`);
    lines.push(`Title: ${template.title}`);
    lines.push(`Document ID: ${template.document_id}`);
    lines.push(`Category: ${template.category}`);
    lines.push('');

    lines.push('# Priority');
    lines.push(`Score: ${template.priority_score}`);
    lines.push(`Tier: ${template.priority_tier}`);
    lines.push('');

    lines.push('# Summary Configuration');
    lines.push(`Character Limit: ${template.character_limit}`);
    lines.push(`Focus: ${template.focus}`);
    lines.push(`Strategy: ${template.strategy}`);
    lines.push(`Language: ${template.language}`);
    lines.push('');

    lines.push('# Content');
    lines.push(template.content);
    lines.push('');

    lines.push('# Work Status');
    lines.push(`Created: ${template.created_date}`);
    lines.push(`Modified: ${template.modified_date}`);
    lines.push(`Edited: ${template.is_edited ? 'Yes' : 'No'}`);
    lines.push(`Needs Update: ${template.needs_update ? 'Yes' : 'No'}`);

    await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
  }
}