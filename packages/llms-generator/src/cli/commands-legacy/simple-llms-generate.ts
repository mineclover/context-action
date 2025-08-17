/**
 * Simple LLMS Generate Command
 * 
 * 같은 character limit의 모든 개별 .md 파일들을 단순 결합하여 LLMS 생성
 */

import { Command } from 'commander';
import path from 'path';
import { existsSync } from 'fs';
import { SimpleLLMSComposer } from '../../core/SimpleLLMSComposer.js';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import { DEFAULT_CONFIG } from '../../index.js';

interface SimpleLLMSOptions {
  language?: string;
  characterLimit?: number;
  outputDir?: string;
  sortBy?: 'alphabetical' | 'priority' | 'category';
  noMetadata?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

interface BatchLLMSOptions {
  language?: string;
  characterLimits?: string;
  outputDir?: string;
  sortBy?: 'alphabetical' | 'priority' | 'category';
  noMetadata?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export function createSimpleLLMSGenerateCommand(): Command {
  const cmd = new Command('simple-llms-generate');
  
  cmd
    .description('같은 character limit의 모든 개별 .md 파일들을 단순 결합하여 LLMS 생성')
    .argument('[character-limit]', 'Character limit (e.g., 100, 300, 1000)')
    .option('-l, --language <lang>', 'Target language (ko, en)', 'ko')
    .option('-o, --output-dir <dir>', 'Output directory')
    .option('--sort-by <method>', 'Sort method (alphabetical, priority, category)', 'alphabetical')
    .option('--no-metadata', 'Exclude metadata from output')
    .option('--dry-run', 'Show what would be generated without creating files')
    .option('-v, --verbose', 'Verbose output')
    .action(async (characterLimitArg: string | undefined, options: SimpleLLMSOptions) => {
      try {
        await generateSimpleLLMS(characterLimitArg, options);
      } catch (error) {
        console.error('❌ Simple LLMS generation failed:', error);
        process.exit(1);
      }
    });

  return cmd;
}

export function createSimpleLLMSBatchCommand(): Command {
  const cmd = new Command('simple-llms-batch');
  
  cmd
    .description('여러 character limit에 대해 Simple LLMS 일괄 생성')
    .option('-l, --language <lang>', 'Target language (ko, en)', 'ko')
    .option('-c, --character-limits <limits>', 'Character limits (comma-separated)', '100,300,1000,2000')
    .option('-o, --output-dir <dir>', 'Output directory')
    .option('--sort-by <method>', 'Sort method (alphabetical, priority, category)', 'alphabetical')
    .option('--no-metadata', 'Exclude metadata from output')
    .option('--dry-run', 'Show what would be generated without creating files')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options: BatchLLMSOptions) => {
      try {
        await generateBatchSimpleLLMS(options);
      } catch (error) {
        console.error('❌ Batch Simple LLMS generation failed:', error);
        process.exit(1);
      }
    });

  return cmd;
}

export function createSimpleLLMSStatsCommand(): Command {
  const cmd = new Command('simple-llms-stats');
  
  cmd
    .description('Simple LLMS 생성을 위한 통계 정보 확인')
    .option('-l, --language <lang>', 'Target language (ko, en)', 'ko')
    .option('-c, --character-limit <limit>', 'Specific character limit to analyze')
    .action(async (options: { language?: string; characterLimit?: string }) => {
      try {
        await showSimpleLLMSStats(options);
      } catch (error) {
        console.error('❌ Stats retrieval failed:', error);
        process.exit(1);
      }
    });

  return cmd;
}

async function generateSimpleLLMS(characterLimitArg: string | undefined, options: SimpleLLMSOptions): Promise<void> {
  if (options.dryRun) {
    console.log('🔍 DRY RUN - No files will be created');
  }

  const config = await loadConfig();
  const composer = new SimpleLLMSComposer(config);
  const language = options.language || 'ko';

  // Simple LLMS는 docs 디렉토리에서 직접 읽어오므로 출력 디렉토리만 확인
  try {
    await composer.ensureOutputDirectoryExists(language);
  } catch (error) {
    console.warn(`⚠️  Warning: ${error}`);
  }

  let characterLimit: number;

  if (characterLimitArg) {
    characterLimit = parseInt(characterLimitArg);
    if (isNaN(characterLimit) || characterLimit <= 0) {
      throw new Error(`Invalid character limit: ${characterLimitArg}`);
    }
  } else {
    // 사용 가능한 character limit 표시하고 첫 번째 사용
    const availableLimits = await composer.getAvailableCharacterLimits(language);
    if (availableLimits.length === 0) {
      throw new Error(`No character-limited files found for language: ${language}`);
    }
    
    console.log(`📊 Available character limits: ${availableLimits.join(', ')}`);
    characterLimit = availableLimits[0];
    console.log(`🎯 Using character limit: ${characterLimit}`);
  }

  if (options.dryRun) {
    const stats = await composer.getCharacterLimitStats(language, characterLimit);
    console.log(`\n📊 Would generate Simple LLMS for:`);
    console.log(`  Language: ${language}`);
    console.log(`  Character limit: ${characterLimit}`);
    console.log(`  Total files: ${stats.totalFiles}`);
    console.log(`  Total characters: ${stats.totalCharacters.toLocaleString()}`);
    console.log(`  Average characters per file: ${stats.averageCharacters}`);
    console.log(`  Sort by: ${options.sortBy}`);
    console.log(`  Include metadata: ${!options.noMetadata}`);
    return;
  }

  console.log(`🚀 Generating Simple LLMS...`);
  console.log(`  Language: ${language}`);
  console.log(`  Character limit: ${characterLimit}`);
  console.log(`  Sort by: ${options.sortBy}`);

  const result = await composer.generateSimpleLLMS({
    language,
    characterLimit,
    outputDir: options.outputDir,
    includeMetadata: !options.noMetadata,
    sortBy: options.sortBy as any
  });

  console.log(`\n📋 Generation Summary:`);
  console.log(`  Output: ${result.outputPath}`);
  console.log(`  Files combined: ${result.totalFiles}`);
  console.log(`  Total characters: ${result.totalCharacters.toLocaleString()}`);
  console.log(`  Average per file: ${result.averageCharacters}`);

  if (options.verbose) {
    console.log(`\n📄 Files included:`);
    result.files.forEach(file => {
      console.log(`  - ${file.documentId} (${file.characters} chars)${file.category ? ` [${file.category}]` : ''}`);
    });
  }
}

async function generateBatchSimpleLLMS(options: BatchLLMSOptions): Promise<void> {
  if (options.dryRun) {
    console.log('🔍 DRY RUN - No files will be created');
  }

  const config = await loadConfig();
  const composer = new SimpleLLMSComposer(config);
  const language = options.language || 'ko';

  // Simple LLMS는 docs 디렉토리에서 직접 읽어오므로 출력 디렉토리만 확인
  try {
    await composer.ensureOutputDirectoryExists(language);
  } catch (error) {
    console.warn(`⚠️  Warning: ${error}`);
  }
  
  let characterLimits: number[];
  if (options.characterLimits) {
    characterLimits = options.characterLimits.split(',').map(s => parseInt(s.trim()));
    if (characterLimits.some(limit => isNaN(limit) || limit <= 0)) {
      throw new Error(`Invalid character limits: ${options.characterLimits}`);
    }
  } else {
    // 사용 가능한 모든 character limit 사용
    characterLimits = await composer.getAvailableCharacterLimits(language);
    if (characterLimits.length === 0) {
      throw new Error(`No character-limited files found for language: ${language}`);
    }
  }

  console.log(`🚀 Batch generating Simple LLMS for ${characterLimits.length} character limits`);
  console.log(`  Language: ${language}`);
  console.log(`  Character limits: ${characterLimits.join(', ')}`);

  if (options.dryRun) {
    console.log(`\n🔍 DRY RUN - Would generate:`);
    for (const limit of characterLimits) {
      const stats = await composer.getCharacterLimitStats(language, limit);
      console.log(`  ${limit} chars: ${stats.totalFiles} files (${stats.totalCharacters.toLocaleString()} total chars)`);
    }
    return;
  }

  const results = await composer.generateBatchSimpleLLMS(language, characterLimits, {
    outputDir: options.outputDir,
    includeMetadata: !options.noMetadata,
    sortBy: options.sortBy as any
  });

  console.log(`\n📋 Batch Generation Summary:`);
  console.log(`  Successful: ${results.size}/${characterLimits.length}`);
  
  if (options.verbose) {
    for (const [limit, result] of results) {
      console.log(`\n  ${limit} chars:`);
      console.log(`    Output: ${result.outputPath}`);
      console.log(`    Files: ${result.totalFiles}`);
      console.log(`    Characters: ${result.totalCharacters.toLocaleString()}`);
    }
  }
}

async function showSimpleLLMSStats(options: { language?: string; characterLimit?: string }): Promise<void> {
  const config = await loadConfig();
  const composer = new SimpleLLMSComposer(config);
  const language = options.language || 'ko';

  // Simple LLMS는 docs 디렉토리에서 직접 읽어오므로 출력 디렉토리만 확인
  try {
    await composer.ensureOutputDirectoryExists(language);
  } catch (error) {
    console.warn(`⚠️  Warning: ${error}`);
  }

  console.log(`📊 Simple LLMS Statistics for language: ${language}\n`);

  if (options.characterLimit) {
    const limit = parseInt(options.characterLimit);
    if (isNaN(limit)) {
      throw new Error(`Invalid character limit: ${options.characterLimit}`);
    }

    const stats = await composer.getCharacterLimitStats(language, limit);
    console.log(`Character Limit: ${limit}`);
    console.log(`  Total files: ${stats.totalFiles}`);
    console.log(`  Total characters: ${stats.totalCharacters.toLocaleString()}`);
    console.log(`  Average characters: ${stats.averageCharacters}`);
    console.log(`  Min characters: ${stats.minCharacters}`);
    console.log(`  Max characters: ${stats.maxCharacters}`);
  } else {
    const availableLimits = await composer.getAvailableCharacterLimits(language);
    
    if (availableLimits.length === 0) {
      console.log('No character-limited files found.');
      return;
    }

    console.log(`Available character limits: ${availableLimits.join(', ')}\n`);

    for (const limit of availableLimits) {
      const stats = await composer.getCharacterLimitStats(language, limit);
      console.log(`${limit} chars: ${stats.totalFiles} files (avg: ${stats.averageCharacters} chars)`);
    }
  }
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
      quality: enhancedConfig.quality
    };
  } else {
    return DEFAULT_CONFIG;
  }
}