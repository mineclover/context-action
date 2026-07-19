import { compareStableText, type SymbolRef, symbolRefKey } from '@sem-foundation/contracts';

import {
  type ContextScope,
  type ContextScopeEdge,
  type ContextScopeGroup,
  parseContextScope,
} from './context-scope';
import type {
  ContextScopeHistoryBase,
  ContextScopeHistoryEntry,
  ContextScopeHistoryReport,
} from './context-scope-history';

export const CONTEXT_SCOPE_BRANCH_COMPARE_SCHEMA = 'sem-doc-context-scope-branch-compare.v1' as const;

export interface ContextScopeBranchHistoryInput {
  readonly base: ContextScopeHistoryBase;
  readonly entries: readonly ContextScopeHistoryEntry[];
}

export interface ContextScopeBranchChanges {
  readonly commits: number;
  readonly head?: string;
  readonly nodes: readonly SymbolRef[];
  readonly edges: readonly ContextScopeEdge[];
  readonly groups: readonly ContextScopeGroup[];
}

export interface ContextScopeBranchComparison {
  readonly schemaVersion: typeof CONTEXT_SCOPE_BRANCH_COMPARE_SCHEMA;
  readonly context: ContextScope['context'];
  readonly base: {
    readonly commit: string;
    readonly revision: ContextScope['source']['revision'];
  };
  readonly left: ContextScopeBranchChanges;
  readonly right: ContextScopeBranchChanges;
  readonly intersection: {
    readonly nodes: readonly SymbolRef[];
    readonly edges: readonly ContextScopeEdge[];
    readonly groups: readonly ContextScopeGroup[];
  };
  readonly summary: {
    readonly leftNodes: number;
    readonly rightNodes: number;
    readonly commonNodes: number;
    readonly leftEdges: number;
    readonly rightEdges: number;
    readonly commonEdges: number;
    readonly commonGroups: number;
  };
}

export function compareContextScopeBranches(
  leftInput: ContextScopeBranchHistoryInput | ContextScopeHistoryReport,
  rightInput: ContextScopeBranchHistoryInput | ContextScopeHistoryReport,
): ContextScopeBranchComparison {
  const left = normalizeHistory(leftInput);
  const right = normalizeHistory(rightInput);
  const baseScope = parseContextScope(left.base.scope);
  const rightBase = parseContextScope(right.base.scope);
  assertMatchingContext(baseScope, rightBase);
  const leftChanges = collectBranchChanges(left);
  const rightChanges = collectBranchChanges(right);
  const commonNodes = intersectMaps(leftChanges.nodes, rightChanges.nodes);
  const commonEdges = intersectMaps(leftChanges.edges, rightChanges.edges);
  const commonGroups = intersectMaps(leftChanges.groups, rightChanges.groups);
  return {
    schemaVersion: CONTEXT_SCOPE_BRANCH_COMPARE_SCHEMA,
    context: baseScope.context,
    base: {
      commit: left.base.commit,
      revision: baseScope.source.revision,
    },
    left: materializeChanges(leftChanges, left.entries.length, left.entries.at(-1)?.commit),
    right: materializeChanges(rightChanges, right.entries.length, right.entries.at(-1)?.commit),
    intersection: {
      nodes: sortedValues(commonNodes, symbolRefKey),
      edges: sortedValues(commonEdges, edgeKey),
      groups: sortedValues(commonGroups, (group) => group.id),
    },
    summary: {
      leftNodes: leftChanges.nodes.size,
      rightNodes: rightChanges.nodes.size,
      commonNodes: commonNodes.size,
      leftEdges: leftChanges.edges.size,
      rightEdges: rightChanges.edges.size,
      commonEdges: commonEdges.size,
      commonGroups: commonGroups.size,
    },
  };
}

export function renderContextScopeBranchComparisonText(
  comparison: ContextScopeBranchComparison,
): string {
  return `${[
    `Context Scope Branch Comparison: ${comparison.context.id}`,
    `Base: ${comparison.base.commit}`,
    `Nodes: left ${comparison.summary.leftNodes} | right ${comparison.summary.rightNodes} | intersection ${comparison.summary.commonNodes}`,
    `Edges: left ${comparison.summary.leftEdges} | right ${comparison.summary.rightEdges} | intersection ${comparison.summary.commonEdges}`,
    `Common symbols`,
    ...comparison.intersection.nodes.map(
      (node) => `  [${node.projectId}] ${node.filePath} :: ${node.entityId}`,
    ),
  ].join('\n')}\n`;
}

function normalizeHistory(
  input: ContextScopeBranchHistoryInput | ContextScopeHistoryReport,
): ContextScopeBranchHistoryInput {
  return {
    base: input.base,
    entries: input.entries,
  };
}

interface CollectedBranchChanges {
  readonly nodes: Map<string, SymbolRef>;
  readonly edges: Map<string, ContextScopeEdge>;
  readonly groups: Map<string, ContextScopeGroup>;
}

function collectBranchChanges(history: ContextScopeBranchHistoryInput): CollectedBranchChanges {
  const nodes = new Map<string, SymbolRef>();
  const edges = new Map<string, ContextScopeEdge>();
  const groups = new Map<string, ContextScopeGroup>();
  const knownNodes = new Map(
    parseContextScope(history.base.scope).nodes.map((node) => [symbolRefKey(node), node]),
  );
  for (const entry of history.entries) {
    const scope = parseContextScope(entry.scope);
    for (const node of scope.nodes) knownNodes.set(symbolRefKey(node), node);
    for (const node of entry.diff?.addedNodes ?? []) nodes.set(symbolRefKey(node), node);
    for (const node of entry.diff?.removedNodes ?? []) nodes.set(symbolRefKey(node), node);
    for (const edge of entry.diff?.addedEdges ?? []) edges.set(edgeKey(edge), edge);
    for (const edge of entry.diff?.removedEdges ?? []) edges.set(edgeKey(edge), edge);
    for (const group of entry.diff?.addedGroups ?? []) groups.set(group.id, group);
    for (const group of entry.diff?.removedGroups ?? []) groups.set(group.id, group);
    for (const change of entry.diff?.changedGroups ?? []) {
      if (change.after !== undefined) groups.set(change.id, change.after);
      else if (change.before !== undefined) groups.set(change.id, change.before);
    }
    for (const edge of [
      ...(entry.diff?.addedEdges ?? []),
      ...(entry.diff?.removedEdges ?? []),
    ]) {
      const from = knownNodes.get(edge.from);
      const to = knownNodes.get(edge.to);
      if (from !== undefined) nodes.set(symbolRefKey(from), from);
      if (to !== undefined) nodes.set(symbolRefKey(to), to);
    }
    for (const group of [
      ...(entry.diff?.addedGroups ?? []),
      ...(entry.diff?.removedGroups ?? []),
      ...(entry.diff?.changedGroups.flatMap((change) => [change.before, change.after]) ?? []),
    ]) {
      if (group === undefined) continue;
      for (const nodeKey of group.memberNodeKeys) {
        const node = knownNodes.get(nodeKey);
        if (node !== undefined) nodes.set(symbolRefKey(node), node);
      }
    }
  }
  return { nodes, edges, groups };
}

function materializeChanges(
  changes: CollectedBranchChanges,
  commits: number,
  head: string | undefined,
): ContextScopeBranchChanges {
  return {
    commits,
    ...(head === undefined ? {} : { head }),
    nodes: sortedValues(changes.nodes, symbolRefKey),
    edges: sortedValues(changes.edges, edgeKey),
    groups: sortedValues(changes.groups, (group) => group.id),
  };
}

function intersectMaps<T>(left: Map<string, T>, right: Map<string, T>): Map<string, T> {
  const result = new Map<string, T>();
  for (const [identity, value] of left) if (right.has(identity)) result.set(identity, value);
  return result;
}

function sortedValues<T>(values: Map<string, T>, key: (item: T) => string): T[] {
  return [...values.values()].sort((left, right) => compareStableText(key(left), key(right)));
}

function edgeKey(edge: ContextScopeEdge): string {
  return `${edge.from}\0${edge.to}\0${edge.kind}\0${edge.evidence.provider}\0${edge.evidence.relation}`;
}

function assertMatchingContext(left: ContextScope, right: ContextScope): void {
  if (left.context.id !== right.context.id || left.context.kind !== right.context.kind) {
    throw new TypeError('branch comparison requires matching context identity');
  }
  if (left.source.repositoryRoot !== right.source.repositoryRoot
    || left.source.projectId !== right.source.projectId) {
    throw new TypeError('branch comparison requires matching repository and project identity');
  }
  if (left.source.revision.gitHead !== right.source.revision.gitHead) {
    throw new TypeError('branch comparison requires the same base commit');
  }
}
