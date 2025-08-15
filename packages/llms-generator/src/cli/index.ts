#!/usr/bin/env node

/**
 * Simple CLI interface for @context-action/llms-generator
 */

import path from 'path';
import { LLMSGenerator, PriorityGenerator, SchemaGenerator, MarkdownGenerator, ContentExtractor, AdaptiveComposer, DEFAULT_CONFIG } from '../index.js';
import { WorkStatusManager } from '../core/WorkStatusManager.js';
import { ConfigManager } from '../core/ConfigManager.js';
import type { ResolvedConfig } from '../types/user-config.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }

  const command = args[0];
  
  try {
    // Load user configuration
    const userConfig = await ConfigManager.findAndLoadConfig();
    const config = createConfigFromUserConfig(userConfig);
    const generator = new LLMSGenerator(config);
    const priorityGenerator = new PriorityGenerator(config);
    const schemaGenerator = new SchemaGenerator(config);
    const markdownGenerator = new MarkdownGenerator(config);
    const contentExtractor = new ContentExtractor(config);
    const adaptiveComposer = new AdaptiveComposer(config);
    const workStatusManager = new WorkStatusManager(config);
    
    // Get enabled character limits from config
    const enabledCharLimits = ConfigManager.getEnabledCharacterLimits(userConfig);
    
    switch (command) {
      // Config management commands
      case 'config-init':
        const preset = (args[1] as 'minimal' | 'standard' | 'extended' | 'blog' | 'documentation') || 'standard';
        const configPath = args.find(arg => arg.startsWith('--path='))?.split('=')[1] || 'llms-generator.config.json';
        
        console.log(`🔧 Initializing configuration with preset: ${preset}`);
        console.log(`📂 Config path: ${configPath}`);
        
        const sampleConfig = ConfigManager.generateSampleConfig(preset);
        await ConfigManager.saveConfig(sampleConfig, configPath);
        
        console.log('✅ Configuration file created successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. Edit the configuration file to customize character limits');
        console.log('  2. Run config-validate to check your configuration');
        console.log('  3. Run config-show to see the resolved configuration');
        break;
        
      case 'config-show':
        console.log('🔧 Current Configuration\n');
        
        console.log(`Config file: ${userConfig.resolvedPaths.configFile || 'Default'}`);
        console.log(`Project root: ${userConfig.resolvedPaths.projectRoot}\n`);
        
        console.log('📁 Paths:');
        console.log(`  Docs directory: ${userConfig.resolvedPaths.docsDir}`);
        console.log(`  Data directory: ${userConfig.resolvedPaths.dataDir}`);
        console.log(`  Output directory: ${userConfig.resolvedPaths.outputDir}\n`);
        
        console.log('📏 Character Limits:');
        userConfig.characterLimits.forEach(limit => {
          console.log(`  ${limit} chars`);
        });
        
        console.log(`\n🌐 Languages: ${userConfig.languages.join(', ')}`);
        break;
        
      case 'config-validate':
        console.log('🔍 Validating Configuration\n');
        
        const validation = ConfigManager.validateConfig(userConfig);
        
        if (validation.valid) {
          console.log('✅ Configuration is valid!');
          console.log(`\n📊 Summary:`);
          console.log(`  Character limits: ${enabledCharLimits.length} (${enabledCharLimits.join(', ')})`);
          console.log(`  Languages: ${userConfig.languages.length} (${userConfig.languages.join(', ')})`);
        } else {
          console.log('❌ Configuration has errors:\n');
          validation.errors.forEach(error => {
            console.log(`  • ${error}`);
          });
          process.exit(1);
        }
        break;
        
      case 'config-limits':
        console.log('📏 Character Limits\n');
        
        userConfig.characterLimits.sort((a, b) => a - b).forEach(limit => {
          console.log(`  ${limit} chars`);
        });
        
        if (userConfig.characterLimits.length === 0) {
          console.log('No character limits found.');
        }
        break;

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
        
      case 'chars':
        const charsLimit = parseInt(args[1]);
        const charsLanguage = args[2] || 'en';
        
        if (!charsLimit || charsLimit <= 0) {
          console.error('❌ Invalid character limit. Usage: chars <limit> [language]');
          process.exit(1);
        }
        
        console.log(`📏 Generating ${charsLimit}-character content for ${charsLanguage}...`);
        await generator.generate({
          languages: [charsLanguage],
          formats: ['chars'],
          characterLimits: [charsLimit]
        });
        console.log(`✅ ${charsLimit}-character content generated!`);
        break;
        
      case 'batch':
        const batchLanguages = args.find(arg => arg.startsWith('--lang='))?.split('=')[1]?.split(',') || userConfig.languages || ['en'];
        const batchLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number) || enabledCharLimits;
        
        console.log(`🚀 Batch generating for languages: ${batchLanguages.join(', ')}`);
        console.log(`📏 Character limits: ${batchLimits.join(', ')}`);
        
        await generator.generate({
          languages: batchLanguages,
          formats: ['minimum', 'origin', 'chars'],
          characterLimits: batchLimits
        });
        console.log('✅ Batch generation completed!');
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
        
      case 'markdown-generate':
        const mdLanguage = args[1] || userConfig.languages[0] || 'en';
        const mdDryRun = args.includes('--dry-run');
        const mdOverwrite = args.includes('--overwrite');
        const mdCharLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number) || enabledCharLimits;
        
        console.log(`📝 ${mdDryRun ? '[DRY RUN] ' : ''}Generating markdown files for language: ${mdLanguage}`);
        console.log(`📏 Character limits: ${mdCharLimits.join(', ')}`);
        
        const mdResult = await markdownGenerator.generateByCharacterLimits(mdLanguage, mdCharLimits, {
          dryRun: mdDryRun,
          overwrite: mdOverwrite
        });
        
        console.log('\n📊 Generation Summary:');
        console.log(`  Total generated: ${mdResult.summary.totalGenerated}`);
        console.log(`  Total errors: ${mdResult.summary.totalErrors}`);
        console.log(`  By character limit:`);
        Object.entries(mdResult.summary.byCharacterLimit).forEach(([limit, count]) => {
          console.log(`    ${limit}chars: ${count} files`);
        });
        
        if (mdResult.errors.length > 0) {
          console.log('\n❌ Errors:');
          mdResult.errors.forEach(error => {
            console.log(`  ${error}`);
          });
        }
        break;
        
      case 'markdown-all':
        const allLanguages = args.find(arg => arg.startsWith('--lang='))?.split('=')[1]?.split(',') || userConfig.languages;
        const allDryRun = args.includes('--dry-run');
        const allOverwrite = args.includes('--overwrite');
        
        console.log(`📝 ${allDryRun ? '[DRY RUN] ' : ''}Generating all markdown files for languages: ${allLanguages.join(', ')}`);
        
        const allResult = await markdownGenerator.generateMarkdownFiles({
          languages: allLanguages,
          dryRun: allDryRun,
          overwrite: allOverwrite
        });
        
        console.log('\n📊 Generation Summary:');
        console.log(`  Total generated: ${allResult.summary.totalGenerated}`);
        console.log(`  Total errors: ${allResult.summary.totalErrors}`);
        console.log(`  By language:`);
        Object.entries(allResult.summary.byLanguage).forEach(([lang, count]) => {
          console.log(`    ${lang}: ${count} files`);
        });
        console.log(`  By character limit:`);
        Object.entries(allResult.summary.byCharacterLimit).forEach(([limit, count]) => {
          console.log(`    ${limit}chars: ${count} files`);
        });
        
        if (allResult.errors.length > 0) {
          console.log('\n❌ Errors:');
          allResult.errors.forEach(error => {
            console.log(`  ${error}`);
          });
        }
        break;
        
      case 'extract':
        const extractLanguage = args[1] || userConfig.languages[0] || 'en';
        const extractDryRun = args.includes('--dry-run');
        const extractOverwrite = args.includes('--overwrite');
        const extractCharLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number) || enabledCharLimits;
        
        console.log(`📝 ${extractDryRun ? '[DRY RUN] ' : ''}Extracting content summaries for language: ${extractLanguage}`);
        console.log(`📏 Character limits: ${extractCharLimits.join(', ')}`);
        
        const extractResult = await contentExtractor.extractByCharacterLimits(extractLanguage, extractCharLimits, {
          dryRun: extractDryRun,
          overwrite: extractOverwrite
        });
        
        console.log('\n📊 Extraction Summary:');
        console.log(`  Total extracted: ${extractResult.summary.totalGenerated}`);
        console.log(`  Total errors: ${extractResult.summary.totalErrors}`);
        console.log(`  By character limit:`);
        Object.entries(extractResult.summary.byCharacterLimit).forEach(([limit, count]) => {
          console.log(`    ${limit}chars: ${count} files`);
        });
        
        if (extractResult.errors.length > 0) {
          console.log('\n❌ Errors:');
          extractResult.errors.forEach(error => {
            console.log(`  ${error}`);
          });
        }
        break;
        
      case 'extract-all':
        const extractAllLanguages = args.find(arg => arg.startsWith('--lang='))?.split('=')[1]?.split(',') || userConfig.languages;
        const extractAllDryRun = args.includes('--dry-run');
        const extractAllOverwrite = args.includes('--overwrite');
        
        console.log(`📝 ${extractAllDryRun ? '[DRY RUN] ' : ''}Extracting all content summaries for languages: ${extractAllLanguages.join(', ')}`);
        
        const extractAllResult = await contentExtractor.extractContentSummaries({
          languages: extractAllLanguages,
          dryRun: extractAllDryRun,
          overwrite: extractAllOverwrite
        });
        
        console.log('\n📊 Extraction Summary:');
        console.log(`  Total extracted: ${extractAllResult.summary.totalGenerated}`);
        console.log(`  Total errors: ${extractAllResult.summary.totalErrors}`);
        console.log(`  By language:`);
        Object.entries(extractAllResult.summary.byLanguage).forEach(([lang, count]) => {
          console.log(`    ${lang}: ${count} files`);
        });
        console.log(`  By character limit:`);
        Object.entries(extractAllResult.summary.byCharacterLimit).forEach(([limit, count]) => {
          console.log(`    ${limit}chars: ${count} files`);
        });
        
        if (extractAllResult.errors.length > 0) {
          console.log('\n❌ Errors:');
          extractAllResult.errors.forEach(error => {
            console.log(`  ${error}`);
          });
        }
        break;

      case 'compose':
        const composeLanguage = args[1] || userConfig.languages[0] || 'ko';
        const composeCharLimit = parseInt(args[2]) || 5000;
        const composeDryRun = args.includes('--dry-run');
        const composeNoToc = args.includes('--no-toc');
        const composePriorityThreshold = parseInt(args.find(arg => arg.startsWith('--priority='))?.split('=')[1] || '0');
        
        console.log(`🎯 ${composeDryRun ? '[DRY RUN] ' : ''}Composing adaptive content for language: ${composeLanguage}`);
        console.log(`📏 Character limit: ${composeCharLimit}`);
        console.log(`📋 Table of contents: ${composeNoToc ? 'disabled' : 'enabled'}`);
        console.log(`⭐ Priority threshold: ${composePriorityThreshold}`);
        
        if (!composeDryRun) {
          const composeResult = await adaptiveComposer.composeAdaptiveContent({
            language: composeLanguage,
            characterLimit: composeCharLimit,
            includeTableOfContents: !composeNoToc,
            priorityThreshold: composePriorityThreshold
          });
          
          console.log('\\n📊 Composition Summary:');
          console.log(`  Target characters: ${composeResult.summary.targetCharacters}`);
          console.log(`  Actual characters: ${composeResult.summary.totalCharacters}`);
          console.log(`  Utilization: ${composeResult.summary.utilization.toFixed(1)}%`);
          console.log(`  Documents included: ${composeResult.summary.documentsIncluded}`);
          console.log(`  TOC characters: ${composeResult.summary.tocCharacters}`);
          console.log(`  Content characters: ${composeResult.summary.contentCharacters}`);
          
          console.log('\\n📑 Documents included:');
          composeResult.documents.forEach(doc => {
            console.log(`  - ${doc.title} (priority: ${doc.priority}, ${doc.actualCharacters} chars, ${doc.characterLimit} limit)`);
          });
          
          console.log('\\n📝 Generated Content:');
          console.log('='.repeat(80));
          console.log(composeResult.content);
          console.log('='.repeat(80));
        } else {
          console.log('🔍 [DRY RUN] Would compose adaptive content with specified parameters');
        }
        break;

      case 'compose-batch':
        const batchComposeLanguage = args[1] || userConfig.languages[0] || 'ko';
        const batchComposeDryRun = args.includes('--dry-run');
        const batchComposeCharLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number) || enabledCharLimits.filter(limit => limit >= 1000);
        
        console.log(`🎯 ${batchComposeDryRun ? '[DRY RUN] ' : ''}Batch composing adaptive content for language: ${batchComposeLanguage}`);
        console.log(`📏 Character limits: ${batchComposeCharLimits.join(', ')}`);
        
        if (!batchComposeDryRun) {
          const batchResults = await adaptiveComposer.composeBatchContent(batchComposeLanguage, batchComposeCharLimits);
          
          console.log('\\n📊 Batch Composition Summary:');
          for (const [limit, result] of batchResults) {
            console.log(`\\n${limit} characters:`);
            console.log(`  Utilization: ${result.summary.utilization.toFixed(1)}%`);
            console.log(`  Documents: ${result.summary.documentsIncluded}`);
            console.log(`  TOC/Content: ${result.summary.tocCharacters}/${result.summary.contentCharacters}`);
          }
        } else {
          console.log('🔍 [DRY RUN] Would compose adaptive content for all specified character limits');
        }
        break;

      case 'compose-stats':
        const statsComposeLanguage = args[1] || userConfig.languages[0] || 'ko';
        console.log(`📊 Composition Statistics for language: ${statsComposeLanguage}\\n`);
        
        const composeStats = await adaptiveComposer.getCompositionStats(statsComposeLanguage);
        
        console.log(`Total documents: ${composeStats.totalDocuments}`);
        console.log(`Documents with content: ${composeStats.documentsWithContent}`);
        console.log(`Average priority: ${composeStats.averagePriority.toFixed(1)}`);
        console.log(`Available character limits: ${composeStats.availableCharacterLimits.join(', ')}`);
        console.log(`Total content size: ${(composeStats.totalContentSize / 1024).toFixed(1)}KB`);
        break;

      // Work Status Management Commands
      case 'work-status':
        const workStatusLanguage = args[1] || 'ko';
        const workStatusDocumentId = args[2];
        const workStatusCharLimit = parseInt(args.find(arg => arg.startsWith('--chars='))?.split('=')[1] || '100');
        const needEditOnly = args.includes('--need-edit');

        if (workStatusDocumentId) {
          // Show status for specific document
          console.log(`📊 Work Status for ${workStatusDocumentId} (${workStatusLanguage})\n`);
          
          const workStatus = await workStatusManager.getWorkStatus(workStatusLanguage, workStatusDocumentId);
          if (!workStatus) {
            console.error(`❌ Document not found: ${workStatusDocumentId}`);
            process.exit(1);
          }

          console.log(`Document: ${workStatus.documentId}`);
          console.log(`Source: ${workStatus.sourceFile}`);
          console.log(`Source modified: ${workStatus.sourceModified?.toISOString() || 'Unknown'}`);
          console.log(`Last checked: ${workStatus.lastChecked?.toISOString() || 'Never'}`);
          console.log(`Needs work: ${workStatus.needsWork ? '❌ Yes' : '✅ No'}\n`);

          console.log('Generated files:');
          for (const file of workStatus.generatedFiles) {
            const status = file.exists ? '✅' : '❌';
            const updateStatus = file.needsUpdate ? '⚠️ needs update' : '✅ up to date';
            const editStatus = file.edited ? '✏️ edited' : '🤖 auto-generated';
            const size = file.size ? `${Math.round(file.size / 1024 * 100) / 100}KB` : 'N/A';
            
            // Add quality indicator
            let qualityIndicator = '';
            if (file.exists && file.size) {
              const sizeBytes = file.size;
              const estimatedChars = sizeBytes; // Rough estimate
              const lengthRatio = estimatedChars / file.charLimit;
              
              if (lengthRatio < 0.3) {
                qualityIndicator = '🔴 too short';
              } else if (lengthRatio > 1.5) {
                qualityIndicator = '🟡 too long';
              } else if (file.edited) {
                qualityIndicator = '🟢 good';
              } else {
                qualityIndicator = '🟡 needs review';
              }
            }
            
            console.log(`  ${file.charLimit} chars: ${status} ${updateStatus} ${editStatus} ${qualityIndicator} (${size})`);
            if (file.modified) {
              console.log(`    Modified: ${file.modified.toISOString()}`);
            }
          }
        } else {
          // Update and show status for all documents
          console.log(`📊 Updating work status for language: ${workStatusLanguage}...\n`);
          
          const updateResult = await workStatusManager.updateAllWorkStatus(workStatusLanguage);
          console.log(`✅ Updated ${updateResult.updated} documents`);
          
          if (updateResult.errors.length > 0) {
            console.log(`❌ ${updateResult.errors.length} errors:`);
            updateResult.errors.forEach(error => {
              console.log(`  ${error.documentId}: ${error.error}`);
            });
          }

          // Show summary
          const workList = await workStatusManager.listWorkNeeded(workStatusLanguage, {
            characterLimit: workStatusCharLimit,
            needsUpdate: needEditOnly
          });

          console.log(`\n📋 Documents needing work (${workStatusCharLimit} chars):`);
          console.log(`Total: ${workList.length} documents\n`);

          workList.forEach(work => {
            const file = work.generatedFiles.find(f => f.charLimit === workStatusCharLimit);
            const status = file?.exists ? (file.needsUpdate ? '⚠️' : '✅') : '❌';
            console.log(`${status} ${work.documentId} - ${file?.exists ? 'needs update' : 'missing'}`);
          });
        }
        break;

      case 'work-context':
        const contextLanguage = args[1] || 'ko';
        const contextDocumentId = args[2];
        const contextCharLimit = parseInt(args.find(arg => arg.startsWith('--chars='))?.split('=')[1] || '100');

        if (!contextDocumentId) {
          console.error('❌ Document ID required. Usage: work-context <lang> <document-id> [--chars=100]');
          process.exit(1);
        }

        console.log(`📖 Work Context for ${contextDocumentId} (${contextCharLimit} chars)\n`);

        const workContext = await workStatusManager.getWorkContext(contextLanguage, contextDocumentId, contextCharLimit);
        if (!workContext) {
          console.error(`❌ Document not found: ${contextDocumentId}`);
          process.exit(1);
        }

        console.log(`Title: ${workContext.title}`);
        console.log(`Document ID: ${workContext.documentId}`);
        console.log(`Priority: ${workContext.priorityInfo.priority.score} (${workContext.priorityInfo.priority.tier})`);
        console.log(`Strategy: ${workContext.priorityInfo.extraction.strategy}`);
        
        const focusInfo = workContext.priorityInfo.extraction.character_limits[contextCharLimit.toString()];
        if (focusInfo) {
          console.log(`Focus: ${focusInfo.focus}`);
        }

        // Display key points if available
        if (workContext.keyPoints && workContext.keyPoints.length > 0) {
          console.log('Key Points:');
          workContext.keyPoints.forEach(point => {
            console.log(`  • ${point}`);
          });
        }

        console.log('\n' + '='.repeat(80));
        console.log('SOURCE CONTENT:');
        console.log('='.repeat(80));
        console.log(workContext.sourceContent.slice(0, 2000) + (workContext.sourceContent.length > 2000 ? '\n...(truncated)' : ''));

        console.log('\n' + '='.repeat(80));
        console.log(`CURRENT SUMMARY (${contextCharLimit} chars):`);
        console.log('='.repeat(80));
        if (workContext.currentSummary) {
          console.log(workContext.currentSummary);
          console.log(`\nActual length: ${workContext.currentSummary.length} characters`);
        } else {
          console.log('❌ No summary exists yet');
        }

        console.log('\n' + '='.repeat(80));
        console.log('WORK STATUS:');
        console.log('='.repeat(80));
        const targetFile = workContext.workStatus.generatedFiles.find(f => f.charLimit === contextCharLimit);
        if (targetFile) {
          console.log(`File exists: ${targetFile.exists ? '✅' : '❌'}`);
          console.log(`Needs update: ${targetFile.needsUpdate ? '⚠️ Yes' : '✅ No'}`);
          console.log(`Manual edit: ${targetFile.edited ? '✏️ Yes' : '🤖 No'}`);
          if (targetFile.modified) {
            console.log(`Last modified: ${targetFile.modified.toISOString()}`);
          }
        }
        break;

      case 'work-list':
        const listLanguage = args[1] || 'ko';
        const listCharLimit = parseInt(args.find(arg => arg.startsWith('--chars='))?.split('=')[1] || '100');
        const listOutdated = args.includes('--outdated');
        const listMissing = args.includes('--missing');
        const listNeedsUpdate = args.includes('--need-update');

        console.log(`📋 Work List for language: ${listLanguage} (${listCharLimit} chars)\n`);

        const workList = await workStatusManager.listWorkNeeded(listLanguage, {
          characterLimit: listCharLimit,
          outdated: listOutdated,
          missing: listMissing,
          needsUpdate: listNeedsUpdate || (!listOutdated && !listMissing)
        });

        console.log(`Found ${workList.length} documents needing work:\n`);

        workList.forEach(work => {
          const file = work.generatedFiles.find(f => f.charLimit === listCharLimit);
          const status = file?.exists ? (file.needsUpdate ? '⚠️' : '✅') : '❌';
          const statusText = file?.exists ? (file.needsUpdate ? 'UPDATE' : 'OK') : 'MISSING';
          const editedText = file?.edited ? '(edited)' : '(auto)';
          const size = file?.size ? `${Math.round(file.size / 1024 * 100) / 100}KB` : 'N/A';
          
          console.log(`${status} ${work.documentId.padEnd(30)} ${statusText.padEnd(8)} ${editedText.padEnd(8)} ${size}`);
        });

        if (workList.length === 0) {
          console.log('🎉 No work needed! All documents are up to date.');
        }
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
  console.log('CONFIGURATION MANAGEMENT:');
  console.log('  config-init [preset] [--path=config.json]');
  console.log('                       Initialize configuration with preset (minimal|standard|extended|blog|documentation)');
  console.log('  config-show          Show current resolved configuration');
  console.log('  config-validate      Validate current configuration');
  console.log('  config-limits [--all] Show configured character limits');
  console.log('');
  console.log('CONTENT GENERATION:');
  console.log('  minimum              Generate minimum format content');
  console.log('  origin               Generate origin format content');
  console.log('  chars <limit> [lang] Generate character-limited content');
  console.log('  batch [--lang=en,ko] [--chars=300,1000,2000] Generate all formats (uses config defaults)');
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
  console.log('CONTENT EXTRACTION:');
  console.log('  extract [lang] [--chars=100,300,1000] [--dry-run] [--overwrite]');
  console.log('                       Extract character-limited summaries to data directory');
  console.log('  extract-all [--lang=en,ko] [--dry-run] [--overwrite]');
  console.log('                       Extract all content summaries for all languages');
  console.log('');
  console.log('ADAPTIVE COMPOSITION:');
  console.log('  compose [lang] [chars] [--no-toc] [--priority=50] [--dry-run]');
  console.log('                       Compose adaptive content for specified character limit');
  console.log('  compose-batch [lang] [--chars=1000,3000,5000] [--dry-run]');
  console.log('                       Batch compose for multiple character limits');
  console.log('  compose-stats [lang] Show composition statistics and available content');
  console.log('');
  console.log('WORK STATUS MANAGEMENT:');
  console.log('  work-status [lang] [document-id] [--chars=100] [--need-edit]');
  console.log('                       Check work status for documents or specific document');
  console.log('  work-context <lang> <document-id> [--chars=100]');
  console.log('                       Get complete work context for editing a document');
  console.log('  work-list [lang] [--chars=100] [--outdated] [--missing] [--need-update]');
  console.log('                       List documents that need work');
  console.log('');
  console.log('MARKDOWN GENERATION (VitePress):');
  console.log('  markdown-generate [lang] [--chars=100,300,1000] [--dry-run] [--overwrite]');
  console.log('                       Generate character-limited .md files for VitePress');
  console.log('  markdown-all [--lang=en,ko] [--dry-run] [--overwrite]');
  console.log('                       Generate all markdown files for all languages');
  console.log('');
  console.log('OTHER:');
  console.log('  status               Show generator status');
  console.log('  help                 Show this help message');
  console.log('');
  console.log('EXAMPLES:');
  console.log('  # Configuration management');
  console.log('  npx @context-action/llms-generator config-init standard');
  console.log('  npx @context-action/llms-generator config-show');
  console.log('  npx @context-action/llms-generator config-limits');
  console.log('');
  console.log('  # Content generation (uses config defaults)');
  console.log('  npx @context-action/llms-generator minimum');
  console.log('  npx @context-action/llms-generator chars 5000 en');
  console.log('  npx @context-action/llms-generator batch  # Uses config languages and character limits');
  console.log('  npx @context-action/llms-generator batch --lang=en,ko --chars=300,1000  # Override defaults');
  console.log('');
  console.log('  # Priority and discovery');
  console.log('  npx @context-action/llms-generator priority-generate en --dry-run');
  console.log('  npx @context-action/llms-generator priority-stats ko');
  console.log('  npx @context-action/llms-generator discover en');
  console.log('');
  console.log('  # Content extraction (uses config defaults)');
  console.log('  npx @context-action/llms-generator extract ko  # Uses config character limits');
  console.log('  npx @context-action/llms-generator extract-all  # Uses config languages');
  console.log('');
  console.log('  # Composition (uses config defaults)');
  console.log('  npx @context-action/llms-generator compose ko  # Uses config default character limit');
  console.log('  npx @context-action/llms-generator compose-batch en  # Uses config limits ≥1000');
  console.log('');
  console.log('  # Work management');
  console.log('  npx @context-action/llms-generator work-status ko --chars=100 --need-edit');
  console.log('  npx @context-action/llms-generator work-context ko guide-action-handlers --chars=100');
  console.log('  npx @context-action/llms-generator work-list ko --chars=100 --missing');
}

function createConfigFromUserConfig(userConfig: ResolvedConfig) {
  // Convert user config to internal config format
  const config = { ...DEFAULT_CONFIG };
  
  // Map resolved paths from user config
  config.paths.docsDir = userConfig.resolvedPaths.docsDir;
  config.paths.llmContentDir = userConfig.resolvedPaths.dataDir;
  config.paths.outputDir = userConfig.resolvedPaths.outputDir;
  
  // Preserve other existing configuration as needed
  return config;
}

main();