# Context-Action Architecture Governance PoC 구현 리뷰와 문서 구조

이 문서는 현재 `@context-action/architecture-governance` PoC를 Architecture Governance의 심볼 관리 관점에서
검토하고, 각 설명을 어느 문서에서 관리할지 정리한 내부 review 기록이다. 구현의 source of truth는
`packages/architecture-governance/src/`와 `architecture/registry.json`이며, 이 문서는 구현을 복제하는
API reference가 아니라 심볼 catalog의 현재 범위·검증 결과·남은 한계를 기록한다.

## 0.1 포지션

현재 패키지는 **Context-Action convention 기반의 실험적 규칙형 architecture/document evidence
governance**다. repository-local registry와 policy를 authored source로 삼고, SEM/Git 결과를
결합해 선언된 책임의 정의 위치·사용 파일·검토 evidence를 확인한다. 따라서 독립적인 범용
architecture inference engine, 문서 editor/generator, LSP/compiler call graph, runtime correctness
검증기로 포지셔닝하지 않는다. 안정화된 공통 identity·path·Git primitive는 Foundation에 두지만,
어떤 선언과 evidence가 필요한지는 이 repository의 convention으로 남긴다.

## 0.2 sem-doc과의 책임 분리

이 review의 대상은 `@context-action/architecture-governance`다. 같은 저장소의
`@context-action/sem-doc`은 작업 전 문서·Git 컨텍스트를 만드는 별도 라이브러리이며, 아래 표처럼
목적과 계약이 다르다.

| 구분 | Architecture Governance | sem-doc |
| --- | --- | --- |
| 질문 | authored architecture 계약과 evidence가 유효한가? | 변경 전에 어떤 코드·문서·테스트 컨텍스트가 필요한가? |
| 입력 | registry, policy, analysis projects, revision/context manifest | target entity/path, TSDoc binding, Git state |
| 결과 | verification gate, complete snapshot/history, diff, ContextScope | work-context, document index/binding, Git diff |
| 판단 | CI/reviewer가 threshold에 따라 실패시킬 수 있음 | advisory evidence; architecture 승인 아님 |
| 의존성 | 외부 SEM + Foundation | 외부 SEM + Foundation |

두 패키지는 공통 Foundation primitive만 공유하고 runtime 의존성이나 report 계약을 공유하지 않는다.
이 문서에서 “Architecture Governance”를 이전 명칭인 “Samdocs”로 줄여 부르지 않으며, 전체
선택 기준은 [경계 가이드](../docs/en/context-layered/architecture/sem-doc-architecture-governance-boundary.md)에서 관리한다.

## 1. 검토 대상과 현재 상태

| 기능 | 구현 위치 | 현재 판단 | 검증 근거 |
| --- | --- | --- | --- |
| 심볼 정의·사용 파일 수집 | `src/sem.ts`, `src/verifier.ts` | 부분 완료 | SEM entities로 정의 위치를 확인하고 명시적 anchor에 대한 `impact.dependents[].file`을 `usageFiles`로 수집 |
| 명시적 심볼 registry | `architecture/registry.json`, `src/input.ts` | 완료(PoC) | capability `role`과 `implementationAnchors`를 파싱하고 `SymbolRef` anchor를 검증 |
| 역할 주석 수집 | registry `role` field | 부분 완료 | machine-readable authored role은 보존하지만 source `@role` comment collector는 다음 단계 |
| 중복 구현 방지 | `src/verifier.ts` | 완료(PoC) | SEM duplicate/ambiguous entity와 capability 간 동일 `SymbolRef` anchor를 fail-closed 처리 |
| Package dependency/impact boundary | `src/input.ts`, `src/verifier.ts`, `architecture/rules/` | 보조 기능 | 심볼 catalog 자체가 아니라 optional architecture policy extension |
| Change scope와 report | `src/cli/`, `src/report-contract.ts`, `src/reporters.ts` | 보조 기능 | 심볼 변경 위치와 review 범위를 출력하는 infrastructure |
| Git history symbol delta | `src/history.ts`, `src/sem.ts` | PoC 완료 | first-parent commit별 `sem diff`를 `{filePath, symbol, changeType}`로 직렬화하고 commit worktree에서 전체 snapshot을 materialize |
| Complete snapshot/diff | `src/history.ts`, `src/cli/` | PoC 완료 | `symbol-snapshot@1.1`, `symbol-history-report@1.3`, `symbol-snapshot-diff@1.0` 계약과 CLI 제공 |
| ContextScope manifest projection | `src/context-scope.ts`, `src/cli/` | 완료(PoC) | revision-bound manifest, explicit edges, bounded optional SEM `depends-on` projection, `context-scope@1.0` schema/CLI |
| Historical project provenance | `src/history.ts`, `@context-action/sem-foundation-repository` | 완료 | revision에 없는 project를 `skipped/missing-at-revision`으로 보존하고 `fileExtensions` 필터를 history/snapshot에 전달 |
| Shared SEM foundation contracts | `packages/sem-foundation`, `src/history.ts` | 완료 | entity identity, path normalization, advisory envelope, `AnalysisProject`를 정책 중립 shared package로 추출 |
| Shared Git history/worktree runtime | `packages/sem-foundation-repository`, `src/history.ts` | PoC 완료 | revision, first-parent commit range, detached worktree lifecycle, historical project callback을 공통화 |
| Package boundary/codebase lifecycle | `docs/en|ko/context-layered/package-boundary-convention.md`, `architecture/rules/package-boundaries.json` | 완료(PoC) | package ownership map, dependency direction, package lifecycle, cleanup checklist, and enforceable dependency gates |
| 입력·filesystem·subprocess 경계 | `src/paths.ts`, `src/diagnostics.ts`, `src/sem.ts`, `src/history.ts` | 완료 | catalog 수집을 안전하게 실행하기 위한 runtime boundary |

Architecture Governance의 핵심은 “모든 내부 호출을 분석하는 graph 도구”가 아니라, 작성자가 명시한 심볼을 한 번
수집하고 정의 위치와 역할 설명을 연결하는 catalog다. 함수 내부 호출 횟수, 호출 순서, runtime data
flow는 LSP 수준의 별도 분석 대상이며 현재 범위에 넣지 않는다. 현재 package의 package policy와
impact boundary rule은 보조 extension이고, 명시적 anchor의 usage file 수집은 catalog의 기본 결과로
분리해 설명해야 한다.

## 2. 현재 구현에서 확인되는 강점

### 2.1 심볼 정의를 한 번에 수집할 수 있다

SEM entities 결과는 project별로 한 번 수집하며, top-level symbol의 canonical ID와 파일·line 범위를
얻는다. 따라서 Architecture Governance의 기본 질문인 “이 역할의 정의는 어디에 있는가?”에는 답할 수 있다.

명시적 anchor는 SEM `impact`의 대상에도 전달한다. `dependents[].file`을 중복 제거한
`symbolUsages[].usageFiles`로 보존하므로 “이 심볼은 어느 파일에서 사용되는가?”에도 답할 수 있다.
이 목록은 top-level 구조 관계이며 identifier별 모든 참조나 runtime 호출 목록은 아니다.

커밋별 이력은 `arch-verify history --from <ref> --to <ref>`가 Git first-parent 목록을 열거한 뒤
각 `parent..commit`에 `sem diff`를 적용하고, 각 commit을 임시 worktree에서 SEM entities로 다시
분석해 완전한 `snapshot.symbols`를 함께 저장한다. delta는 추가·수정·삭제·이동 이력을 추적하고,
snapshot은 `projectId`와 파일·심볼·kind·line 범위를 보존해 이후 컨텍스트 boundary와 심볼 교집합
계산의 기준이 된다. `snapshot`은 현재 worktree 또는 특정 commit 하나를 저장하고,
`snapshot-diff`는 두 snapshot을 `projectId/filePath/entityId` 안정 키로 비교해 added, removed,
modified를 분리한다. 두 기능 모두 내부 호출 그래프를 생성하지 않는다.

### 2.2 심볼 anchor를 안정적인 위치로 관리한다

`path::kind::name` anchor는 line number만 저장하는 방식보다 안정적이며, 실제 SEM entity와 일치하는지
검사한다. 같은 project에서 anchor가 없거나 여러 entity로 해석되면 명시적으로 실패한다.

### 2.3 호출 그래프를 과도하게 약속하지 않는다

현재 구현은 내부 함수 호출을 세거나 호출 순서를 추론하지 않는다. 이 제한은 누락된 기능이 아니라
LSP/정교한 language analysis를 별도 계층으로 남겨 catalog의 실행 비용과 의미를 작게 유지하는
설계 판단이다.

### 2.4 변경 범위와 전체 수집을 분리한다

`arch:check:changed`와 PR range report는 어떤 심볼 정의와 주석을 다시 확인할지 좁혀 주지만 전체
catalog 수집을 대체하지 않는다. 변경 범위는 review 보조 자료이고, symbol registry의 중복 검사는
항상 전체 registry 기준으로 실행되어야 한다.

### 2.5 실행 경계가 안전하다

preflight, path containment, output budget, atomic report, package artifact 검증은 심볼 수집 결과를
안전하게 재현하기 위한 infrastructure다. 이 방어 기능이 LSP 호출 분석을 의미하는 것은 아니다.

## 3. 현재 한계와 운영상 주의점

| 우선순위 | 한계 | 영향 | 현재 대응 |
| --- | --- | --- | --- |
| P1 | source 역할 주석을 자동 수집하지 않음 | registry role과 구현 옆 JSDoc/comment의 일치 여부는 자동 검증하지 못함 | registry `role`을 canonical authored declaration으로 사용하고 `@role` collector를 다음 단계로 정의 |
| P1 | capability 역할 의미의 전역 중복 검사는 정책 선택이 필요함 | 동일 문장 역할은 여러 context에서 합법일 수 있음 | 동일 `SymbolRef` anchor 중복은 fail-closed; role semantic uniqueness는 별도 policy로 분리 |
| P1 | SEM 0.21.0에 provider 의미가 고정됨 | provider 업그레이드가 entity/impact semantics를 바꿀 수 있음 | version gate, parser 회귀 테스트, decision 기록 후에만 upgrade |
| P1 | 내부 호출 분석을 제공하지 않음 | 함수 호출 횟수·순서·runtime flow는 알 수 없음 | LSP/언어 분석의 별도 provider로 남기고 Architecture Governance core에는 포함하지 않음 |
| P1 | 심볼 registry는 authored declaration임 | 선언하지 않은 개념은 catalog에 자동 등장하지 않음 | 명시적 annotation, 정의 위치 수집, duplicate ID gate를 운영 규칙으로 고정 |
| P2 | shared packages의 registry 배포와 소비자 smoke test를 release마다 확인해야 함 | workspace 검증만 통과해도 외부 설치 경로가 깨질 수 있음 | 공개 npm metadata/tarball 확인과 clean-consumer CLI smoke test를 release gate에 포함 |
| P2 | package/impact policy가 core 목적과 섞일 위험이 있음 | architecture graph 도구로 오해될 수 있음 | policy를 보조 extension으로 문서·API에서 분리 |

이 한계들은 현재 결함으로 숨기지 않는다. 특히 SEM entity가 있다고 해서 내부 호출 관계나 역할
의미가 자동으로 생기는 것은 아니다. 현재 Architecture Governance의 기계 판독 역할 설명은 registry `role`이고,
구현 옆 authored comment는 사람이 검토하는 보조 설명이다. SEM은 해당 심볼의 정의 위치를 찾아주는
구조 provider로 한정한다.

### 3.1 제한 현황과 정리 원칙

현재의 개수·크기 제한은 하나의 `MAX_*` 목록이 아니라 다음 세 종류로 분류한다.

| 분류 | 현재 계약 | 목적 | 운영 원칙 |
| --- | --- | --- | --- |
| authored contract | analysis project 최대 4,096개, project별 확장자 32개·확장자 길이 64자 | registry와 provider scope를 예측 가능하게 유지 | Foundation에서 한 번만 정의하고 모든 소비자가 재사용 |
| complete snapshot | commit당 65,536 symbols, history 최대 512 commits·65,536 changes | 부분 snapshot을 정상 결과로 오인하지 않게 방지 | 초과 시 truncation하지 않고 fail-closed |
| process/resource budget | architecture SEM 기본 120초·64MiB, sem-doc direct call 기본 30초·32MiB, sem-doc Git 기본 64MiB | 외부 subprocess와 메모리 사용량 제어 | aggregate budget을 우선하고 호출별 상한을 중복해서 만들지 않음 |

history의 전체 snapshot symbol 합계 상한(기존 4,194,304)은 제거했다. commit당 complete
snapshot 상한과 SEM aggregate output budget이 같은 payload를 이중으로 제한했기 때문이다. 전체
payload가 커지면 기존 `maxOutputBytes`/timeout 계약으로 실패하며, 심볼을 일부만 남긴 보고서는
생성하지 않는다. 이 구분으로 “완전한 commit snapshot”이라는 목적과 subprocess 안전 예산을
분리한다.

이번 정리의 우선순위는 다음과 같다.

1. Foundation 상수와 sem-doc 입력 검증처럼 의미가 같은 제한을 먼저 통합한다.
2. 공통 상한은 기본값으로 유지하되 `contractLimits`/CLI override를 통해 신뢰할 수 있는 호출자가
   완화할 수 있게 한다. `unbounded`는 safe-integer ceiling으로만 확장되며 resource budget을
   대체하지 않는다.
3. history·snapshot이 부분 결과를 만들지 않는지 회귀 테스트로 고정한다.
4. 실제 저장소에서 report 크기와 실행 시간을 측정한 뒤 필요할 때만 stream/파일 단위 snapshot
   저장을 추가한다. 측정 전 임의의 추가 개수 상한은 만들지 않는다.
5. 내부 호출 graph나 LSP 수준 reference 위치는 이 제한 작업과 섞지 않고 별도 provider 계약으로
   검토한다.

## 4. 문서 정보구조

설명은 독자와 변경 목적에 따라 다음처럼 분리한다.

| 문서 | 독자 | 유지할 내용 | 넣지 않을 내용 |
| --- | --- | --- | --- |
| `docs/en|ko/context-layered/architecture/architecture-governance.md` | 일반 사용자·reviewer | Architecture Governance 목적, 심볼 catalog workflow, report 의미, 호출 분석 제외 범위 | 내부 보안 budget의 모든 상수 |
| `architecture/README.md` | 저장소 contributor | source map, 명령, policy 파일, CI 연결, 내부 문서 링크 | 각 함수의 방어 구현 목록 |
| `architecture/governance-guide.md` | symbol author | capability ID, registry `role`, `SymbolRef` anchor, role comment, 정의 위치, 예외, checklist | LSP 호출 그래프 |
| `architecture/rules/README.md` | policy author | package/impact rule DSL과 glob 문법 | capability lifecycle 전체 |
| `architecture/implementation-review.md` | maintainer·reviewer | 심볼 관리 구현 review, 한계, 운영 판단, roadmap | 사용자 API 사용 예제의 반복 |
| `architecture/real-use-review.md` | 설계 의사결정 reviewer | SEM 선택 이유, 실제 수치, 의도적으로 남긴 경계 | 현재 명령 사용법의 복제 |
| `packages/architecture-governance/README.md` | package consumer/maintainer | CLI/API, report/schema, artifact·runtime contract | 공개 Context-Layered 개념 설명 |

공개 문서는 다음 순서로 읽게 한다.

1. Architecture Governance overview에서 심볼 catalog와 호출 분석 제외 범위를 이해한다.
2. capability ID, registry `role`, `SymbolRef` anchor와 role comment 규칙을 읽고 registry/source comment 변경을 준비한다.
3. policy rule 문법과 명령을 확인한다.
4. changed/staged/range report를 review workflow에 연결한다.
5. 구현 세부나 운영 판단이 필요할 때 내부 review와 package README로 내려간다.

## 5. 다음 변경 시 review 기준

- SEM 버전을 올리면 `real-use-review.md`, provider parser 테스트, symbol location contract 영향 여부를 함께 갱신한다.
- 새 symbol은 `capabilityId`, `SymbolRef` anchor, registry `role`과 역할 주석을 먼저 만들고, SEM entity가 정의 위치를 확인할 때 catalog에
  포함한다.
- 기존 `capabilityId`/`SymbolRef`와 동일한 역할·정의가 생기면 새 구현을 추가하지 말고 기존 symbol을 재사용하거나
  replacement decision을 기록한다.
- 새 boundary는 package 선언인지 실제 구조 dependency인지 구분하고, 같은 의도를 두 policy로
  중복 표현하지 않는다.
- report contract를 바꾸면 runtime validator, JSON Schema, renderer, fixture, public 설명을 한
  변경으로 갱신한다. 호출 그래프나 LSP 결과를 추가하는 경우에는 별도 provider contract로 분리한다.
- snapshot/history/diff contract를 바꾸면 해당 JSON Schema와 package export, CLI help/artifact
  smoke test, 공개 문서를 함께 갱신한다. 현재 기준은 snapshot `1.1`, history `1.3`, snapshot-diff
  `1.0`이다.
- shared package를 배포할 때는 registry version pinning과 external install/CLI/schema consumption을
  별도 release decision으로 기록하고, 두 저장소의 compatibility fixture를 release gate에 추가한다.

## 6. 검증 명령

현재 구현 review의 최소 증거는 다음 명령 조합이다.

```bash
pnpm arch:test
pnpm arch:check:registry
pnpm arch:check:changed
pnpm arch:check
pnpm verify:private-tools
pnpm verify:all
```

`verify:all`은 최종 종합 gate이고, 나머지 명령은 실패 원인을 architecture package, authored
registry/policy, change scope, private integration 계약으로 나누어 빠르게 확인하기 위한 것이다.
