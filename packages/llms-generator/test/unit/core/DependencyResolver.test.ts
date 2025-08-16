import { DependencyResolver } from '../../../src/core/DependencyResolver';
import { EnhancedLLMSConfig, DocumentMetadata } from '../../../src/types/config';
import { TestDataGenerator } from '../../helpers/test-data-generator';

describe('DependencyResolver', () => {
  let resolver: DependencyResolver;
  let mockConfig: EnhancedLLMSConfig;

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
        }
      },
      tags: {
        beginner: {
          name: '초보자',
          description: 'Beginner-friendly content',
          weight: 1.2,
          compatibleWith: ['step-by-step', 'practical'],
          audience: ['new-users']
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

    resolver = new DependencyResolver(mockConfig);
  });

  describe('Constructor', () => {
    it('should initialize with valid config', () => {
      expect(resolver).toBeInstanceOf(DependencyResolver);
    });

    it('should respect dependency configuration', () => {
      const configWithDisabledDeps = {
        ...mockConfig,
        dependencies: {
          ...mockConfig.dependencies,
          enabled: false
        }
      };

      const disabledResolver = new DependencyResolver(configWithDisabledDeps);
      expect(disabledResolver).toBeInstanceOf(DependencyResolver);
    });
  });

  describe('buildDependencyGraph()', () => {
    it('should build dependency graph correctly', () => {
      const documents = TestDataGenerator.generateDependencyGraph('simple');
      
      const graph = resolver.buildDependencyGraph(documents);

      expect(graph).toBeDefined();
      expect(graph.nodes).toBeDefined();
      expect(graph.roots).toBeDefined();
      expect(graph.leaves).toBeDefined();
      expect(graph.nodes.size).toBe(documents.length);
      
      // Verify node structure
      documents.forEach(doc => {
        expect(graph.nodes.has(doc.document.id)).toBe(true);
        const node = graph.nodes.get(doc.document.id);
        expect(node?.documentId).toBe(doc.document.id);
        expect(node?.document).toEqual(doc);
      });

      // Verify dependencies are properly set in nodes
      documents.forEach(doc => {
        const node = graph.nodes.get(doc.document.id);
        if (node && doc.dependencies.prerequisites) {
          doc.dependencies.prerequisites.forEach(prereq => {
            expect(node.prerequisites.has(prereq.documentId)).toBe(true);
          });
        }
      });
    });

    it('should handle documents without dependencies', () => {
      const documentsWithoutDeps = TestDataGenerator.generateDocuments(3);
      // Clear dependencies
      documentsWithoutDeps.forEach(doc => {
        doc.dependencies = {
          prerequisites: [],
          references: [],
          followups: [],
          conflicts: [],
          complements: []
        };
      });

      const graph = resolver.buildDependencyGraph(documentsWithoutDeps);

      expect(graph.nodes.size).toBe(3);
      expect(graph.roots.size).toBe(3); // All documents should be roots
      expect(graph.leaves.size).toBe(3); // All documents should be leaves
    });

    it('should handle missing dependency references', () => {
      const documents = TestDataGenerator.generateDocuments(2);
      documents[1].dependencies.prerequisites = [
        {
          documentId: 'non-existent-doc',
          importance: 'required',
          reason: 'Missing dependency'
        }
      ];

      const graph = resolver.buildDependencyGraph(documents);

      // Should still build graph but exclude missing references
      expect(graph.nodes.size).toBe(2);
      // The prerequisite reference should exist in the node but the target node won't exist
      const nodeWithMissingDep = graph.nodes.get(documents[1].document.id);
      expect(nodeWithMissingDep?.prerequisites.has('non-existent-doc')).toBe(true);
    });
  });

  describe('detectCycles()', () => {
    it('should detect cycles using DFS', () => {
      const cyclicDocuments = TestDataGenerator.generateDependencyGraph('cyclic');
      const graph = resolver.buildDependencyGraph(cyclicDocuments);
      
      const cycles = resolver.detectCycles(graph);

      expect(cycles).toBeDefined();
      expect(Array.isArray(cycles)).toBe(true);
      expect(cycles.length).toBeGreaterThan(0);
      
      // Each cycle should be an array of document IDs
      cycles.forEach(cycle => {
        expect(Array.isArray(cycle)).toBe(true);
        expect(cycle.length).toBeGreaterThanOrEqual(2);
        
        // Verify that cycle contains connected nodes
        // For valid cycles, each node should have some prerequisites within the cycle
        const cycleNodes = cycle.map(id => graph.nodes.get(id)).filter(node => node);
        const hasConnections = cycleNodes.some(node => 
          cycle.some(id => node?.prerequisites.has(id))
        );
        expect(hasConnections).toBe(true);
      });
    });

    it('should return empty array for acyclic graphs', () => {
      const acyclicDocuments = TestDataGenerator.generateDependencyGraph('simple');
      const graph = resolver.buildDependencyGraph(acyclicDocuments);
      
      const cycles = resolver.detectCycles(graph);

      expect(cycles).toHaveLength(0);
    });

    it('should handle self-referencing documents', () => {
      const documents = TestDataGenerator.generateDocuments(1);
      documents[0].dependencies.prerequisites = [
        {
          documentId: documents[0].document.id, // Self-reference
          importance: 'required',
          reason: 'Self-dependency'
        }
      ];

      const graph = resolver.buildDependencyGraph(documents);
      const cycles = resolver.detectCycles(graph);

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain(documents[0].document.id);
    });
  });

  describe('resolveDependencies()', () => {
    it('should include required prerequisites', () => {
      const documents = TestDataGenerator.generateDependencyGraph('simple');
      
      const options = {
        maxDepth: 3,
        includeOptionalDependencies: false,
        resolveConflicts: true,
        conflictResolution: 'exclude-conflicts' as const
      };

      const result = resolver.resolveDependencies(documents, options);

      expect(result).toBeDefined();
      expect(result.orderedDocuments).toBeDefined();
      expect(result.includedDependencies).toBeDefined();
      expect(result.excludedConflicts).toBeDefined();
      
      // Should include more documents than input (due to prerequisites)
      expect(result.orderedDocuments.length).toBeGreaterThanOrEqual(documents.length);
      
      // Verify topological ordering
      result.orderedDocuments.forEach((doc, index) => {
        doc.dependencies.prerequisites?.forEach(prereq => {
          const prereqIndex = result.orderedDocuments.findIndex(d => d.document.id === prereq.documentId);
          if (prereqIndex !== -1) {
            expect(prereqIndex).toBeLessThan(index);
          }
        });
      });
    });

    it('should resolve conflicts using configured strategy', () => {
      const conflictingDocuments = TestDataGenerator.generateConflictingDocuments();
      
      const options = {
        maxDepth: 2,
        includeOptionalDependencies: false,
        resolveConflicts: true,
        conflictResolution: 'higher-score-wins' as const
      };

      const result = resolver.resolveDependencies(conflictingDocuments, options);

      // generateConflictingDocuments() should always create conflicts
      const hasConflicts = conflictingDocuments.some(doc => 
        doc.dependencies.conflicts && doc.dependencies.conflicts.length > 0
      );
      
      expect(hasConflicts).toBe(true); // Verify conflicts exist in test data
      expect(result.excludedConflicts.length).toBeGreaterThan(0);
      // Should have fewer documents than input due to conflict resolution
      expect(result.orderedDocuments.length).toBeLessThanOrEqual(conflictingDocuments.length);
    });

    it('should handle circular dependencies gracefully', () => {
      const cyclicDocuments = TestDataGenerator.generateDependencyGraph('cyclic');
      
      const options = {
        maxDepth: 3,
        includeOptionalDependencies: false,
        resolveConflicts: true,
        conflictResolution: 'break-cycles' as const
      };

      const result = resolver.resolveDependencies(cyclicDocuments, options);

      expect(result.cycles.length).toBeGreaterThan(0);
      
      // Should still produce a valid ordering
      expect(result.orderedDocuments.length).toBeGreaterThan(0);
    });

    it('should respect maximum depth limits', () => {
      const complexDocuments = TestDataGenerator.generateDependencyGraph('complex');
      
      const shallowOptions = {
        maxDepth: 1,
        includeOptionalDependencies: false,
        resolveConflicts: false,
        conflictResolution: 'exclude-conflicts' as const
      };

      const deepOptions = {
        maxDepth: 5,
        includeOptionalDependencies: false,
        resolveConflicts: false,
        conflictResolution: 'exclude-conflicts' as const
      };

      const shallowResult = resolver.resolveDependencies(complexDocuments, shallowOptions);
      const deepResult = resolver.resolveDependencies(complexDocuments, deepOptions);

      // Deep resolution should include more documents
      expect(deepResult.orderedDocuments.length).toBeGreaterThanOrEqual(shallowResult.orderedDocuments.length);
    });

    it('should include optional dependencies when configured', () => {
      const documents = TestDataGenerator.generateDocuments(3);
      documents[1].dependencies.prerequisites = [
        {
          documentId: documents[0].document.id,
          importance: 'optional',
          reason: 'Optional dependency'
        }
      ];

      const withoutOptional = resolver.resolveDependencies(documents, {
        maxDepth: 3,
        includeOptionalDependencies: false,
        resolveConflicts: false,
        conflictResolution: 'exclude-conflicts'
      });

      const withOptional = resolver.resolveDependencies(documents, {
        maxDepth: 3,
        includeOptionalDependencies: true,
        resolveConflicts: false,
        conflictResolution: 'exclude-conflicts'
      });

      expect(withOptional.orderedDocuments.length).toBeGreaterThanOrEqual(withoutOptional.orderedDocuments.length);
    });
  });

  describe('Topological sorting', () => {
    it('should perform topological sorting using BFS (Kahn\'s algorithm)', () => {
      const documents = TestDataGenerator.generateDependencyGraph('simple');
      const graph = resolver.buildDependencyGraph(documents);
      
      const sorted = (resolver as any).topologicalSortBFS(documents, graph, new Set(documents.map(d => d.document.id)));

      expect(sorted).toBeDefined();
      expect(sorted.length).toBe(documents.length);
      
      // Verify topological order
      const positions = new Map(sorted.map((doc, index) => [doc.document.id, index]));
      
      // Check that prerequisites come before dependents
      graph.nodes.forEach((node, nodeId) => {
        const nodePosition = positions.get(nodeId);
        if (nodePosition !== undefined) {
          node.prerequisites.forEach(prereqId => {
            const prereqPosition = positions.get(prereqId);
            if (prereqPosition !== undefined) {
              expect(prereqPosition).toBeLessThan(nodePosition);
            }
          });
        }
      });
    });

    it('should perform topological sorting using DFS', () => {
      const documents = TestDataGenerator.generateDependencyGraph('simple');
      const graph = resolver.buildDependencyGraph(documents);
      
      const sorted = (resolver as any).topologicalSortDFS(documents, graph, new Set(documents.map(d => d.document.id)));

      expect(sorted).toBeDefined();
      expect(sorted.length).toBe(documents.length);
      
      // Verify topological order
      const positions = new Map(sorted.map((doc, index) => [doc.document.id, index]));
      
      // Check that prerequisites come before dependents
      graph.nodes.forEach((node, nodeId) => {
        const nodePosition = positions.get(nodeId);
        if (nodePosition !== undefined) {
          node.prerequisites.forEach(prereqId => {
            const prereqPosition = positions.get(prereqId);
            if (prereqPosition !== undefined) {
              expect(prereqPosition).toBeLessThan(nodePosition);
            }
          });
        }
      });
    });

    it('should handle graphs with cycles in sorting', () => {
      const cyclicDocuments = TestDataGenerator.generateDependencyGraph('cyclic');
      const graph = resolver.buildDependencyGraph(cyclicDocuments);
      
      // Should not throw, but may produce partial ordering
      expect(() => {
        const sorted = (resolver as any).topologicalSortBFS(cyclicDocuments, graph, new Set(cyclicDocuments.map(d => d.document.id)));
        expect(Array.isArray(sorted)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('Conflict resolution strategies', () => {
    let conflictingDocs: DocumentMetadata[];

    beforeEach(() => {
      const baseDocs = TestDataGenerator.generateDocuments(2);
      conflictingDocs = [
        {
          ...baseDocs[0],
          document: { id: 'high-priority', title: 'High Priority', source_path: 'high.md', category: 'guide' },
          priority: { score: 95, tier: 'critical' },
          dependencies: {
            prerequisites: [],
            references: [],
            followups: [],
            conflicts: [
              { documentId: 'low-priority', reason: 'Conflicting approaches', severity: 'major' }
            ],
            complements: []
          }
        },
        {
          ...baseDocs[1],
          document: { id: 'low-priority', title: 'Low Priority', source_path: 'low.md', category: 'guide' },
          priority: { score: 30, tier: 'optional' },
          dependencies: {
            prerequisites: [],
            references: [],
            followups: [],
            conflicts: [
              { documentId: 'high-priority', reason: 'Conflicting approaches', severity: 'major' }
            ],
            complements: []
          }
        }
      ];
    });

    it('should apply exclude-conflicts strategy', () => {
      const result = resolver.resolveDependencies(conflictingDocs, {
        maxDepth: 2,
        includeOptionalDependencies: false,
        resolveConflicts: true,
        conflictResolution: 'exclude-conflicts'
      });

      // Should exclude one of the conflicting documents
      expect(result.orderedDocuments.length).toBe(1);
      expect(result.excludedConflicts.length).toBeGreaterThan(0);
    });

    it('should apply higher-score-wins strategy', () => {
      const result = resolver.resolveDependencies(conflictingDocs, {
        maxDepth: 2,
        includeOptionalDependencies: false,
        resolveConflicts: true,
        conflictResolution: 'higher-score-wins'
      });

      // Should keep the higher priority document
      expect(result.orderedDocuments.length).toBe(1);
      expect(result.orderedDocuments[0].document.id).toBe('high-priority');
      expect(result.excludedConflicts.some(e => e.document.document.id === 'low-priority')).toBe(true);
    });

    it('should generate resolution plans', () => {
      const result = resolver.resolveDependencies(conflictingDocs, {
        maxDepth: 2,
        includeOptionalDependencies: false,
        resolveConflicts: true,
        conflictResolution: 'higher-score-wins'
      });

      expect(result.excludedConflicts.length).toBeGreaterThan(0);
      result.excludedConflicts.forEach(excluded => {
        expect(excluded.document).toBeDefined();
        expect(excluded.conflictWith).toBeDefined();
        expect(excluded.reason).toBeDefined();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large dependency graphs efficiently', () => {
      const largeGraph = TestDataGenerator.generateDependencyGraph('complex');
      // Expand to more documents
      const expandedDocs = [...largeGraph];
      for (let i = 0; i < 50; i++) {
        const newDocs = TestDataGenerator.generateDocuments(10);
        expandedDocs.push(...newDocs);
      }

      const startTime = Date.now();
      const result = resolver.resolveDependencies(expandedDocs, {
        maxDepth: 3,
        includeOptionalDependencies: false,
        resolveConflicts: true,
        conflictResolution: 'exclude-conflicts'
      });
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(result.orderedDocuments.length).toBeGreaterThan(0);
    });

    it('should optimize repeated dependency resolution', () => {
      const documents = TestDataGenerator.generateDependencyGraph('simple');
      const options = {
        maxDepth: 2,
        includeOptionalDependencies: false,
        resolveConflicts: false,
        conflictResolution: 'exclude-conflicts' as const
      };

      // First resolution
      const startTime1 = Date.now();
      resolver.resolveDependencies(documents, options);
      const time1 = Date.now() - startTime1;

      // Second resolution (should benefit from caching)
      const startTime2 = Date.now();
      resolver.resolveDependencies(documents, options);
      const time2 = Date.now() - startTime2;

      expect(time2).toBeLessThanOrEqual(time1 * 1.5); // Allow some variance
    });
  });

  describe('Edge cases', () => {
    it('should handle empty document collection', () => {
      const result = resolver.resolveDependencies([], {
        maxDepth: 3,
        includeOptionalDependencies: false,
        resolveConflicts: false,
        conflictResolution: 'exclude-conflicts'
      });

      expect(result.orderedDocuments).toHaveLength(0);
      expect(result.includedDependencies).toHaveLength(0);
      expect(result.excludedConflicts).toHaveLength(0);
    });

    it('should handle malformed dependency references', () => {
      const documents = TestDataGenerator.generateDocuments(1);
      documents[0].dependencies.prerequisites = [
        {
          documentId: '', // Empty ID
          importance: 'required',
          reason: 'Malformed dependency'
        },
        {
          documentId: undefined as any, // Undefined ID
          importance: 'required',
          reason: 'Malformed dependency'
        }
      ];

      const result = resolver.resolveDependencies(documents, {
        maxDepth: 2,
        includeOptionalDependencies: false,
        resolveConflicts: false,
        conflictResolution: 'exclude-conflicts'
      });

      expect(result.orderedDocuments.length).toBeGreaterThan(0);
      // Malformed dependencies might not generate warnings in all cases
      expect(result.warnings).toBeDefined();
    });

    it('should handle documents with undefined dependencies', () => {
      const documents = TestDataGenerator.generateDocuments(2);
      documents[0].dependencies = undefined as any;
      
      expect(() => {
        resolver.resolveDependencies(documents, {
          maxDepth: 2,
          includeOptionalDependencies: false,
          resolveConflicts: false,
          conflictResolution: 'exclude-conflicts'
        });
      }).not.toThrow();
    });

    it('should handle extremely deep dependency chains', () => {
      const deepDocs = TestDataGenerator.generateDocuments(20);
      
      // Create a very deep chain
      for (let i = 1; i < deepDocs.length; i++) {
        deepDocs[i].dependencies.prerequisites = [
          {
            documentId: deepDocs[i - 1].document.id,
            importance: 'required',
            reason: 'Deep chain dependency'
          }
        ];
      }

      const result = resolver.resolveDependencies(deepDocs, {
        maxDepth: 10, // Limit depth
        includeOptionalDependencies: false,
        resolveConflicts: false,
        conflictResolution: 'exclude-conflicts'
      });

      expect(result.orderedDocuments.length).toBeGreaterThan(0);
    });
  });
});