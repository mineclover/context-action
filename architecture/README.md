# Samdocs Symbol Registry

이 디렉터리는 Samdocs가 관리하는 명시적 심볼과 아키텍처 evidence의 authored source다.
`@context-action/architecture-governance`는 이 source를 SEM 구조 evidence와 결합해 심볼 정의 위치,
사용 파일, capability traceability를 검증한다. 이 README는 내부 문서 인덱스이며 runtime/API 계약을
복제하지 않는다.

## Source map

| 산출물 | canonical 책임 |
| --- | --- |
| `registry.json` | capability(`CA-*`), owner, `SymbolRef` implementation anchor, test/public docs evidence |
| `contexts.json` *(planned)* | revision-bound `ContextManifest`와 Context-Action profile/edge 선언 |
| `rules/*.json` | package dependency와 SEM impact boundary policy |
| `governance-guide.md` | capability lifecycle, role comment, evidence authoring, 예외 workflow |
| `implementation-review.md` | 현재 PoC 범위, 한계, 운영 판단, roadmap |
| `real-use-review.md` | SEM 선택과 실제 저장소 검증 결과에 대한 decision 기록 |
| `packages/architecture-governance/README.md` | CLI/API, report/schema, runtime·filesystem·subprocess 계약 |
| `docs/.../architecture-governance-usage.md` | 사용자가 따라 하는 실행 recipe |
| `docs/.../context-scope-graph.md` | ContextScope schema와 Context-Action mapping 설계 |

같은 내용을 여러 곳에 다시 정의하지 않는다. 계약 수치나 실패 의미는 package README와 JSON Schema,
작성 규칙은 `governance-guide.md`, 공개 개념은 EN/KO governance 문서, 실행 명령은 usage 문서가
각각 소유한다.

## Identity model

- `capabilityId` (`CA-*`): registry의 아키텍처 책임 identity
- `SymbolRef` (`projectId`, `filePath`, `entityId`): snapshot의 실제 코드 심볼 identity
- `contextId`: screen, API, transaction 등의 파생 scope identity

`implementationAnchors`는 capability와 `SymbolRef`를 연결한다. ContextScope manifest도 같은
`SymbolRef`를 재사용하며 두 번째 심볼 ID를 만들지 않는다.

```text
role comment + capabilityId
  + SymbolRef(projectId/filePath/entityId)
  + SEM definition / usage evidence
  + registry evidence
  → complete symbol snapshot
  → optional ContextScope projection
```

Samdocs는 내부 함수 호출 횟수, 호출 순서, runtime data flow를 분석하지 않는다. 해당 의미가 필요하면
별도 LSP/runtime provider 계약으로 추가한다.

## Contributor reading order

1. 공개 개념: [Architecture Governance](../docs/en/context-layered/architecture/architecture-governance.md)
2. capability와 role comment 작성: [`governance-guide.md`](./governance-guide.md)
3. package/impact policy 작성: [`rules/README.md`](./rules/README.md)
4. 실행 recipe: [Architecture Governance Usage](../docs/en/context-layered/architecture/architecture-governance-usage.md)
5. 구현 한계와 roadmap: [`implementation-review.md`](./implementation-review.md)
6. SEM 선택 decision: [`real-use-review.md`](./real-use-review.md)
7. CLI/API와 artifact 계약: [`packages/architecture-governance/README.md`](../packages/architecture-governance/README.md)
8. ContextScope grouping 계약: [ContextScope Symbol Graph](../docs/en/context-layered/architecture/context-scope-graph.md)

## Local verification

```bash
pnpm arch:build
pnpm arch:check:registry
pnpm arch:check
pnpm arch:test
```

snapshot, history, snapshot-diff, intersect의 상세 옵션은 usage 문서에만 추가한다. Git
first-parent/worktree lifecycle과 historical `analysisProjects` traversal은
`@sem-foundation/repository`가 제공하고, 공통 entity/path/provenance 계약은
[`@sem-foundation/contracts`](../packages/sem-foundation/README.md)가 제공한다.

`architecture/contexts.json`과 ContextScope CLI가 구현되기 전에는 해당 manifest를 `arch:check` 입력으로
취급하지 않는다. 구현 시에도 complete snapshot을 canonical inventory로 유지하고 manifest는
멤버십·의도 edge만 선언한다.
