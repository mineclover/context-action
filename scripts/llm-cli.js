#!/usr/bin/env node

/**
 * LLM CLI - Consolidated LLM Content Management
 * 
 * Consolidates all LLM-related commands into a single CLI interface:
 * - Generate minimum/origin content by language
 * - Character-limited content generation  
 * - Status analysis and reporting
 * 
 * Usage:
 *   pnpm llms minimum [--lang en|ko]
 *   pnpm llms origin [--lang en|ko] 
 *   pnpm llms chars <count> [--lang en|ko]
 *   pnpm llms status
 *   pnpm llms help
 * 
 * Replaces these package.json scripts:
 * - docs:llms, docs:llms:minimum, docs:llms:minimum:ko
 * - docs:llms:origin, docs:llms:origin:ko
 * - docs:llms:chars, docs:llms:status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdaptiveLLMGenerator from './generate-llms-adaptive.js';
import LLMGenerationAnalyzer from './analyze-llm-generation-status.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LLMCli {
  constructor() {
    this.commands = {
      minimum: 'Generate minimum content (navigation links)',
      origin: 'Generate origin content (full documents)',
      chars: 'Generate character-limited content',
      status: 'Show generation status and statistics',
      help: 'Show this help message'
    };
    
    this.supportedLanguages = ['en', 'ko'];
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('🚀 LLM CLI - Context-Action Framework\n');
    
    console.log('USAGE:');
    console.log('  pnpm llms <command> [options]\n');
    
    console.log('COMMANDS:');
    Object.entries(this.commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(10)} ${desc}`);
    });
    
    console.log('\nOPTIONS:');
    console.log('  --lang <lang>    Language (en|ko, default: en)');
    console.log('  --help, -h       Show help message\n');
    
    console.log('EXAMPLES:');
    console.log('  pnpm llms minimum           Generate EN minimum content');
    console.log('  pnpm llms minimum --lang ko Generate KO minimum content');
    console.log('  pnpm llms origin            Generate EN origin content');
    console.log('  pnpm llms chars 5000        Generate 5000-character content');
    console.log('  pnpm llms status            Show generation status\n');
    
    console.log('EQUIVALENT OLD COMMANDS:');
    console.log('  docs:llms:minimum     →  llms minimum');
    console.log('  docs:llms:minimum:ko  →  llms minimum --lang ko');
    console.log('  docs:llms:origin      →  llms origin');
    console.log('  docs:llms:origin:ko   →  llms origin --lang ko');
    console.log('  docs:llms:chars       →  llms chars <count>');
    console.log('  docs:llms:status      →  llms status');
  }

  /**
   * Parse command line arguments
   */
  parseArgs(args) {
    const result = {
      command: null,
      language: 'en',
      chars: null,
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
      } else if (result.command === 'chars' && !result.chars && /^\d+$/.test(arg)) {
        result.chars = parseInt(arg);
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

    // Validate chars command
    if (args.command === 'chars') {
      if (!args.chars || args.chars < 100 || args.chars > 50000) {
        errors.push('Character count required for "chars" command (100-50000).');
      }
    }

    return errors;
  }

  /**
   * Execute minimum command
   */
  async executeMinimum(language) {
    console.log(`🔗 Generating minimum content (${language})...`);
    
    const generator = new AdaptiveLLMGenerator();
    const outputPath = await generator.generate({
      type: 'minimum',
      language
    });
    
    return outputPath;
  }

  /**
   * Execute origin command
   */
  async executeOrigin(language) {
    console.log(`📄 Generating origin content (${language})...`);
    
    const generator = new AdaptiveLLMGenerator();
    const outputPath = await generator.generate({
      type: 'origin',
      language
    });
    
    return outputPath;
  }

  /**
   * Execute chars command
   */
  async executeChars(chars, language) {
    console.log(`📏 Generating ${chars}-character content (${language})...`);
    
    const generator = new AdaptiveLLMGenerator();
    const outputPath = await generator.generate({
      type: 'chars',
      chars,
      language
    });
    
    return outputPath;
  }

  /**
   * Execute status command
   */
  async executeStatus() {
    console.log('📊 Analyzing LLM generation status...');
    
    const analyzer = new LLMGenerationAnalyzer();
    await analyzer.run();
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
      let result;
      switch (parsedArgs.command) {
        case 'minimum':
          result = await this.executeMinimum(parsedArgs.language);
          console.log(`\n✅ Minimum content generated: ${result}`);
          break;
          
        case 'origin':
          result = await this.executeOrigin(parsedArgs.language);
          console.log(`\n✅ Origin content generated: ${result}`);
          break;
          
        case 'chars':
          result = await this.executeChars(parsedArgs.chars, parsedArgs.language);
          console.log(`\n✅ Character-limited content generated: ${result}`);
          break;
          
        case 'status':
          await this.executeStatus();
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
  const cli = new LLMCli();
  const args = process.argv.slice(2);
  await cli.run(args);
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default LLMCli;