# v1.0.0 Contract Candidates

**Status:** `promoted stable contracts; experimental entries retained`
**Roadmap revision:** `v1-r2`

This registry makes the M1 implementation facts reviewable. For the documented
stable surfaces, the protected v1 promotion makes these entries part of the
1.x public contract. WebMCP entries remain experimental and are not included in
that promise.

| Surface | Candidate behavior | Implementation evidence | Required gate evidence |
| --- | --- | --- | --- |
| Core handler roles | A handler ID cannot replace a different role; guards run before result handlers; observers run only after the terminal result. | `packages/core/src/ActionRegister.ts` | promoted Core provenance plus lifecycle and migration checks |
| `once` handlers | The once claim is made before invocation, including concurrent dispatch. | `packages/core/src/ActionRegister.ts` | promoted Core provenance plus lifecycle checks |
| Retry/lifecycle | A retry must abort and drain a race attempt before another attempt starts. | `packages/core/src/ActionRegister.ts` | `verify:v1-lifecycle` and clean governance evidence |
| ToolContext | `@context-action/react/tools` is the stable ToolContext boundary and must not export WebMCP APIs. | `packages/react/src/tools/index.ts` | promoted React consumer matrix and `verify:react-webmcp-isolation` |
| React WebMCP hook | `@context-action/react/webmcp` is experimental, browser-only, and separately imported. | `packages/react/src/webmcp.ts` | export/isolation checks; excluded from stable promotion targets |
| WebMCP notifications | `afterExecute` is the only detached post-commit observer. | `packages/webmcp/src/index.ts` | experimental adapter regression coverage; not a v1 stable contract |

The package/subpath inventory produced by `pnpm release:inventory` remains the
input for future contract changes. Record its JSON output through
`pnpm release:evidence:write`; a table edit alone never changes an npm tag or
expands the stable surface.
