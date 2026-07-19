# Package Boundary and Codebase Management Convention

**Status:** Active for new work and boundary changes
**Scope:** workspace packages, examples, demos, architecture evidence, and documentation ownership

This convention defines how the Context-Action repository is divided into packages and how a change moves
through the codebase. The package boundary is an ownership and dependency boundary, not only a folder name.
Each package must have one primary responsibility, one public contract, and one clear verification route.

## 1. Boundary rules

1. A package owns one coherent capability. If a change needs two unrelated responsibilities, split the work or
   record an architecture decision before adding code.
2. A package may depend on a lower-level package only through its declared package export. Do not import another
   package through a relative path, `src/`, `dist/`, or a test-only alias.
3. `package.json` is the source of truth for runtime, peer, optional, and development dependencies. A source
   import without a matching dependency declaration is a boundary defect.
4. `exports` is the public surface. Files that are not exported are implementation details and must not be used
   as a cross-package integration point.
5. A package README is a discovery page. The authoritative behavior and architecture contract belongs in one
   guide under `docs/`; do not copy a second, diverging specification into a README.
6. `dist/`, API reference pages, LLMS artifacts, coverage, and generated reports are derived outputs. Change
   their source and generator, then regenerate them; never make a generated file the canonical implementation.
7. A package boundary change requires a dependency review, focused proof, and documentation ownership update in
   the same change. A file move alone is not a completed migration.

## 2. Current package map

The following map is the current ownership model. It is intentionally small: a new package should be added only
when an existing package cannot own the responsibility without violating dependency direction or release needs.

| Package | Boundary role | Owns | Must not own |
| --- | --- | --- | --- |
| `@context-action/core` | runtime foundation | action pipeline, handler execution, schemas, core errors | React, browser UI, stores |
| `@context-action/mutative-core` | immutable runtime foundation | maintained Mutative-compatible draft, patch, and array engine | Context-Action adapters, React, time-travel policy |
| `@context-action/mutative` | runtime adapter | immutable update and patch utilities used by React | action orchestration or React contexts |
| `@context-action/react` | framework adapter | React contexts, stores, hooks, refs, tool integration | core policy, documentation generation, Git analysis |
| `@context-action/sem-foundation-contracts` | analysis contract foundation | symbol identity, snapshots, revisions, shared limits, wire contracts | SEM subprocesses, Git worktrees, architecture policy |
| `@context-action/sem-foundation-repository` | repository runtime foundation | Git revision, first-parent history, detached worktree lifecycle | symbol semantics, architecture rules, UI behavior |
| `@context-action/architecture-governance` | experimental convention control plane | Context-Action-authored capability registry, policy verification, complete snapshots/history, and its snapshot-backed ContextScope projection | generic architecture inference, React runtime features, general-purpose documentation generation |
| `@context-action/sem-doc` | operational Symbol Context plane | standalone advisory symbol/document context, canonical operational `sem-doc-context-scope.v2`, bindings, and Git diff integration | architecture convention/policy and snapshot-backed governance; reuse `@context-action/sem-foundation-*` |
| `@context-action/llms-generator` | documentation generator | LLMS summaries, priorities, derived documentation artifacts | runtime package behavior or architecture policy |
| `@context-action/typedoc-vitepress-sync` | API documentation adapter | TypeDoc-to-VitePress synchronization | handwritten guide content or runtime code |
| `@context-action/test-driven-docs` | test documentation tool | test metadata extraction and generated test documentation | package runtime APIs |
| `@context-action/style-testing` | UI verification tool | style/browser analysis and its CLI | core state management contracts |
| `@context-action/live-code-editor` | private integration surface | live editor package experiments | stable public runtime contracts until promoted |
| `@context-action/openrouter-browser-storage` | private integration surface | browser persistence for the OpenRouter example | generic storage abstractions for core/react |

`example/` and `demos/` are integration hosts, not libraries. They may compose public packages and demonstrate
architecture, but a reusable implementation belongs in a package before it is imported by another package.

`@context-action/sem-doc` has completed the workspace identity migration from the former `@tsdoc-edge/sem-doc`
name. Its source path and CLI binary are unchanged, and its public npm release is managed by the repository
publish workflow. It is the operational Symbol Context SSOT, not a temporary staging package or an Architecture
Governance adapter.
For screen/API/transaction grouping used during implementation, `sem-doc-context-scope.v2` is the single
operational projection. Architecture Governance's existing `context-action/context-scope@1.0` remains a
separate snapshot-bound architecture-review artifact and is not a second sem-doc implementation target.

## 3. Dependency direction

The default direction is:

```text
@context-action/core          ──→ @context-action/react
@context-action/mutative-core ──→ @context-action/mutative ──→ @context-action/react

@context-action/sem-foundation-contracts ──→ @context-action/sem-foundation-repository
                         ├──→ @context-action/architecture-governance ← @ataraxy-labs/sem
                         └──→ @context-action/sem-doc (operational Symbol Context plane)
```

The diagram describes ownership, not import syntax. In particular:

- `core` never depends on `react`.
- `react` consumes `core` and `mutative`; `mutative` consumes only the lower-level `mutative-core` runtime and does not import React types.
- `mutative-core` remains upstream-compatible and must not depend on Context-Action adapters or React.
- `sem-foundation-repository` consumes contracts, never the reverse.
- `architecture-governance` consumes foundation contracts/repository and SEM; foundation packages do not know
  about capabilities, policies, Context-Action UI, or registry files.
- `architecture-governance` and `sem-doc` are side-by-side consumers with different contracts; neither may
  add a runtime dependency on the other. Use [their boundary guide](./architecture/sem-doc-architecture-governance-boundary)
  when a change appears to cross both responsibilities.
- documentation generators may inspect source and docs, but runtime packages must not depend on generators.
- examples and demos are leaves in the dependency graph. A package must not import an example or demo.

The package-boundary policy files express enforceable cases. When a new dependency direction becomes stable,
add a named policy rule rather than relying on reviewer memory.

### Mutative contract propagation

The immutable runtime contract is owned by `@context-action/mutative-core` and
must be forwarded by `@context-action/mutative`:

- adapter `freeze` maps to core `enableAutoFreeze`; `strict` remains separate;
- patch consumers must preserve Set `replace` patches and use array paths for
  non-string Map keys or Symbol properties;
- adapter and time-travel tests must cover these behaviors after core changes.

See [Mutative Core History and Upstream References](./mutative-core-history.md)
for the authoritative behavior and synchronization record.

## 4. Package contract

Every package README and manifest should answer these questions:

```text
Package ID and stability: public | private | transitional | experimental
Primary responsibility:
Public entry points and exports:
Runtime dependencies:
Peer/optional dependencies:
Owned source directories:
Test and verification commands:
Authoritative guide:
Architecture capability or decision:
Migration/deprecation plan, if any:
```

The package directory follows this ownership layout unless a package's toolchain requires an explicit exception:

```text
packages/<package>/
├── package.json          # dependency and export contract
├── README.md             # discovery and consumer quickstart
├── src/                  # canonical implementation
├── test/ or __tests__/   # executable behavior proof
├── docs/                 # package-specific detail only when needed
├── schemas/              # versioned public schemas, if any
└── dist/                 # generated output; never edit by hand
```

`architecture/registry.json` records stable capability identity and evidence. It does not replace a package
manifest, package README, or public guide. A capability anchor must point into the owning package, and a package
boundary change must update the affected capability or decision record.

## 5. Development lifecycle for a package-scoped change

### Step 1 — classify the change

Choose one primary class before editing:

| Class | Package question | Required source of truth |
| --- | --- | --- |
| public API | Does an exported type or entry point change? | package source/JSDoc, API docs, migration note |
| runtime behavior | Does state, action, store, or tool behavior change? | package spec, focused test, runnable example |
| boundary | Does ownership or dependency direction change? | this convention, policy rule, decision record |
| analysis contract | Does a snapshot, manifest, schema, or identity change? | schema, parser/validator, fixture, architecture guide |
| documentation/tooling | Does only a generated or authored documentation flow change? | generator source, authoritative guide, docs gate |

### Step 2 — select the owning package

Use the package whose public responsibility changes, not the package where the first convenient helper lives.
If the change crosses two package contracts, keep the implementation in the lower-level owner and expose a
minimal adapter in the higher-level owner. Do not create a new `shared` package to avoid making this decision.

### Step 3 — write the contract before expansion

For a new capability or boundary, record:

- stable capability/contract ID and owner;
- scope and explicit non-goals;
- dependency and export changes;
- state/input/output/invariants or schema revision;
- focused tests and documentation route;
- migration and removal conditions for transitional code.

Use the [Specification, Issue, and Documentation Management Convention](./change-management-convention) for
issue and decision records, and [Architecture Governance](./architecture/architecture-governance) for stable
symbol evidence.

### Step 4 — implement and verify in package order

For changes to the Context-Action runtime, build and verify from lower to higher layers:

```bash
pnpm build:core
pnpm build:react
pnpm --filter example type-check
pnpm --filter example check
pnpm example:build
```

For analysis and architecture changes:

```bash
pnpm arch:type-check
pnpm arch:test
pnpm arch:check:registry
pnpm docs:build
```

Add package-specific tests and package export/tarball checks when the public surface changes.

### Step 5 — update the ownership graph

Before handoff, update all affected layers:

1. package manifest and exports;
2. package README and authoritative guide;
3. tests and fixtures;
4. dependency policy or architecture registry/decision;
5. English/Korean public pages when the behavior is public;
6. generated artifacts only after their source is correct.

### Document-to-symbol binding convention

When a Markdown or MDX document is intended to explain one implementation symbol, treat it as a
code-backed SSOT document and require `semDocumentKind: code` plus the four sem-doc frontmatter fields:

```yaml
semDocumentKind: code
semEntityId: src/auth.ts::function::authenticateUser
semEntityName: authenticateUser
semEntityType: function
semEntityFile: src/auth.ts
```

The document must also contain exactly one canonical H1 checkpoint, for example `# [[Authentication
Entry Point]]`. Concept, architecture, process, and tooling guides may remain document-only, but they
are not a resolved symbol SSOT. `external-reference` documents may describe direct dependency surface
evidence but must not claim ownership of a `node_modules` entity. An `unresolved` work-context result
for a code-backed document is a documentation issue, not a successful fallback to a same-named symbol.

Use strict validation for the repository's authoritative docs root:

```bash
pnpm --filter @context-action/sem-doc exec node dist/cli.js docs validate-bindings <docs-root> --strict --json
```

Strict mode requires every document to declare `semDocumentKind`, requires exact bindings for `code`
documents, and rejects bindings on non-code documents.

For code-backed documentation changes, reviewers run both the declared-binding validator and a
representative context query:

```bash
pnpm --filter @context-action/sem-doc exec node dist/cli.js docs validate-bindings <docs-root> --strict --json
pnpm --filter @context-action/sem-doc exec node dist/cli.js work-context <entity> --docs-root <docs-root> --json
```

The exact rules are owned by the [sem-doc document entity binding convention](../../../packages/sem-doc/spec/conventions/document-entity-binding.md).

## 6. Adding, merging, splitting, or deprecating packages

### Add

A new package needs a package ID, owner, stability status, one-sentence responsibility, public/private
decision, dependency graph, export contract, focused test command, README, authoritative guide, and boundary
policy. If it is private or experimental, state the promotion criteria.

### Merge

Merge packages only when they share the same release cadence, ownership, dependency direction, and public
contract. Move source and tests together, preserve stable IDs, remove the old export, and record a migration
decision. Do not merge merely because two packages are small.

### Split

Split when a package has two independent release contracts, introduces an upward dependency, or mixes runtime,
analysis, and documentation concerns. The lower-level package owns the stable contract; adapters stay above it.

### Deprecate

Mark the package `transitional` or `experimental` in its README, keep a replacement link and removal condition,
stop adding new cross-package consumers, and add a verification gate that prevents accidental new imports.

## 7. Codebase cleanup rules

- Remove duplicate implementations only after identifying the canonical owner and adding a re-export or migration
  path where compatibility requires it.
- Keep `utils` local to a package unless the function is a versioned, policy-neutral contract. Shared utility
  extraction requires a consumer list and a dependency-direction check.
- Keep tests beside the package they prove. Cross-package integration tests belong in the integration host or the
  higher-level package, not in a lower-level package's unit suite.
- Keep architecture and documentation tooling out of runtime packages. A runtime package may expose metadata or
  JSDoc, but it must not import a docs generator to produce its own contract.
- Do not use `dist` or generated API files to resolve a source ownership question. Trace the import to the owning
  `src` package and its `exports` entry.
- When a file moves across package boundaries, treat it as an API/architecture change even if TypeScript still
  compiles.

## 8. Review checklist

- [ ] One owning package and one primary change class are explicit.
- [ ] Responsibility and non-goals are written in the package README or linked guide.
- [ ] Runtime/peer/dev dependencies match source imports.
- [ ] Cross-package imports use declared exports only.
- [ ] No lower-level package imports a higher-level adapter, example, or generator.
- [ ] Tests live with the contract they prove and include a boundary regression where needed.
- [ ] Registry, policy, schema, and decision evidence are updated for durable boundaries.
- [ ] Code-backed SSOT documents declare exact sem entity frontmatter and resolve in a representative work-context.
- [ ] English/Korean docs and discovery links are aligned for public behavior.
- [ ] Generated files were regenerated from source, not hand-edited.
- [ ] The proportional package and repository gates were run and recorded.

## Related documents

- [Convention Index](./convention-index)
- [Implementation Convention](./implementation-convention)
- [Specification, Issue, and Documentation Management](./change-management-convention)
- [Architecture Governance](./architecture/architecture-governance)
- [Architecture Policy Sets](./architecture/../../../../architecture/rules/README.md)
