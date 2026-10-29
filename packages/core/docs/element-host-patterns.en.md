# Typed Vue, Svelte and Angular host patterns

[한국어](element-host-patterns.ko.md) · [Shared lifecycle contract](element-interop.md)

Status: copyable reference implementations under `packages/core/examples/element-hosts/`.
They are not public package exports and are not included in the published tarball.
No framework runtime, peer or compiler is added to Core's package dependencies.
The existing Core/UI release-floor restriction still applies.

## Shared boundary

The counter reference shares `CounterProps`, `CounterInput`, a semantic
`CounterHandle`, event names and the property map. It does not expose raw DOM or
renderer state through its handle. A request does not commit input; the host must
confirm a new snapshot. Invalid counter input preserves the previous valid value.

Copy the adapter for your framework and `shared/connect-binding.ts` into your
application. Replace the counter contract and tag with your component's public
contract. Import Core only through `/element`, not a package `src`/`dist` path.
Copying the examples is not a substitute for approving the future Core version
that contains that export.

`connectBinding` releases listeners if the first update throws. It does not roll
back earlier setter side effects. Vue/Angular register their cleanup reference
before that update, so synchronous setter events can tear down the host safely.
These reference adapters default to fail-fast
assignment; the existing Lit wrapper's best-effort policy is unchanged.
Provide complete snapshots and replace their identity when changing inputs.
There is no implicit deep watch, state-container subscription, or business handler.

## Vue

`vue/element-directive.ts` exports `createElementDirective<Props>()`, typed as a
Vue `ObjectDirective<HTMLElement, Props>`. It captures config/policy once, uses
one binding per node in a WeakMap, updates on `updated`, and disposes on
`beforeUnmount`. The factory itself imports Vue types only.

`vue/Host.vue` shows local `<script setup>` registration using `vElement` and
`v-element="snapshot"`. Configure `isCustomElement` in the SFC build compiler
(not only runtime app config) for the host tag. The gate does so when compiling
the template and verifies the actual SFC with `vue-tsc`.

## Svelte

`svelte/element-action.ts` exports `createElementAction<Props>()`, checked against
Svelte's actual `Action<HTMLElement, Props>` type. A complete snapshot is required;
undefined action input throws. Action update/destroy delegate to the binding.

`svelte/Host.svelte` uses the action with a typed readable snapshot source. The
source is host-owned; this does not standardize Store read protocols. The same
component is checked with `svelte-check` and compiled for client/server execution.

## Angular

`angular/element-binding.directive.ts` is an actual standalone decorated directive,
not a runtime decorator factory. `angular/host.component.ts` imports it in a typed
template with `CUSTOM_ELEMENTS_SCHEMA` for the native tag.

- Required `caElementBinding` supplies config; it is fixed after mount. A new
  config reference after mount throws: remount the host instead of silently
  abandoning previously owned properties.
- Required `caElementInput` supplies complete snapshots; new Input references are
  applied in `ngOnChanges`. Binding starts in `ngAfterViewInit`.
- `DestroyRef` owns cleanup, not the component renderer.
- `isPlatformBrowser(PLATFORM_ID)` prevents server-side native DOM binding.

The gate runs Angular's full compiler with `strictTemplates` and
`strictInjectionParameters`. Its Angular 20 compiler requires TypeScript <6, so
the **isolated consumer** uses TypeScript 5.9.3; workspace TypeScript is unchanged.

## Evidence and limits

Run `pnpm verify:element-hosts` after editing these patterns. It uses Core's local
packed public entry and pinned Vue 3.5.44 / Svelte 5.57.2 / Angular 20.3.34,
vue-tsc 3.3.13 and svelte-check 4.7.7. It checks:

- valid typed templates plus deliberately invalid numeric payloads rejected by
  **each** template compiler; negative Handle/property-map type contracts;
- native default preservation, object identity, request/commit separation,
  handler replacement/omission, teardown, detached handles and remount;
- per-node isolation, config capture and cleanup after failed initialization;
- Angular's fixed-config rule, server DOM guard and DestroyRef cleanup;
- inert server shells rendered in fresh Node processes without injected browser
  globals (Angular uses an exact allowed host, not a wildcard).

Client lifecycle evidence uses JSDOM and a native probe. Server evidence covers
the host shell only: it does not render the internals of a Preact/Lit component,
serialize interactive property state or certify hydration. Real-browser FACE,
arbitrary framework versions, multiple-renderer cross-products and released
production adapter packages remain out of scope. The focused compiler gate is
explicit; ordinary Core type-checking does not install these host dependencies.

## Real browser gate

`pnpm verify:element-host-browser` runs the typed/JSDOM/server gate first, then
bundles the **same compiled reference templates** into a temporary loopback page.
It requires a connected `ego-browser` runtime. No additional workspace framework
dependency or public package export is introduced. Angular uses real
`createApplication` / `createComponent` / attach/destroy lifecycles rather than
TestBed. This verification bundle includes the compiler/dev runtimes; it is not
a production-linked deployment artifact.

The driver performs one trusted native Shadow DOM button click for each host
before running its 17 checks: untouched defaults, property identity, semantic
handle, trusted request, request/commit separation, rejected input, imperative
event, stable listeners, no input echo, handler replacement, object receiver,
omission, ownership release, unmount, detached handle, remount and final cleanup.
No unhandled browser errors are allowed. All hosts are unmounted at completion.

Only `/` and the bundled `/app.js` are served on a random `127.0.0.1` port; this
does not expose the workspace as a file server. The driver closes its own browser
space after success, and the gate closes its server even on failure. On browser
failure the task space remains available for diagnosis; it must not be replaced
with a new space just to bypass a blocked or user-controlled page.

Evidence includes the browser user-agent, explicit framework pins, per-host check
names, driver transcript, and served-bundle SHA-256 in a temporary directory
printed by the gate. `CONTEXT_ACTION_BROWSER_EVIDENCE_DIR` selects a new destination.
The destination must be empty; nonempty directories are rejected to avoid mixing
old and new receipts. A recovered
driver transcript is evidence of that browser run, not a new run or a release
receipt; do not fabricate a lost artifact hash.

`pnpm test:element-host-browser` checks result parsing without browser access.
Both stdout and stderr are accepted, but missing/duplicate/partial results,
changed version pins, untrusted clicks and browser errors fail closed.

This adds **current ego Chromium + native Shadow DOM probe** evidence only. It
does not certify Firefox/WebKit, FACE, renderer cross-products or hydration.
