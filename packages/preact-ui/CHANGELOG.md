# Change Log

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
