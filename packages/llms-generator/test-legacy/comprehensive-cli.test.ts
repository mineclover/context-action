/**
 * Comprehensive CLI Integration Tests
 * Tests all major CLI commands and their combinations based on the help specification
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

const CLI_PATH = path.resolve(__dirname, '../../src/cli/index.ts');
const TEST_DIR = path.join(__dirname, 'test-workspace-comprehensive');
const CONFIG_FILE = path.join(TEST_DIR, 'llms-generator.config.json');

describe('🚀 Comprehensive CLI Integration Tests', () => {
  beforeEach(() => {
    // Clean setup for each test
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    
    // Copy required schema files from package data directory
    const sourceDataDir = path.resolve(__dirname, '../../data');
    const targetDataDir = path.join(TEST_DIR, 'data');
    mkdirSync(targetDataDir, { recursive: true });
    
    if (existsSync(sourceDataDir)) {
      const schemaFiles = [
        'priority-schema-enhanced.json',
        'priority-schema-simple.json', 
        'config-schema.json',
        'markdown-frontmatter-schema.json'
      ];
      
      schemaFiles.forEach(file => {
        const sourcePath = path.join(sourceDataDir, file);
        const targetPath = path.join(targetDataDir, file);
        if (existsSync(sourcePath)) {
          const content = readFileSync(sourcePath, 'utf-8');
          writeFileSync(targetPath, content);
        }
      });
    }
  });

  afterEach(() => {
    process.chdir(path.resolve(__dirname, '../..'));
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('📋 Configuration Management Commands', () => {
    describe('config-init', () => {
      test('should initialize standard preset configuration', () => {
        const result = execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
        
        expect(result).toContain('Configuration initialized');
        expect(existsSync(CONFIG_FILE)).toBe(true);
        
        const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
        expect(config.characterLimits).toContain(300);
        expect(config.characterLimits).toContain(1000);
        expect(config.languages).toContain('en');
      });

      test('should initialize minimal preset configuration', () => {
        const result = execSync(`npx tsx ${CLI_PATH} config-init minimal`, { encoding: 'utf-8' });
        
        expect(result).toContain('Configuration initialized');
        expect(existsSync(CONFIG_FILE)).toBe(true);
        
        const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
        expect(config.characterLimits.length).toBeLessThanOrEqual(3);
      });

      test('should initialize extended preset configuration', () => {
        const result = execSync(`npx tsx ${CLI_PATH} config-init extended`, { encoding: 'utf-8' });
        
        expect(result).toContain('Configuration initialized');
        expect(existsSync(CONFIG_FILE)).toBe(true);
        
        const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
        expect(config.characterLimits.length).toBeGreaterThanOrEqual(5);
      });

      test('should support custom config path', () => {
        const customPath = path.join(TEST_DIR, 'custom-config.json');
        const result = execSync(`npx tsx ${CLI_PATH} config-init standard --path=${customPath}`, { encoding: 'utf-8' });
        
        expect(result).toContain('Configuration initialized');
        expect(existsSync(customPath)).toBe(true);
      });
    });

    describe('config-show', () => {
      beforeEach(() => {
        execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      });

      test('should display current configuration', () => {
        const result = execSync(`npx tsx ${CLI_PATH} config-show`, { encoding: 'utf-8' });
        
        expect(result).toContain('Current Configuration');
        expect(result).toContain('characterLimits');
        expect(result).toContain('languages');
      });
    });

    describe('config-validate', () => {
      test('should validate valid configuration', () => {
        execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
        const result = execSync(`npx tsx ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
        
        expect(result).toContain('Configuration is valid');
      });

      test('should detect invalid configuration', () => {
        const invalidConfig = { invalid: 'config' };
        writeFileSync(CONFIG_FILE, JSON.stringify(invalidConfig, null, 2));
        
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
        }).toThrow();
      });
    });

    describe('config-limits', () => {
      beforeEach(() => {
        execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      });

      test('should show configured character limits', () => {
        const result = execSync(`npx tsx ${CLI_PATH} config-limits`, { encoding: 'utf-8' });
        
        expect(result).toContain('Character Limits');
        expect(result).toMatch(/\d+/); // Should contain numbers
      });

      test('should show all limits with --all flag', () => {
        const result = execSync(`npx tsx ${CLI_PATH} config-limits --all`, { encoding: 'utf-8' });
        
        expect(result).toContain('Character Limits');
        expect(result).toMatch(/\d+/);
      });
    });
  });

  describe('📝 Content Generation Commands', () => {
    beforeEach(() => {
      execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      
      // Create sample documents
      const docsDir = path.join(TEST_DIR, 'docs', 'en', 'guide');
      mkdirSync(docsDir, { recursive: true });
      
      writeFileSync(path.join(docsDir, 'sample-guide.md'), 
        '# Sample Guide\n\nThis is a sample guide for testing.\n\n## Features\n\n- Feature 1\n- Feature 2\n');
    });

    describe('minimum', () => {
      test('should generate minimum format content', () => {
        const result = execSync(`npx tsx ${CLI_PATH} minimum`, { encoding: 'utf-8' });
        
        expect(result).toContain('Generated minimum format');
      });
    });

    describe('origin', () => {
      test('should generate origin format content', () => {
        const result = execSync(`npx tsx ${CLI_PATH} origin`, { encoding: 'utf-8' });
        
        expect(result).toContain('Generated origin format');
      });
    });

    describe('chars', () => {
      test('should generate character-limited content', () => {
        const result = execSync(`npx tsx ${CLI_PATH} chars 300 en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Generated 300 character');
      });

      test('should handle different character limits', () => {
        const limits = [100, 500, 1000];
        
        for (const limit of limits) {
          const result = execSync(`npx tsx ${CLI_PATH} chars ${limit} en`, { encoding: 'utf-8' });
          expect(result).toContain(`Generated ${limit} character`);
        }
      });
    });

    describe('batch', () => {
      test('should generate all formats using config defaults', () => {
        const result = execSync(`npx tsx ${CLI_PATH} batch`, { encoding: 'utf-8' });
        
        expect(result).toContain('Batch generation completed');
      });

      test('should support language override', () => {
        const result = execSync(`npx tsx ${CLI_PATH} batch --lang=en,ko`, { encoding: 'utf-8' });
        
        expect(result).toContain('Batch generation completed');
      });

      test('should support character limit override', () => {
        const result = execSync(`npx tsx ${CLI_PATH} batch --chars=300,1000,2000`, { encoding: 'utf-8' });
        
        expect(result).toContain('Batch generation completed');
      });
    });
  });

  describe('🎯 Priority Management Commands', () => {
    beforeEach(() => {
      execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      
      // Create sample documents for priority testing
      const docsDir = path.join(TEST_DIR, 'docs', 'en');
      mkdirSync(docsDir, { recursive: true });
      
      const guides = ['guide-1.md', 'guide-2.md', 'api-reference.md'];
      guides.forEach(guide => {
        writeFileSync(path.join(docsDir, guide), 
          `# ${guide.replace('.md', '').replace('-', ' ')}\n\nSample content for ${guide}.\n\n## Overview\n\nThis is a test document.\n`);
      });
    });

    describe('priority-generate', () => {
      test('should generate priority.json files', () => {
        const result = execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Priority files generated');
      });

      test('should support dry-run mode', () => {
        const result = execSync(`npx tsx ${CLI_PATH} priority-generate en --dry-run`, { encoding: 'utf-8' });
        
        expect(result).toContain('Dry run');
        expect(result).toContain('would generate');
      });

      test('should support overwrite mode', () => {
        // First generate
        execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
        
        // Then overwrite
        const result = execSync(`npx tsx ${CLI_PATH} priority-generate en --overwrite`, { encoding: 'utf-8' });
        
        expect(result).toContain('Priority files generated');
      });
    });

    describe('template-generate', () => {
      test('should generate individual summary document templates', () => {
        execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
        const result = execSync(`npx tsx ${CLI_PATH} template-generate`, { encoding: 'utf-8' });
        
        expect(result).toContain('Templates generated');
      });
    });

    describe('priority-stats', () => {
      test('should show priority generation statistics', () => {
        execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
        const result = execSync(`npx tsx ${CLI_PATH} priority-stats en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Priority Statistics');
        expect(result).toMatch(/\d+/); // Should contain numbers
      });
    });

    describe('discover', () => {
      test('should discover all available documents', () => {
        const result = execSync(`npx tsx ${CLI_PATH} discover en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Discovered documents');
        expect(result).toMatch(/guide-1\.md|guide-2\.md|api-reference\.md/);
      });
    });

    describe('analyze-priority', () => {
      test('should analyze priority JSON work status', () => {
        execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
        const result = execSync(`npx tsx ${CLI_PATH} analyze-priority`, { encoding: 'utf-8' });
        
        expect(result).toContain('Priority Analysis');
      });

      test('should support format and output options', () => {
        execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
        const result = execSync(`npx tsx ${CLI_PATH} analyze-priority --format summary --detailed`, { encoding: 'utf-8' });
        
        expect(result).toContain('Priority Analysis');
      });
    });
  });

  describe('📄 Simple LLMS Generation Commands', () => {
    beforeEach(() => {
      execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      
      // Create individual .md files
      const outputDir = path.join(TEST_DIR, 'docs', 'en', 'llms');
      mkdirSync(outputDir, { recursive: true });
      
      const files = [
        'llms-100chars-en.txt',
        'llms-300chars-en.txt', 
        'llms-1000chars-en.txt'
      ];
      
      files.forEach(file => {
        const content = `# Sample LLMS Content\n\nThis is sample content for ${file}.\n\nGenerated for testing purposes.`;
        writeFileSync(path.join(outputDir, file), content);
      });
    });

    describe('simple-llms-generate', () => {
      test('should generate simple LLMS by combining individual files', () => {
        const result = execSync(`npx tsx ${CLI_PATH} simple-llms-generate 300`, { encoding: 'utf-8' });
        
        expect(result).toContain('Simple LLMS generated');
      });

      test('should support language specification', () => {
        const result = execSync(`npx tsx ${CLI_PATH} simple-llms-generate 300 --language en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Simple LLMS generated');
      });

      test('should support custom output directory', () => {
        const outputDir = path.join(TEST_DIR, 'custom-output');
        const result = execSync(`npx tsx ${CLI_PATH} simple-llms-generate 300 --output-dir ${outputDir}`, { encoding: 'utf-8' });
        
        expect(result).toContain('Simple LLMS generated');
      });

      test('should support sorting options', () => {
        const result = execSync(`npx tsx ${CLI_PATH} simple-llms-generate 300 --sort-by name`, { encoding: 'utf-8' });
        
        expect(result).toContain('Simple LLMS generated');
      });
    });

    describe('simple-llms-batch', () => {
      test('should generate multiple character limits in batch', () => {
        const result = execSync(`npx tsx ${CLI_PATH} simple-llms-batch --character-limits 300,1000`, { encoding: 'utf-8' });
        
        expect(result).toContain('Batch simple LLMS generation completed');
      });

      test('should support dry-run mode', () => {
        const result = execSync(`npx tsx ${CLI_PATH} simple-llms-batch --dry-run`, { encoding: 'utf-8' });
        
        expect(result).toContain('Dry run');
      });
    });

    describe('simple-llms-stats', () => {
      test('should show simple LLMS statistics', () => {
        const result = execSync(`npx tsx ${CLI_PATH} simple-llms-stats --language en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Simple LLMS Statistics');
      });

      test('should support character limit filtering', () => {
        const result = execSync(`npx tsx ${CLI_PATH} simple-llms-stats --character-limit 300`, { encoding: 'utf-8' });
        
        expect(result).toContain('Simple LLMS Statistics');
      });
    });
  });

  describe('🔧 Schema Management Commands', () => {
    beforeEach(() => {
      execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
    });

    describe('schema-generate', () => {
      test('should generate TypeScript types and validators', () => {
        const outputDir = path.join(TEST_DIR, 'generated-schemas');
        mkdirSync(outputDir, { recursive: true });
        
        const result = execSync(`npx tsx ${CLI_PATH} schema-generate ${outputDir}`, { encoding: 'utf-8' });
        
        expect(result).toContain('Schema generated');
      });

      test('should support no-types flag', () => {
        const outputDir = path.join(TEST_DIR, 'generated-schemas-no-types');
        mkdirSync(outputDir, { recursive: true });
        
        const result = execSync(`npx tsx ${CLI_PATH} schema-generate ${outputDir} --no-types`, { encoding: 'utf-8' });
        
        expect(result).toContain('Schema generated');
      });

      test('should support JavaScript output', () => {
        const outputDir = path.join(TEST_DIR, 'generated-schemas-js');
        mkdirSync(outputDir, { recursive: true });
        
        const result = execSync(`npx tsx ${CLI_PATH} schema-generate ${outputDir} --javascript`, { encoding: 'utf-8' });
        
        expect(result).toContain('Schema generated');
      });
    });

    describe('schema-info', () => {
      test('should show schema file information', () => {
        const result = execSync(`npx tsx ${CLI_PATH} schema-info`, { encoding: 'utf-8' });
        
        expect(result).toContain('Schema Information');
      });
    });
  });

  describe('📂 Content Extraction Commands', () => {
    beforeEach(() => {
      execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      
      // Create sample documents for extraction
      const docsDir = path.join(TEST_DIR, 'docs', 'en', 'guide');
      mkdirSync(docsDir, { recursive: true });
      
      writeFileSync(path.join(docsDir, 'test-guide.md'), 
        '# Test Guide\n\nThis is a comprehensive test guide with enough content to extract meaningful summaries.\n\n## Section 1\n\nDetailed content here.\n\n## Section 2\n\nMore detailed content for extraction testing.\n');
    });

    describe('extract', () => {
      test('should extract character-limited summaries', () => {
        const result = execSync(`npx tsx ${CLI_PATH} extract en --chars=100,300,1000`, { encoding: 'utf-8' });
        
        expect(result).toContain('Extraction completed');
      });

      test('should support dry-run mode', () => {
        const result = execSync(`npx tsx ${CLI_PATH} extract en --dry-run`, { encoding: 'utf-8' });
        
        expect(result).toContain('Dry run');
      });

      test('should support overwrite mode', () => {
        const result = execSync(`npx tsx ${CLI_PATH} extract en --overwrite`, { encoding: 'utf-8' });
        
        expect(result).toContain('Extraction completed');
      });
    });

    describe('extract-all', () => {
      test('should extract content for all languages', () => {
        const result = execSync(`npx tsx ${CLI_PATH} extract-all --lang=en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Extraction completed');
      });

      test('should support dry-run mode', () => {
        const result = execSync(`npx tsx ${CLI_PATH} extract-all --dry-run`, { encoding: 'utf-8' });
        
        expect(result).toContain('Dry run');
      });
    });
  });

  describe('📊 Work Status Management Commands', () => {
    beforeEach(() => {
      execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
    });

    describe('work-status', () => {
      test('should check work status for documents', () => {
        const result = execSync(`npx tsx ${CLI_PATH} work-status en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Work Status');
      });

      test('should check work status for specific document', () => {
        const result = execSync(`npx tsx ${CLI_PATH} work-status en guide-test --chars=100`, { encoding: 'utf-8' });
        
        expect(result).toContain('Work Status');
      });
    });

    describe('work-list', () => {
      test('should list documents that need work', () => {
        const result = execSync(`npx tsx ${CLI_PATH} work-list en --chars=100`, { encoding: 'utf-8' });
        
        expect(result).toContain('Work List');
      });

      test('should support filtering options', () => {
        const result = execSync(`npx tsx ${CLI_PATH} work-list en --missing --need-update`, { encoding: 'utf-8' });
        
        expect(result).toContain('Work List');
      });
    });

    describe('work-check', () => {
      test('should perform enhanced work status check', () => {
        const result = execSync(`npx tsx ${CLI_PATH} work-check en --show-all`, { encoding: 'utf-8' });
        
        expect(result).toContain('Work Check');
      });
    });
  });

  describe('🚀 Error Handling and Edge Cases', () => {
    test('should handle unknown commands gracefully', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} unknown-command`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should display help when requested', () => {
      const result = execSync(`npx tsx ${CLI_PATH} help`, { encoding: 'utf-8' });
      
      expect(result).toContain('LLMS Generator CLI');
      expect(result).toContain('USAGE:');
      expect(result).toContain('EXAMPLES:');
    });

    test('should handle missing required parameters', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} chars`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should handle invalid character limits', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} chars invalid-limit en`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should handle missing configuration file', () => {
      // Remove config file if it exists
      if (existsSync(CONFIG_FILE)) {
        rmSync(CONFIG_FILE);
      }
      
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      }).toThrow();
    });
  });

  describe('⚡ Performance and Robustness', () => {
    beforeEach(() => {
      execSync(`npx tsx ${CLI_PATH} config-init extended`, { encoding: 'utf-8' });
    });

    test('should handle multiple simultaneous operations', async () => {
      const operations = [
        'config-show',
        'config-limits',
        'schema-info'
      ];
      
      const promises = operations.map(op => 
        execSync(`npx tsx ${CLI_PATH} ${op}`, { encoding: 'utf-8' })
      );
      
      expect(() => {
        Promise.all(promises);
      }).not.toThrow();
    });

    test('should handle large character limits efficiently', () => {
      const result = execSync(`npx tsx ${CLI_PATH} chars 10000 en`, { encoding: 'utf-8' });
      
      expect(result).toContain('Generated 10000 character');
    });

    test('should maintain consistency across repeated operations', () => {
      const results = [];
      for (let i = 0; i < 3; i++) {
        const result = execSync(`npx tsx ${CLI_PATH} config-show`, { encoding: 'utf-8' });
        results.push(result);
      }
      
      // All results should be identical
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });
  });
});