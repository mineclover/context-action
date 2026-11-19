# CA-SURFACE-CATALOG-001: Repository API, Example, and Document Surface Catalog Governance

**Status:** accepted  
**Owner:** Framework Architecture & Documentation Governance  
**Related issue/spec:** CA-SURFACE-CATALOG-001 ([Repository Surface Catalog](../repository-surface-catalog.md), [Package Boundary Convention](../package-boundary-convention.md), [Specification, Issue, and Documentation Management](../change-management-convention.md))

## Context

The repository now spans 20 workspace packages (`packages/*`), 72 canonical routes inside `example/` (116 total routes including legacy redirects), standalone demos (`demos/bolt-style-editor`, `examples/vanilla-js`), 7 package-local `examples/` suites, 9 narrative example walkthroughs, 13 root markdown files, bilingual documentation trees, release manifests, and derived TypeDoc/LLMS artifacts.

Previously, these surfaces were only discoverable piecemeal across `package.json`, `typedoc.json`, `example/src/App.tsx`, `sidebars.ts`, and `package-boundary-convention.md` (where `@context-action/lit`, `@context-action/lit-ui`, `@context-action/webmcp`, and `@context-action/template-react` were already omitted from the package map). Without a machine-verifiable base specification, new packages, example routes, or unpaired translations drifted silently.

## Options considered

- **Manually maintained markdown lists only**: Rejected because prose inventories rot immediately when packages, export subpaths, canonical routes, or markdown directories change.
- **Replacing existing source-of-truth files (`package.json`, `typedoc.json`, `App.tsx`) with a monolithic generator**: Rejected because each surface already has an authoritative runtime source (`package.json#exports`, `typedoc.json`, `example/src/App.tsx`, handwritten `docs/{en,ko}/`); duplicating runtime ownership violates `package-boundary-convention.md`.
- **Option 1 (Accepted): Three versioned JSON catalogs under `catalog/repository-surface/` verified fail-closed against live disk sources, paired with an authoritative bilingual base guide**: Preserves existing runtime/doc sources of truth while enforcing 1:1 structural parity via `pnpm verify:surface-catalog`.

## Decision

Establish three versioned, machine-verifiable surface catalogs under `catalog/repository-surface/` plus bilingual base specifications:

- `catalog/repository-surface/api-surface.v1.json`: catalogs all 20 workspace packages (`layer`, `visibility`, `stability`, `exports` subpaths, workspace dependencies/peers, `typedocEntryPoints`, `readme`, `authoritativeDocs`, `verificationGate`).
- `catalog/repository-surface/example-surface.v1.json`: catalogs all 72 canonical `example/` routes across 13 semantic groups, standalone demos (`demos/bolt-style-editor`, `examples/vanilla-js`), all 7 `packages/*/examples` suites, and all 9 paired narrative example docs (`docs/{en,ko}/examples/*.md`).
- `catalog/repository-surface/document-surface.v1.json`: catalogs all 13 root markdown files, managed documentation areas with explicit `authorityClass` and `pairingPolicy` (`strict-paired`, `tracked-partial`, `single-locale`, `derived`, `not-applicable`), and derived TypeDoc/LLMS outputs.
- Enforce 1:1 parity via `scripts/verify-repository-surface-catalog.mjs` (`pnpm verify:surface-catalog`), wired into `pnpm convention:check` alongside `scripts/verify-repository-surface-catalog.test.mjs`.

## Consequences and invariants

1. **Source-First Non-Duplication**: Catalogs reference and index authoritative sources (`package.json`, `typedoc.json`, `example/src/App.tsx`, `docs/`) rather than replacing them.
2. **Explicit Partial-Parity Accountability**: Directories with legacy translation gaps (`docs/{en,ko}/guide`, `docs/{en,ko}/troubleshooting`) are governed as `tracked-partial` with exact `knownUnpaired` inventories, while `concept`, `context-layered`, `examples`, and `llms` enforce `strict-paired` zero-drift parity.
3. **Fail-Closed Drift Gate**: Adding or removing a workspace package, export subpath, workspace dependency, canonical example route, `packages/*/examples` directory, root markdown file, or unpaired guide page without updating the corresponding catalog fails `pnpm verify:surface-catalog` and `pnpm convention:check`.
4. **Visible Documentation Debt**: Coverage gaps such as TypeDoc covering 6 of 16 public packages and `guide`/`troubleshooting` translation gaps remain explicitly surfaced rather than hidden.

## Verification evidence

- Base specification & inventory: [Repository Surface Catalog](../repository-surface-catalog.md) (KO: [저장소 표면 카탈로그](../../../ko/context-layered/repository-surface-catalog.md))
- Catalog contracts: `catalog/repository-surface/api-surface.v1.json`, `catalog/repository-surface/example-surface.v1.json`, `catalog/repository-surface/document-surface.v1.json`
- Fail-closed verifier & regression tests: `scripts/verify-repository-surface-catalog.mjs`, `scripts/verify-repository-surface-catalog.test.mjs` (`pnpm verify:surface-catalog`, `pnpm convention:check`)
- Documentation discovery gates: `pnpm docs:management`, `pnpm llms:check`, `pnpm docs:build`

## Reversal or migration conditions

Bump catalog schema versions (`*.v2.json`) if package layers, stability tiers, or authority classes change incompatibly. Individual entries may be retired when a package is deprecated per `package-boundary-convention.md` or when a `tracked-partial` area achieves full EN/KO parity and transitions to `strict-paired`.
