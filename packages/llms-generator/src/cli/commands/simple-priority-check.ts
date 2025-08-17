/**
 * Simple Priority Check Command
 * 
 * 단순화된 Priority 및 Markdown work status 확인
 */

import { Command } from 'commander';
import path from 'path';
import { existsSync } from 'fs';
import { SimplePriorityManager } from '../../core/SimplePriorityManager.js';
import { MarkdownWorkStatusManager } from '../../core/MarkdownWorkStatusManager.js';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import { DEFAULT_CONFIG } from '../../index.js';

interface SimpleCheckOptions {
  language?: string;
  documentId?: string;
  checkMarkdown?: boolean;
  fix?: boolean;
  verbose?: boolean;
}

export function createSimplePriorityCheckCommand(): Command {
  return new Command('simple-check')
    .description('단순화된 Priority 및 Markdown work status 확인')
    .option('-l, --language <lang>', 'Target language (ko, en)', 'ko')
    .option('-d, --document-id <id>', 'Specific document ID to check')
    .option('-m, --check-markdown', 'Also check markdown file work status')
    .option('--fix', 'Automatically fix issues found')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options: SimpleCheckOptions) => {
      try {
        await simpleCheck(options);
      } catch (error) {
        console.error('❌ Simple check failed:', error);
        process.exit(1);
      }
    });
}

async function simpleCheck(options: SimpleCheckOptions): Promise<void> {
  console.log('🔍 Running simple priority and work status check...');
  
  // Load config
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
  
  console.log(`📊 Checking ${documentIds.length} documents for language: ${language}`);
  
  const results = {
    total: 0,
    priorityFilesNeedUpdate: 0,
    markdownFilesNeedUpdate: 0,
    priorityFilesMissing: 0,
    markdownFilesMissing: 0,
    upToDate: 0,
    errors: 0
  };
  
  for (const documentId of documentIds) {
    results.total++;
    
    try {
      // Check priority file
      const sourceDocumentPath = path.join(
        config.paths.docsDir,
        language,
        `${documentId.replace('--', '/')}.md`
      );
      
      const priorityCheck = await simplePriorityManager.checkNeedsUpdate(
        language,
        documentId,
        sourceDocumentPath
      );
      
      if (priorityCheck.needsUpdate) {
        results.priorityFilesNeedUpdate++;
        console.log(`⚠️  Priority: ${documentId} needs update`);
        if (options.verbose) {
          console.log(`     Reasons: ${priorityCheck.reasons.join(', ')}`);
        }
        
        if (options.fix) {
          console.log(`  Updating priority file tracking...`);
          await simplePriorityManager.updateSourceDocumentTracking(language, documentId, sourceDocumentPath);
          console.log(`  ✅ Priority tracking updated`);
        }
      }
      
      // Check markdown files if requested
      if (options.checkMarkdown) {
        const documentDir = path.join(config.paths.llmContentDir, language, documentId);
        const markdownFilesNeedingUpdate = await markdownWorkStatusManager.getFilesNeedingUpdate(documentDir);
        
        if (markdownFilesNeedingUpdate.length > 0) {
          results.markdownFilesNeedUpdate += markdownFilesNeedingUpdate.length;
          console.log(`⚠️  Markdown: ${documentId} has ${markdownFilesNeedingUpdate.length} files needing update`);
          
          if (options.verbose) {
            for (const filePath of markdownFilesNeedingUpdate) {
              const fileName = path.basename(filePath);
              const check = await markdownWorkStatusManager.checkNeedsUpdate(filePath);
              console.log(`     ${fileName}: ${check.reasons.join(', ')}`);
            }
          }
          
          if (options.fix) {
            console.log(`  Updating markdown file hashes...`);
            for (const filePath of markdownFilesNeedingUpdate) {
              await markdownWorkStatusManager.updateContentHash(filePath);
            }
            console.log(`  ✅ Markdown files updated`);
          }
        }
      }
      
      if (!priorityCheck.needsUpdate) {
        results.upToDate++;
        if (options.verbose) {
          console.log(`✅ ${documentId}: Up to date`);
        }
      }
      
    } catch (error) {
      results.errors++;
      if (error instanceof Error && error.message.includes('not found')) {
        results.priorityFilesMissing++;
        console.log(`❌ ${documentId}: Priority file missing`);
      } else {
        console.error(`❌ ${documentId}: Error - ${error}`);
      }
    }
  }
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`  Total documents checked: ${results.total}`);
  console.log(`  Up to date: ${results.upToDate}`);
  console.log(`  Priority files need update: ${results.priorityFilesNeedUpdate}`);
  console.log(`  Priority files missing: ${results.priorityFilesMissing}`);
  
  if (options.checkMarkdown) {
    console.log(`  Markdown files need update: ${results.markdownFilesNeedUpdate}`);
  }
  
  console.log(`  Errors: ${results.errors}`);
  
  if (results.priorityFilesNeedUpdate > 0 || results.markdownFilesNeedUpdate > 0) {
    console.log('\n💡 To fix issues automatically, run with --fix flag');
  }
}

async function loadConfig() {
  const enhancedConfigPath = path.join(process.cwd(), 'llms-generator.config.json');
  
  if (existsSync(enhancedConfigPath)) {
    console.log('📋 Loading enhanced config from llms-generator.config.json');
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
    console.log('📋 Using default configuration');
    return DEFAULT_CONFIG;
  }
}

async function getAllDocumentIds(llmContentDir: string, language: string): Promise<string[]> {
  const { readdir } = await import('fs/promises');
  
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