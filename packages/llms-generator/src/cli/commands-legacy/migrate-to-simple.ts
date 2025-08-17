/**
 * Migrate to Simple Command
 * 
 * 복잡한 Priority JSON을 단순화된 형태로 마이그레이션하고
 * work_status를 개별 markdown 파일로 이동
 */

import { Command } from 'commander';
import path from 'path';
import { existsSync } from 'fs';
import { readFile, writeFile, readdir } from 'fs/promises';
import { SimplePriorityManager, type SimplePriorityFile } from '../../core/SimplePriorityManager.js';
import { MarkdownWorkStatusManager } from '../../core/MarkdownWorkStatusManager.js';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import { DEFAULT_CONFIG } from '../../index.js';

interface MigrateOptions {
  language?: string;
  documentId?: string;
  dryRun?: boolean;
  backup?: boolean;
  verbose?: boolean;
}

export function createMigrateToSimpleCommand(): Command {
  return new Command('migrate-to-simple')
    .description('복잡한 Priority JSON을 단순화하고 work_status를 markdown 파일로 이동')
    .option('-l, --language <lang>', 'Target language (ko, en)', 'ko')
    .option('-d, --document-id <id>', 'Specific document ID to migrate')
    .option('--dry-run', 'Show what would be migrated without making changes')
    .option('--backup', 'Create backup of original files')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options: MigrateOptions) => {
      try {
        await migrateToSimple(options);
      } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
      }
    });
}

async function migrateToSimple(options: MigrateOptions): Promise<void> {
  console.log('🔄 Starting migration to simple schema...');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN - No changes will be made');
  }
  
  const config = await loadConfig();
  const simplePriorityManager = new SimplePriorityManager(config);
  const markdownWorkStatusManager = new MarkdownWorkStatusManager(config);
  
  const language = options.language || 'ko';
  let documentIds: string[] = [];
  
  if (options.documentId) {
    documentIds = [options.documentId];
  } else {
    documentIds = await getAllDocumentIds(config.paths.llmContentDir, language);
  }
  
  console.log(`📊 Migrating ${documentIds.length} documents for language: ${language}`);
  
  const results = {
    total: 0,
    priorityFilesMigrated: 0,
    markdownFilesUpdated: 0,
    errors: 0,
    skipped: 0
  };
  
  for (const documentId of documentIds) {
    results.total++;
    
    try {
      console.log(`\n🔄 Processing ${documentId}...`);
      
      const priorityFilePath = path.join(
        config.paths.llmContentDir,
        language,
        documentId,
        'priority.json'
      );
      
      if (!existsSync(priorityFilePath)) {
        console.log(`  ⏭️  Skipping - no priority file found`);
        results.skipped++;
        continue;
      }
      
      // Backup original file if requested
      if (options.backup && !options.dryRun) {
        const backupPath = `${priorityFilePath}.backup`;
        const originalContent = await readFile(priorityFilePath, 'utf-8');
        await writeFile(backupPath, originalContent, 'utf-8');
        console.log(`  💾 Backup created: ${backupPath}`);
      }
      
      // Load and analyze current priority file
      const originalContent = await readFile(priorityFilePath, 'utf-8');
      const originalData = JSON.parse(originalContent);
      
      if (options.verbose) {
        console.log(`  📖 Original schema has ${Object.keys(originalData).length} sections`);
      }
      
      // Create simplified priority file
      const simplePriorityFile: SimplePriorityFile = {
        document: {
          id: originalData.document?.id || documentId,
          title: originalData.document?.title || documentId,
          source_path: originalData.document?.source_path || `${language}/${documentId.replace('--', '/')}.md`,
          category: originalData.document?.category || 'reference'
        },
        priority: {
          score: originalData.priority?.score || 70,
          tier: originalData.priority?.tier || 'reference',
          rationale: originalData.priority?.rationale || 'Migrated from complex schema'
        },
        extraction: {
          strategy: originalData.extraction?.strategy || 'reference-first',
          character_limits: simplifyCharacterLimits(originalData.extraction?.character_limits)
        },
        metadata: {
          created: originalData.metadata?.created || new Date().toISOString(),
          updated: new Date().toISOString(),
          version: '1.0',
          source_hash: originalData.metadata?.source_hash
        },
        priority_file_status: {
          schema_version: '1.0',
          needs_schema_update: false,
          auto_generated: originalData.work_status?.priority_file_status?.auto_generated ?? true,
          manual_review_required: false,
          source_document_last_seen: new Date().toISOString()
        }
      };
      
      if (!options.dryRun) {
        await simplePriorityManager.savePriorityFile(language, documentId, simplePriorityFile);
        results.priorityFilesMigrated++;
        console.log(`  ✅ Priority file simplified`);
      } else {
        console.log(`  🔍 Would simplify priority file`);
      }
      
      // Migrate work_status from generated_files to individual markdown files
      const generatedFiles = originalData.work_status?.generated_files;
      if (generatedFiles) {
        for (const [charLimit, fileInfo] of Object.entries(generatedFiles)) {
          if (typeof fileInfo !== 'object' || !fileInfo) continue;
          
          const markdownFilePath = path.join(
            config.paths.llmContentDir,
            language,
            documentId,
            `${documentId}-${charLimit}.md`
          );
          
          if (existsSync(markdownFilePath)) {
            if (options.verbose) {
              console.log(`    📄 Migrating work_status for ${charLimit} chars`);
            }
            
            if (!options.dryRun) {
              // Read current markdown content
              const currentContent = await readFile(markdownFilePath, 'utf-8');
              const contentWithoutFrontmatter = extractContent(currentContent);
              
              // Create frontmatter with migrated work_status
              await markdownWorkStatusManager.createInitialFrontmatter(
                markdownFilePath,
                documentId,
                parseInt(charLimit),
                contentWithoutFrontmatter,
                {
                  priority_file: `./priority.json`,
                  source_document: simplePriorityFile.document.source_path,
                  extraction_strategy: simplePriorityFile.extraction.strategy
                }
              );
              
              // Update work status with migrated data
              await markdownWorkStatusManager.updateWorkStatus(markdownFilePath, {
                created: (fileInfo as any).created || new Date().toISOString(),
                modified: (fileInfo as any).modified,
                edited: (fileInfo as any).edited || false,
                needs_update: (fileInfo as any).needs_update || false,
                content_hash: (fileInfo as any).content_hash,
                quality_score: (fileInfo as any).quality_score,
                template_detected: (fileInfo as any).template_detected,
                manual_review_needed: (fileInfo as any).manual_review_needed,
                auto_generated: true
              });
              
              results.markdownFilesUpdated++;
              console.log(`    ✅ Frontmatter added to ${charLimit}-char file`);
            } else {
              console.log(`    🔍 Would add frontmatter to ${charLimit}-char file`);
            }
          }
        }
      }
      
    } catch (error) {
      results.errors++;
      console.error(`❌ ${documentId}: Migration failed - ${error}`);
    }
  }
  
  // Summary
  console.log('\n📋 Migration Summary:');
  console.log(`  Total documents processed: ${results.total}`);
  console.log(`  Priority files migrated: ${results.priorityFilesMigrated}`);
  console.log(`  Markdown files updated: ${results.markdownFilesUpdated}`);
  console.log(`  Skipped: ${results.skipped}`);
  console.log(`  Errors: ${results.errors}`);
  
  if (options.dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
  } else if (results.priorityFilesMigrated > 0 || results.markdownFilesUpdated > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 You can now use simple-check command to verify the migration.');
  }
}

function simplifyCharacterLimits(originalCharLimits: any): Record<string, { focus: string; structure?: string }> {
  if (!originalCharLimits) {
    return {
      '100': { focus: 'Core concept only', structure: 'Single sentence' },
      '300': { focus: 'Key points', structure: 'Definition + usage' },
      '1000': { focus: 'Practical understanding', structure: 'Concept + examples' },
      '2000': { focus: 'Comprehensive overview', structure: 'Complete explanation' }
    };
  }
  
  const simplified: Record<string, { focus: string; structure?: string }> = {};
  
  for (const [limit, config] of Object.entries(originalCharLimits)) {
    if (typeof config === 'object' && config) {
      simplified[limit] = {
        focus: (config as any).focus || 'General content',
        structure: (config as any).structure
      };
    }
  }
  
  return simplified;
}

function extractContent(content: string): string {
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n\n?/;
  return content.replace(frontmatterRegex, '');
}

async function loadConfig() {
  // Same as simple-priority-check.ts
  const enhancedConfigPath = path.join(process.cwd(), 'llms-generator.config.json');
  
  if (existsSync(enhancedConfigPath)) {
    const enhancedConfigManager = new EnhancedConfigManager(enhancedConfigPath);
    const enhancedConfig = await enhancedConfigManager.loadConfig();
    
    const projectRoot = process.cwd();
    return {
      ...DEFAULT_CONFIG,
      paths: {
        docsDir: path.resolve(projectRoot, enhancedConfig.paths?.docsDir || './docs'),
        llmContentDir: path.resolve(projectRoot, enhancedConfig.paths?.llmContentDir || './data'),
        outputDir: path.resolve(projectRoot, enhancedConfig.paths?.outputDir || './docs/llms'),
        templatesDir: path.resolve(projectRoot, enhancedConfig.paths?.templatesDir || './templates'),
        instructionsDir: path.resolve(projectRoot, enhancedConfig.paths?.instructionsDir || './instructions')
      },
      generation: {
        ...DEFAULT_CONFIG.generation,
        supportedLanguages: enhancedConfig.generation?.supportedLanguages || DEFAULT_CONFIG.generation.supportedLanguages,
        characterLimits: enhancedConfig.generation?.characterLimits || DEFAULT_CONFIG.generation.characterLimits,
        defaultLanguage: enhancedConfig.generation?.defaultLanguage || DEFAULT_CONFIG.generation.defaultLanguage,
        outputFormat: enhancedConfig.generation?.outputFormat || DEFAULT_CONFIG.generation.outputFormat
      },
      quality: enhancedConfig.quality
    };
  } else {
    return DEFAULT_CONFIG;
  }
}

async function getAllDocumentIds(llmContentDir: string, language: string): Promise<string[]> {
  const languageDir = path.join(llmContentDir, language);
  
  if (!existsSync(languageDir)) {
    return [];
  }
  
  try {
    const entries = await readdir(languageDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (error) {
    console.warn(`⚠️  Could not read directory ${languageDir}: ${error}`);
    return [];
  }
}