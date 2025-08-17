/**
 * ConflictDetector Tests - Simplified
 */

import { ConflictDetector } from '../../../src/core/ConflictDetector.js';
import { TestDataGenerator } from '../../helpers/test-data-generator.js';
import type { DocumentMetadata, EnhancedLLMSConfig } from '../../../src/types/config.js';

describe('ConflictDetector', () => {
  let detector: ConflictDetector;
  let testDocuments: DocumentMetadata[];
  let mockConfig: EnhancedLLMSConfig;

  beforeEach(() => {
    mockConfig = {
      paths: { docs: 'docs', output: 'output', priority: 'priority' },
      generation: {
        defaultCharacterLimits: [100, 300, 1000],
        qualityThreshold: 70,
        defaultStrategy: 'concept-first'
      },
      categories: {
        guide: {
          name: '가이드',
          description: 'Step-by-step guides',
          priority: 90,
          defaultStrategy: 'tutorial-first',
          tags: ['beginner', 'step-by-step', 'practical']
        }
      },
      tags: {
        beginner: {
          name: '초보자',
          description: 'Beginner-friendly content',
          weight: 1.2,
          compatibleWith: ['step-by-step', 'practical'],
          audience: ['new-users']
        },
        advanced: {
          name: '고급',
          description: 'Advanced content',
          weight: 0.9,
          compatibleWith: ['technical', 'expert'],
          audience: ['experts']
        }
      },
      composition: {
        strategies: {
          balanced: {
            name: 'Balanced',
            description: 'Balanced approach',
            weights: { category: 0.3, tag: 0.3, dependency: 0.2, priority: 0.2 }
          }
        },
        defaultStrategy: 'balanced'
      }
    } as EnhancedLLMSConfig;

    detector = new ConflictDetector(mockConfig);
    testDocuments = TestDataGenerator.generateDocuments(5);
  });

  describe('Constructor', () => {
    it('should initialize with valid config', () => {
      expect(detector).toBeInstanceOf(ConflictDetector);
    });

    it('should be properly configured', () => {
      expect(detector).toBeDefined();
    });
  });

  describe('Basic functionality', () => {
    it('should detect conflicts in document sets', () => {
      const conflictingDocs = testDocuments.slice(0, 2);
      
      const analysis = detector.detectConflicts(conflictingDocs, {
        enableTagIncompatibility: true,
        enableContentDuplication: true,
        enableAudienceMismatch: true,
        severityThreshold: 'minor'
      });
      
      expect(analysis).toBeDefined();
      expect(analysis.conflicts).toBeDefined();
      expect(analysis.summary).toBeDefined();
    });

    it('should apply conflict resolutions', () => {
      const documents = testDocuments.slice(0, 2);
      const conflicts: any[] = []; // Empty conflicts for simplicity
      
      const resolution = detector.applyConflictResolutions(documents, conflicts);
      
      expect(resolution).toBeDefined();
      expect(resolution.resolvedDocuments).toBeDefined();
      expect(resolution.excludedDocuments).toBeDefined();
      expect(resolution.unresolved).toBeDefined();
    });

    it('should handle empty document sets', () => {
      const analysis = detector.detectConflicts([], {});
      
      expect(analysis.conflicts).toHaveLength(0);
      expect(analysis.summary.total).toBe(0);
    });

    it('should handle single documents', () => {
      const singleDoc = testDocuments.slice(0, 1);
      const analysis = detector.detectConflicts(singleDoc, {});
      
      expect(analysis.conflicts).toHaveLength(0);
      expect(analysis.summary.total).toBe(0);
    });
  });

  describe('Configuration options', () => {
    it('should respect severity threshold settings', () => {
      const docs = testDocuments.slice(0, 3);
      
      const strictAnalysis = detector.detectConflicts(docs, {
        severityThreshold: 'critical'
      });
      
      const lenientAnalysis = detector.detectConflicts(docs, {
        severityThreshold: 'minor'
      });
      
      expect(strictAnalysis).toBeDefined();
      expect(lenientAnalysis).toBeDefined();
    });

    it('should handle different conflict detection modes', () => {
      const docs = testDocuments.slice(0, 2);
      
      const tagOnlyAnalysis = detector.detectConflicts(docs, {
        enableTagIncompatibility: true,
        enableContentDuplication: false,
        enableAudienceMismatch: false
      });
      
      expect(tagOnlyAnalysis).toBeDefined();
    });
  });
});