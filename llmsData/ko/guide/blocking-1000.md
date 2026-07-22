---
document_id: ko_guide_blocking
category: guide
source_path: ko/guide/pipeline/blocking.md
character_limit: 1000
last_update: '2025-08-30T10:45:47.263Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
차단 작업

차단 작업 차단 및 비차단 핸들러 구성으로 파이프라인 실행 플로우를 제어합니다. 차단 vs 비차단 차단 핸들러 (기본값) 차단 핸들러는 다음 핸들러로 진행하기 전에 완료를 기다립니다: 비차단 핸들러 비차단 핸들러는 파이프라인을 중지하지 않고 백그라운드에서 실행됩니다: 차단 구성 핸들러 레벨 차단 핸들러별로 차단 동작을 구성합니다: 레지스트리 레벨 기본값 전체 레지스트리에 대한 기본 차단 동작을 설정합니다: 실행 플로우 예제 예제 1: 혼합 차단/비차단 예제 2: 성능 중요 파이프라인 고급 차단 패턴 조건부 차단 구성을 사용한 동적 차단 성능 고려사항 차단을 사용해야 하는 경우 ✅ 차단 사용: - 후속 핸들러에 영향을 주는 중요한 검증 - 완료해야 하는 보안 검사 - 나중 핸들러에 필요한 데이터 변환   - 순서가 중요한 작업 -

Key points:
• 후속 핸들러에 영향을 주는 중요한 검증
• 완료해야 하는 보안 검사
• 나중 핸들러에 필요한 데이터 변환
• 순서가 중요한 작업
• 즉각적인 피드백이 필요한 오류가 발생하기 쉬운 작업
• 분석 및 추적