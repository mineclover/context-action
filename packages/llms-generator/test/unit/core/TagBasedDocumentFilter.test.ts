import { TagBasedDocumentFilter } from '../../../src/core/TagBasedDocumentFilter';
import { EnhancedLLMSConfig, DocumentMetadata } from '../../../src/types/config';
import { TestDataGenerator } from '../../helpers/test-data-generator';

describe('TagBasedDocumentFilter', () => {
  let filter: TagBasedDocumentFilter;
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
          compatibleWith: ['step-by-step', 'practical', 'tutorial'],
          audience: ['new-users', 'beginners']
        },
        advanced: {
          name: '고급',
          description: 'Advanced content',
          weight: 0.9,
          compatibleWith: ['technical', 'expert', 'optimization'],
          audience: ['experts', 'contributors']
        },
        'step-by-step': {
          name: '단계별',
          description: 'Step-by-step instructions',
          weight: 1.1,
          compatibleWith: ['beginner', 'practical', 'tutorial'],
          audience: ['new-users', 'learners']
        },
        technical: {
          name: '기술적',
          description: 'Technical documentation',
          weight: 1.0,
          compatibleWith: ['advanced', 'reference', 'developer'],
          audience: ['developers', 'contributors']
        },
        practical: {
          name: '실용적',
          description: 'Practical examples and usage',
          weight: 1.15,
          compatibleWith: ['beginner', 'step-by-step', 'tutorial'],
          audience: ['all-users']
        },
        reference: {
          name: '참조',
          description: 'Reference documentation',
          weight: 0.95,
          compatibleWith: ['technical', 'api', 'developer'],
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

    // Generate test documents with specific tag combinations
    testDocuments = [
      {
        ...TestDataGenerator.generateDocuments(1)[0],
        document: { id: 'guide-beginner', title: 'Beginner Guide', source_path: 'guide/beginner.md', category: 'guide' },
        tags: {
          primary: ['beginner', 'step-by-step', 'practical'],
          audience: ['new-users', 'beginners'],
          complexity: 'basic'
        }
      },
      {
        ...TestDataGenerator.generateDocuments(1)[0],
        document: { id: 'api-advanced', title: 'Advanced API', source_path: 'api/advanced.md', category: 'api' },
        tags: {
          primary: ['advanced', 'technical', 'reference'],
          audience: ['experts', 'developers'],
          complexity: 'advanced'
        }
      },
      {
        ...TestDataGenerator.generateDocuments(1)[0],
        document: { id: 'guide-intermediate', title: 'Intermediate Guide', source_path: 'guide/intermediate.md', category: 'guide' },
        tags: {
          primary: ['intermediate', 'practical'],
          audience: ['all-users'],
          complexity: 'intermediate'
        }
      },
      {
        ...TestDataGenerator.generateDocuments(1)[0],
        document: { id: 'conflicting-doc', title: 'Conflicting Doc', source_path: 'misc/conflict.md', category: 'concept' },
        tags: {
          primary: ['beginner', 'advanced'], // Incompatible combination
          audience: ['new-users'],
          complexity: 'basic'
        }
      }
    ];

    filter = new TagBasedDocumentFilter(mockConfig);
  });

  describe('Constructor', () => {
    it('should initialize with valid config', () => {
      expect(filter).toBeInstanceOf(TagBasedDocumentFilter);
    });

    it('should build tag compatibility matrix from config', () => {
      // Test internal compatibility matrix building
      const compatibilityMatrix = (filter as any).buildCompatibilityMatrix();
      
      expect(compatibilityMatrix.beginner).toContain('step-by-step');
      expect(compatibilityMatrix.beginner).toContain('practical');
      expect(compatibilityMatrix.advanced).toContain('technical');
      expect(compatibilityMatrix.advanced).not.toContain('beginner');
    });
  });

  describe('filterDocuments()', () => {
    it('should filter by required tags correctly', () => {
      const options = {
        requiredTags: ['beginner'],
        excludedTags: [],
        targetAudience: []
      };

      const result = filter.filterDocuments(testDocuments, options);

      expect(result.filtered).toHaveLength(2); // beginner guide + conflicting doc
      expect(result.statistics.total).toBe(testDocuments.length);
      expect(result.statistics.passed).toBe(2);
      expect(result.statistics.excluded).toBe(2);
      
      const filteredIds = result.filtered.map(doc => doc.document.id);
      expect(filteredIds).toContain('guide-beginner');
      expect(filteredIds).toContain('conflicting-doc');
    });

    it('should exclude documents with forbidden tags', () => {
      const options = {
        requiredTags: [],
        excludedTags: ['advanced'],
        targetAudience: []
      };

      const result = filter.filterDocuments(testDocuments, options);

      expect(result.filtered).toHaveLength(3); // All except advanced API
      const filteredIds = result.filtered.map(doc => doc.document.id);
      expect(filteredIds).not.toContain('api-advanced');
      expect(result.exclusionReasons['api-advanced']).toContain('Contains excluded tag: advanced');
    });

    it('should respect tag compatibility matrix', () => {
      const options = {
        requiredTags: ['beginner'],
        excludedTags: [],
        targetAudience: [],
        enforceTagCompatibility: true
      };

      const result = filter.filterDocuments(testDocuments, options);

      // Should exclude conflicting-doc due to incompatible beginner+advanced combination
      const filteredIds = result.filtered.map(doc => doc.document.id);
      expect(filteredIds).toContain('guide-beginner');
      expect(filteredIds).not.toContain('conflicting-doc');
      expect(result.exclusionReasons['conflicting-doc']).toContain('Incompatible tag combination');
    });

    it('should handle complex filter combinations', () => {
      const options = {
        requiredTags: ['practical'],
        excludedTags: ['advanced'],
        targetAudience: ['new-users'],
        enforceTagCompatibility: true
      };

      const result = filter.filterDocuments(testDocuments, options);

      // Should only include beginner guide (has practical + new-users, no advanced)
      expect(result.filtered).toHaveLength(1);
      expect(result.filtered[0].document.id).toBe('guide-beginner');
    });

    it('should filter by target audience', () => {
      const options = {
        requiredTags: [],
        excludedTags: [],
        targetAudience: ['developers']
      };

      const result = filter.filterDocuments(testDocuments, options);

      // Should include API advanced (has developers audience)
      const filteredIds = result.filtered.map(doc => doc.document.id);
      expect(filteredIds).toContain('api-advanced');
      
      // Should exclude beginner guide (only new-users audience)
      expect(filteredIds).not.toContain('guide-beginner');
    });

    it('should handle empty filter criteria', () => {
      const options = {
        requiredTags: [],
        excludedTags: [],
        targetAudience: []
      };

      const result = filter.filterDocuments(testDocuments, options);

      // Should include all documents
      expect(result.filtered).toHaveLength(testDocuments.length);
      expect(result.statistics.passed).toBe(testDocuments.length);
    });

    it('should provide detailed exclusion reasons', () => {
      const options = {
        requiredTags: ['beginner', 'advanced'], // Impossible combination
        excludedTags: [],
        targetAudience: []
      };

      const result = filter.filterDocuments(testDocuments, options);

      expect(result.filtered).toHaveLength(0); // No documents should match
      expect(Object.keys(result.exclusionReasons)).toHaveLength(testDocuments.length);
      
      Object.values(result.exclusionReasons).forEach(reasons => {
        expect(reasons.length).toBeGreaterThan(0);
        expect(reasons.some(reason => reason.includes('Missing required tag'))).toBe(true);
      });
    });
  });

  describe('groupDocumentsByTags()', () => {
    it('should group documents by tag patterns correctly', () => {
      const grouping = filter.groupDocumentsByTags(testDocuments);

      expect(grouping.groups).toBeDefined();
      expect(grouping.patterns).toBeDefined();
      expect(grouping.statistics).toBeDefined();

      // Should have groups for different tag combinations
      const groupKeys = Object.keys(grouping.groups);
      expect(groupKeys.length).toBeGreaterThan(0);

      // Verify document distribution
      const totalDocumentsInGroups = Object.values(grouping.groups)
        .reduce((sum, docs) => sum + docs.length, 0);
      expect(totalDocumentsInGroups).toBe(testDocuments.length);
    });

    it('should analyze tag patterns in collections', () => {
      const grouping = filter.groupDocumentsByTags(testDocuments);

      expect(grouping.patterns.mostCommon).toBeDefined();
      expect(grouping.patterns.leastCommon).toBeDefined();
      expect(grouping.patterns.unique).toBeDefined();
      
      // Statistics should be accurate
      expect(grouping.statistics.totalGroups).toBe(Object.keys(grouping.groups).length);
      expect(grouping.statistics.averageGroupSize).toBeGreaterThan(0);
      expect(grouping.statistics.largestGroupSize).toBeGreaterThanOrEqual(1);
      expect(grouping.statistics.smallestGroupSize).toBeGreaterThanOrEqual(1);
    });

    it('should detect synergistic tag combinations', () => {
      const grouping = filter.groupDocumentsByTags(testDocuments);

      if (grouping.patterns.synergistic && grouping.patterns.synergistic.length > 0) {
        grouping.patterns.synergistic.forEach(synergy => {
          expect(synergy.tags).toBeDefined();
          expect(synergy.tags.length).toBeGreaterThanOrEqual(2);
          expect(synergy.strength).toBeGreaterThan(0);
          expect(synergy.strength).toBeLessThanOrEqual(1);
          expect(synergy.documents).toBeGreaterThan(0);
        });
      }
    });

    it('should handle empty document collection', () => {
      const grouping = filter.groupDocumentsByTags([]);

      expect(grouping.groups).toEqual({});
      expect(grouping.statistics.totalGroups).toBe(0);
      expect(grouping.statistics.totalDocuments).toBe(0);
    });

    it('should handle documents with no tags', () => {
      const documentsWithoutTags = [
        {
          ...testDocuments[0],
          tags: {
            primary: [],
            audience: [],
            complexity: 'basic'
          }
        }
      ];

      const grouping = filter.groupDocumentsByTags(documentsWithoutTags);

      expect(grouping.groups['no-tags']).toBeDefined();
      expect(grouping.groups['no-tags']).toHaveLength(1);
    });
  });

  describe('analyzeTagCompatibility()', () => {
    it('should identify compatible tag combinations', () => {
      const analysis = (filter as any).analyzeTagCompatibility(['beginner', 'step-by-step', 'practical']);

      expect(analysis.compatible).toBe(true);
      expect(analysis.issues).toHaveLength(0);
      expect(analysis.suggestions).toBeDefined();
    });

    it('should identify incompatible tag combinations', () => {
      const analysis = (filter as any).analyzeTagCompatibility(['beginner', 'advanced']);

      expect(analysis.compatible).toBe(false);
      expect(analysis.issues.length).toBeGreaterThan(0);
      expect(analysis.issues[0]).toContain('incompatible');
    });

    it('should provide suggestions for improvement', () => {
      const analysis = (filter as any).analyzeTagCompatibility(['beginner', 'technical']);

      // This combination might not be explicitly incompatible but could have suggestions
      expect(analysis.suggestions).toBeDefined();
      if (analysis.suggestions.length > 0) {
        analysis.suggestions.forEach(suggestion => {
          expect(suggestion).toContain('consider');
        });
      }
    });
  });

  describe('getTagSynergies()', () => {
    it('should identify synergistic tag relationships', () => {
      const synergies = (filter as any).getTagSynergies();

      expect(synergies).toBeDefined();
      expect(Array.isArray(synergies)).toBe(true);

      if (synergies.length > 0) {
        synergies.forEach(synergy => {
          expect(synergy.tags).toBeDefined();
          expect(synergy.tags.length).toBeGreaterThanOrEqual(2);
          expect(synergy.strength).toBeGreaterThan(0);
          expect(synergy.strength).toBeLessThanOrEqual(1);
          expect(synergy.reason).toBeDefined();
        });
      }
    });

    it('should calculate synergy strength correctly', () => {
      const synergies = (filter as any).getTagSynergies();

      // Find beginner + step-by-step synergy
      const beginnerStepSynergy = synergies.find(s => 
        s.tags.includes('beginner') && s.tags.includes('step-by-step')
      );

      if (beginnerStepSynergy) {
        expect(beginnerStepSynergy.strength).toBeGreaterThan(0.5); // Should be strong synergy
      }
    });
  });

  describe('Performance optimization', () => {
    it('should handle large document collections efficiently', () => {
      const largeCollection = TestDataGenerator.generateDocuments(1000, {
        categories: ['guide', 'api', 'concept', 'example'],
        tags: ['beginner', 'intermediate', 'advanced', 'practical', 'technical']
      });

      const startTime = Date.now();

      const options = {
        requiredTags: ['practical'],
        excludedTags: ['advanced'],
        targetAudience: ['all-users']
      };

      const result = filter.filterDocuments(largeCollection, options);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process 1000 documents in less than 1 second
      expect(processingTime).toBeLessThan(1000);
      expect(result.filtered.length).toBeGreaterThanOrEqual(0);
    });

    it('should cache compatibility matrix for repeated operations', () => {
      const documents = testDocuments.slice(0, 2);
      const options = {
        requiredTags: ['beginner'],
        excludedTags: [],
        targetAudience: [],
        enforceTagCompatibility: true
      };

      // First call
      const startTime1 = Date.now();
      filter.filterDocuments(documents, options);
      const time1 = Date.now() - startTime1;

      // Second call should be faster due to caching
      const startTime2 = Date.now();
      filter.filterDocuments(documents, options);
      const time2 = Date.now() - startTime2;

      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined tags gracefully', () => {
      const documentsWithUndefinedTags = [
        {
          ...testDocuments[0],
          tags: undefined as any
        }
      ];

      const options = {
        requiredTags: ['beginner'],
        excludedTags: [],
        targetAudience: []
      };

      expect(() => filter.filterDocuments(documentsWithUndefinedTags, options))
        .not.toThrow();
    });

    it('should handle circular tag compatibility references', () => {
      // Create config with circular references
      const circularConfig = {
        ...mockConfig,
        tags: {
          ...mockConfig.tags,
          tagA: {
            name: 'Tag A',
            description: 'Tag A',
            weight: 1.0,
            compatibleWith: ['tagB'],
            audience: ['all-users']
          },
          tagB: {
            name: 'Tag B', 
            description: 'Tag B',
            weight: 1.0,
            compatibleWith: ['tagA'],
            audience: ['all-users']
          }
        }
      };

      const circularFilter = new TagBasedDocumentFilter(circularConfig);
      expect(circularFilter).toBeInstanceOf(TagBasedDocumentFilter);
    });

    it('should handle documents with duplicate tags', () => {
      const documentsWithDuplicates = [
        {
          ...testDocuments[0],
          tags: {
            primary: ['beginner', 'beginner', 'practical'], // Duplicate 'beginner'
            audience: ['new-users'],
            complexity: 'basic'
          }
        }
      ];

      const options = {
        requiredTags: ['beginner'],
        excludedTags: [],
        targetAudience: []
      };

      const result = filter.filterDocuments(documentsWithDuplicates, options);
      expect(result.filtered).toHaveLength(1);
    });

    it('should handle empty required tags with exclusions', () => {
      const options = {
        requiredTags: [],
        excludedTags: ['nonexistent-tag'],
        targetAudience: []
      };

      const result = filter.filterDocuments(testDocuments, options);
      
      // Should include all documents since none have the nonexistent tag
      expect(result.filtered).toHaveLength(testDocuments.length);
    });
  });
});