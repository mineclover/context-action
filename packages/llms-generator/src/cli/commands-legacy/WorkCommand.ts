/**
 * 작업 관리 통합 명령어
 * 기존: work-status, work-context, work-list, work-check, instruction-generate, instruction-batch, instruction-template
 * 신규: work <action> [options]
 */

import { BaseCommand } from '../core/BaseCommand.js';
import type { CLIArgs, CLISubcommand } from '../types/CommandTypes.js';

export class WorkCommand extends BaseCommand {
  name = 'work';
  description = 'Work status and instruction management';
  aliases = ['wrk'];

  subcommands: Record<string, CLISubcommand> = {
    status: {
      name: 'status',
      description: 'Check work status for documents',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        },
        {
          name: 'document-id',
          alias: 'doc',
          description: 'Specific document ID',
          type: 'string'
        },
        {
          name: 'chars',
          description: 'Character limit',
          type: 'number',
          default: 100
        },
        {
          name: 'need-edit',
          description: 'Show only documents that need editing',
          type: 'boolean'
        }
      ],
      examples: [
        'work status ko',
        'work status ko guide-action-handlers',
        'work status ko --chars=100 --need-edit'
      ],
      execute: this.executeStatus.bind(this)
    },

    context: {
      name: 'context',
      description: 'Get complete work context for editing a document',
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
          description: 'Character limit',
          type: 'number',
          default: 100
        }
      ],
      examples: [
        'work context ko guide-action-handlers',
        'work context ko api-spec --chars=500'
      ],
      execute: this.executeContext.bind(this)
    },

    list: {
      name: 'list',
      description: 'List documents that need work',
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
          description: 'Character limit',
          type: 'number',
          default: 100
        },
        {
          name: 'outdated',
          description: 'Show outdated documents only',
          type: 'boolean'
        },
        {
          name: 'missing',
          description: 'Show missing documents only',
          type: 'boolean'
        },
        {
          name: 'need-update',
          description: 'Show documents that need updates',
          type: 'boolean'
        }
      ],
      examples: [
        'work list ko',
        'work list ko --chars=100 --missing',
        'work list ko --outdated --need-update'
      ],
      execute: this.executeList.bind(this)
    },

    check: {
      name: 'check',
      description: 'Enhanced work status check with config integration',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string'
        },
        {
          name: 'show-all',
          description: 'Show all documents',
          type: 'boolean'
        },
        {
          name: 'show-outdated',
          description: 'Show outdated documents',
          type: 'boolean'
        },
        {
          name: 'show-edited',
          description: 'Show edited documents',
          type: 'boolean'
        },
        {
          name: 'show-missing-config',
          description: 'Show documents with missing config',
          type: 'boolean'
        }
      ],
      examples: [
        'work check',
        'work check ko --show-all',
        'work check --show-edited --show-missing-config'
      ],
      execute: this.executeCheck.bind(this)
    },

    instruction: {
      name: 'instruction',
      description: 'Generate detailed instructions for document updates',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string'
        },
        {
          name: 'document-id',
          alias: 'doc',
          description: 'Specific document ID',
          type: 'string'
        },
        {
          name: 'template',
          description: 'Instruction template',
          type: 'string',
          default: 'default'
        },
        {
          name: 'chars',
          description: 'Character limits (comma-separated)',
          type: 'string'
        },
        {
          name: 'max-length',
          description: 'Maximum instruction length',
          type: 'number',
          default: 8000
        },
        {
          name: 'no-source',
          description: 'Exclude source content',
          type: 'boolean'
        },
        {
          name: 'no-summaries',
          description: 'Exclude summaries',
          type: 'boolean'
        },
        {
          name: 'overwrite',
          description: 'Overwrite existing instructions',
          type: 'boolean'
        }
      ],
      examples: [
        'work instruction ko guide-action-handlers',
        'work instruction ko api-spec --template=default --chars=100,300',
        'work instruction ko guide-setup --max-length=5000 --no-source'
      ],
      execute: this.executeInstruction.bind(this)
    },

    batch: {
      name: 'batch',
      description: 'Batch generate instructions for all documents',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string'
        },
        {
          name: 'template',
          description: 'Instruction template',
          type: 'string',
          default: 'default'
        },
        {
          name: 'chars',
          description: 'Character limits (comma-separated)',
          type: 'string'
        },
        {
          name: 'overwrite',
          description: 'Overwrite existing instructions',
          type: 'boolean'
        }
      ],
      examples: [
        'work batch ko',
        'work batch ko --template=detailed --chars=100,300,1000',
        'work batch ko --overwrite --dry-run'
      ],
      execute: this.executeBatch.bind(this)
    },

    template: {
      name: 'template',
      description: 'Manage instruction templates',
      options: [
        {
          name: 'action',
          description: 'Template action (list|show|create)',
          type: 'string',
          default: 'list',
          choices: ['list', 'show', 'create']
        },
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        },
        {
          name: 'name',
          description: 'Template name',
          type: 'string'
        }
      ],
      examples: [
        'work template list',
        'work template show ko default',
        'work template create ko detailed'
      ],
      execute: this.executeTemplate.bind(this)
    }
  };

  examples = [
    'work status ko --chars=100 --need-edit',
    'work context ko guide-action-handlers',
    'work list ko --missing --outdated',
    'work check --show-all',
    'work instruction ko api-spec --template=default',
    'work batch ko --chars=100,300,1000',
    'work template list'
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
      this.logError(`Unknown work action: ${action}`);
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
   * work status 실행
   */
  private async executeStatus(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || 'ko';
    const documentId = args.positional[0] || args.options['document-id'];
    const charLimit = args.options.chars || 100;
    const needEditOnly = args.flags['need-edit'];

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would check work status for language: ${targetLang}`);
      if (documentId) this.logInfo(`[DRY RUN] Document ID: ${documentId}`);
      this.logInfo(`[DRY RUN] Character limit: ${charLimit}`);
      if (needEditOnly) this.logInfo(`[DRY RUN] Show only documents that need editing`);
      return;
    }

    try {
      this.logProgress(`Checking work status for language: ${targetLang}`);
      
      const { WorkStatusManager } = await import('../../core/WorkStatusManager.js');
      const config = await this.loadConfig();
      const workStatusManager = new WorkStatusManager(config);
      
      if (documentId) {
        // Check specific document
        const status = await workStatusManager.getDocumentStatus(targetLang, documentId, charLimit);
        this.displayDocumentStatus(status, documentId);
      } else {
        // Check all documents
        const statusList = await workStatusManager.getAllDocumentStatus(targetLang, charLimit);
        this.displayStatusList(statusList, needEditOnly);
      }

    } catch (error) {
      this.logError(`Failed to check work status: ${error}`);
      throw error;
    }
  }

  /**
   * work context 실행
   */
  private async executeContext(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = args.positional[0] || language || 'ko';
    const documentId = args.positional[1];
    const charLimit = args.options.chars || 100;

    if (!documentId) {
      this.logError('Document ID is required for context command');
      this.logInfo('Usage: work context <language> <document-id> [options]');
      return;
    }

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would get work context for ${targetLang}/${documentId}`);
      this.logInfo(`[DRY RUN] Character limit: ${charLimit}`);
      return;
    }

    try {
      this.logProgress(`Getting work context for ${targetLang}/${documentId}`);
      
      const { WorkStatusManager } = await import('../../core/WorkStatusManager.js');
      const config = await this.loadConfig();
      const workStatusManager = new WorkStatusManager(config);
      
      const context = await workStatusManager.getWorkContext(targetLang, documentId, charLimit);
      this.displayWorkContext(context, documentId);

    } catch (error) {
      this.logError(`Failed to get work context: ${error}`);
      throw error;
    }
  }

  /**
   * work list 실행
   */
  private async executeList(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || 'ko';
    const charLimit = args.options.chars || 100;
    const outdated = args.flags.outdated;
    const missing = args.flags.missing;
    const needUpdate = args.flags['need-update'];

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would list work for language: ${targetLang}`);
      this.logInfo(`[DRY RUN] Character limit: ${charLimit}`);
      if (outdated) this.logInfo(`[DRY RUN] Filter: outdated documents`);
      if (missing) this.logInfo(`[DRY RUN] Filter: missing documents`);
      if (needUpdate) this.logInfo(`[DRY RUN] Filter: documents that need updates`);
      return;
    }

    try {
      this.logProgress(`Listing work for language: ${targetLang}`);
      
      const { WorkStatusManager } = await import('../../core/WorkStatusManager.js');
      const config = await this.loadConfig();
      const workStatusManager = new WorkStatusManager(config);
      
      const filters = { outdated, missing, needUpdate };
      const workList = await workStatusManager.getWorkList(targetLang, charLimit, filters);
      
      this.displayWorkList(workList, filters);

    } catch (error) {
      this.logError(`Failed to get work list: ${error}`);
      throw error;
    }
  }

  /**
   * work check 실행
   */
  private async executeCheck(args: CLIArgs): Promise<void> {
    try {
      // Import and execute the existing work-check command
      const { checkWorkStatus } = await import('../commands/work-check.js');
      
      const language = args.options.language;
      const showAll = args.flags['show-all'];
      const showOutdated = args.flags['show-outdated'];
      const showEdited = args.flags['show-edited'];
      const showMissingConfig = args.flags['show-missing-config'];

      if (this.isDryRun(args)) {
        this.logInfo(`[DRY RUN] Would run enhanced work check`);
        if (language) this.logInfo(`[DRY RUN] Language: ${language}`);
        if (showAll) this.logInfo(`[DRY RUN] Show all documents`);
        return;
      }

      await checkWorkStatus(language, {
        showAll,
        showOutdated,
        showEdited,
        showMissingConfig
      });

    } catch (error) {
      this.logError(`Failed to run work check: ${error}`);
      throw error;
    }
  }

  /**
   * work instruction 실행
   */
  private async executeInstruction(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = args.positional[0] || language || 'ko';
    const documentId = args.positional[1] || args.options['document-id'];
    const template = args.options.template || 'default';
    const charLimitsStr = args.options.chars;
    const maxLength = args.options['max-length'] || 8000;
    const noSource = args.flags['no-source'];
    const noSummaries = args.flags['no-summaries'];
    const overwrite = args.flags.overwrite;

    if (!documentId) {
      this.logError('Document ID is required for instruction generation');
      this.logInfo('Usage: work instruction <language> <document-id> [options]');
      return;
    }

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate instructions for ${targetLang}/${documentId}`);
      this.logInfo(`[DRY RUN] Template: ${template}`);
      if (charLimitsStr) this.logInfo(`[DRY RUN] Character limits: ${charLimitsStr}`);
      this.logInfo(`[DRY RUN] Max length: ${maxLength}`);
      return;
    }

    try {
      this.logProgress(`Generating instructions for ${targetLang}/${documentId}`);
      
      const { InstructionGenerator } = await import('../../core/InstructionGenerator.js');
      const config = await this.loadConfig();
      const instructionGenerator = new InstructionGenerator(config);
      
      const charLimits = charLimitsStr ? charLimitsStr.split(',').map(Number) : undefined;
      
      const options = {
        template,
        charLimits,
        maxLength,
        includeSource: !noSource,
        includeSummaries: !noSummaries,
        overwrite
      };
      
      await instructionGenerator.generateInstruction(targetLang, documentId, options);
      this.logSuccess(`Instructions generated for ${targetLang}/${documentId}`);

    } catch (error) {
      this.logError(`Failed to generate instructions: ${error}`);
      throw error;
    }
  }

  /**
   * work batch 실행
   */
  private async executeBatch(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || 'ko';
    const template = args.options.template || 'default';
    const charLimitsStr = args.options.chars;
    const overwrite = args.flags.overwrite;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate batch instructions for language: ${targetLang}`);
      this.logInfo(`[DRY RUN] Template: ${template}`);
      if (charLimitsStr) this.logInfo(`[DRY RUN] Character limits: ${charLimitsStr}`);
      if (overwrite) this.logInfo(`[DRY RUN] Would overwrite existing instructions`);
      return;
    }

    try {
      this.logProgress(`Generating batch instructions for language: ${targetLang}`);
      
      const { InstructionGenerator } = await import('../../core/InstructionGenerator.js');
      const config = await this.loadConfig();
      const instructionGenerator = new InstructionGenerator(config);
      
      const charLimits = charLimitsStr ? charLimitsStr.split(',').map(Number) : undefined;
      
      const options = {
        template,
        charLimits,
        overwrite
      };
      
      await instructionGenerator.generateBatchInstructions(targetLang, options);
      this.logSuccess(`Batch instructions generated for ${targetLang}`);

    } catch (error) {
      this.logError(`Failed to generate batch instructions: ${error}`);
      throw error;
    }
  }

  /**
   * work template 실행
   */
  private async executeTemplate(args: CLIArgs): Promise<void> {
    const action = args.positional[0] || args.options.action || 'list';
    const language = args.positional[1] || args.options.language || 'ko';
    const templateName = args.positional[2] || args.options.name;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would ${action} instruction templates`);
      this.logInfo(`[DRY RUN] Language: ${language}`);
      if (templateName) this.logInfo(`[DRY RUN] Template name: ${templateName}`);
      return;
    }

    try {
      const { InstructionGenerator } = await import('../../core/InstructionGenerator.js');
      const config = await this.loadConfig();
      const instructionGenerator = new InstructionGenerator(config);
      
      switch (action) {
        case 'list':
          this.logInfo(`Available instruction templates for ${language}:`);
          const templates = await instructionGenerator.listTemplates(language);
          this.displayTemplateList(templates);
          break;
          
        case 'show':
          if (!templateName) {
            this.logError('Template name is required for show action');
            return;
          }
          this.logInfo(`Template: ${language}/${templateName}`);
          const template = await instructionGenerator.getTemplate(language, templateName);
          this.displayTemplate(template);
          break;
          
        case 'create':
          if (!templateName) {
            this.logError('Template name is required for create action');
            return;
          }
          this.logProgress(`Creating template: ${language}/${templateName}`);
          await instructionGenerator.createTemplate(language, templateName);
          this.logSuccess(`Template created: ${language}/${templateName}`);
          break;
          
        default:
          this.logError(`Unknown template action: ${action}`);
          this.logInfo('Available actions: list, show, create');
      }

    } catch (error) {
      this.logError(`Failed to manage templates: ${error}`);
      throw error;
    }
  }

  /**
   * 문서 상태 표시
   */
  private displayDocumentStatus(status: any, documentId: string): void {
    console.log(`\n📋 Work Status for ${documentId}:`);
    console.log(`  Status: ${status.workStatus || 'unknown'}`);
    console.log(`  Last modified: ${status.lastModified || 'unknown'}`);
    console.log(`  Character limit: ${status.characterLimit || 'N/A'}`);
    
    if (status.needsEdit) {
      console.log(`  ⚠️  Needs editing`);
    }
    
    if (status.summary) {
      console.log(`  Summary: ${status.summary}`);
    }
  }

  /**
   * 상태 목록 표시
   */
  private displayStatusList(statusList: any[], needEditOnly: boolean): void {
    const filteredList = needEditOnly 
      ? statusList.filter(item => item.needsEdit)
      : statusList;
    
    console.log(`\n📋 Work Status (${filteredList.length} documents):`);
    
    for (const item of filteredList) {
      const statusIcon = item.needsEdit ? '⚠️' : '✅';
      console.log(`  ${statusIcon} ${item.documentId} (${item.workStatus})`);
    }
  }

  /**
   * 작업 컨텍스트 표시
   */
  private displayWorkContext(context: any, documentId: string): void {
    console.log(`\n📋 Work Context for ${documentId}:`);
    console.log(`\n🎯 Current Status:`);
    console.log(context.status || 'No status available');
    
    if (context.content) {
      console.log(`\n📄 Current Content:`);
      console.log(context.content);
    }
    
    if (context.suggestions) {
      console.log(`\n💡 Suggestions:`);
      for (const suggestion of context.suggestions) {
        console.log(`  • ${suggestion}`);
      }
    }
  }

  /**
   * 작업 목록 표시
   */
  private displayWorkList(workList: any[], filters: any): void {
    console.log(`\n📋 Work List (${workList.length} documents):`);
    
    if (filters.outdated) console.log('📅 Showing outdated documents only');
    if (filters.missing) console.log('❌ Showing missing documents only');
    if (filters.needUpdate) console.log('🔄 Showing documents that need updates');
    
    for (const item of workList) {
      const statusIcon = this.getStatusIcon(item.status);
      console.log(`  ${statusIcon} ${item.documentId} - ${item.status}`);
      if (item.reason) {
        console.log(`    └─ ${item.reason}`);
      }
    }
  }

  /**
   * 템플릿 목록 표시
   */
  private displayTemplateList(templates: string[]): void {
    console.log('');
    for (const template of templates) {
      console.log(`  • ${template}`);
    }
  }

  /**
   * 템플릿 내용 표시
   */
  private displayTemplate(template: any): void {
    console.log('\n📋 Template Content:');
    console.log(template.content || 'No content available');
    
    if (template.metadata) {
      console.log('\n📊 Template Metadata:');
      console.log(JSON.stringify(template.metadata, null, 2));
    }
  }

  /**
   * 상태 아이콘 반환
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'complete': return '✅';
      case 'outdated': return '📅';
      case 'missing': return '❌';
      case 'needs-update': return '🔄';
      case 'in-progress': return '🔄';
      default: return '📄';
    }
  }

  /**
   * 도움말 출력 (오버라이드)
   */
  protected showHelp(): void {
    console.log('\n💼 work - Work status and instruction management');
    console.log('\nUSAGE:');
    console.log('  work <action> [options]');
    
    console.log('\nACTIONS:');
    for (const [name, subcommand] of Object.entries(this.subcommands)) {
      console.log(`  ${name.padEnd(12)} ${subcommand.description}`);
    }
    
    console.log('\nEXAMPLES:');
    for (const example of this.examples) {
      console.log(`  ${example}`);
    }
    
    console.log('\nFor detailed help on specific action:');
    console.log('  work <action> --help');
  }
}