---
document_id: examples--incident-escalation-playbook
category: examples
source_path: ko/examples/incident-escalation-playbook.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.534Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Incident Escalation Playbook 예제

Incident Escalation Playbook 예제 이 문서는 implementation-playbook skill을 Incident Escalation 도메인에 적용한 예제를 설명합니다. approval 계열인 access request 예제와 달리, 이 예제는 severity와 영향 범위에 따라 escalation packet을 조립하는 운영 workflow를 다룹니다. 무엇을 보여주는가 - draft / validation / escalation / activity store 분리 - severity 기반 규칙을 가진 명시적 상태 머신 - validation issue와 UI 문구의 분리 - domain event에서 파생되는 activity log - success 이후 sev

Key points:
• `draft / validation / escalation / activity` store 분리
• severity 기반 규칙을 가진 명시적 상태 머신
• validation issue와 UI 문구의 분리
• domain event에서 파생되는 activity log
• success 이후 severity 변경 시 이전 escalation 결과 무효화
• quote 대신...