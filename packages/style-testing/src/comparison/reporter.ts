/**
 * Format and output comparison results
 */
import type { ComparisonResult } from './diff-engine.js';

export interface ReporterOptions {
  verbose?: boolean;
  showPassed?: boolean;
  colorize?: boolean;
}

export class Reporter {
  private options: ReporterOptions;

  constructor(options: ReporterOptions = {}) {
    this.options = {
      verbose: false,
      showPassed: false,
      colorize: true,
      ...options,
    };
  }

  report(results: ComparisonResult[]): void {
    console.log('\n=== Style Testing Results ===\n');

    const failed = results.filter(r => !r.passed);
    const passed = results.filter(r => r.passed);

    // Report failures
    if (failed.length > 0) {
      console.log(`${this.red('✗')} ${failed.length} elements with style mismatches:\n`);

      for (const result of failed) {
        this.reportFailure(result);
      }
    }

    // Report passed (if enabled)
    if (this.options.showPassed && passed.length > 0) {
      console.log(`\n${this.green('✓')} ${passed.length} elements passed\n`);

      if (this.options.verbose) {
        for (const result of passed) {
          console.log(`  ${this.green('✓')} ${result.testId}`);
        }
      }
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${this.green(passed.length.toString())}`);
    console.log(`Failed: ${this.red(failed.length.toString())}`);
    const passRate = results.length > 0 ? ((passed.length / results.length) * 100).toFixed(1) : '0';
    console.log(`Pass Rate: ${passRate}%`);
    console.log('');
  }

  private reportFailure(result: ComparisonResult): void {
    console.log(`  ${this.red('✗')} ${this.bold(result.testId)}`);

    if (result.file) {
      console.log(`    ${this.dim(`File: ${result.file}:${result.line || '?'}`)}`);
    }

    for (const diff of result.differences) {
      console.log(`    ${this.yellow(diff.property)}:`);
      console.log(`      Expected: ${this.green(diff.expected)}`);
      console.log(`      Actual:   ${this.red(diff.actual)}`);
    }

    console.log('');
  }

  toJSON(results: ComparisonResult[]): string {
    return JSON.stringify(results, null, 2);
  }

  toMarkdown(results: ComparisonResult[]): string {
    let md = '# Style Testing Results\n\n';

    const failed = results.filter(r => !r.passed);
    const passed = results.filter(r => r.passed);

    md += `## Summary\n\n`;
    md += `- Total: ${results.length}\n`;
    md += `- Passed: ${passed.length}\n`;
    md += `- Failed: ${failed.length}\n`;
    md += `- Pass Rate: ${((passed.length / results.length) * 100).toFixed(1)}%\n\n`;

    if (failed.length > 0) {
      md += `## Failures\n\n`;

      for (const result of failed) {
        md += `### ${result.testId}\n\n`;

        if (result.file) {
          md += `**File:** \`${result.file}:${result.line || '?'}\`\n\n`;
        }

        md += `| Property | Expected | Actual |\n`;
        md += `|----------|----------|--------|\n`;

        for (const diff of result.differences) {
          md += `| ${diff.property} | \`${diff.expected}\` | \`${diff.actual}\` |\n`;
        }

        md += '\n';
      }
    }

    return md;
  }

  // Color helpers
  private red(text: string): string {
    return this.options.colorize ? `\x1b[31m${text}\x1b[0m` : text;
  }

  private green(text: string): string {
    return this.options.colorize ? `\x1b[32m${text}\x1b[0m` : text;
  }

  private yellow(text: string): string {
    return this.options.colorize ? `\x1b[33m${text}\x1b[0m` : text;
  }

  private bold(text: string): string {
    return this.options.colorize ? `\x1b[1m${text}\x1b[0m` : text;
  }

  private dim(text: string): string {
    return this.options.colorize ? `\x1b[2m${text}\x1b[0m` : text;
  }
}
