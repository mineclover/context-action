---
document_id: examples--access-request-playbook
category: examples
source_path: ko/examples/access-request-playbook.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.541Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Access Request Playbook 예제

Access Request Playbook 예제 이 문서는 implementation-playbook skill을 Workspace Access Request 도메인에 적용한 예제를 설명합니다. 주문 견적 예제와 같은 레이어 구조를 유지하되, 결과물을 review packet으로 바꿔 approval 성격의 workflow에도 같은 컨벤션이 통한다는 점을 보여줍니다. 무엇을 보여주는가 - draft / validation / review / activity store 분리 - approval 계열 workflow를 위한 명시적 상태 머신 - validation issue와 UI 문구의 분리 - activity event에서 파생되는 실행 로그 - success 후 draft 변경 시 이전 review 결과를 무효화하는 흐름 라우트 핵심 파일 상태 머신 왜 이 예제가 필요한가 canonical order form은 quote 계산 중심입니다. 이 예제는 approval/review 중심 workflow에서도 같은 skill이 통한다는 걸 보여줍니다. - quote 대신 review packet 생성 - 금액 계산 대신 reviewer/checklist/priority 계산 - submission status 대신 review state machine 즉 도메인은 달라도 구조는 그대로 재사용됩니다. 검증 포인트 - justification이 짧으면 submit이 막히는가 - production access인데 admin이 아니면 blocked 되는가 - valid submit이면 review packet이 조립되는가 - success 이후 scope를 바꾸면 idle 상태로 돌아가는가 - reset 시 baseline으로 복원되는가 같이 보면 좋은 문서 - Implementation Playbook 표준 컨벤션 - 명시적 상태 머신 - Playbook 시나리오 라이브러리

Key points:
• `draft / validation / review / activity` store 분리
• approval 계열 workflow를 위한 명시적 상태 머신
• validation issue와 UI 문구의 분리
• activity event에서 파생되는 실행 로그
• success 후 draft 변경 시 이전 review 결과를 무효화하는 흐름
• quote 대신 review packet 생성
• 금액 계산 대신 reviewer/checklist/priority 계산
• submission status 대신 review state machine
• justification이 짧으면 submit이 막히는가
• production access인데 admin이 아니면 blocked 되는가
• valid submit이면 review packet이 조립되는가
• success 이후 scope를 바꾸면 idle 상태로 돌아가는가
• reset 시 baseline으로 복원되는가
• [Implementation Playbook 표준 컨벤션](/ko/context-layered/implementation-convention)
• [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine)
• [Playbook 시나리오 라이브러리](/ko/examples/implementation-playbook-scenarios)