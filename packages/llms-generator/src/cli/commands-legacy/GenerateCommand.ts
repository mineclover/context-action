/**
 * 컨텐츠 생성 통합 명령어
 * 기존: minimum, origin, chars, batch, generate-md, generate-all
 * 신규: generate <type> [options]
 */

import path from 'path';
import { BaseCommand } from '../core/BaseCommand.js';
import type { CLIArgs, CLISubcommand } from '../types/CommandTypes.js';

export class GenerateCommand extends BaseCommand {
  name = 'generate';
  description = 'Content generation';
  aliases = ['gen'];

  subcommands: Record<string, CLISubcommand> = {
    minimum: {
      name: 'minimum',
      description: 'Generate minimum format content',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        }
      ],
      examples: [
        'generate minimum',
        'generate minimum --lang=en'
      ],
      execute: this.executeMinimum.bind(this)
    },

    origin: {
      name: 'origin',
      description: 'Generate origin format content',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        }
      ],
      examples: [
        'generate origin',
        'generate origin --lang=en'
      ],
      execute: this.executeOrigin.bind(this)
    },

    chars: {
      name: 'chars',
      description: 'Generate character-limited content',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string',
          default: 'ko'
        }
      ],
      examples: [
        'generate chars 1000',
        'generate chars 500 en',
        'generate chars 2000 --lang=ko'
      ],
      execute: this.executeChars.bind(this)
    },

    batch: {
      name: 'batch',
      description: 'Generate all formats using config defaults',
      options: [
        {
          name: 'languages',
          alias: 'lang',
          description: 'Target languages (comma-separated)',
          type: 'string'
        },
        {
          name: 'character-limits',
          alias: 'chars',
          description: 'Character limits (comma-separated)',
          type: 'string'
        }
      ],
      examples: [
        'generate batch',
        'generate batch --lang=en,ko',
        'generate batch --chars=300,1000,2000',
        'generate batch --lang=en --chars=1000,2000'
      ],
      execute: this.executeBatch.bind(this)
    },

    md: {
      name: 'md',
      description: 'Generate individual .md files using AdaptiveComposer',
      options: [
        {
          name: 'language',
          alias: 'lang',
          description: 'Target language',
          type: 'string'
        },
        {
          name: 'character-limits',
          alias: 'chars',
          description: 'Character limits (comma-separated)',
          type: 'string',
          default: '100,200,300,500,1000,2000,5000'
        }
      ],
      examples: [
        'generate md en',
        'generate md ko --chars=100,500,1000',
        'generate md --lang=en,ko'
      ],
      execute: this.executeMd.bind(this)
    },

    all: {
      name: 'all',
      description: 'Generate .md files for all configured languages',
      options: [
        {
          name: 'languages',
          alias: 'lang',
          description: 'Override languages (comma-separated)',
          type: 'string'
        },
        {
          name: 'character-limits',
          alias: 'chars',
          description: 'Override character limits (comma-separated)',
          type: 'string'
        }
      ],
      examples: [
        'generate all',
        'generate all --lang=en,ko,ja',
        'generate all --chars=100,500,1000'
      ],
      execute: this.executeAll.bind(this)
    }
  };

  examples = [
    'generate minimum --lang=ko',
    'generate chars 1000 en',
    'generate batch --lang=en,ko --chars=300,1000',
    'generate md en --chars=100,500,1000',
    'generate all'
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
      this.logError(`Unknown generate type: ${action}`);
      this.logInfo('Available types: ' + Object.keys(this.subcommands).join(', '));
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
   * generate minimum 실행
   */
  private async executeMinimum(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || 'ko';

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate minimum format for language: ${targetLang}`);
      return;
    }

    try {
      this.logProgress(`Generating minimum format for language: ${targetLang}`);
      
      const config = await this.loadConfig();
      const { LLMSGenerator } = await import('../../core/LLMSGenerator.js');
      const generator = new LLMSGenerator(config);
      
      await generator.generateMinimum(targetLang);
      this.logSuccess(`Minimum format generated for ${targetLang}`);

    } catch (error) {
      this.logError(`Failed to generate minimum format: ${error}`);
      throw error;
    }
  }

  /**
   * generate origin 실행
   */
  private async executeOrigin(args: CLIArgs): Promise<void> {
    const { language } = this.parseCommonOptions(args);
    const targetLang = language || 'ko';

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate origin format for language: ${targetLang}`);
      return;
    }

    try {
      this.logProgress(`Generating origin format for language: ${targetLang}`);
      
      const config = await this.loadConfig();
      const { LLMSGenerator } = await import('../../core/LLMSGenerator.js');
      const generator = new LLMSGenerator(config);
      
      await generator.generateOrigin(targetLang);
      this.logSuccess(`Origin format generated for ${targetLang}`);

    } catch (error) {
      this.logError(`Failed to generate origin format: ${error}`);
      throw error;
    }
  }

  /**
   * generate chars 실행
   */
  private async executeChars(args: CLIArgs): Promise<void> {
    const limit = parseInt(args.positional[0], 10);
    const language = args.positional[1] || args.options.lang || 'ko';

    if (!limit || isNaN(limit)) {
      this.logError('Character limit is required and must be a number');
      this.logInfo('Usage: generate chars <limit> [language]');
      return;
    }

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate ${limit} character content for language: ${language}`);
      return;
    }

    try {
      this.logProgress(`Generating ${limit} character content for language: ${language}`);
      
      const config = await this.loadConfig();
      const { LLMSGenerator } = await import('../../core/LLMSGenerator.js');
      const generator = new LLMSGenerator(config);
      
      await generator.generateCharacterLimited(limit, language);
      this.logSuccess(`${limit} character content generated for ${language}`);

    } catch (error) {
      this.logError(`Failed to generate character-limited content: ${error}`);
      throw error;
    }
  }

  /**
   * generate batch 실행
   */
  private async executeBatch(args: CLIArgs): Promise<void> {
    const { languages, characterLimits } = this.parseCommonOptions(args);

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate batch content`);
      this.logInfo(`Languages: ${languages?.join(', ') || 'config default'}`);
      this.logInfo(`Character limits: ${characterLimits?.join(', ') || 'config default'}`);
      return;
    }

    try {
      const config = await this.loadConfig();
      
      // 설정에서 기본값 가져오기
      const targetLanguages = languages || config.generation?.supportedLanguages || config.languages || ['ko'];
      const targetLimits = characterLimits || config.generation?.characterLimits || config.characterLimits || [100, 300, 1000, 2000];

      this.logProgress(`Batch generating for ${targetLanguages.length} language(s) and ${targetLimits.length} character limit(s)`);
      this.logInfo(`Languages: ${targetLanguages.join(', ')}`);
      this.logInfo(`Character limits: ${targetLimits.join(', ')}`);
      
      const { LLMSGenerator } = await import('../../core/LLMSGenerator.js');
      const generator = new LLMSGenerator(config);
      
      await generator.generate({
        languages: targetLanguages,
        formats: ['minimum', 'origin', 'chars'],
        characterLimits: targetLimits
      });
      
      this.logSuccess('Batch generation completed successfully');

    } catch (error) {
      this.logError(`Batch generation failed: ${error}`);
      throw error;
    }
  }

  /**
   * generate md 실행  
   */
  private async executeMd(args: CLIArgs): Promise<void> {
    const { language, characterLimits } = this.parseCommonOptions(args);
    
    if (!language) {
      this.logError('Language is required for md generation');
      this.logInfo('Usage: generate md <language> [options]');
      return;
    }

    const targetLimits = characterLimits || [100, 200, 300, 500, 1000, 2000, 5000];

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate .md files for language: ${language}`);
      this.logInfo(`Character limits: ${targetLimits.join(', ')}`);
      return;
    }

    try {
      this.logProgress(`Generating individual .md files for language: ${language}`);
      this.logInfo(`Character limits: ${targetLimits.join(', ')}`);
      
      const config = await this.loadConfig();
      const { AdaptiveComposer } = await import('../../core/AdaptiveComposer.js');
      const composer = new AdaptiveComposer(config);
      
      await composer.generateIndividualCharacterLimited(targetLimits, language);
      this.logSuccess(`Individual .md files generated for ${language}`);

    } catch (error) {
      this.logError(`Failed to generate .md files: ${error}`);
      throw error;
    }
  }

  /**
   * generate all 실행
   */
  private async executeAll(args: CLIArgs): Promise<void> {
    const { languages, characterLimits } = this.parseCommonOptions(args);

    if (this.isDryRun(args)) {
      this.logInfo(`[DRY RUN] Would generate .md files for all languages`);
      this.logInfo(`Languages: ${languages?.join(', ') || 'config default'}`);
      this.logInfo(`Character limits: ${characterLimits?.join(', ') || 'config default'}`);
      return;
    }

    try {
      const config = await this.loadConfig();
      
      // 설정에서 기본값 가져오기
      const targetLanguages = languages || config.generation?.supportedLanguages || config.languages || ['ko', 'en'];
      const targetLimits = characterLimits || config.generation?.characterLimits || config.characterLimits || [100, 200, 300, 500, 1000, 2000, 5000];

      this.logProgress(`Generating .md files for all languages`);
      this.logInfo(`Languages: ${targetLanguages.join(', ')}`);
      this.logInfo(`Character limits: ${targetLimits.join(', ')}`);
      
      const { AdaptiveComposer } = await import('../../core/AdaptiveComposer.js');
      const composer = new AdaptiveComposer(config);
      
      let totalGenerated = 0;
      
      for (const lang of targetLanguages) {
        this.logProgress(`Generating for ${lang}...`);
        await composer.generateIndividualCharacterLimited(targetLimits, lang);
        
        // 생성된 파일 수 카운트
        const count = await this.countGeneratedFiles(lang);
        totalGenerated += count;
        this.logInfo(`${lang}: ${count} files generated`);
      }
      
      this.logSuccess(`All .md file generation completed!`);
      this.logInfo(`Total files generated: ${totalGenerated}`);

    } catch (error) {
      this.logError(`Failed to generate all .md files: ${error}`);
      throw error;
    }
  }

  /**
   * 생성된 파일 수 카운트
   */
  private async countGeneratedFiles(language: string): Promise<number> {
    try {
      const { promises: fs } = await import('fs');
      const dataDir = path.join(this.context.workingDir, 'data', language);
      
      const dirs = await fs.readdir(dataDir);
      let fileCount = 0;
      
      for (const dir of dirs) {
        const dirPath = path.join(dataDir, dir);
        const stats = await fs.stat(dirPath);
        
        if (stats.isDirectory()) {
          const files = await fs.readdir(dirPath);
          const mdFiles = files.filter(f => f.endsWith('.md'));
          fileCount += mdFiles.length;
        }
      }
      
      return fileCount;
    } catch (error) {
      this.logWarning(`Could not count files for ${language}: ${error}`);
      return 0;
    }
  }

  /**
   * 도움말 출력 (오버라이드)
   */
  protected showHelp(): void {
    console.log('\n📝 generate - Content generation');
    console.log('\nUSAGE:');
    console.log('  generate <type> [options]');
    
    console.log('\nTYPES:');
    for (const [name, subcommand] of Object.entries(this.subcommands)) {
      console.log(`  ${name.padEnd(12)} ${subcommand.description}`);
    }
    
    console.log('\nEXAMPLES:');
    for (const example of this.examples) {
      console.log(`  ${example}`);
    }
    
    console.log('\nFor detailed help on specific type:');
    console.log('  generate <type> --help');
  }
}