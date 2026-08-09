# v1.0.0 Contract Candidates

**Status:** `candidate — not approved for the 1.x promise`  
**Roadmap revision:** `v1-r2`

This registry makes the M1 implementation facts reviewable. It is not an ADR
and does not change the release verdict. An entry becomes a public contract
only after scope approval and the named gate evidence are recorded.

| Surface | Candidate behavior | Implementation evidence | Required gate evidence |
| --- | --- | --- | --- |
| Core handler roles | A handler ID cannot replace a different role; guards run before result handlers; observers run only after the terminal result. | `packages/core/src/ActionRegister.ts` | G1, G2, G3 |
| `once` handlers | The once claim is made before invocation, including concurrent dispatch. | `packages/core/src/ActionRegister.ts` | G2, G3 |
| Retry/lifecycle | A retry must abort and drain a race attempt before another attempt starts. | `packages/core/src/ActionRegister.ts` | G3 |
| ToolContext | `@context-action/react/tools` is the stable-candidate ToolContext boundary and must not export WebMCP APIs. | `packages/react/src/tools/index.ts` | G1, G4, G6 |
| React WebMCP hook | `@context-action/react/webmcp` is experimental, browser-only, and separately imported. | `packages/react/src/webmcp.ts` | G4, G5, G6 |
| WebMCP notifications | `afterExecute` is the only detached post-commit observer. | `packages/webmcp/src/index.ts` | G5 |

The package/subpath inventory produced by `pnpm release:inventory` is the
input for approving these candidates. Record its JSON output through
`pnpm release:evidence:write`; do not infer approval from this table.
