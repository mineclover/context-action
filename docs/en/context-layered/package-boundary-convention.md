# Package Boundary and Codebase Management Convention

**Status:** Active for new work and boundary changes
**Scope:** workspace packages, examples, demos, decision records, and documentation ownership

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
| `@context-action/core` | runtime foundation | action pipeline, handler execution, validation contract, core errors | React, tool transports, Zod, browser UI, stores |
| `@context-action/tool-protocol` | transport contract foundation | JSON Schema, Zod action schemas, MCP/provider adapters, tool calls, approval queue, call idempotency/provenance/observability contracts | React rendering, action registry internals, durable persistence, architecture policy |
| `@context-action/ai-sdk` | provider adapter | AI SDK ToolSet conversion, per-turn tool scope, model-call correlation, native approval/error adaptation | action execution, React rendering, provider credentials, durable persistence |
| `@context-action/tool-durable-operations` | mutation safety foundation | durable operation records, side-effect runner, HTTP/queue adapters, IndexedDB/Redis/PostgreSQL reference backends | provider-neutral tool schemas, React rendering, domain-specific idempotency/outbox policy |
| `@context-action/mutative-core` | immutable runtime foundation | maintained Mutative-compatible draft, patch, and array engine | Context-Action adapters, React, time-travel policy |
| `@context-action/mutative` | runtime adapter | immutable update and patch utilities used by React | action orchestration or React contexts |
| `@context-action/react` | framework adapter | React contexts, stores, hooks, refs, tool integration | core policy, documentation generation, Git analysis |
| `@context-action/llms-generator` | documentation generator | LLMS summaries, priorities, derived documentation artifacts | runtime package behavior or architecture policy |
| `@context-action/typedoc-vitepress-sync` | API documentation adapter | TypeDoc-to-VitePress synchronization | handwritten guide content or runtime code |
| `@context-action/style-testing` | UI verification tool | style/browser analysis and its CLI | core state management contracts |
| `@context-action/live-code-editor` | private integration surface | live editor package experiments | stable public runtime contracts until promoted |
| `@context-action/openrouter-browser-storage` | private integration surface | browser persistence for the OpenRouter example | generic storage abstractions for core/react |

`example/` and `demos/` are integration hosts, not libraries. They may compose public packages and demonstrate
architecture, but a reusable implementation belongs in a package before it is imported by another package.

The former test-driven documentation package and its repository-owned examples were removed during the 0.8/0.9
stabilization. Public API documentation now has one path: exported source and JSDoc → TypeDoc →
`typedoc-vitepress-sync` → VitePress. LLMS summaries are derived from canonical `docs/` content and are not an
alternative API SSOT.

## 3. Dependency direction

The default direction is:

```text
@context-action/core          ──→ @context-action/react
@context-action/tool-protocol ──→ @context-action/react
@context-action/tool-protocol ──→ @context-action/ai-sdk ──→ application provider setup
@context-action/tool-durable-operations ──→ @context-action/react
@context-action/mutative-core ──→ @context-action/mutative ──→ @context-action/react

```

The diagram describes ownership, not import syntax. In particular:

- `core` never depends on `react`.
- `tool-protocol` is framework-neutral and does not depend on `core` or `react`; it owns the provider/tool boundary.
- `ai-sdk` is a thin optional provider adapter. It depends on `tool-protocol` and has `ai` as a required peer, but it never depends on React, core execution, provider credentials, or an application model client.
- `tool-durable-operations` is framework-neutral and does not depend on `core`, `react`, or `tool-protocol`; it owns durable mutation recovery and provider side-effect adapters.
- `react` consumes `core` and `mutative`; `mutative` consumes only the lower-level `mutative-core` runtime and does not import React types.
- `mutative-core` remains upstream-compatible and must not depend on Context-Action adapters or React.
- documentation generators may inspect source and docs, but runtime packages must not depend on generators.
- examples and demos are leaves in the dependency graph. A package must not import an example or demo.

`pnpm package-boundary:check` verifies workspace imports against dependency declarations and the target
package's public `exports`, and rejects runtime relative imports that escape the owning package or integration host. It scans runtime source in every workspace package plus the integration-host
sources in `example/` and `demos/`. Package tests, scripts, and package-local examples may use declared
`devDependencies`; runtime source may not. Test-only tooling does not change the published boundary.

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
Specification or decision ID:
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

Stable package-boundary choices belong in [Architecture Decision Records](./decisions/). A decision record does
not replace a package manifest, package README, or public guide. Its implementation and evidence anchors must
point into the owning package.

## 5. Development lifecycle for a package-scoped change

### Step 1 — classify the change

Choose one primary class before editing:

| Class | Package question | Required source of truth |
| --- | --- | --- |
| public API | Does an exported type or entry point change? | package source/JSDoc, API docs, migration note |
| runtime behavior | Does state, action, store, or tool behavior change? | package spec, focused test, runnable example |
| boundary | Does ownership or dependency direction change? | this convention, decision record, focused boundary check |
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
issue and decision records.

### Step 4 — implement and verify in package order

For changes to the Context-Action runtime, build and verify from lower to higher layers:

```bash
pnpm build:core
pnpm build:react
pnpm --filter example type-check
pnpm --filter example check
pnpm example:build
```

Add package-specific tests and package export/tarball checks when the public surface changes.

### Step 5 — update the ownership graph

Before handoff, update all affected layers:

1. package manifest and exports;
2. package README and authoritative guide;
3. tests and fixtures;
4. dependency declaration, boundary check, or decision record;
5. English/Korean public pages when the behavior is public;
6. generated artifacts only after their source is correct.

## 6. Adding, merging, splitting, or deprecating packages

### Add

A new package needs a package ID, owner, stability status, one-sentence responsibility, public/private
decision, dependency graph, export contract, focused test command, README, authoritative guide, and a
boundary check or decision record. If it is private or experimental, state the promotion criteria.

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
- [ ] Relevant dependency, schema, decision, and verification evidence is updated for durable boundaries.
- [ ] English/Korean docs and discovery links are aligned for public behavior.
- [ ] Generated files were regenerated from source, not hand-edited.
- [ ] The proportional package and repository gates were run and recorded.

## Related documents

- [Convention Index](./convention-index)
- [Implementation Convention](./implementation-convention)
- [Specification, Issue, and Documentation Management](./change-management-convention)
