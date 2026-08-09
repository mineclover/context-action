# v1.0.0 Release Scope and Public-Contract Approval

**Status:** `not approved`
**Release owner:** `unassigned`
**Reviewed artifact source commit:** `63f790a521e3428a7a2825677747338f8f05ccf3`

This record is completed by the named release owner after deciding G0 and G1.
It is not an implementation self-review, does not accept the independent audit,
and does not authorize a dist-tag change by itself.

## Decisions required

- Approve the package/subpath classifications and version map in
  [scope.md](./scope.md).
- Approve or reject every public behavior in
  [contract-candidates.md](./contract-candidates.md).
- Approve the retention, deprecation, or removal outcome for every entry in
  [legacy-ledger.md](./legacy-ledger.md).
- Explicitly retain the current WebMCP policy: it is experimental, while React
  1.x owns compatibility for its declared `@context-action/webmcp` range.

## Acceptance procedure

1. Replace the status with `approved`, name the release owner, and record the
   approval date plus any scoped exceptions in this file.
2. Hash this record, `scope.md`, `contract-candidates.md`, and
   `legacy-ledger.md` with SHA-256.
3. Record those hashes, the owner, and the reviewed source commit in
   `release-manifest.json` under `releaseApproval`.

`verify:v1-release-manifest` and the promotion authorization verifier reject
`approved-for-stable` unless the acceptance record is bound to the provenance
source commit and all four hashed files still match.
