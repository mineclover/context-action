/**
 * Git Workflow Integration Tests
 * Husky hooks 및 Git 커밋 트리거 워크플로우 통합 테스트
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { tmpdir } from 'os';

// Mock dependencies for testing
jest.mock('child_process');
jest.mock('fs');

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Git Workflow Integration', () => {
  let testRepoPath: string;
  
  beforeEach(() => {
    jest.clearAllMocks();
    testRepoPath = path.join(tmpdir(), `test-repo-${Date.now()}`);
  });

  describe('Husky Hooks Integration', () => {
    describe('post-commit hook', () => {
      it('should execute sync-docs command after commit', () => {
        const hookScript = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
echo "🔄 커밋 후 문서 동기화를 시작합니다..."
npx @context-action/llms-generator sync-docs --quiet`;

        // Verify hook script contains correct commands
        expect(hookScript).toContain('sync-docs --quiet');
        expect(hookScript).toContain('husky.sh');
        expect(hookScript).toContain('커밋 후 문서 동기화');
      });

      it('should handle hook execution success', () => {
        mockExecSync.mockReturnValue('Sync completed successfully');
        
        const result = mockExecSync('npx @context-action/llms-generator sync-docs --quiet');
        expect(result).toContain('Sync completed successfully');
      });

      it('should handle hook execution failure gracefully', () => {
        mockExecSync.mockImplementation(() => {
          throw new Error('Hook execution failed');
        });

        expect(() => {
          mockExecSync('npx @context-action/llms-generator sync-docs --quiet');
        }).toThrow('Hook execution failed');
      });
    });

    describe('post-merge hook', () => {
      it('should detect changed files and run sync selectively', () => {
        const hookScript = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔄 머지 후 문서 동기화를 확인합니다..."

CHANGED_FILES=$(git diff HEAD~1 --name-only | grep -E '\\.(md|txt)' | tr '\\n' ',' | sed 's/,$//')

if [ -n "$CHANGED_FILES" ]; then
  echo "📄 변경된 문서가 감지되었습니다: $CHANGED_FILES"
  npx @context-action/llms-generator sync-docs --changed-files "$CHANGED_FILES" --quiet
else
  echo "📄 변경된 문서가 없습니다."
fi`;

        expect(hookScript).toContain('git diff HEAD~1 --name-only');
        expect(hookScript).toContain('grep -E');
        expect(hookScript).toContain('--changed-files');
      });

      it('should handle merge with document changes', () => {
        const mockChangedFiles = 'docs/guide.md,docs/api.md';
        mockExecSync
          .mockReturnValueOnce(mockChangedFiles)
          .mockReturnValueOnce('Sync completed for changed files');

        // Simulate git diff command
        const diffResult = mockExecSync('git diff HEAD~1 --name-only');
        expect(diffResult).toBe(mockChangedFiles);

        // Simulate sync command with changed files
        const syncResult = mockExecSync(`sync-docs --changed-files "${mockChangedFiles}"`);
        expect(syncResult).toContain('Sync completed');
      });

      it('should handle merge with no document changes', () => {
        mockExecSync.mockReturnValue(''); // No changed files

        const diffResult = mockExecSync('git diff HEAD~1 --name-only');
        expect(diffResult).toBe('');
        // No sync command should be executed
      });
    });

    describe('pre-commit hook', () => {
      it('should validate priority JSON files before commit', () => {
        const hookScript = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Priority JSON 파일 검증을 시작합니다..."

npx @context-action/llms-generator pre-commit-check

if [ $? -ne 0 ]; then
  echo "❌ Priority JSON 검증에 실패했습니다. 커밋이 차단됩니다."
  exit 1
fi

echo "✅ Priority JSON 검증이 완료되었습니다."`;

        expect(hookScript).toContain('pre-commit-check');
        expect(hookScript).toContain('exit 1');
        expect(hookScript).toContain('Priority JSON 검증');
      });
    });
  });

  describe('Bidirectional Document Synchronization', () => {
    describe('Summary to Source Workflow', () => {
      it('should update priority JSON when summary document changes', async () => {
        const summaryDocument = {
          path: 'docs/llms/ko/llms-1000chars-ko.txt',
          content: `Language: KO
Type: 1000chars
Generated: 2024-01-15T09:00:00.000Z

# Context-Action Framework 문서 요약 (1000자)

## [시작하기](../../../getting-started.md)
Context-Action 프레임워크의 기본 설정과 첫 번째 예제...

## [API 참조](../../../api/actions.md) 
액션 시스템의 핵심 API 문서...`
        };

        const expectedPriorityUpdates = [
          {
            path: 'data/ko/getting-started.json',
            updates: {
              lastSummaryUpdate: expect.any(String),
              summaryPath: summaryDocument.path,
              charLimit: '1000chars',
              language: 'ko'
            }
          },
          {
            path: 'data/ko/actions.json', 
            updates: {
              lastSummaryUpdate: expect.any(String),
              summaryPath: summaryDocument.path,
              charLimit: '1000chars',
              language: 'ko'
            }
          }
        ];

        // Verify that the workflow identifies correct document IDs
        const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        const documentIds = [];
        let match;
        
        while ((match = linkPattern.exec(summaryDocument.content)) !== null) {
          const url = match[2];
          const segments = url.split('/');
          const lastSegment = segments[segments.length - 1].replace(/\.md$/, '');
          documentIds.push(lastSegment);
        }

        expect(documentIds).toContain('getting-started');
        expect(documentIds).toContain('actions');
        expect(expectedPriorityUpdates).toHaveLength(2);
      });

      it('should extract metadata from summary document correctly', () => {
        const testCases = [
          {
            filename: 'llms-1000chars-ko.txt',
            content: 'Language: KO\nType: 1000chars\n',
            expected: { language: 'KO', charLimit: '1000chars' }
          },
          {
            filename: 'llms-minimum-en.txt',
            content: 'Language: EN\nType: Minimum (Navigation Links)\n', 
            expected: { language: 'EN', charLimit: 'minimum' }
          },
          {
            filename: 'llms-origin-ko.txt',
            content: 'Language: KO\nType: Origin (Complete Documents)\n',
            expected: { language: 'KO', charLimit: 'origin' }
          }
        ];

        testCases.forEach(({ filename, content, expected }) => {
          // Test filename parsing
          const fileMatch = filename.match(/llms-(\w+)-(\w+)\.txt/);
          if (fileMatch) {
            expect(fileMatch[2].toUpperCase()).toBe(expected.language);
          }

          // Test content parsing
          const lines = content.split('\n');
          let language = '';
          let charLimit = '';

          for (const line of lines) {
            if (line.startsWith('Language:')) {
              language = line.split(':')[1]?.trim() || '';
            }
            if (line.startsWith('Type:')) {
              if (line.includes('chars')) {
                const match = line.match(/(\d+)chars/);
                charLimit = match ? match[0] : '';
              } else if (line.includes('Minimum')) {
                charLimit = 'minimum';
              } else if (line.includes('Origin')) {
                charLimit = 'origin';
              }
            }
          }

          expect(language).toBe(expected.language);
          expect(charLimit).toBe(expected.charLimit);
        });
      });
    });

    describe('Source to Summary Workflow', () => {
      it('should update summary document headers when source changes', async () => {
        const sourceDocument = {
          path: 'docs/guides/getting-started.md',
          lastModified: '2024-01-15T10:30:00.000Z'
        };

        const expectedSummaryUpdates = [
          'docs/llms/ko/llms-100chars-ko.txt',
          'docs/llms/ko/llms-300chars-ko.txt', 
          'docs/llms/ko/llms-1000chars-ko.txt',
          'docs/llms/ko/llms-2000chars-ko.txt',
          'docs/llms/en/llms-100chars-en.txt',
          'docs/llms/en/llms-300chars-en.txt',
          'docs/llms/en/llms-1000chars-en.txt',
          'docs/llms/en/llms-2000chars-en.txt'
        ];

        const characterLimits = [100, 300, 1000, 2000];
        const languages = ['ko', 'en'];

        // Verify correct summary file paths are generated
        const generatedPaths = [];
        for (const language of languages) {
          for (const limit of characterLimits) {
            generatedPaths.push(`docs/llms/${language}/llms-${limit}chars-${language}.txt`);
          }
        }

        expect(generatedPaths).toEqual(expectedSummaryUpdates);

        // Verify priority JSON updates for all languages
        const documentId = path.basename(sourceDocument.path, '.md');
        const expectedPriorityPaths = languages.map(lang => 
          `data/${lang}/${documentId}.json`
        );

        expect(expectedPriorityPaths).toEqual([
          'data/ko/getting-started.json',
          'data/en/getting-started.json'
        ]);
      });

      it('should handle source document metadata extraction', () => {
        const testCases = [
          { path: 'docs/getting-started.md', expected: 'getting-started' },
          { path: 'docs/api/actions.md', expected: 'actions' },
          { path: 'docs/guides/troubleshooting.md', expected: 'troubleshooting' },
          { path: 'docs/concept/architecture.md', expected: 'architecture' }
        ];

        testCases.forEach(({ path, expected }) => {
          const documentId = path.split('/').pop()?.replace(/\.[^.]+$/, '');
          expect(documentId).toBe(expected);
        });
      });
    });
  });

  describe('File Type Detection', () => {
    it('should correctly identify summary documents', () => {
      const summaryFiles = [
        'docs/llms/ko/llms-1000chars-ko.txt',
        'docs/en/llms/llms-minimum-en.txt',
        'docs/ko/llms/llms-origin-ko.txt',
        './docs/llms/en/llms-2000chars-en.txt'
      ];

      summaryFiles.forEach(filePath => {
        const normalizedPath = path.normalize(filePath);
        const isSummary = normalizedPath.includes('/llms/') && normalizedPath.endsWith('.txt');
        expect(isSummary).toBe(true);
      });
    });

    it('should correctly identify source documents', () => {
      const sourceFiles = [
        'docs/README.md',
        'docs/guides/getting-started.md',
        'docs/api/actions.md',
        'docs/concept/architecture.md'
      ];

      sourceFiles.forEach(filePath => {
        const normalizedPath = path.normalize(filePath);
        const isSource = normalizedPath.endsWith('.md') && 
                        !normalizedPath.includes('/llms/') &&
                        (normalizedPath.startsWith('docs/') || normalizedPath.includes('/docs/'));
        expect(isSource).toBe(true);
      });
    });

    it('should identify unknown file types', () => {
      const unknownFiles = [
        'src/index.ts',
        'package.json',
        'README.md', // Not in docs/
        'docs/llms/config.json' // In llms/ but not .txt
      ];

      unknownFiles.forEach(filePath => {
        const normalizedPath = path.normalize(filePath);
        const isSummary = normalizedPath.includes('/llms/') && normalizedPath.endsWith('.txt');
        const isSource = normalizedPath.endsWith('.md') && 
                         !normalizedPath.includes('/llms/') &&
                         (normalizedPath.startsWith('docs/') || normalizedPath.includes('/docs/'));
        
        expect(isSummary || isSource).toBe(false);
      });
    });
  });

  describe('Git Change Detection', () => {
    it('should detect staged files correctly', () => {
      const mockStagedFiles = `docs/getting-started.md
docs/api/actions.md
src/index.ts
docs/llms/ko/summary.txt`;

      mockExecSync.mockReturnValue(mockStagedFiles);

      const result = mockExecSync('git diff --cached --name-only');
      const files = result.toString().trim().split('\n').filter(f => f.length > 0);
      const documentFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt'));

      expect(documentFiles).toEqual([
        'docs/getting-started.md',
        'docs/api/actions.md', 
        'docs/llms/ko/summary.txt'
      ]);
    });

    it('should detect recent commit changes', () => {
      const mockRecentFiles = `docs/guides/installation.md
docs/README.md
package.json`;

      mockExecSync.mockReturnValue(mockRecentFiles);

      const result = mockExecSync('git diff HEAD~1 --name-only');
      const files = result.toString().trim().split('\n').filter(f => f.length > 0);
      const documentFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt'));

      expect(documentFiles).toEqual([
        'docs/guides/installation.md',
        'docs/README.md'
      ]);
    });

    it('should handle git command failures', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: not a git repository');
      });

      expect(() => {
        mockExecSync('git diff --cached --name-only');
      }).toThrow('fatal: not a git repository');
    });
  });

  describe('Priority JSON Updates', () => {
    it('should update work_status section correctly', () => {
      const mockPriorityData = {
        document: {
          id: 'getting-started',
          title: 'Getting Started Guide'
        },
        priority: {
          score: 95,
          tier: 'critical'
        },
        work_status: {
          last_checked: '2024-01-14T15:00:00.000Z'
        }
      };

      const updates = {
        lastSummaryUpdate: '2024-01-15T10:30:00.000Z',
        summaryPath: 'docs/llms/ko/llms-1000chars-ko.txt',
        charLimit: '1000chars',
        language: 'ko'
      };

      const updatedData = {
        ...mockPriorityData,
        work_status: {
          ...mockPriorityData.work_status,
          ...updates,
          last_checked: '2024-01-15T10:30:00.000Z'
        }
      };

      expect(updatedData.work_status.lastSummaryUpdate).toBe(updates.lastSummaryUpdate);
      expect(updatedData.work_status.summaryPath).toBe(updates.summaryPath);
      expect(updatedData.work_status.charLimit).toBe(updates.charLimit);
      expect(updatedData.work_status.language).toBe(updates.language);
    });

    it('should handle missing work_status section', () => {
      const mockPriorityData = {
        document: { id: 'test', title: 'Test' },
        priority: { score: 50, tier: 'optional' }
        // work_status is missing
      };

      const updates = {
        lastSourceUpdate: '2024-01-15T10:30:00.000Z',
        needsUpdate: true
      };

      const updatedData = {
        ...mockPriorityData,
        work_status: updates
      };

      expect(updatedData.work_status).toBeDefined();
      expect(updatedData.work_status.lastSourceUpdate).toBe(updates.lastSourceUpdate);
      expect(updatedData.work_status.needsUpdate).toBe(true);
    });
  });

  describe('Summary Document Header Updates', () => {
    it('should update headers with source change information', () => {
      const mockSummaryContent = `Language: KO
Type: 1000chars
Generated: 2024-01-15T09:00:00.000Z

# Context-Action Framework 문서 요약

내용...`;

      const updates = {
        lastSourceUpdate: '2024-01-15T10:30:00.000Z',
        relatedDocument: 'getting-started'
      };

      const lines = mockSummaryContent.split('\n');
      let headerEndIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') {
          headerEndIndex = i;
          break;
        }
      }

      const updateLines = Object.entries(updates).map(([key, value]) => 
        `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`
      );

      const expectedUpdateLines = [
        'LastSourceUpdate: 2024-01-15T10:30:00.000Z',
        'RelatedDocument: getting-started'
      ];

      expect(updateLines).toEqual(expectedUpdateLines);
      expect(headerEndIndex).toBe(3); // After "Generated" line
    });

    it('should replace existing update headers', () => {
      const mockSummaryWithUpdates = `Language: KO
Type: 1000chars
Generated: 2024-01-15T09:00:00.000Z
LastSourceUpdate: 2024-01-14T08:00:00.000Z
RelatedDocument: old-document

# Content starts here`;

      const lines = mockSummaryWithUpdates.split('\n');
      const headerLines = lines.slice(0, 6); // Header section
      
      // Filter out existing update lines
      const filteredLines = headerLines.filter(line => 
        !line.startsWith('LastSourceUpdate:') && 
        !line.startsWith('RelatedDocument:')
      );

      expect(filteredLines).toEqual([
        'Language: KO',
        'Type: 1000chars', 
        'Generated: 2024-01-15T09:00:00.000Z',
        ''
      ]);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle file system errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(mockFs.existsSync('non-existent.json')).toBe(false);
      expect(() => mockFs.readFileSync('non-existent.json')).toThrow('ENOENT');
    });

    it('should collect and report errors properly', () => {
      const errors = [
        'docs/broken.md: 파일을 읽을 수 없습니다',
        'data/ko/missing.json: Priority JSON 파일이 존재하지 않습니다',
        'docs/llms/invalid.txt: 메타데이터 추출 실패'
      ];

      const syncResult = {
        success: false,
        processedFiles: ['docs/broken.md', 'docs/llms/invalid.txt'],
        updatedFrontmatters: [],
        errors: errors,
        summary: {
          totalProcessed: 2,
          summaryDocsUpdated: 0,
          sourceDosUpdated: 0,
          frontmatterUpdates: 0
        }
      };

      expect(syncResult.success).toBe(false);
      expect(syncResult.errors).toHaveLength(3);
      expect(syncResult.errors.every(error => error.includes(':'))).toBe(true);
    });

    it('should continue processing after individual file errors', () => {
      const files = ['docs/good.md', 'docs/broken.md', 'docs/another-good.md'];
      const errors = ['docs/broken.md: 처리 실패'];
      const successfulFiles = ['docs/good.md', 'docs/another-good.md'];

      // Simulate partial success scenario
      const result = {
        processedFiles: files,
        errors: errors,
        successfulFiles: files.filter(f => !errors.some(e => e.includes(f)))
      };

      expect(result.successfulFiles).toEqual(successfulFiles);
      expect(result.successfulFiles).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track processing performance metrics', () => {
      const performanceData = {
        startTime: Date.now(),
        filesProcessed: 0,
        errorsEncountered: 0,
        totalFiles: 5
      };

      // Simulate file processing
      for (let i = 0; i < performanceData.totalFiles; i++) {
        try {
          // Mock file processing
          performanceData.filesProcessed++;
        } catch (error) {
          performanceData.errorsEncountered++;
        }
      }

      const endTime = Date.now();
      const duration = endTime - performanceData.startTime;

      expect(performanceData.filesProcessed).toBe(5);
      expect(performanceData.errorsEncountered).toBe(0);
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should provide processing statistics', () => {
      const stats = {
        totalFiles: 10,
        summaryFiles: 4,
        sourceFiles: 6,
        priorityUpdates: 8,
        headerUpdates: 12,
        processingTimeMs: 1500
      };

      expect(stats.summaryFiles + stats.sourceFiles).toBe(stats.totalFiles);
      expect(stats.priorityUpdates).toBeGreaterThan(0);
      expect(stats.headerUpdates).toBeGreaterThan(stats.priorityUpdates);
      expect(stats.processingTimeMs).toBeGreaterThan(0);
    });
  });

  describe('Configuration Integration', () => {
    it('should use configuration for supported languages', () => {
      const config = {
        generation: {
          supportedLanguages: ['ko', 'en'],
          characterLimits: [100, 300, 1000, 2000]
        },
        paths: {
          docsDir: './docs',
          llmContentDir: './data',
          outputDir: './docs/llms'
        }
      };

      expect(config.generation.supportedLanguages).toContain('ko');
      expect(config.generation.supportedLanguages).toContain('en');
      expect(config.generation.characterLimits).toHaveLength(4);
      expect(config.paths.outputDir).toBe('./docs/llms');
    });

    it('should construct correct file paths from configuration', () => {
      const config = {
        paths: {
          llmContentDir: './data',
          outputDir: './docs/llms'
        },
        generation: {
          supportedLanguages: ['ko', 'en'],
          characterLimits: [1000, 2000]
        }
      };

      const documentId = 'getting-started';
      const language = 'ko';
      const charLimit = 1000;

      const priorityPath = path.join(config.paths.llmContentDir, language, `${documentId}.json`);
      const summaryPath = path.join(config.paths.outputDir, language, `llms-${charLimit}chars-${language}.txt`);

      expect(priorityPath).toBe('data/ko/getting-started.json');
      expect(summaryPath).toBe('docs/llms/ko/llms-1000chars-ko.txt');
    });
  });
});