# Lit Public Preview 0.1.2 Stabilization Patch

This patch cohort stabilizes `hydrateLit()` after the 0.1.1 static-styles DSD
fix. It preserves multiple style nodes, repairs duplicate client renders,
keeps repeated hydration idempotent, and passes Lit render options through
manual hydration.

| Package | Previous | Candidate | Change |
| --- | --- | --- | --- |
| `@context-action/lit` | `0.1.1` | `0.1.2` | Cohort alignment patch; no runtime/API change |
| `@context-action/lit-ui` | `0.1.1` | `0.1.2` | Hydration stabilization and regression coverage |

## Publication status

| Evidence | Value |
| --- | --- |
| Release commit | `945513b715bf43c55c9c789f36c8305b64679b2c` |
| Candidate run | [`39934091052`](https://github.com/mineclover/context-action/actions/runs/39934091052) — success |
| Promotion run | [`39938079857`](https://github.com/mineclover/context-action/actions/runs/39938079857) — success |
| `latest` / `next` | `0.1.2` / `0.1.2` |
| Published consumer smoke | 25 assertions passed from the public registry |

## Candidate contract

- Candidate dist-tag: `next`
- Promotion dist-tag: `latest`
- Publication order: `@context-action/lit` → `@context-action/lit-ui`
- Candidate workflow: `publish-lit-public-candidate.yml`
- Promotion workflow: `promote-lit-public.yml`
- Promotion confirmation: `PROMOTE_LIT_PUBLIC`

## Required evidence

```sh
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

## Status

Published on 2026-10-23. `latest` and `next` resolve to `0.1.2` for both
packages.
