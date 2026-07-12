# Documentation and Development Management Conventions

This document is the source of truth for keeping implementation, public
documentation, generated references, and LLM-oriented artifacts aligned.
It complements the coding rules in [Conventions](./conventions.md); it does
not replace package-specific ownership or release rules.

## 1. Documentation Ownership

| Surface | Owner and editing rule | Verification |
| --- | --- | --- |
| `docs/en/**`, `docs/ko/**` guides and concepts | Hand-authored source. Keep the English and Korean pages aligned when the content is public. | `pnpm docs:build` |
| `docs/api/generated/**` | Generated API reference. Change TypeScript exports and JSDoc first; regenerate rather than hand-editing output. | `pnpm docs:api`, `pnpm docs:sync` |
| `llmsData/**` and generated LLMS files | Derived learning/context artifacts. Do not treat them as the canonical explanation. | `pnpm llms:sync-docs --changed-files <paths>` when supported by the generator |
| README and package READMEs | Discovery and package entry points. They must route readers to the authoritative guide or API page rather than duplicate it. | Relevant build and link check |

Generated files may be reviewed, but a behavioral correction belongs in their
source document, generator, or exported API—not only in generated output.

## 2. Change Classification

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

## 3. Required Development Loop

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

## 4. Verification Gates

| Change | Minimum gate | Add when applicable |
| --- | --- | --- |
| Hand-authored documentation | `pnpm docs:build` | `pnpm llms:sync-docs --changed-files <paths>` |
| Public TypeScript API | `pnpm type-check` | `pnpm docs:api && pnpm docs:sync` |
| Runtime behavior or a framework pattern | Focused package test and `pnpm type-check` | `pnpm test`, example build |
| Example app or browser integration | `pnpm --filter example build` | Manual proof with user-owned credentials; never commit secrets |
| Release/package tooling | `pnpm verify:package-exports` and `pnpm verify:package-tarballs` | `pnpm verify:private-tools` |

`pnpm docs:full` is the complete documentation pipeline. Use it for broad API
or documentation releases; use the narrower commands above during focused
development to keep feedback fast.

For a repository-wide pre-merge check—including package builds, runtime export
loading, packed archive contents, linting, tests, the example app,
documentation, and private tooling—run `pnpm verify:all`.

## 5. Review and Handoff Record

Each documentation-affecting pull request or handoff should state:

- the authoritative document changed and any generated artifact it affects;
- the implementation, example, and test that prove the claim;
- commands run and their result;
- any untranslated page, unavailable external credential, or manual proof
  that remains outstanding.

This record makes documentation review a development-management activity with
clear ownership, instead of a final formatting pass.
