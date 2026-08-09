# v1.0.0 Publish and Recovery Runbook

**Status:** `prepared — execution requires release approval`  
**Roadmap revision:** `v1-r2`

1. Confirm G0–G9, the independent audit verdict, a clean strict evidence
   manifest, and exact tarball hashes for the approved RC commit.
2. Populate `release-manifest.json` with the immutable commit and exact package
   versions; validate it and tag the same commit.
3. Publish only the approved packages to `next` or `rc` with npm provenance
   enabled by the GitHub Actions `id-token: write` permission.
4. In a clean external consumer, install the published versions and run ESM,
   CJS, TypeScript, and representative runtime smoke tests.
5. Record registry version, dist-tag, provenance URL/result, tarball checksum,
   release commit, and consumer result in a new immutable evidence bundle.
6. Promote to `latest` only after external smoke and approval succeed; deploy
   the matching documentation.

## Recovery

Do not overwrite a published package. For a release defect, first stop
promotion, communicate the affected versions, publish a corrected patch or
deprecate the faulty version through npm with a replacement path, and preserve
all evidence. Monitor and triage release issues for 24–72 hours with a named
owner.
