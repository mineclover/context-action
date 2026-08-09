# v1.0.0 Publish and Recovery Runbook

**Status:** `prepared — execution requires release approval`  
**Roadmap revision:** `v1-r2`

1. Confirm G0–G9, the independent audit verdict, a clean strict evidence
   manifest, and exact tarball hashes for the approved RC commit.
2. Publish the approved RC to `next` or `rc`, then capture the registry
   evidence artifact. Verify each npm provenance attestation's source commit
   before copying its integrity, SHA-256, tags, consumer result, and immutable
   commit into `release-manifest.json` as `published-unapproved`.
3. Publish only the approved packages to `next` or `rc` with npm provenance
   enabled by the GitHub Actions `id-token: write` permission.
4. In a clean external consumer, install the published versions and run CJS,
   ESM, NodeNext declaration checks, React 18/19 SSR, and representative
   runtime smoke tests.
5. Obtain the independent published-artifact audit. Only then move the manifest
   through `audited` and `approved-for-stable`.
6. Publish the final stable versions to `next` first. Promote dependency
   packages and React last to `latest` only after that external smoke and
   approval succeed; deploy the matching documentation.

## v1 RC prerelease

The approved v1 RC package set is `@context-action/core`,
`@context-action/react`, `@context-action/tool-protocol`, and
`@context-action/webmcp`. Publish it only through
`Publish Prerelease` (`.github/workflows/publish-prerelease.yml`) using the
`rc` or `next` dist-tag. That workflow rejects non-prerelease versions,
publishes only this four-package set, and installs the exact dist-tagged
versions in an isolated consumer before completing.

It must not be replaced with the general `Publish Packages` workflow: its
scope is intended for regular releases. Both workflows publish to `next`; a
separate, approved dist-tag promotion is required to change `latest`.

The prerelease workflow produces three evidence files: the publish summary,
the prerelease dist-tag matrix (which rejects an RC pointing at `latest`), and
the registry evidence containing npm integrity, tarball SHA-256, timestamp,
tags, and consumer-matrix result. The registry capture deliberately does not
claim provenance verification: an operator must verify the npm attestation and
record its source commit before the manifest can leave candidate status.

## Recovery

Do not overwrite a published package. For a release defect, first stop
promotion, communicate the affected versions, publish a corrected patch or
deprecate the faulty version through npm with a replacement path, and preserve
all evidence. Monitor and triage release issues for 24–72 hours with a named
owner.
