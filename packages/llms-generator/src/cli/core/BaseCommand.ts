/**
 * CLI 명령어 기본 클래스
 */

import path from 'path';
import { existsSync } from 'fs';
import type { CLICommand, CLIArgs, CLIContext, CLIOption } from '../types/CommandTypes.js';

export abstract class BaseCommand implements CLICommand {
  abstract name: string;
  abstract description: string;
  aliases?: string[];
  options?: CLIOption[];
  examples?: string[];

  constructor(protected context: CLIContext) {}

  abstract execute(args: CLIArgs): Promise<void>;

  /**
   * 공통 옵션 파싱
   */
  protected parseCommonOptions(args: CLIArgs): {
    language?: string;
    languages?: string[];
    characterLimits?: number[];
    dryRun?: boolean;
    verbose?: boolean;
    force?: boolean;
  } {
    const options = args.options;
    
    return {
      language: options.lang || options.language,
      languages: this.parseLanguages(options.lang || options.languages),
      characterLimits: this.parseCharacterLimits(options.chars || options.characterLimits),
      dryRun: args.flags['dry-run'] || args.flags.dryRun,
      verbose: args.flags.verbose || args.flags.v,
      force: args.flags.force,
    };
  }

  /**
   * 언어 목록 파싱
   */
  private parseLanguages(input?: string | string[]): string[] | undefined {
    if (!input) return undefined;
    if (Array.isArray(input)) return input;
    return input.split(',').map(lang => lang.trim());
  }

  /**
   * 문자 제한 파싱
   */
  private parseCharacterLimits(input?: string | number | number[]): number[] | undefined {
    if (!input) return undefined;
    if (Array.isArray(input)) return input;
    if (typeof input === 'number') return [input];
    
    return input.split(',').map(limit => {
      const num = parseInt(limit.trim(), 10);
      if (isNaN(num)) {
        throw new Error(`Invalid character limit: ${limit}`);
      }
      return num;
    });
  }

  /**
   * 필수 인자 검증
   */
  protected validateRequiredArgs(args: CLIArgs, requiredPositional: number = 0): void {
    if (args.positional.length < requiredPositional) {
      throw new Error(`Missing required arguments. Expected at least ${requiredPositional}, got ${args.positional.length}`);
    }
  }

  /**
   * 설정 로드
   */
  protected async loadConfig(): Promise<any> {
    if (this.context.config) {
      return this.context.config;
    }

    try {
      // EnhancedConfigManager 사용
      const { EnhancedConfigManager } = await import('../../core/EnhancedConfigManager.js');
      const { DEFAULT_CONFIG } = await import('../../index.js');
      const configPath = this.context.configPath || path.join(this.context.workingDir, 'llms-generator.config.json');
      
      if (existsSync(configPath)) {
        const configManager = new EnhancedConfigManager(configPath);
        const enhancedConfig = await configManager.loadConfig();
        
        // Convert enhanced config to internal format
        const projectRoot = this.context.workingDir;
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
        // Use default config
        return DEFAULT_CONFIG;
      }
    } catch (error) {
      // Fallback to default config
      const { DEFAULT_CONFIG } = await import('../../index.js');
      return DEFAULT_CONFIG;
    }
  }

  /**
   * 성공 메시지 출력
   */
  protected logSuccess(message: string): void {
    console.log(`✅ ${message}`);
  }

  /**
   * 경고 메시지 출력
   */
  protected logWarning(message: string): void {
    console.warn(`⚠️  ${message}`);
  }

  /**
   * 오류 메시지 출력
   */
  protected logError(message: string): void {
    console.error(`❌ ${message}`);
  }

  /**
   * 정보 메시지 출력
   */
  protected logInfo(message: string): void {
    console.log(`📋 ${message}`);
  }

  /**
   * 진행 상황 출력
   */
  protected logProgress(message: string): void {
    console.log(`🔄 ${message}`);
  }

  /**
   * Dry run 모드 체크
   */
  protected isDryRun(args: CLIArgs): boolean {
    return args.flags['dry-run'] || args.flags.dryRun || this.context.dryRun || false;
  }

  /**
   * Verbose 모드 체크
   */
  protected isVerbose(args: CLIArgs): boolean {
    return args.flags.verbose || args.flags.v || this.context.verbose || false;
  }

  /**
   * 도움말 출력
   */
  protected showHelp(): void {
    console.log(`\n🚀 ${this.name}`);
    console.log(`\n${this.description}`);
    
    if (this.aliases && this.aliases.length > 0) {
      console.log(`\nAliases: ${this.aliases.join(', ')}`);
    }

    if (this.options && this.options.length > 0) {
      console.log('\nOptions:');
      for (const option of this.options) {
        const alias = option.alias ? `|${option.alias}` : '';
        const required = option.required ? ' (required)' : '';
        const defaultValue = option.default ? ` (default: ${option.default})` : '';
        console.log(`  --${option.name}${alias}  ${option.description}${required}${defaultValue}`);
      }
    }

    if (this.examples && this.examples.length > 0) {
      console.log('\nExamples:');
      for (const example of this.examples) {
        console.log(`  ${example}`);
      }
    }
  }
}