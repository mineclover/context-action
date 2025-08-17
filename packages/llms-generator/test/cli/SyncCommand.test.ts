import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

describe('SyncCommand', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    
    // Setup test directory
    testDir = path.join(process.cwd(), 'test-sync-cli');
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

  describe('Sync Command Help', () => {
    it('should show sync help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('🔄 sync - Synchronization and migration management');
      expect(output).toContain('ACTIONS:');
      expect(output).toContain('docs         Synchronize documentation files and maintain consistency across languages');
      expect(output).toContain('simple       Migrate existing content to simplified format and structure');
      expect(output).toContain('files        Generate and synchronize files based on templates and configurations');
      expect(output).toContain('all          Perform comprehensive synchronization of all content and configurations');
    });

    it('should show sync help with help action', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync help`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('🔄 sync - Synchronization and migration management');
      expect(output).toContain('For detailed help on specific action:');
      expect(output).toContain('sync <action> --help');
    });

    it('should handle unknown sync action', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} sync unknown-action`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Unknown sync action: unknown-action');
        expect(output).toContain('Available actions: docs, simple, files, all');
      }
    });
  });

  describe('Sync Docs', () => {
    it('should handle sync docs with check-only mode', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync docs --source=en --target=ko,ja --check-only --diff-format=summary --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would sync documentation');
      expect(output).toContain('[DRY RUN] Source language: en');
      expect(output).toContain('[DRY RUN] Target languages: ko,ja');
      expect(output).toContain('[DRY RUN] Check-only mode enabled');
      expect(output).toContain('[DRY RUN] Diff format: summary');
    });

    it('should handle sync docs with force and backup options', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync docs --source=en --target=ko --force --backup --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would sync documentation');
      expect(output).toContain('[DRY RUN] Source language: en');
      expect(output).toContain('[DRY RUN] Target languages: ko');
      expect(output).toContain('[DRY RUN] Force mode enabled');
      expect(output).toContain('[DRY RUN] Would create backups');
    });

    it('should require target languages for docs sync', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} sync docs --source=en`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Target languages are required for documentation sync');
        expect(output).toContain('Usage: sync docs --source=<lang> --target=<lang1,lang2,...>');
      }
    });

    it('should execute sync docs without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync docs --source=en --target=ko --check-only`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Synchronizing documentation from en to ko...');
      expect(output).toContain('Documentation Sync Results:');
      expect(output).toContain('Source language: en');
      expect(output).toContain('Target languages: ko');
      expect(output).toContain('Files checked:');
    });

    it('should handle sync docs with short aliases', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync docs -s en -t ko,ja --check-only --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would sync documentation');
      expect(output).toContain('[DRY RUN] Source language: en');
      expect(output).toContain('[DRY RUN] Target languages: ko,ja');
    });
  });

  describe('Sync Simple', () => {
    it('should handle sync simple with required parameters', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync simple --input=./old-docs --output=./new-docs --format=markdown --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would migrate content to simplified format');
      expect(output).toContain('[DRY RUN] Input: ./old-docs');
      expect(output).toContain('[DRY RUN] Output: ./new-docs');
      expect(output).toContain('[DRY RUN] Format: markdown');
      expect(output).toContain('[DRY RUN] Would preserve directory structure');
    });

    it('should handle sync simple with cleanup and validation options', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync simple --input=./legacy --output=./migrated --cleanup-source --validate --batch-size=20 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would migrate content to simplified format');
      expect(output).toContain('[DRY RUN] Input: ./legacy');
      expect(output).toContain('[DRY RUN] Output: ./migrated');
      expect(output).toContain('[DRY RUN] Would cleanup source files');
      expect(output).toContain('[DRY RUN] Would validate migrated content');
      expect(output).toContain('[DRY RUN] Batch size: 20');
    });

    it('should require input path for simple migration', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} sync simple --output=./new-docs`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Input path is required for migration');
        expect(output).toContain('Usage: sync simple --input=<path> --output=<path> [options]');
      }
    });

    it('should require output path for simple migration', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} sync simple --input=./old-docs`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Output path is required for migration');
        expect(output).toContain('Usage: sync simple --input=<path> --output=<path> [options]');
      }
    });

    it('should execute sync simple without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync simple --input=./old-docs --output=./new-docs`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Migrating content from ./old-docs to ./new-docs...');
      expect(output).toContain('Content Migration Results:');
      expect(output).toContain('Input: ./old-docs');
      expect(output).toContain('Output: ./new-docs');
      expect(output).toContain('Total files:');
    });

    it('should handle sync simple with short aliases', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync simple -i ./source -o ./target -f yaml --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would migrate content to simplified format');
      expect(output).toContain('[DRY RUN] Input: ./source');
      expect(output).toContain('[DRY RUN] Output: ./target');
      expect(output).toContain('[DRY RUN] Format: yaml');
    });
  });

  describe('Sync Files', () => {
    it('should handle sync files with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync files --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate files from templates');
      expect(output).toContain('[DRY RUN] Template path: ./templates');
      expect(output).toContain('[DRY RUN] Output path: ./generated');
      expect(output).toContain('[DRY RUN] Pattern: **/*.template');
    });

    it('should handle sync files with custom settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync files --template=./my-templates --config=./config.json --output=./output --pattern="*.md.template" --variables=vars.json --overwrite --watch --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate files from templates');
      expect(output).toContain('[DRY RUN] Template path: ./my-templates');
      expect(output).toContain('[DRY RUN] Config file: ./config.json');
      expect(output).toContain('[DRY RUN] Output path: ./output');
      expect(output).toContain('[DRY RUN] Pattern: *.md.template');
      expect(output).toContain('[DRY RUN] Variables: vars.json');
      expect(output).toContain('[DRY RUN] Would overwrite existing files');
      expect(output).toContain('[DRY RUN] Would watch for template changes');
    });

    it('should execute sync files without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync files --template=./templates --output=./docs`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Generating files from templates...');
      expect(output).toContain('File Generation Results:');
      expect(output).toContain('Template path: ./templates');
      expect(output).toContain('Output path: ./docs');
      expect(output).toContain('Templates found:');
    });

    it('should handle sync files with short aliases', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync files -t ./templates -c ./config.json -o ./output -p "*.template" -v vars.json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate files from templates');
      expect(output).toContain('[DRY RUN] Template path: ./templates');
      expect(output).toContain('[DRY RUN] Config file: ./config.json');
      expect(output).toContain('[DRY RUN] Output path: ./output');
      expect(output).toContain('[DRY RUN] Pattern: *.template');
      expect(output).toContain('[DRY RUN] Variables: vars.json');
    });
  });

  describe('Sync All', () => {
    it('should handle sync all with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync all --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive synchronization');
      expect(output).toContain('[DRY RUN] Source language: en');
      expect(output).toContain('[DRY RUN] Would include file generation');
      expect(output).toContain('[DRY RUN] Parallel execution: max 3 concurrent');
      expect(output).toContain('[DRY RUN] Would generate sync report');
    });

    it('should handle sync all with comprehensive settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync all --source-lang=en --target-langs=ko,ja,zh --include-migration --include-generation --parallel --max-concurrent=5 --continue-on-error --report --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive synchronization');
      expect(output).toContain('[DRY RUN] Source language: en');
      expect(output).toContain('[DRY RUN] Target languages: ko,ja,zh');
      expect(output).toContain('[DRY RUN] Would include content migration');
      expect(output).toContain('[DRY RUN] Would include file generation');
      expect(output).toContain('[DRY RUN] Parallel execution: max 5 concurrent');
      expect(output).toContain('[DRY RUN] Would continue on errors');
      expect(output).toContain('[DRY RUN] Would generate sync report');
    });

    it('should execute sync all without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync all --source-lang=en --target-langs=ko`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Starting comprehensive synchronization...');
      expect(output).toContain('Comprehensive Sync Results:');
      expect(output).toContain('Source language: en');
      expect(output).toContain('Target languages: ko');
      expect(output).toContain('Operations Summary:');
    });

    it('should handle sync all with minimal settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync all --target-langs=ko --include-migration --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive synchronization');
      expect(output).toContain('[DRY RUN] Target languages: ko');
      expect(output).toContain('[DRY RUN] Would include content migration');
    });
  });

  describe('Legacy Command Support', () => {
    it('should support legacy sync-docs with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync-docs --source=en --target=ko --check-only --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: sync docs');
      expect(output).toContain('[DRY RUN] Would sync documentation');
    });

    it('should support legacy migrate-to-simple with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} migrate-to-simple --input=./old --output=./new --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: sync simple');
      expect(output).toContain('[DRY RUN] Would migrate content to simplified format');
    });

    it('should support legacy generate-files with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} generate-files --template=./templates --output=./docs --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: sync files');
      expect(output).toContain('[DRY RUN] Would generate files from templates');
    });

    it('should support legacy sync-all with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync-all --source-lang=en --target-langs=ko --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: sync all');
      expect(output).toContain('[DRY RUN] Would perform comprehensive synchronization');
    });
  });

  describe('Argument Parsing', () => {
    it('should handle options parsing correctly for docs', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync docs --source=en --target=ko,ja,zh --check-only --force --backup --diff-format=context --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would sync documentation');
      expect(output).toContain('[DRY RUN] Source language: en');
      expect(output).toContain('[DRY RUN] Target languages: ko,ja,zh');
      expect(output).toContain('[DRY RUN] Check-only mode enabled');
      expect(output).toContain('[DRY RUN] Force mode enabled');
      expect(output).toContain('[DRY RUN] Would create backups');
      expect(output).toContain('[DRY RUN] Diff format: context');
    });

    it('should handle mixed positional and option arguments', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync simple --input=./source --output=./target --format=json --cleanup-source --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would migrate content to simplified format');
      expect(output).toContain('[DRY RUN] Input: ./source');
      expect(output).toContain('[DRY RUN] Output: ./target');
      expect(output).toContain('[DRY RUN] Format: json');
      expect(output).toContain('[DRY RUN] Would cleanup source files');
    });

    it('should handle boolean flags correctly', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync all --include-migration --continue-on-error --no-report --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive synchronization');
      expect(output).toContain('[DRY RUN] Would include content migration');
      expect(output).toContain('[DRY RUN] Would continue on errors');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing target languages gracefully', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} sync docs --source=en`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Target languages are required for documentation sync');
      }
    });

    it('should handle missing required paths gracefully', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} sync simple --output=./new`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Input path is required for migration');
      }
    });
  });
});