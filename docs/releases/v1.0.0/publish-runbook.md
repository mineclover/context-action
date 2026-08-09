# v1.0.0 Publish and Recovery Runbook

**Status:** `prepared — execution requires release approval`  
**Roadmap revision:** `v1-r2`

## Existing v1.0.0 registry cohort

`@context-action/core@1.0.0`, `@context-action/react@1.0.0`,
`@context-action/tool-protocol@1.0.0`, and `@context-action/webmcp@0.1.0`
are already published under `next`. They were published before this protected
authorization workflow existed and are immutable. Their current state is
`published-unapproved`: npm cryptographically verified the registry signatures
and SLSA provenance for all four packages, but the independent audit and
release approvals are still missing. Do not invoke the stable-candidate
workflow again for these versions. Complete the remaining audit and approvals,
then use the guarded promotion workflow or publish a corrected patch.

1. Confirm G0–G9, a clean strict evidence manifest, and exact tarball hashes
   for the approved release commit. Record the accepted pre-publication audit
   and move `release-manifest.json` to `candidate-approved-for-publish` before
   invoking `Publish V1 Stable Candidate`.

   ```bash
   pnpm release:evidence:write -- \
     --release context-action-v1.0.0 \
     --stage v1.0.0-<release-sha>-prepublication \
     --require-clean \
     --command release-check='pnpm release:check' \
     --command inventory='pnpm release:inventory' \
     --command manifest='pnpm verify:v1-release-manifest' \
     --artifact docs/releases/v1.0.0/release-manifest.json
   pnpm release:evidence:verify -- \
     --file release-evidence/v1.0.0-<release-sha>-prepublication/manifest.json \
     --require-success
   ```

   Strict verification rejects a dirty source tree and an evidence commit that
   does not match the checkout being verified.
   The release gate also runs `pnpm verify:v1-release-workflows`, which binds
   both workflows to their exact SHA roles, the complete cohort, `npm-stable`,
   main-branch ancestry, authorization-before-mutation ordering, and the
   required post-publish consumer checks.
2. The promotion workflow receives the provenance-attested published-artifact
   source commit, but checks out the current protected `main` governance
   commit that contains the verifier and approval records. It rejects a
   manifest, artifact source, audit record, or governance checkout that does
   not match its declared role.
   Repository administrators must configure `npm-stable` with the required
   reviewers; selecting an environment in workflow YAML alone cannot create
   that repository-level protection.
3. Publish the approved candidate to `next`, then capture the registry
   evidence artifact. Run `pnpm verify:v1-published-provenance` to verify each
   registry signature and provenance attestation before copying its integrity,
   SHA-256, tags, consumer result, and immutable commit into
   `release-manifest.json` as `published-unapproved`.
4. Publish only the approved packages to `next` or `rc` with npm provenance
   enabled by the GitHub Actions `id-token: write` permission.
5. In a clean external consumer, install the published versions and run CJS,
   ESM, NodeNext declaration checks, React 18/19 SSR, and representative
   runtime smoke tests.
6. Obtain the independent published-artifact audit. Only then move the manifest
   through `audited` and `approved-for-stable`.
7. Invoke the dedicated `Promote V1 to Latest` workflow only after that
   external smoke and approval succeed. It promotes the manifest's complete
   cohort in dependency order, reruns the `latest` consumer matrix, and uploads
   promotion evidence. Before changing a tag it records each package's prior
   `latest` value; if a promotion command fails, it restores tags already
   changed in that run. This is compensating recovery rather than a
   cross-package npm transaction, so operators must still inspect the uploaded
   evidence after a failed run. Commit the resulting verified tags and
   `promoted` manifest state before declaring the release complete.

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
