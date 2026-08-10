# v1.0.0 SemVer and Deprecation Policy

**Status:** `documented — owner operated`
**Roadmap revision:** `v1-r2`

## Stable surfaces

For a documented `stable-1x` surface, a patch release may fix behavior without
changing its documented contract; a minor release may add backwards-compatible
APIs; and a major release is required to remove or change a documented public
API, type, runtime matrix, package subpath, or observable execution result.

Experimental surfaces are published separately and may change without the 1.x
stability promise. They must be explicitly labelled experimental and must not
be re-exported from a stable default entry point.

## Deprecation procedure

1. Classify the surface in the scope document and legacy ledger.
2. Provide a replacement import or API with a compiled migration example.
3. Mark the old surface deprecated in types and docs for at least one approved
   minor release, unless a security or correctness issue requires removal.
4. Record the intended removal version and user impact in release notes.
5. Remove it only in a major release, with a negative type/import fixture and
   packed-consumer verification.

The current v1 candidate exceptions are recorded in
[legacy-ledger.md](./legacy-ledger.md). `beforeExecute` and
`errorMode: 'result'` are removal candidates rather than hidden aliases;
`registerEffect`, `blocking`, and generic `register` are retained candidate
1.x contracts.

The documented stable surfaces become the public promise when the protected
workflow promotes them. No separate G0/G1 approver is required.
