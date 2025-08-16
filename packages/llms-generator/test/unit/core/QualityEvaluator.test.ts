import { QualityEvaluator } from '../../../src/core/QualityEvaluator';
import { EnhancedLLMSConfig, DocumentMetadata, SelectionConstraints } from '../../../src/types/config';
import { TestDataGenerator } from '../../helpers/test-data-generator';

describe('QualityEvaluator', () => {
  let evaluator: QualityEvaluator;
  let mockConfig: EnhancedLLMSConfig;
  let testDocuments: DocumentMetadata[];
  let constraints: SelectionConstraints;

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
          compatibleWith: ['beginner', 'tutorial'],
          audience: ['all-users']
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
      categories: ['guide', 'api', 'concept'],
      tags: ['beginner', 'advanced', 'practical']
    });

    // Set specific properties for quality testing
    testDocuments[0].tags.primary = ['beginner', 'practical'];
    testDocuments[0].tags.audience = ['new-users'];
    testDocuments[0].priority.score = 95;
    testDocuments[0].document.category = 'guide';
    
    testDocuments[1].tags.primary = ['advanced'];
    testDocuments[1].tags.audience = ['experts'];  
    testDocuments[1].priority.score = 85;
    testDocuments[1].document.category = 'api';

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

    evaluator = new QualityEvaluator(mockConfig);
  });

  describe('Constructor', () => {
    it('should initialize with valid config', () => {
      expect(evaluator).toBeInstanceOf(QualityEvaluator);
    });

    it('should load quality metrics configuration', () => {
      const metrics = (evaluator as any).qualityMetrics;
      expect(metrics).toBeDefined();
      expect(metrics.size).toBeGreaterThan(0);
    });
  });

  describe('evaluateQuality()', () => {
    it('should generate comprehensive quality reports', () => {
      const selection = testDocuments.slice(0, 3);
      const report = evaluator.evaluateQuality(selection, constraints);

      expect(report).toBeDefined();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.confidence).toBeGreaterThan(0);
      expect(report.confidence).toBeLessThanOrEqual(1);
      expect(report.grade).toMatch(/^[ABCDF][+-]?$/);
      
      // Check required sections
      expect(report.metrics).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.benchmarks).toBeDefined();
      expect(report.validation).toBeDefined();
    });

    it('should calculate content relevance accurately', () => {
      // Create selection with high relevance to target context
      const relevantSelection = [
        {
          ...testDocuments[0],
          tags: { primary: ['beginner', 'practical'], audience: ['new-users'], complexity: 'basic' },
          composition: {
            contextualRelevance: {
              onboarding: 0.95,
              learning_path: 0.9,
              api_reference: 0.3,
              troubleshooting: 0.4,
              advanced_usage: 0.2
            }
          }
        }
      ];

      const report = evaluator.evaluateQuality(relevantSelection, constraints);
      
      const relevanceMetric = report.metrics['content-relevance'];
      expect(relevanceMetric).toBeDefined();
      expect(relevanceMetric.value).toBeGreaterThan(0.8);
      expect(relevanceMetric.details.reasoning.length).toBeGreaterThan(0);
    });

    it('should evaluate completeness comprehensively', () => {
      // Create diverse selection covering multiple categories
      const diverseSelection = [
        { ...testDocuments[0], document: { ...testDocuments[0].document, category: 'guide' } },
        { ...testDocuments[1], document: { ...testDocuments[1].document, category: 'api' } },
        { ...testDocuments[2], document: { ...testDocuments[2].document, category: 'concept' } }
      ];

      const report = evaluator.evaluateQuality(diverseSelection, constraints);
      
      const completenessMetric = report.metrics['content-completeness'];
      expect(completenessMetric).toBeDefined();
      expect(completenessMetric.value).toBeGreaterThan(0.6); // Good diversity
      expect(completenessMetric.details.measured).toBeDefined();
    });

    it('should assess accessibility appropriately', () => {
      // Create beginner-friendly selection
      const accessibleSelection = testDocuments.map(doc => ({
        ...doc,
        tags: { primary: ['beginner', 'step-by-step'], audience: ['new-users'], complexity: 'basic' }
      }));

      const beginnerConstraints = {
        ...constraints,
        context: {
          ...constraints.context,
          targetTags: ['beginner'],
          targetAudience: ['new-users']
        }
      };

      const report = evaluator.evaluateQuality(accessibleSelection, beginnerConstraints);
      
      const accessibilityMetric = report.metrics['complexity-appropriateness'];
      expect(accessibilityMetric).toBeDefined();
      expect(accessibilityMetric.value).toBeGreaterThan(0.7);
      expect(accessibilityMetric.details.suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide actionable recommendations', () => {
      const selection = testDocuments.slice(0, 2);
      const report = evaluator.evaluateQuality(selection, constraints);

      expect(report.summary.recommendations).toBeDefined();
      expect(Array.isArray(report.summary.recommendations)).toBe(true);
      
      if (report.summary.recommendations.length > 0) {
        report.summary.recommendations.forEach(rec => {
          expect(rec.priority).toMatch(/^(high|medium|low)$/);
          expect(rec.action).toBeDefined();
          expect(rec.reason).toBeDefined();
          expect(rec.impact).toBeGreaterThanOrEqual(0);
          expect(rec.impact).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should calculate accurate confidence scores', () => {
      // Complete selection with rich metadata
      const completeSelection = testDocuments.map(doc => ({
        ...doc,
        composition: {
          categoryAffinity: { guide: 1.0, api: 0.7 },
          tagAffinity: { beginner: 1.0, practical: 0.9 },
          contextualRelevance: {
            onboarding: 0.8,
            learning_path: 0.9,
            api_reference: 0.5,
            troubleshooting: 0.4,
            advanced_usage: 0.3
          }
        }
      }));

      const incompleteSelection = testDocuments.map(doc => ({
        ...doc,
        composition: undefined
      }));

      const completeReport = evaluator.evaluateQuality(completeSelection, constraints);
      const incompleteReport = evaluator.evaluateQuality(incompleteSelection, constraints);

      expect(completeReport.confidence).toBeGreaterThan(incompleteReport.confidence);
      expect(completeReport.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Quality metrics calculation', () => {
    it('should calculate all 12 quality dimensions', () => {
      const selection = testDocuments.slice(0, 3);
      const report = evaluator.evaluateQuality(selection, constraints);

      const expectedMetrics = [
        'content-relevance',
        'content-completeness', 
        'content-accuracy',
        'logical-flow',
        'dependency-satisfaction',
        'complexity-appropriateness',
        'audience-alignment',
        'thematic-coherence',
        'tag-consistency',
        'category-coverage',
        'topic-breadth',
        'space-efficiency'
      ];

      expectedMetrics.forEach(metricName => {
        expect(report.metrics[metricName]).toBeDefined();
        expect(report.metrics[metricName].value).toBeGreaterThanOrEqual(0);
        expect(report.metrics[metricName].value).toBeLessThanOrEqual(1);
        expect(report.metrics[metricName].confidence).toBeGreaterThan(0);
        expect(report.metrics[metricName].details).toBeDefined();
      });
    });

    it('should weight metrics according to categories', () => {
      const contentWeightTotal = 0.3; // Content quality weight
      const selection = testDocuments.slice(0, 2);
      const report = evaluator.evaluateQuality(selection, constraints);

      const contentMetrics = ['content-relevance', 'content-completeness', 'content-accuracy'];
      const contentScore = contentMetrics.reduce((sum, metric) => 
        sum + (report.metrics[metric]?.value || 0), 0) / contentMetrics.length;

      // Content metrics should contribute approximately 30% to overall score
      const expectedContribution = contentScore * contentWeightTotal * 100;
      const actualOverall = report.overallScore;

      expect(Math.abs(actualOverall - expectedContribution)).toBeLessThan(40); // Allow for other metric contributions
    });

    it('should handle missing metadata gracefully', () => {
      const incompleteSelection = [
        {
          document: {
            id: 'minimal-doc',
            title: 'Minimal Document',
            source_path: 'minimal.md',
            category: 'guide' as const
          },
          priority: { score: 50, tier: 'useful' as const }
          // Missing tags, composition, dependencies, etc.
        } as DocumentMetadata
      ];

      const report = evaluator.evaluateQuality(incompleteSelection, constraints);

      expect(report).toBeDefined();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.confidence).toBeLessThan(0.5); // Lower confidence due to missing data
      expect(report.validation.failed.length).toBeGreaterThan(0);
    });
  });

  describe('Grading system', () => {
    it('should assign grades correctly based on score ranges', () => {
      // Mock high-quality selection
      const highQualitySelection = testDocuments.map(doc => ({
        ...doc,
        priority: { score: 95, tier: 'critical' as const },
        tags: { primary: ['beginner', 'practical'], audience: ['new-users'], complexity: 'basic' },
        composition: {
          categoryAffinity: { guide: 1.0, api: 0.8 },
          tagAffinity: { beginner: 1.0, practical: 0.95 },
          contextualRelevance: {
            onboarding: 0.95,
            learning_path: 0.9,
            api_reference: 0.7,
            troubleshooting: 0.6,
            advanced_usage: 0.4
          }
        }
      }));

      const report = evaluator.evaluateQuality(highQualitySelection, constraints);

      expect(report.overallScore).toBeGreaterThan(70);
      expect(report.grade).toMatch(/^[ABC]/); // Should be A, B, or C grade
    });

    it('should provide grade explanations', () => {
      const selection = testDocuments.slice(0, 2);
      const report = evaluator.evaluateQuality(selection, constraints);

      expect(report.grade).toBeDefined();
      
      // Grade should correlate with overall score
      const gradeToScore = {
        'A+': 97, 'A': 93, 'A-': 90,
        'B+': 87, 'B': 83, 'B-': 80,
        'C+': 77, 'C': 73, 'C-': 70,
        'D': 60, 'F': 0
      };

      const expectedMinScore = gradeToScore[report.grade as keyof typeof gradeToScore];
      if (expectedMinScore !== undefined) {
        expect(report.overallScore).toBeGreaterThanOrEqual(expectedMinScore - 5); // Allow some tolerance
      }
    });
  });

  describe('Benchmarking', () => {
    it('should compare against category benchmarks', () => {
      const selection = testDocuments.slice(0, 3);
      const report = evaluator.evaluateQuality(selection, constraints);

      expect(report.benchmarks).toBeDefined();
      expect(report.benchmarks.category).toBeDefined();
      expect(report.benchmarks.performance).toMatch(/^(excellent|good|average|below-average|poor)$/);
      expect(report.benchmarks.percentile).toBeGreaterThanOrEqual(0);
      expect(report.benchmarks.percentile).toBeLessThanOrEqual(100);
      expect(report.benchmarks.comparison).toBeDefined();
    });

    it('should adjust benchmarks based on selection context', () => {
      const beginnerSelection = testDocuments.map(doc => ({
        ...doc,
        tags: { primary: ['beginner'], audience: ['new-users'], complexity: 'basic' }
      }));

      const expertSelection = testDocuments.map(doc => ({
        ...doc,
        tags: { primary: ['advanced'], audience: ['experts'], complexity: 'advanced' }
      }));

      const beginnerConstraints = {
        ...constraints,
        context: { ...constraints.context, targetTags: ['beginner'] }
      };

      const expertConstraints = {
        ...constraints,
        context: { ...constraints.context, targetTags: ['advanced'] }
      };

      const beginnerReport = evaluator.evaluateQuality(beginnerSelection, beginnerConstraints);
      const expertReport = evaluator.evaluateQuality(expertSelection, expertConstraints);

      // Benchmarks should be context-appropriate
      expect(beginnerReport.benchmarks.category).toBeDefined();
      expect(expertReport.benchmarks.category).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate selection against quality rules', () => {
      const selection = testDocuments.slice(0, 3);
      const report = evaluator.evaluateQuality(selection, constraints);

      expect(report.validation).toBeDefined();
      expect(report.validation.passed).toBeDefined();
      expect(report.validation.failed).toBeDefined();
      expect(report.validation.score).toBeGreaterThanOrEqual(0);
      expect(report.validation.score).toBeLessThanOrEqual(100);

      // Validation rules should have descriptions
      [...report.validation.passed, ...report.validation.failed].forEach(rule => {
        expect(rule.rule).toBeDefined();
        expect(rule.description).toBeDefined();
      });

      // Failed rules should have severity
      report.validation.failed.forEach(rule => {
        expect(rule.severity).toMatch(/^(error|warning)$/);
      });
    });

    it('should enforce quality thresholds', () => {
      const lowQualitySelection = testDocuments.map(doc => ({
        ...doc,
        priority: { score: 20, tier: 'optional' as const }, // Very low priority
        tags: { primary: ['advanced'], audience: ['experts'], complexity: 'expert' } // Mismatched with beginner context
      }));

      const report = evaluator.evaluateQuality(lowQualitySelection, constraints);

      expect(report.validation.failed.length).toBeGreaterThan(0);
      expect(report.overallScore).toBeLessThan(mockConfig.generation.qualityThreshold);
      
      const thresholdFailure = report.validation.failed.find(f => 
        f.rule.includes('quality-threshold')
      );
      expect(thresholdFailure).toBeDefined();
      expect(thresholdFailure?.severity).toBe('error');
    });
  });

  describe('Custom metrics', () => {
    it('should allow adding custom quality metrics', () => {
      const customMetric = {
        name: 'Custom Metric',
        category: 'content' as const,
        weight: 0.5,
        calculate: (selection: DocumentMetadata[], constraints: SelectionConstraints, config: EnhancedLLMSConfig) => {
          const hasCustomTag = selection.some(doc => 
            doc.tags.primary?.includes('custom-tag')
          );
          
          return {
            value: hasCustomTag ? 0.9 : 0.5,
            confidence: 0.8,
            details: {
              measured: hasCustomTag,
              expected: true,
              reasoning: ['Custom metric calculation'],
              suggestions: hasCustomTag ? [] : ['Add custom tags']
            }
          };
        }
      };

      evaluator.addMetric('custom-metric', customMetric);

      const selection = [
        {
          ...testDocuments[0],
          tags: { primary: ['custom-tag', 'beginner'], audience: ['new-users'], complexity: 'basic' }
        }
      ];

      const report = evaluator.evaluateQuality(selection, constraints);

      expect(report.metrics['custom-metric']).toBeDefined();
      expect(report.metrics['custom-metric'].value).toBe(0.9);
      expect(report.metrics['custom-metric'].details.suggestions).toHaveLength(0);
    });

    it('should integrate custom metrics into overall score', () => {
      const customMetric = {
        name: 'High Impact Custom Metric',
        category: 'quality' as const,
        weight: 0.8, // High weight
        calculate: () => ({
          value: 1.0, // Perfect score
          confidence: 1.0,
          details: {
            measured: 1.0,
            expected: 1.0,
            reasoning: ['Perfect custom metric'],
            suggestions: []
          }
        })
      };

      evaluator.addMetric('high-impact-custom', customMetric);

      const selection = testDocuments.slice(0, 2);
      const reportWithCustom = evaluator.evaluateQuality(selection, constraints);

      // Remove custom metric for comparison
      const standardEvaluator = new QualityEvaluator(mockConfig);
      const reportWithoutCustom = standardEvaluator.evaluateQuality(selection, constraints);

      // Custom metric should improve overall score
      expect(reportWithCustom.overallScore).toBeGreaterThanOrEqual(reportWithoutCustom.overallScore);
    });
  });

  describe('Performance', () => {
    it('should evaluate large selections efficiently', () => {
      const largeSelection = TestDataGenerator.generateDocuments(100);
      
      const startTime = Date.now();
      const report = evaluator.evaluateQuality(largeSelection, constraints);
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(report).toBeDefined();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should cache quality calculations for performance', () => {
      const selection = testDocuments.slice(0, 3);

      // First evaluation
      const startTime1 = Date.now();
      evaluator.evaluateQuality(selection, constraints);
      const time1 = Date.now() - startTime1;

      // Second evaluation (should benefit from caching)
      const startTime2 = Date.now();
      evaluator.evaluateQuality(selection, constraints);
      const time2 = Date.now() - startTime2;

      expect(time2).toBeLessThanOrEqual(time1 * 1.2); // Allow some variance
    });
  });

  describe('Edge cases', () => {
    it('should handle empty selection', () => {
      const report = evaluator.evaluateQuality([], constraints);

      expect(report).toBeDefined();
      expect(report.overallScore).toBe(0);
      expect(report.grade).toBe('F');
      expect(report.confidence).toBe(0);
      expect(report.validation.failed.length).toBeGreaterThan(0);
    });

    it('should handle selection exceeding character limits', () => {
      const oversizedSelection = testDocuments.map(doc => ({
        ...doc,
        document: { ...doc.document, wordCount: 1000 } // Each doc is 1000 chars
      }));

      const strictConstraints = {
        ...constraints,
        maxCharacters: 500, // Much smaller limit
        targetCharacterLimit: 500
      };

      const report = evaluator.evaluateQuality(oversizedSelection, strictConstraints);

      expect(report.metrics['space-efficiency']).toBeDefined();
      expect(report.metrics['space-efficiency'].value).toBeLessThan(0.5); // Poor space efficiency
      
      const exceedsLimitFailure = report.validation.failed.find(f => 
        f.rule.includes('character-limit')
      );
      expect(exceedsLimitFailure).toBeDefined();
    });

    it('should handle malformed document metadata', () => {
      const malformedSelection = [
        {
          document: { id: 'malformed', title: 'Malformed', source_path: 'mal.md', category: 'guide' },
          priority: undefined,
          tags: null,
          composition: { /* incomplete */ }
        } as any as DocumentMetadata
      ];

      expect(() => {
        evaluator.evaluateQuality(malformedSelection, constraints);
      }).not.toThrow();
    });

    it('should handle extremely unbalanced selections', () => {
      // All documents from same category with same tags
      const unbalancedSelection = testDocuments.map(doc => ({
        ...doc,
        document: { ...doc.document, category: 'guide' as const },
        tags: { primary: ['beginner'], audience: ['new-users'], complexity: 'basic' }
      }));

      const report = evaluator.evaluateQuality(unbalancedSelection, constraints);

      expect(report.metrics['category-coverage']).toBeDefined();
      expect(report.metrics['category-coverage'].value).toBeLessThan(0.5); // Poor coverage
      expect(report.summary.weaknesses).toContain('Limited category coverage');
    });
  });
});