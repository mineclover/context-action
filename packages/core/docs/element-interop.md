# Element transport and host lifecycle adapters

Local candidate, not yet published. `@context-action/core@1.2.6` in the registry
does not contain these proposed entries. Core/UI publication needs an approved
cohort and a minimum Core version containing the exports. Workspace ranges are
local wiring, not an approved release dependency floor.

## Entries and ownership

| Entry | Owns | Does not reach |
| --- | --- | --- |
| `@context-action/core` | Existing Action runtime, pure `PublicActionMethods` type | Element/DOM types, React runtime/types |
| `@context-action/core/element` | `createElementBinding`, `createElementFacade`, `toReactPartProps`, `createSyncActionPipeline`, `createRovingFocusController`, `createPointerGestureSession`, DOM transport contracts | React, Vue, Svelte, Angular, Lit, Preact |
| `@context-action/core/element/react` | Injected-runtime `createReactElementBridge` and React component types | Store/Mutative or a statically imported React runtime |

Core declares no framework runtime dependency or peer constraint: the React
factory receives the caller's runtime rather than resolving it. Direct consumers
of `/element/react` provide their own React runtime and React TypeScript declarations
(React 18/19 are tested). Existing UI adapters retain their React peer declarations.
This avoids imposing package-wide React version constraints on Action-only hosts.
Vue/Svelte/Angular remain host-owned dependencies. The internal ordinary-object facade uses Reflect/descriptors/WeakMap;
only the public Element specialization constrains its target to HTMLElement.

Preact/Lit compatibility wrappers preserve their names, overloads and aliases.
Preact still throws input assignment errors; Lit still ignores them. Both keep
best-effort omission cleanup. Native rendering, FACE, context DI, SSR/hydration,
component validation, Store read protocols and request/commit policies remain
outside this machinery. No automatic `.value` snapshot unwrapping is performed.

## Native binding lifecycle

```ts
import { createElementBinding } from '@context-action/core/element';

interface Input {
  items?: readonly string[] | undefined;
  onRequest?: ((event: CustomEvent<string>) => void) | undefined;
}
const binding = createElementBinding<Input>(element, {
  attributes: { role: 'role', disabled: 'aria-disabled' },
  styles: { hitSize: '--handle-hit-size', left: 'left' },
  properties: ['items'],
  events: { onRequest: 'item-request' },
}, { assignmentErrors: 'throw' });
binding.update({ items, onRequest });
binding.update({ onRequest }); // releases previously assigned items/attributes/styles once
binding.dispose();
```

- Config is captured at construction. Inputs are **complete snapshots**, not patches.
- `update` reconciles in deterministic order: **events → attributes → styles → properties**, so synchronous setter events see the current handler, attribute, and style state. Attach after native creation; constructor and initial `connectedCallback` events are not captured retroactively.
- `updateEvents`, `updateAttributes`, `updateStyles`, and `updateProperties` let a host choose its own lifecycle timing.
- `attributes` and `styles` bindings track an ownership ledger per binding instance: omitted keys are removed (`removeAttribute` / `removeProperty`) only for keys previously written by that binding, leaving host-owned attributes, CSS custom properties (`--*`), and inline styles untouched. Boolean attributes (`true` writes `""`; `false`, `null`, and `undefined` remove the attribute) and style strings (`""`, `null`, or `undefined` removes the property) normalize consistently.
- Omission clears only previously attempted writes, once. Untouched defaults survive.
  Explicit undefined remains an assignment (for properties) or removal (for attributes/styles). Objects keep identity; no serialization,
  validation, diff/equality filtering, rollback or clone is added.

## Headless UI interaction and framework projection primitives

`@context-action/core/element` also exports framework-neutral headless primitives for Vanilla DOM, custom elements, and React/framework consumers without adding a UI framework dependency:

- `createSyncActionPipeline`: Three-phase synchronous pipeline (`registerGuard` with `abort`/`modifyPayload`, `register` with `setResult`, and `registerObserver` with `when: 'success' | 'failure' | 'always'`, `priority`, and `once`) tailored for synchronous pointer/keyboard interactions where DOM events cannot await microtasks.
- `createRovingFocusController`: ARIA composite navigation helper supporting `'horizontal'`, `'vertical'`, and `'both'` orientations, `Arrow*` / `Home` / `End` keys, disabled item skipping, looping, and roving `getTabIndex(id)` (`0` vs `-1`).
- `createPointerGestureSession`: Pointer gesture lifecycle manager handling primary-button gating, `onStart` guard rejection, automatic `setPointerCapture`/`releasePointerCapture`, `deltaX`/`deltaY` & modifier tracking (`shiftKey`, `altKey`, `ctrlKey`, `metaKey`), and `Escape` cancellation.
- `toReactPartProps(partProps, config)`: Projects any headless part snapshot plus its `ElementBindingConfig` into a React-compatible props bag (mapping `attributes`, CSS custom/inline `styles` into `style`, and event names into `on<Event>` handlers).
- **Statechart & Effect Bridges**: Dedicated integration adapters for XState v5/v6 (`@context-action/xstate`) and Effect v4 / `@xstate/effect` (`@context-action/xstate/effect`) live in the separate `@context-action/xstate` package ([architecture specification](../../xstate/docs/xstate-effect-integration.md)), keeping `@context-action/core` strictly zero-dependency.
- Stable function/object handlers reuse listeners. Changed/invalid/omitted handlers
  remove prior listeners; object receivers remain intact. Multiple prop names may
  map to one event and remain independent subscriptions.
- Setter throws follow the selected policy; earlier side effects are not rolled back.
  A swallowed failure never confirms a commit.
- `disconnectEvents()` is replayable, retaining property ownership. `dispose()` is
  terminal/idempotent; later updates throw. Neither resets properties, calls the
  renderer's dispose, nor removes its DOM. Caller drops its controller reference
  after disposal. Target replacement requires a new binding and old disposal.
- Disposal during a synchronous event stops later property writes. Nested updates
  throw rather than silently interleave snapshots; schedule the next host update.

The React adapter reconciles events before properties in its layout effect (or its
effect fallback during SSR), so synchronous setter events caused by a bridge
snapshot reach the current-render handler. A passive effect replay reconnects
listeners after StrictMode cleanup without changing property ownership. Constructor
and initial `connectedCallback` events can still precede bridge creation and are not
replayed. When the callback ref detaches or a host is replaced, the bridge disposes
the old binding; the default forwarded ref follows the current host. Unmount clears
the ref and listeners. No renderer teardown is owned by the bridge.

Facades are frozen allow-list projections, not deep-frozen state or revocable
capabilities. Detached lazy access throws, but a previously captured bound method
can still call/retain the previous target. Method completion does not imply DOM
paint; a request event does not imply a state commit.

## Vue, Svelte and Angular host boundaries

No universal hook API or released production adapter package is introduced.
Copyable TypeScript reference modules live under `examples/element-hosts/` and
delegate to the same DOM binding. See [typed host patterns (EN)](element-host-patterns.en.md)
or [한국어](element-host-patterns.ko.md) for usage and evidence.

| Host | Lifecycle mapping | Reference source (under `examples/element-hosts/`) |
| --- | --- | --- |
| Vue | directive mounted → binding; updated → update; beforeUnmount → dispose | `vue/element-directive.ts`, `vue/Host.vue` |
| Svelte | element action → binding; action update → update; action destroy → dispose | `svelte/element-action.ts`, `svelte/Host.svelte` |
| Angular | ngAfterViewInit → binding; ngOnChanges via Input → update; DestroyRef → dispose; skip server binding | `angular/element-binding.directive.ts`, `angular/host.component.ts` |

`pnpm verify:element-hosts` installs pinned frameworks outside the workspace and
type-checks the actual templates (including required failures for invalid payloads),
then tests native defaults, object identity, handler replacement/removal, omission,
teardown/remount and failed-initialization cleanup. Client evidence is **JSDOM**.
Fresh server processes render inert host shells without injected browser globals;
this is not component-internal SSR, hydration, arbitrary version support, browser
FACE or renderer cross-product certification. Framework-native
custom-element recognition (`isCustomElement`, Angular schemas, etc.) stays with
the application. Upgrade fixture pins deliberately and rerun the contract.

## Verification

```sh
pnpm --filter @context-action/core type-check
pnpm verify:element-unit
pnpm verify:element-interop
pnpm verify:element-hosts
pnpm verify:element-host-browser # optional: connected ego-browser runtime
```

The installed interop gate checks no-framework import and strict Node-only root
declarations (ES2022 + Node types, no DOM lib), then separate strict ESM/CJS programs
and both UI wrappers on React 18/19. Root Node types still describe existing
AbortSignal/timer APIs; this work does not replace them with DOM declarations.
Existing renderer suites and actual Preact/Lit replacement evidence remain required.
The mixed Lit ESM/CJS global declaration conflict remains documented in the
[English requirements review](interop-review.en.md) / [한국어 검토](interop-review.ko.md).

The opt-in browser gate reuses those compiled reference templates with real
framework applications and a native Shadow DOM probe. It performs trusted clicks
and 17 lifecycle checks per framework through ego-browser, recording browser and
bundle evidence. See the typed host guide for prerequisites and receipt scope;
this is not hydration, FACE or a renderer cross-product guarantee.
