/**
 * @fileoverview Tests for TestParser
 */

import { TestParser } from '../parsers/TestParser.js';
import fs from 'fs/promises';

// Mock fs
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('TestParser', () => {
  let parser: TestParser;

  beforeEach(() => {
    parser = new TestParser();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default options when none provided', () => {
      const defaultParser = new TestParser();
      expect(defaultParser).toBeDefined();
    });

    it('should merge provided options with defaults', () => {
      const customParser = new TestParser({
        cleanMocks: false,
        extractTypes: false
      });
      expect(customParser).toBeDefined();
    });
  });

  describe('parseTestFile', () => {
    const sampleTestContent = `
      /**
       * @fileoverview Sample test file
       */
      import { createActionContext } from '@context-action/react';
      import { jest } from '@jest/globals';

      interface UserActions {
        updateUser: { id: string; name: string };
      }

      describe('User Actions', () => {
        let actionRegister: ActionRegister;

        beforeEach(() => {
          actionRegister = new ActionRegister();
        });

        it('should create action context and dispatch actions', async () => {
          const handler = jest.fn();
          actionRegister.register('updateUser', handler);

          await actionRegister.dispatch('updateUser', { id: '1', name: 'John' });

          expect(handler).toHaveBeenCalled();
        });

        it('should handle complex scenarios', async () => {
          // More complex test
          const result = await complexOperation();
          expect(result).toBeDefined();
        });
      });
    `;

    beforeEach(() => {
      mockFs.readFile.mockResolvedValue(sampleTestContent);
    });

    it('should parse test file and return structured data', async () => {
      const result = await parser.parseTestFile('/path/to/test.ts', 'test-package');

      expect(result).toEqual({
        metadata: expect.objectContaining({
          fileName: 'test.ts',
          mainSuite: 'User Actions',
          testCount: 2
        }),
        imports: expect.arrayContaining([
          expect.objectContaining({
            module: '@context-action/react',
            isLocal: false,
            isTestUtility: false
          })
        ]),
        interfaces: expect.arrayContaining([
          expect.objectContaining({
            name: 'UserActions',
            type: 'interface'
          })
        ]),
        setup: expect.arrayContaining([
          expect.objectContaining({
            type: 'beforeEach',
            isAsync: false
          })
        ]),
        examples: expect.any(Array),
        packageName: 'test-package',
        filePath: '/path/to/test.ts'
      });
    });

    it('should categorize examples when option is enabled', async () => {
      const parserWithCategorization = new TestParser({ categorizeExamples: true });

      const result = await parserWithCategorization.parseTestFile('/path/to/test.ts', 'test-package');

      expect(result).toHaveProperty('categorizedExamples');
      expect(result.categorizedExamples).toBeDefined();
    });

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(parser.parseTestFile('/invalid/path.ts', 'package'))
        .rejects.toThrow('File not found');
    });
  });

  describe('extractMetadata', () => {
    it('should extract main suite name from describe block', async () => {
      const content = `describe('Main Test Suite', () => {});`;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.metadata.mainSuite).toBe('Main Test Suite');
    });

    it('should count test cases', async () => {
      const content = `
        it('test 1', () => {});
        test('test 2', () => {});
        it('test 3', () => {});
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.metadata.testCount).toBe(3);
    });

    it('should extract file description from JSDoc comments', async () => {
      const content = `
        /**
         * This is a file description
         * With multiple lines
         * @category test
         */
        describe('Test', () => {});
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.metadata.description).toContain('This is a file description');
      expect(result.metadata.tags).toContain('category');
    });

    it('should handle missing describe block', async () => {
      const content = `it('standalone test', () => {});`;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.metadata.mainSuite).toBeNull();
    });
  });

  describe('extractImports', () => {
    it('should extract and categorize import statements', async () => {
      const content = `
        import React from 'react';
        import { createActionContext } from '@context-action/react';
        import { helper } from './utils';
        import { jest } from '@jest/globals';
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.imports).toHaveLength(3); // Should exclude jest import

      const localImport = result.imports.find(imp => imp.module === './utils');
      expect(localImport?.isLocal).toBe(true);

      const externalImport = result.imports.find(imp => imp.module === 'react');
      expect(externalImport?.isLocal).toBe(false);
    });

    it('should filter out test utility imports', async () => {
      const content = `
        import { render } from '@testing-library/react';
        import { jest } from '@jest/globals';
        import { myFunction } from './utils';
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.imports).toHaveLength(1);
      expect(result.imports[0].module).toBe('./utils');
    });
  });

  describe('extractInterfaces', () => {
    it('should extract interface definitions', async () => {
      const content = `
        interface UserActions {
          updateUser: { id: string; name: string };
          deleteUser: { id: string };
        }

        interface Settings extends BaseSettings {
          theme: string;
        }
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.interfaces).toHaveLength(2);

      const userActions = result.interfaces.find(int => int.name === 'UserActions');
      expect(userActions?.type).toBe('interface');
      expect(userActions?.body).toContain('updateUser');
    });

    it('should extract type aliases', async () => {
      const content = `
        type Status = 'active' | 'inactive';
        type UserID = string;
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.interfaces).toHaveLength(2);

      const statusType = result.interfaces.find(int => int.name === 'Status');
      expect(statusType?.type).toBe('type');
    });
  });

  describe('extractSetup', () => {
    it('should extract setup code from beforeEach/beforeAll', async () => {
      const content = `
        beforeEach(() => {
          setup();
        });

        beforeAll(async () => {
          await globalSetup();
        });

        afterEach(() => {
          cleanup();
        });
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.setup).toHaveLength(3);

      const beforeEach = result.setup.find(s => s.type === 'beforeEach');
      expect(beforeEach?.isAsync).toBe(false);

      const beforeAll = result.setup.find(s => s.type === 'beforeAll');
      expect(beforeAll?.isAsync).toBe(true);
    });
  });

  describe('extractExamples', () => {
    it('should extract test examples with metadata', async () => {
      const content = `
        it('should create basic action context', () => {
          const { Provider } = createActionContext('test');
          expect(Provider).toBeDefined();
        });

        it('should handle async operations', async () => {
          const result = await asyncOperation();
          expect(result).toBeTruthy();
        });
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.examples).toHaveLength(2);

      const basicExample = result.examples.find(ex => ex.description.includes('basic'));
      expect(basicExample?.isAsync).toBe(false);
      expect(basicExample?.category).toBe('basic-usage');

      const asyncExample = result.examples.find(ex => ex.description.includes('async'));
      expect(asyncExample?.isAsync).toBe(true);
    });

    it('should infer categories from test descriptions', async () => {
      const content = `
        it('should handle error cases properly', () => {
          expect(() => throwError()).toThrow();
        });

        it('should demonstrate advanced patterns', () => {
          advancedOperation();
        });

        it('should test performance characteristics', () => {
          measurePerformance();
        });
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      const errorExample = result.examples.find(ex => ex.description.includes('error'));
      expect(errorExample?.category).toBe('error-handling');

      const advancedExample = result.examples.find(ex => ex.description.includes('advanced'));
      expect(advancedExample?.category).toBe('advanced-patterns');

      const perfExample = result.examples.find(ex => ex.description.includes('performance'));
      expect(perfExample?.category).toBe('performance');
    });

    it('should extract APIs used in test code', async () => {
      const content = `
        it('should use multiple APIs', () => {
          const register = new ActionRegister();
          const { Provider } = createActionContext('test');
          const store = createStoreContext('store', {});
          const value = useStoreValue(store);
        });
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      const example = result.examples[0];
      expect(example.apis).toContain('ActionRegister');
      expect(example.apis).toContain('createActionContext');
      expect(example.apis).toContain('createStoreContext');
      expect(example.apis).toContain('useStoreValue');
    });

    it('should assess code complexity', async () => {
      const simpleContent = `
        it('simple test', () => {
          const value = 1;
        });
      `;
      mockFs.readFile.mockResolvedValue(simpleContent);

      const simpleResult = await parser.parseTestFile('/test.ts', 'package');
      expect(simpleResult.examples[0]?.complexity).toBe('simple');

      const complexContent = `
        it('complex test', async () => {
          for (let i = 0; i < 10; i++) {
            if (condition) {
              await asyncOperation();
            } else {
              await otherOperation();
            }
          }
          const results = data.map(item => processItem(item));
          results.forEach(result => {
            switch (result.type) {
              case 'A':
                handleA(result);
                break;
              case 'B':
                handleB(result);
                break;
            }
          });
        });
      `;
      mockFs.readFile.mockResolvedValue(complexContent);

      const complexResult = await parser.parseTestFile('/test.ts', 'package');
      expect(complexResult.examples[0]?.complexity).toBe('complex');
    });

    it('should clean test code by removing artifacts', async () => {
      const content = `
        it('should clean test artifacts', () => {
          const handler = jest.fn();
          const result = doSomething();
          expect(result).toBeTruthy();
          console.log('debug info');
        });
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      const example = result.examples[0];
      expect(example.cleanedCode).not.toContain('expect(');
      expect(example.cleanedCode).not.toContain('console.log');
      expect(example.cleanedCode).toContain('doSomething()');
    });
  });

  describe('categorizeExamples', () => {
    it('should categorize examples by type', async () => {
      const parser = new TestParser({ categorizeExamples: true });
      const content = `
        it('basic usage test', () => {
          basicOperation();
        });

        it('error handling test', () => {
          try { throwError(); } catch (e) { handleError(e); }
        });

        it('performance test', () => {
          measurePerformance();
        });
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      expect(result.categorizedExamples).toBeDefined();
      expect(result.categorizedExamples!['basic-usage']).toHaveLength(1);
      expect(result.categorizedExamples!['error-handling']).toHaveLength(1);
      expect(result.categorizedExamples!['performance']).toHaveLength(1);
    });

    it('should sort examples by complexity within categories', async () => {
      const parser = new TestParser({ categorizeExamples: true });
      const content = `
        it('complex basic test', async () => {
          for (let i = 0; i < 10; i++) {
            await operation(i);
            if (condition) process();
          }
        });

        it('simple basic test', () => {
          operation();
        });
      `;
      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTestFile('/test.ts', 'package');

      const basicExamples = result.categorizedExamples!['basic-usage'];
      expect(basicExamples[0].complexity).toBe('simple');
      expect(basicExamples[1].complexity).toBe('complex');
    });
  });

  describe('inferCategory', () => {
    it('should infer category from description keywords', async () => {
      const testCases = [
        { desc: 'should handle error gracefully', expected: 'error-handling' },
        { desc: 'should test performance', expected: 'performance' },
        { desc: 'should test integration with multiple systems', expected: 'integration' },
        { desc: 'should create basic context', expected: 'basic-usage' },
        { desc: 'should demonstrate advanced custom patterns', expected: 'advanced-patterns' }
      ];

      for (const testCase of testCases) {
        const content = `it('${testCase.desc}', () => { operation(); });`;
        mockFs.readFile.mockResolvedValue(content);

        const result = await parser.parseTestFile('/test.ts', 'package');
        const example = result.examples.find(ex => ex.description === testCase.desc);

        expect(example?.category).toBe(testCase.expected);
      }
    });

    it('should infer category from code complexity', async () => {
      const simpleContent = `it('test', () => { operation(); });`;
      mockFs.readFile.mockResolvedValue(simpleContent);

      const simpleResult = await parser.parseTestFile('/test.ts', 'package');
      expect(simpleResult.examples[0]?.category).toBe('basic-usage');

      const asyncContent = `it('test', async () => { await operation(); });`;
      mockFs.readFile.mockResolvedValue(asyncContent);

      const asyncResult = await parser.parseTestFile('/test.ts', 'package');
      expect(asyncResult.examples[0]?.category).toBe('async-patterns');
    });
  });
});