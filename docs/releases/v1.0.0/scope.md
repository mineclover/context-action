# v1.0.0 Scope and Versioning Candidates

**Status:** `candidate — approval required`  
**Roadmap revision:** `v1-r2`

This document is the decision record for G0. It does not authorize publishing
or change any package version. Generate the current package and subpath input
with `pnpm release:inventory`; record the resulting JSON in a clean RC
evidence bundle before approval.

## Candidate scope

| Class | Candidate packages and surfaces | 1.x promise |
| --- | --- | --- |
| `stable-1x` | `@context-action/core`; the default React action/store entry points | SemVer-governed public contract |
| `supporting-stable` | Tool Protocol, AI SDK, durable operations, mutative packages, and their declared public subpaths | Compatible with the stable packages' supported matrix |
| `experimental` | `@context-action/webmcp` and `@context-action/react/webmcp` | Publicly importable, but excluded from the 1.x stability promise |

`@context-action/react/tools` remains the stable-candidate ToolContext entry.
It must not re-export experimental WebMCP APIs.

React 1.0.0 keeps `@context-action/webmcp@^0.1.0` as a direct runtime
dependency so the existing `@context-action/react/webmcp` integration remains
installable. This does not promote WebMCP to the React 1.x public-contract
promise: its API remains experimental and the React release owner owns the
compatibility of that declared dependency range.

## Approval checklist

- Name the release owner and approve the package/subpath classification.
- Approve the target version map and release order, including unpublished
  internal dependency versions.
- Record a clean, immutable G0 evidence manifest with the inventory and the
  final package metadata.
- Do not publish `latest` until G1–G9 have their required evidence and the
  independent audit has signed off.
