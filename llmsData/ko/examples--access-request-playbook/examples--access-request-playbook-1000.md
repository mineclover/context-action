---
document_id: examples--access-request-playbook
category: examples
source_path: ko/examples/access-request-playbook.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.541Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Access Request Playbook 예제

Access Request Playbook 예제 이 문서는 implementation-playbook skill을 Workspace Access Request 도메인에 적용한 예제를 설명합니다. 주문 견적 예제와 같은 레이어 구조를 유지하되, 결과물을 review packet으로 바꿔 approval 성격의 workflow에도 같은 컨벤션이 통한다는 점을 보여줍니다. 무엇을 보여주는가 - draft / validation / review / activity store 분리 - approval 계열 workflow를 위한 명시적 상태 머신 - validation issue와 UI 문구의 분리 - activity event에서 파생되는 실행 로그 - success 후 draft 변경 시 이전 review

Key points:
• `draft / validation / review / activity` store 분리
• approval 계열 workflow를 위한 명시적 상태 머신
• validation issue와 UI 문구의 분리
• activity event에서 파생되는 실행 로그
• success 후 draft 변경 시 이전 review 결과를 무효화하는 흐름
• quote 대신 review packet 생성