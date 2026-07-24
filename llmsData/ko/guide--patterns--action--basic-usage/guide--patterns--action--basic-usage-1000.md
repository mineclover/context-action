---
document_id: guide--patterns--action--basic-usage
category: guide
source_path: ko/guide/patterns/action/basic-usage.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.400Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 기본 사용법

액션 기본 사용법 타입 안전 디스패칭과 핸들러 등록을 갖춘 기본 액션 온리 패턴입니다. Import 기능 - ✅ 타입 안전 액션 디스패칭 - ✅ 액션 핸들러 등록 - ✅ 중단 지원 - ✅ 결과 처리 - ✅ 경량 (스토어 오버헤드 없음) 필수 조건 필수 설정: 이 패턴을 사용하기 전에 다음 설정을 완료하세요: 1. 타입 정의 - 표준 패턴을 사용해 액션 인터페이스 정의 2. 컨텍스트 생성 - 적절한 훅 이름 변경으로 타입화된 액션 컨텍스트 생성 3. 프로바이더 구성 - 앱 구조에서 액션 프로바이더 설정 자세한 설정 지침은 기본 액션 설정을 참조하세요. 필수 액션 타입 이 문서는 설정 가이드의 EventActions 명세를 사용합니다: 필수 컨텍스트 설정 이 문서는 Event 액션 컨텍스트를 생성했다고

Key points:
• ✅ 타입 안전 액션 디스패칭
• ✅ 액션 핸들러 등록
• ✅ 중단 지원
• ✅ 결과 처리
• ✅ 경량 (스토어 오버헤드 없음)
• `useEventAction()` - 기본 액션 디스패처 (useActionDispatch에서 이름 변경)