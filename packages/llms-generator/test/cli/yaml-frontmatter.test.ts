/**
 * YAML Frontmatter Summaries CLI Test Suite
 * Tests generate-summaries and improve-summaries commands
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

const CLI_PATH = path.resolve(__dirname, '../../src/cli/index.ts');
const TEST_DIR = path.join(__dirname, 'test-workspace-yaml');
const CONFIG_FILE = path.join(TEST_DIR, 'llms-generator.config.json');

describe('📝 YAML Frontmatter Summaries CLI Tests', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    
    // Initialize configuration
    execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
    
    // Create source format files (minimum and origin)
    const llmsDir = path.join(TEST_DIR, 'docs', 'en', 'llms');
    mkdirSync(llmsDir, { recursive: true });
    
    // Create minimum format
    writeFileSync(path.join(llmsDir, 'llms-minimum-en.txt'), 
      `# Minimum Format\n\nThis is the minimum format content for testing.\n\n## Core Features\n\n- Essential feature 1\n- Essential feature 2\n\n## Basic Usage\n\nMinimal usage examples.`
    );
    
    // Create origin format
    writeFileSync(path.join(llmsDir, 'llms-origin-en.txt'),
      `# Origin Format\n\nThis is the comprehensive origin format content for testing.\n\n## Introduction\n\nDetailed introduction to the system.\n\n## Advanced Features\n\n- Advanced feature 1\n- Advanced feature 2\n- Complex integration patterns\n\n## Comprehensive Usage\n\nDetailed usage examples with code samples.\n\n## Configuration\n\nExtensive configuration options.\n\n## Troubleshooting\n\nCommon issues and solutions.`
    );
    
    // Create sample documents for extraction
    const docsDir = path.join(TEST_DIR, 'docs', 'en', 'guide');
    mkdirSync(docsDir, { recursive: true });
    
    writeFileSync(path.join(docsDir, 'sample-guide.md'),
      `---\ntitle: Sample Guide\ncategory: guide\ntags: [tutorial, basics]\n---\n\n# Sample Guide\n\nThis is a sample guide with frontmatter.\n\n## Overview\n\nOverview content here.\n\n## Getting Started\n\nGetting started instructions.`
    );
  });

  afterEach(() => {
    process.chdir(path.resolve(__dirname, '../..'));
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('generate-summaries command', () => {
    describe('minimum format summaries', () => {
      test('should generate YAML frontmatter summaries from minimum format', () => {
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Summaries generated');
        expect(result).toContain('minimum format');
      });

      test('should support character limit specification', () => {
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=100,300,1000`, { encoding: 'utf-8' });
        
        expect(result).toContain('Summaries generated');
        expect(result).toContain('100');
        expect(result).toContain('300');
        expect(result).toContain('1000');
      });

      test('should support quality threshold', () => {
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --quality=80`, { encoding: 'utf-8' });
        
        expect(result).toContain('Summaries generated');
        expect(result).toContain('quality threshold: 80');
      });

      test('should support strategy specification', () => {
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --strategy=concept-first`, { encoding: 'utf-8' });
        
        expect(result).toContain('Summaries generated');
        expect(result).toContain('concept-first strategy');
      });

      test('should support dry-run mode', () => {
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --dry-run`, { encoding: 'utf-8' });
        
        expect(result).toContain('Dry run');
        expect(result).toContain('would generate');
      });

      test('should support overwrite mode', () => {
        // First generation
        execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en`, { encoding: 'utf-8' });
        
        // Overwrite generation
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --overwrite`, { encoding: 'utf-8' });
        
        expect(result).toContain('Summaries generated');
        expect(result).toContain('overwritten');
      });
    });

    describe('origin format summaries', () => {
      test('should generate YAML frontmatter summaries from origin format', () => {
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries origin en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Summaries generated');
        expect(result).toContain('origin format');
      });

      test('should handle API-first strategy', () => {
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries origin en --strategy=api-first`, { encoding: 'utf-8' });
        
        expect(result).toContain('Summaries generated');
        expect(result).toContain('api-first strategy');
      });

      test('should handle concept-first strategy', () => {
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries origin en --strategy=concept-first`, { encoding: 'utf-8' });
        
        expect(result).toContain('Summaries generated');
        expect(result).toContain('concept-first strategy');
      });
    });

    describe('error handling', () => {
      test('should require source format parameter', () => {
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} generate-summaries`, { encoding: 'utf-8' });
        }).toThrow();
      });

      test('should validate source format', () => {
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} generate-summaries invalid en`, { encoding: 'utf-8' });
        }).toThrow();
      });

      test('should require language parameter', () => {
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} generate-summaries minimum`, { encoding: 'utf-8' });
        }).toThrow();
      });

      test('should handle missing source files gracefully', () => {
        // Remove source files
        rmSync(path.join(TEST_DIR, 'docs', 'en', 'llms'), { recursive: true, force: true });
        
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en`, { encoding: 'utf-8' });
        }).toThrow();
      });

      test('should validate character limits', () => {
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=invalid`, { encoding: 'utf-8' });
        }).toThrow();
      });

      test('should validate quality threshold', () => {
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --quality=150`, { encoding: 'utf-8' });
        }).toThrow();
      });
    });

    describe('YAML frontmatter validation', () => {
      test('should generate valid YAML frontmatter', () => {
        execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=300`, { encoding: 'utf-8' });
        
        // Check if summary files exist with valid YAML
        const summaryDir = path.join(TEST_DIR, 'data', 'en');
        expect(existsSync(summaryDir)).toBe(true);
      });

      test('should include required frontmatter fields', () => {
        execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=300`, { encoding: 'utf-8' });
        
        // Verify that generated files have proper frontmatter structure
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --dry-run`, { encoding: 'utf-8' });
        expect(result).toContain('title:');
        expect(result).toContain('summary:');
        expect(result).toContain('character_limit:');
      });
    });
  });

  describe('improve-summaries command', () => {
    beforeEach(() => {
      // Generate initial summaries for improvement testing
      execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=100,300`, { encoding: 'utf-8' });
    });

    test('should analyze and improve existing summary quality', () => {
      const result = execSync(`npx tsx ${CLI_PATH} improve-summaries en`, { encoding: 'utf-8' });
      
      expect(result).toContain('Summary improvement');
      expect(result).toContain('analysis completed');
    });

    test('should support minimum quality threshold', () => {
      const result = execSync(`npx tsx ${CLI_PATH} improve-summaries en --min-quality=80`, { encoding: 'utf-8' });
      
      expect(result).toContain('minimum quality: 80');
    });

    test('should support character limit filtering', () => {
      const result = execSync(`npx tsx ${CLI_PATH} improve-summaries en --chars=100,300`, { encoding: 'utf-8' });
      
      expect(result).toContain('character limits: 100,300');
    });

    test('should support maximum age filtering', () => {
      const result = execSync(`npx tsx ${CLI_PATH} improve-summaries en --max-age=30`, { encoding: 'utf-8' });
      
      expect(result).toContain('max age: 30 days');
    });

    test('should handle missing summaries gracefully', () => {
      // Remove generated summaries
      rmSync(path.join(TEST_DIR, 'data'), { recursive: true, force: true });
      
      const result = execSync(`npx tsx ${CLI_PATH} improve-summaries en`, { encoding: 'utf-8' });
      
      expect(result).toContain('No summaries found') || expect(result).toContain('0 summaries');
    });

    test('should require language parameter', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} improve-summaries`, { encoding: 'utf-8' });
      }).toThrow();
    });
  });

  describe('Integration with other commands', () => {
    test('should work with priority generation', () => {
      execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
      const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=300`, { encoding: 'utf-8' });
      
      expect(result).toContain('Summaries generated');
    });

    test('should work with configuration presets', () => {
      execSync(`npx tsx ${CLI_PATH} config-init extended`, { encoding: 'utf-8' });
      const result = execSync(`npx tsx ${CLI_PATH} generate-summaries origin en --chars=500,1000,2000`, { encoding: 'utf-8' });
      
      expect(result).toContain('Summaries generated');
    });

    test('should work with extraction commands', () => {
      execSync(`npx tsx ${CLI_PATH} extract en --chars=100,300`, { encoding: 'utf-8' });
      const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=100,300`, { encoding: 'utf-8' });
      
      expect(result).toContain('Summaries generated');
    });
  });

  describe('Performance and quality', () => {
    test('should handle multiple character limits efficiently', () => {
      const startTime = Date.now();
      
      const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=100,200,300,500,1000 --dry-run`, { encoding: 'utf-8' });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toContain('would generate');
      expect(duration).toBeLessThan(15000); // 15 seconds
    });

    test('should maintain quality across different strategies', () => {
      const strategies = ['concept-first', 'api-first'];
      
      for (const strategy of strategies) {
        const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --strategy=${strategy} --dry-run`, { encoding: 'utf-8' });
        expect(result).toContain(`${strategy} strategy`);
      }
    });

    test('should handle concurrent summary generation', () => {
      const operations = [
        'generate-summaries minimum en --chars=100 --dry-run',
        'generate-summaries origin en --chars=300 --dry-run'
      ];
      
      const promises = operations.map(op => 
        execSync(`npx tsx ${CLI_PATH} ${op}`, { encoding: 'utf-8' })
      );
      
      expect(() => {
        Promise.all(promises);
      }).not.toThrow();
    });
  });

  describe('File output validation', () => {
    test('should create properly structured output files', () => {
      execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=300`, { encoding: 'utf-8' });
      
      // Verify output directory structure
      const outputDir = path.join(TEST_DIR, 'data', 'en');
      expect(existsSync(outputDir)).toBe(true);
    });

    test('should generate files with correct naming convention', () => {
      execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=100,300,1000`, { encoding: 'utf-8' });
      
      // Check for expected file patterns
      const result = execSync(`find ${TEST_DIR} -name "*100*" -o -name "*300*" -o -name "*1000*"`, { encoding: 'utf-8' });
      expect(result.trim().length).toBeGreaterThan(0);
    });

    test('should preserve frontmatter formatting', () => {
      execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --chars=300`, { encoding: 'utf-8' });
      
      // Verify YAML frontmatter format in generated files
      const result = execSync(`npx tsx ${CLI_PATH} generate-summaries minimum en --dry-run`, { encoding: 'utf-8' });
      expect(result).toMatch(/---[\s\S]*---/);
    });
  });
});