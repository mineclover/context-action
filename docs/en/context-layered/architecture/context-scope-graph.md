# ContextScope Symbol Graph

## Status and purpose

This document defines the design for grouping symbols by a meaningful context. It is a design
contract for the next Samdocs/architecture-governance PoC; it is not a claim that the graph artifact or
renderer is already implemented.

The first use case is a screen: a screen is an entry symbol and the symbols structurally used by that
screen are displayed inside a larger visual boundary. The same model must also support an API boundary,
a transaction, a workflow, or a document. Therefore the durable abstraction is `ContextScope`, not
`ScreenGraph`.

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
interface ContextScope {
  schemaVersion: 'context-action/context-scope.v1';
  context: {
    id: string;
    kind: 'screen' | 'api' | 'transaction' | 'workflow' | 'document';
    label?: string;
  };
  revision: SymbolSnapshotRevision;
  anchors: ContextAnchor[];
  nodes: SymbolRef[];
  edges: ContextEdge[];
  groups: SymbolGroup[];
  completeness: {
    complete: boolean;
    maxDepth: number;
    truncated?: 'nodes' | 'edges' | 'groups' | 'budget';
  };
}

interface ContextAnchor {
  role: 'root' | 'endpoint' | 'trigger' | 'state-read' | 'state-write' | 'view';
  symbolId: string;
}

interface ContextEdge {
  from: string;
  to: string;
  kind:
    | 'depends-on'
    | 'invokes'
    | 'reads'
    | 'writes'
    | 'renders'
    | 'validates'
    | 'documents';
  source: 'sem' | 'declared' | 'inferred';
}

interface SymbolGroup {
  id: string;
  kind: 'context' | 'layer' | 'module' | 'project';
  label: string;
  memberNodeIds: string[];
  parentGroupId?: string;
}
```

`SymbolRef` is the existing canonical symbol identity: `projectId`, `filePath`, and `entityId` are the
identity tuple. A group is a view boundary, not a symbol. Group membership can overlap, so a shared
symbol is referenced by multiple groups without duplicating its canonical node.

## Context profiles

Each context kind defines valid anchor roles and the edge vocabulary used by its adapter.

| Profile | Typical anchors | Main relation path |
| --- | --- | --- |
| `screen` | root component, view | component → rendered symbol → state read → child view |
| `api` | endpoint, controller | endpoint → controller → service → repository/schema |
| `transaction` | trigger, state read/write, view | action → handler/business → state write → selector → affected view |
| `workflow` | command, step | command → step → external effect → next step |
| `document` | definition, reference | document definition → referenced symbol → implementation/test |

Adapters normalize provider-specific evidence into these semantic edge kinds. A generic `depends-on`
edge is useful for fallback structural evidence, but it must not be presented as a runtime call or a
temporal ordering guarantee.

For a transaction, `writes` and `reads` describe state roles. They do not prove execution order. The
current lightweight implementation intentionally does not count internal calls or infer a complete
runtime graph; such evidence can be added later by an LSP or runtime provider.

## Context manifest

Contexts should be declared explicitly so that a route or action name is not mistaken for a symbol.
The manifest points to canonical snapshot identities:

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
          "projectId": "example",
          "entityId": "example/src/Dashboard.tsx::function::Dashboard"
        }
      ]
    },
    {
      "id": "update-profile",
      "kind": "transaction",
      "anchors": [
        {
          "role": "trigger",
          "projectId": "example",
          "entityId": "example/src/actions.ts::function::updateProfile"
        }
      ]
    }
  ]
}
```

The manifest is intent. SEM output and other providers are evidence. A context should be reported as
incomplete or invalid when its anchor cannot be resolved in the selected revision; it should not fall
back to a same-named symbol from another project or file.

## Derivation and completeness

The first derivation algorithm is a bounded breadth-first traversal from the declared anchors:

1. Resolve each anchor against the complete snapshot.
2. Load SEM structural relations and declared role edges.
3. Traverse the profile's allowed edge kinds to the configured depth.
4. Deduplicate by canonical symbol identity.
5. Materialize groups by context, architectural layer, project, or module.
6. Sort nodes, edges, and groups deterministically.

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

The source snapshot can remain complete even when a derived graph is bounded. A graph that reaches a
limit must set `completeness.complete` to `false` and record the reason, or fail closed when the caller
requires a complete view. It must never return a truncated graph marked complete.

## Bubble and renderer semantics

The renderer uses a compound graph layout:

```text
Context bubble
 ├─ UI / API / Action layer bubble
 ├─ project or module bubble
 └─ symbol nodes
```

Nested groups are visual boundaries around `memberNodeIds`. Edges remain visible across group
boundaries so that a shared service, store, or schema can be recognized as a cross-context dependency.
Selecting a group highlights its members; selecting a shared node lists every context that contains it.
Layout coordinates, colors, and collapsed state belong to the renderer or a presentation artifact, not
to the canonical symbol snapshot.

## Relationship to current Samdocs boundaries

The current Samdocs scope remains symbol identity, definition location, role documentation, usage files,
and revision history. `ContextScope` is a derived view over that catalog. It does not change the
lightweight LSP boundary and does not claim to prove business correctness, runtime behavior, or call
counts.

## Implementation sequence

1. Add the versioned `ContextScope` contract and deterministic normalizers to Foundation.
2. Add a context manifest under `architecture/` and validate anchor identities.
3. Implement screen, API, and transaction adapters over snapshot plus SEM evidence.
4. Expose a JSON-producing graph command before choosing a renderer.
5. Add the compound graph UI and interaction evidence after the serialized contract is stable.
6. Extend group intersection and boundary comparison using canonical node sets.

This ordering keeps the graph useful for history diff, context intersection, and documentation even when
no visual client is available.
