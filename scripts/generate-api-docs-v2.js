#!/usr/bin/env node

/**
 * API Documentation Generator using @context-action/test-driven-docs library
 *
 * This is the new implementation using the standalone library
 */

import { createDocumentationGenerator } from '../packages/test-driven-docs/dist/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generate API documentation using the test-driven-docs library
 */
async function generateApiDocs() {
  console.log('🚀 Starting API documentation generation with test-driven-docs library...');

  try {
    // Create documentation generator with library
    const generator = createDocumentationGenerator({
      packagesDir: path.join(__dirname, '../packages'),
      packages: ['core', 'react'],
      outputDir: path.join(__dirname, '../docs'),
      languages: ['en', 'ko'],

      // Processing options
      cleanMocks: true,
      extractTypes: true,
      categorizeExamples: true,
      includeComments: false,
      realistic: true,

      // Template configuration
      template: {
        type: 'enhanced',
        includeSections: {
          overview: true,
          quickStart: true,
          examples: true,
          advanced: true,
          errorHandling: true,
          performance: true,
          testCoverage: true,
          relatedAPIs: true
        }
      }
    });

    // Generate documentation
    const result = await generator.generate();

    // Report results
    if (result.success) {
      console.log('\\n🎉 Documentation generation completed successfully!');
      console.log(`📚 Generated documentation for ${result.apisGenerated.length} APIs:`);
      result.apisGenerated.forEach(api => {
        console.log(`  - ${api}`);
      });
      console.log(`\\n📊 Statistics:`);
      console.log(`  - Test files processed: ${result.filesProcessed}`);
      console.log(`  - Categories covered: ${result.categoriesCovered}`);
    } else {
      console.error('❌ Documentation generation failed');
      result.errors.forEach(error => {
        console.error(`  ${error.type}: ${error.message}`);
        if (error.file) console.error(`    File: ${error.file}`);
        if (error.api) console.error(`    API: ${error.api}`);
      });
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateApiDocs().catch(console.error);