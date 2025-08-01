#!/usr/bin/env node

/**
 * Glossary CLI Tool
 * Command-line interface for glossary mapping system
 */

import { program } from 'commander';
import { createGlossaryAPI, createConfigTemplate } from '../dist/index.js';
import fs from 'fs';
import path from 'path';

program
  .name('glossary')
  .description('Glossary mapping system CLI')
  .version('0.0.1');

// Scan command
program
  .command('scan')
  .description('Scan source files for glossary mappings')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-o, --output <path>', 'Output file path')
  .option('-d, --debug', 'Enable debug mode')
  .action(async (options) => {
    try {
      console.log('🔍 Scanning for glossary mappings...');
      
      const glossary = await createGlossaryAPI(options.config);
      const mappings = await glossary.scan();
      
      const outputPath = options.output || 'glossary-mappings.json';
      fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 2));
      
      console.log(`✅ Mappings saved to: ${outputPath}`);
      console.log(`📊 Found ${mappings.statistics.mappedTerms} mapped terms in ${mappings.statistics.taggedFiles} files`);
      
    } catch (error) {
      console.error('❌ Scan failed:', error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate glossary mappings')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-m, --mappings <path>', 'Mappings file path')
  .option('-o, --output <path>', 'Validation report output path')
  .action(async (options) => {
    try {
      console.log('🔍 Validating glossary mappings...');
      
      const glossary = await createGlossaryAPI(options.config);
      
      // Load mappings
      const mappingsPath = options.mappings || 'glossary-mappings.json';
      if (!fs.existsSync(mappingsPath)) {
        console.error(`❌ Mappings file not found: ${mappingsPath}`);
        console.log('💡 Run "glossary scan" first to generate mappings.');
        process.exit(1);
      }
      
      const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
      const validation = await glossary.validate(mappings);
      
      const outputPath = options.output || 'glossary-validation.json';
      fs.writeFileSync(outputPath, JSON.stringify(validation, null, 2));
      
      if (validation.success) {
        console.log('✅ All validations passed!');
      } else {
        console.log(`❌ Found ${validation.summary.errors} errors`);
      }
      
      if (validation.summary.warnings > 0) {
        console.log(`⚠️  Found ${validation.summary.warnings} warnings`);
      }
      
      console.log(`📊 Implementation rate: ${validation.summary.implementationRate}%`);
      console.log(`📄 Report saved to: ${outputPath}`);
      
      if (!validation.success) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  });

// Scan and validate command
program
  .command('check')
  .description('Scan and validate in one operation')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-o, --output-dir <path>', 'Output directory')
  .action(async (options) => {
    try {
      console.log('🔍 Scanning and validating glossary mappings...');
      
      const glossary = await createGlossaryAPI(options.config);
      const { mappings, validation } = await glossary.scanAndValidate();
      
      const outputDir = options.outputDir || '.';
      const mappingsPath = path.join(outputDir, 'glossary-mappings.json');
      const validationPath = path.join(outputDir, 'glossary-validation.json');
      
      fs.writeFileSync(mappingsPath, JSON.stringify(mappings, null, 2));
      fs.writeFileSync(validationPath, JSON.stringify(validation, null, 2));
      
      console.log(`📊 Scan Results:`);
      console.log(`   Files scanned: ${mappings.statistics.totalFiles}`);
      console.log(`   Terms mapped: ${mappings.statistics.mappedTerms}`);
      console.log(`   Implementation rate: ${validation.summary.implementationRate}%`);
      
      if (validation.success) {
        console.log('✅ All validations passed!');
      } else {
        console.log(`❌ Found ${validation.summary.errors} errors`);
      }
      
      if (validation.summary.warnings > 0) {
        console.log(`⚠️  Found ${validation.summary.warnings} warnings`);
      }
      
      console.log(`📄 Files saved:`);
      console.log(`   Mappings: ${mappingsPath}`);
      console.log(`   Validation: ${validationPath}`);
      
      if (!validation.success) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Check failed:', error.message);
      process.exit(1);
    }
  });

// Config init command
program
  .command('init')
  .description('Create a configuration file template')
  .option('-f, --force', 'Overwrite existing config file')
  .action((options) => {
    try {
      const configPath = path.resolve(process.cwd(), 'glossary.config.js');
      
      if (fs.existsSync(configPath) && !options.force) {
        console.log('❌ Configuration file already exists. Use --force to overwrite.');
        process.exit(1);
      }
      
      const templatePath = createConfigTemplate(process.cwd());
      console.log(`✅ Configuration file created: ${templatePath}`);
      console.log('📝 Edit the file to customize your glossary system settings.');
      
    } catch (error) {
      console.error('❌ Failed to create config:', error.message);
      process.exit(1);
    }
  });

// Config show command
program
  .command('config')
  .description('Show current configuration')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    try {
      const { loadConfig, printConfigSummary } = await import('../dist/index.js');
      const config = await loadConfig(options.config);
      
      console.log('📋 Current Glossary Configuration:');
      printConfigSummary(config);
      
    } catch (error) {
      console.error('❌ Failed to load config:', error.message);
      process.exit(1);
    }
  });

program.parse();