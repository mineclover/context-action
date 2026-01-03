#!/usr/bin/env node
/**
 * CLI for style testing
 */
import { Command } from 'commander';
import { BrowserRunner } from '../runtime/browser-runner.js';
import { StyleExtractor } from '../runtime/style-extractor.js';
import { DiffEngine } from '../comparison/diff-engine.js';
import { Reporter } from '../comparison/reporter.js';

const program = new Command();

program
  .name('style-test')
  .description('Automated style testing tool')
  .version('0.1.0');

program
  .command('test')
  .description('Run style tests on a page')
  .requiredOption('-u, --url <url>', 'URL to test')
  .option('-s, --source <path>', 'Source directory to scan for components', './src')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--headless', 'Run browser in headless mode', true)
  .option('--show-passed', 'Show passed tests', false)
  .option('--output <format>', 'Output format (console, json, markdown)', 'console')
  .action(async (options) => {
    console.log('🧪 Starting style tests...\n');

    const browser = new BrowserRunner();
    const extractor = new StyleExtractor();
    const diffEngine = new DiffEngine({
      normalize: true,
      tolerance: 1,
    });
    const reporter = new Reporter({
      verbose: options.verbose,
      showPassed: options.showPassed,
    });

    try {
      // Step 1: Extract expected styles from source code
      console.log('📝 Extracting expected styles from source code...');
      extractor.addSourceDirectory(options.source, /\.tsx?$/);
      const expectedElements = extractor.extractExpectedStyles();
      console.log(`   Found ${expectedElements.length} elements with style tests\n`);

      if (expectedElements.length === 0) {
        console.log('⚠️  No elements found with data-style-test attributes.');
        console.log('   Make sure to use the Babel plugin to inject test IDs.\n');
        process.exit(1);
      }

      // Step 2: Launch browser and extract actual styles
      console.log('🌐 Launching browser...');
      await browser.launch({ headless: options.headless });
      await browser.navigateTo(options.url);
      console.log(`   Navigated to ${options.url}\n`);

      console.log('🎨 Extracting actual styles from page...');
      const actualStyles = await browser.extractAllStyles();
      console.log(`   Extracted styles for ${actualStyles.size} elements\n`);

      // Step 3: Compare expected vs actual
      console.log('🔍 Comparing expected vs actual styles...\n');
      const results = [];

      for (const expected of expectedElements) {
        const actual = actualStyles.get(expected.testId);

        if (!actual) {
          results.push({
            testId: expected.testId,
            passed: false,
            differences: [{
              property: '__element__',
              expected: 'Element should exist',
              actual: 'Element not found on page',
            }],
            file: expected.file,
            line: expected.line,
          });
          continue;
        }

        const result = diffEngine.compare(
          expected.expectedStyles,
          actual,
          expected.testId,
          { file: expected.file, line: expected.line }
        );

        results.push(result);
      }

      // Step 4: Report results
      if (options.output === 'json') {
        console.log(reporter.toJSON(results));
      } else if (options.output === 'markdown') {
        console.log(reporter.toMarkdown(results));
      } else {
        reporter.report(results);
      }

      // Exit with error if tests failed
      const failedCount = results.filter(r => !r.passed).length;
      if (failedCount > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error running tests:', error);
      process.exit(1);
    } finally {
      await browser.close();
    }
  });

program
  .command('snapshot')
  .description('Create a snapshot of current styles')
  .requiredOption('-u, --url <url>', 'URL to snapshot')
  .option('-o, --output <path>', 'Output file path', './style-snapshot.json')
  .option('--headless', 'Run browser in headless mode', true)
  .action(async (options) => {
    console.log('📸 Creating style snapshot...\n');

    const browser = new BrowserRunner();

    try {
      await browser.launch({ headless: options.headless });
      await browser.navigateTo(options.url);

      const styles = await browser.extractAllStyles();
      const snapshot = Object.fromEntries(styles);

      const fs = await import('node:fs/promises');
      await fs.writeFile(options.output, JSON.stringify(snapshot, null, 2));

      console.log(`✅ Snapshot saved to ${options.output}`);
      console.log(`   Captured ${styles.size} elements\n`);
    } catch (error) {
      console.error('❌ Error creating snapshot:', error);
      process.exit(1);
    } finally {
      await browser.close();
    }
  });

program.parse();
