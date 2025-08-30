---
document_id: ko_guide_abort
category: guide
source_path: ko/guide/pipeline/abort.md
character_limit: 1000
last_update: '2025-08-30T10:45:52.081Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
중단 메커니즘

중단 메커니즘 중요한 조건이 충족되지 않거나 오류가 발생할 때 파이프라인 실행을 중지합니다. 기본 중단 controller.abort() 선택적 이유와 함께 파이프라인 실행을 즉시 중지: 컨텍스트와 함께 중단 상세한 중단 정보를 제공: 중단 시나리오 입력 검증 중단 보안 중단 비즈니스 로직 중단 중단 결과 처리 중단된 디스패치 처리 중단과 함께하는 React 오류 경계 중단 vs 오류 던지기 중단 사용 - ✅ 비즈니스 로직 위반 - ✅ 검증 실패 - ✅ 권한 거부 - ✅ 속도 제한 - ✅ 우아한 작업 종료 오류 던지기 사용 - ❌ 예상치 못한 시스템 오류 - ❌ 네트워크 실패 - ❌ 프로그래밍 오류 - ❌ 인프라 문제 조기 중단 패턴 가드 핸들러 검증 체인 실제 예제: 중단 가능한 검색 향상된 중단 가능한 검색 데모에서 포괄적인 중단 구

Key points:
• ✅ 비즈니스 로직 위반
• ✅ 검증 실패
• ✅ 권한 거부
• ✅ 속도 제한
• ✅ 우아한 작업 종료
• ❌ 예상치 못한 시스템 오류