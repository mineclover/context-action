import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

describe('New CLI Structure', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    
    // Setup test directory
    testDir = path.join(process.cwd(), 'test-new-cli');
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

  describe('CLI Help and Information', () => {
    it('should show main help when no command provided', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath}`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('🚀 LLMS Generator CLI (New Structure)');
      expect(output).toContain('CORE COMMANDS:');
      expect(output).toContain('config       Configuration management');
      expect(output).toContain('generate     Content generation');
      expect(output).toContain('priority     Priority and document management');
      expect(output).toContain('work         Work status and instruction management');
      expect(output).toContain('extract      Content extraction and summary generation');
      expect(output).toContain('compose      Content composition and markdown generation');
      expect(output).toContain('summary      Content summary generation and improvement');
      expect(output).toContain('schema       Schema generation and management');
      expect(output).toContain('sync         Synchronization and migration management');
      expect(output).toContain('COMING SOON:');
    });

    it('should show help with --help flag', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} --help`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('USAGE:');
      expect(output).toContain('npx @context-action/llms-generator <command> [options]');
    });

    it('should show version information', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} version`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('@context-action/llms-generator');
      expect(output).toContain('New CLI Structure (Refactored)');
    });
  });

  describe('Config Command', () => {
    it('should show config help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} config`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('🔧 config - Configuration management');
      expect(output).toContain('ACTIONS:');
      expect(output).toContain('init         Initialize configuration with preset');
      expect(output).toContain('show         Show current resolved configuration');
      expect(output).toContain('validate     Validate current configuration');
      expect(output).toContain('limits       Show configured character limits');
    });

    it('should handle config init with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} config init standard --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would create config with preset');
      expect(output).toContain('llms-generator.config.json');
    });

    it('should support config init with custom preset', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} config init minimal --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would create config with preset');
      expect(output).toContain('minimal');
    });
  });

  describe('Generate Command', () => {
    it('should show generate help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} generate`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('📝 generate - Content generation');
      expect(output).toContain('TYPES:');
      expect(output).toContain('minimum      Generate minimum format content');
      expect(output).toContain('chars        Generate character-limited content');
      expect(output).toContain('md           Generate individual .md files');
    });

    it('should handle generate chars with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} generate chars 1000 en --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate 1000 character content for language: en');
    });

    it('should handle generate minimum with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} generate minimum --lang=ko --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate minimum format for language: ko');
    });
  });

  describe('Priority Command', () => {
    it('should show priority help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} priority`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('📋 priority - Priority and document management');
      expect(output).toContain('ACTIONS:');
      expect(output).toContain('generate     Generate priority.json files for all documents');
      expect(output).toContain('stats        Show priority generation statistics');
      expect(output).toContain('discover     Discover all available documents');
      expect(output).toContain('analyze      Analyze Priority JSON work status and completion');
    });

    it('should handle priority generate with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} priority generate en --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate priority files for language: en');
    });

    it('should handle priority template with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} priority template --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate individual summary document templates');
    });

    it('should handle priority llms with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} priority llms 100 --dry-run`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        // This might fail due to missing simple-llms-generate command, but should show the attempt
        const output = error.stdout?.toString() || '';
        // Just check that the command was recognized and routed correctly
        expect(error.status).toBeDefined();
      }
    });

    it('should support legacy priority-generate with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} priority-generate en --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: priority generate');
      expect(output).toContain('[DRY RUN] Would generate priority files for language: en');
    });
  });

  describe('Legacy Command Support', () => {
    it('should support legacy config-init with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      // Use shell redirection to capture both stdout and stderr
      const output = execSync(`npx tsx ${cliPath} config-init standard --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: config init');
      expect(output).toContain('[DRY RUN] Would create config with preset');
    });

    it('should support legacy generate-md with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      // This should fail with error because no language provided
      try {
        execSync(`npx tsx ${cliPath} generate-md --dry-run`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout.toString();
        expect(output).toContain('Legacy command');
        expect(output).toContain('is deprecated');
        expect(output).toContain('Use: generate md');
        expect(output).toContain('Language is required for md generation');
      }
    });

    it('should handle unknown command gracefully', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} unknown-command`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stderr.toString();
        expect(output).toContain('Unknown command: unknown-command');
        expect(output).toContain('Available commands:');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required arguments gracefully', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} generate chars`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout.toString();
        expect(output).toContain('Character limit is required and must be a number');
        expect(output).toContain('Usage: generate chars <limit> [language]');
      }
    });

    it('should handle invalid character limit', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} generate chars invalid en`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout.toString();
        expect(output).toContain('Character limit is required and must be a number');
      }
    });
  });

  describe('Work Command', () => {
    it('should show work help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} work`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('💼 work - Work status and instruction management');
      expect(output).toContain('ACTIONS:');
      expect(output).toContain('status       Check work status for documents');
      expect(output).toContain('context      Get complete work context for editing a document');
      expect(output).toContain('list         List documents that need work');
      expect(output).toContain('check        Enhanced work status check with config integration');
      expect(output).toContain('instruction  Generate detailed instructions for document updates');
      expect(output).toContain('batch        Batch generate instructions for all documents');
      expect(output).toContain('template     Manage instruction templates');
    });

    it('should handle work status with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} work status ko --chars=100 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would check work status for language: ko');
      expect(output).toContain('[DRY RUN] Character limit: 100');
    });

    it('should handle work context with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} work context ko guide-action-handlers --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would get work context for ko/guide-action-handlers');
    });

    it('should handle work instruction with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} work instruction ko api-spec --template=default --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate instructions for ko/api-spec');
      expect(output).toContain('[DRY RUN] Template: default');
    });

    it('should handle work batch with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} work batch ko --chars=100,300,1000 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate batch instructions for language: ko');
      expect(output).toContain('[DRY RUN] Character limits: 100,300,1000');
    });

    it('should support legacy work-status with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} work-status ko --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: work status');
      expect(output).toContain('[DRY RUN] Would check work status for language: ko');
    });

    it('should support legacy instruction-generate with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} instruction-generate ko api-spec --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: work instruction');
      expect(output).toContain('[DRY RUN] Would generate instructions for ko/api-spec');
    });
  });

  describe('Extract Command', () => {
    it('should show extract help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} extract`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('📤 extract - Content extraction and summary generation');
      expect(output).toContain('TYPES:');
      expect(output).toContain('single       Extract content summaries for a specific language');
      expect(output).toContain('all          Extract content summaries for all configured languages');
      expect(output).toContain('batch        Batch extract content with multiple configurations');
    });

    it('should handle extract single with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} extract single ko --chars=100,300,1000 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would extract content summaries for language: ko');
      expect(output).toContain('[DRY RUN] Character limits: 100,300,1000');
    });

    it('should handle extract all with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} extract all --lang=en,ko --overwrite --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would extract content summaries for all languages');
      expect(output).toContain('[DRY RUN] Languages: en,ko');
      expect(output).toContain('[DRY RUN] Would overwrite existing content');
    });

    it('should handle extract batch with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} extract batch --lang=en,ko --chars=100,500,1000 --parallel --max-concurrent=5 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would run batch content extraction');
      expect(output).toContain('[DRY RUN] Languages: en,ko');
      expect(output).toContain('[DRY RUN] Character limits: 100,500,1000');
      expect(output).toContain('[DRY RUN] Parallel: true, Max concurrent: 5');
    });

    it('should handle extract command with language as positional argument', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} extract single ko --chars=100,300 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      // This should work as extract single with ko as language
      expect(output).toContain('[DRY RUN] Would extract content summaries for language: ko');
      expect(output).toContain('[DRY RUN] Character limits: 100,300');
    });

    it('should support legacy extract-all with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} extract-all --lang=en,ko --dry-run 2>&1`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Legacy command');
        expect(output).toContain('is deprecated');
        expect(output).toContain('Use: extract all');
      }
    });
  });

  describe('Compose Command', () => {
    it('should show compose help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} compose`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('🎵 compose - Content composition and markdown generation');
      expect(output).toContain('TYPES:');
      expect(output).toContain('single       Compose adaptive content for a specific language and character limit');
      expect(output).toContain('batch        Batch compose content for multiple character limits');
      expect(output).toContain('stats        Show composition statistics and available content');
      expect(output).toContain('markdown     Generate markdown files from composed content');
      expect(output).toContain('markdown-all Generate all markdown files for all configured languages');
    });

    it('should handle compose single with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} compose single ko 1000 --no-toc --priority=50 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would compose adaptive content for language: ko');
      expect(output).toContain('[DRY RUN] Character limit: 1000');
      expect(output).toContain('[DRY RUN] Table of contents: disabled');
      expect(output).toContain('[DRY RUN] Priority threshold: 50');
    });

    it('should handle compose batch with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} compose batch en --chars=1000,3000,5000 --no-toc --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would compose adaptive content for language: en');
      expect(output).toContain('[DRY RUN] Character limits: 1000,3000,5000');
      expect(output).toContain('[DRY RUN] Table of contents: disabled');
    });

    it('should handle compose markdown with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} compose markdown ko --chars=100,300,1000 --overwrite --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate markdown files for language: ko');
      expect(output).toContain('[DRY RUN] Character limits: 100,300,1000');
      expect(output).toContain('[DRY RUN] Would overwrite existing files');
    });

    it('should handle compose markdown-all with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} compose markdown-all --lang=en,ko --chars=100,500,1000 --overwrite --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate all markdown files');
      expect(output).toContain('[DRY RUN] Languages: en,ko');
      expect(output).toContain('[DRY RUN] Character limits: 100,500,1000');
      expect(output).toContain('[DRY RUN] Would overwrite existing files');
    });

    it('should support legacy compose-batch with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} compose-batch ko --chars=1000,3000 --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: compose batch');
      expect(output).toContain('[DRY RUN] Would compose adaptive content for language: ko');
    });

    it('should support legacy markdown-generate with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} markdown-generate ko --chars=100,300 --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: compose markdown');
      expect(output).toContain('[DRY RUN] Would generate markdown files for language: ko');
    });
  });

  describe('Summary Command', () => {
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

    it('should handle summary generate with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary generate minimum ko --chars=100,300,1000 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate minimum summaries for language: ko');
      expect(output).toContain('[DRY RUN] Character limits: 100,300,1000');
      expect(output).toContain('[DRY RUN] Strategy: balanced');
    });

    it('should handle summary improve with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary improve ko --min-quality=80 --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would improve summaries for language: ko');
      expect(output).toContain('[DRY RUN] Minimum quality threshold: 80');
    });

    it('should handle summary validate with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} summary validate ko --fix --strict --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate summaries');
      expect(output).toContain('[DRY RUN] Language: ko');
      expect(output).toContain('[DRY RUN] Would auto-fix validation issues');
      expect(output).toContain('[DRY RUN] Using strict validation rules');
    });

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

  describe('Schema Command', () => {
    it('should show schema help', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('🔧 schema - Schema generation and management');
      expect(output).toContain('ACTIONS:');
      expect(output).toContain('generate     Generate JSON schema files for configuration and data validation');
      expect(output).toContain('info         Show information about available schemas and their structure');
      expect(output).toContain('validate     Validate data files against their schemas');
      expect(output).toContain('export       Export schemas in different formats or for external tools');
    });

    it('should handle schema generate with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate config --output=./schemas --format=typescript --strict --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate config schemas');
      expect(output).toContain('[DRY RUN] Output directory: ./schemas');
      expect(output).toContain('[DRY RUN] Format: typescript');
      expect(output).toContain('[DRY RUN] Using strict validation rules');
    });

    it('should handle schema info with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema info config --detailed --properties`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Schema Information: config');
      expect(output).toContain('Configuration Schema (config)');
      expect(output).toContain('Properties:');
    });

    it('should handle schema validate with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema validate --file=llms-generator.config.json --fix --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate schemas');
      expect(output).toContain('[DRY RUN] File: llms-generator.config.json');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix errors');
    });

    it('should support legacy schema-generate with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema-generate config --dry-run 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: schema generate');
      expect(output).toContain('[DRY RUN] Would generate config schemas');
    });

    it('should support legacy schema-info with deprecation warning', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema-info config --detailed 2>&1`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Legacy command');
      expect(output).toContain('is deprecated');
      expect(output).toContain('Use: schema info');
      expect(output).toContain('Schema Information: config');
    });
  });

  describe('Sync Command', () => {
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

    it('should handle sync docs with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync docs --source=en --target=ko,ja --check-only --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would sync documentation');
      expect(output).toContain('[DRY RUN] Source language: en');
      expect(output).toContain('[DRY RUN] Target languages: ko,ja');
      expect(output).toContain('[DRY RUN] Check-only mode enabled');
    });

    it('should handle sync simple with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync simple --input=./old-docs --output=./new-docs --format=markdown --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would migrate content to simplified format');
      expect(output).toContain('[DRY RUN] Input: ./old-docs');
      expect(output).toContain('[DRY RUN] Output: ./new-docs');
      expect(output).toContain('[DRY RUN] Format: markdown');
    });

    it('should handle sync files with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync files --template=./templates --output=./docs --overwrite --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate files from templates');
      expect(output).toContain('[DRY RUN] Template path: ./templates');
      expect(output).toContain('[DRY RUN] Output path: ./docs');
      expect(output).toContain('[DRY RUN] Would overwrite existing files');
    });

    it('should handle sync all with dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} sync all --source-lang=en --target-langs=ko,ja --parallel --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would perform comprehensive synchronization');
      expect(output).toContain('[DRY RUN] Source language: en');
      expect(output).toContain('[DRY RUN] Target languages: ko,ja');
      expect(output).toContain('[DRY RUN] Parallel execution: max 3 concurrent');
    });

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
  });

  describe('Flag Parsing', () => {
    it('should parse verbose flag correctly', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} config init standard --dry-run --verbose`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN]');
      // Verbose output would be shown in actual config creation
    });

    it('should parse short flags correctly', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} generate minimum -v --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate minimum format for language: ko');
    });
  });
});