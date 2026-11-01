---
document_id: context-layered--interaction-intent-implementation-flow
category: context-layered
source_path: ko/context-layered/interaction-intent-implementation-flow.md
character_limit: 2000
last_update: '2026-11-01T08:36:08.906Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
상호작용 의도 계약에서 Context-Action 구현까지의 흐름

상호작용 의도 계약에서 Context-Action 구현까지의 흐름 이 문서는 상호작용 의도 계약(IIC)을 Context-Action implementation-playbook과 연결합니다. 디자인 단축, 상태 소유권, 구현 레이어, 검증 증거를 하나의 흐름으로 추적할 수 있게 만드는 것이 목적입니다. 전체 흐름 affordance를 제거하거나, trigger를 바꾸거나, 사용자의 추론에 의존하는 상호작용은 버튼이나 컴포넌트부터 만들지 않습니다. 먼저 IIC로 디자인 단축을 명시한 뒤 구현 레이어에 배치합니다. 단계별 책임 | 단계 | Context-Action 위치 | IIC 질문 | 필수 산출물 | | --- | --- | --- | --- | | 의도 | feature spec, decision record, PR | 사용자에게 무엇이 편해지고 무엇을 제거했는가? | IIC ID, trigger, 대체 신호, 발견 가능성 위험, 복구 | | 계약 | contexts/ | 이 기능의 상태와 의미 있는 의도는 무엇인가? | typed Action/Store/Ref 계약과 baseline state | | 규칙 | business/ | 렌더링과 무관하게 이 단축은 무엇을 의미하는가? | 순수 validation·result·state transition 함수 | | 오케스트레이션 | handlers/ | 어떤 effect, persistence, logging, reset이 이어지는가? | 명시적 의존성을 가진 Registry handler | | 명령 | actions/ | View가 보내는 의미 있는 intent는 무엇인가? | 안정적인 dispatch helper, DOM·비즈니스 규칙 없음 | | 화면 모델 | hooks/ | 어떤 상태가 보이고 기준 상태는 무엇인가? | subscription과 파생 label/model | | 표면 | views/ | 사용자가 어떻게 trigger하고 관찰

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