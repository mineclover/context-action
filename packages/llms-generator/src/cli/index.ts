#!/usr/bin/env node

/**
 * Clean CLI Entry Point for LLMS Generator
 * 
 * Simplified architecture with direct command handling:
 * - Direct command imports and execution
 * - Minimal abstractions
 * - Easy maintenance and debugging
 * - Type safety throughout
 */

import path from 'path';
import { existsSync } from 'fs';
import { EnhancedLLMSConfig } from '../types/config.js';

// Core command imports
import { WorkNextCommand } from './commands/WorkNextCommand.js';
import { LLMSGenerateCommand } from './commands/LLMSGenerateCommand.js';
import { GenerateTemplatesCommand } from './commands/GenerateTemplatesCommand.js';
import { createCleanLLMSGenerateCommand } from './commands/clean-llms-generate.js';
import { SyncDocsCommand } from './commands/SyncDocsCommand.js';
import { InitCommand } from './commands/InitCommand.js';
import { PriorityManagerCommand } from './commands/PriorityManagerCommand.js';
import { PriorityTasksCommand } from './commands/PriorityTasksCommand.js';
import { CLIConfig } from './types/CLITypes.js';
import { EnhancedConfigManager } from '../core/EnhancedConfigManager.js';
import { DEFAULT_CONFIG } from '../shared/config/DefaultConfig.js';
import { HelpDisplay } from './core/HelpDisplay.js';
import { ErrorHandler } from './core/ErrorHandler.js';
import { ArgumentParser } from './utils/ArgumentParser.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const helpDisplay = new HelpDisplay();
  const errorHandler = new ErrorHandler();
  const argumentParser = new ArgumentParser();
  
  try {
    if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
      helpDisplay.show();
      return;
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    // Direct command routing
    switch (command) {
      case 'init':
        await handleInit(commandArgs, argumentParser);
        break;

      case 'work-next':
        await handleWorkNext(commandArgs, argumentParser);
        break;

      case 'generate-templates':
        await handleGenerateTemplates(commandArgs, argumentParser);
        break;

      case 'clean-llms-generate':
        await handleCleanLLMSGenerate(commandArgs);
        break;

      case 'llms-generate':
        await handleLLMSGenerate(commandArgs, argumentParser);
        break;

      case 'sync-docs':
        await handleSyncDocs(commandArgs, argumentParser);
        break;

      case 'priority-stats':
        await handlePriorityManager(commandArgs, argumentParser, 'stats');
        break;

      case 'priority-health':
        await handlePriorityManager(commandArgs, argumentParser, 'health');
        break;

      case 'priority-sync':
        await handlePriorityManager(commandArgs, argumentParser, 'sync');
        break;

      case 'priority-auto':
        await handlePriorityManager(commandArgs, argumentParser, 'auto-calc');
        break;

      case 'priority-suggest':
        await handlePriorityManager(commandArgs, argumentParser, 'suggest');
        break;

      case 'priority-tasks':
        await handlePriorityTasks(commandArgs, argumentParser);
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    errorHandler.handle(error);
    process.exit(1);
  }
}

async function handleWorkNext(args: string[], argumentParser: ArgumentParser): Promise<void> {
  const config = await loadEnhancedConfig();
  const workNextCommand = new WorkNextCommand(config);
  
  const options = {
    language: argumentParser.extractFlag(args, '-l', '--language') || config.generation?.defaultLanguage || 'en',
    showCompleted: argumentParser.hasFlag(args, '--show-completed'),
    verbose: argumentParser.hasFlag(args, '-v', '--verbose'),
    limit: argumentParser.extractNumberFlag(args, '-n', '--limit') || argumentParser.extractNumberFlag(args, '--top'),
    sortBy: argumentParser.extractFlag(args, '--sort-by') as 'priority' | 'category' | 'status' | 'modified' | undefined,
    category: argumentParser.extractFlag(args, '--category'),
    characterLimit: argumentParser.extractNumberFlag(args, '-c', '--character-limit')
  };

  await workNextCommand.execute(options);
}

async function handleGenerateTemplates(args: string[], argumentParser: ArgumentParser): Promise<void> {
  const config = await loadConfig();
  const generateTemplatesCommand = new GenerateTemplatesCommand(config);
  
  const options = {
    language: argumentParser.extractFlag(args, '-l', '--language') || config.generation?.defaultLanguage || 'en',
    category: argumentParser.extractFlag(args, '--category'),
    characterLimits: argumentParser.extractFlag(args, '--character-limits')?.split(',').map(Number) || config.generation?.characterLimits,
    overwrite: argumentParser.hasFlag(args, '--overwrite'),
    dryRun: argumentParser.hasFlag(args, '--dry-run'),
    verbose: argumentParser.hasFlag(args, '-v', '--verbose')
  };

  await generateTemplatesCommand.execute(options);
}

async function handleCleanLLMSGenerate(args: string[]): Promise<void> {
  const cleanLLMSGenerateCommand = createCleanLLMSGenerateCommand();
  cleanLLMSGenerateCommand.exitOverride();
  
  try {
    await cleanLLMSGenerateCommand.parseAsync(['node', 'clean-llms-generate', ...args]);
  } catch (error: any) {
    if (error.code === 'commander.helpDisplayed') {
      return;
    }
    throw error;
  }
}

async function handleLLMSGenerate(args: string[], argumentParser: ArgumentParser): Promise<void> {
  const config = await loadConfig();
  const llmsGenerateCommand = new LLMSGenerateCommand(config);
  
  const options = {
    characterLimit: argumentParser.extractNumberFlag(args, '-c', '--character-limit'),
    category: argumentParser.extractFlag(args, '--category'),
    language: argumentParser.extractFlag(args, '-l', '--language') || config.generation?.defaultLanguage || 'en',
    pattern: (argumentParser.extractFlag(args, '-p', '--pattern') || 'standard') as 'standard' | 'minimum' | 'origin',
    dryRun: argumentParser.hasFlag(args, '--dry-run'),
    verbose: argumentParser.hasFlag(args, '-v', '--verbose')
  };

  await llmsGenerateCommand.execute(options);
}

async function handleSyncDocs(args: string[], argumentParser: ArgumentParser): Promise<void> {
  const config = await loadEnhancedConfig();
  const syncDocsCommand = new SyncDocsCommand(config);
  
  const changedFilesStr = argumentParser.extractFlag(args, '--changed-files');
  const changedFiles = changedFilesStr ? changedFilesStr.split(',').map(f => f.trim()) : [];
  
  // 언어 필터링 옵션 처리
  const languagesStr = argumentParser.extractFlag(args, '--languages');
  const languages = languagesStr ? languagesStr.split(',').map(l => l.trim()) : undefined;
  
  const options = {
    changedFiles,
    quiet: argumentParser.hasFlag(args, '--quiet'),
    dryRun: argumentParser.hasFlag(args, '--dry-run'),
    force: argumentParser.hasFlag(args, '--force'),
    languages,
    includeKorean: argumentParser.hasFlag(args, '--include-korean') || 
                   (argumentParser.hasFlag(args, '--no-korean') ? false : undefined),
    onlyKorean: argumentParser.hasFlag(args, '--only-korean'),
    onlyEnglish: argumentParser.hasFlag(args, '--only-english')
  };

  await syncDocsCommand.execute(options);
}

async function handleInit(args: string[], argumentParser: ArgumentParser): Promise<void> {
  const config = await loadConfig();
  const initCommand = new InitCommand(config);
  
  const options = {
    dryRun: argumentParser.hasFlag(args, '--dry-run'),
    overwrite: argumentParser.hasFlag(args, '--overwrite'),
    quiet: argumentParser.hasFlag(args, '--quiet'),
    skipPriority: argumentParser.hasFlag(args, '--skip-priority'),
    skipTemplates: argumentParser.hasFlag(args, '--skip-templates'),
    language: argumentParser.extractFlag(args, '-l', '--language')
  };

  await initCommand.execute(options);
}

async function handlePriorityManager(args: string[], argumentParser: ArgumentParser, mode: 'stats' | 'health' | 'sync' | 'auto-calc' | 'suggest'): Promise<void> {
  const enhancedConfig = await loadEnhancedConfig();
  const priorityManager = new PriorityManagerCommand(enhancedConfig);
  
  const options = {
    mode,
    server: argumentParser.extractFlag(args, '--server'),
    criteria: argumentParser.extractFlag(args, '--criteria'),
    documentId: argumentParser.extractFlag(args, '--document-id'),
    force: argumentParser.hasFlag(args, '--force'),
    quiet: argumentParser.hasFlag(args, '--quiet')
  };

  await priorityManager.execute(options);
}

async function loadConfig(): Promise<CLIConfig> {
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
        outputFormat: (enhancedConfig.generation?.outputFormat || DEFAULT_CONFIG.generation.outputFormat) as "txt"
      },
      quality: enhancedConfig.quality || DEFAULT_CONFIG.quality,
      categories: enhancedConfig.categories
    };
  } else {
    return DEFAULT_CONFIG;
  }
}

async function loadEnhancedConfig(): Promise<EnhancedLLMSConfig> {
  const enhancedConfigPath = path.join(process.cwd(), 'llms-generator.config.json');
  
  if (existsSync(enhancedConfigPath)) {
    const enhancedConfigManager = new EnhancedConfigManager(enhancedConfigPath);
    return await enhancedConfigManager.loadConfig();
  } else {
    // Return a minimal EnhancedLLMSConfig with required properties
    const baseConfig = await loadConfig();
    return {
      ...baseConfig,
      categories: {},
      tags: {},
      dependencies: {
        rules: {
          prerequisite: { description: '', weight: 0, autoInclude: false },
          reference: { description: '', weight: 0, autoInclude: false },
          followup: { description: '', weight: 0, autoInclude: false },
          complement: { description: '', weight: 0, autoInclude: false }
        },
        conflictResolution: {
          strategy: 'exclude-conflicts',
          priority: 'higher-score-wins',
          allowPartialConflicts: false
        }
      },
      composition: {
        strategies: {},
        defaultStrategy: 'default',
        optimization: {
          spaceUtilizationTarget: 0.8,
          qualityThreshold: 0.7,
          diversityBonus: 0.1,
          redundancyPenalty: 0.2
        }
      },
      extraction: {
        defaultQualityThreshold: 0.7,
        autoTagExtraction: false,
        autoDependencyDetection: false,
        strategies: {}
      },
      validation: {
        schema: {
          enforceTagConsistency: false,
          validateDependencies: false,
          checkCategoryAlignment: false
        },
        quality: {
          minPriorityScore: 0,
          maxDocumentAge: '1y',
          requireMinimumContent: false
        }
      },
      ui: {
        dashboard: {
          enableTagCloud: false,
          showCategoryStats: false,
          enableDependencyGraph: false
        },
        reporting: {
          generateCompositionReports: false,
          includeQualityMetrics: false,
          exportFormats: ['json'] as ('json' | 'csv' | 'html')[]
        }
      }
    };
  }
}

async function handlePriorityTasks(args: string[], argumentParser: ArgumentParser): Promise<void> {
  const config = await loadEnhancedConfig();
  const priorityTasksCommand = new PriorityTasksCommand(config);
  
  const options = {
    language: argumentParser.extractFlag(args, '-l', '--language'),
    category: argumentParser.extractFlag(args, '--category'),
    taskType: argumentParser.extractFlag(args, '--task-type'),
    limit: argumentParser.extractNumberFlag(args, '-n', '--limit'),
    verbose: argumentParser.hasFlag(args, '-v', '--verbose'),
    fix: argumentParser.hasFlag(args, '--fix'),
    dryRun: argumentParser.hasFlag(args, '--dry-run')
  };

  await priorityTasksCommand.execute(options);
}

// Run CLI only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };