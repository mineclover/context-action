# Context-Action v1.0.0 Release Status

**Status:** `NOT READY`<br>
**Baseline commit:** `pending clean release freeze`<br>
**Roadmap revision:** `v1-r2`<br>
**Last synchronized:** 2026-08-09

This is the committed mirror of release readiness until a dedicated v1.0 GitHub
Project is provisioned. It records status, blockers, and next work; immutable
registry facts are mirrored in [release-manifest.json](./release-manifest.json)
and command results/artifact hashes belong in
`release-evidence/v1.0.0-*/manifest.json`.

| Gate | Status | Next evidence or decision |
| --- | --- | --- |
| G0 Scope/versioning | `partial` | candidate scope/manifest and inventory are recorded; approve the target map |
| G1 Public API | `partial` | contract candidates and candidate legacy outcomes exist; public-contract approval remains |
| G2 Core execution | `partial` | recreate clean evidence for the frozen release commit, then certify the approved RC artifact |
| G3 Lifecycle/metrics | `partial` | recreate the lifecycle report from the frozen release commit, then certify the approved RC artifact |
| G4 React contract | `partial` | React 18.3.1/19.2.8 packed SSR checks exist; recreate clean evidence and complete external consumer certification |
| G5 Tool adapters | `partial` | isolation and Tool Protocol/AI SDK/WebMCP checks exist; recreate clean evidence and complete external consumer certification |
| G6 Consumer packages | `partial` | published `next` CJS/ESM/NodeNext/React 18/19 SSR matrix passed; provenance verification and independent audit remain |
| G7 Docs/migration | `partial` | canonical scope, migration, readiness documents, and packed fixture exist; regenerate clean evidence after documentation freeze |
| G8 Independent audit | `not-started` | audit protocol/template are prepared; fresh-context adversarial audit is required |
| G9 Security/supply chain | `partial` | a clean local supply-chain report is recorded; registry provenance remains |

## Blocking conditions

- Package, subpath, and named-surface stability classification is not approved.
- The v1 target version map and independent release manifest are candidate-only
  and not approved.
- Registry evidence records the published `next` cohort from
  `63f790a521e3428a7a2825677747338f8f05ccf3`, but each npm provenance bundle
  remains pending independent verification. `@context-action/webmcp@0.1.0-rc.0`
  still owns `latest`; the dedicated promotion workflow cannot run until
  provenance and audit gates pass.
- Legacy API candidate outcomes await public-contract approval.
- The published consumer matrix is recorded, but its provenance has not been
  independently verified and the published artifact has not received the
  required independent audit.
- The historical clean evidence predates the current workflow, manifest, and
  changelog changes. It cannot certify the next canonical release commit.

## Immediate next work

1. Independently verify the npm provenance bundle for every `next` package and
   move the manifest to `published-unapproved` only with that evidence.
2. Obtain an independent audit of the exact registry-installed `next` artifact.
3. Approve the G0 target version map, M1 candidates, and M2 legacy decisions.
4. Freeze the current governance/docs commit and generate immutable strict
   evidence with `--require-clean` before any `latest` decision.

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

## Historical clean pre-approval evidence

`release-evidence/v1.0.0-rc.0-preapproval-1/manifest.json` was generated from
the clean RC-preparation commit `05a57d526cad64bad78526fededa9df567840fe1`.
It records successful `pnpm release:check`, `pnpm release:inventory`, candidate
manifest validation, and roadmap-alignment validation, and it passes
`pnpm release:evidence:verify -- --require-success` when verified from its
recorded commit. It is now historical because the workflow, manifest, and
documentation changed after that commit; it does not authorize publication.
