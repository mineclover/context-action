---
document_id: ko_guide_result-handling
category: guide
source_path: ko/guide/pipeline/result-handling.md
character_limit: 1000
last_update: '2025-08-30T10:45:47.722Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
고급 결과 처리

고급 결과 처리 복잡한 데이터 집계 및 변환 패턴을 가능하게 하는 Context-Action 파이프라인을 위한 정교한 결과 수집, 병합 및 처리 전략. 결과 수집 메서드 controller.setResult() 다른 핸들러가 액세스할 수 있는 중간 결과 저장: controller.getResults() 이전에 실행된 핸들러의 결과에 액세스: controller.mergeResult() 사용자 정의 로직을 사용하여 현재 결과를 이전 결과와 병합: 결과 유형 핸들러 반환값 각 핸들러는 결과의 일부가 되는 값을 반환할 수 있습니다: 중간 결과 반환할 필요가 없는 데이터에 대해서는 controller.setResult() 사용: 결과 수집 패턴 순차적 결과 구축 결과 집계 React 통합 결과 기반 UI 업데이트 진행률 추

Key points:
• **개별 액션 실행**: 결과 수집이 있는 단일 핸들러 실행
• **순차 워크플로우**: 결과 의존성이 있는 다단계 프로세스
• **태그 기반 필터링**: `tags: ['validation', 'business-logic']`을 사용한 핸들러 선택
• **병렬 및 병합 실행**: 결과 집계가 있는 동시 처리
• **복잡한 카트 워크플로우**: 실제 검증 → 계산 → 처리 파이프라인
• **[우선순위...