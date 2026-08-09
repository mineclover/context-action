# Context-Action v1.0.0 Release Status

**Status:** `NOT READY`<br>
**Baseline commit:** `eef7af18639dc2431e95e2f68b4489bb368a2c16` (token-gated governance controls; strict evidence recorded)<br>
**Roadmap revision:** `v1-r2`<br>
**Last synchronized:** 2026-08-10

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
| G8 Independent audit | `not-started` | fresh-context audit plus traceable GitHub approval record are required |
| G9 Security/supply chain | `partial` | clean local supply-chain and npm registry provenance reports are recorded; independent artifact audit remains |

## Blocking conditions

- Package, subpath, and named-surface stability classification is not approved.
- The v1 target version map and independent release manifest are candidate-only
  and not approved.
- Registry evidence records the published `next` cohort from
  `63f790a521e3428a7a2825677747338f8f05ccf3`. The npm CLI cryptographically
  verified all four registry signatures and SLSA provenance bundles; the
  independent adversarial audit is still required. `@context-action/webmcp@0.1.0-rc.0`
  still owns `latest`; publish the dedicated `0.1.1` hygiene patch to replace
  it. The existing candidate must then be re-baselined for WebMCP before the
  manifest can reach `approved-for-stable`.
- Legacy API candidate outcomes await public-contract approval.
- The published consumer matrix and provenance verification are recorded, but
  the published artifact has not received the required independent audit.
- The `npm-stable` environment now limits deployments to `main`, requires the
  `mineclover` reviewer, permits the documented owner-authorized self-review
  exception, and disallows administrator bypass. It is the protected
  stable-release environment used by both guarded publication workflows.
- Existing strict evidence ends at an earlier governance commit. The current
  promotion-governance controls require a fresh clean evidence bundle and a
  recorded file fingerprint before approval; past bundles remain historical.
- `@context-action/tool-protocol@1.0.0` has the accepted bundled-CHANGELOG
  limitation recorded in the manifest and known-limitations document. A patch
  cohort is required if bundled release notes are a certification requirement.
- A successful `latest` tag mutation with failed registry-evidence capture is
  represented as `promotion-evidence-pending`, never as `promoted`. That state
  is retriable but still blocks release declaration until fresh evidence is
  captured and recorded.

## Live external configuration check

On 2026-08-10, read-only npm and GitHub API checks confirmed the recorded
external state:

- `@context-action/webmcp`: `latest` is still `0.1.0-rc.0`, while `next` is
  `0.1.0`; registry hygiene remains blocked.
- `npm-stable` allows only `main`, requires review by `mineclover`, permits the
  owner-authorized self-review exception, and disallows administrator bypass.

The protected environment configuration is present, but its sole configured
reviewer created a self-review deadlock for `mineclover`. On 2026-08-10, the
release owner authorized and applied the narrow exception
`prevent_self_review: false`; the main-only branch policy, required reviewer,
and administrator-bypass prohibition remain in force. This exception is an
owner risk acceptance, not proof of independent audit.

The protected WebMCP hygiene rehearsals `31328409822` and `31328975435`
confirmed that direct `dist-tag rm` is not a viable repair path (OIDC failed
with `E401`; the configured token failed with `E403`). The repair is now the
versioned `@context-action/webmcp@0.1.1` hygiene patch, published through a
separate protected workflow. Its token preflight and exact-version validation
remain fail-closed before any publication attempt.

## Immediate next work

1. Publish the protected `@context-action/webmcp@0.1.1` hygiene patch to
   `latest`, then record its registry and consumer evidence.
2. Re-baseline the WebMCP leg of the v1 manifest, provenance audit, and strict
   governance evidence before any future stable promotion.
3. Obtain an independent audit of the exact registry-installed `next` artifact
   with the traceable GitHub approval record.
4. Complete the hashed G0/G1 owner record in
   [release-approval.md](./release-approval.md) for the target map, M1
   candidates, and M2 legacy decisions.
5. Run an `npm-stable` no-op or intentionally failing dry run with separate
   dispatcher and reviewer identities before any `latest` promotion.

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

## Current clean governance evidence

`release-evidence/v1.0.0-eef7af18-governance-prepublish-1/manifest.json` was
generated from clean commit `eef7af18639dc2431e95e2f68b4489bb368a2c16`.
Its independently rerun `release:check` completed successfully in 209677 ms,
and its inventory, manifest, workflow-contract, roadmap, and governed-file
fingerprint commands also passed. The bundle's manifest SHA-256 is
`ba143274f09727762b549787ec520f6e50530dc2594eff51809fbb4a0a6d2fa4`; the
promotion-governance fingerprint is
`9cb4b0cb548905ff5cdea688925b69740b540f8bbd73fea547c311f28e225766`.
These values are recorded in the release manifest and must be copied into the
future G0/G1 acceptance record. This evidence proves the governance controls,
not independent audit approval or readiness to promote `latest`.

## Historical clean pre-RC evidence

`release-evidence/v1.0.0-d0d84fbc-governance-prepublish-1/manifest.json` was
generated from clean commit `d0d84fbccc93edcd4ccb86e01edff70a4e56e6f8`. Its
full `release:check`, inventory, manifest validation, workflow-contract, and
roadmap commands passed, and it passes
`pnpm release:evidence:verify -- --require-success` when checked out at that
commit. It covers the non-bypassable `npm-stable` environment state and all
guarded workflow contracts. It remains governance evidence only: it does not
replace an independent audit or authorize `latest` promotion.

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

The later `f493c9a7cb21c59e5d6a4183fa521672afc9b2e4` governance change added
live registry tarball revalidation and consumer-matrix rollback coverage, so
none of the earlier clean bundles is strict evidence for that later code. The
final committed governance baseline must generate a new strict bundle; its
manifest hash and governed-file fingerprint are then copied into
`release-manifest.json` before `approved-for-stable`.

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
