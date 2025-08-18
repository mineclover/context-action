/**
 * Clean LLMS Generate Command
 * 
 * Generates clean LLMS-TXT files without metadata overhead for LLM training/inference
 */

import { Command } from 'commander';
import path from 'path';
import { existsSync } from 'fs';
import { SimpleLLMSCommand } from './SimpleLLMSCommand.js';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import { DEFAULT_CONFIG } from '../../index.js';

interface CleanLLMSOptions {
  language?: string;
  characterLimit?: number;
  category?: string;
  pattern?: 'clean' | 'minimal' | 'raw' | 'origin' | 'minimum';
  generateAll?: boolean;
  outputDir?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export function createCleanLLMSGenerateCommand(): Command {
  const cmd = new Command('clean-llms-generate');
  
  cmd
    .description('Generate clean LLMS-TXT files without metadata overhead')
    .argument('[character-limit]', 'Character limit filter (e.g., 100, 300, 1000). If not specified, generates origin, minimum, and default chars automatically')
    .option('-l, --language <lang>', 'Target language (ko, en)', 'ko')
    .option('-c, --category <cat>', 'Category filter (guide, api, concept, examples)')
    .option('-p, --pattern <pattern>', 'Output pattern (clean, minimal, raw, origin, minimum)')
    .option('--generate-all', 'Force generation of origin, minimum, and default character files')
    .option('-o, --output-dir <dir>', 'Output directory')
    .option('--dry-run', 'Show what would be generated without creating files')
    .option('-v, --verbose', 'Verbose output')
    .action(async (characterLimitArg: string | undefined, options: CleanLLMSOptions) => {
      // If no specific arguments provided, show help for multiple generation
      if (!characterLimitArg && !options.pattern && !options.generateAll && !options.category) {
        console.log('🚀 Default: Generating origin, minimum, and default character files for all categories');
        console.log('💡 Use specific options to generate individual files:');
        console.log('   pnpm cli clean-llms-generate 300  # Generate 300-char limit file');
        console.log('   pnpm cli clean-llms-generate --pattern minimal  # Generate minimal pattern');
        console.log('   pnpm cli clean-llms-generate --category guide  # Generate for specific category\n');
      }
      try {
        await generateCleanLLMS(characterLimitArg, options);
      } catch (error) {
        console.error('❌ Clean LLMS generation failed:', error);
        process.exit(1);
      }
    });

  return cmd;
}

async function generateCleanLLMS(characterLimitArg: string | undefined, options: CleanLLMSOptions): Promise<void> {
  const config = await loadConfig();
  const command = new SimpleLLMSCommand(config);
  
  // Check if we should generate all (default behavior when no specific params are provided)
  const shouldGenerateAll = options.generateAll || (!characterLimitArg && !options.pattern);
  
  const simpleLLMSOptions = {
    language: options.language || 'ko',
    characterLimit: characterLimitArg ? parseInt(characterLimitArg) : undefined,
    category: options.category,
    pattern: options.pattern,
    generateAll: shouldGenerateAll,
    outputDir: options.outputDir,
    dryRun: options.dryRun || false,
    verbose: options.verbose || false
  };

  // Validate character limit if provided
  if (characterLimitArg) {
    const limit = parseInt(characterLimitArg);
    if (isNaN(limit) || limit <= 0) {
      throw new Error(`Invalid character limit: ${characterLimitArg}`);
    }
    simpleLLMSOptions.characterLimit = limit;
  }

  await command.execute(simpleLLMSOptions);
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