#!/usr/bin/env node

/**
 * Basic usage example for @context-action/test-driven-docs
 */

import { createDocumentationGenerator } from '@context-action/test-driven-docs';

async function basicExample() {
  console.log('🚀 Basic Documentation Generation Example\n');

  // Create a documentation generator
  const generator = createDocumentationGenerator({
    packagesDir: './packages',
    packages: ['core', 'react'],
    outputDir: './docs',
    languages: ['en']
  });

  try {
    console.log('📝 Generating documentation...');
    const result = await generator.generate();

    if (result.success) {
      console.log('✅ Documentation generated successfully!');
      console.log(`📊 Stats:`);
      console.log(`   - APIs: ${result.apisGenerated.length}`);
      console.log(`   - Examples: ${result.examplesGenerated}`);
      console.log(`   - Categories: ${result.categoriesGenerated.length}`);
    } else {
      console.error('❌ Documentation generation failed:');
      result.errors.forEach(error => console.error(`   - ${error}`));
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

basicExample().catch(console.error);