# Context-Action v1.0 Release Roadmap

**Status:** Draft — living release plan<br>
**Release principle:** v1.0.0 is a contract freeze, not a version-number change.

## 1. Outcome and planning rule

The v1.0.0 release is ready only when Context-Action can make, and keep
through the 1.x line, this promise:

> Its public API, runtime semantics, lifecycle behavior, and package
> compatibility are documented, mutually consistent, and demonstrated with
> reproducible consumer-facing evidence.

This roadmap is the single delivery plan for work that is required to reach
that state. It deliberately includes legacy removal, contract decisions,
implementation hardening, package verification, documentation, and release
operations. A work item is not complete when code merges; it is complete only
when its contract, tests, consumer impact, and documentation are aligned.

### Non-negotiable ordering

Breaking cleanup belongs **before** the v1.0 API freeze. A deprecated or
legacy surface has only three allowed outcomes during the 0.9.x stabilization
line:

1. remove it before the freeze and publish a migration path;
2. retain it as a supported 1.x public contract; or
3. move it behind an explicitly experimental package or subpath.

Do not carry a temporary compatibility shim into v1.0 without treating it as
a 1.x maintenance obligation. New features, new adapters, broad refactors, and
unproven performance work stay outside this plan unless they are necessary to
clear a release gate.

## 2. How to operate this roadmap

Use this document as the release board. Maintain one issue per independently
verifiable concern and assign it to a milestone below. The release status is
the state of the evidence, not the count of merged pull requests.

| Work item state | Meaning | Required exit evidence |
| --- | --- | --- |
| `inventory` | Surface is discovered but not yet decided | owner, affected package and public surface |
| `decision-needed` | Contract or removal decision is open | ADR or approved contract entry |
| `in-progress` | Code or tests are changing | reproduction and intended acceptance test |
| `verified` | Implementation is complete | focused test/type/package evidence |
| `accepted-limitation` | Not fixed by design | impact, workaround, owner, review version |
| `blocked` | Cannot progress safely | explicit dependency and unblock condition |

Every issue must use this record:

```md
## CA-1X-<area>-<number>

- Severity: P0 | P1 | P2
- Milestone:
- Affected public contract:
- Current behavior and reproduction:
- Expected 1.0 contract:
- Chosen resolution:
- Compatibility and migration impact:
- Test / package / documentation evidence:
- Owner and status:
```

P0 and P1 are release blockers. A P2 may remain only as an
`accepted-limitation`; it must name the owner and review version. “Later” is
not a disposition.

## 3. Scope decision checkpoint

Before any public API is frozen, classify every publishable workspace package.
The repository currently uses Lerna independent versioning; retain that
strategy only if this checkpoint records an explicit target version and
dependency range for every participating package.

| Classification | Release meaning | Required proof |
| --- | --- | --- |
| `stable-1x` | A supported public contract for all of 1.x | API snapshot, SemVer policy, packed-consumer coverage |
| `supporting-stable` | Not necessarily a primary entry point, but compatibility affects stable packages | dependency and consumer matrix coverage |
| `experimental` | Public but excluded from the 1.x stability promise | explicit label, isolated import path, compatibility limits |
| `internal` | No external public contract | excluded from package and public-doc promises |

The classification decision must cover at least `@context-action/core`,
`@context-action/react`, `@context-action/tool-protocol`,
`@context-action/ai-sdk`, `@context-action/webmcp`,
`@context-action/tool-durable-operations`, `@context-action/mutative`, and
every other publishable package. Do not infer stability from an existing npm
package or from a documentation example.

## 4. Release train and milestones

The milestone labels are intentionally sequence-based, not date-based. Start
the next milestone only when the preceding exit criteria are met; record dates
and owners in the issue tracker rather than guessing them in this document.

### M0 — Baseline and release inventory

**Goal:** establish a factual starting point before changing behavior.

- Record HEAD SHA, Node, pnpm, TypeScript, React, package versions, and latest
  published versions.
- Generate an export and package-metadata snapshot for each publishable
  package; classify differences from the last published artifact as breaking,
  additive, deprecated, or accidental.
- Build a legacy inventory spanning exports, aliases, deprecated types,
  runtime branches, compatibility subpaths, examples, tests, docs, scripts,
  and package metadata.
- Build the P0/P1 risk register from the core, React, tool adapter, lifecycle,
  and consumer risks.
- Record the actual verification commands and their baseline result. Existing
  scripts such as `pnpm release:check`, package export/tarball checks, React
  compatibility checks, and tool-consumer checks are inputs, not assumed proof.

**Exit:** scope inventory and legacy inventory are reviewable; no legacy
surface is removed before its migration or retention decision is recorded.

### M1 — Contract decisions and removal design

**Goal:** decide the target contract before implementing or deleting it.

- Decide stable/experimental package classification, supported runtime matrix,
  ESM/CJS/SSR/browser support, package version topology, and 1.x deprecation
  policy.
- Freeze the intended Core semantics: role identity, cross-role ID collision
  behavior, `once`, guard admission, result aggregation, observer isolation,
  sequential/parallel/race ordering, retry barrier, outcomes, and immutable
  `ExecutionResult` invariants.
- Decide lifecycle ownership for abort, timeout, queued work, debounce, retry,
  detached observers, `destroyAsync()`, React unmount, and Strict Mode replay.
- Decide canonical Tool Protocol ordering and the supported AI SDK and WebMCP
  profiles. Keep experimental adapters off default stable entry points.
- For each legacy item, choose **remove**, **retain as 1.x contract**, or
  **isolate as experimental**. Define the replacement import and migration
  example before removal.

**Exit:** no implementation is relying on an unresolved public semantic or an
implicit compatibility promise.

### M2 — Legacy closure (0.9.x breaking-cleanup window)

**Goal:** remove obsolete public and internal paths while breaking changes are
still allowed.

Work through the M0 inventory by category:

| Category | Required work before API freeze |
| --- | --- |
| Exports and aliases | Remove obsolete exports/subpaths; add compile-time negative tests and replacement imports. |
| Registration APIs | Migrate generic legacy registration/effect APIs to role-specific guard, result, or observer APIs. |
| Runtime compatibility branches | Delete dead behavior rather than retaining silent fallbacks; preserve only a documented 1.x path. |
| Types | Remove misleading aliases, optionality, casts, and generics that overpromise runtime behavior. |
| Tool adapters | Separate legacy/current profiles and remove adapter-local policy or execution state machines. |
| Documentation and examples | Move historic material to migration/reference docs; remove active examples of deleted APIs. |
| Build and release graph | Remove old scripts, workspace dependencies, generated artifacts, and package references. |

For each removal, make the old import fail intentionally, compile the
replacement against a packed package where practical, add the migration entry,
and search the repository for stale references. Do not hide removals behind
undocumented re-exports.

**Exit:** the active source, test, example, docs, generated-doc, and release
graphs contain no unclassified legacy path. The remaining deprecated APIs are
an explicit 1.x support list, not a backlog.

### M3 — Core and lifecycle hardening

**Goal:** make the frozen Core behavior deterministic and safe under failure
and concurrency.

- Add direct regression and negative type tests for role replacement, guard
  filtering, guard fail-closed behavior, parity between dispatch APIs, handler
  result-map typing, and immutable return snapshots.
- Test deterministic ordering and diagnostics for sequential, parallel, and
  race execution. Ensure result aggregation cannot repeat handlers.
- Enforce an atomic `once` claim before invocation across every execution
  mode, including concurrent dispatch.
- Enforce retry abort-and-drain before another race attempt; test cancellation
  during queue wait, debounce, execution, backoff, and observer drain.
- Establish one `active → closing → destroyed` lifecycle model with exactly-once
  cleanup and consistent telemetry definitions.

**Exit:** all P0/P1 Core and lifecycle findings have focused regression tests;
`ExecutionResult` fields cannot contradict each other.

### M4 — React and adapter hardening

**Goal:** prove that integrations delegate the frozen Core contract rather than
reimplementing it.

- Verify Core config and result-map types reach React hooks without unsafe
  generic escape hatches.
- Test handler replacement, latest callback references, unmount cancellation,
  cleanup drain, Strict Mode replay, SSR import/snapshot behavior, and actual
  React 18/19 consumers.
- Verify the Tool Protocol canonical boundary: validation, policy,
  interaction/approval, idempotency, durable claim, execution, output
  validation, then canonical result.
- Verify AI SDK capability, approval, idempotency, output-schema, and runtime
  integration behavior.
- Verify WebMCP profile typing, immutable notification snapshots, cancellation,
  correlation IDs, SSR/unsupported-browser behavior, and experimental status.

**Exit:** P0/P1 integration findings are closed, or an adapter is explicitly
isolated as experimental and absent from stable default imports.

### M5 — Consumer and distribution certification

**Goal:** prove the release outside workspace resolution.

For every stable-1x and supporting-stable package, run:

```text
pack tarball
→ empty consumer install
→ ESM import and CJS require
→ tsc --noEmit
→ representative runtime smoke
→ minimum/exact dependency and peer matrix
```

Verify `exports`, `main`, `module`, declarations, subpaths, `sideEffects`,
Node engine, peer ranges, browser-safe imports, and the intended React/adapter
matrix. Workspace `workspace:*` resolution never substitutes for this evidence.

**Exit:** all stable packages pass tarball tests using the declared minimum
dependency combinations; package metadata matches the scope decision.

### M6 — Documentation, migration, and release candidate

**Goal:** publish a consumer-readable contract and stop feature churn.

- Produce canonical v1 release documents: scope, public contract, SemVer and
  deprecation policy, 0.x-to-1.x migration, known limitations, issue ledger,
  and readiness report. Place them under `docs/releases/v1.0.0/` or the
  repository's approved equivalent, with English/Korean ownership decided.
- Regenerate API documentation; compile key TS/TSX snippets from packed
  packages; remove stale API examples and compatibility wording.
- Run the complete release command set and record exact command, environment,
  exit code, date, and artifact location in the readiness report.
- Enter RC freeze: only P0/P1 fixes, their regression tests, and directly
  affected documentation may merge. Re-run M5 after each RC code change.

**Exit:** documentation and generated API output have no uncommitted drift;
the RC contains a complete evidence bundle.

### M7 — Independent audit and v1.0.0 decision

**Goal:** make the release verdict independent from implementation optimism.

A fresh reviewer audits source, public API diff, tests, tarballs, consumer
projects, migration guide, and evidence. The audit must replay at least:

1. cross-role replacement of a guard with the same ID;
2. exclusion of a guard through a normal handler filter;
3. concurrent invocation of one `once` handler;
4. race-loser overlap with a retry attempt;
5. result-aggregation failure;
6. observer mutation and an observer that never settles;
7. Provider Strict Mode replay and unmount drain;
8. WebMCP scope recreation/idempotency collision; and
9. a packed minimal-dependency consumer.

**Exit:** all gates pass, there are no open P0/P1 issues, and the readiness
report gives exactly one verdict: `READY` or `NOT READY`.

## 5. Gate ownership matrix

| Gate | Accountable milestone | Minimum evidence |
| --- | --- | --- |
| G0 Scope and versioning | M0–M1 | package classification, versions, runtime matrix, dependency ranges |
| G1 Public API freeze | M1–M2 | export diff, removal ledger, type/runtime parity tests |
| G2 Core execution | M3 | phase, ordering, retry/race, once, result-map tests |
| G3 Lifecycle and metrics | M3 | abort/timeout/destroy/telemetry invariant tests |
| G4 React contract | M4 | React 18/19, SSR, Strict Mode, unmount evidence |
| G5 Tool adapters | M4 | canonical boundary and adapter runtime/profile tests |
| G6 Package consumers | M5 | packed ESM/CJS/type/runtime/minimum-version consumers |
| G7 Docs and migration | M6 | generated docs, snippet compilation, migration review |
| G8 Independent audit | M7 | adversarial replay and signed readiness report |

## 6. Release cadence after this roadmap starts

- Use 0.9.x releases to expose removal notices and migration guides while
  compatibility-breaking cleanup is still permitted.
- Treat M2 completion as the public API freeze. From then until v1.0.0, reject
  unrelated additions and breaking changes.
- Use prereleases/RCs only to validate the frozen artifact; every code change
  restarts affected M3–M6 evidence.
- After v1.0.0, preserve stable-1x contracts. Deprecate first, provide a
  supported migration window, and schedule removal only for the next major
  line.

## 7. Definition of ready

v1.0.0 may be published only if all of the following are true:

- no open P0 or P1 issue exists;
- every public surface is classified, documented, and package-tested;
- no unclassified legacy implementation, export, document, or release-graph
  reference remains;
- types, runtime behavior, tests, package artifacts, and docs describe the
  same contract;
- the consumer tarball, not workspace source, succeeds on the supported
  matrix; and
- an independent audit accepts the recorded evidence.

If any condition is false, the correct release verdict is `NOT READY`; the
next roadmap item is the smallest gate-clearing task, not a version bump.
