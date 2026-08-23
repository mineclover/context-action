# 개발 컨벤션 인덱스

이 문서는 Context-Action 저장소에서 implementation-playbook 계열 개발 컨벤션을 굳히기 위해 가장 먼저 봐야 할 중심 인덱스입니다. 문서가 많아졌기 때문에, 어떤 문서가 “원칙”, 어떤 문서가 “예제”, 어떤 문서가 “검증”인지 한 번에 묶어보는 용도로 씁니다.

## 작업별 시작점

어떤 산출물을 소유하는지 먼저 정하고 그에 맞는 경로를 선택합니다. 필요한 모든
문서를 처음부터 읽을 필요는 없습니다.

| 바꾸려는 대상 | 먼저 읽을 문서 | 이어서 사용할 것 |
| --- | --- | --- |
| package 책임, dependency, export | [패키지 경계 및 코드베이스 관리](/ko/context-layered/package-boundary-convention) | `pnpm package-boundary:check` |
| 공개 가이드, API 참조, README 경로, 생성 문서 | [문서 및 개발 관리 컨벤션](/ko/concept/documentation-development-conventions) | `pnpm docs:check` |
| 지속되는 아키텍처 경계 또는 compatibility 예외 | [아키텍처 결정 기록](/ko/context-layered/decisions/) | 연결된 package/guide와 집중 증거 |
| 기능, 버그, workflow 계약 | [스펙·이슈·문서 관리](/ko/context-layered/change-management-convention) | 변경 분류에 맞는 gate |
| canonical example/usecase | [Implementation Convention](/ko/context-layered/implementation-convention) | `pnpm convention:check`와 example check |

릴리스 후보에는 `pnpm verify:all`을 사용합니다. 이 명령은 저장소 검사를
조합할 뿐 집중 증거를 대체하지는 않습니다.

## 문서 역할별 분류

### 1. 표준을 고정하는 문서

- [컨벤션 정합성 계획](/ko/context-layered/convention-alignment-plan)
  - 현재 상태 분류, Provider 순서, 마이그레이션 완료 조건
- [패키지 경계 및 코드베이스 관리](/ko/context-layered/package-boundary-convention)
  - package ownership, dependency 방향, package lifecycle, cleanup 규칙
- [Mutative Core 히스토리 및 원본 참조](/ko/context-layered/mutative-core-history)
  - Mutative 소스 계보, 반영한 upstream 수정, 라이선스, 동기화 규칙
- [Implementation Convention](/ko/context-layered/implementation-convention)
  - implementation-playbook 계열 개발의 표준 규칙
- [스펙·이슈·문서 관리](/ko/context-layered/change-management-convention)
  - 이슈 lifecycle, 계약 추적, decision record, handoff 증거
- [아키텍처 결정 기록](/ko/context-layered/decisions/)
  - package, protocol, persistence, compatibility 결정을 위한 지속 위치와 형식
- [Tool Calling Web Studio 컨벤션](/ko/context-layered/usecase-tool-calling-web-studio)
  - tool registry, policy, workspace mutation, observable subscription, live preview 경계
- [패널 레이아웃 Preference 컨벤션](/ko/context-layered/usecase-panel-layout)
  - presentation-only 패널 상태, 범위 제한 resize, persistence, Store Context 승격 기준
- [Tool-calling Editor Architecture](/ko/concept/tool-calling-editor-architecture)
  - catalog, approval, trace, persistence, preview reference implementation 상세
- [폴더 구조](/ko/context-layered/architecture/folder-structure)
  - `contexts / business / handlers / actions / hooks / views` 책임 구분
- [핸들러 레지스트리](/ko/context-layered/architecture/handler-registry)
  - handler 등록과 분리 기준

### 2. 상태 전이와 로직 분리를 설명하는 문서

- [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine)
  - 복잡한 async 흐름을 `상태 + 이벤트 + 전이`로 고정하는 방법
- [Context-Layered 개요](/ko/context-layered/context-layered-guide)
- [Usecase 및 Recipe Profile](/ko/context-layered/usecase-recipe-profile)
  - 전체 구조를 상위 개념에서 설명
- [Integration Profile](/ko/context-layered/integration-profiles)
  - 외부 도메인 lifecycle·소유권·호환성·증빙을 versioned catalog로 공급
- [마이그레이션 가이드](/ko/context-layered/migration-guide)
  - 기존 코드에서 이 구조로 옮기는 기준

### 3. 실제 구현을 보여주는 문서

- [Canonical Order Form 예제](/ko/examples/canonical-order-form)
  - base canonical example
- [Access Request Playbook 예제](/ko/examples/access-request-playbook)
  - approval/review workflow 예제
- [Incident Escalation Playbook 예제](/ko/examples/incident-escalation-playbook)
  - incident/escalation workflow 예제
- [Renewal Risk Review Playbook 예제](/ko/examples/renewal-risk-review-playbook)
  - renewal/customer-success workflow 예제
- [Playbook 시나리오 라이브러리](/ko/examples/implementation-playbook-scenarios)
  - 아직 full demo가 아니어도 같은 skill로 확장할 시나리오 모음

### 4. 검증 기준을 고정하는 문서

- [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)
  - 설계 계약, 구현 패턴, 시나리오, 스트레스 테스트를 어떻게 나누는지
- [다음 작업과 문서 소유권](/ko/context-layered/next-work)
  - 후속 작업과 기준 문서를 한 곳에서 관리하는 backlog

일반 저장소 컨벤션 게이트는 다음 명령입니다.

```bash
pnpm convention:check
```

Context-Action 통합 경계까지 포함한 전체 검사는 다음 명령으로 실행합니다.

```bash
node scripts/verify-context-action-conventions.mjs
```

이 명령은 example use-case recipe, MCP/function-calling catalog, integration-profile catalog, standalone
Web Studio action 경계까지 추가로 검사합니다. standalone
build·filesystem·provider·preview·browser release 검사는
`pnpm web-coding:verify`로 수행합니다.

## 팀 컨벤션으로 굳힐 때 읽는 순서

### 아키텍처 합의용

1. [Implementation Convention](/ko/context-layered/implementation-convention)
2. [스펙·이슈·문서 관리](/ko/context-layered/change-management-convention)
3. [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine)
4. [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)

### 구현자 온보딩용

1. [Canonical Order Form 예제](/ko/examples/canonical-order-form)
2. [Access Request Playbook 예제](/ko/examples/access-request-playbook)
3. [Incident Escalation Playbook 예제](/ko/examples/incident-escalation-playbook)
4. [Renewal Risk Review Playbook 예제](/ko/examples/renewal-risk-review-playbook)

### 새 시나리오 설계용

1. [Playbook 시나리오 라이브러리](/ko/examples/implementation-playbook-scenarios)
2. [Implementation Convention](/ko/context-layered/implementation-convention)
3. repo-local skill: `skills/context-action-implementation-playbook/SKILL.md`

### Tool-calling web studio 설계용

1. [Tool Calling Web Studio 컨벤션](/ko/context-layered/usecase-tool-calling-web-studio)
2. [스펙·이슈·문서 관리](/ko/context-layered/change-management-convention)
3. [패널 레이아웃 Preference 컨벤션](/ko/context-layered/usecase-panel-layout)
4. [Tool-calling Editor Architecture](/ko/concept/tool-calling-editor-architecture)
5. [Standalone Web Studio README](../../../demos/bolt-style-editor/README.md)

## 코드와 같이 볼 때

문서만 보지 말고 예제 앱도 같이 보는 것이 가장 좋습니다.

- `/patterns/implementation-playbook`
- `/patterns/implementation-playbook/access-request`
- `/patterns/implementation-playbook/incident-escalation`
- `/patterns/implementation-playbook/renewal-risk-review`
- standalone `/web-coding/` release

## 한 줄 요약

먼저 source of truth를 고르고, 그 경계에 맞는 최소 변경을 한 뒤, 필요한
파생물만 갱신하고 해당 경계를 증명하는 gate를 실행합니다.
