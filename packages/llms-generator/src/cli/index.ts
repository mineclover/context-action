#!/usr/bin/env node

/**
 * Simple CLI interface for @context-action/llms-generator
 */

import path from 'path';
import { LLMSGenerator, PriorityGenerator, SchemaGenerator, DEFAULT_CONFIG } from '../index.js';

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
    const priorityGenerator = new PriorityGenerator(config);
    const schemaGenerator = new SchemaGenerator(config);
    
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
        
      case 'priority-generate':
        const priorityLanguage = args[1] || 'en';
        const dryRun = args.includes('--dry-run');
        const overwrite = args.includes('--overwrite');
        
        console.log(`📝 ${dryRun ? '[DRY RUN] ' : ''}Generating priority files for language: ${priorityLanguage}`);
        await priorityGenerator.initialize();
        
        const result = await priorityGenerator.bulkGeneratePriorities({
          languages: [priorityLanguage],
          dryRun,
          overwriteExisting: overwrite
        });
        
        console.log('\n📊 Generation Summary:');
        console.log(`  Total discovered: ${result.summary.totalDiscovered}`);
        console.log(`  Generated: ${result.summary.totalGenerated}`);
        console.log(`  Skipped: ${result.summary.totalSkipped}`);
        console.log(`  Errors: ${result.summary.totalErrors}`);
        
        if (result.errors.length > 0) {
          console.log('\n❌ Errors:');
          result.errors.forEach(error => {
            console.log(`  ${error.document.documentId}: ${error.error}`);
          });
        }
        break;
        
      case 'priority-stats':
        const statsLanguage = args[1] || 'en';
        console.log(`📊 Priority Statistics for language: ${statsLanguage}\n`);
        
        await priorityGenerator.initialize();
        const stats = await priorityGenerator.getGenerationStats(statsLanguage);
        
        console.log(`Total documents: ${stats.totalDocuments}`);
        console.log(`With priorities: ${stats.withPriorities}`);
        console.log(`Without priorities: ${stats.withoutPriorities}`);
        console.log('\nBy category:');
        
        Object.entries(stats.byCategory).forEach(([category, data]) => {
          const percentage = data.total > 0 ? Math.round((data.withPriorities / data.total) * 100) : 0;
          console.log(`  ${category}: ${data.withPriorities}/${data.total} (${percentage}%)`);
        });
        break;
        
      case 'discover':
        const discoverLanguage = args[1] || 'en';
        console.log(`🔍 Discovering documents for language: ${discoverLanguage}\n`);
        
        const documents = await priorityGenerator.discoverDocuments(discoverLanguage);
        console.log(`Found ${documents.length} documents:\n`);
        
        const byCategory = documents.reduce((acc, doc) => {
          if (!acc[doc.category]) acc[doc.category] = [];
          acc[doc.category].push(doc);
          return acc;
        }, {} as Record<string, typeof documents>);
        
        Object.entries(byCategory).forEach(([category, docs]) => {
          console.log(`${category.toUpperCase()} (${docs.length}):`);
          docs.forEach(doc => {
            const size = doc.stats ? `${Math.round(doc.stats.size / 1024)}KB` : 'unknown';
            console.log(`  ${doc.documentId} (${size})`);
          });
          console.log();
        });
        break;
        
      case 'schema-generate':
        const outputDir = args[1] || path.join(config.paths.llmContentDir, 'generated');
        const generateTypes = !args.includes('--no-types');
        const generateValidators = !args.includes('--no-validators');
        const schemaLanguage = args.includes('--javascript') ? 'javascript' : 'typescript';
        const format = args.includes('--cjs') ? 'cjs' : 'esm';
        const overwriteSchema = args.includes('--overwrite');
        
        console.log(`🔧 Generating schema files...`);
        console.log(`  Output directory: ${outputDir}`);
        console.log(`  Generate types: ${generateTypes}`);
        console.log(`  Generate validators: ${generateValidators}`);
        console.log(`  Language: ${schemaLanguage}`);
        console.log(`  Format: ${format}`);
        
        const schemaResult = await schemaGenerator.generateSchemaFiles({
          outputDir,
          generateTypes,
          generateValidators,
          language: schemaLanguage as 'typescript' | 'javascript',
          format: format as 'esm' | 'cjs',
          overwrite: overwriteSchema
        });
        
        if (schemaResult.success) {
          console.log('\n✅ Schema generation completed successfully!');
          console.log('\n📊 Summary:');
          console.log(`  Types generated: ${schemaResult.summary.typesGenerated ? 'Yes' : 'No'}`);
          console.log(`  Validators generated: ${schemaResult.summary.validatorsGenerated ? 'Yes' : 'No'}`);
          console.log(`  Schemas copied: ${schemaResult.summary.schemasCopied}`);
          console.log(`  Total files: ${schemaResult.generated.length}`);
          
          if (schemaResult.generated.length > 0) {
            console.log('\n📁 Generated files:');
            schemaResult.generated.forEach(file => {
              console.log(`  ✅ ${file}`);
            });
          }
        } else {
          console.error('\n❌ Schema generation failed!');
          schemaResult.errors.forEach(error => {
            console.error(`  Error: ${error}`);
          });
        }
        break;
        
      case 'schema-info':
        console.log('🔍 Schema Information\n');
        
        const schemaInfo = await schemaGenerator.getSchemaInfo();
        
        if (schemaInfo.exists) {
          console.log(`Schema file: ${schemaInfo.path}`);
          console.log(`Title: ${schemaInfo.title || 'Not specified'}`);
          console.log(`Description: ${schemaInfo.description || 'Not specified'}`);
          console.log(`Version: ${schemaInfo.version || 'Not specified'}`);
          console.log(`Properties: ${schemaInfo.properties.length} (${schemaInfo.properties.join(', ')})`);
          console.log(`Definitions: ${schemaInfo.definitions.length} (${schemaInfo.definitions.join(', ')})`);
        } else {
          console.log(`❌ Schema file not found: ${schemaInfo.path}`);
        }
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
  console.log('  npx @context-action/llms-generator <command> [options]\n');
  console.log('CONTENT GENERATION:');
  console.log('  minimum              Generate minimum format content');
  console.log('  origin               Generate origin format content');
  console.log('');
  console.log('PRIORITY MANAGEMENT:');
  console.log('  priority-generate [lang] [--dry-run] [--overwrite]');
  console.log('                       Generate priority.json files for all documents');
  console.log('  priority-stats [lang] Show priority generation statistics');
  console.log('  discover [lang]      Discover all available documents');
  console.log('');
  console.log('SCHEMA MANAGEMENT:');
  console.log('  schema-generate [outputDir] [--no-types] [--no-validators] [--javascript] [--cjs] [--overwrite]');
  console.log('                       Generate TypeScript types and validators from schema');
  console.log('  schema-info          Show schema file information');
  console.log('');
  console.log('OTHER:');
  console.log('  status               Show generator status');
  console.log('  help                 Show this help message');
  console.log('');
  console.log('EXAMPLES:');
  console.log('  npx @context-action/llms-generator priority-generate en --dry-run');
  console.log('  npx @context-action/llms-generator priority-stats ko');
  console.log('  npx @context-action/llms-generator discover en');
  console.log('  npx @context-action/llms-generator schema-generate ./generated --overwrite');
  console.log('  npx @context-action/llms-generator schema-info');
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