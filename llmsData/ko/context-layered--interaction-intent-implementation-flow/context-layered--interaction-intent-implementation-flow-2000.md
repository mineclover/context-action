---
document_id: context-layered--interaction-intent-implementation-flow
category: context-layered
source_path: ko/context-layered/interaction-intent-implementation-flow.md
character_limit: 2000
last_update: '2026-11-01T11:30:50.025Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
상호작용 의도 계약에서 Context-Action 구현까지의 흐름

상호작용 의도 계약에서 Context-Action 구현까지의 흐름 이 문서는 상호작용 의도 계약(IIC)을 Context-Action implementation-playbook과 연결합니다. 디자인 단축, 상태 소유권, 구현 레이어, 검증 증거를 하나의 흐름으로 추적할 수 있게 만드는 것이 목적입니다. 전체 흐름 affordance를 제거하거나, trigger를 바꾸거나, 사용자의 추론에 의존하는 상호작용은 버튼이나 컴포넌트부터 만들지 않습니다. 먼저 IIC로 디자인 단축을 명시한 뒤 구현 레이어에 배치합니다. 기존 컨벤션과의 위계 IIC는 Context-Action의 6개 레이어에 추가되는 런타임 레이어가 아닙니다. 기존 implementation-playbook보다 앞에서 왜 이 동작을 선택했는가를 고정하는 상위 설계 계약입니다. | 위치 | 답하는 질문 | 소유 문서 | | --- | --- | --- | | IIC | 무엇을 줄였고, 사용자는 무엇을 예측해야 하는가? | feature spec, decision record, PR | | Context-Action 6 layers | 그 의도와 상태를 어디에 어떻게 구현하는가? | contexts / business / handlers / actions / hooks / views | | Evidence | 구현 후에도 같은 의도가 유지되는가? | tests, docs, runnable scenario, gates | 따라서 IIC는 기존 컨벤션을 덮어쓰지 않고, 기존 컨벤션이 시작되기 전에 연결되는 설계 source of truth입니다. 작은 예제도 IIC를 먼저 기록하고, 필요한 만큼만 6개 레이어에 매핑합니다. IIC의 기본 lifecycle은 draft → accepted → implemented → superseded/deprecated입니다. 구현이 계약과 달라지면 코드를 먼저 승인하지 않고 IIC와 증거를 먼저 갱신합니다. 단계별

Key points:
• **의도:** 별도 실행 단계 없이 fallback과 native 상태를 비교한다.
• **Trigger:** 폼 값 입력 또는 거부 checkbox 변경.
• **Source of truth:** 실험 결과 카드와 원시 JSON report.
• **대체 신호:** control 설명과 즉시 결과 갱신이 제거한 실행 버튼을 대신한다.
• **복구:** reset이 거부 write 기본 시나리오를 복원한다.
• **Context-Action 매핑:** probe가 시나리오 상태를 소유하고 `run()`이 오케스트레이션 경계가 되며, View control은 의미 있는 input이고 component test가 native write 허용 재실행을 증명한다.
• [ ] 구현 전에 IIC ID를 연결했다.
• [ ] 제거·축약한 affordance와 대체 신호를 기록했다.
• [ ] 상태 소유권과 의미 있는 intent를 Context-Action 레이어에 배치했다.
• [ ] 기본·변경 동작을 순수 규칙 또는 component test로 고정했다.
• [ ] View가 암묵적 trigger와 reset/cancel 복구를 설명한다.
•...