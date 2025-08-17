/**
 * 콘텐츠 추출 통합 명령어
 * 기존: extract, extract-all
 * 신규: extract <type> [options]
 */

import { BaseCommand } from '../core/BaseCommand.js';
import type { CLIArgs, CLISubcommand } from '../types/CommandTypes.js';

export class ExtractCommand extends BaseCommand {
  name = 'extract';
  description = 'Content extraction and summary generation';
  aliases = ['ext'];

  subcommands: Record<string, CLISubcommand> = {
    single: {
      name: 'single',
      description: 'Extract content summaries for a specific language',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'en'
        },
        {
          name: 'chars',
          description: 'Character limits (comma-separated)',
          type: 'string'
        },
        {
          name: 'overwrite',
          description: 'Overwrite existing content',
          type: 'boolean'
        }
      ],
      examples: [
        'extract single ko',
        'extract single en --chars=100,300,1000',
        'extract single ko --overwrite --dry-run'
      ],
      execute: this.executeSingle.bind(this)
    },

    all: {
      name: 'all',
      description: 'Extract content summaries for all configured languages',
      options: [
        {
          name: 'languages',
          alias: 'lang',
          description: 'Target languages (comma-separated)',
          type: 'string'
        },
        {
          name: 'chars',
          description: 'Character limits (comma-separated)',
          type: 'string'
        },
        {
          name: 'overwrite',
          description: 'Overwrite existing content',
          type: 'boolean'
        }
      ],
      examples: [
        'extract all',
        'extract all --lang=en,ko',
        'extract all --chars=100,500,1000 --overwrite'
      ],
      execute: this.executeAll.bind(this)
    },

    batch: {
      name: 'batch',
      description: 'Batch extract content with multiple configurations',
      options: [
        {
          name: 'config-file',
          description: 'Configuration file for batch extraction',
          type: 'string'
        },
        {
          name: 'languages',
          alias: 'lang',
          description: 'Target languages (comma-separated)',
          type: 'string'
        },
        {
          name: 'chars',
          description: 'Character limits (comma-separated)',
          type: 'string'
        },
        {
          name: 'parallel',
          description: 'Run extractions in parallel',
          type: 'boolean',
          default: true
        },
        {
          name: 'max-concurrent',
          description: 'Maximum concurrent extractions',
          type: 'number',
          default: 3
        }
      ],
      examples: [
        'extract batch --lang=en,ko',
        'extract batch --config-file=extract.config.json',
        'extract batch --chars=100,300,1000 --parallel --max-concurrent=5'
      ],
      execute: this.executeBatch.bind(this)
    }
  };

  examples = [
    'extract single ko --chars=100,300,1000',
    'extract all --lang=en,ko --overwrite',
    'extract batch --parallel --max-concurrent=5'
  ];

  async execute(args: CLIArgs): Promise<void> {
    const action = args.positional[0];
    
    if (!action) {
      this.showHelp();
      return;
    }

    if (action === 'help' || action === '--help') {
      this.showHelp();
      return;
    }

    const subcommand = this.subcommands[action];
    if (!subcommand) {
      this.logError(`Unknown extract action: ${action}`);
      this.logInfo('Available actions: ' + Object.keys(this.subcommands).join(', '));
      return;
    }

    // 서브커맨드 실행
    const subArgs = {
      ...args,
      command: `${args.command} ${action}`,
      positional: args.positional.slice(1)
    };

    await subcommand.execute(subArgs);
  }

  /**
   * extract single 실행
   */
  private async executeSingle(args: CLIArgs): Promise<void> {
    const { language, characterLimits } = this.parseCommonOptions(args);
    const targetLang = language || args.positional[0] || 'en';
    const charLimitsStr = args.options.chars;
    const overwrite = args.flags.overwrite;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would extract content summaries for language: ${targetLang}`);
      if (charLimitsStr) this.logInfo(`[DRY RUN] Character limits: ${charLimitsStr}`);
      if (overwrite) this.logInfo('[DRY RUN] Would overwrite existing content');
      return;
    }

    try {
      this.logProgress(`Extracting content summaries for language: ${targetLang}`);
      
      const { ContentExtractor } = await import('../../core/ContentExtractor.js');
      const config = await this.loadConfig();
      const contentExtractor = new ContentExtractor(config);
      
      // Parse character limits
      const charLimits = charLimitsStr 
        ? charLimitsStr.split(',').map(Number)
        : config.generation?.characterLimits || [100, 300, 1000];
      
      this.logInfo(`Character limits: ${charLimits.join(', ')}`);
      
      const result = await contentExtractor.extractByCharacterLimits(targetLang, charLimits, {
        dryRun: false,
        overwrite
      });
      
      this.displayExtractionResults(result);
      this.logSuccess(`Content extraction completed for ${targetLang}`);

    } catch (error) {
      this.logError(`Failed to extract content: ${error}`);
      throw error;
    }
  }

  /**
   * extract all 실행
   */
  private async executeAll(args: CLIArgs): Promise<void> {
    const { languages } = this.parseCommonOptions(args);
    const languagesStr = args.options.languages || args.options.lang;
    const charLimitsStr = args.options.chars;
    const overwrite = args.flags.overwrite;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would extract content summaries for all languages`);
      if (languagesStr) this.logInfo(`[DRY RUN] Languages: ${languagesStr}`);
      if (charLimitsStr) this.logInfo(`[DRY RUN] Character limits: ${charLimitsStr}`);
      if (overwrite) this.logInfo('[DRY RUN] Would overwrite existing content');
      return;
    }

    try {
      const config = await this.loadConfig();
      const targetLanguages = languagesStr 
        ? languagesStr.split(',').map(lang => lang.trim())
        : languages || config.generation?.supportedLanguages || ['en'];
      
      this.logProgress(`Extracting content summaries for languages: ${targetLanguages.join(', ')}`);
      
      const { ContentExtractor } = await import('../../core/ContentExtractor.js');
      const contentExtractor = new ContentExtractor(config);
      
      // Parse character limits
      const charLimits = charLimitsStr 
        ? charLimitsStr.split(',').map(Number)
        : config.generation?.characterLimits || [100, 300, 1000];
      
      const result = await contentExtractor.extractContentSummaries({
        languages: targetLanguages,
        characterLimits: charLimits,
        dryRun: false,
        overwrite
      });
      
      this.displayExtractionResults(result);
      this.logSuccess(`Content extraction completed for all languages`);

    } catch (error) {
      this.logError(`Failed to extract all content: ${error}`);
      throw error;
    }
  }

  /**
   * extract batch 실행
   */
  private async executeBatch(args: CLIArgs): Promise<void> {
    const configFile = args.options['config-file'];
    const languagesStr = args.options.languages || args.options.lang;
    const charLimitsStr = args.options.chars;
    const parallel = args.flags.parallel !== false; // Default to true
    const maxConcurrent = args.options['max-concurrent'] || 3;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would run batch content extraction`);
      if (configFile) this.logInfo(`[DRY RUN] Config file: ${configFile}`);
      if (languagesStr) this.logInfo(`[DRY RUN] Languages: ${languagesStr}`);
      if (charLimitsStr) this.logInfo(`[DRY RUN] Character limits: ${charLimitsStr}`);
      this.logInfo(`[DRY RUN] Parallel: ${parallel}, Max concurrent: ${maxConcurrent}`);
      return;
    }

    try {
      this.logProgress('Running batch content extraction...');
      
      const config = await this.loadConfig();
      const { ContentExtractor } = await import('../../core/ContentExtractor.js');
      const contentExtractor = new ContentExtractor(config);
      
      let batchConfig: any = {};
      
      if (configFile) {
        // Load batch configuration from file
        const { promises: fs } = await import('fs');
        const configContent = await fs.readFile(configFile, 'utf-8');
        batchConfig = JSON.parse(configContent);
      } else {
        // Use command line arguments
        batchConfig = {
          languages: languagesStr 
            ? languagesStr.split(',').map(lang => lang.trim())
            : config.generation?.supportedLanguages || ['en'],
          characterLimits: charLimitsStr 
            ? charLimitsStr.split(',').map(Number)
            : config.generation?.characterLimits || [100, 300, 1000],
          parallel,
          maxConcurrent
        };
      }
      
      this.logInfo(`Batch configuration:`);
      this.logInfo(`  Languages: ${batchConfig.languages.join(', ')}`);
      this.logInfo(`  Character limits: ${batchConfig.characterLimits.join(', ')}`);
      this.logInfo(`  Parallel: ${batchConfig.parallel}`);
      this.logInfo(`  Max concurrent: ${batchConfig.maxConcurrent}`);
      
      // Execute batch extraction
      const results = [];
      
      if (batchConfig.parallel) {
        // Parallel execution with concurrency limit
        const chunks = this.chunkArray(batchConfig.languages, batchConfig.maxConcurrent);
        
        for (const chunk of chunks) {
          const promises = chunk.map(async (language: string) => {
            this.logProgress(`Extracting content for ${language}...`);
            return await contentExtractor.extractByCharacterLimits(language, batchConfig.characterLimits, {
              dryRun: false,
              overwrite: true
            });
          });
          
          const chunkResults = await Promise.all(promises);
          results.push(...chunkResults);
        }
      } else {
        // Sequential execution
        for (const language of batchConfig.languages) {
          this.logProgress(`Extracting content for ${language}...`);
          const result = await contentExtractor.extractByCharacterLimits(language, batchConfig.characterLimits, {
            dryRun: false,
            overwrite: true
          });
          results.push(result);
        }
      }
      
      // Display combined results
      this.displayBatchResults(results, batchConfig.languages);
      this.logSuccess('Batch content extraction completed');

    } catch (error) {
      this.logError(`Failed to run batch extraction: ${error}`);
      throw error;
    }
  }

  /**
   * 추출 결과 표시
   */
  private displayExtractionResults(result: any): void {
    console.log(`\n📊 Extraction Results:`);
    console.log(`  Total extracted: ${result.summary?.totalGenerated || 0}`);
    console.log(`  Total errors: ${result.summary?.totalErrors || 0}`);
    
    if (result.summary?.byCharacterLimit) {
      console.log(`\n📏 By Character Limit:`);
      Object.entries(result.summary.byCharacterLimit).forEach(([limit, count]) => {
        console.log(`  ${limit} chars: ${count} files`);
      });
    }
    
    if (result.summary?.byLanguage) {
      console.log(`\n🌐 By Language:`);
      Object.entries(result.summary.byLanguage).forEach(([lang, count]) => {
        console.log(`  ${lang}: ${count} files`);
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach((error: any) => {
        console.log(`  • ${error.file}: ${error.message}`);
      });
    }
  }

  /**
   * 배치 결과 표시
   */
  private displayBatchResults(results: any[], languages: string[]): void {
    console.log(`\n📊 Batch Extraction Results:`);
    
    let totalGenerated = 0;
    let totalErrors = 0;
    const byLanguage: Record<string, number> = {};
    const allErrors: any[] = [];
    
    results.forEach((result, index) => {
      const language = languages[index];
      totalGenerated += result.summary?.totalGenerated || 0;
      totalErrors += result.summary?.totalErrors || 0;
      byLanguage[language] = result.summary?.totalGenerated || 0;
      
      if (result.errors) {
        allErrors.push(...result.errors);
      }
    });
    
    console.log(`  Total extracted: ${totalGenerated}`);
    console.log(`  Total errors: ${totalErrors}`);
    
    console.log(`\n🌐 By Language:`);
    Object.entries(byLanguage).forEach(([lang, count]) => {
      console.log(`  ${lang}: ${count} files`);
    });
    
    if (allErrors.length > 0) {
      console.log(`\n❌ Errors (${allErrors.length}):`);
      allErrors.slice(0, 10).forEach((error: any) => {
        console.log(`  • ${error.file}: ${error.message}`);
      });
      
      if (allErrors.length > 10) {
        console.log(`  ... and ${allErrors.length - 10} more errors`);
      }
    }
  }

  /**
   * 배열을 청크로 분할
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 도움말 출력 (오버라이드)
   */
  protected showHelp(): void {
    console.log('\n📤 extract - Content extraction and summary generation');
    console.log('\nUSAGE:');
    console.log('  extract <type> [options]');
    
    console.log('\nTYPES:');
    for (const [name, subcommand] of Object.entries(this.subcommands)) {
      console.log(`  ${name.padEnd(12)} ${subcommand.description}`);
    }
    
    console.log('\nEXAMPLES:');
    for (const example of this.examples) {
      console.log(`  ${example}`);
    }
    
    console.log('\nFor detailed help on specific type:');
    console.log('  extract <type> --help');
  }
}