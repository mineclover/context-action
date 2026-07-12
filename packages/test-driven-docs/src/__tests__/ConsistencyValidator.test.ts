/**
 * @fileoverview Tests for ConsistencyValidator
 */

import { ConsistencyValidator } from '../validators/ConsistencyValidator.js';

describe('ConsistencyValidator', () => {
  let validator: ConsistencyValidator;

  beforeEach(() => {
    validator = new ConsistencyValidator({
      packagesDir: './packages',
      packages: ['react']
    });
  });

  describe('validation reporting', () => {
    it('should create validation report structure', () => {
      const report = validator.createValidationReport();

      expect(report).toEqual(expect.objectContaining({
        overallScore: expect.any(Number),
        syncStatus: expect.any(String),
        issues: expect.any(Array),
        recommendations: expect.any(Array),
        apiCoverage: expect.any(Object),
        lastValidated: expect.any(String)
      }));
    });

    it('should calculate overall score based on issues', () => {
      const mockIssues = [
        { type: 'outdated-docs', severity: 'warning', description: 'Test issue' },
        { type: 'missing-examples', severity: 'error', description: 'Missing examples' }
      ];

      const score = validator.calculateOverallScore(mockIssues);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return 100% score when no issues found', () => {
      const score = validator.calculateOverallScore([]);

      expect(score).toBe(100);
    });
  });

  describe('issue detection', () => {
    it('should detect missing documentation', () => {
      const mockApiNames = ['createActionContext', 'useStoreValue'];
      const mockDocumentedApis = ['createActionContext'];

      const issues = validator.detectMissingDocumentation(mockApiNames, mockDocumentedApis);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toEqual({
        type: 'missing-documentation',
        severity: 'warning',
        description: 'API useStoreValue is not documented',
        api: 'useStoreValue',
        recommendation: 'Add @doc-extract annotation to tests for useStoreValue'
      });
    });

    it('should detect outdated examples', () => {
      const mockLastModified = new Date('2023-01-01');
      const mockDocsGenerated = new Date('2022-12-01');

      const isOutdated = validator.isDocumentationOutdated(mockLastModified, mockDocsGenerated);

      expect(isOutdated).toBe(true);
    });

    it('should detect up-to-date examples', () => {
      const mockLastModified = new Date('2023-01-01');
      const mockDocsGenerated = new Date('2023-01-02');

      const isOutdated = validator.isDocumentationOutdated(mockLastModified, mockDocsGenerated);

      expect(isOutdated).toBe(false);
    });
  });

  describe('recommendations generation', () => {
    it('should generate recommendations based on issues', () => {
      const mockIssues = [
        { type: 'missing-examples', api: 'testApi', severity: 'warning', description: 'Missing examples' },
        { type: 'outdated-docs', api: 'oldApi', severity: 'error', description: 'Outdated docs' }
      ];

      const recommendations = validator.generateRecommendations(mockIssues);

      expect(recommendations).toContain('Add @doc-extract annotations to testApi tests');
      expect(recommendations).toContain('Update documentation for oldApi');
    });

    it('should handle issues without API names', () => {
      const mockIssues = [
        { type: 'general-issue', severity: 'info', description: 'General issue' }
      ];

      const recommendations = validator.generateRecommendations(mockIssues);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toContain('Review and address: General issue');
    });
  });

  describe('sync status determination', () => {
    it('should return "perfect" for high scores', () => {
      const status = validator.determineSyncStatus(100);

      expect(status).toBe('perfect');
    });

    it('should return "good" for decent scores', () => {
      const status = validator.determineSyncStatus(85);

      expect(status).toBe('good');
    });

    it('should return "needs-attention" for medium scores', () => {
      const status = validator.determineSyncStatus(65);

      expect(status).toBe('needs-attention');
    });

    it('should return "poor" for low scores', () => {
      const status = validator.determineSyncStatus(35);

      expect(status).toBe('poor');
    });
  });

  describe('API coverage analysis', () => {
    it('should analyze API coverage correctly', () => {
      const mockApis = ['api1', 'api2', 'api3'];
      const mockDocumented = ['api1', 'api2'];

      const coverage = validator.analyzeApiCoverage(mockApis, mockDocumented);

      expect(coverage).toEqual({
        total: 3,
        documented: 2,
        percentage: 67, // rounded
        missing: ['api3']
      });
    });

    it('should handle empty API lists', () => {
      const coverage = validator.analyzeApiCoverage([], []);

      expect(coverage).toEqual({
        total: 0,
        documented: 0,
        percentage: 100,
        missing: []
      });
    });

    it('should handle 100% coverage', () => {
      const mockApis = ['api1', 'api2'];
      const mockDocumented = ['api1', 'api2'];

      const coverage = validator.analyzeApiCoverage(mockApis, mockDocumented);

      expect(coverage.percentage).toBe(100);
      expect(coverage.missing).toHaveLength(0);
    });
  });
});
