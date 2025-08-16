import { DocumentScorer } from '../../../src/core/DocumentScorer';
import { EnhancedLLMSConfig, DocumentMetadata, SelectionContext } from '../../../src/types/config';
import { TestDataGenerator } from '../../helpers/test-data-generator';

describe('DocumentScorer', () => {
  let scorer: DocumentScorer;
  let mockConfig: EnhancedLLMSConfig;
  let testDocuments: DocumentMetadata[];

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
        },
        api: {
          name: 'API',
          description: 'API documentation',
          priority: 85,
          defaultStrategy: 'reference-first',
          tags: ['technical', 'reference', 'developer']
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
        },
        'step-by-step': {
          name: '단계별',
          description: 'Step-by-step instructions',
          weight: 1.1,
          compatibleWith: ['beginner', 'practical'],
          audience: ['new-users']
        },
        technical: {
          name: '기술적',
          description: 'Technical documentation',
          weight: 1.0,
          compatibleWith: ['advanced', 'reference'],
          audience: ['developers']
        }
      },
      dependencies: {
        enabled: true,
        maxDepth: 3,
        includeOptional: false,
        conflictResolution: 'exclude-conflicts'
      },
      composition: {
        strategies: {
          balanced: {
            name: 'Balanced Strategy',
            algorithm: 'hybrid',
            criteria: {
              categoryWeight: 0.4,
              tagWeight: 0.3,
              dependencyWeight: 0.2,
              priorityWeight: 0.1
            }
          },
          'category-focused': {
            name: 'Category Focused',
            algorithm: 'greedy',
            criteria: {
              categoryWeight: 0.6,
              tagWeight: 0.2,
              dependencyWeight: 0.1,
              priorityWeight: 0.1
            }
          }
        },
        defaultStrategy: 'balanced'
      },
      extraction: {
        enableSmartExtraction: true,
        contextAwareExtraction: true,
        preserveCodeBlocks: true
      },
      validation: {
        enabled: true,
        strictMode: false,
        validateDependencies: true
      },
      ui: {
        language: 'ko',
        theme: 'default'
      }
    };

    testDocuments = TestDataGenerator.generateDocuments(5, {
      categories: ['guide', 'api'],
      tags: ['beginner', 'advanced', 'step-by-step', 'technical']
    });

    scorer = new DocumentScorer(mockConfig, 'balanced');
  });

  describe('Constructor', () => {
    it('should initialize with default strategy', () => {
      const defaultScorer = new DocumentScorer(mockConfig);
      expect(defaultScorer).toBeInstanceOf(DocumentScorer);
    });

    it('should initialize with custom strategy', () => {
      const customScorer = new DocumentScorer(mockConfig, 'category-focused');
      expect(customScorer).toBeInstanceOf(DocumentScorer);
    });

    it('should throw error for invalid strategy when no fallback available', () => {
      const configWithoutBalanced = { ...mockConfig };
      delete configWithoutBalanced.composition.strategies.balanced;
      
      expect(() => new DocumentScorer(configWithoutBalanced, 'invalid-strategy')).toThrow('Strategy \'invalid-strategy\' not found and no balanced strategy available');
    });
  });

  describe('scoreDocument()', () => {
    let context: SelectionContext;

    beforeEach(() => {
      context = {
        targetTags: ['beginner', 'step-by-step'],
        tagWeights: { 'beginner': 1.5, 'step-by-step': 1.2 },
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000
      };
    });

    it('should calculate comprehensive document score', () => {
      const document = testDocuments[0];
      document.tags.primary = ['beginner', 'step-by-step'];
      document.document.category = 'guide';
      document.priority.score = 85;

      const result = scorer.scoreDocument(document, context);

      expect(result).toBeDefined();
      expect(result.scores.total).toBeGreaterThan(0);
      expect(result.scores.total).toBeLessThanOrEqual(1);
      expect(result.scores.category).toBeGreaterThan(0);
      expect(result.scores.tag).toBeGreaterThan(0);
      expect(result.scores.priority).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle missing document metadata gracefully', () => {
      const document = { ...testDocuments[0] };
      // Remove some metadata
      delete document.tags;
      delete document.composition;

      const result = scorer.scoreDocument(document, context);

      expect(result).toBeDefined();
      expect(result.scores.total).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThan(0.5); // Lower confidence for incomplete data
    });

    it('should apply strategy weights correctly', () => {
      const document = testDocuments[0];
      document.document.category = 'guide';
      document.tags.primary = ['beginner'];

      const balancedResult = scorer.scoreDocument(document, context);
      
      const categoryScorer = new DocumentScorer(mockConfig, 'category-focused');
      const categoryResult = categoryScorer.scoreDocument(document, context);

      // Category-focused strategy should weight category score more heavily
      expect(categoryResult.breakdown.categoryContribution).toBeGreaterThan(balancedResult.breakdown.categoryContribution);
    });

    it('should normalize scores to 0-1 range', () => {
      const documents = testDocuments.slice(0, 3);
      
      documents.forEach(doc => {
        const result = scorer.scoreDocument(doc, context);
        expect(result.scores.total).toBeGreaterThanOrEqual(0);
        expect(result.scores.total).toBeLessThanOrEqual(1);
        expect(result.scores.category).toBeGreaterThanOrEqual(0);
        expect(result.scores.category).toBeLessThanOrEqual(1);
        expect(result.scores.tag).toBeGreaterThanOrEqual(0);
        expect(result.scores.tag).toBeLessThanOrEqual(1);
        expect(result.scores.priority).toBeGreaterThanOrEqual(0);
        expect(result.scores.priority).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate confidence based on data completeness', () => {
      const completeDocument = testDocuments[0];
      const incompleteDocument = { ...testDocuments[1] };
      delete incompleteDocument.composition;
      delete incompleteDocument.tags.secondary;

      const completeResult = scorer.scoreDocument(completeDocument, context);
      const incompleteResult = scorer.scoreDocument(incompleteDocument, context);

      expect(completeResult.confidence).toBeGreaterThan(incompleteResult.confidence);
    });
  });

  describe('calculateTagAffinity()', () => {
    it('should calculate perfect affinity for exact matches', () => {
      const document = testDocuments[0];
      document.tags.primary = ['beginner', 'step-by-step', 'practical'];
      
      const targetTags = ['beginner', 'step-by-step'];
      const result = scorer.calculateTagAffinity(document, targetTags);

      expect(result.affinity).toBeCloseTo(1.0, 1);
      expect(result.matchedTags).toContain('beginner');
      expect(result.matchedTags).toContain('step-by-step');
      expect(result.matchedTags).toHaveLength(2);
    });

    it('should calculate partial affinity for compatible tags', () => {
      const document = testDocuments[0];
      document.tags.primary = ['beginner', 'practical'];
      
      const targetTags = ['step-by-step']; // Compatible with beginner
      const result = scorer.calculateTagAffinity(document, targetTags);

      expect(result.affinity).toBeGreaterThan(0);
      expect(result.affinity).toBeLessThan(1);
      expect(result.compatibleTags).toContain('step-by-step');
    });

    it('should detect incompatible tag combinations', () => {
      const document = testDocuments[0];
      document.tags.primary = ['beginner'];
      
      const targetTags = ['advanced']; // Incompatible with beginner
      const result = scorer.calculateTagAffinity(document, targetTags);

      expect(result.affinity).toBeLessThan(0.5);
      expect(result.incompatibleTags).toContain('advanced');
    });

    it('should handle empty tag sets gracefully', () => {
      const document = testDocuments[0];
      document.tags.primary = [];
      
      const targetTags: string[] = [];
      const result = scorer.calculateTagAffinity(document, targetTags);

      expect(result.affinity).toBe(0);
      expect(result.matchedTags).toHaveLength(0);
      expect(result.compatibleTags).toHaveLength(0);
      expect(result.incompatibleTags).toHaveLength(0);
    });

    it('should apply tag weights in affinity calculation', () => {
      const document = testDocuments[0];
      document.tags.primary = ['beginner']; // High weight tag (1.2)
      
      const document2 = testDocuments[1];
      document2.tags.primary = ['technical']; // Normal weight tag (1.0)
      
      const targetTags = ['beginner'];
      const result1 = scorer.calculateTagAffinity(document, targetTags);
      
      const targetTags2 = ['technical'];
      const result2 = scorer.calculateTagAffinity(document2, targetTags2);

      // Beginner tag should have higher weighted affinity
      expect(result1.weightedAffinity).toBeGreaterThan(result2.weightedAffinity);
    });
  });

  describe('Category scoring', () => {
    it('should score documents based on category priority', () => {
      const guideDoc = testDocuments[0];
      guideDoc.document.category = 'guide';
      
      const apiDoc = testDocuments[1];
      apiDoc.document.category = 'api';

      const context: SelectionContext = {
        targetTags: [],
        tagWeights: {},
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000
      };

      const guideResult = scorer.scoreDocument(guideDoc, context);
      const apiResult = scorer.scoreDocument(apiDoc, context);

      // Guide has higher priority (90) than API (85) - should be normalized to 0-1 scale
      expect(guideResult.scores.category).toBeGreaterThanOrEqual(apiResult.scores.category);
    });

    it('should consider category affinity from composition metadata', () => {
      const document = testDocuments[0];
      document.document.category = 'guide';
      document.composition = {
        categoryAffinity: {
          guide: 1.0,
          api: 0.3
        }
      };

      const context: SelectionContext = {
        targetCategory: 'guide',
        targetTags: [],
        tagWeights: {},
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000
      };

      const result = scorer.scoreDocument(document, context);
      expect(result.scores.category).toBeCloseTo(1.0, 1);
    });
  });

  describe('Priority scoring', () => {
    it('should normalize priority scores correctly', () => {
      const highPriorityDoc = testDocuments[0];
      highPriorityDoc.priority.score = 95;
      
      const lowPriorityDoc = testDocuments[1];
      lowPriorityDoc.priority.score = 20;

      const context: SelectionContext = {
        targetTags: [],
        tagWeights: {},
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000
      };

      const highResult = scorer.scoreDocument(highPriorityDoc, context);
      const lowResult = scorer.scoreDocument(lowPriorityDoc, context);

      expect(highResult.scores.priority).toBeGreaterThan(lowResult.scores.priority);
      expect(highResult.scores.priority).toBeLessThanOrEqual(1);
      expect(lowResult.scores.priority).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Contextual scoring', () => {
    it('should consider contextual relevance from composition metadata', () => {
      const document = testDocuments[0];
      document.composition = {
        contextualRelevance: {
          onboarding: 0.9,
          troubleshooting: 0.2,
          advanced_usage: 0.1,
          api_reference: 0.3,
          learning_path: 0.8
        }
      };

      const context: SelectionContext = {
        targetTags: [],
        tagWeights: {},
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000,
        contextType: 'onboarding'
      };

      const result = scorer.scoreDocument(document, context, {
        contextualRelevance: { onboarding: 1.0 }
      });
      expect(result.scores.contextual).toBeGreaterThan(0.8);
    });

    it('should handle missing contextual relevance gracefully', () => {
      const document = testDocuments[0];
      delete document.composition;

      const context: SelectionContext = {
        targetTags: [],
        tagWeights: {},
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000,
        contextType: 'onboarding'
      };

      const result = scorer.scoreDocument(document, context);
      expect(result.scores.contextual).toBeDefined();
      expect(result.scores.contextual).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle document with no tags', () => {
      const document = testDocuments[0];
      document.tags.primary = [];

      const context: SelectionContext = {
        targetTags: ['beginner'],
        tagWeights: { beginner: 1.5 },
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000
      };

      const result = scorer.scoreDocument(document, context);
      expect(result.scores.tag).toBe(0);
      expect(result.scores.total).toBeGreaterThan(0); // Should still have other scores
    });

    it('should handle extreme priority values', () => {
      const document = testDocuments[0];
      document.priority.score = 0; // Minimum

      const context: SelectionContext = {
        targetTags: [],
        tagWeights: {},
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000
      };

      const result = scorer.scoreDocument(document, context);
      expect(result.scores.priority).toBe(0.5); // Default normalized value for score 0
      expect(result.scores.total).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing composition metadata', () => {
      const document = testDocuments[0];
      delete document.composition;

      const context: SelectionContext = {
        targetTags: ['beginner'],
        tagWeights: { beginner: 1.0 },
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000
      };

      const result = scorer.scoreDocument(document, context);
      expect(result).toBeDefined();
      expect(result.scores.total).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThan(1.0); // Lower confidence due to missing data
    });
  });

  describe('Performance', () => {
    it('should score documents efficiently', () => {
      const manyDocuments = TestDataGenerator.generateDocuments(100);
      const context: SelectionContext = {
        targetTags: ['beginner', 'practical'],
        tagWeights: { beginner: 1.2, practical: 1.1 },
        selectedDocuments: [],
        characterLimit: 1000,
        targetCharacterLimit: 1000
      };

      const startTime = Date.now();
      
      manyDocuments.forEach(doc => {
        scorer.scoreDocument(doc, context);
      });

      const endTime = Date.now();
      const timePerDocument = (endTime - startTime) / manyDocuments.length;
      
      // Should score each document in less than 10ms
      expect(timePerDocument).toBeLessThan(10);
    });
  });
});