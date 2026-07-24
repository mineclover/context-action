---
document_id: examples--implementation-playbook-scenarios
category: examples
source_path: ko/examples/implementation-playbook-scenarios.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.543Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook 시나리오 라이브러리

Implementation Playbook 시나리오 라이브러리 이 문서는 canonical order form에서 뽑아낸 규칙을 다른 도메인에 어떻게 적용할지 보여주는 시나리오 예제 모음입니다. 목적은 “주문 폼 예제 하나”에 머무르지 않고, 같은 컨벤션과 스킬로 다른 문제를 설계할 수 있다는 점을 보여주는 것입니다. 공통 전제 모든 시나리오는 다음 규칙을 공유합니다. - Context, business, handlers, actions, hooks, views 분리 - validation과 결과 계산을 순수 함수로 유지 - submission 또는 review 흐름은 명시적 상태 머신으로 정의 - activity log는 도메인 이벤트에서 파생 - integration test로 invalid, valid, reset 흐름 고정 표준은 Implementation Playbook 표준 컨벤션을 따릅니다. 시나리오 1: Workspace Access Request 문제 새 팀원이 특정 워크스페이스에 접근 요청을 보내고, 시스템이 검증과 리뷰 패키지 생성을 처리해야 합니다. 이 시나리오는 현재 interactive example로 승격되어 있습니다. - route: /patterns/implementation-playbook/access-request - 문서: Access Request Playbook 예제 상태 경계 - draft - requester name - email - access scope - justification - production access 여부 - validation - 필수값과 justification 길이 검증 - review - idle → validating → blocked → packaging → ready - activity - 접근 요청 갱신, 검증 실패, 리뷰 패키지 준비 추천 business 모듈 - accessDraft.ts - accessValidation.ts - accessReviewPacket.ts - accessStateMachine.ts - accessActivity.ts 테스트 포인트 - justification이 짧으면 submit이 막히는가 - production access가 켜지면 추가 review note가 붙는가 - success 이후 scope를 바꾸면 idle로 되돌아가는가 시나리오 2: Incident Escalation 문제 운영자가 장애를 등록하고, 심각도와 영향 범위에 따라 escalation package를 생성해야 합니다. 이 시나리오는 현재 interactive example로 승격되어 있습니다. - route: /patterns/implementation-playbook/incident-escalation - 문서: Incident Escalation Playbook 예제 상태 경계 - draft - incident title - severity - affected users - rollback readiness - communication channel - validation - 제목, severity, affected users 검증 - escalation - idle → validating → blocked → assembling → ready - activity - 장애 등록, validation 결과, escalation package 생성 추천 business 모듈 - incidentDraft.ts - incidentValidation.ts - incidentEscalationPacket.ts - incidentStateMachine.ts - incidentActivity.ts 테스트 포인트 - severity가 높을수록 escalation target이 바뀌는가 - rollback 준비 여부가 final packet에 반영되는가 - reset 후 다시 baseline으로 돌아오는가 시나리오 3: Renewal Risk Review 문제 갱신을 앞둔 고객의 리스크를 검토하고, 담당자가 follow-up package를 생성해야 합니다. 이 시나리오는 현재 interactive example로 승격되어 있습니다. - route: /patterns/implementation-playbook/renewal-risk-review - 문서: Renewal Risk Review Playbook 예제 상태 경계 - draft - account name - renewal window - product usage - risk notes - executive sponsor 존재 여부 - validation - 필수 필드와 usage score 범위 검증 - review - idle → validating → blocked → scoring → ready - activity - 입력 변경, scoring 시작, review package 준비 추천 business 모듈 - renewalDraft.ts - renewalValidation.ts - renewalRiskScore.ts - renewalStateMachine.ts - renewalActivity.ts 테스트 포인트 - 누락된 필드가 있으면 blocked로 전이되는가 - usage score와 sponsor 여부가 recommendation에 반영되는가 - success 이후 입력이 바뀌면 review 결과를 무효화하는가 언제 새 시나리오 예제를 추가하는가 - canonical order form이 너무 도메인 특화로 느껴질 때 - 팀이 주로 다루는 workflow가 review, escalation, approval에 더 가까울 때 - 같은 구조가 다른

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
• justification이 짧으면 submit이 막히는가
• production access가 켜지면 추가 review note가 붙는가
• success 이후 scope를 바꾸면 idle로 되돌아가는가
• route: `/patterns/implementation-playbook/incident-escalation`
• 문서: [Incident Escalation Playbook 예제](/ko/examples/incident-escalation-playbook)
• `draft`
• `validation`
• `escalation`
• `activity`
• `incidentDraft.ts`
• `incidentValidation.ts`
• `incidentEscalationPacket.ts`
• `incidentStateMachine.ts`
• `incidentActivity.ts`
• severity가 높을수록 escalation target이 바뀌는가
• rollback 준비 여부가 final packet에 반영되는가
• reset 후 다시 baseline으로 돌아오는가
• route: `/patterns/implementation-playbook/renewal-risk-review`
• 문서: [Renewal Risk Review Playbook 예제](/ko/examples/renewal-risk-review-playbook)
• `draft`
• `validation`
• `review`
• `activity`
• `renewalDraft.ts`
• `renewalValidation.ts`
• `renewalRiskScore.ts`
• `renewalStateMachine.ts`
• `renewalActivity.ts`
• 누락된 필드가 있으면 blocked로 전이되는가
• usage score와 sponsor 여부가 recommendation에 반영되는가