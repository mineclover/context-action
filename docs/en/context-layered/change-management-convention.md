# Specification, Issue, and Documentation Management Convention

**Status:** Active
**Last reviewed:** 2026-07-17
**Scope:** feature work, architecture changes, bug fixes, and public documentation

This document defines the operating layer between a request and a verified
change. It complements the [Implementation Convention](./implementation-convention),
the [Package Boundary and Codebase Management Convention](./package-boundary-convention),
the [Documentation and Development Management Conventions](../concept/documentation-development-conventions),
and [Architecture Governance and Evidence](./architecture/architecture-governance).

## Review decision

The repository already has strong implementation and verification conventions:

- Context-Layered ownership is explicit across `contexts`, `business`,
  `handlers`, `actions`, `hooks`, and `views`.
- tool-calling work has a canonical `tools/list` → model tool call →
  `tools/call` → structured result path;
- runtime examples have focused convention and browser gates;
- public and generated documentation have separate ownership rules;
- architecture governance can connect a capability to an implementation anchor,
  test evidence, and public documentation.

The remaining management risk is traceability. An issue can describe intent,
while a specification describes the contract, but neither should be inferred
from a commit message or reconstructed from a finished diff. The rules below
make that connection explicit.

## 1. Source-of-truth hierarchy

Each artifact answers a different question. Do not make one artifact silently
replace another.

| Artifact | Answers | Must contain | Must not become |
| --- | --- | --- | --- |
| Issue | Why, who, and what outcome is requested? | owner, scope, non-goals, acceptance criteria, dependencies | the complete technical design |
| Specification | What contract must remain true? | types, transitions, invariants, compatibility, migration, failure behavior | a task checklist or progress log |
| Code and tests | Does the contract work? | implementation anchors and executable evidence | the only explanation of user behavior |
| Public documentation | How should a user or contributor understand it? | current behavior, usage, limits, verification path | an unimplemented future design |
| Architecture registry/decision | Which boundary is stable and who owns it? | capability identity, owner, evidence, decision record | a file inventory without semantics |
| Generated output | Which derived artifact is published? | generator source and reproducible command | the canonical source |

The preferred trace is:

```text
issue → specification/decision → implementation → focused proof
      → authoritative docs → architecture evidence → review → close
```

## 2. Change classification

Every non-trivial issue selects one primary class before implementation:

| Class | Required contract | Typical evidence |
| --- | --- | --- |
| Public API | exported type/API behavior and compatibility rule | package test, API docs, migration note |
| Behavior or pattern | user-visible state, action, tool, or workflow behavior | focused test, runnable example, guide |
| Architecture | ownership, boundary, provider order, persistence, or schema decision | decision record, architecture check, representative test |
| Bug | reproducible failure and expected behavior | regression test, reproduction steps, fix |
| Documentation/maintenance | command, ownership, link, translation, or generated-output correction | docs build, link/source check |

One issue may have linked implementation and documentation sub-issues, but it
must keep one primary outcome and one accountable owner.

## 3. Issue lifecycle

Use the following states. A status change requires the evidence in the right
column; do not advance a card because code merely exists.

| State | Meaning | Exit evidence |
| --- | --- | --- |
| `proposed` | User problem or maintenance need is captured | owner and outcome are clear |
| `specified` | Contract and acceptance criteria are agreed | linked spec/decision, non-goals, risks |
| `ready` | Work can start without a missing design choice | dependencies and verification plan are known |
| `in-progress` | Implementation or investigation is active | issue has a current owner and branch/PR reference |
| `blocked` | Progress requires an external decision or change | blocker, decision owner, and next review point |
| `review` | Code, tests, and docs are ready for review | evidence list and changed scope are attached |
| `verified` | Required gates and acceptance criteria pass | command results and manual proof, if any |
| `done` | Change is released or intentionally landed | final links, follow-up issues, and migration status |
| `superseded` | Another issue/spec replaces this work | replacement link and reason |

`blocked` is not a parking state. If the same blocker persists, record the
decision needed or split the work into an independently shippable slice.

## 4. Required issue fields

Feature, architecture, and maintenance issues should include:

```text
ID / title:
Change class:
Area and owner:
User or maintainer outcome:
Scope:
Non-goals:
Specification or decision link:
Acceptance criteria:
Invariants and compatibility constraints:
Implementation anchors:
Test/evidence plan:
Documentation and translation impact:
Dependencies, risks, and migration:
```

Bug issues replace the outcome section with a minimal reproduction:

```text
Environment and revision:
Steps to reproduce:
Actual result:
Expected result:
Regression range, if known:
Evidence (logs, screenshot, or failing test):
```

The repository provides issue forms for these entry points under
`.github/ISSUE_TEMPLATE/`. The forms collect the minimum metadata; the
canonical specification still belongs in a tracked document when the change
introduces a durable contract.

## 5. Specification management

### Stable identity

Give a durable capability or contract a stable ID such as `CA-WEB-001` or an
existing architecture capability ID. Do not encode a volatile file path in the
ID. Renames keep the ID; splits, mergers, and replacements must link a decision
record.

### Contract contents

A specification is ready when it states:

- the owned state and its boundary;
- inputs, outputs, transitions, and failure behavior;
- invariants and bounds;
- persistence, privacy, and security assumptions;
- compatibility and migration behavior;
- acceptance criteria that can be verified without subjective wording;
- implementation, test, and documentation anchors.

For browser persistence, a schema change must explicitly record the database
name, table/index change, schema version, upgrade behavior, fallback, and a
proof that existing data is preserved or intentionally discarded. The panel
layout migration is the reference shape: the Dexie database version changed
from 1 to 2, `preferences` was added, and the preference schema remains
versioned independently.

### Decision records

Create a short decision record when a change affects any of these boundaries:

- public package API or workspace package ownership;
- Context-Action provider/handler/store boundaries;
- MCP/function-calling protocol or tool result contracts;
- persistence schema, migration, privacy, or credential handling;
- a compatibility exception or a temporary convention waiver.

The decision should record context, options considered, decision, consequences,
reversal conditions, owner, and linked issue/capability. A prose update alone
is not enough when the choice will constrain future work.

## 6. Development and commit convention

Use this development loop:

1. Open or update the issue.
2. Write the smallest durable specification or decision.
3. Implement the narrowest boundary that satisfies it.
4. Add focused proof before broad cleanup.
5. Update the authoritative guide, README route, and translated page.
6. Run the proportional gates.
7. Record the evidence in the PR or handoff and close the issue only after
   verification.

Keep commits topic-shaped. A behavior commit may include its specification,
focused test, and authoritative docs; an unrelated documentation rewrite must
be a separate commit. Use the existing Conventional Commit style:

```text
feat: add capability
fix: correct behavior
docs: update the authoritative guide
test: add a regression gate
refactor: preserve behavior while moving a boundary
chore: maintain tooling or generated output
```

When GitHub issues are available, include `Refs #<number>` or `Closes #<number>`
in the commit or PR body. Do not use a commit hash as the only issue link.

## 7. Documentation management

- English and Korean public pages are paired sources; keep their meaning and
  current behavior aligned.
- The canonical guide owns the explanation. README files provide discovery and
  link to it; they should not create a second, divergent contract.
- API pages and LLMS artifacts are generated or derived. Change their source
  first and run the appropriate generator.
- A document must say when a feature is unavailable, best-effort, experimental,
  or dependent on manual credentials.
- New conventions need a discovery link in the Convention Index and the
  VitePress sidebar.

Minimum focused gates:

```bash
pnpm docs:build
pnpm docs:management
pnpm convention:check
pnpm change:traceability       # pull-request issue/spec reference gate
pnpm docs:full             # broad API/documentation releases
pnpm llms:sync-docs --changed-files <paths>
```

`pnpm change:traceability` is enforced by the pull-request CI job. It checks
contract-bearing changes under `packages/`, `architecture/`, `docs/`,
`scripts/`, and `.github/` for an issue reference such as `#123` or a stable
`CA-*` specification/decision ID in the pull-request body or commit messages.
It intentionally skips direct pushes and local runs outside a pull-request
event, so historical commits do not need to be rewritten.

For the standalone Web Studio, also run its focused convention, type-check,
build, and browser verification commands listed in the [Tool-Calling Web
Studio Convention](./usecase-tool-calling-web-studio).

## 8. Current feedback and next actions

The recent Dexie panel-layout change is in good shape: it has a typed contract,
a repository port, a schema migration, focused browser evidence, and paired
documentation. The standalone Web Studio is now registered as the
`web-coding-demo` architecture analysis project with the
`CA-WEB-CODING-STUDIO` capability at `verified`. The full standalone
verification, browser migration proof, documentation-management gate, and
architecture SEM gate now pass. The following management items are recorded
for traceability:

| Status | Item | Evidence or next action |
| --- | --- | --- |
| Closed | Issue templates and lifecycle were previously implicit | `.github/ISSUE_TEMPLATE/*` is checked by `pnpm docs:management` |
| Closed | `CA-WEB-CODING-STUDIO` evidence was not yet promoted | `pnpm web-coding:verify` and `pnpm arch:check` pass; registry status is `verified` |
| Closed | Dexie migration lacked an explicit v1→v2 browser fixture | `scripts/verify-web-coding-browser.mjs` creates a v1 database and verifies the upgrade |
| Closed | English/Korean parity and internal link validity were mostly review conventions | `pnpm docs:management` checks paired pages, discovery links, and handoff metadata |
| Closed | Issue-to-spec-to-test links were not machine-enforced | `pnpm change:traceability` reports changed contract-bearing files and requires a `#<issue>` or `CA-*` reference in pull-request metadata |

The traceability gate is intentionally additive: it checks new pull requests
without rewriting historical commits. A specification or decision ID remains
the preferred reference when a change does not have a GitHub issue.

## Review and handoff checklist

- [ ] Issue class, owner, scope, and non-goals are explicit.
- [ ] Durable behavior has a tracked specification or decision.
- [ ] Acceptance criteria map to implementation and test evidence.
- [ ] Persistence/API/schema changes include compatibility and migration notes.
- [ ] Authoritative English/Korean docs and discovery links are updated.
- [ ] Generated artifacts were regenerated from their source, when applicable.
- [ ] Focused gates and manual proof are recorded.
- [ ] Follow-up issues capture deferred work instead of leaving silent TODOs.
