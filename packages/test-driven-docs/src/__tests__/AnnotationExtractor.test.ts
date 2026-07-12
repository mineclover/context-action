/**
 * @fileoverview Tests for AnnotationExtractor
 */

import { AnnotationExtractor } from '../extractors/AnnotationExtractor.js';

describe('AnnotationExtractor', () => {
  let extractor: AnnotationExtractor;

  beforeEach(() => {
    extractor = new AnnotationExtractor();
  });

  describe('annotation parsing', () => {
    it('should extract basic @doc-extract annotation', () => {
      const testContent = `
        // @doc-extract: basic-usage
        it('should work', () => {
          const result = doSomething();
          expect(result).toBeTruthy();
        });
      `;

      const result = extractor.extractAnnotations(testContent);

      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0]).toEqual({
        extractId: 'basic-usage',
        category: 'basic-usage',
        priority: 'medium',
        description: undefined,
        lineNumber: expect.any(Number)
      });
    });

    it('should extract full annotation with all properties', () => {
      const testContent = `
        // @doc-extract: advanced-patterns
        // @doc-category: advanced
        // @doc-priority: high
        // @doc-description: Complex async operations
        it('should handle complex scenarios', () => {
          // test code
        });
      `;

      const result = extractor.extractAnnotations(testContent);

      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0]).toEqual({
        extractId: 'advanced-patterns',
        category: 'advanced',
        priority: 'high',
        description: 'Complex async operations',
        lineNumber: expect.any(Number)
      });
    });

    it('should handle multiple annotations in same file', () => {
      const testContent = `
        // @doc-extract: example-1
        it('first test', () => {});

        // @doc-extract: example-2
        // @doc-category: patterns
        it('second test', () => {});
      `;

      const result = extractor.extractAnnotations(testContent);

      expect(result.annotations).toHaveLength(2);
      expect(result.annotations[0].extractId).toBe('example-1');
      expect(result.annotations[1].extractId).toBe('example-2');
      expect(result.annotations[1].category).toBe('patterns');
    });

    it('should ignore malformed annotations', () => {
      const testContent = `
        // @doc-extract
        // @doc-priority
        it('test with malformed annotations', () => {});

        // @doc-extract: valid-example
        it('valid test', () => {});
      `;

      const result = extractor.extractAnnotations(testContent);

      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0].extractId).toBe('valid-example');
    });
  });

  describe('test code extraction', () => {
    it('should extract test code with annotations', () => {
      const testContent = `
        // @doc-extract: basic-usage
        it('should create context', () => {
          const context = createContext();
          expect(context).toBeDefined();
        });
      `;

      const result = extractor.extractTestsWithAnnotations(testContent);

      expect(result.tests).toHaveLength(1);
      expect(result.tests[0]).toEqual(expect.objectContaining({
        annotation: {
          extractId: 'basic-usage',
          category: 'basic-usage',
          priority: 'medium',
          description: undefined,
          lineNumber: expect.any(Number)
        },
        testCode: expect.stringContaining('const context = createContext();'),
        testName: 'should create context',
        cleanedCode: expect.stringContaining('const context = createContext();'),
        filePath: 'test-file'
      }));
    });

    it('should clean test artifacts from extracted code', () => {
      const testContent = `
        // @doc-extract: cleaned-example
        it('should be cleaned', () => {
          const mock = jest.fn();
          const result = doSomething();
          expect(result).toBeTruthy();
          expect(mock).toHaveBeenCalled();
        });
      `;

      const result = extractor.extractTestsWithAnnotations(testContent);
      const cleanedCode = result.tests[0].cleanedCode;

      expect(cleanedCode).not.toContain('jest.fn()');
      expect(cleanedCode).not.toContain('expect(');
      expect(cleanedCode).toContain('const result = doSomething();');
    });
  });

  describe('error handling', () => {
    it('should handle empty content gracefully', () => {
      const result = extractor.extractAnnotations('');

      expect(result.annotations).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle content without annotations', () => {
      const testContent = `
        it('regular test', () => {
          expect(true).toBe(true);
        });
      `;

      const result = extractor.extractAnnotations(testContent);

      expect(result.annotations).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect parsing errors', () => {
      const testContent = `
        // @doc-extract: valid
        it('test', () => {});

        // Invalid syntax that might cause issues
        it('broken test', () => {
          const unclosed = {
        });
      `;

      expect(() => {
        extractor.extractAnnotations(testContent);
      }).not.toThrow();
    });
  });
});
