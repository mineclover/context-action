/**
 * CLI 라우팅 시스템
 * 새로운 통합 명령어와 기존 명령어 매핑 처리
 */

import type { CLIArgs, CLIContext, CLICommand, CommandGroup } from '../types/CommandTypes.js';
import { LEGACY_COMMAND_MAPPING } from '../types/CommandTypes.js';
import { ConfigCommand } from '../commands/ConfigCommand.js';
import { GenerateCommand } from '../commands/GenerateCommand.js';
import { PriorityCommand } from '../commands/PriorityCommand.js';
import { WorkCommand } from '../commands/WorkCommand.js';
import { ExtractCommand } from '../commands/ExtractCommand.js';
import { ComposeCommand } from '../commands/ComposeCommand.js';
import { SummaryCommand } from '../commands/SummaryCommand.js';
import { SchemaCommand } from '../commands/SchemaCommand.js';
import { SyncCommand } from '../commands/SyncCommand.js';
import { ValidateCommand } from '../commands/ValidateCommand.js';

export class CLIRouter {
  private commands: Map<string, CLICommand> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor(private context: CLIContext) {
    this.registerCommands();
  }

  /**
   * 명령어 등록
   */
  private registerCommands(): void {
    // 새로운 통합 명령어들
    this.registerCommand(new ConfigCommand(this.context));
    this.registerCommand(new GenerateCommand(this.context));
    this.registerCommand(new PriorityCommand(this.context));
    this.registerCommand(new WorkCommand(this.context));
    this.registerCommand(new ExtractCommand(this.context));
    this.registerCommand(new ComposeCommand(this.context));
    this.registerCommand(new SummaryCommand(this.context));
    this.registerCommand(new SchemaCommand(this.context));
    this.registerCommand(new SyncCommand(this.context));
    this.registerCommand(new ValidateCommand(this.context));
  }

  /**
   * 개별 명령어 등록
   */
  private registerCommand(command: CLICommand): void {
    this.commands.set(command.name, command);
    
    // 별칭 등록
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.set(alias, command.name);
      }
    }
  }

  /**
   * 명령어 라우팅 및 실행
   */
  async route(args: CLIArgs): Promise<void> {
    let commandName = args.command;
    
    // 별칭 처리
    if (this.aliases.has(commandName)) {
      commandName = this.aliases.get(commandName)!;
    }

    // 레거시 명령어 매핑 처리
    const legacyMapping = this.handleLegacyCommand(commandName, args);
    if (legacyMapping) {
      await this.routeLegacyCommand(legacyMapping, args);
      return;
    }

    // 새로운 통합 명령어 처리
    const command = this.commands.get(commandName);
    if (!command) {
      this.showCommandNotFound(commandName);
      return;
    }

    await command.execute(args);
  }

  /**
   * 레거시 명령어 처리
   */
  private handleLegacyCommand(commandName: string, args: CLIArgs): { group: CommandGroup; action: string } | null {
    const mapping = LEGACY_COMMAND_MAPPING[commandName];
    if (!mapping) {
      return null;
    }

    // 레거시 명령어 사용 경고
    this.showLegacyWarning(commandName, mapping);
    return mapping;
  }

  /**
   * 레거시 명령어 라우팅
   */
  private async routeLegacyCommand(mapping: { group: CommandGroup; action: string }, args: CLIArgs): Promise<void> {
    const { group, action } = mapping;
    
    // 새로운 명령어 형식으로 변환
    const newArgs: CLIArgs = {
      command: group,
      subcommand: action,
      positional: [action, ...args.positional],
      options: args.options,
      flags: args.flags
    };

    const command = this.commands.get(group);
    if (!command) {
      this.showMigrationError(group, action);
      return;
    }

    await command.execute(newArgs);
  }

  /**
   * 레거시 명령어 경고 출력
   */
  private showLegacyWarning(oldCommand: string, mapping: { group: CommandGroup; action: string }): void {
    const { group, action } = mapping;
    console.warn(`⚠️  Legacy command '${oldCommand}' is deprecated`);
    console.warn(`   Use: ${group} ${action}`);
    console.warn(`   This legacy command will be removed in a future version\n`);
  }

  /**
   * 마이그레이션 오류 출력
   */
  private showMigrationError(group: CommandGroup, action: string): void {
    console.error(`❌ Migration target not implemented: ${group} ${action}`);
    console.error(`   The new command structure is not yet available`);
    console.error(`   Please use the legacy command for now`);
  }

  /**
   * 명령어 찾을 수 없음 오류
   */
  private showCommandNotFound(commandName: string): void {
    console.error(`❌ Unknown command: ${commandName}`);
    console.error('');
    this.showAvailableCommands();
    console.error('');
    console.error('For help: --help');
  }

  /**
   * 사용 가능한 명령어 목록 출력
   */
  private showAvailableCommands(): void {
    console.error('Available commands:');
    
    const commandList = Array.from(this.commands.keys()).sort();
    for (const cmd of commandList) {
      const command = this.commands.get(cmd)!;
      console.error(`  ${cmd.padEnd(12)} ${command.description}`);
    }
  }

  /**
   * 전체 도움말 출력
   */
  showHelp(): void {
    console.log('🚀 LLMS Generator CLI (New Structure)');
    console.log('');
    console.log('USAGE:');
    console.log('  npx @context-action/llms-generator <command> [options]');
    console.log('');
    
    console.log('CORE COMMANDS:');
    const coreCommands = ['config', 'generate', 'priority', 'work', 'extract', 'compose', 'summary', 'schema', 'sync', 'validate'];
    for (const cmd of coreCommands) {
      const command = this.commands.get(cmd);
      if (command) {
        console.log(`  ${cmd.padEnd(12)} ${command.description}`);
      }
    }
    
    console.log('');
    console.log('EXAMPLES:');
    console.log('  config init standard');
    console.log('  config show --format=table');
    console.log('  generate minimum --lang=ko');
    console.log('  generate chars 1000 en');
    console.log('  generate batch --lang=en,ko');
    console.log('  generate md en --chars=100,500,1000');
    console.log('  generate all');
    console.log('  priority generate en --overwrite');
    console.log('  priority stats ko --detailed');
    console.log('  priority llms 100 --language=ko');
    console.log('  priority batch --character-limits=100,500,1000');
    console.log('  work status ko --chars=100 --need-edit');
    console.log('  work context ko guide-action-handlers');
    console.log('  work instruction ko api-spec --template=default');
    console.log('  work batch ko --chars=100,300,1000');
    console.log('  extract single ko --chars=100,300,1000');
    console.log('  extract all --lang=en,ko --overwrite');
    console.log('  extract batch --parallel --max-concurrent=5');
    console.log('  compose single ko 1000 --no-toc');
    console.log('  compose batch en --chars=1000,3000,5000');
    console.log('  compose markdown ko --chars=100,300,1000');
    console.log('  summary generate minimum ko --chars=100,300,1000');
    console.log('  summary improve ko --min-quality=80');
    console.log('  summary validate ko --fix --strict');
    console.log('  schema generate all --output=./schemas --format=json');
    console.log('  schema info config --detailed --properties');
    console.log('  schema validate --file=llms-generator.config.json --fix');
    console.log('  sync docs --source=en --target=ko,ja --check-only');
    console.log('  sync simple --input=./old-docs --output=./new-docs');
    console.log('  sync all --source-lang=en --target-langs=ko,ja --parallel');
    console.log('  validate config --file=llms-generator.config.json --fix');
    console.log('  validate priority --language=ko --check-consistency');
    console.log('  validate all --parallel --fix --report');
    console.log('  validate pre-commit --auto-fix --verbose');
    
    console.log('');
    console.log('For detailed help on specific command:');
    console.log('  <command> --help');
    
    console.log('');
    console.log('LEGACY SUPPORT:');
    console.log('  Old commands like "config-init", "generate-md" still work');
    console.log('  but will show deprecation warnings and be removed later');
  }

  /**
   * 명령어 목록 반환
   */
  getCommands(): CLICommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * 특정 명령어 반환
   */
  getCommand(name: string): CLICommand | undefined {
    return this.commands.get(name);
  }
}