# Lit Public Preview 0.1.0 Cohort Release Record

This document records the first public Lit preview cohort, published on
2026-10-23. It is independent from the Core/React stable cohort, the Mutative
cohort, the tool package cohort, and the Preact public preview cohort. The
machine-readable source of truth is
[`lit-public-2026-10.json`](lit-public-2026-10.json).

| Package | Version | Registry tags |
| --- | --- | --- |
| `@context-action/lit` | `0.1.0` | `latest`, `next` |
| `@context-action/lit-ui` | `0.1.0` | `latest`, `next` |

## Publication status

| Evidence | Value |
| --- | --- |
| Release commit | `e9fad81ab48a85e7bd54f6690e1fb2916183ccdb` |
| Candidate run | [`39850291717`](https://github.com/mineclover/context-action/actions/runs/39850291717) — success |
| Promotion run | [`39853507002`](https://github.com/mineclover/context-action/actions/runs/39853507002) — success |
| `latest` / `next` | `0.1.0` / `0.1.0` |
| Published consumer smoke | 25 assertions passed from the public registry |

The candidate was resumed after registry propagation and partial publication;
per-package attested commits are recorded below.

| Package | Attested candidate commit |
| --- | --- |
| `@context-action/lit` | `d18c926dc2783f5e44a194dd834c04b0c0d162d0` |
| `@context-action/lit-ui` | `e58d9ff51054185a53e59a3876d978607a983e90` |

Both commits are ancestors of the release commit. The promotion workflow
verified `next` provenance, the published consumer matrix, promoted `latest`, and
re-verified `latest` provenance/evidence.

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

The initial bootstrap used `publish_auth=token` because both packages were new
on npm. Both packages now exist and expose immutable 0.1.0 artifacts; future
releases may use `publish_auth=oidc` when the npm trusted publisher is configured
for this workflow and the `npm-stable` environment. `NPM_TOKEN` remains the
recovery/bootstrap credential in the protected environment.

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

## Published candidate evidence

The candidate workflow verified:

- SLSA provenance bound to the candidate workflow path and each package's
  attested commit
- per-package attested commits after the partial-publication resume
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

### Promotion outcome

The promotion workflow was dispatched with the release commit and
`PROMOTE_LIT_PUBLIC`. It verified `next` provenance and the published consumer
matrix, promoted `latest`, re-verified `latest` provenance/consumer/evidence, and
left both packages at:

```text
@context-action/lit@0.1.0    latest = next = 0.1.0
@context-action/lit-ui@0.1.0 latest = next = 0.1.0
```

Both packages remain 0.x public previews. API and support changes require a later
stability decision.

## Registry consumer verification

```sh
node scripts/verify-lit-public-consumer-smoke.mjs --tag latest --cohort
```

The clean consumer smoke passed CJS/ESM exports, ControllerScope runtime, SSR
rendering, reflected/complex properties, and TypeScript bridge/SSR contracts.
