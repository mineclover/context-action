---
document_id: guide--patterns--setup--basic-action-setup
category: guide
source_path: ko/guide/patterns/setup/basic-action-setup.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.396Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
기본 액션 설정

기본 액션 설정 Context-Action 프레임워크를 위한 공유 액션 컨텍스트 설정 패턴입니다. 임포트 타입 정의 일반적인 액션 패턴 확장된 액션 인터페이스 컨텍스트 생성 패턴 단일 도메인 컨텍스트 다중 도메인 컨텍스트 설정 프로바이더 설정 패턴 단일 프로바이더 설정 다중 프로바이더 설정 조건부 프로바이더 설정 내보내기 패턴 명명된 내보내기 (권장) 배럴 내보내기 컨텍스트 번들 내보내기 모범 사례 타입 조직 1. 도메인 주도 타입: 비즈니스 도메인별로 액션 그룹화 2. 일관된 네이밍: 일관된 동사-명사 패턴 사용 (createUser, updateUser, deleteUser) 3. 페이로드 구조: 복잡한 데이터에는 객체, 간단한 값에는 원시 타입 사용 4. Void 액션: 페이로드

Key points:
• **[액션 기본 사용법](../action/basic-usage.md)** - EventActions 패턴 사용
• **[디스패치 액세스 패턴](../action/dispatch-access.md)** - AppActions 패턴 사용
• **[고급 액션 패턴](../action/advanced-patterns.md)** - 다중 도메인 패턴 사용
• **[MVVM...