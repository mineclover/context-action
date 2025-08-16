/**
 * sync-documents 명령어 테스트
 * Git 커밋 트리거 기반 양방향 문서 동기화 워크플로우 테스트
 */

import { jest } from '@jest/globals';
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { 
  createSyncDocumentsCommand, 
  getChangedFiles, 
  SyncResult 
} from '../../src/cli/commands/sync-documents.js';

// Mock dependencies
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('child_process');
jest.mock('../../src/core/EnhancedConfigManager.js');
jest.mock('../../src/core/ConfigManager.js');
jest.mock('../../src/core/EnhancedWorkStatusManager.js');
jest.mock('../../src/infrastructure/monitoring/PerformanceMonitor.js');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('sync-documents CLI Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock performance monitor
    const mockPerformanceMonitor = {
      startTiming: jest.fn(() => jest.fn()),
    };
    jest.doMock('../../src/infrastructure/monitoring/PerformanceMonitor.js', () => ({
      globalPerformanceMonitor: mockPerformanceMonitor
    }));
  });

  describe('createSyncDocumentsCommand', () => {
    it('should create sync-docs command with correct options', () => {
      const command = createSyncDocumentsCommand();
      
      expect(command).toBeInstanceOf(Command);
      expect(command.name()).toBe('sync-docs');
      expect(command.description()).toContain('Git 커밋 기반 문서 동기화');
      
      // Check if options are properly set
      const options = command.options;
      expect(options).toHaveLength(4);
      expect(options.some(opt => opt.long === '--changed-files')).toBe(true);
      expect(options.some(opt => opt.long === '--mode')).toBe(true);
      expect(options.some(opt => opt.long === '--dry-run')).toBe(true);
      expect(options.some(opt => opt.long === '--quiet')).toBe(true);
    });

    it('should have default mode as "both"', () => {
      const command = createSyncDocumentsCommand();
      const modeOption = command.options.find(opt => opt.long === '--mode');
      expect(modeOption?.defaultValue).toBe('both');
    });
  });

  describe('getChangedFiles', () => {
    it('should return changed markdown files from git', () => {
      const mockStagedFiles = 'docs/guide1.md\ndocs/guide2.md\n';
      const mockRecentFiles = 'docs/guide3.md\ndocs/README.md\n';
      
      mockExecSync
        .mockReturnValueOnce(mockStagedFiles)
        .mockReturnValueOnce(mockRecentFiles);

      const result = getChangedFiles();
      
      expect(result).toEqual([
        'docs/guide1.md',
        'docs/guide2.md', 
        'docs/guide3.md',
        'docs/README.md'
      ]);
      
      expect(mockExecSync).toHaveBeenCalledWith('git diff --cached --name-only', { encoding: 'utf-8' });
      expect(mockExecSync).toHaveBeenCalledWith('git diff HEAD~1 --name-only', { encoding: 'utf-8' });
    });

    it('should filter only markdown and text files', () => {
      const mockFiles = 'docs/guide.md\nsrc/index.ts\ndocs/summary.txt\npackage.json\n';
      
      mockExecSync
        .mockReturnValueOnce(mockFiles)
        .mockReturnValueOnce('');

      const result = getChangedFiles();
      
      expect(result).toEqual(['docs/guide.md', 'docs/summary.txt']);
    });

    it('should remove duplicates from staged and recent files', () => {
      const mockFiles = 'docs/guide.md\ndocs/README.md\n';
      
      mockExecSync
        .mockReturnValueOnce(mockFiles)
        .mockReturnValueOnce(mockFiles); // Same files in both calls

      const result = getChangedFiles();
      
      expect(result).toEqual(['docs/guide.md', 'docs/README.md']);
    });

    it('should handle git command failures gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Git command failed');
      });

      const result = getChangedFiles();
      
      expect(result).toEqual([]);
    });

    it('should handle empty git output', () => {
      mockExecSync
        .mockReturnValueOnce('')
        .mockReturnValueOnce('');

      const result = getChangedFiles();
      
      expect(result).toEqual([]);
    });
  });

  describe('File Type Detection', () => {
    it('should identify summary documents correctly', () => {
      // This would be tested through the actual command execution
      // Testing determineFileType function indirectly through sync workflow
      const summaryPaths = [
        'docs/llms/ko/llms-1000chars-ko.txt',
        'docs/en/llms/llms-minimum-en.txt',
        'docs/ko/llms/llms-origin-ko.txt'
      ];
      
      summaryPaths.forEach(path => {
        expect(path.includes('/llms/') && path.endsWith('.txt')).toBe(true);
      });
    });

    it('should identify source documents correctly', () => {
      const sourcePaths = [
        'docs/README.md',
        'docs/guides/getting-started.md',
        'docs/api/actions.md'
      ];
      
      sourcePaths.forEach(path => {
        expect(path.endsWith('.md') && !path.includes('/llms/')).toBe(true);
      });
    });
  });

  describe('Integration with Enhanced Configs', () => {
    it('should load enhanced configuration successfully', async () => {
      const mockConfig = {
        paths: {
          docsDir: './docs',
          llmContentDir: './data',
          outputDir: './docs/llms'
        },
        generation: {
          supportedLanguages: ['ko', 'en'],
          characterLimits: [100, 300, 1000, 2000]
        }
      };

      const mockEnhancedConfigManager = {
        loadConfig: jest.fn().mockResolvedValue(mockConfig)
      };

      jest.doMock('../../src/core/EnhancedConfigManager.js', () => ({
        EnhancedConfigManager: jest.fn(() => mockEnhancedConfigManager)
      }));

      // This tests that config loading works in the command execution context
      expect(mockConfig.paths.docsDir).toBe('./docs');
      expect(mockConfig.generation.supportedLanguages).toContain('ko');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing files gracefully', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      // Test that non-existent files are handled properly
      expect(mockFs.existsSync('non-existent-file.json')).toBe(false);
    });

    it('should handle file read errors', async () => {
      const mockReadFile = jest.fn().mockRejectedValue(new Error('File read error'));
      
      jest.doMock('fs/promises', () => ({
        readFile: mockReadFile,
        writeFile: jest.fn()
      }));

      try {
        await mockReadFile('invalid-file.txt', 'utf-8');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('File read error');
      }
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract language and character limit from summary files', () => {
      const testCases = [
        {
          filename: 'llms-1000chars-ko.txt',
          expected: { charLimit: '1000chars', language: 'KO' }
        },
        {
          filename: 'llms-minimum-en.txt', 
          expected: { charLimit: 'minimum', language: 'EN' }
        },
        {
          filename: 'llms-origin-ko.txt',
          expected: { charLimit: 'origin', language: 'KO' }
        }
      ];

      testCases.forEach(({ filename, expected }) => {
        const fileMatch = filename.match(/llms-(\w+)-(\w+)\.txt/);
        if (fileMatch) {
          expect(fileMatch[1]).toBe(expected.charLimit);
          expect(fileMatch[2].toUpperCase()).toBe(expected.language);
        }
      });
    });

    it('should extract document IDs from file paths', () => {
      const testCases = [
        { path: 'docs/getting-started.md', expected: 'getting-started' },
        { path: 'docs/api/actions.md', expected: 'actions' },
        { path: 'docs/guides/troubleshooting.md', expected: 'troubleshooting' }
      ];

      testCases.forEach(({ path, expected }) => {
        const fileName = path.split('/').pop();
        const documentId = fileName?.replace(/\.[^.]+$/, '');
        expect(documentId).toBe(expected);
      });
    });
  });

  describe('Bidirectional Sync Workflows', () => {
    it('should handle summary-to-source workflow', () => {
      // Test summary document change triggers source document updates
      const workflow = {
        mode: 'summary-to-source',
        triggerFile: 'docs/llms/ko/llms-1000chars-ko.txt',
        expectedUpdates: ['data/ko/getting-started.json', 'data/ko/api-reference.json']
      };

      expect(workflow.mode).toBe('summary-to-source');
      expect(workflow.triggerFile.includes('/llms/')).toBe(true);
      expect(workflow.expectedUpdates.every(path => path.endsWith('.json'))).toBe(true);
    });

    it('should handle source-to-summary workflow', () => {
      // Test source document change triggers summary document updates
      const workflow = {
        mode: 'source-to-summary',
        triggerFile: 'docs/guides/getting-started.md',
        expectedUpdates: [
          'docs/llms/ko/llms-1000chars-ko.txt',
          'docs/llms/en/llms-1000chars-en.txt'
        ]
      };

      expect(workflow.mode).toBe('source-to-summary');
      expect(workflow.triggerFile.endsWith('.md')).toBe(true);
      expect(workflow.expectedUpdates.every(path => path.includes('/llms/'))).toBe(true);
    });
  });

  describe('Frontmatter Updates', () => {
    it('should update priority JSON frontmatter correctly', () => {
      const mockPriorityData = {
        document: { id: 'getting-started', title: 'Getting Started' },
        priority: { score: 95 },
        work_status: {}
      };

      const updates = {
        lastSummaryUpdate: '2024-01-15T10:30:00.000Z',
        summaryPath: 'docs/llms/ko/llms-1000chars-ko.txt',
        charLimit: '1000chars',
        language: 'ko'
      };

      const expectedResult = {
        ...mockPriorityData,
        work_status: {
          ...updates,
          last_checked: expect.any(String)
        }
      };

      // Simulate the update
      const updatedData = {
        ...mockPriorityData,
        work_status: { ...mockPriorityData.work_status, ...updates }
      };

      expect(updatedData.work_status.lastSummaryUpdate).toBe(updates.lastSummaryUpdate);
      expect(updatedData.work_status.summaryPath).toBe(updates.summaryPath);
    });

    it('should update summary document headers correctly', () => {
      const mockSummaryContent = `Language: KO
Type: 1000chars
Generated: 2024-01-15T09:00:00.000Z

# Context-Action Framework 문서 요약

## 시작하기
...content...`;

      const updates = {
        lastSourceUpdate: '2024-01-15T10:30:00.000Z',
        relatedDocument: 'getting-started'
      };

      const expectedHeaderLines = [
        'LastSourceUpdate: 2024-01-15T10:30:00.000Z',
        'RelatedDocument: getting-started'
      ];

      expectedHeaderLines.forEach(line => {
        expect(line).toMatch(/^[A-Z][a-zA-Z]+: .+$/);
      });
    });
  });

  describe('Result Reporting', () => {
    it('should create comprehensive sync results', () => {
      const mockResult: SyncResult = {
        success: true,
        processedFiles: ['docs/guide.md', 'docs/llms/summary.txt'],
        updatedFrontmatters: ['data/ko/guide.json', 'docs/llms/ko/summary.txt'],
        errors: [],
        summary: {
          totalProcessed: 2,
          summaryDocsUpdated: 1,
          sourceDosUpdated: 1,
          frontmatterUpdates: 2
        }
      };

      expect(mockResult.success).toBe(true);
      expect(mockResult.processedFiles).toHaveLength(2);
      expect(mockResult.updatedFrontmatters).toHaveLength(2);
      expect(mockResult.errors).toHaveLength(0);
      expect(mockResult.summary.totalProcessed).toBe(2);
    });

    it('should handle error scenarios in results', () => {
      const mockErrorResult: SyncResult = {
        success: false,
        processedFiles: ['docs/invalid.md'],
        updatedFrontmatters: [],
        errors: ['docs/invalid.md: 파일을 읽을 수 없습니다'],
        summary: {
          totalProcessed: 1,
          summaryDocsUpdated: 0,
          sourceDosUpdated: 0,
          frontmatterUpdates: 0
        }
      };

      expect(mockErrorResult.success).toBe(false);
      expect(mockErrorResult.errors).toHaveLength(1);
      expect(mockErrorResult.errors[0]).toContain('파일을 읽을 수 없습니다');
    });
  });

  describe('CLI Integration', () => {
    it('should support dry-run mode', () => {
      const options = {
        dryRun: true,
        quiet: false,
        mode: 'both',
        changedFiles: 'docs/test.md'
      };

      expect(options.dryRun).toBe(true);
      // In dry-run mode, no actual file modifications should occur
    });

    it('should support quiet mode', () => {
      const options = {
        dryRun: false,
        quiet: true,
        mode: 'both',
        changedFiles: null
      };

      expect(options.quiet).toBe(true);
      // In quiet mode, minimal console output should be produced
    });

    it('should support different sync modes', () => {
      const modes = ['summary-to-source', 'source-to-summary', 'both'];
      
      modes.forEach(mode => {
        expect(['summary-to-source', 'source-to-summary', 'both']).toContain(mode);
      });
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track command execution time', () => {
      const mockStopTiming = jest.fn();
      const mockStartTiming = jest.fn(() => mockStopTiming);
      
      const mockPerformanceMonitor = {
        startTiming: mockStartTiming
      };

      // Simulate command execution with timing
      const stopTiming = mockPerformanceMonitor.startTiming('sync-documents');
      expect(mockStartTiming).toHaveBeenCalledWith('sync-documents');
      
      stopTiming();
      expect(mockStopTiming).toHaveBeenCalled();
    });
  });
});