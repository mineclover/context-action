import { AdaptiveDocumentSelector } from '../../../src/core/AdaptiveDocumentSelector';
import { EnhancedLLMSConfig, DocumentMetadata, SelectionConstraints, SelectionContext } from '../../../src/types/config';
import { TestDataGenerator } from '../../helpers/test-data-generator';

describe('AdaptiveDocumentSelector', () => {
  let selector: AdaptiveDocumentSelector;
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
        },
        concept: {
          name: '개념',
          description: 'Conceptual documentation',
          priority: 80,
          defaultStrategy: 'concept-first',
          tags: ['theory', 'architecture']
        },
        example: {
          name: '예제',
          description: 'Code examples',
          priority: 75,
          defaultStrategy: 'example-first',
          tags: ['practical', 'code']
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
        practical: {
          name: '실용적',
          description: 'Practical content',
          weight: 1.1,
          compatibleWith: ['beginner', 'example'],
          audience: ['all-users']
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
          'quality-focused': {
            name: 'Quality Focused',
            algorithm: 'knapsack',
            criteria: {
              categoryWeight: 0.2,
              tagWeight: 0.2,
              dependencyWeight: 0.1,
              priorityWeight: 0.5
            }
          },
          diverse: {
            name: 'Diverse Strategy',
            algorithm: 'topsis',
            criteria: {
              categoryWeight: 0.25,
              tagWeight: 0.25,
              dependencyWeight: 0.25,
              priorityWeight: 0.25
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

    // Generate test documents with known character counts
    testDocuments = TestDataGenerator.generateDocuments(10, {
      categories: ['guide', 'api', 'concept', 'example'],
      tags: ['beginner', 'advanced', 'practical', 'technical']
    });

    // Set known character counts for testing
    testDocuments.forEach((doc, index) => {
      doc.document.wordCount = (index + 1) * 100; // 100, 200, 300, etc.
      doc.priority.score = 90 - (index * 5); // 90, 85, 80, etc.
    });

    selector = new AdaptiveDocumentSelector(mockConfig);
  });

  describe('Constructor', () => {
    it('should initialize with valid config', () => {
      expect(selector).toBeInstanceOf(AdaptiveDocumentSelector);
    });

    it('should load available strategies from config', () => {
      const strategies = selector.getAvailableStrategies();
      
      expect(strategies).toHaveLength(3);
      expect(strategies.map(s => s.name)).toContain('balanced');
      expect(strategies.map(s => s.name)).toContain('quality-focused');
      expect(strategies.map(s => s.name)).toContain('diverse');
    });
  });

  describe('selectDocuments()', () => {
    let constraints: SelectionConstraints;

    beforeEach(() => {
      constraints = {
        maxCharacters: 1000,
        targetCharacterLimit: 1000,
        context: {
          targetTags: ['beginner', 'practical'],
          tagWeights: { beginner: 1.2, practical: 1.1 },
          selectedDocuments: [],
          maxCharacters: 1000,
          targetCharacterLimit: 1000
        }
      };
    });

    it('should execute knapsack algorithm correctly', async () => {
      const options = {
        strategy: 'knapsack',
        enableOptimization: true,
        maxIterations: 10
      };

      const result = await selector.selectDocuments(testDocuments, constraints, options);

      expect(result).toBeDefined();
      expect(result.selectedDocuments).toBeDefined();
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.strategy.algorithm).toBe('knapsack');
      expect(result.metadata.algorithmsUsed).toContain('knapsack');

      // Check character limit constraint
      const totalCharacters = result.selectedDocuments.reduce((sum, doc) => 
        sum + (doc.document.wordCount || 0), 0);
      expect(totalCharacters).toBeLessThanOrEqual(constraints.maxCharacters);
    });

    it('should execute greedy algorithm efficiently', async () => {
      const options = {
        strategy: 'greedy',
        enableOptimization: false
      };

      const startTime = Date.now();
      const result = await selector.selectDocuments(testDocuments, constraints, options);
      const processingTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.strategy.algorithm).toBe('greedy');
      expect(processingTime).toBeLessThan(100); // Should be very fast

      // Greedy should select highest value documents first
      const scores = result.scoring.scoreDistribution.map(s => s.scores.total);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });

    it('should execute multi-criteria analysis (TOPSIS)', async () => {
      const options = {
        strategy: 'topsis',
        enableOptimization: true
      };

      const result = await selector.selectDocuments(testDocuments, constraints, options);

      expect(result).toBeDefined();
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.strategy.algorithm).toBe('topsis');
      expect(result.metadata.algorithmsUsed).toContain('topsis');

      // TOPSIS should provide balanced selection
      expect(result.optimization.balanceScore).toBeGreaterThan(0.5);
    });

    it('should execute hybrid algorithm optimally', async () => {
      const options = {
        strategy: 'hybrid',
        enableOptimization: true,
        maxIterations: 5
      };

      const result = await selector.selectDocuments(testDocuments, constraints, options);

      expect(result).toBeDefined();
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.strategy.algorithm).toBe('hybrid');
      expect(result.metadata.algorithmsUsed.length).toBeGreaterThan(1); // Should use multiple algorithms

      // Hybrid should achieve high optimization scores
      expect(result.optimization.qualityScore).toBeGreaterThan(0.6);
    });

    it('should respect character constraints', async () => {
      const strictConstraints = {
        ...constraints,
        maxCharacters: 500,
        targetCharacterLimit: 500
      };

      const result = await selector.selectDocuments(testDocuments, strictConstraints);

      const totalCharacters = result.selectedDocuments.reduce((sum, doc) => 
        sum + (doc.document.wordCount || 0), 0);
      
      expect(totalCharacters).toBeLessThanOrEqual(strictConstraints.maxCharacters);
      expect(result.optimization.spaceUtilization).toBeGreaterThan(0.7); // Should use space efficiently
    });

    it('should optimize for multiple objectives', async () => {
      const options = {
        strategy: 'hybrid',
        enableOptimization: true,
        objectives: {
          quality: 0.4,
          diversity: 0.3,
          efficiency: 0.3
        }
      };

      const result = await selector.selectDocuments(testDocuments, constraints, options);

      expect(result.optimization.qualityScore).toBeGreaterThan(0);
      expect(result.optimization.diversityScore).toBeGreaterThan(0);
      expect(result.optimization.spaceUtilization).toBeGreaterThan(0);

      // Verify category coverage for diversity
      const categories = new Set(result.selectedDocuments.map(doc => doc.document.category));
      expect(categories.size).toBeGreaterThan(1); // Should have multiple categories
    });

    it('should handle empty document collection', async () => {
      const result = await selector.selectDocuments([], constraints);

      expect(result.selectedDocuments).toHaveLength(0);
      expect(result.optimization.spaceUtilization).toBe(0);
      expect(result.metadata.selectionTime).toBeGreaterThan(0);
    });

    it('should handle single document selection', async () => {
      const singleDoc = [testDocuments[0]];
      const result = await selector.selectDocuments(singleDoc, constraints);

      expect(result.selectedDocuments).toHaveLength(1);
      expect(result.selectedDocuments[0]).toEqual(singleDoc[0]);
    });
  });

  describe('Selection optimization', () => {
    it('should converge within iteration limits', async () => {
      const options = {
        strategy: 'hybrid',
        enableOptimization: true,
        maxIterations: 3,
        convergenceThreshold: 0.01
      };

      const constraints: SelectionConstraints = {
        maxCharacters: 1500,
        targetCharacterLimit: 1500,
        context: {
          targetTags: ['practical'],
          tagWeights: { practical: 1.0 },
          selectedDocuments: [],
          maxCharacters: 1500,
          targetCharacterLimit: 1500
        }
      };

      const result = await selector.selectDocuments(testDocuments, constraints, options);

      expect(result.metadata.iterationsPerformed).toBeLessThanOrEqual(options.maxIterations);
      expect(result.metadata.convergenceAchieved).toBeDefined();
    });

    it('should improve selection quality through iterations', async () => {
      const options = {
        strategy: 'hybrid',
        enableOptimization: true,
        maxIterations: 5,
        trackIterations: true
      };

      const constraints: SelectionConstraints = {
        maxCharacters: 1200,
        targetCharacterLimit: 1200,
        context: {
          targetTags: ['beginner', 'practical'],
          tagWeights: { beginner: 1.2, practical: 1.1 },
          selectedDocuments: [],
          maxCharacters: 1200,
          targetCharacterLimit: 1200
        }
      };

      const result = await selector.selectDocuments(testDocuments, constraints, options);

      if (result.metadata.iterationsPerformed > 1) {
        // Later iterations should not decrease quality significantly
        expect(result.optimization.qualityScore).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Strategy-specific behavior', () => {
    const baseConstraints: SelectionConstraints = {
      maxCharacters: 1000,
      targetCharacterLimit: 1000,
      context: {
        targetTags: ['practical'],
        tagWeights: { practical: 1.0 },
        selectedDocuments: [],
        maxCharacters: 1000,
        targetCharacterLimit: 1000
      }
    };

    it('should apply balanced strategy weights', async () => {
      const result = await selector.selectDocuments(testDocuments, baseConstraints, {
        strategy: 'balanced'
      });

      // Balanced strategy should consider all factors
      expect(result.analysis.categoryCoverage).toBeDefined();
      expect(result.analysis.tagCoverage).toBeDefined();
      expect(Object.keys(result.analysis.categoryCoverage).length).toBeGreaterThan(1);
    });

    it('should prioritize quality in quality-focused strategy', async () => {
      const result = await selector.selectDocuments(testDocuments, baseConstraints, {
        strategy: 'quality-focused'
      });

      // Quality-focused should select high-priority documents
      const averagePriority = result.selectedDocuments.reduce((sum, doc) => 
        sum + doc.priority.score, 0) / result.selectedDocuments.length;
      
      expect(averagePriority).toBeGreaterThan(75); // Should select higher priority docs
    });

    it('should maximize diversity in diverse strategy', async () => {
      const result = await selector.selectDocuments(testDocuments, baseConstraints, {
        strategy: 'diverse'
      });

      // Diverse strategy should cover multiple categories and tags
      const categories = new Set(result.selectedDocuments.map(doc => doc.document.category));
      const tags = new Set(result.selectedDocuments.flatMap(doc => doc.tags.primary || []));

      expect(categories.size).toBeGreaterThanOrEqual(2);
      expect(tags.size).toBeGreaterThanOrEqual(2);
      expect(result.optimization.diversityScore).toBeGreaterThan(0.6);
    });
  });

  describe('Performance optimization', () => {
    it('should handle large document collections efficiently', async () => {
      const largeCollection = TestDataGenerator.generateDocuments(500);
      const constraints: SelectionConstraints = {
        maxCharacters: 2000,
        targetCharacterLimit: 2000,
        context: {
          targetTags: ['practical'],
          tagWeights: { practical: 1.0 },
          selectedDocuments: [],
          maxCharacters: 2000,
          targetCharacterLimit: 2000
        }
      };

      const startTime = Date.now();
      const result = await selector.selectDocuments(largeCollection, constraints, {
        strategy: 'greedy' // Fastest algorithm
      });
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.metadata.selectionTime).toBeLessThan(processingTime);
    });

    it('should cache intermediate results for better performance', async () => {
      const constraints: SelectionConstraints = {
        maxCharacters: 800,
        targetCharacterLimit: 800,
        context: {
          targetTags: ['beginner'],
          tagWeights: { beginner: 1.0 },
          selectedDocuments: [],
          maxCharacters: 800,
          targetCharacterLimit: 800
        }
      };

      // First run
      const startTime1 = Date.now();
      await selector.selectDocuments(testDocuments, constraints);
      const time1 = Date.now() - startTime1;

      // Second run with similar constraints should benefit from caching
      const startTime2 = Date.now();
      await selector.selectDocuments(testDocuments, constraints);
      const time2 = Date.now() - startTime2;

      expect(time2).toBeLessThanOrEqual(time1 * 1.2); // Allow 20% variance
    });
  });

  describe('Edge cases', () => {
    it('should handle documents exceeding character limits', async () => {
      const oversizedDocs = testDocuments.map(doc => ({
        ...doc,
        document: {
          ...doc.document,
          wordCount: 2000 // Each doc exceeds limit
        }
      }));

      const constraints: SelectionConstraints = {
        maxCharacters: 1000,
        targetCharacterLimit: 1000,
        context: {
          targetTags: [],
          tagWeights: {},
          selectedDocuments: [],
          maxCharacters: 1000,
          targetCharacterLimit: 1000
        }
      };

      const result = await selector.selectDocuments(oversizedDocs, constraints);

      // Should either select no documents or find a way to fit something
      expect(result.selectedDocuments.length).toBeGreaterThanOrEqual(0);
      
      if (result.selectedDocuments.length > 0) {
        const totalChars = result.selectedDocuments.reduce((sum, doc) => 
          sum + (doc.document.wordCount || 0), 0);
        expect(totalChars).toBeLessThanOrEqual(constraints.maxCharacters);
      }
    });

    it('should handle zero character limit gracefully', async () => {
      const constraints: SelectionConstraints = {
        maxCharacters: 0,
        targetCharacterLimit: 0,
        context: {
          targetTags: [],
          tagWeights: {},
          selectedDocuments: [],
          maxCharacters: 0,
          targetCharacterLimit: 0
        }
      };

      const result = await selector.selectDocuments(testDocuments, constraints);

      expect(result.selectedDocuments).toHaveLength(0);
      expect(result.optimization.spaceUtilization).toBe(0);
    });

    it('should handle invalid strategy names', async () => {
      const constraints: SelectionConstraints = {
        maxCharacters: 1000,
        targetCharacterLimit: 1000,
        context: {
          targetTags: [],
          tagWeights: {},
          selectedDocuments: [],
          maxCharacters: 1000,
          targetCharacterLimit: 1000
        }
      };

      await expect(selector.selectDocuments(testDocuments, constraints, {
        strategy: 'invalid-strategy'
      })).rejects.toThrow('Unknown selection strategy: invalid-strategy');
    });

    it('should handle documents with missing metadata', async () => {
      const incompleteDoc = {
        document: {
          id: 'incomplete-doc',
          title: 'Incomplete Doc',
          source_path: 'incomplete.md',
          category: 'guide' as const
        }
        // Missing priority, tags, etc.
      } as DocumentMetadata;

      const constraints: SelectionConstraints = {
        maxCharacters: 1000,
        targetCharacterLimit: 1000,
        context: {
          targetTags: ['beginner'],
          tagWeights: { beginner: 1.0 },
          selectedDocuments: [],
          maxCharacters: 1000,
          targetCharacterLimit: 1000
        }
      };

      const result = await selector.selectDocuments([incompleteDoc], constraints);

      expect(result).toBeDefined();
      expect(result.selectedDocuments.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAvailableStrategies()', () => {
    it('should return all configured strategies', () => {
      const strategies = selector.getAvailableStrategies();

      expect(strategies).toHaveLength(3);
      strategies.forEach(strategy => {
        expect(strategy.name).toBeDefined();
        expect(strategy.strategy).toBeDefined();
        expect(strategy.strategy.algorithm).toBeDefined();
        expect(strategy.strategy.criteria).toBeDefined();
      });
    });

    it('should include strategy descriptions and algorithms', () => {
      const strategies = selector.getAvailableStrategies();
      const strategyNames = strategies.map(s => s.name);

      expect(strategyNames).toContain('balanced');
      expect(strategyNames).toContain('quality-focused'); 
      expect(strategyNames).toContain('diverse');

      const balancedStrategy = strategies.find(s => s.name === 'balanced');
      expect(balancedStrategy?.strategy.algorithm).toBe('hybrid');
    });
  });
});