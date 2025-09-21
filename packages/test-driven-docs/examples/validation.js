#!/usr/bin/env node

/**
 * Documentation validation example
 */

import { createDocumentationGenerator } from '@context-action/test-driven-docs';

async function validationExample() {
  console.log('🔍 Documentation Validation Example\n');

  const generator = createDocumentationGenerator({
    packagesDir: './packages',
    packages: ['react'],
    outputDir: './docs'
  });

  try {
    console.log('🔍 Validating documentation consistency...');
    const validationResult = await generator.validateConsistency();

    console.log('📊 Validation Results:');
    console.log(`   - Overall Score: ${validationResult.overallScore}%`);
    console.log(`   - Sync Status: ${validationResult.syncStatus}`);

    if (validationResult.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      validationResult.issues.forEach(issue => {
        console.log(`   - ${issue.type}: ${issue.description}`);
        if (issue.file) console.log(`     File: ${issue.file}`);
      });
    } else {
      console.log('\n✅ No issues found - documentation is perfectly synchronized!');
    }

    if (validationResult.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      validationResult.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }

    console.log('\n📝 Generating documentation with validation...');
    const generationResult = await generator.generateWithValidation();

    console.log(`✅ Generated ${generationResult.generation.apisGenerated.length} API docs`);
    console.log(`🔍 Validation score: ${generationResult.validation.overallScore}%`);

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

validationExample().catch(console.error);