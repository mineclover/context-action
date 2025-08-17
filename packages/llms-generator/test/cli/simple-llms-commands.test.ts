/**
 * Simple LLMS CLI Commands Integration Tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

describe('Simple LLMS CLI Commands', () => {
  let testDir: string;
  let cliPath: string;

  beforeAll(async () => {
    // Setup test environment
    testDir = path.join(process.cwd(), 'test-temp-cli-simple-llms');
    cliPath = path.join(process.cwd(), 'dist/cli/index.js');
    
    // Create test directory structure
    await mkdir(testDir, { recursive: true });
    
    // Create test config
    const configPath = path.join(testDir, 'llms-generator.config.json');
    const config = {
      paths: {
        docsDir: './docs',
        llmContentDir: './data',
        outputDir: './output'
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 1000],
        defaultLanguage: 'en'
      }
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));
    
    // Create test data
    await createTestData();
  }, 30000);

  afterAll(async () => {
    // Clean up
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  async function createTestData() {
    const dataDir = path.join(testDir, 'data', 'en');
    await mkdir(dataDir, { recursive: true });

    const documents = [
      {
        id: 'api--action-only',
        title: 'Action Only API',
        category: 'api',
        content: {
          100: 'Brief action-only API overview. Provides simple action dispatching without state management.',
          300: 'Action Only API provides simple action dispatching without state management. Perfect for event systems and command patterns where you only need to trigger actions.',
          1000: 'The Action Only API is designed for applications that need pure action dispatching without state management overhead. It provides a lightweight solution for event systems, command patterns, and scenarios where you only need to trigger actions without maintaining local state. Features include type-safe action dispatching, action handler registration, abort support, and result handling.'
        }
      },
      {
        id: 'api--store-pattern',
        title: 'Store Pattern API',
        category: 'api',
        content: {
          100: 'Store pattern for state management. Type-safe with excellent inference and simplified API.',
          300: 'Store Pattern provides type-safe state management with excellent type inference without manual type annotations. Features simplified API focused on store management.',
          1000: 'The Store Pattern (Declarative Store Pattern) provides type-safe state management with domain isolation. Features excellent type inference without manual type annotations, simplified API focused on store management, direct value or configuration object support, and seamless integration with the Context-Action framework.'
        }
      },
      {
        id: 'guide--getting-started',
        title: 'Getting Started Guide',
        category: 'guide',
        content: {
          100: 'Quick start guide for Context-Action framework. Installation, basic setup, and first example.',
          300: 'Getting Started Guide covers installation, basic setup, and your first Context-Action application. Includes project setup, configuration, and simple examples.',
          1000: 'Complete Getting Started Guide for the Context-Action framework. Covers installation, project setup, configuration, and building your first application. Includes detailed explanations of core concepts, pattern selection, and best practices for getting up and running quickly.'
        }
      }
    ];

    for (const doc of documents) {
      const docDir = path.join(dataDir, doc.id);
      await mkdir(docDir, { recursive: true });

      for (const [charLimit, content] of Object.entries(doc.content)) {
        const frontmatter = `---
title: "${doc.title}"
category: "${doc.category}"
character_limit: ${parseInt(charLimit)}
---

# ${doc.title}

${content}`;

        const filePath = path.join(docDir, `${doc.id}-${charLimit}.md`);
        await writeFile(filePath, frontmatter, 'utf-8');
      }
    }
  }

  describe('simple-llms-generate command', () => {
    it('should generate simple LLMS for specific character limit', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-generate 100 --language en`, {
        cwd: testDir
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('🚀 Generating Simple LLMS');
      expect(stdout).toContain('Character limit: 100');
      expect(stdout).toContain('Files combined: 3');
      expect(stdout).toContain('✅ Generated:');

      // Check output file was created
      const outputPath = path.join(testDir, 'output', 'en', 'llms-simple-100chars.txt');
      expect(existsSync(outputPath)).toBe(true);

      // Verify content
      const content = await readFile(outputPath, 'utf-8');
      expect(content).toContain('Context-Action Framework - Simple LLMS (100 chars)');
      expect(content).toContain('Action Only API');
      expect(content).toContain('Store Pattern API');
      expect(content).toContain('Getting Started Guide');
    }, 15000);

    it('should support dry-run mode', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-generate 300 --language en --dry-run`, {
        cwd: testDir
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('🔍 DRY RUN');
      expect(stdout).toContain('Would generate Simple LLMS for:');
      expect(stdout).toContain('Character limit: 300');
      expect(stdout).toContain('Total files: 3');
    }, 10000);

    it('should support verbose output', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-generate 100 --language en --verbose`, {
        cwd: testDir
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('📄 Files included:');
      expect(stdout).toContain('api--action-only');
      expect(stdout).toContain('api--store-pattern');
      expect(stdout).toContain('guide--getting-started');
    }, 15000);

    it('should support different sort methods', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-generate 100 --language en --sort-by category --verbose`, {
        cwd: testDir
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('Sort by: category');
      expect(stdout).toContain('📄 Files included:');
    }, 15000);

    it('should handle missing character limit gracefully', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-generate 5000 --language en`, {
        cwd: testDir
      });

      expect(stderr).toContain('No files found for character limit 5000');
    }, 10000);
  });

  describe('simple-llms-batch command', () => {
    it('should generate LLMS for multiple character limits', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-batch --language en --character-limits 100,300`, {
        cwd: testDir
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('🚀 Batch generating Simple LLMS');
      expect(stdout).toContain('Character limits: 100, 300');
      expect(stdout).toContain('Successful: 2/2');

      // Check both files were created
      const output100 = path.join(testDir, 'output', 'en', 'llms-simple-100chars.txt');
      const output300 = path.join(testDir, 'output', 'en', 'llms-simple-300chars.txt');
      expect(existsSync(output100)).toBe(true);
      expect(existsSync(output300)).toBe(true);
    }, 20000);

    it('should support dry-run mode for batch', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-batch --language en --character-limits 100,300,1000 --dry-run`, {
        cwd: testDir
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('🔍 DRY RUN - Would generate:');
      expect(stdout).toContain('100 chars: 3 files');
      expect(stdout).toContain('300 chars: 3 files');
      expect(stdout).toContain('1000 chars: 3 files');
    }, 10000);

    it('should handle mixed success and failure', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-batch --language en --character-limits 100,5000 --verbose`, {
        cwd: testDir
      });

      expect(stdout).toContain('Successful: 1/2'); // Only 100 should succeed
      expect(stdout).toContain('100 chars:');
      expect(stdout).not.toContain('5000 chars:');
    }, 15000);
  });

  describe('simple-llms-stats command', () => {
    it('should show stats for all character limits', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-stats --language en`, {
        cwd: testDir
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('📊 Simple LLMS Statistics for language: en');
      expect(stdout).toContain('Available character limits: 100, 300, 1000');
      expect(stdout).toContain('100 chars: 3 files');
      expect(stdout).toContain('300 chars: 3 files');
      expect(stdout).toContain('1000 chars: 3 files');
    }, 10000);

    it('should show detailed stats for specific character limit', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-stats --language en --character-limit 100`, {
        cwd: testDir
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('Character Limit: 100');
      expect(stdout).toContain('Total files: 3');
      expect(stdout).toContain('Total characters:');
      expect(stdout).toContain('Average characters:');
      expect(stdout).toContain('Min characters:');
      expect(stdout).toContain('Max characters:');
    }, 10000);

    it('should handle non-existent language gracefully', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-stats --language fr`, {
        cwd: testDir
      });

      expect(stderr).toContain('⚠️  Language directory not found');
      expect(stdout).toContain('No character-limited files found');
    }, 10000);
  });

  describe('help and error handling', () => {
    it('should show help for simple-llms-generate', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-generate --help`, {
        cwd: testDir
      });

      expect(stdout).toContain('같은 character limit의 모든 개별 .md 파일들을 단순 결합하여 LLMS 생성');
      expect(stdout).toContain('-l, --language <lang>');
      expect(stdout).toContain('--sort-by <method>');
      expect(stdout).toContain('--dry-run');
    }, 10000);

    it('should show help for simple-llms-batch', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-batch --help`, {
        cwd: testDir
      });

      expect(stdout).toContain('여러 character limit에 대해 Simple LLMS 일괄 생성');
      expect(stdout).toContain('-c, --character-limits <limits>');
    }, 10000);

    it('should show help for simple-llms-stats', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} simple-llms-stats --help`, {
        cwd: testDir
      });

      expect(stdout).toContain('Simple LLMS 생성을 위한 통계 정보 확인');
      expect(stdout).toContain('-c, --character-limit <limit>');
    }, 10000);
  });
});