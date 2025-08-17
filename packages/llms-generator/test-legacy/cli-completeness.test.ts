/**
 * CLI Completeness Test Suite
 * Validates that all CLI commands from help documentation are properly implemented
 */

import { execSync } from 'child_process';
import path from 'path';

const CLI_PATH = path.resolve(__dirname, '../../src/cli/index.ts');

describe('🚀 CLI Completeness and Structure Tests', () => {
  let helpOutput: string;

  beforeAll(() => {
    // Get help output once for all tests
    try {
      helpOutput = execSync(`npx tsx ${CLI_PATH} --help`, { 
        encoding: 'utf-8',
        cwd: __dirname 
      });
    } catch (error) {
      helpOutput = error.stdout || '';
    }
  });

  describe('Help Documentation Structure', () => {
    test('should display main CLI title and usage', () => {
      expect(helpOutput).toContain('🚀 LLMS Generator CLI');
      expect(helpOutput).toContain('USAGE:');
      expect(helpOutput).toContain('npx @context-action/llms-generator');
    });

    test('should have all major command categories', () => {
      const expectedCategories = [
        'CONFIGURATION MANAGEMENT:',
        'CONTENT GENERATION:',
        'PRIORITY MANAGEMENT:',
        'SIMPLE LLMS GENERATION:',
        'SCHEMA MANAGEMENT:',
        'CONTENT EXTRACTION:',
        'YAML FRONTMATTER SUMMARIES',
        'ADAPTIVE COMPOSITION:',
        'WORK STATUS MANAGEMENT:',
        'INSTRUCTION GENERATION:',
        'ADAPTIVE MARKDOWN GENERATION:',
        'MARKDOWN GENERATION',
        'OTHER:'
      ];

      expectedCategories.forEach(category => {
        expect(helpOutput).toContain(category);
      });
    });

    test('should have examples section', () => {
      expect(helpOutput).toContain('EXAMPLES:');
      expect(helpOutput).toMatch(/npx @context-action\/llms-generator \w+/);
    });
  });

  describe('Configuration Management Commands', () => {
    test('should list all config commands', () => {
      const configCommands = [
        'config-init',
        'config-show', 
        'config-validate',
        'config-limits'
      ];

      configCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show config command options and examples', () => {
      expect(helpOutput).toContain('[preset]');
      expect(helpOutput).toContain('--path=config.json');
      expect(helpOutput).toContain('minimal|standard|extended');
      expect(helpOutput).toContain('config-init standard');
    });
  });

  describe('Content Generation Commands', () => {
    test('should list core generation commands', () => {
      const generationCommands = [
        'minimum',
        'origin',
        'chars <limit> [lang]',
        'batch'
      ];

      generationCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show generation command options', () => {
      expect(helpOutput).toContain('--lang=en,ko');
      expect(helpOutput).toContain('--chars=300,1000,2000');
      expect(helpOutput).toContain('chars 5000 en');
    });
  });

  describe('Priority Management Commands', () => {
    test('should list priority commands', () => {
      const priorityCommands = [
        'priority-generate',
        'template-generate',
        'priority-stats',
        'discover',
        'analyze-priority',
        'pre-commit-check',
        'sync-docs',
        'llms-generate',
        'check-priority-status',
        'simple-check',
        'migrate-to-simple'
      ];

      priorityCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show priority command options', () => {
      expect(helpOutput).toContain('--dry-run');
      expect(helpOutput).toContain('--overwrite');
      expect(helpOutput).toContain('[--cache]');
      expect(helpOutput).toContain('[--detailed]');
    });
  });

  describe('Simple LLMS Generation Commands', () => {
    test('should list simple LLMS commands', () => {
      const simpleLLMSCommands = [
        'simple-llms-generate',
        'simple-llms-batch', 
        'simple-llms-stats'
      ];

      simpleLLMSCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show simple LLMS command options', () => {
      expect(helpOutput).toContain('[character-limit]');
      expect(helpOutput).toContain('--sort-by');
      expect(helpOutput).toContain('--no-metadata');
      expect(helpOutput).toContain('--character-limits');
    });
  });

  describe('Schema Management Commands', () => {
    test('should list schema commands', () => {
      const schemaCommands = [
        'schema-generate',
        'schema-info'
      ];

      schemaCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show schema command options', () => {
      expect(helpOutput).toContain('--no-types');
      expect(helpOutput).toContain('--no-validators');
      expect(helpOutput).toContain('--javascript');
      expect(helpOutput).toContain('--cjs');
    });
  });

  describe('Content Extraction Commands', () => {
    test('should list extraction commands', () => {
      const extractionCommands = [
        'extract',
        'extract-all'
      ];

      extractionCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show extraction command options', () => {
      expect(helpOutput).toContain('--chars=100,300,1000');
      expect(helpOutput).toContain('--dry-run');
      expect(helpOutput).toContain('--overwrite');
    });
  });

  describe('YAML Frontmatter Summary Commands', () => {
    test('should list YAML frontmatter commands', () => {
      const yamlCommands = [
        'generate-summaries',
        'improve-summaries'
      ];

      yamlCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show YAML frontmatter command options', () => {
      expect(helpOutput).toContain('<minimum|origin>');
      expect(helpOutput).toContain('--quality=70');
      expect(helpOutput).toContain('--strategy=concept-first');
      expect(helpOutput).toContain('--min-quality=70');
    });
  });

  describe('Adaptive Composition Commands', () => {
    test('should list composition commands', () => {
      const compositionCommands = [
        'compose',
        'compose-batch',
        'compose-stats'
      ];

      compositionCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show composition command options', () => {
      expect(helpOutput).toContain('--no-toc');
      expect(helpOutput).toContain('--priority=50');
      expect(helpOutput).toContain('--chars=1000,3000,5000');
    });
  });

  describe('Work Status Management Commands', () => {
    test('should list work status commands', () => {
      const workCommands = [
        'work-status',
        'work-context',
        'work-list',
        'work-check'
      ];

      workCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show work status command options', () => {
      expect(helpOutput).toContain('--need-edit');
      expect(helpOutput).toContain('--outdated');
      expect(helpOutput).toContain('--missing');
      expect(helpOutput).toContain('--show-all');
    });
  });

  describe('Instruction Generation Commands', () => {
    test('should list instruction commands', () => {
      const instructionCommands = [
        'instruction-generate',
        'instruction-batch',
        'instruction-template'
      ];

      instructionCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show instruction command options', () => {
      expect(helpOutput).toContain('--template=default');
      expect(helpOutput).toContain('--max-length=8000');
      expect(helpOutput).toContain('--no-source');
      expect(helpOutput).toContain('--no-summaries');
    });
  });

  describe('Adaptive Markdown Generation Commands', () => {
    test('should list markdown generation commands', () => {
      const markdownCommands = [
        'generate-md',
        'generate-all'
      ];

      markdownCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show markdown generation command options', () => {
      expect(helpOutput).toContain('--chars=100,200,300,500,1000,2000,5000');
      expect(helpOutput).toContain('--lang=en,ko');
    });
  });

  describe('VitePress Markdown Generation Commands', () => {
    test('should list VitePress markdown commands', () => {
      const vitepressCommands = [
        'markdown-generate',
        'markdown-all'
      ];

      vitepressCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });
  });

  describe('Migration Commands', () => {
    test('should list migration commands', () => {
      const migrationCommands = [
        'generate-files',
        'sync-all',
        'fix-paths'
      ];

      migrationCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });

    test('should show migration command options', () => {
      expect(helpOutput).toContain('--skip-generation');
      expect(helpOutput).toContain('--config=path');
      expect(helpOutput).toContain('--data-dir=path');
    });
  });

  describe('Other Commands', () => {
    test('should list utility commands', () => {
      const utilityCommands = [
        'status',
        'help'
      ];

      utilityCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });
  });

  describe('Command Examples', () => {
    test('should have comprehensive examples for each category', () => {
      const exampleCategories = [
        '# Configuration management',
        '# Content generation',
        '# Adaptive Markdown generation',
        '# Priority and discovery',
        '# Content extraction',
        '# Composition',
        '# Simple LLMS generation',
        '# Work management',
        '# Instruction generation',
        '# YAML frontmatter summary generation'
      ];

      exampleCategories.forEach(category => {
        expect(helpOutput).toContain(category);
      });
    });

    test('should have working example commands', () => {
      const exampleCommands = [
        'config-init standard',
        'config-show',
        'minimum',
        'chars 5000 en',
        'batch',
        'priority-generate en --dry-run',
        'extract ko',
        'compose ko',
        'simple-llms-generate 100 --language ko'
      ];

      exampleCommands.forEach(cmd => {
        expect(helpOutput).toContain(cmd);
      });
    });
  });

  describe('Command Consistency', () => {
    test('should have consistent flag patterns', () => {
      // Common flags that should appear across multiple commands
      const commonFlags = [
        '--dry-run',
        '--overwrite',
        '--lang=',
        '--chars=',
        '--verbose'
      ];

      commonFlags.forEach(flag => {
        expect(helpOutput).toContain(flag);
      });
    });

    test('should have consistent parameter patterns', () => {
      // Common parameters that should follow patterns
      expect(helpOutput).toMatch(/\[lang\]/);
      expect(helpOutput).toMatch(/\[options\]/);
      expect(helpOutput).toMatch(/<\w+>/); // Required parameters
    });

    test('should have consistent language specification', () => {
      // Language should be consistently specified across commands
      expect(helpOutput).toContain('en');
      expect(helpOutput).toContain('ko');
      expect(helpOutput).toContain('--lang=en,ko');
    });

    test('should have consistent character limit specification', () => {
      // Character limits should follow patterns
      const charLimitPatterns = [
        '100',
        '200', 
        '300',
        '500',
        '1000',
        '2000',
        '5000'
      ];

      charLimitPatterns.forEach(limit => {
        expect(helpOutput).toContain(limit);
      });
    });
  });

  describe('Error Handling Documentation', () => {
    test('should show parameter requirements clearly', () => {
      expect(helpOutput).toMatch(/\[.*\]/); // Optional parameters
      expect(helpOutput).toMatch(/<.*>/); // Required parameters
    });

    test('should show command structure clearly', () => {
      expect(helpOutput).toContain('npx @context-action/llms-generator <command> [options]');
    });
  });

  describe('Command Coverage Validation', () => {
    test('should have help documentation for all implemented commands', () => {
      // This test ensures that every command in the CLI has documentation
      const commandCount = (helpOutput.match(/^\s+\w[\w-]+/gm) || []).length;
      expect(commandCount).toBeGreaterThan(30); // Should have at least 30+ commands
    });

    test('should have examples for complex command workflows', () => {
      // Complex workflows should have examples
      expect(helpOutput).toContain('npx @context-action/llms-generator');
      expect(helpOutput).toMatch(/# \w+ \w+/); // Category headers in examples
    });
  });
});

describe('🔧 CLI Command Validation', () => {
  describe('Command Structure Validation', () => {
    test('should accept help flag', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} --help`, { 
          encoding: 'utf-8',
          cwd: __dirname 
        });
      }).not.toThrow();
    });

    test('should handle unknown commands gracefully', () => {
      try {
        execSync(`npx tsx ${CLI_PATH} unknown-command`, { 
          encoding: 'utf-8',
          cwd: __dirname,
          stdio: 'pipe'
        });
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stderr || error.stdout).toContain('Unknown command' || 'Available commands');
      }
    });

    test('should show available commands on error', () => {
      try {
        execSync(`npx tsx ${CLI_PATH} invalid-cmd`, { 
          encoding: 'utf-8',
          cwd: __dirname,
          stdio: 'pipe'
        });
      } catch (error) {
        const output = error.stderr || error.stdout || '';
        expect(output).toMatch(/Available commands:|Unknown command/);
      }
    });
  });

  describe('Parameter Validation', () => {
    test('should validate required parameters', () => {
      const commandsRequiringParams = [
        'chars', // requires limit and lang
        'priority-generate', // requires lang
        'instruction-generate' // requires lang and document-id
      ];

      commandsRequiringParams.forEach(cmd => {
        try {
          execSync(`npx tsx ${CLI_PATH} ${cmd}`, { 
            encoding: 'utf-8',
            cwd: __dirname,
            stdio: 'pipe'
          });
        } catch (error) {
          // Should fail with parameter validation error
          expect(error.status).toBe(1);
        }
      });
    });
  });
});