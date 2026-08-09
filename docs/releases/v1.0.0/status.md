# Context-Action v1.0.0 Release Status

**Status:** `NOT READY`<br>
**Baseline commit:** `2900c28a48dcc750645d1ee546223973d068e33a`<br>
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
| G2 Core execution | `partial` | clean governance-commit evidence exists; certify the approved registry artifact after external gates |
| G3 Lifecycle/metrics | `partial` | clean governance-commit lifecycle evidence exists; certify the approved registry artifact after external gates |
| G4 React contract | `partial` | React 18.3.1/19.2.8 packed SSR checks and clean evidence exist; complete provenance/audit certification |
| G5 Tool adapters | `partial` | isolation and Tool Protocol/AI SDK/WebMCP checks and clean evidence exist; complete provenance/audit certification |
| G6 Consumer packages | `partial` | published `next` CJS/ESM/NodeNext/React 18/19 SSR matrix and npm provenance verification passed; independent audit remains |
| G7 Docs/migration | `partial` | canonical scope, migration, readiness documents, packed fixture, and clean governance evidence exist; public-contract approval remains |
| G8 Independent audit | `not-started` | audit protocol/template are prepared; fresh-context adversarial audit is required |
| G9 Security/supply chain | `partial` | clean local supply-chain and npm registry provenance reports are recorded; independent artifact audit remains |

## Blocking conditions

- Package, subpath, and named-surface stability classification is not approved.
- The v1 target version map and independent release manifest are candidate-only
  and not approved.
- Registry evidence records the published `next` cohort from
  `63f790a521e3428a7a2825677747338f8f05ccf3`. The npm CLI cryptographically
  verified all four registry signatures and SLSA provenance bundles; the
  independent adversarial audit is still required. `@context-action/webmcp@0.1.0-rc.0`
  still owns `latest`; the dedicated promotion workflow cannot run until audit
  and approval gates pass.
- Legacy API candidate outcomes await public-contract approval.
- The published consumer matrix and provenance verification are recorded, but
  the published artifact has not received the required independent audit.
- The `npm-stable` environment now limits deployments to `main`, requires the
  `mineclover` reviewer, prevents self-review, and disallows administrator
  bypass. It is the non-bypassable stable-release environment used by both
  guarded publication workflows.

## Immediate next work

1. Obtain an independent audit of the exact registry-installed `next` artifact.
2. Complete the hashed G0/G1 owner record in
   [release-approval.md](./release-approval.md) for the target map, M1
   candidates, and M2 legacy decisions.
3. Preserve the recorded strict evidence while external audit
   decisions are completed; regenerate it if the chosen release commit changes.

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

`release-evidence/v1.0.0-2900c28a-governance-prepublish-1/manifest.json` was
generated from clean commit `2900c28a48dcc750645d1ee546223973d068e33a`. Its
full `release:check`, inventory, manifest validation, and roadmap commands
passed, and it passes `pnpm release:evidence:verify -- --require-success` when
checked out at that commit. It covers the guarded stable-candidate and
promotion workflows, hashed audit/G0-G1 approval gates, and the recorded
`npm-stable` environment state. It remains governance evidence only: it does
not replace an independent audit or authorize `latest` promotion.

`release-evidence/v1.0.0-414cf675-governance-prepublish-1/manifest.json` was
generated from clean commit `414cf675e236692fd9971eec62c4d92576a4e5f3`. Its
`release:check`, inventory, manifest validation, and roadmap commands passed,
and it passes `pnpm release:evidence:verify -- --require-success` when checked
out at that commit. It records current governance/process readiness only; it
does not verify registry provenance, replace the independent audit, or permit
`latest` promotion.

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
