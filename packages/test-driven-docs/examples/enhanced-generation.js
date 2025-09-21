#!/usr/bin/env node

/**
 * Enhanced documentation generation with annotations example
 */

import { createDocumentationGenerator } from '@context-action/test-driven-docs';

async function enhancedExample() {
  console.log('✨ Enhanced Documentation Generation Example\n');

  // Create a documentation generator with enhanced options
  const generator = createDocumentationGenerator({
    packagesDir: './packages',
    packages: ['react'],
    outputDir: './docs/enhanced',
    languages: ['en'],
    enhanced: true,
    githubRepo: 'https://github.com/mineclover/context-action'
  });

  try {
    console.log('📝 Generating enhanced documentation...');
    const result = await generator.generateEnhanced();

    if (result.success) {
      console.log('✅ Enhanced documentation generated successfully!');
      console.log(`📊 Enhanced Stats:`);
      console.log(`   - APIs with annotations: ${result.annotatedAPIs.length}`);
      console.log(`   - Categories: ${result.categories.join(', ')}`);
      console.log(`   - Priority examples: ${result.priorityExamples.high} high, ${result.priorityExamples.medium} medium`);
      console.log(`   - GitHub links: ${result.githubLinksGenerated}`);
    } else {
      console.error('❌ Enhanced documentation generation failed:');
      result.errors.forEach(error => console.error(`   - ${error}`));
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

enhancedExample().catch(console.error);