# Documentation and Development Management Conventions

This document is the source of truth for producing and verifying documentation.
It distinguishes the human-authored source from derived API and LLM artifacts.
It complements the coding rules in [Conventions](./conventions.md); it does not
replace package-specific ownership or release rules.

For issue lifecycle, specification traceability, decision records, and review
handoff, use the [Specification, Issue, and Documentation Management
Convention](../context-layered/change-management-convention). This document
defines document-production rules; the linked convention defines how a change
is planned and closed.

> [!NOTE]
> **Enforcement Scope:** File pairing (`strict-paired` / `tracked-partial`), LLMS sync freshness (`pnpm llms:check`), catalog parity (`pnpm verify:surface-catalog`), VitePress builds (`pnpm docs:build`), and `<!-- @context-action-compile -->` snippet compilation (`pnpm verify:doc-snippets`) are **CI-Enforced**. Unmarked illustrative prose and snippets remain **Advisory**.

## 1. Documentation Ownership

| Surface | Owner and editing rule | Verification |
| --- | --- | --- |
| `docs/en/**`, `docs/ko/**` guides and concepts | Hand-authored source. Keep English and Korean pages aligned (`strict-paired` in `context-layered`, `concept`, `examples`, `guide`, `troubleshooting`, `llms`). Use [Store Selection and Usage Guide](../context-layered/store-selection-and-usage-guide) as the canonical Store/state reference. | `pnpm docs:check` |
| `catalog/repository-surface/*.v1.json` | Machine-verifiable inventory of workspace packages (`api-surface`), canonical example routes & demos (`example-surface`), and root/managed/derived documents (`document-surface`, `CA-SURFACE-CATALOG-001`; live counts live in JSON). Update alongside any surface addition or removal. | `pnpm verify:surface-catalog` |
| `docs/{en,ko}/llms/llms-*.txt` | Tracked derived LLMS summary/bundle artifacts compiled directly from `docs/{en,ko}/**` (excluding `docs/{en,ko}/llms/**`). Do not treat them as the canonical explanation or edit by hand. | `pnpm docs:llms` then `pnpm llms:check` |
| Root, `packages/*/README.md`, `packages/*/docs/*.md`, and `.d.ts` | Package discovery entry points, focused package contracts, and exported TypeScript types/JSDoc. Link readers to [Repository Surface Catalog](../context-layered/repository-surface-catalog) and authoritative guides rather than duplicating specs. | Relevant build, surface catalog, and link check |

Generated bundle files may be reviewed, but any behavioral correction belongs in
their canonical Markdown source or exported TypeScript API—not in generated
output.

Surface documents follow the six **authority classes** (`authoritative`,
`discovery`, `evidence`, `derived`, `transitional`, `historical`) and five
**pairing policies** (`strict-paired`, `tracked-partial`, `single-locale`,
`derived`, `not-applicable`) cataloged in
[`document-surface.v1.json`](../../../catalog/repository-surface/document-surface.v1.json)
and [Repository Surface Catalog](../context-layered/repository-surface-catalog).

## 2. Choose the Source Before Editing

Start from the question being changed, then edit its canonical source. Do not
start from a generated page merely because it is where the drift was noticed.

| Change | Canonical source to edit | Derived/update path | Minimum proof |
| --- | --- | --- | --- |
| Public guide, Store usage, or convention | paired `docs/en/**` and `docs/ko/**` pages (`store-selection-and-usage-guide` for cross-package Store decisions) | regenerate `docs/{en,ko}/llms/llms-*.txt` with `pnpm docs:llms` | `pnpm docs:check` |
| Package, export subpath, or verification gate | package `package.json` + source/JSDoc + `catalog/repository-surface/api-surface.v1.json` + `repository-surface-catalog.md` | update package `README.md` / `packages/*/docs/*.md` if contracts changed | `pnpm verify:surface-catalog && pnpm package-boundary:check` |
| Canonical `example/` route, standalone demo, or example doc | route/demo/doc + `catalog/repository-surface/example-surface.v1.json` + `repository-surface-catalog.md` | regenerate LLMS bundles if `docs/{en,ko}/examples/*.md` changed (`pnpm docs:llms`) | `pnpm verify:surface-catalog && pnpm --filter example build` |
| Root `*.md` or managed doc area metadata | root/managed document + `catalog/repository-surface/document-surface.v1.json` + `repository-surface-catalog.md` | keep `pairingPolicy` / `knownUnpaired` accurate in `document-surface.v1.json` | `pnpm verify:surface-catalog && pnpm docs:check` |
| Package discovery or consumer entry point | package `README.md`, with a link to its authoritative guide | update the linked guide only when the contract changed | focused package verification |
| Durable architecture choice | decision record plus the owning guide/package contract | add implementation and test anchors | focused boundary/test evidence |

`pnpm docs:check` runs `pnpm docs:management && pnpm verify:surface-catalog && pnpm llms:check && pnpm docs:build`.
It checks metadata, catalog parity, LLMS freshness, and the VitePress build; it does not modify files.

## 3. Change Classification

Before implementation, record the change in one of these classes:

1. **Public API** — update exported types/JSDoc, API reference inputs, a usage
   example, and migration notes when behavior is not backward compatible.
2. **Behavior or pattern** — update the canonical guide, a runnable example,
   and the test that proves the documented behavior.
3. **Internal maintenance** — update developer-facing documentation only when
   commands, ownership, failure modes, or a contributor decision changes.
4. **Generated-only refresh** — identify the source change and generator
   command in the commit; do not present generated output as an independent
   feature.

Do not combine an unrelated documentation rewrite with a behavior change in
the same commit. Use a `docs(<area>):` commit when documentation can be
reviewed independently.

## 4. Required Development Loop

Use this order for feature and maintenance work:

1. Define the source-of-truth contract: public type, state transition, tool
   schema, or documented invariant.
2. Implement the smallest code change that satisfies the contract.
3. Add or update the focused test and runnable example when users can observe
   the behavior.
4. Update the authoritative guide and its discovery link. Keep translated
   public pages equivalent in meaning; temporary gaps must be called out in the
   PR or handoff.
5. Run the proportional verification gate below before committing.

Document current behavior, not an intended future design. If an implementation
is incomplete, state the limitation and the required proof rather than
describing it as available.

## 5. Verification Gates

| Change | Minimum gate | Add when applicable |
| --- | --- | --- |
| Hand-authored documentation | `pnpm docs:llms` then `pnpm docs:check` | focused link/browser proof when a rendered interaction changed; `pnpm verify:doc-snippets` when `<!-- @context-action-compile -->` blocks changed |
| Repository surfaces (packages, routes, managed/root docs) | `pnpm verify:surface-catalog` and `pnpm convention:check` | update `catalog/repository-surface/*.v1.json` and `repository-surface-catalog.md` |
| Public TypeScript API | `pnpm build` and `pnpm type-check` | update package `README.md`, `api-surface.v1.json`, and `pnpm verify:doc-snippets` |
| Runtime behavior or a framework pattern | Focused package test and `pnpm type-check` | `pnpm test`, example build |
| Example app or browser integration | `pnpm --filter example build` | Manual proof with user-owned credentials; never commit secrets |
| Release/package tooling | `pnpm verify:package-exports` and `pnpm verify:package-tarballs` | `pnpm verify:private-tools` |
| LLMS/documentation consistency | `pnpm llms:check` | run `pnpm docs:llms` when `docs/{en,ko}/**` sources changed |
| Local-First PR preflight receipt ([policy](../../LOCAL_FIRST_VERIFICATION_POLICY.md)) | `pnpm verify:quick` (or `pnpm verify`) then `pnpm verify:receipt` | Commit `.verification/local-receipt.json` on a clean tree before PR |

> **Direct LLMS Bundle Generation:** `pnpm docs:llms` (`node scripts/sync-llms-bundles.mjs --write`)
> compiles `docs/{en,ko}/llms/llms-minimal.txt`, `llms-500chars.txt`, and
> `llms-origin.txt` deterministically directly from `docs/{en,ko}/**`
> (excluding `docs/{en,ko}/llms/**`), with no intermediate template directory
> or post-commit git hook. Commit both the edited docs and regenerated `llms-*.txt`
> bundles together before running `pnpm verify:quick`.

Canonical TypeScript examples that are intended to be self-contained may be
marked with `<!-- @context-action-compile -->` immediately before a `ts`,
`typescript`, or `tsx` fence. `pnpm verify:doc-snippets` extracts those marked
blocks, compiles them with TypeScript `strict: true` against the built workspace
declarations (`@context-action/core`, `@context-action/store-core`,
`@context-action/mutative`, `@context-action/react` + subpaths,
`@context-action/xstate` + `./effect`, `@context-action/webmcp`,
`@context-action/ai-sdk`, and `@context-action/tool-protocol`), and is included in
`pnpm verify` / `pnpm verify:all`. Unmarked explanatory fragments remain illustrative
advisory examples rather than standalone consumer programs.

The AI SDK adapter also has a real-runtime smoke gate:
`pnpm test:ai-sdk-integration`. It builds the local protocol and adapter,
invokes the installed AI SDK `dynamicTool` output, and verifies the approval
and execution callback contracts.

For authored documentation changes, run `pnpm docs:llms` followed by `pnpm docs:check`
(and `pnpm verify:doc-snippets` after `pnpm build` when compile-checked
snippets change). Repository API surfaces and package entry points remain
documented directly in `packages/*/README.md`, `packages/*/docs/*.md`,
`.d.ts` declarations, and `catalog/repository-surface/api-surface.v1.json`.

For local verification and receipt generation before opening a PR, run
`pnpm verify:quick` (fast smoke) or `pnpm verify` (full 17-step Local-First
suite) and confirm `pnpm verify:receipt`. For a full pre-release repository
check—including package builds, runtime export loading, packed archive contents,
linting, tests, the example app, documentation, and private tooling—run
`pnpm verify:all` or `pnpm release:check`.

### Workspace Package Build Order

Lower-level runtime packages (`core`, `store-core`, `mutative-core`,
`tool-protocol`, `tool-durable-operations`) must build before higher-level
adapters (`mutative`, `react`, `xstate`, `lit`/`lit-ui`, `preact`/`preact-ui`,
`ai-sdk`, `webmcp`) and consumer apps (`example`, `demos/bolt-style-editor`):

```bash
# Build all workspace library packages in topological order via Lerna
pnpm build
pnpm example:build

# Focused verification when iterating on core/react → example
pnpm build:core
pnpm build:react
pnpm --filter example type-check
pnpm --filter example check
pnpm example:build
```

Running only `pnpm --filter example type-check` or `cd example && pnpm build`
after a package source change can read stale declarations from `packages/*/dist`.
The resulting missing-export or type errors may be caused by build order rather
than by the source change itself.

## 6. Review and Handoff Record

Each documentation-affecting pull request or handoff should state:

- the authoritative document changed and any generated artifact it affects;
- the implementation, example, and test that prove the claim;
- commands run and their result;
- any untranslated page, unavailable external credential, or manual proof
  that remains outstanding.

This record makes documentation review a development-management activity with
clear ownership, instead of a final formatting pass.

When a change introduces durable behavior or a contract, also record its issue
ID, specification/decision link, implementation anchor, focused proof, and
follow-up work using the [change management convention](../context-layered/change-management-convention).
