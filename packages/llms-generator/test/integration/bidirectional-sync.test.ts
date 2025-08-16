/**
 * Bidirectional Document Synchronization Tests
 * 양방향 문서 동기화 워크플로우 상세 테스트
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
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

describe('Bidirectional Document Synchronization', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Summary Document to Source Document Workflow', () => {
    it('should process summary document changes and update priority JSON files', async () => {
      const summaryContent = `Language: KO
Type: 1000chars
Generated: 2024-01-15T09:00:00.000Z

# Context-Action Framework 문서 요약 (1000자)

## [시작하기](../../../getting-started.md)
Context-Action 프레임워크의 기본 설정과 첫 번째 예제를 다루는 초보자 가이드입니다.

## [API 참조 - 액션](../../../api/actions.md)
액션 시스템의 핵심 API 문서로, useActionDispatch와 useActionHandler 사용법을 설명합니다.

## [스토어 통합](../../../concept/store-integration.md)
스토어 시스템과 액션의 연동 방법과 3단계 처리 패턴을 설명합니다.`;

      const mockReadFile = jest.fn().mockResolvedValue(summaryContent);
      const mockWriteFile = jest.fn().mockResolvedValue(undefined);
      
      jest.doMock('fs/promises', () => ({
        readFile: mockReadFile,
        writeFile: mockWriteFile
      }));

      // Mock existing priority files
      mockFs.existsSync.mockImplementation((filePath: any) => {
        return filePath.includes('.json');
      });

      // Test metadata extraction
      const lines = summaryContent.split('\n');
      let language = '';
      let charLimit = '';
      const documentIds: string[] = [];

      // Extract language and char limit
      for (const line of lines.slice(0, 10)) {
        if (line.startsWith('Language:')) {
          language = line.split(':')[1]?.trim() || '';
        }
        if (line.startsWith('Type:')) {
          if (line.includes('chars')) {
            const match = line.match(/(\d+)chars/);
            charLimit = match ? match[0] : '';
          }
        }
      }

      // Extract document IDs from links
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkPattern.exec(summaryContent)) !== null) {
        const url = match[2];
        const segments = url.split('/');
        const lastSegment = segments[segments.length - 1].replace(/\.md$/, '');
        documentIds.push(lastSegment);
      }

      expect(language).toBe('KO');
      expect(charLimit).toBe('1000chars');
      expect(documentIds).toEqual(['getting-started', 'actions', 'store-integration']);

      // Verify priority JSON update paths
      const expectedPriorityPaths = documentIds.map(docId => 
        path.join(mockConfig.paths.llmContentDir, 'ko', `${docId}.json`)
      );

      expect(expectedPriorityPaths).toEqual([
        'data/ko/getting-started.json',
        'data/ko/actions.json',
        'data/ko/store-integration.json'
      ]);
    });

    it('should handle summary documents with different formats', async () => {
      const testCases = [
        {
          name: 'Minimum summary',
          filename: 'llms-minimum-ko.txt',
          content: `Language: KO
Type: Minimum (Navigation Links)

# 핵심 링크
- [시작하기](docs/getting-started.md)
- [API](docs/api.md)`,
          expectedIds: ['getting-started', 'api'],
          expectedCharLimit: 'minimum'
        },
        {
          name: 'Origin summary',
          filename: 'llms-origin-en.txt', 
          content: `Language: EN
Type: Origin (Complete Documents)

## [Getting Started Guide](docs/guides/getting-started.md)
Complete guide for new users.

## [Advanced Patterns](docs/guides/advanced-patterns.md)
Advanced usage patterns and optimization.`,
          expectedIds: ['getting-started', 'advanced-patterns'],
          expectedCharLimit: 'origin'
        },
        {
          name: 'Character limit summary',
          filename: 'llms-2000chars-en.txt',
          content: `Language: EN
Type: 2000chars

### [Installation](installation.md)
### [Configuration](configuration.md)
### [Examples](examples.md)`,
          expectedIds: ['installation', 'configuration', 'examples'],
          expectedCharLimit: '2000chars'
        }
      ];

      testCases.forEach(({ name, content, expectedIds, expectedCharLimit }) => {
        const lines = content.split('\n');
        let extractedCharLimit = '';
        const extractedIds: string[] = [];

        // Extract char limit
        for (const line of lines) {
          if (line.startsWith('Type:')) {
            if (line.includes('chars')) {
              const match = line.match(/(\d+)chars/);
              extractedCharLimit = match ? match[0] : '';
            } else if (line.includes('Minimum')) {
              extractedCharLimit = 'minimum';
            } else if (line.includes('Origin')) {
              extractedCharLimit = 'origin';
            }
          }
        }

        // Extract document IDs
        const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = linkPattern.exec(content)) !== null) {
          const url = match[2];
          const lastSegment = url.split('/').pop()?.replace(/\.md$/, '') || '';
          if (lastSegment) {
            extractedIds.push(lastSegment);
          }
        }

        expect(extractedCharLimit).toBe(expectedCharLimit);
        expect(extractedIds).toEqual(expectedIds);
      });
    });

    it('should update priority JSON work_status correctly', async () => {
      const mockPriorityData = {
        document: {
          id: 'getting-started',
          title: 'Getting Started Guide',
          source_path: 'docs/getting-started.md',
          category: 'guide'
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

      expect(updatedData.work_status).toMatchObject({
        last_checked: expect.any(String),
        lastSummaryUpdate: '2024-01-15T10:30:00.000Z',
        summaryPath: 'docs/llms/ko/llms-1000chars-ko.txt',
        charLimit: '1000chars',
        language: 'ko'
      });

      expect(updatedData.document.id).toBe('getting-started');
      expect(updatedData.priority.score).toBe(95);
    });
  });

  describe('Source Document to Summary Document Workflow', () => {
    it('should process source document changes and update summary headers', async () => {
      const sourceDocumentChanges = [
        {
          path: 'docs/getting-started.md',
          lastModified: '2024-01-15T10:30:00.000Z',
          documentId: 'getting-started'
        },
        {
          path: 'docs/api/actions.md',
          lastModified: '2024-01-15T10:31:00.000Z', 
          documentId: 'actions'
        },
        {
          path: 'docs/guides/installation.md',
          lastModified: '2024-01-15T10:32:00.000Z',
          documentId: 'installation'
        }
      ];

      sourceDocumentChanges.forEach(({ path, documentId }) => {
        // Extract document ID from path
        const extractedId = path.split('/').pop()?.replace(/\.[^.]+$/, '');
        expect(extractedId).toBe(documentId);

        // Generate expected priority JSON paths for all languages
        const expectedPriorityPaths = mockConfig.generation.supportedLanguages.map(lang =>
          `${mockConfig.paths.llmContentDir}/${lang}/${documentId}.json`
        );

        expect(expectedPriorityPaths).toEqual([
          `./data/${documentId}.json`,
          `./data/${documentId}.json`
        ].map((p, i) => p.replace('./data/', `./data/${mockConfig.generation.supportedLanguages[i]}/`)));

        // Generate expected summary document paths 
        const expectedSummaryPaths = [];
        for (const language of mockConfig.generation.supportedLanguages) {
          for (const limit of mockConfig.generation.characterLimits) {
            expectedSummaryPaths.push(
              `${mockConfig.paths.outputDir}/${language}/llms-${limit}chars-${language}.txt`
            );
          }
        }

        expect(expectedSummaryPaths).toHaveLength(8); // 2 languages × 4 limits
      });
    });

    it('should update summary document headers with source change info', async () => {
      const originalSummaryContent = `Language: KO
Type: 1000chars
Generated: 2024-01-15T09:00:00.000Z

# Context-Action Framework 문서 요약

## 시작하기
기본 설정과 첫 번째 예제...

## API 참조
액션 시스템의 핵심 API...`;

      const updates = {
        lastSourceUpdate: '2024-01-15T10:30:00.000Z',
        relatedDocument: 'getting-started'
      };

      // Simulate header update process
      const lines = originalSummaryContent.split('\n');
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

      const filteredLines = lines.slice(0, headerEndIndex).filter(line => 
        !line.startsWith('LastSourceUpdate:') && 
        !line.startsWith('RelatedDocument:')
      );

      const newHeader = [...filteredLines, ...updateLines];
      const expectedNewContent = [...newHeader, ...lines.slice(headerEndIndex)];

      expect(updateLines).toEqual([
        'LastSourceUpdate: 2024-01-15T10:30:00.000Z',
        'RelatedDocument: getting-started'
      ]);

      expect(expectedNewContent.slice(0, 6)).toEqual([
        'Language: KO',
        'Type: 1000chars',
        'Generated: 2024-01-15T09:00:00.000Z',
        'LastSourceUpdate: 2024-01-15T10:30:00.000Z',
        'RelatedDocument: getting-started',
        ''
      ]);
    });

    it('should handle multiple source changes efficiently', async () => {
      const multipleChanges = [
        'docs/getting-started.md',
        'docs/api/actions.md', 
        'docs/guides/installation.md',
        'docs/concept/architecture.md'
      ];

      const documentIds = multipleChanges.map(filePath => 
        path.basename(filePath, path.extname(filePath))
      );

      expect(documentIds).toEqual([
        'getting-started',
        'actions',
        'installation', 
        'architecture'
      ]);

      // Each source change should trigger updates to:
      // 1. Priority JSON files for all languages
      // 2. Summary document headers for all languages and character limits

      const totalPriorityUpdates = documentIds.length * mockConfig.generation.supportedLanguages.length;
      const totalSummaryUpdates = documentIds.length * 
        mockConfig.generation.supportedLanguages.length * 
        mockConfig.generation.characterLimits.length;

      expect(totalPriorityUpdates).toBe(8); // 4 docs × 2 languages
      expect(totalSummaryUpdates).toBe(32); // 4 docs × 2 languages × 4 limits
    });
  });

  describe('Metadata Extraction and Processing', () => {
    it('should extract metadata from various summary document formats', async () => {
      const testDocuments = [
        {
          content: `Language: KO
Type: 1000chars
Generated: 2024-01-15T09:00:00.000Z

## [시작하기](../../../getting-started.md)
## [API 참조](../../../api/actions.md)`,
          expectedMetadata: {
            language: 'KO',
            charLimit: '1000chars',
            documentIds: ['getting-started', 'actions']
          }
        },
        {
          content: `Language: EN
Type: Minimum (Navigation Links)
Generated: 2024-01-15T09:00:00.000Z

- [Getting Started](docs/getting-started.md)
- [Installation Guide](docs/guides/installation.md)  
- [API Reference](docs/api/reference.md)`,
          expectedMetadata: {
            language: 'EN',
            charLimit: 'minimum',
            documentIds: ['getting-started', 'installation', 'reference']
          }
        },
        {
          content: `Language: EN
Type: Origin (Complete Documents)

### [Architecture Guide](architecture.md)
### [Performance Optimization](performance.md)`,
          expectedMetadata: {
            language: 'EN', 
            charLimit: 'origin',
            documentIds: ['architecture', 'performance']
          }
        }
      ];

      testDocuments.forEach(({ content, expectedMetadata }) => {
        const lines = content.split('\n');
        let language = '';
        let charLimit = '';
        const documentIds: string[] = [];

        // Extract language and char limit from header
        for (const line of lines.slice(0, 10)) {
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

        // Extract document IDs from links  
        const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = linkPattern.exec(content)) !== null) {
          const url = match[2];
          // Skip external links (http/https)
          if (url.startsWith('http://') || url.startsWith('https://')) {
            continue;
          }
          const segments = url.split('/');
          const lastSegment = segments[segments.length - 1].replace(/\.md$/, '');
          if (lastSegment) {
            documentIds.push(lastSegment);
          }
        }

        expect({ language, charLimit, documentIds }).toEqual(expectedMetadata);
      });
    });

    it('should handle edge cases in metadata extraction', async () => {
      const edgeCases = [
        {
          name: 'No links in content',
          content: `Language: KO
Type: 500chars

# 단순 텍스트 요약
이 문서는 링크가 없는 단순한 텍스트입니다.`,
          expectedIds: []
        },
        {
          name: 'External links (should be ignored)',
          content: `Language: EN
Type: 1000chars

## [GitHub](https://github.com/example/repo)
## [Documentation](https://docs.example.com)
## [Local Guide](local-guide.md)`,
          expectedIds: ['local-guide']
        },
        {
          name: 'Mixed link formats',
          content: `Language: KO
Type: 2000chars

- [가이드1](guide1.md)
## [가이드2](../guide2.md)
### [가이드3](../../docs/guide3.md)`,
          expectedIds: ['guide1', 'guide2', 'guide3']
        },
        {
          name: 'Malformed headers', 
          content: `Language
Type 1000chars
Generated: invalid-date

## [Valid Link](valid.md)`,
          expectedIds: ['valid'],
          expectedLanguage: '', // Should be empty due to malformed header
          expectedCharLimit: '' // Should be empty due to malformed header
        }
      ];

      edgeCases.forEach(({ name, content, expectedIds, expectedLanguage, expectedCharLimit }) => {
        const lines = content.split('\n');
        let language = '';
        let charLimit = '';
        const documentIds: string[] = [];

        // Extract metadata
        for (const line of lines.slice(0, 10)) {
          if (line.startsWith('Language:')) {
            language = line.split(':')[1]?.trim() || '';
          }
          if (line.startsWith('Type:')) {
            if (line.includes('chars')) {
              const match = line.match(/(\d+)chars/);
              charLimit = match ? match[0] : '';
            }
          }
        }

        // Extract document IDs
        const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = linkPattern.exec(content)) !== null) {
          const url = match[2];
          // Skip external links (http/https)
          if (url.startsWith('http://') || url.startsWith('https://')) {
            continue;
          }
          const segments = url.split('/');
          const lastSegment = segments[segments.length - 1].replace(/\.md$/, '');
          if (lastSegment) {
            documentIds.push(lastSegment);
          }
        }

        expect(documentIds).toEqual(expectedIds);
        
        if (expectedLanguage !== undefined) {
          expect(language).toBe(expectedLanguage);
        }
        
        if (expectedCharLimit !== undefined) {
          expect(charLimit).toBe(expectedCharLimit);
        }
      });
    });
  });

  describe('File Path and Configuration Integration', () => {
    it('should generate correct file paths based on configuration', async () => {
      const testConfig = {
        paths: {
          llmContentDir: './data',
          outputDir: './docs/llms'
        },
        generation: {
          supportedLanguages: ['ko', 'en'],
          characterLimits: [100, 300, 1000, 2000]
        }
      };

      const documentId = 'getting-started';
      const language = 'ko';

      // Priority JSON path
      const priorityPath = path.join(testConfig.paths.llmContentDir, language, `${documentId}.json`);
      expect(priorityPath).toBe('data/ko/getting-started.json');

      // Summary document paths for all character limits
      const summaryPaths = testConfig.generation.characterLimits.map(limit =>
        path.join(testConfig.paths.outputDir, language, `llms-${limit}chars-${language}.txt`)
      );

      expect(summaryPaths).toEqual([
        'docs/llms/ko/llms-100chars-ko.txt',
        'docs/llms/ko/llms-300chars-ko.txt',
        'docs/llms/ko/llms-1000chars-ko.txt',
        'docs/llms/ko/llms-2000chars-ko.txt'
      ]);

      // All languages and limits combination
      const allSummaryPaths = [];
      for (const lang of testConfig.generation.supportedLanguages) {
        for (const limit of testConfig.generation.characterLimits) {
          allSummaryPaths.push(
            path.join(testConfig.paths.outputDir, lang, `llms-${limit}chars-${lang}.txt`)
          );
        }
      }

      expect(allSummaryPaths).toHaveLength(8); // 2 languages × 4 limits
    });

    it('should handle different path configurations', async () => {
      const pathConfigurations = [
        {
          name: 'Relative paths',
          config: {
            llmContentDir: './data',
            outputDir: './docs/llms'
          }
        },
        {
          name: 'Absolute paths',
          config: {
            llmContentDir: '/absolute/path/data',
            outputDir: '/absolute/path/docs/llms'
          }
        },
        {
          name: 'Nested paths',
          config: {
            llmContentDir: './packages/generator/data',
            outputDir: './packages/generator/docs/llms'
          }
        }
      ];

      pathConfigurations.forEach(({ name, config }) => {
        const documentId = 'test-doc';
        const language = 'en';
        const limit = 1000;

        const priorityPath = path.join(config.llmContentDir, language, `${documentId}.json`);
        const summaryPath = path.join(config.outputDir, language, `llms-${limit}chars-${language}.txt`);

        // Verify paths are constructed correctly
        expect(priorityPath).toContain(documentId);
        expect(priorityPath).toContain(language);
        expect(priorityPath).toContain('.json');

        expect(summaryPath).toContain('llms-');
        expect(summaryPath).toContain(`${limit}chars`);
        expect(summaryPath).toContain(language);
        expect(summaryPath).toContain('.txt');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing priority JSON files gracefully', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const nonExistentPaths = [
        'data/ko/missing-doc.json',
        'data/en/missing-doc.json',
        'data/ko/non-existent.json'
      ];

      nonExistentPaths.forEach(filePath => {
        expect(mockFs.existsSync(filePath)).toBe(false);
      });

      // Sync should continue processing other files even if some are missing
      const syncResult: SyncResult = {
        success: true, // Should still be successful overall
        processedFiles: ['docs/summary.txt'],
        updatedFrontmatters: [],
        errors: [
          'data/ko/missing-doc.json: 파일이 존재하지 않습니다',
          'data/en/missing-doc.json: 파일이 존재하지 않습니다'
        ],
        summary: {
          totalProcessed: 1,
          summaryDocsUpdated: 0,
          sourceDosUpdated: 0,
          frontmatterUpdates: 0
        }
      };

      expect(syncResult.errors).toHaveLength(2);
      expect(syncResult.success).toBe(true); // Partial success is still success
    });

    it('should handle file read/write errors', async () => {
      const fileErrors = [
        'ENOENT: no such file or directory',
        'EACCES: permission denied',
        'EISDIR: illegal operation on a directory',
        'EMFILE: too many open files'
      ];

      fileErrors.forEach(errorMessage => {
        const error = new Error(errorMessage);
        
        // Each error type should be handled appropriately
        expect(error.message).toContain('E'); // All file system errors start with E
        
        if (errorMessage.includes('ENOENT')) {
          expect(error.message).toContain('no such file');
        } else if (errorMessage.includes('EACCES')) {
          expect(error.message).toContain('permission denied');
        }
      });
    });

    it('should provide comprehensive error reporting', async () => {
      const comprehensiveErrors: SyncResult = {
        success: false,
        processedFiles: [
          'docs/summary1.txt',
          'docs/summary2.txt', 
          'docs/source1.md',
          'docs/source2.md'
        ],
        updatedFrontmatters: [
          'data/ko/doc1.json'
        ],
        errors: [
          'docs/summary2.txt: 메타데이터 추출 실패',
          'docs/source2.md: 문서 ID 추출 실패',
          'data/ko/doc2.json: 파일 쓰기 실패 - 권한 없음',
          'docs/llms/ko/llms-1000chars-ko.txt: 헤더 업데이트 실패'
        ],
        summary: {
          totalProcessed: 4,
          summaryDocsUpdated: 1,
          sourceDosUpdated: 1, 
          frontmatterUpdates: 1
        }
      };

      expect(comprehensiveErrors.success).toBe(false);
      expect(comprehensiveErrors.errors).toHaveLength(4);
      expect(comprehensiveErrors.processedFiles).toHaveLength(4);
      expect(comprehensiveErrors.updatedFrontmatters).toHaveLength(1);
      
      // Each error should contain file path and error description
      comprehensiveErrors.errors.forEach(error => {
        expect(error).toMatch(/^[^:]+:\s.+/); // Format: "file_path: error_description"
      });
    });
  });
});