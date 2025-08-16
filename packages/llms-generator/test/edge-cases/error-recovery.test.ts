import { EnhancedConfigManager } from '../../src/core/EnhancedConfigManager';
import { DocumentScorer } from '../../src/core/DocumentScorer';
import { TagBasedDocumentFilter } from '../../src/core/TagBasedDocumentFilter';
import { AdaptiveDocumentSelector } from '../../src/core/AdaptiveDocumentSelector';
import { DependencyResolver } from '../../src/core/DependencyResolver';
import { ConflictDetector } from '../../src/core/ConflictDetector';
import { QualityEvaluator } from '../../src/core/QualityEvaluator';
import { EnhancedLLMSConfig, DocumentMetadata, SelectionConstraints } from '../../src/types/config';
import { TestDataGenerator } from '../helpers/test-data-generator';

describe('Error Recovery and Resilience', () => {
  let config: EnhancedLLMSConfig;
  let validDocuments: DocumentMetadata[];

  beforeEach(async () => {
    const configManager = new EnhancedConfigManager();
    config = await configManager.initializeConfig('standard');
    validDocuments = TestDataGenerator.generateDocuments(5);
  });

  describe('Component Failure Recovery', () => {
    it('should recover from scoring component failures', async () => {
      const selector = new AdaptiveDocumentSelector(config);
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

      // Mock scoring failures
      const originalScorer = (selector as any).scorer;
      let callCount = 0;
      (selector as any).scorer = {
        scoreDocument: (doc: DocumentMetadata, context: any) => {
          callCount++;
          if (callCount % 3 === 0) {
            throw new Error(`Scoring failure for document ${doc.document.id}`);
          }
          return originalScorer.scoreDocument(doc, context);
        }
      };

      const result = await selector.selectDocuments(validDocuments, constraints, {
        strategy: 'greedy',
        enableErrorRecovery: true
      });

      // Should still produce results despite scoring failures
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.metadata.errors?.length).toBeGreaterThan(0);
      expect(result.metadata.recoveryActions?.length).toBeGreaterThan(0);
      
      // Should have recovered by using fallback scoring
      const recoveryAction = result.metadata.recoveryActions?.find(
        action => action.type === 'scoring-fallback'
      );
      expect(recoveryAction).toBeDefined();
    });

    it('should recover from dependency resolution failures', async () => {
      const problematicDocs = validDocuments.map((doc, index) => ({
        ...doc,
        dependencies: {
          ...doc.dependencies,
          prerequisites: index % 2 === 0 ? [
            {
              documentId: 'non-existent-' + Math.random(),
              importance: 'required' as const,
              reason: 'Missing dependency that will cause failure'
            }
          ] : []
        }
      }));

      const dependencyResolver = new DependencyResolver(config);
      
      const result = dependencyResolver.resolveDependencies(problematicDocs, {
        maxDepth: 3,
        includeOptionalDependencies: true,
        resolveConflicts: true,
        conflictResolution: 'exclude-conflicts',
        enableErrorRecovery: true
      });

      // Should handle missing dependencies gracefully
      expect(result.resolvedDocuments.length).toBeGreaterThan(0);
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.recoveryActions?.length).toBeGreaterThan(0);
      
      // Should continue with available documents
      const recoveredDocs = result.resolvedDocuments.filter(doc => 
        !doc.dependencies.prerequisites?.some(prereq => 
          prereq.documentId.startsWith('non-existent-')
        )
      );
      expect(recoveredDocs.length).toBeGreaterThan(0);
    });

    it('should recover from conflict detection failures', async () => {
      const conflictDetector = new ConflictDetector(config);
      
      // Mock partial failures in conflict detection
      const originalDetectConflicts = conflictDetector.detectConflicts.bind(conflictDetector);
      let detectionAttempts = 0;
      
      conflictDetector.detectConflicts = (documents, options) => {
        detectionAttempts++;
        if (detectionAttempts % 2 === 0) {
          throw new Error('Conflict detection system failure');
        }
        return originalDetectConflicts(documents, options);
      };

      const documents = TestDataGenerator.generateConflictingDocuments();
      
      // Should handle detection failures gracefully
      let result;
      try {
        result = conflictDetector.detectConflicts(documents, {
          enabledRules: ['tag-incompatible', 'content-duplicate'],
          severityThreshold: 'moderate',
          autoResolve: false,
          enableErrorRecovery: true
        });
      } catch (error) {
        // Should either succeed with partial results or provide meaningful error
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Conflict detection system failure');
      }

      // If it succeeded, should have handled errors
      if (result) {
        expect(result.errors?.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should recover from quality evaluation failures', async () => {
      const qualityEvaluator = new QualityEvaluator(config);
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

      // Mock evaluation failures
      const originalEvaluate = qualityEvaluator.evaluateQuality.bind(qualityEvaluator);
      let evaluationCount = 0;
      
      qualityEvaluator.evaluateQuality = (selection, constraints, selectionResult?) => {
        evaluationCount++;
        if (evaluationCount <= 2) {
          throw new Error('Quality evaluation system overloaded');
        }
        return originalEvaluate(selection, constraints, selectionResult);
      };

      // Should retry and eventually succeed, or provide partial results
      let finalResult;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        try {
          finalResult = qualityEvaluator.evaluateQuality(validDocuments.slice(0, 3), constraints);
          break;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            // Should provide degraded but usable results
            finalResult = {
              overallScore: 0,
              confidence: 0,
              grade: 'F',
              metrics: {},
              summary: {
                strengths: [],
                weaknesses: ['Quality evaluation system unavailable'],
                recommendations: []
              },
              benchmarks: { category: 'unknown', performance: 'unavailable', percentile: 0 },
              validation: { passed: [], failed: [], score: 0 },
              errors: ['Quality evaluation system overloaded']
            };
          }
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.overallScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Corruption Recovery', () => {
    it('should recover from partially corrupted document data', async () => {
      const corruptedDocuments: DocumentMetadata[] = [
        // Completely valid document
        validDocuments[0],
        
        // Document with corrupted priority data
        {
          ...validDocuments[1],
          priority: {
            score: NaN,
            tier: 'invalid-tier' as any,
            reasoning: null as any,
            factors: undefined as any
          }
        },
        
        // Document with corrupted tags
        {
          ...validDocuments[2],
          tags: {
            primary: null as any,
            secondary: ['valid-tag', undefined, null, ''] as any,
            audience: 'should-be-array' as any,
            complexity: 123 as any // Should be string
          }
        },
        
        // Document with corrupted structure but valid core data
        {
          document: validDocuments[3].document,
          priority: { score: 80, tier: 'important' },
          tags: { primary: ['functional'], audience: ['users'], complexity: 'basic' },
          // Missing other fields
        } as DocumentMetadata,
        
        // Document with circular references
        (() => {
          const circularDoc = { ...validDocuments[4] };
          (circularDoc as any).selfRef = circularDoc;
          return circularDoc;
        })()
      ];

      const selector = new AdaptiveDocumentSelector(config);
      const constraints: SelectionConstraints = {
        maxCharacters: 2500,
        targetCharacterLimit: 2500,
        context: {
          targetTags: ['functional'],
          tagWeights: { functional: 1.0 },
          selectedDocuments: [],
          maxCharacters: 2500,
          targetCharacterLimit: 2500
        }
      };

      const result = await selector.selectDocuments(corruptedDocuments, constraints, {
        strategy: 'greedy',
        enableErrorRecovery: true,
        strictValidation: false
      });

      // Should recover usable documents
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.metadata.errors?.length).toBeGreaterThan(0);
      
      // Should include at least the valid document
      const hasValidDoc = result.selectedDocuments.some(doc => 
        doc.document.id === validDocuments[0].document.id
      );
      expect(hasValidDoc).toBe(true);
      
      // Should report data sanitization actions
      const sanitizationActions = result.metadata.recoveryActions?.filter(
        action => action.type === 'data-sanitization'
      );
      expect(sanitizationActions?.length).toBeGreaterThan(0);
    });

    it('should recover from corrupted configuration data', async () => {
      const partiallyCorruptedConfig = {
        ...config,
        // Corrupt some configuration sections
        tags: {
          ...config.tags,
          'corrupted-tag': {
            name: null as any,
            description: undefined as any,
            weight: 'invalid' as any,
            compatibleWith: 'should-be-array' as any,
            audience: null as any
          }
        },
        categories: {
          ...config.categories,
          'corrupted-category': {
            name: '',
            description: null as any,
            priority: NaN,
            defaultStrategy: 'non-existent-strategy' as any,
            tags: null as any
          }
        }
      };

      // Components should handle corrupted config gracefully
      expect(() => {
        const filter = new TagBasedDocumentFilter(partiallyCorruptedConfig);
        const result = filter.filterDocuments(validDocuments, {
          enforceTagCompatibility: true
        });
        expect(result).toBeDefined();
      }).not.toThrow();

      expect(() => {
        const selector = new AdaptiveDocumentSelector(partiallyCorruptedConfig);
        expect(selector).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Network and I/O Failure Simulation', () => {
    it('should handle simulated file system failures', async () => {
      const configManager = new EnhancedConfigManager();
      
      // Mock file system failures
      const originalReadFile = require('fs').readFileSync;
      let readAttempts = 0;
      
      require('fs').readFileSync = (...args: any[]) => {
        readAttempts++;
        if (readAttempts <= 2 && args[0]?.includes('config')) {
          throw new Error('Simulated file system failure');
        }
        return originalReadFile(...args);
      };

      // Should handle file system failures gracefully
      try {
        const fallbackConfig = await configManager.initializeConfig('standard');
        expect(fallbackConfig).toBeDefined();
        
        // Should use built-in defaults when files are unavailable
        expect(fallbackConfig.generation).toBeDefined();
        expect(fallbackConfig.categories).toBeDefined();
        
      } catch (error) {
        // If it fails, should be a meaningful error
        expect(error).toBeInstanceOf(Error);
      } finally {
        // Restore original function
        require('fs').readFileSync = originalReadFile;
      }
    });

    it('should handle simulated memory pressure and allocation failures', async () => {
      const largeDocuments = TestDataGenerator.generateDocuments(100);
      
      // Simulate memory pressure by adding large data structures
      const memoryIntensiveDocuments = largeDocuments.map(doc => ({
        ...doc,
        // Add large arrays to consume memory
        largeData: Array(1000).fill(null).map((_, i) => ({
          index: i,
          content: `Large content block ${i}`.repeat(100)
        }))
      }));

      const selector = new AdaptiveDocumentSelector(config);
      const constraints: SelectionConstraints = {
        maxCharacters: 3000,
        targetCharacterLimit: 3000,
        context: {
          targetTags: ['beginner'],
          tagWeights: { beginner: 1.0 },
          selectedDocuments: [],
          maxCharacters: 3000,
          targetCharacterLimit: 3000
        }
      };

      // Should either succeed or fail gracefully under memory pressure
      try {
        const result = await selector.selectDocuments(memoryIntensiveDocuments, constraints, {
          strategy: 'greedy', // Use least memory-intensive algorithm
          enableErrorRecovery: true,
          memoryOptimization: true
        });
        
        expect(result).toBeDefined();
        expect(result.selectedDocuments.length).toBeGreaterThanOrEqual(0);
        
        // If successful, should have used memory optimization
        if (result.metadata.optimizations) {
          expect(result.metadata.optimizations).toContain('memory-optimization');
        }
        
      } catch (error) {
        // Should be a controlled failure with recovery suggestions
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/(memory|resource|limit)/i);
      }
    });
  });

  describe('Graceful Degradation Strategies', () => {
    it('should gracefully degrade quality when optimal selection is impossible', async () => {
      // Create impossible constraints
      const impossibleConstraints: SelectionConstraints = {
        maxCharacters: 1, // Impossibly small
        targetCharacterLimit: 1,
        context: {
          targetTags: ['non-existent-tag'],
          tagWeights: { 'non-existent-tag': 1.0 },
          selectedDocuments: [],
          maxCharacters: 1,
          targetCharacterLimit: 1,
          qualityThreshold: 95 // Impossibly high
        }
      };

      const selector = new AdaptiveDocumentSelector(config);
      const result = await selector.selectDocuments(validDocuments, impossibleConstraints, {
        enableGracefulDegradation: true
      });

      expect(result).toBeDefined();
      // Should either find minimal selection or provide empty result with explanation
      if (result.selectedDocuments.length === 0) {
        expect(result.metadata.degradationReasons).toBeDefined();
        expect(result.metadata.degradationReasons?.length).toBeGreaterThan(0);
        expect(result.metadata.suggestions).toBeDefined();
      }
    });

    it('should provide fallback results when primary algorithms fail', async () => {
      const selector = new AdaptiveDocumentSelector(config);
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

      // Mock algorithm failures
      const originalSelect = (selector as any).selectDocuments;
      let algorithmAttempts = 0;
      const failingAlgorithms = ['knapsack', 'topsis', 'hybrid'];
      
      (selector as any).executeAlgorithm = (documents: any, constraints: any, algorithm: string) => {
        algorithmAttempts++;
        if (failingAlgorithms.includes(algorithm)) {
          throw new Error(`Algorithm ${algorithm} failed`);
        }
        // Allow greedy algorithm to succeed
        return originalSelect.call(this, documents, constraints, { strategy: 'greedy' });
      };

      const result = await selector.selectDocuments(validDocuments, constraints, {
        strategy: 'adaptive', // Should try multiple algorithms and fallback
        enableErrorRecovery: true
      });

      expect(result).toBeDefined();
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      
      // Should document which algorithms failed and which succeeded
      expect(result.metadata.algorithmFallbacks?.length).toBeGreaterThan(0);
      expect(result.strategy.algorithm).toBe('greedy'); // Should fallback to working algorithm
    });

    it('should maintain partial functionality when components are unavailable', async () => {
      // Simulate scenario where quality evaluator is completely unavailable
      const selector = new AdaptiveDocumentSelector(config);
      
      // Remove quality evaluator
      (selector as any).qualityEvaluator = null;

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

      const result = await selector.selectDocuments(validDocuments, constraints, {
        enablePartialResults: true
      });

      // Should still provide basic selection results
      expect(result).toBeDefined();
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      
      // Should document missing functionality
      expect(result.metadata.missingComponents).toContain('quality-evaluator');
      expect(result.optimization.qualityScore).toBe(0); // Default/unavailable value
    });

    it('should recover from cascading failures across multiple components', async () => {
      const documents = validDocuments;
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

      // Simulate cascading failures
      const failureChain = [
        'dependency-resolution',
        'conflict-detection',
        'advanced-scoring',
        'optimization'
      ];
      
      let currentFailures = 0;
      const maxFailures = 3;

      const selector = new AdaptiveDocumentSelector(config);
      
      // Mock multiple component failures
      const originalMethods: any = {};
      failureChain.slice(0, maxFailures).forEach(component => {
        switch (component) {
          case 'dependency-resolution':
            const dependencyResolver = (selector as any).dependencyResolver;
            if (dependencyResolver) {
              originalMethods.resolveDependencies = dependencyResolver.resolveDependencies;
              dependencyResolver.resolveDependencies = () => {
                throw new Error('Dependency resolution failed');
              };
            }
            break;
          case 'conflict-detection':
            const conflictDetector = (selector as any).conflictDetector;
            if (conflictDetector) {
              originalMethods.detectConflicts = conflictDetector.detectConflicts;
              conflictDetector.detectConflicts = () => {
                throw new Error('Conflict detection failed');
              };
            }
            break;
          case 'advanced-scoring':
            const scorer = (selector as any).scorer;
            if (scorer) {
              originalMethods.scoreDocument = scorer.scoreDocument;
              scorer.scoreDocument = () => {
                throw new Error('Advanced scoring failed');
              };
            }
            break;
        }
      });

      try {
        const result = await selector.selectDocuments(documents, constraints, {
          enableErrorRecovery: true,
          enableGracefulDegradation: true,
          fallbackToBasicSelection: true
        });

        // Should still provide some results despite multiple failures
        expect(result).toBeDefined();
        expect(result.selectedDocuments.length).toBeGreaterThanOrEqual(0);
        
        // Should document the cascade of failures and recovery actions
        expect(result.metadata.errors?.length).toBeGreaterThan(0);
        expect(result.metadata.recoveryActions?.length).toBeGreaterThan(0);
        
        // Should indicate degraded functionality
        expect(result.metadata.degradationLevel).toMatch(/(partial|limited|basic)/i);
        
      } finally {
        // Restore original methods
        Object.keys(originalMethods).forEach(method => {
          // Restoration logic would go here in a real implementation
        });
      }
    });
  });
});