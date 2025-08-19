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

// Core command imports
import { WorkNextCommand } from './commands/WorkNextCommand.js';
import { LLMSGenerateCommand } from './commands/LLMSGenerateCommand.js';
import { GenerateTemplatesCommand } from './commands/GenerateTemplatesCommand.js';
import { createCleanLLMSGenerateCommand } from './commands/clean-llms-generate.js';
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

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    errorHandler.handle(error);
    process.exit(1);
  }
}

async function handleWorkNext(args: string[], argumentParser: ArgumentParser): Promise<void> {
  const config = await loadConfig();
  const workNextCommand = new WorkNextCommand(config);
  
  const options = {
    language: argumentParser.extractFlag(args, '-l', '--language') || config.generation?.defaultLanguage || 'en',
    showCompleted: argumentParser.hasFlag(args, '--show-completed'),
    verbose: argumentParser.hasFlag(args, '-v', '--verbose')
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

// Run CLI only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };