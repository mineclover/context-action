/**
 * Clean LLMS Command Adapter - Adapts clean-llms-generate command to CLI interface
 */

import { CLICommand, CLIConfig, CleanLLMSOptions } from '../types/CLITypes.js';
import { createCleanLLMSGenerateCommand } from '../commands/clean-llms-generate.js';
import { ArgumentParser } from '../utils/ArgumentParser.js';

export class CleanLLMSCommandAdapter implements CLICommand {
  private config: CLIConfig;
  private argumentParser: ArgumentParser;

  constructor(config: CLIConfig) {
    this.config = config;
    this.argumentParser = new ArgumentParser();
  }

  async execute(args: string[]): Promise<void> {
    const cleanLLMSGenerateCommand = createCleanLLMSGenerateCommand();
    cleanLLMSGenerateCommand.exitOverride();
    
    try {
      await cleanLLMSGenerateCommand.parseAsync(['node', 'clean-llms-generate', ...args]);
    } catch (error: any) {
      if (error.code === 'commander.helpDisplayed') {
        return;
      }
      throw error;
    }
  }
}