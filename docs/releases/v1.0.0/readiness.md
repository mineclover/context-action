# v1.0.0 Release Readiness Report

**Verdict:** `NOT READY`  
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

`v1.0.0-414cf675-governance-prepublish-1` records a successful
`pnpm release:check`, release inventory, manifest validation, and roadmap
alignment check from clean commit `414cf675e236692fd9971eec62c4d92576a4e5f3`.
The bundle passes strict `--require-success` integrity verification at that
checkout. It verifies the current guarded workflow and release-process
configuration; it does not retroactively alter or certify the immutable npm
tarballs that were published before those controls existed.

## Published candidate state

The four-package cohort is already published to npm under `next` from
`63f790a521e3428a7a2825677747338f8f05ccf3`. The manifest records exact
integrity, tarball SHA-256, publish time, dist-tags, and an external consumer
matrix result. Its npm provenance bundles expose that source commit but remain
`pending-verification` until an independent verifier validates the Sigstore
attestations.

This publication predates the protected publish authorization gate. The final
versions are immutable; do not republish them to “repair” documentation or
metadata. A release defect requires a corrected patch version.

## Remaining release blockers

1. Independently verify the npm provenance bundle for every published package.
2. Obtain an independent adversarial audit of the exact `next` artifacts and
   recorded source commit.
3. Approve G0/G1 scope, public-contract, and legacy ledger decisions.
4. Freeze the current release governance/docs commit and record strict clean
   evidence for it; this documents the release process but does not alter the
   immutable published tarballs.
5. Only then move the manifest through `published-unapproved`, `audited`, and
   `approved-for-stable` before the guarded `latest` promotion.

No status in this report authorizes a release to `latest`.
