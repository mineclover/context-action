#!/usr/bin/env node

/**
 * New glossary validator using @context-action/glossary package
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
  console.log('🔍 Starting glossary validation with configuration...');
  
  try {
    const createGlossaryAPI = await loadGlossaryAPI();
    
    // Use configuration with proper paths for now
    const glossary = await createGlossaryAPI({
      rootDir,
      debug: true,
      glossaryPaths: {
        'core-concepts': join(rootDir, 'glossary/terms/core-concepts.md'),
        'architecture-terms': join(rootDir, 'glossary/terms/architecture-terms.md'),
        'api-terms': join(rootDir, 'glossary/terms/api-terms.md'),
        'naming-conventions': join(rootDir, 'glossary/terms/naming-conventions.md')
      }
    });

    // Load existing mappings
    const mappingsPath = join(__dirname, '../implementations/_data/mappings.json');
    
    if (!fs.existsSync(mappingsPath)) {
      console.error('❌ Mappings file not found. Run scanner first.');
      process.exit(1);
    }
    
    const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
    
    // Validate mappings
    const validation = await glossary.validate(mappings);
    
    // Save validation report
    const reportPath = join(__dirname, '../implementations/_data/validation-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(validation, null, 2));
    
    // Print results
    if (validation.success) {
      console.log('✅ All validations passed!');
    } else {
      console.log(`❌ Found ${validation.summary.errors} errors`);
    }
    
    if (validation.summary.warnings > 0) {
      console.log(`⚠️  Found ${validation.summary.warnings} warnings`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Glossary terms: ${validation.summary.glossaryTerms}`);
    console.log(`  Mapped terms: ${validation.summary.mappedTerms} (${validation.summary.implementationRate}%)`);
    
    console.log(`\n📄 Report saved to: ${path.relative(rootDir, reportPath)}`);
    
    // Exit with error code if validation failed
    if (!validation.success) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    
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