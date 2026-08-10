# v1.0.0 Publish and Recovery Runbook

**Status:** `historical v1 execution; maintenance workflow active`
**Roadmap revision:** `v1-r3`

## Current maintenance

Do not rerun an archived v1 publication, hygiene, or promotion workflow. A new
Tool Protocol or WebMCP patch must use `Publish Package Maintenance Patch`.
It accepts only a new immutable `main` commit, validates the source and packed
changelog, publishes one versioned package to `latest`, and then installs the
complete reverse-dependency closure (`core`, `react`, `tool-protocol`, and
`webmcp`) in CJS, ESM, NodeNext, and React 18/19 SSR consumers.

After a successful run, record its evidence hash under `postReleasePatches`
and refresh `currentRegistryState` in `release-manifest.json`. Do not edit the
historical `artifactCohort` to describe a later package patch.

`@context-action/webmcp@0.1.2` is the prepared packaging correction for the
immutable `0.1.1` bundled Changelog. It is not part of `currentRegistryState`
until the protected workflow publishes it and the captured registry evidence is
committed.

## Historical v1.0.0 registry cohort

`@context-action/core@1.0.0`, `@context-action/react@1.0.0`,
`@context-action/tool-protocol@1.0.0`, and `@context-action/webmcp@0.1.0`
are already published under `next`. They were published before this protected
authorization workflow existed and are immutable. They were later promoted and
are retained here as historical release evidence. Do not invoke the
stable-candidate workflow again for these versions.

The accidental `@context-action/webmcp@0.1.0-rc.0` `latest` tag was corrected
by publishing `@context-action/webmcp@0.1.1` through an archived one-off
workflow, not by deleting a dist-tag. That workflow verified that `latest` is
`0.1.1`, preserves the existing `next`/`rc` records for `0.1.0`, and uploads
registry and consumer evidence. Do not run a broad dist-tag command from a
local shell. Publication run `31340779674` completed the versioned publish;
evidence run `31341251251` then passed the idempotent tag check and stored the
captured evidence at
`release-evidence/webmcp-hygiene-patch-0.1.1-31341251251/registry-evidence.json`.

The existing `0.1.0` WebMCP record remains immutable evidence for the published
`next` cohort. The separately published `0.1.1` hygiene patch owns WebMCP
`latest`; because WebMCP is experimental, it is intentionally excluded from
the v1 stable-promotion target set.

## Historical v1 execution record (do not rerun)

1. Confirm the documented scope, a clean strict evidence manifest, and exact
   tarball hashes for the owner-selected release commit. Move
   `release-manifest.json` to `candidate-approved-for-publish` before invoking
   `Publish V1 Stable Candidate`; no independent audit or second-party approval
   record is required.

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
   does not match the checkout being verified. The stable publish authorization
   binds the checked-out release commit.
   The release gate also runs `pnpm verify:v1-release-workflows`, which binds
   both workflows to their exact SHA roles, the complete cohort, `npm-stable`,
   main-branch ancestry, authorization-before-mutation ordering, and the
   required post-publish consumer checks.
2. The promotion workflow receives the provenance-attested published-artifact
   source commit, but checks out the current protected `main` governance
   commit that contains the verifier and governance records. It rejects a
   manifest, artifact source, or governance checkout that does not match its
   declared role. Before `approved-for-stable`, record
   `promotionGovernance`: a clean strict evidence manifest (and its SHA-256),
   the evidence commit, and the SHA-256 fingerprint of the promotion workflow,
   package-script entry points, and its authorization/provenance/manifest
   verifiers. The checkout may contain later documentation, but a changed
   governed file changes the fingerprint and blocks promotion until fresh
   evidence is made.
   Repository administrators must configure `npm-stable` with the required
   reviewers; selecting an environment in workflow YAML alone cannot create
   that repository-level protection.
3. Publish the owner-selected candidate to `next`, then capture the registry
   evidence artifact. Run `pnpm verify:v1-published-provenance` to verify each
   registry signature and provenance attestation before copying its integrity,
   SHA-256, tags, consumer result, and immutable commit into
   `release-manifest.json` as `published-unapproved`. The promotion workflow
   independently re-downloads every pinned tarball, compares its integrity and
   SHA-256 with the recorded evidence, and verifies that the live `next` tag
   still resolves to the approved version before any `latest` tag changes.
4. Publish only the documented packages to `next` or `rc` with npm provenance
   enabled by the GitHub Actions `id-token: write` permission.
5. In a clean external consumer, install the published versions and run CJS,
   ESM, NodeNext declaration checks, React 18/19 SSR, and representative
   runtime smoke tests.
6. Move the manifest to `approved-for-stable` after the required automated
   evidence is recorded. An optional owner self-review may be retained as
   history, but is not a gate.
7. The dedicated v1 promotion workflow promoted only the
   stable-surface targets in dependency order, reruns the `latest` consumer matrix, and uploads
   promotion evidence. Before changing a tag it records each package's prior
   `latest` value; if a promotion command or the required `latest` consumer
   matrix fails, it restores tags already changed in that run. This is
   compensating recovery rather than a
   cross-package npm transaction, so operators must still inspect the uploaded
   evidence after a failed run. The registry-evidence capture is deliberately
   outside rollback: if it has a transient failure after the `latest` consumer
   matrix passes, the workflow reports **promotion evidence pending** and the
   operator must first set the manifest to `promotion-evidence-pending` with
   the workflow-run URL/ID and timestamp. After recapturing and verifying
   evidence, set `promotionEvidence.status` to `captured`, then advance the
   manifest to `promoted`. Commit the resulting verified tags and manifest
   state before declaring the release complete.

## Tag and evidence retention policy

The `v1.0.0` Git tag must point to the provenance-attested artifact source
commit `63f790a521e3428a7a2825677747338f8f05ccf3`, not to the later governance
or approval-record commit. The manifest's `promotionGovernance` record binds
those later controls separately through the clean evidence hash and governed
file fingerprint.

Keep Git evidence compact: the committed bundle should contain the evidence
manifest, SHA-256 values, and a short canonical summary. The one current strict
governance bundle retains its full `release:check` log because it establishes
the new evidence format; subsequent refreshes should upload full command logs,
lockfile snapshots, and tarballs as GitHub Actions artifacts or release assets
with their retention period recorded in the summary. Do not add another large
lockfile/log snapshot to Git merely to refresh a status record.

## Single-maintainer environment operation

The 2026-08-10 protected hygiene rehearsal confirmed that the
owner-authorized self-review exception can approve the environment. The first
run (`31328409822`) failed with `E401` under OIDC-only credentials; the
token-gated retry (`31328975435`) authenticated successfully but failed with
`E403` because that token lacks WebMCP dist-tag management permission. Neither
run made a registry mutation. `npm-stable` permits the documented owner
self-review exception while retaining main-only deployment, provenance, and
rollback safeguards. Separate dispatcher/reviewer identities are not required.

## v1 RC prerelease

The approved v1 RC package set is `@context-action/core`,
`@context-action/react`, `@context-action/tool-protocol`, and
`@context-action/webmcp`. Publish it only through
`Publish Prerelease` (`.github/workflows/publish-prerelease.yml`) using the
`rc` or `next` dist-tag. That workflow rejects non-prerelease versions,
publishes only this four-package set, and installs the exact dist-tagged
versions in an isolated consumer before completing.

It must not be replaced with the general `Publish Packages` workflow: that
workflow uses a fixed allow-list of non-v1 packages, so none of the four cohort
package names can be published, retagged, or version-claimed by that path. Both
workflow publishes only to `next`; the archived protected v1 promotion changed
`latest` for the completed release. Future versioned patches use the maintenance
workflow described above.

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
