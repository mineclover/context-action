---
document_id: context-layered--patterns--explicit-state-machine
category: context-layered
source_path: ko/context-layered/patterns/explicit-state-machine.md
character_limit: 200
last_update: '2026-11-20T08:50:10.750Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
명시적 상태 머신

명시적 상태 머신 명시적 상태 머신은 비동기 흐름을 상태 + 이벤트 + 전이로 고정하는 패턴입니다. Context-Layered Architecture에서는 특히 handler 레이어가 비즈니스 규칙과 side effect를 함께 조율할 때 이 패턴의 효과가 큽니다.

Key points:
• 검증, 제출, 저장, 동기화처럼...