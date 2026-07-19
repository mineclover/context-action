import { compareStableText, type SymbolRef, symbolRefKey } from '@sem-foundation/contracts';

import {
  type ContextScope,
  type ContextScopeEdge,
  type ContextScopeGroup,
  parseContextScope,
} from './context-scope';

export const CONTEXT_SCOPE_DIFF_SCHEMA = 'sem-doc-context-scope-diff.v1' as const;

export interface ContextScopeGroupChange {
  readonly id: string;
  readonly before?: ContextScopeGroup;
  readonly after?: ContextScopeGroup;
}

export interface ContextScopeDiff {
  readonly schemaVersion: typeof CONTEXT_SCOPE_DIFF_SCHEMA;
  readonly context: ContextScope['context'];
  readonly before: {
    readonly repositoryRoot: string;
    readonly revision: ContextScope['source']['revision'];
    readonly workContextDigest: string;
  };
  readonly after: {
    readonly repositoryRoot: string;
    readonly revision: ContextScope['source']['revision'];
    readonly workContextDigest: string;
  };
  readonly addedNodes: readonly SymbolRef[];
  readonly removedNodes: readonly SymbolRef[];
  readonly addedEdges: readonly ContextScopeEdge[];
  readonly removedEdges: readonly ContextScopeEdge[];
  readonly addedGroups: readonly ContextScopeGroup[];
  readonly removedGroups: readonly ContextScopeGroup[];
  readonly changedGroups: readonly ContextScopeGroupChange[];
  readonly summary: {
    readonly addedNodes: number;
    readonly removedNodes: number;
    readonly addedEdges: number;
    readonly removedEdges: number;
    readonly addedGroups: number;
    readonly removedGroups: number;
    readonly changedGroups: number;
  };
}

export function diffContextScopes(
  beforeInput: ContextScope | unknown,
  afterInput: ContextScope | unknown,
): ContextScopeDiff {
  const before = parseContextScope(beforeInput);
  const after = parseContextScope(afterInput);
  if (before.context.id !== after.context.id || before.context.kind !== after.context.kind) {
    throw new TypeError('ContextScope diff requires matching context identity');
  }
  if (before.source.repositoryRoot !== after.source.repositoryRoot
    || before.source.projectId !== after.source.projectId) {
    throw new TypeError('ContextScope diff requires matching repository and project identity');
  }
  const beforeNodes = byKey(before.nodes, symbolRefKey);
  const afterNodes = byKey(after.nodes, symbolRefKey);
  const addedNodes = sortedValues(afterNodes, beforeNodes, symbolRefKey);
  const removedNodes = sortedValues(beforeNodes, afterNodes, symbolRefKey);
  const beforeEdges = byKey(before.edges, edgeKey);
  const afterEdges = byKey(after.edges, edgeKey);
  const addedEdges = sortedValues(afterEdges, beforeEdges, edgeKey);
  const removedEdges = sortedValues(beforeEdges, afterEdges, edgeKey);
  const beforeGroups = byKey(before.groups, (group) => group.id);
  const afterGroups = byKey(after.groups, (group) => group.id);
  const addedGroups = sortedValues(afterGroups, beforeGroups, (group) => group.id);
  const removedGroups = sortedValues(beforeGroups, afterGroups, (group) => group.id);
  const changedGroups: ContextScopeGroupChange[] = [];
  for (const id of [...beforeGroups.keys()].sort(compareStableText)) {
    const previous = beforeGroups.get(id)!;
    const current = afterGroups.get(id);
    if (current !== undefined && JSON.stringify(previous) !== JSON.stringify(current)) {
      changedGroups.push({ id, before: previous, after: current });
    }
  }
  return {
    schemaVersion: CONTEXT_SCOPE_DIFF_SCHEMA,
    context: after.context,
    before: {
      repositoryRoot: before.source.repositoryRoot,
      revision: before.source.revision,
      workContextDigest: before.source.workContextDigest,
    },
    after: {
      repositoryRoot: after.source.repositoryRoot,
      revision: after.source.revision,
      workContextDigest: after.source.workContextDigest,
    },
    addedNodes,
    removedNodes,
    addedEdges,
    removedEdges,
    addedGroups,
    removedGroups,
    changedGroups,
    summary: {
      addedNodes: addedNodes.length,
      removedNodes: removedNodes.length,
      addedEdges: addedEdges.length,
      removedEdges: removedEdges.length,
      addedGroups: addedGroups.length,
      removedGroups: removedGroups.length,
      changedGroups: changedGroups.length,
    },
  };
}

export function renderContextScopeDiffText(diff: ContextScopeDiff): string {
  const lines = [
    `Context Scope Diff: ${diff.context.id} (${diff.context.kind})`,
    `Revision: ${diff.before.revision.gitHead} -> ${diff.after.revision.gitHead}`,
    `Nodes: +${diff.summary.addedNodes} / -${diff.summary.removedNodes}`,
    `Edges: +${diff.summary.addedEdges} / -${diff.summary.removedEdges}`,
    `Groups: +${diff.summary.addedGroups} / -${diff.summary.removedGroups} / ~${diff.summary.changedGroups}`,
  ];
  if (diff.addedNodes.length > 0) {
    lines.push('', 'Added symbols', ...diff.addedNodes.map(formatSymbol));
  }
  if (diff.removedNodes.length > 0) {
    lines.push('', 'Removed symbols', ...diff.removedNodes.map(formatSymbol));
  }
  return `${lines.join('\n')}\n`;
}

function formatSymbol(symbol: SymbolRef): string {
  return `  + [${symbol.projectId}] ${symbol.filePath} :: ${symbol.entityId}`;
}

function edgeKey(edge: ContextScopeEdge): string {
  return `${edge.from}\0${edge.to}\0${edge.kind}\0${edge.evidence.provider}\0${edge.evidence.relation}`;
}

function byKey<T>(items: readonly T[], key: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [key(item), item]));
}

function sortedValues<T>(
  values: Map<string, T>,
  excluded: Map<string, T>,
  key: (item: T) => string = (item) => String(item),
): T[] {
  return [...values.entries()]
    .filter(([entryKey]) => !excluded.has(entryKey))
    .map(([, value]) => value)
    .sort((left, right) => compareStableText(key(left), key(right)));
}
