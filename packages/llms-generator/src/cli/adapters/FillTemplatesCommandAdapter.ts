/**
 * Fill Templates Command Adapter
 */

import { CLICommand, CLIConfig } from '../types/CLITypes.js';
import { FillTemplatesCommand } from '../commands/FillTemplatesCommand.js';
import { ArgumentParser } from '../utils/ArgumentParser.js';

export class FillTemplatesCommandAdapter implements CLICommand {
  private fillTemplatesCommand: FillTemplatesCommand;
  private argumentParser: ArgumentParser;

  constructor(config: CLIConfig) {
    this.fillTemplatesCommand = new FillTemplatesCommand(config);
    this.argumentParser = new ArgumentParser();
  }

  async execute(args: string[]): Promise<void> {
    const options = {
      language: this.argumentParser.extractFlag(args, '-l', '--language') || 'en',
      category: this.argumentParser.extractFlag(args, '--category'),
      characterLimit: this.argumentParser.extractNumberFlag(args, '-c', '--character-limit'),
      dryRun: args.includes('--dry-run'),
      verbose: args.includes('-v') || args.includes('--verbose'),
      overwrite: args.includes('--overwrite')
    };

    await this.fillTemplatesCommand.execute(options);
  }
}