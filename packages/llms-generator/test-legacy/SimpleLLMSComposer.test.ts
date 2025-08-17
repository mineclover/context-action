/**
 * SimpleLLMSComposer Tests - Updated for docs directory based implementation
 */

import { SimpleLLMSComposer } from '../../src/core/SimpleLLMSComposer.js';
import type { LLMSConfig } from '../../src/types/index.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

describe('SimpleLLMSComposer', () => {
  let composer: SimpleLLMSComposer;
  let mockConfig: LLMSConfig;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(process.cwd(), 'test-temp-simple-llms');
    await mkdir(testDir, { recursive: true });

    mockConfig = {
      paths: {
        docsDir: path.join(testDir, 'docs'), // docs 디렉토리 기반
        llmContentDir: path.join(testDir, 'data'),
        outputDir: path.join(testDir, 'output'),
        templatesDir: path.join(testDir, 'templates'),
        instructionsDir: path.join(testDir, 'instructions')
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 1000, 2000],
        defaultLanguage: 'en',
        outputFormat: 'txt'
      },
      quality: {
        minimumScore: 70
      }
    };

    composer = new SimpleLLMSComposer(mockConfig);
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('findMarkdownFiles', () => {
    beforeEach(async () => {
      // Create docs directory structure with markdown files
      const docsDir = path.join(testDir, 'docs', 'en');
      await mkdir(docsDir, { recursive: true });

      // Create nested structure like real docs
      const apiDir = path.join(docsDir, 'api');
      const guideDir = path.join(docsDir, 'guide');
      const conceptDir = path.join(docsDir, 'concept');
      const llmsDir = path.join(docsDir, 'llms'); // Should be excluded
      
      await mkdir(apiDir, { recursive: true });
      await mkdir(guideDir, { recursive: true });
      await mkdir(conceptDir, { recursive: true });
      await mkdir(llmsDir, { recursive: true });

      // Create markdown files
      await writeFile(path.join(apiDir, 'action-only.md'), '# Action Only API\n\nAPI documentation');
      await writeFile(path.join(apiDir, 'store-only.md'), '# Store Only API\n\nStore documentation');
      await writeFile(path.join(guideDir, 'getting-started.md'), '# Getting Started\n\nBasic guide');
      await writeFile(path.join(conceptDir, 'architecture.md'), '# Architecture\n\nSystem architecture');
      await writeFile(path.join(llmsDir, 'output.txt'), 'Output file'); // Should be excluded
      await writeFile(path.join(docsDir, 'index.md'), '# Main Index\n\nRoot level doc');
    });

    it('should find all markdown files recursively', async () => {
      // @ts-ignore - accessing private method for testing
      const files = await composer.findMarkdownFiles(path.join(testDir, 'docs', 'en'));

      expect(files).toHaveLength(5); // Including index.md, excluding llms directory
      expect(files.some(f => f.includes('action-only.md'))).toBe(true);
      expect(files.some(f => f.includes('store-only.md'))).toBe(true);
      expect(files.some(f => f.includes('getting-started.md'))).toBe(true);
      expect(files.some(f => f.includes('architecture.md'))).toBe(true);
      expect(files.some(f => f.includes('index.md'))).toBe(true);
      expect(files.some(f => f.includes('output.txt'))).toBe(false); // Not .md
    });

    it('should exclude llms directory', async () => {
      // @ts-ignore - accessing private method for testing
      const files = await composer.findMarkdownFiles(path.join(testDir, 'docs', 'en'));

      expect(files.some(f => f.includes('/llms/'))).toBe(false);
    });

    it('should return empty array for non-existent directory', async () => {
      // @ts-ignore - accessing private method for testing
      const files = await composer.findMarkdownFiles(path.join(testDir, 'non-existent'));

      expect(files).toHaveLength(0);
    });
  });

  describe('truncateToCharacterLimit', () => {
    it('should return content as is if under limit', () => {
      const content = 'Short content';
      
      // @ts-ignore - accessing private method for testing
      const result = composer.truncateToCharacterLimit(content, 100);

      expect(result).toBe('Short content');
    });

    it('should truncate at word boundary when possible', () => {
      const content = 'This is a long sentence that needs to be truncated at a reasonable point';
      
      // @ts-ignore - accessing private method for testing
      const result = composer.truncateToCharacterLimit(content, 30);

      expect(result).toContain('...');
      expect(result.length).toBeLessThanOrEqual(33); // 30 + '...'
      expect(result).not.toContain('truncat'); // Should not cut mid-word
    });

    it('should force truncate if no good word boundary exists', () => {
      const content = 'ThisIsOneVeryLongWordWithoutSpacesThatCannotBeTruncatedAtWordBoundary';
      
      // @ts-ignore - accessing private method for testing
      const result = composer.truncateToCharacterLimit(content, 30);

      expect(result).toContain('...');
      expect(result.length).toBeLessThanOrEqual(33); // 30 + '...'
    });
  });

  describe('generateDocumentIdFromPath', () => {
    it('should generate document ID from file path', () => {
      const filePath = '/test/docs/en/api/action-only.md';
      const languageDir = '/test/docs/en';
      
      // @ts-ignore - accessing private method for testing
      const result = composer.generateDocumentIdFromPath(filePath, languageDir);

      expect(result).toBe('api--action-only');
    });

    it('should handle nested directories', () => {
      const filePath = '/test/docs/en/guide/advanced/patterns.md';
      const languageDir = '/test/docs/en';
      
      // @ts-ignore - accessing private method for testing
      const result = composer.generateDocumentIdFromPath(filePath, languageDir);

      expect(result).toBe('guide--advanced--patterns');
    });

    it('should clean special characters', () => {
      const filePath = '/test/docs/en/api/action-only-v2.md';
      const languageDir = '/test/docs/en';
      
      // @ts-ignore - accessing private method for testing
      const result = composer.generateDocumentIdFromPath(filePath, languageDir);

      expect(result).toBe('api--action-only-v2');
    });
  });

  describe('generateTitleFromFilePath', () => {
    it('should generate title from file path', () => {
      const filePath = '/path/to/action-only.md';
      
      // @ts-ignore - accessing private method for testing
      const result = composer.generateTitleFromFilePath(filePath);

      expect(result).toBe('Action Only');
    });

    it('should handle complex filenames', () => {
      const filePath = '/path/to/getting-started-guide.md';
      
      // @ts-ignore - accessing private method for testing
      const result = composer.generateTitleFromFilePath(filePath);

      expect(result).toBe('Getting Started Guide');
    });
  });

  describe('inferCategoryFromPath', () => {
    it('should infer category from docs path structure', () => {
      const filePath = path.join('docs', 'en', 'api', 'action-only.md');
      
      // @ts-ignore - accessing private method for testing
      const result = composer.inferCategoryFromPath(filePath);

      expect(result).toBe('api');
    });

    it('should handle nested categories', () => {
      const filePath = path.join('docs', 'ko', 'guide', 'getting-started.md');
      
      // @ts-ignore - accessing private method for testing
      const result = composer.inferCategoryFromPath(filePath);

      expect(result).toBe('guide');
    });

    it('should return misc for unrecognized paths', () => {
      const filePath = '/some/random/path/file.md';
      
      // @ts-ignore - accessing private method for testing
      const result = composer.inferCategoryFromPath(filePath);

      expect(result).toBe('misc');
    });
  });

  describe('collectCharacterLimitFiles - NEW IMPLEMENTATION', () => {
    beforeEach(async () => {
      // Create docs directory structure with real markdown files
      const docsDir = path.join(testDir, 'docs', 'en');
      await mkdir(docsDir, { recursive: true });

      const apiDir = path.join(docsDir, 'api');
      const guideDir = path.join(docsDir, 'guide');
      
      await mkdir(apiDir, { recursive: true });
      await mkdir(guideDir, { recursive: true });

      // Create markdown files with frontmatter
      const actionOnlyContent = `---
title: "Action Only API"
category: "api"
priority: 90
---

# Action Only API

Complete API reference for Action Only Pattern methods from createActionContext. This pattern provides type-safe action dispatching without state management overhead.`;

      const gettingStartedContent = `---
title: "Getting Started Guide"
category: "guide"
priority: 95
---

# Getting Started

Context-Action provides two main patterns for state management in React applications. This guide will help you choose the right pattern for your use case.`;

      await writeFile(path.join(apiDir, 'action-only.md'), actionOnlyContent);
      await writeFile(path.join(guideDir, 'getting-started.md'), gettingStartedContent);
    });

    it('should collect files from docs directory and truncate to character limit', async () => {
      // @ts-ignore - accessing private method for testing
      const files = await composer.collectCharacterLimitFiles('en', 100);

      expect(files).toHaveLength(2);
      
      const actionOnlyFile = files.find(f => f.documentId === 'api--action-only');
      expect(actionOnlyFile).toBeDefined();
      expect(actionOnlyFile!.characters).toBeLessThanOrEqual(103); // 100 + '...'
      expect(actionOnlyFile!.title).toBe('Action Only API');
      expect(actionOnlyFile!.category).toBe('api');
      
      const guideFile = files.find(f => f.documentId === 'guide--getting-started');
      expect(guideFile).toBeDefined();
      expect(guideFile!.characters).toBeLessThanOrEqual(103); // 100 + '...'
    });

    it('should return empty array for non-existent language', async () => {
      // @ts-ignore - accessing private method for testing
      const files = await composer.collectCharacterLimitFiles('fr', 100);

      expect(files).toHaveLength(0);
    });

    it('should warn about non-existent language directory', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // @ts-ignore - accessing private method for testing
      await composer.collectCharacterLimitFiles('fr', 100);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Language directory not found')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('generateSimpleLLMS - NEW IMPLEMENTATION', () => {
    beforeEach(async () => {
      // Create docs directory with test files
      const docsDir = path.join(testDir, 'docs', 'en');
      await mkdir(docsDir, { recursive: true });

      const apiDir = path.join(docsDir, 'api');
      await mkdir(apiDir, { recursive: true });

      const content1 = `---
title: "Action Only API"
category: "api"
---

# Action Only API

Brief API overview for action-only pattern. This provides simple action dispatching.`;

      const content2 = `---
title: "Store Only API"
category: "api"
---

# Store Only API

Brief API overview for store-only pattern. This provides state management.`;

      await writeFile(path.join(apiDir, 'action-only.md'), content1);
      await writeFile(path.join(apiDir, 'store-only.md'), content2);
    });

    it('should generate simple LLMS from docs directory', async () => {
      const result = await composer.generateSimpleLLMS({
        language: 'en',
        characterLimit: 100,
        outputDir: path.join(testDir, 'output')
      });

      expect(result.totalFiles).toBe(2);
      expect(result.totalCharacters).toBeGreaterThan(0);
      expect(result.averageCharacters).toBeGreaterThan(0);
      expect(existsSync(result.outputPath)).toBe(true);

      expect(result.files).toHaveLength(2);
      expect(result.files.some(f => f.documentId === 'api--action-only')).toBe(true);
      expect(result.files.some(f => f.documentId === 'api--store-only')).toBe(true);
    });

    it('should create output file with correct structure', async () => {
      const result = await composer.generateSimpleLLMS({
        language: 'en',
        characterLimit: 100,
        includeMetadata: true
      });

      const content = await import('fs/promises').then(fs => 
        fs.readFile(result.outputPath, 'utf-8')
      );

      expect(content).toContain('# Context-Action Framework - Simple LLMS (100 chars)');
      expect(content).toContain('Language: EN');
      expect(content).toContain('Character Limit: 100');
      expect(content).toContain('Total Documents: 2');
      expect(content).toContain('**Document ID**: `api--action-only`');
      expect(content).toContain('**Category**: api');
      expect(content).toContain('**Characters**:');
      expect(content).toContain('*Generated automatically by SimpleLLMSComposer*');
    });

    it('should exclude metadata when requested', async () => {
      const result = await composer.generateSimpleLLMS({
        language: 'en',
        characterLimit: 100,
        includeMetadata: false
      });

      const content = await import('fs/promises').then(fs => 
        fs.readFile(result.outputPath, 'utf-8')
      );

      expect(content).not.toContain('**Document ID**:');
      expect(content).not.toContain('**Category**:');
      expect(content).not.toContain('*Generated automatically by SimpleLLMSComposer*');
    });

    it('should throw error when no files found', async () => {
      await expect(
        composer.generateSimpleLLMS({
          language: 'nonexistent',
          characterLimit: 100
        })
      ).rejects.toThrow('No files found for character limit 100 in language nonexistent');
    });
  });

  describe('getAvailableCharacterLimits - NEW IMPLEMENTATION', () => {
    beforeEach(async () => {
      // Create docs directory with markdown files
      const docsDir = path.join(testDir, 'docs', 'en');
      await mkdir(docsDir, { recursive: true });

      const apiDir = path.join(docsDir, 'api');
      await mkdir(apiDir, { recursive: true });

      await writeFile(path.join(apiDir, 'test.md'), '# Test file');
    });

    it('should return config character limits when markdown files exist', async () => {
      const limits = await composer.getAvailableCharacterLimits('en');

      expect(limits).toEqual([100, 300, 1000, 2000]); // From mockConfig
    });

    it('should return empty array for non-existent language', async () => {
      const limits = await composer.getAvailableCharacterLimits('fr');

      expect(limits).toEqual([]);
    });

    it('should warn when language directory not found', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await composer.getAvailableCharacterLimits('fr');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Language directory not found')
      );
      
      consoleSpy.mockRestore();
    });

    it('should warn when no markdown files found', async () => {
      // Create empty language directory
      const emptyDir = path.join(testDir, 'docs', 'empty');
      await mkdir(emptyDir, { recursive: true });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await composer.getAvailableCharacterLimits('empty');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No markdown files found')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('ensureOutputDirectoryExists', () => {
    it('should create output directory if it does not exist', async () => {
      const outputDir = path.join(testDir, 'output', 'en');
      expect(existsSync(outputDir)).toBe(false);

      await composer.ensureOutputDirectoryExists('en');

      expect(existsSync(outputDir)).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      const outputDir = path.join(testDir, 'output', 'en');
      await mkdir(outputDir, { recursive: true });

      await expect(
        composer.ensureOutputDirectoryExists('en')
      ).resolves.not.toThrow();
    });

    it('should log creation message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await composer.ensureOutputDirectoryExists('en');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Creating output directory')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('generateBatchSimpleLLMS - NEW IMPLEMENTATION', () => {
    beforeEach(async () => {
      // Create docs with files for multiple character limits
      const docsDir = path.join(testDir, 'docs', 'ko');
      await mkdir(docsDir, { recursive: true });

      const guideDir = path.join(docsDir, 'guide');
      await mkdir(guideDir, { recursive: true });

      const content = `---
title: "Getting Started Guide"
category: "guide"
---

# Getting Started

This is a comprehensive getting started guide for new users. It covers installation, basic setup, configuration options, and your first implementation with clear examples. Perfect for beginners who want to understand the Context-Action framework thoroughly.`;

      await writeFile(path.join(guideDir, 'getting-started.md'), content);
    });

    it('should generate LLMS for multiple character limits', async () => {
      const results = await composer.generateBatchSimpleLLMS(
        'ko',
        [100, 300, 1000],
        { outputDir: path.join(testDir, 'output') }
      );

      expect(results.size).toBe(3);
      expect(results.has(100)).toBe(true);
      expect(results.has(300)).toBe(true);
      expect(results.has(1000)).toBe(true);

      // Check that files exist
      for (const result of results.values()) {
        expect(existsSync(result.outputPath)).toBe(true);
        expect(result.totalFiles).toBe(1);
      }
    });

    it('should handle empty character limits array', async () => {
      const results = await composer.generateBatchSimpleLLMS(
        'ko',
        [],
        { outputDir: path.join(testDir, 'output') }
      );

      expect(results.size).toBe(0);
    });
  });

  describe('getCharacterLimitStats - NEW IMPLEMENTATION', () => {
    beforeEach(async () => {
      // Create docs with files of known lengths
      const docsDir = path.join(testDir, 'docs', 'en');
      await mkdir(docsDir, { recursive: true });

      const testDir1 = path.join(docsDir, 'test1');
      const testDir2 = path.join(docsDir, 'test2');
      await mkdir(testDir1, { recursive: true });
      await mkdir(testDir2, { recursive: true });

      // File 1: exactly 50 characters
      await writeFile(path.join(testDir1, 'short.md'), '12345678901234567890123456789012345678901234567890'); // 50 chars

      // File 2: exactly 100 characters  
      await writeFile(path.join(testDir2, 'long.md'), '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'); // 100 chars
    });

    it('should return accurate statistics for character limit', async () => {
      const stats = await composer.getCharacterLimitStats('en', 100);

      expect(stats.totalFiles).toBe(2);
      // Both files will be truncated to 100 chars or less
      expect(stats.totalCharacters).toBeGreaterThan(0);
      expect(stats.averageCharacters).toBeGreaterThan(0);
      expect(stats.minCharacters).toBeGreaterThan(0);
      expect(stats.maxCharacters).toBeLessThanOrEqual(103); // 100 + '...'
    });

    it('should return zero stats for non-existent language', async () => {
      const stats = await composer.getCharacterLimitStats('fr', 100);

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalCharacters).toBe(0);
      expect(stats.averageCharacters).toBe(0);
      expect(stats.minCharacters).toBe(0);
      expect(stats.maxCharacters).toBe(0);
    });
  });

  describe('sortFiles', () => {
    const mockFiles = [
      {
        documentId: 'z-last',
        filePath: '/test/z-last.md',
        content: 'content',
        characters: 10,
        title: 'Z Last',
        category: 'guide',
        priority: 90
      },
      {
        documentId: 'a-first',
        filePath: '/test/a-first.md',
        content: 'content',
        characters: 10,
        title: 'A First',
        category: 'api',
        priority: 50
      },
      {
        documentId: 'middle',
        filePath: '/test/middle.md',
        content: 'content',
        characters: 10,
        title: 'Middle',
        category: 'api',
        priority: 70
      }
    ];

    it('should sort alphabetically by default', () => {
      // @ts-ignore - accessing private method for testing
      const sorted = composer.sortFiles([...mockFiles], 'alphabetical');

      expect(sorted[0].documentId).toBe('a-first');
      expect(sorted[1].documentId).toBe('middle');
      expect(sorted[2].documentId).toBe('z-last');
    });

    it('should sort by priority descending', () => {
      // @ts-ignore - accessing private method for testing
      const sorted = composer.sortFiles([...mockFiles], 'priority');

      expect(sorted[0].documentId).toBe('z-last'); // priority 90
      expect(sorted[1].documentId).toBe('middle'); // priority 70
      expect(sorted[2].documentId).toBe('a-first'); // priority 50
    });

    it('should sort by category then alphabetically', () => {
      // @ts-ignore - accessing private method for testing
      const sorted = composer.sortFiles([...mockFiles], 'category');

      expect(sorted[0].category).toBe('api');
      expect(sorted[0].documentId).toBe('a-first'); // api + alphabetical
      expect(sorted[1].category).toBe('api');
      expect(sorted[1].documentId).toBe('middle'); // api + alphabetical
      expect(sorted[2].category).toBe('guide');
      expect(sorted[2].documentId).toBe('z-last'); // guide
    });
  });

  describe('extractContentAndFrontmatter', () => {
    it('should extract content and frontmatter correctly', () => {
      const input = `---
title: "Test Title"
category: "test"
priority: 85
---

# Test Content

This is the main content.`;

      // @ts-ignore - accessing private method for testing
      const result = composer.extractContentAndFrontmatter(input);

      expect(result.cleanContent).toBe('# Test Content\n\nThis is the main content.');
      expect(result.frontmatter?.title).toBe('Test Title');
      expect(result.frontmatter?.category).toBe('test');
      expect(result.frontmatter?.priority).toBe(85);
    });

    it('should handle content without frontmatter', () => {
      const input = '# Just Content\n\nNo frontmatter here.';

      // @ts-ignore - accessing private method for testing
      const result = composer.extractContentAndFrontmatter(input);

      expect(result.cleanContent).toBe('# Just Content\n\nNo frontmatter here.');
      expect(result.frontmatter).toBeUndefined();
    });

    it('should handle malformed frontmatter gracefully', () => {
      const input = `---
invalid: yaml: content
---

# Content`;

      // @ts-ignore - accessing private method for testing
      const result = composer.extractContentAndFrontmatter(input);

      expect(result.cleanContent).toBe('# Content');
      expect(result.frontmatter).toBeUndefined();
    });
  });

  describe('deprecated methods', () => {
    describe('createDataSymlink', () => {
      it('should still work for backwards compatibility', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await expect(
          composer.createDataSymlink()
        ).resolves.not.toThrow();
        
        consoleSpy.mockRestore();
      });
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Try to read from a directory that exists but has permission issues
      const restrictedDir = path.join(testDir, 'restricted');
      await mkdir(restrictedDir, { recursive: true });
      // Note: In a real test environment, you might need to actually restrict permissions
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // @ts-ignore - accessing private method for testing
      const files = await composer.collectCharacterLimitFiles('nonexistent', 100);
      
      expect(files).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle empty content files', async () => {
      const docsDir = path.join(testDir, 'docs', 'en');
      await mkdir(docsDir, { recursive: true });
      
      const apiDir = path.join(docsDir, 'api');
      await mkdir(apiDir, { recursive: true });
      
      // Create empty file
      await writeFile(path.join(apiDir, 'empty.md'), '');
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // @ts-ignore - accessing private method for testing
      const files = await composer.collectCharacterLimitFiles('en', 100);
      
      expect(files).toHaveLength(0); // Empty files should be skipped
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping empty file')
      );
      
      consoleSpy.mockRestore();
    });
  });
});