import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

describe('ValidateCommand', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    
    // Setup test directory
    testDir = path.join(process.cwd(), 'test-validate-cli');
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

  describe('Validate Command Help', () => {
    it('should show validate help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('✅ validate - Validation and quality assurance management');
      expect(output).toContain('ACTIONS:');
      expect(output).toContain('config       Validate configuration files and settings');
      expect(output).toContain('priority     Validate priority files and document consistency');
      expect(output).toContain('frontmatter  Validate YAML frontmatter and metadata consistency');
      expect(output).toContain('content      Validate content quality and consistency across documents');
      expect(output).toContain('all          Perform comprehensive validation of all components');
      expect(output).toContain('pre-commit   Pre-commit validation hook for Git workflow integration');
    });

    it('should show validate help with help action', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate help`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('✅ validate - Validation and quality assurance management');
      expect(output).toContain('For detailed help on specific action:');
      expect(output).toContain('validate <action> --help');
    });

    it('should handle unknown validate action', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} validate unknown-action`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Unknown validate action: unknown-action');
        expect(output).toContain('Available actions: config, priority, frontmatter, content, all, pre-commit');
      }
    });
  });

  describe('Validate Config', () => {
    it('should handle validate config with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate config --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate configuration');
      expect(output).toContain('[DRY RUN] Output format: table');
    });

    it('should handle validate config with specific settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate config --file=custom-config.json --schema=./schema.json --fix --strict --format=json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate configuration');
      expect(output).toContain('[DRY RUN] Config file: custom-config.json');
      expect(output).toContain('[DRY RUN] Schema file: ./schema.json');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix all fixable issues');
      expect(output).toContain('[DRY RUN] Using strict validation rules');
      expect(output).toContain('[DRY RUN] Output format: json');
    });

    it('should execute validate config without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate config --format=table`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Validating configuration...');
      expect(output).toContain('Configuration Validation Results:');
      expect(output).toContain('Total checks:');
      expect(output).toContain('Passed checks:');
    });

    it('should handle validate config with short aliases', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate config -f myconfig.json -s ./schemas/config.json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate configuration');
      expect(output).toContain('[DRY RUN] Config file: myconfig.json');
      expect(output).toContain('[DRY RUN] Schema file: ./schemas/config.json');
    });
  });

  describe('Validate Priority', () => {
    it('should handle validate priority with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate priority --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate priority files');
      expect(output).toContain('[DRY RUN] Would check consistency');
      expect(output).toContain('[DRY RUN] Would check completeness');
      expect(output).toContain('[DRY RUN] Output format: table');
    });

    it('should handle validate priority with specific settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate priority --language=ko --document-id=guide-action-handlers --fix --format=json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate priority files');
      expect(output).toContain('[DRY RUN] Language: ko');
      expect(output).toContain('[DRY RUN] Document ID: guide-action-handlers');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix all fixable issues');
      expect(output).toContain('[DRY RUN] Output format: json');
    });

    it('should execute validate priority without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate priority --language=ko`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Validating priority files...');
      expect(output).toContain('Priority Validation Results:');
      expect(output).toContain('Total files:');
      expect(output).toContain('Valid files:');
    });

    it('should handle validate priority with short aliases', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate priority --lang=en --doc=api-reference --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate priority files');
      expect(output).toContain('[DRY RUN] Language: en');
      expect(output).toContain('[DRY RUN] Document ID: api-reference');
    });
  });

  describe('Validate Frontmatter', () => {
    it('should handle validate frontmatter with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate frontmatter --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate frontmatter');
      expect(output).toContain('[DRY RUN] Directory: ./docs');
      expect(output).toContain('[DRY RUN] Pattern: **/*.md');
      expect(output).toContain('[DRY RUN] Would check required fields');
      expect(output).toContain('[DRY RUN] Would check YAML syntax');
      expect(output).toContain('[DRY RUN] Output format: table');
    });

    it('should handle validate frontmatter with custom settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate frontmatter --directory=./content --pattern="*.mdx" --schema=./schemas/frontmatter.json --fix --format=json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate frontmatter');
      expect(output).toContain('[DRY RUN] Directory: ./content');
      expect(output).toContain('[DRY RUN] Pattern: *.mdx');
      expect(output).toContain('[DRY RUN] Schema file: ./schemas/frontmatter.json');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix all fixable issues');
      expect(output).toContain('[DRY RUN] Output format: json');
    });

    it('should execute validate frontmatter without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate frontmatter --directory=./docs`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Validating frontmatter...');
      expect(output).toContain('Frontmatter Validation Results:');
      expect(output).toContain('Total files:');
      expect(output).toContain('Valid files:');
    });

    it('should handle validate frontmatter with short aliases', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate frontmatter -d ./content -p "**/*.md" -s ./schema.json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate frontmatter');
      expect(output).toContain('[DRY RUN] Directory: ./content');
      expect(output).toContain('[DRY RUN] Pattern: **/*.md');
      expect(output).toContain('[DRY RUN] Schema file: ./schema.json');
    });
  });

  describe('Validate Content', () => {
    it('should handle validate content with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate content --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate content quality');
      expect(output).toContain('[DRY RUN] Content type: all');
      expect(output).toContain('[DRY RUN] Quality threshold: 70');
      expect(output).toContain('[DRY RUN] Would check internal links');
      expect(output).toContain('[DRY RUN] Would check images');
      expect(output).toContain('[DRY RUN] Output format: table');
    });

    it('should handle validate content with specific settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate content --language=ko --type=docs --quality-threshold=85 --check-spelling --format=json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate content quality');
      expect(output).toContain('[DRY RUN] Language: ko');
      expect(output).toContain('[DRY RUN] Content type: docs');
      expect(output).toContain('[DRY RUN] Quality threshold: 85');
      expect(output).toContain('[DRY RUN] Would check spelling');
      expect(output).toContain('[DRY RUN] Output format: json');
    });

    it('should execute validate content without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate content --type=docs --quality-threshold=80`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Validating content quality...');
      expect(output).toContain('Content Validation Results:');
      expect(output).toContain('Total items:');
      expect(output).toContain('High quality:');
    });

    it('should handle validate content with short aliases', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate content --lang=en -t summaries --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate content quality');
      expect(output).toContain('[DRY RUN] Language: en');
      expect(output).toContain('[DRY RUN] Content type: summaries');
    });
  });

  describe('Validate All', () => {
    it('should handle validate all with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate all --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive validation');
      expect(output).toContain('[DRY RUN] Parallel execution: max 3 concurrent');
      expect(output).toContain('[DRY RUN] Would generate validation report');
      expect(output).toContain('[DRY RUN] Output format: table');
    });

    it('should handle validate all with comprehensive settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate all --language=ko --exclude=spelling,images --parallel --max-concurrent=5 --continue-on-error --fix --report --format=json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive validation');
      expect(output).toContain('[DRY RUN] Language: ko');
      expect(output).toContain('[DRY RUN] Exclude: spelling,images');
      expect(output).toContain('[DRY RUN] Parallel execution: max 5 concurrent');
      expect(output).toContain('[DRY RUN] Would continue on errors');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix all fixable issues');
      expect(output).toContain('[DRY RUN] Would generate validation report');
      expect(output).toContain('[DRY RUN] Output format: json');
    });

    it('should execute validate all without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate all --language=ko --parallel`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Starting comprehensive validation...');
      expect(output).toContain('Comprehensive Validation Results:');
      expect(output).toContain('Language: ko');
      expect(output).toContain('Validation Types:');
      expect(output).toContain('Overall Summary:');
    });

    it('should handle validate all with minimal settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate all --exclude=content --continue-on-error --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive validation');
      expect(output).toContain('[DRY RUN] Exclude: content');
      expect(output).toContain('[DRY RUN] Would continue on errors');
    });

    it('should handle validate all with short aliases', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate all --lang=en -x spelling,images --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive validation');
      expect(output).toContain('[DRY RUN] Language: en');
      expect(output).toContain('[DRY RUN] Exclude: spelling,images');
    });
  });

  describe('Validate Pre-commit', () => {
    it('should handle validate pre-commit with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate pre-commit --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would run pre-commit validation');
      expect(output).toContain('[DRY RUN] Would validate staged files only');
      expect(output).toContain('[DRY RUN] Would fail fast on first error');
    });

    it('should handle validate pre-commit with custom settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate pre-commit --auto-fix --skip-types=spelling,images --verbose --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would run pre-commit validation');
      expect(output).toContain('[DRY RUN] Would auto-fix and stage fixes');
      expect(output).toContain('[DRY RUN] Would skip: spelling,images');
      expect(output).toContain('[DRY RUN] Would show detailed output');
    });

    it('should execute validate pre-commit without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate pre-commit --auto-fix`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Running pre-commit validation...');
      expect(output).toContain('Pre-commit Validation:');
      expect(output).toContain('Files validated:');
      expect(output).toContain('Issues found:');
    });

    it('should handle validate pre-commit without staged-only', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate pre-commit --no-staged-only --no-fail-fast --verbose --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would run pre-commit validation');
      expect(output).toContain('[DRY RUN] Would show detailed output');
    });

    it('should handle validate pre-commit with short aliases', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate pre-commit -v --auto-fix --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would run pre-commit validation');
      expect(output).toContain('[DRY RUN] Would auto-fix and stage fixes');
      expect(output).toContain('[DRY RUN] Would show detailed output');
    });
  });

  describe('Legacy Command Support', () => {
    it('should support legacy pre-commit-check with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} pre-commit-check --auto-fix --verbose --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: validate pre-commit');
      expect(output).toContain('[DRY RUN] Would run pre-commit validation');
    });
  });

  describe('Argument Parsing', () => {
    it('should handle options parsing correctly for config', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate config --file=test.json --schema=schema.json --fix --strict --format=summary --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate configuration');
      expect(output).toContain('[DRY RUN] Config file: test.json');
      expect(output).toContain('[DRY RUN] Schema file: schema.json');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix all fixable issues');
      expect(output).toContain('[DRY RUN] Using strict validation rules');
      expect(output).toContain('[DRY RUN] Output format: summary');
    });

    it('should handle mixed positional and option arguments', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate frontmatter --directory=./content --pattern="*.md" --fix --format=json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate frontmatter');
      expect(output).toContain('[DRY RUN] Directory: ./content');
      expect(output).toContain('[DRY RUN] Pattern: *.md');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix all fixable issues');
      expect(output).toContain('[DRY RUN] Output format: json');
    });

    it('should handle boolean flags correctly', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate all --parallel --continue-on-error --fix --no-report --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive validation');
      expect(output).toContain('[DRY RUN] Parallel execution: max 3 concurrent');
      expect(output).toContain('[DRY RUN] Would continue on errors');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix all fixable issues');
    });

    it('should handle numeric options correctly', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate content --quality-threshold=85 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate content quality');
      expect(output).toContain('[DRY RUN] Quality threshold: 85');
    });
  });

  describe('Output Formatting', () => {
    it('should support different output formats for config validation', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      // Test JSON format
      const jsonOutput = execSync(`npx tsx ${cliPath} validate config --format=json`, {
        encoding: 'utf-8',
        cwd: testDir
      });
      expect(jsonOutput).toContain('"configFile"');
      expect(jsonOutput).toContain('"totalChecks"');

      // Test summary format
      const summaryOutput = execSync(`npx tsx ${cliPath} validate config --format=summary`, {
        encoding: 'utf-8',
        cwd: testDir
      });
      expect(summaryOutput).toContain('Configuration Validation Summary:');
      expect(summaryOutput).toContain('Total checks:');

      // Test table format (default)
      const tableOutput = execSync(`npx tsx ${cliPath} validate config --format=table`, {
        encoding: 'utf-8',
        cwd: testDir
      });
      expect(tableOutput).toContain('Configuration Validation Results:');
      expect(tableOutput).toContain('Total checks:');
    });

    it('should support different output formats for priority validation', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      // Test JSON format
      const jsonOutput = execSync(`npx tsx ${cliPath} validate priority --format=json --language=ko`, {
        encoding: 'utf-8',
        cwd: testDir
      });
      expect(jsonOutput).toContain('"language"');
      expect(jsonOutput).toContain('"totalFiles"');

      // Test summary format
      const summaryOutput = execSync(`npx tsx ${cliPath} validate priority --format=summary --language=ko`, {
        encoding: 'utf-8',
        cwd: testDir
      });
      expect(summaryOutput).toContain('Priority Validation Summary:');
      expect(summaryOutput).toContain('Total files:');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation failures gracefully for config', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate config`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Configuration Validation Results:');
      // Should show results even with failures
      expect(output).toContain('Failed checks:');
    });

    it('should handle validation failures gracefully for priority', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate priority --language=ko`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Priority Validation Results:');
      // Should show results even with failures
      expect(output).toContain('Invalid files:');
    });

    it('should handle comprehensive validation with mixed results', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate all --language=ko`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Comprehensive Validation Results:');
      expect(output).toContain('Validation Types:');
      expect(output).toContain('Overall Summary:');
      // Should show some passed and some failed validations
      expect(output).toContain('Failed:');
    });
  });

  describe('Integration Features', () => {
    it('should show fix results when auto-fix is enabled', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate config --fix`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Configuration validation passed');
    });

    it('should show validation report path for comprehensive validation', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate all --report`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('📄 Validation report saved to: ./validation-report.json');
    });

    it('should handle pre-commit validation with auto-fix and staging', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} validate pre-commit --auto-fix --verbose`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Pre-commit Validation Results:');
      expect(output).toContain('Pre-commit validation passed');
    });
  });
});