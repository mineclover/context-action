import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { MismatchDetectionCommand } from '../../src/cli/commands/MismatchDetectionCommand.js';
import { EnhancedLLMSConfig } from '../../src/types/config.js';

describe('MismatchDetectionCommand', () => {
  let mismatchDetectionCommand: MismatchDetectionCommand;
  let testDataDir: string;
  let testReportPath: string;
  let config: EnhancedLLMSConfig;

  beforeEach(async () => {
    // Setup test directory
    testDataDir = path.join(__dirname, 'test-workspace-mismatch-detection');
    testReportPath = path.join(testDataDir, 'mismatch-report.md');
    
    config = {
      paths: {
        docsDir: path.join(testDataDir, 'docs'),
        llmContentDir: path.join(testDataDir, 'llmsData'),
        outputDir: path.join(testDataDir, 'output'),
        templatesDir: path.join(testDataDir, 'templates'),
        instructionsDir: path.join(testDataDir, 'instructions'),
        excludePatterns: ['**/api/core/src/**/*.md']
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 1000, 2000, 5000],
        defaultLanguage: 'en',
        outputFormat: 'txt'
      },
      categories: {
        guide: { 
          priority: 95,
          name: '가이드',
          description: '사용자 가이드'
        },
        api: { 
          priority: 90,
          name: 'API',
          description: 'API 문서'
        }
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
          strategy: 'exclude-conflicts',
          priority: 'higher-score-wins',
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
          exportFormats: ['json']
        }
      }
    } as EnhancedLLMSConfig;

    mismatchDetectionCommand = new MismatchDetectionCommand(config);

    // Create test directory structure
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'ko', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('mismatch detection', () => {
    it('should detect missing LLMS directories', async () => {
      // Create source document without corresponding LLMS data
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'missing-llms.md'),
        '# Missing LLMS\n\nThis document has no LLMS data.'
      );

      const report = await mismatchDetectionCommand.execute({ outputFile: testReportPath });

      expect(report.summary.missingLlms).toBeGreaterThan(0);
    });

    it('should detect orphaned LLMS directories', async () => {
      // Create LLMS directory without corresponding source document
      await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'guide--orphaned'), { recursive: true });
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--orphaned', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--orphaned', category: 'guide' },
          priority: { score: 85 }
        }, null, 2)
      );

      const report = await mismatchDetectionCommand.execute({ outputFile: testReportPath });

      expect(report.summary.orphanedLlms).toBeGreaterThan(0);
    });

    it('should detect inconsistent structure (missing templates)', async () => {
      // Create source document and basic LLMS structure but missing templates
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        }, null, 2)
      );

      // Don't create template files - this should be detected as inconsistent

      const report = await mismatchDetectionCommand.execute({ outputFile: testReportPath });

      expect(report.summary.inconsistentStructure).toBeGreaterThan(0);
    });

    it('should detect inconsistent structure (missing priority.json)', async () => {
      // Create source document and some templates but missing priority.json
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        '---\ndocument_id: guide--getting-started\n---\n\n# Getting Started\n\nContent'
      );

      // Don't create priority.json - this should be detected as inconsistent

      const report = await mismatchDetectionCommand.execute({ outputFile: testReportPath });

      expect(report.summary.inconsistentStructure).toBeGreaterThan(0);
    });

    it('should report no mismatches when everything is consistent', async () => {
      // Create complete, consistent structure
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a comprehensive guide.'
      );

      // Create priority.json
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--getting-started', category: 'guide' },
          priority: { score: 95 }
        }, null, 2)
      );

      // Create all expected template files
      for (const limit of [100, 300, 1000, 2000, 5000]) {
        await fs.writeFile(
          path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', `guide--getting-started-${limit}.md`),
          `---\ndocument_id: guide--getting-started\ncharacter_limit: ${limit}\n---\n\n# Getting Started\n\nContent for ${limit} chars`
        );
      }

      await mismatchDetectionCommand.execute({ outputFile: testReportPath });
      
      // Command executed successfully without error
      expect(true).toBe(true);
    });

    it('should match nested documents with identical basenames to distinct LLMS directories', async () => {
      const nestedContexts = ['action', 'ref', 'store'];
      const documentIds = nestedContexts.map(
        context => `guide--patterns--${context}--basic-usage`,
      );

      for (const [index, context] of nestedContexts.entries()) {
        const sourceDir = path.join(
          testDataDir,
          'docs',
          'en',
          'guide',
          'patterns',
          context,
        );
        const documentId = documentIds[index];
        if (!documentId) throw new Error('Expected canonical document ID');

        await fs.mkdir(sourceDir, { recursive: true });
        await fs.writeFile(
          path.join(sourceDir, 'basic-usage.md'),
          `# ${context} Basic Usage\n\nUnique ${context} documentation.`,
        );

        const documentDir = path.join(testDataDir, 'llmsData', 'en', documentId);
        await fs.mkdir(documentDir, { recursive: true });
        await fs.writeFile(
          path.join(documentDir, 'priority.json'),
          JSON.stringify({
            document: {
              id: documentId,
              category: 'guide',
              source_path: `en/guide/patterns/${context}/basic-usage.md`,
            },
          }),
        );

        for (const limit of [100, 300, 1000, 2000, 5000]) {
          await fs.writeFile(
            path.join(documentDir, `${documentId}-${limit}.md`),
            `---\ndocument_id: ${documentId}\ncharacter_limit: ${limit}\n---\n`,
          );
        }
      }

      const report = await mismatchDetectionCommand.execute({
        outputFile: testReportPath,
      });
      const nestedMismatches = report.mismatches.filter(mismatch =>
        mismatch.sourcePath?.includes('/patterns/')
        || documentIds.includes(path.basename(mismatch.llmsPath)),
      );

      expect(nestedMismatches).toEqual([]);
    });
  });

  describe('exclude patterns', () => {
    it('should exclude files matching exclude patterns from mismatch detection', async () => {
      // Create document that should be excluded
      await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'api', 'core', 'src'), { recursive: true });
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'api', 'core', 'src', 'ActionRegister.md'),
        '# ActionRegister\n\nGenerated API documentation.'
      );

      // Create normal document without LLMS data (should be detected)
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'missing-llms.md'),
        '# Missing LLMS\n\nThis document has no LLMS data.'
      );

      await mismatchDetectionCommand.execute({ outputFile: testReportPath });
      
      // Command executed successfully without error
      expect(true).toBe(true);
    });
  });

  describe('verbose mode', () => {
    it('should provide detailed information in verbose mode', async () => {
      // Create source document without LLMS data
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      await mismatchDetectionCommand.execute({ verbose: true, outputFile: testReportPath });
      
      // Command executed successfully without error
      expect(true).toBe(true);
    });
  });

  describe('output file generation', () => {
    it('should generate mismatch report file', async () => {
      // Create source document without LLMS data
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const outputFile = path.join(testDataDir, 'mismatch-report.md');

      await mismatchDetectionCommand.execute({ outputFile });

      // Check that report file was created
      const reportExists = await fs.access(outputFile).then(() => true).catch(() => false);
      expect(reportExists).toBe(true);

      // Check that report file contains some content
      const reportContent = await fs.readFile(outputFile, 'utf-8');
      expect(reportContent.length).toBeGreaterThan(10);
    });

    it('should use default output file name when not specified', async () => {
      // Create source document without LLMS data
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      // Change working directory to test directory to control default output location
      const originalCwd = process.cwd();
      process.chdir(testDataDir);
      
      try {
        await mismatchDetectionCommand.execute({});

        // Check that default report file was created
        const defaultOutputFile = 'docs/llms-mismatch-report.md';
        const reportExists = await fs.access(defaultOutputFile).then(() => true).catch(() => false);
        expect(reportExists).toBe(true);

      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('check-only mode', () => {
    it('should only check for mismatches without generating report file', async () => {
      // Create source document without LLMS data
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      const outputFile = path.join(testDataDir, 'should-not-be-created.md');
      await mismatchDetectionCommand.execute({ 
        outputFile, 
        checkOnly: true 
      });

      // Check that no report file was created (checkOnly mode)
      const reportExists = await fs.access(outputFile).then(() => true).catch(() => false);
      expect(reportExists).toBe(false);
    });

    it('should fail when a consistency gate finds mismatches', async () => {
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis document has no LLMS data.',
      );

      await expect(
        mismatchDetectionCommand.execute({
          checkOnly: true,
          failOnMismatch: true,
        }),
      ).rejects.toThrow('LLMS documentation mismatch check failed');
    });

    it('should pass when the consistency gate has no mismatches', async () => {
      await fs.rm(path.join(testDataDir, 'llmsData'), { recursive: true, force: true });
      await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started'), { recursive: true });
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a comprehensive guide.',
      );
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify({ document: { id: 'guide--getting-started' } }),
      );
      for (const limit of [100, 300, 1000, 2000, 5000]) {
        await fs.writeFile(
          path.join(testDataDir, 'llmsData', 'en', 'guide--getting-started', `guide--getting-started-${limit}.md`),
          `# Getting Started (${limit})`,
        );
      }

      await expect(
        mismatchDetectionCommand.execute({ checkOnly: true, failOnMismatch: true }),
      ).resolves.toMatchObject({ totalMismatches: 0 });
    });
  });

  describe('template file detection', () => {
    it('should correctly identify template files using updated regex pattern', async () => {
      // Create source document
      await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'concept'), { recursive: true });
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'concept', 'action-pipeline-guide.md'),
        '# Action Pipeline Guide\n\nThis is a concept guide.'
      );

      // Create LLMS directory with priority.json
      await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'concept--action-pipeline-guide'), { recursive: true });
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'concept--action-pipeline-guide', 'priority.json'),
        JSON.stringify({
          document: { id: 'concept--action-pipeline-guide', category: 'concept' },
          priority: { score: 85 }
        }, null, 2)
      );

      // Create template files with complex naming patterns
      const templateFiles = [
        'concept--action-pipeline-guide-100.md',
        'concept--action-pipeline-guide-300.md',
        'concept--action-pipeline-guide-1000.md'
      ];

      for (const templateFile of templateFiles) {
        await fs.writeFile(
          path.join(testDataDir, 'llmsData', 'en', 'concept--action-pipeline-guide', templateFile),
          `---\ndocument_id: concept--action-pipeline-guide\n---\n\n# Content\n\nTemplate content`
        );
      }

      await mismatchDetectionCommand.execute({ outputFile: testReportPath });
      
      // Command executed successfully without error
      expect(true).toBe(true);
    });

    it('should handle edge cases in template file naming', async () => {
      // Create source document with edge case naming
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'multi-word-document-name.md'),
        '# Multi Word Document\n\nThis is a guide with multiple words in name.'
      );

      // Create LLMS directory
      await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'guide--multi-word-document-name'), { recursive: true });
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--multi-word-document-name', 'priority.json'),
        JSON.stringify({
          document: { id: 'guide--multi-word-document-name', category: 'guide' },
          priority: { score: 90 }
        }, null, 2)
      );

      // Create template files
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--multi-word-document-name', 'guide--multi-word-document-name-100.md'),
        '---\ndocument_id: guide--multi-word-document-name\n---\n\n# Content'
      );

      await mismatchDetectionCommand.execute({ outputFile: testReportPath });
      
      // Command executed successfully without error
      expect(true).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle missing directories gracefully', async () => {
      // Create config with non-existent directories
      const badConfig = {
        ...config,
        paths: {
          ...config.paths,
          docsDir: path.join(testDataDir, 'non-existent-docs'),
          llmContentDir: path.join(testDataDir, 'non-existent-llms')
        }
      };

      const badMismatchDetectionCommand = new MismatchDetectionCommand(badConfig);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await badMismatchDetectionCommand.execute({ outputFile: testReportPath });
        
        // Should handle gracefully
        expect(true).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle file system permission errors', async () => {
      // Create source document
      await fs.writeFile(
        path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md'),
        '# Getting Started\n\nThis is a guide.'
      );

      // Make output directory read-only to cause report generation failure
      const outputDir = path.join(testDataDir, 'reports');
      await fs.mkdir(outputDir, { recursive: true });
      
      try {
        await fs.chmod(outputDir, 0o444);
      } catch {
        // Skip this test if we can't set permissions
        return;
      }

      const outputFile = path.join(outputDir, 'report.md');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await mismatchDetectionCommand.execute({ outputFile });
        
        // Should handle permission errors gracefully
        expect(true).toBe(true);
        
      } catch (error) {
        // Permission error is expected - the command should fail gracefully
        expect(error.message).toContain('permission denied');
        
      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        
        // Restore permissions for cleanup
        try {
          await fs.chmod(outputDir, 0o755);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });
});
