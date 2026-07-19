# sem-doc and Architecture Governance Boundary

`@context-action/sem-doc` and `@context-action/architecture-governance` are related
repository tools, but they are not two names for the same library and neither replaces the other.
They may use the same external `sem` executable and the policy-neutral Foundation packages, while
keeping separate inputs, reports, consumers, and release contracts.

The position is intentionally asymmetric: `sem-doc` is the operational Symbol Context plane, while
Architecture Governance is an experimental Context-Action convention-driven control plane. The latter
tests repository-local authored rules and evidence management; it is not a generic architecture standard
or document editor.

## Decision at a glance

| Package | Primary question | Main input | Main output | Consumer | Gate? |
| --- | --- | --- | --- | --- | --- |
| `@context-action/sem-doc` | What context, documents, and operational scope does an engineer need before changing this code? | target entity/path, TSDoc bindings, Git working-tree or staged state | `sem-doc-work-context.v4`, canonical `sem-doc-context-scope.v2`, `sem-documents.v3`, `sem-doc-git-diff.v1`, binding and benchmark reports | implementer, reviewer, agent | advisory context; not an architecture gate |
| `@context-action/architecture-governance` | Does the Context-Action-authored architecture contract have valid implementation and boundary evidence? | `architecture/registry.json`, policy sets, analysis projects, SEM evidence, optional revision/context manifest | verification report, complete symbol snapshot/history, snapshot diff, `ContextScope` | CI, maintainer, architecture reviewer | yes; selected findings fail the verification command |

The distinction is about responsibility, not implementation size. `sem-doc` is the Symbol Context SSOT
for work-context and document-binding reports. Architecture Governance is the SSOT for authored
architecture registry, evidence, policy, and snapshot contracts.

## Separate contracts and dependencies

```text
                   external sem executable
                    /                  \
                   /                    \
      @context-action/sem-doc    @context-action/architecture-governance
          work context, docs,             registry, policy, snapshots,
          scope, Git diff, advisory        history, ContextScope, gate
                   \                    /
                    \                  /
       @sem-foundation/contracts + @sem-foundation/repository
                 shared identity and Git primitives only
```

There must be no runtime dependency from one consumer package to the other. Foundation contracts may
be shared when their meaning is policy-neutral, but a report from one package is not automatically an
input contract for the other.

`sem-doc` requires `@sem-foundation/contracts` and `@sem-foundation/repository` at runtime. This is a
shared-foundation dependency, not a dependency on Architecture Governance; sem-doc no longer carries a
local fallback implementation for those contracts.

The shared `@sem-foundation/contracts` package also owns the policy-neutral
`createSymbolSnapshotEntry` conversion from a SEM entity to a complete snapshot entry. Each consumer
may adapt that entry into its own report, but neither consumer owns a second symbol identity/range
serializer.

## Not selected for these packages

The following technologies are not part of either package's runtime analysis boundary:

| Technology | Repository status | Reason |
| --- | --- | --- |
| `@ttsc/graph`, `ttsc-graph-router` | no package dependency or source import | compiler-resolved graph is a separate provider contract |
| `@samchon/graph` | no package dependency or source import | not needed for the current SEM-centered symbol/location scope |
| LSP / `vscode-languageserver` | no package dependency or runtime import | exact reference locations, unsaved overlays, and CodeAction are deferred |
| TypeDoc / `@context-action/typedoc-vitepress-sync` | used by the repository's API documentation pipeline only | not a symbol identity, impact, or architecture-verification engine |
| `@microsoft/tsdoc` parser | no package dependency | sem-doc uses its own Markdown/frontmatter and `[[Symbol]]` binding convention |
| tree-sitter | no direct dependency in this workspace | any engine internals remain behind the external `sem` process boundary |

The first three rows are genuinely unused by the current packages. TypeDoc remains active for API
documentation, but must not be described as the analyzer behind `sem-doc` or Architecture Governance.
Adding any deferred provider requires a separate contract, provenance model, and package-boundary review.

## What belongs where

### Use `sem-doc` for work context

Use `sem-doc` when the immediate task is to prepare a change or explain a document boundary:

- resolve a target entity and its definition source;
- collect bounded one-hop or two-hop structural relationships;
- list dependent files and affected tests as advisory evidence;
- index exact TSDoc entity bindings and backlinks;
- capture the Git working-tree or staged diff before editing.
- project the work-context into the canonical operational `sem-doc-context-scope.v2` grouping for a screen, API, or transaction review.
- materialize bounded commit snapshots/diffs, stream them as NDJSON, and intersect changed symbols from two branches.

`usageFiles` is a deduplicated file-level signal from SEM dependents. It is not an exact reference
index, call graph, runtime trace, or architecture approval.

The pinned sem 0.21.0 scanner excludes `node_modules` by default. sem-doc keeps that default unless
`--include-node-modules-surface` is explicitly supplied to `work-context`, `context-scope`, or
`context-scope-history`. The option passes sem's broad `--no-default-excludes` flag so graph-referenced
package files can be observed, then drops package-internal rows beyond one graph hop before work-context,
history, or branch artifacts are serialized. The exact flag is retained in request provenance.
Markdown indexing still skips `node_modules` and generated output directories.

Treat `sem-doc-work-context.v4`, `sem-doc-context-scope.v2`, `sem-documents.v3`, and `sem-doc-git-diff.v1` as the canonical
serialized artifacts for their respective contextual views. Do not recreate those views independently
in a UI, agent, or documentation script without preserving the same report provenance and contract.

### Use Architecture Governance for authored architecture evidence

Use Architecture Governance when the change must be checked against repository contracts:

- keep a stable `CA-*` capability and `SymbolRef` implementation anchor;
- verify owner, role, test, public-doc, and package/impact evidence;
- materialize a complete symbol snapshot for a revision;
- diff or traverse Git history without accepting a partial snapshot;
- project a revision-bound `ContextScope` for screen, API, or transaction grouping;
- fail CI or review when a selected policy/evidence finding reaches its threshold.

The registry is authored intent. SEM supplies structural evidence; it does not invent capabilities or
prove the product meaning of a role comment.

Architecture Governance is the architecture-contract SSOT, not the work-context SSOT. Its registry,
policy, snapshot/history, and snapshot-backed `ContextScope` artifacts must not be replaced by a sem-doc
work-context or operational scope report. The two scope views intentionally have different provenance:
sem-doc is derived from one or more bounded work-context reports; Architecture Governance is bound to a complete revision
snapshot and authored manifest.

## Independent workflow

The normal workflow is sequential but independent:

1. Run `sem-doc work-context`, `sem-doc context-scope`, and `sem-doc diff` while preparing a change. Use the result to find the
   relevant implementation, documents, tests, and changed files.
2. Update the appropriate spec, registry entry, implementation, tests, and public documentation.
3. Run `arch:check:registry` and the full Architecture Governance gate. Generate `snapshot`, `history`,
   `snapshot-diff`, or `context-scope` artifacts when the change needs revision or context evidence.
4. Review both reports according to their own contracts. A passing sem-doc report does not imply a
   passing architecture gate, and a passing architecture gate does not imply that a document binding
   or work-context report is complete.

An orchestration script may invoke both commands, but it must preserve their report names, versions,
provenance, and failure semantics instead of merging them into a new ambiguous “Samdocs” report.

## Prohibited conflations

- Do not feed `sem-doc-work-context.v4` directly into the Architecture Governance verification report.
- Do not treat `architecture/registry.json` as the TSDoc document-binding index.
- Do not treat `usageFiles` as exact symbol references or a runtime call graph.
- Do not use `ContextScope` membership as proof that a UI/API/transaction executes at runtime.
- Do not add a package dependency merely because both packages invoke SEM.
- Do not merge schema versions, CLI names, or release policies without a separate compatibility decision.
- Do not call either package “Samdocs” in new architecture documentation; name the package that owns the
  behavior.

## Review checklist

- Is the requested result work context/document navigation (`sem-doc`) or authored architecture evidence
  and a CI/reviewer gate (Architecture Governance)?
- Does the proposed field belong to that package's existing report contract?
- If a shared type is needed, is it policy-neutral and suitable for Foundation?
- Are Git revision and SEM provenance preserved independently in each report?
- Would a user understand which command to run and which failure is actionable?

See the package specifications for normative details: [`sem-doc/spec/sem-doc.md`](../../../../packages/sem-doc/spec/sem-doc.md)
and [`architecture-governance` README](../../../../packages/architecture-governance/README.md).
