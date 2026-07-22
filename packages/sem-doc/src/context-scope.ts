import { createHash } from 'node:crypto';

import {
  compareStableText,
  type SymbolRef,
  symbolRefKey,
} from '@context-action/sem-foundation-contracts';
import { parseExecutionProvenance } from './execution-provenance';
import {
  foundationCanonicalEntityId,
  foundationNormalizeRepositoryPath,
} from './sem-foundation';
import type { SemEntity } from './sem-json';
import {
  type SemDocWorkContext,
  WORK_CONTEXT_SCHEMA,
} from './work-context';

/** Canonical operational context projection produced by sem-doc. */
export const CONTEXT_SCOPE_SCHEMA = 'sem-doc-context-scope.v3' as const;
export const CONTEXT_SCOPE_MANIFEST_SCHEMA = 'sem-doc-context-manifest.v1' as const;

export type ContextScopeKind =
  | 'screen'
  | 'api'
  | 'transaction'
  | 'workflow'
  | 'document';

export type ContextScopeAnchorRole =
  | 'root'
  | 'endpoint'
  | 'trigger'
  | 'command'
  | 'definition';

export type ContextScopeEdgeKind = 'depends-on';

export type ContextScopeIncompleteReason =
  | 'nodes'
  | 'edges'
  | 'evidence-unavailable'
  | 'disconnected-nodes';

export const MAX_CONTEXT_SCOPE_ANCHORS = 16_384;
export const MAX_CONTEXT_SCOPE_NODES = 65_536;
export const MAX_CONTEXT_SCOPE_EDGES = 65_536;
export const MAX_CONTEXT_SCOPE_GROUPS = 4_096;
export const MAX_CONTEXT_SCOPE_GROUP_MEMBERS = 65_536;
export const MAX_CONTEXT_SCOPE_ARGS = 256;

export interface ContextScopeAnchor {
  readonly role: ContextScopeAnchorRole;
  readonly symbol: SymbolRef;
}

export interface ContextScopeManifestAnchor {
  readonly role: ContextScopeAnchorRole;
  readonly entity: string;
  readonly file?: string;
}

export interface ContextScopeManifest {
  readonly schemaVersion: typeof CONTEXT_SCOPE_MANIFEST_SCHEMA;
  readonly id: string;
  readonly kind: ContextScopeKind;
  readonly label?: string;
  readonly anchors: readonly ContextScopeManifestAnchor[];
}

export interface ContextScopeEdge {
  readonly from: string;
  readonly to: string;
  readonly kind: ContextScopeEdgeKind;
  readonly evidence: {
    readonly provider: 'sem';
    readonly relation: 'dependency' | 'dependent';
  };
}

export interface ContextScopeGroup {
  readonly id: string;
  readonly kind: 'context' | 'project';
  readonly label: string;
  readonly memberNodeKeys: readonly string[];
}

/** Document evidence is deliberately separate from graph completeness. */
export interface ContextScopeDocumentEvidence {
  readonly root: string;
  readonly target: {
    readonly status: 'resolved' | 'unresolved';
    readonly symbol?: string;
    readonly definitions: number;
    readonly backlinks: number;
    readonly candidates: number;
  };
  readonly missingReferences: number;
}

export interface ContextScopeStatus {
  readonly kind: 'complete' | 'incomplete';
  readonly appliedLimits: {
    readonly maxNodes: number;
    readonly maxEdges: number;
  };
  readonly reasons?: readonly ContextScopeIncompleteReason[];
}

export interface ContextScope {
  readonly schemaVersion: typeof CONTEXT_SCOPE_SCHEMA;
  readonly source: {
    readonly workContext: typeof WORK_CONTEXT_SCHEMA;
    readonly repositoryRoot: string;
    readonly revision: SemDocWorkContext['revision'];
    readonly engine: SemDocWorkContext['engine'];
    readonly workContextDigest: string;
    readonly projectId: string;
    readonly request: {
      readonly entity: string;
      readonly file?: string;
      readonly depth: SemDocWorkContext['symbols']['maxHops'];
      readonly budget: number;
      readonly impactArgs: readonly string[];
      readonly contextArgs: readonly string[];
      readonly execution: SemDocWorkContext['execution'];
    };
    readonly manifest?: ContextScopeManifest;
    readonly workContexts?: readonly ContextScopeWorkContextSource[];
  };
  readonly context: {
    readonly id: string;
    readonly kind: ContextScopeKind;
    readonly label?: string;
  };
  readonly anchors: readonly ContextScopeAnchor[];
  readonly nodes: readonly SymbolRef[];
  readonly edges: readonly ContextScopeEdge[];
  readonly groups: readonly ContextScopeGroup[];
  readonly documentEvidence?: readonly ContextScopeDocumentEvidence[];
  readonly status: ContextScopeStatus;
}

export interface ContextScopeWorkContextSource {
  readonly workContext: typeof WORK_CONTEXT_SCHEMA;
  readonly repositoryRoot: string;
  readonly revision: SemDocWorkContext['revision'];
  readonly engine: SemDocWorkContext['engine'];
  readonly workContextDigest: string;
  readonly request: ContextScope['source']['request'];
}

/** Backward-compatible name for consumers that adopted the first PoC export. */
export type SemDocContextScope = ContextScope;

export interface ContextScopeOptions {
  /** Stable project identity used by snapshot/diff consumers; never defaults implicitly. */
  readonly projectId: string;
  readonly contextId?: string;
  readonly kind?: ContextScopeKind;
  readonly label?: string;
  readonly maxNodes?: number;
  readonly maxEdges?: number;
  readonly maxAnchors?: number;
}

export interface ContextScopeFromReportsOptions extends ContextScopeOptions {
  readonly manifest?: ContextScopeManifest;
}

const DEFAULT_MAX_NODES = 65_536;
const DEFAULT_MAX_EDGES = 65_536;
const CONTEXT_SCOPE_KINDS = new Set<ContextScopeKind>([
  'screen',
  'api',
  'transaction',
  'workflow',
  'document',
]);

/**
 * Projects the bounded work-context inventory into a context grouping view.
 *
 * This is intentionally an operational view: unlike Architecture Governance's
 * snapshot-backed ContextScope, it does not claim to be a complete repository
 * inventory or an architecture verification result.
 */
export function createContextScope(
  report: SemDocWorkContext,
  options: ContextScopeOptions,
): ContextScope {
  const projectId = visibleText(options.projectId, 'projectId');
  const contextId = visibleText(options.contextId ?? report.target.entity.name, 'contextId');
  const kind = options.kind ?? 'screen';
  if (!CONTEXT_SCOPE_KINDS.has(kind)) {
    throw new TypeError(`kind must be one of: ${[...CONTEXT_SCOPE_KINDS].join(', ')}`);
  }
  const label = options.label === undefined ? undefined : visibleText(options.label, 'label');
  const maxNodes = positiveLimit(options.maxNodes, DEFAULT_MAX_NODES, 'maxNodes', MAX_CONTEXT_SCOPE_NODES);
  const maxEdges = positiveLimit(options.maxEdges, DEFAULT_MAX_EDGES, 'maxEdges', MAX_CONTEXT_SCOPE_EDGES);
  const root = toSymbolRef(report.target.entity, projectId);
  const nodesByKey = new Map<string, SymbolRef>();
  const edgesByKey = new Map<string, ContextScopeEdge>();
  const reasons = new Set<ContextScopeIncompleteReason>();

  const addNode = (symbol: SymbolRef): boolean => {
    const key = symbolRefKey(symbol);
    if (nodesByKey.has(key)) return true;
    if (nodesByKey.size >= maxNodes) {
      reasons.add('nodes');
      return false;
    }
    nodesByKey.set(key, symbol);
    return true;
  };

  addNode(root);
  for (const entry of report.symbols.entries) addNode(toSymbolRef(entry.entity, projectId));

  const targetKey = symbolRefKey(root);
  for (const dependency of report.sem.impact.payload.dependencies) {
    const target = toSymbolRef(dependency, projectId);
    if (!addNode(target)) continue;
    addEdge(edgesByKey, reasons, maxEdges, {
      from: targetKey,
      to: symbolRefKey(target),
      kind: 'depends-on',
      evidence: { provider: 'sem', relation: 'dependency' },
    });
  }
  for (const dependent of report.sem.impact.payload.dependents) {
    const source = toSymbolRef(dependent, projectId);
    if (!addNode(source)) continue;
    addEdge(edgesByKey, reasons, maxEdges, {
      from: symbolRefKey(source),
      to: targetKey,
      kind: 'depends-on',
      evidence: { provider: 'sem', relation: 'dependent' },
    });
  }
  if (!report.symbols.complete) reasons.add('evidence-unavailable');

  const nodes = [...nodesByKey.values()].sort((left, right) =>
    compareStableText(symbolRefKey(left), symbolRefKey(right)));
  const edges = [...edgesByKey.values()].sort((left, right) =>
    compareStableText(
      `${left.from}\0${left.to}\0${left.kind}\0${left.evidence.relation}`,
      `${right.from}\0${right.to}\0${right.kind}\0${right.evidence.relation}`,
    ));
  const connectedNodeKeys = new Set<string>([targetKey]);
  for (const edge of edges) {
    connectedNodeKeys.add(edge.from);
    connectedNodeKeys.add(edge.to);
  }
  if (nodes.some((node) => !connectedNodeKeys.has(symbolRefKey(node)))) {
    reasons.add('disconnected-nodes');
  }
  const contextGroup: ContextScopeGroup = {
    id: `context:${contextId}`,
    kind: 'context',
    label: label ?? contextId,
    memberNodeKeys: nodes.map(symbolRefKey),
  };
  const groups: ContextScopeGroup[] = [contextGroup];
  const projectGroups = new Map<string, string[]>();
  for (const node of nodes) {
    const members = projectGroups.get(node.projectId) ?? [];
    members.push(symbolRefKey(node));
    projectGroups.set(node.projectId, members);
  }
  for (const [groupProjectId, members] of [...projectGroups.entries()].sort(([left], [right]) =>
    compareStableText(left, right))) {
    groups.push({
      id: `project:${groupProjectId}`,
      kind: 'project',
      label: groupProjectId,
      memberNodeKeys: members,
    });
  }

  return {
    schemaVersion: CONTEXT_SCOPE_SCHEMA,
    source: {
      workContext: WORK_CONTEXT_SCHEMA,
      repositoryRoot: report.repositoryRoot,
      revision: report.revision,
      engine: report.engine,
      workContextDigest: digestWorkContext(report),
      projectId,
      request: {
        entity: report.target.query,
        ...(report.target.file === undefined ? {} : { file: report.target.file }),
        depth: report.symbols.maxHops,
        budget: report.sem.context.payload.budget,
        impactArgs: [...report.sem.impact.args],
        contextArgs: [...report.sem.context.args],
        execution: report.execution,
      },
    },
    context: {
      id: contextId,
      kind,
      ...(label === undefined ? {} : { label }),
    },
    anchors: [{ role: anchorRole(kind), symbol: root }],
    nodes,
    edges,
    groups,
    documentEvidence: [documentEvidenceForReport(report)],
    status: reasons.size === 0
      ? { kind: 'complete', appliedLimits: { maxNodes, maxEdges } }
      : {
        kind: 'incomplete',
        appliedLimits: { maxNodes, maxEdges },
        reasons: [...reasons].sort(compareStableText),
      },
  };
}

/**
 * Combines independently collected work-context reports into one context view.
 * Each report remains individually reproducible through `source.workContexts`,
 * while the manifest gives the visual consumer stable multi-anchor semantics.
 */
export function createContextScopeFromReports(
  reports: readonly SemDocWorkContext[],
  options: ContextScopeFromReportsOptions,
): ContextScope {
  if (reports.length === 0) throw new TypeError('reports must contain at least one work-context');
  const maxAnchors = positiveLimit(options.maxAnchors, MAX_CONTEXT_SCOPE_ANCHORS, 'maxAnchors', MAX_CONTEXT_SCOPE_ANCHORS);
  if (reports.length > maxAnchors) {
    throw new TypeError(`reports exceeds ${maxAnchors} items`);
  }
  const projectId = visibleText(options.projectId, 'projectId');
  const contextId = visibleText(
    options.contextId ?? options.manifest?.id ?? reports[0]!.target.entity.name,
    'contextId',
  );
  const kind = options.kind ?? options.manifest?.kind ?? 'screen';
  if (!CONTEXT_SCOPE_KINDS.has(kind)) {
    throw new TypeError(`kind must be one of: ${[...CONTEXT_SCOPE_KINDS].join(', ')}`);
  }
  const label = options.label === undefined ? undefined : visibleText(options.label, 'label');
  const maxNodes = positiveLimit(options.maxNodes, DEFAULT_MAX_NODES, 'maxNodes', MAX_CONTEXT_SCOPE_NODES);
  const maxEdges = positiveLimit(options.maxEdges, DEFAULT_MAX_EDGES, 'maxEdges', MAX_CONTEXT_SCOPE_EDGES);
  const manifest = options.manifest ?? {
    schemaVersion: CONTEXT_SCOPE_MANIFEST_SCHEMA,
    id: contextId,
    kind,
    ...(label === undefined ? {} : { label }),
    anchors: reports.map((report, index) => ({
      role: index === 0 ? anchorRole(kind) : 'definition' as const,
      entity: report.target.query,
      ...(report.target.file === undefined ? {} : { file: report.target.file }),
    })),
  };
  parseContextScopeManifest(manifest);
  if (manifest.anchors.length !== reports.length) {
    throw new TypeError('manifest anchors must match reports');
  }
  const childScopes = reports.map((report) => createContextScope(report, {
    projectId,
    contextId,
    kind,
    ...(label === undefined ? {} : { label }),
    maxNodes,
    maxEdges,
  }));
  const first = childScopes[0]!;
  for (const scope of childScopes.slice(1)) {
    if (scope.source.repositoryRoot !== first.source.repositoryRoot
      || scope.source.revision.gitHead !== first.source.revision.gitHead
      || scope.source.revision.workingTreeDigest !== first.source.revision.workingTreeDigest
      || scope.source.engine.version !== first.source.engine.version) {
      throw new TypeError('all work-context reports must share repository revision and sem version');
    }
  }
  const nodesByKey = new Map<string, SymbolRef>();
  const edgesByKey = new Map<string, ContextScopeEdge>();
  const reasons = new Set<ContextScopeIncompleteReason>();
  for (const scope of childScopes) {
    for (const node of scope.nodes) {
      if (nodesByKey.size >= maxNodes && !nodesByKey.has(symbolRefKey(node))) {
        reasons.add('nodes');
        continue;
      }
      nodesByKey.set(symbolRefKey(node), node);
    }
    for (const edge of scope.edges) {
      const key = `${edge.from}\0${edge.to}\0${edge.kind}\0${edge.evidence.relation}`;
      if (edgesByKey.has(key)) continue;
      if (edgesByKey.size >= maxEdges) {
        reasons.add('edges');
        continue;
      }
      edgesByKey.set(key, edge);
    }
    for (const reason of scope.status.reasons ?? []) reasons.add(reason);
  }
  const nodes = [...nodesByKey.values()].sort((left, right) =>
    compareStableText(symbolRefKey(left), symbolRefKey(right)));
  const edges = [...edgesByKey.values()].sort((left, right) => compareStableText(
    `${left.from}\0${left.to}\0${left.kind}\0${left.evidence.relation}`,
    `${right.from}\0${right.to}\0${right.kind}\0${right.evidence.relation}`,
  ));
  const anchorSymbols = manifest.anchors.map((anchor, index) => {
    const report = reports[index]!;
    const symbol = toSymbolRef(report.target.entity, projectId);
    if (anchor.entity !== report.target.query
      || (anchor.file !== undefined && anchor.file !== report.target.file)) {
      throw new TypeError(`manifest anchor ${index} does not match its work-context target`);
    }
    return { role: anchor.role, symbol } satisfies ContextScopeAnchor;
  });
  const contextGroup: ContextScopeGroup = {
    id: `context:${contextId}`,
    kind: 'context',
    label: label ?? contextId,
    memberNodeKeys: nodes.map(symbolRefKey),
  };
  const projectGroup: ContextScopeGroup = {
    id: `project:${projectId}`,
    kind: 'project',
    label: projectId,
    memberNodeKeys: nodes.map(symbolRefKey),
  };
  const workContexts = childScopes.map((scope) => ({
    workContext: scope.source.workContext,
    repositoryRoot: scope.source.repositoryRoot,
    revision: scope.source.revision,
    engine: scope.source.engine,
    workContextDigest: scope.source.workContextDigest,
    request: scope.source.request,
  }));
  const aggregateDigest = createHash('sha256').update(JSON.stringify({
    manifest,
    workContexts: workContexts.map(({ workContextDigest }) => workContextDigest),
  }), 'utf8').digest('hex');
  return {
    ...first,
    context: {
      id: contextId,
      kind,
      ...(label === undefined ? {} : { label }),
    },
    source: {
      ...first.source,
      workContextDigest: aggregateDigest,
      manifest,
      workContexts,
    },
    anchors: anchorSymbols,
    nodes,
    edges,
    groups: [contextGroup, projectGroup],
    documentEvidence: childScopes.flatMap((scope) => scope.documentEvidence ?? []),
    status: reasons.size === 0
      ? { kind: 'complete', appliedLimits: { maxNodes, maxEdges } }
      : {
        kind: 'incomplete',
        appliedLimits: { maxNodes, maxEdges },
        reasons: [...reasons].sort(compareStableText),
      },
  };
}

export function renderContextScopeText(scope: ContextScope): string {
  return `${[
    `Context Scope: ${scope.context.id} (${scope.context.kind})`,
    `Status: ${scope.status.kind}`,
    `Nodes: ${scope.nodes.length} | Edges: ${scope.edges.length} | Groups: ${scope.groups.length}`,
    ...(scope.documentEvidence === undefined ? [] : [
      `Document evidence: ${scope.documentEvidence.map(({ target }) => target.status).join(', ')}`,
    ]),
    '',
    'Symbols',
    ...scope.nodes.map((node) => `  [${node.projectId}] ${node.filePath} :: ${node.entityId}`),
    '',
    'Edges',
    ...scope.edges.map((edge) => `  ${edge.from} -[${edge.kind}]-> ${edge.to}`),
  ].join('\n')}\n`;
}

/**
 * Validates a serialized scope before it is handed to a graph/diff consumer.
 * The generator already returns this shape; this parser protects the SSOT boundary
 * when the JSON artifact comes from disk, Git history, or another process.
 */
export function parseContextScope(value: unknown): ContextScope {
  if (!isRecord(value)) throw new TypeError('context scope must be an object');
  if (value.schemaVersion !== CONTEXT_SCOPE_SCHEMA) {
    throw new TypeError(`context scope schemaVersion must be ${CONTEXT_SCOPE_SCHEMA}`);
  }
  assertKnownFields(
    value,
    ['schemaVersion', 'source', 'context', 'anchors', 'nodes', 'edges', 'groups', 'documentEvidence', 'status'],
    'context scope',
  );
  const source = record(value.source, 'source');
  assertKnownFields(
    source,
    ['workContext', 'repositoryRoot', 'revision', 'engine', 'workContextDigest', 'projectId', 'request', 'manifest', 'workContexts'],
    'source',
  );
  const context = record(value.context, 'context');
  assertKnownFields(context, ['id', 'kind', 'label'], 'context');
  const nodes = array(value.nodes, 'nodes', MAX_CONTEXT_SCOPE_NODES);
  const edges = array(value.edges, 'edges', MAX_CONTEXT_SCOPE_EDGES);
  const anchors = array(value.anchors, 'anchors', MAX_CONTEXT_SCOPE_ANCHORS);
  const groups = array(value.groups, 'groups', MAX_CONTEXT_SCOPE_GROUPS);
  const documentEvidence = value.documentEvidence === undefined
    ? undefined
    : array(value.documentEvidence, 'documentEvidence', MAX_CONTEXT_SCOPE_ANCHORS);
  const status = record(value.status, 'status');
  assertKnownFields(status, ['kind', 'appliedLimits', 'reasons'], 'status');
  if (source.workContext !== WORK_CONTEXT_SCHEMA) {
    throw new TypeError(`source.workContext must be ${WORK_CONTEXT_SCHEMA}`);
  }
  const sourceRepositoryRoot = visibleTextString(source.repositoryRoot, 'source.repositoryRoot');
  const revision = record(source.revision, 'source.revision');
  assertKnownFields(revision, ['repositoryRoot', 'gitHead', 'workingTreeDigest'], 'source.revision');
  visibleTextString(revision.repositoryRoot, 'source.revision.repositoryRoot');
  visibleTextString(revision.gitHead, 'source.revision.gitHead');
  visibleTextString(revision.workingTreeDigest, 'source.revision.workingTreeDigest');
  if (revision.repositoryRoot !== sourceRepositoryRoot) {
    throw new TypeError('source.revision.repositoryRoot must match source.repositoryRoot');
  }
  const engine = record(source.engine, 'source.engine');
  assertKnownFields(engine, ['name', 'version'], 'source.engine');
  if (engine.name !== 'sem') throw new TypeError('source.engine.name must be sem');
  visibleTextString(engine.version, 'source.engine.version');
  const projectId = visibleTextString(source.projectId, 'source.projectId');
  const workContextDigest = visibleTextString(
    source.workContextDigest,
    'source.workContextDigest',
  );
  if (!/^[a-f0-9]{64}$/u.test(workContextDigest)) {
    throw new TypeError('source.workContextDigest must be a SHA-256 digest');
  }
  const parsedNodes = nodes.map((node, index) => parseSymbolRef(node, `nodes[${index}]`));
  assertUnique(parsedNodes.map(symbolRefKey), 'nodes');
  if (parsedNodes.some((node) => node.projectId !== projectId)) {
    throw new TypeError('nodes must use source.projectId');
  }
  const nodeKeys = new Set(parsedNodes.map(symbolRefKey));
  for (const [index, anchor] of anchors.entries()) {
    const item = record(anchor, `anchors[${index}]`);
    assertKnownFields(item, ['role', 'symbol'], `anchors[${index}]`);
    if (item.role !== 'root' && item.role !== 'endpoint' && item.role !== 'trigger'
      && item.role !== 'command' && item.role !== 'definition') {
      throw new TypeError(`anchors[${index}].role is invalid`);
    }
    const symbol = parseSymbolRef(item.symbol, `anchors[${index}].symbol`);
    if (!nodeKeys.has(symbolRefKey(symbol))) {
      throw new TypeError(`anchors[${index}].symbol must reference a node`);
    }
  }
  for (const [index, edge] of edges.entries()) {
    const item = record(edge, `edges[${index}]`);
    assertKnownFields(item, ['from', 'to', 'kind', 'evidence'], `edges[${index}]`);
    if (item.kind !== 'depends-on') throw new TypeError(`edges[${index}].kind is invalid`);
    if (typeof item.from !== 'string' || typeof item.to !== 'string'
      || !nodeKeys.has(item.from) || !nodeKeys.has(item.to)) {
      throw new TypeError(`edges[${index}] must reference nodes`);
    }
    const evidence = record(item.evidence, `edges[${index}].evidence`);
    assertKnownFields(evidence, ['provider', 'relation'], `edges[${index}].evidence`);
    if (evidence.provider !== 'sem'
      || (evidence.relation !== 'dependency' && evidence.relation !== 'dependent')) {
      throw new TypeError(`edges[${index}].evidence is invalid`);
    }
  }
  assertUnique(
    edges.map((edge) => {
      const item = edge as Record<string, unknown>;
      const evidence = item.evidence as Record<string, unknown>;
      return `${item.from}\0${item.to}\0${item.kind}\0${evidence.relation}`;
    }),
    'edges',
  );
  const groupIds = new Set<string>();
  for (const [index, group] of groups.entries()) {
    const item = record(group, `groups[${index}]`);
    assertKnownFields(item, ['id', 'kind', 'label', 'memberNodeKeys'], `groups[${index}]`);
    if (typeof item.id !== 'string' || typeof item.label !== 'string'
      || (item.kind !== 'context' && item.kind !== 'project')) {
      throw new TypeError(`groups[${index}] metadata is invalid`);
    }
    visibleText(item.id, `groups[${index}].id`);
    visibleText(item.label, `groups[${index}].label`);
    if (groupIds.has(item.id)) throw new TypeError(`groups[${index}].id is duplicated`);
    groupIds.add(item.id);
    if (!Array.isArray(item.memberNodeKeys)
      || item.memberNodeKeys.length > MAX_CONTEXT_SCOPE_GROUP_MEMBERS
      || !item.memberNodeKeys.every((key) => typeof key === 'string')
      || item.memberNodeKeys.some((key) => typeof key !== 'string' || !nodeKeys.has(key))) {
      throw new TypeError(`groups[${index}].memberNodeKeys must reference nodes`);
    }
    assertUnique(item.memberNodeKeys, `groups[${index}].memberNodeKeys`);
  }
  if (status.kind !== 'complete' && status.kind !== 'incomplete') {
    throw new TypeError('status.kind is invalid');
  }
  const limits = record(status.appliedLimits, 'status.appliedLimits');
  positiveLimitValue(limits.maxNodes, 'status.appliedLimits.maxNodes');
  positiveLimitValue(limits.maxEdges, 'status.appliedLimits.maxEdges');
  if (status.reasons !== undefined) {
    if (!Array.isArray(status.reasons) || status.reasons.some((reason) =>
      reason !== 'nodes' && reason !== 'edges' && reason !== 'evidence-unavailable'
      && reason !== 'disconnected-nodes')) {
      throw new TypeError('status.reasons is invalid');
    }
  }
  if (status.kind === 'complete' && status.reasons !== undefined) {
    throw new TypeError('complete scopes must not contain reasons');
  }
  if (status.kind === 'incomplete'
    && (!Array.isArray(status.reasons) || status.reasons.length === 0)) {
    throw new TypeError('incomplete scopes must contain reasons');
  }
  const request = record(source.request, 'source.request');
  assertKnownFields(
    request,
    ['entity', 'file', 'depth', 'budget', 'impactArgs', 'contextArgs', 'execution'],
    'source.request',
  );
  visibleTextString(request.entity, 'source.request.entity');
  if (request.file !== undefined) visibleTextString(request.file, 'source.request.file');
  const depth = request.depth;
  if (depth !== 1 && depth !== 2) throw new TypeError('source.request.depth is invalid');
  positiveLimitValue(request.budget, 'source.request.budget');
  parseArgs(request.impactArgs, 'source.request.impactArgs');
  parseArgs(request.contextArgs, 'source.request.contextArgs');
  parseExecutionProvenance(request.execution, 'source.request.execution');
  const contextId = visibleTextString(context.id, 'context.id');
  if (context.label !== undefined) visibleTextString(context.label, 'context.label');
  if (context.kind !== 'screen' && context.kind !== 'api' && context.kind !== 'transaction'
    && context.kind !== 'workflow' && context.kind !== 'document') {
    throw new TypeError('context.kind is invalid');
  }
  const parsed = value as unknown as ContextScope;
  if (contextId.length === 0 || projectId.length === 0) throw new TypeError('scope identity is invalid');
  let manifestAnchorCount: number | undefined;
  if (source.manifest !== undefined) {
    const manifest = parseContextScopeManifest(source.manifest);
    manifestAnchorCount = manifest.anchors.length;
    if (manifest.id !== contextId || manifest.kind !== context.kind) {
      throw new TypeError('source.manifest identity must match context');
    }
  }
  if (source.workContexts !== undefined) {
    const workContexts = array(source.workContexts, 'source.workContexts', MAX_CONTEXT_SCOPE_ANCHORS);
    if (workContexts.length === 0) throw new TypeError('source.workContexts must not be empty');
    if (manifestAnchorCount !== undefined && workContexts.length !== manifestAnchorCount) {
      throw new TypeError('source.workContexts must match source.manifest anchors');
    }
    for (const [index, workContext] of workContexts.entries()) {
      parseWorkContextSource(workContext, `source.workContexts[${index}]`, sourceRepositoryRoot, projectId);
    }
  }
  if (documentEvidence !== undefined) {
    for (const [index, evidence] of documentEvidence.entries()) {
      parseDocumentEvidence(evidence, `documentEvidence[${index}]`);
    }
  }
  return parsed;
}

function documentEvidenceForReport(report: SemDocWorkContext): ContextScopeDocumentEvidence {
  return {
    root: report.documents.root,
    target: {
      status: report.documents.target.status,
      ...(report.documents.target.symbol === undefined ? {} : { symbol: report.documents.target.symbol }),
      definitions: report.documents.target.definitions.length,
      backlinks: report.documents.target.backlinks.length,
      candidates: report.documents.target.candidates.length,
    },
    missingReferences: report.documents.missingReferences,
  };
}

function parseDocumentEvidence(value: unknown, path: string): ContextScopeDocumentEvidence {
  const item = record(value, path);
  assertKnownFields(item, ['root', 'target', 'missingReferences'], path);
  visibleTextString(item.root, `${path}.root`);
  const target = record(item.target, `${path}.target`);
  assertKnownFields(target, ['status', 'symbol', 'definitions', 'backlinks', 'candidates'], `${path}.target`);
  if (target.status !== 'resolved' && target.status !== 'unresolved') {
    throw new TypeError(`${path}.target.status is invalid`);
  }
  if (target.symbol !== undefined) visibleTextString(target.symbol, `${path}.target.symbol`);
  nonNegativeInteger(target.definitions, `${path}.target.definitions`);
  nonNegativeInteger(target.backlinks, `${path}.target.backlinks`);
  nonNegativeInteger(target.candidates, `${path}.target.candidates`);
  nonNegativeInteger(item.missingReferences, `${path}.missingReferences`);
  return value as ContextScopeDocumentEvidence;
}

/** Validates a multi-anchor manifest before it is used to collect reports. */
export function parseContextScopeManifest(value: unknown): ContextScopeManifest {
  const item = record(value, 'manifest');
  assertKnownFields(item, ['schemaVersion', 'id', 'kind', 'label', 'anchors'], 'manifest');
  if (item.schemaVersion !== CONTEXT_SCOPE_MANIFEST_SCHEMA) {
    throw new TypeError(`manifest schemaVersion must be ${CONTEXT_SCOPE_MANIFEST_SCHEMA}`);
  }
  visibleTextString(item.id, 'manifest.id');
  if (!CONTEXT_SCOPE_KINDS.has(item.kind as ContextScopeKind)) {
    throw new TypeError('manifest.kind is invalid');
  }
  if (item.label !== undefined) visibleTextString(item.label, 'manifest.label');
  const anchors = array(item.anchors, 'manifest.anchors', MAX_CONTEXT_SCOPE_ANCHORS);
  if (anchors.length === 0) throw new TypeError('manifest.anchors must not be empty');
  const keys: string[] = [];
  for (const [index, anchor] of anchors.entries()) {
    const entry = record(anchor, `manifest.anchors[${index}]`);
    assertKnownFields(entry, ['role', 'entity', 'file'], `manifest.anchors[${index}]`);
    if (entry.role !== 'root' && entry.role !== 'endpoint' && entry.role !== 'trigger'
      && entry.role !== 'command' && entry.role !== 'definition') {
      throw new TypeError(`manifest.anchors[${index}].role is invalid`);
    }
    const entity = canonicalVisibleText(entry.entity, `manifest.anchors[${index}].entity`);
    const file = entry.file === undefined
      ? undefined
      : canonicalVisiblePath(entry.file, `manifest.anchors[${index}].file`);
    keys.push(`${entity}\0${file ?? ''}`);
  }
  assertUnique(keys, 'manifest.anchors');
  return value as ContextScopeManifest;
}

function addEdge(
  edges: Map<string, ContextScopeEdge>,
  reasons: Set<ContextScopeIncompleteReason>,
  maxEdges: number,
  edge: ContextScopeEdge,
): void {
  const key = `${edge.from}\0${edge.to}\0${edge.kind}\0${edge.evidence.relation}`;
  if (edges.has(key)) return;
  if (edges.size >= maxEdges) {
    reasons.add('edges');
    return;
  }
  edges.set(key, edge);
}

function toSymbolRef(entity: SemEntity, projectId: string): SymbolRef {
  return {
    projectId,
    filePath: foundationNormalizeRepositoryPath(entity.file),
    entityId: foundationCanonicalEntityId(entity),
  };
}

function digestWorkContext(report: SemDocWorkContext): string {
  // Historical worktrees are materialized under a new temporary absolute path
  // for every commit. Repository-root metadata is intentionally normalized so
  // the same commit and request produce the same digest across worktrees.
  const serialized = JSON.stringify(report, (key, value: unknown) =>
    key === 'repositoryRoot' || key === 'root' ? '<repository>' : value);
  return createHash('sha256').update(serialized, 'utf8').digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) throw new TypeError(`${path} must be an object`);
  return value;
}

function array(value: unknown, path: string, maximum: number): readonly unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${path} must be an array`);
  if (value.length > maximum) throw new TypeError(`${path} exceeds ${maximum} items`);
  return value;
}

function assertKnownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): void {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedSet.has(key));
  if (unknown.length > 0) throw new TypeError(`${path} contains unknown field: ${unknown[0]}`);
}

function assertUnique(values: readonly string[], path: string): void {
  if (new Set(values).size !== values.length) throw new TypeError(`${path} contains duplicate values`);
}

function visibleTextString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new TypeError(`${path} must be text`);
  return visibleText(value, path);
}

function parseSymbolRef(value: unknown, path: string): SymbolRef {
  const item = record(value, path);
  const projectId = canonicalVisibleText(item.projectId, `${path}.projectId`);
  const filePath = canonicalVisiblePath(item.filePath, `${path}.filePath`);
  const entityId = canonicalVisibleText(item.entityId, `${path}.entityId`);
  return {
    projectId,
    filePath,
    entityId,
  };
}

function canonicalVisibleText(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new TypeError(`${path} must be text`);
  const normalized = visibleText(value, path);
  if (value !== normalized) throw new TypeError(`${path} must be canonical text`);
  return normalized;
}

function canonicalVisiblePath(value: unknown, path: string): string {
  const raw = canonicalVisibleText(value, path);
  const normalized = foundationNormalizeRepositoryPath(raw);
  if (raw !== normalized) throw new TypeError(`${path} must be a canonical repository path`);
  return normalized;
}

function parseArgs(value: unknown, path: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new TypeError(`${path} must be an array of strings`);
  }
  if (value.length > MAX_CONTEXT_SCOPE_ARGS) {
    throw new TypeError(`${path} exceeds ${MAX_CONTEXT_SCOPE_ARGS} items`);
  }
  for (const [index, item] of value.entries()) {
    visibleTextString(item, `${path}[${index}]`);
  }
  return value;
}

function parseWorkContextSource(
  value: unknown,
  path: string,
  repositoryRoot: string,
  projectId: string,
): ContextScopeWorkContextSource {
  const source = record(value, path);
  assertKnownFields(source, ['workContext', 'repositoryRoot', 'revision', 'engine', 'workContextDigest', 'request'], path);
  if (source.workContext !== WORK_CONTEXT_SCHEMA) throw new TypeError(`${path}.workContext is invalid`);
  if (source.repositoryRoot !== repositoryRoot) throw new TypeError(`${path}.repositoryRoot must match source.repositoryRoot`);
  const revision = record(source.revision, `${path}.revision`);
  assertKnownFields(revision, ['repositoryRoot', 'gitHead', 'workingTreeDigest'], `${path}.revision`);
  if (revision.repositoryRoot !== repositoryRoot) throw new TypeError(`${path}.revision.repositoryRoot must match source.repositoryRoot`);
  canonicalVisibleText(revision.gitHead, `${path}.revision.gitHead`);
  canonicalVisibleText(revision.workingTreeDigest, `${path}.revision.workingTreeDigest`);
  const engine = record(source.engine, `${path}.engine`);
  assertKnownFields(engine, ['name', 'version'], `${path}.engine`);
  if (engine.name !== 'sem') throw new TypeError(`${path}.engine.name must be sem`);
  canonicalVisibleText(engine.version, `${path}.engine.version`);
  const digest = canonicalVisibleText(source.workContextDigest, `${path}.workContextDigest`);
  if (!/^[a-f0-9]{64}$/u.test(digest)) throw new TypeError(`${path}.workContextDigest must be a SHA-256 digest`);
  const request = record(source.request, `${path}.request`);
  assertKnownFields(request, ['entity', 'file', 'depth', 'budget', 'impactArgs', 'contextArgs', 'execution'], `${path}.request`);
  canonicalVisibleText(request.entity, `${path}.request.entity`);
  if (request.file !== undefined) canonicalVisiblePath(request.file, `${path}.request.file`);
  if (request.depth !== 1 && request.depth !== 2) throw new TypeError(`${path}.request.depth is invalid`);
  positiveLimitValue(request.budget, `${path}.request.budget`);
  parseArgs(request.impactArgs, `${path}.request.impactArgs`);
  parseArgs(request.contextArgs, `${path}.request.contextArgs`);
  parseExecutionProvenance(request.execution, `${path}.request.execution`);
  return value as ContextScopeWorkContextSource;
}

function anchorRole(kind: ContextScopeKind): ContextScopeAnchorRole {
  switch (kind) {
    case 'api': return 'endpoint';
    case 'transaction': return 'trigger';
    case 'workflow': return 'command';
    case 'document': return 'definition';
    case 'screen': return 'root';
  }
}

function visibleText(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > 4096 || normalized.includes('\0')) {
    throw new TypeError(`${label} must be visible text within 4096 characters`);
  }
  return normalized;
}

function positiveLimit(value: number | undefined, fallback: number, label: string, maximum?: number): number {
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result <= 0 || (maximum !== undefined && result > maximum)) {
    throw new TypeError(`${label} must be a positive safe integer${maximum === undefined ? '' : ` up to ${maximum}`}`);
  }
  return result;
}

function positiveLimitValue(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
  return value;
}
