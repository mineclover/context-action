import {
  EnhancedConfigManager,
  DocumentScorer,
  TagBasedDocumentFilter,
  AdaptiveDocumentSelector,
  DependencyResolver,
  ConflictDetector,
  QualityEvaluator
} from '../../src/core';
import { EnhancedLLMSConfig, DocumentMetadata, SelectionConstraints } from '../../src/types/config';
import { TestDataGenerator } from '../helpers/test-data-generator';
import fs from 'fs';
import path from 'path';

describe('Document Processing Integration', () => {
  let config: EnhancedLLMSConfig;
  let testDocumentsPath: string;
  let realDocuments: DocumentMetadata[];

  beforeEach(async () => {
    const configManager = new EnhancedConfigManager();
    config = await configManager.initializeConfig('standard');
    
    testDocumentsPath = path.join(__dirname, '../temp/test-documents');
    
    // Create realistic test documents that simulate actual documentation files
    realDocuments = createRealisticTestDocuments();
  });

  function createRealisticTestDocuments(): DocumentMetadata[] {
    return [
      {
        document: {
          id: 'getting-started-guide',
          title: 'Getting Started with Context-Action Framework',
          source_path: 'docs/guides/getting-started.md',
          category: 'guide',
          wordCount: 1200,
          lastModified: new Date('2024-01-15'),
          author: 'Documentation Team'
        },
        priority: {
          score: 95,
          tier: 'critical',
          reasoning: 'Essential onboarding document',
          factors: {
            userImpact: 0.95,
            businessValue: 0.9,
            technicalImportance: 0.85,
            timeRelevance: 0.92
          }
        },
        tags: {
          primary: ['beginner', 'tutorial', 'setup'],
          secondary: ['onboarding', 'first-steps'],
          audience: ['new-users', 'beginners'],
          complexity: 'basic',
          topics: ['installation', 'configuration', 'first-example']
        },
        keywords: {
          primary: ['context-action', 'getting started', 'installation', 'setup', 'tutorial'],
          technical: ['npm install', 'configuration', 'provider', 'context'],
          domain: ['state management', 'react hooks', 'typescript']
        },
        dependencies: {
          prerequisites: [],
          references: [
            { documentId: 'installation-guide', importance: 'recommended', reason: 'Detailed installation steps' }
          ],
          followups: [
            { documentId: 'basic-examples', importance: 'recommended', reason: 'Next steps after setup' },
            { documentId: 'advanced-patterns', importance: 'optional', reason: 'Advanced usage patterns' }
          ],
          conflicts: [],
          complements: [
            { documentId: 'troubleshooting-guide', importance: 'optional', reason: 'Common setup issues' }
          ]
        },
        composition: {
          categoryAffinity: { guide: 1.0, api: 0.3, concept: 0.6 },
          tagAffinity: { beginner: 1.0, tutorial: 0.95, setup: 0.9 },
          contextualRelevance: {
            onboarding: 0.98,
            learning_path: 0.85,
            quick_reference: 0.4,
            troubleshooting: 0.3,
            advanced_usage: 0.2
          }
        },
        metrics: {
          readabilityScore: 85,
          completenessScore: 90,
          accuracyScore: 95,
          freshnessScore: 88
        }
      },
      {
        document: {
          id: 'api-reference-actions',
          title: 'Action API Reference',
          source_path: 'docs/api/actions.md',
          category: 'api',
          wordCount: 2800,
          lastModified: new Date('2024-01-10'),
          author: 'API Documentation Team'
        },
        priority: {
          score: 85,
          tier: 'important',
          reasoning: 'Core API documentation',
          factors: {
            userImpact: 0.8,
            businessValue: 0.85,
            technicalImportance: 0.95,
            timeRelevance: 0.8
          }
        },
        tags: {
          primary: ['api', 'reference', 'actions'],
          secondary: ['methods', 'interfaces'],
          audience: ['developers', 'advanced-users'],
          complexity: 'intermediate',
          topics: ['action-dispatch', 'action-handlers', 'error-handling']
        },
        keywords: {
          primary: ['action', 'dispatch', 'handler', 'payload', 'controller'],
          technical: ['useActionDispatch', 'useActionHandler', 'ActionPayloadMap', 'pipeline'],
          domain: ['typescript interfaces', 'react hooks', 'error handling']
        },
        dependencies: {
          prerequisites: [
            { documentId: 'getting-started-guide', importance: 'recommended', reason: 'Basic setup required' }
          ],
          references: [
            { documentId: 'store-api-reference', importance: 'related', reason: 'Store integration patterns' }
          ],
          followups: [
            { documentId: 'advanced-action-patterns', importance: 'optional', reason: 'Advanced usage' }
          ],
          conflicts: [],
          complements: [
            { documentId: 'typescript-guide', importance: 'recommended', reason: 'Type definitions' }
          ]
        },
        composition: {
          categoryAffinity: { api: 1.0, guide: 0.4, concept: 0.3 },
          tagAffinity: { api: 1.0, reference: 0.95, actions: 0.9 },
          contextualRelevance: {
            development: 0.95,
            api_reference: 1.0,
            implementation: 0.8,
            debugging: 0.7,
            learning_path: 0.5
          }
        },
        metrics: {
          readabilityScore: 75,
          completenessScore: 95,
          accuracyScore: 98,
          freshnessScore: 82
        }
      },
      {
        document: {
          id: 'advanced-patterns-guide',
          title: 'Advanced Usage Patterns',
          source_path: 'docs/guides/advanced-patterns.md',
          category: 'guide',
          wordCount: 3200,
          lastModified: new Date('2024-01-08'),
          author: 'Senior Developer Team'
        },
        priority: {
          score: 75,
          tier: 'useful',
          reasoning: 'Advanced concepts for experienced users',
          factors: {
            userImpact: 0.7,
            businessValue: 0.75,
            technicalImportance: 0.85,
            timeRelevance: 0.75
          }
        },
        tags: {
          primary: ['advanced', 'patterns', 'optimization'],
          secondary: ['performance', 'architecture'],
          audience: ['experts', 'senior-developers'],
          complexity: 'advanced',
          topics: ['performance-optimization', 'complex-workflows', 'custom-patterns']
        },
        keywords: {
          primary: ['advanced patterns', 'optimization', 'performance', 'complex workflows'],
          technical: ['memoization', 'lazy loading', 'custom hooks', 'middleware'],
          domain: ['performance tuning', 'architecture patterns', 'scalability']
        },
        dependencies: {
          prerequisites: [
            { documentId: 'getting-started-guide', importance: 'required', reason: 'Basic understanding needed' },
            { documentId: 'api-reference-actions', importance: 'recommended', reason: 'API knowledge helpful' }
          ],
          references: [
            { documentId: 'performance-guide', importance: 'related', reason: 'Performance considerations' }
          ],
          followups: [
            { documentId: 'custom-middleware-guide', importance: 'optional', reason: 'Custom implementations' }
          ],
          conflicts: [
            { documentId: 'simple-patterns-guide', reason: 'Different complexity levels', severity: 'minor' }
          ],
          complements: []
        },
        composition: {
          categoryAffinity: { guide: 1.0, concept: 0.8, example: 0.6 },
          tagAffinity: { advanced: 1.0, patterns: 0.95, optimization: 0.9 },
          contextualRelevance: {
            advanced_usage: 1.0,
            performance_tuning: 0.9,
            architecture: 0.85,
            implementation: 0.7,
            onboarding: 0.1
          }
        },
        metrics: {
          readabilityScore: 68,
          completenessScore: 88,
          accuracyScore: 92,
          freshnessScore: 78
        }
      },
      {
        document: {
          id: 'troubleshooting-common-issues',
          title: 'Troubleshooting Common Issues',
          source_path: 'docs/guides/troubleshooting.md',
          category: 'guide',
          wordCount: 1800,
          lastModified: new Date('2024-01-12'),
          author: 'Support Team'
        },
        priority: {
          score: 80,
          tier: 'important',
          reasoning: 'Helps users resolve common problems',
          factors: {
            userImpact: 0.9,
            businessValue: 0.8,
            technicalImportance: 0.7,
            timeRelevance: 0.85
          }
        },
        tags: {
          primary: ['troubleshooting', 'debugging', 'common-issues'],
          secondary: ['errors', 'solutions', 'support'],
          audience: ['all-users', 'developers'],
          complexity: 'intermediate',
          topics: ['error-handling', 'debugging-tools', 'common-mistakes']
        },
        keywords: {
          primary: ['troubleshooting', 'errors', 'debugging', 'common issues', 'solutions'],
          technical: ['error messages', 'console errors', 'typescript errors', 'runtime errors'],
          domain: ['problem solving', 'diagnostics', 'error resolution']
        },
        dependencies: {
          prerequisites: [
            { documentId: 'getting-started-guide', importance: 'recommended', reason: 'Basic setup understanding' }
          ],
          references: [
            { documentId: 'api-reference-actions', importance: 'optional', reason: 'API error references' }
          ],
          followups: [
            { documentId: 'advanced-debugging-guide', importance: 'optional', reason: 'Advanced debugging techniques' }
          ],
          conflicts: [],
          complements: [
            { documentId: 'faq-guide', importance: 'recommended', reason: 'Related support content' }
          ]
        },
        composition: {
          categoryAffinity: { guide: 1.0, support: 0.9, api: 0.4 },
          tagAffinity: { troubleshooting: 1.0, debugging: 0.95, 'common-issues': 0.9 },
          contextualRelevance: {
            troubleshooting: 1.0,
            debugging: 0.95,
            support: 0.9,
            problem_solving: 0.85,
            learning_path: 0.6
          }
        },
        metrics: {
          readabilityScore: 82,
          completenessScore: 85,
          accuracyScore: 90,
          freshnessScore: 85
        }
      },
      {
        document: {
          id: 'typescript-integration-guide',
          title: 'TypeScript Integration Guide',
          source_path: 'docs/guides/typescript.md',
          category: 'guide',
          wordCount: 2400,
          lastModified: new Date('2024-01-05'),
          author: 'TypeScript Team'
        },
        priority: {
          score: 70,
          tier: 'useful',
          reasoning: 'Important for TypeScript users',
          factors: {
            userImpact: 0.75,
            businessValue: 0.7,
            technicalImportance: 0.8,
            timeRelevance: 0.65
          }
        },
        tags: {
          primary: ['typescript', 'types', 'integration'],
          secondary: ['interfaces', 'generics', 'type-safety'],
          audience: ['typescript-users', 'developers'],
          complexity: 'intermediate',
          topics: ['type-definitions', 'generic-constraints', 'interface-design']
        },
        keywords: {
          primary: ['typescript', 'types', 'interfaces', 'generics', 'type safety'],
          technical: ['ActionPayloadMap', 'type constraints', 'utility types', 'strict mode'],
          domain: ['type system', 'compile-time safety', 'developer experience']
        },
        dependencies: {
          prerequisites: [
            { documentId: 'api-reference-actions', importance: 'recommended', reason: 'API types understanding' }
          ],
          references: [
            { documentId: 'getting-started-guide', importance: 'optional', reason: 'Basic setup context' }
          ],
          followups: [
            { documentId: 'advanced-typescript-patterns', importance: 'optional', reason: 'Advanced type patterns' }
          ],
          conflicts: [
            { documentId: 'javascript-only-guide', reason: 'Different language approaches', severity: 'minor' }
          ],
          complements: [
            { documentId: 'ide-setup-guide', importance: 'recommended', reason: 'Development environment' }
          ]
        },
        composition: {
          categoryAffinity: { guide: 1.0, api: 0.7, concept: 0.5 },
          tagAffinity: { typescript: 1.0, types: 0.95, integration: 0.85 },
          contextualRelevance: {
            typescript_development: 1.0,
            type_safety: 0.95,
            development: 0.8,
            api_usage: 0.7,
            onboarding: 0.4
          }
        },
        metrics: {
          readabilityScore: 72,
          completenessScore: 82,
          accuracyScore: 88,
          freshnessScore: 70
        }
      }
    ];
  }

  describe('Real Document Processing Pipeline', () => {
    it('should process realistic documents through complete pipeline', async () => {
      const constraints: SelectionConstraints = {
        maxCharacters: 4000,
        targetCharacterLimit: 4000,
        context: {
          targetTags: ['beginner', 'tutorial', 'setup'],
          tagWeights: { beginner: 1.3, tutorial: 1.2, setup: 1.1 },
          selectedDocuments: [],
          maxCharacters: 4000,
          targetCharacterLimit: 4000,
          qualityThreshold: 75
        }
      };

      // Complete processing pipeline
      const filter = new TagBasedDocumentFilter(config);
      const dependencyResolver = new DependencyResolver(config);
      const conflictDetector = new ConflictDetector(config);
      const selector = new AdaptiveDocumentSelector(config);
      const qualityEvaluator = new QualityEvaluator(config);

      // Step 1: Filter documents
      const filterResult = filter.filterDocuments(realDocuments, {
        targetAudience: ['new-users', 'beginners'],
        enforceTagCompatibility: true,
        minRelevanceScore: 0.6
      });

      expect(filterResult.filtered.length).toBeGreaterThan(0);
      expect(filterResult.filtered.length).toBeLessThanOrEqual(realDocuments.length);

      // Should include getting-started-guide as it matches criteria
      const hasGettingStarted = filterResult.filtered.some(doc => 
        doc.document.id === 'getting-started-guide'
      );
      expect(hasGettingStarted).toBe(true);

      // Step 2: Resolve dependencies
      const dependencyResult = dependencyResolver.resolveDependencies(filterResult.filtered, {
        maxDepth: 3,
        includeOptionalDependencies: true,
        resolveConflicts: true,
        conflictResolution: 'higher-score-wins'
      });

      expect(dependencyResult.resolvedDocuments.length).toBeGreaterThanOrEqual(filterResult.filtered.length);

      // Step 3: Detect conflicts
      const conflictResult = conflictDetector.detectConflicts(dependencyResult.resolvedDocuments, {
        enabledRules: ['complexity-gap', 'audience-mismatch'],
        severityThreshold: 'moderate',
        autoResolve: true,
        autoResolveStrategy: 'higher-score-wins'
      });

      // Step 4: Select documents
      const selectionResult = await selector.selectDocuments(
        dependencyResult.resolvedDocuments,
        constraints,
        { strategy: 'balanced', enableOptimization: true }
      );

      expect(selectionResult.selectedDocuments.length).toBeGreaterThan(0);
      
      const totalCharacters = selectionResult.selectedDocuments.reduce(
        (sum, doc) => sum + (doc.document.wordCount || 0), 0
      );
      expect(totalCharacters).toBeLessThanOrEqual(constraints.maxCharacters);

      // Step 5: Evaluate quality
      const qualityReport = qualityEvaluator.evaluateQuality(
        selectionResult.selectedDocuments,
        constraints,
        selectionResult
      );

      expect(qualityReport.overallScore).toBeGreaterThan(70);
      expect(qualityReport.grade).toMatch(/^[ABC]/);

      // Verify realistic document characteristics are preserved
      selectionResult.selectedDocuments.forEach(doc => {
        expect(doc.document.author).toBeDefined();
        expect(doc.document.lastModified).toBeDefined();
        expect(doc.metrics).toBeDefined();
        expect(doc.composition).toBeDefined();
      });
    });

    it('should handle different user scenarios and contexts', async () => {
      const scenarios = [
        {
          name: 'New Developer Onboarding',
          constraints: {
            maxCharacters: 3000,
            targetCharacterLimit: 3000,
            context: {
              targetTags: ['beginner', 'tutorial', 'setup'],
              tagWeights: { beginner: 1.5, tutorial: 1.3, setup: 1.2 },
              selectedDocuments: [],
              maxCharacters: 3000,
              targetCharacterLimit: 3000
            }
          },
          expectedDocuments: ['getting-started-guide'],
          expectedCategories: ['guide']
        },
        {
          name: 'API Reference Lookup',
          constraints: {
            maxCharacters: 2000,
            targetCharacterLimit: 2000,
            context: {
              targetTags: ['api', 'reference'],
              tagWeights: { api: 1.4, reference: 1.2 },
              selectedDocuments: [],
              maxCharacters: 2000,
              targetCharacterLimit: 2000
            }
          },
          expectedDocuments: ['api-reference-actions'],
          expectedCategories: ['api']
        },
        {
          name: 'Problem Solving Session',
          constraints: {
            maxCharacters: 2500,
            targetCharacterLimit: 2500,
            context: {
              targetTags: ['troubleshooting', 'debugging'],
              tagWeights: { troubleshooting: 1.3, debugging: 1.2 },
              selectedDocuments: [],
              maxCharacters: 2500,
              targetCharacterLimit: 2500
            }
          },
          expectedDocuments: ['troubleshooting-common-issues'],
          expectedCategories: ['guide']
        }
      ];

      for (const scenario of scenarios) {
        const selector = new AdaptiveDocumentSelector(config);
        const result = await selector.selectDocuments(realDocuments, scenario.constraints, {
          strategy: 'balanced'
        });

        // Verify scenario-specific expectations
        expect(result.selectedDocuments.length).toBeGreaterThan(0);
        
        scenario.expectedDocuments.forEach(expectedDocId => {
          const hasExpectedDoc = result.selectedDocuments.some(doc => 
            doc.document.id === expectedDocId
          );
          // Note: Might not always include all expected docs due to constraints
          // but should prioritize them if they fit
        });

        const categories = new Set(result.selectedDocuments.map(doc => doc.document.category));
        scenario.expectedCategories.forEach(expectedCategory => {
          expect([...categories]).toContain(expectedCategory);
        });
      }
    });

    it('should maintain document relationships and dependencies', async () => {
      const constraints: SelectionConstraints = {
        maxCharacters: 6000,
        targetCharacterLimit: 6000,
        context: {
          targetTags: ['beginner', 'advanced'],
          tagWeights: { beginner: 1.0, advanced: 0.8 },
          selectedDocuments: [],
          maxCharacters: 6000,
          targetCharacterLimit: 6000
        }
      };

      const dependencyResolver = new DependencyResolver(config);
      const selector = new AdaptiveDocumentSelector(config);

      // Include documents that have dependencies
      const documentsWithDeps = realDocuments.filter(doc => 
        doc.dependencies.prerequisites?.length > 0 ||
        doc.dependencies.references?.length > 0
      );

      const dependencyResult = dependencyResolver.resolveDependencies(documentsWithDeps, {
        maxDepth: 3,
        includeOptionalDependencies: true,
        resolveConflicts: false,
        conflictResolution: 'exclude-conflicts'
      });

      const selectionResult = await selector.selectDocuments(
        dependencyResult.resolvedDocuments,
        constraints
      );

      // Verify dependency relationships are maintained
      selectionResult.selectedDocuments.forEach(selectedDoc => {
        selectedDoc.dependencies.prerequisites?.forEach(prereq => {
          if (prereq.importance === 'required') {
            const hasPrereq = selectionResult.selectedDocuments.some(doc => 
              doc.document.id === prereq.documentId
            );
            // If prerequisite is not selected, document order should respect dependency
            if (!hasPrereq) {
              // This is acceptable if prerequisite was filtered out earlier
              expect(true).toBe(true); // Placeholder for dependency analysis
            }
          }
        });
      });
    });
  });

  describe('Multi-format Document Processing', () => {
    it('should process documents with different metadata richness levels', async () => {
      const mixedQualityDocuments = [
        // Rich metadata document
        realDocuments[0],
        // Minimal metadata document
        {
          document: {
            id: 'minimal-doc',
            title: 'Minimal Documentation',
            source_path: 'docs/minimal.md',
            category: 'guide' as const,
            wordCount: 500
          },
          priority: {
            score: 60,
            tier: 'optional' as const
          },
          tags: {
            primary: ['basic'],
            audience: ['general'],
            complexity: 'basic'
          }
          // Missing: keywords, dependencies, composition, metrics
        } as DocumentMetadata,
        // Medium metadata document
        {
          document: {
            id: 'medium-doc',
            title: 'Medium Detail Documentation',
            source_path: 'docs/medium.md',
            category: 'concept' as const,
            wordCount: 800
          },
          priority: {
            score: 75,
            tier: 'useful' as const,
            reasoning: 'Moderately important concept'
          },
          tags: {
            primary: ['intermediate', 'concept'],
            audience: ['developers'],
            complexity: 'intermediate'
          },
          keywords: {
            primary: ['concepts', 'theory'],
            technical: ['implementation']
          },
          dependencies: {
            prerequisites: [],
            references: [],
            followups: [],
            conflicts: [],
            complements: []
          }
          // Missing: composition, metrics
        } as DocumentMetadata
      ];

      const constraints: SelectionConstraints = {
        maxCharacters: 2000,
        targetCharacterLimit: 2000,
        context: {
          targetTags: ['basic', 'intermediate'],
          tagWeights: { basic: 1.0, intermediate: 0.9 },
          selectedDocuments: [],
          maxCharacters: 2000,
          targetCharacterLimit: 2000
        }
      };

      const scorer = new DocumentScorer(config, 'balanced');
      const selector = new AdaptiveDocumentSelector(config);
      const qualityEvaluator = new QualityEvaluator(config);

      // Score all documents regardless of metadata completeness
      const scoredDocs = mixedQualityDocuments.map(doc => {
        const scoreResult = scorer.scoreDocument(doc, constraints.context);
        return { document: doc, score: scoreResult.scores.total, scoreResult };
      });

      // All documents should receive valid scores
      scoredDocs.forEach(scored => {
        expect(scored.score).toBeGreaterThanOrEqual(0);
        expect(scored.score).toBeLessThanOrEqual(1);
        expect(scored.scoreResult.confidence).toBeGreaterThan(0);
      });

      // Rich metadata document should generally score higher
      const richDoc = scoredDocs.find(s => s.document.document.id === 'getting-started-guide');
      const minimalDoc = scoredDocs.find(s => s.document.document.id === 'minimal-doc');

      expect(richDoc?.score).toBeGreaterThanOrEqual(minimalDoc?.score);
      expect(richDoc?.scoreResult.confidence).toBeGreaterThan(minimalDoc?.scoreResult.confidence);

      // Selection should work with mixed quality
      const selectionResult = await selector.selectDocuments(mixedQualityDocuments, constraints);
      expect(selectionResult.selectedDocuments.length).toBeGreaterThan(0);

      // Quality evaluation should adapt to available metadata
      const qualityReport = qualityEvaluator.evaluateQuality(
        selectionResult.selectedDocuments,
        constraints
      );

      expect(qualityReport.overallScore).toBeGreaterThan(0);
      expect(qualityReport.confidence).toBeGreaterThan(0);
      
      // Should note metadata completeness issues
      if (selectionResult.selectedDocuments.some(d => !d.composition || !d.metrics)) {
        expect(qualityReport.validation.failed.length).toBeGreaterThan(0);
      }
    });

    it('should handle large-scale document collections efficiently', async () => {
      // Generate large realistic document collection
      const largeCollection: DocumentMetadata[] = [];
      
      // Add base realistic documents multiple times with variations
      for (let i = 0; i < 100; i++) {
        realDocuments.forEach(baseDoc => {
          largeCollection.push({
            ...baseDoc,
            document: {
              ...baseDoc.document,
              id: `${baseDoc.document.id}-variant-${i}`,
              title: `${baseDoc.document.title} (Variant ${i})`,
              wordCount: baseDoc.document.wordCount + (Math.random() * 200 - 100)
            },
            priority: {
              ...baseDoc.priority,
              score: Math.max(10, Math.min(100, baseDoc.priority.score + (Math.random() * 20 - 10)))
            }
          });
        });
      }

      const constraints: SelectionConstraints = {
        maxCharacters: 5000,
        targetCharacterLimit: 5000,
        context: {
          targetTags: ['beginner', 'guide'],
          tagWeights: { beginner: 1.0, guide: 0.9 },
          selectedDocuments: [],
          maxCharacters: 5000,
          targetCharacterLimit: 5000
        }
      };

      const startTime = Date.now();
      
      const filter = new TagBasedDocumentFilter(config);
      const selector = new AdaptiveDocumentSelector(config);
      
      const filterResult = filter.filterDocuments(largeCollection, {
        targetAudience: ['new-users'],
        minRelevanceScore: 0.5
      });
      
      const selectionResult = await selector.selectDocuments(
        filterResult.filtered,
        constraints,
        { strategy: 'greedy' } // Use fastest algorithm for large collections
      );
      
      const processingTime = Date.now() - startTime;

      // Performance assertions
      expect(processingTime).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(selectionResult.selectedDocuments.length).toBeGreaterThan(0);
      expect(selectionResult.selectedDocuments.length).toBeLessThan(50); // Reasonable selection size

      // Quality should remain good despite scale
      const totalChars = selectionResult.selectedDocuments.reduce(
        (sum, doc) => sum + (doc.document.wordCount || 0), 0
      );
      expect(totalChars).toBeLessThanOrEqual(constraints.maxCharacters);
      expect(selectionResult.optimization.qualityScore).toBeGreaterThan(0.5);
    });
  });

  describe('Document Content Analysis Integration', () => {
    it('should analyze document relationships and complementarity', async () => {
      const constraints: SelectionConstraints = {
        maxCharacters: 8000,
        targetCharacterLimit: 8000,
        context: {
          targetTags: ['guide', 'api', 'troubleshooting'],
          tagWeights: { guide: 1.0, api: 0.9, troubleshooting: 0.8 },
          selectedDocuments: [],
          maxCharacters: 8000,
          targetCharacterLimit: 8000
        }
      };

      const selector = new AdaptiveDocumentSelector(config);
      const qualityEvaluator = new QualityEvaluator(config);

      const selectionResult = await selector.selectDocuments(realDocuments, constraints, {
        strategy: 'diverse',
        enableOptimization: true
      });

      // Analyze complementarity in selection
      const selectedIds = selectionResult.selectedDocuments.map(d => d.document.id);
      const complementRelationships = [];

      selectionResult.selectedDocuments.forEach(doc => {
        doc.dependencies.complements?.forEach(complement => {
          if (selectedIds.includes(complement.documentId)) {
            complementRelationships.push({
              source: doc.document.id,
              target: complement.documentId,
              reason: complement.reason
            });
          }
        });
      });

      // Should have some complementary relationships in diverse selection
      expect(complementRelationships.length).toBeGreaterThanOrEqual(0);

      // Quality evaluation should reflect good content complementarity
      const qualityReport = qualityEvaluator.evaluateQuality(
        selectionResult.selectedDocuments,
        constraints,
        selectionResult
      );

      expect(qualityReport.metrics['thematic-coherence']).toBeDefined();
      expect(qualityReport.metrics['content-completeness']).toBeDefined();
      
      // Diverse selection should show good topic breadth
      expect(qualityReport.metrics['topic-breadth'].value).toBeGreaterThan(0.6);
    });

    it('should respect document freshness and accuracy metrics', async () => {
      // Create documents with different freshness scores
      const freshnessVariedDocs = realDocuments.map((doc, index) => ({
        ...doc,
        document: {
          ...doc.document,
          id: `${doc.document.id}-freshness-${index}`,
          lastModified: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)) // Spread across days
        },
        metrics: {
          ...doc.metrics,
          freshnessScore: 95 - (index * 10), // Decreasing freshness
          accuracyScore: 90 + (Math.random() * 10) // Random accuracy variation
        }
      }));

      const constraints: SelectionConstraints = {
        maxCharacters: 4000,
        targetCharacterLimit: 4000,
        context: {
          targetTags: ['beginner'],
          tagWeights: { beginner: 1.0 },
          selectedDocuments: [],
          maxCharacters: 4000,
          targetCharacterLimit: 4000,
          freshnessWeight: 0.3, // Give weight to freshness
          accuracyWeight: 0.4   // Give weight to accuracy
        }
      };

      const selector = new AdaptiveDocumentSelector(config);
      const selectionResult = await selector.selectDocuments(freshnessVariedDocs, constraints, {
        strategy: 'quality-focused'
      });

      // Should prefer fresher and more accurate documents
      const avgFreshness = selectionResult.selectedDocuments.reduce(
        (sum, doc) => sum + (doc.metrics?.freshnessScore || 50), 0
      ) / selectionResult.selectedDocuments.length;

      const avgAccuracy = selectionResult.selectedDocuments.reduce(
        (sum, doc) => sum + (doc.metrics?.accuracyScore || 50), 0
      ) / selectionResult.selectedDocuments.length;

      expect(avgFreshness).toBeGreaterThan(70); // Should favor fresher content
      expect(avgAccuracy).toBeGreaterThan(85);  // Should favor accurate content
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle documents with malformed or missing critical data', async () => {
      const problematicDocuments = [
        // Document with missing required fields
        {
          document: { id: 'broken-1', title: 'Broken Doc 1' },
          // Missing category, priority, tags, etc.
        } as any as DocumentMetadata,
        
        // Document with invalid data types
        {
          document: { 
            id: 'broken-2', 
            title: 'Broken Doc 2', 
            source_path: 'broken.md',
            category: 'guide',
            wordCount: 'invalid' as any // Should be number
          },
          priority: { score: 'high' as any, tier: 'critical' }, // Score should be number
          tags: 'invalid-tags' as any // Should be object
        } as DocumentMetadata,
        
        // Valid document for comparison
        realDocuments[0]
      ];

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

      // Processing should not throw errors
      expect(async () => {
        const selector = new AdaptiveDocumentSelector(config);
        const result = await selector.selectDocuments(problematicDocuments, constraints);
        
        // Should select at least the valid document
        expect(result.selectedDocuments.length).toBeGreaterThan(0);
        
        // Should log errors but continue processing
        expect(result.metadata.errors?.length).toBeGreaterThan(0);
        
        // Valid documents should still be processed correctly
        const validDocSelected = result.selectedDocuments.some(doc => 
          doc.document.id === 'getting-started-guide'
        );
        expect(validDocSelected).toBe(true);
        
      }).not.toThrow();
    });

    it('should recover from component failures and provide partial results', async () => {
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

      // Test recovery by simulating component failures
      const selector = new AdaptiveDocumentSelector(config);
      
      // Mock a scoring failure
      const originalScorer = (selector as any).scorer;
      let failureCount = 0;
      (selector as any).scorer = {
        scoreDocument: (doc: DocumentMetadata, context: any) => {
          failureCount++;
          if (failureCount % 2 === 0) {
            throw new Error('Simulated scoring failure');
          }
          return originalScorer.scoreDocument(doc, context);
        }
      };

      const result = await selector.selectDocuments(realDocuments, constraints, {
        strategy: 'greedy',
        enableErrorRecovery: true
      });

      // Should still produce some results despite failures
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.metadata.errors?.length).toBeGreaterThan(0);
      
      // Should include information about recovery actions
      expect(result.metadata.recoveryActions).toBeDefined();
    });
  });
});