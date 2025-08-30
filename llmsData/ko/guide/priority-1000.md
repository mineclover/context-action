---
document_id: ko_guide_priority
category: guide
source_path: ko/guide/pipeline/priority.md
character_limit: 1000
last_update: '2025-08-30T10:45:51.156Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
우선순위 기반 핸들러 실행

우선순위 기반 핸들러 실행 적절한 비즈니스 로직 플로우를 위해 핸들러가 올바른 순서로 실행되도록 하는 우선순위 기반 실행. 기본 우선순위 시스템 우선순위 레벨 핸들러는 내림차순 우선순위 순서로 실행됩니다 (높은 숫자 먼저): 기본 우선순위 우선순위를 지정하지 않으면 핸들러는 기본적으로 우선순위 50을 가집니다: 우선순위 카테고리 높은 우선순위 (90-100): 시스템 중요 - 입력 검증 - 보안 검사 - 속도 제한 - 인증 중간 우선순위 (50-89): 비즈니스 로직 - 데이터 처리 - 비즈니스 규칙 검증 - 외부 API 호출 - 상태 업데이트 낮은 우선순위 (10-49): 로깅 및 분석 - 감사 로깅 - 분석 추적 - 성능 모니터링 - 정리 작업 우선순위 실행 예제 예제 1: 인증 플로우 예제 2: 데이터 처리 파이프라인 우선순

Key points:
• 입력 검증
• 보안 검사
• 속도 제한
• 인증
• 데이터 처리
• 비즈니스 규칙 검증