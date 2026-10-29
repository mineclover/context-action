# Change Log

## [0.2.1] (2026-10-29)

Core 1.3.0 element interop cohort candidate. The adapter now uses Core
element/react subpaths through `@context-action/core@^1.3.0`.

## [0.2.0] (2026-10-18)

Published to npm on 2026-10-23. `latest` and `next` resolve to `0.2.0`.

### Added

- `definePreactElement<Input, Expose>` accepts a declarative `expose` object on
  the setup lifecycle. Getter/setter/command descriptors (string and `Symbol`
  keys) are installed on each instance, and the returned
  `PreactCustomElementConstructor<Input, Expose>` types `new Tag()` as
  `ManagedPreactElement<Input> & Expose` without `as unknown as` casts.
- `createElementFacade(keys)` and `ImperativeHandleFactory` are exported from the
  root entry for React-free hosts (Vanilla DOM, Preact, other frameworks) and
  re-exported from `./react-bridge`.
- `createCustomElementBridge<Props, Element, Handle>` accepts `createHandle` so
  React parents receive an encapsulated OOP handle through `useImperativeHandle`
  instead of the raw `HTMLElement`. Omitting it keeps the previous behavior.
- `PublicActionMethods<Actions, PublicKeys, ReturnMap>`, `ExposeContract<Expose>`,
  and `ReservedElementKey` types.

### Changed

- **Breaking:** `expose` may not redefine reserved element members
  (`HTMLElement` platform members and the managed API such as `dispose`,
  `updateInput`, `name`, `form`, `checkValidity`). This is rejected at compile
  time through `ExposeContract`, and at construction time with a `TypeError`
  before any member is installed; `onDestroy` runs so setup-owned resources are
  released.
- **Fix:** an `upgradeProperties` value assigned before definition now replays
  through the prototype setter (for example `name`) when `expose` does not
  redefine that member. In 0.1.x the pre-upgrade own data property kept
  shadowing the setter.
- `createElementFacade` returns a stable bound function per element and method
  (safe for React dependency arrays and `removeEventListener`), detects
  read-only members anywhere on the prototype chain, and ignores duplicate keys.
- `createElementFacade`, `ImperativeHandleFactory`, and `PublicActionMethods`
  are isolated in a zero-dependency `facade` module so `@context-action/preact-ui/react-bridge`
  no longer pulls in the `preact` / `custom-element` runtime chunk.

### Verification

- The root and `./ssr` entries are verified to load without a `process` global
  (ESM and CJS). `./react-bridge` is excluded because React itself reads
  `process.env`.
- Depend on `@context-action/preact@^0.1.2` and publish after that package in
  the protected Preact release cohort.

### Migration from 0.1.x

- Rename any `expose` member that collides with a reserved element member.
- Prefer `expose` over manual `Object.defineProperties(element, ...)` and drop
  constructor casts; existing manual definitions keep working.

## [0.1.1] (2026-10-04)

### Documentation & Verification

- Comprehensive README hardening detailing DOM root boundaries, subtree lifecycle rules, and integration guides.
- Explicit documentation of conditional peer dependencies (`react` for `./react-bridge`, `preact-render-to-string` for `./ssr`).
- Depend on `@context-action/preact@^0.1.1` and publish after that package in the protected Preact release cohort.

## [0.1.0] (2026-10-02)

### Public preview

- Publish the first public preview of the owned Preact DOM-root, template,
  hydration, SSR, disposal, and custom-element helpers.
- Include the connection-session, slot, FACE, React bridge, and standalone
  browser contracts covered by the package validation matrix.
- Depend on `@context-action/preact@^0.1.0` and publish after that package in
  the protected Preact release cohort.

Pre-1.0 releases may change their public API or supported runtime matrix before
the package is promoted to a stable 1.0 contract.
