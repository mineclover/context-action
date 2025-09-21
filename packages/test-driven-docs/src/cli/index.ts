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
  .option('--enhanced', 'Generate enhanced documentation with annotations')
  .option('--with-validation', 'Include consistency validation')
  .option('--github-repo <url>', 'GitHub repository URL for enhanced docs')
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
          categorizeExamples: options.categorize,
          githubRepoUrl: options.githubRepo
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

      // Choose generation method based on options
      let result;
      if (options.enhanced || options.withValidation) {
        if (options.withValidation) {
          spinner.text = 'Generating enhanced documentation with validation...';
          const { generation, validation } = await generator.generateWithValidation();
          result = generation;

          // Display validation summary
          console.log(chalk.blue('\\n🔍 Validation Results:'));
          console.log(chalk.blue(`  📋 APIs validated: ${validation.summary.totalApis}`));
          console.log(chalk.blue(`  ✅ Synced: ${validation.summary.syncedApis}`));
          console.log(chalk.blue(`  ⚠️  Outdated: ${validation.summary.outdatedApis}`));
          console.log(chalk.blue(`  ❌ Missing: ${validation.summary.missingApis}`));
          console.log(chalk.blue(`  📈 Quality score: ${validation.summary.averageScore}%`));

          if (validation.recommendations.length > 0) {
            console.log(chalk.yellow('\\n💡 Recommendations:'));
            validation.recommendations.forEach(rec => {
              console.log(chalk.yellow(`  ${rec}`));
            });
          }
        } else {
          spinner.text = 'Generating enhanced documentation...';
          result = await generator.generateEnhanced();
        }
      } else {
        spinner.text = 'Generating documentation...';
        result = await generator.generate();
      }

      if (result.success) {
        const docType = options.enhanced ? 'Enhanced' : 'Standard';
        spinner.succeed(`${docType} documentation generation completed successfully!`);

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

        if (options.enhanced) {
          console.log(chalk.green('\\n✨ Enhanced features used:'));
          console.log(chalk.cyan('  - Annotation-based extraction (@doc-extract)'));
          console.log(chalk.cyan('  - Enhanced markdown with validation links'));
          console.log(chalk.cyan('  - Priority-based example organization'));
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

        if (options.enhanced && result.apisGenerated.length === 0) {
          console.log(chalk.yellow('\\n💡 Tip: Add @doc-extract annotations to your test files:'));
          console.log(chalk.cyan('   // @doc-extract: basic-usage'));
          console.log(chalk.cyan('   // @doc-category: getting-started'));
          console.log(chalk.cyan('   // @doc-priority: high'));
          console.log(chalk.cyan("   it('should demonstrate API usage', () => {"));
          console.log(chalk.cyan('     // Your test code'));
          console.log(chalk.cyan('   });'));
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
  .description('Validate documentation consistency')
  .option('-p, --packages-dir <dir>', 'Directory containing packages', './packages')
  .option('-o, --output-dir <dir>', 'Output directory for documentation', './docs')
  .option('--packages <packages>', 'Comma-separated list of package names to process')
  .option('--config <file>', 'Path to configuration file')
  .option('--consistency', 'Validate test-documentation consistency')
  .argument('[config-file]', 'Path to configuration file (for config validation)')
  .action(async (configFile, options) => {
    const spinner = ora('Initializing validator...').start();

    try {
      if (configFile && !options.consistency) {
        // Legacy config file validation
        spinner.text = 'Validating configuration file...';
        const configModule = await import(configFile);
        const config = configModule.default || configModule;

        const validation = validateConfig(config);

        if (validation.valid) {
          spinner.succeed('Configuration is valid');
        } else {
          spinner.fail('Configuration validation failed');
          validation.errors.forEach(error => {
            console.error(chalk.red(`  - ${error}`));
          });
          process.exit(1);
        }
      } else {
        // Documentation consistency validation
        spinner.text = 'Loading configuration...';

        let config: Partial<GeneratorConfig>;

        if (options.config) {
          const configModule = await import(options.config);
          config = configModule.default || configModule;
        } else {
          config = {
            packagesDir: options.packagesDir,
            outputDir: options.outputDir
          };

          if (options.packages) {
            config.packages = options.packages.split(',').map((p: string) => p.trim());
          }
        }

        const validation = validateConfig(config);
        if (!validation.valid) {
          spinner.fail('Configuration validation failed');
          validation.errors.forEach(error => {
            console.error(chalk.red(`  ❌ ${error}`));
          });
          process.exit(1);
        }

        spinner.text = 'Creating documentation generator...';
        const generator = createDocumentationGenerator(config);

        spinner.text = 'Validating documentation consistency...';
        const report = await generator.validateConsistency();

        spinner.succeed('Documentation consistency validation completed');

        // Display validation results
        console.log(chalk.blue('\\n📊 Validation Summary:'));
        console.log(chalk.blue(`  📋 APIs validated: ${report.summary.totalApis}`));
        console.log(chalk.blue(`  ✅ Synced: ${report.summary.syncedApis}`));
        console.log(chalk.blue(`  ⚠️  Outdated: ${report.summary.outdatedApis}`));
        console.log(chalk.blue(`  ❌ Missing: ${report.summary.missingApis}`));
        console.log(chalk.blue(`  📈 Average quality score: ${report.summary.averageScore}%`));

        if (report.recommendations.length > 0) {
          console.log(chalk.yellow('\\n💡 Recommendations:'));
          report.recommendations.forEach(rec => {
            console.log(chalk.yellow(`  ${rec}`));
          });
        }

        // Show detailed results for problematic APIs
        const problematicApis = report.apiValidations.filter(
          api => api.mapping.status !== 'synced' || api.overallScore < 80
        );

        if (problematicApis.length > 0) {
          console.log(chalk.red('\\n🔍 APIs requiring attention:'));
          problematicApis.forEach(api => {
            console.log(chalk.red(`\\n  📝 ${api.apiName}:`));
            console.log(chalk.gray(`    Status: ${api.mapping.status}`));
            console.log(chalk.gray(`    Quality score: ${api.overallScore}%`));
            console.log(chalk.gray(`    Message: ${api.mapping.message}`));
            if (api.mapping.action) {
              console.log(chalk.cyan(`    Action: ${api.mapping.action}`));
            }
          });
        }

        // Exit with non-zero code if there are issues
        if (report.summary.outdatedApis > 0 || report.summary.missingApis > 0) {
          process.exit(1);
        }
      }

    } catch (error) {
      spinner.fail('Validation failed');
      console.error(chalk.red('\\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});

program.parse();