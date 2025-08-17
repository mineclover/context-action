/**
 * 우선순위 관리 통합 명령어
 * 기존: priority-generate, template-generate, priority-stats, discover, analyze-priority, 
 *       check-priority-status, simple-check, migrate-to-simple, simple-llms-*, llms-generate
 * 신규: priority <action> [options]
 */

import { BaseCommand } from '../core/BaseCommand.js';
import type { CLIArgs, CLISubcommand } from '../types/CommandTypes.js';

export class PriorityCommand extends BaseCommand {
  name = 'priority';
  description = 'Priority and document management';
  aliases = ['pri'];

  subcommands: Record<string, CLISubcommand> = {
    generate: {
      name: 'generate',
      description: 'Generate priority.json files for all documents',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'en'
        },
        {
          name: 'overwrite',
          description: 'Overwrite existing priority files',
          type: 'boolean'
        }
      ],
      examples: [
        'priority generate en',
        'priority generate ko --overwrite',
        'priority generate --dry-run'
      ],
      execute: this.executeGenerate.bind(this)
    },

    template: {
      name: 'template',
      description: 'Generate individual summary document templates',
      examples: [
        'priority template',
        'priority template --dry-run'
      ],
      execute: this.executeTemplate.bind(this)
    },

    stats: {
      name: 'stats',
      description: 'Show priority generation statistics',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'en'
        },
        {
          name: 'detailed',
          description: 'Show detailed statistics',
          type: 'boolean'
        }
      ],
      examples: [
        'priority stats',
        'priority stats ko --detailed'
      ],
      execute: this.executeStats.bind(this)
    },

    discover: {
      name: 'discover',
      description: 'Discover all available documents',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'en'
        }
      ],
      examples: [
        'priority discover',
        'priority discover ko'
      ],
      execute: this.executeDiscover.bind(this)
    },

    analyze: {
      name: 'analyze',
      description: 'Analyze Priority JSON work status and completion',
      options: [
        {
          name: 'data-dir',
          alias: 'd',
          description: 'Data directory path',
          type: 'string',
          default: './data'
        },
        {
          name: 'languages',
          alias: 'l',
          description: 'Target languages (comma-separated)',
          type: 'string',
          default: 'ko,en'
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['json', 'table', 'summary'],
          default: 'table'
        },
        {
          name: 'output',
          alias: 'o',
          description: 'Output file path',
          type: 'string'
        },
        {
          name: 'cache',
          description: 'Enable caching',
          type: 'boolean'
        },
        {
          name: 'detailed',
          description: 'Show detailed analysis',
          type: 'boolean'
        }
      ],
      examples: [
        'priority analyze',
        'priority analyze --format=summary --detailed',
        'priority analyze --languages=ko --output=report.json'
      ],
      execute: this.executeAnalyze.bind(this)
    },

    check: {
      name: 'check',
      description: 'Check priority file status and validation',
      options: [
        {
          name: 'language',
          alias: 'l',
          description: 'Target language',
          type: 'string'
        },
        {
          name: 'document-id',
          alias: 'd',
          description: 'Specific document ID',
          type: 'string'
        },
        {
          name: 'fix',
          description: 'Auto-fix issues',
          type: 'boolean'
        },
        {
          name: 'migrate',
          description: 'Migrate to new format',
          type: 'boolean'
        }
      ],
      examples: [
        'priority check',
        'priority check --language=ko --fix',
        'priority check --document-id=guide-action-handlers'
      ],
      execute: this.executeCheck.bind(this)
    },

    simple: {
      name: 'simple',
      description: 'Simplified priority and markdown work status check',
      options: [
        {
          name: 'language',
          alias: 'l',
          description: 'Target language',
          type: 'string'
        },
        {
          name: 'document-id',
          alias: 'd',
          description: 'Specific document ID',
          type: 'string'
        },
        {
          name: 'check-markdown',
          alias: 'm',
          description: 'Check markdown files',
          type: 'boolean'
        },
        {
          name: 'fix',
          description: 'Auto-fix issues',
          type: 'boolean'
        }
      ],
      examples: [
        'priority simple',
        'priority simple --language=ko --check-markdown',
        'priority simple --fix'
      ],
      execute: this.executeSimple.bind(this)
    },

    migrate: {
      name: 'migrate',
      description: 'Migrate complex Priority JSON to simplified format',
      options: [
        {
          name: 'language',
          alias: 'l',
          description: 'Target language',
          type: 'string'
        },
        {
          name: 'document-id',
          alias: 'd',
          description: 'Specific document ID',
          type: 'string'
        },
        {
          name: 'backup',
          description: 'Create backup before migration',
          type: 'boolean',
          default: true
        }
      ],
      examples: [
        'priority migrate',
        'priority migrate --language=ko --backup',
        'priority migrate --document-id=api-spec --dry-run'
      ],
      execute: this.executeMigrate.bind(this)
    },

    llms: {
      name: 'llms',
      description: 'Generate simple LLMS by combining .md files',
      options: [
        {
          name: 'character-limit',
          alias: 'c',
          description: 'Character limit for generation',
          type: 'number'
        },
        {
          name: 'language',
          alias: 'l',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        },
        {
          name: 'output-dir',
          alias: 'o',
          description: 'Output directory',
          type: 'string'
        },
        {
          name: 'sort-by',
          description: 'Sort method',
          type: 'string',
          choices: ['priority', 'name', 'date'],
          default: 'priority'
        },
        {
          name: 'no-metadata',
          description: 'Exclude metadata',
          type: 'boolean'
        }
      ],
      examples: [
        'priority llms 100',
        'priority llms 500 --language=en',
        'priority llms 1000 --sort-by=name --no-metadata'
      ],
      execute: this.executeLlms.bind(this)
    },

    batch: {
      name: 'batch',
      description: 'Batch generate simple LLMS for multiple character limits',
      options: [
        {
          name: 'language',
          alias: 'l',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        },
        {
          name: 'character-limits',
          alias: 'c',
          description: 'Character limits (comma-separated)',
          type: 'string',
          default: '100,300,1000'
        },
        {
          name: 'output-dir',
          alias: 'o',
          description: 'Output directory',
          type: 'string'
        },
        {
          name: 'sort-by',
          description: 'Sort method',
          type: 'string',
          choices: ['priority', 'name', 'date'],
          default: 'priority'
        },
        {
          name: 'no-metadata',
          description: 'Exclude metadata',
          type: 'boolean'
        }
      ],
      examples: [
        'priority batch',
        'priority batch --language=en --character-limits=100,500,1000',
        'priority batch --sort-by=name --no-metadata'
      ],
      execute: this.executeBatch.bind(this)
    },

    'stats-llms': {
      name: 'stats-llms',
      description: 'Show simple LLMS generation statistics',
      options: [
        {
          name: 'language',
          alias: 'l',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        },
        {
          name: 'character-limit',
          alias: 'c',
          description: 'Specific character limit',
          type: 'number'
        }
      ],
      examples: [
        'priority stats-llms',
        'priority stats-llms --language=en',
        'priority stats-llms --character-limit=100'
      ],
      execute: this.executeStatsLlms.bind(this)
    },

    auto: {
      name: 'auto',
      description: 'Auto-generate LLMS for ready documents',
      options: [
        {
          name: 'document-id',
          description: 'Specific document ID',
          type: 'string'
        },
        {
          name: 'language',
          description: 'Target language',
          type: 'string'
        },
        {
          name: 'force',
          description: 'Force generation',
          type: 'boolean'
        }
      ],
      examples: [
        'priority auto',
        'priority auto --language=ko',
        'priority auto --document-id=guide-action-handlers --force'
      ],
      execute: this.executeAuto.bind(this)
    }
  };

  examples = [
    'priority generate en --overwrite',
    'priority stats ko --detailed',
    'priority discover',
    'priority analyze --format=summary',
    'priority check --fix',
    'priority llms 100 --language=ko',
    'priority batch --character-limits=100,500,1000'
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
      this.logError(`Unknown priority action: ${action}`);
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
   * priority generate 실행
   */
  private async executeGenerate(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || 'en';
    const overwrite = args.flags.overwrite;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate priority files for language: ${targetLang}`);
      if (overwrite) this.logInfo('[DRY RUN] Would overwrite existing files');
      return;
    }

    try {
      this.logProgress(`Generating priority files for language: ${targetLang}`);
      
      const { PriorityGenerator } = await import('../../core/PriorityGenerator.js');
      const config = await this.loadConfig();
      const priorityGenerator = new PriorityGenerator(config);
      
      await priorityGenerator.initialize();
      await priorityGenerator.generateAll(targetLang, overwrite);
      
      this.logSuccess(`Priority files generated for ${targetLang}`);

    } catch (error) {
      this.logError(`Failed to generate priority files: ${error}`);
      throw error;
    }
  }

  /**
   * priority template 실행
   */
  private async executeTemplate(args: CLIArgs): Promise<void> {
    if (this.isDryRun(args)) {
      this.logInfo('[DRY RUN] Would generate individual summary document templates');
      return;
    }

    try {
      this.logProgress('Generating individual summary document templates for all priority files...');
      
      const { TemplateGenerator } = await import('../../core/TemplateGenerator.js');
      const config = await this.loadConfig();
      const templateGenerator = new TemplateGenerator(config);
      
      await templateGenerator.generateAllTemplates();
      this.logSuccess('Template generation completed successfully!');

    } catch (error) {
      this.logError(`Failed to generate templates: ${error}`);
      throw error;
    }
  }

  /**
   * priority stats 실행
   */
  private async executeStats(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || 'en';
    const detailed = args.flags.detailed;

    try {
      this.logInfo(`Priority Statistics for language: ${targetLang}`);
      
      const { PriorityGenerator } = await import('../../core/PriorityGenerator.js');
      const config = await this.loadConfig();
      const priorityGenerator = new PriorityGenerator(config);
      
      await priorityGenerator.initialize();
      const stats = await priorityGenerator.getGenerationStats(targetLang);
      
      this.displayStats(stats, detailed);

    } catch (error) {
      this.logError(`Failed to get priority statistics: ${error}`);
      throw error;
    }
  }

  /**
   * priority discover 실행
   */
  private async executeDiscover(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || 'en';

    try {
      this.logInfo(`Discovering documents for language: ${targetLang}`);
      
      const { PriorityGenerator } = await import('../../core/PriorityGenerator.js');
      const config = await this.loadConfig();
      const priorityGenerator = new PriorityGenerator(config);
      
      const documents = await priorityGenerator.discoverDocuments(targetLang);
      this.logInfo(`Found ${documents.length} documents:`);
      
      for (const doc of documents) {
        console.log(`  • ${doc.id} (${doc.category})`);
      }

    } catch (error) {
      this.logError(`Failed to discover documents: ${error}`);
      throw error;
    }
  }

  /**
   * priority analyze 실행
   */
  private async executeAnalyze(args: CLIArgs): Promise<void> {
    try {
      // Import and execute the existing analyze-priority command
      const { PriorityStatusAnalyzer } = await import('../../core/PriorityStatusAnalyzer.js');
      
      const dataDir = args.options['data-dir'] || './data';
      const languages = args.options.languages?.split(',') || ['ko', 'en'];
      const format = args.options.format || 'table';
      const outputFile = args.options.output;
      const cache = args.flags.cache;
      const detailed = args.flags.detailed;

      if (this.isDryRun(args)) {
        this.logInfo(`[DRY RUN] Would analyze priority status`);
        this.logInfo(`Data dir: ${dataDir}`);
        this.logInfo(`Languages: ${languages.join(', ')}`);
        this.logInfo(`Format: ${format}`);
        return;
      }

      this.logProgress('Analyzing priority status...');
      
      const analyzer = new PriorityStatusAnalyzer(dataDir);
      const results = await analyzer.analyze(languages, { cache, detailed });
      
      await this.displayAnalysisResults(results, format, outputFile);

    } catch (error) {
      this.logError(`Failed to analyze priority status: ${error}`);
      throw error;
    }
  }

  /**
   * priority check 실행
   */
  private async executeCheck(args: CLIArgs): Promise<void> {
    try {
      // Import and execute the existing check-priority-status command
      const { createCheckPriorityStatusCommand } = await import('../commands/check-priority-status.js');
      
      const command = createCheckPriorityStatusCommand();
      const options = [];
      
      if (args.options.language) options.push('--language', args.options.language);
      if (args.options['document-id']) options.push('--document-id', args.options['document-id']);
      if (args.flags.fix) options.push('--fix');
      if (args.flags.migrate) options.push('--migrate');
      if (this.isVerbose(args)) options.push('--verbose');
      if (this.isDryRun(args)) options.push('--dry-run');

      await command.parseAsync(['node', 'check-priority-status', ...options]);

    } catch (error: any) {
      if (error.code !== 'commander.helpDisplayed') {
        this.logError(`Failed to check priority status: ${error}`);
        throw error;
      }
    }
  }

  /**
   * priority simple 실행
   */
  private async executeSimple(args: CLIArgs): Promise<void> {
    try {
      // Import and execute the existing simple-check command
      const { createSimplePriorityCheckCommand } = await import('../commands/simple-priority-check.js');
      
      const command = createSimplePriorityCheckCommand();
      const options = [];
      
      if (args.options.language) options.push('--language', args.options.language);
      if (args.options['document-id']) options.push('--document-id', args.options['document-id']);
      if (args.flags['check-markdown']) options.push('--check-markdown');
      if (args.flags.fix) options.push('--fix');
      if (this.isVerbose(args)) options.push('--verbose');

      await command.parseAsync(['node', 'simple-check', ...options]);

    } catch (error: any) {
      if (error.code !== 'commander.helpDisplayed') {
        this.logError(`Failed to run simple check: ${error}`);
        throw error;
      }
    }
  }

  /**
   * priority migrate 실행
   */
  private async executeMigrate(args: CLIArgs): Promise<void> {
    try {
      // Import and execute the existing migrate-to-simple command
      const { createMigrateToSimpleCommand } = await import('../commands/migrate-to-simple.js');
      
      const command = createMigrateToSimpleCommand();
      const options = [];
      
      if (args.options.language) options.push('--language', args.options.language);
      if (args.options['document-id']) options.push('--document-id', args.options['document-id']);
      if (args.flags.backup) options.push('--backup');
      if (this.isDryRun(args)) options.push('--dry-run');
      if (this.isVerbose(args)) options.push('--verbose');

      await command.parseAsync(['node', 'migrate-to-simple', ...options]);

    } catch (error: any) {
      if (error.code !== 'commander.helpDisplayed') {
        this.logError(`Failed to migrate: ${error}`);
        throw error;
      }
    }
  }

  /**
   * priority llms 실행
   */
  private async executeLlms(args: CLIArgs): Promise<void> {
    try {
      // Import and execute the existing simple-llms-generate command
      const { createSimpleLLMSGenerateCommand } = await import('../commands/simple-llms-generate.js');
      
      const command = createSimpleLLMSGenerateCommand();
      const options = [];
      
      // Character limit is first positional argument
      if (args.positional[0]) options.push(args.positional[0]);
      
      if (args.options.language) options.push('--language', args.options.language);
      if (args.options['output-dir']) options.push('--output-dir', args.options['output-dir']);
      if (args.options['sort-by']) options.push('--sort-by', args.options['sort-by']);
      if (args.flags['no-metadata']) options.push('--no-metadata');
      if (this.isDryRun(args)) options.push('--dry-run');
      if (this.isVerbose(args)) options.push('--verbose');

      await command.parseAsync(['node', 'simple-llms-generate', ...options]);

    } catch (error: any) {
      if (error.code !== 'commander.helpDisplayed') {
        this.logError(`Failed to generate simple LLMS: ${error}`);
        throw error;
      }
    }
  }

  /**
   * priority batch 실행
   */
  private async executeBatch(args: CLIArgs): Promise<void> {
    try {
      // Import and execute the existing simple-llms-batch command
      const { createSimpleLLMSBatchCommand } = await import('../commands/simple-llms-generate.js');
      
      const command = createSimpleLLMSBatchCommand();
      const options = [];
      
      if (args.options.language) options.push('--language', args.options.language);
      if (args.options['character-limits']) options.push('--character-limits', args.options['character-limits']);
      if (args.options['output-dir']) options.push('--output-dir', args.options['output-dir']);
      if (args.options['sort-by']) options.push('--sort-by', args.options['sort-by']);
      if (args.flags['no-metadata']) options.push('--no-metadata');
      if (this.isDryRun(args)) options.push('--dry-run');
      if (this.isVerbose(args)) options.push('--verbose');

      await command.parseAsync(['node', 'simple-llms-batch', ...options]);

    } catch (error: any) {
      if (error.code !== 'commander.helpDisplayed') {
        this.logError(`Failed to generate batch simple LLMS: ${error}`);
        throw error;
      }
    }
  }

  /**
   * priority stats-llms 실행
   */
  private async executeStatsLlms(args: CLIArgs): Promise<void> {
    try {
      // Import and execute the existing simple-llms-stats command
      const { createSimpleLLMSStatsCommand } = await import('../commands/simple-llms-generate.js');
      
      const command = createSimpleLLMSStatsCommand();
      const options = [];
      
      if (args.options.language) options.push('--language', args.options.language);
      if (args.options['character-limit']) options.push('--character-limit', args.options['character-limit'].toString());

      await command.parseAsync(['node', 'simple-llms-stats', ...options]);

    } catch (error: any) {
      if (error.code !== 'commander.helpDisplayed') {
        this.logError(`Failed to get simple LLMS stats: ${error}`);
        throw error;
      }
    }
  }

  /**
   * priority auto 실행
   */
  private async executeAuto(args: CLIArgs): Promise<void> {
    try {
      // Import and execute the existing llms-generate command
      const { createLLMSGenerateCommand } = await import('../commands/llms-generate.js');
      
      const command = createLLMSGenerateCommand();
      const options = [];
      
      if (args.options['document-id']) options.push('--document-id', args.options['document-id']);
      if (args.options.language) options.push('--language', args.options.language);
      if (args.flags.force) options.push('--force');
      if (this.isDryRun(args)) options.push('--dry-run');

      await command.parseAsync(['node', 'llms-generate', ...options]);

    } catch (error: any) {
      if (error.code !== 'commander.helpDisplayed') {
        this.logError(`Failed to auto-generate LLMS: ${error}`);
        throw error;
      }
    }
  }

  /**
   * 통계 정보 표시
   */
  private displayStats(stats: any, detailed: boolean): void {
    console.log(`\n📊 Priority Generation Statistics:`);
    console.log(`  Total documents: ${stats.totalDocuments || 0}`);
    console.log(`  Generated priorities: ${stats.generatedPriorities || 0}`);
    console.log(`  Success rate: ${stats.successRate || 0}%`);
    
    if (detailed && stats.details) {
      console.log(`\n📋 Detailed breakdown:`);
      for (const [category, count] of Object.entries(stats.details)) {
        console.log(`  ${category}: ${count}`);
      }
    }
  }

  /**
   * 분석 결과 표시
   */
  private async displayAnalysisResults(results: any, format: string, outputFile?: string): Promise<void> {
    let output = '';
    
    switch (format) {
      case 'json':
        output = JSON.stringify(results, null, 2);
        break;
      case 'table':
        output = this.formatAsTable(results);
        break;
      case 'summary':
        output = this.formatAsSummary(results);
        break;
      default:
        output = JSON.stringify(results, null, 2);
    }

    if (outputFile) {
      const { promises: fs } = await import('fs');
      await fs.writeFile(outputFile, output, 'utf-8');
      this.logSuccess(`Analysis results saved to ${outputFile}`);
    } else {
      console.log(output);
    }
  }

  /**
   * 테이블 형식으로 포맷
   */
  private formatAsTable(results: any): string {
    // 실제 구현에서는 더 복잡한 테이블 포맷 로직 구현
    return `\n📊 Priority Analysis Results:\n${JSON.stringify(results, null, 2)}`;
  }

  /**
   * 요약 형식으로 포맷
   */
  private formatAsSummary(results: any): string {
    // 실제 구현에서는 요약 포맷 로직 구현
    return `\n📋 Summary:\n${JSON.stringify(results, null, 2)}`;
  }

  /**
   * 도움말 출력 (오버라이드)
   */
  protected showHelp(): void {
    console.log('\n📋 priority - Priority and document management');
    console.log('\nUSAGE:');
    console.log('  priority <action> [options]');
    
    console.log('\nACTIONS:');
    for (const [name, subcommand] of Object.entries(this.subcommands)) {
      console.log(`  ${name.padEnd(12)} ${subcommand.description}`);
    }
    
    console.log('\nEXAMPLES:');
    for (const example of this.examples) {
      console.log(`  ${example}`);
    }
    
    console.log('\nFor detailed help on specific action:');
    console.log('  priority <action> --help');
  }
}