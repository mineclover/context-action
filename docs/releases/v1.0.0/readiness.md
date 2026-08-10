# v1.0.0 Release Readiness Report

**Verdict:** `OWNER-OPERATED — promotion not yet dispatched`
**Roadmap revision:** `v1-r2`

This report links the current implementation work to the release gates. The
authoritative operational status is [status.md](./status.md).
The recorded package topology and registry state are in
[release-manifest.json](./release-manifest.json); it is deliberately not a
publish or promotion authorization.

## Recorded development checks

The development bundles `v1.0.0-dev-m0`, `v1.0.0-dev-m3`,
`v1.0.0-dev-m4-m5`, `v1.0.0-dev-g9`, and `v1.0.0-dev-full` record successful
local checks for:

- candidate manifest and package/subpath inventory;
- Core lifecycle report, focused lifecycle suite, and complete Core suite;
- packed React 18.3.1 and 19.2.8 type/SSR consumers;
- ten package tarball publication contracts and local tool-consumer imports;
- Tool Protocol tests, AI SDK runtime integration, WebMCP tests and isolation;
- the packed Core migration fixture; and
- an OSV audit with no actionable findings.

The development manifests were intentionally recorded from dirty working trees.
They pass integrity verification but are not strict release evidence.

## Clean pre-RC verification

`v1.0.0-clean-precheck-1` records a successful `pnpm verify:all` and roadmap
alignment check from a clean source checkout of
`13086d07a6d70a06d27c3af0ec9f18767b00f1ad`. The manifest passes strict
`--require-success` integrity verification. This narrows the remaining work to
release governance and external validation; it is not an approved RC or a
publication authorization.

## Historical clean pre-approval verification

`v1.0.0-rc.0-preapproval-1` records successful `pnpm release:check`,
`pnpm release:inventory`, candidate-manifest validation, and roadmap-alignment
validation from clean commit `05a57d526cad64bad78526fededa9df567840fe1`. Its
evidence manifest passes strict `--require-success` verification from that
checkout. It is historical evidence, not an approved RC artifact or a
publication authorization, because the release workflow, manifest, and
documentation changed after the recorded commit.

## Current clean governance verification

`v1.0.0-eef7af18-governance-prepublish-1` records a successful full
`pnpm release:check` (209677 ms), release inventory, manifest validation,
workflow-contract validation, roadmap alignment, and governed-file fingerprint
from clean commit `eef7af18639dc2431e95e2f68b4489bb368a2c16`. Its manifest
SHA-256 and fingerprint are recorded in `release-manifest.json`, and it passes
strict `--require-success` verification at that checkout. It verifies the
guarded workflow and release-process configuration; it does not retroactively
alter or certify the immutable npm tarballs published before those controls.

The 2026-08-10 WebMCP tag-hygiene rehearsals showed that `dist-tag rm` is not
an authorized recovery mechanism. The protected `0.1.1` hygiene patch was
published instead, and workflow run `31341251251` subsequently captured its
converged tags and passing external-consumer result in
`release-evidence/webmcp-hygiene-patch-0.1.1-31341251251/registry-evidence.json`.
This clears registry tag hygiene. WebMCP remains experimental and is excluded
from the v1 stable-promotion target set.

## Published candidate state

The four-package cohort is already published to npm under `next` from
`63f790a521e3428a7a2825677747338f8f05ccf3`. The manifest records exact
integrity, tarball SHA-256, publish time, dist-tags, and an external consumer
matrix result. Its npm provenance bundles expose that source commit but remain
verified by the official npm CLI against the registry signatures and Sigstore
SLSA attestations. The verifier confirmed the source commit, repository,
workflow, and workflow run for all four packages; its compact evidence is in
`release-evidence/v1.0.0-63f790a5-registry-provenance-1/manifest.json`.

This publication predates the protected publish authorization gate. The final
versions are immutable; do not republish them to “repair” documentation or
metadata. A release defect requires a corrected patch version.

## Remaining release blockers

1. Generate and record strict evidence for the final governance commit and
   promotion-governance fingerprint; this documents the release process but
   does not alter the immutable published tarballs.
2. When the owner elects to ship, move the manifest to `approved-for-stable`
   and run the guarded `latest` promotion. The workflow performs provenance,
   stable-consumer, rollback, and evidence checks without a second reviewer.

No document alone authorizes a release to `latest`; the protected workflow is
the only path that can mutate stable tags.
