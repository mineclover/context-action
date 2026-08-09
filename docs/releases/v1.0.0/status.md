# Context-Action v1.0.0 Release Status

**Status:** `NOT READY`<br>
**Baseline commit:** `0d6047b99961a33ef0d09704ae39c577d3b89cd8`<br>
**Roadmap revision:** `v1-r2`<br>
**Last synchronized:** 2026-08-09

This is the committed mirror of release readiness until a dedicated v1.0 GitHub
Project is provisioned. It records status, blockers, and next work; immutable
command results and artifact hashes belong in
`release-evidence/v1.0.0-*/manifest.json`.

| Gate | Status | Next evidence or decision |
| --- | --- | --- |
| G0 Scope/versioning | `partial` | candidate scope/manifest and inventory are recorded in `v1.0.0-dev-m0`; approve the target map |
| G1 Public API | `partial` | contract candidates and candidate legacy outcomes exist; public-contract approval remains |
| G2 Core execution | `partial` | Core tests are recorded in `v1.0.0-dev-m3`; rerun from a clean RC commit |
| G3 Lifecycle/metrics | `partial` | lifecycle report and focused suite are recorded in `v1.0.0-dev-m3`; certify the RC artifact |
| G4 React contract | `partial` | React 18.3.1/19.2.8 packed SSR checks are recorded in `v1.0.0-dev-m4-m5`; rerun from the RC commit |
| G5 Tool adapters | `partial` | WebMCP isolation and Tool Protocol/AI SDK/WebMCP checks are recorded; external consumer certification remains |
| G6 Consumer packages | `partial` | 10 tarball contracts and local tool-consumer smoke are recorded; certify the RC package matrix |
| G7 Docs/migration | `partial` | canonical scope, migration, and readiness documents plus the packed fixture exist; approval and RC evidence remain |
| G8 Independent audit | `not-started` | audit protocol/template are prepared; fresh-context adversarial audit is required |
| G9 Security/supply chain | `partial` | OSV and local supply-chain reports are recorded in `v1.0.0-dev-g9`; registry provenance remains |

## Blocking conditions

- Package, subpath, and named-surface stability classification is not approved.
- The v1 target version map and independent release manifest are candidate-only
  and not approved.
- Legacy API candidate outcomes await public-contract approval.
- A full release evidence bundle, external consumer certification, and
  independent audit have not been recorded.

## Immediate next work

1. Create the G0 package/subpath inventory and target version map.
2. Approve the target version map, M1 candidates, and M2 legacy decisions.
3. Obtain an independent audit of the canonical M6 document set and RC artifact.
4. From the clean RC commit, generate a new immutable evidence bundle, run
   strict verification, and complete the external-consumer and provenance gates.

## Development evidence

`release-evidence/v1.0.0-dev-m0/manifest.json`,
`release-evidence/v1.0.0-dev-m3/manifest.json`, and
`release-evidence/v1.0.0-dev-m4-m5/manifest.json`, and
`release-evidence/v1.0.0-dev-g9/manifest.json`, and
`release-evidence/v1.0.0-dev-full/manifest.json` record successful local
inventory, Core/lifecycle, tarball, React 18/19, adapter, migration, and OSV
checks. Their working trees are deliberately `dirty`, so they are development
evidence only and cannot be used with `--require-success` for release
certification.
