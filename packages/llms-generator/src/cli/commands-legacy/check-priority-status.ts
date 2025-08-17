/**
 * Check Priority Status Command
 * 
 * Checks the status of priority.json files and reports which ones need updates
 */

import { Command } from 'commander';
import path from 'path';
import { existsSync } from 'fs';
import { WorkStatusManager } from '../../core/WorkStatusManager.js';
import { PriorityFileStatusManager } from '../../core/PriorityFileStatusManager.js';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import { DEFAULT_CONFIG } from '../../index.js';

interface PriorityStatusOptions {
  language?: string;
  documentId?: string;
  fix?: boolean;
  migrate?: boolean;
  verbose?: boolean;
}

export function createCheckPriorityStatusCommand(): Command {
  return new Command('check-priority-status')
    .description('Check the status of priority.json files')
    .option('-l, --language <lang>', 'Target language (ko, en)', 'ko')
    .option('-d, --document-id <id>', 'Specific document ID to check')
    .option('--fix', 'Automatically fix issues found')
    .option('--migrate', 'Migrate priority files to current schema')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options: PriorityStatusOptions) => {
      try {
        await checkPriorityStatus(options);
      } catch (error) {
        console.error('❌ Priority status check failed:', error);
        process.exit(1);
      }
    });
}

async function checkPriorityStatus(options: PriorityStatusOptions): Promise<void> {
  console.log('🔍 Checking priority file status...');
  
  // Load enhanced config similar to main CLI function
  let config;
  const enhancedConfigPath = path.join(process.cwd(), 'llms-generator.config.json');
  
  if (existsSync(enhancedConfigPath)) {
    console.log('📋 Loading enhanced config from llms-generator.config.json');
    const enhancedConfigManager = new EnhancedConfigManager(enhancedConfigPath);
    const enhancedConfig = await enhancedConfigManager.loadConfig();
    
    // Convert enhanced config to internal format (resolve paths)
    const projectRoot = process.cwd();
    config = {
      ...DEFAULT_CONFIG, // Start with defaults
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
    config = DEFAULT_CONFIG;
  }
  
  const workStatusManager = new WorkStatusManager(config);
  const priorityFileStatusManager = new PriorityFileStatusManager(config);
  
  const language = options.language || 'ko';
  let documentIds: string[] = [];
  
  if (options.documentId) {
    documentIds = [options.documentId];
  } else {
    // Get all document IDs from data directory
    documentIds = await getAllDocumentIds(config.paths.llmContentDir, language);
  }
  
  console.log(`📊 Checking ${documentIds.length} priority files for language: ${language}`);
  
  const results = {
    total: 0,
    needsUpdate: 0,
    needsMigration: 0,
    missingFiles: 0,
    upToDate: 0,
    errors: 0
  };
  
  for (const documentId of documentIds) {
    results.total++;
    
    try {
      // Check if priority file exists and get its status
      const priorityFilePath = path.join(
        config.paths.llmContentDir,
        language,
        documentId,
        'priority.json'
      );
      
      const sourceDocumentPath = path.join(
        config.paths.docsDir,
        language,
        // This would need to be determined from the priority file or documentation structure
        `${documentId}.md`
      );
      
      // Check for schema migration needs
      const needsMigration = await priorityFileStatusManager.checkSchemaMigrationNeeded(priorityFilePath);
      if (needsMigration) {
        results.needsMigration++;
        console.log(`🔄 ${documentId}: Needs schema migration`);
        
        if (options.migrate || options.fix) {
          console.log(`  Migrating schema...`);
          await priorityFileStatusManager.migratePriorityFileSchema(priorityFilePath);
          console.log(`  ✅ Schema migrated`);
        }
      }
      
      // Check priority file status
      const statusInfo = await workStatusManager.checkPriorityFileStatus(
        language,
        documentId,
        sourceDocumentPath
      );
      
      if (statusInfo.needsUpdate) {
        results.needsUpdate++;
        console.log(`⚠️  ${documentId}: Needs update`);
        if (options.verbose) {
          console.log(`     Reasons: ${statusInfo.updateReasons.join(', ')}`);
        }
        
        if (options.fix) {
          console.log(`  Updating priority file status...`);
          await workStatusManager.updatePriorityFileStatus(language, documentId, sourceDocumentPath);
          console.log(`  ✅ Status updated`);
        }
      } else {
        results.upToDate++;
        if (options.verbose) {
          console.log(`✅ ${documentId}: Up to date`);
        }
      }
      
    } catch (error) {
      results.errors++;
      if (error instanceof Error && error.message.includes('not found')) {
        results.missingFiles++;
        console.log(`❌ ${documentId}: Priority file missing`);
      } else {
        console.error(`❌ ${documentId}: Error - ${error}`);
      }
    }
  }
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`  Total files checked: ${results.total}`);
  console.log(`  Up to date: ${results.upToDate}`);
  console.log(`  Need updates: ${results.needsUpdate}`);
  console.log(`  Need migration: ${results.needsMigration}`);
  console.log(`  Missing files: ${results.missingFiles}`);
  console.log(`  Errors: ${results.errors}`);
  
  if (results.needsUpdate > 0 || results.needsMigration > 0) {
    console.log('\n💡 To fix issues automatically, run with --fix or --migrate flags');
  }
}

async function getAllDocumentIds(llmContentDir: string, language: string): Promise<string[]> {
  const { readdir } = await import('fs/promises');
  const { existsSync } = await import('fs');
  
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