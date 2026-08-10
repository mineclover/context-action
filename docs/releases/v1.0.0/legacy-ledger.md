# v1.0.0 Legacy Outcome Ledger

**Status:** `candidate decisions — owner operated`
**Roadmap revision:** `v1-r2`

Every compatibility surface below has a named owner and a required outcome.
Until the outcomes are approved, this ledger intentionally keeps the release
status at `NOT READY`.

| ID | Surface | Current replacement | Required 1.x decision | Evidence still required |
| --- | --- | --- | --- | --- |
| CA-1X-LEGACY-001 | `ActionRegister.registerEffect()` | `registerGuard()` or `registerObserver()` | **candidate retain-1x:** documented dynamic-role convenience API; `effectKind` remains mandatory | `verify:v1-core-migration`; Core type/runtime coverage |
| CA-1X-LEGACY-002 | `HandlerConfig.blocking` | explicit `scheduling` and `errorPolicy` | **candidate retain-1x:** exact normalization in `resolveHandlerConfig()` through 1.x | `verify:v1-core-migration`; Core parity coverage |
| CA-1X-LEGACY-003 | generic `register()` role | `registerGuard`, `registerResult`, or `registerObserver` when a specific phase is intended | **candidate retain-1x:** generic result registration as the default handler API | `verify:v1-core-migration`; public type snapshot |
| CA-1X-LEGACY-004 | WebMCP `beforeExecute` | `afterExecute` | **candidate remove:** deprecated post-commit alias is removed | WebMCP/React negative type test and adapter regression |
| CA-1X-LEGACY-005 | WebMCP `errorMode: 'result'` | `errorMode: 'structured'` | **candidate remove:** ambiguous alias is removed | `webmcp-error-mode.type-safety.test.ts`, package/export consumer evidence |
| CA-1X-WEBMCP-001 | WebMCP React hook on `@context-action/react/tools` | `@context-action/react/webmcp` | **candidate experimental:** isolated experimental subpath | `verify:react-webmcp-isolation`, package/export consumer evidence |
| CA-1X-LEGACY-006 | internal void executor | canonical result dispatch path | **candidate remove:** unused `_performDispatch()` is removed; `dispatch()` delegates to `_performDispatchWithResult()` | Core focused regression evidence |

No row may be silently removed. When a decision is made, replace
`decision-needed` with `remove`, `retain-1x`, or `experimental`, state the
owner and target version, and link the immutable evidence manifest entry.
