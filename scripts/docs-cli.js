#!/usr/bin/env node

/**
 * Docs CLI - Consolidated Documentation Analysis
 * 
 * Consolidates all documentation analysis commands into a single CLI interface:
 * - Document structure analysis and planning
 * - Document status checking and reporting
 * - Optimized structure generation
 * 
 * Usage:
 *   pnpm docs analyze
 *   pnpm docs status  
 *   pnpm docs optimized
 *   pnpm docs final
 *   pnpm docs help
 * 
 * Replaces these package.json scripts:
 * - docs:analyze, docs:status, docs:final, docs:optimized
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocsCli {
  constructor() {
    this.commands = {
      analyze: 'Analyze document structure and creation needs',
      status: 'Check document status and completion',
      optimized: 'Generate optimized document structure',
      final: 'Generate final document structure',
      help: 'Show this help message'
    };
    
    this.scriptMappings = {
      analyze: 'analyze-document-structure.js',
      status: 'check-document-status-v2.js', 
      optimized: 'generate-optimized-document-structure.js',
      final: 'generate-final-document-structure.js'
    };
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('📚 Docs CLI - Context-Action Framework\n');
    
    console.log('USAGE:');
    console.log('  pnpm docs <command> [options]\n');
    
    console.log('COMMANDS:');
    Object.entries(this.commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(12)} ${desc}`);
    });
    
    console.log('\nOPTIONS:');
    console.log('  --help, -h       Show help message\n');
    
    console.log('EXAMPLES:');
    console.log('  pnpm docs analyze       Analyze document structure');
    console.log('  pnpm docs status        Check document completion status');
    console.log('  pnpm docs optimized     Generate optimized structure');
    console.log('  pnpm docs final         Generate final structure\n');
    
    console.log('EQUIVALENT OLD COMMANDS:');
    console.log('  docs:analyze      →  docs analyze');
    console.log('  docs:status       →  docs status');
    console.log('  docs:optimized    →  docs optimized');
    console.log('  docs:final        →  docs final');
  }

  /**
   * Parse command line arguments
   */
  parseArgs(args) {
    const result = {
      command: null,
      showHelp: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--help' || arg === '-h') {
        result.showHelp = true;
      } else if (!result.command && Object.keys(this.commands).includes(arg)) {
        result.command = arg;
      }
    }

    return result;
  }

  /**
   * Validate parsed arguments
   */
  validateArgs(args) {
    const errors = [];

    // Validate command
    if (!args.showHelp && !args.command) {
      errors.push('Command required. Use --help for available commands.');
    }

    if (args.command && !Object.keys(this.commands).includes(args.command)) {
      errors.push(`Unknown command: ${args.command}. Use --help for available commands.`);
    }

    return errors;
  }

  /**
   * Execute a script by spawning a child process
   */
  async executeScript(scriptName) {
    const scriptPath = path.join(__dirname, scriptName);
    
    return new Promise((resolve, reject) => {
      console.log(`🚀 Running ${scriptName}...`);
      
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: __dirname
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Script ${scriptName} exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute ${scriptName}: ${error.message}`));
      });
    });
  }

  /**
   * Execute analyze command
   */
  async executeAnalyze() {
    console.log('📁 Running document structure analysis...');
    await this.executeScript(this.scriptMappings.analyze);
  }

  /**
   * Execute status command
   */
  async executeStatus() {
    console.log('📋 Checking document status...');
    await this.executeScript(this.scriptMappings.status);
  }

  /**
   * Execute optimized command
   */
  async executeOptimized() {
    console.log('⚡ Generating optimized document structure...');
    await this.executeScript(this.scriptMappings.optimized);
  }

  /**
   * Execute final command
   */
  async executeFinal() {
    console.log('🏁 Generating final document structure...');
    await this.executeScript(this.scriptMappings.final);
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
        case 'analyze':
          await this.executeAnalyze();
          console.log('\n✅ Document analysis completed');
          break;
          
        case 'status':
          await this.executeStatus();
          console.log('\n✅ Status check completed');
          break;
          
        case 'optimized':
          await this.executeOptimized();
          console.log('\n✅ Optimized structure generation completed');
          break;
          
        case 'final':
          await this.executeFinal();
          console.log('\n✅ Final structure generation completed');
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
  const cli = new DocsCli();
  const args = process.argv.slice(2);
  await cli.run(args);
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DocsCli;