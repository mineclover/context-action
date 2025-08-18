/**
 * Init Command Adapter - Adapts InitCommand to CLI interface
 */

import { CLICommand, CLIConfig } from '../types/CLITypes.js';
import { InitCommand } from '../commands-legacy/InitCommand.js';
import { ArgumentParser } from '../utils/ArgumentParser.js';

export interface InitOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  quiet?: boolean;
  skipDiscovery?: boolean;
  skipPriority?: boolean;
  skipTemplates?: boolean;
}

export class InitCommandAdapter implements CLICommand {
  private initCommand: InitCommand;
  private argumentParser: ArgumentParser;

  constructor(config: CLIConfig) {
    // Convert CLIConfig to the format expected by InitCommand
    const legacyConfig = {
      paths: {
        docsDir: config.paths.docsDir,
        llmContentDir: config.paths.llmContentDir,
        outputDir: config.paths.outputDir,
        templatesDir: config.paths.templatesDir,
        instructionsDir: config.paths.instructionsDir
      },
      generation: {
        supportedLanguages: config.generation.supportedLanguages,
        characterLimits: config.generation.characterLimits,
        defaultLanguage: config.generation.defaultLanguage,
        outputFormat: config.generation.outputFormat
      },
      quality: config.quality,
      categories: config.categories || {}
    };
    
    this.initCommand = new InitCommand(legacyConfig);
    this.argumentParser = new ArgumentParser();
  }

  async execute(args: string[]): Promise<void> {
    const options: InitOptions = {
      dryRun: args.includes('--dry-run'),
      overwrite: args.includes('--overwrite'),
      quiet: args.includes('--quiet'),
      skipDiscovery: args.includes('--skip-discovery'),
      skipPriority: args.includes('--skip-priority'),
      skipTemplates: args.includes('--skip-templates')
    };

    await this.initCommand.execute(options);
  }
}