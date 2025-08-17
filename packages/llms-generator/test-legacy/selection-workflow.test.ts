import { EnhancedConfigManager } from '../../src/core/EnhancedConfigManager';
import { DocumentScorer } from '../../src/core/DocumentScorer';
import { TagBasedDocumentFilter } from '../../src/core/TagBasedDocumentFilter';
import { AdaptiveDocumentSelector } from '../../src/core/AdaptiveDocumentSelector';
import { DependencyResolver } from '../../src/core/DependencyResolver';
import { ConflictDetector } from '../../src/core/ConflictDetector';
import { QualityEvaluator } from '../../src/core/QualityEvaluator';
import { EnhancedLLMSConfig, DocumentMetadata, SelectionConstraints } from '../../src/types/config';
import { TestDataGenerator } from '../helpers/test-data-generator';

describe('Selection Workflow Integration', () => {
  let configManager: EnhancedConfigManager;
  let config: EnhancedLLMSConfig;
  let testDocuments: DocumentMetadata[];

  beforeEach(async () => {
    // Setup enhanced config
    configManager = new EnhancedConfigManager();
    config = await configManager.initializeConfig('standard');
    
    // Generate comprehensive test dataset
    testDocuments = [
      ...TestDataGenerator.generateDependencyGraph('simple'),
      ...TestDataGenerator.generateConflictingDocuments(),
      ...TestDataGenerator.generateDocuments(15, {
        categories: ['guide', 'api', 'concept', 'example'],
        tags: ['beginner', 'intermediate', 'advanced', 'practical', 'technical'],
        withDependencies: true
      })
    ];
  });

  describe('Complete Selection Pipeline', () => {
    it('should execute complete selection workflow', async () => {
      // Define selection context
      const constraints: SelectionConstraints = {
        maxCharacters: 2500,
        targetCharacterLimit: 2500,
        context: {
          targetTags: ['beginner', 'practical'],
          tagWeights: { beginner: 1.3, practical: 1.2, 'step-by-step': 1.1 },
          selectedDocuments: [],
          maxCharacters: 2500,
          targetCharacterLimit: 2500
        }
      };

      // Step 1: Initialize components
      const scorer = new DocumentScorer(config, 'balanced');
      const filter = new TagBasedDocumentFilter(config);
      const dependencyResolver = new DependencyResolver(config);
      const conflictDetector = new ConflictDetector(config);
      const selector = new AdaptiveDocumentSelector(config);
      const qualityEvaluator = new QualityEvaluator(config);

      // Step 2: Filter documents by tags
      const filterResult = filter.filterDocuments(testDocuments, {
        requiredTags: ['beginner', 'practical'],
        excludedTags: ['advanced', 'expert'],
        targetAudience: ['new-users'],
        enforceTagCompatibility: true
      });

      expect(filterResult.filtered.length).toBeGreaterThan(0);
      expect(filterResult.filtered.length).toBeLessThan(testDocuments.length);

      // Step 3: Resolve dependencies
      const dependencyResult = dependencyResolver.resolveDependencies(filterResult.filtered, {
        maxDepth: 3,
        includeOptionalDependencies: true,
        resolveConflicts: true,
        conflictResolution: 'higher-score-wins'
      });

      expect(dependencyResult.resolvedDocuments.length).toBeGreaterThanOrEqual(filterResult.filtered.length);

      // Step 4: Detect and resolve conflicts
      const conflictResult = conflictDetector.detectConflicts(dependencyResult.resolvedDocuments, {
        enabledRules: ['tag-incompatible', 'content-duplicate', 'audience-mismatch'],
        severityThreshold: 'moderate',
        autoResolve: true,
        autoResolveStrategy: 'higher-score-wins'
      });

      expect(conflictResult).toBeDefined();

      // Apply conflict resolutions
      const resolvedConflicts = conflictDetector.applyConflictResolutions(
        dependencyResult.resolvedDocuments,
        conflictResult.conflicts,
        { strategy: 'higher-score-wins' }
      );

      // Step 5: Score all documents
      const scoredDocuments = resolvedConflicts.resolvedDocuments.map(doc => {
        const result = scorer.scoreDocument(doc, constraints.context);
        return { document: doc, score: result.scores.total, breakdown: result };
      });

      expect(scoredDocuments.length).toBeGreaterThan(0);
      scoredDocuments.forEach(scored => {
        expect(scored.score).toBeGreaterThanOrEqual(0);
        expect(scored.score).toBeLessThanOrEqual(1);
      });

      // Step 6: Select optimal documents
      const selectionResult = await selector.selectDocuments(
        resolvedConflicts.resolvedDocuments,
        constraints,
        {
          strategy: 'balanced',
          enableOptimization: true,
          enableConflictResolution: true
        }
      );

      expect(selectionResult.selectedDocuments.length).toBeGreaterThan(0);
      
      // Verify character constraint satisfaction
      const totalCharacters = selectionResult.selectedDocuments.reduce(
        (sum, doc) => sum + (doc.document.wordCount || 0), 0
      );
      expect(totalCharacters).toBeLessThanOrEqual(constraints.maxCharacters);

      // Step 7: Evaluate selection quality
      const qualityReport = qualityEvaluator.evaluateQuality(
        selectionResult.selectedDocuments,
        constraints,
        selectionResult
      );

      expect(qualityReport.overallScore).toBeGreaterThan(60); // Minimum acceptable quality
      expect(qualityReport.confidence).toBeGreaterThan(0.7);
      expect(qualityReport.grade).toMatch(/^[ABC]/); // Should achieve decent grade

      // Step 8: Verify workflow coherence
      expect(selectionResult.analysis.categoryCoverage).toBeDefined();
      expect(selectionResult.analysis.tagCoverage).toBeDefined();
      
      // Should have good coverage of target tags
      expect(selectionResult.analysis.tagCoverage['beginner']).toBeGreaterThan(0);
      expect(selectionResult.analysis.tagCoverage['practical']).toBeGreaterThan(0);

      // Quality should reflect the selection optimization
      expect(qualityReport.metrics['content-relevance'].value).toBeGreaterThan(0.7);
      expect(qualityReport.metrics['audience-alignment'].value).toBeGreaterThan(0.8);
    });

    it('should handle large document collections', async () => {
      const largeCollection = TestDataGenerator.generateDocuments(500, {
        categories: ['guide', 'api', 'concept', 'example'],
        tags: ['beginner', 'intermediate', 'advanced', 'practical', 'technical'],
        withDependencies: true,
        withConflicts: true
      });

      const constraints: SelectionConstraints = {
        maxCharacters: 5000,
        targetCharacterLimit: 5000,
        context: {
          targetTags: ['practical', 'intermediate'],
          tagWeights: { practical: 1.2, intermediate: 1.1 },
          selectedDocuments: [],
          maxCharacters: 5000,
          targetCharacterLimit: 5000
        }
      };

      const startTime = Date.now();

      // Full pipeline execution
      const filter = new TagBasedDocumentFilter(config);
      const selector = new AdaptiveDocumentSelector(config);
      const qualityEvaluator = new QualityEvaluator(config);

      const filterResult = filter.filterDocuments(largeCollection, {
        targetAudience: ['all-users', 'intermediate-users'],
        enforceTagCompatibility: true
      });

      const selectionResult = await selector.selectDocuments(
        filterResult.filtered,
        constraints,
        { strategy: 'greedy' } // Use fastest algorithm for large collections
      );

      const qualityReport = qualityEvaluator.evaluateQuality(
        selectionResult.selectedDocuments,
        constraints
      );

      const processingTime = Date.now() - startTime;

      // Performance assertions
      expect(processingTime).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(selectionResult.selectedDocuments.length).toBeGreaterThan(0);
      expect(qualityReport.overallScore).toBeGreaterThan(50); // Reasonable quality for large scale
    });

    it('should integrate quality evaluation into selection process', async () => {
      const constraints: SelectionConstraints = {
        maxCharacters: 1500,
        targetCharacterLimit: 1500,
        context: {
          targetTags: ['beginner', 'step-by-step'],
          tagWeights: { beginner: 1.4, 'step-by-step': 1.3 },
          selectedDocuments: [],
          maxCharacters: 1500,
          targetCharacterLimit: 1500,
          qualityThreshold: 80 // High quality requirement
        }
      };

      const selector = new AdaptiveDocumentSelector(config);
      const qualityEvaluator = new QualityEvaluator(config);

      // Select with quality optimization
      const selectionResult = await selector.selectDocuments(testDocuments, constraints, {
        strategy: 'quality-focused',
        enableOptimization: true,
        qualityThreshold: 80
      });

      const qualityReport = qualityEvaluator.evaluateQuality(
        selectionResult.selectedDocuments,
        constraints,
        selectionResult
      );

      // Quality-focused selection should achieve high quality
      expect(qualityReport.overallScore).toBeGreaterThan(75);
      expect(qualityReport.grade).toMatch(/^[AB]/); // A or B grade
      expect(qualityReport.validation.failed.length).toBe(0); // No critical failures

      // Should prioritize high-quality documents
      const averagePriority = selectionResult.selectedDocuments.reduce(
        (sum, doc) => sum + doc.priority.score, 0
      ) / selectionResult.selectedDocuments.length;

      expect(averagePriority).toBeGreaterThan(70);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle corrupted document metadata gracefully', async () => {
      const corruptedDocs = [
        ...testDocuments.slice(0, 5),
        // Add corrupted documents
        {
          document: { id: 'corrupt-1', title: '', source_path: 'corrupt.md', category: 'guide' },
          priority: undefined,
          tags: null,
          dependencies: { prerequisites: [{ documentId: 'non-existent', importance: 'required' }] }
        } as any,
        {
          document: { id: 'corrupt-2', title: 'Corrupt 2' },
          // Missing required fields
        } as any
      ];

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

      const selector = new AdaptiveDocumentSelector(config);

      // Should not throw errors
      expect(async () => {
        const result = await selector.selectDocuments(corruptedDocs, constraints);
        expect(result.selectedDocuments.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should recover from component failures', async () => {
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

      // Simulate failure in one component
      const faultyScorer = new DocumentScorer(config, 'balanced');
      const originalScore = faultyScorer.scoreDocument.bind(faultyScorer);
      
      // Mock intermittent failures
      let failureCount = 0;
      faultyScorer.scoreDocument = (doc, context) => {
        failureCount++;
        if (failureCount % 3 === 0) {
          throw new Error('Simulated scoring failure');
        }
        return originalScore(doc, context);
      };

      const selector = new AdaptiveDocumentSelector(config);

      // Should handle failures gracefully and still produce results
      const result = await selector.selectDocuments(testDocuments.slice(0, 10), constraints, {
        strategy: 'greedy',
        enableErrorRecovery: true
      });

      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.metadata.errors).toBeDefined();
    });
  });

  describe('Multi-Strategy Comparison', () => {
    it('should demonstrate differences between selection strategies', async () => {
      const constraints: SelectionConstraints = {
        maxCharacters: 2000,
        targetCharacterLimit: 2000,
        context: {
          targetTags: ['practical', 'beginner'],
          tagWeights: { practical: 1.2, beginner: 1.1 },
          selectedDocuments: [],
          maxCharacters: 2000,
          targetCharacterLimit: 2000
        }
      };

      const selector = new AdaptiveDocumentSelector(config);
      const qualityEvaluator = new QualityEvaluator(config);

      // Test different strategies
      const strategies = ['balanced', 'quality-focused', 'diverse'];
      const results = [];

      for (const strategy of strategies) {
        const result = await selector.selectDocuments(testDocuments, constraints, {
          strategy,
          enableOptimization: true
        });

        const quality = qualityEvaluator.evaluateQuality(result.selectedDocuments, constraints, result);

        results.push({
          strategy,
          selection: result,
          quality,
          documentCount: result.selectedDocuments.length,
          categories: new Set(result.selectedDocuments.map(d => d.document.category)).size,
          averagePriority: result.selectedDocuments.reduce((s, d) => s + d.priority.score, 0) / result.selectedDocuments.length
        });
      }

      // Verify strategy differences
      const balanced = results.find(r => r.strategy === 'balanced')!;
      const qualityFocused = results.find(r => r.strategy === 'quality-focused')!;
      const diverse = results.find(r => r.strategy === 'diverse')!;

      // Quality-focused should have higher average priority
      expect(qualityFocused.averagePriority).toBeGreaterThan(balanced.averagePriority);

      // Diverse should have more categories
      expect(diverse.categories).toBeGreaterThanOrEqual(balanced.categories);

      // All should achieve reasonable quality
      results.forEach(result => {
        expect(result.quality.overallScore).toBeGreaterThan(60);
      });
    });
  });

  describe('Scalability and Performance', () => {
    it('should maintain performance across different collection sizes', async () => {
      const sizes = [50, 200, 500];
      const constraints: SelectionConstraints = {
        maxCharacters: 3000,
        targetCharacterLimit: 3000,
        context: {
          targetTags: ['practical'],
          tagWeights: { practical: 1.0 },
          selectedDocuments: [],
          maxCharacters: 3000,
          targetCharacterLimit: 3000
        }
      };

      const selector = new AdaptiveDocumentSelector(config);
      const performanceResults = [];

      for (const size of sizes) {
        const docs = TestDataGenerator.generateDocuments(size);
        const startTime = Date.now();

        const result = await selector.selectDocuments(docs, constraints, {
          strategy: 'greedy' // Fastest algorithm
        });

        const processingTime = Date.now() - startTime;
        const timePerDocument = processingTime / size;

        performanceResults.push({ size, processingTime, timePerDocument });

        // Should maintain reasonable performance
        expect(timePerDocument).toBeLessThan(20); // Less than 20ms per document
        expect(result.selectedDocuments.length).toBeGreaterThan(0);
      }

      // Performance should scale reasonably
      const smallTime = performanceResults[0].timePerDocument;
      const largeTime = performanceResults[2].timePerDocument;
      expect(largeTime).toBeLessThan(smallTime * 3); // Should not degrade more than 3x
    });
  });

  describe('Configuration Impact', () => {
    it('should demonstrate impact of different configurations', async () => {
      const constraints: SelectionConstraints = {
        maxCharacters: 1500,
        targetCharacterLimit: 1500,
        context: {
          targetTags: ['beginner'],
          tagWeights: { beginner: 1.0 },
          selectedDocuments: [],
          maxCharacters: 1500,
          targetCharacterLimit: 1500
        }
      };

      // Test with minimal configuration
      const minimalConfig = await configManager.initializeConfig('minimal');
      const minimalSelector = new AdaptiveDocumentSelector(minimalConfig);
      const minimalResult = await minimalSelector.selectDocuments(testDocuments, constraints);

      // Test with extended configuration
      const extendedConfig = await configManager.initializeConfig('extended');
      const extendedSelector = new AdaptiveDocumentSelector(extendedConfig);
      const extendedResult = await extendedSelector.selectDocuments(testDocuments, constraints);

      // Extended configuration should provide more sophisticated selection
      expect(extendedResult.optimization.qualityScore).toBeGreaterThanOrEqual(minimalResult.optimization.qualityScore);
      expect(Object.keys(extendedResult.analysis.categoryCoverage).length).toBeGreaterThanOrEqual(
        Object.keys(minimalResult.analysis.categoryCoverage).length
      );
    });
  });
});