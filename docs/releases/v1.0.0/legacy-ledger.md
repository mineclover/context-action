# v1.0.0 Legacy Outcome Ledger

**Status:** `resolved for the promoted v1 stable scope`
**Roadmap revision:** `v1-r3`

Every compatibility surface below has a named owner and a recorded outcome.
The Core and stable React outcomes are part of the promoted v1 contract;
WebMCP outcomes remain explicitly experimental.

| ID | Surface | Current replacement | Required 1.x decision | Evidence still required |
| --- | --- | --- | --- | --- |
| CA-1X-LEGACY-001 | `ActionRegister.registerEffect()` | `registerGuard()` or `registerObserver()` | **retain-1x:** documented dynamic-role convenience API; `effectKind` remains mandatory | `verify:v1-core-migration`; Core type/runtime coverage |
| CA-1X-LEGACY-002 | `HandlerConfig.blocking` | explicit `scheduling` and `errorPolicy` | **retain-1x:** exact normalization in `resolveHandlerConfig()` through 1.x | `verify:v1-core-migration`; Core parity coverage |
| CA-1X-LEGACY-003 | generic `register()` role | `registerGuard`, `registerResult`, or `registerObserver` when a specific phase is intended | **retain-1x:** generic result registration as the default handler API | `verify:v1-core-migration`; public type snapshot |
| CA-1X-LEGACY-004 | WebMCP `beforeExecute` | `afterExecute` | **experimental remove:** deprecated post-commit alias is removed outside the stable v1 promise | WebMCP/React negative type test and adapter regression |
| CA-1X-LEGACY-005 | WebMCP `errorMode: 'result'` | `errorMode: 'structured'` | **experimental remove:** ambiguous alias is removed outside the stable v1 promise | `webmcp-error-mode.type-safety.test.ts`, package/export consumer evidence |
| CA-1X-WEBMCP-001 | WebMCP React hook on `@context-action/react/tools` | `@context-action/react/webmcp` | **experimental:** isolated experimental subpath | `verify:react-webmcp-isolation`, package/export consumer evidence |
| CA-1X-LEGACY-006 | internal void executor | canonical result dispatch path | **remove:** unused `_performDispatch()` is removed; `dispatch()` delegates to `_performDispatchWithResult()` | Core focused regression evidence |

No row may be silently removed. A future change must state the owner and target
version, update this outcome, and link immutable evidence before expanding or
contracting a stable surface.
