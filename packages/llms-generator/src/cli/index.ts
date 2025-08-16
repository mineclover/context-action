#!/usr/bin/env node

/**
 * Simple CLI interface for @context-action/llms-generator
 */

import path from 'path';
import { LLMSGenerator, PriorityGenerator, SchemaGenerator, MarkdownGenerator, ContentExtractor, AdaptiveComposer, DEFAULT_CONFIG } from '../index.js';
import { WorkStatusManager } from '../core/WorkStatusManager.js';
import { ConfigManager } from '../core/ConfigManager.js';
import { EnhancedConfigManager } from '../core/EnhancedConfigManager.js';
import { InstructionGenerator } from '../core/InstructionGenerator.js';
import { TemplateGenerator } from '../core/TemplateGenerator.js';
import { initializeContainer } from '../infrastructure/di/DIContainer.js';
import type { ResolvedConfig } from '../types/user-config.js';
import { existsSync } from 'fs';
import { checkWorkStatus } from './commands/work-check.js';
import { generateIndividualFiles } from './commands/generate.js';
import { syncAll } from './commands/sync.js';
import { fixSourcePaths } from './commands/fix-paths.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }

  const command = args[0];
  
  try {
    // Try to load enhanced config first (for llms-generator.config.json)
    let config;
    let userConfig; // Declare here for use throughout
    const enhancedConfigPath = path.join(process.cwd(), 'llms-generator.config.json');
    
    if (existsSync(enhancedConfigPath)) {
      console.log('📋 Loading enhanced config from llms-generator.config.json');
      const enhancedConfigManager = new EnhancedConfigManager(enhancedConfigPath);
      const enhancedConfig = await enhancedConfigManager.loadConfig();
      
      // Convert enhanced config to internal format (resolve paths)
      const projectRoot = process.cwd();
      config = {
        ...DEFAULT_CONFIG, // Start with defaults
        paths: {
          docsDir: path.resolve(projectRoot, enhancedConfig.paths.docsDir),
          llmContentDir: path.resolve(projectRoot, enhancedConfig.paths.llmContentDir),
          outputDir: path.resolve(projectRoot, enhancedConfig.paths.outputDir),
          templatesDir: path.resolve(projectRoot, enhancedConfig.paths.templatesDir),
          instructionsDir: path.resolve(projectRoot, enhancedConfig.paths.instructionsDir)
        },
        generation: {
          ...DEFAULT_CONFIG.generation,
          supportedLanguages: enhancedConfig.generation.supportedLanguages,
          characterLimits: enhancedConfig.generation.characterLimits,
          defaultLanguage: enhancedConfig.generation.defaultLanguage,
          outputFormat: enhancedConfig.generation.outputFormat
        },
        quality: enhancedConfig.quality
      };
      
      // Create a compatible userConfig for legacy command compatibility
      userConfig = {
        characterLimits: enhancedConfig.generation.characterLimits,
        languages: enhancedConfig.generation.supportedLanguages,
        resolvedPaths: {
          configFile: enhancedConfigPath,
          projectRoot: projectRoot,
          docsDir: config.paths.docsDir,
          dataDir: config.paths.llmContentDir,
          outputDir: config.paths.outputDir
        }
      } as any;
    } else {
      // Fall back to legacy config
      console.log('📋 Loading legacy config');
      userConfig = await ConfigManager.findAndLoadConfig();
      config = createConfigFromUserConfig(userConfig);
    }
    
    // Initialize DI container for new features
    let diInitialized = false;
    try {
      initializeContainer(config);
      diInitialized = true;
    } catch (error) {
      console.warn('⚠️  DI container initialization failed. Some features may be unavailable.');
    }
    
    const generator = new LLMSGenerator(config);
    const priorityGenerator = new PriorityGenerator(config);
    const schemaGenerator = new SchemaGenerator(config);
    const markdownGenerator = new MarkdownGenerator(config);
    const contentExtractor = new ContentExtractor(config);
    const adaptiveComposer = new AdaptiveComposer(config);
    const workStatusManager = new WorkStatusManager(config);
    const instructionGenerator = new InstructionGenerator(config);
    const templateGenerator = new TemplateGenerator(config);
    
    // Get enabled character limits from config
    const enabledCharLimits = config.generation.characterLimits;
    
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
        userConfig.characterLimits.forEach((limit: number) => {
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
        
        userConfig.characterLimits.sort((a: number, b: number) => a - b).forEach((limit: number) => {
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

      case 'template-generate':
        console.log('📋 Generating individual summary document templates for all priority files...');
        
        try {
          await templateGenerator.generateAllTemplates();
          console.log('\n✅ Template generation completed successfully!');
        } catch (error) {
          console.error('\n❌ Template generation failed:', error);
          process.exit(1);
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
        
        const focusInfo = workContext.priorityInfo.extraction.characterLimit[contextCharLimit.toString()];
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

      // Instruction Generation Commands
      case 'instruction-generate':
        const instrLanguage = args[1] || userConfig.languages[0] || 'ko';
        const instrDocumentId = args[2];
        const instrTemplate = args.find(arg => arg.startsWith('--template='))?.split('=')[1] || 'default';
        const instrCharLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number);
        const instrDryRun = args.includes('--dry-run');
        const instrOverwrite = args.includes('--overwrite');
        const instrMaxLength = parseInt(args.find(arg => arg.startsWith('--max-length='))?.split('=')[1] || '8000');
        const instrIncludeSource = !args.includes('--no-source');
        const instrIncludeSummaries = !args.includes('--no-summaries');

        if (!instrDocumentId) {
          console.error('❌ Document ID required. Usage: instruction-generate <lang> <document-id> [options]');
          process.exit(1);
        }

        console.log(`📝 ${instrDryRun ? '[DRY RUN] ' : ''}Generating instructions for: ${instrDocumentId} (${instrLanguage})`);
        console.log(`📋 Template: ${instrTemplate}`);
        console.log(`📏 Character limits: ${instrCharLimits ? instrCharLimits.join(', ') : 'all configured'}`);
        console.log(`📖 Include source: ${instrIncludeSource ? 'Yes' : 'No'}`);
        console.log(`📄 Include summaries: ${instrIncludeSummaries ? 'Yes' : 'No'}`);

        const instrResult = await instructionGenerator.generateInstructions(instrLanguage, instrDocumentId, {
          template: instrTemplate,
          characterLimits: instrCharLimits,
          includeSourceContent: instrIncludeSource,
          includeCurrentSummaries: instrIncludeSummaries,
          maxLength: instrMaxLength,
          dryRun: instrDryRun,
          overwrite: instrOverwrite
        });

        console.log('\n📊 Generation Summary:');
        console.log(`  Generated: ${instrResult.summary.totalGenerated}`);
        console.log(`  Skipped: ${instrResult.summary.totalSkipped}`);
        console.log(`  Errors: ${instrResult.summary.totalErrors}`);
        console.log(`  By character limit:`);
        Object.entries(instrResult.summary.byCharacterLimit).forEach(([limit, count]) => {
          console.log(`    ${limit}chars: ${count} instructions`);
        });

        if (!instrDryRun && instrResult.instructions.length > 0) {
          console.log('\n📁 Generated instructions:');
          instrResult.instructions.forEach(instr => {
            console.log(`  ✅ ${instr.filePath}`);
          });
        }

        if (instrResult.errors.length > 0) {
          console.log('\n❌ Errors:');
          instrResult.errors.forEach(error => {
            console.log(`  ${error}`);
          });
        }
        break;

      case 'instruction-batch':
        const batchInstrLanguage = args[1] || userConfig.languages[0] || 'ko';
        const batchInstrTemplate = args.find(arg => arg.startsWith('--template='))?.split('=')[1] || 'default';
        const batchInstrCharLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number);
        const batchInstrDryRun = args.includes('--dry-run');
        const batchInstrOverwrite = args.includes('--overwrite');
        const batchInstrMaxLength = parseInt(args.find(arg => arg.startsWith('--max-length='))?.split('=')[1] || '8000');
        const batchInstrIncludeSource = !args.includes('--no-source');
        const batchInstrIncludeSummaries = !args.includes('--no-summaries');

        console.log(`📝 ${batchInstrDryRun ? '[DRY RUN] ' : ''}Batch generating instructions for language: ${batchInstrLanguage}`);
        console.log(`📋 Template: ${batchInstrTemplate}`);
        console.log(`📏 Character limits: ${batchInstrCharLimits ? batchInstrCharLimits.join(', ') : 'all configured'}`);

        const batchInstrResult = await instructionGenerator.generateBatchInstructions(batchInstrLanguage, {
          template: batchInstrTemplate,
          characterLimits: batchInstrCharLimits,
          includeSourceContent: batchInstrIncludeSource,
          includeCurrentSummaries: batchInstrIncludeSummaries,
          maxLength: batchInstrMaxLength,
          dryRun: batchInstrDryRun,
          overwrite: batchInstrOverwrite
        });

        console.log('\n📊 Batch Generation Summary:');
        console.log(`  Generated: ${batchInstrResult.summary.totalGenerated}`);
        console.log(`  Skipped: ${batchInstrResult.summary.totalSkipped}`);
        console.log(`  Errors: ${batchInstrResult.summary.totalErrors}`);
        console.log(`  By character limit:`);
        Object.entries(batchInstrResult.summary.byCharacterLimit).forEach(([limit, count]) => {
          console.log(`    ${limit}chars: ${count} instructions`);
        });

        if (!batchInstrDryRun && batchInstrResult.instructions.length > 0) {
          console.log(`\n📁 Generated ${batchInstrResult.instructions.length} instructions in total`);
          if (batchInstrResult.instructions.length <= 10) {
            batchInstrResult.instructions.forEach(instr => {
              console.log(`  ✅ ${instr.filePath}`);
            });
          } else {
            console.log(`  (showing first 5 of ${batchInstrResult.instructions.length})`);
            batchInstrResult.instructions.slice(0, 5).forEach(instr => {
              console.log(`  ✅ ${instr.filePath}`);
            });
          }
        }

        if (batchInstrResult.errors.length > 0) {
          console.log('\n❌ Errors:');
          batchInstrResult.errors.slice(0, 10).forEach(error => {
            console.log(`  ${error}`);
          });
          if (batchInstrResult.errors.length > 10) {
            console.log(`  ... and ${batchInstrResult.errors.length - 10} more errors`);
          }
        }
        break;

      case 'generate-summaries':
        if (!diInitialized) {
          console.error('❌ DI container not initialized. This feature requires proper configuration.');
          process.exit(1);
        }

        const summarySourceType = args[1] as 'minimum' | 'origin';
        const summaryLanguage = args[2] || userConfig.languages[0] || 'ko';
        const summaryDryRun = args.includes('--dry-run');
        const summaryOverwrite = args.includes('--overwrite');
        const summaryCharLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number) || enabledCharLimits;
        const summaryQualityThreshold = parseInt(args.find(arg => arg.startsWith('--quality='))?.split('=')[1] || '70');
        const summaryStrategy = args.find(arg => arg.startsWith('--strategy='))?.split('=')[1] || 'concept-first';

        if (!summarySourceType || !['minimum', 'origin'].includes(summarySourceType)) {
          console.error('❌ Source type required. Usage: generate-summaries <minimum|origin> [language] [options]');
          console.log('Available source types:');
          console.log('  minimum - Generate from navigation links (minimum format)');
          console.log('  origin  - Generate from complete documents (origin format)');
          process.exit(1);
        }

        console.log(`📝 ${summaryDryRun ? '[DRY RUN] ' : ''}Generating YAML frontmatter summaries`);
        console.log(`📊 Source: ${summarySourceType} format`);
        console.log(`🌐 Language: ${summaryLanguage}`);
        console.log(`📏 Character limits: ${summaryCharLimits.join(', ')}`);
        console.log(`🎯 Quality threshold: ${summaryQualityThreshold}%`);
        console.log(`⚙️  Default strategy: ${summaryStrategy}`);
        console.log(`🔄 Overwrite existing: ${summaryOverwrite ? 'Yes' : 'No'}\n`);

        if (summaryDryRun) {
          console.log('🧪 [DRY RUN] Would generate summaries but not save to files\n');
          
          // Show what would be generated
          const allPriorities = await generator.getPriorityManager().loadAllPriorities();
          const langPriorities = generator.getPriorityManager().filterByLanguage(allPriorities, summaryLanguage);
          const documents = Object.keys(langPriorities);
          
          console.log(`📄 Documents to process: ${documents.length}`);
          console.log(`📊 Total summaries to generate: ${documents.length * summaryCharLimits.length}`);
          console.log(`📁 Output format: .md files with YAML frontmatter`);
          
          documents.slice(0, 5).forEach(docId => {
            console.log(`  - ${docId} (${summaryCharLimits.length} variants)`);
          });
          
          if (documents.length > 5) {
            console.log(`  ... and ${documents.length - 5} more documents`);
          }
          
          console.log('\n💡 Remove --dry-run to execute the generation');
          break;
        }

        try {
          await generator.initialize();
          
          const summaryResult = await generator.generateSummariesFromSource({
            sourceType: summarySourceType,
            language: summaryLanguage,
            characterLimits: summaryCharLimits,
            overwrite: summaryOverwrite
          });

          if (summaryResult.success && summaryResult.results) {
            const stats = summaryResult.results.statistics;
            
            console.log('✅ Summary generation completed!\n');
            console.log('📊 Generation Statistics:');
            console.log(`  Total processed: ${summaryResult.results.totalRequested}`);
            console.log(`  Successfully generated: ${summaryResult.results.successCount}`);
            console.log(`  Failed: ${summaryResult.results.failureCount}`);
            console.log(`  Skipped: ${summaryResult.results.skippedCount}`);
            console.log(`  Average quality score: ${stats.averageQualityScore.toFixed(1)}%`);
            console.log(`  Average character count: ${Math.round(stats.averageCharacterCount)}`);
            console.log(`  Processing time: ${(stats.processingTimeMs / 1000).toFixed(1)}s\n`);

            // Quality distribution
            console.log('🎯 Quality Distribution:');
            Object.entries(stats.qualityDistribution).forEach(([level, count]) => {
              if ((count as number) > 0) {
                console.log(`  ${level}: ${count} summaries`);
              }
            });

            // Extraction method distribution
            if (Object.keys(stats.extractionMethodDistribution).length > 0) {
              console.log('\n⚙️  Extraction Methods:');
              Object.entries(stats.extractionMethodDistribution).forEach(([method, count]) => {
                console.log(`  ${method}: ${count} summaries`);
              });
            }

            // Show recommendations
            if (summaryResult.results.recommendations.length > 0) {
              console.log('\n💡 Recommendations:');
              summaryResult.results.recommendations.forEach((rec: string) => {
                console.log(`  • ${rec}`);
              });
            }

            // Show failed items if any
            const failedResults = summaryResult.results.results.filter((r: any) => !r.success);
            if (failedResults.length > 0 && failedResults.length <= 5) {
              console.log('\n❌ Failed generations:');
              failedResults.forEach((result: any) => {
                console.log(`  • ${result.documentId} (${result.characterLimit} chars): ${result.error}`);
              });
            } else if (failedResults.length > 5) {
              console.log(`\n❌ ${failedResults.length} generations failed. Use --verbose for details.`);
            }

          } else {
            console.error(`❌ Summary generation failed: ${summaryResult.error}`);
            process.exit(1);
          }

        } catch (error) {
          console.error('❌ Summary generation failed:', error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
        break;

      case 'improve-summaries':
        if (!diInitialized) {
          console.error('❌ DI container not initialized. This feature requires proper configuration.');
          process.exit(1);
        }

        const improveLanguage = args[1] || userConfig.languages[0] || 'ko';
        const improveMinQuality = parseInt(args.find(arg => arg.startsWith('--min-quality='))?.split('=')[1] || '70');
        const improveCharLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number);
        const improveDryRun = args.includes('--dry-run');
        const improveMaxAge = args.find(arg => arg.startsWith('--max-age='))?.split('=')[1];

        console.log(`🔧 ${improveDryRun ? '[DRY RUN] ' : ''}Improving existing summaries`);
        console.log(`🌐 Language: ${improveLanguage}`);
        console.log(`🎯 Minimum quality threshold: ${improveMinQuality}%`);
        if (improveCharLimits) {
          console.log(`📏 Character limits: ${improveCharLimits.join(', ')}`);
        }
        if (improveMaxAge) {
          console.log(`⏰ Max age: ${improveMaxAge} days`);
        }

        if (improveDryRun) {
          console.log('\n🧪 [DRY RUN] Would analyze and improve summaries but not save changes');
          console.log('💡 Remove --dry-run to execute the improvements');
          break;
        }

        try {
          await generator.initialize();
          
          // This would use SummaryGeneratorUseCase.improveExistingSummaries
          console.log('🔧 This feature is under development...');
          console.log('💡 For now, use generate-summaries with --overwrite to regenerate summaries');

        } catch (error) {
          console.error('❌ Summary improvement failed:', error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
        break;

      case 'instruction-template':
        const templateCommand = args[1] || 'list';
        const templateLanguage = args[2] || 'ko';

        switch (templateCommand) {
          case 'list':
            console.log('📋 Available Instruction Templates:\n');
            console.log('Built-in templates:');
            console.log('  default - Default instruction template for document updates');
            console.log('    Languages: en, ko');
            console.log('    Variables: title, documentId, characterLimit, focus, keyPoints, sourceContent, currentSummary');
            
            // Check for custom templates
            const templatesDir = userConfig.resolvedPaths.templatesDir;
            try {
              const fs = await import('fs/promises');
              const templateFiles = await fs.readdir(templatesDir);
              const customTemplates = templateFiles.filter(f => f.endsWith('.json'));
              
              if (customTemplates.length > 0) {
                console.log('\nCustom templates:');
                customTemplates.forEach(template => {
                  const templateName = template.replace(/(-[a-z]{2})?\.json$/, '');
                  const langMatch = template.match(/-([a-z]{2})\.json$/);
                  const lang = langMatch ? langMatch[1] : 'default';
                  console.log(`  ${templateName} (${lang})`);
                });
              }
            } catch (error) {
              console.log('\nNo custom templates directory found');
            }
            break;

          case 'show':
            const showTemplate = args[3] || 'default';
            console.log(`📋 Template: ${showTemplate} (${templateLanguage})\n`);
            
            try {
              // This would load and display the template
              console.log('Template preview would be shown here');
            } catch (error) {
              console.error(`❌ Failed to load template: ${error}`);
            }
            break;

          case 'create':
            const createTemplate = args[3];
            if (!createTemplate) {
              console.error('❌ Template name required. Usage: instruction-template create <lang> <name>');
              process.exit(1);
            }
            console.log(`📝 Creating template: ${createTemplate} for language: ${templateLanguage}`);
            console.log('🔧 This feature is coming soon!');
            break;

          default:
            console.error(`❌ Unknown template command: ${templateCommand}`);
            console.log('Available commands: list, show, create');
            process.exit(1);
        }
        break;

      case 'work-check':
        const checkLanguage = args[1];
        const showAll = args.includes('--show-all');
        const showOutdated = args.includes('--show-outdated');
        const showEdited = args.includes('--show-edited');
        const showMissingConfig = args.includes('--show-missing-config');

        console.log('🔍 Enhanced work status check with config integration\n');
        
        await checkWorkStatus({
          language: checkLanguage,
          showAll,
          showOutdated,
          showEdited,
          showMissingConfig
        });
        break;

      case 'generate-files':
        const genLanguages = args.find(arg => arg.startsWith('--lang='))?.split('=')[1]?.split(',') || userConfig.languages;
        const genCharLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number) || enabledCharLimits;
        const genConfigPath = args.find(arg => arg.startsWith('--config='))?.split('=')[1];

        await generateIndividualFiles({
          languages: genLanguages,
          characterLimits: genCharLimits,
          configPath: genConfigPath
        });
        break;

      case 'sync-all':
        const syncLanguages = args.find(arg => arg.startsWith('--lang='))?.split('=')[1]?.split(',') || userConfig.languages;
        const syncCharLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number) || enabledCharLimits;
        const syncConfigPath = args.find(arg => arg.startsWith('--config='))?.split('=')[1];
        const skipGeneration = args.includes('--skip-generation');

        await syncAll({
          languages: syncLanguages,
          characterLimits: syncCharLimits,
          configPath: syncConfigPath,
          skipGeneration
        });
        break;

      case 'fix-paths':
        const fixLanguage = args.find(arg => arg.startsWith('--lang='))?.split('=')[1] || 'en';
        const fixDataDir = args.find(arg => arg.startsWith('--data-dir='))?.split('=')[1];
        const fixDryRun = args.includes('--dry-run');

        await fixSourcePaths({
          language: fixLanguage,
          dataDir: fixDataDir,
          dryRun: fixDryRun
        });
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
  console.log('  template-generate    Generate individual summary document templates for all priority files');
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
  console.log('YAML FRONTMATTER SUMMARIES (NEW):');
  console.log('  generate-summaries <minimum|origin> [lang] [options]');
  console.log('                       Generate YAML frontmatter summaries from source formats');
  console.log('                       [--chars=100,300,1000] [--quality=70] [--strategy=concept-first]');
  console.log('                       [--dry-run] [--overwrite]');
  console.log('  improve-summaries [lang] [--min-quality=70] [--chars=100,300] [--max-age=30]');
  console.log('                       Analyze and improve existing summary quality (coming soon)');
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
  console.log('  work-check [lang] [--show-all] [--show-edited] [--show-missing-config]');
  console.log('                       Enhanced work status check with config integration');
  console.log('');
  console.log('MIGRATION COMMANDS (from legacy scripts):');
  console.log('  generate-files [--lang=en,ko] [--chars=100,300] [--config=path]');
  console.log('                       Generate individual character-limited files (migrated from legacy)');
  console.log('  sync-all [--lang=en,ko] [--chars=100,300] [--skip-generation] [--config=path]');
  console.log('                       Bulk sync operation for all content (migrated from legacy)');
  console.log('  fix-paths [--lang=en] [--data-dir=path] [--dry-run]');
  console.log('                       Fix source_path in priority.json files (migrated from legacy)');
  console.log('');
  console.log('INSTRUCTION GENERATION:');
  console.log('  instruction-generate <lang> <document-id> [options]');
  console.log('                       Generate detailed instructions for document updates');
  console.log('                       [--template=default] [--chars=100,300] [--dry-run] [--overwrite]');
  console.log('                       [--max-length=8000] [--no-source] [--no-summaries]');
  console.log('  instruction-batch <lang> [options]');
  console.log('                       Batch generate instructions for all documents');
  console.log('                       [--template=default] [--chars=100,300] [--dry-run] [--overwrite]');
  console.log('  instruction-template <command> [lang] [name]');
  console.log('                       Manage instruction templates (list|show|create)');
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
  console.log('  npx @context-action/llms-generator work-check ko --show-all --show-edited');
  console.log('');
  console.log('  # Instruction generation');
  console.log('  npx @context-action/llms-generator instruction-generate ko guide-action-handlers --chars=100,300');
  console.log('  npx @context-action/llms-generator instruction-batch ko --template=default --dry-run');
  console.log('  npx @context-action/llms-generator instruction-template list');
  console.log('  npx @context-action/llms-generator instruction-template show ko default');
  console.log('');
  console.log('  # YAML frontmatter summary generation (NEW)');
  console.log('  npx @context-action/llms-generator generate-summaries minimum ko --chars=100,300 --dry-run');
  console.log('  npx @context-action/llms-generator generate-summaries origin ko --overwrite --strategy=api-first');
  console.log('  npx @context-action/llms-generator improve-summaries ko --min-quality=80');
}

function createConfigFromUserConfig(userConfig: ResolvedConfig) {
  // Convert user config to internal config format
  const config = { ...DEFAULT_CONFIG };
  
  // Map resolved paths from user config
  config.paths.docsDir = userConfig.resolvedPaths.docsDir;
  config.paths.llmContentDir = userConfig.resolvedPaths.dataDir;
  config.paths.outputDir = userConfig.resolvedPaths.outputDir;
  config.paths.templatesDir = userConfig.resolvedPaths.templatesDir;
  config.paths.instructionsDir = userConfig.resolvedPaths.instructionsDir;
  
  // Map generation settings if available (check if userConfig has the new structure)
  if (userConfig.characterLimits) {
    config.generation.characterLimits = userConfig.characterLimits;
  }
  if (userConfig.languages) {
    config.generation.supportedLanguages = userConfig.languages;
  }
  
  // Preserve other existing configuration as needed
  return config;
}

main();