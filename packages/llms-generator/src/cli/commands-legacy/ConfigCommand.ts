/**
 * 설정 관리 통합 명령어
 * 기존: config-init, config-show, config-validate, config-limits
 * 신규: config <action> [options]
 */

import path from 'path';
import { existsSync } from 'fs';
import { BaseCommand } from '../core/BaseCommand.js';
import type { CLIArgs, CLISubcommand } from '../types/CommandTypes.js';

export class ConfigCommand extends BaseCommand {
  name = 'config';
  description = 'Configuration management';
  aliases = ['cfg'];

  subcommands: Record<string, CLISubcommand> = {
    init: {
      name: 'init',
      description: 'Initialize configuration with preset',
      options: [
        {
          name: 'preset',
          description: 'Configuration preset',
          type: 'string',
          choices: ['minimal', 'standard', 'extended', 'blog', 'documentation'],
          default: 'standard'
        },
        {
          name: 'path',
          description: 'Configuration file path',
          type: 'string',
          default: 'llms-generator.config.json'
        },
        {
          name: 'force',
          description: 'Overwrite existing configuration',
          type: 'boolean'
        }
      ],
      examples: [
        'config init standard',
        'config init minimal --path=custom-config.json',
        'config init extended --force'
      ],
      execute: this.executeInit.bind(this)
    },
    
    show: {
      name: 'show',
      description: 'Show current resolved configuration',
      options: [
        {
          name: 'format',
          description: 'Output format',
          type: 'string',
          choices: ['json', 'yaml', 'table'],
          default: 'json'
        },
        {
          name: 'section',
          description: 'Show specific configuration section',
          type: 'string',
          choices: ['paths', 'generation', 'languages', 'characterLimits', 'all'],
          default: 'all'
        }
      ],
      examples: [
        'config show',
        'config show --format=table',
        'config show --section=generation'
      ],
      execute: this.executeShow.bind(this)
    },

    validate: {
      name: 'validate',
      description: 'Validate current configuration',
      options: [
        {
          name: 'strict',
          description: 'Use strict validation',
          type: 'boolean'
        },
        {
          name: 'fix',
          description: 'Auto-fix validation issues',
          type: 'boolean'
        }
      ],
      examples: [
        'config validate',
        'config validate --strict',
        'config validate --fix'
      ],
      execute: this.executeValidate.bind(this)
    },

    limits: {
      name: 'limits',
      description: 'Show configured character limits',
      options: [
        {
          name: 'all',
          description: 'Show all available limits',
          type: 'boolean'
        },
        {
          name: 'format',
          description: 'Output format',
          type: 'string',
          choices: ['list', 'table', 'json'],
          default: 'list'
        }
      ],
      examples: [
        'config limits',
        'config limits --all',
        'config limits --format=table'
      ],
      execute: this.executeLimits.bind(this)
    }
  };

  examples = [
    'config init standard',
    'config show --format=table',
    'config validate --fix',
    'config limits --all'
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
      this.logError(`Unknown config action: ${action}`);
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
   * config init 실행
   */
  private async executeInit(args: CLIArgs): Promise<void> {
    const preset = args.positional[0] || args.options.preset || 'standard';
    const configPath = args.options.path || 'llms-generator.config.json';
    const force = args.flags.force;

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would create config with preset '${preset}' at '${configPath}'`);
      return;
    }

    // 기존 설정 파일 체크
    const fullPath = path.resolve(this.context.workingDir, configPath);
    if (existsSync(fullPath) && !force) {
      this.logError(`Configuration file already exists: ${configPath}`);
      this.logInfo('Use --force to overwrite existing configuration');
      return;
    }

    try {
      // 기존 EnhancedConfigManager 사용
      const { EnhancedConfigManager } = await import('../../core/EnhancedConfigManager.js');
      const configManager = new EnhancedConfigManager(fullPath);
      
      this.logProgress(`Creating configuration with preset: ${preset}`);
      await configManager.initializeConfig(preset as any);
      
      this.logSuccess(`Configuration created: ${configPath}`);
      this.logInfo(`Preset: ${preset}`);
      
      if (this.isVerbose(args)) {
        // 생성된 설정 보기
        const config = await configManager.loadConfig();
        console.log('\nGenerated configuration:');
        console.log(JSON.stringify(config, null, 2));
      }

    } catch (error) {
      this.logError(`Failed to create configuration: ${error}`);
      throw error;
    }
  }

  /**
   * config show 실행
   */
  private async executeShow(args: CLIArgs): Promise<void> {
    const format = args.options.format || 'json';
    const section = args.options.section || 'all';

    try {
      const config = await this.loadConfig();
      
      let output = config;
      if (section !== 'all') {
        output = config[section];
        if (!output) {
          this.logError(`Configuration section '${section}' not found`);
          return;
        }
      }

      this.logInfo(`Current configuration (${section}):`);
      
      switch (format) {
        case 'json':
          console.log(JSON.stringify(output, null, 2));
          break;
        case 'yaml':
          // YAML 출력 (yaml 라이브러리 사용)
          const yaml = await import('yaml');
          console.log(yaml.stringify(output));
          break;
        case 'table':
          this.showConfigAsTable(output, section);
          break;
        default:
          this.logError(`Unknown format: ${format}`);
      }

    } catch (error) {
      this.logError(`Failed to load configuration: ${error}`);
      throw error;
    }
  }

  /**
   * config validate 실행
   */
  private async executeValidate(args: CLIArgs): Promise<void> {
    const strict = args.flags.strict;
    const fix = args.flags.fix;

    try {
      this.logProgress('Validating configuration...');
      
      // 설정 파일 로드
      const configPath = path.join(this.context.workingDir, 'llms-generator.config.json');
      
      if (!existsSync(configPath)) {
        this.logError('Configuration file not found: llms-generator.config.json');
        this.logInfo('Run "config init" to create a configuration file');
        return;
      }

      // EnhancedConfigManager와 ConfigManager 모두 사용
      const { EnhancedConfigManager } = await import('../../core/EnhancedConfigManager.js');
      const { ConfigManager } = await import('../../core/ConfigManager.js');
      
      const enhancedConfigManager = new EnhancedConfigManager(configPath);
      const config = await enhancedConfigManager.loadConfig();
      
      // ConfigManager의 강력한 검증 로직 사용
      const basicValidation = ConfigManager.validateConfig(config as any);
      
      // 추가적인 enhanced config 검증
      const enhancedIssues = await this.validateEnhancedConfiguration(config, strict);
      
      // 모든 이슈 결합
      const allIssues = [
        ...basicValidation.errors.map(error => ({ message: error, level: 'error' })),
        ...enhancedIssues
      ];
      
      if (allIssues.length === 0) {
        this.logSuccess('✅ Configuration is valid');
        this.logInfo('All validation checks passed');
        return;
      }

      this.logWarning(`❌ Found ${allIssues.length} validation issues:`);
      
      // 이슈를 레벨별로 그룹화하여 출력
      const errors = allIssues.filter(issue => issue.level === 'error');
      const warnings = allIssues.filter(issue => issue.level === 'warning');
      
      if (errors.length > 0) {
        console.log('\n🚨 Errors:');
        errors.forEach(issue => console.log(`  • ${issue.message}`));
      }
      
      if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(issue => console.log(`  • ${issue.message}`));
      }

      if (fix) {
        this.logProgress('Auto-fixing validation issues...');
        const fixed = await this.fixConfigurationIssues(config, allIssues);
        if (fixed > 0) {
          // 수정된 설정을 저장
          await enhancedConfigManager.saveConfig(config);
          this.logSuccess(`✅ Fixed ${fixed} issues and saved configuration`);
        } else {
          this.logInfo('ℹ️  No auto-fixable issues found');
        }
      } else {
        console.log('\n💡 Use --fix flag to automatically fix some issues');
      }

      // 에러가 있으면 실패로 처리
      if (errors.length > 0) {
        throw new Error(`Configuration validation failed with ${errors.length} errors`);
      }

    } catch (error) {
      this.logError(`Configuration validation failed: ${error}`);
      throw error;
    }
  }

  /**
   * config limits 실행
   */
  private async executeLimits(args: CLIArgs): Promise<void> {
    const showAll = args.flags.all;
    const format = args.options.format || 'list';

    try {
      const config = await this.loadConfig();
      const limits = config.generation?.characterLimits || config.characterLimits || [];
      
      this.logInfo(`Configured character limits:`);
      
      switch (format) {
        case 'list':
          console.log(limits.join(', '));
          break;
        case 'table':
          this.showLimitsAsTable(limits);
          break;
        case 'json':
          console.log(JSON.stringify({ characterLimits: limits }, null, 2));
          break;
      }

      if (showAll) {
        const allLimits = [100, 200, 300, 500, 1000, 2000, 5000, 10000];
        this.logInfo('\nAll available limits:');
        console.log(allLimits.join(', '));
      }

    } catch (error) {
      this.logError(`Failed to load character limits: ${error}`);
      throw error;
    }
  }

  /**
   * 설정을 테이블로 출력
   */
  private showConfigAsTable(config: any, section: string): void {
    if (typeof config !== 'object') {
      console.log(config);
      return;
    }

    console.log(`\n┌─ ${section.toUpperCase()} ─`);
    for (const [key, value] of Object.entries(config)) {
      const displayValue = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);
      console.log(`│ ${key}: ${displayValue}`);
    }
    console.log('└─');
  }

  /**
   * 문자 제한을 테이블로 출력
   */
  private showLimitsAsTable(limits: number[]): void {
    console.log('\n┌─ CHARACTER LIMITS ─');
    limits.forEach((limit, index) => {
      console.log(`│ ${index + 1}. ${limit} characters`);
    });
    console.log('└─');
  }

  /**
   * Enhanced Configuration 검증
   */
  private async validateEnhancedConfiguration(config: any, strict: boolean): Promise<Array<{message: string, level: string}>> {
    const issues: Array<{message: string, level: string}> = [];

    // 기본 구조 검증
    if (!config || typeof config !== 'object') {
      issues.push({ message: 'Configuration must be a valid object', level: 'error' });
      return issues;
    }

    // 필수 섹션 검증
    if (!config.paths) {
      issues.push({ message: 'Missing paths configuration section', level: 'error' });
    }

    if (!config.generation) {
      issues.push({ message: 'Missing generation configuration section', level: 'error' });
    }

    // Enhanced Config 특화 검증
    if (config.paths) {
      // 경로 존재 여부 확인
      const pathsToCheck = ['docsDir', 'llmContentDir', 'outputDir', 'templatesDir', 'instructionsDir'];
      for (const pathKey of pathsToCheck) {
        if (config.paths[pathKey]) {
          const fullPath = path.resolve(this.context.workingDir, config.paths[pathKey]);
          if (!existsSync(fullPath)) {
            if (pathKey === 'docsDir' || pathKey === 'llmContentDir') {
              issues.push({ message: `Required directory not found: ${pathKey} (${config.paths[pathKey]})`, level: 'error' });
            } else {
              issues.push({ message: `Directory not found: ${pathKey} (${config.paths[pathKey]})`, level: 'warning' });
            }
          }
        }
      }
    }

    // Generation 설정 검증
    if (config.generation) {
      // Character limits 검증
      if (config.generation.characterLimits) {
        if (!Array.isArray(config.generation.characterLimits)) {
          issues.push({ message: 'Generation character limits must be an array', level: 'error' });
        } else {
          // 중복 제한값 체크
          const uniqueLimits = new Set(config.generation.characterLimits);
          if (config.generation.characterLimits.length !== uniqueLimits.size) {
            issues.push({ message: 'Duplicate character limits found in generation config', level: 'warning' });
          }
        }
      }

      // 언어 설정 검증
      if (config.generation.supportedLanguages) {
        if (!Array.isArray(config.generation.supportedLanguages)) {
          issues.push({ message: 'Generation supported languages must be an array', level: 'error' });
        } else if (config.generation.supportedLanguages.length === 0) {
          issues.push({ message: 'At least one supported language must be defined', level: 'error' });
        }
      }

      // 기본 언어 검증
      if (config.generation.defaultLanguage && config.generation.supportedLanguages) {
        if (!config.generation.supportedLanguages.includes(config.generation.defaultLanguage)) {
          issues.push({ message: `Default language '${config.generation.defaultLanguage}' not in supported languages`, level: 'error' });
        }
      }
    }

    // Quality 설정 검증
    if (config.quality) {
      // Template validation 설정 검증
      if (config.quality.templateValidation && typeof config.quality.templateValidation !== 'object') {
        issues.push({ message: 'Quality template validation must be an object', level: 'warning' });
      }

      // Content validation 설정 검증
      if (config.quality.contentValidation && typeof config.quality.contentValidation !== 'object') {
        issues.push({ message: 'Quality content validation must be an object', level: 'warning' });
      }
    }

    // Strict 모드 추가 검증
    if (strict) {
      // 설정 완성도 검증
      if (!config.generation?.supportedLanguages) {
        issues.push({ message: 'Missing supported languages in generation config', level: 'warning' });
      }

      if (!config.generation?.characterLimits) {
        issues.push({ message: 'Missing character limits in generation config', level: 'warning' });
      }

      if (!config.quality) {
        issues.push({ message: 'Missing quality configuration for enhanced features', level: 'warning' });
      }

      // 폴더 구조 일관성 체크
      if (config.paths?.docsDir && config.paths?.llmContentDir) {
        const docsPath = path.resolve(this.context.workingDir, config.paths.docsDir);
        const dataPath = path.resolve(this.context.workingDir, config.paths.llmContentDir);
        
        if (existsSync(docsPath) && existsSync(dataPath)) {
          // 언어별 폴더 구조 체크 (향후 확장 가능)
          if (config.generation?.supportedLanguages) {
            for (const lang of config.generation.supportedLanguages) {
              const langDocsPath = path.join(docsPath, lang);
              const langDataPath = path.join(dataPath, lang);
              
              if (!existsSync(langDocsPath) && !existsSync(langDataPath)) {
                issues.push({ message: `Language folder structure missing for '${lang}'`, level: 'warning' });
              }
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * 설정 검증 (레거시 - 호환성 유지)
   */
  private async validateConfiguration(config: any, strict: boolean): Promise<Array<{message: string, level: string}>> {
    const issues: Array<{message: string, level: string}> = [];

    // 필수 필드 체크
    if (!config.paths) {
      issues.push({ message: 'Missing paths configuration', level: 'error' });
    }
    
    if (!config.generation) {
      issues.push({ message: 'Missing generation configuration', level: 'error' });
    }

    if (!config.characterLimits && !config.generation?.characterLimits) {
      issues.push({ message: 'Missing character limits', level: 'error' });
    }

    // Strict 모드 추가 검증
    if (strict) {
      if (!config.languages && !config.generation?.supportedLanguages) {
        issues.push({ message: 'Missing languages configuration', level: 'warning' });
      }
    }

    return issues;
  }

  /**
   * 설정 이슈 자동 수정
   */
  private async fixConfigurationIssues(config: any, issues: Array<{message: string, level: string}>): Promise<number> {
    let fixed = 0;
    
    // 자동 수정 로직 구현
    for (const issue of issues) {
      if (issue.message.includes('Missing character limits')) {
        // 레거시 설정 구조를 위한 수정
        if (!config.characterLimits) {
          config.characterLimits = [100, 300, 1000, 2000];
          fixed++;
        }
      }

      if (issue.message.includes('Missing character limits in generation config')) {
        // Enhanced 설정 구조를 위한 수정
        if (!config.generation) {
          config.generation = {};
        }
        if (!config.generation.characterLimits) {
          config.generation.characterLimits = [100, 300, 1000, 2000];
          fixed++;
        }
      }

      if (issue.message.includes('Missing paths configuration')) {
        if (!config.paths) {
          config.paths = {
            docsDir: './docs',
            llmContentDir: './data',
            outputDir: './docs/llms',
            templatesDir: './templates',
            instructionsDir: './instructions'
          };
          fixed++;
        }
      }

      if (issue.message.includes('Missing generation configuration')) {
        if (!config.generation) {
          config.generation = {
            supportedLanguages: ['en', 'ko'],
            defaultLanguage: 'en',
            characterLimits: [100, 300, 1000, 2000],
            outputFormat: 'markdown'
          };
          fixed++;
        }
      }

      if (issue.message.includes('Missing supported languages')) {
        if (!config.generation) {
          config.generation = {};
        }
        if (!config.generation.supportedLanguages) {
          config.generation.supportedLanguages = ['en', 'ko'];
          fixed++;
        }
      }

      if (issue.message.includes('At least one supported language must be defined')) {
        if (config.generation && Array.isArray(config.generation.supportedLanguages) && config.generation.supportedLanguages.length === 0) {
          config.generation.supportedLanguages = ['en'];
          fixed++;
        }
      }

      if (issue.message.includes('Duplicate character limits found')) {
        // 중복 제거
        if (config.characterLimits && Array.isArray(config.characterLimits)) {
          config.characterLimits = [...new Set(config.characterLimits)];
          fixed++;
        }
        if (config.generation?.characterLimits && Array.isArray(config.generation.characterLimits)) {
          config.generation.characterLimits = [...new Set(config.generation.characterLimits)];
          fixed++;
        }
      }

      if (issue.message.includes('Default language') && issue.message.includes('not in supported languages')) {
        // 기본 언어를 지원 언어 목록의 첫 번째로 설정
        if (config.generation?.supportedLanguages && Array.isArray(config.generation.supportedLanguages) && config.generation.supportedLanguages.length > 0) {
          config.generation.defaultLanguage = config.generation.supportedLanguages[0];
          fixed++;
        }
      }

      if (issue.message.includes('Missing quality configuration for enhanced features')) {
        if (!config.quality) {
          config.quality = {
            templateValidation: {
              enabled: true,
              strictMode: false
            },
            contentValidation: {
              enabled: true,
              checkLinks: true,
              checkImages: false
            }
          };
          fixed++;
        }
      }

      // 필수 디렉토리 생성 (경고 레벨 이슈만 처리)
      if (issue.level === 'warning' && issue.message.includes('Directory not found')) {
        const match = issue.message.match(/(\w+) \(([^)]+)\)/);
        if (match) {
          const pathKey = match[1];
          const relativePath = match[2];
          const fullPath = path.resolve(this.context.workingDir, relativePath);
          
          try {
            const { mkdir } = await import('fs/promises');
            await mkdir(fullPath, { recursive: true });
            this.logInfo(`✅ Created directory: ${relativePath}`);
            fixed++;
          } catch (error) {
            this.logWarning(`Failed to create directory ${relativePath}: ${error}`);
          }
        }
      }
    }

    return fixed;
  }

  /**
   * 도움말 출력 (오버라이드)
   */
  protected showHelp(): void {
    console.log('\n🔧 config - Configuration management');
    console.log('\nUSAGE:');
    console.log('  config <action> [options]');
    
    console.log('\nACTIONS:');
    for (const [name, subcommand] of Object.entries(this.subcommands)) {
      console.log(`  ${name.padEnd(12)} ${subcommand.description}`);
    }
    
    console.log('\nEXAMPLES:');
    for (const example of this.examples) {
      console.log(`  ${example}`);
    }
    
    console.log('\nFor detailed help on specific action:');
    console.log('  config <action> --help');
  }
}