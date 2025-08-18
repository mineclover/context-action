/**
 * Command Factory - Creates command instances
 */

import { CLICommand, CLIConfig } from '../types/CLITypes.js';
import { WorkNextCommandAdapter } from '../adapters/WorkNextCommandAdapter.js';
import { LLMSGenerateCommandAdapter } from '../adapters/LLMSGenerateCommandAdapter.js';
import { CleanLLMSCommandAdapter } from '../adapters/CleanLLMSCommandAdapter.js';

export class CommandFactory {
  create(commandName: string, config: CLIConfig): CLICommand | null {
    switch (commandName) {
      case 'work-next':
        return new WorkNextCommandAdapter(config);
      
      case 'llms-generate':
        return new LLMSGenerateCommandAdapter(config);
      
      case 'clean-llms-generate':
        return new CleanLLMSCommandAdapter(config);
      
      default:
        return null;
    }
  }
}