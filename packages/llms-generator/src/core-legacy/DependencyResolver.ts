/**
 * Dependency Resolver - handles document dependency resolution and ordering
 */

import type { 
  DocumentMetadata, 
  EnhancedLLMSConfig, 
  DependencyConfig,
  DependencyRuleConfig
} from '../types/config.js';

export interface DependencyNode {
  documentId: string;
  document: DocumentMetadata;
  prerequisites: Set<string>;
  dependents: Set<string>;
  references: Set<string>;
  followups: Set<string>;
  conflicts: Set<string>;
  complements: Set<string>;
  depth: number;
  visited: boolean;
  inPath: boolean; // For cycle detection
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  roots: Set<string>; // Documents with no prerequisites
  leaves: Set<string>; // Documents with no dependents
  cycles: string[][];
  components: string[][]; // Strongly connected components
}

export interface ResolutionResult {
  orderedDocuments: DocumentMetadata[];
  includedDependencies: DocumentMetadata[];
  excludedConflicts: Array<{
    document: DocumentMetadata;
    conflictWith: string[];
    reason: string;
  }>;
  cycles: string[][];
  warnings: string[];
  statistics: {
    totalProcessed: number;
    dependenciesResolved: number;
    conflictsExcluded: number;
    averageDepth: number;
  };
}

export interface ResolutionOptions {
  maxDepth?: number;
  includeOptionalDependencies?: boolean;
  resolveConflicts?: boolean;
  conflictResolution?: 'exclude-conflicts' | 'higher-score-wins' | 'exclude-both' | 'manual-review';
  allowCycles?: boolean;
  prioritizeOrder?: 'breadth-first' | 'depth-first' | 'priority-based';
}

export class DependencyResolver {
  private config: EnhancedLLMSConfig;
  private dependencyConfig: DependencyConfig;

  constructor(config: EnhancedLLMSConfig) {
    this.config = config;
    this.dependencyConfig = config.dependencies;
  }

  /**
   * Resolve dependencies for a set of documents
   */
  resolveDependencies(
    documents: DocumentMetadata[],
    options: ResolutionOptions = {}
  ): ResolutionResult {
    const {
      maxDepth = 3,
      includeOptionalDependencies = false,
      resolveConflicts = true,
      conflictResolution = this.dependencyConfig.conflictResolution.strategy,
      allowCycles = false,
      prioritizeOrder = 'breadth-first'
    } = options;

    // Build dependency graph
    const graph = this.buildDependencyGraph(documents);
    
    // Detect cycles
    const cycles = this.detectCycles(graph);
    const warnings: string[] = [];

    if (cycles.length > 0) {
      warnings.push(`${cycles.length} dependency cycles detected`);
      if (!allowCycles) {
        warnings.push('Cycles will be broken by excluding lower-priority documents');
      }
    }

    // Resolve conflicts
    const { resolvedDocuments, excludedConflicts } = resolveConflicts 
      ? this.resolveConflicts(documents, graph, conflictResolution)
      : { resolvedDocuments: documents, excludedConflicts: [] };

    // Add required dependencies
    const { finalDocuments, addedDependencies } = this.addRequiredDependencies(
      resolvedDocuments,
      graph,
      maxDepth,
      includeOptionalDependencies
    );

    // Order documents based on dependencies
    const orderedDocuments = this.orderDocumentsByDependencies(
      finalDocuments,
      graph,
      prioritizeOrder
    );

    // Calculate statistics
    const statistics = this.calculateStatistics(
      documents,
      finalDocuments,
      addedDependencies,
      excludedConflicts,
      graph
    );

    return {
      orderedDocuments,
      includedDependencies: addedDependencies,
      excludedConflicts,
      cycles: allowCycles ? [] : cycles,
      warnings,
      statistics
    };
  }

  /**
   * Build dependency graph from documents
   */
  buildDependencyGraph(documents: DocumentMetadata[]): DependencyGraph {
    const nodes = new Map<string, DependencyNode>();
    
    // Create nodes
    for (const document of documents) {
      const node: DependencyNode = {
        documentId: document.document.id,
        document,
        prerequisites: new Set(),
        dependents: new Set(),
        references: new Set(),
        followups: new Set(),
        conflicts: new Set(),
        complements: new Set(),
        depth: 0,
        visited: false,
        inPath: false
      };
      
      // Add direct relationships (with null safety)
      if (document.dependencies) {
        document.dependencies.prerequisites?.forEach(prereq => 
          node.prerequisites.add(prereq.documentId)
        );
        document.dependencies.references?.forEach(ref => 
          node.references.add(ref.documentId)
        );
        document.dependencies.followups?.forEach(followup => 
          node.followups.add(followup.documentId)
        );
        document.dependencies.conflicts?.forEach(conflict => 
          node.conflicts.add(conflict.documentId)
        );
        document.dependencies.complements?.forEach(complement => 
          node.complements.add(complement.documentId)
        );
      }

      nodes.set(document.document.id, node);
    }

    // Build reverse relationships (dependents)
    for (const node of nodes.values()) {
      for (const prereqId of node.prerequisites) {
        const prereqNode = nodes.get(prereqId);
        if (prereqNode) {
          prereqNode.dependents.add(node.documentId);
        }
      }
    }

    // Calculate depths and find roots/leaves
    const roots = new Set<string>();
    const leaves = new Set<string>();

    for (const [id, node] of nodes) {
      if (node.prerequisites.size === 0) {
        roots.add(id);
      }
      if (node.dependents.size === 0) {
        leaves.add(id);
      }
    }

    // Calculate depths using BFS from roots
    this.calculateDepths(nodes, roots);

    return {
      nodes,
      roots,
      leaves,
      cycles: [],
      components: []
    };
  }

  /**
   * Detect dependency cycles using DFS
   */
  detectCycles(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const path: string[] = [];

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        this.detectCyclesFromNode(nodeId, graph, visited, path, cycles);
      }
    }

    return cycles;
  }

  /**
   * DFS helper for cycle detection
   */
  private detectCyclesFromNode(
    nodeId: string,
    graph: DependencyGraph,
    visited: Set<string>,
    path: string[],
    cycles: string[][]
  ): void {
    const node = graph.nodes.get(nodeId);
    if (!node) return;

    if (path.includes(nodeId)) {
      // Found a cycle
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart).concat([nodeId]);
      cycles.push(cycle);
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    path.push(nodeId);

    // Visit prerequisites (dependencies)
    for (const prereqId of node.prerequisites) {
      this.detectCyclesFromNode(prereqId, graph, visited, [...path], cycles);
    }

    path.pop();
  }

  /**
   * Resolve conflicts between documents
   */
  resolveConflicts(
    documents: DocumentMetadata[],
    graph: DependencyGraph,
    strategy: string
  ): { 
    resolvedDocuments: DocumentMetadata[];
    excludedConflicts: Array<{
      document: DocumentMetadata;
      conflictWith: string[];
      reason: string;
    }>;
  } {
    const resolvedDocuments: DocumentMetadata[] = [];
    const excludedConflicts: Array<{
      document: DocumentMetadata;
      conflictWith: string[];
      reason: string;
    }> = [];
    const included = new Set<string>();

    // Sort documents by priority for conflict resolution
    const sortedDocs = [...documents].sort((a, b) => b.priority.score - a.priority.score);

    for (const document of sortedDocs) {
      const node = graph.nodes.get(document.document.id);
      if (!node) continue;

      // Check for conflicts with already included documents
      const conflicts = Array.from(node.conflicts).filter(conflictId => included.has(conflictId));

      if (conflicts.length === 0) {
        // No conflicts, include the document
        resolvedDocuments.push(document);
        included.add(document.document.id);
      } else {
        // Handle conflict based on strategy
        switch (strategy) {
          case 'exclude-conflicts':
            excludedConflicts.push({
              document,
              conflictWith: conflicts,
              reason: 'Conflicts with higher priority documents'
            });
            break;

          case 'higher-score-wins':
            // Already handled by sorting - higher priority documents win
            excludedConflicts.push({
              document,
              conflictWith: conflicts,
              reason: 'Lower priority than conflicting documents'
            });
            break;

          case 'exclude-both':
            // Remove conflicting documents and exclude current one
            const conflictingDocs = conflicts.map(id => 
              resolvedDocuments.findIndex(doc => doc.document.id === id)
            ).filter(index => index !== -1);

            // Remove conflicting documents from resolved list
            for (const index of conflictingDocs.sort((a, b) => b - a)) {
              const removed = resolvedDocuments.splice(index, 1)[0];
              included.delete(removed.document.id);
              excludedConflicts.push({
                document: removed,
                conflictWith: [document.document.id],
                reason: 'Mutual conflict resolution'
              });
            }

            excludedConflicts.push({
              document,
              conflictWith: conflicts,
              reason: 'Mutual conflict resolution'
            });
            break;

          case 'manual-review':
            // For now, exclude and add warning
            excludedConflicts.push({
              document,
              conflictWith: conflicts,
              reason: 'Requires manual review'
            });
            break;
        }
      }
    }

    return { resolvedDocuments, excludedConflicts };
  }

  /**
   * Add required dependencies to document set
   */
  addRequiredDependencies(
    documents: DocumentMetadata[],
    graph: DependencyGraph,
    maxDepth: number,
    includeOptional: boolean
  ): { finalDocuments: DocumentMetadata[]; addedDependencies: DocumentMetadata[] } {
    const included = new Set(documents.map(doc => doc.document.id));
    const addedDependencies: DocumentMetadata[] = [];
    const queue: Array<{ documentId: string; depth: number }> = [];

    // Initialize queue with selected documents
    for (const doc of documents) {
      queue.push({ documentId: doc.document.id, depth: 0 });
    }

    while (queue.length > 0) {
      const { documentId, depth } = queue.shift()!;
      
      if (depth >= maxDepth) continue;

      const node = graph.nodes.get(documentId);
      if (!node) continue;

      // Process prerequisites
      for (const prereqId of node.prerequisites) {
        if (included.has(prereqId)) continue;

        const prereqNode = graph.nodes.get(prereqId);
        if (!prereqNode) continue;

        // Check if this prerequisite should be included
        const prereqRelation = node.document.dependencies.prerequisites.find(
          p => p.documentId === prereqId
        );

        if (prereqRelation) {
          const rule = this.dependencyConfig.rules.prerequisite;
          const shouldInclude = rule.autoInclude || 
            (includeOptional && prereqRelation.importance !== 'optional');

          if (shouldInclude) {
            included.add(prereqId);
            addedDependencies.push(prereqNode.document);
            queue.push({ documentId: prereqId, depth: depth + 1 });
          }
        }
      }

      // Process complements if space permits
      if (includeOptional) {
        for (const complementId of node.complements) {
          if (included.has(complementId)) continue;

          const complementNode = graph.nodes.get(complementId);
          if (!complementNode) continue;

          const rule = this.dependencyConfig.rules.complement;
          if (rule.autoInclude) {
            included.add(complementId);
            addedDependencies.push(complementNode.document);
            queue.push({ documentId: complementId, depth: depth + 1 });
          }
        }
      }
    }

    const finalDocuments = [
      ...documents,
      ...addedDependencies
    ];

    return { finalDocuments, addedDependencies };
  }

  /**
   * Order documents based on dependencies
   */
  orderDocumentsByDependencies(
    documents: DocumentMetadata[],
    graph: DependencyGraph,
    strategy: 'breadth-first' | 'depth-first' | 'priority-based'
  ): DocumentMetadata[] {
    const documentIds = new Set(documents.map(doc => doc.document.id));
    
    switch (strategy) {
      case 'breadth-first':
        return this.topologicalSortBFS(documents, graph, documentIds);
      
      case 'depth-first':
        return this.topologicalSortDFS(documents, graph, documentIds);
      
      case 'priority-based':
        return this.priorityBasedOrder(documents, graph, documentIds);
      
      default:
        return documents;
    }
  }

  /**
   * Topological sort using BFS (Kahn's algorithm)
   */
  private topologicalSortBFS(
    documents: DocumentMetadata[],
    graph: DependencyGraph,
    documentIds: Set<string>
  ): DocumentMetadata[] {
    const result: DocumentMetadata[] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Calculate in-degrees for documents in our set
    for (const docId of documentIds) {
      const node = graph.nodes.get(docId);
      if (!node) continue;

      const relevantPrereqs = Array.from(node.prerequisites).filter(id => documentIds.has(id));
      inDegree.set(docId, relevantPrereqs.length);

      if (relevantPrereqs.length === 0) {
        queue.push(docId);
      }
    }

    // Process nodes
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = graph.nodes.get(currentId);
      
      if (currentNode) {
        result.push(currentNode.document);

        // Update in-degrees of dependents
        for (const dependentId of currentNode.dependents) {
          if (!documentIds.has(dependentId)) continue;

          const currentInDegree = inDegree.get(dependentId) || 0;
          const newInDegree = currentInDegree - 1;
          inDegree.set(dependentId, newInDegree);

          if (newInDegree === 0) {
            queue.push(dependentId);
          }
        }
      }
    }

    // Add any remaining documents (in case of cycles)
    const resultIds = new Set(result.map(doc => doc.document.id));
    for (const doc of documents) {
      if (!resultIds.has(doc.document.id)) {
        result.push(doc);
      }
    }

    return result;
  }

  /**
   * Topological sort using DFS
   */
  private topologicalSortDFS(
    documents: DocumentMetadata[],
    graph: DependencyGraph,
    documentIds: Set<string>
  ): DocumentMetadata[] {
    const result: DocumentMetadata[] = [];
    const visited = new Set<string>();
    const stack: DocumentMetadata[] = [];

    const visit = (docId: string) => {
      if (visited.has(docId)) return;
      
      visited.add(docId);
      const node = graph.nodes.get(docId);
      if (!node) return;

      // Visit prerequisites first
      for (const prereqId of node.prerequisites) {
        if (documentIds.has(prereqId)) {
          visit(prereqId);
        }
      }

      stack.push(node.document);
    };

    // Visit all documents
    for (const docId of documentIds) {
      visit(docId);
    }

    return stack;
  }

  /**
   * Priority-based ordering with dependency constraints
   */
  private priorityBasedOrder(
    documents: DocumentMetadata[],
    graph: DependencyGraph,
    documentIds: Set<string>
  ): DocumentMetadata[] {
    // Group documents by dependency levels
    const levels: DocumentMetadata[][] = [];
    const processed = new Set<string>();

    while (processed.size < documentIds.size) {
      const currentLevel: DocumentMetadata[] = [];
      
      for (const doc of documents) {
        if (processed.has(doc.document.id)) continue;

        const node = graph.nodes.get(doc.document.id);
        if (!node) continue;

        // Check if all prerequisites are already processed
        const unprocessedPrereqs = Array.from(node.prerequisites)
          .filter(prereqId => documentIds.has(prereqId) && !processed.has(prereqId));

        if (unprocessedPrereqs.length === 0) {
          currentLevel.push(doc);
        }
      }

      if (currentLevel.length === 0) {
        // Break cycle by including highest priority unprocessed document
        const remaining = documents.filter(doc => !processed.has(doc.document.id));
        if (remaining.length > 0) {
          const highest = remaining.reduce((max, doc) => 
            doc.priority.score > max.priority.score ? doc : max
          );
          currentLevel.push(highest);
        }
      }

      // Sort current level by priority
      currentLevel.sort((a, b) => b.priority.score - a.priority.score);
      levels.push(currentLevel);

      // Mark as processed
      currentLevel.forEach(doc => processed.add(doc.document.id));
    }

    return levels.flat();
  }

  /**
   * Calculate depths using BFS from roots
   */
  private calculateDepths(nodes: Map<string, DependencyNode>, roots: Set<string>): void {
    const queue: Array<{ id: string; depth: number }> = [];
    
    // Initialize with roots
    for (const rootId of roots) {
      const node = nodes.get(rootId);
      if (node) {
        node.depth = 0;
        queue.push({ id: rootId, depth: 0 });
      }
    }

    // BFS to calculate depths
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      const node = nodes.get(id);
      
      if (!node) continue;

      for (const dependentId of node.dependents) {
        const dependent = nodes.get(dependentId);
        if (dependent && dependent.depth < depth + 1) {
          dependent.depth = depth + 1;
          queue.push({ id: dependentId, depth: depth + 1 });
        }
      }
    }
  }

  /**
   * Calculate resolution statistics
   */
  private calculateStatistics(
    originalDocuments: DocumentMetadata[],
    finalDocuments: DocumentMetadata[],
    addedDependencies: DocumentMetadata[],
    excludedConflicts: Array<{ document: DocumentMetadata; conflictWith: string[]; reason: string }>,
    graph: DependencyGraph
  ): ResolutionResult['statistics'] {
    const depths = Array.from(graph.nodes.values()).map(node => node.depth);
    const averageDepth = depths.length > 0 ? depths.reduce((sum, depth) => sum + depth, 0) / depths.length : 0;

    return {
      totalProcessed: originalDocuments.length,
      dependenciesResolved: addedDependencies.length,
      conflictsExcluded: excludedConflicts.length,
      averageDepth
    };
  }

  /**
   * Get dependency information for a document
   */
  getDependencyInfo(documentId: string, documents: DocumentMetadata[]): {
    document: DocumentMetadata | null;
    prerequisites: DocumentMetadata[];
    dependents: DocumentMetadata[];
    conflicts: DocumentMetadata[];
    complements: DocumentMetadata[];
    depth: number;
  } {
    const graph = this.buildDependencyGraph(documents);
    const node = graph.nodes.get(documentId);
    
    if (!node) {
      return {
        document: null,
        prerequisites: [],
        dependents: [],
        conflicts: [],
        complements: [],
        depth: 0
      };
    }

    const findDocuments = (ids: Set<string>): DocumentMetadata[] => 
      Array.from(ids).map(id => graph.nodes.get(id)?.document).filter(Boolean) as DocumentMetadata[];

    return {
      document: node.document,
      prerequisites: findDocuments(node.prerequisites),
      dependents: findDocuments(node.dependents),
      conflicts: findDocuments(node.conflicts),
      complements: findDocuments(node.complements),
      depth: node.depth
    };
  }

  /**
   * Update dependency configuration
   */
  updateDependencyConfig(updates: Partial<DependencyConfig>): void {
    this.dependencyConfig = { ...this.dependencyConfig, ...updates };
    this.config.dependencies = this.dependencyConfig;
  }
}