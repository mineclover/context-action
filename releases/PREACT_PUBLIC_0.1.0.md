# Preact Public Preview 0.1.0 Release Plan

This plan promotes the Preact adapters from private workspace packages to a
public 0.1.0 preview cohort. It is independent from the five-package
state-management cohort in `COORDINATED_STABLE_2026_10.md`.
The machine-readable source of truth is `preact-public-2026-10.json`.

| Package | Candidate | Responsibility |
| --- | --- | --- |
| `@context-action/preact` | `0.1.0` | Preact dispatch contexts and read-only Signals projections over Core contracts |
| `@context-action/preact-ui` | `0.1.0` | Owned Preact roots, template mounting, SSR/hydration, disposal, and Custom Element shells |

The package manifests are public (`private: false`) and use
`publishConfig.access: public`. The package versions remain on the 0.x line so
the API and supported runtime matrix can evolve before a separate 1.0 stability
decision.

## Publication contract

Publication is performed only by the protected Preact publication workflow from
one immutable `main` commit. The candidate is published to `next` first. The
workflow must verify the candidate artifact and packed consumer matrix before a
separate promotion step moves exactly these versions to `latest`.

Dependencies require this order:

1. `@context-action/preact@0.1.0` (depends on `@context-action/core@^1.2.6`).
2. `@context-action/preact-ui@0.1.0` (depends on `@context-action/preact@^0.1.0`).

Local `npm publish`, direct `npm dist-tag`, and publishing from a mutable
working tree are not release paths. If the initial public package identity
requires a token bootstrap, use the protected token input for the first
publication and retain the same artifact/provenance checks for the remaining
steps.

## Required evidence

The candidate workflow records the immutable source commit, package manifests,
packed tarballs, and registry metadata. Before publication it runs:

```sh
pnpm --filter @context-action/preact type-check
pnpm --filter @context-action/preact test
pnpm --filter @context-action/preact-ui type-check
pnpm --filter @context-action/preact-ui test
pnpm --filter @context-action/preact-ui test:native
pnpm --filter @context-action/preact-ui test:browser
pnpm --filter @context-action/preact-ui test:browser:cross
pnpm verify:package-exports
pnpm verify:package-tarballs
pnpm package-boundary:check
```

The browser matrix covers Chromium contract tests and local Firefox/WebKit
smoke. NVDA/VoiceOver speech output is consumer product QA, not a package
runtime feature or a release gate. Consumer applications that promise a
specific OS and assistive-technology combination must run that additional QA
against their own host, styles, and data flow.

SSR and hydration evidence covers the package fixture and the opt-in
`hydrateShadowRoot` contract. Application routing, streaming, server data
boundaries, and other product-specific SSR combinations remain consumer-owned
verification.

## Rollback and follow-up

The promotion workflow records the previous `latest` values before retagging.
If post-promotion closure fails, it may restore those exact values only after
provenance and registry checks identify this cohort as the active candidate.
Already published npm versions are immutable and are never overwritten.

After promotion, update the package validation record with the registry URLs and
the exact workflow run. Keep this plan immutable as the release record.
