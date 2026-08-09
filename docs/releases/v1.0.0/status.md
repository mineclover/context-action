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
| G0 Scope/versioning | `partial` | candidate scope/manifest and inventory are recorded; approve the target map |
| G1 Public API | `partial` | contract candidates and candidate legacy outcomes exist; public-contract approval remains |
| G2 Core execution | `partial` | clean pre-RC evidence records the full verification suite; certify an approved RC artifact |
| G3 Lifecycle/metrics | `partial` | a clean lifecycle report is recorded; certify the approved RC artifact |
| G4 React contract | `partial` | React 18.3.1/19.2.8 packed SSR checks and full clean verification are recorded; external consumer certification remains |
| G5 Tool adapters | `partial` | clean evidence covers isolation and Tool Protocol/AI SDK/WebMCP checks; external consumer certification remains |
| G6 Consumer packages | `partial` | clean evidence covers 10 tarball contracts and local tool-consumer smoke; certify the approved RC package matrix |
| G7 Docs/migration | `partial` | canonical scope, migration, readiness documents, packed fixture, and clean pre-RC verification exist; approval remains |
| G8 Independent audit | `not-started` | audit protocol/template are prepared; fresh-context adversarial audit is required |
| G9 Security/supply chain | `partial` | a clean local supply-chain report is recorded; registry provenance remains |

## Blocking conditions

- Package, subpath, and named-surface stability classification is not approved.
- The v1 target version map and independent release manifest are candidate-only
  and not approved.
- Legacy API candidate outcomes await public-contract approval.
- The clean pre-RC bundle is not an approved RC artifact; external consumer
  certification, registry provenance, and an independent audit are unrecorded.

## Immediate next work

1. Approve the G0 target version map, M1 candidates, and M2 legacy decisions.
2. Create an approved RC artifact and generate its immutable, strict evidence bundle.
3. Obtain an independent audit of the canonical M6 document set and RC artifact.
4. Complete external-consumer certification and registry provenance before any
   `latest` publication decision.

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

## Clean pre-RC evidence

`release-evidence/v1.0.0-clean-precheck-1/manifest.json` was generated from
commit `13086d07a6d70a06d27c3af0ec9f18767b00f1ad` with a `clean` source working
tree. Its `verify-all` and roadmap-alignment commands passed, and
`pnpm release:evidence:verify -- --require-success` passed. It proves local
reproducibility of the pre-RC candidate only; it does not approve the candidate
manifest or authorize publication.
