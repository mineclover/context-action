import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { FillTemplatesCommand } from '../../src/cli/commands/FillTemplatesCommand.js';
import { CLIConfig } from '../../src/cli/types/CLITypes.js';

describe('FillTemplatesCommand', () => {
  let fillTemplatesCommand: FillTemplatesCommand;
  let testDataDir: string;
  let config: CLIConfig;

  beforeEach(async () => {
    // Setup test directory
    testDataDir = path.join(__dirname, 'test-workspace-fill-templates');
    
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
        characterLimits: [100, 300, 1000, 2000, 5000],
        defaultLanguage: 'en',
        outputFormat: 'txt'
      },
      categories: {
        guide: { priority: 95 },
        api: { priority: 90 },
        concept: { priority: 85 }
      }
    } as CLIConfig;

    fillTemplatesCommand = new FillTemplatesCommand(config);

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

  describe('basic functionality', () => {
    it('should fill empty templates with source document content', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a comprehensive guide for getting started with the framework.\n\n## Installation\n\nFirst, install the dependencies:\n\n```bash\nnpm install\n```\n\n## Configuration\n\nConfigure your environment by creating a config file.'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
          priority: { score: 95 }
        }, null, 2)
      );

      // Create empty template files
      const templates = [
        { limit: 100, content: '---\ndocument_id: guide--getting-started\ncategory: guide\ncharacter_limit: 100\n---\n\n# Getting Started\n\n[Content to be filled]' },
        { limit: 300, content: '---\ndocument_id: guide--getting-started\ncategory: guide\ncharacter_limit: 300\n---\n\n# Getting Started\n\n[Content to be filled]' },
        { limit: 1000, content: '---\ndocument_id: guide--getting-started\ncategory: guide\ncharacter_limit: 1000\n---\n\n# Getting Started\n\n[Content to be filled]' }
      ];

      for (const template of templates) {
        await fs.writeFile(
          path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', `guide--getting-started-${template.limit}.md`),
          template.content
        );
      }

      await fillTemplatesCommand.execute({});

      // Verify templates were filled
      for (const template of templates) {
        const filledContent = await fs.readFile(
          path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', `guide--getting-started-${template.limit}.md`),
          'utf-8'
        );
        
        // Should contain actual content, not placeholder
        expect(filledContent).not.toContain('[Content to be filled]');
        expect(filledContent).toContain('Getting Started');
        expect(filledContent.length).toBeGreaterThan(template.content.length);
      }
    });

    it('should respect character limits when filling templates', async () => {
      // Create source document with long content
      const longContent = '# Getting Started\n\n' + 'This is a very long guide. '.repeat(50) + 'It contains lots of detailed information about how to use the framework effectively.';
      
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        longContent
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
          priority: { score: 95 }
        }, null, 2)
      );

      // Create template with 100 character limit
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\ncategory: guide\ncharacter_limit: 100\n---\n\n[Content to be filled]'
      );

      await fillTemplatesCommand.execute({});

      // Check that filled content respects character limit
      const filledContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );

      // Extract content after frontmatter
      const contentMatch = filledContent.match(/---[\s\S]*?---\s*([\s\S]*)/);
      const actualContent = contentMatch ? contentMatch[1].trim() : '';
      
      expect(actualContent.length).toBeLessThanOrEqual(100);
      expect(actualContent).toContain('Getting Started');
    });

    it('should preserve markdown formatting in filled content', async () => {
      // Create source document with markdown formatting
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\n**Important**: This is *emphasized* text.\n\n- List item 1\n- List item 2\n\n```javascript\nconst example = "code";\n```\n\n[Link](https://example.com)'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide', language: 'en' },
          priority: { score: 95 }
        }, null, 2)
      );

      // Create template
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-1000.md'),
        '---\ndocument_id: guide--getting-started\ncategory: guide\ncharacter_limit: 1000\n---\n\n[Content to be filled]'
      );

      await fillTemplatesCommand.execute({});

      const filledContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-1000.md'),
        'utf-8'
      );

      // Should preserve markdown formatting
      expect(filledContent).toContain('**Important**');
      expect(filledContent).toContain('*emphasized*');
      expect(filledContent).toContain('- List item');
      expect(filledContent).toContain('```javascript');
      expect(filledContent).toContain('[Link](https://example.com)');
    });
  });

  describe('filtering options', () => {
    it('should filter by category', async () => {
      // Create documents in different categories
      await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'api'), { recursive: true });
      await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'api--core'), { recursive: true });

      // Create guide document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Guide Content'
      );

      // Create API document  
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'api', 'core.md'),
        '# API Content'
      );

      // Create templates for both
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n[Guide content]'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'api--core-100.md'),
        '---\ndocument_id: api--core\n---\n\n[API content]'
      );

      // Priority files
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({ document: { id: 'guide--getting-started', category: 'guide' }, priority: { score: 95 } })
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'priority.json'),
        JSON.stringify({ document: { id: 'api--core', category: 'api' }, priority: { score: 90 } })
      );

      // Execute with guide category filter
      await fillTemplatesCommand.execute({ category: 'guide' });

      // Guide template should be filled
      const guideContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );
      expect(guideContent).not.toContain('[Guide content]');

      // API template should remain unchanged
      const apiContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'api--core', 'api--core-100.md'),
        'utf-8'
      );
      expect(apiContent).toContain('[API content]');
    });

    it('should filter by language', async () => {
      // Create Korean source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'ko', 'guide', 'getting-started.md'),
        '# 시작하기\n\n프레임워크 사용법에 대한 종합 가이드입니다.'
      );

      // Create Korean template
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-200.md'),
        '---\ndocument_id: guide--getting-started\nlanguage: ko\n---\n\n[한국어 내용]'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide', language: 'ko' },
          priority: { score: 95 }
        })
      );

      await fillTemplatesCommand.execute({ language: 'ko' });

      const filledContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-200.md'),
        'utf-8'
      );

      expect(filledContent).not.toContain('[한국어 내용]');
      expect(filledContent).toContain('시작하기');
      expect(filledContent).toContain('프레임워크');
    });

    it('should filter by character limit', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nContent for testing character limits.'
      );

      // Create multiple templates with different limits
      const limits = [100, 300, 1000];
      for (const limit of limits) {
        await fs.writeFile(
          path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', `guide--getting-started-${limit}.md`),
          `---\ndocument_id: guide--getting-started\ncharacter_limit: ${limit}\n---\n\n[Content ${limit}]`
        );
      }

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      // Execute with specific character limit
      await fillTemplatesCommand.execute({ characterLimit: 300 });

      // Only 300 character template should be filled
      const content300 = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-300.md'),
        'utf-8'
      );
      expect(content300).not.toContain('[Content 300]');

      // Other templates should remain unchanged
      const content100 = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );
      expect(content100).toContain('[Content 100]');
    });
  });

  describe('dry run mode', () => {
    it('should show what would be filled without making changes', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nTest content.'
      );

      // Create template
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n[Content to be filled]'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        await fillTemplatesCommand.execute({ dryRun: true });

        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain('DRY RUN - No files will be modified');
        
      } finally {
        consoleSpy.mockRestore();
      }

      // Template should remain unchanged
      const templateContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );
      expect(templateContent).toContain('[Content to be filled]');
    });
  });

  describe('overwrite behavior', () => {
    it('should skip already filled templates by default', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nNew updated content.'
      );

      // Create already filled template
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n# Getting Started\n\nOld existing content that was already filled.'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      await fillTemplatesCommand.execute({});

      // Content should remain unchanged (not overwritten)
      const templateContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );
      expect(templateContent).toContain('Old existing content');
      expect(templateContent).not.toContain('New updated content');
    });

    it('should overwrite existing templates when overwrite option is true', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nNew updated content for overwrite test.'
      );

      // Create already filled template
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n# Getting Started\n\nOld existing content.'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      await fillTemplatesCommand.execute({ overwrite: true });

      // Content should be updated
      const templateContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );
      expect(templateContent).toContain('New updated content');
      expect(templateContent).not.toContain('Old existing content');
    });
  });

  describe('error handling', () => {
    it('should handle missing source documents gracefully', async () => {
      // Create template without source document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n[Content to be filled]'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      await fillTemplatesCommand.execute({});

      // Command should complete without error
      expect(true).toBe(true);
    });

    it('should handle missing priority.json gracefully', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nContent.'
      );

      // Create template without priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n[Content to be filled]'
      );

      await fillTemplatesCommand.execute({});

      // Command should complete without error
      expect(true).toBe(true);
    });

    it('should handle malformed template files', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nContent.'
      );

      // Create malformed template (invalid frontmatter)
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ninvalid: yaml: [unclosed\n---\n\n[Content to be filled]'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await fillTemplatesCommand.execute({});
        
        // Should handle error gracefully
        expect(true).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle file permission errors', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nContent.'
      );

      // Create template
      const templatePath = path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md');
      await fs.writeFile(templatePath, '---\ndocument_id: guide--getting-started\n---\n\n[Content]');

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      // Make template file read-only
      try {
        await fs.chmod(templatePath, 0o444);
      } catch {
        // Skip this test if we can't set permissions
        return;
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await fillTemplatesCommand.execute({ overwrite: true });
        
        // Should handle permission error gracefully
        expect(true).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
        
        // Restore permissions for cleanup
        try {
          await fs.chmod(templatePath, 0o644);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('verbose mode', () => {
    it('should provide detailed output in verbose mode', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nDetailed content.'
      );

      // Create template
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n[Content to be filled]'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        await fillTemplatesCommand.execute({ verbose: true });
        
        // Should provide detailed output
        expect(consoleSpy.mock.calls.length).toBeGreaterThan(5);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('content processing', () => {
    it('should handle empty source documents', async () => {
      // Create empty source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        ''
      );

      // Create template
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n[Content to be filled]'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      await fillTemplatesCommand.execute({});

      // Should handle empty content gracefully
      const templateContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );

      // Template might remain unchanged or get minimal content
      expect(templateContent.length).toBeGreaterThan(0);
    });

    it('should handle source documents with only frontmatter', async () => {
      // Create source document with only frontmatter
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '---\ntitle: Getting Started\ntags: [guide, setup]\n---\n\n'
      );

      // Create template
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n[Content to be filled]'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        })
      );

      await fillTemplatesCommand.execute({});

      // Should extract title from frontmatter
      const templateContent = await fs.readFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        'utf-8'
      );

      expect(templateContent).toContain('Getting Started');
    });
  });
});