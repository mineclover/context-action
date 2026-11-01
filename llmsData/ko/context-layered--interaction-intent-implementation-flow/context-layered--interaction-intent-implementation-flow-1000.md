---
document_id: context-layered--interaction-intent-implementation-flow
category: context-layered
source_path: ko/context-layered/interaction-intent-implementation-flow.md
character_limit: 1000
last_update: '2026-11-01T08:36:08.905Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
상호작용 의도 계약에서 Context-Action 구현까지의 흐름

상호작용 의도 계약에서 Context-Action 구현까지의 흐름 이 문서는 상호작용 의도 계약(IIC)을 Context-Action implementation-playbook과 연결합니다. 디자인 단축, 상태 소유권, 구현 레이어, 검증 증거를 하나의 흐름으로 추적할 수 있게 만드는 것이 목적입니다. 전체 흐름 affordance를 제거하거나, trigger를 바꾸거나, 사용자의 추론에 의존하는 상호작용은 버튼이나 컴포넌트부터 만들지 않습니다. 먼저 IIC로 디자인 단축을 명시한 뒤 구현 레이어에 배치합니다. 단계별 책임 | 단계 | Context-Action 위치 | IIC 질문 | 필수 산출물 | | --- | --- | --- | --- |

Key points:
• **의도:** 별도 실행 단계 없이 fallback과 native 상태를 비교한다.
• **Trigger:** 폼 값 입력 또는 거부 checkbox 변경.
• **Source of truth:** 실험 결과 카드와 원시 JSON report.
• **대체 신호:** control 설명과 즉시 결과 갱신이 제거한 실행 버튼을...