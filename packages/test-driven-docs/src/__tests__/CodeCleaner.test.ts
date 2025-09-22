/**
 * @fileoverview Tests for CodeCleaner
 */

import { CodeCleaner } from '../cleaners/CodeCleaner.js';
import { ParsedTestData } from '../types/index.js';

describe('CodeCleaner', () => {
  let cleaner: CodeCleaner;

  beforeEach(() => {
    cleaner = new CodeCleaner();
  });

  describe('constructor', () => {
    it('should use default options when none provided', () => {
      const defaultCleaner = new CodeCleaner();
      const result = defaultCleaner.cleanCode('test code');
      expect(result).toBeDefined();
    });

    it('should merge provided options with defaults', () => {
      const customCleaner = new CodeCleaner({
        removeComments: false,
        realistic: false
      });
      expect(customCleaner).toBeDefined();
    });
  });

  describe('cleanCode', () => {
    it('should remove test artifacts by default', () => {
      const testCode = `
        const result = someFunction();
        expect(result).toBe(true);
        console.log('debug info');
      `;

      const cleaned = cleaner.cleanCode(testCode);

      expect(cleaned).not.toContain('expect(');
      expect(cleaned).not.toContain('console.log');
    });

    it('should replace mocks with realistic implementations', () => {
      const testCode = `
        const mockHandler = jest.fn();
        const spy = jest.fn(() => 'result');
      `;

      const cleaned = cleaner.cleanCode(testCode);

      expect(cleaned).not.toContain('jest.fn()');
      expect(cleaned).toContain('async (payload)');
    });

    it('should format code when formatCode option is enabled', () => {
      const testCode = `
        const obj={
        prop:value
        };
      `;

      const cleaned = cleaner.cleanCode(testCode);

      expect(cleaned).toContain('  '); // Should have proper indentation
    });

    it('should add helpful comments based on code patterns', () => {
      const testCode = `
        const register = new ActionRegister();
        register.register('action', handler);
        register.dispatch('action', payload);
      `;

      const cleaned = cleaner.cleanCode(testCode);

      expect(cleaned).toContain('// Create action register instance');
      expect(cleaned).toContain('// Register action handler');
      expect(cleaned).toContain('// Dispatch action');
    });

    it('should handle context parameter', () => {
      const testCode = 'const value = test;';
      const context = { category: 'advanced' };

      const cleaned = cleaner.cleanCode(testCode, context);

      expect(cleaned).toBeDefined();
    });
  });

  describe('removeTestArtifacts', () => {
    it('should remove expect statements', () => {
      const code = `
        const result = doSomething();
        expect(result).toBe(expected);
        expect(result.prop).toEqual(value);
      `;

      const cleaned = cleaner.cleanCode(code);

      expect(cleaned).not.toContain('expect(');
    });

    it('should remove test framework imports', () => {
      const code = `
        import { jest } from '@jest/globals';
        import { render } from '@testing-library/react';
        import { vitest } from 'vitest';
        import { myFunction } from './utils';
      `;

      const cleaned = cleaner.cleanCode(code);

      expect(cleaned).not.toContain('@jest/globals');
      expect(cleaned).not.toContain('@testing-library');
      expect(cleaned).not.toContain('vitest');
      expect(cleaned).toContain('myFunction'); // Should keep non-test imports
    });

    it('should remove describe/it blocks but keep content', () => {
      const code = `
        describe('Test suite', () => {
          const setup = true;
          it('should work', () => {
            const result = doSomething();
          });
        });
      `;

      const cleaned = cleaner.cleanCode(code);

      expect(cleaned).not.toContain('describe(');
      expect(cleaned).not.toContain('it(');
    });

    it('should remove debugging statements', () => {
      const code = `
        const value = 1;
        console.log('debug:', value);
        console.debug('info');
        debugger;
      `;

      const cleaned = cleaner.cleanCode(code);

      expect(cleaned).not.toContain('console.log');
      expect(cleaned).not.toContain('console.debug');
      expect(cleaned).not.toContain('debugger');
    });

    it('should remove test-specific variables', () => {
      const code = `
        const spy = jest.fn();
        const mock = createMock();
        const stub = sinon.stub();
        const normalVar = 'keep this';
      `;

      const cleaned = cleaner.cleanCode(code);

      expect(cleaned).not.toContain('const spy');
      expect(cleaned).not.toContain('const mock');
      expect(cleaned).not.toContain('const stub');
    });
  });

  describe('makeRealistic', () => {
    it('should replace jest.fn() with realistic implementations', () => {
      const code = 'const handler = jest.fn();';

      const cleaned = cleaner.cleanCode(code);

      expect(cleaned).toContain('async (payload)');
      expect(cleaned).toContain('console.log("Action triggered:", payload);');
    });

    it('should replace jest.fn with custom implementation', () => {
      const code = 'const handler = jest.fn((x) => x * 2);';

      const cleaned = cleaner.cleanCode(code);

      expect(cleaned).not.toContain('jest.fn(');
    });

    it('should replace test naming with realistic naming', () => {
      const code = `
        const testAction = 'test-action';
        const TestComponent = 'TestComponent';
        const TestActions = {};
      `;

      const cleaned = cleaner.cleanCode(code);

      expect(cleaned).toContain("'user-action'");
      expect(cleaned).toContain("'MyComponent'");
      expect(cleaned).toContain('updateUser');
      expect(cleaned).toContain('UserActions');
    });
  });

  describe('formatCode', () => {
    it('should remove excessive empty lines', () => {
      const code = `
        line1


        line2



        line3
      `;

      const cleaned = cleaner.cleanCode(code);

      expect(cleaned).not.toMatch(/\n{3,}/);
    });

    it('should fix indentation for braces', () => {
      const code = `
        if (condition) {
        doSomething();
        }
      `;

      const cleaned = cleaner.cleanCode(code);

      const lines = cleaned.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim());

      // Check that opening brace increases indent
      expect(nonEmptyLines.some(line => line.includes('  '))).toBe(true);
    });

    it('should remove trailing whitespace', () => {
      const code = 'const value = 1;   \nconst other = 2;\t  ';

      const cleaned = cleaner.cleanCode(code);

      const lines = cleaned.split('\n');
      lines.forEach(line => {
        expect(line).not.toMatch(/[ \t]+$/);
      });
    });
  });

  describe('createCompleteExample', () => {
    it('should create complete example from test data', () => {
      const testData: ParsedTestData = {
        metadata: {
          fileName: 'test.ts',
          mainSuite: 'Test Suite',
          description: 'Test description',
          testCount: 1,
          tags: []
        },
        imports: [
          {
            statement: "import { myFunction } from './utils';",
            module: './utils',
            isLocal: true,
            isTestUtility: false
          }
        ],
        interfaces: [
          {
            type: 'interface',
            name: 'TestInterface',
            body: 'prop: string;',
            fullDefinition: 'interface TestInterface { prop: string; }'
          }
        ],
        setup: [
          {
            type: 'beforeEach',
            code: 'setup code here',
            isAsync: false
          }
        ],
        examples: [
          {
            description: 'Example test',
            rawCode: 'const result = test();',
            cleanedCode: 'const result = test();',
            category: 'basic-usage',
            isAsync: false,
            apis: ['testApi'],
            complexity: 'simple'
          }
        ],
        packageName: 'test-package',
        filePath: '/path/to/test.ts'
      };

      const result = cleaner.createCompleteExample(testData);

      expect(result).toContain('// Imports');
      expect(result).toContain('// Type definitions');
      expect(result).toContain('// Setup');
      expect(result).toContain('// Usage example');
    });

    it('should handle empty test data gracefully', () => {
      const testData: ParsedTestData = {
        metadata: {
          fileName: 'test.ts',
          mainSuite: null,
          description: null,
          testCount: 0,
          tags: []
        },
        imports: [],
        interfaces: [],
        setup: [],
        examples: [],
        packageName: 'test-package',
        filePath: '/path/to/test.ts'
      };

      const result = cleaner.createCompleteExample(testData);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('generateVariations', () => {
    it('should generate multiple format variations', () => {
      const code = 'const example = true;';
      const testData: ParsedTestData = {
        metadata: {
          fileName: 'test.ts',
          mainSuite: 'Test',
          description: null,
          testCount: 1,
          tags: []
        },
        imports: [],
        interfaces: [],
        setup: [],
        examples: [{
          description: 'test',
          rawCode: code,
          cleanedCode: code,
          category: 'basic-usage',
          isAsync: false,
          apis: [],
          complexity: 'simple'
        }],
        packageName: 'test',
        filePath: '/test'
      };

      const variations = cleaner.generateVariations(code, testData);

      expect(variations).toHaveProperty('minimal');
      expect(variations).toHaveProperty('complete');
      expect(variations).toHaveProperty('interactive');
      expect(variations).toHaveProperty('copyPaste');

      expect(typeof variations.minimal).toBe('string');
      expect(typeof variations.complete).toBe('string');
      expect(typeof variations.interactive).toBe('string');
      expect(typeof variations.copyPaste).toBe('string');
    });
  });

  describe('createMinimalExample', () => {
    it('should create minimal version without comments', () => {
      const code = `
        // This is a comment
        const value = 1;
        /* Multi-line
           comment */
        const other = 2;
      `;

      const variations = cleaner.generateVariations(code, {} as ParsedTestData);

      expect(variations.minimal).not.toContain('//');
      expect(variations.minimal).not.toContain('/*');
      expect(variations.minimal).toContain('const value = 1;');
    });

    it('should remove empty lines', () => {
      const code = `
        const value = 1;

        const other = 2;


        const third = 3;
      `;

      const variations = cleaner.generateVariations(code, {} as ParsedTestData);

      expect(variations.minimal).not.toMatch(/^\s*$/m);
    });
  });

  describe('createInteractiveExample', () => {
    it('should add interactive placeholders', () => {
      const code = `
        const name = 'John Doe';
        const age = 25;
        const isActive = true;
      `;

      const variations = cleaner.generateVariations(code, {} as ParsedTestData);

      expect(variations.interactive).toContain("'{{ your_value_here }}'");
      expect(variations.interactive).toContain('{{ number }}');
    });
  });

  describe('createCopyPasteExample', () => {
    it('should create copy-paste ready example', () => {
      const code = `
        const actionRegister = new ActionRegister();
        const store = createStore();
      `;

      const variations = cleaner.generateVariations(code, {} as ParsedTestData);

      expect(variations.copyPaste).toContain('myActionRegister');
      expect(variations.copyPaste).toContain('myStore');
      expect(variations.copyPaste).toContain('// Copy and paste this into your component');
    });
  });
});