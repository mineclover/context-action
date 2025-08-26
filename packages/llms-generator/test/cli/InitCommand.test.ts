import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { InitCommand } from '../../src/cli/commands/InitCommand.js';
import { CLIConfig } from '../../src/cli/types/CLITypes.js';

describe('InitCommand', () => {
  let initCommand: InitCommand;
  let testDataDir: string;
  let config: CLIConfig;

  beforeEach(async () => {
    // Setup test directory
    testDataDir = path.join(__dirname, 'test-workspace-init');
    
    config = {
      paths: {
        docsDir: path.join(testDataDir, 'docs'),
        llmContentDir: path.join(testDataDir, 'llmsData'),
        outputDir: path.join(testDataDir, 'output'),
        templatesDir: path.join(testDataDir, 'templates'),
        instructionsDir: path.join(testDataDir, 'instructions')
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 1000],
        defaultLanguage: 'en',
        outputFormat: 'txt'
      },
      categories: {
        guide: { priority: 95 },
        api: { priority: 90 },
        concept: { priority: 85 },
        examples: { priority: 80 }
      }
    } as CLIConfig;

    initCommand = new InitCommand(config);

    // Create test directory structure
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'ko', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'api'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('document discovery', () => {
    it('should discover documents in multiple languages', async () => {
      // Create test documents
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is an English guide.'
      );
      
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'ko', 'guide', 'getting-started.md'),
        '# 시작하기\n\n한국어 가이드입니다.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'api', 'core.md'),
        '# Core API\n\nCore API documentation.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await initCommand.execute({ dryRun: true });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should discover all documents - check for success indicators
        expect(output).toContain('2 priority.json files') || expect(output).toContain('Created: 2');
        expect(output).toContain('Initialization Summary');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should skip documents that match exclude patterns', async () => {
      // Create documents including ones that should be excluded
      await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'api', 'core', 'src'), { recursive: true });
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'api', 'core', 'src', 'ActionRegister.md'),
        '# ActionRegister API\n\nGenerated API documentation.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'manual.md'),
        '# Manual Guide\n\nManual documentation.'
      );

      // Update config to include exclude patterns
      const configWithExcludes = {
        ...config,
        paths: {
          ...config.paths,
          excludePatterns: ['**/api/core/src/**/*.md']
        }
      };

      const initCommandWithExcludes = new InitCommand(configWithExcludes);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await initCommandWithExcludes.execute({ dryRun: true });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should process the manual file (test functionality works)
        expect(output).toContain('1 priority.json files') || expect(output).toContain('Created: 1');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('priority generation', () => {
    it('should generate priority.json files for discovered documents', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a comprehensive getting started guide.'
      );

      await initCommand.execute({});

      // Check if priority.json was created
      const priorityPath = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json');
      const priorityExists = await fs.access(priorityPath).then(() => true).catch(() => false);
      
      expect(priorityExists).toBe(true);

      // Check priority.json content
      const priorityContent = await fs.readFile(priorityPath, 'utf-8');
      const priorityData = JSON.parse(priorityContent);
      
      expect(priorityData.document).toBeDefined();
      expect(priorityData.document.id).toBe('guide--getting-started');
      expect(priorityData.document.title).toBe('Getting Started');
      expect(priorityData.priority).toBeDefined();
      expect(priorityData.priority.score).toBeDefined();
    });

    it('should not overwrite existing priority.json without overwrite flag', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      // Create existing priority.json
      const priorityDir = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started');
      await fs.mkdir(priorityDir, { recursive: true });
      
      const existingPriority = {
        document: { id: 'guide--getting-started', title: 'Existing Title' },
        priority: { score: 50 }
      };
      
      await fs.writeFile(
        path.join(priorityDir, 'priority.json'),
        JSON.stringify(existingPriority, null, 2)
      );

      await initCommand.execute({});

      // Check that existing content is preserved
      const priorityContent = await fs.readFile(path.join(priorityDir, 'priority.json'), 'utf-8');
      const priorityData = JSON.parse(priorityContent);
      
      expect(priorityData.document.title).toBe('Existing Title');
      expect(priorityData.priority.score).toBe(50);
    });

    it('should overwrite existing priority.json with overwrite flag', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      // Create existing priority.json
      const priorityDir = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started');
      await fs.mkdir(priorityDir, { recursive: true });
      
      const existingPriority = {
        document: { id: 'guide--getting-started', title: 'Existing Title' },
        priority: { score: 50 }
      };
      
      await fs.writeFile(
        path.join(priorityDir, 'priority.json'),
        JSON.stringify(existingPriority, null, 2)
      );

      await initCommand.execute({ overwrite: true });

      // Check that content was overwritten
      const priorityContent = await fs.readFile(path.join(priorityDir, 'priority.json'), 'utf-8');
      const priorityData = JSON.parse(priorityContent);
      
      expect(priorityData.document.title).toBe('Getting Started');
      expect(priorityData.priority.score).toBeGreaterThan(50);
    });
  });

  describe('template generation', () => {
    it('should generate template files for all character limits', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a comprehensive getting started guide with lots of content.'
      );

      await initCommand.execute({});

      // Check that template files were created
      const templateDir = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started');
      
      for (const limit of [100, 300, 1000]) {
        const templatePath = path.join(templateDir, `guide--getting-started-${limit}.md`);
        const templateExists = await fs.access(templatePath).then(() => true).catch(() => false);
        expect(templateExists).toBe(true);

        // Check template content structure
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        expect(templateContent).toContain('---');
        expect(templateContent).toContain(`character_limit: ${limit}`);
        expect(templateContent).toContain('document_id: guide--getting-started');
      }
    });

    it('should skip template generation when skipTemplates flag is set', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      await initCommand.execute({ skipTemplates: true });

      // Check that template files were NOT created
      const templateDir = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started');
      
      for (const limit of [100, 300, 1000]) {
        const templatePath = path.join(templateDir, `guide--getting-started-${limit}.md`);
        const templateExists = await fs.access(templatePath).then(() => true).catch(() => false);
        expect(templateExists).toBe(false);
      }
    });
  });

  describe('dry run mode', () => {
    it('should show what would be done without making changes', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await initCommand.execute({ dryRun: true });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show preview
        expect(output).toContain('DRY RUN');
        expect(output).toContain('No files will be created');
        
      } finally {
        consoleSpy.mockRestore();
      }

      // Check that no files were actually created
      const priorityPath = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json');
      const priorityExists = await fs.access(priorityPath).then(() => true).catch(() => false);
      expect(priorityExists).toBe(false);
    });
  });

  describe('quiet mode', () => {
    it('should suppress detailed output in quiet mode', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await initCommand.execute({ quiet: true });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should have minimal output
        expect(consoleSpy.mock.calls.length).toBeLessThan(10);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('skip options', () => {
    it('should skip priority generation when skipPriority flag is set', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      await initCommand.execute({ skipPriority: true });

      // Check that priority.json was NOT created
      const priorityPath = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json');
      const priorityExists = await fs.access(priorityPath).then(() => true).catch(() => false);
      expect(priorityExists).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle missing docs directory gracefully', async () => {
      // Don't create docs directory
      const emptyConfig = {
        ...config,
        paths: {
          ...config.paths,
          docsDir: path.join(testDataDir, 'non-existent-docs')
        }
      };

      const emptyInitCommand = new InitCommand(emptyConfig);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await emptyInitCommand.execute({});
        
        // Should handle gracefully without crashing
        expect(true).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle file system errors gracefully', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      // Create read-only directory to simulate permission error
      const readOnlyDir = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started');
      await fs.mkdir(readOnlyDir, { recursive: true });
      
      // Try to make directory read-only (may not work on all systems)
      try {
        await fs.chmod(readOnlyDir, 0o444);
      } catch {
        // Skip this test if we can't set permissions
        return;
      }

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await initCommand.execute({});
        
        // Should handle permission errors gracefully
        expect(true).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        
        // Restore permissions for cleanup
        try {
          await fs.chmod(readOnlyDir, 0o755);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('progress reporting', () => {
    it('should report progress during initialization', async () => {
      // Create multiple test documents
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );
      
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'api', 'core.md'),
        '# Core API\n\nAPI documentation.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await initCommand.execute({});
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show progress indicators
        expect(output).toContain('Initializing') || expect(output).toContain('Step 1') || expect(output).toContain('Templates Created');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});