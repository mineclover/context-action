# @context-action/lit-ui

Web Component primitives, Form-Associated Custom Elements (FACE), W3C Context Protocol (`@lit/context`) dependency injection, and React 18/19 custom element bridge for the Context-Action state management framework.

## Responsibilities

- **`FormAssociatedLitElement`**: Abstract base class extending `LitElement` with full Form-Associated Custom Elements (FACE) support (`ElementInternals`, standard validation constraints, `setFormValue()`, and leak-free `formResetCallback()` coordination).
- **W3C Context Protocol Integration**: Global context tokens (`actionRegisterContext`, `actionDispatcherContext`, `createStoreContext`), imperative providers (`provideStore`, `provideActionRegister`, `provideActionDispatcher`), and reactive context controllers (`ContextStoreController`, `ContextActionController`) crossing Shadow DOM boundaries.
- **`createLitElementBridge`**: React 18/19 custom element bridge with direct property assignment (bypassing attribute stringification), property removal, handler-identity event reconciliation, OOP facade handles, and ref forwarding.
- **`@context-action/lit-ui/ssr`**: Lit SSR renderers (`renderLitElement`, `renderLitTemplate`) and client hydration (`hydrateLit`) that preserve `part`, `data-*`, and declarative shadow roots.
- **`@context-action/lit-ui/hydrate`**: Client-only hydration entry. It loads Lit hydration support and never imports the server renderer.
- **`ControllerScope`**: Re-exported from `@context-action/lit` for LIFO ReactiveController and cleanup disposal.

## React Bridge

```tsx
import { createElementFacade, createLitElementBridge } from '@context-action/lit-ui';

type TimelineHandle = Pick<TimelineElement, 'focusItem' | 'scrollTo' | 'commitSelection'>;

const ReactTimeline = createLitElementBridge<TimelineProps, TimelineElement, TimelineHandle>({
  tagName: 'st-timeline',
  properties: ['input', 'set'],
  events: { onSelectionChange: 'selection-change' },
  createHandle: createElementFacade<
    TimelineElement,
    readonly ['focusItem', 'scrollTo', 'commitSelection']
  >(['focusItem', 'scrollTo', 'commitSelection']),
});
```

- Properties removed from props are reset to `undefined`; read-only properties keep their adapter-owned value.
- Event listeners are reconciled by handler identity, so a re-render with the same handler performs zero `addEventListener` calls.
- `createHandle` exposes only the declared facade methods; raw element internals stay private.
- Props not listed in `properties`/`events` continue to render as DOM attributes.

## SSR and hydration

```ts
// Server (Node/Edge/Worker)
import { renderLitElement, renderLitTemplate } from '@context-action/lit-ui/ssr';

const markup = renderLitElement(timelineElement);
// or: const markup = renderLitTemplate(html`<st-timeline></st-timeline>`);

// Client — import before defining Lit elements so hydration support is installed.
import { hydrateLit } from '@context-action/lit-ui/hydrate';

hydrateLit(container, timelineElement);
```

The `./ssr` entry requires `@lit-labs/ssr` and `@lit-labs/ssr-client` (optional peers; install them in server/catalog deployments).
`renderLitElement` requires the element to be registered with `customElements.define()` first.
Reflected reactive properties are serialized as host attributes, and light DOM children are included by default so `<slot>` projection survives SSR (`includeLightDom: false` opts out).
`hydrateLit` re-exports from `./ssr` for compatibility, but `./hydrate` keeps the server renderer out of client bundles.

## Install

```bash
pnpm add @context-action/lit-ui @context-action/lit lit @lit/context
# Optional: SSR/catalog deployments
pnpm add @lit-labs/ssr @lit-labs/ssr-client
```

`lit`, `@lit/context`, and `react` are peer dependencies. `react` is optional
and only needed for `createLitElementBridge`. The SSR peers are optional and
only needed for `@context-action/lit-ui/ssr`.

The SSR entry does not read `window` or `document` at module evaluation time,
and builds to both ESM and CJS.
`renderLitTemplateAsync` / `renderLitElementAsync` are available for asynchronous element renderers.

## Verification

```bash
pnpm check:lit                                  # build + type-check + unit + edge runtime
pnpm verify:lit-react-compatibility             # React 18 consumer matrix
pnpm --filter @context-action/lit-ui test:browser # Chromium DSD hydration contract
```

## Status

Public package, version `0.1.2`, published to npm on 2026-10-23.

- https://www.npmjs.com/package/@context-action/lit-ui
- `latest` / `next`: `0.1.2`
- [`LIT_PUBLIC_0.1.2.md`](../../releases/LIT_PUBLIC_0.1.2.md) — hydration stabilization release record

Requires Node.js `>=24.11.0`.

## Architecture

```text
┌────────────────────────────────────────────────────────┐
│ React 18/19 Host Application                           │
│   └── createLitElementBridge(CustomElement)            │
└───────────────────────────┬────────────────────────────┘
                            │ (Direct Properties & Custom Events)
┌───────────────────────────▼────────────────────────────┐
│ Custom Element (LitElement / FormAssociatedLitElement)  │
│   ├── #shadow-root (Encapsulated CSS & DOM)            │
│   ├── ElementInternals (Native Form Participation)     │
│   ├── ContextStoreController / ContextActionController │
│   │     ▲                                              │
│   │     │ (W3C Context Protocol: context-request)       │
│   └─────┴──────────────────────────────────────────────┘
```

## Documentation

- [01. DOM Ownership & Shadow DOM Isolation](docs/01-dom-ownership.md)
- [02. ReactiveController vs React Hooks & 3-Layer Architecture](docs/02-reactive-controller-vs-hooks.md)
- [03. Form-Associated Custom Elements (FACE) & ElementInternals](docs/03-form-associated-elements.md)
- [04. W3C Context Protocol & Micro-Frontend Communication](docs/04-micro-frontend-communication.md)
- [05. Interface Design & Baseline State Management Standards](docs/05-interface-and-state-management-standards.md)
- [06. SSR and Hydration Entry](docs/06-ssr-hydration.md)
- [07. Public Release and Verification](docs/07-release-and-verification.md)
