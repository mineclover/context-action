# Architecture Governance and Evidence

Samdocs manages explicitly named symbols, their role descriptions, and definition locations. Context-Action
keeps that relationship in a small, repository-local registry and uses SEM structural evidence to collect
and verify the symbols in one pass.

## Source of truth

| Artifact | Responsibility |
| --- | --- |
| `architecture/registry.json` | Capability identity (`CA-*`), owner, definition anchor, evidence, and policy references |
| `architecture/rules/*.json` | Package declaration and SEM impact boundaries |
| `architecture/contexts.json` *(planned)* | Revision-bound context intent, complete anchor identities, and explicitly declared semantic edges |
| `packages/architecture-governance` | Registry loader, SEM adapter, verifier, report contract, and CLI |
| Verification report | Evidence and findings for a working tree, staged set, or commit range |

The registry is not a list of files. A capability represents a user-visible behavior, an independently changed design responsibility, or an architectural boundary that needs a stable owner. A verified capability should connect a specification, a SEM top-level implementation anchor, representative tests, and public documentation.

### Identity vocabulary

The catalog intentionally keeps three identifiers separate:

- `capabilityId` (`CA-*`) identifies an architectural responsibility in `registry.json`.
- `SymbolRef` (`projectId`, repository-relative `filePath`, and `entityId`) identifies a concrete code symbol in a snapshot.
- `contextId` identifies a derived screen, API, transaction, workflow, or document scope.

`implementationAnchors` connect a capability to one or more `SymbolRef` values. A context manifest reuses
the same `SymbolRef` tuple; it must not create a second symbol ID. This separation allows one capability to
have multiple implementation symbols and one symbol to participate in multiple context scopes.

This is a symbol catalog gate, not an architecture inference engine. The author declares the symbol and
its role comment; SEM supplies the definition location; the test runner proves behavior; and the
documentation system owns the public explanation.

For a command-by-command walkthrough, see [Architecture Governance Usage](./architecture-governance-usage).

## Capability lifecycle

| Status | Meaning | Minimum evidence |
| --- | --- | --- |
| `planned` | Intent and owner are agreed, but implementation has not started | spec, owner |
| `implemented` | A representative implementation anchor exists | spec, owner, implementation anchor |
| `verified` | Implementation, behavior tests, and public contract are current | spec, owner, anchor, test, public docs |
| `deprecated` | The capability is being replaced or removed | spec, owner, decision or replacement |

Do not promote a status ahead of its evidence. Keep the capability ID stable when only the name changes; record mergers, splits, and replacements in a decision document.

## Verification workflow

Run the narrowest useful check while editing, then run the full gate before review:

```bash
pnpm arch:check:registry  # JSON, paths, and package declarations
pnpm arch:check:changed   # full validation plus working-tree SEM diff
pnpm arch:check:staged    # full validation plus staged SEM diff
pnpm arch:check           # full SEM entities, impact, and evidence gate
pnpm arch:type-check      # shared Foundation and governance package type checks
```

The changed or staged report identifies the documents and tests that deserve review; it does not replace the full architecture gate. Pull requests additionally produce a base/head report so the change scope is independent of the local working tree. `arch:test` covers the Foundation contracts, repository history/worktree runtime, and governance CLI tests.

For a commit-by-commit symbol history, use `arch-verify history --from <ref> --to <ref>`. The command
enumerates the Git first-parent history, serializes each `sem diff` delta as a file path plus canonical
symbol (`kind::name`), and materializes a complete `snapshot.symbols` list for every commit from an
isolated Git worktree. Deltas describe movement; snapshots are the source for future context-boundary and
symbol-intersection analysis. Snapshot entries retain the registry analysis `projectId` alongside the
file path, symbol, kind, and source lines. When a registry path is supplied, that registry must exist
at every historical revision; the collector fails closed instead of reusing the current worktree scope.

For a single revision, use `snapshot` to serialize the complete inventory. To compare two complete
inventories, use `snapshot-diff`:

```bash
node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --commit HEAD --format json --output reports/symbol-snapshot.json

node packages/architecture-governance/dist/cli.js snapshot-diff \
  --root . --left reports/snapshot-before.json \
  --right reports/snapshot-after.json --format markdown \
  --output reports/symbol-snapshot-diff.md
```

The snapshot contract is `context-action/symbol-snapshot@1.1`; history is
`context-action/symbol-history-report@1.3`; and snapshot comparison is
`context-action/symbol-snapshot-diff@1.0`. Each snapshot preserves declared `analysisProjects` and their
`analyzed`/`skipped` provenance. Identity normalization, extension filters, collision handling, and
serialization limits are owned by the [package contract](https://github.com/mineclover/context-action/blob/main/packages/architecture-governance/README.md).

Limit defaults, `contractLimits` overrides, history budgets, and `unbounded` semantics are runtime
contract details owned by the [package README](https://github.com/mineclover/context-action/blob/main/packages/architecture-governance/README.md).
This overview only requires that a complete snapshot is never silently truncated.

To compare two context-specific serialized symbol sets, use the lightweight set operation:

```bash
node packages/architecture-governance/dist/cli.js intersect \
  --root . \
  --left reports/design-symbols.json \
  --right reports/architecture-symbols.json \
  --format markdown \
  --output reports/symbol-context-comparison.md
```

Each input is `{ "id": "context", "symbols": [...] }`, or a history snapshot wrapped as
`{ "snapshot": { ... } }`. A symbol is qualified by `projectId`, repository-relative `filePath`, and
canonical `entityId`; the report contains deterministic `intersection`, `onlyLeft`, and `onlyRight`
sets. This is a structural symbol-set operation, not a call graph or runtime-flow analysis, and a
history snapshot can be reused as either input.

The next planned derived view is `ContextScope`. Its first slice is a screen adapter that reads a
same-revision context manifest and projects a bounded subgraph over a complete snapshot. SEM contributes
only structural `depends-on` evidence in that slice; semantic edges require an explicit manifest
declaration or a future provider with its own evidence contract. Context groups are overlapping
memberships around the existing project/file/entity identity, so shared symbols do not duplicate identity.
Until that CLI exists, `architecture/contexts.json` is not an input to `arch:check`. See the
[ContextScope Symbol Graph design](./context-scope-graph) for the contract, profile availability, edge
semantics, completeness rules, and renderer boundary.

Context-Action role mapping, manifest ownership, and the planned `screen`/`transaction` profiles are
defined once in the [ContextScope Symbol Graph design](./context-scope-graph). This page only establishes
that ContextScope is a derived view over complete snapshots and is not an input to `arch:check` until its
CLI exists.

For a focused project, use the CLI after building the workspace package:

```bash
pnpm arch:test
pnpm arch:check:registry
node packages/architecture-governance/dist/cli.js check \
  --root . \
  --registry architecture/registry.json \
  --project core \
  --sem
```

The supported provider identity is pinned to `sem 0.21.0`. A provider version mismatch is a verification
failure, not an implicit upgrade.

## Samdocs scope

The intended unit is a named symbol such as a class, function, or other top-level entity. A role comment
explains why that symbol exists; the catalog records its `SymbolRef`, where it is defined, and which files
contain structural dependents of the symbol. A duplicate `SymbolRef` or ambiguous definition is a review
finding. In this PoC, role comments are authored next to the symbol and reviewed with the registry;
automatic `@samdocs`/`@role` comment extraction is the next collector step, not an LSP call-graph feature.

## What the gate verifies

- capability paths for the specification, owner, implementation anchor, representative test, and public documentation;
- declared package dependency boundaries from `package.json`;
- SEM top-level entity identity and source-file definition scope;
- `symbolUsages[].usageFiles` for the structural files containing dependents of each explicit anchor;
- optional package and impact boundaries used to protect the symbol catalog;
- working-tree, staged, or commit-range change scope, including binary and untracked paths;
- a versioned report contract in console, JSON, or Markdown form.

## What it does not prove

Samdocs intentionally does not count internal function calls, call order, or runtime data flow. Those are
LSP-level language-analysis concerns and are outside this lightweight catalog. SEM impact also supplies the
symbol-level `usageFiles` list but remains a structural file-level signal; it does not prove reflection, dynamic loading, business
correctness, or that the authored role comment expresses the right product intent. Keep behavior tests,
owner review, and public documentation as separate evidence sources. The shared SEM contract is
publish-ready, while registry publication and external semver pinning remain a separate release gate.
Git revision/history/worktree lifecycle and historical `analysisProjects` traversal are provided by the
policy-neutral `@sem-foundation/repository` runtime; SEM analysis and report policy remain consumer-owned.

## Report and failure semantics

The report contract is `context-action/architecture-verification-report@2.4`.

| Exit code | Meaning |
| ---: | --- |
| `0` | Report passes the selected `--fail-on` threshold |
| `1` | Architecture finding reaches the selected threshold |
| `2` | Input, filesystem, or SEM execution could not produce a valid verification result |

When SEM fails after earlier projects completed, the report preserves completed analyses and records the
requested, completed, and skipped projects in `semFailure`. A changed report narrows review scope; it
never replaces the full `arch:check` gate.

## Policies and exceptions

Use package-boundary rules for declared `package.json` dependencies and impact-boundary rules for actual SEM references. Keep the two evidence sources separate instead of expressing the same intent twice.

Do not add inline waivers or path ignores. A temporary exception must record its reason, owner, impact, and removal condition in a decision document, then be referenced from the affected capability and constrained to the smallest policy scope.

## Reading order

1. Use this page for the symbol catalog concept, verification boundary, and minimum commands.
2. Read [`governance-guide.md`](https://github.com/mineclover/context-action/blob/main/architecture/governance-guide.md) before adding a capability ID, `SymbolRef` anchor, or role comment.
3. Read [`architecture/rules/README.md`](https://github.com/mineclover/context-action/blob/main/architecture/rules/README.md) before adding a package or impact rule.
4. Use the generated changed/staged/range report during review.
5. Consult the [implementation review](https://github.com/mineclover/context-action/blob/main/architecture/implementation-review.md) for symbol limits, the intentional LSP boundary, and roadmap decisions.

The machine-readable registry and policy files live in the repository `architecture/` directory. The
package-level CLI, API, schema, and artifact contract are documented in
[`packages/architecture-governance/README.md`](https://github.com/mineclover/context-action/blob/main/packages/architecture-governance/README.md).
