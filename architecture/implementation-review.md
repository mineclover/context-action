# Samdocs 심볼 관리 구현 리뷰와 문서 구조

이 문서는 현재 `@context-action/architecture-governance` PoC를 Samdocs의 심볼 관리 관점에서
검토하고, 각 설명을 어느 문서에서 관리할지 정리한 내부 review 기록이다. 구현의 source of truth는
`packages/architecture-governance/src/`와 `architecture/registry.json`이며, 이 문서는 구현을 복제하는
API reference가 아니라 심볼 catalog의 현재 범위·검증 결과·남은 한계를 기록한다.

## 1. 검토 대상과 현재 상태

| 기능 | 구현 위치 | 현재 판단 | 검증 근거 |
| --- | --- | --- | --- |
| 심볼 정의·사용 파일 수집 | `src/sem.ts`, `src/verifier.ts` | 부분 완료 | SEM entities로 정의 위치를 확인하고 명시적 anchor에 대한 `impact.dependents[].file`을 `usageFiles`로 수집 |
| 명시적 심볼 registry | `architecture/registry.json` | 부분 완료 | `implementationAnchors`로 심볼을 선언하지만 안정적인 Samdocs ID/role schema는 없음 |
| 역할 주석 수집 | 현재 미구현 | 미완료 | source comment/JSDoc를 수집하거나 role을 검증하는 단계가 없음 |
| 중복 구현 방지 | `src/verifier.ts` | 부분 완료 | SEM 내부 duplicate/ambiguous entity는 거부하지만 capability 간 동일 역할·심볼 중복은 차단하지 않음 |
| Package dependency/impact boundary | `src/input.ts`, `src/verifier.ts`, `architecture/rules/` | 보조 기능 | 심볼 catalog 자체가 아니라 optional architecture policy extension |
| Change scope와 report | `src/cli/`, `src/report-contract.ts`, `src/reporters.ts` | 보조 기능 | 심볼 변경 위치와 review 범위를 출력하는 infrastructure |
| Git history symbol delta | `src/history.ts`, `src/sem.ts` | PoC 완료 | first-parent commit별 `sem diff`를 `{filePath, symbol, changeType}`로 직렬화하고 commit worktree에서 전체 snapshot을 materialize |
| Complete snapshot/diff | `src/history.ts`, `src/cli/` | PoC 완료 | `symbol-snapshot@1.1`, `symbol-history-report@1.3`, `symbol-snapshot-diff@1.0` 계약과 CLI 제공 |
| Historical project provenance | `src/history.ts`, `@sem-foundation/repository` | 완료 | revision에 없는 project를 `skipped/missing-at-revision`으로 보존하고 `fileExtensions` 필터를 history/snapshot에 전달 |
| Shared SEM foundation contracts | `packages/sem-foundation`, `src/history.ts` | 완료 | entity identity, path normalization, advisory envelope, `AnalysisProject`를 정책 중립 shared package로 추출 |
| Shared Git history/worktree runtime | `packages/sem-foundation-repository`, `src/history.ts` | PoC 완료 | revision, first-parent commit range, detached worktree lifecycle, historical project callback을 공통화 |
| 입력·filesystem·subprocess 경계 | `src/paths.ts`, `src/diagnostics.ts`, `src/sem.ts`, `src/history.ts` | 완료 | catalog 수집을 안전하게 실행하기 위한 runtime boundary |

Samdocs의 핵심은 “모든 내부 호출을 분석하는 graph 도구”가 아니라, 작성자가 명시한 심볼을 한 번
수집하고 정의 위치와 역할 설명을 연결하는 catalog다. 함수 내부 호출 횟수, 호출 순서, runtime data
flow는 LSP 수준의 별도 분석 대상이며 현재 범위에 넣지 않는다. 현재 package의 package policy와
impact boundary rule은 보조 extension이고, 명시적 anchor의 usage file 수집은 catalog의 기본 결과로
분리해 설명해야 한다.

## 2. 현재 구현에서 확인되는 강점

### 2.1 심볼 정의를 한 번에 수집할 수 있다

SEM entities 결과는 project별로 한 번 수집하며, top-level symbol의 canonical ID와 파일·line 범위를
얻는다. 따라서 Samdocs의 기본 질문인 “이 역할의 정의는 어디에 있는가?”에는 답할 수 있다.

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
| P0 | 역할 주석을 수집하지 않음 | “이 심볼이 왜 존재하는가”를 catalog가 보존하지 못함 | `@samdocs`/`@role` 주석 포맷과 collector를 다음 단계로 정의 |
| P0 | 안정적인 symbol ID와 역할 중복 검사가 없음 | 같은 역할의 새 구현이 기존 심볼과 공존할 수 있음 | registry에 stable ID를 도입하고 전체 catalog uniqueness gate 추가 |
| P1 | SEM 0.21.0에 provider 의미가 고정됨 | provider 업그레이드가 entity/impact semantics를 바꿀 수 있음 | version gate, parser 회귀 테스트, decision 기록 후에만 upgrade |
| P1 | 내부 호출 분석을 제공하지 않음 | 함수 호출 횟수·순서·runtime flow는 알 수 없음 | LSP/언어 분석의 별도 provider로 남기고 Samdocs core에는 포함하지 않음 |
| P1 | 심볼 registry는 authored declaration임 | 선언하지 않은 개념은 catalog에 자동 등장하지 않음 | 명시적 annotation, 정의 위치 수집, duplicate ID gate를 운영 규칙으로 고정 |
| P2 | shared packages는 publish-ready지만 아직 registry에 배포하지 않음 | 외부 저장소가 실제로 고정할 semver/API 계약은 아직 없음 | ESM/CJS pack smoke test와 sem-doc wire/runtime fixture까지 보장 |
| P2 | package/impact policy가 core 목적과 섞일 위험이 있음 | architecture graph 도구로 오해될 수 있음 | policy를 보조 extension으로 문서·API에서 분리 |

이 한계들은 현재 결함으로 숨기지 않는다. 특히 SEM entity가 있다고 해서 내부 호출 관계나 역할
의미가 자동으로 생기는 것은 아니다. Samdocs의 역할 설명은 authored comment이고, SEM은 그 주석이
붙은 심볼의 정의 위치를 찾아주는 구조 provider로 한정한다.

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
| `docs/en|ko/context-layered/architecture/architecture-governance.md` | 일반 사용자·reviewer | Samdocs 목적, 심볼 catalog workflow, report 의미, 호출 분석 제외 범위 | 내부 보안 budget의 모든 상수 |
| `architecture/README.md` | 저장소 contributor | source map, 명령, policy 파일, CI 연결, 내부 문서 링크 | 각 함수의 방어 구현 목록 |
| `architecture/governance-guide.md` | symbol author | capability ID, `SymbolRef` anchor, role comment, 정의 위치, 예외, checklist | LSP 호출 그래프 |
| `architecture/rules/README.md` | policy author | package/impact rule DSL과 glob 문법 | capability lifecycle 전체 |
| `architecture/implementation-review.md` | maintainer·reviewer | 심볼 관리 구현 review, 한계, 운영 판단, roadmap | 사용자 API 사용 예제의 반복 |
| `architecture/real-use-review.md` | 설계 의사결정 reviewer | SEM 선택 이유, 실제 수치, 의도적으로 남긴 경계 | 현재 명령 사용법의 복제 |
| `packages/architecture-governance/README.md` | package consumer/maintainer | CLI/API, report/schema, artifact·runtime contract | 공개 Context-Layered 개념 설명 |

공개 문서는 다음 순서로 읽게 한다.

1. Samdocs overview에서 심볼 catalog와 호출 분석 제외 범위를 이해한다.
2. capability ID, `SymbolRef` anchor와 role comment 규칙을 읽고 registry/source comment 변경을 준비한다.
3. policy rule 문법과 명령을 확인한다.
4. changed/staged/range report를 review workflow에 연결한다.
5. 구현 세부나 운영 판단이 필요할 때 내부 review와 package README로 내려간다.

## 5. 다음 변경 시 review 기준

- SEM 버전을 올리면 `real-use-review.md`, provider parser 테스트, symbol location contract 영향 여부를 함께 갱신한다.
- 새 symbol은 stable ID와 역할 주석을 먼저 만들고, SEM entity가 정의 위치를 확인할 때 catalog에
  포함한다.
- 기존 stable ID와 동일한 역할·정의가 생기면 새 구현을 추가하지 말고 기존 symbol을 재사용하거나
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
