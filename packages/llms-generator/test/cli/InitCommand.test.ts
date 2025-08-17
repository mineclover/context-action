import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import path from 'path';
import { promises as fs } from 'fs';
import { InitCommand } from '../../src/cli/commands/InitCommand.js';
import { PriorityGenerator } from '../../src/core/PriorityGenerator.js';
import { TemplateGenerator } from '../../src/core/TemplateGenerator.js';
import type { ResolvedConfig } from '../../src/types/user-config.js';

// Mock the core modules
jest.mock('../../src/core/PriorityGenerator.js');
jest.mock('../../src/core/TemplateGenerator.js');

describe('InitCommand', () => {
  let mockConfig: ResolvedConfig;
  let initCommand: InitCommand;
  let mockPriorityGenerator: jest.Mocked<PriorityGenerator>;
  let mockTemplateGenerator: jest.Mocked<TemplateGenerator>;
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let logOutput: string[];
  let errorOutput: string[];

  beforeEach(() => {
    // Mock console output
    logOutput = [];
    errorOutput = [];
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn((...args) => logOutput.push(args.join(' ')));
    console.error = jest.fn((...args) => errorOutput.push(args.join(' ')));

    // Create mock config
    mockConfig = {
      paths: {
        docsDir: '/test/docs',
        llmContentDir: '/test/data',
        outputDir: '/test/docs/llms',
        templatesDir: '/test/templates',
        instructionsDir: '/test/instructions'
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 1000],
        defaultLanguage: 'en',
        outputFormat: 'txt'
      },
      quality: {
        minCompletenessThreshold: 0.8,
        enableValidation: true,
        strictMode: false
      }
    } as ResolvedConfig;

    // Create mocked instances
    mockPriorityGenerator = {
      initialize: jest.fn().mockResolvedValue(undefined),
      discoverDocuments: jest.fn().mockResolvedValue([
        {
          documentId: 'guide--getting-started',
          category: 'guide',
          language: 'en',
          sourcePath: '/test/docs/en/guide/getting-started.md',
          stats: { size: 5120 }
        },
        {
          documentId: 'api--action-only',
          category: 'api',
          language: 'en',
          sourcePath: '/test/docs/en/api/action-only.md',
          stats: { size: 3072 }
        }
      ]),
      bulkGeneratePriorities: jest.fn().mockResolvedValue({
        summary: {
          totalDiscovered: 10,
          totalGenerated: 8,
          totalSkipped: 2,
          totalErrors: 0
        },
        errors: []
      })
    } as any;

    mockTemplateGenerator = {
      generateAllTemplates: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Mock constructors
    (PriorityGenerator as jest.MockedClass<typeof PriorityGenerator>).mockImplementation(() => mockPriorityGenerator);
    (TemplateGenerator as jest.MockedClass<typeof TemplateGenerator>).mockImplementation(() => mockTemplateGenerator);

    initCommand = new InitCommand(mockConfig);
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should perform complete initialization with default options', async () => {
      await initCommand.execute();

      // Verify PriorityGenerator was initialized
      expect(mockPriorityGenerator.initialize).toHaveBeenCalledTimes(2); // Once for discovery, once for priority generation

      // Verify discovery was called for both languages
      expect(mockPriorityGenerator.discoverDocuments).toHaveBeenCalledWith('en');
      expect(mockPriorityGenerator.discoverDocuments).toHaveBeenCalledWith('ko');

      // Verify priority generation was called for both languages
      expect(mockPriorityGenerator.bulkGeneratePriorities).toHaveBeenCalledWith({
        languages: ['en'],
        dryRun: false,
        overwriteExisting: false
      });
      expect(mockPriorityGenerator.bulkGeneratePriorities).toHaveBeenCalledWith({
        languages: ['ko'],
        dryRun: false,
        overwriteExisting: false
      });

      // Verify template generation was called
      expect(mockTemplateGenerator.generateAllTemplates).toHaveBeenCalledTimes(1);

      // Verify success message
      expect(logOutput.some(log => log.includes('🎉 Project initialization completed successfully!'))).toBe(true);
    });

    it('should respect dry-run option', async () => {
      await initCommand.execute({ dryRun: true });

      // Verify dry-run was passed to priority generation
      expect(mockPriorityGenerator.bulkGeneratePriorities).toHaveBeenCalledWith({
        languages: ['en'],
        dryRun: true,
        overwriteExisting: false
      });

      // Template generation should not be called in dry-run mode
      expect(mockTemplateGenerator.generateAllTemplates).not.toHaveBeenCalled();
    });

    it('should respect overwrite option', async () => {
      await initCommand.execute({ overwrite: true });

      // Verify overwrite was passed to priority generation
      expect(mockPriorityGenerator.bulkGeneratePriorities).toHaveBeenCalledWith({
        languages: ['en'],
        dryRun: false,
        overwriteExisting: true
      });
      expect(mockPriorityGenerator.bulkGeneratePriorities).toHaveBeenCalledWith({
        languages: ['ko'],
        dryRun: false,
        overwriteExisting: true
      });
    });

    it('should respect quiet option', async () => {
      await initCommand.execute({ quiet: true });

      // Verify no verbose output in quiet mode
      expect(logOutput.length).toBe(0);
    });

    it('should skip discovery when skipDiscovery is true', async () => {
      await initCommand.execute({ skipDiscovery: true });

      // Discovery should not be called
      expect(mockPriorityGenerator.discoverDocuments).not.toHaveBeenCalled();

      // But other steps should still proceed
      expect(mockPriorityGenerator.bulkGeneratePriorities).toHaveBeenCalled();
      expect(mockTemplateGenerator.generateAllTemplates).toHaveBeenCalled();
    });

    it('should skip priority generation when skipPriority is true', async () => {
      await initCommand.execute({ skipPriority: true });

      // Discovery should still be called
      expect(mockPriorityGenerator.discoverDocuments).toHaveBeenCalled();

      // Priority generation should not be called
      expect(mockPriorityGenerator.bulkGeneratePriorities).not.toHaveBeenCalled();

      // Template generation should still proceed
      expect(mockTemplateGenerator.generateAllTemplates).toHaveBeenCalled();
    });

    it('should skip template generation when skipTemplates is true', async () => {
      await initCommand.execute({ skipTemplates: true });

      // Discovery and priority generation should proceed
      expect(mockPriorityGenerator.discoverDocuments).toHaveBeenCalled();
      expect(mockPriorityGenerator.bulkGeneratePriorities).toHaveBeenCalled();

      // Template generation should not be called
      expect(mockTemplateGenerator.generateAllTemplates).not.toHaveBeenCalled();
    });

    it('should handle errors in discovery step', async () => {
      const error = new Error('Discovery failed');
      mockPriorityGenerator.discoverDocuments.mockRejectedValueOnce(error);

      await expect(initCommand.execute()).rejects.toThrow('Discovery failed');

      // Error should be logged
      expect(errorOutput.some(log => log.includes('❌ Initialization failed:'))).toBe(true);
    });

    it('should handle errors in priority generation step', async () => {
      const error = new Error('Priority generation failed');
      mockPriorityGenerator.bulkGeneratePriorities.mockRejectedValueOnce(error);

      await expect(initCommand.execute()).rejects.toThrow('Priority generation failed');

      // Error should be logged
      expect(errorOutput.some(log => log.includes('❌ Initialization failed:'))).toBe(true);
    });

    it('should handle errors in template generation step', async () => {
      const error = new Error('Template generation failed');
      mockTemplateGenerator.generateAllTemplates.mockRejectedValueOnce(error);

      await expect(initCommand.execute()).rejects.toThrow('Template generation failed');

      // Error should be logged
      expect(errorOutput.some(log => log.includes('❌ Initialization failed:'))).toBe(true);
    });

    it('should show priority generation errors in output', async () => {
      mockPriorityGenerator.bulkGeneratePriorities.mockResolvedValueOnce({
        summary: {
          totalDiscovered: 10,
          totalGenerated: 7,
          totalSkipped: 2,
          totalErrors: 1
        },
        errors: [
          {
            document: { documentId: 'problematic-doc' },
            error: 'Invalid format'
          }
        ]
      });

      await initCommand.execute();

      // Should show error information
      expect(logOutput.some(log => log.includes('Errors: 1'))).toBe(true);
      expect(logOutput.some(log => log.includes('problematic-doc: Invalid format'))).toBe(true);
    });

    it('should display correct summary information', async () => {
      await initCommand.execute();

      // Check summary display
      expect(logOutput.some(log => log.includes('📋 Summary:'))).toBe(true);
      expect(logOutput.some(log => log.includes('📚 Document Discovery   ✅ Completed'))).toBe(true);
      expect(logOutput.some(log => log.includes('📊 Priority Generation  ✅ Completed'))).toBe(true);
      expect(logOutput.some(log => log.includes('📝 Template Creation    ✅ Completed'))).toBe(true);

      // Check next steps
      expect(logOutput.some(log => log.includes('🚀 Next Steps:'))).toBe(true);
      expect(logOutput.some(log => log.includes('Run `simple-llms-batch` to generate final LLMS files'))).toBe(true);
    });

    it('should work with single language configuration', async () => {
      const singleLangConfig = {
        ...mockConfig,
        generation: {
          ...mockConfig.generation,
          supportedLanguages: ['en']
        }
      };

      const singleLangCommand = new InitCommand(singleLangConfig);
      await singleLangCommand.execute();

      // Should only process English
      expect(mockPriorityGenerator.discoverDocuments).toHaveBeenCalledWith('en');
      expect(mockPriorityGenerator.discoverDocuments).not.toHaveBeenCalledWith('ko');
    });

    it('should work with custom character limits', async () => {
      const customLimitsConfig = {
        ...mockConfig,
        generation: {
          ...mockConfig.generation,
          characterLimits: [50, 150, 500, 2000]
        }
      };

      const customLimitsCommand = new InitCommand(customLimitsConfig);
      await customLimitsCommand.execute();

      // Should display custom limits in output
      expect(logOutput.some(log => log.includes('📏 Character Limits: 50, 150, 500, 2000'))).toBe(true);
    });
  });

  describe('step execution details', () => {
    it('should display document discovery details correctly', async () => {
      mockPriorityGenerator.discoverDocuments.mockResolvedValueOnce([
        { documentId: 'guide-1', category: 'guide' },
        { documentId: 'guide-2', category: 'guide' },
        { documentId: 'api-1', category: 'api' }
      ] as any);

      await initCommand.execute();

      // Should show discovery details
      expect(logOutput.some(log => log.includes('🔍 Step 1: Document Discovery'))).toBe(true);
      expect(logOutput.some(log => log.includes('Found 3 documents'))).toBe(true);
      expect(logOutput.some(log => log.includes('guide: 2 docs'))).toBe(true);
      expect(logOutput.some(log => log.includes('api: 1 docs'))).toBe(true);
    });

    it('should display priority generation statistics', async () => {
      await initCommand.execute();

      // Should show priority generation details
      expect(logOutput.some(log => log.includes('📊 Step 2: Priority JSON Generation'))).toBe(true);
      expect(logOutput.some(log => log.includes('Generated: 8'))).toBe(true);
      expect(logOutput.some(log => log.includes('Skipped: 2'))).toBe(true);
    });

    it('should display template generation progress', async () => {
      await initCommand.execute();

      // Should show template generation details
      expect(logOutput.some(log => log.includes('📝 Step 3: Template Generation'))).toBe(true);
      expect(logOutput.some(log => log.includes('✅ Template generation completed'))).toBe(true);
    });
  });

  describe('dry-run mode', () => {
    it('should show what would be generated in dry-run mode', async () => {
      await initCommand.execute({ dryRun: true });

      // Should show dry-run indicator
      expect(logOutput.some(log => log.includes('🔍 [DRY RUN MODE]'))).toBe(true);

      // Should still call discovery and priority generation with dry-run flag
      expect(mockPriorityGenerator.discoverDocuments).toHaveBeenCalled();
      expect(mockPriorityGenerator.bulkGeneratePriorities).toHaveBeenCalledWith(
        expect.objectContaining({ dryRun: true })
      );
    });

    it('should show template generation dry-run information', async () => {
      await initCommand.execute({ dryRun: true });

      // Template generation should show what would be generated
      expect(logOutput.some(log => log.includes('Would generate 3 templates per document'))).toBe(true);
      expect(logOutput.some(log => log.includes('Character limits: 100, 300, 1000'))).toBe(true);
    });
  });
});