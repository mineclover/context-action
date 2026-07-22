# sem-doc Usage

`@context-action/sem-doc` is the operational Symbol Context plane. Use it when an implementer or
reviewer needs to answer which symbols, dependent files, documents, tests, and Git changes belong to
a change. It produces versioned advisory artifacts; it is not the Architecture Governance registry,
CI policy gate, complete architecture snapshot, or TypeDoc replacement.

## 1. Install the published package

`sem-doc` requires Node.js 24. The published package includes the pinned `@ataraxy-labs/sem@0.21.0`
runtime wrapper and the two Foundation packages, so a clean install provides the default `sem`
executable as well:

```bash
npm install --save-dev @context-action/sem-doc@^0.1.2
npx sem-doc version
```

For a workspace checkout, use the local build instead:

```bash
pnpm install
pnpm --filter @context-action/sem-doc build
node packages/sem-doc/dist/cli.js version
```

`SEM_BIN` is only needed when a repository intentionally uses a different sem executable:

```bash
SEM_BIN=/opt/tools/sem npx sem-doc version
```

## 2. Build the implementer context

Start with one target symbol and its definition file. The result is the
`sem-doc-work-context.v5` SSOT used by downstream context projections:

```bash
npx sem-doc work-context SemClient \
  --file src/sem-client.ts \
  --docs-root spec \
  --depth 1 \
  --json > managed/sem-client.context.json
```

Use `--depth 2` when the change crosses one additional relationship. The report contains symbol
identity, definition files, dependent usage files, affected tests, document bindings, Git revision,
and exact sem provenance. Its `execution` record preserves phase, owner, final state, timeout,
output limits, measured output usage, and elapsed time. `usageFiles` is a file-level dependent signal, not a source location or
runtime call graph.

For a screen, API, transaction, or workflow with multiple entry points, define a
`sem-doc-context-manifest.v1` and pass it to one context scope:

```bash
npx sem-doc context-scope \
  --manifest managed/dashboard.manifest.json \
  --project-id example \
  --json > managed/dashboard.scope.json
```

For a single entry point, the shorter form is sufficient:

```bash
npx sem-doc context-scope Dashboard \
  --file src/Dashboard.tsx \
  --context-id dashboard \
  --kind screen \
  --project-id example \
  --json > managed/dashboard.scope.json
```

The scope is a deterministic grouping projection over one work-context report (or a manifest's
reports). It is suitable for a visual bubble/group view, but does not infer call order, render flow,
read/write semantics, or runtime behavior.

## 3. Bind documents to exact symbols

Index Markdown checkpoints and validate code-backed bindings before review:

```bash
npx sem-doc docs index spec --json > managed/documents.json
npx sem-doc docs validate-bindings spec --strict --json > managed/binding-validation.json
```

Code-backed documents must declare `semDocumentKind: code` and the exact
`semEntityId`, `semEntityName`, `semEntityType`, and `semEntityFile` frontmatter fields. Conceptual,
architecture, process, and tooling documents may remain document-only. A checkpoint or display name
alone is never a symbol binding.

## 4. Compare changes and history

Compare two serialized operational scopes:

```bash
npx sem-doc context-scope-diff managed/before.json managed/after.json --json
```

Materialize the same scope over a bounded Git range. The aggregate budget applies to the complete
range; the commit budget applies to each commit, and both must be satisfied:

```bash
npx sem-doc context-scope-history HEAD~10 HEAD Dashboard \
  --project-id example \
  --file src/Dashboard.tsx \
  --aggregate-timeout-ms 3600000 \
  --aggregate-max-output-bytes 268435456 \
  --commit-timeout-ms 30000 \
  --commit-max-output-bytes 33554432 \
  --output managed/dashboard-history.ndjson \
  --json
```

Compare two branch histories by changed symbol identity:

```bash
npx sem-doc context-scope-compare \
  managed/left-history.ndjson managed/right-history.ndjson --json
```

Use NDJSON output for long ranges so the history writer does not retain every snapshot in memory; it
keeps only scalar entry accounting. The current array-returning reader materializes records for
validation/branch comparison, so very large consumers should process NDJSON incrementally. A valid
stream starts with exactly one base record and then unique commit entries. The historical worktree is
removed after each commit analysis.

`context-scope-compare` returns the changed-symbol/edge/group intersection of the two histories. This
is a changed-set intersection, not a claim about final snapshot membership. The history API analyzes a
single project/entity per request; `analysisProjects` traversal remains a Foundation repository
capability and requires a separate adapter.

## 5. Handle dependency surface explicitly

The default scanner excludes `node_modules`. To observe a directly referenced package surface,
opt in explicitly:

```bash
npx sem-doc work-context SemClient \
  --file src/sem-client.ts \
  --include-node-modules-surface \
  --json
```

The option is recorded in provenance. sem-doc retains only the graph-referenced direct one-hop
package surface and does not recursively inventory package internals. Generated files, vendor
directories, fixtures, and build output may also become visible because the underlying sem flag is
broad; use this mode deliberately.

## 6. Choose the right package

| Need | Package |
| --- | --- |
| Symbol-centered work context, document binding, Git diff, operational ContextScope | `@context-action/sem-doc` |
| Authored capability/role registry, policy verification, complete revision snapshots, CI/reviewer gate | `@context-action/architecture-governance` |
| Shared identity, revision, snapshot, and comparison contracts | `@context-action/sem-foundation-contracts` |
| Shared Git history/worktree and `analysisProjects` traversal | `@context-action/sem-foundation-repository` |

The two consumer packages share Foundation primitives but do not depend on each other's report
contracts. Use the [boundary guide](./sem-doc-architecture-governance-boundary) when a workflow needs
both: prepare implementer context with sem-doc, then run Architecture Governance's independent
architecture gate.

## 7. CI recipe

Keep serialized outputs as review artifacts rather than treating advisory evidence as a lint result:

```bash
npx sem-doc docs validate-bindings spec --strict --json
npx sem-doc work-context SemClient --file src/sem-client.ts --docs-root spec --json
npx sem-doc context-scope-history HEAD~10 HEAD Dashboard \
  --project-id example --file src/Dashboard.tsx --output managed/history.ndjson --json
```

For release verification, the repository workflow additionally checks package identities, builds all
workspace packages, verifies exports and tarballs, runs type/tests/docs gates, and publishes through
`.github/workflows/publish-packages.yml`.
