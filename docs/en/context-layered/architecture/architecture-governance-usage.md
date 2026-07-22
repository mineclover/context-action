# Architecture Governance Usage

This guide is the shortest path from a repository checkout to a reproducible Architecture Governance
symbol catalog. Use the [architecture governance overview](./architecture-governance) for concepts and
the [package README](https://github.com/mineclover/context-action/blob/main/packages/architecture-governance/README.md)
for the complete API and contract reference.

This is a Context-Action convention PoC: use it to validate repository-local authored rules and evidence,
not as a generic architecture analyzer or a documentation generator. `sem-doc` remains the separate
Symbol Context SSOT for work-context and document bindings.

## 1. Prepare the repository

The current PoC runs inside the `context-action` workspace and requires Node.js 24 and pnpm.
Install dependencies and build the governance package before invoking the CLI directly:

```bash
pnpm install
pnpm arch:build
```

The workspace pins `@ataraxy-labs/sem@0.21.0`. The default command resolution uses that package's
`sem` binary. Set `SEM_COMMAND` or pass `--sem-command` only when testing a different executable;
the provider must still report the supported identity `sem 0.21.0`.

## 2. Declare the catalog

Start with these repository-local files:

```text
architecture/
├── registry.json                 # capabilities, owners, anchors, tests, and docs
└── rules/
    ├── package-boundaries.json   # declared package dependency rules
    └── impact-boundaries.json    # SEM structural impact rules
```

An `implementationAnchors` entry uses a SEM top-level identity such as
`packages/foo/src/api.ts::function::createApi`. Keep the capability ID stable when a symbol is
renamed or moved. Add the registry `role` and an implementation-adjacent role comment, then connect the same capability to its
specification, representative test, and public documentation.

## 3. Run the checks

Use the smallest check that answers the current question:

```bash
# Validate JSON, paths, package declarations, and policy structure.
pnpm arch:check:registry

# Full registry + SEM entities/impact + evidence gate.
pnpm arch:check

# Full gate plus working-tree or staged change scope.
pnpm arch:check:changed
pnpm arch:check:staged
```

The root scripts build the package first. For a focused project or a reproducible CI range, use the
CLI explicitly:

```bash
node packages/architecture-governance/dist/cli.js check \
  --root . \
  --registry architecture/registry.json \
  --project core \
  --sem \
  --from <base-sha> \
  --to <head-sha> \
  --format markdown \
  --output reports/architecture-check.md
```

`--from` and `--to` must be supplied together. `--staged` cannot be combined with a commit range.
Repeat `--project` only for distinct project IDs. A repeated scalar option is an input error rather
than silently taking the last value.

## 4. Store complete snapshots and history

Use a snapshot when the complete symbol inventory at one revision is needed:

```bash
node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --worktree \
  --output reports/symbol-snapshot.json

node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --commit HEAD~1 \
  --output reports/symbol-snapshot-before.json
```

Compare two complete inventories by `projectId/filePath/entityId`:

```bash
node packages/architecture-governance/dist/cli.js snapshot-diff \
  --root . \
  --left reports/symbol-snapshot-before.json \
  --right reports/symbol-snapshot.json \
  --format markdown \
  --output reports/symbol-snapshot-diff.md
```

For a commit-by-commit first-parent report, pass the range explicitly:

```bash
node packages/architecture-governance/dist/cli.js history \
  --root . --registry architecture/registry.json \
  --from HEAD~20 \
  --to HEAD \
  --output reports/symbol-history.json
```

Each history commit contains a semantic delta and a complete snapshot for the registry's
`analysisProjects`. A project absent from a historical revision is retained as `skipped` with
`missing-at-revision`; the current worktree project list is never substituted.

If a full-repository snapshot reports an unresolved `symbol identity collision`, do not consume the partial
result. This means the provider output still contains an exact collision after nested kind-qualified ID
normalization. Resolve the source or project scope, or isolate a valid project while investigating:

```bash
node packages/architecture-governance/dist/cli.js snapshot \
  --root . --registry architecture/registry.json \
  --project architecture-governance \
  --worktree --format json \
  --output reports/architecture-governance-symbols.json
```

The CLI fails closed rather than choosing one exact identity silently. `analysisProjects.fileExtensions`
can reduce a project's collection scope, but it must not be used to hide an unresolved identity conflict.
When SEM gives same-name nested entities different kinds, the adapter emits a kind-qualified
`parent::kind::name` identity so both symbols remain in the complete snapshot.

## 5. Compare context symbol sets

When a screen, API, transaction, or other context has already been serialized as a symbol set,
compare it without creating a second graph:

```bash
node packages/architecture-governance/dist/cli.js intersect \
  --root . \
  --left reports/screen-symbols.json \
  --right reports/api-symbols.json \
  --format markdown \
  --output reports/context-intersection.md
```

Inputs are either `{ "id": "screen", "symbols": [...] }` or a history snapshot wrapped as
`{ "snapshot": { ... } }`. The result has deterministic `intersection`, `onlyLeft`, and
`onlyRight` sets. Membership can overlap; the original symbol identity is not duplicated.

## 6. Generate a ContextScope

`context-scope` validates one revision-bound manifest against a complete symbol snapshot. The CLI
projects manifest anchors and declared edges; the library API additionally accepts bounded SEM
`depends-on` evidence. It never turns the manifest into an `arch:check` capability input.

Every revision field provided by the manifest must match the corresponding snapshot field:

```json
{
  "schemaVersion": 1,
  "revision": { "gitHead": "<the gitHead from the snapshot>" },
  "contexts": [{
    "id": "dashboard",
    "kind": "screen",
    "anchors": [{
      "role": "root",
      "symbol": {
        "projectId": "example",
        "filePath": "example/src/Dashboard.tsx",
        "entityId": "example/src/Dashboard.tsx::function::Dashboard"
      }
    }]
  }]
}
```

```bash
node packages/architecture-governance/dist/cli.js context-scope \
  --root . \
  --snapshot reports/symbol-snapshot.json \
  --manifest architecture/contexts.json \
  --context dashboard \
  --format json \
  --output reports/dashboard-context-scope.json
```

The output is `context-action/context-scope@1.0`. `status.invalid` means an anchor or revision is
invalid; `status.incomplete` means a configured graph limit or requested evidence was unavailable.
The serialized node key is JSON-safe and derived from the existing `projectId/filePath/entityId` tuple.
The current CLI consumes explicit manifest edges; SEM dependency projection is available through
`createContextScope({ semAnalyses })` and remains structural rather than a runtime call graph.

## 7. Use sem-doc for document context (separate package)

`@context-action/sem-doc` is a separate package for combining SEM relationships with
Git and TSDoc bindings. It is not an Architecture Governance dependency, verification report, or registry
implementation:
it resolves the workspace-installed sem binary by default, including when analysis changes the
subprocess cwd to the repository root. Set `SEM_BIN` only to test a different executable.

```bash
pnpm --filter @context-action/sem-doc build

# Context for one top-level entity, including dependent files and document backlinks.
pnpm --filter @context-action/sem-doc exec node dist/cli.js \
  work-context SemClient \
  --file src/sem-client.ts \
  --docs-root spec \
  --depth 2 \
  --json

# Git working-tree evidence, including untracked files.
pnpm --filter @context-action/sem-doc exec node dist/cli.js diff --json

# Index and validate exact document-to-entity bindings.
pnpm --filter @context-action/sem-doc exec node dist/cli.js docs index spec --json
pnpm --filter @context-action/sem-doc exec node dist/cli.js docs validate-bindings spec --strict --json
```

Use `--depth 1` for direct relationships and `--depth 2` for a bounded transitive view. The
`usageFiles` field is a sorted file-level structural signal from SEM dependents; it is not an exact
reference location, runtime call graph, or function-call count. See the
[`sem-doc` README](https://github.com/mineclover/context-action/blob/main/packages/sem-doc/README.md)
for document frontmatter and `sem-doc-work-context.v5` details.
For the decision table and prohibited report/contract conflations, see the
[sem-doc and Architecture Governance boundary guide](./sem-doc-architecture-governance-boundary).

## Output and exit codes

Prefer `--format json` for automation and `--format markdown` for PR artifacts. The governance CLI
uses these exit codes:

| Code | Meaning |
| ---: | --- |
| `0` | The report passes the selected `--fail-on` threshold. |
| `1` | A finding reaches the selected threshold. |
| `2` | Input, filesystem, or SEM execution could not produce a valid report. |

Reports are review evidence. They do not prove business correctness, dynamic loading behavior,
runtime data flow, or internal function-call order. Keep behavior tests, owner review, and public
documentation as separate evidence sources.

## CI recipe

```bash
pnpm install --frozen-lockfile
pnpm arch:type-check
pnpm arch:check:registry
pnpm arch:check
pnpm arch:test
```

For a pull request, add the explicit `--from <base-sha> --to <head-sha>` check and upload the JSON or
Markdown report as an artifact. The range report narrows review scope; it does not replace the full
architecture gate.
