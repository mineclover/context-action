#!/usr/bin/env node

/**
 * Simple CLI interface for @context-action/llms-generator
 */

import path from 'path';
import { LLMSGenerator, DEFAULT_CONFIG } from '../index.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }

  const command = args[0];
  
  try {
    const config = createConfig();
    const generator = new LLMSGenerator(config);
    
    switch (command) {
      case 'minimum':
        console.log('🔗 Generating minimum content...');
        await generator.generate({
          languages: ['en'],
          formats: ['minimum']
        });
        console.log('✅ Minimum content generated!');
        break;
        
      case 'origin':
        console.log('📄 Generating origin content...');
        await generator.generate({
          languages: ['en'],
          formats: ['origin']
        });
        console.log('✅ Origin content generated!');
        break;
        
      case 'status':
        console.log('📊 LLMS Generator Status\n');
        console.log('Configuration:');
        console.log(`  Docs directory: ${config.paths.docsDir}`);
        console.log(`  LLM content directory: ${config.paths.llmContentDir}`);
        console.log(`  Output directory: ${config.paths.outputDir}`);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log('🚀 LLMS Generator CLI\n');
  console.log('USAGE:');
  console.log('  npx @context-action/llms-generator <command>\n');
  console.log('COMMANDS:');
  console.log('  minimum    Generate minimum format content');
  console.log('  origin     Generate origin format content');
  console.log('  status     Show generator status');
  console.log('  help       Show this help message');
}

function createConfig() {
  const config = { ...DEFAULT_CONFIG };
  
  // Try to find project root
  const cwd = process.cwd();
  if (cwd.includes('context-action')) {
    const projectRoot = cwd.substring(0, cwd.indexOf('context-action') + 'context-action'.length);
    config.paths.docsDir = path.join(projectRoot, 'docs');
    config.paths.llmContentDir = path.join(projectRoot, 'docs/llm-content');
    config.paths.outputDir = path.join(projectRoot, 'docs/llms');
  }

  return config;
}

main();