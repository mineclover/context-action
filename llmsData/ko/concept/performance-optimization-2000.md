---
document_id: ko_concept_performance-optimization
category: concept
source_path: ko/concept/performance-optimization.md
character_limit: 2000
last_update: '2025-08-30T10:56:59.891Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
성능 최적화 가이드

성능 최적화 가이드 필터 캐싱 시스템 ActionRegister는 디스패치 작업 중 핸들러 선택 성능을 최적화하기 위한 지능형 필터 캐싱 시스템을 구현합니다. 개요 목적: 핸들러 선택 결과를 캐시하여 중복된 필터링 작업을 방지 범위: ActionRegister 인스턴스별 (동일한 Provider 하의 모든 컴포넌트에서 공유) 안전성: 자동 캐시 무효화로 데이터 일관성 보장 캐시 아키텍처 캐시 소유권 구조 캐시 생명주기 1. 생성: ActionRegister 인스턴스가 생성될 때 2. 채우기: 각 고유 필터 조합에 대한 첫 번째 필터 작업 중 3. 무효화: 핸들러가 등록/제거될 때 자동 4. 정리: Provider가 언마운트되거나 ActionRegister.destroy()가 호출될 때 캐시되는 내용 ✅ 캐시 가능한 작업 - 핸들러 ID: { handlerIds: ['auth', 'validation'] } (정확한 문자열 매칭) - 제외 ID: { excludeHandlerIds: ['analytics'] } (정확한 문자열 매칭) - 우선순위 범위: { priority: { min: 5, max: 10 } } - 결합된 조건: { handlerIds: ['user'], priority: { min: 3 } } ❌ 캐시 불가능한 작업 - 커스텀 필터 함수: { custom: (config) => config.tags?.includes('prod') } - 이유: 호출 간 함수 참조 동등성을 보장할 수 없음 캐시 콘텐츠 캐시 키 생성 결정론적 키 알고리즘 키 속성 - 결정론적: 동일한 필터 옵션은 항상 동일한 키를 생성 - 순서 독립적: handlerIds는 일관성을 위해 정렬됨 - 충돌 저항성: 서로 다른 필터 조합은 서로 다른 키를 생성 동적 캐시 크기 조정 크기 계산 예시 - 5개 핸들러 → 캐시 크기: 50 - 10개 핸들러 → 캐시 크기: 100   - 50개 핸들러 → 캐시 크기: 500 - 핸들러 없음 → 캐시 크기: 100 (최소 폴백) L

Key points:
• **핸들러 ID**: `{ handlerIds: ['auth', 'validation'] }` (정확한 문자열 매칭)
• **제외 ID**: `{ excludeHandlerIds: ['analytics'] }` (정확한 문자열 매칭)
• **우선순위 범위**: `{ priority: { min: 5, max: 10 } }`
• **결합된 조건**: `{ handlerIds: ['user'], priority: { min: 3 } }`
• **커스텀 필터 함수**: `{ custom: (config) => config.tags?.includes('prod') }`
• **이유**: 호출 간 함수 참조 동등성을 보장할 수 없음
• **결정론적**: 동일한 필터 옵션은 항상 동일한 키를 생성
• **순서 독립적**: `handlerIds`는 일관성을 위해 정렬됨
• **충돌 저항성**: 서로 다른 필터 조합은 서로 다른 키를 생성
• **5개 핸들러** → 캐시 크기: 50
• **10개 핸들러** → 캐시 크기: 100
• **50개 핸들러** → 캐시 크기: 500
• **핸들러 없음** → 캐시 크기: 100 (최소 폴백)
• **안전 우선**: 성능보다 일관성을 보장
• **핸들러 의존성**: 변경사항이 여러...