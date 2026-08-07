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

## 1. Documentation Ownership

| Surface | Owner and editing rule | Verification |
| --- | --- | --- |
| `docs/en/**`, `docs/ko/**` guides and concepts | Hand-authored source. Keep the English and Korean pages aligned when the content is public. | `pnpm docs:build` |
| `docs/api/generated/**` | Generated API reference. Change TypeScript exports and JSDoc first; regenerate rather than hand-editing output. | `pnpm docs:api`, `pnpm docs:sync` |
| `llmsData/**` and generated LLMS files | Derived learning/context artifacts. Do not treat them as the canonical explanation. | `pnpm llms:sync-docs --changed-files <paths>` followed by `pnpm llms:check` |
| README and package READMEs | Discovery and package entry points. They must route readers to the authoritative guide or API page rather than duplicate it. | Relevant build and link check |

Generated files may be reviewed, but a behavioral correction belongs in their
source document, generator, or exported API—not only in generated output.
API source links are generated against the `main` branch so that running the
documentation pipeline after a commit does not create commit-hash-only drift;
the generated file remains reproducible until the source path or line changes.

## 2. Choose the Source Before Editing

Start from the question being changed, then edit its canonical source. Do not
start from a generated page merely because it is where the drift was noticed.

| Change | Canonical source to edit | Derived/update path | Minimum proof |
| --- | --- | --- | --- |
| Public guide or convention | paired `docs/en/**` and `docs/ko/**` pages | regenerate the affected LLMS summaries | `pnpm docs:check` |
| Exported API signature or API JSDoc | TypeScript export and JSDoc | `pnpm docs:api && pnpm docs:sync` | type check and `pnpm docs:build` |
| Package discovery or consumer entry point | package `README.md`, with a link to its authoritative guide | update the linked guide only when the contract changed | focused package verification |
| Durable architecture choice | decision record plus the owning guide/package contract | add implementation and test anchors | focused boundary/test evidence |

`pnpm docs:check` verifies documentation management metadata, LLMS freshness,
and the VitePress build. It checks consistency; it does not generate files.

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
| Hand-authored documentation | `pnpm llms:sync-docs --changed-files <paths>` then `pnpm docs:check` | focused link/browser proof when a rendered interaction changed |
| Public TypeScript API | `pnpm type-check` | `pnpm docs:api && pnpm docs:sync` |
| Runtime behavior or a framework pattern | Focused package test and `pnpm type-check` | `pnpm test`, example build |
| Example app or browser integration | `pnpm --filter example build` | Manual proof with user-owned credentials; never commit secrets |
| Release/package tooling | `pnpm verify:package-exports` and `pnpm verify:package-tarballs` | `pnpm verify:private-tools` |
| LLMS/documentation consistency | `pnpm llms:check` | `pnpm llms:detect-mismatches --output reports/llms-mismatch-report.md` for review evidence |

Canonical TypeScript examples that are intended to be self-contained may be
marked with `<!-- @context-action-compile -->` immediately before a `ts` or
`typescript` fence. `pnpm verify:doc-snippets` extracts those marked blocks,
compiles them against the built Core declaration, and is included in
`pnpm verify:all`. Unmarked explanatory fragments may remain illustrative and
are not treated as standalone consumer programs.

The AI SDK adapter also has a real-runtime smoke gate:
`pnpm test:ai-sdk-integration`. It builds the local protocol and adapter,
invokes the installed AI SDK `dynamicTool` output, and verifies the approval
and execution callback contracts.

`pnpm docs:full` is the API-reference refresh pipeline: it regenerates TypeDoc,
synchronizes it into VitePress, and builds the site. It does **not** regenerate
LLMS artifacts. For authored-guide work, run `pnpm llms:sync-docs` for the
changed source pages and then `pnpm docs:check`. Use both flows when a release
changes API and guide content.

For a repository-wide pre-merge check—including package builds, runtime export
loading, packed archive contents, linting, tests, the example app,
documentation, and private tooling—run `pnpm verify:all`.

### Workspace Package Build Order

The `example` consumes `@context-action/core` and `@context-action/react`
through the workspace packages' built declarations and `dist` outputs. After
changing package source, use this order:

```bash
# Build library packages (example is separate)
pnpm build
pnpm example:build

# Focused verification: core → react → example
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
