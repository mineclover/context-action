#!/usr/bin/env node

/**
 * Priority CLI - Consolidated Priority Management
 * 
 * Consolidates all priority-related commands into a single CLI interface:
 * - Status reporting and statistics
 * - Priority file generation and validation
 * - Work list generation by tier and language
 * - Document information display
 * 
 * Usage:
 *   pnpm priority status
 *   pnpm priority generate
 *   pnpm priority validate
 *   pnpm priority worklist [tier] [--lang en|ko]
 *   pnpm priority critical [--lang en|ko]
 *   pnpm priority essential [--lang en|ko]
 *   pnpm priority info <documentId> [--lang en|ko]
 *   pnpm priority help
 * 
 * Replaces these package.json scripts:
 * - docs:priority, docs:priority:status, docs:priority:generate
 * - docs:priority:validate, docs:priority:worklist
 * - docs:priority:critical, docs:priority:essential
 */

import DocumentPriorityManager from './manage-document-priorities.js';

class PriorityCli {
  constructor() {
    this.manager = new DocumentPriorityManager();
    this.commands = {
      status: 'Show overall status report and statistics',
      generate: 'Generate missing priority.json files',
      validate: 'Validate all priority.json files against schema',
      worklist: 'Show work priority list [tier] [--lang]',
      critical: 'Show critical tier documents [--lang]',
      essential: 'Show essential tier documents [--lang]',
      info: 'Show document details <documentId> [--lang]',
      help: 'Show this help message'
    };
    
    this.supportedLanguages = ['en', 'ko'];
    this.supportedTiers = ['critical', 'essential', 'important', 'reference', 'supplementary'];
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('🎯 Priority CLI - Context-Action Framework\n');
    
    console.log('USAGE:');
    console.log('  pnpm priority <command> [arguments] [options]\n');
    
    console.log('COMMANDS:');
    Object.entries(this.commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(12)} ${desc}`);
    });
    
    console.log('\nOPTIONS:');
    console.log('  --lang <lang>    Language (en|ko, default: en)');
    console.log('  --help, -h       Show help message\n');
    
    console.log('EXAMPLES:');
    console.log('  pnpm priority status                    Show overall statistics');
    console.log('  pnpm priority generate                  Create missing priority files');
    console.log('  pnpm priority worklist --lang ko       Show KO work list');
    console.log('  pnpm priority critical                  Show critical tier documents');
    console.log('  pnpm priority essential --lang ko      Show KO essential documents');
    console.log('  pnpm priority info guide-concepts      Show document details');
    console.log('  pnpm priority validate                  Validate all priority files\n');
    
    console.log('TIER SHORTCUTS:');
    console.log('  critical     →  worklist critical');
    console.log('  essential    →  worklist essential\n');
    
    console.log('EQUIVALENT OLD COMMANDS:');
    console.log('  docs:priority:status        →  priority status');
    console.log('  docs:priority:generate      →  priority generate');
    console.log('  docs:priority:validate      →  priority validate');
    console.log('  docs:priority:worklist      →  priority worklist');
    console.log('  docs:priority:critical      →  priority critical');
    console.log('  docs:priority:essential     →  priority essential');
  }

  /**
   * Parse command line arguments
   */
  parseArgs(args) {
    const result = {
      command: null,
      arguments: [],
      language: 'en',
      showHelp: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--help' || arg === '-h') {
        result.showHelp = true;
      } else if (arg === '--lang' && i + 1 < args.length) {
        result.language = args[i + 1];
        i++;
      } else if (!result.command && Object.keys(this.commands).includes(arg)) {
        result.command = arg;
      } else if (result.command && !arg.startsWith('--')) {
        result.arguments.push(arg);
      }
    }

    return result;
  }

  /**
   * Validate parsed arguments
   */
  validateArgs(args) {
    const errors = [];

    // Validate language
    if (!this.supportedLanguages.includes(args.language)) {
      errors.push(`Unsupported language: ${args.language}. Use: ${this.supportedLanguages.join(', ')}`);
    }

    // Validate command
    if (!args.showHelp && !args.command) {
      errors.push('Command required. Use --help for available commands.');
    }

    if (args.command && !Object.keys(this.commands).includes(args.command)) {
      errors.push(`Unknown command: ${args.command}. Use --help for available commands.`);
    }

    // Validate command-specific arguments
    if (args.command === 'info') {
      if (args.arguments.length === 0) {
        errors.push('Document ID required for "info" command.');
      }
    }

    if (args.command === 'worklist' && args.arguments.length > 0) {
      const tier = args.arguments[0];
      if (!this.supportedTiers.includes(tier)) {
        errors.push(`Unsupported tier: ${tier}. Use: ${this.supportedTiers.join(', ')}`);
      }
    }

    return errors;
  }

  /**
   * Execute status command
   */
  async executeStatus() {
    console.log('📊 Generating priority status report...');
    this.manager.generateStatusReport();
  }

  /**
   * Execute generate command
   */
  async executeGenerate() {
    console.log('🔄 Generating missing priority files...');
    this.manager.generateMissingPriorityFiles();
  }

  /**
   * Execute validate command
   */
  async executeValidate() {
    console.log('🔍 Validating priority files...');
    this.manager.validateAllPriorityFiles();
  }

  /**
   * Execute worklist command
   */
  async executeWorklist(tier, language) {
    console.log(`📋 Generating work list${tier ? ` for ${tier} tier` : ''} (${language})...`);
    this.manager.generateWorkList(tier, language);
  }

  /**
   * Execute info command
   */
  async executeInfo(documentId, language) {
    console.log(`📄 Showing document information: ${documentId} (${language})...`);
    this.manager.showDocumentInfo(documentId, language);
  }

  /**
   * Main execution method
   */
  async run(args = []) {
    try {
      const parsedArgs = this.parseArgs(args);
      
      // Show help if requested or no args
      if (parsedArgs.showHelp || args.length === 0) {
        this.showHelp();
        return;
      }
      
      // Validate arguments
      const errors = this.validateArgs(parsedArgs);
      if (errors.length > 0) {
        console.error('❌ Validation errors:');
        errors.forEach(error => console.error(`  • ${error}`));
        console.error('\nUse --help for usage information.');
        process.exit(1);
      }
      
      // Execute command
      switch (parsedArgs.command) {
        case 'status':
          await this.executeStatus();
          break;
          
        case 'generate':
          await this.executeGenerate();
          console.log('\n✅ Priority file generation completed');
          break;
          
        case 'validate':
          await this.executeValidate();
          console.log('\n✅ Validation completed');
          break;
          
        case 'worklist':
          const tier = parsedArgs.arguments[0] || null;
          await this.executeWorklist(tier, parsedArgs.language);
          break;
          
        case 'critical':
          await this.executeWorklist('critical', parsedArgs.language);
          break;
          
        case 'essential':
          await this.executeWorklist('essential', parsedArgs.language);
          break;
          
        case 'info':
          const documentId = parsedArgs.arguments[0];
          await this.executeInfo(documentId, parsedArgs.language);
          break;
          
        case 'help':
          this.showHelp();
          break;
          
        default:
          throw new Error(`Unimplemented command: ${parsedArgs.command}`);
      }
      
    } catch (error) {
      console.error('\n❌ Command failed:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
}

/**
 * CLI entry point
 */
async function main() {
  const cli = new PriorityCli();
  const args = process.argv.slice(2);
  await cli.run(args);
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PriorityCli;