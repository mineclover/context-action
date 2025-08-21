---
document_id: examples--action-only
category: examples
source_path: ko/examples/action-only.md
character_limit: 2000
last_update: '2025-08-21T02:13:42.388Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Action Only 패턴 예제

상태 관리 없이 순수 액션 디스패칭을 위한 Action Only 패턴의 실제 사용 예제입니다. 사용 사례

Action Only 패턴은 다음과 같은 경우에 적합합니다:
- 이벤트 추적 및 분석
- 로깅 시스템
- API 호출 (상태 변경 없이)
- 알림 시스템
- 커맨드 패턴 구현

기본 설정

이벤트 추적 시스템

알림 시스템

API 호출 시스템

컴포넌트에서 사용

앱 설정

결과 수집 사용

주요 특징

1. 상태 없음: 순수 사이드 이펙트만 처리
2. 이벤트 기반: 액션 디스패치를 통한 이벤트 처리
3. 분리된 관심사: 각 액션 컨텍스트가 특정 도메인 담당
4. 비동기 지원: async/await를 통한 비동기 작업 처리
5. 에러 처리: 적절한 에러 처리 및 복구

Action Only 패턴은 상태 관리 없이 비즈니스 로직을 깔끔하게 분리하는 강력한 도구입니다.
