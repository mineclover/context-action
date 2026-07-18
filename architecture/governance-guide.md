# Architecture Governance Symbol Guide

이 문서는 Architecture Governance 심볼을 정의 위치, 역할 설명, 테스트와 공개 문서와 함께 유지하기 위한 운영 규칙이다.
`registry.json`은 현재 상태의 기계 판독 source이고, 이 문서는 사람이 stable symbol을 생성·승격·폐기할
때 따르는 lifecycle을 정의한다. 내부 함수 호출 횟수나 호출 순서를 기록하는 규칙은 포함하지 않는다.

이 가이드는 **Context-Action convention을 이 repository에서 실험적으로 운영하는 작성 규칙**이다.
Architecture Governance는 이 authored declaration을 evidence로 검증할 뿐, convention을 범용
architecture 표준으로 자동 추론하지 않는다. 여기서 문서 관리는 문서를 편집하거나 생성한다는 뜻이
아니라 capability의 의도·역할·구현·테스트·공개 설명 사이의 traceability를 유지한다는 뜻이다.

작업 전 문서 컨텍스트와 TSDoc binding은 별도 패키지인 `@context-action/sem-doc`의 책임이다. 이
문서는 `architecture/registry.json`의 authored capability와 Architecture Governance 검증 evidence만
다룬다. 두 패키지를 하나의 “Samdocs” 기능으로 문서화하거나 서로의 report 계약을 재사용하지 않는다.

## 관리 단위

symbol entry는 사용자가 식별할 수 있는 class, function, handler, store, context 또는 독립적인
설계 책임의 대표 top-level entity를 표현한다. 모든 파일이나 내부 함수마다 entry를 만들지 않는다.
다음 중 하나가 참이면 새 symbol을 만든다.

- 별도의 역할 설명, owner 또는 public contract가 필요하다.
- 동일 역할의 구현을 재사용해야 하는 기준점이 필요하다.
- 변경 시 함께 검토해야 할 문서와 테스트 집합이 있다.
- package 또는 선택적 SEM boundary rule의 책임 주체가 필요하다.

역할은 registry의 `role` field와 symbol 가까이에 있는 JSDoc/comment에 사람이 읽을 수 있는 문장으로
작성한다. registry `role`은 machine-readable authored declaration이며, 현재 PoC는 source comment를
자동 추출하거나 두 값을 비교하는 collector까지는 제공하지 않는다. 따라서 registry의 anchor와
comment가 분리되지 않도록 같은 변경에서 함께 관리한다. 다음 단계에서 `@role` marker를 표준화하고,
SEM entity 위치와 결합해 catalog를 생성한다.

`CA-...` stable ID는 registry capability의 책임 identity다. SEM 심볼 자체의 identity는
`SymbolRef(projectId, filePath, entityId)`이며, `implementationAnchors`가 capability와 심볼을
연결한다. 이름 변경이나 파일 이동만으로 capability ID나 canonical `entityId`를 임의로 교체하지
않는다. 책임 자체가 분리되거나 합쳐질 때는 decision 문서에 capability ID 관계를 남긴다. 하나의
capability ID를 여러 책임에 재사용하거나, 하나의 `SymbolRef`를 서로 다른 역할로 중복 선언하지
않는다. ContextScope의 `contextId`는 이 두 identity와 별개의 파생 scope ID다.

## 상태 lifecycle

| 상태 | 사용할 때 | 필수 evidence |
| --- | --- | --- |
| `planned` | 역할과 owner는 정했지만 대표 심볼이 아직 없을 때 | spec/role, owner |
| `implemented` | 대표 심볼과 SEM 정의 위치가 존재할 때 | spec/role, owner, implementation anchor |
| `verified` | 심볼 정의, 동작 테스트, 공개 계약이 현재 상태를 증명할 때 | spec/role, owner, anchor, test, public docs |
| `deprecated` | 새 구현으로 대체하거나 제거를 추적할 때 | spec/role, owner; replacement/removal decision 권장 |

상태는 실제 evidence보다 먼저 올리지 않는다. `verified`에서 구현, 테스트 또는 문서를 제거해야 한다면
같은 변경에서 대체 evidence를 연결하거나 상태를 낮춘다. deprecated capability의 기존 ID는 history와
change scope 추적을 위해 제거 시점까지 유지한다.

## Evidence 작성 규칙

- `spec`은 capability의 의도와 외부 계약을 설명하는 단일 기준 문서다.
- `owners`는 접근 제어 목록이 아니라 변경 검토 책임 경로다. 가장 좁고 안정적인 package 또는 file을
  선택한다.
- `implementationAnchors`는 SEM의 `path::type::name` top-level identity를 사용한다. line number나
  generated bundle처럼 자주 바뀌는 위치는 사용하지 않는다.
- 검증 report의 `symbolUsages`는 각 명시적 anchor에 대한 SEM `dependents`의 파일 경로를 중복 제거해
  제공한다. 이는 파일 단위 구조적 사용처 목록이며 정확한 identifier reference나 runtime call graph가 아니다.
- `testEvidence`는 capability의 대표 성공·실패 동작을 실행하는 테스트 파일을 가리킨다. 단순히 같은
  package에 있다는 이유만으로 연결하지 않는다.
- `publicDocs`는 사용자가 현재 동작을 이해하는 문서다. 내부 decision만으로 대체하지 않는다.
- `decisions`는 trade-off, migration, 예외의 이유와 종료 조건을 기록한다.

모든 경로는 repository-relative 실제 file이어야 한다. generated 문서는 원본이 아니라 배포 계약
자체를 검증해야 할 때만 evidence로 연결한다.

## Policy 선택

`packageBoundaries`는 `package.json`의 선언된 dependency를 검사한다. package 간 설치·배포 계약은
이 규칙으로 관리한다. `impactBoundaries`는 SEM top-level entity가 실제로 참조하는 dependency 방향을
검사한다. source layer 간 결합 금지는 이 규칙으로 관리한다.

하나의 의도를 두 규칙으로 중복 표현하지 않는다. 선언과 실제 참조를 모두 보장해야 하는 경우에는
서로 다른 ID로 작성하고 capability가 두 rule을 명시적으로 참조한다. verified capability의 impact
rule은 특별한 점진 도입 사유가 없다면 `missingEvidenceSeverity: "error"`를 사용한다.

## 예외와 변경

검증 오류를 통과시키기 위한 inline waiver나 경로별 ignore는 두지 않는다. 예외가 필요하면 다음을
같은 변경에 포함한다.

1. decision 문서에 이유, 영향 범위, owner, 종료 조건을 기록한다.
2. policy severity 또는 범위를 최소한으로 조정한다.
3. capability의 `decisions`에 문서를 연결한다.
4. 임시 예외가 끝나는 조건을 테스트 또는 후속 capability로 추적한다.

`arch:check:changed`, staged 또는 PR range report의 affected 목록은 검토 범위이지 validation 생략
목록이 아니다. 영향이 없다고 표시돼도 전체 `arch:check` gate는 항상 실행한다.

## 변경 workflow

1. spec 또는 decision을 먼저 갱신하고 capability ID와 owner를 정한다.
2. registry status와 evidence 경로를 현재 구현 수준에 맞춘다.
3. boundary가 필요하면 증거 원천에 맞는 policy set에 rule을 추가한다.
4. `pnpm arch:check:registry`로 JSON, 경로, package policy를 빠르게 확인한다.
5. 작업 중에는 `pnpm arch:check:staged` 또는 `pnpm arch:check:changed`로 문서·테스트 검토 범위를 본다.
6. 완료 전 `pnpm arch:test`와 `pnpm arch:check`를 실행한다.
7. PR에서는 base/head report의 affected capabilities, docs, tests와 finding을 함께 검토한다.

revision snapshot, snapshot diff, history의 명령과 report contract는 [Architecture Governance Usage](../docs/ko/context-layered/architecture/architecture-governance-usage.md)에서 한 번만 관리한다.
이 문서는 해당 결과를 authored evidence와 review lifecycle에 연결하는 규칙만 소유한다.

monorepo에서 설정·문서 파일이 코드와 같은 project root에 섞여 있으면 registry의
`analysisProjects[].fileExtensions`로 수집 확장자를 명시한다. 확장자는 1~32개의 dot-prefixed
값이어야 하며 각 값은 최대 64자다. 중복·잘못된 값은 입력 오류로 거부된다.

완료 조건은 명령 성공만이 아니다. registry status가 실제 구현 단계와 일치하고, report가 지정한
문서·테스트를 검토했으며, 예외가 decision으로 추적될 때 변경이 완료된다.

## 리뷰 checklist

- capability가 파일 구조가 아니라 안정적인 설계 책임을 나타내는가?
- owner, project, spec과 anchor가 같은 책임 경계에 있는가?
- verified evidence가 실제 동작과 공개 계약을 각각 증명하는가?
- package rule과 impact rule의 방향이 의도한 dependency 방향과 같은가?
- registry 또는 policy 변경으로 모든 capability가 영향 대상으로 승격되는 이유를 검토했는가?
- changed report를 전체 validation gate의 대체로 사용하지 않았는가?
- 예외의 이유와 제거 조건이 decision에 남아 있는가?
