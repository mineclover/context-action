---
document_id: ko_guide_flow-control
category: guide
source_path: ko/guide/pipeline/flow-control.md
character_limit: 1000
last_update: '2025-08-30T10:45:50.695Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
파이프라인 플로우 제어

파이프라인 플로우 제어 동적 파이프라인 관리와 조건부 실행 경로를 가능하게 하는 Context-Action 파이프라인 실행을 위한 고급 플로우 제어 메커니즘. 개요 파이프라인 플로우 제어는 핸들러의 정상적인 순차 실행을 변경하는 정교한 메커니즘을 제공합니다. 이러한 기능은 복잡한 비즈니스 로직 패턴, 조건부 처리 및 조기 종료 시나리오를 가능하게 합니다. 🔀 우선순위 점프 런타임 조건에 따라 파이프라인 실행을 특정 우선순위 레벨로 동적으로 리디렉션합니다. 기본 우선순위 점프 우선순위 점프 사용 사례 보안 에스컬레이션 - 표준 인증 → 상승된 보안 검사 - 기본 검증 → 포괄적 검증 - 일반 처리 → 관리자 승인 오류 처리 - 일반 플로우 → 오류 복구 핸들러 - 재시도 로직 → 폴백 메커니즘 - 데이터 검증 → 오류 보

Key points:
• 표준 인증 → 상승된 보안 검사
• 기본 검증 → 포괄적 검증
• 일반 처리 → 관리자 승인
• 일반 플로우 → 오류 복구 핸들러
• 재시도 로직 → 폴백 메커니즘
• 데이터 검증 → 오류 보고