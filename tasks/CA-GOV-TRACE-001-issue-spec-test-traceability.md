# CA-GOV-TRACE-001: Issue → Spec → Test Traceability Gate

**Status:** proposed
**Opened:** 2026-07-18
**Change class:** Architecture / documentation maintenance
**Owner:** architecture-governance maintainers
**Primary result:** Every new tracked change can be followed from intent to contract to executable evidence.

## Problem

The repository now has issue forms, paired documentation, architecture capabilities, and executable
verification gates. The remaining gap is that the relationship between an issue, its tracked
specification or decision, its implementation anchor, and its test evidence is still a review
convention. A commit hash alone is not a sufficient issue link, and a file path alone does not
prove that the contract is covered.

## Scope

- Define a stable issue identifier format for repository-tracked changes.
- Add a machine-readable traceability record that links the issue to its spec or decision, code
  anchors, executable evidence, and public documentation.
- Add a focused checker and package command for new or changed records.
- Report missing or stale links without inferring intent from arbitrary commit messages.
- Document the handoff and review output so a PR can attach a reproducible traceability report.

## Out of scope

- Creating or mutating GitHub issues automatically.
- Reconstructing historical issue links from commit hashes.
- Replacing the architecture registry, behavior tests, or public documentation.
- Requiring every legacy commit to be rewritten before the first rollout.

## Contract

Each traceability record must provide:

```text
issue ID → change class → owner → spec/decision → implementation anchors
          → executable evidence → public documentation → current status
```

The checker must fail closed for a malformed record, a missing local target, an unsupported status,
or an evidence command that is not declared in the repository command surface. It must not claim
runtime correctness from static links alone.

## Acceptance criteria

- [ ] A stable `CA-GOV-TRACE-001`-style identifier and record schema are documented.
- [ ] A representative record links a spec/decision, implementation anchor, test or verification
      command, and English/Korean public documentation.
- [ ] `pnpm traceability:check` validates record shape, target paths, status, and evidence links.
- [ ] The checker can validate only changed records for a PR without requiring historical commit
      rewrites.
- [ ] A failing record reports the missing relationship and exits non-zero.
- [ ] The command is included in the appropriate governance/convention gate and documented in the
      change-management guide.
- [ ] The checker has a focused regression fixture for both a passing and a failing record.

## Invariants and compatibility

- Issue IDs are stable across file moves and symbol renames.
- A record is descriptive evidence, not a substitute for tests or owner review.
- Existing architecture registry status and Context-Action layer boundaries remain unchanged.
- The first rollout is additive and does not invalidate existing history.
- English/Korean public documentation remains paired when public behavior is changed.

## Proposed implementation surfaces

| Surface | Responsibility |
| --- | --- |
| `tasks/traceability/*.json` | Machine-readable issue/spec/evidence records |
| `scripts/verify-traceability.mjs` | Schema, path, command, and link validation |
| `package.json` | `traceability:check` and changed-record entry points |
| `scripts/verify-context-action-conventions.mjs` | Governance gate integration |
| Change-management convention | Lifecycle, handoff, and PR report instructions |

The exact record directory and schema remain a decision for the implementation phase. This issue
is intentionally specified before adding the checker so the record does not become an accidental
second architecture registry.

## Evidence plan

- Unit or fixture tests for valid and invalid records.
- `pnpm traceability:check` on the representative record.
- `pnpm docs:management`, `pnpm convention:check`, and `pnpm docs:build` after documentation changes.
- A staged or changed-file run that demonstrates PR-sized validation.

## Dependencies and risks

- Depends on the existing issue forms and change-management convention.
- The checker must distinguish a missing file from a command that is intentionally external or
  environment-dependent.
- Overly broad enforcement could turn documentation bookkeeping into a noisy gate; start with
  explicit records and additive adoption.

## Korean summary

이 이슈는 이슈의 의도, tracked spec/decision의 계약, 구현 anchor, 실행 가능한 증거,
영문·국문 공개 문서를 기계적으로 연결하는 traceability gate를 정의합니다. GitHub 이슈를
자동 생성하거나 과거 commit을 역추적하지 않으며, 먼저 대표 record와 변경 범위 검증을
추가하는 것을 목표로 합니다.
