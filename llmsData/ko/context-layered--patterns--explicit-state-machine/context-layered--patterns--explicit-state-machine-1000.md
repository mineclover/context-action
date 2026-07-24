---
document_id: context-layered--patterns--explicit-state-machine
category: context-layered
source_path: ko/context-layered/patterns/explicit-state-machine.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.445Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
명시적 상태 머신

명시적 상태 머신 명시적 상태 머신은 비동기 흐름을 상태 + 이벤트 + 전이로 고정하는 패턴입니다. Context-Layered Architecture에서는 특히 handler 레이어가 비즈니스 규칙과 side effect를 함께 조율할 때 이 패턴의 효과가 큽니다. if 문과 임시 플래그를 늘리는 대신, 현재 상태에서 어떤 이벤트를 받을 수 있는지 먼저 정의합니다. 그러면 복잡한 흐름도 수평적으로 확장하기 쉬워지고, 잘못된 상태 조합을 줄일 수 있습니다. 언제 쓰는가 - 검증, 제출, 저장, 동기화처럼 단계가 나뉜 비동기 흐름 - 성공/실패/재시도/리셋이 모두 존재하는 워크플로우 - activity log, analytics, UI 피드백이 같은 전이를 기준

Key points:
• 검증, 제출, 저장, 동기화처럼 단계가 나뉜 비동기 흐름
• 성공/실패/재시도/리셋이 모두 존재하는 워크플로우
• activity log, analytics, UI 피드백이 같은 전이를 기준으로 움직여야 하는 화면
• handler가 커지기 시작해서 상태 전이를 코드로 설명하기 어려워진 시점
• `business/`
• `handlers/`