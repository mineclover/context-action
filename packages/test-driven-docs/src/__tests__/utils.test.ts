/**
 * @fileoverview Tests for utility functions
 */

import {
  formatApiName,
  formatCategoryName,
  getCategoryDescription,
  getComplexityDescription,
  sanitizePath,
  extractPackageName,
  getRelativePath,
  isValidApiPattern,
  extractMeaningfulLines,
  calculateCodeMetrics,
  validateConfig,
  generateExampleId,
  deepMerge
} from '../utils/index.js';

describe('Utils', () => {
  describe('formatApiName', () => {
    it('should format API name for file output', () => {
      expect(formatApiName('createActionContext')).toBe('createactioncontext');
      expect(formatApiName('useStore-Value')).toBe('usestorevalue');
      expect(formatApiName('My_Custom_API')).toBe('mycustomapi');
      expect(formatApiName('API123')).toBe('api123');
    });

    it('should handle empty and special strings', () => {
      expect(formatApiName('')).toBe('');
      expect(formatApiName('!!!')).toBe('');
      expect(formatApiName('123')).toBe('123');
    });
  });

  describe('formatCategoryName', () => {
    it('should format category names for display', () => {
      expect(formatCategoryName('basic-usage')).toBe('Basic Usage');
      expect(formatCategoryName('advanced-patterns')).toBe('Advanced Patterns');
      expect(formatCategoryName('error-handling')).toBe('Error Handling');
      expect(formatCategoryName('performance')).toBe('Performance');
      expect(formatCategoryName('integration')).toBe('Integration');
      expect(formatCategoryName('async-patterns')).toBe('Async Patterns');
    });

    it('should handle unknown categories', () => {
      expect(formatCategoryName('unknown-category' as any)).toBe('unknown-category');
    });
  });

  describe('getCategoryDescription', () => {
    it('should return appropriate descriptions for categories', () => {
      expect(getCategoryDescription('basic-usage')).toContain('Simple, everyday usage');
      expect(getCategoryDescription('advanced-patterns')).toContain('Complex scenarios');
      expect(getCategoryDescription('error-handling')).toContain('error handling');
      expect(getCategoryDescription('performance')).toContain('Performance optimization');
      expect(getCategoryDescription('integration')).toContain('Integration with other');
      expect(getCategoryDescription('async-patterns')).toContain('Asynchronous operations');
    });

    it('should handle unknown categories', () => {
      expect(getCategoryDescription('unknown' as any)).toBe('Additional usage patterns');
    });
  });

  describe('getComplexityDescription', () => {
    it('should return descriptions for complexity levels', () => {
      expect(getComplexityDescription('simple')).toBe('Easy to understand and implement');
      expect(getComplexityDescription('moderate')).toBe('Intermediate level with some complexity');
      expect(getComplexityDescription('complex')).toBe('Advanced usage requiring careful consideration');
    });
  });

  describe('sanitizePath', () => {
    it('should normalize and sanitize file paths', () => {
      expect(sanitizePath('path\\to\\file')).toBe('path/to/file');
      expect(sanitizePath('path/to/../file')).toBe('path/file');
      expect(sanitizePath('./relative/path')).toBe('relative/path');
    });

    it('should handle already normalized paths', () => {
      expect(sanitizePath('path/to/file')).toBe('path/to/file');
      expect(sanitizePath('/absolute/path')).toBe('/absolute/path');
    });
  });

  describe('extractPackageName', () => {
    it('should extract package name from file path', () => {
      expect(extractPackageName('/project/packages/core/src/index.ts')).toBe('core');
      expect(extractPackageName('/packages/react/test.ts')).toBe('react');
      expect(extractPackageName('packages/test-driven-docs/cli.ts')).toBe('test-driven-docs');
    });

    it('should return unknown for invalid paths', () => {
      expect(extractPackageName('/src/index.ts')).toBe('unknown');
      expect(extractPackageName('/random/path/file.ts')).toBe('unknown');
      expect(extractPackageName('packages')).toBe('unknown');
    });
  });

  describe('getRelativePath', () => {
    it('should generate relative paths between files', () => {
      const from = '/project/src/component.ts';
      const to = '/project/src/utils/helper.ts';

      expect(getRelativePath(from, to)).toBe('utils/helper.ts');
    });

    it('should handle parent directories', () => {
      const from = '/project/src/deep/component.ts';
      const to = '/project/src/utils.ts';

      expect(getRelativePath(from, to)).toBe('../utils.ts');
    });

    it('should normalize backslashes', () => {
      const result = getRelativePath('/a/b/c.ts', '/a/d/e.ts');
      expect(result).not.toContain('\\');
      expect(result).toBe('../d/e.ts');
    });
  });

  describe('isValidApiPattern', () => {
    it('should identify valid API patterns', () => {
      expect(isValidApiPattern('const register = new ActionRegister();')).toBe(true);
      expect(isValidApiPattern('const { Provider } = createActionContext();')).toBe(true);
      expect(isValidApiPattern('const store = createStoreContext();')).toBe(true);
      expect(isValidApiPattern('useActionHandler("action", handler);')).toBe(true);
      expect(isValidApiPattern('const value = useStoreValue(store);')).toBe(true);
      expect(isValidApiPattern('const selected = useStoreSelector(store, selector);')).toBe(true);
      expect(isValidApiPattern('const store = createStore();')).toBe(true);
      expect(isValidApiPattern('const manager = new StoreManager();')).toBe(true);
    });

    it('should reject invalid patterns', () => {
      expect(isValidApiPattern('const value = 1;')).toBe(false);
      expect(isValidApiPattern('console.log("hello");')).toBe(false);
      expect(isValidApiPattern('expect(result).toBe(true);')).toBe(false);
    });
  });

  describe('extractMeaningfulLines', () => {
    it('should extract meaningful code lines', () => {
      const code = `
        // This is a comment
        const value = 1;

        /* Multi-line comment */
        const other = 2;
        * Another comment line
        return value + other;
      `;

      const meaningful = extractMeaningfulLines(code);

      expect(meaningful).toEqual([
        'const value = 1;',
        'const other = 2;',
        'return value + other;'
      ]);
    });

    it('should handle empty input', () => {
      expect(extractMeaningfulLines('')).toEqual([]);
      expect(extractMeaningfulLines('   \n  \n  ')).toEqual([]);
    });

    it('should filter out comments and empty lines', () => {
      const code = `
        // Single line comment

        const valid = true;
        /* Block comment */
        * JSDoc style
        // Another comment

        const alsoValid = false;
      `;

      const meaningful = extractMeaningfulLines(code);

      expect(meaningful).toHaveLength(2);
      expect(meaningful[0]).toBe('const valid = true;');
      expect(meaningful[1]).toBe('const alsoValid = false;');
    });
  });

  describe('calculateCodeMetrics', () => {
    it('should calculate basic code metrics', () => {
      const code = `
        const value = 1;
        if (value > 0) {
          console.log('positive');
        }
        for (let i = 0; i < 10; i++) {
          process(i);
        }
      `;

      const metrics = calculateCodeMetrics(code);

      expect(metrics.lines).toBeGreaterThan(1);
      expect(metrics.meaningfulLines).toBeGreaterThan(0);
      expect(metrics.conditionals).toBeGreaterThanOrEqual(1); // if statement
      expect(metrics.loops).toBeGreaterThanOrEqual(1); // for loop
    });

    it('should count async operations', () => {
      const code = `
        async function test() {
          const result = await fetch('/api');
          return Promise.resolve(result);
        }
      `;

      const metrics = calculateCodeMetrics(code);

      expect(metrics.asyncOperations).toBeGreaterThanOrEqual(3); // async, await, Promise
    });

    it('should handle empty code', () => {
      const metrics = calculateCodeMetrics('');

      expect(metrics.lines).toBe(1); // Empty string has 1 line
      expect(metrics.meaningfulLines).toBe(0);
      expect(metrics.asyncOperations).toBe(0);
      expect(metrics.conditionals).toBe(0);
      expect(metrics.loops).toBe(0);
    });

    it('should count various loop types', () => {
      const code = `
        for (let i = 0; i < 10; i++) {}
        while (condition) {}
        array.forEach(item => {});
        array.map(x => x * 2);
        array.filter(x => x > 0);
        array.reduce((a, b) => a + b);
      `;

      const metrics = calculateCodeMetrics(code);

      expect(metrics.loops).toBe(6);
    });

    it('should count conditional statements', () => {
      const code = `
        if (a) return b;
        else if (c) return d;
        else return e;
        const result = condition ? value1 : value2;
        switch (type) {
          case 'A': return 1;
          case 'B': return 2;
        }
      `;

      const metrics = calculateCodeMetrics(code);

      expect(metrics.conditionals).toBeGreaterThanOrEqual(6); // if, else, ?, switch, case, case
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config = {
        packagesDir: './packages',
        packages: ['core', 'react'],
        outputDir: './docs',
        languages: ['en', 'ko']
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const config = {};

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors[0]).toContain('packagesDir');
      expect(result.errors[1]).toContain('packages');
      expect(result.errors[2]).toContain('outputDir');
      expect(result.errors[3]).toContain('languages');
    });

    it('should detect invalid types', () => {
      const config = {
        packagesDir: 123,
        packages: 'not-array',
        outputDir: null,
        languages: []
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('should detect empty arrays', () => {
      const config = {
        packagesDir: './packages',
        packages: [],
        outputDir: './docs',
        languages: []
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('packages'))).toBe(true);
      expect(result.errors.some(err => err.includes('languages'))).toBe(true);
    });
  });

  describe('generateExampleId', () => {
    it('should generate unique identifiers for examples', () => {
      expect(generateExampleId('Should create action context', 'react'))
        .toBe('react-should-create-action-context');

      expect(generateExampleId('Test: Complex Scenario!', 'core'))
        .toBe('core-test-complex-scenario');

      expect(generateExampleId('Multiple   spaces   here', 'package'))
        .toBe('package-multiple-spaces-here');
    });

    it('should handle special characters and normalize', () => {
      expect(generateExampleId('Test@#$%^&*()Example', 'test'))
        .toBe('test-testexample');

      expect(generateExampleId('', 'package'))
        .toBe('package-');
    });
  });

  describe('deepMerge', () => {
    it('should merge simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
      expect(target).toEqual({ a: 1, b: 2 }); // Original should not be modified
    });

    it('should merge nested objects recursively', () => {
      const target = {
        level1: {
          a: 1,
          level2: {
            b: 2,
            c: 3
          }
        }
      };

      const source = {
        level1: {
          level2: {
            c: 4,
            d: 5
          },
          e: 6
        }
      };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        level1: {
          a: 1,
          level2: {
            b: 2,
            c: 4,
            d: 5
          },
          e: 6
        }
      });
    });

    it('should handle arrays as primitive values', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5, 6] };

      const result = deepMerge(target, source);

      expect(result.arr).toEqual([4, 5, 6]);
    });

    it('should handle undefined values', () => {
      const target = { a: 1, b: 2 };
      const source = { b: undefined, c: 3 };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should handle mixed types', () => {
      const target = { a: { nested: true } };
      const source = { a: 'string' };

      const result = deepMerge(target, source);

      expect(result.a).toBe('string');
    });

    it('should handle empty objects', () => {
      expect(deepMerge({}, { a: 1 })).toEqual({ a: 1 });
      expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
      expect(deepMerge({}, {})).toEqual({});
    });
  });
});