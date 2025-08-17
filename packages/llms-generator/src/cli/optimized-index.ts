#!/usr/bin/env node

/**
 * Optimized CLI Entry Point for LLMS Generator
 * 
 * Simplified to include only core, tested functionality:
 * - work-next: Next document workflow
 * - clean-llms-generate: Clean LLMS generation for LLM training
 * - llms-generate: Standard LLMS generation with metadata
 * - help: Show available commands
 * 
 * Reduced from ~2000 lines to ~200 lines
 */

import path from 'path';
import { existsSync } from 'fs';

// Core command imports - only tested functionality
import { WorkNextCommand } from './commands/WorkNextCommand.js';
import { LLMSGenerateCommand } from './commands/LLMSGenerateCommand.js';
import { createCleanLLMSGenerateCommand } from './commands/clean-llms-generate.js';
import { EnhancedConfigManager } from '../core/EnhancedConfigManager.js';
import { DEFAULT_CONFIG } from '../index.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'work-next':
        await handleWorkNext(args.slice(1));
        break;

      case 'clean-llms-generate':
        await handleCleanLLMSGenerate(args.slice(1));
        break;

      case 'llms-generate':
        await handleLLMSGenerate(args.slice(1));
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('💡 Run "help" to see available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Command failed:`, error);
    process.exit(1);
  }
}

async function handleWorkNext(args: string[]): Promise<void> {
  const config = await loadConfig();
  const workNextCommand = new WorkNextCommand(config);
  
  // Parse simple flags
  const options = {
    language: extractFlag(args, '-l', '--language') || 'ko',
    showCompleted: args.includes('--show-completed'),
    verbose: args.includes('-v') || args.includes('--verbose')
  };

  await workNextCommand.execute(options);
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

async function handleLLMSGenerate(args: string[]): Promise<void> {
  const config = await loadConfig();
  const llmsGenerateCommand = new LLMSGenerateCommand(config);
  
  // Parse basic options
  const characterLimit = extractNumberFlag(args, '-c', '--character-limit');
  const category = extractFlag(args, '--category');
  const language = extractFlag(args, '-l', '--language') || 'ko';
  const pattern = extractFlag(args, '-p', '--pattern') || 'standard';
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('-v') || args.includes('--verbose');

  const options = {
    characterLimit,
    category,
    language,
    pattern: pattern as 'standard' | 'minimum' | 'origin',
    dryRun,
    verbose
  };

  await llmsGenerateCommand.execute(options);
}

async function loadConfig() {
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
      quality: enhancedConfig.quality,
      categories: enhancedConfig.categories
    };
  } else {
    return DEFAULT_CONFIG;
  }
}

function extractFlag(args: string[], shortFlag: string, longFlag?: string): string | undefined {
  const flags = [shortFlag];
  if (longFlag) flags.push(longFlag);
  
  for (const flag of flags) {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1];
    }
  }
  return undefined;
}

function extractNumberFlag(args: string[], shortFlag: string, longFlag?: string): number | undefined {
  const value = extractFlag(args, shortFlag, longFlag);
  return value ? parseInt(value) : undefined;
}

function showHelp() {
  console.log('');
  console.log('🚀 LLMS Generator - Core Commands (Optimized)');
  console.log('');
  console.log('WORKFLOW MANAGEMENT:');
  console.log('  work-next [options]              Find next document to work on');
  console.log('                                   [-l, --language <lang>] [--show-completed] [-v, --verbose]');
  console.log('');
  console.log('LLMS GENERATION:');
  console.log('  clean-llms-generate [char-limit] [options]');
  console.log('                                   Generate clean LLMS files for LLM training (no metadata)');
  console.log('                                   [-l, --language <lang>] [-c, --category <cat>]');
  console.log('                                   [-p, --pattern clean|minimal|raw] [--dry-run] [-v, --verbose]');
  console.log('');
  console.log('  llms-generate [options]          Generate standard LLMS files with metadata');
  console.log('                                   [-c, --character-limit <num>] [--category <cat>]');
  console.log('                                   [-l, --language <lang>] [-p, --pattern standard|minimum|origin]');
  console.log('                                   [--dry-run] [-v, --verbose]');
  console.log('');
  console.log('EXAMPLES:');
  console.log('  # Find next document to work on');
  console.log('  npx @context-action/llms-generator work-next --language ko');
  console.log('');
  console.log('  # Generate clean LLMS for LLM training (recommended)');
  console.log('  npx @context-action/llms-generator clean-llms-generate 300 --language ko --pattern clean');
  console.log('  npx @context-action/llms-generator clean-llms-generate --category guide --pattern minimal');
  console.log('  npx @context-action/llms-generator clean-llms-generate 100 --pattern raw --dry-run');
  console.log('');
  console.log('  # Generate standard LLMS with metadata');
  console.log('  npx @context-action/llms-generator llms-generate --character-limit 300 --language ko');
  console.log('  npx @context-action/llms-generator llms-generate --category guide --pattern minimum');
  console.log('');
  console.log('For more detailed options, use --help with specific commands:');
  console.log('  npx @context-action/llms-generator clean-llms-generate --help');
  console.log('');
  console.log('💡 Note: This is the optimized CLI with only core, tested functionality');
  console.log('   Reduced from ~2000 lines to ~200 lines for better maintainability');
  console.log('');
}

// Run CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };