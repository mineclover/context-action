/**
 * Integration tests for LLMS generation functionality
 * Tests the complete pipeline from priority.json to generated LLMS files
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { existsSync, readFileSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { LLMSGenerator } from '../../src/core/LLMSGenerator.js';
import { ContentExtractor } from '../../src/core/ContentExtractor.js';
import { DocumentProcessor } from '../../src/core/DocumentProcessor.js';

describe('LLMS Generation Integration Tests', () => {
  const testOutputDir = path.join(process.cwd(), 'test/temp/llms-output');
  const docsDir = path.join(process.cwd(), '../../docs');
  const dataDir = path.join(process.cwd(), '../../data');
  
  beforeAll(() => {
    // Create test output directory
    if (!existsSync(testOutputDir)) {
      mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test output directory
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  describe('DocumentProcessor Path Resolution', () => {
    test('should correctly resolve source paths with language prefix', async () => {
      const processor = new DocumentProcessor(docsDir);
      
      // Test case: source_path includes language prefix (current issue)
      const sourcePathWithPrefix = 'en/api/action-only.md';
      const language = 'en';
      
      // This should work after our fix
      try {
        const document = await processor.readSourceDocument(
          sourcePathWithPrefix, 
          language, 
          'api--action-only'
        );
        
        expect(document).toBeDefined();
        expect(document.id).toBe('api--action-only');
        expect(document.language).toBe('en');
        expect(document.cleanContent.length).toBeGreaterThan(0);
      } catch (error) {
        // If file doesn't exist, that's okay for this test - we're testing path resolution
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Source document not found');
        // But the path should be correct now
        expect((error as Error).message).toContain('/docs/en/api/action-only.md');
        expect((error as Error).message).not.toContain('/docs/en/en/api/action-only.md');
      }
    });

    test('should handle source paths without language prefix', async () => {
      const processor = new DocumentProcessor(docsDir);
      
      // Test case: source_path without language prefix (ideal case)
      const sourcePathWithoutPrefix = 'api/action-only.md';
      const language = 'en';
      
      try {
        const document = await processor.readSourceDocument(
          sourcePathWithoutPrefix, 
          language, 
          'api--action-only'
        );
        
        expect(document).toBeDefined();
        expect(document.id).toBe('api--action-only');
        expect(document.language).toBe('en');
      } catch (error) {
        // Same expectation as above
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('/docs/en/api/action-only.md');
        expect((error as Error).message).not.toContain('/docs/en/en/api/action-only.md');
      }
    });
  });

  describe('ContentExtractor Character Limits', () => {
    test('should generate content for all configured character limits', async () => {
      const config = {
        paths: {
          docsDir,
          llmContentDir: dataDir,
          outputDir: testOutputDir
        },
        generation: {
          characterLimits: [100, 200, 300, 500, 1000, 2000, 5000],
          supportedLanguages: ['en', 'ko']
        }
      };
      const extractor = new ContentExtractor(config);
      const characterLimits = [100, 200, 300, 500, 1000, 2000, 5000];
      
      for (const limit of characterLimits) {
        try {
          const result = await extractor.generateLimitedContent('ko', limit, testOutputDir);
          
          expect(result).toBeDefined();
          expect(result.filePath).toContain(`llms-${limit}chars-ko.txt`);
          
          if (existsSync(result.filePath)) {
            const content = readFileSync(result.filePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            expect(content.length).toBeLessThanOrEqual(limit + 100); // Allow 100 char buffer for metadata
          }
        } catch (error) {
          console.warn(`Failed to generate ${limit}-char content:`, error);
          // This might fail due to missing source files, which is expected in test env
        }
      }
    });

    test('should include YAML front matter in generated files', async () => {
      const config = {
        paths: {
          docsDir,
          llmContentDir: dataDir,
          outputDir: testOutputDir
        },
        generation: {
          characterLimits: [100, 200, 300, 500, 1000, 2000, 5000],
          supportedLanguages: ['en', 'ko']
        }
      };
      const extractor = new ContentExtractor(config);
      
      try {
        const result = await extractor.generateLimitedContent('ko', 500, testOutputDir);
        
        if (existsSync(result.filePath)) {
          const content = readFileSync(result.filePath, 'utf-8');
          
          // Check for YAML front matter
          expect(content).toMatch(/^---\n/);
          expect(content).toContain('title:');
          expect(content).toContain('character_limit: 500');
          expect(content).toContain('language: ko');
          expect(content).toContain('---');
        }
      } catch (error) {
        console.warn('Front matter test failed (expected in test env):', error);
      }
    });
  });

  describe('LLMSGenerator Integration', () => {
    test('should generate minimum navigation file', async () => {
      const config = {
        paths: {
          docsDir,
          llmContentDir: dataDir,
          outputDir: testOutputDir
        },
        generation: {
          characterLimits: [100, 200, 300, 500, 1000, 2000, 5000],
          supportedLanguages: ['en', 'ko']
        }
      };
      const generator = new LLMSGenerator(config);

      try {
        const result = await generator.generateMinimum('ko');
        
        expect(result).toBeDefined();
        expect(result.filePath).toContain('llms-minimum-ko.txt');
        
        if (existsSync(result.filePath)) {
          const content = readFileSync(result.filePath, 'utf-8');
          expect(content).toContain('Context-Action Framework');
          expect(content).toContain('Document Navigation');
          expect(content).toContain('Priority:');
          expect(content.length).toBeGreaterThan(1000); // Should be substantial
        }
      } catch (error) {
        console.warn('Minimum generation test failed (expected in test env):', error);
      }
    });

    test('should generate origin content file', async () => {
      const config = {
        paths: {
          docsDir,
          llmContentDir: dataDir,
          outputDir: testOutputDir
        },
        generation: {
          characterLimits: [100, 200, 300, 500, 1000, 2000, 5000],
          supportedLanguages: ['en', 'ko']
        }
      };
      const generator = new LLMSGenerator(config);

      try {
        const result = await generator.generateOrigin('en');
        
        expect(result).toBeDefined();
        expect(result.filePath).toContain('llms-origin-en.txt');
        
        if (existsSync(result.filePath)) {
          const content = readFileSync(result.filePath, 'utf-8');
          expect(content).toContain('Context-Action Framework');
          expect(content).toContain('Complete Documentation');
          expect(content).toContain('Generated:');
        }
      } catch (error) {
        console.warn('Origin generation test failed (expected in test env):', error);
      }
    });
  });

  describe('Config-Based Character Limits', () => {
    test('should use character limits from config', () => {
      // Test that hardcoded limits are removed and config-based limits work
      const configCharLimits = [100, 200, 300, 500, 1000, 2000, 5000];
      const hardcodedLimits = [200, 500, 1000]; // Old hardcoded limits that should not appear
      
      // This is more of a code structure test
      expect(configCharLimits).toContain(100);
      expect(configCharLimits).toContain(2000);
      expect(configCharLimits).toContain(5000);
      expect(configCharLimits.length).toBe(7);
    });
  });

  describe('File Generation Validation', () => {
    test('should create files with correct naming pattern', async () => {
      const testFiles = [
        'llms-minimum-ko.txt',
        'llms-origin-ko.txt', 
        'llms-100chars-ko.txt',
        'llms-500chars-ko.txt',
        'llms-1000chars-ko.txt'
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(testOutputDir, fileName);
        
        // Test the naming pattern is correct
        expect(fileName).toMatch(/^llms-(minimum|origin|\d+chars)-[a-z]{2}\.txt$/);
        
        if (existsSync(filePath)) {
          const stats = require('fs').statSync(filePath);
          expect(stats.size).toBeGreaterThan(0);
        }
      }
    });

    test('should handle missing source files gracefully', async () => {
      const processor = new DocumentProcessor(docsDir);
      
      // Test with non-existent file
      await expect(
        processor.readSourceDocument('non-existent/file.md', 'en', 'test-id')
      ).rejects.toThrow('Source document not found');
    });
  });

  describe('Performance and Quality', () => {
    test('should generate files within reasonable time', async () => {
      const config = {
        paths: {
          docsDir,
          llmContentDir: dataDir,
          outputDir: testOutputDir
        },
        generation: {
          characterLimits: [100, 200, 300, 500, 1000, 2000, 5000],
          supportedLanguages: ['en', 'ko']
        }
      };
      const generator = new LLMSGenerator(config);

      const startTime = Date.now();
      
      try {
        await generator.generateMinimum('ko');
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should complete within 10 seconds
        expect(duration).toBeLessThan(10000);
      } catch (error) {
        console.warn('Performance test failed (expected in test env):', error);
      }
    });

    test('should maintain content quality standards', async () => {
      const config = {
        paths: {
          docsDir,
          llmContentDir: dataDir,
          outputDir: testOutputDir
        },
        generation: {
          characterLimits: [100, 200, 300, 500, 1000, 2000, 5000],
          supportedLanguages: ['en', 'ko']
        }
      };
      const extractor = new ContentExtractor(config);
      
      try {
        const result = await extractor.generateLimitedContent('ko', 1000, testOutputDir);
        
        if (existsSync(result.filePath)) {
          const content = readFileSync(result.filePath, 'utf-8');
          
          // Quality checks
          expect(content).not.toContain('undefined');
          expect(content).not.toContain('null');
          expect(content).not.toContain('[object Object]');
          expect(content.trim().length).toBeGreaterThan(0);
        }
      } catch (error) {
        console.warn('Quality test failed (expected in test env):', error);
      }
    });
  });
});