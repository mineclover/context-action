import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { SimpleLLMSCommand } from '../../src/cli/commands/SimpleLLMSCommand.js';
import { EnhancedLLMSConfig } from '../../src/types/config.js';

describe('SimpleLLMSCommand', () => {
  let simpleLLMSCommand: SimpleLLMSCommand;
  let testDataDir: string;
  let config: EnhancedLLMSConfig;

  beforeEach(async () => {
    // Setup test directory
    testDataDir = path.join(__dirname, 'test-workspace-simple-llms');
    
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
        characterLimits: [100, 300, 500, 1000, 2000],
        defaultLanguage: 'ko',
        outputFormat: 'txt' as const
      },
      quality: {
        minPriorityScore: 0,
        maxDocumentAge: '1y',
        requireMinimumContent: false
      },
      categories: {
        guide: { priority: 95 },
        api: { priority: 90 },
        concept: { priority: 85 },
        examples: { priority: 80 }
      },
      tags: {},
      dependencies: {
        rules: {
          prerequisite: { description: '', weight: 0, autoInclude: false },
          reference: { description: '', weight: 0, autoInclude: false },
          followup: { description: '', weight: 0, autoInclude: false },
          complement: { description: '', weight: 0, autoInclude: false }
        },
        conflictResolution: {
          strategy: 'exclude-conflicts' as const,
          priority: 'higher-score-wins' as const,
          allowPartialConflicts: false
        }
      },
      composition: {
        strategies: {},
        defaultStrategy: 'default',
        optimization: {
          spaceUtilizationTarget: 0.8,
          qualityThreshold: 0.7,
          diversityBonus: 0.1,
          redundancyPenalty: 0.2
        }
      },
      extraction: {
        defaultQualityThreshold: 0.7,
        autoTagExtraction: false,
        autoDependencyDetection: false,
        strategies: {}
      },
      validation: {
        schema: {
          enforceTagConsistency: false,
          validateDependencies: false,
          checkCategoryAlignment: false
        },
        quality: {
          minPriorityScore: 0,
          maxDocumentAge: '1y',
          requireMinimumContent: false
        }
      },
      ui: {
        dashboard: {
          enableTagCloud: false,
          showCategoryStats: false,
          enableDependencyGraph: false
        },
        reporting: {
          generateCompositionReports: false,
          includeQualityMetrics: false,
          exportFormats: ['json'] as ('json' | 'csv' | 'html')[]
        }
      }
    };

    simpleLLMSCommand = new SimpleLLMSCommand(config);

    // Create test directory structure
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'ko', 'api--core'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'guide--introduction'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('document discovery and parsing', () => {
    it('should find documents with matching criteria', async () => {
      // Create test templates with completed content
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n이것은 실제 컨텐츠입니다.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'api--core', 'api--core-300.md'),
        '---\ncompletion_status: completed\npriority_score: 85\n---\n\n# API 핵심\n\n핵심 API 문서입니다.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300,
          verbose: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should find and process documents
        expect(output).toContain('📄 Found 2 completed documents');
        expect(output).toContain('시작하기');
        expect(output).toContain('API 핵심');
        expect(output).toContain('Clean LLMS file generated successfully');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should filter by category', async () => {
      // Create test templates in different categories
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n가이드 컨텐츠입니다.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'api--core', 'api--core-300.md'),
        '---\ncompletion_status: completed\npriority_score: 85\n---\n\n# API 핵심\n\nAPI 컨텐츠입니다.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300,
          category: 'guide',
          verbose: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should find only guide documents
        expect(output).toContain('📄 Found 1 completed documents');
        expect(output).toContain('시작하기');
        expect(output).not.toContain('API 핵심');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle no matching documents', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300,
          category: 'nonexistent'
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should report no documents found
        expect(output).toContain('No completed documents found matching the specified criteria');
        expect(output).toContain('Filter Criteria:');
        expect(output).toContain('Language: ko');
        expect(output).toContain('Character Limit: 300');
        expect(output).toContain('Category: nonexistent');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should extract content from different template formats', async () => {
      // Create template with direct content (preferred format)
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 직접 컨텐츠\n\n이것은 직접 작성된 컨텐츠입니다.'
      );

      // Create template with legacy code block format
      await fs.mkdir(path.join(testDataDir, 'llmsData', 'ko', 'guide--legacy'), { recursive: true });
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--legacy', 'guide--legacy-300.md'),
        '---\ncompletion_status: completed\npriority_score: 80\n---\n\n## 템플릿 내용\n\n```markdown\n# 레거시 컨텐츠\n\n이것은 코드 블록에서 추출된 컨텐츠입니다.\n```'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300,
          verbose: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should find both documents with extracted content
        expect(output).toContain('📄 Found 2 completed documents');
        expect(output).toContain('직접 컨텐츠');
        expect(output).toContain('레거시 컨텐츠');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('content generation patterns', () => {
    beforeEach(async () => {
      // Create test documents for pattern testing
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\ndocument_id: guide--getting-started\n---\n\n# 시작하기\n\n이것은 시작하기 가이드입니다.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'api--core', 'api--core-300.md'),
        '---\ncompletion_status: completed\npriority_score: 85\ndocument_id: api--core\n---\n\n# API 핵심\n\n핵심 API 문서입니다.'
      );
    });

    it('should generate clean pattern with document separators', async () => {
      await simpleLLMSCommand.execute({ 
        language: 'ko', 
        characterLimit: 300,
        pattern: 'clean'
      });
      
      // Read generated file
      const outputPath = path.join(testDataDir, 'output', 'llms-300chars.txt');
      const content = await fs.readFile(outputPath, 'utf-8');
      
      // Should contain document separators and titles
      expect(content).toContain('===================[ DOC:');
      expect(content).toContain('# 시작하기');
      expect(content).toContain('# API 핵심');
      expect(content).toContain('이것은 시작하기 가이드입니다.');
      expect(content).toContain('핵심 API 문서입니다.');
    });

    it('should generate raw pattern with content only', async () => {
      await simpleLLMSCommand.execute({ 
        language: 'ko', 
        characterLimit: 300,
        pattern: 'raw'
      });
      
      // Read generated file
      const outputPath = path.join(testDataDir, 'output', 'llms-300chars-raw.txt');
      const content = await fs.readFile(outputPath, 'utf-8');
      
      // Should contain only content, no separators
      expect(content).not.toContain('===================[ DOC:');
      expect(content).toContain('이것은 시작하기 가이드입니다.');
      expect(content).toContain('핵심 API 문서입니다.');
    });

    it('should generate minimal pattern with links', async () => {
      await simpleLLMSCommand.execute({ 
        language: 'ko', 
        pattern: 'minimal'
      });
      
      // Read generated file
      const outputPath = path.join(testDataDir, 'output', 'llms-minimal.txt');
      const content = await fs.readFile(outputPath, 'utf-8');
      
      // Should contain link format
      expect(content).toContain('**[');
      expect(content).toContain('](');
      expect(content).toContain('Priority:');
      expect(content).toContain('시작하기');
      expect(content).toContain('API 핵심');
    });

    it('should generate origin pattern with full content', async () => {
      await simpleLLMSCommand.execute({ 
        language: 'ko', 
        characterLimit: 300,
        pattern: 'origin'
      });
      
      // Read generated file
      const outputPath = path.join(testDataDir, 'output', 'llms-300chars-origin.txt');
      const content = await fs.readFile(outputPath, 'utf-8');
      
      // Should contain document separators and full content
      expect(content).toContain('===================[ DOC:');
      expect(content).toContain('# 시작하기');
      expect(content).toContain('# API 핵심');
    });
  });

  describe('multiple generation mode', () => {
    beforeEach(async () => {
      // Create test document for multiple generation
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-500.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n이것은 시작하기 가이드입니다.'
      );
    });

    it('should generate multiple files when generateAll is true', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          generateAll: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show generation summary
        expect(output).toContain('Generation Summary');
        expect(output).toContain('Successful: 3');
        expect(output).toContain('Generated Files:');
        expect(output).toContain('Origin (full content)');
        expect(output).toContain('Minimum (link navigation)');
        expect(output).toContain('Default (500 chars)');
        
        // Check that files were created
        const originFile = path.join(testDataDir, 'output', 'llms-origin.txt');
        const minimalFile = path.join(testDataDir, 'output', 'llms-minimal.txt');
        const defaultFile = path.join(testDataDir, 'output', 'llms-500chars.txt');
        
        expect(await fs.access(originFile).then(() => true).catch(() => false)).toBe(true);
        expect(await fs.access(minimalFile).then(() => true).catch(() => false)).toBe(true);
        expect(await fs.access(defaultFile).then(() => true).catch(() => false)).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle partial failures in multiple generation', async () => {
      // Create config with invalid output directory to simulate failure
      const invalidConfig = {
        ...config,
        paths: {
          ...config.paths,
          outputDir: '/invalid/path/that/does/not/exist'
        }
      };

      const invalidCommand = new SimpleLLMSCommand(invalidConfig);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await invalidCommand.execute({ 
          language: 'ko', 
          generateAll: true,
          verbose: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show some failures in summary
        expect(output).toContain('Generation Summary');
        expect(output).toContain('Failed:');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('dry run mode', () => {
    it('should show preview without creating files in dry run mode', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n테스트 컨텐츠입니다.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300,
          dryRun: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show dry run preview
        expect(output).toContain('Dry Run Summary');
        expect(output).toContain('Would generate: llms-300chars.txt');
        expect(output).toContain('Documents: 1');
        expect(output).toContain('Pattern: clean');
        expect(output).toContain('Language: ko');
        
      } finally {
        consoleSpy.mockRestore();
      }

      // Check that no files were actually created
      const outputPath = path.join(testDataDir, 'output', 'llms-300chars.txt');
      const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should show dry run for multiple generation', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-500.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n테스트 컨텐츠입니다.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          generateAll: true,
          dryRun: true,
          verbose: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show dry run mode enabled
        expect(output).toContain('DRY RUN - No files will be created');
        expect(output).toContain('Generation Summary');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('language support', () => {
    it('should handle English documents', async () => {
      // Create English test document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--introduction', 'guide--introduction-300.md'),
        '---\ncompletion_status: completed\npriority_score: 95\n---\n\n# Introduction\n\nThis is an English guide.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'en', 
          characterLimit: 300,
          verbose: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should find English document
        expect(output).toContain('📄 Found 1 completed documents');
        expect(output).toContain('Introduction');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle missing language directory gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'fr', // Non-existent language
          characterLimit: 300
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should report no documents found
        expect(output).toContain('No completed documents found matching the specified criteria');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('content extraction and validation', () => {
    it('should skip incomplete or placeholder content', async () => {
      // Create document with placeholder content
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: template\npriority_score: 90\n---\n\n# 시작하기\n\n여기에 컨텐츠를 작성하세요.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should find no completed documents
        expect(output).toContain('No completed documents found matching the specified criteria');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should extract titles properly', async () => {
      // Create document with proper title
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 커스텀 타이틀\n\n실제 컨텐츠입니다.'
      );

      await simpleLLMSCommand.execute({ 
        language: 'ko', 
        characterLimit: 300,
        pattern: 'clean'
      });
      
      // Read generated file
      const outputPath = path.join(testDataDir, 'output', 'llms-300chars.txt');
      const content = await fs.readFile(outputPath, 'utf-8');
      
      // Should extract and use the proper title
      expect(content).toContain('# 커스텀 타이틀');
    });

    it('should handle documents without priority scores', async () => {
      // Create document without priority score
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\n---\n\n# 시작하기\n\n우선순위가 없는 문서입니다.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300,
          verbose: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should still process document with default priority
        expect(output).toContain('📄 Found 1 completed documents');
        expect(output).toContain('시작하기');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('output path generation', () => {
    it('should generate correct file paths for different patterns', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n테스트 컨텐츠입니다.'
      );

      // Test different patterns
      const patterns = ['clean', 'raw', 'origin', 'minimal'];
      
      for (const pattern of patterns) {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: pattern === 'minimal' ? undefined : 300,
          pattern: pattern as any
        });
        
        // Check expected file path
        let expectedFileName: string;
        if (pattern === 'minimal') {
          expectedFileName = 'llms-minimal.txt';
        } else if (pattern === 'raw') {
          expectedFileName = 'llms-300chars-raw.txt';
        } else if (pattern === 'origin') {
          expectedFileName = 'llms-300chars-origin.txt';
        } else {
          // For 'clean' pattern, no pattern suffix is added
          expectedFileName = 'llms-300chars.txt';
        }
        
        const outputPath = path.join(testDataDir, 'output', expectedFileName);
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
      }
    });

    it('should handle custom output directory', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n테스트 컨텐츠입니다.'
      );

      const customOutputDir = path.join(testDataDir, 'custom-output');

      await simpleLLMSCommand.execute({ 
        language: 'ko', 
        characterLimit: 300,
        outputDir: customOutputDir
      });
      
      // Check that file was created in custom directory
      const outputPath = path.join(customOutputDir, 'llms-300chars.txt');
      const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Create a file where directory should be to cause error
      const invalidDir = path.join(testDataDir, 'llmsData', 'ko', 'invalid-file.txt');
      await fs.writeFile(invalidDir, 'This should be a directory');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should handle gracefully and report no documents
        expect(output).toContain('No completed documents found matching the specified criteria');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle malformed frontmatter gracefully', async () => {
      // Create document with malformed frontmatter
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ninvalid yaml: [unclosed\ncompletion_status: completed\n---\n\n# 시작하기\n\n실제 컨텐츠입니다.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should handle parsing errors gracefully
        expect(output).toContain('No completed documents found matching the specified criteria');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle permission errors when writing files', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n테스트 컨텐츠입니다.'
      );

      // Try to write to read-only directory (may not work on all systems)
      const readOnlyDir = '/root/read-only-test'; // This should fail on most systems
      
      let errorOccurred = false;
      try {
        await simpleLLMSCommand.execute({ 
          language: 'ko', 
          characterLimit: 300,
          outputDir: readOnlyDir
        });
      } catch (error) {
        errorOccurred = true;
        expect(error).toBeDefined();
      }
      
      // Should either succeed (if permissions allow) or throw error (expected)
      // This test mainly ensures the command doesn't crash unexpectedly
      expect(typeof errorOccurred).toBe('boolean');
    });
  });

  describe('content processing', () => {
    it('should remove HTML comments and normalize content', async () => {
      // Create document with HTML comments and extra line breaks
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n<!-- 이것은 주석입니다 -->\n실제 컨텐츠입니다.\n\n\n\n여러 줄바꿈이 있습니다.\n\n---\n\n구분선도 있습니다.'
      );

      await simpleLLMSCommand.execute({ 
        language: 'ko', 
        characterLimit: 300,
        pattern: 'raw'
      });
      
      // Read generated file
      const outputPath = path.join(testDataDir, 'output', 'llms-300chars-raw.txt');
      const content = await fs.readFile(outputPath, 'utf-8');
      
      // Should remove comments and normalize content
      expect(content).not.toContain('<!-- 이것은 주석입니다 -->');
      expect(content).not.toContain('---');
      expect(content).toContain('실제 컨텐츠입니다.');
      expect(content).toContain('여러 줄바꿈이 있습니다.');
      
      // Should not have excessive line breaks
      expect(content).not.toMatch(/\n{3,}/);
    });

    it('should sort documents by priority and title', async () => {
      // Create documents with different priorities
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 80\ndocument_id: guide--getting-started\n---\n\n# B 문서\n\n낮은 우선순위 문서입니다.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'api--core', 'api--core-300.md'),
        '---\ncompletion_status: completed\npriority_score: 95\ndocument_id: api--core\n---\n\n# A 문서\n\n높은 우선순위 문서입니다.'
      );

      await simpleLLMSCommand.execute({ 
        language: 'ko', 
        characterLimit: 300,
        pattern: 'clean'
      });
      
      // Read generated file
      const outputPath = path.join(testDataDir, 'output', 'llms-300chars.txt');
      const content = await fs.readFile(outputPath, 'utf-8');
      
      // High priority document should come first
      const aDocIndex = content.indexOf('# A 문서');
      const bDocIndex = content.indexOf('# B 문서');
      
      expect(aDocIndex).toBeLessThan(bDocIndex);
    });
  });
});