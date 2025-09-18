#!/usr/bin/env node

import { Command } from 'commander';
import { TestMetadataExtractor } from '../core/TestMetadataExtractor.js';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const program = new Command();

program
  .name('test-metadata-extractor')
  .description('Extract structured metadata from test files and output JSON')
  .version('1.0.0');

program
  .command('extract')
  .description('Extract metadata from test files')
  .option('-i, --input <path>', 'Input file or directory path', '.')
  .option('-o, --output <path>', 'Output JSON file path')
  .option('-p, --pattern <regex>', 'Test file pattern (regex)', '\\.test\\.(ts|js)$')
  .option('--pretty', 'Pretty print JSON output', false)
  .action(async (options) => {
    try {
      const extractor = new TestMetadataExtractor();
      const inputPath = path.resolve(options.input);
      const pattern = new RegExp(options.pattern);

      console.log(chalk.blue('🔍 Starting metadata extraction...'));
      console.log(chalk.gray(`Input: ${inputPath}`));
      console.log(chalk.gray(`Pattern: ${options.pattern}`));

      const stats = await fs.stat(inputPath);
      let result;

      if (stats.isFile()) {
        console.log(chalk.yellow('📄 Processing single file...'));
        result = await extractor.extractFromFile(inputPath);
      } else if (stats.isDirectory()) {
        console.log(chalk.yellow('📁 Processing directory...'));
        result = await extractor.extractFromDirectory(inputPath, pattern);
      } else {
        throw new Error('Input path must be a file or directory');
      }

      const jsonOutput = JSON.stringify(result, null, options.pretty ? 2 : 0);

      if (options.output) {
        const outputPath = path.resolve(options.output);
        await fs.writeFile(outputPath, jsonOutput, 'utf-8');
        console.log(chalk.green(`✅ Metadata extracted to: ${outputPath}`));
      } else {
        console.log(chalk.green('✅ Extraction complete:'));
        console.log(jsonOutput);
      }

      // Summary
      if (stats.isDirectory() && 'summary' in result) {
        console.log(chalk.blue('\n📊 Summary:'));
        console.log(chalk.gray(`  Files processed: ${result.totalFiles}`));
        console.log(chalk.gray(`  Total test cases: ${result.summary.totalTestCases}`));
        console.log(chalk.gray(`  Total test suites: ${result.summary.totalTestSuites}`));
        console.log(chalk.gray(`  Unique APIs detected: ${result.summary.uniqueApis.length}`));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate extracted metadata JSON')
  .argument('<file>', 'JSON file to validate')
  .action(async (file) => {
    try {
      const content = await fs.readFile(path.resolve(file), 'utf-8');
      const data = JSON.parse(content);

      // Basic validation
      const isValid = validateMetadata(data);

      if (isValid) {
        console.log(chalk.green('✅ JSON is valid test metadata'));
      } else {
        console.log(chalk.red('❌ Invalid test metadata format'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Validation error:'), error.message);
      process.exit(1);
    }
  });

function validateMetadata(data: any): boolean {
  // Single file metadata
  if (data.filePath && data.fileName && data.extractedAt) {
    return true;
  }

  // Project metadata
  if (data.projectPath && data.files && Array.isArray(data.files)) {
    return true;
  }

  return false;
}

program.parse();