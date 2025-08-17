/**
 * Adaptive Composition Commands Test Suite
 * Tests compose, compose-batch, and compose-stats commands
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';

const CLI_PATH = path.resolve(__dirname, '../../src/cli/index.ts');
const TEST_DIR = path.join(__dirname, 'test-workspace-adaptive');
const CONFIG_FILE = path.join(TEST_DIR, 'llms-generator.config.json');

describe('🎨 Adaptive Composition CLI Tests', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    
    // Initialize configuration
    execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
    
    // Create sample documents with varying complexity
    const docsDir = path.join(TEST_DIR, 'docs', 'en');
    mkdirSync(docsDir, { recursive: true });
    
    const documents = [
      {
        name: 'simple-guide.md',
        content: '# Simple Guide\n\nBasic content for composition testing.\n\n## Features\n\n- Simple feature\n- Another feature\n'
      },
      {
        name: 'complex-api.md', 
        content: '# Complex API Reference\n\nDetailed API documentation with multiple sections.\n\n## Authentication\n\nAuth details here.\n\n## Endpoints\n\n### GET /users\n\nGet users endpoint.\n\n### POST /users\n\nCreate user endpoint.\n\n## Error Handling\n\nError handling information.\n'
      },
      {
        name: 'tutorial.md',
        content: '# Tutorial\n\nStep-by-step tutorial content.\n\n## Prerequisites\n\nList of prerequisites.\n\n## Step 1\n\nFirst step instructions.\n\n## Step 2\n\nSecond step instructions.\n\n## Conclusion\n\nSummary and next steps.\n'
      }
    ];
    
    documents.forEach(doc => {
      writeFileSync(path.join(docsDir, doc.name), doc.content);
    });
    
    // Generate priority files for composition
    execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
  });

  afterEach(() => {
    process.chdir(path.resolve(__dirname, '../..'));
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('compose command', () => {
    test('should compose adaptive content for specified character limit', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose en 1000`, { encoding: 'utf-8' });
      
      expect(result).toContain('Composition completed');
      expect(result).toContain('1000');
    });

    test('should support different character limits', () => {
      const limits = [500, 1000, 2000, 5000];
      
      for (const limit of limits) {
        const result = execSync(`npx tsx ${CLI_PATH} compose en ${limit}`, { encoding: 'utf-8' });
        expect(result).toContain('Composition completed');
        expect(result).toContain(limit.toString());
      }
    });

    test('should support no-toc flag', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose en 1000 --no-toc`, { encoding: 'utf-8' });
      
      expect(result).toContain('Composition completed');
      expect(result).toContain('no table of contents');
    });

    test('should support priority threshold', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose en 1000 --priority=70`, { encoding: 'utf-8' });
      
      expect(result).toContain('Composition completed');
      expect(result).toContain('priority threshold: 70');
    });

    test('should support dry-run mode', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose en 1000 --dry-run`, { encoding: 'utf-8' });
      
      expect(result).toContain('Dry run');
      expect(result).toContain('would compose');
    });

    test('should handle missing language parameter', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} compose`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should handle invalid character limit', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} compose en invalid`, { encoding: 'utf-8' });
      }).toThrow();
    });
  });

  describe('compose-batch command', () => {
    test('should batch compose for multiple character limits', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose-batch en --chars=1000,3000,5000`, { encoding: 'utf-8' });
      
      expect(result).toContain('Batch composition completed');
      expect(result).toContain('1000');
      expect(result).toContain('3000');
      expect(result).toContain('5000');
    });

    test('should use config defaults when no chars specified', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose-batch en`, { encoding: 'utf-8' });
      
      expect(result).toContain('Batch composition completed');
    });

    test('should support dry-run mode', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose-batch en --dry-run`, { encoding: 'utf-8' });
      
      expect(result).toContain('Dry run');
      expect(result).toContain('would compose');
    });

    test('should handle missing language parameter', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} compose-batch`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should filter for limits >= 1000', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose-batch en --chars=100,500,1000,2000`, { encoding: 'utf-8' });
      
      expect(result).toContain('1000');
      expect(result).toContain('2000');
      expect(result).not.toContain('100');
      expect(result).not.toContain('500');
    });
  });

  describe('compose-stats command', () => {
    test('should show composition statistics', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose-stats en`, { encoding: 'utf-8' });
      
      expect(result).toContain('Composition Statistics');
      expect(result).toContain('Available content');
    });

    test('should show document counts', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose-stats en`, { encoding: 'utf-8' });
      
      expect(result).toMatch(/\d+ documents?/);
      expect(result).toMatch(/\d+ total words?/);
    });

    test('should handle missing language parameter', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} compose-stats`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should show category breakdown', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose-stats en`, { encoding: 'utf-8' });
      
      expect(result).toContain('Categories');
      expect(result).toMatch(/guide|api|tutorial/i);
    });

    test('should show priority distribution', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose-stats en`, { encoding: 'utf-8' });
      
      expect(result).toContain('Priority distribution');
      expect(result).toMatch(/\d+%/);
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle non-existent language', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} compose nonexistent 1000`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should handle extremely small character limits', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose en 50 --dry-run`, { encoding: 'utf-8' });
      
      expect(result).toContain('warning') || expect(result).toContain('limited');
    });

    test('should handle extremely large character limits', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose en 100000 --dry-run`, { encoding: 'utf-8' });
      
      expect(result).toContain('Composition completed') || expect(result).toContain('would compose');
    });

    test('should handle missing priority files gracefully', () => {
      // Remove priority files
      rmSync(path.join(TEST_DIR, 'packages'), { recursive: true, force: true });
      
      const result = execSync(`npx tsx ${CLI_PATH} compose-stats en`, { encoding: 'utf-8' });
      
      expect(result).toContain('No documents found') || expect(result).toContain('0 documents');
    });
  });

  describe('Integration with configuration', () => {
    test('should respect composition strategy from config', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose en 1000`, { encoding: 'utf-8' });
      
      expect(result).toContain('Composition completed');
    });

    test('should use configured default character limits', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose-batch en`, { encoding: 'utf-8' });
      
      expect(result).toContain('Batch composition completed');
    });

    test('should respect quality thresholds from config', () => {
      const result = execSync(`npx tsx ${CLI_PATH} compose en 1000 --priority=80`, { encoding: 'utf-8' });
      
      expect(result).toContain('priority threshold: 80');
    });
  });

  describe('Performance and scalability', () => {
    test('should handle multiple composition requests efficiently', () => {
      const startTime = Date.now();
      
      const operations = [
        'compose en 1000 --dry-run',
        'compose en 2000 --dry-run', 
        'compose en 3000 --dry-run'
      ];
      
      operations.forEach(op => {
        execSync(`npx tsx ${CLI_PATH} ${op}`, { encoding: 'utf-8' });
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds
    });

    test('should maintain consistent output across runs', () => {
      const results = [];
      
      for (let i = 0; i < 3; i++) {
        const result = execSync(`npx tsx ${CLI_PATH} compose-stats en`, { encoding: 'utf-8' });
        results.push(result);
      }
      
      // All results should be identical
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });
  });
});