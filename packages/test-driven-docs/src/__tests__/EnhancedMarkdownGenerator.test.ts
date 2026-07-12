/**
 * @fileoverview Tests for EnhancedMarkdownGenerator
 */

import { EnhancedMarkdownGenerator } from '../generators/EnhancedMarkdownGenerator.js';

describe('EnhancedMarkdownGenerator', () => {
  let generator: EnhancedMarkdownGenerator;

  beforeEach(() => {
    generator = new EnhancedMarkdownGenerator({
      githubRepo: 'https://github.com/test/repo'
    });
  });

  describe('markdown generation', () => {
    it('should generate enhanced markdown for API with examples', () => {
      const apiName = 'createActionContext';
      const examples = [
        {
          id: 'basic-usage',
          category: 'getting-started',
          priority: 'high',
          description: 'Basic action context creation',
          code: 'const { Provider } = createActionContext("Test");',
          testFile: 'packages/react/__tests__/createActionContext.test.tsx'
        }
      ];

      const result = generator.generateEnhancedMarkdown(apiName, examples);

      expect(result).toContain('# createActionContext');
      expect(result).toContain('## Getting Started');
      expect(result).toContain('### Basic action context creation');
      expect(result).toContain('const { Provider } = createActionContext("Test");');
      expect(result).toContain('**Source:** [createActionContext.test.tsx]');
      expect(result).toContain('GitHub repository');
    });

    it('should organize examples by category', () => {
      const examples = [
        {
          id: 'basic',
          category: 'getting-started',
          priority: 'high',
          description: 'Basic usage',
          code: 'basic code',
          testFile: 'test1.tsx'
        },
        {
          id: 'advanced',
          category: 'advanced',
          priority: 'medium',
          description: 'Advanced usage',
          code: 'advanced code',
          testFile: 'test2.tsx'
        }
      ];

      const result = generator.generateEnhancedMarkdown('TestAPI', examples);

      expect(result).toContain('## Getting Started');
      expect(result).toContain('## Advanced');
      expect(result.indexOf('## Getting Started')).toBeLessThan(result.indexOf('## Advanced'));
    });

    it('should sort examples by priority within categories', () => {
      const examples = [
        {
          id: 'medium',
          category: 'getting-started',
          priority: 'medium',
          description: 'Medium priority',
          code: 'medium code',
          testFile: 'test1.tsx'
        },
        {
          id: 'high',
          category: 'getting-started',
          priority: 'high',
          description: 'High priority',
          code: 'high code',
          testFile: 'test2.tsx'
        }
      ];

      const result = generator.generateEnhancedMarkdown('TestAPI', examples);

      const highIndex = result.indexOf('High priority');
      const mediumIndex = result.indexOf('Medium priority');

      expect(highIndex).toBeLessThan(mediumIndex);
    });

    it('should generate GitHub links when repo is provided', () => {
      const examples = [{
        id: 'test',
        category: 'basic',
        priority: 'medium',
        code: 'test code',
        testFile: 'packages/core/test.ts'
      }];

      const result = generator.generateEnhancedMarkdown('TestAPI', examples);

      expect(result).toContain('[test.ts](https://github.com/test/repo/blob/main/packages/core/test.ts)');
    });

    it('should handle examples without GitHub repo', () => {
      const noRepoGenerator = new EnhancedMarkdownGenerator({});
      const examples = [{
        id: 'test',
        category: 'basic',
        priority: 'medium',
        code: 'test code',
        testFile: 'test.ts'
      }];

      const result = noRepoGenerator.generateEnhancedMarkdown('TestAPI', examples);

      expect(result).toContain('**Source:** test.ts');
      expect(result).not.toContain('https://github.com');
    });
  });

  describe('validation sections', () => {
    it('should include validation commands in generated docs', () => {
      const examples = [{
        id: 'test',
        category: 'basic',
        priority: 'medium',
        code: 'test code',
        testFile: 'test.ts'
      }];

      const result = generator.generateEnhancedMarkdown('TestAPI', examples);

      expect(result).toContain('## Validation');
      expect(result).toContain('npm --prefix packages/test-driven-docs run build');
      expect(result).toContain('generate --enhanced --packages react');
      expect(result).toContain('validate --consistency --packages react');
    });

    it('should include update instructions', () => {
      const examples = [{
        id: 'test',
        category: 'basic',
        priority: 'medium',
        code: 'test code',
        testFile: 'test.ts'
      }];

      const result = generator.generateEnhancedMarkdown('TestAPI', examples);

      expect(result).toContain('## Update Documentation');
      expect(result).toContain('@doc-extract');
      expect(result).toContain('@doc-category');
      expect(result).toContain('@doc-priority');
    });
  });

  describe('category mapping', () => {
    it('should map known categories to display names', () => {
      const examples = [
        { id: '1', category: 'getting-started', priority: 'high', code: 'code', testFile: 'test.ts' },
        { id: '2', category: 'advanced', priority: 'medium', code: 'code', testFile: 'test.ts' },
        { id: '3', category: 'patterns', priority: 'medium', code: 'code', testFile: 'test.ts' }
      ];

      const result = generator.generateEnhancedMarkdown('TestAPI', examples);

      expect(result).toContain('## Getting Started');
      expect(result).toContain('## Advanced');
      expect(result).toContain('## Patterns');
    });

    it('should handle unknown categories gracefully', () => {
      const examples = [{
        id: 'test',
        category: 'unknown-category',
        priority: 'medium',
        code: 'test code',
        testFile: 'test.ts'
      }];

      const result = generator.generateEnhancedMarkdown('TestAPI', examples);

      expect(result).toContain('## Unknown Category');
    });
  });

  describe('error handling', () => {
    it('should handle empty examples array', () => {
      const result = generator.generateEnhancedMarkdown('TestAPI', []);

      expect(result).toContain('# TestAPI');
      expect(result).toContain('No examples found');
    });

    it('should handle examples with missing properties', () => {
      const examples = [{
        id: 'test',
        category: 'basic',
        priority: 'medium',
        code: 'test code'
        // Missing testFile
      }];

      expect(() => {
        generator.generateEnhancedMarkdown('TestAPI', examples);
      }).not.toThrow();
    });
  });
});
