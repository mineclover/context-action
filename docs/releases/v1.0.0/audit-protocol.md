# v1.0.0 Optional Release-Review Protocol

**Status:** `completed owner self-review — supplemental`
**Roadmap revision:** `v1-r3`

The release owner may perform this review when additional confidence is useful. Inspect the
provenance-attested artifact source commit
`63f790a521e3428a7a2825677747338f8f05ccf3`, install the exact packages from
npm's `latest` tag in a fresh consumer, verify the registry provenance evidence
and the separate strict governance-evidence manifest, and record findings in
`audit-report.md`. The published artifact source and the later governance
evidence commit are intentionally distinct: the latter validates release
controls and does not rewrite immutable tarballs. A passing development
manifest or a local tarball smoke is not a substitute for this review.

| Required replay | Existing regression entry point | Reviewer result |
| --- | --- | --- |
| Cross-role guard replacement | `execution-result-metrics.test.ts` — cross-role replacement | passed in repository CI |
| Guard filter bypass attempt | `execution-result-metrics.test.ts` — dispatch filters | passed in repository CI |
| Concurrent `once` invocation | `execution-result-metrics.test.ts` — once guards/results/observers | passed in repository CI |
| Retry vs. race loser overlap | `execution-result-metrics.test.ts` — retry drain and barrier | passed in repository CI |
| Result aggregation failure | `pnpm test:core` aggregate-result coverage | passed in repository CI |
| Observer mutation/non-settlement | `pnpm test:core` observer isolation coverage | passed in repository CI |
| Strict Mode replay and unmount drain | `ToolContext.test.tsx`, `createActionContext.test.tsx` | passed in repository CI |
| WebMCP recreation/idempotency collision | `webmcp-tool-scope.test.ts`, `ToolContext.test.tsx` | passed in repository CI |
| Published minimal consumer | exact-version `latest` consumer matrix | passed in promotion run `31347327623` |

The auditor must also inspect the API diff, generated docs, registry tarball
hashes, provenance source commit, candidate manifest, migration guide, security
report, and external-consumer results. The recorded npm CLI provenance check is
`release-evidence/v1.0.0-63f790a5-registry-provenance-1/manifest.json`; rerun
`pnpm verify:v1-published-provenance` rather than trusting its summary alone.
Any P0/P1 finding reopens the affected gate. A completed review can be recorded
in [audit-report.md](./audit-report.md), but it is supplemental evidence: the
manifest and promotion workflow do not require a second reviewer, GitHub review
ID, or independent-auditor identity.
