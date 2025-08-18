/**
 * LLMS Generate Command Adapter - Adapts LLMSGenerateCommand to CLI interface
 */

import { CLICommand, CLIConfig, LLMSGenerateOptions } from '../types/CLITypes.js';
import { LLMSGenerateCommand } from '../commands/LLMSGenerateCommand.js';
import { ArgumentParser } from '../utils/ArgumentParser.js';

export class LLMSGenerateCommandAdapter implements CLICommand {
  private llmsGenerateCommand: LLMSGenerateCommand;
  private argumentParser: ArgumentParser;

  constructor(config: CLIConfig) {
    this.llmsGenerateCommand = new LLMSGenerateCommand(config);
    this.argumentParser = new ArgumentParser();
  }

  async execute(args: string[]): Promise<void> {
    const options: LLMSGenerateOptions = {
      characterLimit: this.argumentParser.extractNumberFlag(args, '-c', '--character-limit'),
      category: this.argumentParser.extractFlag(args, '--category'),
      language: this.argumentParser.extractFlag(args, '-l', '--language') || 'ko',
      pattern: (this.argumentParser.extractFlag(args, '-p', '--pattern') || 'standard') as 'standard' | 'minimum' | 'origin',
      dryRun: args.includes('--dry-run'),
      verbose: args.includes('-v') || args.includes('--verbose')
    };

    await this.llmsGenerateCommand.execute(options);
  }
}