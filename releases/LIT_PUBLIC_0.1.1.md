# Lit Public Preview 0.1.1 Patch Release

This patch cohort fixes `hydrateLit()` adoption of declarative shadow roots
whose first shadow child is a `static styles` `<style>` element. It also repairs
the case where a client render already appended a duplicate tree before
`hydrateLit()` runs.

| Package | Previous | Candidate | Change |
| --- | --- | --- | --- |
| `@context-action/lit` | `0.1.0` | `0.1.1` | Cohort alignment patch; no runtime/API change |
| `@context-action/lit-ui` | `0.1.0` | `0.1.1` | Patch: hydrate static-styles DSD and duplicate-tree repair |

## Why both packages move to 0.1.1

Only `@context-action/lit-ui` contains the hydration fix. The published
`@context-action/lit@0.1.0` tarball cannot be reused after its documentation
changed, and the protected helper requires an exact artifact integrity match for
existing versions. The cohort is therefore aligned at `0.1.1`: `lit` has no
runtime or API changes, and `lit-ui` carries the hydration fix. This matches the
repository's cohort-alignment patch rule.

`@context-action/lit-ui@0.1.1` depends on `@context-action/lit@^0.1.1`; publication
order remains lit → lit-ui.

## Fixed behavior

- `hasLitPartMarker()` walks comment nodes under the whole shadow root, so a
  `<style>` preceding the `lit-part` root does not hide the hydration markers.
- `hydrateLit(host.shadowRoot, host)` adopts static-styles DSD instead of
  appending a second client render.
- If a client render already appended a duplicate tree, the server root part is
  isolated, the client tree is removed, and the server tree is re-adopted.
- Existing server item node identity is preserved; final server/client item
  counts match.

## Publication contract

Dependencies remain:

1. `@context-action/lit@0.1.1` (`@context-action/core@^1.2.6`)
2. `@context-action/lit-ui@0.1.1` (`@context-action/core@^1.2.6`,
   `@context-action/lit@^0.1.1`)

Registry path:

- Candidate: `publish-lit-public-candidate.yml` → `next`
- Promotion: `promote-lit-public.yml` → `latest` with `PROMOTE_LIT_PUBLIC`

Both package names already exist on npm, so `publish_auth=oidc` may be used when
the trusted publisher is configured; `publish_auth=token` remains the recovery
path.

## Required evidence

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

The source of truth is
[`lit-public-2026-10-patch-1.json`](lit-public-2026-10-patch-1.json).

## Status

Candidate preparation. Publication status and evidence are recorded after the
candidate/promotion workflows complete.
