# Lit Public Preview 0.1.0 Cohort Release Plan

This plan prepares the first public Lit preview cohort. It is independent from
the Core/React stable cohort, the Mutative cohort, the tool package cohort, and
the Preact public preview cohort. The machine-readable source of truth is
[`lit-public-2026-10.json`](lit-public-2026-10.json).

| Package | Candidate | Change class |
| --- | --- | --- |
| `@context-action/lit` | `0.1.0` | Initial public preview |
| `@context-action/lit-ui` | `0.1.0` | Initial public preview |

## Why both packages are 0.1.0

Both packages were previously private workspace templates. The first public
artifact exposes the Lit controller, bridge, FACE, context, SSR, and hydration
contracts for the first time, so they enter at `0.1.0` as pre-1.0 public
previews. They remain outside the 1.0 stability promise until a separate
stability decision.

## Publication contract

Dependencies require this order:

1. `@context-action/lit@0.1.0` (depends on `@context-action/core@^1.2.6`).
2. `@context-action/lit-ui@0.1.0` (depends on
   `@context-action/core@^1.2.6` and `@context-action/lit@^0.1.0`).

`lit` and `@lit/context` are peer dependencies. `react` is an optional peer for
the bridge, and `@lit-labs/ssr` / `@lit-labs/ssr-client` are optional peers for
the SSR entry.

### Workflow

Registry publication uses the Lit-specific protected path:

- Candidate: `publish-lit-public-candidate.yml`
  - requires `release_commit` and `publish_auth`
  - publishes to `next`
  - runs the release plan, release gate, Lit packages, browser contract,
    package exports/tarballs, packed consumer, provenance, published consumer,
    and registry evidence gates
- Promotion: `promote-lit-public.yml`
  - requires `release_commit` and the confirmation string `PROMOTE_LIT_PUBLIC`
  - verifies `next` provenance and the published consumer matrix
  - promotes `next` → `latest` with rollback protection
  - re-verifies `latest`, provenance, and registry evidence

Use `publish_auth=token` for the first publication because the packages do not
exist on npm yet. OIDC/trusted-publishing eligibility can be reviewed only after
the initial package versions exist. Configure `NPM_TOKEN` in the protected
`npm-stable` environment before dispatching the candidate workflow.

Local `npm publish`, direct `npm dist-tag`, and publishing from a mutable working
tree are not release paths.

## Required evidence

Run before creating a candidate commit:

```sh
pnpm install --frozen-lockfile
pnpm verify:lit-public-release -- --require-current-source
pnpm verify:lit-public-workflows
pnpm check:lit
pnpm verify:lit-react-compatibility
pnpm --filter @context-action/lit-ui test:browser
pnpm verify:package-exports
pnpm verify:package-tarballs
pnpm verify:lit-packed-consumer
pnpm package-boundary:check
pnpm release:check
```

The packed consumer check installs `@context-action/lit` and
`@context-action/lit-ui` from tarballs outside the workspace and verifies the
runtime exports, ESM/CJS entries, types, SSR rendering, and hydration export.

## After publishing to `next`

The candidate workflow automatically verifies:

- SLSA provenance bound to `release_commit` and the Lit candidate workflow path
- per-package attested commits when a candidate is resumed after registry/dist-tag propagation
- registry consumer install of both package versions
- ESM/CJS exports, SSR rendering, and TypeScript consumer contracts
- registry evidence for the exact `@context-action/lit,@context-action/lit-ui`
  cohort

### Resumed candidate binding

`candidateCommits` records the attested source commit for each package when a
candidate is resumed after a partial publication. Every recorded commit must be
an ancestor of the current candidate `release_commit`; the provenance verifier
uses the package-specific commit and records both `sourceCommit` and
`releaseCommit` in evidence. A commit outside the approved ancestry fails closed.

Then dispatch the promotion workflow with the same `release_commit` and
`PROMOTE_LIT_PUBLIC`. Promotion verifies the candidate provenance and consumer
matrix again, snapshots the previous `latest`, mutates `latest`, verifies the
promoted cohort, and records rollback-capable evidence. Both packages remain
0.x public previews. API and support changes require a later stability decision.
