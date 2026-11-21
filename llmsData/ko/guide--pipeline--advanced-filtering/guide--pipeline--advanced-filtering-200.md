---
document_id: guide--pipeline--advanced-filtering
category: guide
source_path: ko/guide/pipeline/advanced-filtering.md
character_limit: 200
last_update: '2026-11-21T07:28:37.985Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
고급 필터링 시스템

고급 필터링 시스템 ActionRegister에서 디스패치별로 실행할 핸들러를 정밀하게 제어하는 고급 필터링 가이드입니다. 🎯 개요 DispatchOptions['filter']를 사용하면 매 디스패치마다 우선순위 범위, 핸들러 ID 포함/제외, 또는 Readonly

Key points:
• 가능한 경우 커스텀 문자열 파싱...