---
document_id: ko_guide_blocking
category: guide
source_path: ko/guide/pipeline/blocking.md
character_limit: 500
last_update: '2025-08-30T10:45:47.262Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
차단 작업

차단 작업 차단 및 비차단 핸들러 구성으로 파이프라인 실행 플로우를 제어합니다. 차단 vs 비차단 차단 핸들러 (기본값) 차단 핸들러는 다음 핸들러로 진행하기 전에 완료를 기다립니다: 비차단 핸들러 비차단 핸들러는 파이프라인을 중지하지 않고 백그라운드에서 실행됩니다:

Key points:
• 후속 핸들러에 영향을...