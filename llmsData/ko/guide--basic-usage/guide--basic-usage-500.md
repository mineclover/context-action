---
document_id: guide--basic-usage
category: guide
source_path: ko/guide/patterns/action/basic-usage.md
character_limit: 500
last_update: '2025-08-26T00:34:27.345Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 기본 사용법

타입 안전 디스패칭과 핸들러 등록을 갖춘 기본 액션 온리 패턴입니다. Import

기능
- ✅ 타입 안전 액션 디스패칭
- ✅ 액션 핸들러 등록
- ✅ 중단 지원
- ✅ 결과 처리
- ✅ 경량 (스토어 오버헤드 없음)

필수 조건

필수 설정: 이 패턴을 사용하기 전에 다음 설정을 완료하세요:

1. 타입 정의 - 표준 패턴을 사용해 액션 인터페이스 정의
2. 컨텍스트 생성 - 적절한 훅 이름 변경으로 타입화된 액션 컨텍스트 생성
3. 프로바이더 구성 - 앱 구조에서 액션 프로바이더 설정

자세한 설정 지침은 기본 액션 설정을 참조하세요.
