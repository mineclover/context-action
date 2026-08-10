# Context-Action v1.0 Release Roadmap

---
status: completed
canonical: false
translationOf: docs/ko/context-layered/v1-release-roadmap.md
syncedAtCommit: 63f790a521e3428a7a2825677747338f8f05ccf3
roadmapRevision: v1-r3
artifactCommit: 63f790a521e3428a7a2825677747338f8f05ccf3
promotionRun: 31347327623
completedAt: 2026-08-10
releaseStatus: promoted
---

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

## 2. Historical baseline and final outcome

This roadmap's delivery plan completed on 2026-08-10. The `v1.0.0` artifact
cohort was published to `next` from
`63f790a521e3428a7a2825677747338f8f05ccf3`, and protected promotion run
`31347327623` promoted Core, React, and Tool Protocol `1.0.0` to `latest`.
The current default channel also includes the post-release
`@context-action/tool-protocol@1.0.1` and `@context-action/webmcp@0.1.2`
patches. [release-manifest.json](../../releases/v1.0.0/release-manifest.json)
owns the exact historical artifact, promotion, and current registry records.

The baseline table below is preserved as release-planning history. It does not
describe current readiness or a blocker. For the current state and the
post-release maintenance entrypoint, use
[status.md](../../releases/v1.0.0/status.md).

- **Baseline commit:** `0d6047b99961a33ef0d09704ae39c577d3b89cd8`
  (`fix: harden execution metrics and WebMCP scope lifecycle`)
- **Roadmap revision:** `v1-r3`
- **Versioning mode:** Lerna `independent`
- **Evidence status:** source and focused tests were inspected; the full release
  gate has not been certified as one evidence bundle.
- **Historical verdict:** `NOT READY` (superseded by the promoted release)

The statuses below describe the baseline; they are not claims that a CI run or
an external consumer certification completed. No CI status/workflow result is
recorded as release evidence for this baseline.

| Gate | Historical status | Baseline assessment |
| --- | --- | --- |
| G0 Scope/versioning | `partial` | Independent versioning is configured; package/subpath classification is open. |
| G1 Public API | `partial` | Role API hardening exists; legacy retain/remove decisions are open. |
| G2 Core execution | `implemented-unverified` | Role-conflict, atomic-once, guard semantics, and observer aggregation regressions exist. |
| G3 Lifecycle/metrics | `implemented-unverified` | Cancellation metrics, retry cancellation, and observer/lifecycle work exist. |
| G4 React contract | `partial` | WebMCP generics/resolver handling and hook tests exist; full matrix evidence is absent. |
| G5 Tool adapters | `partial` | WebMCP hardening exists; stability classification and full boundary evidence are open. |
| G6 Consumer packages | `partial` | Verification scripts exist; no release evidence bundle certifies this baseline. |
| G7 Docs/migration | `partial` | Roadmap and API docs exist; the v1 release document set is incomplete. |
| G8 Independent audit | `not-started` | No fresh-context audit evidence exists. |
| G9 Security/supply chain | `partial` | A repository security audit exists; release-specific supply-chain evidence is open. |

## 3. Operating model and issue states

This document is the normative release plan and changes only when the release
policy changes. The live delivery board is the v1.0 GitHub Project; until that
project is provisioned, [`docs/releases/v1.0.0/status.md`](../../releases/v1.0.0/status.md)
is its committed mirror. The readiness state and command evidence live in the
release status and `release-evidence/v1.0.0-*/manifest.json`, not in this plan.

Maintain one issue per independently verifiable concern and assign it to a
milestone below. Release status is the state of the evidence, not the count of
merged pull requests.

| Work item state | Meaning | Required exit evidence |
| --- | --- | --- |
| `inventory` | Surface is discovered but not yet decided | owner, affected package and public surface |
| `decision-needed` | Contract or removal decision is open | ADR or approved contract entry |
| `in-progress` | Code or tests are changing | reproduction and intended acceptance test |
| `implemented-unverified` | Code and focused tests exist, but no release-gate evidence is linked | source/test reference and missing evidence work |
| `contract-approved` | Public semantics are approved | ADR or public-contract entry and affected surface |
| `verified` | Contract, implementation, type, consumer, and documentation evidence are linked | immutable evidence-manifest entry |
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

## 4. Scope decision checkpoint

Before any public API is frozen, classify every publishable workspace package,
exported subpath, and named public surface in a mixed-stability subpath.
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

### Starting candidates, not approved scope

| Surface | Candidate classification | Decision required |
| --- | --- | --- |
| `@context-action/core` | `stable-1x` | target `1.0.0` contract |
| `@context-action/react` | `stable-1x` | target `1.0.0` contract |
| `@context-action/tool-protocol` | `supporting-stable` | whether it ships in the v1 train |
| `@context-action/react/tools` ToolContext API | `supporting-stable` | stable ToolContext surface |
| `@context-action/webmcp` | `experimental` | 0.x support profile and limits |
| React WebMCP hook | `experimental` | isolate behind `@context-action/react/webmcp` or equivalent |
| `@context-action/ai-sdk` | `experimental` or `supporting-stable` | support commitment and peer matrix |
| `@context-action/tool-durable-operations` | `decision-needed` | inclusion in stable ToolContext contract |
| `@context-action/mutative*` | `decision-needed` | stable React dependency commitment |
| generator and TypeDoc tooling | `internal` | whether npm publication remains necessary |

The currently mixed `@context-action/react/tools` entry must not make an
experimental WebMCP hook appear stable by association. Prefer a dedicated
experimental subpath while preserving a stable ToolContext-only entry.

## 5. Contract registry and freeze ladder

M1 records already implemented decisions as contract candidates before new
Core work begins. At the baseline, candidates include guard priority over
general filters, cross-role ID rejection, claim-before-invocation `once`,
abort-and-drain retry barriers, observer-after-result ordering, and separate
current/legacy WebMCP profiles. None becomes a 1.x promise until it is approved
and tested through the appropriate gate.

| Freeze | When | Meaning |
| --- | --- | --- |
| F0 Scope freeze | M1 exit | stable/experimental package, subpath, runtime, and version-train scope are decided. |
| F1 Contract candidate | M2 exit | legacy outcomes and target v1 API candidates are decided; migration fixtures exist. |
| F2 Public API freeze | M3 and M4 exit | Core, React, and adapter hardening has validated the candidate contract. |
| F3 Artifact freeze | M5 exit | tarballs and dependency/peer matrix are certified. |
| F4 RC code freeze | M6 entry | only P0/P1 fixes and directly affected tests/docs may change. |

M2 therefore creates a **public API candidate**, not the binding public API
freeze. A defect found in M3 or M4 may still require a contract change.

## 6. Workstreams and milestone dependency graph

Milestones are dependency gates, not a waterfall queue. Record dates and
owners on the live delivery board; begin independent work as soon as its inputs
are available.

```text
M0 Baseline → M1 Contract decisions → M2 Legacy closure candidate
                                      ├→ M3 Core and lifecycle ─┐
                                      └→ M4 React and adapters ─┼→ M5 Distribution certification
                                                                → M6 RC → M7 Audit → M8 Publish
```

The following tracks run continuously, rather than starting at M5 or M6:

- API-surface diff from M1 and after every public export/declaration change;
- packed-consumer smoke and dependency checks from M0 and after each relevant
  package/build/dependency change;
- documentation and migration fixtures from M1 and after each public change;
- security and supply-chain checks across the release train.

### M0 — Baseline and release inventory

**Goal:** establish a factual starting point before changing behavior.

**Baseline status:** `partial`. The current SHA and independent versioning are
known, but published-version inventory, package/subpath classification, legacy
inventory, formal risk register, localization governance, and stored baseline
command results remain open.

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

**Baseline status:** `partial`. Several decisions are implemented and tested,
but are not yet public-contract or ADR approvals.

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
implicit compatibility promise; F0 scope freeze is recorded.

### M2 — Legacy closure and contract candidate

**Goal:** decide and execute obsolete-path removal while producing the v1 public
API candidate.

**Baseline status:** `not-complete`. At minimum, decide the outcome of
`registerEffect`, `blocking`, generic legacy `register`, WebMCP
`beforeExecute`, the WebMCP `errorMode: "result"` alias, compatibility docs and
examples, the legacy internal void executor, and ambiguous compatibility
subpaths.

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
an explicit 1.x support list, not a backlog. F1 contract candidate and actual
migration fixtures are recorded; this is not yet the public API freeze.

### M3 — Core and lifecycle hardening

**Goal:** make the frozen Core behavior deterministic and safe under failure
and concurrency.

**Baseline status:** `implemented-unverified`. Regression coverage already
exists for role conflict, guard filtering/fail-closed behavior, atomic-once
guard/result handling, void-dispatch observer aggregation, cancellation
metrics, and retry/race semantics. Complete stress coverage and release-gate
evidence remain required.

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
`ExecutionResult` fields cannot contradict each other. Together with M4, this
is the prerequisite for F2 public API freeze.

### M4 — React and adapter hardening

**Goal:** prove that integrations delegate the frozen Core contract rather than
reimplementing it.

**Baseline status:** `partial`. WebMCP profile generic propagation, caller
execution-resolver preservation, registration cancellation, post-execution
snapshots, and React hook coverage exist. React 18/19 release evidence, SSR
consumer evidence, Tool Protocol ordering, AI SDK coverage, and subpath
isolation remain open.

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

**Goal:** finalize certification that has been continuously exercised since M0,
outside workspace resolution.

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
  readiness report, release status, and an independent-version release
  manifest. Place them under `docs/releases/v1.0.0/` or the repository's
  approved equivalent. Korean is canonical; English remains a governed
  translation from M0 onward.
- Regenerate API documentation; compile key TS/TSX snippets from packed
  packages; remove stale API examples and compatibility wording.
- Run the complete release command set and record exact command, environment,
  exit code, date, and artifact location in the readiness report.
- Enter RC freeze: only P0/P1 fixes, their regression tests, and directly
  affected documentation may merge. Re-run M5 after each RC code change.

**Exit:** documentation and generated API output have no uncommitted drift;
the RC contains a complete evidence bundle and has entered F4 code freeze.

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

### M8 — Publish and post-release verification

**Goal:** publish only the certified artifact, then verify the public registry
and provide an accountable recovery window.

1. confirm final artifact checksums match the certified RC artifact;
2. publish to `next`/`rc`, then run a clean external-consumer smoke test;
3. promote to `latest` only after approval, publish the Git tag and release
   manifest, and deploy the documentation site;
4. record npm package name/version, dist-tag, provenance result, tarball
   checksum, release commit, and post-publish ESM/CJS/type smoke result; and
5. verify rollback/deprecate procedure and triage release issues for 24–72
   hours.

**Exit:** the public artifact and registry metadata match the approved manifest;
post-release ownership and rollback path are documented.

## 7. Gate and evidence matrix

Each evidence-manifest entry records command, environment, start/end time, exit
code, log, and content hash. A relevant change re-opens the named gate even when
the prior command passed.

| Gate | Command or verification | Required artifact | Re-open condition |
| --- | --- | --- | --- |
| G0 Scope/versioning | version and dependency inventory | `release-manifest.json`, scope matrix | package, subpath, version, peer, or runtime-scope change |
| G1 Public API | API snapshot/declaration diff | `api-surface/*.json`, removal ledger | public export or declaration change |
| G2 Core execution | Core focused suites and negative type tests | `test-results/core-contract.*` | Core source or type change |
| G3 Lifecycle/metrics | lifecycle stress and invariant suites | `test-results/lifecycle-report.json` | queue, retry, abort, observer, or lifecycle change |
| G4 React contract | `pnpm verify:react-compatibility` and SSR consumer test | `test-results/react-18.json`, `react-19.json` | React source, peer, or hook type change |
| G5 Tool adapters | adapter runtime/profile suites | `test-results/adapters/*.json` | adapter or Tool Protocol change |
| G6 Package consumers | `pnpm verify:package-tarballs`, export checks, consumer matrix | `consumer-results/matrix.json`, tarball hashes | package, dependency, export, or build change |
| G7 Docs/migration | docs API generation, sync, build, and packed snippets | generated-doc clean diff, migration fixture output | public API or documentation change |
| G8 Independent audit | fresh-context adversarial replay | `audit-report.md` | any RC code change |
| G9 Security/supply chain | `pnpm security:audit`, workflow/dependency/provenance review | `security-report.json`, integrity hashes | dependency, workflow, publish, or tool-policy change |

### G9 — Security and supply chain

G9 is a release blocker for stable surfaces. It covers vulnerability and license
review, package integrity/hash verification, npm provenance, immutable GitHub
Actions pinning, secret scanning, `SECURITY.md` and supported-version policy,
tool authorization/approval threat modeling, and WebMCP origin/Permissions
Policy review. The gate fails if a stable package has an unresolved high or
critical dependency finding, a destructive tool example bypasses policy or
approval, or the release workflow lacks an accountable provenance path.

## 8. Release train and manifest

Use the train below rather than repeatedly making breaking removals in a 0.9
patch line:

```text
0.9.x            replacement API, deprecation notice, migration guide, warning
0.10.0/beta.1    legacy removal and final contract candidate
1.0.0-rc.1       F2 API freeze, artifact certification, external consumers
1.0.0            artifact-equivalent final publish
```

Independent versions require a release manifest to say what “Context-Action
v1.0.0” means. The target artifact is `docs/releases/v1.0.0/release-manifest.json`:

```json
{
  "release": "context-action-v1.0.0",
  "commit": "<release-sha>",
  "packages": {
    "@context-action/core": "1.0.0",
    "@context-action/react": "1.0.0",
    "@context-action/tool-protocol": "1.0.0",
    "@context-action/webmcp": "0.x"
  },
  "stableSurfaces": [
    "@context-action/core",
    "@context-action/react",
    "@context-action/tool-protocol"
  ]
}
```

The example is a schema, not an approved version map. The manifest is consumed
by the readiness report, release notes, publish automation, post-publish smoke,
and Git tag annotation.

## 9. Evidence and bilingual-document governance

The release documents have distinct responsibilities:

```text
v1-release-roadmap.md                 normative rules, milestones, gates, ready definition
docs/releases/v1.0.0/status.md        current gate status, blockers, and next work
release-evidence/v1.0.0-*/manifest.json  reproducible commands, artifacts, and hashes
```

`manifest.json` must include the release commit, Node/pnpm/TypeScript
environment, command timing/exit code/log path, and artifact path/SHA-256.
Do not record a passing command without its immutable artifact or log.

The Korean roadmap is canonical. Its English counterpart is a governed
translation. CI/documentation checks must keep the roadmap revision, artifact
commit, milestone IDs, gate IDs, issue-template fields, and Definition of Ready
item count aligned; they do not need to compare prose translations.

## 10. Initial delivery issues

| Issue ID | Work | Milestone |
| --- | --- | --- |
| `CA-1X-SCOPE-001` | package and subpath stability classification | M1 |
| `CA-1X-VERSION-001` | independent release manifest and target version map | M1 |
| `CA-1X-FREEZE-001` | freeze ladder adoption | M1 |
| `CA-1X-LEGACY-001` | `registerEffect` remove/retain/isolate decision | M2 |
| `CA-1X-LEGACY-002` | `blocking` compatibility decision | M2 |
| `CA-1X-WEBMCP-001` | experimental React WebMCP subpath isolation | M2/M4 |
| `CA-1X-LIFECYCLE-001` | WebMCP dispose cancel/drain contract | M4 |
| `CA-1X-EVIDENCE-001` | release evidence manifest schema and writer | M0/M5 |
| `CA-1X-SECURITY-001` | G9 security and supply-chain evidence | M0–M5 |
| `CA-1X-MIGRATION-001` | actual 0.9 consumer migration fixture | M2/M6 |
| `CA-1X-LOCALIZE-001` | Korean-canonical/English-sync validation | M0 |
| `CA-1X-RELEASE-001` | dist-tag, provenance, rollback, post-publish procedure | M7/M8 |

## 11. Definition of ready

v1.0.0 may be published only if all of the following are true:

- no open P0 or P1 issue exists;
- every public surface is classified, documented, and package-tested;
- no unclassified legacy implementation, export, document, or release-graph
  reference remains;
- types, runtime behavior, tests, package artifacts, and docs describe the
  same contract;
- the consumer tarball, not workspace source, succeeds on the supported
  matrix; and
- G9 security/supply-chain evidence has no unresolved release blocker; and
- an independent audit accepts the recorded evidence.

If any condition is false, the correct release verdict is `NOT READY`; the
next roadmap item is the smallest gate-clearing task, not a version bump.
