/**
 * Instruction Generation CLI Test Suite
 * Tests instruction-generate, instruction-batch, and instruction-template commands
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';

const CLI_PATH = path.resolve(__dirname, '../../src/cli/index.ts');
const TEST_DIR = path.join(__dirname, 'test-workspace-instruction');
const CONFIG_FILE = path.join(TEST_DIR, 'llms-generator.config.json');

describe('📋 Instruction Generation CLI Tests', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    
    // Initialize configuration
    execSync(`npx tsx ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
    
    // Create sample documents for instruction generation
    const docsDir = path.join(TEST_DIR, 'docs', 'en');
    mkdirSync(docsDir, { recursive: true });
    
    const sampleDocs = [
      {
        name: 'guide-getting-started.md',
        content: `---\ntitle: Getting Started Guide\ncategory: guide\ntags: [tutorial, basics]\n---\n\n# Getting Started\n\nWelcome to our framework.\n\n## Installation\n\nInstall the package:\n\n\`\`\`bash\nnpm install framework\n\`\`\`\n\n## Basic Usage\n\nHere's how to get started:\n\n\`\`\`typescript\nimport { Framework } from 'framework';\n\nconst app = new Framework();\napp.start();\n\`\`\`\n\n## Next Steps\n\n- Read the API documentation\n- Check out examples\n- Join our community`
      },
      {
        name: 'api-reference.md',
        content: `---\ntitle: API Reference\ncategory: api\ntags: [reference, documentation]\n---\n\n# API Reference\n\nComplete API documentation.\n\n## Core Classes\n\n### Framework\n\nMain framework class.\n\n#### Methods\n\n##### start()\n\nStarts the framework.\n\n**Returns:** \`Promise<void>\`\n\n##### stop()\n\nStops the framework.\n\n**Returns:** \`Promise<void>\`\n\n## Configuration\n\n### FrameworkConfig\n\nConfiguration interface.\n\n#### Properties\n\n- \`port\`: number - Server port\n- \`debug\`: boolean - Debug mode`
      },
      {
        name: 'examples-basic-setup.md',
        content: `---\ntitle: Basic Setup Examples\ncategory: examples\ntags: [examples, setup]\n---\n\n# Basic Setup Examples\n\nCollection of basic setup examples.\n\n## Example 1: Simple App\n\n\`\`\`typescript\nimport { Framework } from 'framework';\n\nconst app = new Framework({\n  port: 3000,\n  debug: true\n});\n\napp.start();\n\`\`\`\n\n## Example 2: With Configuration\n\n\`\`\`typescript\nimport { Framework, FrameworkConfig } from 'framework';\n\nconst config: FrameworkConfig = {\n  port: process.env.PORT || 3000,\n  debug: process.env.NODE_ENV === 'development'\n};\n\nconst app = new Framework(config);\napp.start();\n\`\`\``
      }
    ];
    
    sampleDocs.forEach(doc => {
      writeFileSync(path.join(docsDir, doc.name), doc.content);
    });
    
    // Generate priority files for instruction generation
    execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
  });

  afterEach(() => {
    process.chdir(path.resolve(__dirname, '../..'));
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('instruction-generate command', () => {
    test('should generate detailed instructions for specific document', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started`, { encoding: 'utf-8' });
      
      expect(result).toContain('Instructions generated');
      expect(result).toContain('guide-getting-started');
    });

    test('should support template specification', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --template=default`, { encoding: 'utf-8' });
      
      expect(result).toContain('Instructions generated');
      expect(result).toContain('template: default');
    });

    test('should support character limit specification', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --chars=100,300`, { encoding: 'utf-8' });
      
      expect(result).toContain('Instructions generated');
      expect(result).toContain('100');
      expect(result).toContain('300');
    });

    test('should support dry-run mode', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --dry-run`, { encoding: 'utf-8' });
      
      expect(result).toContain('Dry run');
      expect(result).toContain('would generate');
    });

    test('should support overwrite mode', () => {
      // First generation
      execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started`, { encoding: 'utf-8' });
      
      // Overwrite generation
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --overwrite`, { encoding: 'utf-8' });
      
      expect(result).toContain('Instructions generated');
      expect(result).toContain('overwritten');
    });

    test('should support max-length parameter', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --max-length=5000`, { encoding: 'utf-8' });
      
      expect(result).toContain('Instructions generated');
      expect(result).toContain('max length: 5000');
    });

    test('should support no-source flag', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --no-source`, { encoding: 'utf-8' });
      
      expect(result).toContain('Instructions generated');
      expect(result).toContain('without source');
    });

    test('should support no-summaries flag', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --no-summaries`, { encoding: 'utf-8' });
      
      expect(result).toContain('Instructions generated');
      expect(result).toContain('without summaries');
    });

    test('should require language parameter', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} instruction-generate`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should require document-id parameter', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} instruction-generate en`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should handle non-existent document gracefully', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} instruction-generate en non-existent-doc`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should validate max-length parameter', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --max-length=invalid`, { encoding: 'utf-8' });
      }).toThrow();
    });
  });

  describe('instruction-batch command', () => {
    test('should batch generate instructions for all documents', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-batch en`, { encoding: 'utf-8' });
      
      expect(result).toContain('Batch instruction generation completed');
      expect(result).toContain('guide-getting-started');
      expect(result).toContain('api-reference');
      expect(result).toContain('examples-basic-setup');
    });

    test('should support template specification', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-batch en --template=default`, { encoding: 'utf-8' });
      
      expect(result).toContain('Batch instruction generation completed');
      expect(result).toContain('template: default');
    });

    test('should support character limit specification', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-batch en --chars=100,300`, { encoding: 'utf-8' });
      
      expect(result).toContain('Batch instruction generation completed');
      expect(result).toContain('100');
      expect(result).toContain('300');
    });

    test('should support dry-run mode', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-batch en --dry-run`, { encoding: 'utf-8' });
      
      expect(result).toContain('Dry run');
      expect(result).toContain('would generate');
    });

    test('should support overwrite mode', () => {
      // First batch generation
      execSync(`npx tsx ${CLI_PATH} instruction-batch en`, { encoding: 'utf-8' });
      
      // Overwrite batch generation
      const result = execSync(`npx tsx ${CLI_PATH} instruction-batch en --overwrite`, { encoding: 'utf-8' });
      
      expect(result).toContain('Batch instruction generation completed');
      expect(result).toContain('overwritten');
    });

    test('should require language parameter', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} instruction-batch`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should handle missing documents gracefully', () => {
      // Remove all documents
      rmSync(path.join(TEST_DIR, 'docs'), { recursive: true, force: true });
      
      const result = execSync(`npx tsx ${CLI_PATH} instruction-batch en`, { encoding: 'utf-8' });
      
      expect(result).toContain('No documents found') || expect(result).toContain('0 instructions');
    });
  });

  describe('instruction-template command', () => {
    describe('list subcommand', () => {
      test('should list available instruction templates', () => {
        const result = execSync(`npx tsx ${CLI_PATH} instruction-template list`, { encoding: 'utf-8' });
        
        expect(result).toContain('Available templates');
        expect(result).toContain('default');
      });

      test('should list templates for specific language', () => {
        const result = execSync(`npx tsx ${CLI_PATH} instruction-template list en`, { encoding: 'utf-8' });
        
        expect(result).toContain('Available templates');
        expect(result).toContain('en');
      });
    });

    describe('show subcommand', () => {
      test('should show specific template content', () => {
        const result = execSync(`npx tsx ${CLI_PATH} instruction-template show en default`, { encoding: 'utf-8' });
        
        expect(result).toContain('Template: default');
        expect(result).toContain('Language: en');
      });

      test('should require language and template name', () => {
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} instruction-template show`, { encoding: 'utf-8' });
        }).toThrow();
      });

      test('should handle non-existent template gracefully', () => {
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} instruction-template show en non-existent`, { encoding: 'utf-8' });
        }).toThrow();
      });
    });

    describe('create subcommand', () => {
      test('should create new instruction template', () => {
        const result = execSync(`npx tsx ${CLI_PATH} instruction-template create en custom-template`, { encoding: 'utf-8' });
        
        expect(result).toContain('Template created');
        expect(result).toContain('custom-template');
      });

      test('should require language and template name', () => {
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} instruction-template create`, { encoding: 'utf-8' });
        }).toThrow();
      });

      test('should handle existing template gracefully', () => {
        // Create template first
        execSync(`npx tsx ${CLI_PATH} instruction-template create en test-template`, { encoding: 'utf-8' });
        
        // Try to create again
        expect(() => {
          execSync(`npx tsx ${CLI_PATH} instruction-template create en test-template`, { encoding: 'utf-8' });
        }).toThrow();
      });
    });

    test('should require subcommand', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} instruction-template`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('should handle invalid subcommand', () => {
      expect(() => {
        execSync(`npx tsx ${CLI_PATH} instruction-template invalid`, { encoding: 'utf-8' });
      }).toThrow();
    });
  });

  describe('Integration with other commands', () => {
    test('should work with priority generation', () => {
      execSync(`npx tsx ${CLI_PATH} priority-generate en`, { encoding: 'utf-8' });
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started`, { encoding: 'utf-8' });
      
      expect(result).toContain('Instructions generated');
    });

    test('should work with configuration presets', () => {
      execSync(`npx tsx ${CLI_PATH} config-init extended`, { encoding: 'utf-8' });
      const result = execSync(`npx tsx ${CLI_PATH} instruction-batch en --chars=500,1000,2000`, { encoding: 'utf-8' });
      
      expect(result).toContain('Batch instruction generation completed');
    });

    test('should work with work status commands', () => {
      execSync(`npx tsx ${CLI_PATH} work-status en`, { encoding: 'utf-8' });
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started`, { encoding: 'utf-8' });
      
      expect(result).toContain('Instructions generated');
    });
  });

  describe('Output validation', () => {
    test('should create instruction files in correct location', () => {
      execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started`, { encoding: 'utf-8' });
      
      // Verify instruction files are created
      const instructionDir = path.join(TEST_DIR, 'instructions');
      expect(existsSync(instructionDir)).toBe(true);
    });

    test('should generate files with proper naming convention', () => {
      execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --chars=100,300`, { encoding: 'utf-8' });
      
      // Check for expected file patterns
      const result = execSync(`find ${TEST_DIR} -name "*instruction*" -o -name "*guide-getting-started*"`, { encoding: 'utf-8' });
      expect(result.trim().length).toBeGreaterThan(0);
    });

    test('should include required instruction sections', () => {
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --dry-run`, { encoding: 'utf-8' });
      
      expect(result).toContain('Document ID');
      expect(result).toContain('Instructions');
      expect(result).toContain('Character Limits');
    });
  });

  describe('Performance and scalability', () => {
    test('should handle batch generation efficiently', () => {
      const startTime = Date.now();
      
      const result = execSync(`npx tsx ${CLI_PATH} instruction-batch en --dry-run`, { encoding: 'utf-8' });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toContain('would generate');
      expect(duration).toBeLessThan(20000); // 20 seconds
    });

    test('should handle multiple character limits efficiently', () => {
      const startTime = Date.now();
      
      const result = execSync(`npx tsx ${CLI_PATH} instruction-generate en guide-getting-started --chars=100,200,300,500,1000 --dry-run`, { encoding: 'utf-8' });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toContain('would generate');
      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    test('should maintain consistency across runs', () => {
      const results = [];
      
      for (let i = 0; i < 3; i++) {
        const result = execSync(`npx tsx ${CLI_PATH} instruction-template list`, { encoding: 'utf-8' });
        results.push(result);
      }
      
      // All results should be identical
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });
  });
});