/**
 * Tests for PriorityManager class
 */

import { PriorityManager } from '../../src/core/PriorityManager';
import type { PriorityCollection, PriorityMetadata } from '../../src/types/index';

// Mock fs/promises
jest.mock('fs/promises');
jest.mock('fs');

describe('PriorityManager', () => {
  let priorityManager: PriorityManager;
  
  beforeEach(() => {
    priorityManager = new PriorityManager('/mock/llm-content');
    jest.clearAllMocks();
  });

  describe('sortByPriority', () => {
    it('should sort documents by priority score in descending order', () => {
      const mockPriorities: Record<string, PriorityMetadata> = {
        'doc1': {
          document: {
            id: 'doc1',
            title: 'Document 1',
            source_path: 'doc1.md',
            category: 'guide' as any
          },
          priority: {
            score: 80,
            tier: 'essential' as any
          },
          purpose: {
            primary_goal: 'Test goal',
            target_audience: ['framework-users' as any],
            use_cases: [],
            dependencies: []
          },
          keywords: {
            primary: ['test'],
            technical: ['api']
          },
          extraction: {
            strategy: 'concept-first' as any,
            character_limits: {},
            emphasis: {
              must_include: [],
              nice_to_have: []
            }
          },
          quality: {
            completeness_threshold: 0.8,
            code_examples_required: false,
            consistency_checks: []
          },
          metadata: {
            created: '2024-01-01',
            version: '1.0',
            original_size: 1000,
            estimated_extraction_time: {}
          }
        },
        'doc2': {
          ...({} as any), // Abbreviated for brevity
          document: {
            id: 'doc2',
            title: 'Document 2',
            source_path: 'doc2.md',
            category: 'api' as any
          },
          priority: {
            score: 95,
            tier: 'critical' as any
          }
        }
      };

      const result = priorityManager.sortByPriority(mockPriorities);
      
      expect(result.documents).toHaveLength(2);
      expect(result.documents[0].id).toBe('doc2'); // Higher score first
      expect(result.documents[1].id).toBe('doc1');
      expect(result.documents[0].priority.priority.score).toBe(95);
      expect(result.documents[1].priority.priority.score).toBe(80);
    });
  });

  describe('getDocumentsByTier', () => {
    it('should filter documents by tier', () => {
      const mockPriorities: Record<string, PriorityMetadata> = {
        'critical-doc': {
          // ... mock data
          priority: { score: 95, tier: 'critical' as any }
        } as any,
        'essential-doc': {
          // ... mock data  
          priority: { score: 85, tier: 'essential' as any }
        } as any
      };

      const criticalDocs = priorityManager.getDocumentsByTier(mockPriorities, 'critical');
      const essentialDocs = priorityManager.getDocumentsByTier(mockPriorities, 'essential');

      expect(criticalDocs).toHaveLength(1);
      expect(criticalDocs[0].id).toBe('critical-doc');
      expect(essentialDocs).toHaveLength(1);
      expect(essentialDocs[0].id).toBe('essential-doc');
    });
  });

  describe('getStatistics', () => {
    it('should calculate collection statistics correctly', () => {
      const mockCollection: PriorityCollection = {
        en: {
          'doc1': {
            priority: { score: 80, tier: 'essential' as any },
            document: { category: 'guide' as any }
          } as any,
          'doc2': {
            priority: { score: 90, tier: 'critical' as any },
            document: { category: 'api' as any }
          } as any
        },
        ko: {
          'doc3': {
            priority: { score: 70, tier: 'important' as any },
            document: { category: 'guide' as any }
          } as any
        }
      };

      const stats = priorityManager.getStatistics(mockCollection);

      expect(stats.totalDocuments).toBe(3);
      expect(stats.byLanguage).toEqual({ en: 2, ko: 1 });
      expect(stats.byTier).toEqual({ 
        essential: 1, 
        critical: 1, 
        important: 1 
      });
      expect(stats.byCategory).toEqual({ 
        guide: 2, 
        api: 1 
      });
      expect(stats.averageScore).toBe(80); // (80 + 90 + 70) / 3
    });
  });
});