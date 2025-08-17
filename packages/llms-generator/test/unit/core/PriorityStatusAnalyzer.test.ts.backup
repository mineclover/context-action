/**
 * PriorityStatusAnalyzer 테스트
 */

import { PriorityStatusAnalyzer } from '../../../src/core/PriorityStatusAnalyzer.js';
import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as glob from 'glob';

// Mock modules
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('glob');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockedGlob = glob as jest.Mocked<typeof glob>;

describe('PriorityStatusAnalyzer', () => {
  let analyzer: PriorityStatusAnalyzer;
  const testDataDir = './test-data';
  const testLanguages = ['en', 'ko'];

  beforeEach(() => {
    analyzer = new PriorityStatusAnalyzer(testDataDir, testLanguages);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultAnalyzer = new PriorityStatusAnalyzer();
      expect(defaultAnalyzer).toBeDefined();
    });

    it('should initialize with custom values', () => {
      expect(analyzer).toBeDefined();
    });
  });

  describe('analyzeOverallStatus', () => {
    it('should analyze empty priority files', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json',
          './test-data/ko/concept-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file reading - empty files
      mockedFs.readFile.mockResolvedValue('');

      const result = await analyzer.analyzeOverallStatus();

      expect(result.summary.totalFiles).toBe(2);
      expect(result.summary.emptyFiles).toBe(2);
      expect(result.summary.completionRate).toBe(0);
    });

    it('should analyze complete priority files', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json',
          './test-data/ko/concept-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file reading - complete files
      const completePriorityData = JSON.stringify({
        documents: [
          {
            id: 'doc1',
            title: 'Test Document 1',
            priority_score: 85,
            priority_tier: 'high'
          },
          {
            id: 'doc2',
            title: 'Test Document 2',
            priority_score: 70,
            priority_tier: 'medium'
          },
          {
            id: 'doc3',
            title: 'Test Document 3',
            priority_score: 60,
            priority_tier: 'medium'
          },
          {
            id: 'doc4',
            title: 'Test Document 4',
            priority_score: 40,
            priority_tier: 'low'
          },
          {
            id: 'doc5',
            title: 'Test Document 5',
            priority_score: 90,
            priority_tier: 'critical'
          }
        ]
      });

      mockedFs.readFile.mockResolvedValue(completePriorityData);

      const result = await analyzer.analyzeOverallStatus();

      expect(result.summary.totalFiles).toBe(2);
      expect(result.summary.completeFiles).toBe(2);
      expect(result.summary.completionRate).toBe(100);
      expect(result.byLanguage.en.complete).toBe(1);
      expect(result.byLanguage.ko.complete).toBe(1);
    });

    it('should analyze partial priority files', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file reading - partial file (< 5 documents)
      const partialPriorityData = JSON.stringify({
        documents: [
          {
            id: 'doc1',
            title: 'Test Document 1',
            priority_score: 85,
            priority_tier: 'high'
          },
          {
            id: 'doc2',
            title: 'Test Document 2',
            priority_score: 70,
            priority_tier: 'medium'
          }
        ]
      });

      mockedFs.readFile.mockResolvedValue(partialPriorityData);

      const result = await analyzer.analyzeOverallStatus();

      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.partialFiles).toBe(1);
      expect(result.summary.completionRate).toBe(0);
    });

    it('should handle missing files', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file doesn't exist
      mockedExistsSync.mockReturnValue(false);

      const result = await analyzer.analyzeOverallStatus();

      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.missingFiles).toBe(1);
      expect(result.issues.missingFiles).toContain('./test-data/en/api-guide/priority.json');
    });

    it('should handle invalid JSON files', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file reading - invalid JSON
      mockedFs.readFile.mockResolvedValue('invalid json content');

      const result = await analyzer.analyzeOverallStatus();

      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.emptyFiles).toBe(1);
    });
  });

  describe('getWorkProgress', () => {
    it('should calculate work progress correctly', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json',
          './test-data/en/concept-guide/priority.json',
          './test-data/ko/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock mixed completion states
      mockedFs.readFile
        .mockResolvedValueOnce(JSON.stringify({ // Complete file
          documents: Array.from({ length: 5 }, (_, i) => ({
            id: `doc${i + 1}`,
            title: `Document ${i + 1}`,
            priority_score: 80,
            priority_tier: 'high'
          }))
        }))
        .mockResolvedValueOnce(JSON.stringify({ // Partial file
          documents: Array.from({ length: 3 }, (_, i) => ({
            id: `doc${i + 1}`,
            title: `Document ${i + 1}`,
            priority_score: 60,
            priority_tier: 'medium'
          }))
        }))
        .mockResolvedValueOnce(''); // Empty file

      const result = await analyzer.getWorkProgress();

      expect(result.totalProgress).toBeGreaterThan(0);
      expect(result.totalProgress).toBeLessThan(100);
      expect(result.categoryProgress).toBeDefined();
      expect(result.languageProgress).toBeDefined();
      expect(result.upcomingTasks).toBeDefined();
    });
  });

  describe('quality checks', () => {
    it('should detect low priority scores', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file with low priority scores
      const lowPriorityData = JSON.stringify({
        documents: Array.from({ length: 5 }, (_, i) => ({
          id: `doc${i + 1}`,
          title: `Document ${i + 1}`,
          priority_score: 15, // Very low score
          priority_tier: 'low'
        }))
      });

      mockedFs.readFile.mockResolvedValue(lowPriorityData);

      const result = await analyzer.analyzeOverallStatus();
      const file = result.files[0];

      expect(file.issues).toContain('평균 우선순위가 너무 낮음 (< 20)');
    });

    it('should detect high priority scores', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file with high priority scores
      const highPriorityData = JSON.stringify({
        documents: Array.from({ length: 5 }, (_, i) => ({
          id: `doc${i + 1}`,
          title: `Document ${i + 1}`,
          priority_score: 98, // Very high score
          priority_tier: 'critical'
        }))
      });

      mockedFs.readFile.mockResolvedValue(highPriorityData);

      const result = await analyzer.analyzeOverallStatus();
      const file = result.files[0];

      expect(file.issues).toContain('평균 우선순위가 너무 높음 (> 95)');
    });

    it('should detect tier distribution imbalance', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file with imbalanced tier distribution
      const imbalancedData = JSON.stringify({
        documents: [
          ...Array.from({ length: 8 }, (_, i) => ({ // 80% high tier
            id: `doc${i + 1}`,
            title: `Document ${i + 1}`,
            priority_score: 90,
            priority_tier: 'high'
          })),
          ...Array.from({ length: 2 }, (_, i) => ({ // 20% medium tier
            id: `doc${i + 9}`,
            title: `Document ${i + 9}`,
            priority_score: 50,
            priority_tier: 'medium'
          }))
        ]
      });

      mockedFs.readFile.mockResolvedValue(imbalancedData);

      const result = await analyzer.analyzeOverallStatus();
      const file = result.files[0];

      expect(file.issues).toContain('Tier 분포 불균형 (한 tier에 80% 이상 집중)');
    });

    it('should detect missing required fields', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file with missing required fields
      const incompleteData = JSON.stringify({
        documents: [
          {
            id: 'doc1',
            // title missing
            priority_score: 90,
            priority_tier: 'high'
          },
          {
            // id missing
            title: 'Document 2',
            priority_score: 80,
            priority_tier: 'medium'
          },
          {
            id: 'doc3',
            title: 'Document 3',
            // priority_score missing
            priority_tier: 'low'
          },
          {
            id: 'doc4',
            title: 'Document 4',
            priority_score: 70,
            // priority_tier missing
          },
          {
            id: 'doc5',
            title: 'Document 5',
            priority_score: 85,
            priority_tier: 'high'
          }
        ]
      });

      mockedFs.readFile.mockResolvedValue(incompleteData);

      const result = await analyzer.analyzeOverallStatus();
      const file = result.files[0];

      expect(file.issues.some(issue => issue.includes('필수 필드 누락'))).toBe(true);
    });
  });

  describe('recommendations', () => {
    it('should generate appropriate recommendations', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json',
          './test-data/en/concept-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence and states
      mockedExistsSync.mockReturnValue(true);

      // Mock one empty, one partial file
      mockedFs.readFile
        .mockResolvedValueOnce('') // Empty file
        .mockResolvedValueOnce(JSON.stringify({ // Partial file
          documents: [
            {
              id: 'doc1',
              title: 'Document 1',
              priority_score: 80,
              priority_tier: 'high'
            }
          ]
        }));

      const result = await analyzer.analyzeOverallStatus();

      expect(result.recommendations).toContain('1개의 빈 파일이 있습니다. 우선순위 데이터를 추가하세요.');
      expect(result.recommendations.some(rec => rec.includes('전체 완성률이'))).toBe(true);
    });
  });

  describe('caching', () => {
    it('should use cache for repeated analysis', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file reading
      const testData = JSON.stringify({
        documents: [
          {
            id: 'doc1',
            title: 'Test Document',
            priority_score: 80,
            priority_tier: 'high'
          }
        ]
      });

      mockedFs.readFile.mockResolvedValue(testData);

      // First analysis
      await analyzer.analyzeOverallStatus();

      // Second analysis - should use cache
      await analyzer.analyzeOverallStatus();

      // File should only be read once due to caching
      expect(mockedFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when requested', async () => {
      analyzer.clearCache();
      expect(analyzer).toBeDefined(); // Simple verification that clearCache doesn't throw
    });
  });

  describe('edge cases', () => {
    it('should handle glob errors gracefully', async () => {
      // Mock glob to return error
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        callback!(new Error('Glob error'), []);
      });

      await expect(analyzer.analyzeOverallStatus()).rejects.toThrow('Glob error');
    });

    it('should handle file read errors gracefully', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file reading error
      mockedFs.readFile.mockRejectedValue(new Error('File read error'));

      const result = await analyzer.analyzeOverallStatus();

      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.emptyFiles).toBe(1);
    });

    it('should handle non-object JSON data', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file reading - non-object JSON
      mockedFs.readFile.mockResolvedValue(JSON.stringify('string value'));

      const result = await analyzer.analyzeOverallStatus();
      const file = result.files[0];

      expect(file.completionStatus).toBe('empty');
      expect(file.issues).toContain('유효하지 않은 JSON 구조');
    });

    it('should handle array format priority data', async () => {
      // Mock glob to return test files
      mockedGlob.glob.mockImplementation((pattern, callback) => {
        const files = [
          './test-data/en/api-guide/priority.json'
        ];
        callback!(null, files);
      });

      // Mock file existence
      mockedExistsSync.mockReturnValue(true);

      // Mock file reading - array format
      const arrayData = JSON.stringify([
        {
          id: 'doc1',
          title: 'Document 1',
          priority_score: 80,
          priority_tier: 'high'
        },
        {
          id: 'doc2',
          title: 'Document 2',
          priority_score: 70,
          priority_tier: 'medium'
        },
        {
          id: 'doc3',
          title: 'Document 3',
          priority_score: 60,
          priority_tier: 'medium'
        },
        {
          id: 'doc4',
          title: 'Document 4',
          priority_score: 50,
          priority_tier: 'low'
        },
        {
          id: 'doc5',
          title: 'Document 5',
          priority_score: 90,
          priority_tier: 'critical'
        }
      ]);

      mockedFs.readFile.mockResolvedValue(arrayData);

      const result = await analyzer.analyzeOverallStatus();
      const file = result.files[0];

      expect(file.completionStatus).toBe('complete');
      expect(file.priorityCount).toBe(5);
      expect(file.averagePriority).toBe(70); // (80+70+60+50+90)/5
    });
  });
});