import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

describe('SchemaCommand', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    
    // Setup test directory
    testDir = path.join(process.cwd(), 'test-schema-cli');
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

  describe('Schema Command Help', () => {
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

    it('should show schema help with help action', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema help`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('🔧 schema - Schema generation and management');
      expect(output).toContain('For detailed help on specific action:');
      expect(output).toContain('schema <action> --help');
    });

    it('should handle unknown schema action', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} schema unknown-action`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('Unknown schema action: unknown-action');
        expect(output).toContain('Available actions: generate, info, validate, export');
      }
    });
  });

  describe('Schema Generate', () => {
    it('should handle schema generate with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate all schemas');
      expect(output).toContain('[DRY RUN] Output directory: ./schemas');
      expect(output).toContain('[DRY RUN] Format: json');
    });

    it('should handle schema generate with specific type', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate config --output=./dist/schemas --format=typescript --strict --overwrite --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate config schemas');
      expect(output).toContain('[DRY RUN] Output directory: ./dist/schemas');
      expect(output).toContain('[DRY RUN] Format: typescript');
      expect(output).toContain('[DRY RUN] Using strict validation rules');
      expect(output).toContain('[DRY RUN] Would overwrite existing files');
    });

    it('should handle schema generate with type as positional argument', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate priority --format=yaml --minify --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate priority schemas');
      expect(output).toContain('[DRY RUN] Format: yaml');
      expect(output).toContain('[DRY RUN] Would minify schema files');
    });

    it('should handle schema generate all types', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate all --output=./schemas --strict --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate all schemas');
      expect(output).toContain('[DRY RUN] Using strict validation rules');
    });

    it('should execute schema generate without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate config --format=json`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Generating config schemas...');
      expect(output).toContain('Schema Generation Results:');
      expect(output).toContain('Generated schemas: 1');
      expect(output).toContain('Format: json');
      expect(output).toContain('Schema generation completed for config');
    });
  });

  describe('Schema Info', () => {
    it('should handle schema info with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema info`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Schema Information: all');
      expect(output).toContain('Schema Information:');
      expect(output).toContain('Configuration Schema (config)');
      expect(output).toContain('Priority Schema (priority)');
      expect(output).toContain('Summary Schema (summary)');
    });

    it('should handle schema info for specific type', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema info config --detailed --properties --examples`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Schema Information: config');
      expect(output).toContain('Configuration Schema (config)');
      expect(output).toContain('Properties:');
      expect(output).toContain('Examples:');
    });

    it('should handle schema info with JSON format', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema info priority --format=json`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Schema Information: priority');
      expect(output).toContain('"name": "Priority Schema"');
      expect(output).toContain('"version": "1.0.0"');
    });

    it('should handle schema info with YAML format', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema info summary --format=yaml --properties`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Schema Information: summary');
      expect(output).toContain('# Schema Information');
      expect(output).toContain('summary:');
      expect(output).toContain('name: "Summary Schema"');
    });

    it('should handle schema info with type as positional argument', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema info config --properties --examples`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Schema Information: config');
      expect(output).toContain('Configuration Schema (config)');
      expect(output).toContain('Properties:');
      expect(output).toContain('Examples:');
    });
  });

  describe('Schema Validate', () => {
    it('should handle schema validate with file path', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema validate --file=llms-generator.config.json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate schemas');
      expect(output).toContain('[DRY RUN] File: llms-generator.config.json');
      expect(output).toContain('[DRY RUN] Schema type: auto');
      expect(output).toContain('[DRY RUN] Output format: table');
    });

    it('should handle schema validate with custom settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema validate --file=./data/priority.json --type=priority --schema=./custom.schema.json --fix --format=json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate schemas');
      expect(output).toContain('[DRY RUN] File: ./data/priority.json');
      expect(output).toContain('[DRY RUN] Schema type: priority');
      expect(output).toContain('[DRY RUN] Custom schema: ./custom.schema.json');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix errors');
      expect(output).toContain('[DRY RUN] Output format: json');
    });

    it('should handle schema validate with recursive option', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema validate --recursive --type=config --fix --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would validate schemas');
      expect(output).toContain('[DRY RUN] Recursive validation enabled');
      expect(output).toContain('[DRY RUN] Schema type: config');
      expect(output).toContain('[DRY RUN] Would attempt to auto-fix errors');
    });

    it('should require file path or recursive option', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} schema validate --type=config`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('File path is required unless using --recursive');
        expect(output).toContain('Usage: schema validate --file=<path> [options]');
        expect(output).toContain('   or: schema validate --recursive [options]');
      }
    });

    it('should execute schema validate without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema validate --file=test.json --fix`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Validating schemas...');
      expect(output).toContain('Validation Results:');
      expect(output).toContain('Total files checked:');
    });
  });

  describe('Schema Export', () => {
    it('should handle schema export with default settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema export --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would export all schemas');
      expect(output).toContain('[DRY RUN] Target format: jsonschema');
    });

    it('should handle schema export with custom settings', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema export config --target=typescript --output=./types --bundle --include-examples --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would export config schemas');
      expect(output).toContain('[DRY RUN] Target format: typescript');
      expect(output).toContain('[DRY RUN] Output: ./types');
      expect(output).toContain('[DRY RUN] Would bundle schemas into single file');
      expect(output).toContain('[DRY RUN] Would include example data');
    });

    it('should handle schema export with type as positional argument', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema export priority --target=openapi --bundle --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would export priority schemas');
      expect(output).toContain('[DRY RUN] Target format: openapi');
      expect(output).toContain('[DRY RUN] Would bundle schemas into single file');
    });

    it('should execute schema export without dry-run', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema export all --target=zod`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Exporting all schemas to zod format...');
      expect(output).toContain('Schema Export Results:');
      expect(output).toContain('Schema type: all');
      expect(output).toContain('Target format: zod');
      expect(output).toContain('Schema export completed for all');
    });
  });

  describe('Legacy Command Support', () => {
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

  describe('Argument Parsing', () => {
    it('should handle options parsing correctly for generate', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate --type=config --output=./schemas --format=typescript --strict --overwrite --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate config schemas');
      expect(output).toContain('[DRY RUN] Output directory: ./schemas');
      expect(output).toContain('[DRY RUN] Format: typescript');
      expect(output).toContain('[DRY RUN] Using strict validation rules');
      expect(output).toContain('[DRY RUN] Would overwrite existing files');
    });

    it('should handle mixed positional and option arguments', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate priority --format=yaml --strict --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate priority schemas');
      expect(output).toContain('[DRY RUN] Format: yaml');
      expect(output).toContain('[DRY RUN] Using strict validation rules');
    });

    it('should handle short aliases correctly', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate -t config -o ./out -f json --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('[DRY RUN] Would generate config schemas');
      expect(output).toContain('[DRY RUN] Output directory: ./out');
      expect(output).toContain('[DRY RUN] Format: json');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown schema type gracefully', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      const output = execSync(`npx tsx ${cliPath} schema generate invalid-type --dry-run`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      // Should still proceed but with invalid type
      expect(output).toContain('[DRY RUN] Would generate invalid-type schemas');
    });

    it('should handle missing file path in validate gracefully', () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'new-index.ts');
      
      try {
        execSync(`npx tsx ${cliPath} schema validate`, {
          encoding: 'utf-8',
          cwd: testDir
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        expect(output).toContain('File path is required unless using --recursive');
      }
    });
  });
});