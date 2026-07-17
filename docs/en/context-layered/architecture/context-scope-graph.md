# ContextScope Symbol Graph

## Status and purpose

This document defines the design for grouping symbols by a meaningful context. It is a design
contract for the next Samdocs/architecture-governance PoC; it is not a claim that the graph artifact or
renderer is already implemented.

The first delivered slice is a screen: a screen is an entry symbol and the symbols structurally used by
that screen are displayed inside a larger visual boundary. The durable model is designed to support an
API boundary, a transaction, a workflow, or a document, but those adapters are not implied by the first
release. Therefore the durable abstraction is `ContextScope`, not `ScreenGraph`.

## Source layers

The graph is a projection over existing evidence layers:

```text
complete symbol snapshot + context manifest + SEM evidence
                         ↓
                 ContextScope graph JSON
                         ↓
                 compound graph renderer
```

The complete symbol snapshot remains the canonical inventory of definitions at a revision. A context
graph adds membership and relationships; it must not create a second identity system or silently replace
the snapshot with a partial traversal.

## Core contract

```ts
interface SymbolRef {
  projectId: string;
  filePath: string;
  entityId: string;
}

/** Derived with the existing symbolSetKey(SymbolRef); never authored as a second ID. */
type SymbolKey = string;

interface ContextScope {
  contractId: 'context-action/context-scope';
  contractVersion: '1.0';
  context: {
    id: string;
    kind: 'screen' | 'api' | 'transaction' | 'workflow' | 'document';
    label?: string;
  };
  source: {
    snapshot: {
      contractId: 'context-action/symbol-snapshot';
      contractVersion: '1.1';
      revision: SymbolSnapshotRevision;
    };
    manifest: {
      path: string;
      contentDigest: string;
    };
  };
  anchors: ContextAnchor[];
  nodes: SymbolRef[];
  edges: ContextEdge[];
  groups: SymbolGroup[];
  status: ContextScopeStatus;
}

interface ContextAnchor {
  role: ContextAnchorRole;
  symbol: SymbolRef;
}

type ContextAnchorRole =
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

type ContextEdgeKind =
  | 'depends-on'
  | 'invokes'
  | 'reads'
  | 'writes'
  | 'renders'
  | 'validates'
  | 'documents';

interface ContextEdge {
  /** `from` depends on, invokes, renders, reads, or writes `to`, as selected by `kind`. */
  from: SymbolKey;
  to: SymbolKey;
  kind: ContextEdgeKind;
  evidence:
    | { provider: 'sem'; relation: 'dependency' | 'dependent' }
    | { provider: 'manifest'; declarationId: string };
}

interface SymbolGroup {
  id: string;
  kind: 'context' | 'layer' | 'module' | 'project';
  label: string;
  memberNodeKeys: SymbolKey[];
}

type ContextScopeStatus =
  | { kind: 'complete'; appliedLimits: AppliedContextGraphLimits }
  | {
      kind: 'incomplete';
      appliedLimits: AppliedContextGraphLimits;
      reasons: ContextScopeIncompleteReason[];
    }
  | { kind: 'invalid'; errors: ContextScopeValidationError[] };

interface AppliedContextGraphLimits {
  maxDepth: number;
  maxNodes: number;
  maxEdges: number;
  maxGroups: number;
}

type ContextScopeIncompleteReason =
  | 'depth'
  | 'nodes'
  | 'edges'
  | 'groups'
  | 'budget'
  | 'evidence-unavailable';

type ContextScopeValidationError =
  | 'anchor-unresolved'
  | 'manifest-revision-mismatch'
  | 'unsupported-profile';

interface ContextManifest {
  schemaVersion: 1;
  contexts: ContextManifestEntry[];
}

interface ContextManifestEntry {
  id: string;
  kind: ContextScope['context']['kind'];
  label?: string;
  anchors: ContextAnchor[];
  declaredEdges?: DeclaredContextEdge[];
}

interface DeclaredContextEdge {
  id: string;
  from: SymbolRef;
  to: SymbolRef;
  kind: ContextEdgeKind;
}
```

`SymbolRef` is the existing canonical symbol identity: `projectId`, `filePath`, and `entityId` are the
identity tuple. `SymbolKey` is the deterministic serialization already used for that tuple; it is not a
new authored identity. Anchors, nodes, edges, and group members must therefore resolve against exactly
the same symbol identity. A group is a view boundary, not a symbol. Group membership can overlap, so a
shared symbol is referenced by multiple groups without duplicating its canonical node.

## Context profiles

Each context kind defines valid anchor roles and the edge vocabulary used by its adapter.

| Profile | Allowed anchor roles | Initial availability | Main relation path |
| --- | --- | --- | --- |
| `screen` | `root`, `view`, `state-read`, `state-write` | first adapter | component → rendered symbol → state read → child view |
| `api` | `endpoint`, `controller` | later adapter | endpoint → controller → service → repository/schema |
| `transaction` | `trigger`, `state-read`, `state-write`, `view` | later adapter | action → handler/business → state write → selector → affected view |
| `workflow` | `command`, `step` | unsupported in v1 | command → step → external effect → next step |
| `document` | `definition`, `reference` | unsupported in v1 | document definition → referenced symbol → implementation/test |

In the first adapter, SEM produces only `depends-on` edges. A semantic edge such as `renders`, `reads`,
or `writes` is admissible only when the manifest declares it with a stable declaration ID or a future,
versioned provider supplies its evidence. The v1 contract has no `inferred` evidence source. A generic
`depends-on` edge is useful for structural evidence, but it must not be presented as a runtime call or a
temporal ordering guarantee.

For a transaction, `writes` and `reads` describe state roles. They do not prove execution order. The
first screen-only adapter does not count internal calls or infer a complete runtime graph; transaction
evidence can be added later by an LSP or runtime provider.

## Context manifest

Contexts should be declared explicitly so that a route or action name is not mistaken for a symbol. The
manifest uses the complete snapshot identity, including `filePath`; it does not author `SymbolKey`.
Declared edges describe intent and remain distinguishable from SEM evidence. Context IDs and declared-edge
IDs must be unique within the manifest:

```json
{
  "schemaVersion": 1,
  "contexts": [
    {
      "id": "dashboard",
      "kind": "screen",
      "label": "Dashboard",
      "anchors": [
        {
          "role": "root",
          "symbol": {
            "projectId": "example",
            "filePath": "example/src/Dashboard.tsx",
            "entityId": "example/src/Dashboard.tsx::function::Dashboard"
          }
        }
      ],
      "declaredEdges": [
        {
          "id": "dashboard-renders-profile-card",
          "from": {
            "projectId": "example",
            "filePath": "example/src/Dashboard.tsx",
            "entityId": "example/src/Dashboard.tsx::function::Dashboard"
          },
          "to": {
            "projectId": "example",
            "filePath": "example/src/ProfileCard.tsx",
            "entityId": "example/src/ProfileCard.tsx::function::ProfileCard"
          },
          "kind": "renders"
        }
      ]
    },
    {
      "id": "update-profile",
      "kind": "transaction",
      "anchors": [
        {
          "role": "trigger",
          "symbol": {
            "projectId": "example",
            "filePath": "example/src/actions.ts",
            "entityId": "example/src/actions.ts::function::updateProfile"
          }
        }
      ]
    }
  ]
}
```

The manifest is intent. SEM output and other providers are evidence. A context with an unresolved anchor,
an unsupported profile, or a manifest taken from a different revision is `invalid`; it must not fall back
to a same-named symbol from another project or file. For a historical graph, the manifest is read from the
same selected commit as the snapshot. For a working-tree graph, the output records the manifest content
digest. A manifest therefore cannot silently be reused across a different snapshot revision.

## Derivation and completeness

The first derivation algorithm is a bounded breadth-first traversal from the declared anchors:

1. Validate the context profile and resolve every manifest anchor against the complete snapshot.
2. Verify that the manifest belongs to the same selected revision as the snapshot.
3. Load SEM dependency evidence and manifest-declared edges allowed by the profile.
4. Sort candidate edges by `from`, `to`, `kind`, and evidence reference *before* breadth-first expansion.
5. Traverse the allowed edge kinds to the configured depth, deduplicating by canonical symbol identity.
6. Materialize context, architectural-layer, project, or module memberships and sort every collection
   deterministically.

Graph options should be explicit and separate from snapshot limits:

```ts
interface ContextGraphOptions {
  maxDepth?: number;
  maxNodes?: number;
  maxEdges?: number;
  maxGroups?: number;
  onLimit?: 'error' | 'incomplete';
}
```

The source snapshot can remain complete even when a derived graph is bounded. The serializer records the
applied numeric limits, including the resolved `maxDepth`. If an allowed edge remains beyond that depth,
or a node, edge, group, or execution budget is reached, the result is `incomplete` with every applicable
reason. Missing evidence needed for traversal is also `incomplete`; malformed or revision-mismatched input
is `invalid`. Callers that require a complete view must fail closed. A truncated graph must never be
reported as complete.

## Bubble and renderer semantics

The renderer uses a compound graph layout:

```text
Context bubble
 ├─ UI / API / Action layer bubble
 ├─ project or module bubble
 └─ symbol nodes
```

Groups in the core graph are overlapping memberships around `memberNodeKeys`; they deliberately have no
parent pointer. A renderer selects one compatible membership projection when it needs nested bubbles. That
projection must be a forest: group IDs are unique, every member key exists in `nodes`, a child membership
is a subset of its parent membership, and cycles are invalid. The renderer must not force all overlapping
layer/module/context memberships into one tree. Edges remain visible across group boundaries so that a
shared service, store, or schema can be recognized as a cross-context dependency. Selecting a group
highlights its members; selecting a shared node lists every context that contains it. Layout coordinates,
colors, hierarchy projection, and collapsed state belong to the renderer or a presentation artifact, not
to the canonical symbol snapshot.

## Relationship to current Samdocs boundaries

The current Samdocs scope remains symbol identity, definition location, role documentation, usage files,
and revision history. `ContextScope` is a derived view over that catalog. It does not change the
lightweight LSP boundary and does not claim to prove business correctness, runtime behavior, or call
counts.

## Implementation sequence

1. Add the versioned `SymbolRef`, derived `SymbolKey`, `ContextScope`, manifest, and status contracts to
   Foundation, including JSON schemas and deterministic normalizers.
2. Add a repository-local context manifest under `architecture/`; validate complete anchor identities,
   profile roles, declared-edge IDs, and same-revision loading.
3. Implement only the screen adapter: SEM `depends-on` evidence plus manifest-declared edges. Fix its
   output with complete, invalid, and every incomplete-reason fixture.
4. Expose a JSON-producing graph command and schema export before choosing a renderer. Verify repeated
   bounded traversals produce byte-identical output.
5. Add API and transaction adapters only after their provider/manifest evidence has a tested edge mapping;
   reject workflow and document profiles until their adapters exist.
6. Add the compound graph UI and interaction evidence after the serialized contract is stable, then extend
   group intersection and boundary comparison using canonical node sets.

This ordering keeps the graph useful for history diff, context intersection, and documentation even when
no visual client is available.
