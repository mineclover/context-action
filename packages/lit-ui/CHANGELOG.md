# Change Log

## [0.1.1] (2026-10-23)

Published to npm on 2026-10-23. `latest` and `next` resolve to `0.1.1`.

### Fixed

- `hydrateLit(host.shadowRoot, host)` now finds `lit-part` markers anywhere
  under the shadow root instead of assuming they are direct siblings of the
  first node. Declarative shadow roots with `static styles` are adopted instead
  of appending a second client render.
- If a client render already appended a duplicate tree before `hydrateLit` runs,
  the server root part is isolated, the client tree is removed, and the server
  tree is re-adopted. Final item counts and server node identity are preserved.

### Tests

- Added static-styles + three-item DSD hydration regression coverage in jsdom
  and Chromium, including the late `hydrateLit` after first-update scenario.

## [0.1.0] (2026-10-23)

Published to npm on 2026-10-23. `latest` and `next` resolve to `0.1.0`.

### Added

- Initial public release of the Lit UI primitives and integrations.
- `FormAssociatedLitElement` with ElementInternals, constraint validation,
  form value management, and reset/state-restore lifecycle hooks.
- W3C `@lit/context` tokens, providers, and controllers for stores and action
  registers across Shadow DOM boundaries.
- `createLitElementBridge` for React 18/19 with direct complex-property
  assignment, bridge-owned property removal, handler-identity event
  reconciliation, StrictMode safety, attribute passthrough, and OOP facade
  handles through `createHandle` / `createElementFacade`.
- `@context-action/lit-ui/ssr` with `renderLitElement`, `renderLitTemplate`,
  reflected host attributes, light DOM/slot preservation, and async renderer
  variants.
- `@context-action/lit-ui/hydrate` as a client-only entry with Lit hydration
  support, declarative shadow root adoption, template hydration, and no server
  renderer dependency.
- Reference `LitQuantityStepper` and `LitCartBadge` custom elements.
- `ControllerScope` re-export from `@context-action/lit`.

### Verification

- Unit, stress, React 18 consumer matrix, processless/Edge runtime, and Chromium
  declarative-shadow-DOM hydration contracts run through `pnpm check:lit`,
  `pnpm verify:lit-react-compatibility`, and `pnpm --filter @context-action/lit-ui test:browser`.
- Package exports and tarballs are part of the public package verification,
  including a packed consumer install smoke.

### Changed

- Tooling updated to React 19.3.1 for the development matrix, Vitest `5.0.5`,
  jsdom `30.1.3`, Vite `8.3.5`, and tsdown `0.23.1`; TypeScript remains on the
  repository's `6.0.3` baseline.
- Reference custom elements use idempotent registration so ESM and CJS builds
  can be loaded in the same process without a duplicate-definition error.

### Documentation

- README and `docs/` cover DOM ownership, ReactiveController architecture, FACE,
  W3C context communication, interface standards, SSR, hydration, and the React
  bridge contract.
