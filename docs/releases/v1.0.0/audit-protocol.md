# v1.0.0 Independent Audit Protocol

**Status:** `prepared — not yet independently executed`  
**Roadmap revision:** `v1-r2`

The reviewer must be independent from the RC implementation work. Start from a
clean checkout of the RC commit, verify the strict evidence manifest, and
record findings in `audit-report.md`. A passing development manifest is not a
substitute for this review.

| Required replay | Existing regression entry point | Reviewer result |
| --- | --- | --- |
| Cross-role guard replacement | `execution-result-metrics.test.ts` — cross-role replacement | pending |
| Guard filter bypass attempt | `execution-result-metrics.test.ts` — dispatch filters | pending |
| Concurrent `once` invocation | `execution-result-metrics.test.ts` — once guards/results/observers | pending |
| Retry vs. race loser overlap | `execution-result-metrics.test.ts` — retry drain and barrier | pending |
| Result aggregation failure | `pnpm test:core` aggregate-result coverage | pending |
| Observer mutation/non-settlement | `pnpm test:core` observer isolation coverage | pending |
| Strict Mode replay and unmount drain | `ToolContext.test.tsx`, `createActionContext.test.tsx` | pending |
| WebMCP recreation/idempotency collision | `webmcp-tool-scope.test.ts`, `ToolContext.test.tsx` | pending |
| Packed minimal consumer | `pnpm verify:local-tool-consumers` and `pnpm verify:v1-core-migration` | pending |

The auditor must also inspect the API diff, generated docs, tarball hashes,
candidate manifest, migration guide, security report, and external-consumer
results. Any P0/P1 finding reopens the affected gate; only the auditor may set
the audit result to accepted.
