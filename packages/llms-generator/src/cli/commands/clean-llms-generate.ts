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
    return await enhancedConfigManager.loadConfig();
  } else {
    // Return a minimal EnhancedLLMSConfig with required properties
    return {
      ...DEFAULT_CONFIG,
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
          strategy: 'exclude-conflicts' as const,
          priority: 'higher-score-wins' as const,
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