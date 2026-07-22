---
document_id: ko_concept_performance-optimization
category: concept
source_path: ko/concept/performance-optimization.md
character_limit: 1000
last_update: '2025-08-30T10:56:59.891Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
성능 최적화 가이드

성능 최적화 가이드 필터 캐싱 시스템 ActionRegister는 디스패치 작업 중 핸들러 선택 성능을 최적화하기 위한 지능형 필터 캐싱 시스템을 구현합니다. 개요 목적: 핸들러 선택 결과를 캐시하여 중복된 필터링 작업을 방지 범위: ActionRegister 인스턴스별 (동일한 Provider 하의 모든 컴포넌트에서 공유) 안전성: 자동 캐시 무효화로 데이터 일관성 보장 캐시 아키텍처 캐시 소유권 구조 캐시 생명주기 1. 생성: ActionRegister 인스턴스가 생성될 때 2. 채우기: 각 고유 필터 조합에 대한 첫 번째 필터 작업 중 3. 무효화: 핸들러가 등록/제거될 때 자동 4. 정리: Provider가 언마운트되거나 ActionRegister.destroy()가 호출될 때 캐시되는 내용

Key points:
• **핸들러 ID**: `{ handlerIds: ['auth', 'validation'] }` (정확한 문자열 매칭)
• **제외 ID**: `{ excludeHandlerIds: ['analytics'] }` (정확한 문자열 매칭)
• **우선순위 범위**: `{ priority: { min: 5, max: 10 } }`
• **결합된 조건**: `{ handlerIds: ['user'], priority: {...