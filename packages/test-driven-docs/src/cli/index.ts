#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createDocumentationGenerator } from '../index.js';
import { validateConfig } from '../utils/index.js';
import { GeneratorConfig } from '../types/index.js';

const program = new Command();

program
  .name('test-driven-docs')
  .description('Generate documentation from test code')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate API documentation from test files')
  .option('-p, --packages-dir <dir>', 'Directory containing packages', './packages')
  .option('-o, --output-dir <dir>', 'Output directory for documentation', './docs')
  .option('-l, --languages <langs>', 'Comma-separated list of languages', 'en')
  .option('--packages <packages>', 'Comma-separated list of package names to process')
  .option('--clean-mocks', 'Clean mock implementations from examples', true)
  .option('--no-clean-mocks', 'Keep mock implementations in examples')
  .option('--realistic', 'Generate realistic examples', true)
  .option('--no-realistic', 'Keep test-style examples')
  .option('--extract-types', 'Extract TypeScript interfaces', true)
  .option('--no-extract-types', 'Skip TypeScript interface extraction')
  .option('--categorize', 'Categorize examples by usage pattern', true)
  .option('--no-categorize', 'Skip example categorization')
  .option('--config <file>', 'Path to configuration file')
  .action(async (options) => {
    const spinner = ora('Initializing documentation generator...').start();

    try {
      // Load configuration
      let config: Partial<GeneratorConfig>;

      if (options.config) {
        try {
          const configModule = await import(options.config);
          config = configModule.default || configModule;
        } catch (error) {
          spinner.fail(`Failed to load config file: ${options.config}`);
          process.exit(1);
        }
      } else {
        // Build config from CLI options
        config = {
          packagesDir: options.packagesDir,
          outputDir: options.outputDir,
          languages: options.languages.split(',').map((l: string) => l.trim()),
          cleanMocks: options.cleanMocks,
          realistic: options.realistic,
          extractTypes: options.extractTypes,
          categorizeExamples: options.categorize
        };

        if (options.packages) {
          config.packages = options.packages.split(',').map((p: string) => p.trim());
        }
      }

      // Validate configuration
      const validation = validateConfig(config);
      if (!validation.valid) {
        spinner.fail('Configuration validation failed:');
        validation.errors.forEach(error => {
          console.error(chalk.red(`  ❌ ${error}`));
        });
        process.exit(1);
      }

      spinner.text = 'Creating documentation generator...';

      // Create and run generator
      const generator = createDocumentationGenerator(config);

      spinner.text = 'Generating documentation...';
      const result = await generator.generate();

      if (result.success) {
        spinner.succeed('Documentation generation completed successfully!');

        console.log(chalk.green('\\n📊 Generation Summary:'));
        console.log(chalk.blue(`  📝 APIs documented: ${result.apisGenerated.length}`));
        console.log(chalk.blue(`  📁 Test files processed: ${result.filesProcessed}`));
        console.log(chalk.blue(`  🎯 Categories covered: ${result.categoriesCovered}`));

        if (result.apisGenerated.length > 0) {
          console.log(chalk.green('\\n📚 Generated APIs:'));
          result.apisGenerated.forEach(api => {
            console.log(chalk.cyan(`  - ${api}`));
          });
        }
      } else {
        spinner.fail('Documentation generation failed');

        if (result.errors.length > 0) {
          console.log(chalk.red('\\n❌ Errors encountered:'));
          result.errors.forEach(error => {
            console.log(chalk.red(`  ${error.type}: ${error.message}`));
            if (error.file) console.log(chalk.gray(`    File: ${error.file}`));
            if (error.api) console.log(chalk.gray(`    API: ${error.api}`));
          });
        }

        process.exit(1);
      }

    } catch (error) {
      spinner.fail('Unexpected error occurred');
      console.error(chalk.red('\\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new test-driven-docs configuration')
  .option('-f, --force', 'Overwrite existing configuration file')
  .action(async (options) => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const configPath = 'test-driven-docs.config.js';

    try {
      // Check if config already exists
      if (!options.force) {
        try {
          await fs.access(configPath);
          console.error(chalk.red(`Configuration file ${configPath} already exists. Use --force to overwrite.`));
          process.exit(1);
        } catch {
          // File doesn't exist, continue
        }
      }

      const defaultConfig = `export default {
  // Input configuration
  packagesDir: './packages',
  packages: ['core', 'react'],
  testPatterns: ['**/*.test.ts', '**/*.spec.ts'],

  // Output configuration
  outputDir: './docs',
  languages: ['en'],

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
};`;

      await fs.writeFile(configPath, defaultConfig);
      console.log(chalk.green(`✅ Created configuration file: ${configPath}`));
      console.log(chalk.blue('\\n📝 Edit the configuration file to customize your documentation generation.'));
      console.log(chalk.blue(`   Run ${chalk.cyan('test-driven-docs generate --config ${configPath}')} to use it.`));

    } catch (error) {
      console.error(chalk.red('Failed to create configuration file:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate configuration file')
  .argument('<config-file>', 'Path to configuration file')
  .action(async (configFile) => {
    try {
      const configModule = await import(configFile);
      const config = configModule.default || configModule;

      const validation = validateConfig(config);

      if (validation.valid) {
        console.log(chalk.green('✅ Configuration is valid'));
      } else {
        console.log(chalk.red('❌ Configuration validation failed:'));
        validation.errors.forEach(error => {
          console.error(chalk.red(`  - ${error}`));
        });
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('Failed to load or validate configuration:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});

program.parse();