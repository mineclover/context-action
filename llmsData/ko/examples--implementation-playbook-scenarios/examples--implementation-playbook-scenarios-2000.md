---
document_id: examples--implementation-playbook-scenarios
category: examples
source_path: ko/examples/implementation-playbook-scenarios.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.543Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook 시나리오 라이브러리

Implementation Playbook 시나리오 라이브러리 이 문서는 canonical order form에서 뽑아낸 규칙을 다른 도메인에 어떻게 적용할지 보여주는 시나리오 예제 모음입니다. 목적은 “주문 폼 예제 하나”에 머무르지 않고, 같은 컨벤션과 스킬로 다른 문제를 설계할 수 있다는 점을 보여주는 것입니다. 공통 전제 모든 시나리오는 다음 규칙을 공유합니다. - Context, business, handlers, actions, hooks, views 분리 - validation과 결과 계산을 순수 함수로 유지 - submission 또는 review 흐름은 명시적 상태 머신으로 정의 - activity log는 도메인 이벤트에서 파생 - integration test로 invalid, valid, reset 흐름 고정 표준은 Implementation Playbook 표준 컨벤션을 따릅니다. 시나리오 1: Workspace Access Request 문제 새 팀원이 특정 워크스페이스에 접근 요청을 보내고, 시스템이 검증과 리뷰 패키지 생성을 처리해야 합니다. 이 시나리오는 현재 interactive example로 승격되어 있습니다. - route: /patterns/implementation-playbook/access-request - 문서: Access Request Playbook 예제 상태 경계 - draft - requester name - email - access scope - justification - production access 여부 - validation - 필수값과 justification 길이 검증 - review - idle → validating → blocked → packaging → ready - activity - 접근 요청 갱신, 검증 실패, 리뷰 패키지 준비 추천 business 모듈 - accessDraft.ts - accessValidation.ts - accessRevie

Key points:
• Context, business, handlers, actions, hooks, views 분리
• validation과 결과 계산을 순수 함수로 유지
• submission 또는 review 흐름은 명시적 상태 머신으로 정의
• activity log는 도메인 이벤트에서 파생
• integration test로 invalid, valid, reset 흐름 고정
• route: `/patterns/implementation-playbook/access-request`
• 문서: [Access Request Playbook 예제](/ko/examples/access-request-playbook)
• `draft`
• `validation`
• `review`
• `activity`
• `accessDraft.ts`
• `accessValidation.ts`
• `accessReviewPacket.ts`
• `accessStateMachine.ts`
• `accessActivity.ts`