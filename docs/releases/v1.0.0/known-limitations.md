# v1.0.0 Candidate Known Limitations

**Status:** `candidate — not release-certified`  
**Roadmap revision:** `v1-r2`

- `@context-action/react/webmcp` and `@context-action/webmcp` are experimental
  browser integrations. They are not part of the stable 1.x promise.
- WebMCP returns an inert unsupported scope outside a supported browser
  environment. Applications must not treat it as a server-side tool runtime.
- `afterExecute` notifications are deliberately detached from the canonical
  tool result. They are not a transaction hook and cannot veto or rewrite a
  completed execution.
- The development evidence bundles were generated from a dirty working tree.
  They demonstrate reproducibility but cannot certify an RC or final artifact.
- The published `next` consumer matrix and npm registry provenance verification
  have passed, but the independent published-artifact audit has not yet been
  performed. The release verdict therefore remains `NOT READY`.
- `@context-action/tool-protocol@1.0.0` bundles a `CHANGELOG.md` whose newest
  entry is `0.8.9`. The immutable artifact cannot be repaired in place; the
  canonical v1.0.0 notes are this release document set and the GitHub release.
  Runtime and declaration artifacts are unaffected. A stricter artifact-docs
  policy requires a corrected patch cohort rather than silent promotion.
- The accidental WebMCP RC `latest` tag remains until the protected
  `@context-action/webmcp@0.1.1` hygiene patch is published. Direct tag deletion
  is intentionally not used: it failed under OIDC (`E401`) and the configured
  automation token (`E403` in run `31328975435`). The v1 candidate then needs a
  WebMCP provenance and audit re-baseline before any stable promotion.

Report any newly discovered P0/P1 issue in the issue ledger and reopen the
affected gate before approving an RC.
