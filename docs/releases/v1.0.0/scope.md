# v1.0.0 Scope and Versioning

**Status:** `promoted — owner operated`
**Roadmap revision:** `v1-r3`

This document is the decision record for G0. It does not itself mutate a
package version or npm tag. Generate the current package and subpath input with
`pnpm release:inventory`; retain that inventory in clean release evidence when
preparing a future stable patch or minor.

The v1.0.0 cohort was published before the protected authorization gate was
introduced, then promoted through the protected workflow after provenance,
consumer, rollback, hygiene, and governance checks passed. The release
manifest and promotion artifact record the resulting stable tags.

## Promoted scope

| Class | Packages and surfaces | 1.x promise |
| --- | --- | --- |
| `stable-1x` | `@context-action/core`; the default React action/store entry points | SemVer-governed public contract |
| `supporting-stable` | `@context-action/tool-protocol` and its declared public subpaths | Compatible with the stable packages' supported matrix |
| `tested-external-dependency` | `@context-action/mutative@0.8.8` and `@context-action/tool-durable-operations@0.1.1` | React 1.0.0 declares the recorded ranges and the release manifest records the exact consumer-tested versions; these packages are not part of the v1 stable-surface promise |
| `out-of-cohort integration` | `@context-action/ai-sdk` | Not a React 1.0.0 runtime dependency and not certified as part of the v1 publish cohort |
| `experimental` | `@context-action/webmcp` and `@context-action/react/webmcp` | Publicly importable, but excluded from the 1.x stability promise |

`@context-action/react/tools` remains the stable ToolContext entry.
It must not re-export experimental WebMCP APIs.

React 1.0.0 keeps `@context-action/webmcp@^0.1.0` as a direct runtime
dependency so the existing `@context-action/react/webmcp` integration remains
installable. This does not promote WebMCP to the React 1.x public-contract
promise: its API remains experimental and the React release owner owns the
compatibility of that declared dependency range.

The release manifest is also the source of truth for React's direct runtime
dependencies outside the publish cohort. A manifest update must record their
declared support range and exact tested version before release authorization.

## Owner checklist

- Keep the package/subpath classification current.
- Keep the target version map and release order current, including unpublished
  internal dependency versions.
- Record a clean, immutable G0 evidence manifest with the inventory and final
  package metadata before each future stable promotion.
- Do not publish or retag `latest` outside the protected workflow. It rechecks
  provenance, stable-surface consumers, rollback eligibility, and evidence.
