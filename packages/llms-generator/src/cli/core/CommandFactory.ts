/**
 * Command Factory - Creates command instances
 */

import { CLICommand, CLIConfig } from '../types/CLITypes.js';
import { WorkNextCommandAdapter } from '../adapters/WorkNextCommandAdapter.js';
import { LLMSGenerateCommandAdapter } from '../adapters/LLMSGenerateCommandAdapter.js';
import { CleanLLMSCommandAdapter } from '../adapters/CleanLLMSCommandAdapter.js';
import { InitCommandAdapter } from '../adapters/InitCommandAdapter.js';
import { FillTemplatesCommandAdapter } from '../adapters/FillTemplatesCommandAdapter.js';

export class CommandFactory {
  create(commandName: string, config: CLIConfig): CLICommand | null {
    switch (commandName) {
      case 'init':
        return new InitCommandAdapter(config);
      
      case 'work-next':
        return new WorkNextCommandAdapter(config);
      
      case 'llms-generate':
        return new LLMSGenerateCommandAdapter(config);
      
      case 'clean-llms-generate':
        return new CleanLLMSCommandAdapter(config);
      
      case 'fill-templates':
        return new FillTemplatesCommandAdapter(config);
      
      default:
        return null;
    }
  }
}