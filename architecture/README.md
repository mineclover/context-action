# Context-Action Architecture Governance Source

이 디렉터리는 `@context-action/architecture-governance`가 관리하는 명시적 심볼과 아키텍처 evidence의 authored source다.
Context-Action convention을 이 repository에서 실험적으로 운영하기 위한 규칙·선언 저장소이며, 범용
architecture 표준이나 문서 편집 시스템이 아니다. 작성자는 책임과 경계를 명시하고, package runtime은
그 선언을 SEM/Git evidence와 결합해 검증한다.
`@context-action/architecture-governance`는 이 source를 SEM 구조 evidence와 결합해 심볼 정의 위치,
사용 파일, capability traceability를 검증한다. 이 README는 내부 문서 인덱스이며 runtime/API 계약을
복제하지 않는다.

## Source map

| 산출물 | canonical 책임 |
| --- | --- |
| `registry.json` | capability(`CA-*`), owner, authored role, `SymbolRef` implementation anchor, test/public docs evidence |
| `contexts.json` *(optional)* | revision-bound `ContextManifest`와 Context-Action profile/edge 선언 |
| `rules/*.json` | package dependency와 SEM impact boundary policy |
| `governance-guide.md` | capability lifecycle, role comment, evidence authoring, 예외 workflow |
| `implementation-review.md` | 현재 PoC 범위, 한계, 운영 판단, roadmap |
| `real-use-review.md` | SEM 선택과 실제 저장소 검증 결과에 대한 decision 기록 |
| `docs/en/context-layered/package-boundary-convention.md` | package ownership, dependency direction, lifecycle, codebase cleanup 규칙 |
| `packages/architecture-governance/README.md` | CLI/API, report/schema, runtime·filesystem·subprocess 계약 |
| `docs/.../architecture-governance-usage.md` | 사용자가 따라 하는 실행 recipe |
| `docs/.../sem-doc-architecture-governance-boundary.md` | sem-doc과 Architecture Governance의 책임·계약·의존성 경계 |
| `docs/.../context-scope-graph.md` | ContextScope schema와 Context-Action mapping 설계 |

같은 내용을 여러 곳에 다시 정의하지 않는다. 계약 수치나 실패 의미는 package README와 JSON Schema,
작성 규칙은 `governance-guide.md`, 공개 개념은 EN/KO governance 문서, 실행 명령은 usage 문서가
각각 소유한다.

### Ownership boundary

- **Authored convention**: `registry.json`, `rules/*.json`, `governance-guide.md`, decision 문서
- **Runtime/evaluation**: `@context-action/architecture-governance`
- **Derived evidence**: verification report, complete snapshot/history, snapshot diff, `ContextScope`
- **Work context/document binding**: `@context-action/sem-doc`가 별도로 소유하며 이 디렉터리에 복제하지 않음

Foundation은 identity, path, provenance, Git revision 같은 정책 중립 primitive만 공유한다. 어떤
capability를 만들고 어떤 evidence를 요구할지는 이 repository의 authored convention에 남긴다.

## Identity model

- `capabilityId` (`CA-*`): registry의 아키텍처 책임 identity
- `SymbolRef` (`projectId`, `filePath`, `entityId`): snapshot의 실제 코드 심볼 identity
- `contextId`: screen, API, transaction 등의 파생 scope identity

`implementationAnchors`는 capability와 `SymbolRef`를 연결한다. ContextScope manifest도 같은
`SymbolRef`를 재사용하며 두 번째 심볼 ID를 만들지 않는다.

```text
role declaration + capabilityId
  + SymbolRef(projectId/filePath/entityId)
  + SEM definition / usage evidence
  + registry evidence
  → complete symbol snapshot
  → optional ContextScope projection
```

Architecture Governance는 내부 함수 호출 횟수, 호출 순서, runtime data flow를 분석하지 않는다. 해당 의미가 필요하면
별도 LSP/runtime provider 계약으로 추가한다.

작업 전 문서·Git 컨텍스트는 별도 패키지인 [`@context-action/sem-doc`](../packages/sem-doc/README.md)이
담당한다. 두 패키지는 같은 목적의 다른 이름이 아니며, 공통 Foundation primitive만 정책 중립적인
범위에서 공유한다. 전체 비교와 선택 기준은 [sem-doc과 Architecture Governance 경계](../docs/en/context-layered/architecture/sem-doc-architecture-governance-boundary.md)를 참고한다.

## Contributor reading order

1. 공개 개념: [Architecture Governance](../docs/en/context-layered/architecture/architecture-governance.md)
2. 두 도구의 경계: [sem-doc and Architecture Governance Boundary](../docs/en/context-layered/architecture/sem-doc-architecture-governance-boundary.md)
3. package 경계와 codebase 정리: [Package Boundary Convention](../docs/en/context-layered/package-boundary-convention.md)
4. capability와 role comment 작성: [`governance-guide.md`](./governance-guide.md)
5. package/impact policy 작성: [`rules/README.md`](./rules/README.md)
6. 실행 recipe: [Architecture Governance Usage](../docs/en/context-layered/architecture/architecture-governance-usage.md)
7. 구현 한계와 roadmap: [`implementation-review.md`](./implementation-review.md)
8. SEM 선택 decision: [`real-use-review.md`](./real-use-review.md)
9. CLI/API와 artifact 계약: [`packages/architecture-governance/README.md`](../packages/architecture-governance/README.md)
10. ContextScope grouping 계약: [ContextScope Symbol Graph](../docs/en/context-layered/architecture/context-scope-graph.md)

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

`context-scope` CLI는 complete snapshot과 optional `contexts.json` manifest를 조합해 별도 scope
artifact를 만든다. manifest는 `arch:check` 입력이 아니며, complete snapshot을 canonical inventory로
유지하고 manifest는 멤버십·의도 edge만 선언한다.
