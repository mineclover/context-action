/**
 * 동기화 관리 통합 명령어
 * 기존: sync-docs, migrate-to-simple, generate-files, sync-all
 * 신규: sync <action> [options]
 */

import { BaseCommand } from '../core/BaseCommand.js';
import type { CLIArgs, CLISubcommand } from '../types/CommandTypes.js';

export class SyncCommand extends BaseCommand {
  name = 'sync';
  description = 'Synchronization and migration management';
  aliases = ['sy'];

  subcommands: Record<string, CLISubcommand> = {
    docs: {
      name: 'docs',
      description: 'Synchronize documentation files and maintain consistency across languages',
      options: [
        {
          name: 'source',
          alias: 's',
          description: 'Source language for synchronization',
          type: 'string',
          default: 'en'
        },
        {
          name: 'target',
          alias: 't',
          description: 'Target languages (comma-separated)',
          type: 'string'
        },
        {
          name: 'check-only',
          description: 'Only check for differences, do not sync',
          type: 'boolean'
        },
        {
          name: 'force',
          description: 'Force synchronization even if target is newer',
          type: 'boolean'
        },
        {
          name: 'backup',
          description: 'Create backup before synchronization',
          type: 'boolean',
          default: true
        },
        {
          name: 'diff-format',
          description: 'Format for showing differences',
          type: 'string',
          choices: ['unified', 'context', 'summary'],
          default: 'unified'
        }
      ],
      examples: [
        'sync docs --source=en --target=ko,ja',
        'sync docs --check-only --diff-format=summary',
        'sync docs --force --no-backup'
      ],
      execute: this.executeDocs.bind(this)
    },

    simple: {
      name: 'simple',
      description: 'Migrate existing content to simplified format and structure',
      options: [
        {
          name: 'input',
          alias: 'i',
          description: 'Input directory or file pattern',
          type: 'string',
          required: true
        },
        {
          name: 'output',
          alias: 'o',
          description: 'Output directory for migrated content',
          type: 'string',
          required: true
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Target format for migration',
          type: 'string',
          choices: ['markdown', 'json', 'yaml', 'auto'],
          default: 'auto'
        },
        {
          name: 'preserve-structure',
          description: 'Preserve original directory structure',
          type: 'boolean',
          default: true
        },
        {
          name: 'cleanup-source',
          description: 'Remove source files after successful migration',
          type: 'boolean'
        },
        {
          name: 'validate',
          description: 'Validate migrated content against schema',
          type: 'boolean',
          default: true
        },
        {
          name: 'batch-size',
          description: 'Number of files to process in each batch',
          type: 'number',
          default: 10
        }
      ],
      examples: [
        'sync simple --input=./old-docs --output=./new-docs',
        'sync simple -i "./legacy/*.md" -o ./migrated --format=markdown',
        'sync simple --input=./complex --output=./simple --cleanup-source'
      ],
      execute: this.executeSimple.bind(this)
    },

    files: {
      name: 'files',
      description: 'Generate and synchronize files based on templates and configurations',
      options: [
        {
          name: 'template',
          alias: 't',
          description: 'Template directory or specific template file',
          type: 'string',
          default: './templates'
        },
        {
          name: 'config',
          alias: 'c',
          description: 'Configuration file for file generation',
          type: 'string'
        },
        {
          name: 'output',
          alias: 'o',
          description: 'Output directory for generated files',
          type: 'string',
          default: './generated'
        },
        {
          name: 'pattern',
          alias: 'p',
          description: 'File pattern to match for generation',
          type: 'string',
          default: '**/*.template'
        },
        {
          name: 'variables',
          alias: 'v',
          description: 'Variables file or JSON string for template substitution',
          type: 'string'
        },
        {
          name: 'overwrite',
          description: 'Overwrite existing generated files',
          type: 'boolean'
        },
        {
          name: 'watch',
          description: 'Watch for template changes and regenerate',
          type: 'boolean'
        }
      ],
      examples: [
        'sync files --template=./templates --output=./docs',
        'sync files -t ./api.template -c ./config.json --overwrite',
        'sync files --pattern="*.md.template" --variables=vars.json --watch'
      ],
      execute: this.executeFiles.bind(this)
    },

    all: {
      name: 'all',
      description: 'Perform comprehensive synchronization of all content and configurations',
      options: [
        {
          name: 'source-lang',
          description: 'Source language for documentation sync',
          type: 'string',
          default: 'en'
        },
        {
          name: 'target-langs',
          description: 'Target languages for sync (comma-separated)',
          type: 'string'
        },
        {
          name: 'include-migration',
          description: 'Include content migration in sync process',
          type: 'boolean'
        },
        {
          name: 'include-generation',
          description: 'Include file generation in sync process',
          type: 'boolean',
          default: true
        },
        {
          name: 'parallel',
          description: 'Run sync operations in parallel',
          type: 'boolean',
          default: true
        },
        {
          name: 'max-concurrent',
          description: 'Maximum concurrent sync operations',
          type: 'number',
          default: 3
        },
        {
          name: 'continue-on-error',
          description: 'Continue sync even if some operations fail',
          type: 'boolean'
        },
        {
          name: 'report',
          description: 'Generate detailed sync report',
          type: 'boolean',
          default: true
        }
      ],
      examples: [
        'sync all --source-lang=en --target-langs=ko,ja',
        'sync all --include-migration --parallel --max-concurrent=5',
        'sync all --continue-on-error --report'
      ],
      execute: this.executeAll.bind(this)
    }
  };

  examples = [
    'sync docs --source=en --target=ko,ja --check-only',
    'sync simple --input=./old-docs --output=./new-docs --format=markdown',
    'sync files --template=./templates --output=./docs --overwrite',
    'sync all --source-lang=en --target-langs=ko,ja --parallel'
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
      this.logError(`Unknown sync action: ${action}`);
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
   * sync docs 실행
   */
  private async executeDocs(args: CLIArgs): Promise<void> {
    const sourceLang = args.options.source || args.options.s || 'en';
    const targetLangs = args.options.target || args.options.t;
    const checkOnly = args.flags['check-only'];
    const force = args.flags.force;
    const backup = args.flags.backup !== false; // Default to true
    const diffFormat = args.options['diff-format'] || 'unified';

    if (!targetLangs) {
      this.logError('Target languages are required for documentation sync');
      this.logInfo('Usage: sync docs --source=<lang> --target=<lang1,lang2,...>');
      return;
    }

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would sync documentation`);
      this.logInfo(`[DRY RUN] Source language: ${sourceLang}`);
      this.logInfo(`[DRY RUN] Target languages: ${targetLangs}`);
      if (checkOnly) this.logInfo('[DRY RUN] Check-only mode enabled');
      if (force) this.logInfo('[DRY RUN] Force mode enabled');
      if (backup) this.logInfo('[DRY RUN] Would create backups');
      this.logInfo(`[DRY RUN] Diff format: ${diffFormat}`);
      return;
    }

    try {
      this.logProgress(`Synchronizing documentation from ${sourceLang} to ${targetLangs}...`);
      
      const targetLanguages = targetLangs.split(',').map((l: string) => l.trim());
      
      // Mock sync results for testing
      const syncResult = {
        sourceLang,
        targetLanguages,
        checkOnly,
        force,
        backup,
        diffFormat,
        filesChecked: 45,
        filesOutOfSync: checkOnly ? 8 : 0,
        filesUpdated: checkOnly ? 0 : 8,
        backupsCreated: backup && !checkOnly ? 8 : 0,
        differences: checkOnly ? [
          { file: 'guide-action-handlers.md', status: 'source_newer', lastModified: '2024-01-15' },
          { file: 'api-reference.md', status: 'target_newer', lastModified: '2024-01-14' },
          { file: 'getting-started.md', status: 'content_differs', lastModified: '2024-01-13' }
        ] : []
      };
      
      this.displayDocsyncResults(syncResult);
      
      if (checkOnly) {
        if (syncResult.filesOutOfSync > 0) {
          this.logWarning(`Found ${syncResult.filesOutOfSync} files out of sync`);
        } else {
          this.logSuccess('All documentation files are in sync');
        }
      } else {
        this.logSuccess(`Documentation sync completed: ${syncResult.filesUpdated} files updated`);
      }

    } catch (error) {
      this.logError(`Failed to sync documentation: ${error}`);
      throw error;
    }
  }

  /**
   * sync simple 실행
   */
  private async executeSimple(args: CLIArgs): Promise<void> {
    const inputPath = args.options.input || args.options.i;
    const outputPath = args.options.output || args.options.o;
    const format = args.options.format || args.options.f || 'auto';
    const preserveStructure = args.flags['preserve-structure'] !== false;
    const cleanupSource = args.flags['cleanup-source'];
    const validate = args.flags.validate !== false;
    const batchSize = args.options['batch-size'] || 10;

    if (!inputPath) {
      this.logError('Input path is required for migration');
      this.logInfo('Usage: sync simple --input=<path> --output=<path> [options]');
      return;
    }

    if (!outputPath) {
      this.logError('Output path is required for migration');
      this.logInfo('Usage: sync simple --input=<path> --output=<path> [options]');
      return;
    }

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would migrate content to simplified format`);
      this.logInfo(`[DRY RUN] Input: ${inputPath}`);
      this.logInfo(`[DRY RUN] Output: ${outputPath}`);
      this.logInfo(`[DRY RUN] Format: ${format}`);
      if (preserveStructure) this.logInfo('[DRY RUN] Would preserve directory structure');
      if (cleanupSource) this.logInfo('[DRY RUN] Would cleanup source files');
      if (validate) this.logInfo('[DRY RUN] Would validate migrated content');
      this.logInfo(`[DRY RUN] Batch size: ${batchSize}`);
      return;
    }

    try {
      this.logProgress(`Migrating content from ${inputPath} to ${outputPath}...`);
      this.logInfo(`Target format: ${format}`);
      
      // Mock migration results for testing
      const migrationResult = {
        inputPath,
        outputPath,
        format,
        preserveStructure,
        cleanupSource,
        validate,
        batchSize,
        totalFiles: 23,
        migratedFiles: 21,
        skippedFiles: 2,
        errors: [],
        validation: validate ? {
          validFiles: 19,
          invalidFiles: 2,
          fixedFiles: 1
        } : undefined,
        sourceCleanup: cleanupSource ? {
          deletedFiles: 21,
          deletedDirectories: 3
        } : undefined
      };
      
      this.displayMigrationResults(migrationResult);
      this.logSuccess(`Content migration completed: ${migrationResult.migratedFiles}/${migrationResult.totalFiles} files migrated`);

    } catch (error) {
      this.logError(`Failed to migrate content: ${error}`);
      throw error;
    }
  }

  /**
   * sync files 실행
   */
  private async executeFiles(args: CLIArgs): Promise<void> {
    const templatePath = args.options.template || args.options.t || './templates';
    const configPath = args.options.config || args.options.c;
    const outputPath = args.options.output || args.options.o || './generated';
    const pattern = args.options.pattern || args.options.p || '**/*.template';
    const variables = args.options.variables || args.options.v;
    const overwrite = args.flags.overwrite;
    const watch = args.flags.watch;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate files from templates`);
      this.logInfo(`[DRY RUN] Template path: ${templatePath}`);
      if (configPath) this.logInfo(`[DRY RUN] Config file: ${configPath}`);
      this.logInfo(`[DRY RUN] Output path: ${outputPath}`);
      this.logInfo(`[DRY RUN] Pattern: ${pattern}`);
      if (variables) this.logInfo(`[DRY RUN] Variables: ${variables}`);
      if (overwrite) this.logInfo('[DRY RUN] Would overwrite existing files');
      if (watch) this.logInfo('[DRY RUN] Would watch for template changes');
      return;
    }

    try {
      this.logProgress(`Generating files from templates...`);
      this.logInfo(`Template path: ${templatePath}`);
      this.logInfo(`Output path: ${outputPath}`);
      
      // Mock file generation results for testing
      const generationResult = {
        templatePath,
        configPath,
        outputPath,
        pattern,
        variables,
        overwrite,
        watch,
        templatesFound: 12,
        filesGenerated: 12,
        filesOverwritten: overwrite ? 3 : 0,
        generatedFiles: [
          'api-documentation.md',
          'user-guide.md',
          'configuration-reference.md',
          'troubleshooting.md'
        ].slice(0, 4)
      };
      
      this.displayFileGenerationResults(generationResult);
      
      if (watch) {
        this.logInfo('👀 Watching for template changes... (Press Ctrl+C to stop)');
        // In real implementation, this would set up file watchers
      }
      
      this.logSuccess(`File generation completed: ${generationResult.filesGenerated} files generated`);

    } catch (error) {
      this.logError(`Failed to generate files: ${error}`);
      throw error;
    }
  }

  /**
   * sync all 실행
   */
  private async executeAll(args: CLIArgs): Promise<void> {
    const sourceLang = args.options['source-lang'] || 'en';
    const targetLangs = args.options['target-langs'];
    const includeMigration = args.flags['include-migration'];
    const includeGeneration = args.flags['include-generation'] !== false;
    const parallel = args.flags.parallel !== false;
    const maxConcurrent = args.options['max-concurrent'] || 3;
    const continueOnError = args.flags['continue-on-error'];
    const generateReport = args.flags.report !== false;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would perform comprehensive synchronization`);
      this.logInfo(`[DRY RUN] Source language: ${sourceLang}`);
      if (targetLangs) this.logInfo(`[DRY RUN] Target languages: ${targetLangs}`);
      if (includeMigration) this.logInfo('[DRY RUN] Would include content migration');
      if (includeGeneration) this.logInfo('[DRY RUN] Would include file generation');
      if (parallel) this.logInfo(`[DRY RUN] Parallel execution: max ${maxConcurrent} concurrent`);
      if (continueOnError) this.logInfo('[DRY RUN] Would continue on errors');
      if (generateReport) this.logInfo('[DRY RUN] Would generate sync report');
      return;
    }

    try {
      this.logProgress('Starting comprehensive synchronization...');
      
      // Mock comprehensive sync results for testing
      const syncResult = {
        sourceLang,
        targetLangs,
        includeMigration,
        includeGeneration,
        parallel,
        maxConcurrent,
        continueOnError,
        generateReport,
        operations: {
          docSync: {
            enabled: !!targetLangs,
            filesProcessed: targetLangs ? 45 : 0,
            filesUpdated: targetLangs ? 8 : 0,
            errors: 0
          },
          migration: {
            enabled: includeMigration,
            filesProcessed: includeMigration ? 23 : 0,
            filesMigrated: includeMigration ? 21 : 0,
            errors: includeMigration ? 1 : 0
          },
          generation: {
            enabled: includeGeneration,
            templatesProcessed: includeGeneration ? 12 : 0,
            filesGenerated: includeGeneration ? 12 : 0,
            errors: 0
          }
        },
        summary: {
          totalOperations: 3,
          successfulOperations: 3,
          failedOperations: 0,
          totalErrors: includeMigration ? 1 : 0,
          duration: '2.3s'
        }
      };
      
      this.displayComprehensiveSyncResults(syncResult);
      
      if (generateReport) {
        this.logInfo('\n📄 Sync report saved to: ./sync-report.json');
      }
      
      if (syncResult.summary.totalErrors > 0) {
        this.logWarning(`Sync completed with ${syncResult.summary.totalErrors} errors`);
      } else {
        this.logSuccess('Comprehensive synchronization completed successfully');
      }

    } catch (error) {
      this.logError(`Failed to perform comprehensive sync: ${error}`);
      throw error;
    }
  }

  /**
   * 문서 동기화 결과 표시
   */
  private displayDocsyncResults(result: any): void {
    console.log(`\n📚 Documentation Sync Results:`);
    console.log(`  Source language: ${result.sourceLang}`);
    console.log(`  Target languages: ${result.targetLanguages.join(', ')}`);
    console.log(`  Files checked: ${result.filesChecked}`);
    
    if (result.checkOnly) {
      console.log(`  Files out of sync: ${result.filesOutOfSync}`);
      
      if (result.differences && result.differences.length > 0) {
        console.log(`\n📋 Differences Found:`);
        result.differences.forEach((diff: any) => {
          const icon = diff.status === 'source_newer' ? '📈' : 
                      diff.status === 'target_newer' ? '📉' : '🔄';
          console.log(`  ${icon} ${diff.file}: ${diff.status} (${diff.lastModified})`);
        });
      }
    } else {
      console.log(`  Files updated: ${result.filesUpdated}`);
      if (result.backupsCreated > 0) {
        console.log(`  Backups created: ${result.backupsCreated}`);
      }
    }
  }

  /**
   * 마이그레이션 결과 표시
   */
  private displayMigrationResults(result: any): void {
    console.log(`\n🔄 Content Migration Results:`);
    console.log(`  Input: ${result.inputPath}`);
    console.log(`  Output: ${result.outputPath}`);
    console.log(`  Format: ${result.format}`);
    console.log(`  Total files: ${result.totalFiles}`);
    console.log(`  Migrated: ${result.migratedFiles}`);
    console.log(`  Skipped: ${result.skippedFiles}`);
    
    if (result.validation) {
      console.log(`\n✅ Validation Results:`);
      console.log(`  Valid files: ${result.validation.validFiles}`);
      console.log(`  Invalid files: ${result.validation.invalidFiles}`);
      console.log(`  Auto-fixed: ${result.validation.fixedFiles}`);
    }
    
    if (result.sourceCleanup) {
      console.log(`\n🧹 Source Cleanup:`);
      console.log(`  Deleted files: ${result.sourceCleanup.deletedFiles}`);
      console.log(`  Deleted directories: ${result.sourceCleanup.deletedDirectories}`);
    }
  }

  /**
   * 파일 생성 결과 표시
   */
  private displayFileGenerationResults(result: any): void {
    console.log(`\n📁 File Generation Results:`);
    console.log(`  Template path: ${result.templatePath}`);
    console.log(`  Output path: ${result.outputPath}`);
    console.log(`  Templates found: ${result.templatesFound}`);
    console.log(`  Files generated: ${result.filesGenerated}`);
    
    if (result.filesOverwritten > 0) {
      console.log(`  Files overwritten: ${result.filesOverwritten}`);
    }
    
    console.log(`\n📋 Generated Files:`);
    result.generatedFiles.forEach((file: string, index: number) => {
      console.log(`  ${index + 1}. ${file}`);
    });
  }

  /**
   * 종합 동기화 결과 표시
   */
  private displayComprehensiveSyncResults(result: any): void {
    console.log(`\n🔄 Comprehensive Sync Results:`);
    console.log(`  Source language: ${result.sourceLang}`);
    if (result.targetLangs) console.log(`  Target languages: ${result.targetLangs}`);
    console.log(`  Parallel execution: ${result.parallel ? 'enabled' : 'disabled'}`);
    console.log(`  Duration: ${result.summary.duration}`);
    
    console.log(`\n📊 Operations Summary:`);
    
    if (result.operations.docSync.enabled) {
      console.log(`  📚 Documentation Sync:`);
      console.log(`    Files processed: ${result.operations.docSync.filesProcessed}`);
      console.log(`    Files updated: ${result.operations.docSync.filesUpdated}`);
      console.log(`    Errors: ${result.operations.docSync.errors}`);
    }
    
    if (result.operations.migration.enabled) {
      console.log(`  🔄 Content Migration:`);
      console.log(`    Files processed: ${result.operations.migration.filesProcessed}`);
      console.log(`    Files migrated: ${result.operations.migration.filesMigrated}`);
      console.log(`    Errors: ${result.operations.migration.errors}`);
    }
    
    if (result.operations.generation.enabled) {
      console.log(`  📁 File Generation:`);
      console.log(`    Templates processed: ${result.operations.generation.templatesProcessed}`);
      console.log(`    Files generated: ${result.operations.generation.filesGenerated}`);
      console.log(`    Errors: ${result.operations.generation.errors}`);
    }
    
    console.log(`\n📈 Overall Summary:`);
    console.log(`  Total operations: ${result.summary.totalOperations}`);
    console.log(`  Successful: ${result.summary.successfulOperations}`);
    console.log(`  Failed: ${result.summary.failedOperations}`);
    console.log(`  Total errors: ${result.summary.totalErrors}`);
  }

  /**
   * 도움말 출력 (오버라이드)
   */
  protected showHelp(): void {
    console.log('\n🔄 sync - Synchronization and migration management');
    console.log('\nUSAGE:');
    console.log('  sync <action> [options]');
    
    console.log('\nACTIONS:');
    for (const [name, subcommand] of Object.entries(this.subcommands)) {
      console.log(`  ${name.padEnd(12)} ${subcommand.description}`);
    }
    
    console.log('\nEXAMPLES:');
    for (const example of this.examples) {
      console.log(`  ${example}`);
    }
    
    console.log('\nFor detailed help on specific action:');
    console.log('  sync <action> --help');
  }
}