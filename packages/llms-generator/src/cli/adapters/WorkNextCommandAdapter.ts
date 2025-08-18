/**
 * Work Next Command Adapter - Adapts WorkNextCommand to CLI interface
 */

import { CLICommand, CLIConfig, WorkNextOptions } from '../types/CLITypes.js';
import { WorkNextCommand } from '../commands/WorkNextCommand.js';
import { ArgumentParser } from '../utils/ArgumentParser.js';

export class WorkNextCommandAdapter implements CLICommand {
  private workNextCommand: WorkNextCommand;
  private argumentParser: ArgumentParser;

  constructor(config: CLIConfig) {
    this.workNextCommand = new WorkNextCommand(config);
    this.argumentParser = new ArgumentParser();
  }

  async execute(args: string[]): Promise<void> {
    const options: WorkNextOptions = {
      language: this.argumentParser.extractFlag(args, '-l', '--language') || 'ko',
      showCompleted: args.includes('--show-completed'),
      verbose: args.includes('-v') || args.includes('--verbose')
    };

    await this.workNextCommand.execute(options);
  }
}