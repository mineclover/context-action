---
document_id: context-layered--convention-index
category: context-layered
source_path: ko/context-layered/convention-index.md
character_limit: 5000
last_update: '2026-07-30T23:07:58.941Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
개발 컨벤션 인덱스

개발 컨벤션 인덱스 이 문서는 Context-Action 저장소에서 implementation-playbook 계열 개발 컨벤션을 굳히기 위해 가장 먼저 봐야 할 중심 인덱스입니다. 문서가 많아졌기 때문에, 어떤 문서가 “원칙”, 어떤 문서가 “예제”, 어떤 문서가 “검증”인지 한 번에 묶어보는 용도로 씁니다. 가장 짧은 추천 순서 1. 패키지 경계 및 코드베이스 관리 2. Implementation Convention 3. 스펙·이슈·문서 관리 4. Usecase 및 Recipe Profile 5. Tool Calling Web Studio 컨벤션 6. 패널 레이아웃 Preference 컨벤션 7. Canonical Order Form 예제 8. Playbook 시나리오 라이브러리 9. 명시적 상태 머신 10. 안정성 테스트 사이클 11. Mutative Core 히스토리 및 원본 참조 12. 다음 작업과 문서 소유권 위의 짧은 순서를 따라가면 - 폴더 구조 - 상태 전이 원칙 - 도메인별 확장 방식 - 테스트 기준 을 빠르게 공유할 수 있습니다. 문서 역할별 분류 1. 표준을 고정하는 문서 - 컨벤션 정합성 계획 - 현재 상태 분류, Provider 순서, 마이그레이션 완료 조건 - 패키지 경계 및 코드베이스 관리 - package ownership, dependency 방향, package lifecycle, cleanup 규칙 - Mutative Core 히스토리 및 원본 참조 - Mutative 소스 계보, 반영한 upstream 수정, 라이선스, 동기화 규칙 - Implementation Convention - implementation-playbook 계열 개발의 표준 규칙 - 스펙·이슈·문서 관리 - 이슈 lifecycle, 계약 추적, decision record, handoff 증거 - Tool Calling Web Studio 컨벤션 - tool registry, policy, workspace mutation, observable subscription, live preview 경계 - 패널 레이아웃 Preference 컨벤션 - presentation-only 패널 상태, 범위 제한 resize, persistence, Store Context 승격 기준 - Tool-calling Editor Architecture - catalog, approval, trace, persistence, preview reference implementation 상세 - 폴더 구조 - contexts / business / handlers / actions / hooks / views 책임 구분 - 핸들러 레지스트리 - handler 등록과 분리 기준 2. 상태 전이와 로직 분리를 설명하는 문서 - 명시적 상태 머신 - 복잡한 async 흐름을 상태 + 이벤트 + 전이로 고정하는 방법 - Context-Layered 개요 - Usecase 및 Recipe Profile - 전체 구조를 상위 개념에서 설명 - 마이그레이션 가이드 - 기존 코드에서 이 구조로 옮기는 기준 3. 실제 구현을 보여주는 문서 - Canonical Order Form 예제 - base canonical example - Access Request Playbook 예제 - approval/review workflow 예제 - Incident Escalation Playbook 예제 - incident/escalation workflow 예제 - Renewal Risk Review Playbook 예제 - renewal/customer-success workflow 예제 - Playbook 시나리오 라이브러리 - 아직 full demo가 아니어도 같은 skill로 확장할 시나리오 모음 4. 검증 기준을 고정하는 문서 - 안정성 테스트 사이클 - 설계 계약, 구현 패턴, 시나리오, 스트레스 테스트를 어떻게 나누는지 - 다음 작업과 문서 소유권 - 후속 작업과 기준 문서를 한 곳에서 관리하는 backlog 일반 저장소 컨벤션 게이트는 다음 명령입니다. Context-Action 통합 경계까지 포함한 전체 검사는 다음 명령으로 실행합니다. 이 명령은 example use-case recipe, MCP/function-calling catalog, standalone Web Studio action 경계까지 추가로 검사합니다. standalone build·filesystem·provider·preview·browser release 검사는 pnpm web-coding:verify로 수행합니다. 팀 컨벤션으로 굳힐 때 읽는 순서 아키텍처 합의용 1. Implementation Convention 2. 스펙·이슈·문서 관리 3. 명시적 상태 머신 4. 안정성 테스트 사이클 구현자 온보딩용 1. Canonical Order Form 예제 2. Access Request Playbook 예제 3. Incident Escalation Playbook 예제 4. Renewal Risk Review Playbook 예제 새 시나리오 설계용 1. Playbook 시나리오 라이브러리 2. Implementation Convention 3. repo-local skill: skills/context-action-implementation-playbook/SKILL.md Tool-calling web studio 설계용 1. Tool Calling Web Studio 컨벤션 2. 스펙·이슈·문서 관리 3. 패널 레이아웃 Preference 컨벤션 4. Tool-calling Editor Architecture 5. Standalone Web Studio

Key points:
• 폴더 구조
• 상태 전이 원칙
• 도메인별 확장 방식
• 테스트 기준
• [컨벤션 정합성 계획](/ko/context-layered/convention-alignment-plan)
• [패키지 경계 및 코드베이스 관리](/ko/context-layered/package-boundary-convention)
• [Mutative Core 히스토리 및 원본 참조](/ko/context-layered/mutative-core-history)
• [Implementation Convention](/ko/context-layered/implementation-convention)
• [스펙·이슈·문서 관리](/ko/context-layered/change-management-convention)
• [Tool Calling Web Studio 컨벤션](/ko/context-layered/usecase-tool-calling-web-studio)
• [패널 레이아웃 Preference 컨벤션](/ko/context-layered/usecase-panel-layout)
• [Tool-calling Editor Architecture](/ko/concept/tool-calling-editor-architecture)
• [폴더 구조](/ko/context-layered/architecture/folder-structure)
• [핸들러 레지스트리](/ko/context-layered/architecture/handler-registry)
• [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine)
• [Context-Layered 개요](/ko/context-layered/context-layered-guide)
• [Usecase 및 Recipe Profile](/ko/context-layered/usecase-recipe-profile)
• [마이그레이션 가이드](/ko/context-layered/migration-guide)
• [Canonical Order Form 예제](/ko/examples/canonical-order-form)
• [Access Request Playbook 예제](/ko/examples/access-request-playbook)
• [Incident Escalation Playbook 예제](/ko/examples/incident-escalation-playbook)
• [Renewal Risk Review Playbook 예제](/ko/examples/renewal-risk-review-playbook)
• [Playbook 시나리오 라이브러리](/ko/examples/implementation-playbook-scenarios)
• [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)
• [다음 작업과 문서 소유권](/ko/context-layered/next-work)
• `/patterns/implementation-playbook`
• `/patterns/implementation-playbook/access-request`
• `/patterns/implementation-playbook/incident-escalation`
• `/patterns/implementation-playbook/renewal-risk-review`
• `/integrations/live-web-coding`
• standalone `/web-coding/` release
• [패키지 경계 및 코드베이스 관리](/ko/context-layered/package-boundary-convention)
•...