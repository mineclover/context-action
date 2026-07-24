---
document_id: guide--patterns--setup--multi-context-setup
category: guide
source_path: ko/guide/patterns/setup/multi-context-setup.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.398Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
다중 컨텍스트 설정

다중 컨텍스트 설정 대규모 애플리케이션을 위한 다중 컨텍스트를 결합한 복잡한 아키텍처 설정 패턴입니다. 임포트 MVVM 아키텍처 설정 완전한 타입 정의 MVVM 컨텍스트 생성 모든 프로바이더와 훅 추출 도메인 컨텍스트 아키텍처 설정 비즈니스 도메인 설정 검증 도메인 설정 디자인 시스템 컨텍스트 설정 프로바이더 구성 패턴 레이어 기반 구성 (MVVM) 도메인 기반 구성 조건부 다중 컨텍스트 설정 중첩 도메인 구성 컨텍스트 간 통신 설정 이벤트 버스 패턴 컨텍스트 브리지 설정 다중 컨텍스트를 위한 내보내기 패턴 도메인 번들 내보내기 프로바이더 구성 내보내기 다중 컨텍스트 설정을 위한 모범 사례 아키텍처 계획 1. 도메인 경계: 비즈니스 도메인 경계를 명확히 정의 2. 레이어 분리: 모델,

Key points:
• **[MVVM 아키텍처](../architecture/mvvm.md)** - 완전한 MVVM 설정 사용
• **[도메인 컨텍스트 아키텍처](../architecture/domain-context.md)** - 도메인 분리 사용
• **[컨텍스트 분할 패턴](../architecture/context-splitting.md)** - 프로바이더 구성 사용
• **[성능...