import {
  compareStableText,
  normalizeRepositoryPath,
  symbolRefKey,
  type SymbolRef,
  type SymbolSnapshot,
  type SymbolSnapshotRevision,
} from '@sem-foundation/contracts';
import type { SemProjectAnalysis } from './contracts.js';
import { assertKnownFields } from './diagnostics.js';
import { InputContractError } from './errors.js';
import { hasVisibleText, isWellFormedText } from './text.js';

export const CONTEXT_SCOPE_CONTRACT_ID = 'context-action/context-scope' as const;
export const CONTEXT_SCOPE_CONTRACT_VERSION = '1.0' as const;
export const CONTEXT_MANIFEST_SCHEMA_VERSION = 1 as const;
export const MAX_CONTEXT_MANIFEST_CONTEXTS = 4096;
export const MAX_CONTEXT_MANIFEST_ANCHORS = 16384;
export const MAX_CONTEXT_MANIFEST_EDGES = 65536;
export const MAX_CONTEXT_SCOPE_NODES = 65536;
export const MAX_CONTEXT_SCOPE_EDGES = 65536;
export const MAX_CONTEXT_SCOPE_GROUPS = 4096;
export const DEFAULT_CONTEXT_SCOPE_MAX_DEPTH = 2;

export type ContextScopeKind =
  | 'screen'
  | 'api'
  | 'transaction'
  | 'workflow'
  | 'document';

export type ContextAnchorRole =
  | 'root'
  | 'view'
  | 'endpoint'
  | 'controller'
  | 'trigger'
  | 'state-read'
  | 'state-write'
  | 'command'
  | 'step'
  | 'definition'
  | 'reference';

export type ContextEdgeKind =
  | 'depends-on'
  | 'invokes'
  | 'reads'
  | 'writes'
  | 'renders'
  | 'validates'
  | 'documents';

export interface ContextAnchor {
  readonly role: ContextAnchorRole;
  readonly symbol: SymbolRef;
}

export interface DeclaredContextEdge {
  readonly id: string;
  readonly from: SymbolRef;
  readonly to: SymbolRef;
  readonly kind: ContextEdgeKind;
}

export interface ContextManifestEntry {
  readonly id: string;
  readonly kind: ContextScopeKind;
  readonly label?: string;
  readonly anchors: readonly ContextAnchor[];
  readonly declaredEdges?: readonly DeclaredContextEdge[];
}

export interface ContextManifest {
  readonly $schema?: string;
  readonly schemaVersion: typeof CONTEXT_MANIFEST_SCHEMA_VERSION;
  readonly revision: SymbolSnapshotRevision;
  readonly contexts: readonly ContextManifestEntry[];
}

export type ContextEdgeEvidence =
  | { readonly provider: 'sem'; readonly relation: 'dependency' | 'dependent' }
  | { readonly provider: 'manifest'; readonly declarationId: string };

export interface ContextEdge {
  readonly from: string;
  readonly to: string;
  readonly kind: ContextEdgeKind;
  readonly evidence: ContextEdgeEvidence;
}

export interface SymbolGroup {
  readonly id: string;
  readonly kind: 'context' | 'layer' | 'module' | 'project';
  readonly label: string;
  readonly memberNodeKeys: readonly string[];
}

export type ContextScopeIncompleteReason =
  | 'depth'
  | 'nodes'
  | 'edges'
  | 'groups'
  | 'budget'
  | 'evidence-unavailable';

export type ContextScopeValidationError =
  | 'anchor-unresolved'
  | 'manifest-revision-mismatch'
  | 'unsupported-profile';

export interface AppliedContextGraphLimits {
  readonly maxDepth: number;
  readonly maxNodes: number;
  readonly maxEdges: number;
  readonly maxGroups: number;
}

export type ContextScopeStatus =
  | { readonly kind: 'complete'; readonly appliedLimits: AppliedContextGraphLimits }
  | {
      readonly kind: 'incomplete';
      readonly appliedLimits: AppliedContextGraphLimits;
      readonly reasons: readonly ContextScopeIncompleteReason[];
    }
  | { readonly kind: 'invalid'; readonly errors: readonly ContextScopeValidationError[] };

export interface ContextScope {
  readonly contractId: typeof CONTEXT_SCOPE_CONTRACT_ID;
  readonly contractVersion: typeof CONTEXT_SCOPE_CONTRACT_VERSION;
  readonly context: {
    readonly id: string;
    readonly kind: ContextScopeKind;
    readonly label?: string;
  };
  readonly source: {
    readonly snapshot: {
      readonly contractId: SymbolSnapshot['contractId'];
      readonly contractVersion: SymbolSnapshot['contractVersion'];
      readonly revision: SymbolSnapshotRevision;
    };
    readonly manifest: {
      readonly path: string;
      readonly contentDigest: string;
    };
  };
  readonly anchors: readonly ContextAnchor[];
  readonly nodes: readonly SymbolRef[];
  readonly edges: readonly ContextEdge[];
  readonly groups: readonly SymbolGroup[];
  readonly status: ContextScopeStatus;
}

export interface ContextScopeOptions {
  readonly snapshot: SymbolSnapshot;
  readonly manifest: ContextManifest;
  readonly contextId: string;
  readonly manifestPath: string;
  readonly manifestDigest: string;
  readonly semAnalyses?: readonly SemProjectAnalysis[];
  readonly maxDepth?: number;
  readonly maxNodes?: number;
  readonly maxEdges?: number;
  readonly maxGroups?: number;
  readonly onLimit?: 'error' | 'incomplete';
}

const contextKinds = new Set<ContextScopeKind>([
  'screen',
  'api',
  'transaction',
  'workflow',
  'document',
]);
const anchorRoles = new Set<ContextAnchorRole>([
  'root',
  'view',
  'endpoint',
  'controller',
  'trigger',
  'state-read',
  'state-write',
  'command',
  'step',
  'definition',
  'reference',
]);
const edgeKinds = new Set<ContextEdgeKind>([
  'depends-on',
  'invokes',
  'reads',
  'writes',
  'renders',
  'validates',
  'documents',
]);
const profileRoles: Record<ContextScopeKind, ReadonlySet<ContextAnchorRole>> = {
  screen: new Set(['root', 'view', 'state-read', 'state-write']),
  api: new Set(['endpoint', 'controller']),
  transaction: new Set(['trigger', 'state-read', 'state-write', 'view']),
  workflow: new Set(['command', 'step']),
  document: new Set(['definition', 'reference']),
};
const supportedProjectionKinds = new Set<ContextScopeKind>(['screen']);

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputContractError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.length > 4096
    || value.includes('\0')
    || !isWellFormedText(value)
    || !hasVisibleText(value)
  ) {
    throw new InputContractError(`${label} must be visible text within 4096 characters`);
  }
  return value;
}

function boundedArray(value: unknown, label: string, maxItems: number): unknown[] {
  if (!Array.isArray(value)) throw new InputContractError(`${label} must be an array`);
  if (value.length > maxItems) throw new InputContractError(`${label} exceeds ${maxItems} items`);
  return value;
}

function revision(value: unknown, label: string): SymbolSnapshotRevision {
  const input = record(value, label);
  assertKnownFields(input, ['commit', 'gitHead', 'workingTreeDigest'], label);
  const result = {
    ...(input.commit === undefined ? {} : { commit: text(input.commit, `${label}.commit`) }),
    ...(input.gitHead === undefined ? {} : { gitHead: text(input.gitHead, `${label}.gitHead`) }),
    ...(input.workingTreeDigest === undefined ? {} : {
      workingTreeDigest: text(input.workingTreeDigest, `${label}.workingTreeDigest`),
    }),
  };
  if (Object.keys(result).length === 0) throw new InputContractError(`${label} must identify a revision`);
  return result;
}

function symbolRef(value: unknown, label: string): SymbolRef {
  const input = record(value, label);
  assertKnownFields(input, ['projectId', 'filePath', 'entityId'], label);
  return {
    projectId: text(input.projectId, `${label}.projectId`),
    filePath: normalizeRepositoryPath(text(input.filePath, `${label}.filePath`)),
    entityId: text(input.entityId, `${label}.entityId`),
  };
}

function anchor(value: unknown, label: string): ContextAnchor {
  const input = record(value, label);
  assertKnownFields(input, ['role', 'symbol'], label);
  const role = text(input.role, `${label}.role`) as ContextAnchorRole;
  if (!anchorRoles.has(role)) throw new InputContractError(`${label}.role is unsupported: ${role}`);
  return { role, symbol: symbolRef(input.symbol, `${label}.symbol`) };
}

function declaredEdge(value: unknown, label: string): DeclaredContextEdge {
  const input = record(value, label);
  assertKnownFields(input, ['id', 'from', 'to', 'kind'], label);
  const kind = text(input.kind, `${label}.kind`) as ContextEdgeKind;
  if (!edgeKinds.has(kind)) throw new InputContractError(`${label}.kind is unsupported: ${kind}`);
  return {
    id: text(input.id, `${label}.id`),
    from: symbolRef(input.from, `${label}.from`),
    to: symbolRef(input.to, `${label}.to`),
    kind,
  };
}

function manifestContext(value: unknown, index: number): ContextManifestEntry {
  const label = `context manifest.contexts[${index}]`;
  const input = record(value, label);
  assertKnownFields(input, ['id', 'kind', 'label', 'anchors', 'declaredEdges'], label);
  const kind = text(input.kind, `${label}.kind`) as ContextScopeKind;
  if (!contextKinds.has(kind)) throw new InputContractError(`${label}.kind is unsupported: ${kind}`);
  const anchors = boundedArray(input.anchors, `${label}.anchors`, MAX_CONTEXT_MANIFEST_ANCHORS)
    .map((item, anchorIndex) => anchor(item, `${label}.anchors[${anchorIndex}]`));
  if (anchors.length === 0) throw new InputContractError(`${label}.anchors must contain at least one anchor`);
  const declaredEdges = input.declaredEdges === undefined
    ? undefined
    : boundedArray(input.declaredEdges, `${label}.declaredEdges`, MAX_CONTEXT_MANIFEST_EDGES)
      .map((item, edgeIndex) => declaredEdge(item, `${label}.declaredEdges[${edgeIndex}]`));
  if (declaredEdges && new Set(declaredEdges.map((edge) => edge.id)).size !== declaredEdges.length) {
    throw new InputContractError(`${label}.declaredEdges must not contain duplicate IDs`);
  }
  const allowedRoles = profileRoles[kind];
  const invalidRole = anchors.find((item) => !allowedRoles.has(item.role));
  if (invalidRole) {
    throw new InputContractError(`${label}.anchors role ${invalidRole.role} is not allowed for ${kind}`);
  }
  return {
    id: text(input.id, `${label}.id`),
    kind,
    ...(input.label === undefined ? {} : { label: text(input.label, `${label}.label`) }),
    anchors,
    ...(declaredEdges === undefined ? {} : { declaredEdges }),
  };
}

export function parseContextManifest(value: unknown, label = 'context manifest'): ContextManifest {
  const input = record(value, label);
  assertKnownFields(input, ['$schema', 'schemaVersion', 'revision', 'contexts'], label);
  if (input.schemaVersion !== CONTEXT_MANIFEST_SCHEMA_VERSION) {
    throw new InputContractError(`${label}.schemaVersion must be ${CONTEXT_MANIFEST_SCHEMA_VERSION}`);
  }
  const contexts = boundedArray(input.contexts, `${label}.contexts`, MAX_CONTEXT_MANIFEST_CONTEXTS)
    .map((item, index) => manifestContext(item, index));
  if (contexts.length === 0) throw new InputContractError(`${label}.contexts must contain at least one context`);
  if (new Set(contexts.map((item) => item.id)).size !== contexts.length) {
    throw new InputContractError(`${label}.contexts must not contain duplicate IDs`);
  }
  return {
    ...(input.$schema === undefined ? {} : { $schema: text(input.$schema, `${label}.$schema`) }),
    schemaVersion: CONTEXT_MANIFEST_SCHEMA_VERSION,
    revision: revision(input.revision, `${label}.revision`),
    contexts,
  };
}

function positiveLimit(value: number | undefined, fallback: number, label: string): number {
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new InputContractError(`${label} must be a positive safe integer`);
  }
  return result;
}

function sameRevision(left: SymbolSnapshotRevision, right: SymbolSnapshotRevision): boolean {
  return Object.entries(right).every(([key, value]) =>
    left[key as keyof SymbolSnapshotRevision] === value);
}

function refFromRelated(projectId: string, entity: { entityId: string; file: string }): SymbolRef {
  return {
    projectId,
    filePath: normalizeRepositoryPath(entity.file),
    entityId: entity.entityId,
  };
}

function edgeSort(left: ContextEdge, right: ContextEdge): number {
  return compareStableText(
    `${left.from}\0${left.to}\0${left.kind}\0${JSON.stringify(left.evidence)}`,
    `${right.from}\0${right.to}\0${right.kind}\0${JSON.stringify(right.evidence)}`,
  );
}

function invalidScope(options: {
  context: ContextManifestEntry;
  snapshot: SymbolSnapshot;
  manifestPath: string;
  manifestDigest: string;
  anchors?: readonly ContextAnchor[];
  errors: readonly ContextScopeValidationError[];
}): ContextScope {
  return {
    contractId: CONTEXT_SCOPE_CONTRACT_ID,
    contractVersion: CONTEXT_SCOPE_CONTRACT_VERSION,
    context: {
      id: options.context.id,
      kind: options.context.kind,
      ...(options.context.label === undefined ? {} : { label: options.context.label }),
    },
    source: {
      snapshot: {
        contractId: options.snapshot.contractId,
        contractVersion: options.snapshot.contractVersion,
        revision: options.snapshot.revision,
      },
      manifest: { path: options.manifestPath, contentDigest: options.manifestDigest },
    },
    anchors: options.anchors ?? options.context.anchors,
    nodes: [],
    edges: [],
    groups: [],
    status: { kind: 'invalid', errors: [...new Set(options.errors)] },
  };
}

/** Projects one manifest context over a complete snapshot and optional SEM dependency evidence. */
export function createContextScope(options: ContextScopeOptions): ContextScope {
  const context = options.manifest.contexts.find((item) => item.id === options.contextId);
  if (!context) throw new InputContractError(`Unknown context manifest id: ${options.contextId}`);
  const manifestPath = text(options.manifestPath, 'context scope manifestPath');
  const manifestDigest = text(options.manifestDigest, 'context scope manifestDigest');
  const limits: AppliedContextGraphLimits = {
    maxDepth: positiveLimit(options.maxDepth, DEFAULT_CONTEXT_SCOPE_MAX_DEPTH, 'context scope maxDepth'),
    maxNodes: positiveLimit(options.maxNodes, MAX_CONTEXT_SCOPE_NODES, 'context scope maxNodes'),
    maxEdges: positiveLimit(options.maxEdges, MAX_CONTEXT_SCOPE_EDGES, 'context scope maxEdges'),
    maxGroups: positiveLimit(options.maxGroups, MAX_CONTEXT_SCOPE_GROUPS, 'context scope maxGroups'),
  };
  const onLimit = options.onLimit ?? 'incomplete';
  if (!sameRevision(options.snapshot.revision, options.manifest.revision)) {
    return invalidScope({
      context,
      snapshot: options.snapshot,
      manifestPath,
      manifestDigest,
      errors: ['manifest-revision-mismatch'],
    });
  }
  if (!supportedProjectionKinds.has(context.kind)) {
    return invalidScope({
      context,
      snapshot: options.snapshot,
      manifestPath,
      manifestDigest,
      errors: ['unsupported-profile'],
    });
  }

  const snapshotByKey = new Map(options.snapshot.symbols.map((entry) => [symbolRefKey(entry), entry]));
  const unresolved = context.anchors.filter((item) => !snapshotByKey.has(symbolRefKey(item.symbol)));
  const declaredEdgeUnresolved = (context.declaredEdges ?? []).some((edge) =>
    !snapshotByKey.has(symbolRefKey(edge.from)) || !snapshotByKey.has(symbolRefKey(edge.to)));
  if (unresolved.length > 0 || declaredEdgeUnresolved) {
    return invalidScope({
      context,
      snapshot: options.snapshot,
      manifestPath,
      manifestDigest,
      errors: ['anchor-unresolved'],
    });
  }

  const nodesByKey = new Map<string, SymbolRef>();
  const edgesByKey = new Map<string, ContextEdge>();
  const incompleteReasons = new Set<ContextScopeIncompleteReason>();
  const addNode = (ref: SymbolRef): boolean => {
    const key = symbolRefKey(ref);
    if (nodesByKey.has(key)) return true;
    if (nodesByKey.size >= limits.maxNodes) {
      incompleteReasons.add('nodes');
      if (onLimit === 'error') throw new InputContractError(`context scope exceeds ${limits.maxNodes} nodes`);
      return false;
    }
    nodesByKey.set(key, ref);
    return true;
  };
  for (const item of context.anchors) addNode(item.symbol);
  for (const edge of context.declaredEdges ?? []) {
    if (!addNode(edge.from) || !addNode(edge.to)) continue;
    const from = symbolRefKey(edge.from);
    const to = symbolRefKey(edge.to);
    const graphEdge: ContextEdge = {
      from,
      to,
      kind: edge.kind,
      evidence: { provider: 'manifest', declarationId: edge.id },
    };
    edgesByKey.set(`${from}\0${to}\0${edge.kind}\0manifest\0${edge.id}`, graphEdge);
  }

  const impactsByKey = new Map<string, SemProjectAnalysis['impacts'][number]>();
  for (const analysis of options.semAnalyses ?? []) {
    for (const impact of analysis.impacts) {
      impactsByKey.set(symbolRefKey({
        projectId: analysis.projectId,
        filePath: impact.entity.file,
        entityId: impact.entity.entityId,
      }), impact);
    }
  }
  const queue: Array<{ ref: SymbolRef; depth: number }> = context.anchors.map((item) => ({
    ref: item.symbol,
    depth: 0,
  }));
  const queued = new Set(queue.map((item) => symbolRefKey(item.ref)));
  while (queue.length > 0) {
    const current = queue.shift()!;
    const impact = impactsByKey.get(symbolRefKey(current.ref));
    if (!impact) {
      if ((options.semAnalyses ?? []).length > 0 && current.depth < limits.maxDepth) {
        incompleteReasons.add('evidence-unavailable');
      }
      continue;
    }
    if (current.depth >= limits.maxDepth) {
      if (impact.dependencies.length > 0) incompleteReasons.add('depth');
      continue;
    }
    for (const dependency of impact.dependencies) {
      const target = refFromRelated(current.ref.projectId, dependency);
      if (!snapshotByKey.has(symbolRefKey(target))) continue;
      if (!addNode(target)) continue;
      if (edgesByKey.size >= limits.maxEdges) {
        incompleteReasons.add('edges');
        if (onLimit === 'error') throw new InputContractError(`context scope exceeds ${limits.maxEdges} edges`);
        continue;
      }
      const from = symbolRefKey(current.ref);
      const to = symbolRefKey(target);
      edgesByKey.set(`${from}\0${to}\0depends-on\0sem\0dependency`, {
        from,
        to,
        kind: 'depends-on',
        evidence: { provider: 'sem', relation: 'dependency' },
      });
      if (current.depth + 1 < limits.maxDepth && !queued.has(to)) {
        queued.add(to);
        queue.push({ ref: target, depth: current.depth + 1 });
      }
    }
  }

  const nodes = [...nodesByKey.values()].sort((left, right) => compareStableText(symbolRefKey(left), symbolRefKey(right)));
  const edges = [...edgesByKey.values()].sort(edgeSort);
  const groups: SymbolGroup[] = [];
  const contextGroup: SymbolGroup = {
    id: `context:${context.id}`,
    kind: 'context',
    label: context.label ?? context.id,
    memberNodeKeys: nodes.map(symbolRefKey),
  };
  groups.push(contextGroup);
  const projectIds = [...new Set(nodes.map((node) => node.projectId))].sort(compareStableText);
  for (const projectId of projectIds) {
    if (groups.length >= limits.maxGroups) {
      incompleteReasons.add('groups');
      if (onLimit === 'error') throw new InputContractError(`context scope exceeds ${limits.maxGroups} groups`);
      break;
    }
    groups.push({
      id: `project:${projectId}`,
      kind: 'project',
      label: projectId,
      memberNodeKeys: nodes.filter((node) => node.projectId === projectId).map(symbolRefKey),
    });
  }
  const status: ContextScopeStatus = incompleteReasons.size === 0
    ? { kind: 'complete', appliedLimits: limits }
    : { kind: 'incomplete', appliedLimits: limits, reasons: [...incompleteReasons].sort(compareStableText) };
  return {
    contractId: CONTEXT_SCOPE_CONTRACT_ID,
    contractVersion: CONTEXT_SCOPE_CONTRACT_VERSION,
    context: {
      id: context.id,
      kind: context.kind,
      ...(context.label === undefined ? {} : { label: context.label }),
    },
    source: {
      snapshot: {
        contractId: options.snapshot.contractId,
        contractVersion: options.snapshot.contractVersion,
        revision: options.snapshot.revision,
      },
      manifest: { path: manifestPath, contentDigest: manifestDigest },
    },
    anchors: context.anchors,
    nodes,
    edges,
    groups,
    status,
  };
}

export function renderContextScopeJson(scope: ContextScope): string {
  return `${JSON.stringify(scope, null, 2)}\n`;
}

export function renderContextScopeConsole(scope: ContextScope): string {
  const lines = [
    `Context scope: ${scope.context.id} (${scope.context.kind})`,
    `Status: ${scope.status.kind}`,
    `Nodes: ${scope.nodes.length} | Edges: ${scope.edges.length} | Groups: ${scope.groups.length}`,
  ];
  for (const node of scope.nodes) {
    lines.push(`  [${node.projectId}] ${node.filePath} :: ${node.entityId}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderContextScopeMarkdown(scope: ContextScope): string {
  const lines = [
    '# Context Scope',
    '',
    `- Context: \`${scope.context.id}\` (${scope.context.kind})`,
    `- Status: \`${scope.status.kind}\``,
    `- Nodes: ${scope.nodes.length}`,
    `- Edges: ${scope.edges.length}`,
    '',
    '| Project | File | Entity |',
    '| --- | --- | --- |',
  ];
  for (const node of scope.nodes) {
    lines.push(`| \`${node.projectId}\` | \`${node.filePath}\` | \`${node.entityId}\` |`);
  }
  return `${lines.join('\n')}\n`;
}
