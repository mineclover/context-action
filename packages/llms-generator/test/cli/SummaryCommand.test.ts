import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

describe('SummaryCommand', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    
    // Setup test directory
    testDir = path.join(process.cwd(), 'test-summary-cli');
    await fs.mkdir(testDir, { recursive: true });
    
    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore original directory
    process.chdir(originalCwd);
    
    // Cleanup test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('Summary Command Help', () => {
    it('should show summary help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('📄 summary - Content summary generation and improvement');
      expect(output).toContain('ACTIONS:');
      expect(output).toContain('generate     Generate YAML frontmatter summaries from source formats');
      expect(output).toContain('improve      Improve existing summaries based on quality metrics');
      expect(output).toContain('validate     Validate summaries against quality standards and fix issues');
      expect(output).toContain('stats        Show summary generation statistics and quality metrics');
    });

    it('should show summary help with help action', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary help`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('📄 summary - Content summary generation and improvement');
      expect(output).toContain('For detailed help on specific action:');
      expect(output).toContain('summary <action> --help');
    });

    it('should handle unknown summary action', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} summary unknown-action`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Unknown summary action: unknown-action');
        expect(output).toContain('Available actions: generate, improve, validate, stats');
      }
    });
  });

  describe('Summary Generate', () => {
    it('should handle summary generate with required format', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary generate minimum ko --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate minimum summaries for language: ko');
      expect(output).toContain('[DRY RUN] Strategy: balanced');
      expect(output).toContain('[DRY RUN] Parallel: true, Max concurrent: 3');
    });

    it('should handle summary generate with origin format', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary generate origin en --chars=100,300,1000 --strategy=api-first --overwrite --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate origin summaries for language: en');
      expect(output).toContain('[DRY RUN] Character limits: 100,300,1000');
      expect(output).toContain('[DRY RUN] Strategy: api-first');
      expect(output).toContain('[DRY RUN] Would overwrite existing summaries');
    });

    it('should require format for generate', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} summary generate`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Source format required. Must be "minimum" or "origin"');
        expect(output).toContain('Usage: summary generate <minimum|origin> [language] [options]');
      }
    });

    it('should handle invalid format for generate', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} summary generate invalid ko`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Source format required. Must be "minimum" or "origin"');
      }
    });

    it('should handle summary generate with custom concurrent settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary generate minimum ko --chars=100,500 --max-concurrent=5 --strategy=content-first --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate minimum summaries for language: ko');
      expect(output).toContain('[DRY RUN] Character limits: 100,500');
      expect(output).toContain('[DRY RUN] Strategy: content-first');
      expect(output).toContain('[DRY RUN] Parallel: true, Max concurrent: 5');
    });

    it('should handle summary generate with disabled parallel', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary generate minimum ko --parallel=false --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate minimum summaries for language: ko');
      expect(output).toContain('[DRY RUN] Parallel: false, Max concurrent: 3');
    });
  });

  describe('Summary Improve', () => {
    it('should handle summary improve with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary improve ko --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would improve summaries for language: ko');
      expect(output).toContain('[DRY RUN] Minimum quality threshold: 70');
      expect(output).toContain('[DRY RUN] Max age: 30 days');
      expect(output).toContain('[DRY RUN] Strategy: quality-focused');
      expect(output).toContain('[DRY RUN] Batch size: 10');
    });

    it('should handle summary improve with custom settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary improve en --min-quality=80 --chars=100,300 --max-age=7 --strategy=accuracy-focused --batch-size=20 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would improve summaries for language: en');
      expect(output).toContain('[DRY RUN] Minimum quality threshold: 80');
      expect(output).toContain('[DRY RUN] Character limits: 100,300');
      expect(output).toContain('[DRY RUN] Max age: 7 days');
      expect(output).toContain('[DRY RUN] Strategy: accuracy-focused');
      expect(output).toContain('[DRY RUN] Batch size: 20');
    });

    it('should handle summary improve with language as positional argument', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary improve ko --min-quality=85 --strategy=length-focused --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would improve summaries for language: ko');
      expect(output).toContain('[DRY RUN] Minimum quality threshold: 85');
      expect(output).toContain('[DRY RUN] Strategy: length-focused');
    });

    it('should handle summary improve with default language when not specified', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary improve --min-quality=75 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would improve summaries for language: ko');
      expect(output).toContain('[DRY RUN] Minimum quality threshold: 75');
    });
  });

  describe('Summary Validate', () => {
    it('should handle summary validate with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary validate ko --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate summaries');
      expect(output).toContain('[DRY RUN] Language: ko');
      expect(output).toContain('[DRY RUN] Output format: table');
    });

    it('should handle summary validate with auto-fix and strict mode', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary validate ko --fix --strict --format=json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate summaries');
      expect(output).toContain('[DRY RUN] Language: ko');
      expect(output).toContain('[DRY RUN] Would auto-fix validation issues');
      expect(output).toContain('[DRY RUN] Using strict validation rules');
      expect(output).toContain('[DRY RUN] Output format: json');
    });

    it('should handle summary validate with specific document', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary validate --doc=guide-action-handlers --fix --format=summary --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate summaries');
      expect(output).toContain('[DRY RUN] Document ID: guide-action-handlers');
      expect(output).toContain('[DRY RUN] Would auto-fix validation issues');
      expect(output).toContain('[DRY RUN] Output format: summary');
    });

    it('should handle summary validate without language specified', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary validate --fix --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate summaries');
      expect(output).toContain('[DRY RUN] Would auto-fix validation issues');
    });
  });

  describe('Summary Stats', () => {
    it('should handle summary stats with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary stats ko --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Summary Statistics');
      expect(output).toContain('Language: ko');
    });

    it('should handle summary stats with detailed breakdown', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary stats --detailed --quality-breakdown --format=json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Summary Statistics');
    });

    it('should handle summary stats without language specified', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary stats --detailed --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Summary Statistics');
    });

    it('should handle summary stats with language as positional argument', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary stats en --format=summary --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Summary Statistics');
      expect(output).toContain('Language: en');
    });
  });

  describe('Legacy Command Support', () => {
    it('should support legacy generate-summaries with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} generate-summaries minimum ko --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: summary generate');
      expect(output).toContain('[DRY RUN] Would generate minimum summaries for language: ko');
    });

    it('should support legacy improve-summaries with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} improve-summaries ko --min-quality=80 --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: summary improve');
      expect(output).toContain('[DRY RUN] Would improve summaries for language: ko');
    });
  });

  describe('Argument Parsing', () => {
    it('should handle options parsing correctly for generate', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary generate minimum --lang=ko --chars=100,300,1000 --strategy=api-first --overwrite --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate minimum summaries for language: ko');
      expect(output).toContain('[DRY RUN] Character limits: 100,300,1000');
      expect(output).toContain('[DRY RUN] Strategy: api-first');
      expect(output).toContain('[DRY RUN] Would overwrite existing summaries');
    });

    it('should handle mixed positional and option arguments', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary generate origin en --chars=500,1000 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate origin summaries for language: en');
      expect(output).toContain('[DRY RUN] Character limits: 500,1000');
    });

    it('should handle format as option instead of positional', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} summary generate --format=minimum ko --chars=200 --dry-run`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Usage: summary generate <minimum|origin> [language] [options]');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing format gracefully', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} summary generate ko --chars=100`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Source format required. Must be "minimum" or "origin"');
      }
    });

    it('should handle invalid format gracefully', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} summary generate invalid`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Source format required. Must be "minimum" or "origin"');
      }
    });
  });
});