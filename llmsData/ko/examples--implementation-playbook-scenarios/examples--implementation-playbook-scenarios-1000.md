---
document_id: examples--implementation-playbook-scenarios
category: examples
source_path: ko/examples/implementation-playbook-scenarios.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.542Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook 시나리오 라이브러리

Implementation Playbook 시나리오 라이브러리 이 문서는 canonical order form에서 뽑아낸 규칙을 다른 도메인에 어떻게 적용할지 보여주는 시나리오 예제 모음입니다. 목적은 “주문 폼 예제 하나”에 머무르지 않고, 같은 컨벤션과 스킬로 다른 문제를 설계할 수 있다는 점을 보여주는 것입니다. 공통 전제 모든 시나리오는 다음 규칙을 공유합니다. - Context, business, handlers, actions, hooks, views 분리 - validation과 결과 계산을 순수 함수로 유지 - submission 또는 review 흐름은 명시적 상태 머신으로 정의 - activity log는 도메인 이벤트에서 파생 - integration test

Key points:
• Context, business, handlers, actions, hooks, views 분리
• validation과 결과 계산을 순수 함수로 유지
• submission 또는 review 흐름은 명시적 상태 머신으로 정의
• activity log는 도메인 이벤트에서 파생
• integration test로 invalid, valid, reset 흐름...