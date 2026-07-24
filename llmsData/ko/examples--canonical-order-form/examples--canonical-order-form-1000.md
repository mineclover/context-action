---
document_id: examples--canonical-order-form
category: examples
source_path: ko/examples/canonical-order-form.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.538Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Canonical Order Form 예제

Canonical Order Form 예제 이 예제는 저장소에서 권장하는 구현 중심 walkthrough입니다. 규모는 작지만, Context-Layered Architecture가 왜 안정성을 높이는지 보여주기에 충분하도록 구성되어 있습니다. 아키텍처를 이해하기 위해 예제를 하나만 읽는다면 이 예제를 먼저 보는 것을 권장합니다. 이 예제가 보여주는 것 - draft, validation, submission, activity 상태를 위한 Store Context - 사용자 의도와 흐름 조율을 위한 Action Context - 검증 실패 후 포커스 이동을 위한 Ref Context - 결정론적 validation과 quote 계산을 위한 순수 business 함수 - 숨겨진 비즈니스 로직 없이 렌더링만 담

Key points:
• draft, validation, submission, activity 상태를 위한 `Store Context`
• 사용자 의도와 흐름 조율을 위한 `Action Context`
• 검증 실패 후 포커스 이동을 위한 `Ref Context`
• 결정론적 validation과 quote 계산을 위한 순수 `business` 함수
• 숨겨진 비즈니스 로직 없이 렌더링만 담당하는 reactive...