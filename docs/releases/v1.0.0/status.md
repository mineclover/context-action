# Context-Action v1.0.0 Release Status

**Status:** `PROMOTED — stable surfaces at latest`<br>
**Baseline commit:** `17d6ddb2ddd8c6e23078a38db0fd0eb2647c3666` (protected promotion dispatch commit)<br>
**Roadmap revision:** `v1-r2`<br>
**Last synchronized:** 2026-08-10

This is the committed mirror of release readiness until a dedicated v1.0 GitHub
Project is provisioned. It records status, blockers, and next work; immutable
registry facts are mirrored in [release-manifest.json](./release-manifest.json)
and command results/artifact hashes belong in
`release-evidence/v1.0.0-*/manifest.json`.

| Gate | Status | Next evidence or decision |
| --- | --- | --- |
| G0 Scope/versioning | `documented` | owner-maintained scope, version map, and inventory are recorded |
| G1 Public API | `documented` | contract candidates and legacy outcomes are documented in the release set |
| G2 Core execution | `verified` | current governance bundle and immutable registry provenance are recorded |
| G3 Lifecycle/metrics | `verified` | lifecycle checks are included in the clean governance bundle |
| G4 React contract | `verified` | React 18.3.1/19.2.8 packed SSR checks and registry provenance are recorded |
| G5 Tool adapters | `verified` | Tool Protocol/AI SDK checks are recorded; WebMCP remains experimental |
| G6 Consumer packages | `verified` | consumer verifier is fingerprinted and the published `next` matrix passed |
| G7 Docs/migration | `verified` | canonical release controls and fresh clean evidence are current |
| G8 Owner self-review | `documented` | reproducible verification and optional owner review replace an unavailable independent-auditor gate |
| G9 Security/supply chain | `partial` | clean local supply-chain and npm registry provenance reports are recorded |

## Blocking conditions

- Registry evidence records the published `next` cohort from
  `63f790a521e3428a7a2825677747338f8f05ccf3`. The npm CLI cryptographically
  verified all four registry signatures and SLSA provenance bundles. The protected hygiene
  workflow has replaced the accidental WebMCP RC `latest` tag with
  `@context-action/webmcp@0.1.1`. The immutable `0.1.0` candidate is now
  experimental surface is excluded from the v1 stable-promotion target set;
  its separately published patch does not block stable-surface promotion.
- The `npm-stable` environment now limits deployments to `main`, requires the
  `mineclover` reviewer, permits the documented owner-authorized self-review
  exception, and disallows administrator bypass. It is the protected
  stable-release environment used by both guarded publication workflows.
- `release-evidence/v1.0.0-1a77f373-solo-governance-2/manifest.json` is the
  current clean governance bundle. It records successful release checks,
  inventory, workflow-contract validation, and a governed-file fingerprint
  that includes the stable-consumer verifier. Its SHA-256 and fingerprint are
  bound in the manifest.
- The immutable `@context-action/tool-protocol@1.0.0` tarball had a stale
  bundled `CHANGELOG.md`. The protected packaging-only correction
  `@context-action/tool-protocol@1.0.1` now owns `latest`, preserved
  `next=1.0.0` and `rc=1.0.0-rc.0`, passed the exact-version consumer check,
  and has independently verified npm attestation provenance. Evidence is in
  `release-evidence/tool-protocol-changelog-patch-1.0.1-31349046893/`.
- A successful `latest` tag mutation with failed registry-evidence capture is
  represented as `promotion-evidence-pending`, never as `promoted`. That state
  is retriable but still blocks release declaration until fresh evidence is
  captured and recorded.

## Live external configuration check

On 2026-08-10, read-only npm and GitHub API checks confirmed the recorded
external state:

- `@context-action/webmcp`: `latest` is `0.1.1`, while `next` is `0.1.0` and
  `rc` is `0.1.0-rc.0`; registry tag hygiene is cleared. Protected workflow
  run `31341251251` also passed the `latest` external-consumer check; its
  captured evidence is
  `release-evidence/webmcp-hygiene-patch-0.1.1-31341251251/registry-evidence.json`.
- `npm-stable` allows only `main`, requires review by `mineclover`, permits the
  owner-authorized self-review exception, and disallows administrator bypass.

The protected environment configuration is present, but its sole configured
reviewer created a self-review deadlock for `mineclover`. On 2026-08-10, the
release owner authorized and applied the narrow exception
`prevent_self_review: false`; the main-only branch policy, required reviewer,
and administrator-bypass prohibition remain in force. This is the documented
single-maintainer operating model; provenance, consumer, rollback, and evidence
checks remain mandatory.

The protected WebMCP hygiene rehearsals `31328409822` and `31328975435`
confirmed that direct `dist-tag rm` is not a viable repair path (OIDC failed
with `E401`; the configured token failed with `E403`). The repair is now the
versioned `@context-action/webmcp@0.1.1` hygiene patch, published through a
separate protected workflow. Run `31340779674` published it, and rerun
`31341251251` completed the deferred tag, consumer, and registry-evidence
checks without republishing. Its token preflight and exact-version validation
remain fail-closed before any publication attempt.

## Immediate next work

1. Preserve the promotion artifact from protected workflow run `31347327623`
   with its registry and provenance results.
2. Review the v1 specification set against the now-stable package surfaces.

## Stable promotion result

Protected workflow run `31347327623` completed successfully on 2026-08-10.
It reverified npm provenance for the published cohort, promoted
`@context-action/tool-protocol@1.0.0`, `@context-action/core@1.0.0`, and
`@context-action/react@1.0.0`, waited for the exact `latest` metadata, and
passed the CJS/ESM/NodeNext/React 18/19 consumer matrix. The later protected
Tool Protocol `1.0.1` packaging correction owns `latest`; it changes neither
the runtime API nor declaration contract. Captured promotion artifacts are
stored at `release-evidence/v1.0.0-stable-promotion-31347327623/`.

`@context-action/webmcp` remains experimental: `latest` is the separately
published hygiene patch `0.1.1`; its original `0.1.0` candidate remains on
`next` and was not part of the stable-surface promotion.

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

`release-evidence/v1.0.0-1a77f373-solo-governance-2/manifest.json` was
generated from clean commit `1a77f373ade554fb959fe17aac7b7c1157aa74f5`.
Its release check, inventory, workflow-contract validation, and governed-file
fingerprint commands passed. The bundle SHA-256 is
`2c266ff7d1520b25ab70691eaaf1501af83296b7208dcc45a699f66afa998978`; the
promotion-governance fingerprint is
`2109ef32ab6c3ae94689d320e08e206cb4d47b68e884b1338b423086e499d34e`.
These values bind the protected stable-surface promotion; post-promotion
registry evidence remains required before the release is declared complete.

## Historical clean pre-RC evidence

`release-evidence/v1.0.0-d0d84fbc-governance-prepublish-1/manifest.json` was
generated from clean commit `d0d84fbccc93edcd4ccb86e01edff70a4e56e6f8`. Its
full `release:check`, inventory, manifest validation, workflow-contract, and
roadmap commands passed, and it passes
`pnpm release:evidence:verify -- --require-success` when checked out at that
commit. It covers the non-bypassable `npm-stable` environment state and all
guarded workflow contracts. It remains governance evidence only: it does not
authorize `latest` promotion by itself.

`release-evidence/v1.0.0-2900c28a-governance-prepublish-1/manifest.json` was
generated from clean commit `2900c28a48dcc750645d1ee546223973d068e33a`. Its
full `release:check`, inventory, manifest validation, and roadmap commands
passed, and it passes `pnpm release:evidence:verify -- --require-success` when
checked out at that commit. It covers the guarded stable-candidate and
promotion workflows, hashed audit/G0-G1 approval gates, and the recorded
`npm-stable` environment state. It remains governance evidence only: it does
not authorize `latest` promotion by itself.

`release-evidence/v1.0.0-414cf675-governance-prepublish-1/manifest.json` was
generated from clean commit `414cf675e236692fd9971eec62c4d92576a4e5f3`. Its
`release:check`, inventory, manifest validation, and roadmap commands passed,
and it passes `pnpm release:evidence:verify -- --require-success` when checked
out at that commit. It records current governance/process readiness only; it
does not verify registry provenance or permit `latest` promotion by itself.

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
