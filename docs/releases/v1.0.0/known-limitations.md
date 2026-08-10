# v1.0.0 Known Limitations

**Status:** `owner-operated promoted release`
**Roadmap revision:** `v1-r3`

- `@context-action/react/webmcp` and `@context-action/webmcp` are experimental
  browser integrations. They are not part of the stable 1.x promise.
- WebMCP returns an inert unsupported scope outside a supported browser
  environment. Applications must not treat it as a server-side tool runtime.
- `afterExecute` notifications are deliberately detached from the canonical
  tool result. They are not a transaction hook and cannot veto or rewrite a
  completed execution.
- The development evidence bundles were generated from a dirty working tree.
  They demonstrate reproducibility but cannot certify an RC or final artifact.
- The promoted `latest` consumer matrix and npm registry provenance verification
  have passed. The single-maintainer policy does not impose an unavailable
  independent-auditor gate; future promotions remain protected by automated
  checks.
- The immutable `@context-action/tool-protocol@1.0.0` artifact bundles a
  `CHANGELOG.md` whose newest entry is `0.8.9`; it cannot be repaired in
  place. Protected packaging-only patch `@context-action/tool-protocol@1.0.1`
  resolved the distribution-facing issue, owns `latest`, preserves
  `next=1.0.0` and `rc=1.0.0-rc.0`, and changes no runtime API or declaration
  contract. Its exact-version consumer and npm attestation provenance evidence
  are recorded at
  `release-evidence/tool-protocol-changelog-patch-1.0.1-31349046893/`.
- The accidental WebMCP RC `latest` tag has been replaced by the protected
  `@context-action/webmcp@0.1.1` hygiene patch. Run `31341251251` recorded
  `latest=0.1.1`, `next=0.1.0`, `rc=0.1.0-rc.0`, and a passing external
  consumer check. Direct tag deletion is intentionally not used: it failed
  under OIDC (`E401`) and the configured automation token (`E403` in run
  `31328975435`). WebMCP remains experimental and is excluded from the v1
  stable-promotion target set.
- The immutable `@context-action/webmcp@0.1.1` tarball starts its bundled
  `CHANGELOG.md` at `0.1.0`. Protected maintenance run `31364068737`
  published `@context-action/webmcp@0.1.2` to `latest`, with the corrected
  bundled changelog and a passing reverse-dependency consumer matrix. The
  affected `0.1.1` archive remains immutable historical evidence.

Report any newly discovered P0/P1 issue in the issue ledger and reopen the
affected gate before preparing a future stable patch or minor.
