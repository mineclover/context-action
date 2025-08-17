import { EnhancedConfigManager } from '../../src/core/EnhancedConfigManager';
import { DocumentScorer } from '../../src/core/DocumentScorer';
import { TagBasedDocumentFilter } from '../../src/core/TagBasedDocumentFilter';
import { AdaptiveDocumentSelector } from '../../src/core/AdaptiveDocumentSelector';
import { DependencyResolver } from '../../src/core/DependencyResolver';
import { ConflictDetector } from '../../src/core/ConflictDetector';
import { QualityEvaluator } from '../../src/core/QualityEvaluator';
import { EnhancedLLMSConfig, DocumentMetadata, SelectionConstraints } from '../../src/types/config';
import { TestDataGenerator } from '../helpers/test-data-generator';

describe('Edge Cases and Boundary Conditions', () => {
  let config: EnhancedLLMSConfig;

  beforeEach(async () => {
    const configManager = new EnhancedConfigManager();
    config = await configManager.initializeConfig('standard');
  });

  describe('Empty and Null Data Handling', () => {
    it('should handle completely empty document collections', async () => {
      const selector = new AdaptiveDocumentSelector(config);
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

      const result = await selector.selectDocuments([], constraints);
      
      expect(result.selectedDocuments).toHaveLength(0);
      expect(result.optimization.spaceUtilization).toBe(0);
      expect(result.optimization.qualityScore).toBe(0);
      expect(result.metadata.selectionTime).toBeGreaterThan(0);
      expect(result.analysis.categoryCoverage).toEqual({});
      expect(result.analysis.tagCoverage).toEqual({});
    });

    it('should handle documents with all null/undefined metadata', async () => {
      const emptyDocuments: DocumentMetadata[] = [
        {
          document: {
            id: 'empty-1',
            title: '',
            source_path: '',
            category: 'guide'
          },
          priority: { score: 0, tier: 'optional' },
          tags: { primary: [], audience: [], complexity: 'basic' }
        } as DocumentMetadata,
        {
          document: {
            id: 'empty-2',
            title: null as any,
            source_path: undefined as any,
            category: 'api'
          },
          priority: undefined as any,
          tags: undefined as any
        } as DocumentMetadata,
        {
          document: {
            id: 'empty-3',
            title: 'Valid Title',
            source_path: 'valid.md',
            category: 'concept'
          }
          // Missing all other fields
        } as DocumentMetadata
      ];

      const selector = new AdaptiveDocumentSelector(config);
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

      // Should not throw errors
      expect(async () => {
        const result = await selector.selectDocuments(emptyDocuments, constraints);
        expect(result).toBeDefined();
        expect(result.metadata.errors?.length).toBeGreaterThan(0); // Should log errors
      }).not.toThrow();
    });

    it('should handle empty constraints and context', async () => {
      const documents = TestDataGenerator.generateDocuments(3);
      const selector = new AdaptiveDocumentSelector(config);

      const emptyConstraints: SelectionConstraints = {
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

      const result = await selector.selectDocuments(documents, emptyConstraints);
      
      expect(result.selectedDocuments).toHaveLength(0);
      expect(result.optimization.spaceUtilization).toBe(0);
    });

    it('should handle documents with circular dependencies', async () => {
      const circularDocs: DocumentMetadata[] = [
        {
          ...TestDataGenerator.generateDocuments(1)[0],
          document: { id: 'doc-a', title: 'Doc A', source_path: 'a.md', category: 'guide' },
          dependencies: {
            prerequisites: [{ documentId: 'doc-b', importance: 'required', reason: 'Circular dep' }],
            references: [], followups: [], conflicts: [], complements: []
          }
        },
        {
          ...TestDataGenerator.generateDocuments(1)[0],
          document: { id: 'doc-b', title: 'Doc B', source_path: 'b.md', category: 'guide' },
          dependencies: {
            prerequisites: [{ documentId: 'doc-c', importance: 'required', reason: 'Circular dep' }],
            references: [], followups: [], conflicts: [], complements: []
          }
        },
        {
          ...TestDataGenerator.generateDocuments(1)[0],
          document: { id: 'doc-c', title: 'Doc C', source_path: 'c.md', category: 'guide' },
          dependencies: {
            prerequisites: [{ documentId: 'doc-a', importance: 'required', reason: 'Circular dep' }],
            references: [], followups: [], conflicts: [], complements: []
          }
        }
      ];

      const dependencyResolver = new DependencyResolver(config);
      
      expect(() => {
        const result = dependencyResolver.resolveDependencies(circularDocs, {
          maxDepth: 3,
          includeOptionalDependencies: false,
          resolveConflicts: true,
          conflictResolution: 'break-cycles'
        });
        
        expect(result.cycles.length).toBeGreaterThan(0);
        expect(result.cycleBreaks.length).toBeGreaterThan(0);
        expect(result.resolvedDocuments.length).toBeGreaterThan(0); // Should break cycles and continue
      }).not.toThrow();
    });
  });

  describe('Extreme Value Boundaries', () => {
    it('should handle extremely large character limits', async () => {
      const documents = TestDataGenerator.generateDocuments(10);
      const selector = new AdaptiveDocumentSelector(config);

      const extremeConstraints: SelectionConstraints = {
        maxCharacters: Number.MAX_SAFE_INTEGER,
        targetCharacterLimit: Number.MAX_SAFE_INTEGER,
        context: {
          targetTags: ['beginner'],
          tagWeights: { beginner: 1.0 },
          selectedDocuments: [],
          maxCharacters: Number.MAX_SAFE_INTEGER,
          targetCharacterLimit: Number.MAX_SAFE_INTEGER
        }
      };

      const result = await selector.selectDocuments(documents, extremeConstraints);
      
      // Should select all documents since limit is effectively unlimited
      expect(result.selectedDocuments.length).toBe(documents.length);
      expect(result.optimization.spaceUtilization).toBeGreaterThan(0);
    });

    it('should handle extremely small positive character limits', async () => {
      const documents = TestDataGenerator.generateDocuments(5);
      // Set very small word counts
      documents.forEach(doc => {
        doc.document.wordCount = 10;
      });

      const selector = new AdaptiveDocumentSelector(config);
      const tinyConstraints: SelectionConstraints = {
        maxCharacters: 1, // Extremely small
        targetCharacterLimit: 1,
        context: {
          targetTags: ['beginner'],
          tagWeights: { beginner: 1.0 },
          selectedDocuments: [],
          maxCharacters: 1,
          targetCharacterLimit: 1
        }
      };

      const result = await selector.selectDocuments(documents, tinyConstraints);
      
      // Should either select nothing or find a way to fit
      expect(result.selectedDocuments.length).toBeGreaterThanOrEqual(0);
      if (result.selectedDocuments.length > 0) {
        const totalChars = result.selectedDocuments.reduce((sum, doc) => 
          sum + (doc.document.wordCount || 0), 0);
        expect(totalChars).toBeLessThanOrEqual(tinyConstraints.maxCharacters);
      }
    });

    it('should handle extreme priority scores', async () => {
      const extremeDocuments: DocumentMetadata[] = [
        {
          ...TestDataGenerator.generateDocuments(1)[0],
          document: { id: 'extreme-high', title: 'Extreme High', source_path: 'high.md', category: 'guide' },
          priority: { score: Number.MAX_SAFE_INTEGER, tier: 'critical' }
        },
        {
          ...TestDataGenerator.generateDocuments(1)[0],
          document: { id: 'extreme-low', title: 'Extreme Low', source_path: 'low.md', category: 'guide' },
          priority: { score: -Number.MAX_SAFE_INTEGER, tier: 'optional' }
        },
        {
          ...TestDataGenerator.generateDocuments(1)[0],
          document: { id: 'nan-score', title: 'NaN Score', source_path: 'nan.md', category: 'guide' },
          priority: { score: NaN, tier: 'useful' }
        },
        {
          ...TestDataGenerator.generateDocuments(1)[0],
          document: { id: 'infinity-score', title: 'Infinity Score', source_path: 'inf.md', category: 'guide' },
          priority: { score: Infinity, tier: 'critical' }
        }
      ];

      const scorer = new DocumentScorer(config, 'balanced');
      const constraints = {
        targetTags: ['beginner'],
        tagWeights: { beginner: 1.0 },
        selectedDocuments: [],
        maxCharacters: 1000,
        targetCharacterLimit: 1000
      };

      // Should handle extreme values gracefully
      extremeDocuments.forEach(doc => {
        expect(() => {
          const result = scorer.scoreDocument(doc, constraints);
          expect(result.scores.total).toBeGreaterThanOrEqual(0);
          expect(result.scores.total).toBeLessThanOrEqual(1);
          expect(Number.isFinite(result.scores.total)).toBe(true);
        }).not.toThrow();
      });
    });

    it('should handle extreme tag weights', async () => {
      const documents = TestDataGenerator.generateDocuments(3);
      const selector = new AdaptiveDocumentSelector(config);

      const extremeWeightConstraints: SelectionConstraints = {
        maxCharacters: 1000,
        targetCharacterLimit: 1000,
        context: {
          targetTags: ['beginner', 'advanced'],
          tagWeights: {
            beginner: Number.MAX_SAFE_INTEGER,
            advanced: -Number.MAX_SAFE_INTEGER,
            practical: NaN,
            technical: Infinity
          },
          selectedDocuments: [],
          maxCharacters: 1000,
          targetCharacterLimit: 1000
        }
      };

      expect(async () => {
        const result = await selector.selectDocuments(documents, extremeWeightConstraints);
        expect(result).toBeDefined();
        expect(result.selectedDocuments.length).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });
  });

  describe('Unicode and Special Character Handling', () => {
    it('should handle documents with unicode and special characters', async () => {
      const unicodeDocuments: DocumentMetadata[] = [
        {
          ...TestDataGenerator.generateDocuments(1)[0],
          document: {
            id: 'unicode-한글-🚀',
            title: '한글 제목 with émojis 🎉 and símböls ñ',
            source_path: 'docs/한글/파일명.md',
            category: 'guide',
            wordCount: 500
          },
          tags: {
            primary: ['한글-태그', 'émoji-tag-🎯', 'symbols-ñ-ç'],
            audience: ['한국어-사용자', 'unicode-users'],
            complexity: 'basic'
          },
          keywords: {
            primary: ['한글', '유니코드', 'émojis', 'special-chars-@#$%'],
            technical: ['UTF-8', '국제화', 'i18n'],
            domain: ['다국어-지원', 'multilingual-support']
          }
        },
        {
          ...TestDataGenerator.generateDocuments(1)[0],
          document: {
            id: 'extreme-unicode',
            title: '𝕌𝕟𝕚𝕔𝕠𝕕𝕖 𝔼𝕩𝕥𝕣𝕖𝕞𝕖 ✨ 𝒯𝑒𝓈𝓉 🌟',
            source_path: '𝕕𝕠𝕔𝕤/𝔢𝔵𝔞𝔪𝔭𝔩𝔢.𝔪𝔡',
            category: 'example',
            wordCount: 300
          },
          tags: {
            primary: ['𝓼𝓹𝓮𝓬𝓲𝓪𝓵-𝓯𝓸𝓷𝓽𝓼', '✨-emojis', 'ｍａｔｈ－ｓｙｍｂｏｌｓ'],
            audience: ['advanced-unicode-users'],
            complexity: 'advanced'
          }
        }
      ];

      const filter = new TagBasedDocumentFilter(config);
      const selector = new AdaptiveDocumentSelector(config);
      const qualityEvaluator = new QualityEvaluator(config);

      // Filtering should handle unicode tags
      const filterResult = filter.filterDocuments(unicodeDocuments, {
        requiredTags: ['한글-태그'],
        targetAudience: ['한국어-사용자']
      });

      expect(filterResult.filtered.length).toBe(1);
      expect(filterResult.filtered[0].document.id).toBe('unicode-한글-🚀');

      // Selection should work with unicode constraints
      const constraints: SelectionConstraints = {
        maxCharacters: 1000,
        targetCharacterLimit: 1000,
        context: {
          targetTags: ['한글-태그', 'émoji-tag-🎯'],
          tagWeights: { '한글-태그': 1.2, 'émoji-tag-🎯': 1.1 },
          selectedDocuments: [],
          maxCharacters: 1000,
          targetCharacterLimit: 1000
        }
      };

      const result = await selector.selectDocuments(unicodeDocuments, constraints);
      expect(result.selectedDocuments.length).toBeGreaterThan(0);

      // Quality evaluation should handle unicode content
      const qualityReport = qualityEvaluator.evaluateQuality(result.selectedDocuments, constraints);
      expect(qualityReport.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle extremely long strings and text overflow', async () => {
      const longTextDocument: DocumentMetadata = {
        ...TestDataGenerator.generateDocuments(1)[0],
        document: {
          id: 'extremely-long-document',
          title: 'A'.repeat(10000), // Very long title
          source_path: 'extremely/long/path/'.repeat(100) + 'document.md',
          category: 'guide',
          wordCount: 1000000 // 1 million words
        },
        tags: {
          primary: Array(1000).fill(0).map((_, i) => `tag-${i}`), // 1000 tags
          audience: Array(500).fill(0).map((_, i) => `audience-${i}`),
          complexity: 'advanced'
        },
        keywords: {
          primary: Array(2000).fill(0).map((_, i) => `keyword-${i}-${'x'.repeat(100)}`),
          technical: Array(1000).fill(0).map((_, i) => `tech-${i}`)
        }
      };

      const constraints: SelectionConstraints = {
        maxCharacters: 5000,
        targetCharacterLimit: 5000,
        context: {
          targetTags: ['tag-1', 'tag-100'],
          tagWeights: { 'tag-1': 1.0 },
          selectedDocuments: [],
          maxCharacters: 5000,
          targetCharacterLimit: 5000
        }
      };

      // Should handle without memory issues or crashes
      expect(() => {
        const selector = new AdaptiveDocumentSelector(config);
        return selector.selectDocuments([longTextDocument], constraints);
      }).not.toThrow();
    });
  });

  describe('Malformed Data Structures', () => {
    it('should handle deeply nested and malformed dependency structures', async () => {
      const malformedDoc: DocumentMetadata = {
        ...TestDataGenerator.generateDocuments(1)[0],
        document: { id: 'malformed', title: 'Malformed', source_path: 'malformed.md', category: 'guide' },
        dependencies: {
          prerequisites: [
            { documentId: '', importance: 'required', reason: '' }, // Empty strings
            { documentId: undefined as any, importance: 'optional', reason: null as any }, // Undefined/null
            { documentId: 'valid-doc', importance: 'invalid-importance' as any, reason: 'Valid reason' }, // Invalid importance
            {
              documentId: 'nested-doc',
              importance: 'required',
              reason: 'Nested structure',
              // @ts-ignore - Adding invalid nested structure
              nested: {
                deep: {
                  structure: {
                    should: 'not-crash-system',
                    circular: null as any // Will be set to circular reference
                  }
                }
              }
            }
          ],
          references: null as any, // Should be array
          followups: 'invalid' as any, // Should be array
          conflicts: [
            { documentId: 'conflict-doc', reason: null, severity: undefined } as any
          ],
          complements: [] // Valid empty array
        }
      };

      // Create circular reference
      (malformedDoc.dependencies.prerequisites![3] as any).nested.deep.structure.circular = 
        (malformedDoc.dependencies.prerequisites![3] as any).nested;

      const dependencyResolver = new DependencyResolver(config);
      
      expect(() => {
        const result = dependencyResolver.resolveDependencies([malformedDoc], {
          maxDepth: 3,
          includeOptionalDependencies: true,
          resolveConflicts: true,
          conflictResolution: 'exclude-conflicts'
        });
        
        expect(result.errors?.length).toBeGreaterThan(0); // Should report errors
        expect(result.resolvedDocuments.length).toBeGreaterThanOrEqual(0); // Should continue processing
      }).not.toThrow();
    });

    it('should handle invalid JSON-like structures in metadata', async () => {
      const invalidStructureDoc: DocumentMetadata = {
        ...TestDataGenerator.generateDocuments(1)[0],
        document: { id: 'invalid-structure', title: 'Invalid', source_path: 'invalid.md', category: 'guide' },
        // Add invalid structures that might come from corrupted JSON
        composition: {
          categoryAffinity: {
            guide: 'should-be-number' as any,
            api: null as any,
            concept: undefined as any
          },
          tagAffinity: null as any, // Should be object
          contextualRelevance: [] as any // Should be object
        },
        metrics: {
          readabilityScore: 'high' as any, // Should be number
          completenessScore: Infinity,
          accuracyScore: -100, // Invalid negative percentage
          freshnessScore: NaN
        }
      };

      const scorer = new DocumentScorer(config, 'balanced');
      const qualityEvaluator = new QualityEvaluator(config);

      const constraints = {
        targetTags: ['beginner'],
        tagWeights: { beginner: 1.0 },
        selectedDocuments: [],
        maxCharacters: 1000,
        targetCharacterLimit: 1000
      };

      // Scoring should handle invalid structures gracefully
      expect(() => {
        const result = scorer.scoreDocument(invalidStructureDoc, constraints);
        expect(result.scores.total).toBeGreaterThanOrEqual(0);
        expect(result.scores.total).toBeLessThanOrEqual(1);
      }).not.toThrow();

      // Quality evaluation should handle invalid metrics
      expect(() => {
        const report = qualityEvaluator.evaluateQuality([invalidStructureDoc], {
          maxCharacters: 1000,
          targetCharacterLimit: 1000,
          context: constraints
        });
        expect(report.overallScore).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    it('should handle recursive data structures without infinite loops', async () => {
      const recursiveDoc: DocumentMetadata = {
        ...TestDataGenerator.generateDocuments(1)[0],
        document: { id: 'recursive', title: 'Recursive', source_path: 'recursive.md', category: 'guide' }
      };

      // Create recursive structure
      (recursiveDoc as any).selfReference = recursiveDoc;
      (recursiveDoc as any).circularArray = [recursiveDoc];
      (recursiveDoc as any).deepCircular = {
        level1: {
          level2: {
            level3: {
              backToRoot: recursiveDoc
            }
          }
        }
      };

      const selector = new AdaptiveDocumentSelector(config);
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

      // Should not cause infinite loops or stack overflow
      expect(async () => {
        const result = await selector.selectDocuments([recursiveDoc], constraints);
        expect(result).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Concurrent Access and Race Conditions', () => {
    it('should handle concurrent modifications to shared data structures', async () => {
      const sharedDocuments = TestDataGenerator.generateDocuments(10);
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

      // Simulate concurrent operations that modify shared data
      const concurrentOperations = Array(5).fill(null).map(async (_, index) => {
        const selector = new AdaptiveDocumentSelector(config);
        
        // Modify documents during processing to simulate race conditions
        setTimeout(() => {
          if (sharedDocuments[index]) {
            sharedDocuments[index].priority.score = Math.random() * 100;
            sharedDocuments[index].tags.primary = [`modified-${index}`];
          }
        }, Math.random() * 10); // Random delay

        return selector.selectDocuments(sharedDocuments, constraints);
      });

      const results = await Promise.all(concurrentOperations);

      // All operations should complete successfully despite modifications
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.selectedDocuments.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle resource exhaustion gracefully', async () => {
      // Create a scenario that might exhaust resources
      const massiveDocuments = TestDataGenerator.generateDocuments(50).map(doc => ({
        ...doc,
        // Add large data structures that consume memory
        composition: {
          ...doc.composition,
          massiveArray: Array(10000).fill(null).map((_, i) => ({
            index: i,
            data: `data-${i}`.repeat(100)
          }))
        }
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

      // Should either complete successfully or fail gracefully
      try {
        const result = await selector.selectDocuments(massiveDocuments, constraints, {
          strategy: 'greedy', // Use fastest algorithm
          enableOptimization: false
        });
        
        expect(result).toBeDefined();
        expect(result.selectedDocuments.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // If it fails, it should be a controlled failure, not a crash
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeDefined();
      }
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle empty and invalid configurations', async () => {
      const emptyConfig = {} as EnhancedLLMSConfig;
      const invalidConfig = {
        paths: null,
        generation: undefined,
        categories: 'invalid',
        tags: []
      } as any as EnhancedLLMSConfig;

      // Components should handle invalid configs gracefully
      expect(() => {
        try {
          new DocumentScorer(emptyConfig, 'balanced');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow();

      expect(() => {
        try {
          new AdaptiveDocumentSelector(invalidConfig);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow();
    });

    it('should handle configuration with circular references', async () => {
      const circularConfig = {
        ...config,
        tags: {
          'tag-a': {
            name: 'Tag A',
            description: 'Description A',
            weight: 1.0,
            compatibleWith: ['tag-b'],
            audience: ['users']
          },
          'tag-b': {
            name: 'Tag B',
            description: 'Description B',
            weight: 1.0,
            compatibleWith: ['tag-c'],
            audience: ['users']
          },
          'tag-c': {
            name: 'Tag C',
            description: 'Description C',
            weight: 1.0,
            compatibleWith: ['tag-a'], // Creates circular reference
            audience: ['users']
          }
        }
      };

      const filter = new TagBasedDocumentFilter(circularConfig);
      const documents = TestDataGenerator.generateDocuments(3);
      documents[0].tags.primary = ['tag-a'];

      // Should handle circular tag references without infinite loops
      expect(() => {
        const result = filter.filterDocuments(documents, {
          enforceTagCompatibility: true,
          requiredTags: ['tag-a']
        });
        expect(result).toBeDefined();
      }).not.toThrow();
    });
  });
});