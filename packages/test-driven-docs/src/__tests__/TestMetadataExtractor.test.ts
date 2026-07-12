/**
 * @fileoverview Tests for TestMetadataExtractor
 */

import { TestMetadataExtractor } from '../core/TestMetadataExtractor.js';
import fs from 'fs/promises';
import path from 'path';

// Mock fs
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock path.resolve to return predictable results
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn((p: string) => `/resolved/${p}`)
}));

describe('TestMetadataExtractor', () => {
  let extractor: TestMetadataExtractor;

  beforeEach(() => {
    extractor = new TestMetadataExtractor();
    jest.clearAllMocks();
  });

  describe('extractFromFile', () => {
    const sampleTestContent = `
      import { createActionContext } from '@context-action/react';
      import { TestHelper } from '@testing-library/react';
      import { utils } from './utils';

      interface UserActions {
        updateUser: { id: string; name: string };
        deleteUser: { id: string };
      }

      type UserStatus = 'active' | 'inactive';

      describe('User Actions Test Suite', () => {
        describe('nested suite', () => {
          it('should create action context', () => {
            const { Provider } = createActionContext('test');
            expect(Provider).toBeDefined();
          });

          it('should handle user updates', async () => {
            const register = new ActionRegister();
            await register.dispatch('updateUser', { id: '1', name: 'John' });
          });
        });

        it('should validate user status', () => {
          validateStatus('active');
        });
      });
    `;

    beforeEach(() => {
      mockFs.readFile.mockResolvedValue(sampleTestContent);
    });

    it('should extract complete file metadata', async () => {
      const result = await extractor.extractFromFile('test.ts');

      expect(result).toEqual({
        filePath: '/resolved/test.ts',
        fileName: 'test.ts',
        extractedAt: expect.any(String),
        imports: expect.any(Array),
        interfaces: expect.any(Array),
        testSuites: expect.any(Array),
        testCases: expect.any(Array),
        apiUsage: expect.any(Array),
        metrics: expect.any(Object)
      });
    });

    it('should extract import statements', async () => {
      const result = await extractor.extractFromFile('test.ts');

      expect(result.imports).toHaveLength(3);

      const contextImport = result.imports.find(imp => imp.module === '@context-action/react');
      expect(contextImport).toEqual(expect.objectContaining({
        statement: expect.stringContaining('createActionContext'),
        module: '@context-action/react',
        isLocal: false,
        isTestFramework: false
      }));

      const localImport = result.imports.find(imp => imp.module === './utils');
      expect(localImport?.isLocal).toBe(true);

      const testImport = result.imports.find(imp => imp.module === '@testing-library/react');
      expect(testImport?.isTestFramework).toBe(true);
    });

    it('should extract type definitions', async () => {
      const result = await extractor.extractFromFile('test.ts');

      expect(result.interfaces).toHaveLength(2);

      const userActions = result.interfaces.find(int => int.name === 'UserActions');
      expect(userActions).toEqual(expect.objectContaining({
        type: 'interface',
        name: 'UserActions',
        definition: expect.stringContaining('interface UserActions')
      }));

      const userStatus = result.interfaces.find(int => int.name === 'UserStatus');
      expect(userStatus?.type).toBe('type');
    });

    it('should extract test suites', async () => {
      const result = await extractor.extractFromFile('test.ts');

      expect(result.testSuites).toHaveLength(2);

      const mainSuite = result.testSuites.find(suite => suite.name === 'User Actions Test Suite');
      expect(mainSuite?.startIndex).toEqual(expect.any(Number));

      const nestedSuite = result.testSuites.find(suite => suite.name === 'nested suite');
      expect(nestedSuite?.startIndex).toBeGreaterThan(mainSuite?.startIndex ?? -1);
    });

    it('should extract test cases with metadata', async () => {
      const result = await extractor.extractFromFile('test.ts');

      expect(result.testCases).toHaveLength(3);

      const asyncTest = result.testCases.find(test => test.description.includes('user updates'));
      expect(asyncTest?.isAsync).toBe(true);

      const syncTest = result.testCases.find(test => test.description.includes('action context'));
      expect(syncTest?.isAsync).toBe(false);
    });

    it('should detect API usage', async () => {
      const result = await extractor.extractFromFile('test.ts');

      const apiNames = result.apiUsage.map(api => api.apiName);
      expect(apiNames).toContain('createActionContext');
      expect(apiNames).toContain('ActionRegister');
    });

    it('should calculate file metrics', async () => {
      const result = await extractor.extractFromFile('test.ts');

      expect(result.metrics).toEqual({
        totalLines: expect.any(Number),
        nonEmptyLines: expect.any(Number),
        testCount: 3,
        suiteCount: 2,
        importCount: 3,
        typeDefinitionCount: 2
      });

      expect(result.metrics.totalLines).toBeGreaterThan(0);
      expect(result.apiUsage.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(extractor.extractFromFile('nonexistent.ts'))
        .rejects.toThrow('File not found');
    });

    it('should handle files with no tests', async () => {
      mockFs.readFile.mockResolvedValue(`
        import { something } from 'somewhere';

        function utility() {
          return true;
        }
      `);

      const result = await extractor.extractFromFile('utility.ts');

      expect(result.testCases).toHaveLength(0);
      expect(result.testSuites).toHaveLength(0);
      expect(result.metrics.testCount).toBe(0);
    });

    it('should handle empty files', async () => {
      mockFs.readFile.mockResolvedValue('');

      const result = await extractor.extractFromFile('empty.ts');

      expect(result.imports).toHaveLength(0);
      expect(result.interfaces).toHaveLength(0);
      expect(result.testCases).toHaveLength(0);
      expect(result.testSuites).toHaveLength(0);
      expect(result.apiUsage).toHaveLength(0);
    });
  });

  describe('extractFromDirectory', () => {
    const mockDirectoryStructure = {
      'feature.test.ts': 'test content',
      'utils.test.js': 'test content',
      'component.spec.ts': 'spec content',
      'regular.ts': 'regular content',
      'subdir': {
        'nested.test.ts': 'nested test content'
      }
    };

    beforeEach(() => {
      // Mock fs.readdir to simulate directory structure
      mockFs.readdir.mockImplementation(async (dirPath: any, options: any) => {
        const pathStr = dirPath.toString();

        if (pathStr.includes('subdir')) {
          return [
            { name: 'nested.test.ts', isDirectory: () => false }
          ] as any;
        }

        return [
          { name: 'feature.test.ts', isDirectory: () => false },
          { name: 'utils.test.js', isDirectory: () => false },
          { name: 'component.spec.ts', isDirectory: () => false },
          { name: 'regular.ts', isDirectory: () => false },
          { name: 'subdir', isDirectory: () => true }
        ] as any;
      });

      mockFs.readFile.mockResolvedValue('mock test content');
    });

    it('should extract metadata from all test files in directory', async () => {
      const result = await extractor.extractFromDirectory('/test/dir');

      expect(result.projectPath).toBe('/resolved//test/dir');
      expect(result.extractedAt).toEqual(expect.any(String));
      expect(result.files).toHaveLength(3); // Should find 3 .test files

      const fileNames = result.files.map(f => f.fileName);
      expect(fileNames).toContain('feature.test.ts');
      expect(fileNames).toContain('utils.test.js');
      expect(fileNames).toContain('nested.test.ts');
      expect(fileNames).not.toContain('component.spec.ts'); // Doesn't match pattern
      expect(fileNames).not.toContain('regular.ts'); // Not a test file
    });

    it('should use custom pattern to filter files', async () => {
      const customPattern = /\.spec\.(ts|js)$/;
      const result = await extractor.extractFromDirectory('/test/dir', customPattern);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].fileName).toBe('component.spec.ts');
    });

    it('should calculate project summary', async () => {
      const result = await extractor.extractFromDirectory('/test/dir');

      expect(result.summary).toEqual({
        totalTestFiles: 3,
        totalTestCases: expect.any(Number),
        totalTestSuites: expect.any(Number),
        totalLines: expect.any(Number),
        uniqueApis: expect.any(Array),
        uniqueTypes: expect.any(Array),
        filesByFramework: expect.any(Object)
      });
    });

    it('should handle directory read errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(extractor.extractFromDirectory('/protected/dir'))
        .rejects.toThrow('Permission denied');
    });

    it('should handle empty directories', async () => {
      mockFs.readdir.mockResolvedValue([] as any);

      const result = await extractor.extractFromDirectory('/empty/dir');

      expect(result.files).toHaveLength(0);
      expect(result.summary.totalTestFiles).toBe(0);
    });

    it('should skip subdirectories with read errors', async () => {
      mockFs.readdir
        .mockResolvedValueOnce([
          { name: 'good.test.ts', isDirectory: () => false },
          { name: 'baddir', isDirectory: () => true }
        ] as any)
        .mockRejectedValueOnce(new Error('Permission denied')); // For baddir

      mockFs.readFile.mockResolvedValue('test content');

      const result = await extractor.extractFromDirectory('/mixed/dir');

      // Should still process the good file
      expect(result.files).toHaveLength(1);
      expect(result.files[0].fileName).toBe('good.test.ts');
    });
  });

  describe('extractImports', () => {
    it('should parse various import formats', async () => {
      const content = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as utils from './utils';
        import type { User } from './types';
        import './styles.css';
      `;

      mockFs.readFile.mockResolvedValue(content);
      const result = await extractor.extractFromFile('test.ts');

      expect(result.imports).toHaveLength(5);

      expect(result.imports.filter(imp => imp.module === 'react')).toHaveLength(2);
    });

    it('should categorize imports correctly', async () => {
      const content = `
        import { render } from '@testing-library/react';
        import { createActionContext } from '@context-action/react';
        import { helper } from './utils';
      `;

      mockFs.readFile.mockResolvedValue(content);
      const result = await extractor.extractFromFile('test.ts');

      const testLibImport = result.imports.find(imp => imp.module.includes('testing-library'));
      expect(testLibImport?.isTestFramework).toBe(true);

      const localImport = result.imports.find(imp => imp.module === './utils');
      expect(localImport?.isLocal).toBe(true);

      const contextImport = result.imports.find(imp => imp.module.includes('context-action'));
      expect(contextImport?.isLocal).toBe(false);
      expect(contextImport?.isTestFramework).toBe(false);
    });
  });

  describe('extractTypeDefinitions', () => {
    it('should extract interfaces with properties', async () => {
      const content = `
        interface UserActions {
          create: { name: string; email: string };
          update: { id: string; name?: string };
          delete: { id: string };
        }

        interface Config extends BaseConfig {
          apiUrl: string;
        }
      `;

      mockFs.readFile.mockResolvedValue(content);
      const result = await extractor.extractFromFile('test.ts');

      const userActions = result.interfaces.find(int => int.name === 'UserActions');
      expect(userActions?.definition).toContain('interface UserActions');
    });

    it('should extract type aliases', async () => {
      const content = `
        type Status = 'active' | 'inactive' | 'pending';
        type ID = string | number;
      `;

      mockFs.readFile.mockResolvedValue(content);
      const result = await extractor.extractFromFile('test.ts');

      expect(result.interfaces).toHaveLength(2);

      const statusType = result.interfaces.find(int => int.name === 'Status');
      expect(statusType?.type).toBe('type');
      expect(statusType?.definition).toContain("type Status");
    });
  });

  describe('detectApiUsage', () => {
    it('should detect Context-Action framework API usage', async () => {
      const content = `
        const register = new ActionRegister();
        const { Provider } = createActionContext('test');
        const store = createStoreContext('data', {});
        const value = useStoreValue(myStore);
        useActionHandler('action', handler);
      `;

      mockFs.readFile.mockResolvedValue(content);
      const result = await extractor.extractFromFile('test.ts');

      const apiNames = result.apiUsage.map(api => api.apiName);
      expect(apiNames).toContain('ActionRegister');
      expect(apiNames).toContain('createActionContext');
      expect(apiNames).toContain('createStoreContext');
      expect(apiNames).toContain('useStoreValue');
      expect(apiNames).toContain('useActionHandler');
    });

    it('should not detect non-API patterns', async () => {
      const content = `
        const normalFunction = () => {};
        const variable = 'test';
        console.log('debug');
        expect(result).toBe(true);
      `;

      mockFs.readFile.mockResolvedValue(content);
      const result = await extractor.extractFromFile('test.ts');

      expect(result.apiUsage).toHaveLength(0);
    });
  });
});
