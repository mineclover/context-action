---
document_id: examples--basic-setup
category: examples
source_path: ko/examples/basic-setup.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.389Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
기본 설정

이 예제는 Action Only와 Store Only 패턴을 모두 사용한 Context-Action 프레임워크의 기본 설정을 보여줍니다. 설치

먼저 필요한 패키지를 설치하세요:

프로젝트 구조

단계 1: 액션 타입 정의

액션을 위한 타입 정의를 생성하세요:

단계 2: 액션 컨텍스트 생성

비즈니스 로직을 위한 Action Only 패턴을 설정하세요:

단계 3: 스토어 패턴 생성

상태 관리를 위한 Store Only 패턴을 설정하세요:

단계 4: 메인 앱 컴포넌트

Provider들을 조합하여 메인 앱을 생성하세요:

단계 5: 사용자 프로필 컴포넌트

액션과 스토어를 모두 사용하는 컴포넌트:

단계 6: 이벤트 로거 컴포넌트

이벤트 추적을 위한 Action Only 패턴 사용:

주요 포인트

1. 패턴 분리: Action Only는 비즈니스 로직, Store Only는 상태 관리
2. 타입 안전성: TypeScript로 완전한 타입 안전성 확보
3. 도메인별 리네이밍: 명확한 컨텍스트 분리를 위한 훅 리네이밍
4. 패턴 조합: 복잡한 애플리케이션을 위한 패턴 조합
5. 최적화: useCallback을 사용한 핸들러 최적화

이 기본 설정을 바탕으로 더 복잡한 애플리케이션을 구축할 수 있습니다.
