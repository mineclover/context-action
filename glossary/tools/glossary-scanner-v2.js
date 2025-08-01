#!/usr/bin/env node

/**
 * New glossary scanner using @context-action/glossary package
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// Import from the new glossary package (when built)
async function loadGlossaryAPI() {
  try {
    // Try to import the built package directly
    const { createGlossaryAPI } = await import('../../packages/glossary/dist/index.js');
    return createGlossaryAPI;
  } catch (error) {
    console.log('⚠️  Could not import built package, trying npm package...');
    try {
      const { createGlossaryAPI } = await import('@context-action/glossary');
      return createGlossaryAPI;
    } catch (npmError) {
      throw new Error(`Could not import glossary package: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔍 Starting glossary scan with configuration...');
  
  try {
    const createGlossaryAPI = await loadGlossaryAPI();
    
    // Use configuration with proper paths for now
    const glossary = await createGlossaryAPI({
      rootDir,
      debug: true,
      scanPaths: [
        'example/src/**/*.{ts,tsx,js,jsx}',
        'packages/*/src/**/*.{ts,tsx,js,jsx}'
      ],
      excludePaths: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        '**/*.d.ts'
      ],
      glossaryPaths: {
        'core-concepts': join(rootDir, 'glossary/terms/core-concepts.md'),
        'architecture-terms': join(rootDir, 'glossary/terms/architecture-terms.md'),
        'api-terms': join(rootDir, 'glossary/terms/api-terms.md'),
        'naming-conventions': join(rootDir, 'glossary/terms/naming-conventions.md')
      }
    });

    // Scan for mappings
    const mappings = await glossary.scan();
    
    // Save mappings to the expected location
    const outputPath = join(__dirname, '../implementations/_data/mappings.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 2));
    
    console.log('✅ Scan completed successfully');
    console.log(`📄 Mappings saved to: ${path.relative(rootDir, outputPath)}`);
    
  } catch (error) {
    console.error('❌ Scan failed:', error.message);
    
    if (error.message.includes('Cannot find package')) {
      console.log('\n💡 It looks like the @context-action/glossary package is not built yet.');
      console.log('Please run: pnpm --filter @context-action/glossary build');
    }
    
    process.exit(1);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}