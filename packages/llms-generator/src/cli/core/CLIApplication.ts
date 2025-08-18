/**
 * CLI Application - Main application class for LLMS Generator CLI
 * 
 * Handles command routing and application lifecycle
 */

import { CLICommand } from '../types/CLITypes.js';
import { ConfigLoader } from './ConfigLoader.js';
import { CommandFactory } from './CommandFactory.js';
import { ErrorHandler } from './ErrorHandler.js';
import { HelpDisplay } from './HelpDisplay.js';

export class CLIApplication {
  private configLoader: ConfigLoader;
  private commandFactory: CommandFactory;
  private errorHandler: ErrorHandler;
  private helpDisplay: HelpDisplay;

  constructor() {
    this.configLoader = new ConfigLoader();
    this.commandFactory = new CommandFactory();
    this.errorHandler = new ErrorHandler();
    this.helpDisplay = new HelpDisplay();
  }

  async run(args: string[]): Promise<void> {
    try {
      if (this.shouldShowHelp(args)) {
        this.helpDisplay.show();
        return;
      }

      const commandName = args[0];
      const commandArgs = args.slice(1);

      await this.executeCommand(commandName, commandArgs);
    } catch (error) {
      this.errorHandler.handle(error);
      process.exit(1);
    }
  }

  private shouldShowHelp(args: string[]): boolean {
    return args.length === 0 || 
           args[0] === 'help' || 
           args[0] === '--help' || 
           args[0] === '-h';
  }

  private async executeCommand(commandName: string, args: string[]): Promise<void> {
    const config = await this.configLoader.load();
    const command = this.commandFactory.create(commandName, config);
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    await command.execute(args);
  }
}