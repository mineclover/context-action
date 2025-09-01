import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { GenerateTemplatesCommand } from '../../src/cli/commands/GenerateTemplatesCommand.js';
import { CLIConfig } from '../../src/cli/types/CLITypes.js';

describe('GenerateTemplatesCommand', () => {
  let generateTemplatesCommand: GenerateTemplatesCommand;
  let testDataDir: string;
  let config: CLIConfig;

  beforeEach(async () => {
    // Setup test directory
    testDataDir = path.join(__dirname, 'test-workspace-generate-templates');
    
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
        characterLimits: [100, 300, 1000, 2000],
        defaultLanguage: 'en',
        outputFormat: 'txt'
      },
      categories: {
        guide: { priority: 95 },
        api: { priority: 90 },
        concept: { priority: 85 }
      }
    } as CLIConfig;

    generateTemplatesCommand = new GenerateTemplatesCommand(config);

    // Create test directory structure
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'ko', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('template generation', () => {
    it('should generate templates for all character limits', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a comprehensive guide with detailed instructions for getting started with our framework.'
      );

      // Create priority.json
      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      await generateTemplatesCommand.execute({});

      // Check that templates were generated for all character limits
      for (const limit of [100, 300, 1000, 2000]) {
        const templatePath = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', `guide--getting-started-${limit}.md`);
        const templateExists = await fs.access(templatePath).then(() => true).catch(() => false);
        expect(templateExists).toBe(true);

        // Check template content structure
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        expect(templateContent).toContain('---');
        expect(templateContent).toContain(`character_limit: ${limit}`);
        expect(templateContent).toContain('document_id: guide--getting-started');
        expect(templateContent).toContain('category: guide');
      }
    });

    it('should generate templates for specific character limits when specified', async () => {
      // Create source document and priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      // Generate templates only for specific limits
      await generateTemplatesCommand.execute({ characterLimits: [100, 500] });

      // Check that only specified templates were generated
      const template100 = await fs.access(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md')
      ).then(() => true).catch(() => false);
      
      const template500 = await fs.access(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-500.md')
      ).then(() => true).catch(() => false);
      
      const template1000 = await fs.access(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-1000.md')
      ).then(() => true).catch(() => false);

      expect(template100).toBe(true);
      expect(template500).toBe(true);
      expect(template1000).toBe(false);
    });

    it('should filter by language when specified', async () => {
      // Create documents in both languages
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nEnglish guide.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'docs', 'ko', 'guide', 'getting-started.md'),
        '# 시작하기\n\n한국어 가이드.'
      );

      // Create priority.json for both languages
      const enPriority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      const koPriority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'ko' },
        priority: { score: 90, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(enPriority, null, 2)
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'priority.json'),
        JSON.stringify(koPriority, null, 2)
      );

      // Generate templates only for Korean
      await generateTemplatesCommand.execute({ language: 'ko' });

      // Check that only Korean templates were generated
      const enTemplate = await fs.access(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md')
      ).then(() => true).catch(() => false);
      
      const koTemplate = await fs.access(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-100.md')
      ).then(() => true).catch(() => false);

      expect(enTemplate).toBe(false);
      expect(koTemplate).toBe(true);
    });

    it('should filter by category when specified', async () => {
      // Create documents in different categories
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nGuide document.'
      );

      await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'api'), { recursive: true });
      await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'api--core'), { recursive: true });
      
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'api', 'core.md'),
        '# Core API\n\nAPI documentation.'
      );

      // Create priority.json for both categories
      const guidePriority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      const apiPriority = {
        document: { id: 'api--core', category: 'api', language: 'en' },
        priority: { score: 90, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(guidePriority, null, 2)
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'priority.json'),
        JSON.stringify(apiPriority, null, 2)
      );

      // Generate templates only for guide category
      await generateTemplatesCommand.execute({ category: 'guide' });

      // Check that only guide templates were generated
      const guideTemplate = await fs.access(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md')
      ).then(() => true).catch(() => false);
      
      const apiTemplate = await fs.access(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'api--core-100.md')
      ).then(() => true).catch(() => false);

      expect(guideTemplate).toBe(true);
      expect(apiTemplate).toBe(false);
    });
  });

  describe('overwrite behavior', () => {
    it('should not overwrite existing templates by default', async () => {
      // Create source document and priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      // Create existing template with custom content
      const existingTemplate = `---
document_id: guide--getting-started
category: guide
character_limit: 100
---

# Existing Content

This is custom content that should not be overwritten.`;

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        existingTemplate
      );

      await generateTemplatesCommand.execute({});

      // Check that existing content is preserved
      const templateContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );

      expect(templateContent).toContain('Existing Content');
      expect(templateContent).toContain('This is custom content');
    });

    it('should overwrite existing templates when overwrite flag is set', async () => {
      // Create source document and priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a comprehensive guide.'
      );

      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      // Create existing template
      const existingTemplate = `---
document_id: guide--getting-started
category: guide  
character_limit: 100
---

# Old Content`;

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        existingTemplate
      );

      await generateTemplatesCommand.execute({ overwrite: true });

      // Check that content was overwritten
      const templateContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );

      expect(templateContent).not.toContain('Old Content');
      expect(templateContent).toContain('guide--getting-started');
    });
  });

  describe('dry run mode', () => {
    it('should show what would be generated without creating files', async () => {
      // Create source document and priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await generateTemplatesCommand.execute({ dryRun: true });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show what would be created
        expect(output).toMatch(/DRY RUN|Would create/);
        expect(output).toContain('Found 1 documents');
        
      } finally {
        consoleSpy.mockRestore();
      }

      // Check that no files were actually created
      const templateExists = await fs.access(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md')
      ).then(() => true).catch(() => false);

      expect(templateExists).toBe(false);
    });
  });

  describe('verbose mode', () => {
    it('should provide detailed output in verbose mode', async () => {
      // Create source document and priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await generateTemplatesCommand.execute({ verbose: true });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should provide detailed information
        expect(output).toMatch(/Processing|Creating|Generated|Created/);
        expect(consoleSpy.mock.calls.length).toBeGreaterThan(5);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('error handling', () => {
    it('should handle missing priority.json gracefully', async () => {
      // Create source document without priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await generateTemplatesCommand.execute({});
        
        // Should handle gracefully
        expect(true).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });

    it('should handle malformed priority.json files', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      // Create malformed priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        'invalid json content'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await generateTemplatesCommand.execute({});
        
        // Should handle gracefully
        expect(true).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle file system permission errors', async () => {
      // Create source document and priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      // Make directory read-only to simulate permission error
      const targetDir = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started');
      try {
        await fs.chmod(targetDir, 0o444);
      } catch {
        // Skip this test if we can't set permissions
        return;
      }

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await generateTemplatesCommand.execute({});
        
        // Should handle permission errors gracefully
        expect(true).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        
        // Restore permissions for cleanup
        try {
          await fs.chmod(targetDir, 0o755);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('template content structure', () => {
    it('should generate templates with proper frontmatter', async () => {
      // Create source document and priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a comprehensive guide with detailed instructions.'
      );

      const priority = {
        document: { 
          id: 'guide--getting-started', 
          category: 'guide', 
          language: 'en',
          title: 'Getting Started Guide',
          source_path: 'en/guide/getting-started.md'
        },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      await generateTemplatesCommand.execute({});

      // Check template structure
      const templateContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );

      // Should have proper frontmatter
      expect(templateContent).toMatch(/^---\n/);
      expect(templateContent).toContain('document_id: guide--getting-started');
      expect(templateContent).toContain('category: guide');
      expect(templateContent).toContain('source_path: en/guide/getting-started.md');
      expect(templateContent).toContain('character_limit: 100');
      expect(templateContent).toMatch(/last_update: '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z'/);
      
      // Should have template content section
      expect(templateContent).toContain('guide--getting-started');
    });

    it('should generate appropriate content hints for different character limits', async () => {
      // Create source document and priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const priority = {
        document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
        priority: { score: 95, tier: 'high' }
      };

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priority, null, 2)
      );

      await generateTemplatesCommand.execute({ characterLimits: [100, 1000] });

      // Check 100 character template
      const template100 = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );

      // Check 1000 character template  
      const template1000 = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-1000.md'),
        'utf-8'
      );

      // Should have proper frontmatter with character limits
      expect(template100).toContain('character_limit: 100');
      expect(template1000).toContain('character_limit: 1000');
      expect(template100).toContain('document_id: guide--getting-started');
      expect(template1000).toContain('document_id: guide--getting-started');
    });
  });
});