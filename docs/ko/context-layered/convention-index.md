# 개발 컨벤션 인덱스

이 문서는 Context-Action 저장소에서 implementation-playbook 계열 개발 컨벤션을 굳히기 위해 가장 먼저 봐야 할 중심 인덱스입니다. 문서가 많아졌기 때문에, 어떤 문서가 “원칙”, 어떤 문서가 “예제”, 어떤 문서가 “검증”인지 한 번에 묶어보는 용도로 씁니다.

## 가장 짧은 추천 순서

1. [Implementation Convention](/ko/context-layered/implementation-convention)
2. [Usecase 및 Recipe Profile](/ko/context-layered/usecase-recipe-profile)
3. [Tool Calling Web Studio 컨벤션](/ko/context-layered/usecase-tool-calling-web-studio)
4. [Canonical Order Form 예제](/ko/examples/canonical-order-form)
5. [Playbook 시나리오 라이브러리](/ko/examples/implementation-playbook-scenarios)
6. [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine)
7. [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)

위의 짧은 순서를 따라가면
- 폴더 구조
- 상태 전이 원칙
- 도메인별 확장 방식
- 테스트 기준
을 빠르게 공유할 수 있습니다.

## 문서 역할별 분류

### 1. 표준을 고정하는 문서

- [컨벤션 정합성 계획](/ko/context-layered/convention-alignment-plan)
  - 현재 상태 분류, Provider 순서, 마이그레이션 완료 조건
- [Implementation Convention](/ko/context-layered/implementation-convention)
  - implementation-playbook 계열 개발의 표준 규칙
- [Tool Calling Web Studio 컨벤션](/ko/context-layered/usecase-tool-calling-web-studio)
  - tool registry, policy, workspace mutation, observable subscription, live preview 경계
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
- [아키텍처 거버넌스와 증거](/ko/context-layered/architecture/architecture-governance)
  - capability를 구현, 테스트, policy, 공개 문서와 연결하는 방법

## 팀 컨벤션으로 굳힐 때 읽는 순서

### 아키텍처 합의용

1. [Implementation Convention](/ko/context-layered/implementation-convention)
2. [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine)
3. [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)

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
2. [Tool-calling Editor Architecture](/ko/concept/tool-calling-editor-architecture)
3. [Standalone Web Studio README](../../../demos/bolt-style-editor/README.md)

## 코드와 같이 볼 때

문서만 보지 말고 예제 앱도 같이 보는 것이 가장 좋습니다.

- `/patterns/implementation-playbook`
- `/patterns/implementation-playbook/access-request`
- `/patterns/implementation-playbook/incident-escalation`
- `/patterns/implementation-playbook/renewal-risk-review`
- `/integrations/live-web-coding`
- standalone `/web-coding/` release

## 한 줄 요약

팀 컨벤션으로 굳힐 때는
`Implementation Convention -> Explicit State Machine -> Canonical Example -> Scenario Demos -> Stability Test Cycle`
순서로 보면 됩니다.
