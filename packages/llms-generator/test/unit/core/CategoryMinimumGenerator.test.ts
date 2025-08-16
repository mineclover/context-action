import { CategoryMinimumGenerator } from '../../../src/core/CategoryMinimumGenerator';
import fs from 'fs';
import path from 'path';

describe('CategoryMinimumGenerator', () => {
  let generator: CategoryMinimumGenerator;
  const testOutputDir = './test/outputs/test-temp';

  beforeAll(() => {
    // 테스트 출력 디렉토리 생성
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // 테스트 출력 디렉토리 정리
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    generator = new CategoryMinimumGenerator({
      dataDir: './data',
      outputDir: testOutputDir
    });
  });

  describe('Category Information', () => {
    it('should return available categories', () => {
      const categories = generator.getAvailableCategories();
      expect(categories).toContain('api-spec');
      expect(categories).toContain('guide');
      expect(categories.length).toBe(2);
    });

    it('should return category patterns', () => {
      const apiPatterns = generator.getCategoryPatterns('api-spec');
      expect(apiPatterns).toEqual(['api--*', 'api/*']);

      const guidePatterns = generator.getCategoryPatterns('guide');
      expect(guidePatterns).toContain('guide--*');
      expect(guidePatterns).toContain('guide/*');
    });

    it('should return undefined for invalid category', () => {
      const patterns = generator.getCategoryPatterns('invalid-category');
      expect(patterns).toBeUndefined();
    });
  });

  describe('Document Statistics', () => {
    it('should return available documents for English', () => {
      const docs = generator.getAvailableDocuments('en');
      
      const apiSpec = docs.find(d => d.category === 'api-spec');
      const guide = docs.find(d => d.category === 'guide');
      
      expect(apiSpec).toBeDefined();
      expect(apiSpec?.count).toBeGreaterThan(0);
      
      expect(guide).toBeDefined();
      expect(guide?.count).toBeGreaterThan(0);
    });

    it('should return category stats', () => {
      const stats = generator.getCategoryStats('api-spec', 'en');
      
      expect(stats.category).toBe('api-spec');
      expect(stats.totalDocuments).toBeGreaterThan(0);
      expect(stats.tierBreakdown).toBeDefined();
      expect(stats.averagePriorityScore).toBeGreaterThanOrEqual(0);
    });

    it('should return empty stats for non-existent language', () => {
      const stats = generator.getCategoryStats('api-spec', 'xx');
      
      expect(stats.totalDocuments).toBe(0);
      expect(stats.averagePriorityScore).toBe(0);
      expect(stats.tierBreakdown).toEqual({});
    });
  });

  describe('File Generation', () => {
    it('should generate single category file successfully', async () => {
      const result = await generator.generateSingle('api-spec', 'en');
      
      expect(result.success).toBe(true);
      expect(result.category).toBe('api-spec');
      expect(result.language).toBe('en');
      expect(result.documentCount).toBeGreaterThan(0);
      expect(result.filePath).toContain('llms-minimum-api-spec-en.txt');
      
      // 파일이 실제로 생성되었는지 확인
      expect(fs.existsSync(result.filePath)).toBe(true);
      
      // 파일 내용 확인
      const content = fs.readFileSync(result.filePath, 'utf8');
      expect(content).toContain('Context-Action Framework');
      expect(content).toContain('API 참조');
    });

    it('should handle non-existent category gracefully', async () => {
      const result = await generator.generateSingle('invalid-category', 'en');
      
      expect(result.success).toBe(false);
      expect(result.documentCount).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should handle non-existent language gracefully', async () => {
      const result = await generator.generateSingle('api-spec', 'xx');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No documents found');
    });
  });

  describe('Batch Generation', () => {
    it('should generate multiple categories and languages', async () => {
      const results = await generator.generateBatch({
        categories: ['api-spec', 'guide'],
        languages: ['en']
      });
      
      expect(results.length).toBe(2);
      
      const apiResult = results.find(r => r.category === 'api-spec');
      const guideResult = results.find(r => r.category === 'guide');
      
      expect(apiResult?.success).toBe(true);
      expect(guideResult?.success).toBe(true);
    });

    it('should handle mixed success and failure', async () => {
      const results = await generator.generateBatch({
        categories: ['api-spec'],
        languages: ['en', 'xx'] // en exists, xx doesn't
      });
      
      expect(results.length).toBe(2);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for non-existent data directory', () => {
      expect(() => {
        new CategoryMinimumGenerator({
          dataDir: './non-existent-directory'
        });
      }).toThrow('Data directory does not exist');
    });

    it('should throw error for invalid categories', () => {
      expect(() => {
        new CategoryMinimumGenerator({
          categories: ['invalid-category']
        });
      }).toThrow('Invalid categories');
    });

    it('should warn for potentially unsupported languages', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      new CategoryMinimumGenerator({
        languages: ['xx', 'yy']
      });
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Potentially unsupported languages')
      );
      
      warnSpy.mockRestore();
    });
  });

  describe('URL Generation', () => {
    it('should use custom base URL when provided', async () => {
      const customGenerator = new CategoryMinimumGenerator({
        dataDir: './data',
        outputDir: testOutputDir,
        baseUrl: 'https://custom-domain.com/docs'
      });
      
      const result = await customGenerator.generateSingle('api-spec', 'en');
      
      if (result.success) {
        const content = fs.readFileSync(result.filePath, 'utf8');
        expect(content).toContain('https://custom-domain.com/docs');
      }
    });
  });
});