/**
 * 콘텐츠 구성 통합 명령어
 * 기존: compose, compose-batch, compose-stats, markdown-generate, markdown-all
 * 신규: compose <type> [options]
 */

import { BaseCommand } from '../core/BaseCommand.js';
import type { CLIArgs, CLISubcommand } from '../types/CommandTypes.js';

export class ComposeCommand extends BaseCommand {
  name = 'compose';
  description = 'Content composition and markdown generation';
  aliases = ['comp'];

  subcommands: Record<string, CLISubcommand> = {
    single: {
      name: 'single',
      description: 'Compose adaptive content for a specific language and character limit',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        },
        {
          name: 'chars',
          alias: 'c',
          description: 'Character limit',
          type: 'number',
          default: 5000
        },
        {
          name: 'no-toc',
          description: 'Disable table of contents',
          type: 'boolean'
        },
        {
          name: 'priority',
          description: 'Priority threshold',
          type: 'number',
          default: 0
        }
      ],
      examples: [
        'compose single ko 1000',
        'compose single en 3000 --no-toc',
        'compose single ko 5000 --priority=50 --dry-run'
      ],
      execute: this.executeSingle.bind(this)
    },

    batch: {
      name: 'batch',
      description: 'Batch compose content for multiple character limits',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        },
        {
          name: 'chars',
          description: 'Character limits (comma-separated)',
          type: 'string',
          default: '1000,3000,5000'
        },
        {
          name: 'no-toc',
          description: 'Disable table of contents',
          type: 'boolean'
        },
        {
          name: 'priority',
          description: 'Priority threshold',
          type: 'number',
          default: 0
        }
      ],
      examples: [
        'compose batch ko',
        'compose batch en --chars=1000,2000,5000',
        'compose batch ko --chars=500,1500,3000 --no-toc --dry-run'
      ],
      execute: this.executeBatch.bind(this)
    },

    stats: {
      name: 'stats',
      description: 'Show composition statistics and available content',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        },
        {
          name: 'detailed',
          description: 'Show detailed statistics',
          type: 'boolean'
        }
      ],
      examples: [
        'compose stats ko',
        'compose stats en --detailed'
      ],
      execute: this.executeStats.bind(this)
    },

    markdown: {
      name: 'markdown',
      description: 'Generate markdown files from composed content',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string'
        },
        {
          name: 'chars',
          description: 'Character limits (comma-separated)',
          type: 'string'
        },
        {
          name: 'overwrite',
          description: 'Overwrite existing files',
          type: 'boolean'
        },
        {
          name: 'all-languages',
          description: 'Generate for all configured languages',
          type: 'boolean'
        }
      ],
      examples: [
        'compose markdown ko --chars=100,300,1000',
        'compose markdown en --overwrite',
        'compose markdown --all-languages --chars=500,1500,3000'
      ],
      execute: this.executeMarkdown.bind(this)
    },

    'markdown-all': {
      name: 'markdown-all',
      description: 'Generate all markdown files for all configured languages',
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
          description: 'Overwrite existing files',
          type: 'boolean'
        }
      ],
      examples: [
        'compose markdown-all',
        'compose markdown-all --lang=en,ko',
        'compose markdown-all --chars=100,500,1000 --overwrite'
      ],
      execute: this.executeMarkdownAll.bind(this)
    }
  };

  examples = [
    'compose single ko 1000 --no-toc',
    'compose batch en --chars=1000,3000,5000',
    'compose stats ko --detailed',
    'compose markdown ko --chars=100,300,1000',
    'compose markdown-all --lang=en,ko --overwrite'
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
      this.logError(`Unknown compose action: ${action}`);
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
   * compose single 실행
   */
  private async executeSingle(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || args.positional[0] || 'ko';
    const charLimit = parseInt(args.positional[1]) || args.options.chars || 5000;
    const noToc = args.flags['no-toc'];
    const priority = args.options.priority || 0;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would compose adaptive content for language: ${targetLang}`);
      this.logInfo(`[DRY RUN] Character limit: ${charLimit}`);
      this.logInfo(`[DRY RUN] Table of contents: ${noToc ? 'disabled' : 'enabled'}`);
      this.logInfo(`[DRY RUN] Priority threshold: ${priority}`);
      return;
    }

    try {
      this.logProgress(`Composing adaptive content for language: ${targetLang}`);
      this.logInfo(`Character limit: ${charLimit}`);
      this.logInfo(`Table of contents: ${noToc ? 'disabled' : 'enabled'}`);
      this.logInfo(`Priority threshold: ${priority}`);
      
      const { AdaptiveComposer } = await import('../../core/AdaptiveComposer.js');
      const config = await this.loadConfig();
      const adaptiveComposer = new AdaptiveComposer(config);
      
      const result = await adaptiveComposer.composeAdaptiveContent({
        language: targetLang,
        characterLimit: charLimit,
        includeTableOfContents: !noToc,
        priorityThreshold: priority
      });
      
      this.displayCompositionResults(result);
      this.logSuccess(`Content composition completed for ${targetLang}`);

    } catch (error) {
      this.logError(`Failed to compose content: ${error}`);
      throw error;
    }
  }

  /**
   * compose batch 실행
   */
  private async executeBatch(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || args.positional[0] || 'ko';
    const charsStr = args.options.chars || '1000,3000,5000';
    const noToc = args.flags['no-toc'];
    const priority = args.options.priority || 0;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would compose adaptive content for language: ${targetLang}`);
      this.logInfo(`[DRY RUN] Character limits: ${charsStr}`);
      this.logInfo(`[DRY RUN] Table of contents: ${noToc ? 'disabled' : 'enabled'}`);
      this.logInfo(`[DRY RUN] Priority threshold: ${priority}`);
      return;
    }

    try {
      this.logProgress(`Batch composing content for language: ${targetLang}`);
      
      const charLimits = charsStr.split(',').map(Number);
      this.logInfo(`Character limits: ${charLimits.join(', ')}`);
      
      const { AdaptiveComposer } = await import('../../core/AdaptiveComposer.js');
      const config = await this.loadConfig();
      const adaptiveComposer = new AdaptiveComposer(config);
      
      const results = await adaptiveComposer.composeBatchContent(targetLang, charLimits, {
        includeTableOfContents: !noToc,
        priorityThreshold: priority
      });
      
      this.displayBatchResults(results, charLimits);
      this.logSuccess(`Batch composition completed for ${targetLang}`);

    } catch (error) {
      this.logError(`Failed to batch compose content: ${error}`);
      throw error;
    }
  }

  /**
   * compose stats 실행
   */
  private async executeStats(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || args.positional[0] || 'ko';
    const detailed = args.flags.detailed;

    try {
      this.logInfo(`Composition Statistics for language: ${targetLang}`);
      
      const { AdaptiveComposer } = await import('../../core/AdaptiveComposer.js');
      const config = await this.loadConfig();
      const adaptiveComposer = new AdaptiveComposer(config);
      
      const stats = await adaptiveComposer.getCompositionStats(targetLang);
      this.displayCompositionStats(stats, detailed);

    } catch (error) {
      this.logError(`Failed to get composition statistics: ${error}`);
      throw error;
    }
  }

  /**
   * compose markdown 실행
   */
  private async executeMarkdown(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || args.positional[0];
    const charsStr = args.options.chars;
    const overwrite = args.flags.overwrite;
    const allLanguages = args.flags['all-languages'];

    if (this.isDryRun(args)) {
      if (allLanguages) {
        this.logInfo(`[DRY RUN] Would generate markdown files for all languages`);
      } else {
        this.logInfo(`[DRY RUN] Would generate markdown files for language: ${targetLang || 'default'}`);
      }
      if (charsStr) this.logInfo(`[DRY RUN] Character limits: ${charsStr}`);
      if (overwrite) this.logInfo('[DRY RUN] Would overwrite existing files');
      return;
    }

    try {
      const { MarkdownGenerator } = await import('../../core/MarkdownGenerator.js');
      const config = await this.loadConfig();
      const markdownGenerator = new MarkdownGenerator(config);
      
      if (allLanguages) {
        this.logProgress('Generating markdown files for all configured languages...');
        const languages = config.generation?.supportedLanguages || ['en', 'ko'];
        
        const results = [];
        for (const lang of languages) {
          this.logProgress(`Generating markdown files for ${lang}...`);
          const charLimits = charsStr 
            ? charsStr.split(',').map(Number)
            : config.generation?.characterLimits || [100, 300, 1000];
          
          const result = await markdownGenerator.generateByCharacterLimits(lang, charLimits, {
            dryRun: false,
            overwrite
          });
          results.push({ language: lang, result });
        }
        
        this.displayMarkdownResults(results);
      } else {
        if (!targetLang) {
          this.logError('Language is required for markdown generation');
          this.logInfo('Usage: compose markdown <language> [options] or use --all-languages');
          return;
        }
        
        this.logProgress(`Generating markdown files for language: ${targetLang}`);
        
        const charLimits = charsStr 
          ? charsStr.split(',').map(Number)
          : config.generation?.characterLimits || [100, 300, 1000];
        
        const result = await markdownGenerator.generateByCharacterLimits(targetLang, charLimits, {
          dryRun: false,
          overwrite
        });
        
        this.displayMarkdownResults([{ language: targetLang, result }]);
      }
      
      this.logSuccess('Markdown generation completed');

    } catch (error) {
      this.logError(`Failed to generate markdown files: ${error}`);
      throw error;
    }
  }

  /**
   * compose markdown-all 실행
   */
  private async executeMarkdownAll(args: CLIArgs): Promise<void> {
    const languagesStr = args.options.languages || args.options.lang;
    const charsStr = args.options.chars;
    const overwrite = args.flags.overwrite;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate all markdown files`);
      if (languagesStr) this.logInfo(`[DRY RUN] Languages: ${languagesStr}`);
      if (charsStr) this.logInfo(`[DRY RUN] Character limits: ${charsStr}`);
      if (overwrite) this.logInfo('[DRY RUN] Would overwrite existing files');
      return;
    }

    try {
      this.logProgress('Generating all markdown files...');
      
      const { MarkdownGenerator } = await import('../../core/MarkdownGenerator.js');
      const config = await this.loadConfig();
      const markdownGenerator = new MarkdownGenerator(config);
      
      const languages = languagesStr 
        ? languagesStr.split(',').map(lang => lang.trim())
        : config.generation?.supportedLanguages || ['en', 'ko'];
      
      const charLimits = charsStr 
        ? charsStr.split(',').map(Number)
        : config.generation?.characterLimits || [100, 300, 1000];
      
      const result = await markdownGenerator.generateMarkdownFiles({
        languages,
        characterLimits: charLimits,
        dryRun: false,
        overwrite
      });
      
      this.displayMarkdownAllResults(result);
      this.logSuccess('All markdown files generated successfully');

    } catch (error) {
      this.logError(`Failed to generate all markdown files: ${error}`);
      throw error;
    }
  }

  /**
   * 구성 결과 표시
   */
  private displayCompositionResults(result: any): void {
    console.log(`\n📊 Composition Results:`);
    console.log(`  Target characters: ${result.summary?.targetCharacters || 0}`);
    console.log(`  Actual characters: ${result.summary?.totalCharacters || 0}`);
    console.log(`  Utilization: ${result.summary?.utilization?.toFixed(1) || 0}%`);
    console.log(`  Documents included: ${result.summary?.documentsIncluded || 0}`);
    console.log(`  TOC characters: ${result.summary?.tocCharacters || 0}`);
    console.log(`  Content characters: ${result.summary?.contentCharacters || 0}`);
    
    if (result.documents && result.documents.length > 0) {
      console.log(`\n📄 Documents included:`);
      result.documents.forEach((doc: any) => {
        console.log(`  • ${doc.id} (${doc.characters} chars, priority: ${doc.priority})`);
      });
    }
    
    // Verbose content display can be added if needed
    // console.log(`\n📝 Generated Content:\n${result.content}`);
  }

  /**
   * 배치 결과 표시
   */
  private displayBatchResults(results: any[], charLimits: number[]): void {
    console.log(`\n📊 Batch Composition Results:`);
    
    results.forEach((result, index) => {
      const limit = charLimits[index];
      console.log(`\n📏 Character Limit: ${limit}`);
      console.log(`  Target: ${result.summary?.targetCharacters || 0} chars`);
      console.log(`  Actual: ${result.summary?.totalCharacters || 0} chars`);
      console.log(`  Utilization: ${result.summary?.utilization?.toFixed(1) || 0}%`);
      console.log(`  Documents: ${result.summary?.documentsIncluded || 0}`);
    });
  }

  /**
   * 구성 통계 표시
   */
  private displayCompositionStats(stats: any, detailed: boolean): void {
    console.log(`\n📊 Composition Statistics:`);
    console.log(`  Total documents: ${stats.totalDocuments || 0}`);
    console.log(`  Documents with content: ${stats.documentsWithContent || 0}`);
    console.log(`  Average priority: ${stats.averagePriority?.toFixed(1) || 0}`);
    console.log(`  Available character limits: ${stats.availableCharacterLimits?.join(', ') || 'None'}`);
    console.log(`  Total content size: ${((stats.totalContentSize || 0) / 1024).toFixed(1)}KB`);
    
    if (detailed && stats.details) {
      console.log(`\n📋 Detailed Statistics:`);
      Object.entries(stats.details).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
  }

  /**
   * 마크다운 결과 표시
   */
  private displayMarkdownResults(results: Array<{ language: string; result: any }>): void {
    console.log(`\n📝 Markdown Generation Results:`);
    
    let totalGenerated = 0;
    let totalErrors = 0;
    
    results.forEach(({ language, result }) => {
      console.log(`\n🌐 Language: ${language}`);
      console.log(`  Generated: ${result.summary?.totalGenerated || 0} files`);
      console.log(`  Errors: ${result.summary?.totalErrors || 0}`);
      
      totalGenerated += result.summary?.totalGenerated || 0;
      totalErrors += result.summary?.totalErrors || 0;
      
      if (result.summary?.byCharacterLimit) {
        console.log(`  By character limit:`);
        Object.entries(result.summary.byCharacterLimit).forEach(([limit, count]) => {
          console.log(`    ${limit} chars: ${count} files`);
        });
      }
    });
    
    if (results.length > 1) {
      console.log(`\n📊 Total Summary:`);
      console.log(`  Total generated: ${totalGenerated} files`);
      console.log(`  Total errors: ${totalErrors}`);
    }
  }

  /**
   * 마크다운 전체 결과 표시
   */
  private displayMarkdownAllResults(result: any): void {
    console.log(`\n📝 Markdown All Generation Results:`);
    console.log(`  Total generated: ${result.summary?.totalGenerated || 0} files`);
    console.log(`  Total errors: ${result.summary?.totalErrors || 0}`);
    
    if (result.summary?.byLanguage) {
      console.log(`\n🌐 By Language:`);
      Object.entries(result.summary.byLanguage).forEach(([lang, count]) => {
        console.log(`  ${lang}: ${count} files`);
      });
    }
    
    if (result.summary?.byCharacterLimit) {
      console.log(`\n📏 By Character Limit:`);
      Object.entries(result.summary.byCharacterLimit).forEach(([limit, count]) => {
        console.log(`  ${limit} chars: ${count} files`);
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.slice(0, 5).forEach((error: any) => {
        console.log(`  • ${error.file}: ${error.message}`);
      });
      
      if (result.errors.length > 5) {
        console.log(`  ... and ${result.errors.length - 5} more errors`);
      }
    }
  }

  /**
   * 도움말 출력 (오버라이드)
   */
  protected showHelp(): void {
    console.log('\n🎵 compose - Content composition and markdown generation');
    console.log('\nUSAGE:');
    console.log('  compose <type> [options]');
    
    console.log('\nTYPES:');
    for (const [name, subcommand] of Object.entries(this.subcommands)) {
      console.log(`  ${name.padEnd(12)} ${subcommand.description}`);
    }
    
    console.log('\nEXAMPLES:');
    for (const example of this.examples) {
      console.log(`  ${example}`);
    }
    
    console.log('\nFor detailed help on specific type:');
    console.log('  compose <type> --help');
  }
}