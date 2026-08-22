# React Compiler and React 19.2 baseline

`@context-action/react` is compiled for React 19.2+ before publication. This
means consumers receive the optimizations for compiler-annotated hooks without
adding React Compiler to their own application build.

## Runtime contract

- `react` peer dependency: `^19.2.0`
- Compiler target: `19`
- Compilation mode: `annotation`
- Runtime import: `react/compiler-runtime`, supplied by React 19

The package no longer supports React 18 and does not ship the former
`@context-action/react/react18` compatibility entry point. Because the minimum
runtime is React 19, it does not need the separate `react-compiler-runtime`
package used by compiler output that must run on earlier React releases.

## Build integration

The authoritative build configuration is
[`packages/react/tsdown.config.ts`](packages/react/tsdown.config.ts). It runs
`babel-plugin-react-compiler` through `@rolldown/plugin-babel`; standalone
Babel configuration files are intentionally not used by the package build.

Annotation mode only transforms functions whose body starts with `"use memo"`.
This keeps the rollout explicit and makes each compiler adoption reviewable.

## Verification

Run the focused checks after changes to compiler-annotated hooks:

```bash
pnpm --filter @context-action/react build
pnpm --filter @context-action/react test
pnpm verify:react-artifact-boundary
pnpm verify:react-compatibility
```

The artifact boundary check verifies that both ESM and CommonJS production
chunks retain the `react/compiler-runtime` import. The compatibility command
tests the minimum supported React 19.2 release and the current pinned release,
including packed consumer type checks and SSR.
