---
document_id: examples--renewal-risk-review-playbook
category: examples
source_path: ko/examples/renewal-risk-review-playbook.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.539Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Renewal Risk Review Playbook 예제

Renewal Risk Review Playbook 예제 이 문서는 implementation-playbook skill을 Renewal Risk Review 도메인에 적용한 예제를 설명합니다. 이 예제는 usage score, renewal window, sponsor 여부를 기준으로 renewal review packet을 조립하는 customer-success workflow를 다룹니다. 무엇을 보여주는가 - draft / validation / review / activity store 분리 - scoring 중심의 명시적 상태 머신 - validation issue와 UI 문구의 분리 - domain event에서 파생되는 activity log - success 이후 입력 변경

Key points:
• `draft / validation / review / activity` store 분리
• scoring 중심의 명시적 상태 머신
• validation issue와 UI 문구의 분리
• domain event에서 파생되는 activity log
• success 이후 입력 변경 시 이전 review 결과 무효화
• quote 대신 renewal review packet 생성