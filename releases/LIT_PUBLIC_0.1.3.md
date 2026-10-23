# Lit Public Preview 0.1.3 renderBefore Stabilization

This patch cohort fixes the remaining static-styles hydration duplication when a
declarative shadow root host is upgraded before `hydrateLit()` runs. It includes
the `@macro-ref/stratum-lit` `<ca-timeline>` consumer shape reported on
2026-10-23.

| Package | Previous | Candidate | Change |
| --- | --- | --- | --- |
| `@context-action/lit` | `0.1.2` | `0.1.3` | Cohort alignment patch; no runtime/API change |
| `@context-action/lit-ui` | `0.1.2` | `0.1.3` | Clears stale `renderOptions.renderBefore` after hydration |

## Root cause

`LitElement.createRenderRoot()` records the shadow root's first child as
`renderOptions.renderBefore`. When a static-styles DSD host is upgraded before
`hydrateLit()` runs, that first child is the server `<style>`. Manual hydration
adopts the server root part, but the next client render still targets the style
node and inserts a second tree before it, producing six items for a three-item
server fixture.

`hydrateLit()` now clears the stale `renderBefore` after a successful manual
hydration (and after the fallback/clean-render paths), so subsequent renders use
the adopted `shadowRoot._$litPart$` instead.

## Coverage

- static-styles own-shadow fixture through `hydrateLit(host.shadowRoot, host)`
- `./ssr` compatibility re-export
- host upgraded after connection
- stale `renderBefore` captured from the server style node
- duplicate client tree recovery, repeated hydration, method event handlers,
  and Chromium DSD hydration

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

Prepared for protected candidate publication. No registry tag has been changed
by this local preparation.
