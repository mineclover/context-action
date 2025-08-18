/**
 * Generate Templates Command
 * 
 * Batch generates template files for all documents based on priority.json and source documents
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { CLIConfig } from '../types/CLITypes.js';

export interface GenerateTemplatesOptions {
  language?: string;
  category?: string;
  characterLimits?: number[];
  overwrite?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

interface TemplateGenerationResult {
  documentId: string;
  templatesCreated: number;
  templatesSkipped: number;
  errors: string[];
}

export class GenerateTemplatesCommand {
  constructor(private config: CLIConfig) {}

  async execute(options: GenerateTemplatesOptions = {}): Promise<void> {
    const { 
      language = this.config.generation?.defaultLanguage || 'en',
      characterLimits = this.config.generation?.characterLimits || [100, 300, 500, 1000, 2000, 5000],
      overwrite = false,
      dryRun = false,
      verbose = false
    } = options;

    console.log('🚀 Generating template files for all documents...\n');
    console.log(`📋 Configuration:`);
    console.log(`   Language: ${language}`);
    console.log(`   Character Limits: ${characterLimits.join(', ')}`);
    console.log(`   Overwrite: ${overwrite}`);
    if (dryRun) {
      console.log(`   Mode: DRY RUN (no files will be created)`);
    }
    console.log();

    // Get all priority.json files
    const priorityFiles = await this.findPriorityFiles(language, options.category);
    
    if (priorityFiles.length === 0) {
      console.log('❌ No priority.json files found');
      return;
    }

    console.log(`📁 Found ${priorityFiles.length} documents to process\n`);

    const results: TemplateGenerationResult[] = [];
    
    for (const priorityFile of priorityFiles) {
      const result = await this.generateTemplatesForDocument(
        priorityFile,
        characterLimits,
        language,
        { overwrite, dryRun, verbose }
      );
      results.push(result);
      
      if (verbose) {
        this.displayDocumentResult(result);
      }
    }

    // Display summary
    this.displaySummary(results);
  }

  private async findPriorityFiles(language: string, category?: string): Promise<string[]> {
    const llmsDataDir = path.join(this.config.paths.llmContentDir, language);
    const priorityFiles: string[] = [];

    try {
      const entries = await fs.readdir(llmsDataDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const documentId = entry.name;
        
        // Apply category filter if specified
        if (category) {
          const docCategory = documentId.split('--')[0];
          if (docCategory !== category) continue;
        }
        
        const priorityPath = path.join(llmsDataDir, documentId, 'priority.json');
        
        try {
          await fs.access(priorityPath);
          priorityFiles.push(priorityPath);
        } catch {
          // No priority.json in this directory
        }
      }
    } catch (error) {
      console.error(`❌ Error reading directory ${llmsDataDir}: ${error}`);
    }

    return priorityFiles;
  }

  private async generateTemplatesForDocument(
    priorityPath: string,
    characterLimits: number[],
    language: string,
    options: { overwrite: boolean; dryRun: boolean; verbose: boolean }
  ): Promise<TemplateGenerationResult> {
    const documentDir = path.dirname(priorityPath);
    const documentId = path.basename(documentDir);
    
    const result: TemplateGenerationResult = {
      documentId,
      templatesCreated: 0,
      templatesSkipped: 0,
      errors: []
    };

    try {
      // Load priority.json
      const priorityContent = await fs.readFile(priorityPath, 'utf-8');
      const priorityData = JSON.parse(priorityContent);
      
      // Extract content from source document
      const sourceContent = await this.extractSourceContent(priorityData, language);
      
      // Generate template for each character limit
      for (const limit of characterLimits) {
        try {
          const templatePath = path.join(documentDir, `${documentId}-${limit}.md`);
          
          // Check if file exists
          if (!options.overwrite) {
            try {
              await fs.access(templatePath);
              result.templatesSkipped++;
              continue;
            } catch {
              // File doesn't exist, proceed with creation
            }
          }
          
          // Generate template content
          const templateContent = this.generateTemplateContent(
            priorityData,
            sourceContent,
            limit,
            documentId
          );
          
          // Write template file
          if (!options.dryRun) {
            await fs.writeFile(templatePath, templateContent, 'utf-8');
          }
          
          result.templatesCreated++;
          
        } catch (error) {
          result.errors.push(`Failed to create ${limit}-char template: ${error}`);
        }
      }
      
    } catch (error) {
      result.errors.push(`Failed to process document: ${error}`);
    }

    return result;
  }

  private async extractSourceContent(priorityData: any, language: string): Promise<string> {
    if (!priorityData.document?.source_path) {
      return '';
    }

    const sourcePath = path.join(this.config.paths.docsDir, priorityData.document.source_path);
    
    try {
      const content = await fs.readFile(sourcePath, 'utf-8');
      const parsed = matter(content);
      
      // Clean up content
      return parsed.content
        .replace(/^#+\s+/gm, '') // Remove headers
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        .replace(/[*_~`]/g, '') // Remove formatting
        .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
        .trim();
        
    } catch (error) {
      console.warn(`⚠️ Could not read source document: ${sourcePath}`);
      return '';
    }
  }

  private generateTemplateContent(
    priorityData: any,
    sourceContent: string,
    characterLimit: number,
    documentId: string
  ): string {
    // Generate summary based on character limit
    const summary = this.generateSummary(sourceContent, characterLimit, priorityData);
    
    // Create frontmatter
    const frontmatter = {
      document_id: documentId,
      category: priorityData.document?.category || documentId.split('--')[0],
      source_path: priorityData.document?.source_path || '',
      character_limit: characterLimit,
      last_update: new Date().toISOString(),
      update_status: 'auto_generated',
      priority_score: priorityData.priority?.score || 50,
      priority_tier: priorityData.priority?.tier || 'standard',
      completion_status: 'completed',
      workflow_stage: 'content_generated'
    };

    // Create the template content
    const content = summary || `${priorityData.document?.title || documentId} - ${characterLimit} character summary`;
    
    return matter.stringify(content, frontmatter);
  }

  private generateSummary(sourceContent: string, characterLimit: number, priorityData: any): string {
    if (!sourceContent) {
      // Fallback to priority data if no source content
      const title = priorityData.document?.title || '';
      const goal = priorityData.purpose?.primary_goal || '';
      
      // Clean up template text if present
      const cleanGoal = goal.replace('Provide comprehensive guidance on ', '');
      
      if (title && cleanGoal && !cleanGoal.includes('Auto-generated')) {
        return `${title}: ${cleanGoal}`.substring(0, characterLimit);
      }
      
      return '';
    }

    // Extract sentences
    const sentences = sourceContent.split(/[.!?]\s+/).filter(s => s.trim());
    let summary = '';
    
    // Build summary within character limit
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      const testSummary = summary ? `${summary}. ${trimmedSentence}` : trimmedSentence;
      
      if (testSummary.length <= characterLimit - 10) { // Leave margin for punctuation
        summary = testSummary;
      } else if (!summary) {
        // If first sentence is too long, truncate it
        summary = trimmedSentence.substring(0, characterLimit - 10) + '...';
        break;
      } else {
        break;
      }
    }
    
    // Ensure proper ending
    if (summary && !summary.match(/[.!?]$/)) {
      summary += '.';
    }
    
    return summary;
  }

  private displayDocumentResult(result: TemplateGenerationResult): void {
    console.log(`📄 ${result.documentId}:`);
    if (result.templatesCreated > 0) {
      console.log(`   ✅ Created: ${result.templatesCreated} templates`);
    }
    if (result.templatesSkipped > 0) {
      console.log(`   ⏭️  Skipped: ${result.templatesSkipped} (already exist)`);
    }
    if (result.errors.length > 0) {
      console.log(`   ❌ Errors: ${result.errors.length}`);
      result.errors.forEach(err => console.log(`      - ${err}`));
    }
    console.log();
  }

  private displaySummary(results: TemplateGenerationResult[]): void {
    const totalCreated = results.reduce((sum, r) => sum + r.templatesCreated, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.templatesSkipped, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const successfulDocs = results.filter(r => r.templatesCreated > 0).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📁 Documents Processed: ${results.length}`);
    console.log(`✅ Templates Created: ${totalCreated}`);
    console.log(`⏭️  Templates Skipped: ${totalSkipped}`);
    console.log(`📄 Successful Documents: ${successfulDocs}`);
    
    if (totalErrors > 0) {
      console.log(`❌ Total Errors: ${totalErrors}`);
    }
    
    console.log('='.repeat(60));
  }
}