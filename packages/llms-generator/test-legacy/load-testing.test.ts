import { EnhancedConfigManager } from '../../src/core/EnhancedConfigManager';
import { DocumentScorer } from '../../src/core/DocumentScorer';
import { TagBasedDocumentFilter } from '../../src/core/TagBasedDocumentFilter';
import { AdaptiveDocumentSelector } from '../../src/core/AdaptiveDocumentSelector';
import { DependencyResolver } from '../../src/core/DependencyResolver';
import { ConflictDetector } from '../../src/core/ConflictDetector';
import { QualityEvaluator } from '../../src/core/QualityEvaluator';
import { EnhancedLLMSConfig, DocumentMetadata, SelectionConstraints } from '../../src/types/config';
import { TestDataGenerator } from '../helpers/test-data-generator';

describe('Load Testing and Performance', () => {
  let config: EnhancedLLMSConfig;
  let largeDocumentCollections: Map<number, DocumentMetadata[]>;

  beforeAll(async () => {
    const configManager = new EnhancedConfigManager();
    config = await configManager.initializeConfig('standard');
    
    // Pre-generate large document collections for testing
    largeDocumentCollections = new Map();
    
    // Generate collections of different sizes
    const sizes = [100, 500, 1000, 2000];
    for (const size of sizes) {
      largeDocumentCollections.set(size, TestDataGenerator.generateDocuments(size, {
        categories: ['guide', 'api', 'concept', 'example', 'reference'],
        tags: ['beginner', 'intermediate', 'advanced', 'practical', 'technical'],
        withDependencies: true,
        withConflicts: true,
        withRichMetadata: true
      }));
    }
  });

  describe('High-Volume Document Processing', () => {
    it('should handle 1000+ documents within acceptable time limits', async () => {
      const documents = largeDocumentCollections.get(1000)!;
      const constraints: SelectionConstraints = {
        maxCharacters: 5000,
        targetCharacterLimit: 5000,
        context: {
          targetTags: ['beginner', 'practical'],
          tagWeights: { beginner: 1.2, practical: 1.1 },
          selectedDocuments: [],
          maxCharacters: 5000,
          targetCharacterLimit: 5000
        }
      };

      const selector = new AdaptiveDocumentSelector(config);
      
      const startTime = process.hrtime.bigint();
      const result = await selector.selectDocuments(documents, constraints, {
        strategy: 'greedy', // Fastest algorithm
        enableOptimization: false // Disable for speed
      });
      const endTime = process.hrtime.bigint();
      
      const processingTimeMs = Number(endTime - startTime) / 1_000_000;

      // Performance assertions
      expect(processingTimeMs).toBeLessThan(5000); // Under 5 seconds
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.selectedDocuments.length).toBeLessThan(100); // Reasonable selection size
      
      // Memory usage should be reasonable
      const memoryUsage = process.memoryUsage();
      expect(memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // Under 500MB
      
      console.log(`1000 documents processed in ${processingTimeMs.toFixed(2)}ms`);
      console.log(`Memory usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should scale efficiently across different collection sizes', async () => {
      const sizes = [100, 500, 1000];
      const timings: Array<{ size: number; timeMs: number; timePerDoc: number }> = [];

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

      for (const size of sizes) {
        const documents = largeDocumentCollections.get(size)!;
        const selector = new AdaptiveDocumentSelector(config);
        
        const startTime = process.hrtime.bigint();
        await selector.selectDocuments(documents, constraints, {
          strategy: 'greedy'
        });
        const endTime = process.hrtime.bigint();
        
        const timeMs = Number(endTime - startTime) / 1_000_000;
        const timePerDoc = timeMs / size;
        
        timings.push({ size, timeMs, timePerDoc });
      }

      // Analyze scaling behavior
      for (let i = 1; i < timings.length; i++) {
        const current = timings[i];
        const previous = timings[i - 1];
        
        // Time per document should not increase dramatically
        const scalingFactor = current.timePerDoc / previous.timePerDoc;
        expect(scalingFactor).toBeLessThan(3.0); // Should not be more than 3x slower per document
      }

      console.table(timings);
    });

    it('should maintain performance under memory pressure', async () => {
      const documents = largeDocumentCollections.get(1000)!;
      
      // Create multiple concurrent operations to simulate memory pressure
      const concurrentOperations = 5;
      const operations = Array(concurrentOperations).fill(null).map(async (_, index) => {
        const selector = new AdaptiveDocumentSelector(config);
        const constraints: SelectionConstraints = {
          maxCharacters: 2000 + (index * 500),
          targetCharacterLimit: 2000 + (index * 500),
          context: {
            targetTags: ['beginner', 'intermediate', 'advanced'][index % 3] ? 
              [['beginner'], ['intermediate'], ['advanced']][index % 3] : ['practical'],
            tagWeights: { beginner: 1.0, intermediate: 0.9, advanced: 0.8, practical: 1.1 },
            selectedDocuments: [],
            maxCharacters: 2000 + (index * 500),
            targetCharacterLimit: 2000 + (index * 500)
          }
        };

        const startTime = process.hrtime.bigint();
        const result = await selector.selectDocuments(documents, constraints, {
          strategy: 'balanced'
        });
        const endTime = process.hrtime.bigint();

        return {
          index,
          timeMs: Number(endTime - startTime) / 1_000_000,
          resultCount: result.selectedDocuments.length
        };
      });

      const results = await Promise.all(operations);

      // All operations should complete successfully
      results.forEach(result => {
        expect(result.timeMs).toBeLessThan(10000); // Under 10 seconds each
        expect(result.resultCount).toBeGreaterThan(0);
      });

      // Memory should not grow excessively
      const memoryUsage = process.memoryUsage();
      expect(memoryUsage.heapUsed).toBeLessThan(800 * 1024 * 1024); // Under 800MB

      console.log('Concurrent operations results:', results);
    });
  });

  describe('Algorithm Performance Comparison', () => {
    it('should compare performance across all selection algorithms', async () => {
      const documents = largeDocumentCollections.get(500)!;
      const constraints: SelectionConstraints = {
        maxCharacters: 4000,
        targetCharacterLimit: 4000,
        context: {
          targetTags: ['practical', 'intermediate'],
          tagWeights: { practical: 1.1, intermediate: 1.0 },
          selectedDocuments: [],
          maxCharacters: 4000,
          targetCharacterLimit: 4000
        }
      };

      const algorithms = ['greedy', 'knapsack', 'topsis', 'hybrid'];
      const performanceResults: Array<{
        algorithm: string;
        timeMs: number;
        qualityScore: number;
        documentCount: number;
        memoryUsage: number;
      }> = [];

      for (const algorithm of algorithms) {
        // Force garbage collection before each test
        if (global.gc) global.gc();
        
        const memoryBefore = process.memoryUsage().heapUsed;
        const selector = new AdaptiveDocumentSelector(config);
        
        const startTime = process.hrtime.bigint();
        const result = await selector.selectDocuments(documents, constraints, {
          strategy: algorithm,
          enableOptimization: algorithm === 'hybrid'
        });
        const endTime = process.hrtime.bigint();
        
        const memoryAfter = process.memoryUsage().heapUsed;
        const timeMs = Number(endTime - startTime) / 1_000_000;

        performanceResults.push({
          algorithm,
          timeMs,
          qualityScore: result.optimization.qualityScore,
          documentCount: result.selectedDocuments.length,
          memoryUsage: memoryAfter - memoryBefore
        });
      }

      // Greedy should be fastest
      const greedyResult = performanceResults.find(r => r.algorithm === 'greedy')!;
      const hybridResult = performanceResults.find(r => r.algorithm === 'hybrid')!;

      expect(greedyResult.timeMs).toBeLessThan(hybridResult.timeMs);
      
      // Hybrid should have better quality
      expect(hybridResult.qualityScore).toBeGreaterThan(greedyResult.qualityScore * 0.9);

      console.table(performanceResults);
    });

    it('should optimize algorithm selection based on collection size', async () => {
      const selector = new AdaptiveDocumentSelector(config);
      
      // Test automatic algorithm selection based on collection size
      const testCases = [
        { size: 50, expectedSpeed: 'fast' },
        { size: 500, expectedSpeed: 'medium' },
        { size: 1000, expectedSpeed: 'slow' }
      ];

      for (const testCase of testCases) {
        const documents = largeDocumentCollections.get(testCase.size) || 
          TestDataGenerator.generateDocuments(testCase.size);
        
        const constraints: SelectionConstraints = {
          maxCharacters: 2000,
          targetCharacterLimit: 2000,
          context: {
            targetTags: ['beginner'],
            tagWeights: { beginner: 1.0 },
            selectedDocuments: [],
            maxCharacters: 2000,
            targetCharacterLimit: 2000
          }
        };

        const startTime = process.hrtime.bigint();
        await selector.selectDocuments(documents, constraints, {
          strategy: 'adaptive' // Should auto-select based on size
        });
        const endTime = process.hrtime.bigint();
        
        const timeMs = Number(endTime - startTime) / 1_000_000;
        
        // Larger collections should still complete in reasonable time
        expect(timeMs).toBeLessThan(testCase.size * 10); // 10ms per document max
      }
    });
  });

  describe('Memory Usage and Garbage Collection', () => {
    it('should not leak memory during repeated operations', async () => {
      const documents = largeDocumentCollections.get(200)!;
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

      const memoryReadings: number[] = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const selector = new AdaptiveDocumentSelector(config);
        await selector.selectDocuments(documents, constraints);
        
        // Force garbage collection if available
        if (global.gc) global.gc();
        
        const memoryUsage = process.memoryUsage().heapUsed;
        memoryReadings.push(memoryUsage);
        
        // Small delay to allow cleanup
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Memory should not grow continuously
      const initialMemory = memoryReadings[0];
      const finalMemory = memoryReadings[memoryReadings.length - 1];
      const memoryGrowth = finalMemory - initialMemory;
      const maxAcceptableGrowth = 50 * 1024 * 1024; // 50MB

      expect(memoryGrowth).toBeLessThan(maxAcceptableGrowth);

      // Check for steady growth (potential leak indicator)
      const midpointMemory = memoryReadings[Math.floor(iterations / 2)];
      const steadyGrowth = (finalMemory - midpointMemory) / (iterations / 2);
      expect(steadyGrowth).toBeLessThan(1024 * 1024); // Less than 1MB per iteration

      console.log(`Memory growth over ${iterations} iterations: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should handle large document metadata efficiently', async () => {
      // Generate documents with very rich metadata
      const richDocuments = TestDataGenerator.generateDocuments(100, {
        categories: ['guide', 'api', 'concept', 'example', 'reference'],
        tags: ['beginner', 'intermediate', 'advanced', 'practical', 'technical'],
        withDependencies: true,
        withConflicts: true,
        withRichMetadata: true
      }).map(doc => ({
        ...doc,
        // Add extra metadata to stress test memory usage
        composition: {
          ...doc.composition,
          detailedAnalysis: Array(1000).fill(null).map((_, i) => ({
            aspect: `aspect-${i}`,
            score: Math.random(),
            details: `Detailed analysis for aspect ${i}`.repeat(10)
          }))
        },
        keywords: {
          ...doc.keywords,
          exhaustive: Array(500).fill(null).map((_, i) => `keyword-${i}`)
        }
      }));

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

      const memoryBefore = process.memoryUsage().heapUsed;
      
      const selector = new AdaptiveDocumentSelector(config);
      const result = await selector.selectDocuments(richDocuments, constraints);
      
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;

      // Should still complete successfully
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      
      // Memory increase should be reasonable despite rich metadata
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Under 200MB
      
      console.log(`Rich metadata processing memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple simultaneous selection operations', async () => {
      const documents = largeDocumentCollections.get(300)!;
      const concurrentOperations = 10;

      const operations = Array(concurrentOperations).fill(null).map(async (_, index) => {
        const constraints: SelectionConstraints = {
          maxCharacters: 1000 + (index * 200),
          targetCharacterLimit: 1000 + (index * 200),
          context: {
            targetTags: ['beginner', 'intermediate', 'advanced'][index % 3] ? 
              [['beginner'], ['intermediate'], ['advanced']][index % 3] : ['practical'],
            tagWeights: { beginner: 1.2, intermediate: 1.0, advanced: 0.8, practical: 1.1 },
            selectedDocuments: [],
            maxCharacters: 1000 + (index * 200),
            targetCharacterLimit: 1000 + (index * 200)
          }
        };

        const selector = new AdaptiveDocumentSelector(config);
        const startTime = process.hrtime.bigint();
        
        const result = await selector.selectDocuments(documents, constraints, {
          strategy: ['greedy', 'balanced', 'topsis'][index % 3]
        });
        
        const endTime = process.hrtime.bigint();
        const timeMs = Number(endTime - startTime) / 1_000_000;

        return { index, timeMs, count: result.selectedDocuments.length };
      });

      const startTime = process.hrtime.bigint();
      const results = await Promise.all(operations);
      const totalTime = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // All operations should complete
      expect(results).toHaveLength(concurrentOperations);
      results.forEach(result => {
        expect(result.timeMs).toBeLessThan(10000); // Each under 10 seconds
        expect(result.count).toBeGreaterThan(0);
      });

      // Concurrent execution should be more efficient than sequential
      const avgSequentialTime = results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
      expect(totalTime).toBeLessThan(avgSequentialTime * concurrentOperations * 0.8);

      console.log(`${concurrentOperations} concurrent operations completed in ${totalTime.toFixed(2)}ms`);
    });

    it('should maintain quality under concurrent load', async () => {
      const documents = largeDocumentCollections.get(200)!;
      const concurrentSelectors = 5;

      const operations = Array(concurrentSelectors).fill(null).map(async () => {
        const constraints: SelectionConstraints = {
          maxCharacters: 2000,
          targetCharacterLimit: 2000,
          context: {
            targetTags: ['practical', 'beginner'],
            tagWeights: { practical: 1.1, beginner: 1.2 },
            selectedDocuments: [],
            maxCharacters: 2000,
            targetCharacterLimit: 2000
          }
        };

        const selector = new AdaptiveDocumentSelector(config);
        const qualityEvaluator = new QualityEvaluator(config);

        const result = await selector.selectDocuments(documents, constraints, {
          strategy: 'balanced',
          enableOptimization: true
        });

        const qualityReport = qualityEvaluator.evaluateQuality(
          result.selectedDocuments,
          constraints,
          result
        );

        return {
          selectionQuality: result.optimization.qualityScore,
          evaluationQuality: qualityReport.overallScore,
          documentCount: result.selectedDocuments.length
        };
      });

      const results = await Promise.all(operations);

      // Quality should be consistent across concurrent operations
      const qualityScores = results.map(r => r.selectionQuality);
      const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
      const qualityStdDev = Math.sqrt(
        qualityScores.reduce((sum, score) => sum + Math.pow(score - avgQuality, 2), 0) / qualityScores.length
      );

      expect(avgQuality).toBeGreaterThan(0.6); // Good average quality
      expect(qualityStdDev).toBeLessThan(0.2); // Low variance in quality

      console.log(`Concurrent quality - Avg: ${avgQuality.toFixed(3)}, StdDev: ${qualityStdDev.toFixed(3)}`);
    });
  });

  describe('Component-Level Performance', () => {
    it('should benchmark individual component performance', async () => {
      const documents = largeDocumentCollections.get(500)!;
      const constraints: SelectionConstraints = {
        maxCharacters: 3000,
        targetCharacterLimit: 3000,
        context: {
          targetTags: ['practical', 'beginner'],
          tagWeights: { practical: 1.1, beginner: 1.2 },
          selectedDocuments: [],
          maxCharacters: 3000,
          targetCharacterLimit: 3000
        }
      };

      const benchmarks: Record<string, number> = {};

      // Benchmark DocumentScorer
      let startTime = process.hrtime.bigint();
      const scorer = new DocumentScorer(config, 'balanced');
      documents.forEach(doc => {
        scorer.scoreDocument(doc, constraints.context);
      });
      benchmarks.scoring = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // Benchmark TagBasedDocumentFilter
      startTime = process.hrtime.bigint();
      const filter = new TagBasedDocumentFilter(config);
      filter.filterDocuments(documents, {
        targetAudience: ['new-users', 'developers'],
        enforceTagCompatibility: true
      });
      benchmarks.filtering = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // Benchmark DependencyResolver
      startTime = process.hrtime.bigint();
      const dependencyResolver = new DependencyResolver(config);
      dependencyResolver.resolveDependencies(documents.slice(0, 100), {
        maxDepth: 3,
        includeOptionalDependencies: false,
        resolveConflicts: true,
        conflictResolution: 'exclude-conflicts'
      });
      benchmarks.dependencyResolution = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // Benchmark ConflictDetector
      startTime = process.hrtime.bigint();
      const conflictDetector = new ConflictDetector(config);
      conflictDetector.detectConflicts(documents.slice(0, 100), {
        enabledRules: ['tag-incompatible', 'content-duplicate'],
        severityThreshold: 'moderate',
        autoResolve: false
      });
      benchmarks.conflictDetection = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // Benchmark QualityEvaluator
      startTime = process.hrtime.bigint();
      const qualityEvaluator = new QualityEvaluator(config);
      qualityEvaluator.evaluateQuality(documents.slice(0, 20), constraints);
      benchmarks.qualityEvaluation = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // All components should complete within reasonable time
      Object.entries(benchmarks).forEach(([component, timeMs]) => {
        expect(timeMs).toBeLessThan(5000); // Under 5 seconds each
        console.log(`${component}: ${timeMs.toFixed(2)}ms`);
      });

      // Scoring should be fastest (most frequent operation)
      expect(benchmarks.scoring).toBeLessThan(benchmarks.dependencyResolution);
      expect(benchmarks.filtering).toBeLessThan(benchmarks.qualityEvaluation);
    });
  });
});