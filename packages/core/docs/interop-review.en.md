# Shared element interface requirements review

[한국어](interop-review.ko.md) · [Ownership and limitations](element-interop.md)

Status: Core subpath implementation adopted for local work; public version/cohort and dependency floors remain unapproved.

| Requirement | Shared responsibility / evidence |
| --- | --- |
| Renderer-independent consumer contract | `ElementBridgeContract`, semantic `CounterHandle` fixture; no Lit/Preact/Signal types in the host contract |
| Existing entry points and call forms | Preact root and `/react-bridge` facade exports; Lit object/two-argument forms and aliases remain |
| Same Action/Ref orchestration | `example/src/pages/integrations/element-interop.contract.test.tsx` mounts each real renderer and replaces Preact with Lit using one host |
| Input validation and previous valid state | Invalid facade input throws without replacing confirmed input; fixture setters own validation |
| Request is not commit | `requestIncrement()` only emits a frozen `count-request`; host-confirmed input changes the state |
| No input echo | Initial input, confirmed input and reset do not re-emit the request |
| No DOM/signal leakage | Explicit facade allow-list; host ref exposes only `input`, `getSnapshot`, `requestIncrement`; detached facade access fails |
| Defaults and omission | Untouched defaults survive; only bridge-owned input is cleared; explicit undefined remains an assignment |
| Deterministic event lifetime | Shared unit suite and both renderer bridge suites cover identity reconciliation, StrictMode, handler replacement and unmount |
| Shared installed declarations | `pnpm verify:element-interop` compiles ESM/CJS public contracts with negative type assertions |
| One host React runtime | Adapters pass their React runtime into shared implementation; local packages need not use the same development React version |
| Non-React host lifecycles | `pnpm verify:element-hosts`: reusable typed Vue 3.5.44 directive, Svelte 5.57.2 action, Angular 20.3.34 standalone directive; actual positive/negative template checks, JSDOM lifecycles and inert server shells, not released adapters or hydration/browser certification |
| Native browser lifecycle | `pnpm verify:element-host-browser`: same compiled sources in real framework apps, trusted Shadow DOM clicks and 17 checks per host; current ego Chromium only, not hydration/FACE/renderer cross-products |
| DOM/React separation | Node-only root declarations and no-framework import; generic binding tests cover event-before-setter order, reentrant disposal and terminal/replayable cleanup |
| No framework runtime coupling | Shared root imports without React/Preact/Lit or HTMLElement globals; UI packages do not depend on each other's renderer |
| Release safety | No existing versions changed; public Core/UI candidates require an approved cohort and Core dependency floor containing the new exports |

This is a **transport/host interface** consolidation, not a universal Web Component
base class. CSS parts, slots, accessibility, form semantics, connection-resource
ownership, SSR/hydration and business validation remain per-component contracts.
Preserving method signatures does not prove equivalent business meaning. Consumers
must adopt a shared semantic contract deliberately, as the controlled-counter
fixture does; arbitrary existing components are not automatically substitutable.

Intentional compatibility policy: Preact retains fail-fast property assignment,
while Lit retains best-effort assignment. Both use best-effort omission cleanup.
The common implementation makes this adapter policy explicit instead of silently
merging distinct failure behavior. Preact now preserves untouched defaults and
stable listeners. Tests prove candidate behavior, not semver approval.

Browser review also found that the existing Preact showcase declared properties
without implementing their accessors. Its stepper/badge now implement typed
`value/min/max/count` accessors with validation and no programmatic-input echo;
the showcase test checks actual Shadow DOM clicks and host-driven reset.

Known limits: facade method captures are not revoked; bridge property errors have
no new diagnostic callback; constructor and initial `connectedCallback` events may
precede bridge listeners, while setter events caused by a bridge snapshot are
delivered after the listener is attached; store snapshot/value read protocols are
not unified. Browser-specific FACE and hydration evidence must still come from each
renderer's existing gates.

Packed ESM and CJS type checks run in separate strict programs. Importing both
Lit UI declaration graphs into a single TypeScript program currently conflicts
in `HTMLElementTagNameMap` because the generated element classes are nominal.
This gate does not certify that mixed-declaration mode; it does not hide it with
`skipLibCheck` either.
